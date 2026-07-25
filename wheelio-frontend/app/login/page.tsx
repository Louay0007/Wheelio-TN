import type { Metadata } from "next"
import { AuthForm } from "@/components/auth-form"

export const metadata: Metadata = {
  title: "Log in | Wheelio TN",
  description: "Log in to Wheelio TN. Guest checkout available without an account.",
}

type Props = {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams
  return <AuthForm mode="login" next={next} />
}
