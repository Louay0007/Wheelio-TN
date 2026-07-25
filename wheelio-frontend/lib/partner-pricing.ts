/**
 * Wheelio TN partner marketplace pricing model (planning assumptions).
 * Currency: TND. Deposits are excluded from GMV / commission.
 *
 * Recommendation rationale (senior marketplace economics):
 * - Global OTA / aggregator take rates on car rental often sit ~10–18%.
 * - For Tunisia multi-agency supply, >15% increases offline undercut risk;
 *   <8% leaves thin margin after payment fees (~2–3% effective), support, refunds, and CAC.
 * - Project plan already pointed at transparent commission near 12% and net→list markup.
 * - Sweet spot: **12% of customer mandatory trip total** (standard), with launch / volume relief.
 */

export const PARTNER_PRICING = {
  /** Recommended standard take rate on customer mandatory total (excl. deposit). */
  recommendedPercent: 12,
  /** Launch window for first partners (first 90 days or first 20 agencies). */
  launchPercent: 10,
  /** Negotiated floor for high-volume partners (≥30 confirmed bookings / month). */
  volumePercent: 10,
  /** Optional sponsored placement uplift on top of base (not default). */
  featuredUpliftPercent: 2,
  /** Assumed payment + refund + support drag as % of GMV. */
  variableCostPercentOfGmv: 2.5,
  /** Planning average booking GMV (excl. deposit), TND. */
  avgBookingGmvTnd: 440,
  /** Planning avg trip length (days) for the example day rate. */
  avgTripDays: 4,
  /** Example agency net day rate used in contracts / UI. */
  exampleAgencyNetDayTnd: 95,
} as const

export type CommissionTierId = "launch" | "standard" | "volume"

export type CommissionTier = {
  id: CommissionTierId
  label: string
  percent: number
  description: string
  recommended?: boolean
}

export const COMMISSION_TIERS: CommissionTier[] = [
  {
    id: "launch",
    label: "Launch",
    percent: PARTNER_PRICING.launchPercent,
    description: "First 90 days or first 20 approved agencies — grow supply fast.",
  },
  {
    id: "standard",
    label: "Standard",
    percent: PARTNER_PRICING.recommendedPercent,
    description:
      "Default marketplace rate. Best balance of agency take-home and Wheelio unit economics.",
    recommended: true,
  },
  {
    id: "volume",
    label: "Volume",
    percent: PARTNER_PRICING.volumePercent,
    description: "Eligible after ~30 confirmed bookings / month with strong SLA.",
  },
]

/** Listed customer price from agency net at a take rate (% of list). */
export function listedFromNet(agencyNetTnd: number, takeRatePercent: number): number {
  const rate = takeRatePercent / 100
  if (rate >= 1) return agencyNetTnd
  return Math.round(agencyNetTnd / (1 - rate))
}

export function commissionFromList(listedTnd: number, takeRatePercent: number): number {
  return Math.round((listedTnd * takeRatePercent) / 100)
}

export function partnerNetFromList(listedTnd: number, takeRatePercent: number): number {
  return listedTnd - commissionFromList(listedTnd, takeRatePercent)
}

export function contributionMarginPercent(takeRatePercent: number): number {
  return Math.round((takeRatePercent - PARTNER_PRICING.variableCostPercentOfGmv) * 10) / 10
}

export type RateComparisonRow = {
  takeRatePercent: number
  label: string
  monthlyRevenueTnd: number
  contributionTnd: number
  agencyKeepPercent: number
  verdict: "thin" | "lean" | "recommended" | "aggressive" | "risky"
}

/** Compare take rates at a fixed monthly booking volume. */
export function compareTakeRates(monthlyBookings: number): RateComparisonRow[] {
  const gmv = monthlyBookings * PARTNER_PRICING.avgBookingGmvTnd
  const rates = [5, 8, 10, 12, 15, 18] as const
  return rates.map((takeRatePercent) => {
    const monthlyRevenueTnd = Math.round((gmv * takeRatePercent) / 100)
    const costs = Math.round((gmv * PARTNER_PRICING.variableCostPercentOfGmv) / 100)
    const contributionTnd = monthlyRevenueTnd - costs
    const agencyKeepPercent = 100 - takeRatePercent
    let verdict: RateComparisonRow["verdict"] = "lean"
    let label = `${takeRatePercent}%`
    if (takeRatePercent <= 5) {
      verdict = "thin"
      label = "5% — too thin"
    } else if (takeRatePercent === 8) {
      verdict = "lean"
      label = "8% — lean growth"
    } else if (takeRatePercent === 10) {
      verdict = "lean"
      label = "10% — launch / volume"
    } else if (takeRatePercent === 12) {
      verdict = "recommended"
      label = "12% — recommended"
    } else if (takeRatePercent === 15) {
      verdict = "aggressive"
      label = "15% — aggressive"
    } else {
      verdict = "risky"
      label = "18% — supply risk"
    }
    return {
      takeRatePercent,
      label,
      monthlyRevenueTnd,
      contributionTnd,
      agencyKeepPercent,
      verdict,
    }
  })
}

export type ScaleScenario = {
  id: string
  label: string
  monthlyBookings: number
  gmvTnd: number
  revenueAtRecommendedTnd: number
  contributionTnd: number
  note: string
}

/** Revenue scale at the recommended 12% take rate. */
export function revenueScaleScenarios(): ScaleScenario[] {
  const pct = PARTNER_PRICING.recommendedPercent
  const rows: Omit<ScaleScenario, "gmvTnd" | "revenueAtRecommendedTnd" | "contributionTnd">[] =
    [
      {
        id: "pilot",
        label: "Pilot",
        monthlyBookings: 80,
        note: "~10 agencies · early Tunis/airport focus",
      },
      {
        id: "traction",
        label: "Traction",
        monthlyBookings: 200,
        note: "~25 agencies · multi-city coast",
      },
      {
        id: "scale",
        label: "Scale",
        monthlyBookings: 600,
        note: "~50–75 agencies · diaspora peak season",
      },
      {
        id: "leader",
        label: "Category leader",
        monthlyBookings: 1500,
        note: "~100+ agencies · national coverage",
      },
      {
        id: "mature",
        label: "Mature marketplace",
        monthlyBookings: 3000,
        note: "High repeat + corporate + widgets",
      },
    ]

  return rows.map((r) => {
    const gmvTnd = r.monthlyBookings * PARTNER_PRICING.avgBookingGmvTnd
    const revenueAtRecommendedTnd = Math.round((gmvTnd * pct) / 100)
    const costs = Math.round((gmvTnd * PARTNER_PRICING.variableCostPercentOfGmv) / 100)
    return {
      ...r,
      gmvTnd,
      revenueAtRecommendedTnd,
      contributionTnd: revenueAtRecommendedTnd - costs,
    }
  })
}

export type TravellerScenario = {
  monthlyActiveTravellers: number
  assumedBookingRatePercent: number
  monthlyBookings: number
  revenueAtRecommendedTnd: number
}

/** Funnel from monthly active travellers → bookings → Wheelio revenue @ 12%. */
export function travellerRevenueScenarios(): TravellerScenario[] {
  const bookingRate = 3 // % of MAU who complete a booking that month
  const counts = [1_000, 5_000, 20_000, 50_000, 100_000]
  return counts.map((monthlyActiveTravellers) => {
    const monthlyBookings = Math.round(
      (monthlyActiveTravellers * bookingRate) / 100,
    )
    const gmv = monthlyBookings * PARTNER_PRICING.avgBookingGmvTnd
    return {
      monthlyActiveTravellers,
      assumedBookingRatePercent: bookingRate,
      monthlyBookings,
      revenueAtRecommendedTnd: Math.round(
        (gmv * PARTNER_PRICING.recommendedPercent) / 100,
      ),
    }
  })
}

export type AgencyScenario = {
  partnerAgencies: number
  bookingsPerAgencyPerMonth: number
  monthlyBookings: number
  revenueAtRecommendedTnd: number
}

export function agencyRevenueScenarios(): AgencyScenario[] {
  const perAgency = 8
  const agencies = [10, 25, 50, 100, 200]
  return agencies.map((partnerAgencies) => {
    const monthlyBookings = partnerAgencies * perAgency
    const gmv = monthlyBookings * PARTNER_PRICING.avgBookingGmvTnd
    return {
      partnerAgencies,
      bookingsPerAgencyPerMonth: perAgency,
      monthlyBookings,
      revenueAtRecommendedTnd: Math.round(
        (gmv * PARTNER_PRICING.recommendedPercent) / 100,
      ),
    }
  })
}

/** Contract / UI example numbers at the recommended rate. */
export function recommendedCommissionExample(agencyNetDayTnd = PARTNER_PRICING.exampleAgencyNetDayTnd) {
  const percent = PARTNER_PRICING.recommendedPercent
  const listedPriceTnd = listedFromNet(agencyNetDayTnd, percent)
  const wheelioFeeTnd = listedPriceTnd - agencyNetDayTnd
  return {
    agencyNetTnd: agencyNetDayTnd,
    listedPriceTnd,
    wheelioFeeTnd,
    wheelioFeePercent: percent,
  }
}

export function formatTndPlain(amount: number): string {
  return `${Math.round(amount).toLocaleString("en-US")} TND`
}
