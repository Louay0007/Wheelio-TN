"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { PageHero, PageShell } from "@/components/page-shell"
import { PARTNER_PRICING } from "@/lib/partner-pricing"

type Draft = { tradeName?: string; legalName?: string; email?: string }

export default function PartnerJoinSuccessPage() {
  const [draft, setDraft] = useState<Draft>({})
  useEffect(() => {
    try {
      const raw = localStorage.getItem("wheelio-partner-application")
      if (raw) setDraft(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [])
  const name = draft.tradeName || draft.legalName || "your agency"
  const ref = "APP-" + (draft.email?.slice(0, 3).toUpperCase() || "DEMO") + "-2026"

  return (
    <PageShell>
      <PageHero
        eyebrow="Application received"
        title={`Thanks — ${name}`}
        description={`We logged electronic acceptance of the ${PARTNER_PRICING.recommendedPercent}% commission terms (demo).`}
      />
      <section className="mx-auto max-w-2xl px-4 py-10">
        <p className="font-mono text-sm">Reference {ref}</p>
        <ol className="mt-8 space-y-4">
          {[
            "Wheelio reviews documents (2–5 business days)",
            "Portal invite email to your contact",
            "Complete /agency/onboarding checklist",
            "Go live · start receiving requests",
          ].map((step, i) => (
            <li key={step} className="flex gap-3 rounded-[10px] border border-black/15 px-4 py-3 text-sm dark:border-white/15">
              <span className="font-mono text-black/40">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-[8px] border border-black/15 px-4 text-sm font-semibold">Return home</Link>
          <a href="mailto:partners@wheelio.tn" className="inline-flex h-11 items-center rounded-[8px] border border-black/15 px-4 text-sm font-semibold">Contact partners@</a>
          <Link href="/agency/login" className="inline-flex h-11 items-center rounded-[8px] bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black">Agency portal login</Link>
        </div>
        <p className="mt-6 text-xs text-black/45">Demo only until CRM is live.</p>
      </section>
    </PageShell>
  )
}
