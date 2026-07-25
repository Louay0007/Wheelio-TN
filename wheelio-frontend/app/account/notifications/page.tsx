import type { Metadata } from "next"
import { NotificationsClient } from "./notifications-client"

export const metadata: Metadata = {
  title: "Notifications | Wheelio TN",
  description: "Account and booking notifications for Wheelio TN.",
}

export default function AccountNotificationsPage() {
  return <NotificationsClient />
}
