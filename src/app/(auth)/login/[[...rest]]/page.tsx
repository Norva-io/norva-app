import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src="/logo.svg" alt="Norva" width={64} height={64} className="mb-4 h-16 w-16" />
        <h1 className="font-serif text-3xl font-bold">Norva</h1>
        <p className="mt-2 text-muted-foreground">
          Bon retour sur Norva
        </p>
      </div>
      <SignIn />
    </div>
  )
}
