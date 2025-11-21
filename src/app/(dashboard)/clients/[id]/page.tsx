import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { NavBar } from '@/components/layout/nav-bar'
import { ClientActions } from '@/components/client/client-actions'
import { ClientHealthOverview } from '@/components/client/client-health-overview'
import { EmailTimeline } from '@/components/client/email-timeline'
import { ClientInsightsList } from '@/components/client/client-insights-list'
import { ArrowLeft, Mail, AlertCircle, Sparkles } from 'lucide-react'
import { getOrCreateSupabaseUser } from '@/lib/supabase-user'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Await params (Next.js 15+)
  const { id } = await params

  // Récupérer ou créer l'utilisateur dans Supabase
  let user
  try {
    const result = await getOrCreateSupabaseUser(userId)
    user = result.user
  } catch (error) {
    console.error('❌ Error getting/creating user:', error)
    redirect('/error-sync')
  }

  // Récupérer le client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!client) {
    notFound()
  }

  // Récupérer les insights du client
  const { data: insights } = await supabase
    .from('client_insights')
    .select('*')
    .eq('client_id', client.id)
    .order('priority', { ascending: false })
    .limit(10)

  // Récupérer les emails récents du client
  const { data: emails } = await supabase
    .from('emails')
    .select('*')
    .eq('client_id', client.id)
    .order('received_at', { ascending: false })
    .limit(20)

  const hasEmailConnected = !!user.email_connected_at
  const hasBeenAnalyzed = client.last_analyzed_at !== null

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux clients
            </Link>
          </Button>

          {/* En-tête client */}
          <div className="mb-6">
            <h1 className="font-serif text-4xl font-bold">{client.name}</h1>
            <p className="mt-2 text-muted-foreground">{client.domain}</p>
            {client.primary_contact_email && (
              <p className="mt-1 text-sm text-muted-foreground">
                Contact: {client.primary_contact_email}
              </p>
            )}
          </div>
        </div>

        {/* Action principale si pas de connexion email ou pas analysé */}
        {(!hasEmailConnected || !hasBeenAnalyzed) && (
          <div className="mb-6">
            {!hasEmailConnected ? (
              <Card className="border-dashed bg-muted/50">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Connectez votre email</h3>
                      <p className="text-sm text-muted-foreground">
                        Pour analyser ce client, connectez d&apos;abord votre boîte email
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/settings">Connecter mon email</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary bg-primary/5">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Prêt à analyser</h3>
                      <p className="text-sm text-muted-foreground">
                        Synchronisez vos emails pour obtenir des insights sur ce client
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href="/settings">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyser
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Grille de contenu */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale (2/3) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Insights clés
                </CardTitle>
                <CardDescription>
                  Points d&apos;attention détectés par l&apos;IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClientInsightsList insights={insights || []} />
              </CardContent>
            </Card>

            {/* Emails récents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Timeline des emails
                </CardTitle>
                <CardDescription>
                  Les 20 derniers échanges avec ce client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailTimeline emails={emails || []} clientDomain={client.domain} clientName={client.name} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Health Overview */}
            <ClientHealthOverview
              healthScore={client.health_score}
              riskLevel={client.risk_level as 'urgent' | 'high' | 'normal' | null}
              lastInteractionAt={client.last_interaction_at}
              emailsAnalyzedCount={client.emails_analyzed_count || 0}
              lastAnalyzedAt={client.last_analyzed_at}
            />

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientActions clientId={client.id} clientName={client.name} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
