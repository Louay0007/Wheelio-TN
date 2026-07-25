"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AccountShell } from "@/components/account/account-shell"
import { fieldInputClass } from "@/components/account/password-fields"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  clearIdempotencyKey,
  getOrCreateIdempotencyKey,
} from "@/lib/api/idempotency"
import type { Driver } from "@/lib/contracts/account"
import { useAccountMutations, useMe } from "@/lib/query/account"
import { ApiClientError } from "@/lib/api/client"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"

type DriverFormProps = {
  driver?: Driver
  mode: "create" | "edit"
}

export function DriverForm({ driver, mode }: DriverFormProps) {
  const router = useRouter()
  const me = useMe()
  const mutations = useAccountMutations()
  const [primary, setPrimary] = useState(Boolean(driver?.isPrimary))
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (me.isPending) return <ApiLoadingState label="Loading driver form…" />
  if (
    me.isError &&
    me.error instanceof ApiClientError &&
    me.error.status === 401
  ) {
    return (
      <AccountShell title="Drivers" description="Sign in to manage saved drivers.">
        <Link href="/login?next=%2Faccount%2Fdrivers" className="text-sm font-medium underline underline-offset-4">
          Log in
        </Link>
      </AccountShell>
    )
  }
  if (me.isError) return <ApiErrorState error={me.error} retry={() => me.refetch()} />

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const fullName = String(fd.get("fullName") ?? "").trim()
    if (!fullName) {
      setError("Enter the driver’s full name.")
      return
    }
    const ageBand = String(fd.get("ageBand") ?? "30") as
      | "21-24"
      | "25-29"
      | "30"
    const licenseCountry = String(fd.get("licenseCountry") ?? "TN").trim()
    const licenseNumber = String(fd.get("licenseNumber") ?? "").trim()
    const licenseExpiry = String(fd.get("licenseExpiry") ?? "").trim()
    const licenseCategory = String(fd.get("licenseCategory") ?? "B").trim()
    const notes = String(fd.get("notes") ?? "").trim() || undefined

    setLoading(true)
    try {
      if (mode === "create") {
        if (!licenseNumber) {
          setError("Licence number is required.")
          return
        }
        const operation = "create-driver"
        await mutations.createDriver.mutateAsync({
          input: {
            fullName,
            ageBand,
            licenseCountry,
            licenseNumber,
            licenseExpiry,
            licenseCategory,
            isPrimary: primary,
            notes: notes ?? null,
          },
          idempotencyKey: getOrCreateIdempotencyKey(operation),
        })
        clearIdempotencyKey(operation)
      } else if (driver?.id) {
        await mutations.updateDriver.mutateAsync({
          id: driver.id,
          input: {
            fullName,
            ageBand,
            licenseCountry,
            licenseExpiry,
            licenseCategory,
            isPrimary: primary,
            notes: notes ?? null,
            ...(licenseNumber ? { licenseNumber } : {}),
            version: driver.version,
          },
        })
      }
      router.push("/account/drivers")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save driver")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!driver?.id || !window.confirm("Remove this driver from your vault?")) {
      return
    }
    setLoading(true)
    try {
      await mutations.deleteDriver.mutateAsync({
        id: driver.id,
        version: driver.version,
      })
      router.push("/account/drivers")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete driver")
    } finally {
      setLoading(false)
    }
  }

  const licenseMasked = driver?.licenseNumberMasked ?? ""

  return (
    <AccountShell
      title={mode === "create" ? "Add driver" : "Edit driver"}
      description="Licence details pre-fill checkout. Numbers are stored encrypted."
    >
      <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        {error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Full name</span>
          <input
            name="fullName"
            defaultValue={driver?.fullName ?? ""}
            required
            className={fieldInputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Age band</span>
          <select
            name="ageBand"
            defaultValue={
              driver?.ageBand ?? "30"
            }
            className={fieldInputClass}
          >
            <option value="21-24">21–24</option>
            <option value="25-29">25–29</option>
            <option value="30">30+</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Licence country</span>
            <input
              name="licenseCountry"
              defaultValue={
                driver?.licenseCountry ?? "TN"
              }
              className={fieldInputClass}
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Category</span>
            <input
              name="licenseCategory"
              defaultValue={
                driver?.licenseCategory ?? "B"
              }
              className={fieldInputClass}
            />
          </label>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">
            Licence number
            {mode === "edit" ? " (leave blank to keep)" : ""}
          </span>
          <input
            name="licenseNumber"
            defaultValue={mode === "create" ? "" : ""}
            placeholder={mode === "edit" ? String(licenseMasked ?? "••••") : ""}
            required={mode === "create"}
            className={fieldInputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Expiry</span>
          <input
            name="licenseExpiry"
            type="date"
            defaultValue={
              driver?.licenseExpiry ?? ""
            }
            required
            className={fieldInputClass}
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Notes</span>
          <textarea
            name="notes"
            defaultValue={
              driver?.notes ?? ""
            }
            className={fieldInputClass}
            rows={3}
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <Checkbox checked={primary} onCheckedChange={(v) => setPrimary(v === true)} />
          <span>Primary driver</span>
        </label>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="rounded-[8px] bg-black dark:bg-white dark:text-black"
          >
            {loading ? "Saving…" : "Save driver"}
          </Button>
          {mode === "edit" ? (
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void handleDelete()}
              className="rounded-[8px]"
            >
              Delete
            </Button>
          ) : null}
        </div>
      </form>
    </AccountShell>
  )
}
