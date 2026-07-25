"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSelect,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit, type AdminPromotion } from "@/lib/admin"

export default function AdminPromotionNewPage() {
  const router = useRouter()
  const { session, ready, updateWorkspace } = useAdminSession()
  const [code, setCode] = useState("")
  const [label, setLabel] = useState("")
  const [type, setType] = useState<AdminPromotion["type"]>("percent")
  const [value, setValue] = useState("10")

  if (!ready || !session) {
    return (
      <AdminShell title="New promotion">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const actorName = session.name

  function create() {
    const id = `pr-${Date.now()}`
    const promo: AdminPromotion = {
      id,
      code: code.trim().toUpperCase() || "PROMO",
      label: label.trim() || "Untitled promo",
      type,
      value: Number(value) || 0,
      status: "paused",
      redemptions: 0,
      maxRedemptions: 100,
    }
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        { ...ws, promotions: [...ws.promotions, promo] },
        actorName,
        "Created promotion",
        `Promotion ${promo.code}`,
      )
    })
    router.push(`/admin/promotions/${id}`)
  }

  return (
    <AdminShell
      title="New promotion"
      actions={
        <AdminLinkButton href="/admin/promotions" variant="secondary">
          Cancel
        </AdminLinkButton>
      }
    >
      <AdminPanel className="max-w-xl space-y-4">
        <AdminField label="Code">
          <AdminInput
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="TUNIS10"
          />
        </AdminField>
        <AdminField label="Label">
          <AdminInput value={label} onChange={(e) => setLabel(e.target.value)} />
        </AdminField>
        <AdminField label="Type">
          <AdminSelect
            value={type}
            onChange={(e) => setType(e.target.value as AdminPromotion["type"])}
          >
            <option value="percent">Percent off</option>
            <option value="amount">Fixed TND off</option>
            <option value="featured">Featured uplift</option>
          </AdminSelect>
        </AdminField>
        <AdminField label="Value">
          <AdminInput
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </AdminField>
        <AdminPrimaryButton type="button" onClick={create}>
          Create paused promo
        </AdminPrimaryButton>
      </AdminPanel>
    </AdminShell>
  )
}
