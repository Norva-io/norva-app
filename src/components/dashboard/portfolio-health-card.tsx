/**
 * Portfolio Health Card
 * Shows overall portfolio health score with trend
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getHealthColor } from '@/lib/design-tokens'
import { Info } from 'lucide-react'

interface PortfolioHealthCardProps {
  averageScore: number | null
  trend: 'up' | 'down' | 'stable'
  change?: number
}

export function PortfolioHealthCard({ averageScore, trend, change = 0 }: PortfolioHealthCardProps) {
  const healthColor = getHealthColor(averageScore)

  // Emoji basé sur le score
  const getEmoji = () => {
    if (averageScore === null) return '📊'
    if (averageScore >= 70) return '✅'
    if (averageScore >= 40) return '⚠️'
    return '🚨'
  }

  // Déterminer la couleur de bordure gauche uniquement
  const borderLeftClass =
    averageScore === null ? 'border-l-yellow-500' :
    averageScore >= 70 ? 'border-l-green-500' :
    averageScore >= 40 ? 'border-l-blue-500' :
    'border-l-yellow-500'

  return (
    <Card className={`relative overflow-hidden border-l-4 ${borderLeftClass}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-1.5">
          <CardDescription className="text-sm font-medium uppercase tracking-wide">
            Santé du Portfolio
          </CardDescription>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex items-center justify-center ml-0.5">
                  <Info className="h-3 w-3 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" sideOffset={5}>
                <p className="text-xs max-w-xs">
                  <strong>Calcul du score de santé :</strong><br />
                  • Sentiment des emails (40%)<br />
                  • Temps de réponse (30%)<br />
                  • Fréquence d'engagement (20%)<br />
                  • Questions sans réponse (malus)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="mt-2">
          <CardTitle className="font-serif text-3xl">
            {averageScore !== null ? `${averageScore}/100` : '--'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span>{getEmoji()}</span>
          <span>
            {averageScore === null
              ? 'Aucune donnée disponible'
              : averageScore >= 70
              ? 'Portfolio en excellente santé'
              : averageScore >= 40
              ? 'Portfolio stable'
              : 'Attention requise sur plusieurs clients'}
          </span>
        </p>
      </CardContent>
    </Card>
  )
}
