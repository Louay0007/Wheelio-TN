import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { LogoSection } from "@/components/logo-section";
import { RentalSearch } from "@/components/rental-search";

export default function Home() {
  return (
    <main className="bg-white transition-colors dark:bg-zinc-900">
      <Hero />
      <LogoSection />
      <RentalSearch />
      <Footer />
    </main>
  );
}
