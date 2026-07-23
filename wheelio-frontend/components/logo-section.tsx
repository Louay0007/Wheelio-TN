import { LogoCloud } from "@/components/ui/logo-cloud-2";

export function LogoSection() {
  return (
    <section className="relative w-full bg-zinc-900 pb-16 pt-10 md:pb-24 md:pt-14 border-b border-zinc-700/30">
      <div className="mx-auto max-w-7xl">
        <h2 className="mb-12 text-center font-normal text-4xl text-white tracking-tight md:text-5xl">
          Trusted by leading location teams
        </h2>

        <LogoCloud />
      </div>
    </section>
  );
}
