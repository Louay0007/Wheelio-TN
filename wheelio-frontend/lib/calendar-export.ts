import type { BookingRecord } from "@/lib/bookings"
import type { OfferDetail } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"
import { formatTunisDateTime } from "@/lib/trip-datetime"

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
}

function toIcsLocal(iso: string): string {
  const date = new Date(iso)
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Tunis",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date)

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00"

  const year = pick("year")
  const month = pick("month")
  const day = pick("day")
  const hour = pick("hour")
  const minute = pick("minute")
  const second = pick("second")
  return `${year}${month}${day}T${hour}${minute}${second}`
}

function eventBlock(
  uid: string,
  summary: string,
  description: string,
  location: string,
  startIso: string,
  endIso: string,
): string {
  const alarm = (trigger: string, note: string) =>
    [
      "BEGIN:VALARM",
      `TRIGGER:${trigger}`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(note)}`,
      "END:VALARM",
    ].join("\r\n")

  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsLocal(new Date().toISOString())}`,
    `DTSTART;TZID=Africa/Tunis:${toIcsLocal(startIso)}`,
    `DTEND;TZID=Africa/Tunis:${toIcsLocal(endIso)}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `LOCATION:${icsEscape(location)}`,
    alarm("-PT24H", summary),
    alarm("-PT2H", summary),
    "END:VEVENT",
  ].join("\r\n")
}

function tripDescription(booking: BookingRecord, offer: OfferDetail, origin: string): string {
  const voucherPath = `/bookings/${booking.id}/voucher`
  return [
    `Reference: ${booking.reference}`,
    `Agency: ${offer.agency.name}`,
    `Vehicle: ${offer.modelName}${offer.orSimilar ? " or similar" : ""}`,
    `Voucher: ${origin}${voucherPath}`,
    `Refundable deposit at pickup: ${formatTnd(booking.depositAtPickupTnd)} (held separately from rental total).`,
  ].join("\n")
}

function pickupEndIso(pickupIso: string): string {
  const d = new Date(pickupIso)
  d.setHours(d.getHours() + 1)
  return d.toISOString()
}

function returnEndIso(returnIso: string): string {
  const d = new Date(returnIso)
  d.setHours(d.getHours() + 1)
  return d.toISOString()
}

export function buildTripIcs(booking: BookingRecord, offer: OfferDetail): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://wheelio.tn"
  const description = tripDescription(booking, offer, origin)

  const pickupSummary = `Pickup · ${booking.reference} · ${offer.modelName}`
  const returnSummary = `Return · ${booking.reference} · ${offer.modelName}`

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wheelio TN//Trip//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Africa/Tunis",
    "X-LIC-LOCATION:Africa/Tunis",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
    eventBlock(
      `${booking.reference}-pickup@wheelio.tn`,
      pickupSummary,
      description,
      booking.pickupLocation,
      booking.pickupAtIso,
      pickupEndIso(booking.pickupAtIso),
    ),
    eventBlock(
      `${booking.reference}-return@wheelio.tn`,
      returnSummary,
      description,
      booking.dropoffLocation,
      booking.returnAtIso,
      returnEndIso(booking.returnAtIso),
    ),
    "END:VCALENDAR",
  ].join("\r\n")

  return `${body}\r\n`
}

function toGoogleUtc(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  )
}

export function googleCalendarUrl(booking: BookingRecord, offer: OfferDetail): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://wheelio.tn"
  const text = `Car rental pickup · ${booking.reference}`
  const dates = `${toGoogleUtc(booking.pickupAtIso)}/${toGoogleUtc(pickupEndIso(booking.pickupAtIso))}`
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text,
    dates,
    details: tripDescription(booking, offer, origin),
    location: booking.pickupLocation,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export function outlookCalendarUrl(booking: BookingRecord, offer: OfferDetail): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://wheelio.tn"
  const params = new URLSearchParams({
    subject: `Car rental pickup · ${booking.reference}`,
    body: tripDescription(booking, offer, origin),
    startdt: booking.pickupAtIso,
    enddt: pickupEndIso(booking.pickupAtIso),
    location: booking.pickupLocation,
    path: "/calendar/action/compose",
    rru: "addevent",
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

export function plainTripSummary(booking: BookingRecord, offer: OfferDetail): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://wheelio.tn"
  return [
    `Wheelio TN · ${booking.reference}`,
    `${offer.modelName}${offer.orSimilar ? " or similar" : ""} · ${offer.agency.name}`,
    `Pickup: ${formatTunisDateTime(booking.pickupAtIso)} · ${booking.pickupLocation}`,
    `Return: ${formatTunisDateTime(booking.returnAtIso)} · ${booking.dropoffLocation}`,
    `Voucher: ${origin}/bookings/${booking.id}/voucher`,
    `Deposit at pickup: ${formatTnd(booking.depositAtPickupTnd)}`,
  ].join("\n")
}

export function buildCombinedTripIcs(
  items: { booking: BookingRecord; offer: OfferDetail }[],
): string {
  const events = items.flatMap(({ booking, offer }) => {
    const single = buildTripIcs(booking, offer)
    return single.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? []
  })

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wheelio TN//Trips//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Africa/Tunis",
    "X-LIC-LOCATION:Africa/Tunis",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0100",
    "TZNAME:CET",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n")

  return `${body}\r\n`
}

export function downloadIcs(filename: string, content: string): void {
  if (typeof document === "undefined") return
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename.endsWith(".ics") ? filename : `${filename}.ics`
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 500)
}
