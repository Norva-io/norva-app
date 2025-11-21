/**
 * API Route: Update suggested action status
 * PATCH /api/actions/[id]
 */

import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from Supabase
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'done', 'snoozed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // First, verify ownership BEFORE updating
    const { data: existingAction, error: fetchError } = await supabase
      .from('suggested_actions')
      .select(`
        id,
        client_id,
        clients!inner (
          user_id
        )
      `)
      .eq('id', id)
      .single()

    if (fetchError || !existingAction) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 })
    }

    // Verify ownership
    const actionWithClient = existingAction as unknown as { clients: { user_id: string } }
    if (actionWithClient.clients.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Now safe to update
    const { error: updateError } = await supabase
      .from('suggested_actions')
      .update({
        status,
        completed_at: status === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error updating action:', updateError)
      return NextResponse.json({ error: 'Failed to update action' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/actions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
