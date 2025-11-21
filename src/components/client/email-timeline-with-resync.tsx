'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'

export function ResyncButton() {
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
    <Button
      onClick={handleReassign}
      variant="ghost"
      size="icon"
      disabled={isReassigning}
      className="h-8 w-8"
    >
      <RefreshCw className={`h-4 w-4 ${isReassigning ? 'animate-spin' : ''}`} />
    </Button>
  )
}
