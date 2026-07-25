"use client"

import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { cn } from "@/lib/utils"

const TEMPLATES = [
  {
    id: "booking-requested",
    label: "Booking requested",
    audience: "Customer",
    subject: "We sent your request to {{agency}}",
  },
  {
    id: "booking-confirmed",
    label: "Booking confirmed",
    audience: "Customer",
    subject: "Confirmed · {{ref}} · {{pickup}}",
  },
  {
    id: "agency-new-request",
    label: "New request",
    audience: "Agency",
    subject: "New Wheelio request · respond in {{sla}}h",
  },
  {
    id: "payout-scheduled",
    label: "Payout scheduled",
    audience: "Agency",
    subject: "Payout {{period}} · {{net}} TND",
  },
  {
    id: "auth-reset",
    label: "Password reset",
    audience: "Staff / customer",
    subject: "Reset your Wheelio password",
  },
  {
    id: "dual-control",
    label: "Dual-control pending",
    audience: "Staff",
    subject: "Second approval needed · {{summary}}",
  },
]

export default function AdminDevEmailsPage() {
  const [selected, setSelected] = useState(TEMPLATES[0]!.id)
  const active = TEMPLATES.find((t) => t.id === selected) ?? TEMPLATES[0]!

  return (
    <AdminShell
      title="Dev emails"
      description="Transactional template gallery for demo QA."
      actions={
        <AdminLinkButton href="/dev/emails" variant="secondary">
          Full /dev/emails
        </AdminLinkButton>
      }
    >
      <AdminTip>
        No SMTP in demo. Preview subjects and open the shared HTML gallery.
      </AdminTip>
      <div className="mt-4 grid gap-4 lg:grid-cols-[240px_1fr]">
        <AdminPanel title="Templates">
          <ul className="space-y-1 text-sm">
            {TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelected(t.id)}
                  className={cn(
                    "w-full rounded-[8px] px-2 py-2 text-left transition",
                    selected === t.id
                      ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  )}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </AdminPanel>
        <AdminPanel
          title={active.label}
          action={<AdminChip tone="neutral">{active.audience}</AdminChip>}
        >
          <p className={cn("text-xs uppercase tracking-[0.1em]", adminMuted)}>
            Subject
          </p>
          <p className="mt-1 font-mono text-sm">{active.subject}</p>
          <p className={cn("mt-4 text-sm", adminMuted)}>
            Body HTML renders in the shared gallery. Variables stay unexpanded in this
            admin strip.
          </p>
          <div className="mt-4">
            <AdminPrimaryButton
              type="button"
              onClick={() => {
                window.open(`/dev/emails#${active.id}`, "_blank")
              }}
            >
              Open HTML preview
            </AdminPrimaryButton>
          </div>
        </AdminPanel>
      </div>
    </AdminShell>
  )
}
