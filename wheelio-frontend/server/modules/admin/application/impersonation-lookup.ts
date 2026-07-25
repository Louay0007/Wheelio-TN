import { and, eq, gt, isNull } from "drizzle-orm"
import { impersonationGrants } from "@/db/schema"
import { getDb } from "@/server/core/database/client"

export async function findActiveImpersonationGrant(
  grantId: string,
  adminUserId: string,
) {
  const db = getDb()
  return db.query.impersonationGrants.findFirst({
    where: and(
      eq(impersonationGrants.id, grantId),
      eq(impersonationGrants.adminUserId, adminUserId),
      isNull(impersonationGrants.stoppedAt),
      gt(impersonationGrants.expiresAt, new Date()),
    ),
  })
}
