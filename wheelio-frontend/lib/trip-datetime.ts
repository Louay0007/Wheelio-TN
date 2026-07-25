const TUNIS_TZ = "Africa/Tunis"

/** Human-readable pickup/return line in en-GB, Tunisia local time. */
export function formatTunisDateTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  return date.toLocaleString("en-GB", {
    timeZone: TUNIS_TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function countdownParts(
  targetIso: string,
  now = new Date(),
): { days: number; hours: number; minutes: number; label: string } | null {
  const target = new Date(targetIso)
  if (Number.isNaN(target.getTime())) return null

  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return null

  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`)
  if (hours > 0 || days === 0) parts.push(`${hours} hr${hours === 1 ? "" : "s"}`)
  if (days === 0 && hours < 12) {
    parts.push(`${minutes} min`)
  }

  return {
    days,
    hours,
    minutes,
    label: parts.slice(0, 2).join(" · ") || "Under 1 min",
  }
}

/** Inclusive day count between two calendar dates (YYYY-MM-DD or ISO). */
export function daysBetweenInclusive(startIso: string, endIso: string): number {
  const startDay = isoToTunisDateKey(startIso)
  const endDay = isoToTunisDateKey(endIso)
  const start = new Date(`${startDay}T12:00:00Z`)
  const end = new Date(`${endDay}T12:00:00Z`)
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

export function isoToTunisDateKey(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return iso.slice(0, 10)
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TUNIS_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date)
  const y = parts.find((p) => p.type === "year")?.value ?? "1970"
  const m = parts.find((p) => p.type === "month")?.value ?? "01"
  const d = parts.find((p) => p.type === "day")?.value ?? "01"
  return `${y}-${m}-${d}`
}

/** Build ISO strings at local Tunisia wall time (+01:00). */
export function tunisWallIso(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+01:00`
}

export function addDaysToTunisWall(
  base: Date,
  dayOffset: number,
  hour: number,
  minute: number,
): string {
  const shifted = new Date(base)
  shifted.setUTCDate(shifted.getUTCDate() + dayOffset)
  const key = shifted.toISOString().slice(0, 10)
  const [y, m, d] = key.split("-").map(Number)
  return tunisWallIso(y, m, d, hour, minute)
}
