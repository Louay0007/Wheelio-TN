"use client"

import { useMemo, useState } from "react"
import {
  COMMISSION_TIERS,
  PARTNER_PRICING,
  agencyRevenueScenarios,
  compareTakeRates,
  formatTndPlain,
  listedFromNet,
  recommendedCommissionExample,
  revenueScaleScenarios,
  travellerRevenueScenarios,
} from "@/lib/partner-pricing"
import { cn } from "@/lib/utils"

export function PartnerPricingModel({ className }: { className?: string }) {
  const [bookingsSlider, setBookingsSlider] = useState(200)
  const example = recommendedCommissionExample()
  const rateRows = useMemo(
    () => compareTakeRates(bookingsSlider),
    [bookingsSlider],
  )
  const scale = revenueScaleScenarios()
  const travellers = travellerRevenueScenarios()
  const agencies = agencyRevenueScenarios()
  const listedPreview = listedFromNet(
    PARTNER_PRICING.exampleAgencyNetDayTnd,
    PARTNER_PRICING.recommendedPercent,
  )

  return (
    <section
      className={cn("space-y-8 rounded-[12px] border border-black/15 bg-white p-5 dark:border-white/15 dark:bg-zinc-950 sm:p-6",
        className,
      )}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/45 dark:text-white/45">
          Marketplace pricing
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
          Recommended commission: {PARTNER_PRICING.recommendedPercent}%
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/55 dark:text-white/55">
          Senior take: below ~8% Wheelio cannot fund payments, support, and growth
          after variable costs (~{PARTNER_PRICING.variableCostPercentOfGmv}% of GMV).
          Above ~15% Tunisian agencies lean harder on offline channels.{" "}
          <strong className="font-semibold text-black dark:text-white">
            {PARTNER_PRICING.recommendedPercent}% of the customer trip total
          </strong>{" "}
          (deposit excluded) is the clearest, most profitable default — agencies keep{" "}
          {100 - PARTNER_PRICING.recommendedPercent}%, travellers see one honest
          price, and Wheelio’s contribution margin stays healthy.
        </p>
      </div>

      {/* Worked example */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[10px] border border-black/10 px-4 py-4 dark:border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45">
            Your net (example)
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {example.agencyNetTnd}
          </p>
          <p className="text-xs text-black/45">TND / day</p>
        </div>
        <div className="rounded-[10px] border border-black bg-black px-4 py-4 text-white dark:border-white dark:bg-white dark:text-black">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-60">
            Listed to customer
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {example.listedPriceTnd}
          </p>
          <p className="text-xs opacity-55">TND / day</p>
        </div>
        <div className="rounded-[10px] border border-dashed border-black/30 px-4 py-4 dark:border-white/30">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
            Wheelio fee
          </p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {example.wheelioFeeTnd}
          </p>
          <p className="text-xs text-black/45 dark:text-white/45">
            TND · {PARTNER_PRICING.recommendedPercent}% of list
          </p>
        </div>
      </div>
      <p className="font-mono text-xs text-black/50 dark:text-white/50">
        Formula: listed = net ÷ (1 − {PARTNER_PRICING.recommendedPercent / 100}) →{" "}
        {PARTNER_PRICING.exampleAgencyNetDayTnd} ÷ 0.
        {100 - PARTNER_PRICING.recommendedPercent} ≈ {listedPreview} TND. Deposit
        never enters this math.
      </p>

      {/* Tiers */}
      <div>
        <h3 className="text-sm font-semibold tracking-[-0.02em]">
          Commission tiers for partners
        </h3>
        <ul className="mt-3 grid gap-3 md:grid-cols-3">
          {COMMISSION_TIERS.map((tier) => (
            <li
              key={tier.id}
              className={cn("rounded-[10px] border p-4",
                tier.recommended
                  ? "border-black bg-black/[0.03] dark:border-white dark:bg-white/[0.05]"
                  : "border-black/10 dark:border-white/10",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{tier.label}</p>
                {tier.recommended ? (
                  <span className="rounded-[6px] bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white dark:bg-white dark:text-black">
                    Best
                  </span>
                ) : null}
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                {tier.percent}%
              </p>
              <p className="mt-2 text-xs leading-relaxed text-black/55 dark:text-white/55">
                {tier.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Rate comparison slider */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-[-0.02em]">
            Which take rate wins?
          </h3>
          <label className="text-sm text-black/55 dark:text-white/55">
            Monthly bookings:{" "}
            <span className="font-mono font-semibold text-black dark:text-white">
              {bookingsSlider}
            </span>
          </label>
        </div>
        <input
          type="range"
          min={50}
          max={2000}
          step={50}
          value={bookingsSlider}
          onChange={(e) => setBookingsSlider(Number(e.target.value))}
          className="mt-3 w-full accent-black dark:accent-white"
          aria-label="Monthly bookings for rate comparison"
        />
        <p className="mt-1 text-xs text-black/45">
          Assumes avg booking GMV {formatTndPlain(PARTNER_PRICING.avgBookingGmvTnd)}{" "}
          (excl. deposit) · variable costs{" "}
          {PARTNER_PRICING.variableCostPercentOfGmv}% of GMV
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.12em] text-black/45 dark:border-white/15 dark:text-white/45">
                <th className="py-2 pr-3 font-semibold">Take rate</th>
                <th className="py-2 pr-3 font-semibold">Agency keeps</th>
                <th className="py-2 pr-3 font-semibold">Wheelio revenue</th>
                <th className="py-2 font-semibold">After var. costs</th>
              </tr>
            </thead>
            <tbody>
              {rateRows.map((row) => (
                <tr
                  key={row.takeRatePercent}
                  className={cn("border-b border-black/8 dark:border-white/8",
                    row.verdict === "recommended" &&
                      "bg-black/[0.04] dark:bg-white/[0.06]",
                  )}
                >
                  <td className="py-2.5 pr-3 font-medium">{row.label}</td>
                  <td className="py-2.5 pr-3 tabular-nums">
                    {row.agencyKeepPercent}%
                  </td>
                  <td className="py-2.5 pr-3 font-mono tabular-nums">
                    {formatTndPlain(row.monthlyRevenueTnd)}
                  </td>
                  <td className="py-2.5 font-mono tabular-nums">
                    {formatTndPlain(row.contributionTnd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scale tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold tracking-[-0.02em]">
            Revenue @ {PARTNER_PRICING.recommendedPercent}% by scale
          </h3>
          <ul className="mt-3 space-y-2">
            {scale.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-2 rounded-[8px] border border-black/10 px-3 py-2.5 dark:border-white/10"
              >
                <div>
                  <p className="font-medium">{s.label}</p>
                  <p className="text-xs text-black/45">{s.note}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold tabular-nums">
                    {formatTndPlain(s.revenueAtRecommendedTnd)}
                    <span className="font-sans text-xs font-normal text-black/45">
                      {" "}
                      / mo
                    </span>
                  </p>
                  <p className="text-[11px] text-black/40">
                    {s.monthlyBookings} bookings · CM{" "}
                    {formatTndPlain(s.contributionTnd)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold tracking-[-0.02em]">
              By monthly active travellers
            </h3>
            <p className="mt-1 text-xs text-black/45">
              Assumes ~3% of MAU book that month · GMV{" "}
              {formatTndPlain(PARTNER_PRICING.avgBookingGmvTnd)}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {travellers.map((t) => (
                <li
                  key={t.monthlyActiveTravellers}
                  className="flex justify-between gap-3 border-b border-black/8 py-2 dark:border-white/8"
                >
                  <span>
                    {t.monthlyActiveTravellers.toLocaleString("en-US")} MAU →{" "}
                    {t.monthlyBookings} bookings
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {formatTndPlain(t.revenueAtRecommendedTnd)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-[-0.02em]">
              By partner agencies
            </h3>
            <p className="mt-1 text-xs text-black/45">
              Assumes ~8 confirmed bookings / agency / month
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {agencies.map((a) => (
                <li
                  key={a.partnerAgencies}
                  className="flex justify-between gap-3 border-b border-black/8 py-2 dark:border-white/8"
                >
                  <span>
                    {a.partnerAgencies} agencies → {a.monthlyBookings} bookings
                  </span>
                  <span className="font-mono font-semibold tabular-nums">
                    {formatTndPlain(a.revenueAtRecommendedTnd)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className="rounded-[8px] border border-black/10 bg-black/[0.02] px-4 py-3 text-xs leading-relaxed text-black/55 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/55">
        Planning model only — not a guarantee. Live contracts may use launch{" "}
        {PARTNER_PRICING.launchPercent}% then standard{" "}
        {PARTNER_PRICING.recommendedPercent}%, with volume relief at{" "}
        {PARTNER_PRICING.volumePercent}%. Sponsored placement can add +
        {PARTNER_PRICING.featuredUpliftPercent}% optionally. Tunisian tax / invoice
        treatment must still be validated with counsel.
      </p>
    </section>
  )
}
