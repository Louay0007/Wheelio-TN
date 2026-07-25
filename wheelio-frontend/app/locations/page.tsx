import type { Metadata } from "next"
import Link from "next/link"
import { PageHero, PageShell } from "@/components/page-shell"
import { publicLocationSchema } from "@/lib/contracts/public-catalog"
import { getRequestLocale } from "@/lib/i18n/server"
import { listPublishedLocations } from "@/server/modules/fleet/application/public-catalog"
import { LocationsDirectory } from "./locations-directory"

export const metadata: Metadata = {
  title: "Car rental locations in Tunisia | Wheelio",
  description:
    "Compare rental cars at Tunis-Carthage, Tunis Centre, Monastir, Sousse, Enfidha-Hammamet, Djerba, Hammamet, and Sfax.",
}

type PageProps = {
  searchParams: Promise<{ locale?: string }>
}

export default async function LocationsIndexPage({ searchParams }: PageProps) {
  const requestedLocale = (await searchParams).locale
  const locale = await getRequestLocale(requestedLocale)
  const locations = publicLocationSchema
    .array()
    .parse(await listPublishedLocations(locale))

  return (
    <PageShell>
      <PageHero
        eyebrow="Locations"
        title="Car rental across Tunisia"
        description="Airports and cities where partner agencies pick up. Compare totals in TND, then start a search with your place prefilled."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <LocationsDirectory locale={locale} initialData={locations} />

        <p className="mt-10 text-sm text-black/50 dark:text-white/50">
          Looking for a category instead? Browse{" "}
          <Link href="/search" className="font-medium text-black underline-offset-2 hover:underline dark:text-white">
            all cars
          </Link>
          .
        </p>
      </div>
    </PageShell>
  )
}
