"use client"

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import {
  ADMIN_SESSION_KEY,
  ADMIN_STORAGE_KEY,
  createDemoAdminWorkspace,
  roleNeedsMfa,
  type AdminRole,
  type AdminStaffMember,
  type AdminWorkspace,
} from "@/lib/admin"
import { assertNotDomainStorage } from "@/lib/gateways/cutover"
import { useApiAdminSlice } from "@/lib/gateways/flags"

export type AdminSession = {
  staffId: string
  email: string
  name: string
  role: AdminRole
  mfaOk: boolean
}

function mergePartnerJoin(ws: AdminWorkspace): AdminWorkspace {
  try {
    const raw = localStorage.getItem("wheelio-partner-application")
    if (!raw) return ws
    const draft = JSON.parse(raw) as {
      legalName?: string
      tradeName?: string
      taxId?: string
      email?: string
      phone?: string
      city?: string
      fleetSize?: string | number
      submittedAt?: string
    }
    const email = (draft.email || "").toLowerCase()
    if (!email) return ws
    if (ws.applications.some((a) => a.email.toLowerCase() === email)) return ws
    const id = `app-join-${email.replace(/[^a-z0-9]/g, "").slice(0, 12)}`
    const fleet =
      typeof draft.fleetSize === "number"
        ? draft.fleetSize
        : Number(draft.fleetSize) || 5
    return {
      ...ws,
      applications: [
        {
          id,
          status: "new",
          tradeName: draft.tradeName || "Partner applicant",
          legalName: draft.legalName || draft.tradeName || "Partner applicant",
          taxId: draft.taxId || "pending",
          city: draft.city || "Tunis",
          email: draft.email || email,
          phone: draft.phone || "+216",
          fleetSizeEstimate: fleet,
          branchesPlanned: 1,
          submittedAt: draft.submittedAt || new Date().toISOString(),
          docs: [
            { label: "Company registration", state: "uploaded" },
            { label: "Tax ID", state: "uploaded" },
            { label: "Insurance", state: "missing" },
            { label: "Fleet authorization", state: "missing" },
            { label: "Signatory ID", state: "missing" },
          ],
        },
        ...ws.applications,
      ],
    }
  } catch {
    return ws
  }
}

function hydrateWorkspace(ws: AdminWorkspace): AdminWorkspace {
  const seed = createDemoAdminWorkspace()
  return {
    ...ws,
    dualControl: ws.dualControl ?? [],
    cmsArticles: ws.cmsArticles ?? seed.cmsArticles,
    invoices: ws.invoices ?? seed.invoices,
    featureFlags: ws.featureFlags ?? seed.featureFlags,
  }
}

function readWorkspace(): AdminWorkspace {
  if (typeof window === "undefined") return createDemoAdminWorkspace()
  if (useApiAdminSlice()) return createDemoAdminWorkspace()
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY)
    if (raw) {
      const parsed = hydrateWorkspace(JSON.parse(raw) as AdminWorkspace)
      const merged = mergePartnerJoin(parsed)
      if (
        merged.applications.length !== parsed.applications.length ||
        !("cmsArticles" in (JSON.parse(raw) as object))
      ) {
        assertNotDomainStorage(ADMIN_STORAGE_KEY)
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(merged))
      }
      return merged
    }
  } catch {
    /* ignore */
  }
  const seed = mergePartnerJoin(createDemoAdminWorkspace())
  assertNotDomainStorage(ADMIN_STORAGE_KEY)
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(seed))
  return seed
}

function writeWorkspace(ws: AdminWorkspace) {
  if (useApiAdminSlice()) {
    window.dispatchEvent(new Event("wheelio-admin-workspace"))
    return
  }
  assertNotDomainStorage(ADMIN_STORAGE_KEY)
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(ws))
  window.dispatchEvent(new Event("wheelio-admin-workspace"))
}

function readSession(): AdminSession | null {
  if (typeof window === "undefined") return null
  if (useApiAdminSlice()) return null
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AdminSession
  } catch {
    return null
  }
}

function writeSession(session: AdminSession | null) {
  if (useApiAdminSlice()) {
    window.dispatchEvent(new Event("wheelio-admin-session"))
    return
  }
  assertNotDomainStorage(ADMIN_SESSION_KEY)
  if (session) localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(ADMIN_SESSION_KEY)
  window.dispatchEvent(new Event("wheelio-admin-session"))
}

export function adminLogin(partial?: {
  email?: string
  role?: AdminRole
  mfaOk?: boolean
}): AdminSession {
  const ws = readWorkspace()
  const email = partial?.email?.trim().toLowerCase()
  const byEmail = email
    ? ws.staff.find((s) => s.email.toLowerCase() === email && s.status === "active")
    : undefined
  const byRole = partial?.role
    ? ws.staff.find((s) => s.role === partial.role && s.status === "active")
    : undefined
  const staff = byEmail ?? byRole ?? ws.staff.find((s) => s.role === "super")!
  const session: AdminSession = {
    staffId: staff.id,
    email: partial?.email?.trim() || staff.email,
    name: staff.name,
    role: staff.role,
    mfaOk: partial?.mfaOk ?? !roleNeedsMfa(staff.role),
  }
  writeSession(session)
  return session
}

export function adminConfirmMfa(): AdminSession | null {
  const current = readSession()
  if (!current) return null
  const next = { ...current, mfaOk: true }
  writeSession(next)
  return next
}

export function adminLogout() {
  writeSession(null)
}

export function useAdminSession() {
  const [session, setSession] = useState<AdminSession | null>(null)
  const [workspace, setWorkspace] = useState<AdminWorkspace | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setSession(readSession())
    setWorkspace(readWorkspace())
    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener("wheelio-admin-session", onChange)
    window.addEventListener("wheelio-admin-workspace", onChange)
    window.addEventListener("storage", onChange)
    return () => {
      window.removeEventListener("wheelio-admin-session", onChange)
      window.removeEventListener("wheelio-admin-workspace", onChange)
      window.removeEventListener("storage", onChange)
    }
  }, [refresh])

  const login = useCallback(
    (partial?: { email?: string; role?: AdminRole; mfaOk?: boolean }) => {
      const next = adminLogin(partial)
      setSession(next)
      setWorkspace(readWorkspace())
      return next
    },
    [],
  )

  const confirmMfa = useCallback(() => {
    const next = adminConfirmMfa()
    setSession(next)
    return next
  }, [])

  const logout = useCallback(() => {
    adminLogout()
    setSession(null)
  }, [])

  const updateWorkspace: Dispatch<SetStateAction<AdminWorkspace | null>> =
    useCallback((value) => {
      setWorkspace((prev) => {
        const base = prev ?? readWorkspace()
        const next = typeof value === "function" ? value(base) : value
        if (next) writeWorkspace(next)
        return next
      })
    }, [])

  const staff: AdminStaffMember | null =
    workspace && session
      ? workspace.staff.find((s) => s.id === session.staffId) ?? null
      : null

  return {
    session,
    workspace,
    staff,
    ready,
    isSignedIn: Boolean(session),
    needsMfa: Boolean(session && !session.mfaOk && roleNeedsMfa(session.role)),
    login,
    confirmMfa,
    logout,
    updateWorkspace,
    refresh,
  }
}
