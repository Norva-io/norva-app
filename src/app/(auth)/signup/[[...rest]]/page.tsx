import { SignUp } from '@clerk/nextjs'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold">Norva</h1>
        <p className="mt-2 text-muted-foreground">
          Rejoignez Norva
        </p>
      </div>
      <SignUp />
    </div>
  )
}
