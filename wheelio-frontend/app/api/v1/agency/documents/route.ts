import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError, jsonOk } from "@/server/core/http/response";
import {
  listAgencyDocuments,
  upsertAgencyDocument,
} from "@/server/modules/agencies/application/api-complete";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonOk(
      await listAgencyDocuments(await requirePrincipal(request)),
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    return jsonCreated(
      await upsertAgencyDocument(
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
