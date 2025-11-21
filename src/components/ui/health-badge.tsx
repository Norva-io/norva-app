/**
 * Health Badge Component
 * Displays health score with color-coded badge
 */

import { getHealthColor, formatHealthScore, getHealthStatusText } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

interface HealthBadgeProps {
  score: number | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HealthBadge({ score, showLabel = false, size = 'md', className }: HealthBadgeProps) {
  const healthColor = getHealthColor(score)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        healthColor.badge,
        sizeClasses[size],
        className
      )}
    >
      <span className="text-xs">{healthColor.icon}</span>
      <span>{formatHealthScore(score)}</span>
      {showLabel && score !== null && (
        <span className="ml-1 text-xs opacity-75">
          {getHealthStatusText(score)}
        </span>
      )}
    </span>
  )
}
