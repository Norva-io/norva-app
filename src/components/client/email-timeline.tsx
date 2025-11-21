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
}

export function EmailTimeline({ emails, clientDomain }: EmailTimelineProps) {
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
            className={`rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
              fromClient ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-gray-300'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={fromClient ? 'default' : 'secondary'} className="text-xs">
                    {fromClient ? 'De: Client' : 'Vous'}
                  </Badge>
                  {email.sentiment && <SentimentBadge sentiment={email.sentiment} />}
                  {email.is_question && (
                    <Badge variant="outline" className="text-xs">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Question
                    </Badge>
                  )}
                  {email.urgency_level && email.urgency_level >= 8 && (
                    <Badge variant="destructive" className="text-xs">
                      Urgent
                    </Badge>
                  )}
                </div>

                <h4 className="mt-2 font-medium">
                  {email.subject || '(Pas de sujet)'}
                </h4>

                {email.preview && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {email.preview}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="text-xs text-muted-foreground">{timeAgo}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{email.from_email}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
