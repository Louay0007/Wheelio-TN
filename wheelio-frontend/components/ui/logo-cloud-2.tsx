import React from "react"
import { cn } from "@/lib/utils";

type Logo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = React.ComponentProps<"div">;

export function LogoCloud({ className, ...props }: LogoCloudProps) {
  const logos: Logo[] = [
    { src: "https://svgl.app/library/nvidia-wordmark-light.svg", alt: "Nvidia Logo" },
    { src: "https://svgl.app/library/supabase_wordmark_light.svg", alt: "Supabase Logo" },
    { src: "https://svgl.app/library/github_wordmark_light.svg", alt: "GitHub Logo" },
    { src: "https://svgl.app/library/openai_wordmark_light.svg", alt: "OpenAI Logo" },
    { src: "https://svgl.app/library/turso-wordmark-light.svg", alt: "Turso Logo" },
    { src: "https://svgl.app/library/clerk-wordmark-light.svg", alt: "Clerk Logo" },
    { src: "https://svgl.app/library/claude-ai-wordmark-icon_light.svg", alt: "Claude AI Logo" },
    { src: "https://svgl.app/library/vercel_wordmark.svg", alt: "Vercel Logo" },
  ];

  return (
    <div
      className={cn("group relative w-full overflow-hidden border-y border-black/10 dark:border-zinc-700/30",
        className
      )}
      {...props}
    >
      <div className="logo-marquee flex w-max group-hover:[animation-play-state:paused]">
        {[0, 1].map((set) => (
          <div key={set} className="flex shrink-0" aria-hidden={set === 1}>
            {logos.map((logo) => (
              <LogoCard key={`${set}-${logo.alt}`} logo={logo} />
            ))}
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-white via-white/90 to-transparent dark:from-zinc-900 dark:via-zinc-900/90 md:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-white via-white/90 to-transparent dark:from-zinc-900 dark:via-zinc-900/90 md:w-40" />
    </div>
  );
}

type LogoCardProps = React.ComponentProps<"div"> & {
  logo: Logo;
};

function LogoCard({ logo, className, ...props }: LogoCardProps) {
  return (
    <div
      className={cn("flex h-24 w-48 shrink-0 items-center justify-center border-r border-black/10 bg-white px-8 transition-colors dark:border-zinc-700/30 dark:bg-zinc-900 md:w-56",
        className
      )}
      {...props}
    >
      <img
        alt={logo.alt}
        className="pointer-events-none h-4 select-none brightness-0 dark:invert md:h-5"
        height={logo.height || "auto"}
        src={logo.src || "/placeholder.svg"}
        width={logo.width || "auto"}
      />
    </div>
  );
}
