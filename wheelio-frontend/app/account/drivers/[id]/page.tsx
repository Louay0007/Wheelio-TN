"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { DriverForm } from "@/components/account/driver-form"
import { AccountShell } from "@/components/account/account-shell"
import { ApiClientError } from "@/lib/api/client"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { useDriver } from "@/lib/query/account"

export default function EditDriverPage() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : ""
  const driver = useDriver(id)

  if (driver.isPending) return <ApiLoadingState label="Loading driver…" />
  if (
    driver.isError &&
    driver.error instanceof ApiClientError &&
    driver.error.status === 401
  ) {
    return (
      <AccountShell title="Edit driver">
        <Link href="/login" className="underline underline-offset-4">
          Log in
        </Link>
      </AccountShell>
    )
  }

  if (
    driver.isError &&
    driver.error instanceof ApiClientError &&
    driver.error.status === 404
  ) {
    return (
      <AccountShell title="Driver not found">
        <Link href="/account/drivers" className="underline underline-offset-4">
          Back to drivers
        </Link>
      </AccountShell>
    )
  }
  if (driver.isError) {
    return <ApiErrorState error={driver.error} retry={() => driver.refetch()} />
  }

  return <DriverForm mode="edit" driver={driver.data} />
}
