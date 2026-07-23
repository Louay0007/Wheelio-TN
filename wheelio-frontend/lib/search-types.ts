export type VehicleCategory =
  | "economy"
  | "compact"
  | "intermediate"
  | "suv"
  | "van"
  | "luxury"

export type Transmission = "automatic" | "manual"
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric"
export type MileagePolicy = "unlimited" | "limited"
export type CancellationPolicy = "free" | "partial" | "non_refundable"
export type ConfirmationType = "instant" | "request"
export type PickupMethod = "counter" | "meet_greet" | "delivery"

export type SortOption =
  | "recommended"
  | "total_price"
  | "rating"
  | "deposit"
  | "capacity"

export interface TripQuery {
  pickupLocation: string
  dropoffLocation: string
  pickupDate: string
  pickupTime: string
  dropoffDate: string
  dropoffTime: string
  driverAge: string
  differentReturn: boolean
}

export interface RentalOffer {
  id: string
  modelName: string
  category: VehicleCategory
  categoryLabel: string
  orSimilar: boolean
  image: string
  seats: number
  doors: number
  bags: number
  transmission: Transmission
  fuel: FuelType
  airConditioning: boolean
  agency: {
    name: string
    logo: string
    rating: number
    reviewCount: number
    city: string
    locationLabel: string
  }
  confirmation: ConfirmationType
  cancellation: CancellationPolicy
  cancellationNote: string
  mileage: MileagePolicy
  mileageNote: string
  pickupMethod: PickupMethod
  pickupMethodNote: string
  totalPriceTnd: number
  depositTnd: number
  recommendedScore: number
  sponsored?: boolean
  highlights: string[]
  included: string[]
}

export interface SearchFilters {
  priceMin: number
  priceMax: number
  categories: VehicleCategory[]
  seatsMin: number | null
  bagsMin: number | null
  transmissions: Transmission[]
  fuels: FuelType[]
  mileages: MileagePolicy[]
  depositMax: number | null
  cancellations: CancellationPolicy[]
  confirmations: ConfirmationType[]
  pickupMethods: PickupMethod[]
  ratingMin: number | null
}
