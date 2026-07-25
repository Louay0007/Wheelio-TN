"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { AccountShell } from "@/components/account/account-shell"
import {
  ApiEmptyState,
  ApiErrorState,
  ApiLoadingState,
} from "@/components/api/api-state"
import { Button } from "@/components/ui/button"
import { ApiClientError } from "@/lib/api/client"
import { useDrivers } from "@/lib/query/account"

export function DriversListClient() {
  const drivers = useDrivers()

  if (drivers.isPending) return <ApiLoadingState label="Loading saved drivers…" />
  if (
    drivers.isError &&
    drivers.error instanceof ApiClientError &&
    drivers.error.status === 401
  ) {
    return (
      <AccountShell title="Saved drivers" description="Sign in to store licence holders for faster checkout.">
        <Link href="/login?next=%2Faccount%2Fdrivers" className="text-sm font-medium underline underline-offset-4">
          Log in
        </Link>
      </AccountShell>
    )
  }
  if (drivers.isError) {
    return <ApiErrorState error={drivers.error} retry={() => drivers.refetch()} />
  }

  return (
    <AccountShell
      title="Saved drivers"
      description="Pre-fill checkout with trusted licence holders."
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-black/55 dark:text-white/55">
          {drivers.data.length} driver{drivers.data.length === 1 ? "" : "s"} in your vault
        </p>
        <Button asChild size="sm" className="rounded-[8px] bg-black dark:bg-white dark:text-black">
          <Link href="/account/drivers/new">
            <Plus className="size-4" />
            Add driver
          </Link>
        </Button>
      </div>

      {drivers.data.length === 0 ? (
        <div className="mt-6">
          <ApiEmptyState
            title="No saved drivers"
            description="Add a driver to pre-fill licence details at checkout."
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
        {drivers.data.map((driver) => (
          <li key={driver.id}>
            <Link
              href={`/account/drivers/${driver.id}`}
              className="block rounded-[8px] border border-black/10 p-4 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold tracking-[-0.02em]">{driver.fullName}</p>
                  <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                    {driver.licenseCountry} · {driver.licenseCategory} · expires{" "}
                    {driver.licenseExpiry}
                  </p>
                </div>
                {driver.isPrimary ? (
                  <span className="rounded-[6px] border border-black/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-black/55 dark:border-white/15 dark:text-white/55">
                    Primary
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
      )}
    </AccountShell>
  )
}
