'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash2, Pencil } from 'lucide-react'

interface ClientCardProps {
  client: {
    id: string
    name: string
    domain: string
    primary_contact_email: string | null
    health_score: number | null
    health_status: string | null
    total_emails_count: number | null
  }
  onDelete: (clientId: string) => Promise<void>
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const healthColor =
    client.health_status === 'healthy' ? 'border-l-green-500' :
    client.health_status === 'stable' ? 'border-l-yellow-500' :
    'border-l-red-500'

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/clients/${client.id}/edit`)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${client.name} ?`)) {
      return
    }

    setIsDeleting(true)

    try {
      await onDelete(client.id)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      alert('Erreur lors de la suppression du client')
      setIsDeleting(false)
    }
  }

  return (
    <Link href={`/clients/${client.id}`} className="block">
      <Card className={`relative overflow-hidden border-l-4 ${healthColor} transition-shadow hover:shadow-md ${isDeleting ? 'opacity-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="font-serif text-xl">{client.name}</CardTitle>
              <CardDescription className="text-xs">
                {client.domain}
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={isDeleting}
                >
                  <MoreVertical className="h-4 w-4" />
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
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {client.primary_contact_email && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Contact:</span> {client.primary_contact_email}
            </div>
          )}

          {client.health_score !== null ? (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Santé</span>
              <span className="font-serif text-2xl font-bold">{client.health_score}</span>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Pas encore analysé
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            {client.total_emails_count || 0} email(s) analysé(s)
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}