"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { clearPreview, readPreview, type PreviewMode } from "@/lib/preview-mode"
import { useLocale } from "@/lib/i18n/locale"

export function PreviewBanner() {
  const [mode, setMode] = useState<PreviewMode | null>(null)
  const router = useRouter()
  const { t } = useLocale()

  useEffect(() => {
    const sync = () => setMode(readPreview())
    sync()
    window.addEventListener("wheelio-preview", sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener("wheelio-preview", sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  useEffect(() => {
    if (!mode) return
    const blockSubmit = (e: Event) => {
      const target = e.target as HTMLElement | null
      if (target?.closest?.("[data-preview-exit]")) return
      e.preventDefault()
      e.stopPropagation()
      window.alert("Read-only admin preview — exit preview to make changes.")
    }
    const blockClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el) return
      if (el.closest("[data-preview-exit]")) return
      const btn = el.closest("button, [role='button']") as HTMLElement | null
      if (!btn) return
      if (btn.closest("a")) return
      const type = (btn as HTMLButtonElement).type
      if (type === "button" && !btn.closest("form")) {
        // Allow nav chrome toggles; block destructive / save-looking actions by data attr
        if (!btn.dataset.previewWrite && !btn.closest("[data-preview-write]")) return
      }
      if (type === "submit" || btn.dataset.previewWrite != null || btn.closest("[data-preview-write]")) {
        e.preventDefault()
        e.stopPropagation()
        window.alert("Read-only admin preview — exit preview to make changes.")
      }
    }
    document.addEventListener("submit", blockSubmit, true)
    document.addEventListener("click", blockClick, true)
    return () => {
      document.removeEventListener("submit", blockSubmit, true)
      document.removeEventListener("click", blockClick, true)
    }
  }, [mode])

  if (!mode) return null

  return (
    <div
      role="status"
      className="sticky top-0 z-[100] border-b-2 border-amber-600 bg-amber-400 px-4 py-2.5 text-zinc-950 shadow-sm"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold tracking-[-0.02em]">
          {t("preview.banner")}{" "}
          <span className="font-normal">
            ({mode.as === "agency" ? "Agency" : "Customer"} · {mode.label})
          </span>
        </p>
        <button
          type="button"
          data-preview-exit
          className="inline-flex h-9 cursor-pointer items-center rounded-[8px] bg-zinc-950 px-3 text-xs font-semibold text-amber-300 transition hover:bg-zinc-800"
          onClick={() => {
            const back = mode.returnTo
            clearPreview()
            router.push(back)
          }}
        >
          {t("preview.exit")}
        </button>
      </div>
    </div>
  )
}

/** Blocks form submits / primary writes while admin preview is active. */
export function usePreviewLock() {
  const [locked, setLocked] = useState(false)
  useEffect(() => {
    const sync = () => setLocked(Boolean(readPreview()))
    sync()
    window.addEventListener("wheelio-preview", sync)
    return () => window.removeEventListener("wheelio-preview", sync)
  }, [])
  return locked
}
