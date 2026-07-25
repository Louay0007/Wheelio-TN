"use client"

import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import {
  AGENCY_SESSION_KEY,
  AGENCY_STORAGE_KEY,
  createDemoAgencyWorkspace,
  type AgencyRole,
  type AgencyStaff,
  type AgencyWorkspace,
} from "@/lib/agency"
import { assertNotDomainStorage } from "@/lib/gateways/cutover"
import { useApiAgencySlice } from "@/lib/gateways/flags"

export type AgencySession = {
  staffId: string
  email: string
  name: string
  role: AgencyRole
  agencyId: string
}

const AGENCY_BRANCH_KEY = "wheelio-agency-branch"

function readBranchId(): string | "all" {
  if (typeof window === "undefined") return "all"
  try {
    return (localStorage.getItem(AGENCY_BRANCH_KEY) as string | null) ?? "all"
  } catch {
    return "all"
  }
}

function writeBranchId(id: string | "all") {
  localStorage.setItem(AGENCY_BRANCH_KEY, id)
  window.dispatchEvent(new Event("wheelio-agency-branch"))
}

function readWorkspace(): AgencyWorkspace {
  if (typeof window === "undefined") return createDemoAgencyWorkspace()
  // When agency API slice is on, never hydrate domain truth from localStorage.
  // Unwired pages still get an empty-shaped demo shell for layout only.
  if (useApiAgencySlice()) return createDemoAgencyWorkspace()
  try {
    const raw = localStorage.getItem(AGENCY_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AgencyWorkspace
  } catch {
    /* ignore */
  }
  const seed = createDemoAgencyWorkspace()
  assertNotDomainStorage(AGENCY_STORAGE_KEY)
  localStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(seed))
  return seed
}

function writeWorkspace(ws: AgencyWorkspace) {
  if (useApiAgencySlice()) {
    window.dispatchEvent(new Event("wheelio-agency-workspace"))
    return
  }
  assertNotDomainStorage(AGENCY_STORAGE_KEY)
  localStorage.setItem(AGENCY_STORAGE_KEY, JSON.stringify(ws))
  window.dispatchEvent(new Event("wheelio-agency-workspace"))
}

function readSession(): AgencySession | null {
  if (typeof window === "undefined") return null
  if (useApiAgencySlice()) return null
  try {
    const raw = localStorage.getItem(AGENCY_SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AgencySession
  } catch {
    return null
  }
}

function writeSession(session: AgencySession | null) {
  if (useApiAgencySlice()) {
    window.dispatchEvent(new Event("wheelio-agency-session"))
    return
  }
  assertNotDomainStorage(AGENCY_SESSION_KEY)
  if (session) localStorage.setItem(AGENCY_SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(AGENCY_SESSION_KEY)
  window.dispatchEvent(new Event("wheelio-agency-session"))
}

export function agencyLogin(partial?: {
  email?: string
  role?: AgencyRole
}): AgencySession {
  const ws = readWorkspace()
  const role = partial?.role ?? "owner"
  const staff =
    ws.staff.find((s) => s.role === role && s.status === "active") ??
    ws.staff.find((s) => s.status === "active") ??
    ws.staff[0]
  const session: AgencySession = {
    staffId: staff.id,
    email: partial?.email?.trim() || staff.email,
    name: staff.name,
    role: staff.role,
    agencyId: ws.id,
  }
  writeSession(session)
  return session
}

export function agencyLogout() {
  writeSession(null)
}

export function useAgencySession() {
  const [session, setSession] = useState<AgencySession | null>(null)
  const [workspace, setWorkspace] = useState<AgencyWorkspace | null>(null)
  const [branchId, setBranchId] = useState<string | "all">("all")
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setSession(readSession())
    setWorkspace(readWorkspace())
    setBranchId(readBranchId())
    setReady(true)
  }, [])

  useEffect(() => {
    refresh()
    const onChange = () => refresh()
    window.addEventListener("wheelio-agency-session", onChange)
    window.addEventListener("wheelio-agency-workspace", onChange)
    window.addEventListener("wheelio-agency-branch", onChange)
    window.addEventListener("storage", onChange)
    return () => {
      window.removeEventListener("wheelio-agency-session", onChange)
      window.removeEventListener("wheelio-agency-workspace", onChange)
      window.removeEventListener("wheelio-agency-branch", onChange)
      window.removeEventListener("storage", onChange)
    }
  }, [refresh])

  const login = useCallback((partial?: { email?: string; role?: AgencyRole }) => {
    const next = agencyLogin(partial)
    setSession(next)
    setWorkspace(readWorkspace())
    return next
  }, [])

  const logout = useCallback(() => {
    agencyLogout()
    setSession(null)
  }, [])

  const updateWorkspace: Dispatch<SetStateAction<AgencyWorkspace | null>> =
    useCallback((value) => {
      setWorkspace((prev) => {
        const base = prev ?? readWorkspace()
        const next = typeof value === "function" ? value(base) : value
        if (next) writeWorkspace(next)
        return next
      })
    }, [])

  const staff: AgencyStaff | null =
    workspace && session
      ? workspace.staff.find((s) => s.id === session.staffId) ?? null
      : null

  const setSelectedBranch = useCallback((id: string | "all") => {
    writeBranchId(id)
    setBranchId(id)
  }, [])

  return {
    session,
    workspace,
    staff,
    branchId,
    setSelectedBranch,
    ready,
    isSignedIn: Boolean(session),
    login,
    logout,
    updateWorkspace,
    refresh,
  }
}
