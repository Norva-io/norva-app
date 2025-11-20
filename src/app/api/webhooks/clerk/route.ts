import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || ''

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  // Get headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create new Svix instance with secret
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify webhook
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification error', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data

    // Get primary email
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id
    )

    if (!primaryEmail) {
      return new Response('Error: No primary email found', { status: 400 })
    }

    // Upsert user in Supabase
    const { error } = await supabase.from('users').upsert(
      {
        clerk_id: id,
        email: primaryEmail.email_address,
        first_name: first_name || null,
        last_name: last_name || null,
        avatar_url: image_url || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'clerk_id',
      }
    )

    if (error) {
      console.error('Error upserting user:', error)
      return new Response('Error: Database error', { status: 500 })
    }

    console.log(`✅ User ${eventType}: ${primaryEmail.email_address}`)
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    // Soft delete or hard delete user in Supabase
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', id)

    if (error) {
      console.error('Error deleting user:', error)
      return new Response('Error: Database error', { status: 500 })
    }

    console.log(`✅ User deleted: ${id}`)
  }

  return new Response('Webhook received', { status: 200 })
}