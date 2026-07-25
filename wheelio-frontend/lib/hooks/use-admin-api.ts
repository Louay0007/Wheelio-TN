"use client"

import { useEffect, useState } from "react"
import {
  adminBookingDepositTnd,
  adminBookingListedTnd,
  fetchAdminBooking,
  fetchAdminBookings,
  fetchAdminCases,
  fetchAdminCustomer,
  fetchAdminCustomers,
  fetchAdminLedger,
  fetchAdminPayouts,
  fetchAdminRefunds,
  type ApiAdminBooking,
  type ApiAdminCustomer,
  type ApiLedgerTx,
} from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { millimesToTnd } from "@/lib/gateways/agency"

export function useAdminApiBookings() {
  const enabled = useApiAdminSlice()
  const [bookings, setBookings] = useState<ApiAdminBooking[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminBookings()
      .then((rows) => {
        if (!cancelled) {
          setBookings(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setBookings([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, bookings, loading, error, listedTnd: adminBookingListedTnd, depositTnd: adminBookingDepositTnd }
}

export function useAdminApiCustomers() {
  const enabled = useApiAdminSlice()
  const [customers, setCustomers] = useState<ApiAdminCustomer[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminCustomers()
      .then((rows) => {
        if (!cancelled) {
          setCustomers(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setCustomers([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, customers, loading, error }
}

export function useAdminApiLedger() {
  const enabled = useApiAdminSlice()
  const [rows, setRows] = useState<
    Array<{
      id: string
      at: string
      type: string
      bookingRef?: string
      agencyName?: string
      amountTnd: number
      isDepositMemo: boolean
    }>
  >([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminLedger()
      .then((txs: ApiLedgerTx[]) => {
        if (cancelled) return
        const mapped = txs.flatMap((tx) => {
          const totalDebit = tx.entries.reduce(
            (s, e) => s + BigInt(e.debitMillimes || "0"),
            BigInt(0),
          )
          const isDeposit = tx.type.includes("deposit")
          return [
            {
              id: tx.id,
              at: tx.effectiveAt,
              type: tx.type,
              bookingRef: tx.bookingId ?? undefined,
              amountTnd: millimesToTnd(totalDebit),
              isDepositMemo: isDeposit,
            },
          ]
        })
        setRows(mapped)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setRows([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, rows, loading, error }
}

export function useAdminApiBooking(bookingId: string) {
  const enabled = useApiAdminSlice()
  const [booking, setBooking] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !bookingId) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminBooking(bookingId)
      .then((row) => {
        if (!cancelled) {
          setBooking(row)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setBooking(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, bookingId])

  return { enabled, booking, loading, error }
}

export function useAdminApiCustomer(userId: string) {
  const enabled = useApiAdminSlice()
  const [customer, setCustomer] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminCustomer(userId)
      .then((row) => {
        if (!cancelled) {
          setCustomer(row)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setCustomer(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, userId])

  return { enabled, customer, loading, error }
}

export function useAdminApiCases() {
  const enabled = useApiAdminSlice()
  const [cases, setCases] = useState<
    Array<{
      id: string
      subject: string
      status: string
      priority: string
      bookingId: string | null
      updatedAt: string
    }> | null
  >(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminCases()
      .then((rows) => {
        if (!cancelled) {
          setCases(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setCases([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, cases, loading, error }
}

export function useAdminApiPayouts() {
  const enabled = useApiAdminSlice()
  const [payouts, setPayouts] = useState<
    Array<{
      id: string
      agencyId: string
      status: string
      totalMillimes: string
      includesDeposit: false
    }> | null
  >(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminPayouts()
      .then((rows) => {
        if (!cancelled) {
          setPayouts(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setPayouts([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, payouts, loading, error }
}

export function useAdminApiRefunds() {
  const enabled = useApiAdminSlice()
  const [refunds, setRefunds] = useState<
    Array<{
      id: string
      bookingId: string
      status: string
      reason: string
      customerAmountMillimes: string
      includesDeposit: false
    }> | null
  >(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminRefunds()
      .then((rows) => {
        if (!cancelled) {
          setRefunds(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setRefunds([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, refunds, loading, error }
}
