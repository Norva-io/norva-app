/**
 * Script pour réattribuer les emails orphelins avec le parsing HTML amélioré
 * Usage: npx tsx scripts/reassign-orphaned-emails.ts
 */

import { createClient } from '@supabase/supabase-js'
import { parseForwardedEmail, extractDomain } from '../src/lib/email-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function reassignOrphanedEmails() {
  console.log('🔍 Recherche des emails orphelins...\n')

  // 1. Récupérer tous les clients avec leurs domaines
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name, domain')

  if (clientsError) {
    console.error('❌ Erreur lors de la récupération des clients:', clientsError)
    return
  }

  console.log(`📋 ${clients.length} clients trouvés\n`)

  // Créer une map domain -> client_id
  const clientDomainMap = new Map<string, { id: string; name: string }>()
  for (const client of clients) {
    // Nettoyer le domaine (enlever @ s'il est présent)
    const cleanDomain = client.domain.replace(/^@/, '').toLowerCase()
    clientDomainMap.set(cleanDomain, { id: client.id, name: client.name })
    console.log(`  - ${client.name}: ${cleanDomain}`)
  }

  console.log('\n🔍 Recherche des emails orphelins...\n')

  // 2. Récupérer tous les emails orphelins (client_id = NULL)
  const { data: orphanEmails, error: emailsError } = await supabase
    .from('emails')
    .select('id, subject, from_email, to_emails, body, received_at')
    .is('client_id', null)
    .order('received_at', { ascending: false })

  if (emailsError) {
    console.error('❌ Erreur lors de la récupération des emails:', emailsError)
    return
  }

  console.log(`📧 ${orphanEmails.length} emails orphelins trouvés\n`)

  let reassignedCount = 0
  let forwardDetectedCount = 0

  // 3. Traiter chaque email orphelin
  for (const email of orphanEmails) {
    console.log(`\n📨 Traitement: ${email.subject || '(sans sujet)'}`)
    console.log(`   De: ${email.from_email}`)

    let matchedClientId: string | null = null
    let matchedClientName: string | null = null
    let matchedDomain: string | null = null

    // Essayer de matcher par forward d'abord (si body existe)
    if (email.body) {
      const parsed = parseForwardedEmail(email.body)

      if (parsed.isForwarded) {
        forwardDetectedCount++
        console.log(`   🔄 Forward détecté!`)

        if (parsed.originalFrom) {
          console.log(`   📧 Expéditeur original: ${parsed.originalFrom}`)
          const domain = extractDomain(parsed.originalFrom)
          if (domain) {
            const match = clientDomainMap.get(domain)
            if (match) {
              matchedClientId = match.id
              matchedClientName = match.name
              matchedDomain = domain
              console.log(`   ✅ Trouvé via forward: ${matchedClientName} (${domain})`)
            }
          }
        }

        // Si pas trouvé via originalFrom, essayer tous les emails dans le body
        if (!matchedClientId && parsed.allEmails.length > 0) {
          console.log(`   🔍 Recherche dans ${parsed.allEmails.length} emails du body...`)
          for (const emailAddr of parsed.allEmails) {
            const domain = extractDomain(emailAddr)
            if (domain) {
              const match = clientDomainMap.get(domain)
              if (match) {
                matchedClientId = match.id
                matchedClientName = match.name
                matchedDomain = domain
                console.log(`   ✅ Trouvé via body: ${matchedClientName} (${emailAddr})`)
                break
              }
            }
          }
        }
      }
    }

    // Si toujours pas trouvé, essayer via from/to
    if (!matchedClientId) {
      const allEmails: string[] = []

      if (email.from_email) allEmails.push(email.from_email)
      if (email.to_emails) allEmails.push(...email.to_emails)

      for (const emailAddr of allEmails) {
        const domain = extractDomain(emailAddr)
        if (domain) {
          const match = clientDomainMap.get(domain)
          if (match) {
            matchedClientId = match.id
            matchedClientName = match.name
            matchedDomain = domain
            console.log(`   ✅ Trouvé via headers: ${matchedClientName} (${emailAddr})`)
            break
          }
        }
      }
    }

    // Mettre à jour l'email si un client est trouvé
    if (matchedClientId) {
      const { error: updateError } = await supabase
        .from('emails')
        .update({ client_id: matchedClientId })
        .eq('id', email.id)

      if (updateError) {
        console.error(`   ❌ Erreur lors de la mise à jour:`, updateError)
      } else {
        reassignedCount++
        console.log(`   ✅ Réattribué à: ${matchedClientName}`)
      }
    } else {
      console.log(`   ⚠️  Aucun client trouvé`)
    }
  }

  console.log(`\n\n📊 Résumé:`)
  console.log(`   - Emails orphelins: ${orphanEmails.length}`)
  console.log(`   - Forwards détectés: ${forwardDetectedCount}`)
  console.log(`   - Emails réattribués: ${reassignedCount}`)
  console.log(`   - Toujours orphelins: ${orphanEmails.length - reassignedCount}`)
}

// Exécuter le script
reassignOrphanedEmails()
  .then(() => {
    console.log('\n✅ Script terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  })
