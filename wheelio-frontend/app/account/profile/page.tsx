import type { Metadata } from "next"
import { ProfileClient } from "./profile-client"

export const metadata: Metadata = {
  title: "Profile | Wheelio TN",
  description: "Personal details and contact information for your Wheelio TN account.",
}

export default function AccountProfilePage() {
  return <ProfileClient />
}
