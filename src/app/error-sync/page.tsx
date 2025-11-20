import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ErrorSyncPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="font-serif text-2xl">
            Erreur de synchronisation
          </CardTitle>
          <CardDescription>
            Votre compte n&apos;a pas pu être créé correctement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              Il semble y avoir eu un problème lors de la création de votre compte.
              Cela peut être dû à un problème temporaire de connexion.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Que faire?</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">1.</span>
                <span>Déconnectez-vous et reconnectez-vous</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">2.</span>
                <span>Attendez quelques secondes et réessayez</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">3.</span>
                <span>Si le problème persiste, contactez le support</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/login">
                Se reconnecter
              </Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/">
                Retour à l&apos;accueil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}