/**
 * Script pour vérifier l'attribution des emails Cybelesoft
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCybelesoftEmails() {
  console.log('🔍 Vérification des emails Cybelesoft...\n')

  // 1. Trouver le client Cybelesoft
  const { data: cybelesoft, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .ilike('name', '%cybele%')
    .single()

  if (clientError || !cybelesoft) {
    console.error('❌ Client Cybelesoft non trouvé:', clientError)
    return
  }

  console.log(`✅ Client trouvé: ${cybelesoft.name}`)
  console.log(`   ID: ${cybelesoft.id}`)
  console.log(`   Domaine: ${cybelesoft.domain}`)
  console.log(`   Total emails: ${cybelesoft.total_emails_count || 0}\n`)

  // 2. Récupérer tous les emails de Cybelesoft
  const { data: emails, error: emailsError } = await supabase
    .from('emails')
    .select('id, subject, from_email, to_emails, body, received_at')
    .eq('client_id', cybelesoft.id)
    .order('received_at', { ascending: false })

  if (emailsError) {
    console.error('❌ Erreur:', emailsError)
    return
  }

  console.log(`📧 ${emails.length} emails trouvés pour Cybelesoft:\n`)

  for (const email of emails) {
    console.log(`📨 ${email.subject || '(sans sujet)'}`)
    console.log(`   De: ${email.from_email}`)
    console.log(`   À: ${email.to_emails?.join(', ') || 'N/A'}`)
    console.log(`   Body: ${email.body ? `${email.body.length} caractères` : 'VIDE'}`)
    console.log(`   Date: ${new Date(email.received_at).toLocaleString('fr-FR')}`)

    if (email.body) {
      // Chercher des mentions de cybelesoft dans le body
      const bodyLower = email.body.toLowerCase()
      if (bodyLower.includes('cybelesoft')) {
        console.log(`   ✅ Contient "cybelesoft" dans le body`)
      }
      if (bodyLower.includes('forward') || bodyLower.includes('transféré')) {
        console.log(`   🔄 Semble être un forward`)
      }
    }
    console.log('')
  }

  // 3. Chercher des emails qui mentionnent Cybelesoft mais ne sont pas assignés
  console.log('\n🔍 Recherche d\'emails mentionnant Cybelesoft...\n')

  const { data: mentioningEmails, error: mentionError } = await supabase
    .from('emails')
    .select('id, subject, from_email, client_id, body')
    .or('subject.ilike.%cybelesoft%,from_email.ilike.%cybelesoft%')
    .order('received_at', { ascending: false })
    .limit(20)

  if (mentionError) {
    console.error('❌ Erreur:', mentionError)
    return
  }

  console.log(`📧 ${mentioningEmails.length} emails mentionnant Cybelesoft:\n`)

  for (const email of mentioningEmails) {
    const isAssignedToCybelesoft = email.client_id === cybelesoft.id
    console.log(`${isAssignedToCybelesoft ? '✅' : '❌'} ${email.subject || '(sans sujet)'}`)
    console.log(`   De: ${email.from_email}`)
    console.log(`   Client: ${email.client_id ? (isAssignedToCybelesoft ? 'Cybelesoft ✅' : 'Autre client ⚠️') : 'Non assigné ❌'}`)

    if (email.body) {
      const preview = email.body.substring(0, 200).replace(/\s+/g, ' ')
      console.log(`   Body preview: ${preview}...`)
    } else {
      console.log(`   ⚠️  Body vide - email synchronisé avant la migration 007`)
    }
    console.log('')
  }
}

checkCybelesoftEmails()
  .then(() => {
    console.log('✅ Vérification terminée!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
