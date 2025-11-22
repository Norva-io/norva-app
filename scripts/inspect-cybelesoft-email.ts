/**
 * Inspecter un email Cybelesoft pour debug
 */

import { createClient } from '@supabase/supabase-js'
import { parseForwardedEmail } from '../src/lib/email-parser'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function inspectEmail() {
  const { data: email } = await supabase
    .from('emails')
    .select('*')
    .eq('id', '6251f7f4-f082-441a-81ea-67f4b767b7d8')
    .single()

  if (!email) {
    console.error('Email non trouvé')
    return
  }

  console.log('📧 Email:', email.subject)
  console.log('From:', email.from_email)
  console.log('To:', email.to_emails)
  console.log('\n--- BODY (premiers 1000 chars) ---')
  console.log(email.body?.substring(0, 1000))
  console.log('\n--- PARSING ---')

  const parsed = parseForwardedEmail(email.body || '')
  console.log('Is forwarded:', parsed.isForwarded)
  console.log('Original from:', parsed.originalFrom)
  console.log('All emails:', parsed.allEmails)
}

inspectEmail()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
