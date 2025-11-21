import { NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { nylas, nylasConfig } from '@/lib/nylas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error)
    redirect('/settings?error=oauth_failed')
  }

  if (!code || !state) {
    redirect('/settings?error=missing_params')
  }

  try {
    // Decode state to get userId
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString())

    // Exchange code for access token via Nylas
    const response = await nylas.auth.exchangeCodeForToken({
      clientId: nylasConfig.clientId,
      clientSecret: nylasConfig.clientSecret,
      code,
      redirectUri: nylasConfig.gmailCallbackUri,
    })

    const { grantId, email } = response

    // Store grant_id in Supabase
    const { error: dbError } = await supabase
      .from('users')
      .update({
        email_grant_id: grantId,
        email_provider: 'gmail',
        email_connected_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId)

    if (dbError) {
      console.error('Error storing grant_id:', dbError)
      redirect('/settings?error=database_error')
    }

    console.log(`✅ Gmail connected for user ${userId}: ${email}`)

    // Redirect to settings with success
    redirect('/settings?success=email_connected')
  } catch (err) {
    console.error('Error exchanging code:', err)
    redirect('/settings?error=exchange_failed')
  }
}
