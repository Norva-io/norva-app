/**
 * Script pour fusionner automatiquement les clients dupliqués
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixDuplicates() {
  console.log('🔍 Recherche des clients dupliqués...\n')

  // Récupérer tous les clients
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name, domain, created_at, total_emails_count')
    .order('domain, created_at')

  if (error) {
    console.error('❌ Erreur:', error)
    return
  }

  if (!clients) {
    console.log('Aucun client trouvé')
    return
  }

  // Grouper par domaine
  const domainMap = new Map<string, typeof clients>()
  for (const client of clients) {
    const existing = domainMap.get(client.domain) || []
    existing.push(client)
    domainMap.set(client.domain, existing)
  }

  // Trouver les doublons
  const duplicates = Array.from(domainMap.entries())
    .filter(([_, clientsList]) => clientsList.length > 1)

  if (duplicates.length === 0) {
    console.log('✅ Aucun doublon trouvé!')
    return
  }

  console.log(`⚠️  ${duplicates.length} domaine(s) en doublon:\n`)

  for (const [domain, clientsList] of duplicates) {
    console.log(`📧 Domaine: ${domain}`)
    console.log(`   Clients:`)
    clientsList.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (créé le ${new Date(c.created_at).toLocaleDateString('fr-FR')}, ${c.total_emails_count} emails)`)
    })

    // Garder le plus ancien (premier créé)
    const keepClient = clientsList[0]
    const duplicateClients = clientsList.slice(1)

    console.log(`\n   ✅ Garder: ${keepClient.name} (${keepClient.id})`)
    console.log(`   ❌ Supprimer: ${duplicateClients.map(c => c.name).join(', ')}`)

    // Fusionner les emails
    for (const duplicate of duplicateClients) {
      console.log(`\n   🔄 Fusion de ${duplicate.name}...`)

      // Réattribuer les emails
      const { error: updateError } = await supabase
        .from('emails')
        .update({ client_id: keepClient.id })
        .eq('client_id', duplicate.id)

      if (updateError) {
        console.error(`   ❌ Erreur lors de la réattribution des emails:`, updateError)
        continue
      }

      console.log(`   ✅ Emails réattribués`)

      // Supprimer le doublon
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', duplicate.id)

      if (deleteError) {
        console.error(`   ❌ Erreur lors de la suppression:`, deleteError)
        continue
      }

      console.log(`   ✅ Client supprimé`)
    }

    // Mettre à jour le compteur du client conservé
    const { count } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', keepClient.id)

    await supabase
      .from('clients')
      .update({ total_emails_count: count || 0 })
      .eq('id', keepClient.id)

    console.log(`   ✅ Compteur mis à jour: ${count} emails\n`)
  }

  console.log('\n✅ Fusion des doublons terminée!')
}

fixDuplicates()
  .then(() => {
    console.log('\n✅ Script terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  })
