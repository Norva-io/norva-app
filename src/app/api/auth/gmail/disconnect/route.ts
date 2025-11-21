import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Récupérer l'utilisateur depuis Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id, email_grant_id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Révoquer le grant sur Nylas si présent
    if (user.email_grant_id) {
      try {
        const nylasResponse = await fetch(
          `https://api.us.nylas.com/v3/grants/${user.email_grant_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${process.env.NYLAS_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!nylasResponse.ok) {
          console.error('Failed to revoke Nylas grant:', await nylasResponse.text())
          // Continue anyway to clean up local data
        }
      } catch (error) {
        console.error('Error revoking Nylas grant:', error)
        // Continue anyway to clean up local data
      }
    }

    // Nettoyer les données email de l'utilisateur
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_grant_id: null,
        email_provider: null,
        email_connected_at: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting Gmail:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
