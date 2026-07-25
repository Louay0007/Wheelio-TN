import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getProfile } from "@/server/modules/customers/application/get-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const profile = await getProfile(principal);
    return jsonOk(
      {
        user: {
          id: principal.actorUserId,
          email: principal.email,
          emailVerified: principal.emailVerified,
          name: principal.name,
        },
        actorClass: principal.actorClass,
        roles: principal.roles,
        tenantType: principal.tenantType,
        tenantId: principal.tenantId,
        customerProfileId: principal.customerProfileId ?? profile.id,
        agencyMemberships: principal.agencyMemberships,
        adminMembership: principal.adminMembership,
        impersonating: principal.impersonating,
        profile,
      },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
