/**
 * Utilitaires pour parser les emails et extraire les informations
 */

/**
 * Extrait les adresses email d'un texte
 */
export function extractEmailsFromText(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = text.match(emailRegex)
  return matches ? Array.from(new Set(matches.map((e) => e.toLowerCase()))) : []
}

/**
 * Détecte si un email est un forward et extrait l'expéditeur original
 *
 * Patterns recherchés :
 * - "---------- Forwarded message ---------"
 * - "Begin forwarded message:"
 * - "From: john@acme.com"
 * - "De : john@acme.com"
 */
export function parseForwardedEmail(body: string): {
  isForwarded: boolean
  originalFrom?: string
  allEmails: string[]
} {
  const lowerBody = body.toLowerCase()

  // Détecter si c'est un forward
  const forwardPatterns = [
    '---------- forwarded message',
    'begin forwarded message',
    '----message transféré----',
    'message transféré',
    'fwd:',
    'tr:',
  ]

  const isForwarded = forwardPatterns.some((pattern) => lowerBody.includes(pattern))

  // Extraire tous les emails du corps
  const allEmails = extractEmailsFromText(body)

  if (!isForwarded) {
    return { isForwarded: false, allEmails }
  }

  // Chercher le "From:" ou "De:" dans la partie forwardée
  const fromPatterns = [
    /from:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    /de\s*:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
  ]

  for (const pattern of fromPatterns) {
    const match = body.match(pattern)
    if (match && match[1]) {
      return {
        isForwarded: true,
        originalFrom: match[1].toLowerCase(),
        allEmails,
      }
    }
  }

  return { isForwarded: true, allEmails }
}

/**
 * Extrait le domaine d'une adresse email
 */
export function extractDomain(email: string): string | null {
  const parts = email.toLowerCase().split('@')
  return parts.length === 2 ? parts[1] : null
}

/**
 * Trouve les clients potentiels à partir d'une liste d'emails
 */
export function findMatchingClients(
  emails: string[],
  clientDomainMap: Map<string, string>
): { clientId: string; matchedEmail: string }[] {
  const matches: { clientId: string; matchedEmail: string }[] = []

  for (const email of emails) {
    const domain = extractDomain(email)
    if (domain) {
      const clientId = clientDomainMap.get(domain)
      if (clientId) {
        matches.push({ clientId, matchedEmail: email })
      }
    }
  }

  return matches
}
