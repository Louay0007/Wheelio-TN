"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminEmpty,
  AdminInput,
  AdminPanel,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { globalSearch, verificationLabel } from "@/lib/admin"
import { cn } from "@/lib/utils"

function SearchInner() {
  const params = useSearchParams()
  const initial = params.get("q") ?? ""
  const { workspace, ready } = useAdminSession()
  const [q, setQ] = useState(initial)

  const results = useMemo(() => {
    if (!workspace) {
      return { bookings: [], agencies: [], customers: [], vehicles: [], cases: [] }
    }
    return globalSearch(workspace, q)
  }, [workspace, q])

  return (
    <AdminShell
      title="Search"
      description="Find a booking, agency, customer, plate, or case."
    >
      {!ready || !workspace ? (
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full max-w-3xl space-y-4">
          <AdminInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="WTN-881001 · +216… · Carthage · plate"
            autoFocus
            aria-label="Search"
          />
          {!q.trim() ? (
            <AdminEmpty
              title="Try a lookup"
              body="Formats that work: WTN-123456, +216 phone, agency trade name, plate, customer email."
            />
          ) : (
            <>
              <ResultGroup title="Bookings">
                {results.bookings.map((b) => (
                  <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block py-2">
                    <span className="font-mono font-semibold">{b.reference}</span>
                    <span className={cn("ml-2 text-sm", adminMuted)}>
                      {b.status} · {b.agencyName} · {b.pickupLabel}
                    </span>
                  </Link>
                ))}
              </ResultGroup>
              <ResultGroup title="Agencies">
                {results.agencies.map((a) => (
                  <Link key={a.id} href={`/admin/agencies/${a.id}`} className="block py-2">
                    <span className="font-semibold">{a.tradeName}</span>
                    <span className="ml-2">
                      <AdminChip>{verificationLabel(a.verification)}</AdminChip>
                    </span>
                    <span className={cn("ml-2 text-sm", adminMuted)}>
                      {a.takeRatePercent}% · {a.city}
                    </span>
                  </Link>
                ))}
              </ResultGroup>
              <ResultGroup title="Customers">
                {results.customers.map((c) => (
                  <Link key={c.id} href={`/admin/customers/${c.id}`} className="block py-2">
                    <span className="font-semibold">{c.name}</span>
                    <span className={cn("ml-2 text-sm", adminMuted)}>{c.email}</span>
                  </Link>
                ))}
              </ResultGroup>
              <ResultGroup title="Vehicles">
                {results.vehicles.map((v) => (
                  <Link key={v.id} href={`/admin/vehicles/${v.id}`} className="block py-2">
                    <span className="font-mono font-semibold">{v.plate}</span>
                    <span className={cn("ml-2 text-sm", adminMuted)}>
                      {v.makeModel} · {v.agencyName}
                    </span>
                  </Link>
                ))}
              </ResultGroup>
              <ResultGroup title="Cases">
                {results.cases.map((c) => (
                  <Link key={c.id} href={`/admin/cases/${c.id}`} className="block py-2">
                    <span className="font-semibold">{c.subject}</span>
                    <span className={cn("ml-2 text-sm", adminMuted)}>{c.bookingRef}</span>
                  </Link>
                ))}
              </ResultGroup>
            </>
          )}
        </div>
      )}
    </AdminShell>
  )
}

function ResultGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const count = Array.isArray(children)
    ? children.filter((c) => c != null).length
    : children
      ? 1
      : 0
  if (count === 0) return null
  return (
    <AdminPanel title={title}>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</div>
    </AdminPanel>
  )
}

export default function AdminSearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  )
}
