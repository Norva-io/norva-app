import Nylas from 'nylas'

// Configuration Nylas
export const nylasConfig = {
  clientId: process.env.NYLAS_CLIENT_ID || '',
  clientSecret: process.env.NYLAS_API_KEY || '', // V3: API Key used as client secret
  apiKey: process.env.NYLAS_API_KEY || '',
  apiUri: process.env.NYLAS_API_URI || 'https://api.eu.nylas.com',
  gmailCallbackUri: process.env.NYLAS_GMAIL_CALLBACK_URI || 'http://localhost:3000/api/auth/gmail/callback',
  outlookCallbackUri: process.env.NYLAS_OUTLOOK_CALLBACK_URI || 'http://localhost:3000/api/auth/outlook/callback',
}

// Initialize Nylas client
export const nylas = new Nylas({
  apiKey: nylasConfig.apiKey,
  apiUri: nylasConfig.apiUri,
})

// Helper to get auth URL for Gmail
export function getGmailAuthUrl(state: string) {
  const config = {
    clientId: nylasConfig.clientId,
    redirectUri: nylasConfig.gmailCallbackUri,
    provider: 'google' as const,
    scopes: ['https://www.googleapis.com/auth/gmail.readonly'],
    state,
  }

  return nylas.auth.urlForOAuth2(config)
}

// Helper to get auth URL for Outlook
export function getOutlookAuthUrl(state: string) {
  const config = {
    clientId: nylasConfig.clientId,
    redirectUri: nylasConfig.outlookCallbackUri,
    provider: 'microsoft' as const,
    scopes: ['https://outlook.office.com/mail.read'],
    state,
  }

  return nylas.auth.urlForOAuth2(config)
}