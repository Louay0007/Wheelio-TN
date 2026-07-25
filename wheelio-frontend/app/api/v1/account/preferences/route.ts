import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getPreferences,
  updatePreferences,
} from "@/server/modules/customers/application/preferences";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const preferences = await getPreferences(principal);
    return jsonOk(preferences, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const preferences = await updatePreferences(principal, body, ctx);
    return jsonOk(preferences, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
