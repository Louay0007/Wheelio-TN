"use client"

import type { ReactNode } from "react"
import { CategoryIcon } from "@/components/icons/category-icons"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { DEPOSIT_BOUNDS, PRICE_BOUNDS } from "@/lib/search-offers"
import type {
  CancellationPolicy,
  ConfirmationType,
  FuelType,
  MileagePolicy,
  PickupMethod,
  SearchFilters,
  Transmission,
  VehicleCategory,
} from "@/lib/search-types"
import { formatTnd, toggleValue } from "@/lib/search-utils"
import { cn } from "@/lib/utils"

type FiltersPanelProps = {
  filters: SearchFilters
  onChange: (next: SearchFilters) => void
  onReset: () => void
  resultCount: number
}

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "economy", label: "Economy" },
  { value: "compact", label: "Compact" },
  { value: "intermediate", label: "Intermediate" },
  { value: "suv", label: "SUV" },
  { value: "van", label: "Van" },
  { value: "luxury", label: "Luxury" },
]

const TRANSMISSIONS: { value: Transmission; label: string }[] = [
  { value: "automatic", label: "Automatic" },
  { value: "manual", label: "Manual" },
]

const FUELS: { value: FuelType; label: string }[] = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "hybrid", label: "Hybrid" },
  { value: "electric", label: "Electric" },
]

const MILEAGES: { value: MileagePolicy; label: string }[] = [
  { value: "unlimited", label: "Unlimited km" },
  { value: "limited", label: "Limited km" },
]

const CANCELLATIONS: { value: CancellationPolicy; label: string }[] = [
  { value: "free", label: "Free cancellation" },
  { value: "partial", label: "Partial refund" },
  { value: "non_refundable", label: "Non-refundable" },
]

const CONFIRMATIONS: { value: ConfirmationType; label: string }[] = [
  { value: "instant", label: "Instant confirmation" },
  { value: "request", label: "Request to book" },
]

const PICKUPS: { value: PickupMethod; label: string }[] = [
  { value: "counter", label: "Counter / desk" },
  { value: "meet_greet", label: "Meet & greet" },
  { value: "delivery", label: "Delivery" },
]

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-black/10 py-5 last:border-b-0 dark:border-white/10">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-black/45 dark:text-white/45">
        {title}
      </h3>
      {children}
    </section>
  )
}

function CheckRow({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-[6px] px-1 py-1.5 text-sm text-black/80 transition hover:bg-black/[0.03] dark:text-white/80 dark:hover:bg-white/[0.04]">
      <Checkbox
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="border-black/25 data-[state=checked]:border-black data-[state=checked]:bg-black dark:border-white/25 dark:data-[state=checked]:border-white dark:data-[state=checked]:bg-white dark:data-[state=checked]:text-black"
      />
      <span>{label}</span>
    </label>
  )
}

export function FiltersPanel({
  filters,
  onChange,
  onReset,
  resultCount,
}: FiltersPanelProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-1 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black dark:text-white">Filters</p>
          <p className="text-xs text-black/45 dark:text-white/45">
            {resultCount} matching offer{resultCount === 1 ? "" : "s"}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs font-semibold text-black/55 underline-offset-2 transition hover:text-black hover:underline dark:text-white/55 dark:hover:text-white"
        >
          Reset all
        </button>
      </div>

      <Section title="Total price">
        <div className="mb-3 flex items-center justify-between text-sm font-medium text-black dark:text-white">
          <span>{formatTnd(filters.priceMin)}</span>
          <span>{formatTnd(filters.priceMax)}</span>
        </div>
        <Slider
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={10}
          value={[filters.priceMin, filters.priceMax]}
          onValueChange={([priceMin, priceMax]) =>
            onChange({ ...filters, priceMin, priceMax })
          }
          className="[&_[data-slot=slider-range]]:bg-black dark:[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-black dark:[&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-black/15 dark:[&_[data-slot=slider-track]]:bg-white/20"
        />
      </Section>

      <Section title="Category">
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((item) => {
            const active = filters.categories.includes(item.value)
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({
                    ...filters,
                    categories: toggleValue(filters.categories, item.value),
                  })
                }
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[10px] border px-2 py-3 text-center transition",
                  active
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 text-black/75 hover:border-black/40 hover:bg-black/[0.02] dark:border-white/15 dark:text-white/75 dark:hover:border-white/40 dark:hover:bg-white/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-full items-center justify-center",
                    active ? "opacity-100" : "opacity-80",
                  )}
                >
                  <CategoryIcon
                    category={item.value}
                    className="h-8 w-[3.25rem]"
                  />
                </span>
                <span className="text-[11px] font-semibold tracking-[-0.01em]">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Seats">
        <div className="grid grid-cols-4 gap-2">
          {[null, 4, 5, 7].map((value) => {
            const active = filters.seatsMin === value
            const label = value == null ? "Any" : `${value}+`
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...filters, seatsMin: value })}
                className={`rounded-[7px] border px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 text-black/70 hover:border-black/40 dark:border-white/15 dark:text-white/70 dark:hover:border-white/40"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Luggage">
        <div className="grid grid-cols-4 gap-2">
          {[null, 2, 3, 4].map((value) => {
            const active = filters.bagsMin === value
            const label = value == null ? "Any" : `${value}+`
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...filters, bagsMin: value })}
                className={`rounded-[7px] border px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 text-black/70 hover:border-black/40 dark:border-white/15 dark:text-white/70 dark:hover:border-white/40"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Transmission">
        <div className="space-y-0.5">
          {TRANSMISSIONS.map((item) => (
            <CheckRow
              key={item.value}
              checked={filters.transmissions.includes(item.value)}
              label={item.label}
              onCheckedChange={() =>
                onChange({
                  ...filters,
                  transmissions: toggleValue(filters.transmissions, item.value),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Fuel">
        <div className="space-y-0.5">
          {FUELS.map((item) => (
            <CheckRow
              key={item.value}
              checked={filters.fuels.includes(item.value)}
              label={item.label}
              onCheckedChange={() =>
                onChange({
                  ...filters,
                  fuels: toggleValue(filters.fuels, item.value),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Mileage">
        <div className="space-y-0.5">
          {MILEAGES.map((item) => (
            <CheckRow
              key={item.value}
              checked={filters.mileages.includes(item.value)}
              label={item.label}
              onCheckedChange={() =>
                onChange({
                  ...filters,
                  mileages: toggleValue(filters.mileages, item.value),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Deposit amount">
        <div className="mb-3 flex items-center justify-between text-sm text-black dark:text-white">
          <span className="text-black/55 dark:text-white/55">Max deposit</span>
          <span className="font-medium">
            {filters.depositMax == null
              ? "Any"
              : formatTnd(filters.depositMax)}
          </span>
        </div>
        <Slider
          min={DEPOSIT_BOUNDS.min}
          max={DEPOSIT_BOUNDS.max}
          step={50}
          value={[filters.depositMax ?? DEPOSIT_BOUNDS.max]}
          onValueChange={([depositMax]) =>
            onChange({
              ...filters,
              depositMax:
                depositMax >= DEPOSIT_BOUNDS.max ? null : depositMax,
            })
          }
          className="[&_[data-slot=slider-range]]:bg-black dark:[&_[data-slot=slider-range]]:bg-white [&_[data-slot=slider-thumb]]:border-black dark:[&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-track]]:bg-black/15 dark:[&_[data-slot=slider-track]]:bg-white/20"
        />
        <div className="mt-2 flex justify-between text-[11px] text-black/40 dark:text-white/40">
          <span>{formatTnd(DEPOSIT_BOUNDS.min)}</span>
          <span>{formatTnd(DEPOSIT_BOUNDS.max)}</span>
        </div>
      </Section>

      <Section title="Cancellation">
        <div className="space-y-0.5">
          {CANCELLATIONS.map((item) => (
            <CheckRow
              key={item.value}
              checked={filters.cancellations.includes(item.value)}
              label={item.label}
              onCheckedChange={() =>
                onChange({
                  ...filters,
                  cancellations: toggleValue(filters.cancellations, item.value),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Confirmation">
        <div className="space-y-0.5">
          {CONFIRMATIONS.map((item) => (
            <CheckRow
              key={item.value}
              checked={filters.confirmations.includes(item.value)}
              label={item.label}
              onCheckedChange={() =>
                onChange({
                  ...filters,
                  confirmations: toggleValue(filters.confirmations, item.value),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Pickup method">
        <div className="space-y-0.5">
          {PICKUPS.map((item) => (
            <CheckRow
              key={item.value}
              checked={filters.pickupMethods.includes(item.value)}
              label={item.label}
              onCheckedChange={() =>
                onChange({
                  ...filters,
                  pickupMethods: toggleValue(filters.pickupMethods, item.value),
                })
              }
            />
          ))}
        </div>
      </Section>

      <Section title="Agency rating">
        <div className="grid grid-cols-4 gap-2">
          {[null, 4, 4.5, 4.8].map((value) => {
            const active = filters.ratingMin === value
            const label = value == null ? "Any" : `${value}+`
            return (
              <button
                key={label}
                type="button"
                onClick={() => onChange({ ...filters, ratingMin: value })}
                className={`rounded-[7px] border px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 text-black/70 hover:border-black/40 dark:border-white/15 dark:text-white/70 dark:hover:border-white/40"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </Section>
    </div>
  )
}
