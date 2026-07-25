"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { motion } from "framer-motion"
import { useLocale } from "@/lib/i18n/locale"

export function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { tx } = useLocale()
  const headline = tx("Compare rental cars across Tunisia")

  return (
    <section className="relative h-screen w-full overflow-hidden bg-white transition-colors dark:bg-zinc-900">
      <Image
        src="/images/wheelio-full.webp"
        alt={tx("Compare rental cars across Tunisia")}
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div className="absolute inset-0 bg-black/10" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-48 bg-gradient-to-b from-transparent via-white/65 to-white transition-colors dark:via-zinc-900/65 dark:to-zinc-900 md:h-64"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col">
        <nav className="relative z-50 px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-white"
              aria-label={tx("Wheelio home")}
            >
              <Image
                src="/logos/wheelio-icon.png"
                alt=""
                width={48}
                height={48}
                className="size-12 rounded-[12px] shadow-sm"
                priority
              />
              <span className="text-xl font-semibold tracking-[-0.03em]">
                Wheelio
              </span>
            </Link>

            <div className="hidden items-center gap-6 text-sm text-white/70 lg:flex">
              <Link href="#about" className="transition-colors hover:text-white">
                {tx("How it works")}
              </Link>
              <Link href="#features" className="transition-colors hover:text-white">
                {tx("Features")}
              </Link>
              <Link href="#testimonials" className="transition-colors hover:text-white">
                {tx("Reviews")}
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-white">
                {tx("Pricing")}
              </Link>
              <Link href="#faq" className="transition-colors hover:text-white">
                {tx("FAQ")}
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden text-sm text-white/80 sm:block">
                <LanguageSwitcher
                  mutedClassName="text-white/55 transition hover:text-white"
                  activeClassName="text-white font-semibold"
                  className="gap-3"
                />
              </div>
              <ThemeToggle variant="hero" />

              <Link
                href="#search"
                className="hidden text-sm font-medium text-white transition-colors hover:text-white/80 lg:block"
              >
                {tx("Find a car")}
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white lg:hidden"
                aria-label={tx("Toggle menu")}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="absolute left-0 right-0 top-full bg-zinc-900/95 backdrop-blur-sm lg:hidden">
              <div className="flex flex-col gap-4 px-6 py-6">
                {(
                  [
                    ["#about", "How it works"],
                    ["#features", "Features"],
                    ["#testimonials", "Reviews"],
                    ["#pricing", "Pricing"],
                    ["#faq", "FAQ"],
                    ["#search", "Find a car"],
                  ] as const
                ).map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="py-2 text-white/70 transition-colors hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {tx(label)}
                  </Link>
                ))}
                <div className="pt-2 text-white/80">
                  <LanguageSwitcher
                    mutedClassName="text-white/55 transition hover:text-white"
                    activeClassName="text-white font-semibold"
                  />
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="flex flex-1 flex-col items-center px-6 pt-16 text-center md:pt-24">
          <h1 className="max-w-3xl text-balance text-5xl font-normal tracking-tight text-white md:text-6xl lg:text-7xl">
            {headline.split(" ").map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ filter: "blur(10px)", opacity: 0 }}
                whileInView={{ filter: "blur(0px)", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="mr-[0.25em] inline-block"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <p className="mt-6 max-w-xl text-balance text-center text-sm leading-relaxed text-white/70 md:text-base">
            {tx(
              "Search once, compare local agencies, and book the right car with clear prices and conditions.",
            )}
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-white px-6 text-black hover:bg-white/90"
              asChild
            >
              <Link href="/search">{tx("Find a car")}</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
              asChild
            >
              <Link href="/partners/join">{tx("List your agency")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
