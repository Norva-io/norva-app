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
 * Nettoie le HTML et extrait le texte brut
 */
function stripHtml(html: string): string {
  // Remplacer les balises <br> et <div> par des sauts de ligne
  let text = html.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n')

  // Retirer toutes les autres balises HTML
  text = text.replace(/<[^>]*>/g, '')

  // Décoder les entités HTML courantes
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")

  return text
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
  // Nettoyer le HTML si présent
  const cleanBody = stripHtml(body)
  const lowerBody = cleanBody.toLowerCase()

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

  // Extraire tous les emails du corps nettoyé
  const allEmails = extractEmailsFromText(cleanBody)

  if (!isForwarded) {
    return { isForwarded: false, allEmails }
  }

  // Chercher le "From:" ou "De:" dans la partie forwardée (sur le texte nettoyé)
  const fromPatterns = [
    /from:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
    /de\s*:\s*<?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?/i,
  ]

  for (const pattern of fromPatterns) {
    const match = cleanBody.match(pattern)
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
