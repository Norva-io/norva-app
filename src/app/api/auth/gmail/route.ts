import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getGmailAuthUrl } from '@/lib/nylas'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Generate state with userId to retrieve it in callback
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64')

  // Get Nylas OAuth URL for Gmail
  const authUrl = getGmailAuthUrl(state)

  // Redirect to Google OAuth consent screen
  redirect(authUrl)
}
