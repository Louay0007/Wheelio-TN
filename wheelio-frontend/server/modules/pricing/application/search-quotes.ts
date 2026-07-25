import { and, eq, gt, lte, notInArray, or, sql } from "drizzle-orm"
import { z } from "zod"
import { searchInputSchema } from "@/lib/contracts/checkout"
import {
  agencies,
  branches,
  inventoryAllocations,
  inventoryHolds,
  ratePlans,
  vehicles,
} from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import { notFound, validationError } from "@/server/core/errors/app-error"
import { buildQuoteBreakdown } from "@/server/modules/pricing/domain/quote-money"
import { searchSessions, quotes, quoteSnapshots } from "@/db/schema/bookings"

const searchSchema = searchInputSchema

export async function createSearch(rawInput: unknown) {
  const parsed = searchSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid search payload", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data
  const pickupAt = new Date(input.pickupAt)
  const returnAt = new Date(input.returnAt)
  if (returnAt <= pickupAt) {
    throw validationError("Return must be after pickup")
  }

  const db = getDb()
  const searchId = createId("srch")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 6)

  await db.insert(searchSessions).values({
    id: searchId,
    querySnapshot: input,
    locale: input.locale,
    expiresAt,
  })

  const liveAgencies = await db.query.agencies.findMany({
    where: and(
      eq(agencies.publicVisibility, true),
      eq(agencies.verificationStatus, "live"),
    ),
  })

  const offers = []
  for (const agency of liveAgencies) {
    const plans = await db.query.ratePlans.findMany({
      where: and(
        eq(ratePlans.agencyId, agency.id),
        eq(ratePlans.active, true),
        input.categoryCode
          ? eq(ratePlans.categoryCode, input.categoryCode)
          : undefined,
        lte(ratePlans.effectiveFrom, pickupAt),
      ),
    })
    for (const plan of plans) {
      if (plan.effectiveTo && plan.effectiveTo < pickupAt) continue
      const branch = plan.branchId
        ? await db.query.branches.findFirst({
            where: and(
              eq(branches.id, plan.branchId),
              eq(branches.active, true),
              eq(branches.publicVisible, true),
            ),
          })
        : null
      if (plan.branchId && !branch) continue

      const unavailableRows = await db.execute(sql`
        SELECT vehicle_id FROM inventory_holds
        WHERE agency_id = ${agency.id}
          AND status = 'held' AND expires_at > now()
          AND tstzrange(reserved_start, reserved_end, '[)') &&
              tstzrange(${pickupAt}, ${returnAt}, '[)')
        UNION
        SELECT vehicle_id FROM inventory_allocations
        WHERE agency_id = ${agency.id}
          AND status IN ('held','confirmed','active')
          AND tstzrange(reserved_start, reserved_end, '[)') &&
              tstzrange(${pickupAt}, ${returnAt}, '[)')
      `)
      const unavailable = new Set(
        (((unavailableRows as unknown as { rows?: Array<{ vehicle_id: string | null }> }).rows) ?? [])
          .map((row) => row.vehicle_id)
          .filter((id): id is string => Boolean(id)),
      )
      const candidate = await db.query.vehicles.findFirst({
        where: and(
          eq(vehicles.agencyId, agency.id),
          eq(vehicles.categoryCode, plan.categoryCode),
          eq(vehicles.status, "ready"),
          eq(vehicles.active, true),
          eq(vehicles.visibility, "public"),
          unavailable.size ? notInArray(vehicles.id, [...unavailable]) : undefined,
        ),
      })
      if (!candidate) continue

      const days = Math.max(
        plan.minimumDays,
        Math.ceil((returnAt.getTime() - pickupAt.getTime()) / (1000 * 60 * 60 * 24)),
      )
      if (plan.maximumDays && days > plan.maximumDays) continue
      const breakdown = buildQuoteBreakdown({
        rentalMillimes: plan.netDailyMillimes * BigInt(days),
        mandatoryFeesMillimes: BigInt(0),
        depositMillimes: BigInt(500_000),
        commissionRateBps: agency.commissionTierBps,
        paymentMode: "pay_at_agency",
      })

      offers.push({
        offerId: `${searchId}:${plan.id}:${candidate.id}`,
        agencyId: agency.id,
        agencySlug: agency.slug,
        agencyName: agency.tradeName,
        categoryCode: plan.categoryCode,
        confirmationMode: agency.instantEnabled ? "instant" : "request",
        paymentMode: "pay_at_agency" as const,
        ratePlanId: plan.id,
        days,
        vehicle: { make: candidate.make, model: candidate.model, year: candidate.year },
        pricing: breakdown,
        sponsored: false,
      })
    }
  }

  return {
    searchId,
    query: input,
    expiresAt: expiresAt.toISOString(),
    offers,
    facets: {
      agencies: liveAgencies.length,
      offers: offers.length,
    },
  }
}

const quoteSchema = z.object({
  searchId: z.string().min(1),
  offerId: z.string().min(1),
  agencyId: z.string().min(1),
  categoryCode: z.string().min(1),
  ratePlanId: z.string().min(1),
  paymentMode: z.enum(["deposit_online", "pay_at_agency"]).default("pay_at_agency"),
})

export async function createQuote(rawInput: unknown) {
  const parsed = quoteSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid quote payload", {
      issues: parsed.error.issues,
    })
  }
  const input = parsed.data
  const db = getDb()

  const search = await db.query.searchSessions.findFirst({
    where: eq(searchSessions.id, input.searchId),
  })
  if (!search || search.expiresAt < new Date()) {
    throw notFound("Search session expired or missing")
  }

  const agency = await db.query.agencies.findFirst({
    where: eq(agencies.id, input.agencyId),
  })
  if (
    !agency ||
    !agency.publicVisibility ||
    agency.verificationStatus !== "live" ||
    agency.suspendedAt
  ) throw notFound("Agency not found")

  const plan = await db.query.ratePlans.findFirst({
    where: and(eq(ratePlans.id, input.ratePlanId), eq(ratePlans.active, true)),
  })
  if (!plan) throw notFound("Rate plan not found")

  if (
    plan.agencyId !== agency.id ||
    plan.categoryCode !== input.categoryCode ||
    input.offerId.split(":")[1] !== plan.id
  ) throw notFound("Offer does not match the canonical search result")
  const searchQuery = search.querySnapshot as z.infer<typeof searchInputSchema>
  const pickupAt = new Date(searchQuery.pickupAt)
  const returnAt = new Date(searchQuery.returnAt)
  const vehicleId = input.offerId.split(":")[2]
  const vehicle = await db.query.vehicles.findFirst({
    where: and(
      eq(vehicles.id, vehicleId),
      eq(vehicles.agencyId, agency.id),
      eq(vehicles.categoryCode, plan.categoryCode),
      eq(vehicles.active, true),
      eq(vehicles.status, "ready"),
      eq(vehicles.visibility, "public"),
    ),
  })
  if (!vehicle) throw notFound("Offer inventory is no longer available")
  const days = Math.max(
    plan.minimumDays,
    Math.ceil((returnAt.getTime() - pickupAt.getTime()) / (1000 * 60 * 60 * 24)),
  )
  const rental = plan.netDailyMillimes * BigInt(days)
  const breakdown = buildQuoteBreakdown({
    rentalMillimes: rental,
    mandatoryFeesMillimes: BigInt(0),
    depositMillimes: BigInt(500_000),
    commissionRateBps: agency.commissionTierBps,
    paymentMode: input.paymentMode,
  })

  return withTransaction(db, async (tx) => {
    const quoteId = createId("qte")
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30)
    await tx.insert(quotes).values({
      id: quoteId,
      searchSessionId: search.id,
      agencyId: agency.id,
      categoryCode: input.categoryCode,
      vehicleId: vehicle.id,
      pickupAt,
      returnAt,
      confirmationMode: agency.instantEnabled ? "instant" : "request",
      paymentMode: input.paymentMode,
      status: "open",
      expiresAt,
    })
    await tx.insert(quoteSnapshots).values({
      id: createId("qsnap"),
      quoteId,
      payloadJson: {
        offerId: input.offerId,
        days,
        pricing: breakdown,
        agencyName: agency.tradeName,
        vehicle: { make: vehicle.make, model: vehicle.model, year: vehicle.year },
        pickupAt: pickupAt.toISOString(),
        returnAt: returnAt.toISOString(),
      },
      rentalMillimes: rental,
      mandatoryFeesMillimes: BigInt(0),
      extrasMillimes: BigInt(0),
      discountMillimes: BigInt(0),
      commissionableMillimes: BigInt(breakdown.commissionable.amountMillimes),
      agencyNetMillimes: BigInt(breakdown.agencyNet.amountMillimes),
      commissionMillimes: BigInt(breakdown.commission.amountMillimes),
      onlineDueMillimes: BigInt(breakdown.onlineDue.amountMillimes),
      deskDueMillimes: BigInt(breakdown.deskDue.amountMillimes),
      depositMillimes: BigInt(breakdown.deposit.amountMillimes),
    })
    return {
      quoteId,
      version: 1,
      expiresAt: expiresAt.toISOString(),
      pricing: breakdown,
      agencyId: agency.id,
      categoryCode: input.categoryCode,
      paymentMode: input.paymentMode,
      confirmationMode: agency.instantEnabled ? "instant" : "request",
      pickupAt: pickupAt.toISOString(),
      returnAt: returnAt.toISOString(),
      agencyName: agency.tradeName,
      vehicle: { make: vehicle.make, model: vehicle.model, year: vehicle.year },
    }
  })
}

export async function getQuote(quoteId: string) {
  const db = getDb()
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, quoteId),
    with: { snapshot: true },
  })
  if (!quote) throw notFound("Quote not found")
  const snapshot = quote.snapshot?.payloadJson as {
    pricing?: unknown
    agencyName?: string
    vehicle?: { make: string; model: string; year: number | null }
  } | undefined
  return {
    quoteId: quote.id,
    version: quote.version,
    status: quote.status,
    expiresAt: quote.expiresAt.toISOString(),
    paymentMode: quote.paymentMode,
    confirmationMode: quote.confirmationMode,
    pricing: snapshot?.pricing ?? null,
    agencyId: quote.agencyId,
    categoryCode: quote.categoryCode,
    pickupAt: quote.pickupAt.toISOString(),
    returnAt: quote.returnAt.toISOString(),
    agencyName: snapshot?.agencyName ?? "",
    vehicle: snapshot?.vehicle ?? { make: "", model: "", year: null },
    expired: quote.expiresAt < new Date(),
  }
}

// Silence unused import in some drizzle setups
void gt
void or
void inventoryHolds
void inventoryAllocations
