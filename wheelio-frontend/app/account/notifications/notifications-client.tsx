"use client"

import Link from "next/link"
import { Bell, Check, Mail } from "lucide-react"
import { AccountShell } from "@/components/account/account-shell"
import { ApiEmptyState, ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { ApiClientError } from "@/lib/api/client"
import { useMe, useNotificationReadMutation, useNotifications } from "@/lib/query/account"

export function NotificationsClient() {
  const me = useMe()
  const notifications = useNotifications()
  const readMutation = useNotificationReadMutation()
  const locale = typeof document !== "undefined" && document.documentElement.lang === "fr" ? "fr" : "en"
  const t = locale === "fr" ? { title: "Notifications", description: "Actualités de votre compte et de vos réservations.", login: "Se connecter", emptyTitle: "Aucune notification", emptyBody: "Les nouvelles informations apparaîtront ici.", settings: "Gérer les préférences", load: "Afficher plus", read: "Marquer comme lue", unread: "Marquer comme non lue", loading: "Chargement des notifications…" } : { title: "Notifications", description: "Account and booking updates.", login: "Log in", emptyTitle: "No notifications", emptyBody: "New account and booking updates will appear here.", settings: "Manage notification settings", load: "Load more", read: "Mark as read", unread: "Mark as unread", loading: "Loading notifications…" }

  if (me.isPending || notifications.isPending) return <ApiLoadingState label={t.loading} />
  if (me.isError && me.error instanceof ApiClientError && me.error.status === 401) return <AccountShell title={t.title} description={t.description}><Link href="/login?next=%2Faccount%2Fnotifications" className="text-sm font-medium underline underline-offset-4">{t.login}</Link></AccountShell>
  if (me.isError) return <ApiErrorState error={me.error} retry={() => me.refetch()} />
  if (notifications.isError) return <ApiErrorState error={notifications.error} retry={() => notifications.refetch()} />

  const items = notifications.data.pages.flatMap((page) => page.data)
  const unreadCount = notifications.data.pages[0]?.page.unreadCount ?? 0
  return <AccountShell title={t.title} description={`${t.description} ${unreadCount ? `(${unreadCount})` : ""}`}>
    {items.length === 0 ? <ApiEmptyState title={t.emptyTitle} description={t.emptyBody} /> : <ul className="divide-y divide-black/10 overflow-hidden rounded-[10px] border border-black/10 dark:divide-white/10 dark:border-white/10">
      {items.map((item) => <li key={item.id} className={`p-4 ${item.readAt ? "opacity-65" : "bg-black/[0.025] dark:bg-white/[0.035]"}`}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 rounded-full border border-black/10 p-2 dark:border-white/10">{item.readAt ? <Mail className="size-4" /> : <Bell className="size-4" />}</span>
          <div className="min-w-0 flex-1">
            {item.href ? <Link href={item.href} className="font-semibold hover:underline">{item.title}</Link> : <p className="font-semibold">{item.title}</p>}
            {item.body ? <p className="mt-1 text-sm text-black/60 dark:text-white/60">{item.body}</p> : null}
            <time className="mt-2 block text-xs text-black/45 dark:text-white/45" dateTime={item.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}</time>
          </div>
          <button type="button" disabled={readMutation.isPending} onClick={() => readMutation.mutate({ id: item.id, read: !item.readAt })} className="inline-flex items-center gap-1 rounded-[7px] border border-black/10 px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-white/10">{item.readAt ? <Mail className="size-3.5" /> : <Check className="size-3.5" />}{item.readAt ? t.unread : t.read}</button>
        </div>
      </li>)}
    </ul>}
    {notifications.hasNextPage ? <button type="button" disabled={notifications.isFetchingNextPage} onClick={() => notifications.fetchNextPage()} className="mt-5 rounded-[7px] border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/15">{t.load}</button> : null}
    <Link href="/account/notifications/settings" className="mt-6 block text-sm font-medium underline underline-offset-4">{t.settings}</Link>
  </AccountShell>
}
