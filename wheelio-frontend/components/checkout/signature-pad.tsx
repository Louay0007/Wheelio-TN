"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import { Eraser } from "lucide-react"
import { cn } from "@/lib/utils"

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void
  className?: string
  disabled?: boolean
}

/**
 * Pointer-based signature pad: mouse on desktop, finger/stylus on mobile.
 */
export function SignaturePad({
  onChange,
  className,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const [hasInk, setHasInk] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setIsDark(root.classList.contains("dark"))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const ratio = window.devicePixelRatio || 1
    const width = parent.clientWidth
    const height = Math.max(180, Math.round(width * 0.38))
    const prev = canvas.toDataURL("image/png")
    canvas.width = Math.floor(width * ratio)
    canvas.height = Math.floor(height * ratio)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.lineWidth = 2.25
    ctx.strokeStyle = isDark ? "#fafafa" : "#0a0a0a"
    // Restore previous strokes after resize when possible
    if (hasInk && prev.startsWith("data:")) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
      }
      img.src = prev
    }
  }, [hasInk, isDark])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    // Redraw stroke color when theme flips
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = isDark ? "#fafafa" : "#0a0a0a"
  }, [isDark])

  const pointFromEvent = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const emit = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    onChange(canvas.toDataURL("image/png"))
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (disabled) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    canvas.setPointerCapture(event.pointerId)
    drawing.current = true
    last.current = pointFromEvent(event)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(last.current.x + 0.01, last.current.y + 0.01)
    ctx.stroke()
    setHasInk(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || disabled) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx || !last.current) return
    const next = pointFromEvent(event)
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(next.x, next.y)
    ctx.stroke()
    last.current = next
  }

  const endStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return
    drawing.current = false
    last.current = null
    try {
      canvasRef.current?.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
    emit()
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasInk(false)
    onChange(null)
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative overflow-hidden rounded-[10px] border border-black/15 bg-white dark:border-white/15 dark:bg-zinc-950">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-dashed border-black/20 dark:border-white/20"
        />
        <canvas
          ref={canvasRef}
          className={cn(
            "touch-none block w-full cursor-crosshair",
            disabled && "pointer-events-none opacity-50",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
          role="img"
          aria-label="Signature pad. Draw your signature with mouse or finger."
        />
        {!hasInk ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-black/35 dark:text-white/35">
            Sign here · mouse on desktop · finger on phone
          </p>
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-black/45 dark:text-white/45">
          Draw clearly. You’ll use this signature on the rental agreement.
        </p>
        <button
          type="button"
          onClick={clear}
          disabled={!hasInk || disabled}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[7px] border border-black/15 px-3 text-xs font-semibold disabled:opacity-40 dark:border-white/15"
        >
          <Eraser className="size-3.5" />
          Clear
        </button>
      </div>
    </div>
  )
}
