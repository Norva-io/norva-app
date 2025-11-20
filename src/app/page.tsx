import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = await auth()

  // Si l'utilisateur est connecté, on le redirige vers le dashboard
  if (userId) {
    redirect('/dashboard')
  }

  // Sinon, on le redirige vers la page de login
  redirect('/login')
}