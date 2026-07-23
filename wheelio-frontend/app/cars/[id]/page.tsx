import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { OfferDetailView } from "@/components/offer/offer-detail-view"
import { SiteHeader } from "@/components/search/site-header"
import { getOfferDetail, listOfferIds } from "@/lib/offer-detail"
import { formatTnd } from "@/lib/search-utils"

type PageProps = {
  params: Promise<{ id: string }>
}

export function generateStaticParams() {
  return listOfferIds().map((id) => ({ id }))
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  const offer = getOfferDetail(id)
  if (!offer) {
    return { title: "Offer not found | Wheelio" }
  }

  return {
    title: `${offer.modelName} · ${formatTnd(offer.totalPriceTnd)} | Wheelio`,
    description: `${offer.categoryLabel} from ${offer.agency.name}. Total ${formatTnd(offer.totalPriceTnd)} in TND. Deposit separate. ${offer.confirmation === "instant" ? "Instant confirmation" : "Request to book"}.`,
  }
}

function DetailFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-900">
      <SiteHeader />
      <div className="mx-auto grid max-w-7xl animate-pulse gap-8 px-4 py-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="aspect-[16/10] rounded-[14px] bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-40 rounded-[12px] bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <div className="hidden h-80 rounded-[14px] bg-zinc-200 dark:bg-zinc-800 lg:block" />
      </div>
    </div>
  )
}

export default async function CarDealPage({ params }: PageProps) {
  const { id } = await params
  const offer = getOfferDetail(id)
  if (!offer) notFound()

  return (
    <Suspense fallback={<DetailFallback />}>
      <OfferDetailView offer={offer} />
    </Suspense>
  )
}
