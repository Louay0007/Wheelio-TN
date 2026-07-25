import { resolvePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { createUploadIntent } from "@/server/modules/documents/application/upload-intent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await resolvePrincipal(request);
    const body = await request.json();
    const intent = await createUploadIntent(principal, body);
    return jsonCreated(intent, ctx, `/api/v1/uploads/${intent.objectId}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
