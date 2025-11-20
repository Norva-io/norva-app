import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft } from 'lucide-react'

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
            <form action={handleCreateClient} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom du client <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ex: ACME Corp"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Le nom de l'entreprise ou de l'organisation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">
                  Domaine email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="domain"
                  name="domain"
                  type="text"
                  placeholder="Ex: acme.com"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Le domaine utilisé dans les emails (sans @)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_contact_email">
                  Email du contact principal
                </Label>
                <Input
                  id="primary_contact_email"
                  name="primary_contact_email"
                  type="email"
                  placeholder="Ex: john@acme.com"
                />
                <p className="text-xs text-muted-foreground">
                  Optionnel : L'email principal de votre contact
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Créer le client
                </Button>
                <Button asChild type="button" variant="outline">
                  <Link href="/clients">Annuler</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}