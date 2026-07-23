"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { motion } from "framer-motion"

export function Hero() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <section className="relative h-screen w-full overflow-hidden bg-white transition-colors dark:bg-zinc-900">
      {/* Background Image */}
      <Image
        src="/images/wheelio-full.webp"
        alt="Dark blue rental car on the Tunisian coast at sunset"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      
      {/* Subtle overlay for text readability */}
      <div className="absolute inset-0 bg-black/10" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-48 bg-gradient-to-b from-transparent via-white/65 to-white transition-colors dark:via-zinc-900/65 dark:to-zinc-900 md:h-64"
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Navigation */}
        <nav className="relative z-50 px-6 py-6">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-white"
              aria-label="Wheelio home"
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
            
            {/* Desktop Navigation */}
            <div className="hidden items-center gap-6 text-sm text-white/70 lg:flex">
              <Link href="#about" className="transition-colors hover:text-white">
                How it works
              </Link>
              <Link href="#features" className="transition-colors hover:text-white">
                Features
              </Link>
              <Link href="#testimonials" className="transition-colors hover:text-white">
                Reviews
              </Link>
              <Link href="#pricing" className="transition-colors hover:text-white">
                Pricing
              </Link>
              <Link href="#faq" className="transition-colors hover:text-white">
                FAQ
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />

              <Link
                href="#search"
                className="hidden text-sm font-medium text-white transition-colors hover:text-white/80 lg:block"
              >
                Find a car
              </Link>
              
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute left-0 right-0 top-full bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-700/30 lg:hidden">
              <div className="flex flex-col px-6 py-6 gap-4">
                <Link
                  href="#about"
                  className="text-white/70 transition-colors hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How it works
                </Link>
                <Link
                  href="#features"
                  className="text-white/70 transition-colors hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#testimonials"
                  className="text-white/70 transition-colors hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reviews
                </Link>
                <Link
                  href="#pricing"
                  className="text-white/70 transition-colors hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#faq"
                  className="text-white/70 transition-colors hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </Link>
                <Link
                  href="#search"
                  className="mt-2 text-white font-medium py-2 border-t border-zinc-700/30"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Find a car
                </Link>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Content - Positioned in upper portion */}
        <div className="flex flex-1 flex-col items-center px-6 pt-16 text-center md:pt-24">
          <h1 className="max-w-3xl text-balance text-5xl font-normal tracking-tight text-white md:text-6xl lg:text-7xl">
            {"Compare rental cars across Tunisia".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ filter: "blur(10px)", opacity: 0 }}
                whileInView={{ filter: "blur(0px)", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
          </h1>
          
          <p className="mt-6 max-w-xl text-balance text-center text-sm leading-relaxed text-white/70 md:text-base">
            Search once, compare local agencies, and book the right car with clear prices and conditions.
          </p>

          {/* CTAs - Two buttons side by side */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="bg-white px-6 text-black hover:bg-white/90"
            >
              Find a car
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white"
            >
              List your agency
            </Button>
          </div>
        </div>

        {/* Scroll Indicator - At bottom */}
        
      </div>
    </section>
  )
}
