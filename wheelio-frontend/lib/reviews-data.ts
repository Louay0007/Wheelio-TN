export type ReviewItem = {
  id: string
  name: string
  avatarSeed: string
  rating: number
  location: string
  tripContext: string
  quote: string
  agency: string
  month: string
}

export const REVIEWS: ReviewItem[] = [
  {
    id: "r1",
    name: "Yasmine Ben Ali",
    avatarSeed: "yasmine",
    rating: 5,
    location: "Tunis",
    tripContext: "Compact · Tunis-Carthage Airport",
    quote:
      "I compared deposit amounts and totals in TND before booking. The airport desk matched what Wheelio listed.",
    agency: "Carthage Drive",
    month: "Jun 2026",
  },
  {
    id: "r2",
    name: "Marc Lefèvre",
    avatarSeed: "marc",
    rating: 5,
    location: "Tunis",
    tripContext: "Economy · Meet & greet",
    quote:
      "Meet & greet was on time. Seeing cancellation and mileage together made the choice simple.",
    agency: "Medina Cars Tunis",
    month: "May 2026",
  },
  {
    id: "r3",
    name: "Sara Khelifi",
    avatarSeed: "sara",
    rating: 4,
    location: "Hammamet",
    tripContext: "SUV · Family trip",
    quote:
      "Request-to-book confirmed the same day. Boot space was exactly what we needed for beach bags.",
    agency: "Sahara Auto Rent",
    month: "Jul 2025",
  },
  {
    id: "r4",
    name: "Omar Haddad",
    avatarSeed: "omar",
    rating: 5,
    location: "Sousse",
    tripContext: "Van · Group travel",
    quote:
      "Nine seats for relatives arriving Monastir. Kilometre limit was clear before we paid.",
    agency: "Groupe Location Sahel",
    month: "Aug 2025",
  },
  {
    id: "r5",
    name: "Helena Vogt",
    avatarSeed: "helena",
    rating: 5,
    location: "Tunis",
    tripContext: "Luxury · Business",
    quote:
      "Premium pickup without hidden extras. Deposit was listed separately from the rental total.",
    agency: "Prestige Tunisie",
    month: "Apr 2026",
  },
  {
    id: "r6",
    name: "Ines Dridi",
    avatarSeed: "ines",
    rating: 4,
    location: "Djerba",
    tripContext: "Economy · Island week",
    quote:
      "Small car was perfect for Djerba. Unlimited km on the island meant we could explore freely.",
    agency: "Djerba Easy Rent",
    month: "Sep 2025",
  },
  {
    id: "r7",
    name: "Thomas Weber",
    avatarSeed: "thomas",
    rating: 4,
    location: "Tunis",
    tripContext: "Compact · City centre",
    quote:
      "Picked up near Avenue Habib Bourguiba after our hotel stay. Filters for automatic saved time.",
    agency: "Nord Auto Location",
    month: "Mar 2026",
  },
  {
    id: "r8",
    name: "Amira Slim",
    avatarSeed: "amira",
    rating: 4,
    location: "Enfidha",
    tripContext: "Intermediate · Resort transfer",
    quote:
      "Enfidha meet & greet was straightforward. Octavia boot handled all the soft luggage.",
    agency: "Enfidha Rent Plus",
    month: "Oct 2025",
  },
  {
    id: "r9",
    name: "Hedi Gharbi",
    avatarSeed: "hedi",
    rating: 4,
    location: "Sfax",
    tripContext: "Economy · City desk",
    quote:
      "Lowest clear total among the offers we compared. Desk staff explained the daily km cap.",
    agency: "Sfax Direct Cars",
    month: "Feb 2026",
  },
  {
    id: "r10",
    name: "Nadia Trabelsi",
    avatarSeed: "nadia",
    rating: 5,
    location: "Tunis",
    tripContext: "Intermediate · Hotel delivery",
    quote:
      "Hybrid Corolla delivered to our Airbnb. Fuel use was gentle for a Tunis–Hammamet loop.",
    agency: "Atlas Mobility",
    month: "Jun 2026",
  },
  {
    id: "r11",
    name: "Farid Mansouri",
    avatarSeed: "farid",
    rating: 3,
    location: "Hammamet",
    tripContext: "SUV · Summer diaspora",
    quote:
      "Car was fine; confirmation took longer than expected. Glad Wheelio labelled it request-to-book.",
    agency: "Sahara Auto Rent",
    month: "Jul 2025",
  },
  {
    id: "r12",
    name: "Claire Dupont",
    avatarSeed: "claire",
    rating: 5,
    location: "Tunis",
    tripContext: "Automatic compact · First visit",
    quote:
      "As a manual-shy driver I filtered automatics only. Instant booking and clear TND totals.",
    agency: "Carthage Drive",
    month: "May 2026",
  },
]

export const REVIEW_OVERALL = {
  score: 4.6,
  count: REVIEWS.length,
  label: "Average from recent Wheelio demo reviews",
}

export function listReviewLocations(): string[] {
  return Array.from(new Set(REVIEWS.map((r) => r.location))).sort()
}

export function dicebearAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=solid&fontWeight=600`
}

export function initialsAvatar(name: string): string {
  const parts = name.trim().split(/\s+/)
  const initials =
    parts.length >= 2
      ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`
      : (parts[0]?.slice(0, 2) ?? "?")
  return dicebearAvatar(initials.toUpperCase())
}
