/**
 * Script de test pour vérifier la réaffectation des emails Cybelesoft
 *
 * Ce script vérifie:
 * 1. Les emails orphelins (client_id = null)
 * 2. Les emails qui contiennent cybelesoft.com dans le body
 * 3. Simule la réaffectation
 */

import { createClient } from '@supabase/supabase-js'
import { parseForwardedEmail, findMatchingClients } from '../src/lib/email-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function testCybelesoftReassign() {
  console.log('🔍 Recherche des emails orphelins...\n')

  // 1. Récupérer tous les clients
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, domain')

  if (!clients) {
    console.error('❌ Aucun client trouvé')
    return
  }

  console.log('📋 Clients disponibles:')
  clients.forEach(c => {
    console.log(`   - ${c.name} (${c.domain}) [${c.id}]`)
  })
  console.log()

  const clientDomainMap = new Map(clients.map(c => [c.domain.toLowerCase(), c.id]))

  // 2. Récupérer les emails orphelins
  const { data: orphanEmails } = await supabase
    .from('emails')
    .select('id, from_email, to_emails, subject, body, preview')
    .is('client_id', null)

  if (!orphanEmails || orphanEmails.length === 0) {
    console.log('✅ Aucun email orphelin trouvé!')
    return
  }

  console.log(`📧 ${orphanEmails.length} email(s) orphelin(s) trouvé(s)\n`)

  let potentialCybelesoft = 0

  // 3. Analyser chaque email orphelin
  for (const email of orphanEmails) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`📨 Email: ${email.subject}`)
    console.log(`   From: ${email.from_email}`)
    console.log(`   ID: ${email.id}`)

    // Test parsing du body
    if (email.body) {
      const parsed = parseForwardedEmail(email.body)

      if (parsed.isForwarded) {
        console.log(`   ⚡ FORWARD DÉTECTÉ!`)
        console.log(`   📧 Expéditeur original: ${parsed.originalFrom || 'non trouvé'}`)
        console.log(`   📧 Emails trouvés dans le body: ${parsed.allEmails.join(', ')}`)

        // Chercher un match
        const matches = findMatchingClients(parsed.allEmails, clientDomainMap)
        if (matches.length > 0) {
          const client = clients.find(c => c.id === matches[0].clientId)
          console.log(`   ✅ MATCH TROUVÉ: ${client?.name} via ${matches[0].matchedEmail}`)

          if (client?.domain === 'cybelesoft.com') {
            potentialCybelesoft++
            console.log(`   🎯 CYBELESOFT DÉTECTÉ!`)
          }
        } else {
          console.log(`   ❌ Aucun match trouvé`)
        }
      } else {
        console.log(`   ℹ️  Pas un forward`)
      }

      // Vérifier si cybelesoft.com apparaît dans le body
      if (email.body.toLowerCase().includes('cybelesoft.com')) {
        console.log(`   🔍 "cybelesoft.com" trouvé dans le body`)
      }
    } else {
      console.log(`   ⚠️  Pas de body disponible`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log(`\n📊 RÉSUMÉ:`)
  console.log(`   - Emails orphelins: ${orphanEmails.length}`)
  console.log(`   - Emails Cybelesoft détectés: ${potentialCybelesoft}`)
  console.log(`\n💡 Pour réaffecter ces emails, cliquez sur le bouton "Resync" dans la page client`)
}

// Exécuter le script
testCybelesoftReassign()
  .then(() => {
    console.log('\n✅ Script terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
