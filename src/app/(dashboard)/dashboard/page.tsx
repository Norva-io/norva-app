import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NavBar } from '@/components/layout/nav-bar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur existe dans Supabase
  const { data: user } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, avatar_url')
    .eq('clerk_id', userId)
    .single()

  // Si l'utilisateur n'existe pas dans Supabase, rediriger vers page d'erreur
  if (!user) {
    console.error(`User ${userId} not found in Supabase, webhook failed`)
    redirect('/error-sync')
  }

  // Récupérer les statistiques
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { data: clients } = await supabase
    .from('clients')
    .select('health_score')
    .eq('user_id', user.id)
    .not('health_score', 'is', null)

  // Calculer la santé moyenne
  const averageHealth = clients && clients.length > 0
    ? Math.round(clients.reduce((sum, c) => sum + (c.health_score || 0), 0) / clients.length)
    : null

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto p-8">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-bold">
            Bonjour{user.first_name ? ` ${user.first_name}` : ''} 👋
          </h2>
          <p className="mt-1 text-muted-foreground">
            Voici un aperçu de votre activité
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Card 1: Clients actifs */}
          <Link href="/clients">
            <Card className="relative overflow-hidden border-l-4 border-l-accent transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs font-medium uppercase tracking-wide">
                    Clients actifs
                  </CardDescription>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-accent"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                </div>
                <CardTitle className="mt-2 font-serif text-3xl">{clientsCount || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {!clientsCount || clientsCount === 0 ? 'Aucun client pour le moment' : `Client${clientsCount > 1 ? 's' : ''} enregistré${clientsCount > 1 ? 's' : ''}`}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card 2: Emails analysés */}
          <Card className="relative overflow-hidden border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  Emails analysés
                </CardDescription>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-primary"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
              </div>
              <CardTitle className="mt-2 font-serif text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Aucun email analysé pour le moment
              </p>
            </CardContent>
          </Card>

          {/* Card 3: Santé moyenne */}
          <Card className="relative overflow-hidden border-l-4 border-l-muted-foreground">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs font-medium uppercase tracking-wide">
                  Santé moyenne
                </CardDescription>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-muted-foreground"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
              </div>
              <CardTitle className="mt-2 font-serif text-3xl">
                {averageHealth !== null ? averageHealth : '--'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {averageHealth !== null ? 'Moyenne de tous vos clients' : 'Aucun client analysé'}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
