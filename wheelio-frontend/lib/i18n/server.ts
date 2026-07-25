import "server-only"

import { cookies } from "next/headers"
import { isAppLocale, type AppLocale } from "@/lib/i18n/types"

export async function getRequestLocale(
  requested?: string,
): Promise<AppLocale> {
  if (isAppLocale(requested)) return requested
  const cookieStore = await cookies()
  const stored = cookieStore.get("wheelio-locale")?.value
  return isAppLocale(stored) ? stored : "en"
}
