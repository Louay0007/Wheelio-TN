"use client"

import { useParams } from "next/navigation"
import { AdminShell } from "@/components/admin/admin-shell"
import {
  AdminChip,
  AdminKeyValue,
  AdminLinkButton,
  AdminPanel,
  AdminPrimaryButton,
  AdminSecondaryButton,
} from "@/components/admin/admin-kit"
import { useAdminSession } from "@/lib/admin-session"
import { pushAudit } from "@/lib/admin"

export default function AdminReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>()
  const { workspace, session, ready, updateWorkspace } = useAdminSession()

  if (!ready || !workspace || !session) {
    return (
      <AdminShell title="Review">
        <div className="h-40 animate-pulse rounded-[10px] bg-zinc-200 dark:bg-zinc-800" />
      </AdminShell>
    )
  }

  const review = workspace.reviews.find((r) => r.id === reviewId)

  if (!review) {
    return (
      <AdminShell title="Review not found">
        <AdminLinkButton href="/admin/content/reviews" variant="secondary">
          Back
        </AdminLinkButton>
      </AdminShell>
    )
  }

  const actorName = session.name

  function setStatus(status: "visible" | "hidden") {
    updateWorkspace((ws) => {
      if (!ws) return ws
      return pushAudit(
        {
          ...ws,
          reviews: ws.reviews.map((r) =>
            r.id === reviewId ? { ...r, status } : r,
          ),
        },
        actorName,
        status === "hidden" ? "Hid review" : "Restored review",
        `Review ${reviewId}`,
      )
    })
  }

  return (
    <AdminShell
      title={review.author}
      description={`${review.agencyName} · ${review.rating}/5`}
      actions={
        <AdminLinkButton href="/admin/content/reviews" variant="secondary">
          Queue
        </AdminLinkButton>
      }
    >
      <AdminPanel className="max-w-xl">
        <AdminChip tone={review.status === "flagged" ? "warn" : "neutral"}>
          {review.status}
        </AdminChip>
        <p className="mt-4 text-sm leading-relaxed">{review.body}</p>
        <div className="mt-4">
          <AdminKeyValue
            rows={[
              { label: "Booking ref", value: review.bookingRef ?? "N/A" },
              {
                label: "Created",
                value: new Date(review.createdAt).toLocaleString(),
              },
            ]}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {review.status !== "hidden" ? (
            <AdminPrimaryButton type="button" onClick={() => setStatus("hidden")}>
              Hide review
            </AdminPrimaryButton>
          ) : (
            <AdminSecondaryButton type="button" onClick={() => setStatus("visible")}>
              Restore review
            </AdminSecondaryButton>
          )}
        </div>
      </AdminPanel>
    </AdminShell>
  )
}
