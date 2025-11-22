import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { extractDomain, parseForwardedEmail, findMatchingClients } from '@/lib/email-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/emails/reassign
 * Réattribue les emails orphelins (client_id = null) aux clients existants
 * Ne fait PAS appel à Nylas - travaille uniquement sur les emails déjà en base
 */
export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer l'utilisateur
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Récupérer les clients de l'utilisateur
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, domain')
      .eq('user_id', user.id)

    if (clientsError) {
      throw clientsError
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json(
        { message: 'No clients found', emailsReassigned: 0 },
        { status: 200 }
      )
    }

    // Créer une map des domaines clients
    const clientDomainMap = new Map(clients.map((c) => [c.domain.toLowerCase(), c.id]))

    console.log(`[Reassign] Client domains: ${Array.from(clientDomainMap.keys()).join(', ')}`)

    // Récupérer tous les emails orphelins (client_id = null)
    const { data: orphanEmails, error: orphanError } = await supabase
      .from('emails')
      .select('id, from_email, to_emails, preview, body, subject')
      .is('client_id', null)

    if (orphanError) {
      throw orphanError
    }

    if (!orphanEmails || orphanEmails.length === 0) {
      return NextResponse.json(
        { message: 'No orphan emails to reassign', emailsReassigned: 0 },
        { status: 200 }
      )
    }

    console.log(`[Reassign] Found ${orphanEmails.length} orphan emails`)

    let emailsReassigned = 0

    // Traiter chaque email orphelin
    for (const email of orphanEmails) {
      let clientId: string | undefined

      // Extraire tous les emails de l'email (headers)
      const allEmails: string[] = []

      if (email.from_email) {
        allEmails.push(email.from_email.toLowerCase())
      }

      if (email.to_emails && Array.isArray(email.to_emails)) {
        email.to_emails.forEach((to) => {
          if (to) allEmails.push(to.toLowerCase())
        })
      }

      // Chercher un match par domaine dans les headers
      const headerMatches = findMatchingClients(allEmails, clientDomainMap)
      clientId = headerMatches[0]?.clientId

      // Si pas de match dans les headers ET qu'on a un body, parser pour détecter les forwards
      if (!clientId && email.body) {
        const parsed = parseForwardedEmail(email.body)

        if (parsed.isForwarded) {
          console.log(`[Reassign] Email ${email.id} "${email.subject}" - Forward detected`)
          console.log(`[Reassign]   - Original from: ${parsed.originalFrom || 'not found'}`)
          console.log(`[Reassign]   - All emails in body: ${parsed.allEmails.join(', ')}`)

          // Exclure le from_email pour éviter de matcher le forwarder
          const emailsToMatch = parsed.allEmails.filter(e => e !== email.from_email?.toLowerCase())
          console.log(`[Reassign]   - Emails après exclusion du forwarder: ${emailsToMatch.join(', ')}`)

          // Chercher un match dans les emails filtrés
          const bodyMatches = findMatchingClients(emailsToMatch, clientDomainMap)
          if (bodyMatches.length > 0) {
            clientId = bodyMatches[0].clientId
            console.log(`[Reassign]   - MATCHED via forward body: client ${clientId} via ${bodyMatches[0].matchedEmail}`)
          } else {
            console.log(`[Reassign]   - No client match in forwarded emails`)
          }
        }
      }

      // Si on a trouvé un match, mettre à jour l'email
      if (clientId) {
        const { error: updateError } = await supabase
          .from('emails')
          .update({ client_id: clientId })
          .eq('id', email.id)

        if (!updateError) {
          emailsReassigned++
          console.log(`[Reassign] Email ${email.id} successfully assigned to client ${clientId}`)
        } else {
          console.error(`[Reassign] Failed to update email ${email.id}:`, updateError)
        }
      } else {
        console.log(`[Reassign] Email ${email.id} "${email.subject}" - No match found (headers or body)`)
      }
    }

    console.log(`[Reassign] Successfully reassigned ${emailsReassigned} emails`)

    // Mettre à jour les compteurs pour chaque client
    for (const client of clients) {
      const { count } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)

      // Récupérer l'email le plus récent
      const { data: latestEmail } = await supabase
        .from('emails')
        .select('received_at')
        .eq('client_id', client.id)
        .order('received_at', { ascending: false })
        .limit(1)
        .single()

      const updateData: { total_emails_count: number; last_interaction_at?: string } = {
        total_emails_count: count || 0,
      }

      if (latestEmail) {
        updateData.last_interaction_at = latestEmail.received_at
      }

      await supabase
        .from('clients')
        .update(updateData)
        .eq('id', client.id)
    }

    return NextResponse.json({
      success: true,
      emailsReassigned,
      totalOrphans: orphanEmails.length,
    })
  } catch (error) {
    console.error('Error reassigning emails:', error)
    return NextResponse.json(
      { error: 'Failed to reassign emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
