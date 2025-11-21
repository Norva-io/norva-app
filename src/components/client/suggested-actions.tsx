'use client'

/**
 * Suggested Actions Component
 * Displays AI-suggested actions as a to-do list for the client
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Clock, AlertCircle } from 'lucide-react'

interface SuggestedAction {
  id: string
  title: string
  description?: string
  priority: 'high' | 'medium' | 'low'
  completed: boolean
  dueDate?: string
}

interface SuggestedActionsProps {
  actions: SuggestedAction[]
  onToggleAction?: (actionId: string) => void
}

export function SuggestedActions({ actions = [], onToggleAction }: SuggestedActionsProps) {
  const priorityConfig = {
    high: {
      label: 'Urgent',
      variant: 'destructive' as const,
      icon: AlertCircle,
    },
    medium: {
      label: 'Important',
      variant: 'default' as const,
      icon: Clock,
    },
    low: {
      label: 'Bientôt',
      variant: 'secondary' as const,
      icon: Clock,
    },
  }

  // Mock data pour la démonstration
  const mockActions: SuggestedAction[] = [
    {
      id: '1',
      title: 'Répondre à la demande de devis',
      description: 'Email reçu il y a 2 jours sans réponse',
      priority: 'high',
      completed: false,
    },
    {
      id: '2',
      title: 'Planifier un point mensuel',
      description: 'Pas de contact depuis 3 semaines',
      priority: 'medium',
      completed: false,
    },
    {
      id: '3',
      title: 'Envoyer la documentation produit',
      description: 'Mentionné dans le dernier échange',
      priority: 'low',
      completed: false,
    },
  ]

  const displayActions = actions.length > 0 ? actions : mockActions
  const pendingActions = displayActions.filter((a) => !a.completed)
  const completedActions = displayActions.filter((a) => a.completed)

  if (displayActions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Actions suggérées</CardTitle>
          </div>
          <CardDescription>
            Norva vous proposera des actions basées sur les emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-sm text-muted-foreground">
            <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-20" />
            <p>Aucune action suggérée pour le moment</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Actions suggérées</CardTitle>
        </div>
        <CardDescription>
          {pendingActions.length} action{pendingActions.length > 1 ? 's' : ''} en attente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Actions en attente */}
        {pendingActions.map((action) => {
          const config = priorityConfig[action.priority]
          const Icon = config.icon

          return (
            <div
              key={action.id}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Checkbox
                checked={action.completed}
                onCheckedChange={() => onToggleAction?.(action.id)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">{action.title}</p>
                  <Badge variant={config.variant} className="text-xs">
                    <Icon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
                {action.description && (
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                )}
              </div>
            </div>
          )
        })}

        {/* Actions complétées */}
        {completedActions.length > 0 && (
          <>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Complété ({completedActions.length})
              </p>
            </div>
            {completedActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-lg border p-3 opacity-50"
              >
                <Checkbox
                  checked={action.completed}
                  onCheckedChange={() => onToggleAction?.(action.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none line-through">{action.title}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
