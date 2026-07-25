"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AccountShell } from "@/components/account/account-shell"
import { ApiErrorState, ApiLoadingState } from "@/components/api/api-state"
import { fieldInputClass } from "@/components/account/password-fields"
import { BookingInlineToast } from "@/components/bookings/booking-inline-toast"
import { Button } from "@/components/ui/button"
import { ApiClientError } from "@/lib/api/client"
import { useAccountMutations, useMe } from "@/lib/query/account"

export function ProfileClient() {
  const me = useMe()
  const mutations = useAccountMutations()
  const [toast, setToast] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(t)
  }, [toast])

  if (me.isPending) return <ApiLoadingState label="Loading profile…" />
  if (
    me.isError &&
    me.error instanceof ApiClientError &&
    me.error.status === 401
  ) {
    return (
      <AccountShell title="Profile" description="Sign in to edit your profile.">
        <p className="text-sm text-black/55 dark:text-white/55">
          <Link href="/login?next=%2Faccount%2Fprofile" className="font-medium underline underline-offset-4">
            Log in
          </Link>{" "}
          to manage contact details, or continue as guest for checkout.
        </p>
      </AccountShell>
    )
  }
  if (me.isError) {
    return <ApiErrorState error={me.error} retry={() => me.refetch()} />
  }

  const user = me.data.user
  const profile = me.data.profile

  function markDirty() {
    setDirty(true)
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const next = {
      legalName: String(fd.get("name") ?? profile.legalName),
      preferredName: String(fd.get("preferredName") ?? "") || undefined,
      phone: String(fd.get("phone") ?? "") || undefined,
      preferredLocale: String(
        fd.get("language") ?? profile.preferredLocale,
      ) as "en" | "fr",
      addressLine: String(fd.get("addressLine") ?? "") || undefined,
      city: String(fd.get("city") ?? "") || undefined,
      nationality: String(fd.get("nationality") ?? "") || undefined,
      residenceCountry: String(fd.get("residenceCountry") ?? "") || undefined,
      version: profile.version,
    }
    try {
      await mutations.updateProfile.mutateAsync(next)
      setToast("Profile saved")
      setDirty(false)
    } catch {
      setToast("Could not save profile")
    }
  }

  return (
    <>
      <AccountShell
        title="Profile"
        description="Identity and contact details for checkout and agency messages."
      >
        <form className="space-y-10" onSubmit={handleSave} onChange={markDirty}>
          <fieldset className="space-y-4">
            <legend className="text-lg font-semibold tracking-[-0.02em]">Identity</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Full name</span>
                <input
                  name="name"
                  defaultValue={profile.legalName}
                  className={fieldInputClass}
                  required
                />
              </label>
              <label className="block space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Preferred name</span>
                <input
                  name="preferredName"
                  defaultValue={profile.preferredName ?? ""}
                  placeholder="How we greet you"
                  className={fieldInputClass}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4 pt-8 dark:border-white/10">
            <legend className="text-lg font-semibold tracking-[-0.02em]">Contact</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Email</span>
                <input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  className={fieldInputClass}
                  readOnly
                  required
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Phone</span>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={profile.phone ?? ""}
                  className={fieldInputClass}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4 pt-8 dark:border-white/10">
            <legend className="text-lg font-semibold tracking-[-0.02em]">Language</legend>
            <label className="block max-w-md space-y-1.5 text-sm">
              <span className="font-medium">App language</span>
              <select
                name="language"
                defaultValue={profile.preferredLocale}
                className={fieldInputClass}
              >
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </label>
          </fieldset>

          <fieldset className="space-y-4 pt-8 dark:border-white/10">
            <legend className="text-lg font-semibold tracking-[-0.02em]">Address</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm sm:col-span-2">
                <span className="font-medium">Street address</span>
                <input
                  name="addressLine"
                  defaultValue={profile.addressLine ?? ""}
                  className={fieldInputClass}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">City</span>
                <input name="city" defaultValue={profile.city ?? ""} className={fieldInputClass} />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Country of residence</span>
                <input
                  name="residenceCountry"
                  defaultValue={profile.residenceCountry ?? ""}
                  placeholder="TN"
                  className={fieldInputClass}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Nationality</span>
                <input
                  name="nationality"
                  defaultValue={profile.nationality ?? ""}
                  placeholder="TN"
                  className={fieldInputClass}
                />
              </label>
            </div>
          </fieldset>

          <div className="flex flex-wrap items-center gap-4 pt-8 dark:border-white/10">
            <Button
              type="submit"
              disabled={mutations.updateProfile.isPending}
              className="rounded-[8px] bg-black dark:bg-white dark:text-black"
            >
              Save profile
            </Button>
            <p className="text-sm text-black/50 dark:text-white/50">
              <Link href="/account/drivers" className="underline underline-offset-4">
                Saved drivers
              </Link>
              {" · "}
              <Link
                href="/account/notifications"
                className="underline underline-offset-4"
              >
                Notification settings
              </Link>
            </p>
          </div>
        </form>

        {dirty ? (
          <div className="sticky bottom-4 z-30 mt-6 flex justify-center">
            <div className="rounded-[8px] border border-black/15 bg-white px-4 py-2 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-950">
              Unsaved changes — scroll to save
            </div>
          </div>
        ) : null}
      </AccountShell>
      <BookingInlineToast message={toast} />
    </>
  )
}
