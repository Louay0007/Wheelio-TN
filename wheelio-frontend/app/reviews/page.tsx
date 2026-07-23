import type { Metadata } from "next"
import { ReviewsHubClient } from "./reviews-client"

export const metadata: Metadata = {
  title: "Reviews | Wheelio TN",
  description:
    "Read customer reviews of Tunisian car rental agencies compared on Wheelio. Filter by location and rating.",
}

export default function ReviewsPage() {
  return <ReviewsHubClient />
}
