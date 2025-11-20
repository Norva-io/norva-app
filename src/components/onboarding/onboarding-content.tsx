'use client'

import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function OnboardingContent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-serif text-2xl">
            Bienvenue sur Norva! 👋
          </CardTitle>
          <CardDescription>
            Connectez votre boîte mail pour commencer à analyser vos échanges clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="mb-2 font-semibold">Pourquoi connecter ma boîte mail?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Analyse automatique des échanges avec vos clients</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Détection des signaux faibles (satisfaction, churn)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Insights IA en temps réel sur la santé de vos comptes</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                // TODO: Trigger Nylas OAuth flow
                window.location.href = '/api/auth/outlook'
              }}
            >
              <Mail className="mr-2 h-5 w-5" />
              Connecter Outlook / Office 365
            </Button>

            <Button
              variant="outline"
              className="w-full"
              size="lg"
              disabled
            >
              <Mail className="mr-2 h-5 w-5" />
              Connecter Gmail (bientôt disponible)
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Vos données sont chiffrées et sécurisées. Nous n&apos;accédons qu&apos;aux emails
            nécessaires à l&apos;analyse.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}