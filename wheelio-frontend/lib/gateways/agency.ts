import { apiFetch, apiFetchCollection } from "@/lib/api/client"

export type ApiAgencyBookingListItem = {
  bookingId: string
  id: string
  reference: string
  status: string
  confirmation: "instant" | "request"
  paymentMode: string
  pickupAt: string
  returnAt: string
  slaExpiresAt: string | null
  branchId: string | null
  version: number
  customerName: string
  customerEmail: string
  customerPhone: string
  driverName: string
  listedTotalMillimes: string
  agencyNetMillimes: string
  commissionMillimes: string
  depositMillimes: string
}

export type ApiAgencyDashboard = {
  agencyId: string
  queues: { requested: number; confirmed: number; active: number }
  finance: { openBookings: number; note: string }
}

export type ApiAgencyFleetItem = {
  id: string
  categoryCode: string
  make: string
  model: string
  year: number | null
  status: string
  version: number
}

export type ApiAgencyBranch = {
  id: string
  name: string
  city: string
  active: boolean
  publicVisible: boolean
  version: number
}

export function millimesToTnd(millimes: string | number | bigint) {
  return Number(millimes) / 1000
}

export async function fetchAgencyDashboard() {
  return apiFetch<ApiAgencyDashboard>("/api/v1/agency/dashboard")
}

export async function fetchAgencyBookings() {
  return apiFetchCollection<ApiAgencyBookingListItem>("/api/v1/agency/bookings")
}

export async function fetchAgencyBooking(bookingId: string) {
  return apiFetch<{
    bookingId: string
    reference: string
    status: string
    version: number
    agencyId: string
    branchId: string | null
    confirmationMode: string
    paymentMode: string
    pickupAt: string
    returnAt: string
    slaExpiresAt: string | null
    contactName: string | null
    contactEmail: string | null
    contactPhone: string | null
    driverName: string | null
    deposit: { amountMillimes: string; status: string } | null
    pricing: {
      commissionableMillimes: string
      commissionMillimes: string
      agencyNetMillimes: string
      depositMillimes: string
    } | null
    timeline: Array<{
      toStatus: string
      fromStatus: string | null
      occurredAt: string
      reasonCode: string | null
    }>
  }>(`/api/v1/bookings/${bookingId}`)
}

export async function acceptAgencyBooking(
  bookingId: string,
  input: { expectedVersion: number; vehicleId?: string; note?: string },
) {
  return apiFetch<{ bookingId: string; status: string; version: number }>(
    `/api/v1/agency/bookings/${bookingId}/acceptance`,
    { method: "POST", json: input },
  )
}

export async function declineAgencyBooking(
  bookingId: string,
  input: {
    expectedVersion: number
    reasonCode?: "unavailable" | "documents" | "out_of_area" | "other"
    note?: string
  },
) {
  return apiFetch<{ bookingId: string; status: string; version: number }>(
    `/api/v1/agency/bookings/${bookingId}/decline`,
    { method: "POST", json: input },
  )
}

export async function completeAgencyHandover(
  bookingId: string,
  input: {
    expectedVersion: number
    odometer?: number
    fuelLevel?: string
    conditionNotes?: string
    deskCollectedMillimes?: string
    depositMemoMillimes?: string
  },
) {
  return apiFetch<{ bookingId: string; status: string; version: number }>(
    `/api/v1/agency/bookings/${bookingId}/handover`,
    { method: "POST", json: input },
  )
}

export async function completeAgencyReturn(
  bookingId: string,
  input: {
    expectedVersion: number
    odometer?: number
    fuelLevel?: string
    conditionNotes?: string
    proposedChargesMillimes?: string
    depositReleaseMillimes?: string
  },
) {
  return apiFetch<{ bookingId: string; status: string; version: number }>(
    `/api/v1/agency/bookings/${bookingId}/return`,
    { method: "POST", json: input },
  )
}

export async function fetchAgencyFleet() {
  return apiFetchCollection<ApiAgencyFleetItem>("/api/v1/agency/fleet")
}

export async function createAgencyVehicle(input: {
  categoryCode: string
  make: string
  model: string
  year?: number
  plateHint: string
  branchId?: string
}) {
  return apiFetch<ApiAgencyFleetItem>("/api/v1/agency/fleet", {
    method: "POST",
    json: input,
  })
}

export async function fetchAgencyBranches() {
  return apiFetchCollection<ApiAgencyBranch>("/api/v1/agency/branches")
}

export async function createAgencyBranch(input: {
  name: string
  city: string
  addressLine?: string
  contactEmail?: string
  contactPhone?: string
}) {
  return apiFetch<ApiAgencyBranch & { version: number }>(
    "/api/v1/agency/branches",
    { method: "POST", json: input },
  )
}

export async function fetchAgencyRates() {
  return apiFetchCollection<{
    id: string
    name: string
    categoryCode: string
    netDailyMillimes: string
    active: boolean
    version: number
  }>("/api/v1/agency/rates")
}

export async function createAgencyRate(input: {
  name: string
  categoryCode: string
  netDailyMillimes: string
  minimumDays?: number
}) {
  return apiFetch<{
    id: string
    name: string
    categoryCode: string
    netDailyMillimes: string
    active: boolean
    version: number
  }>("/api/v1/agency/rates", { method: "POST", json: input })
}

export async function fetchAgencyOnboarding() {
  return apiFetch<{
    agencyId: string
    verificationStatus: string
    steps: Array<{
      step: string
      completed: boolean
      version: number
      payload: Record<string, unknown>
    }>
  }>("/api/v1/agency/onboarding")
}

export async function putAgencyOnboardingStep(
  step: string,
  payload: Record<string, unknown>,
  expectedVersion?: number,
) {
  return apiFetch("/api/v1/agency/onboarding", {
    method: "PUT",
    json: { step, payload, expectedVersion },
  })
}

export async function fetchAgencyVehicle(vehicleId: string) {
  return apiFetch<{
    id: string
    categoryCode: string
    make: string
    model: string
    year: number | null
    status: string
    branchId: string | null
    version: number
  }>(`/api/v1/agency/fleet/${vehicleId}`)
}

export async function updateAgencyVehicle(
  vehicleId: string,
  input: {
    expectedVersion: number
    make?: string
    model?: string
    status?: "ready" | "on_rent" | "maintenance" | "hidden"
    year?: number
  },
) {
  return apiFetch<{ id: string; version: number; status: string }>(
    `/api/v1/agency/fleet/${vehicleId}`,
    { method: "PATCH", json: input },
  )
}

export async function fetchAgencyRate(planId: string) {
  return apiFetch<{
    id: string
    name: string
    categoryCode: string
    netDailyMillimes: string
    minimumDays: number
    active: boolean
    version: number
  }>(`/api/v1/agency/rates/${planId}`)
}

export async function fetchVehicleMedia(vehicleId: string) {
  return apiFetchCollection<{
    id: string
    vehicleId: string
    storedObjectId: string
    kind: string
    sortOrder: number
    caption: string | null
    moderationState: string
    version: number
  }>(`/api/v1/agency/fleet/${vehicleId}/media`)
}

export async function createUploadIntent(input: {
  purpose:
    | "licence"
    | "compliance"
    | "vehicle_media"
    | "claim_evidence"
    | "message_attachment"
    | "avatar"
  mimeType: string
  sizeBytes: number
  classification?: "public" | "private" | "quarantine"
}) {
  return apiFetch<{
    objectId: string
    bucket: string
    objectKey: string
    uploadUrl: string
    expiresInSeconds: number
    headers: { "Content-Type": string }
  }>("/api/v1/uploads/intents", { method: "POST", json: input })
}

export async function finalizeUpload(
  objectId: string,
  input?: { checksumSha256?: string },
) {
  return apiFetch<{
    objectId: string
    scanStatus: string
    purpose: string
  }>(`/api/v1/uploads/${objectId}/finalize`, {
    method: "POST",
    json: input ?? {},
  })
}

export async function attachVehicleMedia(
  vehicleId: string,
  input: {
    storedObjectId: string
    kind?: "photo" | "exterior" | "interior" | "damage"
    sortOrder?: number
    caption?: string
  },
) {
  return apiFetch<{
    id: string
    vehicleId: string
    storedObjectId: string
    scanStatus: "clean"
    moderationState: "approved"
  }>(`/api/v1/agency/fleet/${vehicleId}/media`, {
    method: "POST",
    json: input,
  })
}

export async function deleteVehicleMedia(vehicleId: string, mediaId: string) {
  return apiFetch<{ id: string; deleted: true }>(
    `/api/v1/agency/fleet/${vehicleId}/media/${mediaId}`,
    { method: "DELETE" },
  )
}

export async function fetchAvailabilityBlocks(vehicleId?: string) {
  const q = vehicleId
    ? `?vehicleId=${encodeURIComponent(vehicleId)}`
    : ""
  return apiFetchCollection<{
    id: string
    vehicleId: string | null
    branchId: string | null
    kind: string
    label: string
    reason: string | null
    startsAt: string
    endsAt: string
    status: string
    version: number
  }>(`/api/v1/agency/availability-blocks${q}`)
}

export async function createAvailabilityBlock(input: {
  vehicleId?: string
  branchId?: string
  kind?: "maintenance" | "owner_use" | "hold" | "other"
  label: string
  reason?: string
  startsAt: string
  endsAt: string
}) {
  return apiFetch<{
    id: string
    startsAt: string
    endsAt: string
    version: number
  }>("/api/v1/agency/availability-blocks", { method: "POST", json: input })
}

export async function deleteAvailabilityBlock(blockId: string) {
  return apiFetch<{ id: string; status: "cancelled" }>(
    `/api/v1/agency/availability-blocks/${blockId}`,
    { method: "DELETE" },
  )
}

export async function fetchAgencyPolicies() {
  return apiFetchCollection<{
    id: string
    kind: string
    locale: string
    summary: string
    bodyMarkdown: string
    rules: Record<string, unknown>
    effectiveFrom: string
    version: number
  }>("/api/v1/agency/policies")
}

export async function putAgencyPolicy(
  kind: string,
  input: {
    locale: "en" | "fr"
    summary: string
    bodyMarkdown?: string
    rules?: Record<string, unknown>
    expectedVersion?: number
  },
) {
  return apiFetch<{
    id: string
    kind: string
    locale: string
    version: number
  }>(`/api/v1/agency/policies/${kind}`, { method: "PUT", json: input })
}

export async function fetchAgencyFees() {
  return apiFetchCollection<{
    id: string
    code: string
    nameEn: string
    nameFr: string
    amountMillimes: string
    mandatory: boolean
    active: boolean
    includesDeposit: false
    version: number
  }>("/api/v1/agency/fees")
}

export async function putAgencyFees(
  fees: Array<{
    code: string
    nameEn: string
    nameFr: string
    amountMillimes: string
    mandatory: boolean
    active: boolean
  }>,
) {
  return apiFetch<{ updated: number; includesDeposit: false }>(
    "/api/v1/agency/fees",
    { method: "PUT", json: { fees } },
  )
}

export async function fetchAgencyNotifications() {
  return apiFetchCollection<{
    id: string
    type: string
    title: string
    body: string
    href: string | null
    read: boolean
    createdAt: string
  }>("/api/v1/agency/notifications")
}

export async function markAgencyNotificationsRead(input: {
  ids?: string[]
  all?: boolean
}) {
  return apiFetch<{ ok: true }>("/api/v1/agency/notifications/read", {
    method: "POST",
    json: input,
  })
}

export async function fetchAgencyNotificationPreferences() {
  return apiFetch<
    Array<{
      eventKey: string
      emailEnabled: boolean
      smsEnabled: boolean
      inAppEnabled: boolean
      emailLocked: boolean
    }>
  >("/api/v1/agency/notification-preferences")
}

export async function putAgencyNotificationPreferences(
  preferences: Array<{
    eventKey:
      | "booking_request"
      | "booking_message"
      | "cancellation"
      | "payout"
      | "sla_warning"
    emailEnabled: boolean
    smsEnabled: boolean
    inAppEnabled: boolean
  }>,
) {
  return apiFetch<{ ok: true }>("/api/v1/agency/notification-preferences", {
    method: "PUT",
    json: { preferences },
  })
}

export async function fetchBookingMessages(bookingId: string) {
  return apiFetchCollection<{
    id: string
    bookingId: string
    authorClass: string
    visibility: string
    body: string
    staffMarked: boolean
    createdAt: string
  }>(`/api/v1/agency/bookings/${bookingId}/messages`)
}

export async function postAgencyBookingMessage(
  bookingId: string,
  input: {
    body: string
    visibility?: "customer" | "agency" | "internal" | "both"
  },
) {
  return apiFetch<{
    id: string
    bookingId: string
    visibility: string
    staffMarked: boolean
  }>(`/api/v1/agency/bookings/${bookingId}/messages`, {
    method: "POST",
    json: input,
  })
}

export async function fetchAgencyTeam() {
  return apiFetch<{
    members: Array<{
      id: string
      userId: string
      role: string
      status: string
      email: string
      name: string
      version: number
    }>
    invitations: Array<{
      id: string
      email: string
      role: string
      status: string
      expiresAt: string
    }>
  }>("/api/v1/agency/team")
}

export async function inviteAgencyTeamMember(input: {
  email: string
  role: "owner" | "manager" | "agent" | "fleet" | "accountant"
}) {
  return apiFetch<{ id: string; email: string; role: string; inviteToken: string }>(
    "/api/v1/agency/team/invite",
    { method: "POST", json: input },
  )
}

export async function fetchAgencySettings() {
  return apiFetch<{
    agencyId: string
    bookingMode: string
    instantEnabled: boolean
    publicSlug: string | null
    version: number
  }>("/api/v1/agency/settings")
}

export async function patchAgencySettings(input: Record<string, unknown>) {
  return apiFetch("/api/v1/agency/settings", { method: "PATCH", json: input })
}

export async function fetchAgencyCalendar() {
  return apiFetch<{
    blocks: Array<{
      id: string
      kind: string
      label: string
      startsAt: string
      endsAt: string
    }>
    bookings: Array<{
      id: string
      reference: string
      status: string
      pickupAt: string
      returnAt: string
    }>
  }>("/api/v1/agency/calendar")
}

export async function fetchAgencyReviews() {
  return apiFetch<
    Array<{
      id: string
      rating: number
      body: string
      status: string
      reply: { id: string; body: string } | null
    }>
  >("/api/v1/agency/reviews")
}

export async function fetchAgencyReports() {
  return apiFetch<{
    agencyId: string
    bookingsTotal: number
    byStatus: Record<string, number>
  }>("/api/v1/agency/reports")
}

export async function fetchAgencyFinance() {
  return apiFetch<{
    payouts: Array<{ id: string; status: string; totalMillimes: string }>
    invoices: Array<{
      id: string
      kind: string
      totalMillimes: string
      includesDeposit: boolean
    }>
  }>("/api/v1/agency/finance")
}

export async function prepareAgencyBooking(
  bookingId: string,
  input: { expectedVersion: number; note?: string },
) {
  return apiFetch(`/api/v1/agency/bookings/${bookingId}/prepare`, {
    method: "POST",
    json: input,
  })
}

export async function openAgencyBookingIssue(
  bookingId: string,
  input: {
    kind: string
    severity?: "low" | "medium" | "high"
    summary: string
    details?: string
  },
) {
  return apiFetch(`/api/v1/agency/bookings/${bookingId}/issues`, {
    method: "POST",
    json: input,
  })
}
