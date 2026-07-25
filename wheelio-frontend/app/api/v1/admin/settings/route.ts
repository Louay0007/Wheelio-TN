import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getPlatformSettings,
  putPlatformSettings,
} from "@/server/modules/admin/application/api-complete";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonOk(
      await getPlatformSettings(await requirePrincipal(request)),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PUT(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonOk(
      await putPlatformSettings(
        await requirePrincipal(request),
        await request.json(),
        ctx,
      ),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
