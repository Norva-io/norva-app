'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ClientFormProps {
  action: (formData: FormData) => void
}

export function ClientForm({ action }: ClientFormProps) {
  const [companyName, setCompanyName] = useState('')
  const [domain, setDomain] = useState('')
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
          Le nom de l'entreprise ou de l'organisation
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
        />
        <p className="text-xs text-muted-foreground">
          Optionnel : L'email principal de votre contact
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" className="flex-1">
          Créer le client
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/clients">Annuler</Link>
        </Button>
      </div>
    </form>
  )
}