/**
 * Empty State Components
 * Used throughout the app for zero-data states
 */

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-6xl">{icon}</div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">{description}</p>
        {action && (
          <Button onClick={action.onClick} variant="outline">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

interface AnalyzingStateProps {
  clientName?: string
  message?: string
}

export function AnalyzingState({ clientName, message }: AnalyzingStateProps) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-blue-600" />
        <h3 className="mb-2 text-lg font-semibold text-blue-900">Analyse en cours...</h3>
        <p className="max-w-md text-sm text-blue-700">
          {message ||
            `Nous analysons vos échanges${clientName ? ` avec ${clientName}` : ''}.
            Cela prend généralement 1-2 minutes.`}
        </p>
      </CardContent>
    </Card>
  )
}

export function DashboardEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-6xl">🚀</div>
        <h3 className="mb-2 text-xl font-semibold">Bienvenue sur Norva !</h3>
        <p className="mb-6 max-w-lg text-muted-foreground">
          Nous synchronisons vos emails pour détecter les signaux importants.
          Première analyse prête dans ~5 minutes.
        </p>
        <div className="mb-6 w-full max-w-md">
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full animate-pulse bg-accent"
              style={{ width: '60%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Synchronisation en cours...</p>
        </div>
        <p className="text-sm text-muted-foreground">
          💡 En attendant, vous pouvez ajouter plus de clients dans la section Clients
        </p>
      </CardContent>
    </Card>
  )
}

interface ClientNoInsightsStateProps {
  clientName: string
  isAnalyzing: boolean
  onSyncNow?: () => void
}

export function ClientNoInsightsState({ clientName, isAnalyzing, onSyncNow }: ClientNoInsightsStateProps) {
  if (isAnalyzing) {
    return <AnalyzingState clientName={clientName} />
  }

  return (
    <EmptyState
      icon="📭"
      title="Pas encore d'insights"
      description={`Nous n'avons pas détecté d'emails récents avec ${clientName}.
        Les insights apparaîtront dès la prochaine synchronisation.`}
      action={
        onSyncNow
          ? {
              label: 'Synchroniser maintenant',
              onClick: onSyncNow,
            }
          : undefined
      }
    />
  )
}
