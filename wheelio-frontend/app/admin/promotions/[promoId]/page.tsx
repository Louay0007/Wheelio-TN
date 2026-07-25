"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminField,
  AdminInput,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
  AdminSelect,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit, type AdminPromotion } from "@/lib/admin"

export default function AdminPromotionDetailPage() {
  const { promoId } = useParams<{ promoId: string }>()
  const { workspace, session, ready, updateWorkspace } = useAdminSession()
  const promo = workspace?.promotions.find((p) => p.id === promoId)

  const [label, setLabel] = useState("")
  const [status, setStatus] = useState<AdminPromotion["status"]>("paused")

  useEffect(() => {
    if (promo) {
      setLabel(promo.label)
      setStatus(promo.status)
    }
  }, [promo])

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Promotion">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  if (!promo) {
    return (
      <AdminShell title="Promotion not found">
        <AdminLinkButton href="/admin/promotions" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const promoCode = promo.code
  const promoStatus = promo.status
  const actor = session.name

  function save() {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        {
          ...ws,
          promotions: ws.promotions.map((p) =>
            p.id === promoId ? { ...p, label: label.trim() || p.label, status } : p,
          ),
        },
        actor,
        "Updated promotion",
        `Promotion ${promoCode}`,
      )
    })
  }

  function togglePause() {
    const next = promoStatus === "active" ? "paused" : "active"
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        {
          ...ws,
          promotions: ws.promotions.map((p) =>
            p.id === promoId ? { ...p, status: next } : p,
          ),
        },
        actor,
        next === "active" ? "Activated promotion" : "Paused promotion",
        `Promotion ${promoCode}`,
      )
    })
    setStatus(next)
  }

  return (
    <AdminShell
      title={promo.code}
      description={promo.label}
      actions={
        <AdminLinkButton href="/admin/promotions" variant="secondary">
          All promos
        </AdminLinkButton>
      }
    >
      <AdminPanel className="max-w-xl space-y-4">
        <AdminChip tone={promo.status === "active" ? "strong" : "neutral"}>
          {promo.status}
        </AdminChip>
        <AdminField label="Label">
          <AdminInput value={label} onChange={(e) => setLabel(e.target.value)} />
        </AdminField>
        <AdminField label="Status">
          <AdminSelect
            value={status}
            onChange={(e) => setStatus(e.target.value as AdminPromotion["status"])}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
          </AdminSelect>
        </AdminField>
        <p className="font-mono text-sm tabular-nums">
          Redemptions: {promo.redemptions}/{promo.maxRedemptions}
        </p>
        <div className="flex flex-wrap gap-2">
          <AdminPrimaryButton type="button" onClick={save}>
            Save
          </AdminPrimaryButton>
          <AdminSecondaryButton type="button" onClick={togglePause}>
            {promo.status === "active" ? "Pause" : "Activate"}
          </AdminSecondaryButton>
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
