"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AccountShell } from "@/components/account/account-shell"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { Button } from "@/components/ui/button"
import { ApiClientError } from "@/lib/api/client"
import { useConfirmBookingClaim, useMe, useRequestBookingClaim } from "@/lib/query/account"

function ClaimBookingContent() {
  const params = useSearchParams()
  const token = params.get("token") ?? ""
  const me = useMe()
  const requestClaim = useRequestBookingClaim()
  const confirmClaim = useConfirmBookingClaim()
  const [reference, setReference] = useState("")
  const [email, setEmail] = useState("")
  const [requested, setRequested] = useState(false)

  if (me.isPending) return <ApiLoadingState label="Loading claim options…" />
  if (me.isError && me.error instanceof ApiClientError && me.error.status === 401) return <AccountShell title="Claim a booking" description="Sign in before linking a guest booking."><Link href={`/login?next=${encodeURIComponent(`/account/claim${token ? `?token=${token}` : ""}`)}`} className="text-sm font-medium underline underline-offset-4">Log in</Link></AccountShell>
  if (me.isError) return <ApiErrorState error={me.error} retry={() => me.refetch()} />

  if (token) return <AccountShell title="Claim a booking" description="Attach this guest booking to your verified account."><div className="space-y-4 rounded-[8px] border border-black/10 p-5 dark:border-white/10"><p className="text-sm text-black/60 dark:text-white/60">Signed in as {me.data.user.email}. The claim link must have been sent to this verified email.</p>{!me.data.user.emailVerified && <p className="text-sm text-red-600">Verify your account email before continuing.</p>}{confirmClaim.isSuccess ? <p className="text-sm font-medium">Booking {confirmClaim.data.reference} is now in your account.</p> : <Button disabled={!me.data.user.emailVerified || confirmClaim.isPending} onClick={() => confirmClaim.mutate({ token, idempotencyKey: crypto.randomUUID() })}>{confirmClaim.isPending ? "Attaching…" : "Add to my account"}</Button>}{confirmClaim.isError && <ApiErrorState error={confirmClaim.error} retry={() => confirmClaim.reset()} />}</div></AccountShell>

  return <AccountShell title="Claim a booking" description="We will email a single-use claim link if the details match a guest booking."><form className="space-y-4 rounded-[8px] border border-black/10 p-5 dark:border-white/10" onSubmit={(event) => { event.preventDefault(); requestClaim.mutate({ reference, email }, { onSuccess: () => setRequested(true) }) }}><label className="block text-sm">Booking reference<input className="mt-2 h-10 w-full rounded-[8px] border px-3 dark:bg-transparent" value={reference} onChange={(event) => setReference(event.target.value)} required /></label><label className="block text-sm">Guest booking email<input type="email" className="mt-2 h-10 w-full rounded-[8px] border px-3 dark:bg-transparent" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><Button disabled={requestClaim.isPending}>{requestClaim.isPending ? "Sending…" : "Email secure claim link"}</Button>{requested && <p className="text-sm text-black/60 dark:text-white/60">If those details match an eligible booking, a claim link has been sent.</p>}{requestClaim.isError && <ApiErrorState error={requestClaim.error} retry={() => requestClaim.reset()} />}</form></AccountShell>
}
export default function ClaimBookingPage() { return <Suspense fallback={<ApiLoadingState label="Loading claim options…" />}><ClaimBookingContent /></Suspense> }
