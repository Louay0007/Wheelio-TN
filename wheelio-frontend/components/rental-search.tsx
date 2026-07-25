"use client"

import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
  Search,
  UserRound,
} from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { tripToSearchParams } from "@/lib/search-utils"
import type { TripQuery } from "@/lib/search-types"
import { useLocale } from "@/lib/i18n/locale"

const locations = [
  "Tunis-Carthage Airport",
  "Tunis Centre",
  "Monastir Airport",
  "Sousse",
  "Djerba-Zarzis Airport",
  "Enfidha-Hammamet Airport",
  "Hammamet",
  "Sfax",
]

const times = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2)
  const minute = index % 2 === 0 ? "00" : "30"
  return `${String(hour).padStart(2, "0")}:${minute}`
})

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

function getInitialDates() {
  const pickup = new Date()
  pickup.setDate(pickup.getDate() + 1)

  const dropoff = new Date(pickup)
  dropoff.setDate(dropoff.getDate() + 6)

  return {
    pickup: toDateInput(pickup),
    dropoff: toDateInput(dropoff),
  }
}

const initialDates = getInitialDates()
const controlClassName =
  "h-14 w-full appearance-none rounded-[8px] border border-black/15 bg-black/[0.04] px-4 pr-10 text-sm text-black outline-none transition hover:border-black/35 focus:border-black focus:ring-2 focus:ring-black/15 dark:border-white/15 dark:bg-white/[0.07] dark:text-white dark:hover:border-white/35 dark:focus:border-white dark:focus:ring-white/20"
const dateControlClassName =
  "h-14 w-full rounded-[8px] border border-black/15 bg-black/[0.04] px-4 text-sm text-black outline-none transition [color-scheme:light] hover:border-black/35 focus:border-black focus:ring-2 focus:ring-black/15 dark:border-white/15 dark:bg-white/[0.07] dark:text-white dark:[color-scheme:dark] dark:hover:border-white/35 dark:focus:border-white dark:focus:ring-white/20"
const optionClassName = "bg-white text-black dark:bg-black dark:text-white"
const fieldIconClassName = "size-3.5 text-black/50 dark:text-white/55"
const chevronClassName =
  "pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-black/45 dark:text-white/50"

type FieldShellProps = {
  children: React.ReactNode
  icon: React.ReactNode
  label: string
}

function FieldShell({ children, icon, label }: FieldShellProps) {
  return (
    <label className="group block">
      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-black/55 dark:text-white/55">
        {icon}
        {label}
      </span>
      <span className="relative block">{children}</span>
    </label>
  )
}

export function RentalSearch() {
  const router = useRouter()
  const { tx } = useLocale()
  const [differentReturn, setDifferentReturn] = useState(false)
  const [pickupDate, setPickupDate] = useState(initialDates.pickup)
  const [dropoffDate, setDropoffDate] = useState(initialDates.dropoff)

  return (
    <section
      id="search"
      aria-labelledby="rental-search-title"
      className="relative overflow-hidden bg-white px-4 py-14 transition-colors dark:bg-zinc-900 sm:px-6 md:py-20"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-black/10 dark:bg-white/15"
      />

      <div className="relative mx-auto max-w-7xl lg:min-h-[520px] lg:py-10">
        <form
          className="relative z-10 overflow-hidden rounded-[18px] border border-black bg-white text-black shadow-[0_28px_80px_rgba(0,0,0,0.1)] transition-colors dark:border-white dark:bg-black dark:text-white dark:shadow-[0_28px_80px_rgba(255,255,255,0.06)] lg:w-[72%]"
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const pickupLocation = String(
              form.get("pickupLocation") || "Tunis-Carthage Airport",
            )
            const trip: TripQuery = {
              pickupLocation,
              dropoffLocation: differentReturn
                ? String(form.get("dropoffLocation") || pickupLocation)
                : pickupLocation,
              pickupDate: String(form.get("pickupDate") || pickupDate),
              pickupTime: String(form.get("pickupTime") || "10:00"),
              dropoffDate: String(form.get("dropoffDate") || dropoffDate),
              dropoffTime: String(form.get("dropoffTime") || "10:00"),
              driverAge: String(form.get("driverAge") || "30"),
              differentReturn,
            }
            router.push(`/search?${tripToSearchParams(trip).toString()}`)
          }}
        >
          <div className="flex flex-col gap-5 px-5 py-6 sm:px-7 md:flex-row md:items-end md:justify-between md:px-9 md:py-7">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-black/45 dark:text-white/45">
                {tx("Search all partners")}
              </p>
              <h2
                id="rental-search-title"
                className="text-2xl font-medium tracking-[-0.03em] sm:text-3xl"
              >
                {tx("Make your trip")}
              </h2>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-black/70 dark:text-white/70">
              <input
                type="checkbox"
                checked={differentReturn}
                onChange={(event) => setDifferentReturn(event.target.checked)}
                className="peer sr-only"
              />
              <span className="relative h-6 w-11 rounded-full border border-black/25 bg-black/10 transition-colors peer-checked:bg-black peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-black dark:border-white/25 dark:bg-white/10 dark:peer-checked:bg-white dark:peer-focus-visible:outline-white">
                <span
                  className={`absolute left-1 top-1 size-4 rounded-full transition-all ${
                    differentReturn
                      ? "translate-x-5 bg-white dark:bg-black"
                      : "bg-black dark:bg-white"
                  }`}
                />
              </span>
              {tx("Return to a different location")}
            </label>
          </div>

          <div className="grid gap-5 px-5 py-6 sm:px-7 md:grid-cols-12 md:px-9 md:py-8">
            <div className={differentReturn ? "md:col-span-6" : "md:col-span-12"}>
              <FieldShell
                label={tx("Pick-up location")}
                icon={<MapPin className={fieldIconClassName} />}
              >
                <select
                  name="pickupLocation"
                  defaultValue="Tunis-Carthage Airport"
                  className={controlClassName}
                >
                  {locations.map((location) => (
                    <option key={location} value={location} className={optionClassName}>
                      {location}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className={chevronClassName}
                />
              </FieldShell>
            </div>

            {differentReturn && (
              <div className="md:col-span-6">
                <FieldShell
                  label={tx("Drop-off location")}
                  icon={<MapPin className={fieldIconClassName} />}
                >
                  <select
                    name="dropoffLocation"
                    defaultValue="Monastir Airport"
                    className={controlClassName}
                  >
                    {locations.map((location) => (
                      <option key={location} value={location} className={optionClassName}>
                        {location}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    aria-hidden="true"
                    className={chevronClassName}
                  />
                </FieldShell>
              </div>
            )}

            <div className="sm:col-span-6 md:col-span-3">
              <FieldShell
                label={tx("Pick-up date")}
                icon={<CalendarDays className={fieldIconClassName} />}
              >
                <input
                  type="date"
                  name="pickupDate"
                  min={toDateInput(new Date())}
                  value={pickupDate}
                  onChange={(event) => {
                    setPickupDate(event.target.value)
                    if (event.target.value > dropoffDate) {
                      setDropoffDate(event.target.value)
                    }
                  }}
                  required
                  className={dateControlClassName}
                />
              </FieldShell>
            </div>

            <div className="sm:col-span-6 md:col-span-2">
              <FieldShell
                label={tx("Pick-up time")}
                icon={<Clock3 className={fieldIconClassName} />}
              >
                <select
                  name="pickupTime"
                  defaultValue="10:00"
                  className={controlClassName}
                >
                  {times.map((time) => (
                    <option key={time} value={time} className={optionClassName}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className={chevronClassName}
                />
              </FieldShell>
            </div>

            <div className="sm:col-span-6 md:col-span-3">
              <FieldShell
                label={tx("Drop-off date")}
                icon={<CalendarDays className={fieldIconClassName} />}
              >
                <input
                  type="date"
                  name="dropoffDate"
                  min={pickupDate}
                  value={dropoffDate}
                  onChange={(event) => setDropoffDate(event.target.value)}
                  required
                  className={dateControlClassName}
                />
              </FieldShell>
            </div>

            <div className="sm:col-span-6 md:col-span-2">
              <FieldShell
                label={tx("Drop-off time")}
                icon={<Clock3 className={fieldIconClassName} />}
              >
                <select
                  name="dropoffTime"
                  defaultValue="10:00"
                  className={controlClassName}
                >
                  {times.map((time) => (
                    <option key={time} value={time} className={optionClassName}>
                      {time}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className={chevronClassName}
                />
              </FieldShell>
            </div>

            <div className="sm:col-span-6 md:col-span-2">
              <FieldShell
                label={tx("Driver age")}
                icon={<UserRound className={fieldIconClassName} />}
              >
                <select
                  name="driverAge"
                  defaultValue="30"
                  className={controlClassName}
                >
                  <option value="18-20" className={optionClassName}>18–20</option>
                  <option value="21-24" className={optionClassName}>21–24</option>
                  <option value="25-29" className={optionClassName}>25–29</option>
                  <option value="30" className={optionClassName}>30+</option>
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className={chevronClassName}
                />
              </FieldShell>
            </div>
          </div>

          <div className="flex flex-col gap-4 bg-black/[0.02] px-5 py-5 dark:bg-black/10 sm:px-7 md:flex-row md:items-center md:justify-between md:px-9">
            <p className="flex items-center gap-2 text-xs leading-relaxed text-black/50 dark:text-white/50">
              <ArrowRight className="size-3.5 text-black/50 dark:text-white/55" />
              {tx(
                "Compare total prices from trusted Tunisian agencies. Prices shown in TND.",
              )}
            </p>
            <button
              type="submit"
              className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-black px-8 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.12)] transition hover:bg-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black active:translate-y-px dark:bg-white dark:text-black dark:shadow-[0_12px_30px_rgba(255,255,255,0.08)] dark:hover:bg-zinc-200 dark:focus-visible:outline-white"
            >
              <Search className="size-4" />
              {tx("Search rental cars")}
            </button>
          </div>
        </form>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-4 -right-[8%] z-0 hidden w-[58%] lg:block xl:-right-[5%]"
        >
          <div className="absolute bottom-[10%] right-[6%] h-[38%] w-[72%] rounded-full bg-black/5 blur-3xl dark:bg-white/10" />
          <Image
            src="/images/extended_road_no_background.png"
            alt=""
            width={2016}
            height={1344}
            sizes="(min-width: 1280px) 740px, 58vw"
            className="relative h-auto w-full select-none grayscale contrast-110 drop-shadow-[0_28px_32px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>
    </section>
  )
}
