import type { Metadata } from "next"
import { DriversListClient } from "./drivers-list-client"

export const metadata: Metadata = {
  title: "Drivers | Wheelio TN",
  description: "Saved drivers for faster Wheelio TN checkout.",
}

export default function AccountDriversPage() {
  return <DriversListClient />
}
