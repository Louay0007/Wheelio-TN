import { LogoCloud } from "@/components/ui/logo-cloud-2";

export function LogoSection() {
  return (
    <section className="relative w-full border-b border-black/10 bg-white pb-16 pt-10 transition-colors dark:border-zinc-700/30 dark:bg-zinc-900 md:pb-24 md:pt-14">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center text-4xl font-normal tracking-tight text-black dark:text-white md:text-5xl">
          Trusted by leading location teams
        </h2>

        <LogoCloud />
      </div>
    </section>
  );
}
