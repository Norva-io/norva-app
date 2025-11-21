import { createClient } from '@supabase/supabase-js'
import { currentUser } from '@clerk/nextjs/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Récupère l'utilisateur depuis Supabase, ou le crée s'il n'existe pas
 * Fallback pour gérer les cas où le webhook Clerk a échoué
 */
export async function getOrCreateSupabaseUser(clerkId: string) {
  // Récupérer les données complètes de l'utilisateur depuis Clerk
  const clerkUser = await currentUser()

  if (!clerkUser || clerkUser.id !== clerkId) {
    throw new Error('Clerk user not found or ID mismatch')
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress
  const firstName = clerkUser.firstName
  const lastName = clerkUser.lastName

  if (!email) {
    throw new Error('No email found for Clerk user')
  }
  // Essayer de récupérer l'utilisateur existant
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  // Si l'utilisateur existe, le retourner
  if (existingUser && !fetchError) {
    return { user: existingUser, created: false }
  }

  // Si l'utilisateur n'existe pas, le créer
  console.log(`Creating fallback user for Clerk ID: ${clerkId}`)
  console.log(`Email: ${email}, First Name: ${firstName}, Last Name: ${lastName}`)

  const { data: newUser, error: createError } = await supabase
    .from('users')
    .insert({
      clerk_id: clerkId,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
    })
    .select()
    .single()

  if (createError) {
    console.error('Error creating fallback user:', createError)
    console.error('Error details:', JSON.stringify(createError, null, 2))
    throw createError
  }

  console.log(`✅ Fallback user created successfully: ${newUser.id}`)
  return { user: newUser, created: true }
}
