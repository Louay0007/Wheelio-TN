import { createHash } from "node:crypto"
import { and, desc, eq } from "drizzle-orm"
import {
  agencies,
  agencyProfilesI18n,
  cmsEntries,
  cmsPublications,
  cmsRevisions,
  locationTranslations,
  locations,
  reviews,
  vehicleCategories,
  vehicleCategoryTranslations,
} from "@/db/schema"
import { createId } from "@/server/contracts/ids"
import { closeDb, getDb } from "@/server/core/database/client"
import { FAQ_ITEMS } from "@/lib/faq"
import { GUIDES } from "@/lib/guides"
import { HELP_ARTICLES } from "@/lib/help-articles"
import { LEGAL_DOCS } from "@/lib/legal"

async function seed() {
  const db = getDb()
  await seedCms(db)
  await seedCmsDepth(db)
  await seedStructuredPublicContent(db)
  await seedLocations(db)
  await seedCategories(db)
  await seedAgencies(db)
  console.log("Seed complete: CMS, locations, categories, agencies")
  await closeDb()
}

async function seedStructuredPublicContent(db: ReturnType<typeof getDb>) {
  const records = [
    ...FAQ_ITEMS.map((item) => ({
      kind: "faq",
      slug: item.id,
      title: item.question,
      body: item.answer,
      structured: item,
    })),
    {
      kind: "faq",
      slug: "pay-at-agency",
      title: "What is pay at agency?",
      body: "You pay the rental total at the desk while Wheelio records only the marketplace commission.",
      structured: {
        id: "pay-at-agency",
        category: "Payments",
        question: "What is pay at agency?",
        answer:
          "You pay the rental total at the agency desk. Wheelio records the marketplace commission separately and does not treat the refundable deposit as rental revenue.",
      },
    },
    ...HELP_ARTICLES.map((article) => ({
      kind: "help",
      slug: article.slug,
      title: article.title,
      body: article.summary,
      structured: article,
    })),
    {
      kind: "help",
      slug: "manage-booking",
      title: "Manage your booking",
      body: "Use your booking reference to view schedule, documents, and modification quotes.",
      structured: {
        slug: "manage-booking",
        title: "Manage your booking",
        topic: "Booking",
        summary:
          "Use your booking reference to manage schedules, documents, and changes.",
        updatedAt: "2026-07-01",
        steps: [
          "Open the manage-booking link from your confirmation email.",
          "Enter your booking reference when requested.",
          "Review the schedule, documents, payments, and available changes.",
        ],
        body: [
          "Price changes and refundable deposit changes are always presented separately.",
        ],
        relatedSlugs: ["reading-your-voucher", "cancel-a-booking"],
      },
    },
    ...GUIDES.map((guide) => ({
      kind: "guide",
      slug: guide.slug,
      title: guide.title,
      body: guide.description,
      structured: guide,
    })),
    {
      kind: "guide",
      slug: "airport-pickup",
      title: "Airport pickup guide",
      body: "Prepare for airport desk or meet-and-greet pickup in Tunisia.",
      structured: {
        slug: "airport-pickup",
        title: "Airport pickup guide",
        description:
          "Prepare for airport desk or meet-and-greet pickup in Tunisia.",
        readMinutes: 3,
        updated: "2026-07-01",
        intro:
          "Check your voucher before landing so you know whether to visit a desk or meet an agency representative.",
        sections: [
          {
            heading: "Before arrival",
            paragraphs: [
              "Share your flight number and keep the booking reference available offline.",
            ],
          },
          {
            heading: "At pickup",
            paragraphs: [
              "Confirm the vehicle inspection, rental charge, and refundable deposit as separate items.",
            ],
          },
        ],
        midCta: {
          title: "Compare airport offers",
          body: "Review pickup methods and complete TND totals before booking.",
        },
      },
    },
    ...LEGAL_DOCS.map((document) => ({
      kind: "legal",
      slug: document.slug,
      title: document.title,
      body: document.description,
      structured: document,
    })),
  ]

  for (const record of records) {
    await upsertStructuredCmsEntry(db, record)
  }
  console.log("Structured public CMS content seeded")
}

async function upsertStructuredCmsEntry(
  db: ReturnType<typeof getDb>,
  record: {
    kind: string
    slug: string
    title: string
    body: string
    structured: unknown
  },
) {
  let entry = await db.query.cmsEntries.findFirst({
    where: and(
      eq(cmsEntries.kind, record.kind),
      eq(cmsEntries.slug, record.slug),
    ),
  })
  if (!entry) {
    const id = createId("cms")
    await db.insert(cmsEntries).values({
      id,
      kind: record.kind,
      slug: record.slug,
      status: "published",
    })
    entry = await db.query.cmsEntries.findFirst({
      where: eq(cmsEntries.id, id),
    })
  }
  if (!entry) throw new Error(`Could not seed CMS ${record.kind}/${record.slug}`)

  const structuredContent = JSON.stringify(record.structured)
  const current = await db.query.cmsRevisions.findFirst({
    where: and(
      eq(cmsRevisions.entryId, entry.id),
      eq(cmsRevisions.locale, "en"),
    ),
    orderBy: [desc(cmsRevisions.revision)],
  })
  if (
    current?.title === record.title &&
    current.body === record.body &&
    current.structuredContent === structuredContent
  ) {
    return
  }

  const revisionId = createId("cmr")
  await db.insert(cmsRevisions).values({
    id: revisionId,
    entryId: entry.id,
    revision: (current?.revision ?? 0) + 1,
    locale: "en",
    title: record.title,
    body: record.body,
    structuredContent,
    contentHash: hash(
      `${record.kind}|${record.slug}|en|${record.title}|${structuredContent}`,
    ),
    authorUserId: null,
  })
  await db
    .update(cmsEntries)
    .set({
      status: "published",
      currentRevisionId: revisionId,
      version: entry.version + 1,
    })
    .where(eq(cmsEntries.id, entry.id))

  const publication = await db.query.cmsPublications.findFirst({
    where: and(
      eq(cmsPublications.entryId, entry.id),
      eq(cmsPublications.locale, "en"),
    ),
  })
  if (publication) {
    await db
      .update(cmsPublications)
      .set({
        revisionId,
        publishedAt: new Date(),
        unpublishedAt: null,
      })
      .where(eq(cmsPublications.id, publication.id))
  } else {
    await db.insert(cmsPublications).values({
      id: createId("cmp"),
      entryId: entry.id,
      revisionId,
      locale: "en",
      publishedAt: new Date(),
    })
  }
}

async function seedCms(db: ReturnType<typeof getDb>) {
  const existing = await db.query.cmsEntries.findFirst({
    where: eq(cmsEntries.slug, "about"),
  })
  if (existing) {
    console.log("CMS about page already seeded")
    return
  }

  const entryId = createId("cms")
  const revEn = createId("cmr")
  const revFr = createId("cmr")
  const now = new Date()

  await db.insert(cmsEntries).values({
    id: entryId,
    kind: "page",
    slug: "about",
    status: "published",
    currentRevisionId: revEn,
  })

  await db.insert(cmsRevisions).values([
    {
      id: revEn,
      entryId,
      revision: 1,
      locale: "en",
      title: "About Wheelio TN",
      body: "Wheelio TN helps travelers book cars across Tunisia.",
      contentHash: hash("About Wheelio TN|en"),
      authorUserId: null,
    },
    {
      id: revFr,
      entryId,
      revision: 1,
      locale: "fr",
      title: "À propos de Wheelio TN",
      body: "Wheelio TN aide les voyageurs à réserver des voitures en Tunisie.",
      contentHash: hash("À propos de Wheelio TN|fr"),
      authorUserId: null,
    },
  ])

  await db.insert(cmsPublications).values([
    {
      id: createId("cmp"),
      entryId,
      revisionId: revEn,
      locale: "en",
      publishedAt: now,
    },
    {
      id: createId("cmp"),
      entryId,
      revisionId: revFr,
      locale: "fr",
      publishedAt: now,
    },
  ])
}

async function seedCmsDepth(db: ReturnType<typeof getDb>) {
  const pages: Array<{
    kind: "faq" | "guide" | "help"
    slug: string
    en: { title: string; body: string }
    fr: { title: string; body: string }
  }> = [
    {
      kind: "faq",
      slug: "deposit-vs-rental",
      en: {
        title: "Is the deposit part of the rental price?",
        body: "No. The security deposit is a separate memo held by the agency and is never part of GMV or Wheelio commission.",
      },
      fr: {
        title: "La caution fait-elle partie du prix de location ?",
        body: "Non. La caution est un mémo séparé détenu par l'agence et n'entre jamais dans le GMV ni la commission Wheelio.",
      },
    },
    {
      kind: "faq",
      slug: "pay-at-agency",
      en: {
        title: "What is pay at agency?",
        body: "You pay the rental total at the desk. Wheelio records commission receivable and does not pay agency_net again as a payout.",
      },
      fr: {
        title: "Qu'est-ce que le paiement à l'agence ?",
        body: "Vous payez le total au comptoir. Wheelio enregistre une commission à recevoir et ne reverse pas agency_net une seconde fois.",
      },
    },
    {
      kind: "guide",
      slug: "airport-pickup",
      en: {
        title: "Airport pickup guide",
        body: "Match your voucher code, confirm driver licence, then collect the deposit memo separately from the rental charge.",
      },
      fr: {
        title: "Guide retrait aéroport",
        body: "Vérifiez le code du bon, confirmez le permis, puis collectez la caution séparément du montant de location.",
      },
    },
    {
      kind: "help",
      slug: "manage-booking",
      en: {
        title: "Manage your booking",
        body: "Use your booking reference to view schedule, documents, and modification quotes. Deposit deltas stay separate from price deltas.",
      },
      fr: {
        title: "Gérer votre réservation",
        body: "Utilisez votre référence pour voir le planning, les documents et les devis de modification. Les écarts de caution restent séparés.",
      },
    },
  ]

  for (const page of pages) {
    const existing = await db.query.cmsEntries.findFirst({
      where: and(eq(cmsEntries.kind, page.kind), eq(cmsEntries.slug, page.slug)),
    })
    if (existing) continue

    const entryId = createId("cms")
    const revEn = createId("cmr")
    const revFr = createId("cmr")
    const now = new Date()
    await db.insert(cmsEntries).values({
      id: entryId,
      kind: page.kind,
      slug: page.slug,
      status: "published",
      currentRevisionId: revEn,
    })
    await db.insert(cmsRevisions).values([
      {
        id: revEn,
        entryId,
        revision: 1,
        locale: "en",
        title: page.en.title,
        body: page.en.body,
        contentHash: hash(`${page.en.title}|en`),
        authorUserId: null,
      },
      {
        id: revFr,
        entryId,
        revision: 1,
        locale: "fr",
        title: page.fr.title,
        body: page.fr.body,
        contentHash: hash(`${page.fr.title}|fr`),
        authorUserId: null,
      },
    ])
    await db.insert(cmsPublications).values([
      {
        id: createId("cmp"),
        entryId,
        revisionId: revEn,
        locale: "en",
        publishedAt: now,
      },
      {
        id: createId("cmp"),
        entryId,
        revisionId: revFr,
        locale: "fr",
        publishedAt: now,
      },
    ])
  }
  console.log("CMS depth (faq/guide/help) seeded")
}

async function seedLocations(db: ReturnType<typeof getDb>) {
  const existing = await db.query.locations.findFirst({
    where: eq(locations.slug, "tunis-carthage"),
  })
  if (existing) {
    console.log("Locations already seeded")
    return
  }

  const fixtures = [
    {
      slug: "tunis-carthage",
      type: "airport",
      region: "Tunis",
      searchPickup: "Tunis-Carthage Airport",
      startingFromMillimes: 95_000,
      sortOrder: 1,
      en: {
        name: "Tunis-Carthage Airport",
        shortName: "Tunis-Carthage",
        blurb: "Compare airport desks and meet & greet for arrivals into Tunis.",
        intro:
          "Renting at Tunis-Carthage (TUN) is the most common start for trips across northern Tunisia.",
        pickupTips: [
          "Check whether pickup is terminal desk, meet & greet, or shuttle.",
          "Update your flight number if delayed.",
        ],
        faqs: [
          {
            question: "Is late-night pickup available?",
            answer: "Only when the offer lists after-hours service.",
          },
        ],
      },
      fr: {
        name: "Aéroport Tunis-Carthage",
        shortName: "Tunis-Carthage",
        blurb: "Comparez les comptoirs aéroport et le meet & greet à Tunis.",
        intro:
          "Louer à Tunis-Carthage (TUN) est le départ le plus courant pour le nord de la Tunisie.",
        pickupTips: [
          "Vérifiez si le retrait est au comptoir, meet & greet ou navette.",
          "Mettez à jour votre numéro de vol en cas de retard.",
        ],
        faqs: [
          {
            question: "Le retrait de nuit est-il possible ?",
            answer: "Uniquement si l'offre indique un service hors horaires.",
          },
        ],
      },
    },
    {
      slug: "tunis-centre",
      type: "city",
      region: "Tunis",
      searchPickup: "Tunis Centre",
      startingFromMillimes: 85_000,
      sortOrder: 2,
      en: {
        name: "Tunis Centre",
        shortName: "Tunis Centre",
        blurb: "City pickup for stays in Tunis without an airport transfer.",
        intro: "Tunis Centre pickups suit travellers already in the capital.",
        pickupTips: ["Confirm the branch address on your voucher."],
        faqs: [
          {
            question: "Is delivery available?",
            answer: "Some agencies offer delivery; fees appear in the total.",
          },
        ],
      },
      fr: {
        name: "Tunis Centre",
        shortName: "Tunis Centre",
        blurb: "Retrait en ville pour les séjours à Tunis.",
        intro: "Les retraits Tunis Centre conviennent aux voyageurs déjà en capitale.",
        pickupTips: ["Confirmez l'adresse de l'agence sur votre bon."],
        faqs: [
          {
            question: "La livraison est-elle disponible ?",
            answer: "Certaines agences livrent ; les frais apparaissent dans le total.",
          },
        ],
      },
    },
  ]

  for (const fixture of fixtures) {
    const id = createId("loc")
    await db.insert(locations).values({
      id,
      slug: fixture.slug,
      type: fixture.type,
      region: fixture.region,
      searchPickup: fixture.searchPickup,
      startingFromMillimes: fixture.startingFromMillimes,
      status: "published",
      sortOrder: fixture.sortOrder,
    })
    await db.insert(locationTranslations).values([
      {
        id: createId("ltr"),
        locationId: id,
        locale: "en",
        ...fixture.en,
        pickupTipsJson: fixture.en.pickupTips,
        faqsJson: fixture.en.faqs,
      },
      {
        id: createId("ltr"),
        locationId: id,
        locale: "fr",
        ...fixture.fr,
        pickupTipsJson: fixture.fr.pickupTips,
        faqsJson: fixture.fr.faqs,
      },
    ])
  }
}

async function seedCategories(db: ReturnType<typeof getDb>) {
  const existing = await db.query.vehicleCategories.findFirst({
    where: eq(vehicleCategories.code, "economy"),
  })
  if (existing) {
    console.log("Categories already seeded")
    return
  }

  const cats = [
    {
      code: "economy",
      sortOrder: 1,
      en: {
        label: "Economy",
        blurb: "Small, fuel-efficient hatchbacks for city driving.",
        whoFor: "Solo travellers and couples prioritising a low total.",
      },
      fr: {
        label: "Économique",
        blurb: "Citadines économes pour la ville.",
        whoFor: "Voyageurs solo et couples privilégiant le prix.",
      },
    },
    {
      code: "compact",
      sortOrder: 2,
      en: {
        label: "Compact",
        blurb: "A step up in comfort and boot space.",
        whoFor: "Pairs or small families needing usable luggage space.",
      },
      fr: {
        label: "Compacte",
        blurb: "Plus de confort et de coffre.",
        whoFor: "Couples ou petites familles avec bagages.",
      },
    },
    {
      code: "suv",
      sortOrder: 3,
      en: {
        label: "SUV",
        blurb: "Higher seating and larger boots for family trips.",
        whoFor: "Families with luggage and coastal itineraries.",
      },
      fr: {
        label: "SUV",
        blurb: "Position haute et grand coffre pour la famille.",
        whoFor: "Familles avec bagages et trajets côtiers.",
      },
    },
  ]

  for (const cat of cats) {
    const id = createId("cat")
    await db.insert(vehicleCategories).values({
      id,
      code: cat.code,
      sortOrder: cat.sortOrder,
      active: true,
      attributesJson: {},
    })
    await db.insert(vehicleCategoryTranslations).values([
      {
        id: createId("ctr"),
        categoryId: id,
        locale: "en",
        ...cat.en,
      },
      {
        id: createId("ctr"),
        categoryId: id,
        locale: "fr",
        ...cat.fr,
      },
    ])
  }
}

async function seedAgencies(db: ReturnType<typeof getDb>) {
  const { ratePlans } = await import("@/db/schema")
  let agency = await db.query.agencies.findFirst({
    where: eq(agencies.slug, "medina-cars-tunis"),
  })
  if (!agency) {
    const agencyId = createId("agy")
    await db.insert(agencies).values({
      id: agencyId,
      slug: "medina-cars-tunis",
      tradeName: "Medina Cars Tunis",
      legalName: "Medina Cars SARL",
      city: "Tunis",
      contactEmail: "ops@medina-cars.example",
      verificationStatus: "live",
      commissionTierBps: 1200,
      bookingMode: "request",
      instantEnabled: true,
      publicVisibility: true,
      logoUrl: null,
      ratingAverage: 460,
      reviewCount: 1,
    })
    await db.insert(agencyProfilesI18n).values([
      {
        id: createId("apr"),
        agencyId,
        locale: "en",
        publicName: "Medina Cars Tunis",
        bio: "Airport and city pickups across Greater Tunis.",
        pickupDescription: "Meet & greet available at Tunis-Carthage.",
      },
      {
        id: createId("apr"),
        agencyId,
        locale: "fr",
        publicName: "Medina Cars Tunis",
        bio: "Retraits aéroport et ville dans le Grand Tunis.",
        pickupDescription: "Meet & greet disponible à Tunis-Carthage.",
      },
    ])
    await db.insert(reviews).values({
      id: createId("rev"),
      bookingId: null,
      customerUserId: null,
      agencyId,
      locationId: null,
      rating: 5,
      body: "Clear totals in TND and smooth airport handover.",
      authorDisplayName: "Amine B.",
      status: "visible",
    })
    agency = await db.query.agencies.findFirst({
      where: eq(agencies.id, agencyId),
    })
  }

  if (!agency) return

  const existingRate = await db.query.ratePlans.findFirst({
    where: and(
      eq(ratePlans.agencyId, agency.id),
      eq(ratePlans.categoryCode, "economy"),
    ),
  })
  if (!existingRate) {
    await db.insert(ratePlans).values({
      id: createId("rate"),
      agencyId: agency.id,
      categoryCode: "economy",
      name: "Economy standard",
      netDailyMillimes: BigInt(95_000),
      minimumDays: 1,
      active: true,
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    })
  }

  const { vehicles, vehiclePools, branches } = await import("@/db/schema")
  const existingVehicle = await db.query.vehicles.findFirst({
    where: eq(vehicles.agencyId, agency.id),
  })
  if (!existingVehicle) {
    await db.insert(vehicles).values({
      id: createId("veh"),
      agencyId: agency.id,
      categoryCode: "economy",
      plateHash: hash("TN-1234-TN"),
      make: "Peugeot",
      model: "208",
      year: 2024,
      status: "ready",
      visibility: "public",
      active: true,
    })
  }

  const existingPool = await db.query.vehiclePools.findFirst({
    where: and(
      eq(vehiclePools.agencyId, agency.id),
      eq(vehiclePools.categoryCode, "economy"),
    ),
  })
  if (!existingPool) {
    await db.insert(vehiclePools).values({
      id: createId("pool"),
      agencyId: agency.id,
      categoryCode: "economy",
      name: "Tunis economy pool",
      capacity: 3,
      allocationMode: "pool",
      active: true,
    })
  }

  const existingBranch = await db.query.branches.findFirst({
    where: eq(branches.agencyId, agency.id),
  })
  if (!existingBranch) {
    await db.insert(branches).values({
      id: createId("brn"),
      agencyId: agency.id,
      name: "Tunis Airport desk",
      city: "Tunis",
      addressLine: "Aéroport Tunis-Carthage",
      active: true,
      publicVisible: true,
    })
  }

  const { supportCases } = await import("@/db/schema")
  const existingCase = await db.query.supportCases.findFirst()
  if (!existingCase) {
    await db.insert(supportCases).values({
      id: createId("case"),
      subject: "Smoke: pickup delay at Tunis Airport",
      status: "open",
      priority: "normal",
      agencyId: agency.id,
      channel: "in_app",
      tagsJson: ["smoke", "seed"],
      body: "Seeded support case for Stage 5–6 admin cutover smoke paths.",
    })
  }

  const { partnerApplications } = await import("@/db/schema")
  const { hashTaxId } = await import(
    "@/server/modules/partners/application/admin-applications"
  )
  const existingApp = await db.query.partnerApplications.findFirst({
    where: eq(partnerApplications.email, "join@atlas-rentals.tn"),
  })
  if (!existingApp) {
    await db.insert(partnerApplications).values({
      id: createId("papp"),
      status: "new",
      tradeName: "Atlas Rentals Seed",
      legalName: "Atlas Rentals SARL",
      taxIdHash: hashTaxId("1234567/A/M/000"),
      city: "Sousse",
      email: "join@atlas-rentals.tn",
      phone: "+216 73 000 000",
      fleetSizeEstimate: 12,
      branchesPlanned: 2,
      preferredLocale: "fr",
      docsJson: [
        { label: "Company registration", state: "uploaded" },
        { label: "Tax ID", state: "uploaded" },
        { label: "Insurance", state: "missing" },
      ],
    })
  }

  const {
    agencyFees,
    agencyNotifications,
    agencyPolicies,
  } = await import("@/db/schema")

  const existingFee = await db.query.agencyFees.findFirst({
    where: and(
      eq(agencyFees.agencyId, agency.id),
      eq(agencyFees.code, "airport_counter"),
    ),
  })
  if (!existingFee) {
    await db.insert(agencyFees).values({
      id: createId("fee"),
      agencyId: agency.id,
      code: "airport_counter",
      nameEn: "Airport counter",
      nameFr: "Comptoir aéroport",
      amountMillimes: BigInt(25_000),
      mandatory: true,
      active: true,
      includesDeposit: false,
    })
  }

  const existingPolicy = await db.query.agencyPolicies.findFirst({
    where: and(
      eq(agencyPolicies.agencyId, agency.id),
      eq(agencyPolicies.kind, "cancellation"),
      eq(agencyPolicies.locale, "en"),
    ),
  })
  if (!existingPolicy) {
    await db.insert(agencyPolicies).values([
      {
        id: createId("apol"),
        agencyId: agency.id,
        kind: "cancellation",
        locale: "en",
        summary:
          "Free cancellation up to 48h before pickup. Later cancellations may keep one day.",
        bodyMarkdown: "",
        rulesJson: { freeCancelHours: 48 },
      },
      {
        id: createId("apol"),
        agencyId: agency.id,
        kind: "cancellation",
        locale: "fr",
        summary:
          "Annulation gratuite jusqu'à 48h avant le retrait. Après, une journée peut être retenue.",
        bodyMarkdown: "",
        rulesJson: { freeCancelHours: 48 },
      },
    ])
  }

  const existingNotif = await db.query.agencyNotifications.findFirst({
    where: eq(agencyNotifications.agencyId, agency.id),
  })
  if (!existingNotif) {
    await db.insert(agencyNotifications).values({
      id: createId("anot"),
      agencyId: agency.id,
      type: "booking_request",
      title: "Seed: new request waiting",
      body: "Open bookings queue to accept or decline.",
      href: "/agency/bookings",
    })
  }
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

seed().catch(async (error) => {
  console.error(error)
  await closeDb().catch(() => undefined)
  process.exit(1)
})
