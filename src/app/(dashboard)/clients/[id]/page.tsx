import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NavBar } from '@/components/layout/nav-bar'
import { ArrowLeft, Mail, TrendingUp, AlertCircle, Sparkles } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur existe dans Supabase
  const { data: user } = await supabase
    .from('users')
    .select('id, email_connected_at')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    redirect('/error-sync')
  }

  // Récupérer le client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
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
    .limit(5)

  const hasEmailConnected = !!user.email_connected_at
  const hasBeenAnalyzed = client.last_analyzed_at !== null

  // Déterminer la couleur du badge de santé
  const healthColor =
    client.health_status === 'healthy' ? 'bg-green-500' :
    client.health_status === 'stable' ? 'bg-yellow-500' :
    client.health_status === 'at_risk' ? 'bg-red-500' :
    'bg-gray-500'

  const healthLabel =
    client.health_status === 'healthy' ? 'Excellente santé' :
    client.health_status === 'stable' ? 'Stable' :
    client.health_status === 'at_risk' ? 'À risque' :
    'Non analysé'

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto p-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux clients
            </Link>
          </Button>

          {/* En-tête client */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold">{client.name}</h1>
              <p className="mt-2 text-muted-foreground">{client.domain}</p>
              {client.primary_contact_email && (
                <p className="mt-1 text-sm text-muted-foreground">
                  Contact: {client.primary_contact_email}
                </p>
              )}
            </div>

            {/* Score de santé */}
            {client.health_score !== null && (
              <div className="text-right">
                <div className="font-serif text-5xl font-bold text-primary">
                  {client.health_score}
                </div>
                <Badge className={`mt-2 ${healthColor} text-white`}>
                  {healthLabel}
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Action principale */}
        <div className="mb-8">
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
                      Pour analyser ce client, connectez d'abord votre boîte email
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link href="/settings">Connecter mon email</Link>
                </Button>
              </CardContent>
            </Card>
          ) : !hasBeenAnalyzed ? (
            <Card className="border-primary bg-primary/5">
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Prêt à analyser</h3>
                    <p className="text-sm text-muted-foreground">
                      Lancez l'analyse IA pour obtenir des insights sur ce client
                    </p>
                  </div>
                </div>
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyser maintenant
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Dernière analyse</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(client.last_analyzed_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Relancer l'analyse
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Grille de contenu */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="space-y-6 lg:col-span-2">
            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Insights clés
                </CardTitle>
                <CardDescription>
                  Points d'attention détectés par l'IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!insights || insights.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
                    <p>Aucun insight disponible pour le moment</p>
                    <p className="text-sm">
                      {hasEmailConnected
                        ? 'Lancez une analyse pour générer des insights'
                        : 'Connectez votre email pour commencer'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className={`rounded-lg border-l-4 p-4 ${
                          insight.insight_type === 'warning'
                            ? 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20'
                            : insight.insight_type === 'success'
                            ? 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
                            : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        }`}
                      >
                        <p className="text-sm font-medium">{insight.insight_text}</p>
                        {insight.category && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {insight.category}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Emails récents (placeholder) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Emails récents
                </CardTitle>
                <CardDescription>
                  Les derniers échanges avec ce client
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
                  <p>Aucun email analysé pour le moment</p>
                  <p className="text-sm">
                    Les emails apparaîtront ici après l'analyse
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statistiques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Emails analysés</div>
                  <div className="mt-1 font-serif text-2xl font-bold">
                    {client.total_emails_count || 0}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Créé le</div>
                  <div className="mt-1 text-sm">
                    {new Date(client.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {client.last_analyzed_at && (
                  <div>
                    <div className="text-sm text-muted-foreground">Dernière analyse</div>
                    <div className="mt-1 text-sm">
                      {new Date(client.last_analyzed_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" disabled>
                  Modifier les informations
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive" disabled>
                  Supprimer le client
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}