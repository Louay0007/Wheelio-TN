import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getProfile } from "@/server/modules/customers/application/get-profile";
import { updateProfile } from "@/server/modules/customers/application/update-profile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const profile = await getProfile(principal);
    return jsonOk(profile, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const profile = await updateProfile(principal, body, ctx);
    return jsonOk(profile, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
