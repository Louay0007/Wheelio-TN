import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { PublicCatalogHighlights } from "@/components/public-catalog-highlights";
import { RentalSearch } from "@/components/rental-search";
import { publicBootstrapSchema } from "@/lib/contracts/public-catalog";
import { getRequestLocale } from "@/lib/i18n/server";
import { getPublicBootstrap } from "@/server/modules/fleet/application/public-catalog";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ locale?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const locale = await getRequestLocale((await searchParams).locale);
  const bootstrap = publicBootstrapSchema.parse(await getPublicBootstrap(locale));

  return (
    <main className="bg-white transition-colors dark:bg-zinc-900">
      <Hero />
      <RentalSearch />
      <PublicCatalogHighlights initialData={bootstrap} />
      <Footer />
    </main>
  );
}
