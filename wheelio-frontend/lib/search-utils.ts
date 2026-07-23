import { PRICE_BOUNDS } from "@/lib/search-offers"
import type {
  RentalOffer,
  SearchFilters,
  SortOption,
  TripQuery,
} from "@/lib/search-types"

export function defaultFilters(): SearchFilters {
  return {
    priceMin: PRICE_BOUNDS.min,
    priceMax: PRICE_BOUNDS.max,
    categories: [],
    seatsMin: null,
    bagsMin: null,
    transmissions: [],
    fuels: [],
    mileages: [],
    depositMax: null,
    cancellations: [],
    confirmations: [],
    pickupMethods: [],
    ratingMin: null,
  }
}

export function parseTripQuery(
  params: URLSearchParams,
  fallback: TripQuery,
): TripQuery {
  const differentReturn = params.get("differentReturn") === "1"
  const pickupLocation = params.get("pickup") || fallback.pickupLocation
  const dropoffLocation =
    params.get("dropoff") ||
    (differentReturn ? fallback.dropoffLocation : pickupLocation)

  return {
    pickupLocation,
    dropoffLocation,
    pickupDate: params.get("pickupDate") || fallback.pickupDate,
    pickupTime: params.get("pickupTime") || fallback.pickupTime,
    dropoffDate: params.get("dropoffDate") || fallback.dropoffDate,
    dropoffTime: params.get("dropoffTime") || fallback.dropoffTime,
    driverAge: params.get("driverAge") || fallback.driverAge,
    differentReturn,
  }
}

export function tripToSearchParams(trip: TripQuery): URLSearchParams {
  const params = new URLSearchParams()
  params.set("pickup", trip.pickupLocation)
  if (trip.differentReturn) {
    params.set("differentReturn", "1")
    params.set("dropoff", trip.dropoffLocation)
  }
  params.set("pickupDate", trip.pickupDate)
  params.set("pickupTime", trip.pickupTime)
  params.set("dropoffDate", trip.dropoffDate)
  params.set("dropoffTime", trip.dropoffTime)
  params.set("driverAge", trip.driverAge)
  return params
}

export function rentalDays(pickupDate: string, dropoffDate: string): number {
  const start = new Date(`${pickupDate}T12:00:00`)
  const end = new Date(`${dropoffDate}T12:00:00`)
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff)
}

export function formatTnd(amount: number): string {
  return `${amount.toLocaleString("fr-TN")} TND`
}

export function formatTripDate(date: string): string {
  const value = new Date(`${date}T12:00:00`)
  return value.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export function driverAgeLabel(age: string): string {
  if (age === "30") return "30+"
  return age.replace("-", "–")
}

export function countActiveFilters(filters: SearchFilters): number {
  let count = 0
  if (filters.priceMin > PRICE_BOUNDS.min || filters.priceMax < PRICE_BOUNDS.max) {
    count += 1
  }
  if (filters.categories.length) count += 1
  if (filters.seatsMin) count += 1
  if (filters.bagsMin) count += 1
  if (filters.transmissions.length) count += 1
  if (filters.fuels.length) count += 1
  if (filters.mileages.length) count += 1
  if (filters.depositMax != null) count += 1
  if (filters.cancellations.length) count += 1
  if (filters.confirmations.length) count += 1
  if (filters.pickupMethods.length) count += 1
  if (filters.ratingMin != null) count += 1
  return count
}

export function filterOffers(
  offers: RentalOffer[],
  filters: SearchFilters,
): RentalOffer[] {
  return offers.filter((offer) => {
    if (offer.totalPriceTnd < filters.priceMin || offer.totalPriceTnd > filters.priceMax) {
      return false
    }
    if (filters.categories.length && !filters.categories.includes(offer.category)) {
      return false
    }
    if (filters.seatsMin != null && offer.seats < filters.seatsMin) return false
    if (filters.bagsMin != null && offer.bags < filters.bagsMin) return false
    if (
      filters.transmissions.length &&
      !filters.transmissions.includes(offer.transmission)
    ) {
      return false
    }
    if (filters.fuels.length && !filters.fuels.includes(offer.fuel)) return false
    if (filters.mileages.length && !filters.mileages.includes(offer.mileage)) {
      return false
    }
    if (filters.depositMax != null && offer.depositTnd > filters.depositMax) {
      return false
    }
    if (
      filters.cancellations.length &&
      !filters.cancellations.includes(offer.cancellation)
    ) {
      return false
    }
    if (
      filters.confirmations.length &&
      !filters.confirmations.includes(offer.confirmation)
    ) {
      return false
    }
    if (
      filters.pickupMethods.length &&
      !filters.pickupMethods.includes(offer.pickupMethod)
    ) {
      return false
    }
    if (filters.ratingMin != null && offer.agency.rating < filters.ratingMin) {
      return false
    }
    return true
  })
}

export function sortOffers(
  offers: RentalOffer[],
  sort: SortOption,
): RentalOffer[] {
  const next = [...offers]
  next.sort((a, b) => {
    if (Boolean(a.sponsored) !== Boolean(b.sponsored)) {
      return a.sponsored ? -1 : 1
    }
    switch (sort) {
      case "total_price":
        return a.totalPriceTnd - b.totalPriceTnd
      case "rating":
        return b.agency.rating - a.agency.rating
      case "deposit":
        return a.depositTnd - b.depositTnd
      case "capacity":
        return b.seats - a.seats || b.bags - a.bags
      case "recommended":
      default:
        return b.recommendedScore - a.recommendedScore
    }
  })
  return next
}

export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}
