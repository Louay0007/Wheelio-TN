import type { Metadata } from "next"
import { DriverForm } from "@/components/account/driver-form"

export const metadata: Metadata = {
  title: "Add driver | Wheelio TN",
}

export default function NewDriverPage() {
  return <DriverForm mode="create" />
}
