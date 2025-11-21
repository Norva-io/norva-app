/**
 * Client Health Overview Component
 * Shows health score, trend, and key metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getHealthColor } from '@/lib/design-tokens'
import { Calendar, Mail } from 'lucide-react'

interface ClientHealthOverviewProps {
  healthScore: number | null
  riskLevel: 'urgent' | 'high' | 'normal' | null
  lastInteractionAt: string | null
  emailsAnalyzedCount: number
  lastAnalyzedAt: string | null
}

export function ClientHealthOverview({
  healthScore,
  riskLevel,
  lastInteractionAt,
  emailsAnalyzedCount,
  lastAnalyzedAt,
}: ClientHealthOverviewProps) {
  const healthColor = getHealthColor(healthScore)

  // Format last interaction
  const formatLastInteraction = (date: string | null) => {
    if (!date) return 'Aucune interaction'

    const now = new Date()
    const interaction = new Date(date)
    const diffDays = Math.floor((now.getTime() - interaction.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Aujourd\'hui'
    if (diffDays === 1) return 'Hier'
    if (diffDays < 7) return 'Il y a ' + diffDays + ' jours'
    if (diffDays < 30) return 'Il y a ' + Math.floor(diffDays / 7) + ' semaines'
    return 'Il y a ' + Math.floor(diffDays / 30) + ' mois'
  }

  return (
    <Card className={'border-l-4 ' + healthColor.border}>
      <CardHeader>
        <CardTitle>Vue d'ensemble santé</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Health Score Display */}
        <div className="text-center">
          <div className={'font-serif text-5xl font-bold ' + healthColor.text}>
            {healthScore !== null ? healthScore : '--'}
          </div>
          <div className="text-sm text-muted-foreground mt-1">/100</div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          {/* Last Interaction */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Dernière interaction</span>
            </div>
            <div className="mt-1 text-sm font-medium">
              {formatLastInteraction(lastInteractionAt)}
            </div>
          </div>

          {/* Emails Analyzed */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Emails analysés</span>
            </div>
            <div className="mt-1 text-sm font-medium">
              {emailsAnalyzedCount} email{emailsAnalyzedCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
