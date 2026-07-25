import { createAuthClient } from "better-auth/react"
import { magicLinkClient, twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : undefined,
  plugins: [
    magicLinkClient(),
    twoFactorClient({ twoFactorPage: "/auth/two-factor" }),
  ],
})
