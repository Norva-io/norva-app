'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Mail, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface SyncEmailsSectionProps {
  hasEmailConnected: boolean
  clientsCount: number
}

export function SyncEmailsSection({ hasEmailConnected, clientsCount }: SyncEmailsSectionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    emailsSynced?: number
  } | null>(null)

  const handleSync = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/emails/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync emails')
      }

      setResult({
        success: true,
        message: `${data.emailsSynced} email(s) synchronisé(s) avec succès`,
        emailsSynced: data.emailsSynced,
      })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la synchronisation',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasEmailConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Synchronisation des emails</CardTitle>
          <CardDescription>
            Synchronisez vos emails avec vos clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connectez d&apos;abord votre email pour pouvoir synchroniser vos communications.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (clientsCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Synchronisation des emails</CardTitle>
          <CardDescription>
            Synchronisez vos emails avec vos clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Créez d&apos;abord au moins un client pour pouvoir synchroniser des emails.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/clients/new">Créer mon premier client</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Synchronisation des emails</CardTitle>
        <CardDescription>
          Synchronisez vos emails des 3 derniers jours avec vos clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between rounded-lg border p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">Synchroniser tous les clients</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Récupère les emails des 3 derniers jours pour tous vos clients ({clientsCount} client{clientsCount > 1 ? 's' : ''})
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Limite : 100 emails maximum par synchronisation
              </p>
            </div>
          </div>
          <Button onClick={handleSync} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Synchronisation...' : 'Synchroniser'}
          </Button>
        </div>

        {result && (
          <Alert variant={result.success ? 'default' : 'destructive'}>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        {/* Quota info */}
        <div className="rounded-lg bg-muted p-4 text-sm">
          <h4 className="font-medium">Limites de synchronisation</h4>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• Emails des <strong>3 derniers jours</strong> uniquement</li>
            <li>• Maximum <strong>100 emails par synchronisation</strong></li>
            <li>• Quota Nylas : <strong>500 emails/mois</strong> (plan gratuit)</li>
            <li>• Les emails déjà synchronisés sont ignorés automatiquement</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
