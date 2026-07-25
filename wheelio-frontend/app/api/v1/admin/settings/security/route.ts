import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getPlatformSettings } from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const all = await getPlatformSettings(await requirePrincipal(request));
    return jsonOk(
      { security: all.security ?? { mfaRequiredForAdmin: true } },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
