import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { NavBar } from '@/components/layout/nav-bar'
import { ClientCard } from '@/components/clients/client-card'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ClientsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur existe dans Supabase
  const { data: user } = await supabase
    .from('users')
    .select('id, email, first_name, last_name')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    redirect('/error-sync')
  }

  // Récupérer tous les clients de l'utilisateur
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, domain, primary_contact_email, health_score, health_status, total_emails_count, last_analyzed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-3xl font-bold">Mes clients</h2>
            <p className="mt-1 text-muted-foreground">
              Gérez vos clients et suivez leur santé
            </p>
          </div>
          <Button asChild>
            <Link href="/clients/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un client
            </Link>
          </Button>
        </div>

        {!clients || clients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="mb-2 font-serif text-xl font-semibold">Aucun client pour le moment</h3>
              <p className="mb-6 text-center text-muted-foreground">
                Commencez par ajouter votre premier client test
              </p>
              <Button asChild>
                <Link href="/clients/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Ajouter un client
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}