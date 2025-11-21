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
import { HealthBadge } from '@/components/ui/health-badge'
import { getHealthColor } from '@/lib/design-tokens'
import { MoreVertical, Trash2, Pencil, Mail, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ClientCardProps {
  client: {
    id: string
    name: string
    domain: string
    primary_contact_email: string | null
    health_score: number | null
    risk_level: 'urgent' | 'high' | 'normal' | null
    emails_analyzed_count: number | null
    last_interaction_at: string | null
  }
  onDelete: (clientId: string) => Promise<void>
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Déterminer la couleur de bordure basée sur le health score
  const healthColor = getHealthColor(client.health_score)
  const borderColorClass = healthColor.border.replace('border-', 'border-l-')

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push('/clients/' + client.id + '/edit')
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Êtes-vous sûr de vouloir supprimer ' + client.name + ' ?')) {
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

  // Format last interaction
  const formatLastInteraction = () => {
    if (!client.last_interaction_at) return 'Aucune interaction'

    return formatDistanceToNow(new Date(client.last_interaction_at), {
      addSuffix: true,
      locale: fr,
    })
  }

  return (
    <Link href={'/clients/' + client.id} className="block">
      <Card className={'relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer border-l-4 ' + borderColorClass + (isDeleting ? ' opacity-50' : '')}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="font-serif text-xl">{client.name}</CardTitle>
              <CardDescription className="text-xs mt-1">
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
              <span className="text-sm font-medium">Score de santé</span>
              <HealthBadge score={client.health_score} size="md" />
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Pas encore analysé
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              <span>{client.emails_analyzed_count || 0} emails</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatLastInteraction()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
