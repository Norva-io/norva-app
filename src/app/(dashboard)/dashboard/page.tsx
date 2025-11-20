import { UserButton } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="font-serif text-2xl font-bold">Norva</h1>
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
