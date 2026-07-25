import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { magicLink, twoFactor } from "better-auth/plugins"
import * as schema from "@/db/schema"
import { getDb } from "@/server/core/database/client"
import { getEnv } from "@/server/core/env"
import { sendEmail } from "@/server/core/email/transport"
import { getLogger } from "@/server/core/observability/logger"

let authInstance: ReturnType<typeof createAuth> | null = null

function createAuth() {
  const env = getEnv()
  const db = getDb()
  const log = getLogger()

  return betterAuth({
    appName: "Wheelio TN",
    baseURL: env.BETTER_AUTH_URL ?? env.APP_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        twoFactor: schema.twoFactor,
      },
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your Wheelio TN password",
          text: `Reset your password: ${url}`,
          html: `<p>Reset your password:</p><p><a href="${url}">${url}</a></p>`,
        })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Verify your Wheelio TN email",
          text: `Verify your email: ${url}`,
          html: `<p>Verify your email:</p><p><a href="${url}">${url}</a></p>`,
        })
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendEmail({
            to: email,
            subject: "Your Wheelio TN sign-in link",
            text: `Sign in: ${url}`,
            html: `<p>Sign in:</p><p><a href="${url}">${url}</a></p>`,
          })
        },
      }),
      twoFactor({
        issuer: "Wheelio TN",
      }),
      nextCookies(),
    ],
    trustedOrigins: Array.from(
      new Set([
        env.APP_URL,
        ...(env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : []),
      ]),
    ),
    onAPIError: {
      onError(error) {
        log.warn({ err: error }, "Better Auth API error")
      },
    },
  })
}

export function getAuth() {
  if (!authInstance) authInstance = createAuth()
  return authInstance
}

export type Auth = ReturnType<typeof getAuth>
