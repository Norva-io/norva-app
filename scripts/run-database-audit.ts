/**
 * Script d'audit complet de la base de données
 * Génère un rapport détaillé avec recommandations
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface AuditResult {
  section: string
  status: 'OK' | 'WARNING' | 'ERROR'
  details: string
  recommendation?: string
}

const results: AuditResult[] = []

async function auditDatabase() {
  console.log('╔══════════════════════════════════════════════════════════════════════╗')
  console.log('║                    AUDIT DE BASE DE DONNÉES                           ║')
  console.log('╚══════════════════════════════════════════════════════════════════════╝\n')

  // 1. Vérifier les tables existantes
  console.log('📊 1. Vérification des tables...')
  await checkTables()

  // 2. Vérifier la structure des colonnes
  console.log('\n📋 2. Vérification de la structure...')
  await checkStructure()

  // 3. Vérifier la cohérence des données
  console.log('\n🔍 3. Vérification de la cohérence...')
  await checkDataConsistency()

  // 4. Vérifier la qualité des données
  console.log('\n✨ 4. Vérification de la qualité...')
  await checkDataQuality()

  // 5. Détecter les doublons
  console.log('\n🔎 5. Détection des doublons...')
  await checkDuplicates()

  // 6. Statistiques générales
  console.log('\n📈 6. Statistiques générales...')
  await checkStats()

  // 7. Générer le rapport
  console.log('\n📄 Génération du rapport...')
  generateReport()

  console.log('\n✅ Audit terminé!')
}

async function checkTables() {
  const expectedTables = ['users', 'clients', 'emails', 'client_insights', 'suggested_actions']

  for (const table of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        if (error.code === '42P01') {
          results.push({
            section: 'Tables',
            status: 'ERROR',
            details: `Table "${table}" n'existe pas`,
            recommendation: `Appliquer la migration qui crée la table ${table}`
          })
          console.log(`   ❌ ${table}: N'existe pas`)
        } else {
          throw error
        }
      } else {
        results.push({
          section: 'Tables',
          status: 'OK',
          details: `Table "${table}" existe (${count} lignes)`
        })
        console.log(`   ✅ ${table}: ${count} lignes`)
      }
    } catch (err) {
      console.error(`   ❌ Erreur lors de la vérification de ${table}:`, err)
    }
  }
}

async function checkStructure() {
  // Vérifier que emails a la colonne body
  const { data: emailCols, error } = await supabase
    .from('emails')
    .select('body')
    .limit(1)

  if (error && error.message.includes('column') && error.message.includes('body')) {
    results.push({
      section: 'Structure',
      status: 'ERROR',
      details: 'Colonne "body" manquante dans la table emails',
      recommendation: 'Appliquer migration 007_add_body_to_emails.sql'
    })
    console.log('   ❌ emails.body: Colonne manquante')
  } else {
    results.push({
      section: 'Structure',
      status: 'OK',
      details: 'Colonne "body" présente dans emails'
    })
    console.log('   ✅ emails.body: Présent')
  }
}

async function checkDataConsistency() {
  // 1. Emails orphelins
  const { count: orphanCount } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .is('client_id', null)

  if (orphanCount && orphanCount > 0) {
    results.push({
      section: 'Cohérence',
      status: 'WARNING',
      details: `${orphanCount} emails orphelins (client_id = null)`,
      recommendation: 'Exécuter: npx tsx scripts/reassign-orphaned-emails.ts'
    })
    console.log(`   ⚠️  ${orphanCount} emails orphelins`)
  } else {
    results.push({
      section: 'Cohérence',
      status: 'OK',
      details: 'Aucun email orphelin'
    })
    console.log('   ✅ Aucun email orphelin')
  }

  // 2. Clients dupliqués (même domaine)
  const { data: clients } = await supabase
    .from('clients')
    .select('domain, name')

  if (clients) {
    const domainMap = new Map<string, string[]>()
    for (const client of clients) {
      const names = domainMap.get(client.domain) || []
      names.push(client.name)
      domainMap.set(client.domain, names)
    }

    const duplicates = Array.from(domainMap.entries())
      .filter(([_, names]) => names.length > 1)

    if (duplicates.length > 0) {
      for (const [domain, names] of duplicates) {
        results.push({
          section: 'Cohérence',
          status: 'WARNING',
          details: `Domaine dupliqué "${domain}": ${names.join(', ')}`,
          recommendation: 'Fusionner ou corriger les clients dupliqués'
        })
        console.log(`   ⚠️  Domaine dupliqué: ${domain} (${names.join(', ')})`)
      }
    } else {
      console.log('   ✅ Aucun domaine dupliqué')
    }
  }

  // 3. Compteur emails vs réalité
  const { data: clientsWithCounts } = await supabase
    .from('clients')
    .select('id, name, total_emails_count')

  if (clientsWithCounts) {
    for (const client of clientsWithCounts) {
      const { count: actualCount } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client.id)

      if (client.total_emails_count !== actualCount) {
        results.push({
          section: 'Cohérence',
          status: 'WARNING',
          details: `${client.name}: compteur=${client.total_emails_count}, réel=${actualCount}`,
          recommendation: 'Resynchroniser les compteurs'
        })
        console.log(`   ⚠️  ${client.name}: compteur incohérent (${client.total_emails_count} vs ${actualCount})`)
      }
    }
  }
}

async function checkDataQuality() {
  // 1. Emails sans body
  const { count: totalEmails } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })

  const { count: withoutBody } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .or('body.is.null,body.eq.')

  const percentage = totalEmails ? ((withoutBody || 0) / totalEmails * 100).toFixed(1) : 0

  if (withoutBody && withoutBody > 0) {
    results.push({
      section: 'Qualité',
      status: 'WARNING',
      details: `${withoutBody}/${totalEmails} emails sans body (${percentage}%)`,
      recommendation: 'Resynchroniser les emails depuis /settings pour obtenir le body complet'
    })
    console.log(`   ⚠️  ${withoutBody}/${totalEmails} emails sans body (${percentage}%)`)
  } else {
    results.push({
      section: 'Qualité',
      status: 'OK',
      details: 'Tous les emails ont un body'
    })
    console.log('   ✅ Tous les emails ont un body')
  }

  // 2. Domaines invalides
  const { data: invalidDomains } = await supabase
    .from('clients')
    .select('id, name, domain')
    .or('domain.is.null,domain.eq.,domain.like.@%,domain.like.%@%')

  if (invalidDomains && invalidDomains.length > 0) {
    for (const client of invalidDomains) {
      results.push({
        section: 'Qualité',
        status: 'ERROR',
        details: `Client "${client.name}" a un domaine invalide: "${client.domain}"`,
        recommendation: 'Corriger le domaine (enlever @, etc.)'
      })
      console.log(`   ❌ ${client.name}: domaine invalide "${client.domain}"`)
    }
  } else {
    console.log('   ✅ Tous les domaines sont valides')
  }
}

async function checkDuplicates() {
  // Déjà vérifié dans checkDataConsistency
  console.log('   ✅ Vérification effectuée dans la section Cohérence')
}

async function checkStats() {
  const { data: users, count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact' })

  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  const { count: emailCount } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })

  const { count: insightCount } = await supabase
    .from('client_insights')
    .select('*', { count: 'exact', head: true })

  console.log(`   📊 Utilisateurs: ${userCount}`)
  console.log(`   📊 Clients: ${clientCount}`)
  console.log(`   📊 Emails: ${emailCount}`)
  console.log(`   📊 Insights: ${insightCount}`)

  results.push({
    section: 'Statistiques',
    status: 'OK',
    details: `${userCount} utilisateurs, ${clientCount} clients, ${emailCount} emails, ${insightCount} insights`
  })
}

function generateReport() {
  const now = new Date().toISOString()
  const errors = results.filter(r => r.status === 'ERROR')
  const warnings = results.filter(r => r.status === 'WARNING')
  const ok = results.filter(r => r.status === 'OK')

  let report = `# Rapport d'Audit de Base de Données\n\n`
  report += `**Date**: ${now}\n`
  report += `**Status Général**: ${errors.length === 0 ? (warnings.length === 0 ? '✅ EXCELLENT' : '⚠️ BON (avec avertissements)') : '❌ PROBLÈMES DÉTECTÉS'}\n\n`

  report += `## Résumé\n\n`
  report += `- ✅ OK: ${ok.length}\n`
  report += `- ⚠️  Avertissements: ${warnings.length}\n`
  report += `- ❌ Erreurs: ${errors.length}\n\n`

  if (errors.length > 0) {
    report += `## ❌ Erreurs Critiques\n\n`
    for (const result of errors) {
      report += `### ${result.section}: ${result.details}\n`
      if (result.recommendation) {
        report += `**Recommandation**: ${result.recommendation}\n`
      }
      report += `\n`
    }
  }

  if (warnings.length > 0) {
    report += `## ⚠️  Avertissements\n\n`
    for (const result of warnings) {
      report += `### ${result.section}: ${result.details}\n`
      if (result.recommendation) {
        report += `**Recommandation**: ${result.recommendation}\n`
      }
      report += `\n`
    }
  }

  report += `## ✅ Points Validés\n\n`
  for (const result of ok) {
    report += `- ${result.section}: ${result.details}\n`
  }

  report += `\n## Actions Recommandées\n\n`
  const recommendations = results
    .filter(r => r.recommendation)
    .map(r => r.recommendation!)

  if (recommendations.length > 0) {
    recommendations.forEach((rec, i) => {
      report += `${i + 1}. ${rec}\n`
    })
  } else {
    report += `Aucune action requise. Base de données en excellent état ! ✅\n`
  }

  const reportPath = 'docs/DATABASE-AUDIT-REPORT.md'
  fs.writeFileSync(reportPath, report)
  console.log(`\n📄 Rapport généré: ${reportPath}`)

  // Afficher aussi dans la console
  console.log('\n' + '━'.repeat(70))
  console.log(report)
}

auditDatabase()
  .then(() => {
    console.log('\n✅ Audit terminé avec succès!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  })
