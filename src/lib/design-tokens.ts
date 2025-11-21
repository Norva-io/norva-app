/**
 * Design Tokens for Norva
 * Semantic colors, priority levels, and health score mappings
 */

export const healthColors = {
  excellent: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800',
    icon: '🟢',
  }, // 70-100
  good: {
    bg: 'bg-blue-50',
    border: 'border-blue-500',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    icon: '🔵',
  }, // 40-69
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: '🟡',
  }, // 20-39
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
    icon: '🔴',
  }, // 0-19
}

export const sentimentColors = {
  positive: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: '😊',
  },
  neutral: {
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    icon: '😐',
  },
  negative: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    icon: '😞',
  },
}

export const priorityLevels = {
  urgent: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: '🔴',
    label: 'Urgent',
  },
  high: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: '🟡',
    label: 'Attention',
  },
  normal: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: '🟢',
    label: 'Stable',
  },
}

export const riskLevels = {
  urgent: {
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: '🔴',
    label: 'Risque élevé',
  },
  high: {
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    icon: '🟡',
    label: 'Attention requise',
  },
  normal: {
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-300',
    icon: '🟢',
    label: 'Stable',
  },
}

/**
 * Get health color configuration based on score (0-100)
 */
export function getHealthColor(score: number | null): typeof healthColors.excellent {
  if (score === null) return healthColors.warning
  if (score >= 70) return healthColors.excellent
  if (score >= 40) return healthColors.good
  if (score >= 20) return healthColors.warning
  return healthColors.danger
}

/**
 * Get risk level configuration
 */
export function getRiskConfig(level: 'urgent' | 'high' | 'normal' | null) {
  if (!level) return riskLevels.normal
  return riskLevels[level]
}

/**
 * Get priority level configuration
 */
export function getPriorityConfig(level: 'urgent' | 'high' | 'normal' | null) {
  if (!level) return priorityLevels.normal
  return priorityLevels[level]
}

/**
 * Get sentiment configuration
 */
export function getSentimentConfig(sentiment: 'positive' | 'neutral' | 'negative' | null) {
  if (!sentiment) return sentimentColors.neutral
  return sentimentColors[sentiment]
}

/**
 * Format health score with trend indicator
 */
export function formatHealthScore(score: number | null): string {
  if (score === null) return '--'
  return `${score}/100`
}

/**
 * Get health status text in French
 */
export function getHealthStatusText(score: number | null): string {
  if (score === null) return 'Non analysé'
  if (score >= 70) return 'Excellente santé'
  if (score >= 40) return 'Stable'
  if (score >= 20) return 'Attention requise'
  return 'Risque critique'
}
