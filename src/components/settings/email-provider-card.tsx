'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail } from 'lucide-react'

interface EmailProviderCardProps {
  provider: 'outlook' | 'gmail'
  name: string
  description: string
  isConnected: boolean
  connectedAt: string | null
  connectUrl: string
  disabled?: boolean
}

export function EmailProviderCard({
  provider,
  name,
  description,
  isConnected,
  connectedAt,
  connectUrl,
  disabled = false,
}: EmailProviderCardProps) {
  const providerColors = {
    outlook: 'bg-blue-100 text-blue-700',
    gmail: 'bg-red-100 text-red-700',
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${providerColors[provider]}`}>
          <Mail className="h-6 w-6" />
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>
            {isConnected && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {isConnected && connectedAt && (
            <p className="mt-1 text-xs text-green-600">
              Connecté le {new Date(connectedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div>
        {isConnected ? (
          <Button variant="outline" size="sm" disabled>
            Connecté
          </Button>
        ) : (
          <Link href={connectUrl}>
            <Button size="sm" disabled={disabled}>
              {disabled ? 'Bientôt disponible' : 'Connecter'}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}