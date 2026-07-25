"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import { listDemoTrips } from "@/lib/bookings"
import {
  buildCombinedTripIcs,
  buildTripIcs,
  downloadIcs,
} from "@/lib/calendar-export"
import { getOfferDetail } from "@/lib/offer-detail"
import { formatTunisDateTime } from "@/lib/trip-datetime"
import {
  calendarChipClass,
  formatMonthLabel,
  isUpcomingTrip,
  listCalendarTripSpans,
  monthMatrix,
  parseDateKey,
  tripsOnDateKey,
  tunisTodayDateKey,
  type CalendarTripSpan,
} from "@/lib/trip-calendar-utils"
import { cn } from "@/lib/utils"

type ViewMode = "month" | "agenda"

function usePreferAgendaOnMobile(): boolean {
  const [preferAgenda, setPreferAgenda] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)")
    const sync = () => setPreferAgenda(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return preferAgenda
}

function TripChip({ span }: { span: CalendarTripSpan }) {
  const { booking, modelLabel } = span
  return (
    <Link
      href={`/bookings/${booking.id}/schedule`}
      className={cn("block truncate rounded-[6px] px-2 py-1 text-[11px] font-semibold tracking-[-0.02em] transition-opacity hover:opacity-85",
        calendarChipClass(booking.status),
      )}
      title={`${booking.reference} · ${modelLabel}`}
    >
      {booking.reference}
    </Link>
  )
}

export function TripsCalendarClient() {
  const todayKey = tunisTodayDateKey()
  const { year: initYear, month: initMonth } = parseDateKey(todayKey)
  const [viewYear, setViewYear] = useState(initYear)
  const [viewMonth, setViewMonth] = useState(initMonth)
  const preferAgenda = usePreferAgendaOnMobile()
  const [viewMode, setViewMode] = useState<ViewMode>("month")

  useEffect(() => {
    if (preferAgenda) setViewMode("agenda")
  }, [preferAgenda])

  const trips = useMemo(() => listDemoTrips(), [])
  const spans = useMemo(() => listCalendarTripSpans(trips), [trips])
  const weeks = useMemo(
    () => monthMatrix(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const agendaRows = useMemo(() => {
    const rows: { dateKey: string; spans: CalendarTripSpan[] }[] = []
    const keys = new Set<string>()
    for (const span of spans) {
      for (const key of span.dateKeys) keys.add(key)
    }
    const sorted = [...keys].sort()
    for (const dateKey of sorted) {
      const onDay = tripsOnDateKey(spans, dateKey)
      if (onDay.length) rows.push({ dateKey, spans: onDay })
    }
    return rows
  }, [spans])

  const shiftMonth = (delta: number) => {
    let m = viewMonth + delta
    let y = viewYear
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    setViewMonth(m)
    setViewYear(y)
  }

  const goToday = () => {
    const { year, month } = parseDateKey(todayKey)
    setViewYear(year)
    setViewMonth(month)
  }

  const handleExportUpcoming = () => {
    const upcoming = trips.filter((b) => isUpcomingTrip(b))
    if (upcoming.length === 0) return

    const withOffers = upcoming
      .map((booking) => {
        const offer = getOfferDetail(booking.offerId)
        return offer ? { booking, offer } : null
      })
      .filter((row): row is NonNullable<typeof row> => row !== null)

    if (withOffers.length === 0) return

    if (withOffers.length === 1) {
      const { booking, offer } = withOffers[0]
      downloadIcs(
        `${booking.reference}-wheelio`,
        buildTripIcs(booking, offer),
      )
      return
    }

    downloadIcs(
      "wheelio-upcoming-trips",
      buildCombinedTripIcs(withOffers),
    )
  }

  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <PageShell>
      <PageHero
        eyebrow="Trips"
        title="Trip calendar"
        description="See pickup through return for every demo booking. Times follow Africa/Tunis — tap a trip to open its schedule."
      />

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-[8px] border-black/15 dark:border-white/15"
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="min-w-[10rem] text-center text-sm font-semibold tracking-[-0.02em]">
              {formatMonthLabel(viewYear, viewMonth)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-[8px] border-black/15 dark:border-white/15"
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-[8px] border-black/15 dark:border-white/15"
              onClick={goToday}
            >
              Today
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-[8px] border border-black/10 p-0.5 dark:border-white/10"
              role="tablist"
              aria-label="Calendar view"
            >
              {(["month", "agenda"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  role="tab"
                  aria-selected={viewMode === mode}
                  onClick={() => setViewMode(mode)}
                  className={cn("rounded-[6px] px-3 py-1.5 text-xs font-semibold capitalize tracking-[-0.02em]",
                    viewMode === mode
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "text-black/55 dark:text-white/55",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-[8px] bg-black text-white dark:bg-white dark:text-black"
              onClick={handleExportUpcoming}
            >
              <Download className="size-4" />
              Add upcoming to calendar
            </Button>
          </div>
        </div>

        <p className="mt-4 text-xs text-black/50 dark:text-white/50">
          All dates use{" "}
          <span className="font-medium text-black/70 dark:text-white/70">
            Africa/Tunis
          </span>
          . Desk hours may differ from your flight landing time.
        </p>

        {viewMode === "month" ? (
          <div className="mt-6 overflow-x-auto">
            <div className="min-w-[640px] rounded-[8px] border border-black/10 dark:border-white/10">
              <div className="grid grid-cols-7 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]">
                {weekdayLabels.map((label) => (
                  <div
                    key={label}
                    className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45"
                  >
                    {label}
                  </div>
                ))}
              </div>
              {weeks.map((week, wi) => (
                <div
                  key={wi}
                  className="grid grid-cols-7 dark:border-white/10"
                >
                  {week.map((dateKey, di) => {
                    const onDay = dateKey ? tripsOnDateKey(spans, dateKey) : []
                    const isToday = dateKey === todayKey
                    const dayNum = dateKey ? Number(dateKey.slice(8, 10)) : null
                    return (
                      <div
                        key={`${wi}-${di}`}
                        className={cn("min-h-[5.5rem] border-r border-black/10 p-2 last:border-r-0 dark:border-white/10",
                          !dateKey && "bg-black/[0.02] dark:bg-white/[0.02]",
                        )}
                      >
                        {dayNum !== null ? (
                          <>
                            <span
                              className={cn("inline-flex size-7 items-center justify-center rounded-full text-xs font-semibold",
                                isToday &&
                                  "bg-black text-white dark:bg-white dark:text-black",
                              )}
                            >
                              {dayNum}
                            </span>
                            <div className="mt-1 space-y-1">
                              {onDay.map((span) => (
                                <TripChip key={span.booking.id} span={span} />
                              ))}
                            </div>
                          </>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {agendaRows.length === 0 ? (
              <li className="rounded-[8px] border border-black/10 px-4 py-8 text-center text-sm text-black/55 dark:border-white/10 dark:text-white/55">
                No trip days in demo data.
              </li>
            ) : (
              agendaRows.map(({ dateKey, spans: daySpans }) => (
                <li
                  key={dateKey}
                  className="rounded-[8px] border border-black/10 p-4 dark:border-white/10"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
                    {formatTunisDateTime(`${dateKey}T12:00:00+01:00`).split(",")[0]}
                    {" · "}
                    {dateKey}
                  </p>
                  <ul className="mt-3 space-y-3">
                    {daySpans.map((span) => (
                      <li key={span.booking.id}>
                        <Link
                          href={`/bookings/${span.booking.id}/schedule`}
                          className="group block rounded-[8px] border border-black/10 p-3 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/25"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-sm font-semibold">
                              {span.booking.reference}
                            </span>
                            <span
                              className={cn("rounded-[6px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                                calendarChipClass(span.booking.status),
                              )}
                            >
                              {span.modelLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                            Pickup {span.booking.pickupLabel}
                          </p>
                          <p className="mt-1 text-xs text-black/45 dark:text-white/45">
                            Return {span.booking.returnLabel}
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ))
            )}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap gap-4 pt-6 text-xs text-black/55 dark:border-white/10 dark:text-white/55">
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-[4px] border border-black bg-black dark:border-white dark:bg-white" />
            Confirmed / active
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-[4px] border border-black/25 bg-transparent dark:border-white/30" />
            Pending
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="size-3 rounded-[4px] border border-dashed border-black/35 bg-transparent dark:border-white/35" />
            Cancelled
          </span>
        </div>

        <p className="mt-6 text-sm">
          <Link href="/trips" className="font-medium underline underline-offset-4">
            Back to your trips
          </Link>
        </p>
      </section>
    </PageShell>
  )
}
