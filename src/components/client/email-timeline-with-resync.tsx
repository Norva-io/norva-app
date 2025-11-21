'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { EmailTimeline } from './email-timeline'

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

interface EmailTimelineWithResyncProps {
  emails: Email[]
  clientDomain: string
  clientName: string
}

export function EmailTimelineWithResync({ emails, clientDomain, clientName }: EmailTimelineWithResyncProps) {
  const router = useRouter()
  const [isReassigning, setIsReassigning] = useState(false)

  const handleReassign = async () => {
    setIsReassigning(true)

    try {
      const response = await fetch('/api/emails/reassign', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reassign emails')
      }

      alert(`${data.emailsReassigned} email(s) réattribué(s) avec succès`)
      router.refresh()
    } catch (error) {
      console.error('Error reassigning emails:', error)
      alert('Erreur lors de la réattribution des emails')
    } finally {
      setIsReassigning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handleReassign}
          variant="outline"
          size="sm"
          disabled={isReassigning}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isReassigning ? 'animate-spin' : ''}`} />
          {isReassigning ? 'Analyse...' : 'Analyser'}
        </Button>
      </div>
      <EmailTimeline emails={emails} clientDomain={clientDomain} clientName={clientName} />
    </div>
  )
}
