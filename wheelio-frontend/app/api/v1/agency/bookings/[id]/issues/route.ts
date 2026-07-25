import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCreated, jsonError } from "@/server/core/http/response";
import { openBookingIssue } from "@/server/modules/agencies/application/longtail";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { id } = await params;
    const data = await openBookingIssue(
      await requirePrincipal(request),
      id,
      await request.json(),
      ctx,
    );
    return jsonCreated(data, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
