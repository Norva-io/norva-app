'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SyncEmailsButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSync = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/emails/sync', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync emails')
      }

      // Rafraîchir la page pour afficher les nouveaux emails
      router.refresh()

      // Optionnel: Afficher un message de succès
      alert(`✅ ${data.emailsSynced} email(s) synchronisé(s)`)
    } catch (error) {
      console.error('Error syncing emails:', error)
      alert('❌ Erreur lors de la synchronisation des emails')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSync} disabled={isLoading} variant="outline" size="sm">
      <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
      {isLoading ? 'Synchronisation...' : 'Synchroniser tous les clients'}
    </Button>
  )
}
