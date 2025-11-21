import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
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

async function handleUpdateClient(clientId: string, formData: FormData) {
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
    redirect(`/clients/${clientId}/edit`)
  }

  // Mettre à jour le client (avec vérification ownership)
  const { error } = await supabase
    .from('clients')
    .update({
      name,
      domain,
      primary_contact_email: primaryContactEmail || null,
    })
    .eq('id', clientId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating client:', error)
    redirect(`/clients/${clientId}/edit`)
  }

  redirect(`/clients/${clientId}`)
}

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  const { id } = await params

  // Vérifier que l'utilisateur existe dans Supabase
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single()

  if (!user) {
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

  return (
    <div className="min-h-screen">
      <NavBar />

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="mb-4">
            <Link href={`/clients/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au client
            </Link>
          </Button>
          <h2 className="font-serif text-3xl font-bold">Modifier le client</h2>
          <p className="mt-1 text-muted-foreground">
            Mettez à jour les informations de {client.name}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations du client</CardTitle>
            <CardDescription>
              Modifiez les informations de base de votre client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ClientForm
              action={handleUpdateClient.bind(null, id)}
              initialData={{
                name: client.name,
                domain: client.domain,
                primary_contact_email: client.primary_contact_email || '',
              }}
              submitLabel="Modifier le client"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
