"use client"

import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type OfferGalleryProps = {
  images: string[]
  alt: string
}

export function OfferGallery({ images, alt }: OfferGalleryProps) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[14px] border border-black/10 bg-zinc-100 dark:border-white/10 dark:bg-zinc-800">
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 720px"
          className="object-cover grayscale-[18%] contrast-[1.05] transition duration-500"
        />
        <div className="absolute bottom-3 right-3 rounded-[6px] bg-black/75 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white dark:bg-white/90 dark:text-black">
          {active + 1} / {images.length}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Vehicle photos">
        {images.map((src, index) => {
          const selected = index === active
          return (
            <button
              key={src}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => setActive(index)}
              className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-[8px] border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white",
                selected
                  ? "border-black dark:border-white"
                  : "border-black/10 opacity-75 hover:opacity-100 dark:border-white/10",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="96px"
                className="object-cover grayscale-[25%]"
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
