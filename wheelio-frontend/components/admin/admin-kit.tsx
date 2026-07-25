"use client"

import Link from "next/link"
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

/** Wheelio admin control-plane kit - denser than agency, monochrome */

export const adminMuted = "text-zinc-600 dark:text-zinc-300"
export const adminMutedSoft = "text-zinc-500 dark:text-zinc-400"
export const adminCard =
  "rounded-[10px] border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
export const adminInput =
  "h-10 w-full rounded-[8px] border border-zinc-300 bg-white px-3 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-950 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-50"

export function AdminPanel({
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
    <section className={cn(adminCard, "p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
                {tx(title)}
              </h2>
            ) : null}
            {hint ? (
              <p className={cn("mt-1 text-sm leading-relaxed", adminMuted)}>{tx(hint)}</p>
            ) : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function AdminStat({
  label,
  value,
  hint,
  href,
}: {
  label: string
  value: string
  hint?: string
  href?: string
}) {
  const inner = (
    <>
      <p className={cn("text-[11px] font-semibold uppercase tracking-[0.1em]", adminMutedSoft)}>
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      {hint ? <p className={cn("mt-1 text-xs", adminMuted)}>{hint}</p> : null}
    </>
  )
  if (href) {
    return (
      <Link
        href={href}
        className={cn(adminCard, "block p-3.5 transition hover:border-zinc-400 dark:hover:border-zinc-500")}
      >
        {inner}
      </Link>
    )
  }
  return <div className={cn(adminCard, "p-3.5")}>{inner}</div>
}

export function AdminPrimaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn("inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] bg-zinc-950 px-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200",
        className,
      )}
    />
  )
}

export function AdminSecondaryButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn("inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] border border-zinc-300 px-3.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800",
        className,
      )}
    />
  )
}

export function AdminLinkButton({
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
      className={cn("inline-flex h-10 cursor-pointer items-center justify-center rounded-[8px] px-3.5 text-sm font-semibold transition active:scale-[0.98]",
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

export function AdminField({
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
      {hint ? <p className={cn("mt-1.5 text-xs", adminMuted)}>{hint}</p> : null}
    </label>
  )
}

export function AdminInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(adminInput, props.className)} />
}

export function AdminSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(adminInput, props.className)} />
}

export function AdminTextarea(
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

export function AdminTip({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p
      className={cn(
        "rounded-[8px] border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-relaxed dark:border-zinc-700 dark:bg-zinc-950",
        adminMuted,
        className,
      )}
    >
      {children}
    </p>
  )
}

export function AdminKeyValue({
  rows,
}: {
  rows: { label: string; value: ReactNode }[]
}) {
  return (
    <dl className="space-y-2 text-sm">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-2 last:pb-0 dark:border-zinc-800"
        >
          <dt className={adminMutedSoft}>{row.label}</dt>
          <dd className="max-w-[65%] text-right font-medium text-zinc-950 dark:text-zinc-50">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function AdminChip({
  children,
  tone = "neutral",
}: {
  children: ReactNode
  tone?: "neutral" | "strong" | "warn"
}) {
  return (
    <span
      className={cn("inline-flex rounded-[6px] px-2 py-0.5 text-[11px] font-semibold",
        tone === "strong" &&
          "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950",
        tone === "warn" &&
          "border border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50",
        tone === "neutral" &&
          "border border-zinc-300 text-zinc-800 dark:border-zinc-600 dark:text-zinc-100",
      )}
    >
      {children}
    </span>
  )
}

export function AdminEmpty({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="w-full rounded-[10px] border border-dashed border-zinc-300 bg-white px-6 py-10 text-center dark:border-zinc-600 dark:bg-zinc-900">
      <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
      <p className={cn("mx-auto mt-2 max-w-lg text-sm leading-relaxed", adminMuted)}>
        {body}
      </p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function AdminMoneyTriad({
  listed,
  net,
  commission,
  takeRate,
  deposit,
}: {
  listed: number
  net: number
  commission: number
  takeRate: number
  deposit: number
}) {
  const fmt = (n: number) => `${Math.round(n).toLocaleString("en-TN")} TND`
  return (
    <div className="space-y-2">
      <div className={cn(adminCard, "grid gap-3 p-3 sm:grid-cols-3")}>
        <div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.1em]", adminMutedSoft)}>
            Customer listed
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{fmt(listed)}</p>
        </div>
        <div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.1em]", adminMutedSoft)}>
            Agency net
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{fmt(net)}</p>
        </div>
        <div>
          <p className={cn("text-[11px] font-semibold uppercase tracking-[0.1em]", adminMutedSoft)}>
            Wheelio fee ({takeRate}%)
          </p>
          <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{fmt(commission)}</p>
        </div>
      </div>
      <p className="rounded-[8px] border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
        Deposit (memo only, excluded from fee):{" "}
        <span className="font-mono font-semibold text-zinc-950 dark:text-zinc-50">
          {fmt(deposit)}
        </span>
      </p>
    </div>
  )
}

export function AdminAuditStrip({
  entries,
}: {
  entries: { at: string; actor: string; action: string; entity: string }[]
}) {
  if (entries.length === 0) return null
  return (
    <AdminPanel title="Recent admin actions">
      <ul className="space-y-2 text-sm">
        {entries.slice(0, 6).map((e, i) => (
          <li key={i} className="flex flex-wrap gap-2">
            <span className={cn("font-mono text-xs", adminMutedSoft)}>
              {new Date(e.at).toLocaleString()}
            </span>
            <span className="font-medium">{e.actor}</span>
            <span className={adminMuted}>{e.action}</span>
            <span className={adminMutedSoft}>{e.entity}</span>
          </li>
        ))}
      </ul>
    </AdminPanel>
  )
}
