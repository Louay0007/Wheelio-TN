"use client"

import { useParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { useAdminApiCustomer } from "@/lib/hooks/use-admin-api"

export default function AdminCustomerDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiCustomer(userId)

  if (api.enabled) {
    if (api.loading) {
      return (
        <AdminShell title="Customer">
          <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        </AdminShell>
      )
    }
    if (api.error || !api.customer) {
      return (
        <AdminShell title="Customer not found">
          <p className="mb-3 text-sm text-red-600">{api.error}</p>
          <AdminLinkButton href="/admin/customers" variant="secondary">
            Back
          </AdminLinkButton>
        </AdminShell>
      )
    }
    const c = api.customer
    return (
      <AdminShell
        title={String(c.legalName ?? c.preferredName ?? userId)}
        description={String(c.customerProfileId ?? "")}
        actions={
          <>
            <AdminLinkButton
              href={`/admin/customers/${userId}/bookings`}
              variant="secondary"
            >
              Bookings
            </AdminLinkButton>
            <AdminLinkButton
              href={`/admin/customers/${userId}/risk`}
              variant="secondary"
            >
              Risk
            </AdminLinkButton>
          </>
        }
      >
        <AdminPanel className="max-w-lg">
          <AdminKeyValue
            rows={[
              { label: "Phone", value: String(c.phone ?? "—") },
              { label: "Locale", value: String(c.preferredLocale ?? "en") },
              { label: "City", value: String(c.city ?? "—") },
              {
                label: "Welcome",
                value: c.welcomeCompleted ? "Done" : "Pending",
              },
            ]}
          />
        </AdminPanel>
      </AdminShell>
    )
  }

  if (!ready || !workspace) {
    return (
      <AdminShell title="Customer">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const customer = workspace.customers.find((c) => c.id === userId)

  if (!customer) {
    return (
      <AdminShell title="Customer not found">
        <AdminLinkButton href="/admin/customers" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title={customer.name}
      description={customer.email}
      actions={
        <>
          <AdminLinkButton
            href={`/admin/customers/${userId}/bookings`}
            variant="secondary"
          >
            Bookings
          </AdminLinkButton>
          <AdminLinkButton
            href={`/admin/customers/${userId}/risk`}
            variant="secondary"
          >
            Risk
          </AdminLinkButton>
        </>
      }
    >
      <AdminPanel className="max-w-lg">
        <AdminKeyValue
          rows={[
            { label: "Phone", value: customer.phone },
            { label: "Bookings", value: String(customer.bookingsCount) },
            { label: "Last trip", value: customer.lastTripLabel },
            {
              label: "Risk flags",
              value:
                customer.riskFlags.length === 0 ? (
                  "None"
                ) : (
                  <span className="flex flex-wrap justify-end gap-1">
                    {customer.riskFlags.map((f) => (
                      <AdminChip key={f} tone="warn">
                        {f}
                      </AdminChip>
                    ))}
                  </span>
                ),
            },
          ]}
        />
      </AdminPanel>
    </AdminShell>
  )
}
