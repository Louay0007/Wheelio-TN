"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminPanel,
  AdminTip,
  adminMuted,
  adminMutedSoft,
} from "@/components/admin/admin-kit"
import { formatAdminTnd } from "@/lib/admin"
import { cn } from "@/lib/utils"

const AIRPORT_FEES = [
  { code: "TUN-T1", label: "Tunis airport T1 desk", amountTnd: 25 },
  { code: "TUN-T2", label: "Tunis airport T2 meet", amountTnd: 30 },
  { code: "NBE", label: "Enfidha airport", amountTnd: 35 },
]

const YOUNG_DRIVER = [
  { band: "21-23", surchargeTnd: 15, note: "Per day, Economy only" },
  { band: "24-25", surchargeTnd: 8, note: "Per day" },
]

export default function AdminFeesCatalogPage() {
  return (
    <AdminShell
      title="Fees catalog"
      description="Reference fees agencies inherit. Not commission. Demo stub only."
    >
      <AdminTip>
        Airport and young-driver fees flow to customer quote breakdown. Wheelio fee applies
        only to trip total, never deposit.
      </AdminTip>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <AdminPanel title="Airport / location fees">
          <ul className="space-y-3 text-sm">
            {AIRPORT_FEES.map((f) => (
              <li
                key={f.code}
                className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-2 dark:border-zinc-800"
              >
                <div>
                  <p className="font-semibold">{f.label}</p>
                  <p className={cn("font-mono text-xs", adminMutedSoft)}>{f.code}</p>
                </div>
                <p className="font-mono font-semibold tabular-nums">
                  {formatAdminTnd(f.amountTnd)}
                </p>
              </li>
            ))}
          </ul>
        </AdminPanel>
        <AdminPanel title="Young driver surcharges">
          <ul className="space-y-3 text-sm">
            {YOUNG_DRIVER.map((y) => (
              <li
                key={y.band}
                className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-2 dark:border-zinc-800"
              >
                <div>
                  <p className="font-semibold">Age {y.band}</p>
                  <p className={adminMuted}>{y.note}</p>
                </div>
                <p className="font-mono font-semibold tabular-nums">
                  +{formatAdminTnd(y.surchargeTnd)}
                </p>
              </li>
            ))}
          </ul>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
