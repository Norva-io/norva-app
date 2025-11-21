'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Loader2 } from 'lucide-react'

interface ClientActionsProps {
  clientId: string
  clientName: string
}

export function ClientActions({ clientId, clientName }: ClientActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    router.push(`/clients/${clientId}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${clientName}" ?\n\nCette action est irréversible et supprimera également tous les emails et insights associés.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      // Redirect to clients list
      router.push('/clients')
      router.refresh()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Erreur lors de la suppression du client')
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleEdit}
        variant="outline"
        className="w-full justify-start"
      >
        <Pencil className="mr-2 h-4 w-4" />
        Modifier les informations
      </Button>
      <Button
        onClick={handleDelete}
        variant="outline"
        className="w-full justify-start text-destructive hover:bg-destructive hover:text-destructive-foreground"
        disabled={isDeleting}
      >
        {isDeleting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Suppression...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer le client
          </>
        )}
      </Button>
    </div>
  )
}
