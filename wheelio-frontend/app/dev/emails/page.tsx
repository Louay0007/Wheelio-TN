import type { Metadata } from "next"
import { PageShell } from "@/components/page-shell"

export const metadata: Metadata = {
  title: "Email templates (dev) | Wheelio",
  robots: { index: false, follow: false },
}

const TEMPLATES = [
  {
    id: "booking-received",
    subject: "Booking received — {{reference}}",
    preview:
      "We got your request. The agency usually replies within desk hours. Trip total and deposit are shown separately.",
  },
  {
    id: "payment-reminder",
    subject: "Complete your deposit — {{reference}}",
    preview:
      "Your car is held but not confirmed until {{amountDueNow}} TND is paid online. Deposit at pickup remains separate.",
  },
  {
    id: "confirmed",
    subject: "Confirmed — voucher inside · {{reference}}",
    preview:
      "You're confirmed with {{agencyName}}. Pickup {{pickupLabel}}. Open your voucher for desk instructions.",
  },
  {
    id: "pickup-reminder",
    subject: "Pickup in 24h — {{reference}}",
    preview:
      "Checklist: licence, ID, card for deposit hold, voucher. Meet method: {{pickupMethodNote}}.",
  },
  {
    id: "return-reminder",
    subject: "Return tomorrow — {{reference}}",
    preview:
      "Return {{returnLabel}} at {{dropoffLocation}}. Full-to-full fuel unless prepaid. Deposit release follows agency inspection.",
  },
  {
    id: "completed-review",
    subject: "How was your rental? · {{reference}}",
    preview:
      "Thanks for renting with Wheelio. Share feedback — deposit release timing depends on your bank after the agency closes the file.",
  },
  {
    id: "cancelled",
    subject: "Booking cancelled — {{reference}}",
    preview:
      "Your cancellation is recorded. Refund of online amounts follows the rate policy (demo estimate in account).",
  },
  {
    id: "modify-request",
    subject: "Change request sent — {{reference}}",
    preview:
      "We forwarded your date/extras request to {{agencyName}}. You'll get a new total before anything is charged.",
  },
]

export default function DevEmailsPage() {
  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
          Dev only
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em]">
          Post-booking email copy
        </h1>
        <p className="mt-3 text-sm text-black/55 dark:text-white/55">
          Transactional subjects and one-line previews for the post-checkout
          lifecycle. Not wired to a mailer in demo.
        </p>

        <ul className="mt-10 space-y-4">
          {TEMPLATES.map((tpl) => (
            <li
              key={tpl.id}
              className="rounded-[12px] border border-black/10 px-5 py-4 dark:border-white/10"
            >
              <p className="font-mono text-xs text-black/45 dark:text-white/45">
                {tpl.id}
              </p>
              <p className="mt-2 font-semibold">{tpl.subject}</p>
              <p className="mt-2 text-sm leading-relaxed text-black/60 dark:text-white/60">
                {tpl.preview}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </PageShell>
  )
}
