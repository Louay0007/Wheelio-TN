"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AccountShell } from "@/components/account/account-shell"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { fieldInputClass } from "@/components/account/password-fields"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import { Button } from "@/components/ui/button"
import { ApiClientError } from "@/lib/api/client"
import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
} from "@/lib/api/idempotency"
import {
  useAccountMutations,
  useMe,
  usePrivacyRequest,
  usePrivacyRequests,
  usePrivacyDownload,
} from "@/lib/query/account"

const STORED_ITEMS = [
  "Profile and contact details",
  "Saved drivers and licence metadata",
  "Booking references you claim",
  "Notification and marketing preferences",
  "Security and consent audit records",
] as const

export default function PrivacyPage() {
  const me = useMe()
  const mutations = useAccountMutations()
  const [confirmText, setConfirmText] = useState("")
  const [deletionReason, setDeletionReason] = useState("")
  const [requestId, setRequestId] = useState<string | null>(null)
  const request = usePrivacyRequest(requestId)
  const requests = usePrivacyRequests()
  const download = usePrivacyDownload()
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  async function handleExport() {
    const operation = "privacy-export"
    try {
      const result = await mutations.requestPrivacyExport.mutateAsync(
        getOrCreateIdempotencyKey(operation),
      )
      clearIdempotencyKey(operation)
      setRequestId(result.id)
      setToast("Export request submitted")
    } catch {
      setToast("Could not submit export request")
    }
  }

  async function handleDownload(id: string) {
    try {
      const artifact = await download.mutateAsync(id)
      window.location.assign(artifact.url)
    } catch {
      setToast("Could not authorize export download. Sign in again and retry.")
    }
  }

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirmText !== "DELETE" || deletionReason.trim().length < 3) return
    const operation = "privacy-deletion"
    try {
      const result = await mutations.requestPrivacyDeletion.mutateAsync({
        input: { reason: deletionReason.trim(), confirm: true },
        idempotencyKey: getOrCreateIdempotencyKey(operation),
      })
      clearIdempotencyKey(operation)
      setRequestId(result.id)
      setToast("Deletion request submitted")
    } catch {
      setToast("Could not submit deletion request")
    }
  }

  if (me.isPending) return <ApiLoadingState label="Loading privacy controls…" />
  const unauthenticated =
    me.isError && me.error instanceof ApiClientError && me.error.status === 401
  if (me.isError && !unauthenticated) {
    return <ApiErrorState error={me.error} retry={() => me.refetch()} />
  }

  return (
    <>
      <AccountShell
        title="Privacy"
        description="Review, export, or request deletion of your account data."
      >
        {unauthenticated ? (
          <p className="mb-8 text-sm text-black/55 dark:text-white/55">
            <Link
              href="/login?next=%2Faccount%2Fprivacy"
              className="font-medium underline underline-offset-4"
            >
              Log in
            </Link>{" "}
            to export or delete your account data.
          </p>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">What we store</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-black/60 dark:text-white/60">
            {STORED_ITEMS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm">
            Full policy:{" "}
            <Link href="/privacy" className="font-medium underline underline-offset-4">
              Privacy policy
            </Link>
          </p>
        </section>

        <section className="mt-10 space-y-3 pt-8 dark:border-white/10">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Marketing consent</h2>
          <p className="text-sm text-black/60 dark:text-white/60">
            {me.data?.profile.marketingOptIn
              ? "You opted in to marketing emails in notification settings."
              : "You have not opted in to marketing emails (default off)."}
          </p>
          {!unauthenticated ? (
            <Link
              href="/account/notifications/settings"
              className="text-sm font-medium underline underline-offset-4"
            >
              Change in notification settings
            </Link>
          ) : null}
        </section>

        <section className="mt-10 space-y-4 pt-8 dark:border-white/10">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Download your data</h2>
          <p className="text-sm text-black/55 dark:text-white/55">
            Request a portable export. We will show its processing status here.
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-[8px] border-black/15 dark:border-white/15"
            onClick={handleExport}
            disabled={unauthenticated || mutations.requestPrivacyExport.isPending}
          >
            Request data export
          </Button>
          {request.data ? (
            <p className="text-sm text-black/55 dark:text-white/55">
              Request {request.data.id}: {request.data.status}
              {request.data.artifactReady ? " · download ready" : ""}
            </p>
          ) : null}
          {requests.data?.length ? (
            <ul className="space-y-2" aria-live="polite">
              {requests.data.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/10 p-3 text-sm dark:border-white/10">
                  <span><span className="font-medium">{item.requestType}</span> · {item.status}
                    {item.legalHoldReason ? ` · ${item.legalHoldReason}` : ""}
                    {item.failureReason ? ` · ${item.failureReason}` : ""}
                  </span>
                  {item.artifactReady ? (
                    <Button type="button" variant="outline" onClick={() => handleDownload(item.id)} disabled={download.isPending}>Download JSON</Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mt-10 space-y-4 pt-8 dark:border-white/10">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-red-700 dark:text-red-400">
            Delete account
          </h2>
          <p className="text-sm text-black/55 dark:text-white/55">
            This starts a reviewed deletion workflow. Type DELETE to confirm.
          </p>
          <form className="max-w-md space-y-4" onSubmit={handleDelete}>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Reason</span>
              <textarea
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                className={fieldInputClass}
                rows={3}
                minLength={3}
                maxLength={500}
                required
                disabled={unauthenticated}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Confirmation</span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className={fieldInputClass}
                autoComplete="off"
                disabled={unauthenticated}
              />
            </label>
            <Button
              type="submit"
              disabled={
                unauthenticated ||
                confirmText !== "DELETE" ||
                deletionReason.trim().length < 3 ||
                mutations.requestPrivacyDeletion.isPending
              }
              variant="destructive"
              className="h-11 rounded-[7px]"
            >
              Request account deletion
            </Button>
          </form>
        </section>
      </AccountShell>
      <BookingInlineToast message={toast} />
    </>
  )
}
