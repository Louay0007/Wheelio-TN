import {
  ArrowUpRight,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const footerGroups = [
  {
    title: "Explore",
    links: [
      { label: "Search rental cars", href: "/#search" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Rental locations", href: "/locations" },
      { label: "Customer reviews", href: "/reviews" },
    ],
  },
  {
    title: "For agencies",
    links: [
      { label: "List your agency", href: "mailto:partners@wheelio.tn" },
      { label: "Partner standards", href: "mailto:partners@wheelio.tn" },
      { label: "Agency resources", href: "mailto:partners@wheelio.tn" },
      { label: "Agency portal", href: "mailto:partners@wheelio.tn" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help centre", href: "/help" },
      { label: "FAQ", href: "/faq" },
      { label: "Manage a booking", href: "/account" },
      { label: "Contact support", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Cookie policy", href: "/cookies" },
      { label: "Cancellation policy", href: "/cancellation-policy" },
    ],
  },
]

const socialLinks = [
  { label: "Instagram", href: "#instagram", icon: Instagram },
  { label: "Facebook", href: "#facebook", icon: Facebook },
  { label: "LinkedIn", href: "#linkedin", icon: Linkedin },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-black/10 bg-white text-black transition-colors dark:border-white/15 dark:bg-zinc-900 dark:text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 border-b border-black/10 py-12 dark:border-white/10 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:py-14">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
              One search. Multiple agencies.
            </p>
            <h2 className="max-w-2xl text-3xl font-normal tracking-[-0.04em] sm:text-4xl lg:text-5xl">
              Find the right car for your next trip across Tunisia.
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Link
              href="/#search"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[7px] bg-black px-6 text-sm font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-zinc-200 dark:focus-visible:outline-white"
            >
              Search cars
              <ArrowUpRight className="size-4" />
            </Link>
            <a
              href="mailto:partners@wheelio.tn"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[7px] border border-black/25 px-6 text-sm font-semibold text-black transition hover:border-black/60 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:border-white/25 dark:text-white dark:hover:border-white/60 dark:hover:bg-white/5 dark:focus-visible:outline-white"
            >
              Partner with Wheelio
            </a>
          </div>
        </div>

        <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-[1.25fr_repeat(4,0.75fr)] lg:gap-8 lg:py-16">
          <div className="max-w-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Wheelio home"
            >
              <Image
                src="/logos/wheelio-icon.png"
                alt=""
                width={52}
                height={52}
                className="size-13 rounded-[13px]"
              />
              <span className="text-2xl font-semibold tracking-[-0.04em]">
                Wheelio
              </span>
            </Link>

            <p className="mt-6 text-sm leading-6 text-black/55 dark:text-white/55">
              Compare rental cars from trusted local agencies with clear total
              prices, flexible choices, and one simple booking journey.
            </p>

            <div className="mt-7 space-y-3 text-sm text-black/60 dark:text-white/60">
              <a
                href="mailto:hello@wheelio.tn"
                className="flex w-fit items-center gap-3 transition hover:text-black dark:hover:text-white"
              >
                <Mail className="size-4 text-black/40 dark:text-white/40" />
                hello@wheelio.tn
              </a>
              <p className="flex items-center gap-3">
                <MapPin className="size-4 text-black/40 dark:text-white/40" />
                Tunis, Tunisia
              </p>
            </div>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-black/45 dark:text-white/45">
                {group.title}
              </h3>
              <ul className="mt-5 space-y-3.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-black/65 transition hover:text-black dark:text-white/65 dark:hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-6 border-t border-black/10 py-7 text-xs text-black/45 dark:border-white/10 dark:text-white/45 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>© 2026 Wheelio TN. All rights reserved.</span>
            <span>Prices shown in Tunisian dinar (TND).</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3" aria-label="Languages">
              <button type="button" className="text-black transition dark:text-white">
                EN
              </button>
              <button type="button" className="transition hover:text-black dark:hover:text-white">
                FR
              </button>
              <button type="button" className="transition hover:text-black dark:hover:text-white">
                AR
              </button>
            </div>

            <span className="h-4 w-px bg-black/15 dark:bg-white/15" aria-hidden="true" />

            <div className="flex items-center gap-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full border border-black/15 text-black/55 transition hover:border-black/40 hover:text-black dark:border-white/15 dark:text-white/55 dark:hover:border-white/40 dark:hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="select-none overflow-hidden border-t border-black/10 py-3 text-center text-[clamp(4.5rem,15vw,12rem)] font-semibold leading-none tracking-[-0.08em] text-black/[0.035] dark:border-white/10 dark:text-white/[0.035]"
        >
          WHEELIO
        </div>
      </div>
    </footer>
  )
}
