/**
 * Email Timeline Component
 * Enhanced email list with sentiment badges
 */

import { SentimentBadge } from '@/components/ui/sentiment-badge'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Mail, AlertCircle } from 'lucide-react'

interface Email {
  id: string
  subject: string | null
  from_email: string
  received_at: string
  sentiment: 'positive' | 'neutral' | 'negative' | null
  preview: string | null
  is_question?: boolean
  urgency_level?: number | null
}

interface EmailTimelineProps {
  emails: Email[]
  clientDomain: string
  clientName: string
}

export function EmailTimeline({ emails, clientDomain, clientName }: EmailTimelineProps) {
  if (!emails || emails.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
        <p>Aucun email disponible</p>
        <p className="text-sm">Les emails apparaîtront après la synchronisation</p>
      </div>
    )
  }

  // Determine if email is from client or to client
  const isFromClient = (email: Email) => {
    return email.from_email.includes(clientDomain)
  }

  return (
    <div className="space-y-4">
      {emails.map((email) => {
        const fromClient = isFromClient(email)
        const timeAgo = formatDistanceToNow(new Date(email.received_at), {
          addSuffix: true,
          locale: fr,
        })

        return (
          <div
            key={email.id}
            className={`rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
              fromClient ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-gray-300'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={fromClient ? 'default' : 'secondary'} className="text-xs">
                    {fromClient ? `De: ${clientName}` : 'Vous'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo}</span>
                </div>

                <h4 className="font-medium text-sm">
                  {email.subject || '(Pas de sujet)'}
                </h4>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
