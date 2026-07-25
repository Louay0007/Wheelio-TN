/**
 * Wheelio TN agency portal — demo workspace + bookings.
 * Deposit is never part of GMV / commission.
 */

import { listedFromNet, PARTNER_PRICING } from "@/lib/partner-pricing"

export type AgencyRole = "owner" | "manager" | "agent" | "fleet" | "accountant"

export type AgencyVerification =
  | "draft"
  | "review"
  | "live"
  | "paused"
  | "suspended"

export type CommissionTier = "launch" | "standard" | "volume"

export type AgencyBookingStatus =
  | "requested"
  | "held"
  | "payment_pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled"
  | "expired"
  | "rejected"
  | "no_show"

export type VehicleStatus = "ready" | "on_rent" | "maintenance" | "hidden"

export type AgencyStaff = {
  id: string
  name: string
  email: string
  role: AgencyRole
  status: "active" | "invited" | "disabled"
  lastActiveLabel: string
}

export type AgencyBranch = {
  id: string
  name: string
  city: string
  address: string
  phone: string
  pickupMethods: string[]
  hoursLabel: string
}

export type AgencyVehicle = {
  id: string
  plate: string
  makeModel: string
  year: number
  category: string
  transmission: "auto" | "manual"
  fuel: string
  seats: number
  bags: number
  branchId: string
  status: VehicleStatus
  photoCount: number
  nextBookingLabel?: string
  poolId?: string
}

export type RatePlan = {
  id: string
  name: string
  category: string
  netDayTnd: number
  minDays: number
  weekendUpliftPercent: number
  seasonalNote?: string
}

export type AgencyBooking = {
  id: string
  reference: string
  status: AgencyBookingStatus
  confirmation: "instant" | "request"
  slaExpiresAt?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  driverName: string
  flightNumber?: string
  vehicleId?: string
  categoryLabel: string
  orSimilar: boolean
  listedTotalTnd: number
  agencyNetTnd: number
  commissionTnd: number
  takeRatePercent: number
  depositTnd: number
  onlineCollectedTnd: number
  deskDueTnd: number
  pickupAt: string
  returnAt: string
  pickupLabel: string
  returnLabel: string
  branchId: string
  paymentMode: "deposit_online" | "pay_at_agency"
  extras: string[]
  prepareReady?: boolean
  timeline: { label: string; at: string }[]
  hasConflict?: boolean
  unreadMessages?: number
}

export type AgencyPayout = {
  id: string
  periodLabel: string
  gmvTnd: number
  commissionTnd: number
  netPayableTnd: number
  status: "scheduled" | "paid" | "on_hold"
  bankLast4: string
  bookingIds: string[]
}

export type AgencyNotification = {
  id: string
  title: string
  body: string
  href: string
  at: string
  read: boolean
}

export type OnboardingStepId =
  | "profile"
  | "documents"
  | "branch"
  | "fleet"
  | "rates"
  | "policies"
  | "booking_mode"
  | "review"

export type AgencyWorkspace = {
  id: string
  slug: string
  legalName: string
  tradeName: string
  taxId: string
  email: string
  phone: string
  verification: AgencyVerification
  commissionTier: CommissionTier
  takeRatePercent: 10 | 12
  bookingMode: "request" | "hybrid" | "instant"
  qualityScore: number
  acceptanceRate: number
  avgResponseHours: number
  ibanLast4: string
  branches: AgencyBranch[]
  vehicles: AgencyVehicle[]
  ratePlans: RatePlan[]
  staff: AgencyStaff[]
  bookings: AgencyBooking[]
  payouts: AgencyPayout[]
  notifications: AgencyNotification[]
  onboardingDone: Record<OnboardingStepId, boolean>
  calendarBlocks: {
    id: string
    vehicleId: string
    label: string
    startLabel: string
    endLabel: string
    kind: "maintenance" | "owner_use" | "cleaning"
  }[]
  policies: {
    cancellation: string
    mileage: string
    fuel: string
    deposit: string
    drivers: string
    protection: string
  }
  publicBio: string
}

export const AGENCY_STORAGE_KEY = "wheelio-agency-workspace"
export const AGENCY_SESSION_KEY = "wheelio-agency-session"

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600_000).toISOString()
}

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString()
}

function moneySplit(net: number, takeRate: number) {
  const listed = listedFromNet(net, takeRate)
  const commission = listed - net
  return { listed, commission, net }
}

export function createDemoAgencyWorkspace(): AgencyWorkspace {
  const take = PARTNER_PRICING.recommendedPercent as 10 | 12
  const day = moneySplit(95, take)
  const trip3 = moneySplit(95 * 3, take)
  const trip5 = moneySplit(110 * 5, take)
  const trip7 = moneySplit(140 * 7, take)

  const branches: AgencyBranch[] = [
    {
      id: "br-tunis",
      name: "Tunis–Carthage desk",
      city: "Tunis",
      address: "Aéroport Tunis-Carthage, Terminal 1 arrivals",
      phone: "+216 71 000 100",
      pickupMethods: ["counter", "meet_greet"],
      hoursLabel: "07:00–22:00 · desk days",
    },
    {
      id: "br-marsa",
      name: "La Marsa city",
      city: "La Marsa",
      address: "Avenue Habib Bourguiba, La Marsa",
      phone: "+216 71 000 200",
      pickupMethods: ["counter", "delivery"],
      hoursLabel: "09:00–19:00",
    },
  ]

  const vehicles: AgencyVehicle[] = [
    {
      id: "vh-1",
      plate: "123 TU 456",
      makeModel: "Hyundai i10",
      year: 2023,
      category: "Economy",
      transmission: "manual",
      fuel: "Petrol",
      seats: 4,
      bags: 2,
      branchId: "br-tunis",
      status: "ready",
      photoCount: 5,
      nextBookingLabel: "Tomorrow 10:00",
    },
    {
      id: "vh-2",
      plate: "789 TU 012",
      makeModel: "Renault Clio",
      year: 2024,
      category: "Compact",
      transmission: "auto",
      fuel: "Petrol",
      seats: 5,
      bags: 3,
      branchId: "br-tunis",
      status: "on_rent",
      photoCount: 6,
      nextBookingLabel: "On rent · return Fri",
      poolId: "pool-compact",
    },
    {
      id: "vh-3",
      plate: "345 TU 678",
      makeModel: "Peugeot 208",
      year: 2022,
      category: "Compact",
      transmission: "auto",
      fuel: "Petrol",
      seats: 5,
      bags: 3,
      branchId: "br-tunis",
      status: "ready",
      photoCount: 4,
      poolId: "pool-compact",
    },
    {
      id: "vh-4",
      plate: "901 TU 234",
      makeModel: "Dacia Duster",
      year: 2023,
      category: "SUV",
      transmission: "manual",
      fuel: "Diesel",
      seats: 5,
      bags: 4,
      branchId: "br-marsa",
      status: "ready",
      photoCount: 5,
    },
    {
      id: "vh-5",
      plate: "567 TU 890",
      makeModel: "Toyota Corolla",
      year: 2021,
      category: "Intermediate",
      transmission: "auto",
      fuel: "Hybrid",
      seats: 5,
      bags: 3,
      branchId: "br-marsa",
      status: "maintenance",
      photoCount: 3,
      nextBookingLabel: "Blocked · service",
    },
    {
      id: "vh-6",
      plate: "234 TU 567",
      makeModel: "Fiat 500",
      year: 2020,
      category: "Economy",
      transmission: "manual",
      fuel: "Petrol",
      seats: 4,
      bags: 1,
      branchId: "br-tunis",
      status: "hidden",
      photoCount: 2,
    },
  ]

  const bookings: AgencyBooking[] = [
    {
      id: "agb-req-1",
      reference: "WTN-881001",
      status: "requested",
      confirmation: "request",
      slaExpiresAt: hoursFromNow(4.5),
      customerName: "Amira Ben Salah",
      customerEmail: "amira@example.com",
      customerPhone: "+216 98 111 001",
      driverName: "Amira Ben Salah",
      flightNumber: "TU208",
      categoryLabel: "Economy · Hyundai i10 or similar",
      orSimilar: true,
      listedTotalTnd: trip3.listed,
      agencyNetTnd: trip3.net,
      commissionTnd: trip3.commission,
      takeRatePercent: take,
      depositTnd: 500,
      onlineCollectedTnd: 0,
      deskDueTnd: trip3.listed,
      pickupAt: hoursFromNow(30),
      returnAt: hoursFromNow(102),
      pickupLabel: "Tunis–Carthage · tomorrow 10:00",
      returnLabel: "Tunis–Carthage · +3 days 10:00",
      branchId: "br-tunis",
      paymentMode: "pay_at_agency",
      extras: ["child_seat"],
      timeline: [{ label: "Request received", at: hoursAgo(1.2) }],
      hasConflict: false,
      unreadMessages: 1,
    },
    {
      id: "agb-req-2",
      reference: "WTN-881002",
      status: "requested",
      confirmation: "request",
      slaExpiresAt: hoursFromNow(1.2),
      customerName: "Karim Trabelsi",
      customerEmail: "karim@example.com",
      customerPhone: "+216 98 111 002",
      driverName: "Karim Trabelsi",
      vehicleId: "vh-4",
      categoryLabel: "SUV · Dacia Duster",
      orSimilar: false,
      listedTotalTnd: trip5.listed,
      agencyNetTnd: trip5.net,
      commissionTnd: trip5.commission,
      takeRatePercent: take,
      depositTnd: 800,
      onlineCollectedTnd: Math.round(trip5.listed * 0.2),
      deskDueTnd: trip5.listed - Math.round(trip5.listed * 0.2),
      pickupAt: hoursFromNow(48),
      returnAt: hoursFromNow(168),
      pickupLabel: "La Marsa · in 2 days 09:00",
      returnLabel: "La Marsa · +5 days",
      branchId: "br-marsa",
      paymentMode: "deposit_online",
      extras: [],
      timeline: [{ label: "Request received", at: hoursAgo(4) }],
      hasConflict: true,
      unreadMessages: 0,
    },
    {
      id: "agb-req-3",
      reference: "WTN-881003",
      status: "requested",
      confirmation: "request",
      slaExpiresAt: hoursFromNow(5.8),
      customerName: "Sofia Moreau",
      customerEmail: "sofia@example.com",
      customerPhone: "+33 6 00 00 00",
      driverName: "Sofia Moreau",
      categoryLabel: "Compact · Clio or similar",
      orSimilar: true,
      listedTotalTnd: day.listed * 4,
      agencyNetTnd: 95 * 4,
      commissionTnd: day.listed * 4 - 95 * 4,
      takeRatePercent: take,
      depositTnd: 600,
      onlineCollectedTnd: 0,
      deskDueTnd: day.listed * 4,
      pickupAt: hoursFromNow(72),
      returnAt: hoursFromNow(168),
      pickupLabel: "Tunis–Carthage · in 3 days",
      returnLabel: "Tunis–Carthage · +4 days",
      branchId: "br-tunis",
      paymentMode: "pay_at_agency",
      extras: ["gps"],
      timeline: [{ label: "Request received", at: hoursAgo(0.5) }],
    },
    {
      id: "agb-conf-1",
      reference: "WTN-770101",
      status: "confirmed",
      confirmation: "instant",
      customerName: "Youssef Khelifi",
      customerEmail: "youssef@example.com",
      customerPhone: "+216 98 222 001",
      driverName: "Youssef Khelifi",
      vehicleId: "vh-1",
      categoryLabel: "Economy · Hyundai i10",
      orSimilar: false,
      listedTotalTnd: trip3.listed,
      agencyNetTnd: trip3.net,
      commissionTnd: trip3.commission,
      takeRatePercent: take,
      depositTnd: 500,
      onlineCollectedTnd: Math.round(trip3.listed * 0.15),
      deskDueTnd: trip3.listed - Math.round(trip3.listed * 0.15),
      pickupAt: hoursFromNow(6),
      returnAt: hoursFromNow(78),
      pickupLabel: "Tunis–Carthage · today 16:00",
      returnLabel: "Tunis–Carthage · +3 days",
      branchId: "br-tunis",
      paymentMode: "deposit_online",
      extras: [],
      prepareReady: false,
      timeline: [
        { label: "Instant confirmation", at: hoursAgo(20) },
        { label: "Assigned plate 123 TU 456", at: hoursAgo(19) },
      ],
      unreadMessages: 0,
    },
    {
      id: "agb-conf-2",
      reference: "WTN-770102",
      status: "confirmed",
      confirmation: "request",
      customerName: "Leila Mansouri",
      customerEmail: "leila@example.com",
      customerPhone: "+216 98 222 002",
      driverName: "Leila Mansouri",
      vehicleId: "vh-3",
      categoryLabel: "Compact · Peugeot 208",
      orSimilar: false,
      listedTotalTnd: trip7.listed,
      agencyNetTnd: trip7.net,
      commissionTnd: trip7.commission,
      takeRatePercent: take,
      depositTnd: 700,
      onlineCollectedTnd: 0,
      deskDueTnd: trip7.listed,
      pickupAt: hoursFromNow(26),
      returnAt: hoursFromNow(194),
      pickupLabel: "Tunis–Carthage · tomorrow 08:00",
      returnLabel: "Tunis–Carthage · +7 days",
      branchId: "br-tunis",
      paymentMode: "pay_at_agency",
      extras: ["additional_driver"],
      prepareReady: true,
      timeline: [
        { label: "Request accepted", at: hoursAgo(40) },
        { label: "Ready for handover", at: hoursAgo(2) },
      ],
    },
    {
      id: "agb-active-1",
      reference: "WTN-660201",
      status: "active",
      confirmation: "instant",
      customerName: "Nicolas Petit",
      customerEmail: "nicolas@example.com",
      customerPhone: "+33 6 11 22 33",
      driverName: "Nicolas Petit",
      vehicleId: "vh-2",
      categoryLabel: "Compact · Renault Clio",
      orSimilar: false,
      listedTotalTnd: trip5.listed,
      agencyNetTnd: trip5.net,
      commissionTnd: trip5.commission,
      takeRatePercent: take,
      depositTnd: 600,
      onlineCollectedTnd: trip5.listed,
      deskDueTnd: 0,
      pickupAt: hoursAgo(26),
      returnAt: hoursFromNow(70),
      pickupLabel: "Picked up yesterday",
      returnLabel: "Return in ~3 days",
      branchId: "br-tunis",
      paymentMode: "deposit_online",
      extras: [],
      timeline: [
        { label: "Confirmed", at: hoursAgo(50) },
        { label: "Handover completed · deposit held", at: hoursAgo(26) },
      ],
      unreadMessages: 2,
    },
    {
      id: "agb-done-1",
      reference: "WTN-550301",
      status: "completed",
      confirmation: "request",
      customerName: "Hana Gharbi",
      customerEmail: "hana@example.com",
      customerPhone: "+216 98 333 001",
      driverName: "Hana Gharbi",
      vehicleId: "vh-4",
      categoryLabel: "SUV · Dacia Duster",
      orSimilar: false,
      listedTotalTnd: trip3.listed,
      agencyNetTnd: trip3.net,
      commissionTnd: trip3.commission,
      takeRatePercent: take,
      depositTnd: 800,
      onlineCollectedTnd: 0,
      deskDueTnd: 0,
      pickupAt: hoursAgo(200),
      returnAt: hoursAgo(128),
      pickupLabel: "Completed pickup",
      returnLabel: "Returned on time",
      branchId: "br-marsa",
      paymentMode: "pay_at_agency",
      extras: [],
      timeline: [
        { label: "Accepted", at: hoursAgo(220) },
        { label: "Returned · deposit released", at: hoursAgo(128) },
      ],
    },
    {
      id: "agb-pay-1",
      reference: "WTN-440401",
      status: "payment_pending",
      confirmation: "request",
      customerName: "Omar Jebali",
      customerEmail: "omar@example.com",
      customerPhone: "+216 98 444 001",
      driverName: "Omar Jebali",
      categoryLabel: "Intermediate · Corolla or similar",
      orSimilar: true,
      listedTotalTnd: trip3.listed,
      agencyNetTnd: trip3.net,
      commissionTnd: trip3.commission,
      takeRatePercent: take,
      depositTnd: 700,
      onlineCollectedTnd: 0,
      deskDueTnd: trip3.listed,
      pickupAt: hoursFromNow(96),
      returnAt: hoursFromNow(168),
      pickupLabel: "In 4 days",
      returnLabel: "+3 days",
      branchId: "br-marsa",
      paymentMode: "deposit_online",
      extras: [],
      timeline: [
        { label: "Accepted · awaiting online payment", at: hoursAgo(6) },
      ],
    },
    {
      id: "agb-can-1",
      reference: "WTN-330501",
      status: "cancelled",
      confirmation: "request",
      customerName: "Sara Louati",
      customerEmail: "sara@example.com",
      customerPhone: "+216 98 555 001",
      driverName: "Sara Louati",
      categoryLabel: "Economy",
      orSimilar: true,
      listedTotalTnd: day.listed * 2,
      agencyNetTnd: 95 * 2,
      commissionTnd: day.listed * 2 - 190,
      takeRatePercent: take,
      depositTnd: 500,
      onlineCollectedTnd: 0,
      deskDueTnd: 0,
      pickupAt: hoursAgo(10),
      returnAt: hoursAgo(-38),
      pickupLabel: "Was tomorrow",
      returnLabel: "—",
      branchId: "br-tunis",
      paymentMode: "pay_at_agency",
      extras: [],
      timeline: [
        { label: "Cancelled by customer", at: hoursAgo(8) },
      ],
    },
    {
      id: "agb-rej-1",
      reference: "WTN-220601",
      status: "rejected",
      confirmation: "request",
      customerName: "Guest Traveller",
      customerEmail: "guest@example.com",
      customerPhone: "+216 98 666 001",
      driverName: "Guest Traveller",
      categoryLabel: "SUV",
      orSimilar: false,
      listedTotalTnd: trip5.listed,
      agencyNetTnd: trip5.net,
      commissionTnd: trip5.commission,
      takeRatePercent: take,
      depositTnd: 800,
      onlineCollectedTnd: 0,
      deskDueTnd: 0,
      pickupAt: hoursAgo(5),
      returnAt: hoursAgo(-115),
      pickupLabel: "—",
      returnLabel: "—",
      branchId: "br-marsa",
      paymentMode: "pay_at_agency",
      extras: [],
      timeline: [{ label: "Declined · unavailable", at: hoursAgo(4) }],
    },
    {
      id: "agb-held-1",
      reference: "WTN-110701",
      status: "held",
      confirmation: "request",
      customerName: "Mehdi Ayari",
      customerEmail: "mehdi@example.com",
      customerPhone: "+216 98 777 001",
      driverName: "Mehdi Ayari",
      vehicleId: "vh-3",
      categoryLabel: "Compact · Peugeot 208",
      orSimilar: false,
      listedTotalTnd: trip3.listed,
      agencyNetTnd: trip3.net,
      commissionTnd: trip3.commission,
      takeRatePercent: take,
      depositTnd: 600,
      onlineCollectedTnd: 0,
      deskDueTnd: trip3.listed,
      pickupAt: hoursFromNow(40),
      returnAt: hoursFromNow(112),
      pickupLabel: "Hold until payment",
      returnLabel: "+3 days",
      branchId: "br-tunis",
      paymentMode: "deposit_online",
      extras: [],
      timeline: [{ label: "Soft hold placed", at: hoursAgo(2) }],
    },
    {
      id: "agb-noshow-1",
      reference: "WTN-990801",
      status: "no_show",
      confirmation: "instant",
      customerName: "No Show Demo",
      customerEmail: "noshow@example.com",
      customerPhone: "+216 98 888 001",
      driverName: "No Show Demo",
      vehicleId: "vh-1",
      categoryLabel: "Economy",
      orSimilar: false,
      listedTotalTnd: day.listed * 2,
      agencyNetTnd: 190,
      commissionTnd: day.listed * 2 - 190,
      takeRatePercent: take,
      depositTnd: 500,
      onlineCollectedTnd: 50,
      deskDueTnd: 0,
      pickupAt: hoursAgo(30),
      returnAt: hoursAgo(-18),
      pickupLabel: "Missed pickup",
      returnLabel: "—",
      branchId: "br-tunis",
      paymentMode: "deposit_online",
      extras: [],
      timeline: [{ label: "Marked no-show", at: hoursAgo(28) }],
    },
  ]

  return {
    id: "agency-demo-1",
    slug: "carthage-drive",
    legalName: "Carthage Drive SARL",
    tradeName: "Carthage Drive",
    taxId: "1234567/M/A/E/000",
    email: "desk@carthagedrive.tn",
    phone: "+216 71 000 100",
    verification: "live",
    commissionTier: "standard",
    takeRatePercent: take,
    bookingMode: "request",
    qualityScore: 78,
    acceptanceRate: 92,
    avgResponseHours: 2.4,
    ibanLast4: "4521",
    branches,
    vehicles,
    ratePlans: [
      {
        id: "rp-eco",
        name: "Economy base",
        category: "Economy",
        netDayTnd: 95,
        minDays: 1,
        weekendUpliftPercent: 10,
        seasonalNote: "Jul–Aug +15%",
      },
      {
        id: "rp-compact",
        name: "Compact auto",
        category: "Compact",
        netDayTnd: 110,
        minDays: 2,
        weekendUpliftPercent: 8,
      },
      {
        id: "rp-suv",
        name: "SUV weekly",
        category: "SUV",
        netDayTnd: 140,
        minDays: 3,
        weekendUpliftPercent: 5,
        seasonalNote: "Ramadan soft rates",
      },
    ],
    staff: [
      {
        id: "st-owner",
        name: "Sami Khadhraoui",
        email: "sami@carthagedrive.tn",
        role: "owner",
        status: "active",
        lastActiveLabel: "Just now",
      },
      {
        id: "st-agent",
        name: "Nour Ben Ali",
        email: "nour@carthagedrive.tn",
        role: "agent",
        status: "active",
        lastActiveLabel: "12 min ago",
      },
      {
        id: "st-fleet",
        name: "Hichem Lotfi",
        email: "hichem@carthagedrive.tn",
        role: "fleet",
        status: "invited",
        lastActiveLabel: "Invite pending",
      },
    ],
    bookings,
    payouts: [
      {
        id: "po-1",
        periodLabel: "1–15 Jul 2026",
        gmvTnd: 5280,
        commissionTnd: 634,
        netPayableTnd: 4646,
        status: "scheduled",
        bankLast4: "4521",
        bookingIds: ["agb-done-1", "agb-active-1"],
      },
      {
        id: "po-0",
        periodLabel: "16–30 Jun 2026",
        gmvTnd: 4120,
        commissionTnd: 494,
        netPayableTnd: 3626,
        status: "paid",
        bankLast4: "4521",
        bookingIds: [],
      },
    ],
    notifications: [
      {
        id: "n1",
        title: "New request WTN-881001",
        body: "Amira · Economy · decide in 4.5h",
        href: "/agency/bookings/agb-req-1/accept",
        at: hoursAgo(1.2),
        read: false,
      },
      {
        id: "n2",
        title: "Pickup today",
        body: "Youssef · WTN-770101 · 16:00 Tunis desk",
        href: "/agency/bookings/agb-conf-1/prepare",
        at: hoursAgo(3),
        read: false,
      },
      {
        id: "n3",
        title: "Customer message",
        body: "Nicolas asked about return fuel",
        href: "/agency/bookings/agb-active-1/messages",
        at: hoursAgo(5),
        read: true,
      },
    ],
    onboardingDone: {
      profile: true,
      documents: true,
      branch: true,
      fleet: true,
      rates: true,
      policies: true,
      booking_mode: true,
      review: true,
    },
    calendarBlocks: [
      {
        id: "blk-1",
        vehicleId: "vh-5",
        label: "Service · brakes",
        startLabel: "Today",
        endLabel: "+3 days",
        kind: "maintenance",
      },
      {
        id: "blk-2",
        vehicleId: "vh-1",
        label: "Cleaning buffer",
        startLabel: "Tonight 20:00",
        endLabel: "Tonight 22:00",
        kind: "cleaning",
      },
    ],
    policies: {
      cancellation:
        "Free cancellation until 48h before pickup. Inside 48h: 1 day kept.",
      mileage: "250 km/day included · 0.35 TND/km after.",
      fuel: "Full-to-full. Prepaid tank available as add-on.",
      deposit:
        "Refundable deposit 500–800 TND by category · held at desk · not part of commission.",
      drivers: "Min age 21 · licence held 1+ year · passport or CIN.",
      protection: "Third-party included · SCDW optional at desk.",
    },
    publicBio:
      "Airport-focused Tunis partner. Clear deposits, meet & greet on request, French/Arabic desk.",
  }
}

export function formatAgencyTnd(amount: number) {
  return `${Math.round(amount).toLocaleString("en-US")} TND`
}

export function statusLabel(status: AgencyBookingStatus) {
  const map: Record<AgencyBookingStatus, string> = {
    requested: "Waiting for you",
    held: "On hold",
    payment_pending: "Customer paying",
    confirmed: "Confirmed",
    active: "Car is out",
    completed: "Done",
    cancelled: "Cancelled",
    expired: "Timed out",
    rejected: "Declined",
    no_show: "No-show",
  }
  return map[status]
}

export function nextStepForBooking(b: AgencyBooking): { label: string; href: string } {
  switch (b.status) {
    case "requested":
      return { label: "Accept or decline", href: `/agency/bookings/${b.id}/accept` }
    case "confirmed":
      return b.prepareReady
        ? { label: "Give the car", href: `/agency/bookings/${b.id}/handover` }
        : { label: "Get the car ready", href: `/agency/bookings/${b.id}/prepare` }
    case "active":
      return { label: "Take the car back", href: `/agency/bookings/${b.id}/return` }
    case "payment_pending":
    case "held":
      return { label: "View booking", href: `/agency/bookings/${b.id}` }
    case "completed":
      return { label: "See money details", href: `/agency/bookings/${b.id}/finance` }
    default:
      return { label: "Open booking", href: `/agency/bookings/${b.id}` }
  }
}

export function inboxBookings(ws: AgencyWorkspace) {
  return ws.bookings.filter(
    (b) =>
      b.status === "requested" ||
      (b.status === "confirmed" && !b.prepareReady),
  )
}

export function onboardingProgress(ws: AgencyWorkspace) {
  const keys = Object.keys(ws.onboardingDone) as OnboardingStepId[]
  const done = keys.filter((k) => ws.onboardingDone[k]).length
  return { done, total: keys.length, percent: Math.round((done / keys.length) * 100) }
}

export function roleCanAccessFinance(role: AgencyRole) {
  return role === "owner" || role === "manager" || role === "accountant"
}

export function roleCanEditSupply(role: AgencyRole) {
  return role === "owner" || role === "manager" || role === "fleet"
}

export function roleCanManageTeam(role: AgencyRole) {
  return role === "owner"
}

export function fleetSummary(ws: AgencyWorkspace) {
  return {
    total: ws.vehicles.length,
    ready: ws.vehicles.filter((v) => v.status === "ready").length,
    onRent: ws.vehicles.filter((v) => v.status === "on_rent").length,
    maintenance: ws.vehicles.filter((v) => v.status === "maintenance").length,
    hidden: ws.vehicles.filter((v) => v.status === "hidden").length,
    needsPhotos: ws.vehicles.filter((v) => v.photoCount < 4).length,
  }
}

export function bookingMoneyHint(b: AgencyBooking) {
  return `Customer ${formatAgencyTnd(b.listedTotalTnd)} · You keep ${formatAgencyTnd(b.agencyNetTnd)} · Fee ${formatAgencyTnd(b.commissionTnd)}`
}

export function findBooking(ws: AgencyWorkspace, id: string) {
  return ws.bookings.find((b) => b.id === id)
}

export function findVehicle(ws: AgencyWorkspace, id?: string) {
  if (!id) return undefined
  return ws.vehicles.find((v) => v.id === id)
}

export function findBranch(ws: AgencyWorkspace, id?: string) {
  if (!id) return undefined
  return ws.branches.find((b) => b.id === id)
}

export function readyVehiclesForBranch(ws: AgencyWorkspace, branchId: string) {
  return ws.vehicles.filter((v) => v.branchId === branchId && v.status === "ready")
}

export function todayPickups(ws: AgencyWorkspace) {
  return ws.bookings.filter(
    (b) => b.status === "confirmed" && /today/i.test(b.pickupLabel),
  )
}

export function carsOut(ws: AgencyWorkspace) {
  return ws.bookings.filter((b) => b.status === "active")
}

export function unreadMessageBookings(ws: AgencyWorkspace) {
  return ws.bookings.filter((b) => (b.unreadMessages ?? 0) > 0)
}

export function patchBooking(
  ws: AgencyWorkspace,
  id: string,
  patch: Partial<AgencyBooking> | ((b: AgencyBooking) => AgencyBooking),
): AgencyWorkspace {
  return {
    ...ws,
    bookings: ws.bookings.map((b) => {
      if (b.id !== id) return b
      return typeof patch === "function" ? patch(b) : { ...b, ...patch }
    }),
  }
}

export function vehicleStatusLabel(status: VehicleStatus) {
  switch (status) {
    case "ready":
      return "Ready"
    case "on_rent":
      return "With customer"
    case "maintenance":
      return "In workshop"
    case "hidden":
      return "Hidden"
  }
}

