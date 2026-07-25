"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminPanel,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"

export default function AdminCustomerBookingsPage() {
  const { userId } = useParams<{ userId: string }>()
  const { workspace, ready } = useAdminSession()

  if (!ready || !workspace) {
    return (
      <AdminShell title="Customer bookings">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const customer = workspace.customers.find((c) => c.id === userId)
  const bookings = workspace.bookings.filter(
    (b) =>
      b.customerEmail === customer?.email ||
      b.customerName === customer?.name,
  )

  return (
    <AdminShell
      title="Customer bookings"
      description={customer?.name ?? userId}
      actions={
        <AdminLinkButton href={`/admin/customers/${userId}`} variant="secondary">
          Profile
        </AdminLinkButton>
      }
    >
      {!customer ? (
        <p className="text-sm">Customer not found.</p>
      ) : (
        <AdminPanel>
          <ul className="space-y-2 text-sm">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="font-mono font-semibold underline underline-offset-4"
                >
                  {b.reference}
                </Link>
                <span className={adminMuted}>
                  {" "}
                  · {b.status.replaceAll("_", " ")} · {b.agencyName}
                </span>
              </li>
            ))}
            {bookings.length === 0 ? (
              <li className={adminMuted}>No matching demo bookings.</li>
            ) : null}
          </ul>
        </AdminPanel>
      )}
    </AdminShell>
  )
}
