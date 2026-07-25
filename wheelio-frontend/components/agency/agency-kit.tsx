"use client"

import Link from "next/link"
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

/** Wheelio agency ops kit - monochrome, dense, readable light+dark */

export const agencyMuted = "text-zinc-600 dark:text-zinc-300"
export const agencyMutedSoft = "text-zinc-500 dark:text-zinc-400"
export const agencyCard =
  "rounded-[12px] border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
export const agencyInput =
  "h-11 w-full rounded-[8px] border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50"

export function AgencyPanel({
  children,
  className,
  title,
  hint,
  action,
}: {
  children: ReactNode
  className?: string
  title?: string
  hint?: string
  action?: ReactNode
}) {
  const { tx } = useLocale()
  return (
    <section className={cn(agencyCard, "p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
                {tx(title)}
              </h2>
            ) : null}
            {hint ? (
              <p className={cn("mt-1 text-sm leading-relaxed", agencyMuted)}>{tx(hint)}</p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function AgencyStat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className={cn(agencyCard, "p-3.5")}>
      <p className={cn("text-xs font-semibold uppercase tracking-[0.1em]", agencyMutedSoft)}>
        {label}
      </p>
      <p className="mt-1.5 font-mono text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      {hint ? <p className={cn("mt-1 text-xs", agencyMuted)}>{hint}</p> : null}
    </div>
  )
}

export function AgencyPrimaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn("inline-flex h-11 cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200",
        className,
      )}
    />
  )
}

export function AgencySecondaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn("inline-flex h-11 cursor-pointer items-center justify-center rounded-[8px] border border-zinc-300 px-4 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
    />
  )
}

export function AgencyLinkButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string
  children: ReactNode
  variant?: "primary" | "secondary"
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn("inline-flex h-11 cursor-pointer items-center justify-center rounded-[8px] px-4 text-sm font-semibold transition active:scale-[0.98]",
        variant === "primary"
          ? "bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
          : "border border-zinc-300 text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
    >
      {children}
    </Link>
  )
}

export function AgencyField({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
      {label}
      <div className="mt-1.5">{children}</div>
      {hint ? <p className={cn("mt-1.5 text-xs", agencyMuted)}>{hint}</p> : null}
    </label>
  )
}

export function AgencyInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(agencyInput, props.className)} />
}

export function AgencySelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(agencyInput, props.className)} />
}

export function AgencyTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={cn("min-h-24 w-full rounded-[8px] border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-50",
        props.className,
      )}
    />
  )
}

export function AgencyTabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T
  onChange: (v: T) => void
  items: { id: T; label: string; count?: number }[]
}) {
  return (
    <div className="flex w-full flex-wrap gap-2" role="tablist">
      {items.map((item) => {
        const active = value === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn("inline-flex h-11 cursor-pointer items-center gap-2 rounded-[8px] px-3 text-sm font-semibold transition",
              active
                ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950"
                : "border border-zinc-300 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span
                className={cn("rounded-full px-1.5 text-[11px] font-semibold",
                  active
                    ? "bg-white/20 dark:bg-black/15"
                    : "bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-100",
                )}
              >
                {item.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function AgencyTip({ children }: { children: ReactNode }) {
  return (
    <p
      className={cn("rounded-[8px] border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-950",
        agencyMuted,
      )}
    >
      {children}
    </p>
  )
}

export function AgencyDivider() {
  return <hr className="border-zinc-200 dark:border-zinc-700" />
}

export function AgencyKeyValue({
  rows,
}: {
  rows: { label: string; value: ReactNode }[]
}) {
  return (
    <dl className="space-y-2.5 text-sm">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-2 last:pb-0 dark:border-zinc-800"
        >
          <dt className={agencyMutedSoft}>{row.label}</dt>
          <dd className="max-w-[65%] text-right font-medium text-zinc-950 dark:text-zinc-50">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
