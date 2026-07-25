/**
 * Read-only preview when admin opens customer or agency surfaces.
 */

export const PREVIEW_STORAGE_KEY = "wheelio-admin-preview"

export type PreviewMode = {
  from: "admin"
  as: "customer" | "agency"
  label: string
  returnTo: string
  at: string
}

export function startPreview(mode: Omit<PreviewMode, "from" | "at">) {
  if (typeof window === "undefined") return
  const payload: PreviewMode = {
    ...mode,
    from: "admin",
    at: new Date().toISOString(),
  }
  sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new Event("wheelio-preview"))
}

export function clearPreview() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(PREVIEW_STORAGE_KEY)
  window.dispatchEvent(new Event("wheelio-preview"))
}

export function readPreview(): PreviewMode | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(PREVIEW_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PreviewMode
  } catch {
    return null
  }
}
