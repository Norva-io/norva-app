'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Loader2 } from 'lucide-react'

interface ClientHeaderActionsProps {
  clientId: string
  clientName: string
}

export function ClientHeaderActions({ clientId, clientName }: ClientHeaderActionsProps) {
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

      router.push('/clients')
      router.refresh()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Erreur lors de la suppression du client')
      setIsDeleting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <MoreVertical className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
