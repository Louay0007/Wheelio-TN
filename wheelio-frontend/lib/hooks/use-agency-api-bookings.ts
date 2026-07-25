"use client"

import { useEffect, useState } from "react"
import {
  fetchAgencyBooking,
  fetchAgencyBookings,
  millimesToTnd,
  type ApiAgencyBookingListItem,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"
import type { AgencyBooking, AgencyBookingStatus } from "@/lib/agency"

export function mapApiAgencyBooking(
  row: ApiAgencyBookingListItem,
): AgencyBooking {
  const listed = millimesToTnd(row.listedTotalMillimes)
  const net = millimesToTnd(row.agencyNetMillimes)
  const commission = millimesToTnd(row.commissionMillimes)
  const deposit = millimesToTnd(row.depositMillimes)
  const takeRate =
    listed > 0 ? Math.round((commission / listed) * 1000) / 10 : 0
  return {
    id: row.id,
    reference: row.reference,
    status: row.status as AgencyBookingStatus,
    confirmation: row.confirmation,
    slaExpiresAt: row.slaExpiresAt ?? undefined,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    driverName: row.driverName,
    categoryLabel: "Category",
    orSimilar: true,
    listedTotalTnd: listed,
    agencyNetTnd: net,
    commissionTnd: commission,
    takeRatePercent: takeRate,
    depositTnd: deposit,
    onlineCollectedTnd:
      row.paymentMode === "deposit_online" ? listed : 0,
    deskDueTnd: row.paymentMode === "pay_at_agency" ? listed : 0,
    pickupAt: row.pickupAt,
    returnAt: row.returnAt,
    pickupLabel: new Date(row.pickupAt).toLocaleString(),
    returnLabel: new Date(row.returnAt).toLocaleString(),
    branchId: row.branchId ?? "unknown",
    paymentMode:
      row.paymentMode === "deposit_online" ? "deposit_online" : "pay_at_agency",
    extras: [],
    timeline: [],
  }
}

export function useAgencyApiBookings() {
  const enabled = useApiAgencySlice()
  const [bookings, setBookings] = useState<AgencyBooking[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchAgencyBookings()
      .then((rows) => {
        if (cancelled) return
        setBookings(rows.map(mapApiAgencyBooking))
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load bookings")
        setBookings([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, bookings, loading, error, refreshKey: enabled }
}

export function useAgencyApiBooking(bookingId: string) {
  const enabled = useApiAgencySlice()
  const [booking, setBooking] = useState<AgencyBooking | null>(null)
  const [version, setVersion] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(enabled)

  useEffect(() => {
    if (!enabled || !bookingId) {
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    fetchAgencyBooking(bookingId)
      .then((row) => {
        if (cancelled) return
        const listed = millimesToTnd(
          row.pricing?.commissionableMillimes ?? "0",
        )
        const net = millimesToTnd(row.pricing?.agencyNetMillimes ?? "0")
        const commission = millimesToTnd(row.pricing?.commissionMillimes ?? "0")
        const deposit = millimesToTnd(
          row.deposit?.amountMillimes ?? row.pricing?.depositMillimes ?? "0",
        )
        setVersion(row.version)
        setBooking({
          id: row.bookingId,
          reference: row.reference,
          status: row.status as AgencyBookingStatus,
          confirmation:
            row.confirmationMode === "instant" ? "instant" : "request",
          slaExpiresAt: row.slaExpiresAt ?? undefined,
          customerName: row.contactName ?? "Guest",
          customerEmail: row.contactEmail ?? "",
          customerPhone: row.contactPhone ?? "",
          driverName: row.driverName ?? row.contactName ?? "Guest",
          categoryLabel: "Category",
          orSimilar: true,
          listedTotalTnd: listed,
          agencyNetTnd: net,
          commissionTnd: commission,
          takeRatePercent:
            listed > 0 ? Math.round((commission / listed) * 1000) / 10 : 0,
          depositTnd: deposit,
          onlineCollectedTnd:
            row.paymentMode === "deposit_online" ? listed : 0,
          deskDueTnd: row.paymentMode === "pay_at_agency" ? listed : 0,
          pickupAt: row.pickupAt,
          returnAt: row.returnAt,
          pickupLabel: new Date(row.pickupAt).toLocaleString(),
          returnLabel: new Date(row.returnAt).toLocaleString(),
          branchId: row.branchId ?? "unknown",
          paymentMode:
            row.paymentMode === "deposit_online"
              ? "deposit_online"
              : "pay_at_agency",
          extras: [],
          timeline: row.timeline.map((t) => ({
            label: t.toStatus,
            at: t.occurredAt,
          })),
        })
        setError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : "Failed to load booking")
        setBooking(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, bookingId])

  return { enabled, booking, version, loading, error, setVersion, setBooking }
}
