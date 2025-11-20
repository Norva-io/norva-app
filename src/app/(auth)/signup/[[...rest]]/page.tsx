import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image src="/logo.svg" alt="Norva" width={48} height={48} className="mb-4 h-12 w-12" />
        <h1 className="font-serif text-3xl font-bold">Norva</h1>
        <p className="mt-2 text-muted-foreground">
          Rejoignez Norva
        </p>
      </div>
      <SignUp />
    </div>
  )
}
