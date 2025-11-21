import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { NavBar } from '@/components/layout/nav-bar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailProviderCard } from '@/components/settings/email-provider-card'
import { SyncEmailsSection } from '@/components/settings/sync-emails-section'
import { getOrCreateSupabaseUser } from '@/lib/supabase-user'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function SettingsPage() {
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

  // Récupérer le nombre de clients
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">Paramètres</h1>
            <p className="mt-2 text-muted-foreground">
              Gérez vos préférences et connexions
            </p>
          </div>

          {/* Section: Compte (en premier maintenant) */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
              <CardDescription>
                Votre adresse email principale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section: Connexions Email */}
          <Card>
            <CardHeader>
              <CardTitle>Connexions Email</CardTitle>
              <CardDescription>
                Connectez vos comptes email pour analyser vos communications clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gmail - Active */}
              <EmailProviderCard
                provider="gmail"
                name="Google Gmail"
                description="Connectez votre compte Gmail"
                isConnected={!!user.email_grant_id && user.email_provider === 'gmail'}
                connectedAt={user.email_connected_at}
                connectUrl="/api/auth/gmail"
                disconnectUrl="/api/auth/gmail/disconnect"
              />

              {/* Outlook - Coming soon */}
              <EmailProviderCard
                provider="outlook"
                name="Microsoft Outlook"
                description="Connectez votre compte Outlook ou Microsoft 365 (bientôt disponible)"
                isConnected={!!user.email_grant_id && user.email_provider === 'outlook'}
                connectedAt={user.email_connected_at}
                connectUrl="/api/auth/outlook"
                disabled
              />
            </CardContent>
          </Card>

          {/* Section: Synchronisation */}
          <SyncEmailsSection
            hasEmailConnected={!!user.email_grant_id}
            clientsCount={clientsCount || 0}
          />
        </div>
      </main>
    </div>
  )
}