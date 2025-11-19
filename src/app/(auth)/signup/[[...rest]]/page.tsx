import { SignUp } from '@clerk/nextjs'

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Norva</h1>
          <p className="mt-2 text-slate-600">
            Créez votre compte Customer Success
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
