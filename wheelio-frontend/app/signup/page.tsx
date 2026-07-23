import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = {
  title: "Sign up | Wheelio TN",
  description: "Create a Wheelio TN account. Demo UI — authentication is not live yet. Guest checkout available.",
}

export default function SignupPage() {
  return <AuthForm mode="signup" />
}
