"use client"

import Image from "next/image"
import { useState } from "react"
import QRCode from "qrcode"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { fieldInputClass } from "@/components/account/password-fields"

export function MfaSettings({
  enabled,
  onChanged,
  notify,
}: {
  enabled: boolean
  onChanged: () => void
  notify: (message: string) => void
}) {
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [qr, setQr] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  async function startSetup() {
    setBusy(true)
    const result = await authClient.twoFactor.enable({ password })
    setBusy(false)
    if (result.error) return notify(result.error.message || "Could not start MFA setup")
    setQr(await QRCode.toDataURL(result.data.totpURI, { width: 224, margin: 1 }))
    setBackupCodes(result.data.backupCodes)
  }

  async function verify() {
    setBusy(true)
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: true })
    setBusy(false)
    if (result.error) return notify(result.error.message || "Invalid authenticator code")
    setCode("")
    setQr(null)
    notify("Two-factor authentication enabled")
    onChanged()
  }

  async function disable() {
    setBusy(true)
    const result = await authClient.twoFactor.disable({ password })
    setBusy(false)
    if (result.error) return notify(result.error.message || "Could not disable MFA")
    setBackupCodes([])
    notify("Two-factor authentication disabled")
    onChanged()
  }

  async function regenerate() {
    setBusy(true)
    const result = await authClient.twoFactor.generateBackupCodes({ password })
    setBusy(false)
    if (result.error) return notify(result.error.message || "Could not regenerate codes")
    setBackupCodes(result.data.backupCodes)
    notify("Backup codes regenerated")
  }

  return (
    <div className="space-y-4 rounded-[8px] border border-black/10 p-4 dark:border-white/10">
      <div>
        <p className="font-medium">Authenticator app</p>
        <p className="text-sm text-black/55 dark:text-white/55">
          {enabled ? "Enabled. Keep recovery codes somewhere safe." : "Protect sign-in with a time-based one-time code."}
        </p>
      </div>
      <label className="block max-w-md space-y-1.5 text-sm">
        <span className="font-medium">Current password</span>
        <input className={fieldInputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
      </label>
      {!enabled && !qr ? <Button type="button" disabled={busy || !password} onClick={startSetup}>Set up MFA</Button> : null}
      {qr ? (
        <div className="space-y-3">
          <Image src={qr} alt="Authenticator setup QR code" width={224} height={224} unoptimized />
          <label className="block max-w-xs space-y-1.5 text-sm">
            <span className="font-medium">6-digit verification code</span>
            <input className={fieldInputClass} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} />
          </label>
          <Button type="button" disabled={busy || code.replace(/\s/g, "").length !== 6} onClick={verify}>Verify and enable</Button>
        </div>
      ) : null}
      {enabled ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={busy || !password} onClick={regenerate}>New backup codes</Button>
          <Button type="button" variant="destructive" disabled={busy || !password} onClick={disable}>Disable MFA</Button>
        </div>
      ) : null}
      {backupCodes.length ? (
        <div className="rounded-[8px] bg-black/5 p-4 dark:bg-white/5">
          <p className="mb-2 text-sm font-semibold">Recovery codes — shown only now</p>
          <ul className="grid gap-1 font-mono text-sm sm:grid-cols-2">
            {backupCodes.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
