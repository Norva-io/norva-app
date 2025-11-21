/**
 * Risk Indicator Component
 * Shows risk level with icon and optional label
 */

import { getRiskConfig } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

interface RiskIndicatorProps {
  level: 'urgent' | 'high' | 'normal' | null
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RiskIndicator({ level, showLabel = false, size = 'md', className }: RiskIndicatorProps) {
  const riskConfig = getRiskConfig(level)

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        riskConfig.bg,
        riskConfig.color,
        `border ${riskConfig.border}`,
        sizeClasses[size],
        className
      )}
    >
      <span className="text-xs">{riskConfig.icon}</span>
      {showLabel && <span>{riskConfig.label}</span>}
    </span>
  )
}
