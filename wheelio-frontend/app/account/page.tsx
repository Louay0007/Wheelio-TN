import type { Metadata } from "next"
import { AccountHubClient } from "./account-hub-client"

export const metadata: Metadata = {
  title: "Account | Wheelio TN",
  description:
    "Account hub for trips, profile, drivers, and settings on Wheelio TN.",
}

export default function AccountPage() {
  return <AccountHubClient />
}
