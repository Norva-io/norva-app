/**
 * Client Insights List Component
 * Enhanced insights display with priority and actions
 */

import { getPriorityConfig } from '@/lib/design-tokens'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

interface Insight {
  id: string
  insight_type: 'warning' | 'info' | 'success'
  priority_level?: 'urgent' | 'high' | 'normal' | null
  insight_text: string
  category?: string | null
  suggested_action?: string | null
  created_at: string
}

interface ClientInsightsListProps {
  insights: Insight[]
  onDismiss?: (insightId: string) => void
}

export function ClientInsightsList({ insights, onDismiss }: ClientInsightsListProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-20" />
        <p>Aucun insight disponible</p>
        <p className="text-sm">
          Les insights seront générés automatiquement lors de l&apos;analyse
        </p>
      </div>
    )
  }

  const getInsightIcon = (type: string, priorityLevel: string | null) => {
    if (type === 'warning' || priorityLevel === 'urgent') {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    }
    if (type === 'success') {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    return <Info className="h-5 w-5 text-blue-600" />
  }

  const getInsightBorderColor = (type: string, priorityLevel: string | null) => {
    if (type === 'warning' || priorityLevel === 'urgent') {
      return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20'
    }
    if (type === 'success') {
      return 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20'
    }
    return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => {
        const priorityConfig = insight.priority_level
          ? getPriorityConfig(insight.priority_level)
          : null

        return (
          <div
            key={insight.id}
            className={`rounded-lg border-l-4 p-3 ${getInsightBorderColor(
              insight.insight_type,
              insight.priority_level || null
            )}`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                {getInsightIcon(insight.insight_type, insight.priority_level || null)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {priorityConfig && (
                      <span className="text-xs">{priorityConfig.icon}</span>
                    )}
                    <p className="text-sm font-medium">{insight.insight_text}</p>
                  </div>

                  {/* Category */}
                  {insight.category && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {insight.category}
                    </Badge>
                  )}

                  {/* Suggested Action */}
                  {insight.suggested_action && (
                    <div className="mt-2 rounded-md bg-background/80 p-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Action suggérée:
                      </div>
                      <div className="mt-0.5 text-xs">{insight.suggested_action}</div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-1.5 text-xs text-muted-foreground">
                    Détecté{' '}
                    {new Date(insight.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                </div>
              </div>

              {/* Dismiss button */}
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(insight.id)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
