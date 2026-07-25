import type { Metadata } from "next"
import {
  publicLocationSchema,
  publicReviewSchema,
} from "@/lib/contracts/public-catalog"
import { getRequestLocale } from "@/lib/i18n/server"
import {
  listPublishedLocations,
  listPublicReviews,
} from "@/server/modules/fleet/application/public-catalog"
import { ReviewsHubClient } from "./reviews-client"

export const metadata: Metadata = {
  title: "Reviews | Wheelio TN",
  description:
    "Read customer reviews of Tunisian car rental agencies compared on Wheelio. Filter by location and rating.",
}

type PageProps = {
  searchParams: Promise<{ locale?: string }>
}

export default async function ReviewsPage({ searchParams }: PageProps) {
  const requestedLocale = (await searchParams).locale
  const locale = await getRequestLocale(requestedLocale)
  const [reviews, locations] = await Promise.all([
    listPublicReviews({ locale }),
    listPublishedLocations(locale),
  ])

  return (
    <ReviewsHubClient
      locale={locale}
      initialReviews={publicReviewSchema.array().parse(reviews)}
      initialLocations={publicLocationSchema.array().parse(locations)}
    />
  )
}
