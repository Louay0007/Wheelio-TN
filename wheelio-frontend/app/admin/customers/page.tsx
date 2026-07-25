"use client"

import Link from "next/link"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminPanel,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { useAdminApiCustomers } from "@/lib/hooks/use-admin-api"
import { cn } from "@/lib/utils"

function maskEmail(email: string) {
  const at = email.indexOf("@")
  if (at < 1) return email
  const local = email.slice(0, at)
  const domain = email.slice(at)
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}***${domain}`
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 4) return "***"
  return `*** ${digits.slice(-4)}`
}

export default function AdminCustomersPage() {
  const { workspace, ready } = useAdminSession()
  const api = useAdminApiCustomers()
  const pageReady = api.enabled ? !api.loading : ready && Boolean(workspace)

  if (!pageReady) {
    return (
      <AdminShell title="Customers">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell
      title="Customers"
      description={
        api.enabled
          ? "Live customer profiles. PII masked in list."
          : "PII masked in list. Full detail on profile for support roles."
      }
    >
      {api.enabled && api.error ? (
        <AdminPanel>
          <p className="text-sm text-red-700">{api.error}</p>
        </AdminPanel>
      ) : null}
      <AdminPanel>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr
                className={cn(
                  "text-[11px] uppercase tracking-wide dark:border-zinc-700",
                  adminMutedSoft,
                )}
              >
                <th className="pb-2 pr-3 font-semibold">Name</th>
                <th className="pb-2 pr-3 font-semibold">
                  {api.enabled ? "Locale" : "Email"}
                </th>
                <th className="pb-2 pr-3 font-semibold">Phone</th>
                <th className="pb-2 pr-3 font-semibold">
                  {api.enabled ? "City" : "Bookings"}
                </th>
                <th className="pb-2 font-semibold">
                  {api.enabled ? "Updated" : "Risk"}
                </th>
              </tr>
            </thead>
            <tbody>
              {api.enabled
                ? (api.customers ?? []).map((c) => (
                    <tr
                      key={c.customerProfileId}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/customers/${c.userId}`}
                          className="font-semibold underline underline-offset-4"
                        >
                          {c.preferredName || c.legalName}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {c.preferredLocale}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {c.phone ? maskPhone(c.phone) : "—"}
                      </td>
                      <td className="py-2.5 pr-3">{c.city ?? "—"}</td>
                      <td className={`py-2.5 text-xs ${adminMuted}`}>
                        {new Date(c.updatedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                : workspace!.customers.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="font-semibold underline underline-offset-4"
                        >
                          {c.name}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {maskEmail(c.email)}
                      </td>
                      <td className="py-2.5 pr-3 font-mono text-xs">
                        {maskPhone(c.phone)}
                      </td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums">
                        {c.bookingsCount}
                      </td>
                      <td className="py-2.5 pr-3">
                        {c.riskFlags.length === 0 ? (
                          <span className={adminMuted}>Clear</span>
                        ) : (
                          c.riskFlags.map((f) => (
                            <AdminChip key={f} tone="warn">
                              {f}
                            </AdminChip>
                          ))
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
