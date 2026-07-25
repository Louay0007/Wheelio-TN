"use client"

import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { AdminBookingSubnav } from "@/components/admin/admin-booking-subnav"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminLinkButton,
  AdminMoneyTriad,
  AdminPanel,
  AdminTip,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { findBooking, formatAdminTnd } from "@/lib/admin"
import { millimesToTnd } from "@/lib/gateways/agency"
import { fetchAdminBookingMoney } from "@/lib/gateways/admin"
import { useApiAdminSlice } from "@/lib/gateways/flags"
import { cn } from "@/lib/utils"

export default function AdminBookingMoneyPage() {
  const { id } = useParams<{ id: string }>()
  const { workspace, ready } = useAdminSession()
  const api = useApiAdminSlice()
  const booking = useMemo(
    () => (workspace ? findBooking(workspace, id) : undefined),
    [workspace, id],
  )
  const [money, setMoney] = useState<Awaited<
    ReturnType<typeof fetchAdminBookingMoney>
  > | null>(null)
  const [loading, setLoading] = useState(api)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!api || !id) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAdminBookingMoney(id)
      .then((row) => {
        if (!cancelled) {
          setMoney(row)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [api, id])

  if (api) {
    if (loading) {
      return (
        <AdminShell title="Money">
          <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
        </AdminShell>
      )
    }
    if (error || !money) {
      return (
        <AdminShell title="Money">
          <p className="mb-3 text-sm text-red-600">{error}</p>
          <AdminLinkButton href={`/admin/bookings/${id}`} variant="secondary">
            Back
          </AdminLinkButton>
        </AdminShell>
      )
    }
    const listed = millimesToTnd(money.pricing?.commissionableMillimes ?? "0")
    const net = millimesToTnd(money.pricing?.agencyNetMillimes ?? "0")
    const commission = millimesToTnd(money.pricing?.commissionMillimes ?? "0")
    const deposit = millimesToTnd(
      money.deposit?.amountMillimes ?? money.pricing?.depositMillimes ?? "0",
    )
    const takeRate =
      listed > 0 ? Math.round((commission / listed) * 1000) / 10 : 0
    return (
      <AdminShell title={`${money.reference} · money`}>
        <AdminBookingSubnav bookingId={id} active="money" />
        <AdminTip>
          Deposit {formatAdminTnd(deposit)} is memo-only. includesDepositInGmv=
          {String(money.includesDepositInGmv)}, includesDepositInPayouts=
          {String(money.includesDepositInPayouts)}.
        </AdminTip>
        <AdminPanel title="Confirm snapshot" className="mt-4">
          <AdminMoneyTriad
            listed={listed}
            net={net}
            commission={commission}
            takeRate={takeRate}
            deposit={deposit}
          />
        </AdminPanel>
        <p className={cn("mt-3 text-sm", adminMuted)}>
          Payment mode: {money.paymentMode}
        </p>
      </AdminShell>
    )
  }

  if (!ready || !workspace || !booking) {
    return (
      <AdminShell title="Money">
        <div className="h-32 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  return (
    <AdminShell title={`${booking.reference} · money`}>
      <AdminBookingSubnav bookingId={booking.id} active="money" />
      <AdminTip>
        Deposit {formatAdminTnd(booking.depositTnd)} stays memo-only.
      </AdminTip>
      <AdminPanel title="Confirm snapshot" className="mt-4">
        <AdminMoneyTriad
          listed={booking.listedTotalTnd}
          net={booking.agencyNetTnd}
          commission={booking.commissionTnd}
          takeRate={booking.takeRatePercent}
          deposit={booking.depositTnd}
        />
      </AdminPanel>
    </AdminShell>
  )
}
