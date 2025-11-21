/**
 * Health Score Calculation for Norva
 * Calculates a 0-100 health score based on email analysis
 */

interface EmailAnalysis {
  sentiment: 'positive' | 'neutral' | 'negative' | null
  sentiment_score: number | null // -1 to 1
  response_time_hours: number | null
  is_question: boolean
  has_response: boolean
  urgency_level: number | null // 0-10
  received_at: string
}

interface ClientHistory {
  previous_health_score: number | null
  avg_response_time_baseline: number | null // Historical average in hours
  emails_per_week_baseline: number | null
}

/**
 * Calculate health score (0-100) based on email analysis
 *
 * Factors:
 * 1. Sentiment (40% weight) - Positive/neutral/negative balance
 * 2. Response time (30% weight) - How quickly we respond
 * 3. Engagement (20% weight) - Frequency of interactions
 * 4. Unanswered questions (10% malus) - Questions left unanswered
 */
export function calculateHealthScore(
  emails: EmailAnalysis[],
  history?: ClientHistory
): number {
  if (!emails || emails.length === 0) {
    return 50 // Default neutral score for new clients
  }

  let score = 0

  // ============================================
  // Factor 1: Sentiment Analysis (40% weight)
  // ============================================
  const sentimentScores = emails
    .filter((e) => e.sentiment !== null)
    .map((e) => {
      if (e.sentiment === 'positive') return 10
      if (e.sentiment === 'neutral') return 6
      return 2 // negative
    })

  const avgSentiment =
    sentimentScores.length > 0
      ? sentimentScores.reduce((sum, s) => sum + s, 0) / sentimentScores.length
      : 6 // Default to neutral

  score += avgSentiment * 0.4 * 10 // Convert to 0-40 range

  // ============================================
  // Factor 2: Response Time (30% weight)
  // ============================================
  const responseTimeScores = emails
    .filter((e) => e.response_time_hours !== null && e.response_time_hours > 0)
    .map((e) => {
      const hours = e.response_time_hours!
      if (hours < 24) return 10 // Excellent
      if (hours < 48) return 7 // Good
      if (hours < 72) return 4 // Warning
      return 1 // Danger
    })

  const avgResponseTime =
    responseTimeScores.length > 0
      ? responseTimeScores.reduce((sum, s) => sum + s, 0) / responseTimeScores.length
      : 7 // Default to good if no data

  score += avgResponseTime * 0.3 * 10 // Convert to 0-30 range

  // ============================================
  // Factor 3: Engagement Frequency (20% weight)
  // ============================================
  // Check emails in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentEmailsCount = emails.filter(
    (e) => new Date(e.received_at) > sevenDaysAgo
  ).length

  let engagementScore = 10
  if (recentEmailsCount === 0) {
    engagementScore = 3 // Very low engagement
  } else if (recentEmailsCount <= 2) {
    engagementScore = 6 // Low engagement
  } else if (recentEmailsCount <= 5) {
    engagementScore = 8 // Good engagement
  }
  // else 10 - High engagement

  score += engagementScore * 0.2 * 10 // Convert to 0-20 range

  // ============================================
  // Factor 4: Unanswered Questions (malus)
  // ============================================
  const unansweredQuestions = emails.filter(
    (e) => e.is_question && !e.has_response
  ).length

  score -= unansweredQuestions * 5 // -5 points per unanswered question

  // ============================================
  // Factor 5: High Urgency Emails (malus)
  // ============================================
  const urgentEmails = emails.filter((e) => e.urgency_level && e.urgency_level >= 8).length

  score -= urgentEmails * 3 // -3 points per urgent email

  // ============================================
  // Normalize score to 0-100 range
  // ============================================
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Calculate trend (up, down, stable) compared to previous score
 */
export function calculateHealthTrend(
  currentScore: number,
  previousScore: number | null
): { trend: 'up' | 'down' | 'stable'; change: number } {
  if (previousScore === null) {
    return { trend: 'stable', change: 0 }
  }

  const change = currentScore - previousScore

  if (Math.abs(change) < 5) {
    return { trend: 'stable', change }
  }

  return {
    trend: change > 0 ? 'up' : 'down',
    change,
  }
}

/**
 * Get risk level based on health score
 */
export function getRiskLevel(score: number | null): 'urgent' | 'high' | 'normal' {
  if (score === null || score < 40) return 'urgent'
  if (score < 70) return 'high'
  return 'normal'
}

/**
 * Calculate portfolio average health score
 */
export function calculatePortfolioHealth(clientScores: (number | null)[]): {
  average: number
  trend: 'up' | 'down' | 'stable'
} {
  const validScores = clientScores.filter((s): s is number => s !== null)

  if (validScores.length === 0) {
    return { average: 50, trend: 'stable' }
  }

  const average = Math.round(
    validScores.reduce((sum, s) => sum + s, 0) / validScores.length
  )

  // For now, return stable - in future, compare with historical data
  return { average, trend: 'stable' }
}
