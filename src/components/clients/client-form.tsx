'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ClientFormProps {
  action: (formData: FormData) => void
  initialData?: {
    name: string
    domain: string
    primary_contact_email: string
  }
  submitLabel?: string
}

export function ClientForm({ action, initialData, submitLabel = 'Créer le client' }: ClientFormProps) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState(initialData?.name || '')
  const [domain, setDomain] = useState(initialData?.domain || '')
  const [primaryContactEmail, setPrimaryContactEmail] = useState(initialData?.primary_contact_email || '')
  const [autoFilled, setAutoFilled] = useState(false)

  // Auto-complétion intelligente du domaine lors du focus
  const handleDomainFocus = () => {
    if (companyName && !domain) {
      // Extraire le nom de la société (supprimer "Corp", "Inc", etc.)
      const cleanName = companyName
        .toLowerCase()
        .replace(/\s+(corp|corporation|inc|incorporated|ltd|limited|sarl|sas|sa)\.?$/i, '')
        .trim()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '')

      if (cleanName) {
        setDomain(`${cleanName}.com`)
        setAutoFilled(true)
      }
    }
  }

  // Auto-complétion de l'email du contact avec @domaine
  const handleEmailFocus = () => {
    if (domain && !primaryContactEmail) {
      setPrimaryContactEmail(`@${domain}`)
    }
  }

  const handleDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDomain(e.target.value)
    setAutoFilled(false)
  }

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">
          Nom du client <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex: ACME Corp"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Le nom de l&apos;entreprise ou de l&apos;organisation
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="domain">
          Domaine email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="domain"
          name="domain"
          type="text"
          placeholder="Ex: acme.com"
          required
          value={domain}
          onChange={handleDomainChange}
          onFocus={handleDomainFocus}
          className={autoFilled ? 'border-primary' : ''}
        />
        <p className="text-xs text-muted-foreground">
          {autoFilled
            ? '✨ Domaine suggéré automatiquement (modifiable)'
            : 'Le domaine utilisé dans les emails (sans @)'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary_contact_email">
          Email du contact principal
        </Label>
        <Input
          id="primary_contact_email"
          name="primary_contact_email"
          type="email"
          placeholder="Ex: john@acme.com"
          value={primaryContactEmail}
          onChange={(e) => setPrimaryContactEmail(e.target.value)}
          onFocus={handleEmailFocus}
        />
        <p className="text-xs text-muted-foreground">
          Optionnel : L&apos;email principal de votre contact
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}