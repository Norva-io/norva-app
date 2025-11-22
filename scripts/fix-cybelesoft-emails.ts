/**
 * Réaffecter les emails Cybelesoft qui sont mal assignés
 */

import { createClient } from '@supabase/supabase-js'
import { parseForwardedEmail, findMatchingClients } from '../src/lib/email-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixCybelesoftEmails() {
  console.log('🔧 Réaffectation des emails Cybelesoft...\n')

  // 1. Trouver le client Cybelesoft
  const { data: cybelesoft } = await supabase
    .from('clients')
    .select('id, name, domain')
    .eq('domain', 'cybelesoft.com')
    .single()

  if (!cybelesoft) {
    console.error('❌ Client Cybelesoft non trouvé')
    return
  }

  console.log(`✅ Client Cybelesoft trouvé: ${cybelesoft.id}`)

  // 2. Récupérer tous les clients pour la map
  const { data: clients } = await supabase
    .from('clients')
    .select('id, domain')

  const clientDomainMap = new Map(clients?.map(c => [c.domain.toLowerCase(), c.id]) || [])

  // 3. Trouver les emails qui contiennent cybelesoft.com mais ne sont PAS affectés à Cybelesoft
  const { data: misassignedEmails } = await supabase
    .from('emails')
    .select('id, subject, from_email, client_id, body, to_emails')
    .neq('client_id', cybelesoft.id)
    .ilike('body', '%cybelesoft.com%')

  if (!misassignedEmails || misassignedEmails.length === 0) {
    console.log('✅ Aucun email mal assigné trouvé')
    return
  }

  console.log(`\n📧 ${misassignedEmails.length} email(s) mal assigné(s) trouvé(s):\n`)

  let fixed = 0

  for (const email of misassignedEmails) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`📨 Email: "${email.subject}"`)
    console.log(`   ID: ${email.id}`)
    console.log(`   From: ${email.from_email}`)
    console.log(`   Client actuel: ${email.client_id}`)

    if (!email.body) {
      console.log(`   ⚠️  Pas de body, skip`)
      continue
    }

    // Parser le body
    const parsed = parseForwardedEmail(email.body)

    if (parsed.isForwarded) {
      console.log(`   ⚡ Forward détecté`)
      console.log(`   📧 Expéditeur original: ${parsed.originalFrom || 'non trouvé'}`)
      console.log(`   📧 Emails dans body: ${parsed.allEmails.slice(0, 5).join(', ')}...`)

      // Exclure le from_email pour éviter de matcher le forwarder
      const emailsToMatch = parsed.allEmails.filter(e => e !== email.from_email?.toLowerCase())
      console.log(`   📧 Après exclusion forwarder: ${emailsToMatch.slice(0, 5).join(', ')}...`)

      // Chercher un match
      const matches = findMatchingClients(emailsToMatch, clientDomainMap)

      if (matches.length > 0) {
        const matchedClientId = matches[0].clientId
        const matchedEmail = matches[0].matchedEmail

        console.log(`   ✅ Match trouvé: ${matchedClientId} via ${matchedEmail}`)

        if (matchedClientId === cybelesoft.id) {
          console.log(`   🎯 C'est bien Cybelesoft! Réaffectation...`)

          const { error } = await supabase
            .from('emails')
            .update({ client_id: cybelesoft.id })
            .eq('id', email.id)

          if (error) {
            console.error(`   ❌ Erreur lors de la mise à jour:`, error)
          } else {
            console.log(`   ✅ Email réaffecté avec succès!`)
            fixed++
          }
        } else {
          console.log(`   ℹ️  Match trouvé mais c'est un autre client: ${matchedClientId}`)
        }
      } else {
        console.log(`   ❌ Aucun match trouvé`)
      }
    } else {
      console.log(`   ℹ️  Pas un forward`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(`\n📊 RÉSUMÉ:`)
  console.log(`   - Emails mal assignés trouvés: ${misassignedEmails.length}`)
  console.log(`   - Emails réaffectés à Cybelesoft: ${fixed}`)

  // 4. Mettre à jour le compteur du client
  if (fixed > 0) {
    const { count } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', cybelesoft.id)

    await supabase
      .from('clients')
      .update({ total_emails_count: count || 0 })
      .eq('id', cybelesoft.id)

    console.log(`   - Nouveau compteur Cybelesoft: ${count || 0}`)
  }
}

fixCybelesoftEmails()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
