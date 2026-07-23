import type { Metadata } from "next"
import Link from "next/link"
import { Mail, MessageCircle } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { ContactForm } from "@/components/contact/contact-form"

export const metadata: Metadata = {
  title: "Contact | Wheelio",
  description:
    "Contact Wheelio TN support by email or WhatsApp during desk hours. Include your booking reference when you can.",
}

const WHATSAPP_URL = "https://wa.me/21600000000"

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Contact"
        title="We’re here during desk hours"
        description="Sunday–Thursday, 09:00–18:00 Tunisia time (UTC+1). We do not run 24/7 phone support — for day-of pickup issues, call the agency on your voucher first."
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Send a message
          </h2>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <aside className="space-y-8 lg:border-l lg:border-black/10 lg:pl-10 dark:lg:border-white/10">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              Email
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <a
                  href="mailto:hello@wheelio.tn"
                  className="inline-flex items-center gap-2 font-medium underline-offset-2 hover:underline"
                >
                  <Mail className="size-4 text-black/40 dark:text-white/40" />
                  hello@wheelio.tn
                </a>
                <p className="mt-1 pl-6 text-black/50 dark:text-white/50">
                  General and partnerships
                </p>
              </li>
              <li>
                <a
                  href="mailto:support@wheelio.tn"
                  className="inline-flex items-center gap-2 font-medium underline-offset-2 hover:underline"
                >
                  <Mail className="size-4 text-black/40 dark:text-white/40" />
                  support@wheelio.tn
                </a>
                <p className="mt-1 pl-6 text-black/50 dark:text-white/50">
                  Bookings and cancellations
                </p>
              </li>
            </ul>
          </div>

          <div className="border-t border-black/10 pt-8 dark:border-white/10">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
              WhatsApp
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-black/55 dark:text-white/55">
              Message us during desk hours for booking questions. Placeholder number until production line is live.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2 rounded-[7px] border border-black/20 px-4 text-sm font-semibold transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
            >
              <MessageCircle className="size-4" />
              Open WhatsApp
            </a>
          </div>

          <div className="border-t border-black/10 pt-8 text-sm text-black/55 dark:border-white/10 dark:text-white/55">
            <p>
              Self-serve first:{" "}
              <Link href="/help" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
                Help centre
              </Link>
              {" · "}
              <Link href="/faq" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
                FAQ
              </Link>
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  )
}
