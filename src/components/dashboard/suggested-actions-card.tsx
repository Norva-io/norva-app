/**
 * Suggested Actions Card
 * Shows top 3 priority actions for the user today
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getPriorityConfig } from '@/lib/design-tokens'
import { CheckCircle2, ArrowRight } from 'lucide-react'

interface SuggestedAction {
  id: string
  client_id: string
  client_name: string
  title: string
  description?: string
  priority: 'urgent' | 'high' | 'normal'
  status: 'pending' | 'done' | 'snoozed'
}

interface SuggestedActionsCardProps {
  actions: SuggestedAction[]
  totalPending: number
}

export function SuggestedActionsCard({ actions: initialActions, totalPending }: SuggestedActionsCardProps) {
  const router = useRouter()
  const [actions, setActions] = useState(initialActions)
  const [completing, setCompleting] = useState<string | null>(null)

  const displayActions = actions.slice(0, 3) // Show max 3

  const handleMarkDone = async (actionId: string) => {
    setCompleting(actionId)
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' }),
      })

      if (response.ok) {
        // Remove the action from the list
        setActions((prev) => prev.filter((a) => a.id !== actionId))
        router.refresh()
      }
    } catch (error) {
      console.error('Error marking action as done:', error)
    } finally {
      setCompleting(null)
    }
  }

  return (
    <Card className="relative overflow-hidden border-l-4 border-l-accent">
      <CardHeader className="pb-3">
        <CardDescription className="text-sm font-medium uppercase tracking-wide">
          Actions Suggérées
        </CardDescription>
        <CardTitle className="mt-2 font-serif text-3xl">{totalPending}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayActions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            🎉 Aucune action en attente pour le moment
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {displayActions.map((action) => {
                const priorityConfig = getPriorityConfig(action.priority)

                return (
                  <div
                    key={action.id}
                    className={`rounded-lg border p-3 ${priorityConfig.bg} ${priorityConfig.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={completing === action.id}
                        onCheckedChange={() => handleMarkDone(action.id)}
                        disabled={completing !== null}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <Link href={`/clients/${action.client_id}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{priorityConfig.icon}</span>
                            <span className="text-xs font-medium text-muted-foreground">
                              {action.client_name}
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-medium hover:underline">
                            {action.title}
                          </p>
                          {action.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {action.description}
                            </p>
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {totalPending > displayActions.length && (
              <Link href="/actions" className="block">
                <Button variant="ghost" size="sm" className="w-full">
                  Voir toutes les actions ({totalPending})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
