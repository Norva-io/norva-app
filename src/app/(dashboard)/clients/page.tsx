import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { NavBar } from '@/components/layout/nav-bar'
import { ClientsList } from '@/components/clients/clients-list'
import { getOrCreateSupabaseUser } from '@/lib/supabase-user'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ClientsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Récupérer ou créer l'utilisateur dans Supabase
  let user
  try {
    const result = await getOrCreateSupabaseUser(userId)
    user = result.user
  } catch (error) {
    console.error('Error getting/creating user:', error)
    redirect('/error-sync')
  }

  // Récupérer tous les clients de l'utilisateur
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, domain, primary_contact_email, health_score, risk_level, emails_analyzed_count, total_emails_count, last_interaction_at, last_analyzed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <ClientsList initialClients={clients || []} />
      </main>
    </div>
  )
}