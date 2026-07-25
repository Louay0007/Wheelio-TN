"use client"

import Link from "next/link"
import { AgencyShell } from "@/components/agency/agency-shell"
import {
  AgencyField,
  AgencyLinkButton,
  AgencyPanel,
  AgencyPrimaryButton,
  AgencyTip,
  AgencyKeyValue,
  agencyMuted,
} from "@/components/agency/agency-kit"
import { useAgencySession } from "@/lib/agency-session"
import type { AgencyRole } from "@/lib/agency"
import { cn } from "@/lib/utils"

const LINKS = [
  ["/agency/settings/public-profile", "Public page", "What customers see about you"],
  ["/agency/settings/booking-mode", "Booking mode", "Request to book or Instant"],
  ["/agency/settings/contract", "Partner contract", "Your fee and agreement"],
  ["/agency/settings/security", "Security", "Password and sessions"],
  ["/agency/onboarding", "Setup checklist", "Finish go-live steps"],
  ["/agency/notifications/settings", "Alerts", "Email and SMS preferences"],
] as const

export default function SettingsHubPage() {
  const { workspace, session, login, ready } = useAgencySession()

  return (
    <AgencyShell
      title="Settings"
      description="Agency details, booking mode, and staff tools."
    >
      {!ready || !workspace ? (
        <div className="h-40 animate-pulse rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
      ) : (
        <div className="w-full space-y-4">
          <AgencyPanel title="Your agency">
            <AgencyKeyValue
              rows={[
                { label: "Trade name", value: workspace.tradeName },
                { label: "Legal name", value: workspace.legalName },
                { label: "Tax ID", value: workspace.taxId },
                { label: "Email", value: workspace.email },
                { label: "Phone", value: workspace.phone },
                { label: "Bank", value: `···· ${workspace.ibanLast4}` },
                {
                  label: "Fee",
                  value: `${workspace.takeRatePercent}% (${workspace.commissionTier})`,
                },
                {
                  label: "Status",
                  value: workspace.verification,
                },
              ]}
            />
          </AgencyPanel>

          <div className="grid gap-3 sm:grid-cols-2">
            {LINKS.map(([href, label, hint]) => (
              <Link
                key={href}
                href={href}
                className="rounded-[12px] border border-zinc-200 bg-white p-4 transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
              >
                <p className="font-semibold text-zinc-950 dark:text-zinc-50">{label}</p>
                <p className={cn("mt-1 text-sm", agencyMuted)}>{hint}</p>
              </Link>
            ))}
          </div>

          <AgencyPanel
            title="Try another staff role (demo)"
            hint="See how the portal looks for agents or accountants. Demo only."
          >
            <AgencyField label="Signed in as">
              <p className="text-sm font-medium">
                {session?.name} · {session?.role}
              </p>
            </AgencyField>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["owner", "agent", "fleet", "accountant"] as AgencyRole[]).map(
                (role) => (
                  <AgencyPrimaryButton
                    key={role}
                    type="button"
                    className={
                      session?.role === role
                        ? undefined
                        : "!bg-transparent !text-zinc-900 border border-zinc-300 dark:!bg-transparent dark:!text-zinc-100 dark:border-zinc-600"
                    }
                    onClick={() => login({ role })}
                  >
                    Switch to {role}
                  </AgencyPrimaryButton>
                ),
              )}
            </div>
            <AgencyTip>
              Agents mainly see bookings. Accountants mainly see payments. Owners see
              everything.
            </AgencyTip>
          </AgencyPanel>

          <div className="flex flex-wrap gap-3">
            <AgencyLinkButton href="/agency/team" variant="secondary">
              Manage staff
            </AgencyLinkButton>
            <AgencyLinkButton href="/agency/help" variant="secondary">
              Help center
            </AgencyLinkButton>
          </div>
        </div>
      )}
    </AgencyShell>
  )
}
