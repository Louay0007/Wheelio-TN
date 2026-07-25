"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { PageHero, PageShell } from "@/components/page-shell"
import { AuthEscapeLinks } from "@/components/account/auth-escape-links"
import {
  fieldInputClass,
  PasswordFields,
} from "@/components/account/password-fields"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { PARTNER_PRICING, recommendedCommissionExample } from "@/lib/partner-pricing"
import { authClient } from "@/lib/auth-client"
import type { DemoLanguage } from "@/lib/user"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query/keys"

const tabListClass =
  "inline-flex h-10 w-full rounded-[8px] border border-black/10 bg-black/[0.02] p-1 dark:border-white/10 dark:bg-white/[0.03]"

const tabTriggerClass =
  "flex-1 rounded-[7px] px-3 py-1.5 text-sm font-medium data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"

const submitClass =
  "flex h-11 w-full items-center justify-center rounded-[7px] bg-black text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"

type AuthFormProps = {
  mode: "login" | "signup"
  next?: string
}

export function safeAuthReturnUrl(next?: string) {
  if (!next) return "/account"
  try {
    const decoded = decodeURIComponent(next)
    return decoded.startsWith("/") && !decoded.startsWith("//")
      ? decoded
      : "/account"
  } catch {
    return "/account"
  }
}

export function AuthForm({ mode, next }: AuthFormProps) {
  const isLogin = mode === "login"
  const router = useRouter()
  const queryClient = useQueryClient()

  const [loginTab, setLoginTab] = useState<"password" | "magic">("password")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [magicEmail, setMagicEmail] = useState<string | null>(null)
  const [signupPassword, setSignupPassword] = useState("")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  async function handleLoginPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") ?? "").trim()
    const password = String(fd.get("password") ?? "")
    if (!email || !password) {
      setError("Enter your email and password.")
      return
    }
    setLoading(true)
    try {
      const result = await authClient.signIn.email({ email, password })
      if (result.error) {
        setError(result.error.message || "Unable to sign in.")
        return
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.account.all })
      router.push(safeAuthReturnUrl(next))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.")
    } finally {
      setLoading(false)
    }
  }

  async function handleMagicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("magicEmail") ?? "").trim()
    if (!email) {
      setError("Enter your email address.")
      return
    }
    setLoading(true)
    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: safeAuthReturnUrl(next),
      })
      if (result.error) {
        setError(result.error.message || "Unable to send magic link.")
        return
      }
      setMagicEmail(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send magic link.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const name = String(fd.get("name") ?? "").trim()
    const email = String(fd.get("email") ?? "").trim()
    const phone = String(fd.get("phone") ?? "").trim()
    const password = String(fd.get("password") ?? "")
    const confirm = String(fd.get("passwordConfirm") ?? "")
    const language = String(fd.get("language") ?? "en") as DemoLanguage
    const terms = termsAccepted
    const privacy = privacyAccepted
    const marketing = marketingOptIn

    if (!name || !email || !password) {
      setError("Fill in name, email, and password.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    if (!terms || !privacy) {
      setError("Accept the terms and privacy policy to continue.")
      return
    }

    setLoading(true)
    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      })
      if (result.error) {
        setError(result.error.message || "Unable to create account.")
        return
      }
      // Phone, locale, and marketing consent are saved during account welcome.
      void phone
      void language
      void marketing
      router.push(`/auth/verify?email=${encodeURIComponent(email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Account"
        title={isLogin ? "Log in" : "Create an account"}
        description={
          isLogin
            ? "Optional sign-in for faster rebooking and trip history. Guest checkout always works."
            : "Save drivers and rebook faster. You can still complete checkout without an account."
        }
      />

      <section className="mx-auto max-w-md px-4 py-10 sm:px-6 sm:py-14">
        {isLogin ? (
          <Tabs
            value={loginTab}
            onValueChange={(v) => {
              setLoginTab(v as "password" | "magic")
              setError(null)
              setMagicEmail(null)
            }}
          >
            <TabsList className={tabListClass}>
              <TabsTrigger value="password" className={tabTriggerClass}>
                Password
              </TabsTrigger>
              <TabsTrigger value="magic" className={tabTriggerClass}>
                Magic link
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-6">
              <form className="space-y-4" onSubmit={handleLoginPassword}>
                {error ? (
                  <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium">Email</span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className={fieldInputClass}
                  />
                </label>
                <PasswordFields autoComplete="current-password" showStrength={false} />
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium underline underline-offset-4"
                  >
                    Forgot password
                  </Link>
                </div>
                <button type="submit" disabled={loading} className={submitClass}>
                  {loading ? "Signing in…" : "Log in"}
                </button>
              </form>
            </TabsContent>

            <TabsContent value="magic" className="mt-6">
              {magicEmail ? (
                <div className="space-y-4 rounded-[8px] border border-black/10 p-5 dark:border-white/10">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 shrink-0 text-black dark:text-white" />
                    <div>
                      <p className="font-semibold tracking-[-0.02em]">Check your inbox</p>
                      <p className="mt-1 text-sm text-black/55 dark:text-white/55">
                        We sent a sign-in link to{" "}
                        <span className="font-medium text-black dark:text-white">{magicEmail}</span>
                        . Check Mailpit locally if email delivery is configured.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/auth/verify?email=${encodeURIComponent(magicEmail)}`}
                    className="inline-flex text-sm font-medium underline underline-offset-4"
                  >
                    Open verification page
                  </Link>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleMagicSubmit}>
                  {error ? (
                    <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  ) : null}
                  <label className="block space-y-1.5 text-sm">
                    <span className="font-medium">Email</span>
                    <input
                      type="email"
                      name="magicEmail"
                      autoComplete="email"
                      required
                      placeholder="you@example.com"
                      className={fieldInputClass}
                    />
                  </label>
                  <button type="submit" disabled={loading} className={submitClass}>
                    {loading ? "Sending…" : "Email me a link"}
                  </button>
                  <p className="text-xs text-black/45 dark:text-white/45">
                    Or use the dedicated{" "}
                    <Link href="/auth/magic" className="underline underline-offset-2">
                      magic link page
                    </Link>
                    .
                  </p>
                </form>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <form className="space-y-5" onSubmit={handleSignup}>
            {error ? (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            ) : null}

            <ul className="space-y-2 rounded-[8px] border border-black/10 px-4 py-3 text-sm text-black/60 dark:border-white/10 dark:text-white/60">
              <li>· Trip history in one place</li>
              <li>· Saved drivers at checkout</li>
              <li>· Faster rebooking</li>
            </ul>

            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Full name</span>
              <input
                type="text"
                name="name"
                autoComplete="name"
                required
                placeholder="Your name"
                className={fieldInputClass}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="you@example.com"
                className={fieldInputClass}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">
                Phone <span className="font-normal text-black/45 dark:text-white/45">(optional)</span>
              </span>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="+216 …"
                className={fieldInputClass}
              />
            </label>
            <PasswordFields
              showConfirm
              showStrength
              passwordValue={signupPassword}
              onPasswordChange={setSignupPassword}
            />
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Language</span>
              <select
                name="language"
                defaultValue="en"
                className={fieldInputClass}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </label>

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className="underline underline-offset-2">
                    terms
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <Checkbox
                  checked={privacyAccepted}
                  onCheckedChange={(v) => setPrivacyAccepted(v === true)}
                  className="mt-0.5"
                />
                <span>
                  I agree to the{" "}
                  <Link href="/privacy" className="underline underline-offset-2">
                    privacy policy
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-black/60 dark:text-white/60">
                <Checkbox
                  checked={marketingOptIn}
                  onCheckedChange={(v) => setMarketingOptIn(v === true)}
                  className="mt-0.5"
                />
                <span>Send deals and seasonal guides (optional)</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className={submitClass}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        )}

        <AuthEscapeLinks mode={mode} className="mt-8" />

        <div className="mt-8 rounded-[10px] border border-black/15 p-4 dark:border-white/15">
          <p className="text-sm font-semibold tracking-[-0.02em]">
            Agency partner?
          </p>
          <p className="mt-1 text-sm leading-relaxed text-black/55 dark:text-white/55">
            List your fleet on Wheelio. Standard marketplace commission is{" "}
            {PARTNER_PRICING.recommendedPercent}% of the customer trip total
            (deposit excluded). Example: agency net{" "}
            {recommendedCommissionExample().agencyNetTnd} TND → listed{" "}
            {recommendedCommissionExample().listedPriceTnd} TND.
          </p>
          <Link
            href="/partners/join"
            className="mt-3 inline-flex h-11 items-center justify-center rounded-[8px] border border-black/20 px-4 text-sm font-semibold transition hover:border-black/40 dark:border-white/20 dark:hover:border-white/40"
          >
            Join as a partner agency
          </Link>
        </div>

        {isLogin ? (
          <p className="mt-4 text-center text-sm text-black/50 dark:text-white/50">
            No account?{" "}
            <Link href="/signup" className="font-medium underline underline-offset-4">
              Sign up
            </Link>
          </p>
        ) : null}
      </section>
    </PageShell>
  )
}
