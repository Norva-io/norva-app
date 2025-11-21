'use client'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import type { Email } from '@/types/database'

interface EmailListProps {
  emails: Email[]
}

export function EmailList({ emails }: EmailListProps) {
  if (emails.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <Mail className="mx-auto mb-3 h-12 w-12 opacity-20" />
        <p>Aucun email trouvé pour ce client</p>
        <p className="text-sm">Les emails des 3 derniers jours apparaîtront ici</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {emails.map((email) => (
        <Card key={email.id} className="p-4 transition-shadow hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Sujet */}
              <h4 className="truncate font-medium">
                {email.subject || '(Sans sujet)'}
              </h4>

              {/* De */}
              <p className="mt-1 text-sm text-muted-foreground">
                De: {email.from_email}
              </p>

              {/* Preview */}
              {email.preview && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {email.preview}
                </p>
              )}

              {/* Sentiment badge */}
              {email.sentiment && (
                <div className="mt-3">
                  <Badge
                    variant="secondary"
                    className={
                      email.sentiment === 'positive'
                        ? 'bg-positive-bg text-positive-text'
                        : email.sentiment === 'negative'
                        ? 'bg-negative-bg text-negative-text'
                        : 'bg-neutral-bg text-neutral-text'
                    }
                  >
                    {email.sentiment === 'positive'
                      ? '😊 Positif'
                      : email.sentiment === 'negative'
                      ? '😟 Négatif'
                      : '😐 Neutre'}
                    {email.sentiment_score !== null && ` (${email.sentiment_score})`}
                  </Badge>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="flex-shrink-0 text-right text-xs text-muted-foreground">
              {new Date(email.sent_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}