import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getAgencySettings,
  updateAgencySettings,
} from "@/server/modules/agencies/application/longtail";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonOk(
      await getAgencySettings(await requirePrincipal(request)),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    return jsonOk(
      await updateAgencySettings(principal, await request.json(), ctx),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
