import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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

  // Si l'utilisateur n'existe pas dans Supabase, le créer
  if (!user) {
    // Le webhook Clerk a probablement échoué, on crée l'user manuellement
    console.warn(`User ${userId} not found in Supabase, webhook may have failed`)
    // Pour l'instant, on laisse passer, le webhook finira par sync
    // Alternative: redirect('/error?code=sync_failed')
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="Norva" width={32} height={32} className="h-8 w-8" />
            <h1 className="font-serif text-2xl font-bold">Norva</h1>
          </div>
          <UserButton afterSignOutUrl="/login" />
        </div>
      </header>

      <main className="container mx-auto p-8">
        <h2 className="mb-6 font-serif text-3xl font-bold">
          Dashboard
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Clients actifs</CardTitle>
              <CardDescription>Nombre total de clients</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emails analysés</CardTitle>
              <CardDescription>Ce mois-ci</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taux de satisfaction</CardTitle>
              <CardDescription>Moyenne générale</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">--</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
