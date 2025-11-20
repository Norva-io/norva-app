import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { NavBar } from '@/components/layout/nav-bar'
import { ClientForm } from '@/components/clients/client-form'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function handleCreateClient(formData: FormData) {
  'use server'

  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur existe dans Supabase
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    redirect('/error-sync')
  }

  const name = formData.get('name') as string
  const domain = formData.get('domain') as string
  const primaryContactEmail = formData.get('primary_contact_email') as string

  // Validation basique
  if (!name || !domain) {
    console.error('Validation error: name and domain are required')
    redirect('/clients/new')
  }

  // Insérer le client
  const { error } = await supabase.from('clients').insert({
    user_id: user.id,
    name,
    domain,
    primary_contact_email: primaryContactEmail || null,
    total_emails_count: 0,
  })

  if (error) {
    console.error('Error creating client:', error)
    redirect('/clients/new')
  }

  redirect('/clients')
}

export default async function NewClientPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur existe dans Supabase
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
    redirect('/error-sync')
  }

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto max-w-2xl p-8">
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour aux clients
            </Link>
          </Button>
          <h2 className="font-serif text-3xl font-bold">Ajouter un client</h2>
          <p className="mt-1 text-muted-foreground">
            Créez un client test pour commencer l'analyse
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du client</CardTitle>
            <CardDescription>
              Renseignez les informations de base de votre client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientForm action={handleCreateClient} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}