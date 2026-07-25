"use client"

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import { authClient } from "@/lib/auth-client"
import {
  fetchMe,
  fetchProfile,
  patchProfile,
  type ApiProfile,
} from "@/lib/gateways/customer"
import type { DemoUser } from "@/lib/user"

function profileToDemoUser(
  profile: ApiProfile,
  user: { id: string; email: string; emailVerified: boolean; name: string },
): DemoUser {
  return {
    id: user.id,
    name: profile.legalName || user.name,
    preferredName: profile.preferredName ?? undefined,
    email: user.email,
    phone: profile.phone ?? undefined,
    dateOfBirth: profile.dateOfBirth ?? undefined,
    nationality: profile.nationality ?? undefined,
    residenceCountry: profile.residenceCountry ?? undefined,
    addressLine: profile.addressLine ?? undefined,
    city: profile.city ?? undefined,
    language: profile.preferredLocale,
    theme: profile.theme,
    createdAt: profile.updatedAt,
    emailVerified: user.emailVerified,
    marketingOptIn: profile.marketingOptIn,
    usualPickup: profile.usualPickup ?? undefined,
    defaultAgeBand: profile.defaultAgeBand as DemoUser["defaultAgeBand"],
    extrasInterests: profile.extrasInterests,
    drivers: [],
    notificationPrefs: {},
    claimedBookingIds: [],
    welcomeCompleted: profile.welcomeCompleted,
  }
}

export function useDemoSession() {
  const [user, setUser] = useState<DemoUser | null>(null)
  const [profileVersion, setProfileVersion] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const session = await authClient.getSession()
      if (!session.data?.user) {
        setUser(null)
        setProfileVersion(null)
        setReady(true)
        return
      }
      const me = await fetchMe()
      setUser(profileToDemoUser(me.profile, me.user))
      setProfileVersion(me.profile.version)
    } catch {
      setUser(null)
      setProfileVersion(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(
    (_partial?: Partial<DemoUser>) => {
      throw new Error("Use Better Auth sign-in methods")
    },
    [],
  )

  const logout = useCallback(async () => {
    await authClient.signOut()
    setUser(null)
    setProfileVersion(null)
  }, [])

  const updateUser: Dispatch<SetStateAction<DemoUser | null>> = useCallback(
    (value) => {
      setUser((prev) => {
        const next = typeof value === "function" ? value(prev) : value
        // Compatibility-only local state. Persist through account API mutations.
        return next
      })
    },
    [],
  )

  const saveProfileFromDemoShape = useCallback(
    async (next: DemoUser) => {
      if (profileVersion == null) {
        throw new Error("Profile is not loaded")
      }
      const updated = await patchProfile({
        legalName: next.name,
        preferredName: next.preferredName ?? null,
        phone: next.phone ?? null,
        dateOfBirth: next.dateOfBirth ?? null,
        nationality: next.nationality ?? null,
        residenceCountry: next.residenceCountry ?? null,
        addressLine: next.addressLine ?? null,
        city: next.city ?? null,
        preferredLocale: next.language,
        theme: next.theme,
        usualPickup: next.usualPickup ?? null,
        defaultAgeBand: next.defaultAgeBand ?? null,
        marketingOptIn: next.marketingOptIn,
        welcomeCompleted: next.welcomeCompleted,
        version: profileVersion,
      })
      const sessionUser = {
        id: next.id,
        email: next.email,
        emailVerified: next.emailVerified,
        name: next.name,
      }
      const mapped = profileToDemoUser(updated, sessionUser)
      setUser(mapped)
      setProfileVersion(updated.version)
      return mapped
    },
    [profileVersion],
  )

  return {
    user,
    ready,
    isSignedIn: Boolean(user),
    login,
    logout,
    updateUser,
    refresh,
    saveProfileFromDemoShape,
    profileVersion,
    apiAuth: true,
    reloadProfile: async () => {
      const profile = await fetchProfile()
      setProfileVersion(profile.version)
      return profile
    },
  }
}
