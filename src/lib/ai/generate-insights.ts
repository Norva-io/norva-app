/**
 * AI-powered insight generation using Claude
 */

import Anthropic from '@anthropic-ai/sdk'

export interface Email {
  id: string
  subject: string | null
  from_email: string
  to_emails: string[] | null
  received_at: string
  sent_at: string
  sentiment: 'positive' | 'neutral' | 'negative' | null
  sentiment_score: number | null
  preview: string | null
  is_question?: boolean
  urgency_level?: number | null
}

export interface Insight {
  priority_level: 'urgent' | 'high' | 'normal'
  type: 'risk' | 'opportunity' | 'info'
  title: string
  description: string
  suggested_action: string | null
  category: string // 'engagement', 'sentiment', 'resolution', etc.
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * Generate actionable insights from client emails using Claude
 */
export async function generateClientInsights(
  clientName: string,
  emails: Email[],
  healthScore: number | null
): Promise<Insight[]> {
  if (!emails || emails.length === 0) {
    return []
  }

  // Prepare email summary for Claude
  const emailsSummary = emails
    .slice(0, 20) // Limit to most recent 20 emails to avoid token limits
    .map((e, idx) => {
      const date = new Date(e.received_at).toLocaleDateString('fr-FR')
      const sentiment = e.sentiment ? `[${e.sentiment}]` : ''
      return `${idx + 1}. ${date} - De: ${e.from_email}
Sujet: ${e.subject || '(pas de sujet)'}
Sentiment: ${sentiment}
Aperçu: ${e.preview || '(pas de contenu disponible)'}`
    })
    .join('\n\n')

  const prompt = `Tu es un assistant IA pour Customer Success Managers utilisant Norva.

Analyse les emails suivants avec le client "${clientName}" et génère 3-5 insights actionnables.

**Score de santé actuel**: ${healthScore !== null ? `${healthScore}/100` : 'Non calculé'}

**Emails récents (${emails.length} au total):**
${emailsSummary}

**Instructions:**
1. Identifie les signaux importants :
   - 🔴 Signaux de risque (frustration, problèmes non résolus, silence inhabituel, demandes urgentes)
   - 🟡 Points d'attention (baisse d'engagement, questions sans réponse, délais de réponse longs)
   - 🟢 Opportunités (satisfaction élevée, demandes de features, recommandations, expansion possible)

2. Pour chaque insight, fournis:
   - Un titre court et accrocheur
   - Une description claire du problème/opportunité
   - Une action concrète que le CSM peut faire MAINTENANT

3. Priorise les insights par urgence (urgent > high > normal)

4. Sois spécifique et factuel (cite des dates, nombre d'emails, etc.)

5. Parle en français, de manière professionnelle mais accessible

**Format JSON attendu:**
{
  "insights": [
    {
      "priority_level": "urgent" | "high" | "normal",
      "type": "risk" | "opportunity" | "info",
      "title": "Titre court (max 60 caractères)",
      "description": "Description détaillée du problème/opportunité",
      "suggested_action": "Action concrète à faire (ex: Appeler le client, Envoyer un email de suivi, etc.)",
      "category": "engagement" | "sentiment" | "resolution" | "expansion" | "technical"
    }
  ]
}

Génère maintenant les insights:`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for more consistent output
      messages: [{ role: 'user', content: prompt }],
    })

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : ''

    // Extract JSON from response (Claude might add explanation before/after)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.error('No JSON found in Claude response:', responseText)
      return []
    }

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.insights || !Array.isArray(parsed.insights)) {
      console.error('Invalid insights format:', parsed)
      return []
    }

    return parsed.insights as Insight[]
  } catch (error) {
    console.error('Error generating insights with Claude:', error)
    return []
  }
}

/**
 * Generate suggested actions from insights
 */
export function generateSuggestedActions(
  clientId: string,
  insights: Insight[]
): Array<{
  client_id: string
  title: string
  description: string
  priority: 'urgent' | 'high' | 'normal'
}> {
  return insights
    .filter((insight) => insight.suggested_action)
    .map((insight) => ({
      client_id: clientId,
      title: insight.suggested_action!,
      description: insight.description,
      priority: insight.priority_level,
    }))
}
