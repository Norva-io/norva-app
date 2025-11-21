import { AlertCircle, LogOut } from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'
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
              Il semble y avoir eu un problème lors de la création de votre compte dans notre système.
              Cela peut être dû à un problème temporaire de connexion avec la base de données.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Solution recommandée</h3>
            <p className="text-sm text-muted-foreground">
              Déconnectez-vous et reconnectez-vous pour réinitialiser votre session.
              Votre compte sera automatiquement créé lors de la prochaine connexion.
            </p>
          </div>

          <SignOutButton redirectUrl="/login">
            <Button className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </SignOutButton>
        </CardContent>
      </Card>
    </div>
  )
}