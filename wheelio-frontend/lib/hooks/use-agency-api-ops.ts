"use client"

import { useEffect, useState } from "react"
import {
  fetchAgencyBranches,
  fetchAgencyDashboard,
  fetchAgencyFleet,
  fetchAgencyOnboarding,
  fetchAgencyRates,
  type ApiAgencyBranch,
  type ApiAgencyDashboard,
  type ApiAgencyFleetItem,
} from "@/lib/gateways/agency"
import { useApiAgencySlice } from "@/lib/gateways/flags"

export function useAgencyApiDashboard() {
  const enabled = useApiAgencySlice()
  const [data, setData] = useState<ApiAgencyDashboard | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyDashboard()
      .then((row) => {
        if (!cancelled) {
          setData(row)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, data, loading, error }
}

export function useAgencyApiFleet() {
  const enabled = useApiAgencySlice()
  const [items, setItems] = useState<ApiAgencyFleetItem[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyFleet()
      .then((rows) => {
        if (!cancelled) {
          setItems(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, items, loading, error }
}

export function useAgencyApiRates() {
  const enabled = useApiAgencySlice()
  const [items, setItems] = useState<
    Array<{
      id: string
      name: string
      categoryCode: string
      netDailyMillimes: string
      active: boolean
      version: number
    }> | null
  >(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyRates()
      .then((rows) => {
        if (!cancelled) {
          setItems(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, items, loading, error }
}

export function useAgencyApiBranches() {
  const enabled = useApiAgencySlice()
  const [items, setItems] = useState<ApiAgencyBranch[] | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyBranches()
      .then((rows) => {
        if (!cancelled) {
          setItems(rows)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setItems([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, items, loading, error }
}

export function useAgencyApiOnboarding() {
  const enabled = useApiAgencySlice()
  const [data, setData] = useState<{
    agencyId: string
    verificationStatus: string
    steps: Array<{
      step: string
      completed: boolean
      version: number
      payload: Record<string, unknown>
    }>
  } | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchAgencyOnboarding()
      .then((row) => {
        if (!cancelled) {
          setData(row)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load")
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { enabled, data, loading, error }
}
