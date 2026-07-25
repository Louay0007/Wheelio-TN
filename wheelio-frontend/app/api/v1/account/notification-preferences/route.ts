import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getNotificationPreferenceMatrix,
  putNotificationPreferenceMatrix,
} from "@/server/modules/customers/application/preferences";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const matrix = await getNotificationPreferenceMatrix(principal);
    return jsonOk(matrix, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PUT(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const matrix = await putNotificationPreferenceMatrix(principal, body, ctx);
    return jsonOk(matrix, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
