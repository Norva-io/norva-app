import Nylas from 'nylas'

// Configuration Nylas
export const nylasConfig = {
  clientId: process.env.NYLAS_CLIENT_ID || '',
  clientSecret: process.env.NYLAS_CLIENT_SECRET || '',
  apiKey: process.env.NYLAS_API_KEY || '',
  apiUri: process.env.NYLAS_API_URI || 'https://api.us.nylas.com',
  callbackUri: process.env.NYLAS_CALLBACK_URI || 'http://localhost:3000/api/auth/outlook/callback',
}

// Initialize Nylas client
export const nylas = new Nylas({
  apiKey: nylasConfig.apiKey,
  apiUri: nylasConfig.apiUri,
})

// Helper to get auth URL for Outlook
export function getOutlookAuthUrl(state: string) {
  const config = {
    clientId: nylasConfig.clientId,
    redirectUri: nylasConfig.callbackUri,
    provider: 'microsoft' as const,
    scopes: ['https://outlook.office.com/mail.read'],
    state,
  }

  return nylas.auth.urlForOAuth2(config)
}