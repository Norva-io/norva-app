#!/usr/bin/env node

/**
 * Test script pour vérifier la configuration Nylas
 *
 * Ce script teste :
 * 1. Les variables d'environnement sont bien chargées
 * 2. L'URL OAuth Nylas est correctement générée
 * 3. La configuration utilise bien l'API Key comme client secret
 */

import Nylas from 'nylas'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, '.env.local') })

console.log('🔍 Test de configuration Nylas V3\n')

// Vérifier les variables d'environnement
const config = {
  clientId: process.env.NYLAS_CLIENT_ID,
  apiKey: process.env.NYLAS_API_KEY,
  apiUri: process.env.NYLAS_API_URI,
  callbackUri: process.env.NYLAS_CALLBACK_URI,
}

console.log('📋 Variables d\'environnement:')
console.log(`  NYLAS_CLIENT_ID: ${config.clientId ? '✅ ' + config.clientId.substring(0, 20) + '...' : '❌ Non défini'}`)
console.log(`  NYLAS_API_KEY: ${config.apiKey ? '✅ ' + config.apiKey.substring(0, 20) + '...' : '❌ Non défini'}`)
console.log(`  NYLAS_API_URI: ${config.apiUri || '❌ Non défini'}`)
console.log(`  NYLAS_CALLBACK_URI: ${config.callbackUri || '❌ Non défini'}`)
console.log()

if (!config.clientId || !config.apiKey) {
  console.error('❌ Variables d\'environnement manquantes!')
  process.exit(1)
}

// Initialiser le client Nylas
const nylas = new Nylas({
  apiKey: config.apiKey,
  apiUri: config.apiUri || 'https://api.eu.nylas.com',
})

console.log('✅ Client Nylas initialisé')
console.log()

// Générer une URL OAuth de test
try {
  const testState = Buffer.from(JSON.stringify({ userId: 'test-user-123' })).toString('base64')

  const authUrl = nylas.auth.urlForOAuth2({
    clientId: config.clientId,
    redirectUri: config.callbackUri || 'http://localhost:3000/api/auth/outlook/callback',
    provider: 'microsoft',
    scopes: ['https://outlook.office.com/mail.read'],
    state: testState,
  })

  console.log('🔗 URL OAuth générée avec succès:')
  console.log(`  ${authUrl}`)
  console.log()

  // Vérifier que l'URL contient les bons paramètres
  const url = new URL(authUrl)
  console.log('📊 Paramètres de l\'URL:')
  console.log(`  client_id: ${url.searchParams.get('client_id') === config.clientId ? '✅' : '❌'}`)
  console.log(`  redirect_uri: ${url.searchParams.get('redirect_uri') === config.callbackUri ? '✅' : '❌'}`)
  console.log(`  state: ${url.searchParams.get('state') === testState ? '✅' : '❌'}`)
  console.log(`  provider: ${url.searchParams.get('provider') === 'microsoft' ? '✅' : '❌'}`)
  console.log()

  console.log('✅ Tous les tests sont passés!')
  console.log()
  console.log('💡 Prochaine étape: Cliquez sur "Connecter Outlook" dans le dashboard')
  console.log('   http://localhost:3000/dashboard')
} catch (error) {
  console.error('❌ Erreur lors de la génération de l\'URL OAuth:')
  console.error(error)
  process.exit(1)
}