import { apiFetch, apiFetchCollection } from "@/lib/api/client"
import { millimesToTnd } from "@/lib/gateways/agency"

export type ApiAdminBooking = {
  bookingId: string
  id: string
  reference: string
  status: string
  agencyId: string
  confirmation: "instant" | "request"
  paymentMode: string
  pickupAt: string
  returnAt: string
  slaExpiresAt: string | null
  customerName: string
  customerEmail: string
  listedTotalMillimes: string
  agencyNetMillimes: string
  commissionMillimes: string
  depositMillimes: string
  version: number
}

export type ApiAdminCustomer = {
  userId: string
  customerProfileId: string
  legalName: string
  preferredName: string | null
  phone: string | null
  preferredLocale: string
  city: string | null
  welcomeCompleted: boolean
  updatedAt: string
}

export type ApiLedgerTx = {
  id: string
  type: string
  bookingId: string | null
  description: string
  effectiveAt: string
  entries: Array<{
    accountId: string
    debitMillimes: string
    creditMillimes: string
  }>
}

export async function fetchAdminBookings() {
  return apiFetchCollection<ApiAdminBooking>("/api/v1/admin/bookings")
}

export async function fetchAdminBooking(bookingId: string) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/admin/bookings/${bookingId}`,
  )
}

export async function fetchAdminCustomers() {
  return apiFetchCollection<ApiAdminCustomer>("/api/v1/admin/customers")
}

export async function fetchAdminCustomer(userId: string) {
  return apiFetch<Record<string, unknown>>(
    `/api/v1/admin/customers/${userId}`,
  )
}

export async function fetchAdminLedger() {
  return apiFetchCollection<ApiLedgerTx>("/api/v1/admin/finance/ledger")
}

export async function fetchAdminPayouts() {
  return apiFetchCollection<{
    id: string
    agencyId: string
    status: string
    totalMillimes: string
    includesDeposit: false
  }>("/api/v1/admin/finance/payouts")
}

export async function fetchAdminRefunds() {
  return apiFetchCollection<{
    id: string
    bookingId: string
    status: string
    reason: string
    customerAmountMillimes: string
    includesDeposit: false
  }>("/api/v1/admin/finance/refunds")
}

export async function fetchAdminCases() {
  return apiFetchCollection<{
    id: string
    subject: string
    status: string
    priority: string
    bookingId: string | null
    updatedAt: string
  }>("/api/v1/admin/cases")
}

export async function fetchAdminCase(caseId: string) {
  return apiFetch<{
    id: string
    subject: string
    status: string
    priority: string
    bookingId: string | null
    agencyId: string | null
    body: string | null
    tags: string[]
    version: number
    updatedAt: string
    notes?: Array<{
      id: string
      body: string
      authorUserId: string
      fromStatus: string | null
      toStatus: string | null
      createdAt: string
    }>
  }>(`/api/v1/admin/cases/${caseId}`)
}

export async function updateAdminCase(
  caseId: string,
  input: {
    expectedVersion: number
    status?: "open" | "waiting" | "resolved" | "escalated"
    priority?: "low" | "normal" | "high"
    note?: string
    outcomeTag?: string
  },
) {
  return apiFetch<{
    id: string
    status: string
    priority: string
    version: number
  }>(`/api/v1/admin/cases/${caseId}`, { method: "PATCH", json: input })
}

export async function createAdminCase(input: {
  subject: string
  body?: string
  priority?: "low" | "normal" | "high"
  bookingId?: string
}) {
  return apiFetch<{ id: string; status: string }>("/api/v1/admin/cases", {
    method: "POST",
    json: input,
  })
}

export async function fetchAdminPartnerApplications() {
  return apiFetchCollection<{
    id: string
    status: string
    tradeName: string
    legalName: string
    city: string
    email: string
    phone: string
    fleetSizeEstimate: number
    branchesPlanned: number
    submittedAt: string
    version: number
  }>("/api/v1/admin/partner-applications")
}

export async function fetchAdminPartnerApplication(id: string) {
  return apiFetch<{
    id: string
    status: string
    tradeName: string
    legalName: string
    city: string
    email: string
    phone: string
    fleetSizeEstimate: number
    branchesPlanned: number
    docs: Array<{ label: string; state: string }>
    version: number
    submittedAt: string
    resultingAgencyId: string | null
    notes: Array<{ id: string; body: string; createdAt: string }>
  }>(`/api/v1/admin/partner-applications/${id}`)
}

export async function approvePartnerApplication(
  id: string,
  input: {
    expectedVersion: number
    verificationStatus?: "review" | "live"
    note?: string
  },
) {
  return apiFetch<{
    id: string
    status: string
    agencyId: string
    version: number
  }>(`/api/v1/admin/partner-applications/${id}/approval`, {
    method: "POST",
    json: input,
  })
}

export async function rejectPartnerApplication(
  id: string,
  input: {
    expectedVersion: number
    reasonCode?: "incomplete_docs" | "ineligible" | "duplicate" | "other"
    message?: string
  },
) {
  return apiFetch<{ id: string; status: string; version: number }>(
    `/api/v1/admin/partner-applications/${id}/rejection`,
    { method: "POST", json: input },
  )
}

export async function requestPartnerApplicationDocs(
  id: string,
  input: { expectedVersion: number; message?: string },
) {
  return apiFetch<{ id: string; status: string; version: number }>(
    `/api/v1/admin/partner-applications/${id}/documents-request`,
    { method: "POST", json: input },
  )
}

export async function fetchAdminBookingMoney(bookingId: string) {
  return apiFetch<{
    bookingId: string
    reference: string
    paymentMode: string
    pricing: Record<string, string> | null
    deposit: { amountMillimes: string; status: string } | null
    includesDepositInGmv: false
    includesDepositInPayouts: false
  }>(`/api/v1/admin/bookings/${bookingId}/money`)
}

export async function fetchAdminBookingTimeline(bookingId: string) {
  return apiFetch<{
    bookingId: string
    reference: string
    status: string
    timeline: Array<{
      toStatus: string
      fromStatus: string | null
      occurredAt: string
      reasonCode: string | null
    }>
  }>(`/api/v1/admin/bookings/${bookingId}/timeline`)
}

export async function createAdminPayoutBatch(input: {
  agencyId: string
  periodStart: string
  periodEnd: string
}) {
  return apiFetch<{
    payoutId: string
    agencyId: string
    totalMillimes: string
    itemCount: number
    includesDeposit: false
    status: string
  }>("/api/v1/admin/finance/payouts", { method: "POST", json: input })
}

export async function fetchAdminBookingMessages(bookingId: string) {
  return apiFetchCollection<{
    id: string
    bookingId: string
    authorClass: string
    visibility: string
    body: string
    staffMarked: boolean
    createdAt: string
  }>(`/api/v1/admin/bookings/${bookingId}/messages`)
}

export async function postAdminBookingMessage(
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
  }>(`/api/v1/admin/bookings/${bookingId}/messages`, {
    method: "POST",
    json: input,
  })
}

export function adminBookingListedTnd(b: ApiAdminBooking) {
  return millimesToTnd(b.listedTotalMillimes)
}

export function adminBookingDepositTnd(b: ApiAdminBooking) {
  return millimesToTnd(b.depositMillimes)
}
