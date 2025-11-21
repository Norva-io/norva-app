import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NavBar } from '@/components/layout/nav-bar'
import { getOrCreateSupabaseUser } from '@/lib/supabase-user'
import { PortfolioHealthCard } from '@/components/dashboard/portfolio-health-card'
import { UrgentClientsCard } from '@/components/dashboard/urgent-clients-card'
import { SuggestedActionsCard } from '@/components/dashboard/suggested-actions-card'
import { calculatePortfolioHealth } from '@/lib/health-score'
import { DashboardEmptyState } from '@/components/ui/empty-states'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Récupérer ou créer l'utilisateur dans Supabase
  let user
  try {
    const result = await getOrCreateSupabaseUser(userId)
    user = result.user

    if (result.created) {
      console.log('✅ Fallback: User created successfully in Supabase')
    }
  } catch (error) {
    console.error('❌ Error getting/creating user:', error)
    redirect('/error-sync')
  }

  // Récupérer les statistiques
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Si aucun client, afficher l'état vide
  if (!clientsCount || clientsCount === 0) {
    return (
      <div className="min-h-screen">
        <NavBar />

        <main className="container mx-auto p-8">
          <div className="mb-8">
            <h2 className="font-serif text-3xl font-bold">
              Bonjour{user.first_name ? ` ${user.first_name}` : ''} 👋
            </h2>
            <p className="mt-1 text-muted-foreground">
              Bienvenue sur votre tableau de bord
            </p>
          </div>

          <DashboardEmptyState />
        </main>
      </div>
    )
  }

  // Récupérer tous les clients avec leurs données
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, health_score, risk_level, last_analyzed_at, emails_analyzed_count')
    .eq('user_id', user.id)
    .order('health_score', { ascending: true, nullsFirst: true })

  // Calculer la santé du portfolio
  const clientScores = clients?.map(c => c.health_score) || []
  const portfolioHealth = calculatePortfolioHealth(clientScores)

  // Clients à risque (urgent ou high)
  const atRiskClients = clients?.filter(c => c.risk_level === 'urgent' || c.risk_level === 'high') || []

  // Récupérer les emails récents (dernières 48h)
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { count: recentEmailsCount } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clients?.map(c => c.id) || [])
    .gte('received_at', twoDaysAgo)

  // Compter les emails non répondus >48h
  const { count: unansweredEmailsCount } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clients?.map(c => c.id) || [])
    .eq('is_question', true)
    .eq('has_response', false)
    .lte('received_at', twoDaysAgo)

  // Récupérer les actions suggérées en attente
  const { data: suggestedActions } = await supabase
    .from('suggested_actions')
    .select(`
      id,
      client_id,
      title,
      description,
      priority,
      status,
      clients!inner (
        name
      )
    `)
    .in('client_id', clients?.map(c => c.id) || [])
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(10)

  const { count: pendingActionsCount } = await supabase
    .from('suggested_actions')
    .select('*', { count: 'exact', head: true })
    .in('client_id', clients?.map(c => c.id) || [])
    .eq('status', 'pending')

  // Formater les actions pour le composant
  const formattedActions = suggestedActions?.map(action => ({
    id: action.id,
    client_id: action.client_id,
    client_name: (action.clients as any).name,
    title: action.title,
    description: action.description || undefined,
    priority: action.priority as 'urgent' | 'high' | 'normal',
    status: action.status as 'pending' | 'done' | 'snoozed',
  })) || []

  // Formater les clients à risque
  const formattedUrgentClients = atRiskClients.map(client => ({
    id: client.id,
    name: client.name,
    health_score: client.health_score,
    risk_level: client.risk_level as 'urgent' | 'high' | 'normal' | null,
    urgent_reason: client.risk_level === 'urgent'
      ? 'Score de santé critique - Attention immédiate requise'
      : 'Score de santé en baisse - À surveiller',
  }))

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

        {/* Row 1: Main Cards - Santé, Priorités, Actions (3 colonnes) */}
        <div className="mb-6 grid gap-6 md:grid-cols-3">
          {/* Card 1: Portfolio Health */}
          <PortfolioHealthCard
            averageScore={portfolioHealth.average}
            trend={portfolioHealth.trend}
          />

          {/* Card 2: Clients Urgents */}
          <UrgentClientsCard
            clients={formattedUrgentClients}
            totalAtRisk={atRiskClients.length}
          />

          {/* Card 3: Actions Suggérées */}
          <SuggestedActionsCard
            actions={formattedActions}
            totalPending={pendingActionsCount || 0}
          />
        </div>

        {/* Row 2: Quick Stats groupées par 2 */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Groupe 1: Clients actifs + Clients à risque */}
          <div className="grid gap-4 grid-cols-2">
            {/* Stat 1: Clients actifs */}
            <Link href="/clients">
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardDescription className="text-sm font-medium uppercase tracking-wide">
                    Clients actifs
                  </CardDescription>
                  <CardTitle className="font-serif text-2xl">{clientsCount}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {clientsCount > 1 ? 'Clients' : 'Client'} enregistré{clientsCount > 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>

            {/* Stat 4: Clients à risque */}
            <Card className={atRiskClients.length > 0 ? 'border-l-4 border-l-red-500' : ''}>
              <CardHeader className="pb-2">
                <CardDescription className="text-sm font-medium uppercase tracking-wide">
                  Clients à risque
                </CardDescription>
                <CardTitle className="font-serif text-2xl">{atRiskClients.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Nécessitent attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Groupe 2: Emails analysés + Non répondus */}
          <div className="grid gap-4 grid-cols-2">
            {/* Stat 2: Emails analysés (48h) */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-sm font-medium uppercase tracking-wide">
                  Emails analysés
                </CardDescription>
                <CardTitle className="font-serif text-2xl">{recentEmailsCount || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Dernières 48 heures
                </p>
              </CardContent>
            </Card>

            {/* Stat 3: Non répondus >48h */}
            <Card className={unansweredEmailsCount && unansweredEmailsCount > 0 ? 'border-l-4 border-l-yellow-500' : ''}>
              <CardHeader className="pb-2">
                <CardDescription className="text-sm font-medium uppercase tracking-wide">
                  Non répondus
                </CardDescription>
                <CardTitle className="font-serif text-2xl">{unansweredEmailsCount || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Questions sans réponse
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
