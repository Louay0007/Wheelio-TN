"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { fieldInputClass } from "@/components/account/password-fields"

export default function TwoFactorPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [recovery, setRecovery] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    const result = recovery
      ? await authClient.twoFactor.verifyBackupCode({ code, disableSession: false, trustDevice: true })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: true })
    setBusy(false)
    if (result.error) return setError(result.error.message || "Verification failed")
    router.replace("/account")
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <form onSubmit={submit} className="w-full space-y-4 rounded-[12px] border border-black/10 p-6 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-semibold">Two-factor verification</h1>
          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            {recovery ? "Enter one unused recovery code." : "Enter the code from your authenticator app."}
          </p>
        </div>
        <input aria-label={recovery ? "Recovery code" : "Authenticator code"} className={fieldInputClass} value={code} onChange={(event) => setCode(event.target.value)} autoComplete="one-time-code" />
        {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        <Button className="w-full" disabled={busy || !code.trim()}>Verify</Button>
        <button type="button" className="w-full text-sm underline underline-offset-4" onClick={() => { setRecovery(!recovery); setError(null); setCode("") }}>
          {recovery ? "Use authenticator code" : "Use a recovery code"}
        </button>
      </form>
    </main>
  )
}
