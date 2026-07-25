import { dualControlRequests } from "@/db/schema/admin"
import { createId } from "@/server/contracts/ids"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
import { getDb } from "@/server/core/database/client"
import { withTransaction } from "@/server/core/database/transaction"
import {
  conflict,
  forbidden,
  notFound,
  validationError,
} from "@/server/core/errors/app-error"
import type { RequestContext } from "@/server/core/http/request-context"
import { recordAudit } from "@/server/modules/audit/application/record-audit"
import { z } from "zod"
import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"

const requestSchema = z.object({
  actionKind: z.string().min(1).max(80),
  targetType: z.string().min(1).max(80),
  targetId: z.string().min(1).max(120),
  payload: z.record(z.string(), z.unknown()),
  reason: z.string().min(3).max(500),
})

export async function createDualControlRequest(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.actorClass !== "admin" || !principal.adminMembership) {
    throw forbidden("FORBIDDEN", "Admin membership required")
  }
  const parsed = requestSchema.safeParse(rawInput)
  if (!parsed.success) {
    throw validationError("Invalid dual-control request", {
      issues: parsed.error.issues,
    })
  }
  const payloadHash = createHash("sha256")
    .update(JSON.stringify(parsed.data.payload))
    .digest("hex")

  return withTransaction(getDb(), async (tx) => {
    const id = createId("dcr")
    await tx.insert(dualControlRequests).values({
      id,
      actionKind: parsed.data.actionKind,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      payloadJson: parsed.data.payload,
      payloadHash,
      requesterUserId: principal.actorUserId,
      status: "pending",
      reason: parsed.data.reason,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    })
    await recordAudit(
      tx,
      {
        action: "dual_control.requested",
        resourceType: "dual_control_request",
        resourceId: id,
        tenantType: "platform",
        tenantId: "platform",
        reason: parsed.data.reason,
      },
      ctx,
      principal,
    )
    return { id, status: "pending" as const, payloadHash }
  })
}

export async function approveDualControlRequest(
  principal: EffectivePrincipal,
  requestId: string,
  ctx: RequestContext,
) {
  if (principal.actorClass !== "admin" || !principal.adminMembership) {
    throw forbidden("FORBIDDEN", "Admin membership required")
  }
  return withTransaction(getDb(), async (tx) => {
    const row = await tx.query.dualControlRequests.findFirst({
      where: eq(dualControlRequests.id, requestId),
    })
    if (!row) throw notFound("Dual-control request not found")
    if (row.status !== "pending") {
      throw conflict("APPROVAL_EXPIRED", "Request is not pending")
    }
    if (row.expiresAt < new Date()) {
      throw conflict("APPROVAL_EXPIRED", "Approval window expired")
    }
    if (row.requesterUserId === principal.actorUserId) {
      throw conflict(
        "SELF_APPROVAL_FORBIDDEN",
        "Requester cannot approve their own dual-control request",
      )
    }
    await tx
      .update(dualControlRequests)
      .set({
        status: "approved",
        approverUserId: principal.actorUserId,
        decidedAt: new Date(),
      })
      .where(eq(dualControlRequests.id, requestId))
    await recordAudit(
      tx,
      {
        action: "dual_control.approved",
        resourceType: "dual_control_request",
        resourceId: requestId,
        tenantType: "platform",
        tenantId: "platform",
      },
      ctx,
      principal,
    )
    return { id: requestId, status: "approved" as const }
  })
}
