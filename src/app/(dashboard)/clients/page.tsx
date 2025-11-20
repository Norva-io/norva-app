import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

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
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image src="/logo.svg" alt="Norva" width={32} height={32} className="h-8 w-8" />
              <h1 className="font-serif text-2xl font-bold">Norva</h1>
            </Link>
          </div>
          <UserButton afterSignOutUrl="/login" />
        </div>
      </header>

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
            {clients.map((client) => {
              const healthColor =
                client.health_status === 'healthy' ? 'border-l-green-500' :
                client.health_status === 'stable' ? 'border-l-yellow-500' :
                'border-l-red-500'

              return (
                <Card key={client.id} className={`relative overflow-hidden border-l-4 ${healthColor}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="font-serif text-xl">{client.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {client.domain}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {client.primary_contact_email && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Contact:</span> {client.primary_contact_email}
                      </div>
                    )}

                    {client.health_score !== null ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Santé</span>
                        <span className="font-serif text-2xl font-bold">{client.health_score}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Pas encore analysé
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      {client.total_emails_count || 0} email(s) analysé(s)
                    </div>

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/clients/${client.id}`}>
                        Voir détails
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}