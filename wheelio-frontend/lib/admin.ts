/**
 * Wheelio TN admin control plane — demo workspace.
 * Deposit is never part of GMV / commission.
 * Booking ids align with agency demo where possible.
 */

import { PARTNER_PRICING } from "@/lib/partner-pricing"

export type AdminRole =
  | "super"
  | "partner_success"
  | "support"
  | "finance"
  | "content"
  | "readonly_analyst"

export type ApplicationStatus =
  | "new"
  | "docs_requested"
  | "in_review"
  | "approved"
  | "rejected"
  | "withdrawn"

export type AgencyVerification =
  | "draft"
  | "review"
  | "live"
  | "paused"
  | "suspended"

export type CommissionTier = "launch" | "standard" | "volume"

export type AdminBookingStatus =
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

export type AdminStaffMember = {
  id: string
  name: string
  email: string
  role: AdminRole
  status: "active" | "invited" | "disabled"
  lastActiveLabel: string
}

export type PartnerApplication = {
  id: string
  status: ApplicationStatus
  tradeName: string
  legalName: string
  taxId: string
  city: string
  email: string
  phone: string
  fleetSizeEstimate: number
  branchesPlanned: number
  submittedAt: string
  assignedTo?: string
  notes?: string
  docs: { label: string; state: "missing" | "uploaded" | "approved" | "rejected" | "expired" }[]
}

export type AdminAgency = {
  id: string
  slug: string
  tradeName: string
  legalName: string
  city: string
  email: string
  phone: string
  verification: AgencyVerification
  commissionTier: CommissionTier
  takeRatePercent: 10 | 12
  instantEnabled: boolean
  qualityScore: number
  acceptanceRate: number
  avgResponseHours: number
  gmv30dTnd: number
  openSlaBreaches: number
  vehicleCount: number
  branchCount: number
  lastActiveLabel: string
  ibanLast4: string
  publicVisible: boolean
}

export type AdminBooking = {
  id: string
  reference: string
  status: AdminBookingStatus
  confirmation: "instant" | "request"
  agencyId: string
  agencyName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  categoryLabel: string
  plate?: string
  branchLabel: string
  pickupLabel: string
  returnLabel: string
  listedTotalTnd: number
  agencyNetTnd: number
  commissionTnd: number
  takeRatePercent: number
  depositTnd: number
  onlineCollectedTnd: number
  deskDueTnd: number
  slaExpiresAt?: string
  paymentMode: "desk" | "deposit_online"
  hasOpenCase?: boolean
  hasOpenClaim?: boolean
  timeline: { label: string; at: string; source: "customer" | "agency" | "admin" }[]
}

export type AdminCase = {
  id: string
  subject: string
  status: "open" | "waiting" | "resolved"
  priority: "low" | "normal" | "high"
  bookingId?: string
  bookingRef?: string
  agencyId?: string
  agencyName?: string
  customerName?: string
  ownerStaffId?: string
  channel: "email" | "in_app" | "phone"
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type AdminClaim = {
  id: string
  type: string
  status: "open" | "decided" | "closed"
  bookingId: string
  bookingRef: string
  agencyId: string
  agencyName: string
  source: "customer" | "agency" | "wheelio"
  decision?: string
  createdAt: string
  depositAtStakeTnd: number
  rentImpactTnd: number
}

export type AdminPayoutBatch = {
  id: string
  agencyId: string
  agencyName: string
  periodLabel: string
  status: "draft" | "pending_approval" | "scheduled" | "paid" | "held" | "failed"
  netPayableTnd: number
  commissionTnd: number
  listedTotalTnd: number
  bookingIds: string[]
  bookingRefs: string[]
  ibanLast4: string
  holdReason?: string
}

export type AdminRefund = {
  id: string
  bookingId: string
  bookingRef: string
  status: "requested" | "approved" | "sent" | "failed"
  customerAmountTnd: number
  agencyClawbackTnd: number
  wheelioAbsorbsTnd: number
  reason: string
  createdAt: string
}

export type AdminVehicleFlag = {
  id: string
  agencyId: string
  agencyName: string
  plate: string
  makeModel: string
  category: string
  flags: string[]
  photoCount: number
  forceHidden: boolean
}

export type AdminLocation = {
  slug: string
  name: string
  city: string
  status: "published" | "draft"
  linkedAgencies: number
  tip: string
}

export type AdminReview = {
  id: string
  author: string
  rating: number
  body: string
  agencyName: string
  bookingRef?: string
  status: "visible" | "flagged" | "hidden"
  createdAt: string
}

export type AdminCustomer = {
  id: string
  name: string
  email: string
  phone: string
  bookingsCount: number
  riskFlags: string[]
  lastTripLabel: string
}

export type AdminPromotion = {
  id: string
  code: string
  label: string
  type: "percent" | "amount" | "featured"
  value: number
  status: "active" | "paused" | "expired"
  redemptions: number
  maxRedemptions: number
}

export type AdminAuditEntry = {
  id: string
  at: string
  actor: string
  action: string
  entity: string
}

export type AdminNotification = {
  id: string
  title: string
  body: string
  href: string
  read: boolean
  at: string
}

export type AdminCmsArticle = {
  id: string
  kind: "guide" | "help" | "faq" | "legal"
  slug: string
  title: string
  body: string
  locale: "en" | "fr"
  status: "draft" | "published"
  updatedAt: string
  publishAt?: string
}

export type AdminInvoice = {
  id: string
  agencyId: string
  agencyName: string
  periodLabel: string
  commissionTnd: number
  status: "draft" | "sent" | "paid"
  createdAt: string
}

export type AdminWorkspace = {
  staff: AdminStaffMember[]
  applications: PartnerApplication[]
  agencies: AdminAgency[]
  bookings: AdminBooking[]
  cases: AdminCase[]
  claims: AdminClaim[]
  payoutBatches: AdminPayoutBatch[]
  refunds: AdminRefund[]
  vehicles: AdminVehicleFlag[]
  locations: AdminLocation[]
  reviews: AdminReview[]
  customers: AdminCustomer[]
  promotions: AdminPromotion[]
  audit: AdminAuditEntry[]
  notifications: AdminNotification[]
  categories: { id: string; label: string; agencyAliases: string[] }[]
  dualControlThresholdTnd: number
  defaultSlaHours: number
  takeRateStandard: number
  takeRateLaunch: number
  takeRateVolume: number
  dualControl?: import("@/lib/admin-dual-control").DualControlRequest[]
  cmsArticles?: AdminCmsArticle[]
  invoices?: AdminInvoice[]
  featureFlags?: { id: string; label: string; enabled: boolean; demoOnly: boolean }[]
}

export const ADMIN_STORAGE_KEY = "wheelio-admin-workspace"
export const ADMIN_SESSION_KEY = "wheelio-admin-session"

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600_000).toISOString()
}
function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString()
}
function daysAgo(d: number) {
  return hoursAgo(d * 24)
}

export function formatAdminTnd(amount: number) {
  return `${Math.round(amount).toLocaleString("en-TN")} TND`
}

export function roleLabel(role: AdminRole) {
  const map: Record<AdminRole, string> = {
    super: "Super",
    partner_success: "Partner success",
    support: "Support",
    finance: "Finance",
    content: "Content",
    readonly_analyst: "Analyst",
  }
  return map[role]
}

export function verificationLabel(v: AgencyVerification) {
  const map: Record<AgencyVerification, string> = {
    draft: "Draft",
    review: "Under review",
    live: "Live",
    paused: "Paused",
    suspended: "Suspended",
  }
  return map[v]
}

export function bookingStatusLabel(s: AdminBookingStatus) {
  return s.replaceAll("_", " ")
}

export function roleCanWriteFinance(role: AdminRole) {
  return role === "super" || role === "finance"
}

export function roleCanManagePartners(role: AdminRole) {
  return role === "super" || role === "partner_success"
}

export function roleCanSupport(role: AdminRole) {
  return (
    role === "super" ||
    role === "support" ||
    role === "partner_success"
  )
}

export function roleCanContent(role: AdminRole) {
  return role === "super" || role === "content"
}

export function roleNeedsMfa(role: AdminRole) {
  return role === "super" || role === "finance"
}

export function createDemoAdminWorkspace(): AdminWorkspace {
  const take = PARTNER_PRICING.recommendedPercent as 10 | 12

  const staff: AdminStaffMember[] = [
    {
      id: "adm-super",
      name: "Louay Founder",
      email: "admin@wheelio.tn",
      role: "super",
      status: "active",
      lastActiveLabel: "Just now",
    },
    {
      id: "adm-ps",
      name: "Amira Trabelsi",
      email: "partners@wheelio.tn",
      role: "partner_success",
      status: "active",
      lastActiveLabel: "8 min ago",
    },
    {
      id: "adm-sup",
      name: "Karim Jebali",
      email: "support@wheelio.tn",
      role: "support",
      status: "active",
      lastActiveLabel: "3 min ago",
    },
    {
      id: "adm-fin",
      name: "Sarra Mejri",
      email: "finance@wheelio.tn",
      role: "finance",
      status: "active",
      lastActiveLabel: "22 min ago",
    },
    {
      id: "adm-cnt",
      name: "Yasmine Riahi",
      email: "content@wheelio.tn",
      role: "content",
      status: "active",
      lastActiveLabel: "1 h ago",
    },
    {
      id: "adm-an",
      name: "Omar Ben Salah",
      email: "analytics@wheelio.tn",
      role: "readonly_analyst",
      status: "active",
      lastActiveLabel: "Yesterday",
    },
  ]

  const applications: PartnerApplication[] = [
    {
      id: "app-1",
      status: "new",
      tradeName: "Sfax Auto Rent",
      legalName: "Sfax Auto Rent SARL",
      taxId: "7654321/M/A/E/000",
      city: "Sfax",
      email: "hello@sfaxautorent.tn",
      phone: "+216 74 200 100",
      fleetSizeEstimate: 12,
      branchesPlanned: 1,
      submittedAt: hoursAgo(6),
      docs: [
        { label: "Company registration", state: "uploaded" },
        { label: "Tax ID", state: "uploaded" },
        { label: "Insurance", state: "missing" },
        { label: "Fleet authorization", state: "missing" },
        { label: "Signatory ID", state: "uploaded" },
      ],
    },
    {
      id: "app-2",
      status: "docs_requested",
      tradeName: "Djerba Keys",
      legalName: "Djerba Keys SUARL",
      taxId: "9988776/M/A/E/000",
      city: "Djerba",
      email: "ops@djerbakeys.tn",
      phone: "+216 75 650 200",
      fleetSizeEstimate: 8,
      branchesPlanned: 2,
      submittedAt: daysAgo(3),
      assignedTo: "adm-ps",
      notes: "Waiting on insurance certificate renewal.",
      docs: [
        { label: "Company registration", state: "approved" },
        { label: "Tax ID", state: "approved" },
        { label: "Insurance", state: "rejected" },
        { label: "Fleet authorization", state: "uploaded" },
        { label: "Signatory ID", state: "approved" },
      ],
    },
    {
      id: "app-3",
      status: "in_review",
      tradeName: "Hammamet Drive",
      legalName: "Hammamet Drive SA",
      taxId: "5544332/M/A/E/000",
      city: "Hammamet",
      email: "desk@hammametdrive.tn",
      phone: "+216 72 280 300",
      fleetSizeEstimate: 18,
      branchesPlanned: 2,
      submittedAt: daysAgo(5),
      assignedTo: "adm-ps",
      docs: [
        { label: "Company registration", state: "approved" },
        { label: "Tax ID", state: "approved" },
        { label: "Insurance", state: "approved" },
        { label: "Fleet authorization", state: "approved" },
        { label: "Signatory ID", state: "approved" },
      ],
    },
  ]

  const agencies: AdminAgency[] = [
    {
      id: "agency-demo-1",
      slug: "carthage-drive",
      tradeName: "Carthage Drive",
      legalName: "Carthage Drive SARL",
      city: "Tunis",
      email: "desk@carthagedrive.tn",
      phone: "+216 71 000 100",
      verification: "live",
      commissionTier: "standard",
      takeRatePercent: take,
      instantEnabled: false,
      qualityScore: 78,
      acceptanceRate: 92,
      avgResponseHours: 2.4,
      gmv30dTnd: 18420,
      openSlaBreaches: 1,
      vehicleCount: 6,
      branchCount: 2,
      lastActiveLabel: "12 min ago",
      ibanLast4: "4521",
      publicVisible: true,
    },
    {
      id: "agency-2",
      slug: "medina-wheels",
      tradeName: "Medina Wheels",
      legalName: "Medina Wheels SARL",
      city: "Tunis",
      email: "hello@medinawheels.tn",
      phone: "+216 71 222 300",
      verification: "review",
      commissionTier: "launch",
      takeRatePercent: 10,
      instantEnabled: false,
      qualityScore: 64,
      acceptanceRate: 80,
      avgResponseHours: 5.1,
      gmv30dTnd: 0,
      openSlaBreaches: 0,
      vehicleCount: 4,
      branchCount: 1,
      lastActiveLabel: "2 h ago",
      ibanLast4: "8890",
      publicVisible: false,
    },
    {
      id: "agency-3",
      slug: "sousse-fleet",
      tradeName: "Sousse Fleet",
      legalName: "Sousse Fleet SARL",
      city: "Sousse",
      email: "ops@soussefleet.tn",
      phone: "+216 73 100 400",
      verification: "paused",
      commissionTier: "standard",
      takeRatePercent: 12,
      instantEnabled: false,
      qualityScore: 55,
      acceptanceRate: 71,
      avgResponseHours: 8.2,
      gmv30dTnd: 6200,
      openSlaBreaches: 3,
      vehicleCount: 9,
      branchCount: 2,
      lastActiveLabel: "Yesterday",
      ibanLast4: "2211",
      publicVisible: false,
    },
  ]

  const bookings: AdminBooking[] = [
    {
      id: "agb-req-1",
      reference: "WTN-881001",
      status: "requested",
      confirmation: "request",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      customerName: "Ines Mansouri",
      customerEmail: "ines.m@example.com",
      customerPhone: "+216 98 111 222",
      categoryLabel: "Economy",
      branchLabel: "Tunis Airport T1",
      pickupLabel: "Tomorrow 10:00",
      returnLabel: "In 4 days 10:00",
      listedTotalTnd: 432,
      agencyNetTnd: 380,
      commissionTnd: 52,
      takeRatePercent: 12,
      depositTnd: 600,
      onlineCollectedTnd: 0,
      deskDueTnd: 432,
      slaExpiresAt: hoursFromNow(1.2),
      paymentMode: "desk",
      hasOpenCase: false,
      timeline: [
        { label: "Request created", at: hoursAgo(4), source: "customer" },
      ],
    },
    {
      id: "agb-req-2",
      reference: "WTN-881002",
      status: "requested",
      confirmation: "request",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      customerName: "Mehdi Saidi",
      customerEmail: "mehdi.s@example.com",
      customerPhone: "+216 22 444 555",
      categoryLabel: "Compact",
      branchLabel: "La Marsa desk",
      pickupLabel: "In 2 days 09:00",
      returnLabel: "In 5 days 09:00",
      listedTotalTnd: 375,
      agencyNetTnd: 330,
      commissionTnd: 45,
      takeRatePercent: 12,
      depositTnd: 700,
      onlineCollectedTnd: 50,
      deskDueTnd: 325,
      slaExpiresAt: hoursFromNow(0.6),
      paymentMode: "deposit_online",
      hasOpenClaim: false,
      timeline: [
        { label: "Request created", at: hoursAgo(5), source: "customer" },
        { label: "Deposit held online", at: hoursAgo(5), source: "customer" },
      ],
    },
    {
      id: "agb-req-expired",
      reference: "WTN-881003",
      status: "requested",
      confirmation: "request",
      agencyId: "agency-3",
      agencyName: "Sousse Fleet",
      customerName: "Yasmine Trabelsi",
      customerEmail: "yasmine.t@example.com",
      customerPhone: "+216 55 777 888",
      categoryLabel: "SUV",
      branchLabel: "Sousse port desk",
      pickupLabel: "Yesterday 14:00",
      returnLabel: "Tomorrow 14:00",
      listedTotalTnd: 510,
      agencyNetTnd: 449,
      commissionTnd: 61,
      takeRatePercent: 12,
      depositTnd: 800,
      onlineCollectedTnd: 0,
      deskDueTnd: 510,
      slaExpiresAt: hoursAgo(3),
      paymentMode: "desk",
      timeline: [
        { label: "Request created", at: hoursAgo(8), source: "customer" },
      ],
    },
    {
      id: "agb-conf-1",
      reference: "WTN-770101",
      status: "confirmed",
      confirmation: "request",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      customerName: "Laura Chen",
      customerEmail: "laura.c@example.com",
      customerPhone: "+216 50 777 888",
      categoryLabel: "SUV",
      plate: "123 TU 4567",
      branchLabel: "Tunis Airport T1",
      pickupLabel: "Today 14:00",
      returnLabel: "In 7 days 14:00",
      listedTotalTnd: 1114,
      agencyNetTnd: 980,
      commissionTnd: 134,
      takeRatePercent: 12,
      depositTnd: 1000,
      onlineCollectedTnd: 200,
      deskDueTnd: 914,
      paymentMode: "deposit_online",
      timeline: [
        { label: "Confirmed by agency", at: hoursAgo(20), source: "agency" },
      ],
    },
    {
      id: "agb-active-1",
      reference: "WTN-660201",
      status: "active",
      confirmation: "instant",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      customerName: "Thomas Berger",
      customerEmail: "t.berger@example.com",
      customerPhone: "+33 6 12 34 56 78",
      categoryLabel: "Compact",
      plate: "198 TU 2211",
      branchLabel: "Tunis Airport T1",
      pickupLabel: "2 days ago",
      returnLabel: "Tomorrow 11:00",
      listedTotalTnd: 500,
      agencyNetTnd: 440,
      commissionTnd: 60,
      takeRatePercent: 12,
      depositTnd: 700,
      onlineCollectedTnd: 500,
      deskDueTnd: 0,
      paymentMode: "deposit_online",
      hasOpenClaim: true,
      timeline: [
        { label: "Handover complete", at: daysAgo(2), source: "agency" },
      ],
    },
    {
      id: "agb-done-1",
      reference: "WTN-550301",
      status: "completed",
      confirmation: "request",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      customerName: "Fatma Gharbi",
      customerEmail: "fatma.g@example.com",
      customerPhone: "+216 97 333 111",
      categoryLabel: "Economy",
      plate: "145 TU 8890",
      branchLabel: "La Marsa desk",
      pickupLabel: "10 days ago",
      returnLabel: "6 days ago",
      listedTotalTnd: 432,
      agencyNetTnd: 380,
      commissionTnd: 52,
      takeRatePercent: 12,
      depositTnd: 600,
      onlineCollectedTnd: 0,
      deskDueTnd: 0,
      paymentMode: "desk",
      timeline: [
        { label: "Return completed", at: daysAgo(6), source: "agency" },
      ],
    },
    {
      id: "agb-held-1",
      reference: "WTN-110701",
      status: "held",
      confirmation: "request",
      agencyId: "agency-3",
      agencyName: "Sousse Fleet",
      customerName: "Alex Martin",
      customerEmail: "alex.m@example.com",
      customerPhone: "+216 55 100 200",
      categoryLabel: "Economy",
      branchLabel: "Sousse centre",
      pickupLabel: "In 3 days",
      returnLabel: "In 6 days",
      listedTotalTnd: 324,
      agencyNetTnd: 285,
      commissionTnd: 39,
      takeRatePercent: 12,
      depositTnd: 500,
      onlineCollectedTnd: 0,
      deskDueTnd: 324,
      paymentMode: "desk",
      hasOpenCase: true,
      timeline: [
        { label: "Checkout hold started", at: hoursAgo(0.2), source: "customer" },
      ],
    },
  ]

  const cases: AdminCase[] = [
    {
      id: "case-1",
      subject: "Customer cannot find Tunis T1 desk",
      status: "open",
      priority: "high",
      bookingId: "agb-conf-1",
      bookingRef: "WTN-770101",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      customerName: "Laura Chen",
      ownerStaffId: "adm-sup",
      channel: "in_app",
      tags: ["pickup", "directions"],
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(0.5),
    },
    {
      id: "case-2",
      subject: "Payment hold stuck after checkout",
      status: "waiting",
      priority: "normal",
      bookingId: "agb-held-1",
      bookingRef: "WTN-110701",
      agencyId: "agency-3",
      agencyName: "Sousse Fleet",
      customerName: "Alex Martin",
      ownerStaffId: "adm-sup",
      channel: "email",
      tags: ["payment"],
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(0.8),
    },
  ]

  const claims: AdminClaim[] = [
    {
      id: "claim-1",
      type: "Vehicle mismatch",
      status: "open",
      bookingId: "agb-active-1",
      bookingRef: "WTN-660201",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      source: "customer",
      createdAt: hoursAgo(18),
      depositAtStakeTnd: 700,
      rentImpactTnd: 80,
    },
    {
      id: "claim-2",
      type: "Deposit dispute",
      status: "open",
      bookingId: "agb-done-1",
      bookingRef: "WTN-550301",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      source: "agency",
      createdAt: daysAgo(5),
      depositAtStakeTnd: 600,
      rentImpactTnd: 0,
    },
  ]

  const payoutBatches: AdminPayoutBatch[] = [
    {
      id: "po-draft-1",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      periodLabel: "Jul 1-15, 2026",
      status: "draft",
      netPayableTnd: 3626,
      commissionTnd: 494,
      listedTotalTnd: 4120,
      bookingIds: ["agb-done-1"],
      bookingRefs: ["WTN-550301"],
      ibanLast4: "4521",
    },
    {
      id: "po-sched-1",
      agencyId: "agency-demo-1",
      agencyName: "Carthage Drive",
      periodLabel: "Jun 16-30, 2026",
      status: "scheduled",
      netPayableTnd: 4810,
      commissionTnd: 656,
      listedTotalTnd: 5466,
      bookingIds: [],
      bookingRefs: ["WTN-449900", "WTN-449901"],
      ibanLast4: "4521",
    },
    {
      id: "po-held-1",
      agencyId: "agency-3",
      agencyName: "Sousse Fleet",
      periodLabel: "Jun 16-30, 2026",
      status: "held",
      netPayableTnd: 2100,
      commissionTnd: 286,
      listedTotalTnd: 2386,
      bookingIds: [],
      bookingRefs: ["WTN-338800"],
      ibanLast4: "2211",
      holdReason: "Open claim on prior period",
    },
  ]

  const refunds: AdminRefund[] = [
    {
      id: "rf-1",
      bookingId: "agb-held-1",
      bookingRef: "WTN-110701",
      status: "requested",
      customerAmountTnd: 0,
      agencyClawbackTnd: 0,
      wheelioAbsorbsTnd: 0,
      reason: "Hold expired - goodwill consideration",
      createdAt: hoursAgo(0.1),
    },
  ]

  return {
    staff,
    applications,
    agencies,
    bookings,
    cases,
    claims,
    payoutBatches,
    refunds,
    vehicles: [
      {
        id: "vh-1",
        agencyId: "agency-demo-1",
        agencyName: "Carthage Drive",
        plate: "123 TU 4567",
        makeModel: "Hyundai i10",
        category: "Economy",
        flags: ["Low photo count"],
        photoCount: 2,
        forceHidden: false,
      },
      {
        id: "vh-x",
        agencyId: "agency-3",
        agencyName: "Sousse Fleet",
        plate: "301 TU 7788",
        makeModel: "Kia Picanto",
        category: "Economy",
        flags: ["Category mismatch", "Missing photos"],
        photoCount: 0,
        forceHidden: true,
      },
    ],
    locations: [
      {
        slug: "tunis-airport",
        name: "Tunis-Carthage Airport",
        city: "Tunis",
        status: "published",
        linkedAgencies: 4,
        tip: "Meet at arrivals T1 near the Wheelio desk signs.",
      },
      {
        slug: "sousse-centre",
        name: "Sousse centre",
        city: "Sousse",
        status: "draft",
        linkedAgencies: 1,
        tip: "City desk near the medina parking.",
      },
    ],
    reviews: [
      {
        id: "rv-1",
        author: "Amira K.",
        rating: 5,
        body: "Desk was ready at T1 - smooth pickup.",
        agencyName: "Carthage Drive",
        bookingRef: "WTN-550301",
        status: "visible",
        createdAt: daysAgo(4),
      },
      {
        id: "rv-2",
        author: "Paul R.",
        rating: 2,
        body: "Car was not the category I booked.",
        agencyName: "Carthage Drive",
        bookingRef: "WTN-660201",
        status: "flagged",
        createdAt: hoursAgo(12),
      },
    ],
    customers: [
      {
        id: "cu-1",
        name: "Ines Mansouri",
        email: "ines.m@example.com",
        phone: "+216 98 111 222",
        bookingsCount: 3,
        riskFlags: [],
        lastTripLabel: "WTN-881001 requested",
      },
      {
        id: "cu-2",
        name: "Thomas Berger",
        email: "t.berger@example.com",
        phone: "+33 6 12 34 56 78",
        bookingsCount: 1,
        riskFlags: ["Open claim"],
        lastTripLabel: "WTN-660201 active",
      },
    ],
    promotions: [
      {
        id: "pr-1",
        code: "TUNIS10",
        label: "10% off Tunis airport Economy",
        type: "percent",
        value: 10,
        status: "active",
        redemptions: 47,
        maxRedemptions: 500,
      },
      {
        id: "pr-2",
        code: "FEATURED-CD",
        label: "Carthage Drive featured uplift",
        type: "featured",
        value: 2,
        status: "paused",
        redemptions: 12,
        maxRedemptions: 100,
      },
    ],
    audit: [
      {
        id: "au-1",
        at: hoursAgo(3),
        actor: "Amira Trabelsi",
        action: "Requested docs",
        entity: "Application app-2",
      },
      {
        id: "au-2",
        at: hoursAgo(8),
        actor: "Sarra Mejri",
        action: "Held payout",
        entity: "Payout po-held-1",
      },
      {
        id: "au-3",
        at: daysAgo(1),
        actor: "Louay Founder",
        action: "Set verification live",
        entity: "Agency agency-demo-1",
      },
    ],
    notifications: [
      {
        id: "n-1",
        title: "SLA almost out",
        body: "WTN-881002 expires in under 1 hour.",
        href: "/admin/bookings/agb-req-2",
        read: false,
        at: hoursAgo(0.2),
      },
      {
        id: "n-2",
        title: "New partner application",
        body: "Sfax Auto Rent submitted a join form.",
        href: "/admin/applications/app-1",
        read: false,
        at: hoursAgo(6),
      },
      {
        id: "n-3",
        title: "Payout awaiting release",
        body: "Carthage Drive Jun 16-30 is scheduled.",
        href: "/admin/finance/payouts/po-sched-1",
        read: true,
        at: hoursAgo(10),
      },
    ],
    categories: [
      { id: "eco", label: "Economy", agencyAliases: ["Eco", "Small"] },
      { id: "cmp", label: "Compact", agencyAliases: ["Compact auto"] },
      { id: "suv", label: "SUV", agencyAliases: ["SUV", "Crossover"] },
      { id: "int", label: "Intermediate", agencyAliases: ["Midsize"] },
    ],
    dualControlThresholdTnd: 5000,
    defaultSlaHours: 6,
    takeRateStandard: PARTNER_PRICING.recommendedPercent,
    takeRateLaunch: PARTNER_PRICING.launchPercent,
    takeRateVolume: PARTNER_PRICING.volumePercent,
    dualControl: [],
    cmsArticles: [
      {
        id: "cms-guide-1",
        kind: "guide",
        slug: "tunis-airport-pickup",
        title: "Tunis airport pickup",
        body: "Arrive at Tunis-Carthage, follow Wheelio desk signs, present voucher and licence.",
        locale: "en",
        status: "published",
        updatedAt: daysAgo(3),
        publishAt: daysAgo(3),
      },
      {
        id: "cms-guide-1-fr",
        kind: "guide",
        slug: "tunis-airport-pickup",
        title: "Prise en charge aéroport Tunis",
        body: "Arrivez à Tunis-Carthage, suivez les panneaux Wheelio, présentez le bon et le permis.",
        locale: "fr",
        status: "published",
        updatedAt: daysAgo(3),
        publishAt: daysAgo(3),
      },
      {
        id: "cms-guide-2",
        kind: "guide",
        slug: "deposit-explained",
        title: "How deposit works",
        body: "Deposit is held by the agency, never in Wheelio GMV or commission.",
        locale: "en",
        status: "draft",
        updatedAt: daysAgo(1),
      },
      {
        id: "cms-help-1",
        kind: "help",
        slug: "cancel-booking",
        title: "Cancel or change a booking",
        body: "Open Your trips → booking → Cancel. Agency rules apply to refunds.",
        locale: "en",
        status: "published",
        updatedAt: daysAgo(5),
        publishAt: daysAgo(5),
      },
      {
        id: "cms-faq-1",
        kind: "faq",
        slug: "what-is-wheelio",
        title: "What is Wheelio?",
        body: "Wheelio compares Tunisian rental agencies in one search with clear TND totals.",
        locale: "en",
        status: "published",
        updatedAt: daysAgo(10),
        publishAt: daysAgo(10),
      },
      {
        id: "cms-legal-1",
        kind: "legal",
        slug: "terms",
        title: "Terms of service",
        body: "Demo stub of marketplace terms. Replace with counsel-approved copy before launch.",
        locale: "en",
        status: "draft",
        updatedAt: hoursAgo(12),
      },
    ],
    invoices: [
      {
        id: "inv-1",
        agencyId: "agency-demo-1",
        agencyName: "Carthage Drive",
        periodLabel: "Jun 1–15 2026",
        commissionTnd: 420,
        status: "paid",
        createdAt: daysAgo(20),
      },
      {
        id: "inv-2",
        agencyId: "agency-demo-1",
        agencyName: "Carthage Drive",
        periodLabel: "Jun 16–30 2026",
        commissionTnd: 510,
        status: "sent",
        createdAt: daysAgo(5),
      },
      {
        id: "inv-3",
        agencyId: "agency-2",
        agencyName: "Medina Motors",
        periodLabel: "Jun 16–30 2026",
        commissionTnd: 180,
        status: "draft",
        createdAt: daysAgo(2),
      },
    ],
    featureFlags: [
      { id: "ff-instant", label: "Instant booking rollout", enabled: true, demoOnly: true },
      { id: "ff-dual", label: "Dual-control money writes", enabled: true, demoOnly: true },
      { id: "ff-preview", label: "Admin read-only preview banner", enabled: true, demoOnly: true },
    ],
  }
}

export function pushAudit(
  ws: AdminWorkspace,
  actor: string,
  action: string,
  entity: string,
): AdminWorkspace {
  return {
    ...ws,
    audit: [
      {
        id: `au-${Date.now()}`,
        at: new Date().toISOString(),
        actor,
        action,
        entity,
      },
      ...ws.audit,
    ],
  }
}

export function queueCounts(ws: AdminWorkspace) {
  const now = Date.now()
  return {
    applications: ws.applications.filter((a) =>
      ["new", "docs_requested", "in_review"].includes(a.status),
    ).length,
    cases: ws.cases.filter((c) => c.status !== "resolved").length,
    claims: ws.claims.filter((c) => c.status === "open").length,
    sla: ws.bookings.filter(
      (b) =>
        b.status === "requested" &&
        b.slaExpiresAt &&
        new Date(b.slaExpiresAt).getTime() - now < 2 * 3600_000,
    ).length,
    payouts: ws.payoutBatches.filter((p) =>
      ["draft", "pending_approval", "scheduled", "held"].includes(p.status),
    ).length,
    reviews: ws.reviews.filter((r) => r.status === "flagged").length,
  }
}

export function findBooking(ws: AdminWorkspace, id: string) {
  return ws.bookings.find((b) => b.id === id || b.reference === id)
}

export function findAgency(ws: AdminWorkspace, id: string) {
  return ws.agencies.find((a) => a.id === id || a.slug === id)
}

export function globalSearch(ws: AdminWorkspace, q: string) {
  const s = q.trim().toLowerCase()
  if (!s) return { bookings: [], agencies: [], customers: [], vehicles: [], cases: [] }
  return {
    bookings: ws.bookings.filter(
      (b) =>
        b.reference.toLowerCase().includes(s) ||
        b.customerName.toLowerCase().includes(s) ||
        b.customerPhone.includes(s) ||
        b.customerEmail.toLowerCase().includes(s) ||
        (b.plate?.toLowerCase().includes(s) ?? false),
    ),
    agencies: ws.agencies.filter(
      (a) =>
        a.tradeName.toLowerCase().includes(s) ||
        a.email.toLowerCase().includes(s) ||
        a.phone.includes(s) ||
        a.city.toLowerCase().includes(s),
    ),
    customers: ws.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s),
    ),
    vehicles: ws.vehicles.filter(
      (v) =>
        v.plate.toLowerCase().includes(s) ||
        v.makeModel.toLowerCase().includes(s),
    ),
    cases: ws.cases.filter(
      (c) =>
        c.subject.toLowerCase().includes(s) ||
        (c.bookingRef?.toLowerCase().includes(s) ?? false),
    ),
  }
}
