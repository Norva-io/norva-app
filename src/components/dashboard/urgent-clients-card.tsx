/**
 * Urgent Clients Card
 * Shows top 3-5 clients that need attention
 */

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RiskIndicator } from '@/components/ui/risk-indicator'
import { HealthBadge } from '@/components/ui/health-badge'
import { ArrowRight } from 'lucide-react'

interface UrgentClient {
  id: string
  name: string
  health_score: number | null
  risk_level: 'urgent' | 'high' | 'normal' | null
  urgent_reason?: string
}

interface UrgentClientsCardProps {
  clients: UrgentClient[]
  totalAtRisk: number
}

export function UrgentClientsCard({ clients, totalAtRisk }: UrgentClientsCardProps) {
  const displayClients = clients.slice(0, 5) // Show max 5

  return (
    <Card className="relative overflow-hidden border-l-4 border-l-red-500">
      <CardHeader className="pb-3">
        <CardDescription className="text-sm font-medium uppercase tracking-wide">
          Clients Prioritaires
        </CardDescription>
        <CardTitle className="mt-2 font-serif text-3xl">{totalAtRisk}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayClients.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            🎉 Aucun client nécessitant une attention urgente
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {displayClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="block rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <RiskIndicator level={client.risk_level} />
                        <h4 className="truncate font-medium">{client.name}</h4>
                      </div>
                      {client.urgent_reason && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                          {client.urgent_reason}
                        </p>
                      )}
                    </div>
                    <HealthBadge score={client.health_score} size="sm" />
                  </div>
                </Link>
              ))}
            </div>

            {totalAtRisk > displayClients.length && (
              <Link href="/clients?filter=at-risk" className="block">
                <Button variant="ghost" size="sm" className="w-full">
                  Voir tous les clients à risque ({totalAtRisk})
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
