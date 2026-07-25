import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import {
  adminMemberships,
  agencyMemberships,
  customerProfiles,
} from "@/db/schema";
import { getAuth } from "@/server/core/auth/config";
import { getDb } from "@/server/core/database/client";
import { unauthorized } from "@/server/core/errors/app-error";
import { requireCsrfProtection } from "@/server/core/http/csrf";
import { findActiveImpersonationGrant } from "@/server/modules/admin/application/impersonation-lookup";

export type ActorClass = "customer" | "agency" | "admin" | "system" | "user";

export type EffectivePrincipal = {
  actorUserId: string;
  effectiveUserId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  actorClass: ActorClass;
  tenantType: "customer" | "agency" | "platform" | null;
  tenantId: string | null;
  roles: string[];
  customerProfileId: string | null;
  agencyMemberships: Array<{
    id: string;
    agencyId: string;
    role: string;
    status: string;
  }>;
  adminMembership: {
    id: string;
    role: string;
    status: string;
    mfaRequired: boolean;
  } | null;
  impersonating: boolean;
  impersonationGrantId: string | null;
  sessionId: string | null;
  sessionCreatedAt: Date | null;
};

export async function resolvePrincipal(
  incoming?: Headers | Request,
): Promise<EffectivePrincipal | null> {
  if (incoming instanceof Request) requireCsrfProtection(incoming);
  const auth = getAuth();
  const hdrs =
    incoming instanceof Request
      ? incoming.headers
      : (incoming ?? (await headers()));
  const session = await auth.api.getSession({
    headers: hdrs,
  });
  if (!session?.user) return null;

  const db = getDb();
  const userId = session.user.id;

  const [profile, agencyRows, adminRow] = await Promise.all([
    db.query.customerProfiles.findFirst({
      where: eq(customerProfiles.userId, userId),
    }),
    db.query.agencyMemberships.findMany({
      where: eq(agencyMemberships.userId, userId),
    }),
    db.query.adminMemberships.findFirst({
      where: eq(adminMemberships.userId, userId),
    }),
  ]);

  const activeAgency = agencyRows.filter((row) => row.status === "active");
  const adminActive =
    adminRow && adminRow.status === "active" ? adminRow : null;

  let actorClass: ActorClass = "customer";
  let tenantType: EffectivePrincipal["tenantType"] = "customer";
  let tenantId: string | null = profile?.id ?? null;
  const roles: string[] = [];

  if (adminActive) {
    actorClass = "admin";
    tenantType = "platform";
    tenantId = "platform";
    roles.push(adminActive.role);
  } else if (activeAgency.length > 0) {
    actorClass = "agency";
    tenantType = "agency";
    tenantId = activeAgency[0]?.agencyId ?? null;
    roles.push(...activeAgency.map((row) => row.role));
  } else {
    roles.push("customer");
  }

  let impersonating = false;
  let impersonationGrantId: string | null = null;
  let effectiveUserId = userId;
  let customerProfileId = profile?.id ?? null;

  const grantHeader = hdrs.get("x-wheelio-impersonation-grant");
  if (grantHeader && adminActive) {
    const grant = await findActiveImpersonationGrant(grantHeader, userId);
    if (grant) {
      impersonating = true;
      impersonationGrantId = grant.id;
      if (grant.targetType === "customer") {
        const targetProfile = await db.query.customerProfiles.findFirst({
          where: eq(customerProfiles.id, grant.targetId),
        });
        if (!targetProfile)
          throw unauthorized("Impersonation target not found");
        customerProfileId = targetProfile.id;
        effectiveUserId = targetProfile.userId;
        actorClass = "customer";
        tenantType = "customer";
        tenantId = grant.targetId;
      } else if (grant.targetType === "agency") {
        actorClass = "agency";
        tenantType = "agency";
        tenantId = grant.targetId;
      }
    }
  }

  return {
    actorUserId: userId,
    effectiveUserId,
    email: session.user.email,
    emailVerified: Boolean(session.user.emailVerified),
    name: session.user.name,
    actorClass,
    tenantType,
    tenantId,
    roles,
    customerProfileId,
    agencyMemberships: activeAgency.map((row) => ({
      id: row.id,
      agencyId: row.agencyId,
      role: row.role,
      status: row.status,
    })),
    adminMembership: adminActive
      ? {
          id: adminActive.id,
          role: adminActive.role,
          status: adminActive.status,
          mfaRequired: Boolean(adminActive.mfaRequired),
        }
      : null,
    impersonating,
    impersonationGrantId,
    sessionId: session.session?.id ?? null,
    sessionCreatedAt: session.session?.createdAt ?? null,
  };
}

export async function requirePrincipal(incoming?: Headers | Request) {
  const principal = await resolvePrincipal(incoming);
  if (!principal) throw unauthorized();
  return principal;
}
