import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { OnboardingContent } from '@/components/onboarding/onboarding-content'

export default async function OnboardingPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/login')
  }

  return <OnboardingContent />
}