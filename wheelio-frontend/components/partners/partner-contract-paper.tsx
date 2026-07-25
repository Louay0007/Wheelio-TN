"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { PARTNER_COMMISSION_EXAMPLE, partnerCommissionArticles } from "@/lib/partner-contract"
import { PARTNER_PRICING } from "@/lib/partner-pricing"

type PartnerContractPaperProps = {
  agencyName?: string
  className?: string
  compact?: boolean
}

export function PartnerContractPaper({
  agencyName = "Partner Agency (as named in the application)",
  className,
  compact = false,
}: PartnerContractPaperProps) {
  const articles = partnerCommissionArticles(agencyName)
  const { agencyNetTnd, listedPriceTnd, wheelioFeeTnd, wheelioFeePercent } =
    PARTNER_COMMISSION_EXAMPLE

  return (
    <article
      className={cn(
        "partner-contract relative overflow-hidden border border-black/30 bg-[#fcfcfa] text-[#111] shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
        className,
      )}
      style={{
        fontFamily: "var(--font-contract-serif), 'Times New Roman', Times, serif",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 27px, #000 28px)",
        }}
      />

      <header className="relative border-b-2 border-black px-5 pb-5 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative size-12 overflow-hidden border border-black/25 bg-white">
              <Image
                src="/logos/wheelio-icon.png"
                alt="Wheelio"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/55">
                Wheelio TN
              </p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-black/45">
                Partner marketplace agreement
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em]">
              Formal instrument
            </p>
            <p className="mt-1 font-mono text-[10px] text-black/50">
              WTN-PARTNER-2026
            </p>
          </div>
        </div>

        <div className="mt-5 border-y-[1.5px] border-black py-4 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-black/50">
            Accord partenaire / Partner agreement — Tunisie
          </p>
          <h2 className="mt-2 text-[1.55rem] font-normal leading-tight tracking-[-0.02em] sm:text-[1.85rem]">
            Agency Partnership &amp; Commission Terms
          </h2>
          <p className="mt-2 text-sm italic text-black/55">
            Marketplace distribution · Partner remains the lessor
          </p>
        </div>
      </header>

      <div
        className={cn(
          "relative space-y-6 px-5 py-5 sm:px-8",
          compact && "max-h-[min(52vh,480px)] overflow-y-auto",
        )}
      >
        {/* Commission schedule — signature visual */}
        <section className="border border-black/30 bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/45">
            §3 · Commission schedule (illustrative)
          </p>
          <p className="mt-2 text-xs leading-relaxed text-black/60">
            Partner net → customer list price. Difference = Wheelio fee. Deposits
            stay separate.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="border border-black/15 px-3 py-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-black/45">
                Agency net
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {agencyNetTnd}
              </p>
              <p className="text-[10px] text-black/45">TND</p>
            </div>
            <div className="border border-black bg-black px-3 py-3 text-center text-white">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/60">
                Listed to customer
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {listedPriceTnd}
              </p>
              <p className="text-[10px] text-white/55">TND</p>
            </div>
            <div className="border border-dashed border-black/40 px-3 py-3 text-center">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-black/45">
                Wheelio commission
              </p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
                {wheelioFeeTnd}
              </p>
              <p className="text-[10px] text-black/45">
                TND · ~{wheelioFeePercent}%
              </p>
            </div>
          </div>
          <p className="mt-3 font-mono text-[11px] text-black/55">
            {agencyNetTnd} + {wheelioFeeTnd} = {listedPriceTnd} TND · standard
            take rate {PARTNER_PRICING.recommendedPercent}% of list (deposit
            excluded)
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="border border-black/25 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">
              Marketplace
            </p>
            <p className="mt-2 text-sm font-semibold">Wheelio TN</p>
            <p className="mt-1 text-xs text-black/55">
              Intermediary · Tunis · partners@wheelio.tn
            </p>
          </div>
          <div className="border border-black/25 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">
              Partner agency
            </p>
            <p className="mt-2 text-sm font-semibold">{agencyName}</p>
            <p className="mt-1 text-xs italic text-black/50">
              As completed in the application form
            </p>
          </div>
        </section>

        {articles.map((article) => (
          <section key={article.number}>
            <h3 className="text-[13px] font-semibold tracking-[0.01em]">
              <span className="mr-1.5 font-normal text-black/40">§</span>
              Article {article.number}. {article.titleEn}{" "}
              <span className="font-normal italic text-black/45">
                / {article.titleFr}
              </span>
            </h3>
            <p className="mt-2 text-[13.5px] leading-[1.75] text-black/80">
              {article.body}
            </p>
          </section>
        ))}

        <div className="flex flex-col items-center py-2">
          <div className="flex h-12 w-48 items-center justify-center rounded-full border-[1.5px] border-black px-3 text-center">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em]">WHEELIO TN</p>
              <p className="text-[8px] text-black/55">Partner attestation seal</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="relative border-t border-black/30 px-5 py-3 font-mono text-[9px] text-black/45 sm:px-8">
        WTN-PARTNER-2026 · Commission example {agencyNetTnd}/{listedPriceTnd} TND ·
        Deposit always separate · Demo onboarding copy
      </footer>
    </article>
  )
}
