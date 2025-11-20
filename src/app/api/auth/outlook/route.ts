import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getOutlookAuthUrl } from '@/lib/nylas'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Generate state with userId to retrieve it in callback
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64')

  // Get Nylas OAuth URL
  const authUrl = getOutlookAuthUrl(state)

  // Redirect to Outlook OAuth consent screen
  redirect(authUrl)
}