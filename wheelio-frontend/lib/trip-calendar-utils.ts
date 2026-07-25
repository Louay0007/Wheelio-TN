import type { BookingRecord, BookingStatus } from "@/lib/bookings"
import { getOfferDetail } from "@/lib/offer-detail"
import { isoToTunisDateKey } from "@/lib/trip-datetime"
import { cn } from "@/lib/utils"

export type CalendarTripSpan = {
  booking: BookingRecord
  modelLabel: string
  dateKeys: string[]
}

function addDaysToDateKey(key: string, offset: number): string {
  const d = new Date(`${key}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

export function dateKeysForTrip(pickupIso: string, returnIso: string): string[] {
  const start = isoToTunisDateKey(pickupIso)
  const end = isoToTunisDateKey(returnIso)
  const keys: string[] = []
  let cursor = start
  let guard = 0
  while (cursor <= end && guard < 400) {
    keys.push(cursor)
    if (cursor === end) break
    cursor = addDaysToDateKey(cursor, 1)
    guard += 1
  }
  return keys
}

export function listCalendarTripSpans(trips: BookingRecord[]): CalendarTripSpan[] {
  return trips
    .map((booking) => {
      const offer = getOfferDetail(booking.offerId)
      if (!offer) return null
      const modelLabel = `${offer.modelName}${offer.orSimilar ? " or similar" : ""}`
      return {
        booking,
        modelLabel,
        dateKeys: dateKeysForTrip(booking.pickupAtIso, booking.returnAtIso),
      }
    })
    .filter((row): row is CalendarTripSpan => row !== null)
}

export function tripsOnDateKey(
  spans: CalendarTripSpan[],
  dateKey: string,
): CalendarTripSpan[] {
  return spans.filter((s) => s.dateKeys.includes(dateKey))
}

export function calendarChipClass(status: BookingStatus): string {
  if (status === "cancelled") {
    return cn(
      "border border-dashed border-black/35 bg-transparent text-black/55",
      "dark:border-white/35 dark:text-white/55",
    )
  }
  if (status === "confirmed" || status === "active") {
    return cn(
      "border border-black bg-black text-white",
      "dark:border-white dark:bg-white dark:text-black",
    )
  }
  if (status === "completed") {
    return cn(
      "border border-black/20 bg-black/[0.08] text-black/70",
      "dark:border-white/20 dark:bg-white/[0.1] dark:text-white/70",
    )
  }
  return cn(
    "border border-black/25 bg-transparent text-black",
    "dark:border-white/30 dark:text-white",
  )
}

export function tunisTodayDateKey(now = new Date()): string {
  return isoToTunisDateKey(now.toISOString())
}

export function monthMatrix(viewYear: number, viewMonth: number): (string | null)[][] {
  const firstKey = `${viewYear}-${String(viewMonth).padStart(2, "0")}-01`
  const startDow = new Date(`${firstKey}T12:00:00Z`).getUTCDay()
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth, 0, 12)).getUTCDate()

  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i += 1) cells.push(null)
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(
      `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    )
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

export function formatMonthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 15, 12))
  return d.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map(Number)
  return { year, month, day }
}

export function isUpcomingTrip(booking: BookingRecord, now = new Date()): boolean {
  if (booking.status === "cancelled" || booking.status === "completed") return false
  return new Date(booking.returnAtIso).getTime() >= now.getTime()
}
