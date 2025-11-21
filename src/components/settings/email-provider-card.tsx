'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail, Loader2 } from 'lucide-react'

interface EmailProviderCardProps {
  provider: 'outlook' | 'gmail'
  name: string
  description: string
  isConnected: boolean
  connectedAt: string | null
  connectUrl: string
  disconnectUrl?: string
  disabled?: boolean
}

export function EmailProviderCard({
  provider,
  name,
  description,
  isConnected,
  connectedAt,
  connectUrl,
  disconnectUrl,
  disabled = false,
}: EmailProviderCardProps) {
  const router = useRouter()
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const providerColors = {
    outlook: 'bg-blue-100 text-blue-700',
    gmail: 'bg-red-100 text-red-700',
  }

  const handleDisconnect = async () => {
    if (!disconnectUrl) return

    const confirmMessage = `Êtes-vous sûr de vouloir déconnecter ${name} ?\n\nCela supprimera l'accès à vos emails, mais les emails déjà synchronisés seront conservés.`

    if (!confirm(confirmMessage)) {
      return
    }

    setIsDisconnecting(true)

    try {
      const response = await fetch(disconnectUrl, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      // Refresh the page to update the UI
      router.refresh()
    } catch (error) {
      console.error('Error disconnecting:', error)
      alert('Erreur lors de la déconnexion. Veuillez réessayer.')
    } finally {
      setIsDisconnecting(false)
    }
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting || !disconnectUrl}
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Déconnexion...
              </>
            ) : (
              'Déconnecter'
            )}
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
