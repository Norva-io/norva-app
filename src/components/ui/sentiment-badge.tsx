/**
 * Sentiment Badge Component
 * Shows email sentiment with icon
 */

import { getSentimentConfig } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

interface SentimentBadgeProps {
  sentiment: 'positive' | 'neutral' | 'negative' | null
  showLabel?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function SentimentBadge({ sentiment, showLabel = false, size = 'sm', className }: SentimentBadgeProps) {
  const config = getSentimentConfig(sentiment)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  }

  const labels = {
    positive: 'Positif',
    neutral: 'Neutre',
    negative: 'Négatif',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        config.bg,
        config.color,
        sizeClasses[size],
        className
      )}
    >
      <span>{config.icon}</span>
      {showLabel && sentiment && <span>{labels[sentiment]}</span>}
    </span>
  )
}
