import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = {
  title: "Log in | Wheelio TN",
  description: "Log in to Wheelio TN. Demo UI — authentication is not live yet. Guest checkout available.",
}

export default function LoginPage() {
  return <AuthForm mode="login" />
}
