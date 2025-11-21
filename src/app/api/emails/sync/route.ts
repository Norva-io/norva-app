import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { nylas } from '@/lib/nylas'
import { parseForwardedEmail, findMatchingClients } from '@/lib/email-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/emails/sync
 * Synchronise les emails depuis Nylas pour un utilisateur
 * Limite: 3 jours d'historique (MVP)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer l'utilisateur et son grant_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email_grant_id, email')
      .eq('clerk_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.email_grant_id) {
      return NextResponse.json(
        { error: 'Email not connected. Please connect Outlook first.' },
        { status: 400 }
      )
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
        { message: 'No clients found. Add clients first.', emailsSynced: 0 },
        { status: 200 }
      )
    }

    // Calculer la date limite (3 jours en arrière)
    const threeDaysAgo = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60

    // Récupérer les emails depuis Nylas
    console.log(`[Sync] Fetching emails for grant_id: ${user.email_grant_id}`)
    console.log(`[Sync] Filters: limit=100, receivedAfter=${new Date(threeDaysAgo * 1000).toISOString()}`)

    const messages = await nylas.messages.list({
      identifier: user.email_grant_id,
      queryParams: {
        limit: 100,
        receivedAfter: threeDaysAgo,
      },
    })

    console.log(`[Sync] Nylas returned ${messages.data.length} messages`)

    let emailsSynced = 0
    let emailsSkipped = 0
    let emailsNoMatch = 0
    const clientDomainMap = new Map(clients.map((c) => [c.domain.toLowerCase(), c.id]))

    console.log(`[Sync] Client domains to match: ${Array.from(clientDomainMap.keys()).join(', ')}`)

    // Traiter chaque email
    for (const message of messages.data) {
      // Extraire tous les emails impliqués (from, to, cc, bcc)
      const allEmails: string[] = []

      // From
      if (message.from?.[0]?.email) {
        allEmails.push(message.from[0].email.toLowerCase())
      }

      // To
      message.to?.forEach((recipient) => {
        if (recipient.email) allEmails.push(recipient.email.toLowerCase())
      })

      // CC
      message.cc?.forEach((recipient) => {
        if (recipient.email) allEmails.push(recipient.email.toLowerCase())
      })

      // BCC
      message.bcc?.forEach((recipient) => {
        if (recipient.email) allEmails.push(recipient.email.toLowerCase())
      })

      // Chercher un match dans les headers
      const headerMatches = findMatchingClients(allEmails, clientDomainMap)
      let clientId: string | undefined = headerMatches[0]?.clientId
      let fromEmail = message.from?.[0]?.email?.toLowerCase()

      // Si pas de match dans les headers, chercher dans le body (forwards)
      if (!clientId && message.snippet) {
        const parsed = parseForwardedEmail(message.snippet)

        // Log pour debug des forwards
        if (parsed.isForwarded) {
          console.log(`[Sync] Forward detected in email ${message.id} "${message.subject}"`)
          console.log(`[Sync]   - Original from: ${parsed.originalFrom || 'not found'}`)
          console.log(`[Sync]   - All emails found: ${parsed.allEmails.join(', ')}`)
        }

        if (parsed.isForwarded) {
          // Chercher dans tous les emails extraits du body
          const bodyMatches = findMatchingClients(parsed.allEmails, clientDomainMap)
          if (bodyMatches.length > 0) {
            clientId = bodyMatches[0].clientId
            console.log(`[Sync]   - MATCHED via forward: client ${clientId}`)
            // Si on a trouvé l'expéditeur original, l'utiliser
            if (parsed.originalFrom) {
              fromEmail = parsed.originalFrom
            }
          } else {
            console.log(`[Sync]   - No client match for forwarded emails`)
          }
        }
      }

      // Stocker l'email même s'il n'est pas associé à un client (pour review manuel)
      // On skip seulement si fromEmail est invalide
      if (!fromEmail) {
        console.log(`[Sync] Skipping message ${message.id} - no fromEmail`)
        continue
      }

      // Vérifier si l'email existe déjà
      const { data: existing } = await supabase
        .from('emails')
        .select('id')
        .eq('external_id', message.id)
        .single()

      if (existing) {
        console.log(`[Sync] Skipping message ${message.id} - already exists`)
        emailsSkipped++
        continue
      }

      if (!clientId) {
        console.log(`[Sync] Email ${message.subject} from ${fromEmail} - NO CLIENT MATCH`)
        emailsNoMatch++
      } else {
        console.log(`[Sync] Email ${message.subject} from ${fromEmail} - MATCHED client ${clientId}`)
      }

      // Insérer l'email
      const { error: insertError } = await supabase.from('emails').insert({
        client_id: clientId,
        external_id: message.id,
        subject: message.subject || null,
        from_email: fromEmail,
        to_emails: message.to?.map((t) => t.email || '') || [],
        sent_at: new Date((message.date || 0) * 1000).toISOString(),
        received_at: new Date((message.date || 0) * 1000).toISOString(),
        preview: message.snippet || null,
        thread_id: message.threadId || null,
      })

      if (!insertError) {
        emailsSynced++
      } else {
        console.error(`[Sync] Failed to insert email ${message.id}:`, JSON.stringify(insertError, null, 2))
      }
    }

    console.log(`[Sync] Summary: ${emailsSynced} synced, ${emailsSkipped} skipped (duplicates), ${emailsNoMatch} no client match`)

    // Mettre à jour le compteur d'emails et last_interaction_at pour chaque client
    for (const client of clients) {
      const { count } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)

      // Récupérer l'email le plus récent pour mettre à jour last_interaction_at
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
      emailsSynced,
      totalMessages: messages.data.length,
      clients: clients.length,
    })
  } catch (error) {
    console.error('Error syncing emails:', error)
    return NextResponse.json(
      { error: 'Failed to sync emails', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
