/**
 * Vérifier le statut des emails Cybelesoft
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkCybelesoftStatus() {
  console.log('🔍 Vérification du statut Cybelesoft...\n')

  // 1. Trouver le client Cybelesoft
  const { data: cybelesoft } = await supabase
    .from('clients')
    .select('*')
    .eq('domain', 'cybelesoft.com')
    .single()

  if (!cybelesoft) {
    console.error('❌ Client Cybelesoft non trouvé')
    return
  }

  console.log('📋 Client Cybelesoft:')
  console.log(`   ID: ${cybelesoft.id}`)
  console.log(`   Nom: ${cybelesoft.name}`)
  console.log(`   Domaine: ${cybelesoft.domain}`)
  console.log(`   Total emails (compteur): ${cybelesoft.total_emails_count || 0}`)
  console.log()

  // 2. Compter les emails affectés
  const { count: emailCount } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', cybelesoft.id)

  console.log(`📧 Emails affectés à Cybelesoft: ${emailCount || 0}`)

  // 3. Lister quelques emails
  const { data: emails } = await supabase
    .from('emails')
    .select('id, subject, from_email, received_at, body')
    .eq('client_id', cybelesoft.id)
    .order('received_at', { ascending: false })
    .limit(5)

  if (emails && emails.length > 0) {
    console.log('\n📨 Derniers emails:')
    emails.forEach((email, i) => {
      console.log(`\n   ${i + 1}. ${email.subject}`)
      console.log(`      From: ${email.from_email}`)
      console.log(`      Date: ${new Date(email.received_at).toLocaleString('fr-FR')}`)
      const hasBody = email.body ? `oui (${email.body.length} chars)` : 'non'
      console.log(`      Body: ${hasBody}`)
    })
  } else {
    console.log('\n⚠️  Aucun email trouvé pour Cybelesoft')
  }

  // 4. Vérifier s'il y a des emails qui contiennent cybelesoft.com mais ne sont PAS affectés
  const { data: potentialEmails } = await supabase
    .from('emails')
    .select('id, subject, from_email, body')
    .neq('client_id', cybelesoft.id)
    .ilike('body', '%cybelesoft.com%')
    .limit(10)

  if (potentialEmails && potentialEmails.length > 0) {
    console.log(`\n⚠️  ${potentialEmails.length} email(s) contiennent "cybelesoft.com" mais ne sont PAS affectés à Cybelesoft:`)
    potentialEmails.forEach((email, i) => {
      console.log(`   ${i + 1}. ${email.subject} (from: ${email.from_email})`)
    })
  } else {
    console.log('\n✅ Aucun email orphelin contenant "cybelesoft.com"')
  }
}

checkCybelesoftStatus()
  .then(() => {
    console.log('\n✅ Vérification terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
