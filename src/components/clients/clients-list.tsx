'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlusCircle, ArrowUpDown } from 'lucide-react'
import { ClientCard } from '@/components/clients/client-card'

interface Client {
  id: string
  name: string
  domain: string
  primary_contact_email: string | null
  health_score: number | null
  risk_level: 'urgent' | 'high' | 'normal' | null
  emails_analyzed_count: number | null
  last_interaction_at: string | null
  last_analyzed_at: string | null
  created_at: string
}

interface ClientsListProps {
  initialClients: Client[]
}

type SortBy = 'name' | 'risk' | 'health' | 'last_interaction'

export function ClientsList({ initialClients }: ClientsListProps) {
  const [clients, setClients] = useState<Client[]>(initialClients)
  const [sortBy, setSortBy] = useState<SortBy>('risk')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    const sorted = [...initialClients].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'fr')
          break
        case 'risk':
          // Tri par risk_level: urgent > high > normal
          const riskOrder = { urgent: 0, high: 1, normal: 2, null: 3 }
          const aRisk = riskOrder[a.risk_level || 'null']
          const bRisk = riskOrder[b.risk_level || 'null']
          comparison = aRisk - bRisk
          break
        case 'health':
          // Tri par health_score (les scores nuls en dernier)
          const aScore = a.health_score ?? -1
          const bScore = b.health_score ?? -1
          comparison = aScore - bScore
          break
        case 'last_interaction':
          // Tri par dernière interaction (les plus récents en premier par défaut)
          const aTime = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0
          const bTime = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0
          comparison = bTime - aTime // Inverser pour avoir les plus récents en premier
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
    setClients(sorted)
  }, [sortBy, sortOrder, initialClients])

  const handleDelete = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      // Refresh the page to show updated list
      window.location.reload()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Erreur lors de la suppression du client')
    }
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold">Mes clients</h2>
          <p className="mt-1 text-muted-foreground">
            Suivez la relation avec vos clients
          </p>
        </div>
        <Button asChild>
          <Link href="/clients/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un client
          </Link>
        </Button>
      </div>

      {clients.length > 0 && (
        <div className="mb-4 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Trier par :</span>
            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
              <SelectTrigger className="h-8 w-[160px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="risk" className="text-xs">Priorité (Risque)</SelectItem>
                <SelectItem value="health" className="text-xs">Score de santé</SelectItem>
                <SelectItem value="name" className="text-xs">Nom (A-Z)</SelectItem>
                <SelectItem value="last_interaction" className="text-xs">Dernière interaction</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc" className="text-xs">Croissant</SelectItem>
              <SelectItem value="desc" className="text-xs">Décroissant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {clients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h3 className="mb-2 font-serif text-xl font-semibold">Aucun client pour le moment</h3>
            <p className="mb-6 text-center text-muted-foreground">
              Commencez par ajouter votre premier client
            </p>
            <Button asChild>
              <Link href="/clients/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Ajouter un client
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </>
  )
}
