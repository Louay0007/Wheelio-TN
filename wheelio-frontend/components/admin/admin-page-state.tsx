"use client"

import {
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  adminMuted,
} from "@/components/admin/admin-kit"
import { useLocale } from "@/lib/i18n/locale"
import { cn } from "@/lib/utils"

export function AdminLoadingState({ title = "…" }: { title?: string }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label={title}>
      <div className="h-10 w-48 animate-pulse rounded-[8px] bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
    </div>
  )
}

export function AdminForbiddenState({
  backHref = "/admin",
}: {
  backHref?: string
}) {
  const { t } = useLocale()
  return (
    <AdminPanel title={t("admin.forbidden")} hint={t("admin.forbiddenHint")}>
      <AdminLinkButton href={backHref} variant="secondary">
        {t("admin.home")}
      </AdminLinkButton>
    </AdminPanel>
  )
}

export function AdminErrorState({
  onRetry,
  message,
}: {
  onRetry?: () => void
  message?: string
}) {
  const { t } = useLocale()
  return (
    <AdminPanel title={t("admin.error")}>
      <p className={cn("text-sm", adminMuted)}>
        {message ?? "Demo workspace failed to load in this browser."}
      </p>
      {onRetry ? (
        <div className="mt-3">
          <AdminPrimaryButton type="button" onClick={onRetry}>
            {t("admin.retry")}
          </AdminPrimaryButton>
        </div>
      ) : null}
    </AdminPanel>
  )
}
