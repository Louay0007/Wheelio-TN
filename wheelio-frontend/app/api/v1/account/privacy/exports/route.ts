import { NextResponse } from "next/server";
import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError } from "@/server/core/http/response";
import { requestPrivacyExport } from "@/server/modules/customers/application/privacy";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const result = await requestPrivacyExport(principal, ctx, request.headers.get("Idempotency-Key"));
    return NextResponse.json(
      { data: result, meta: { requestId: ctx.requestId, locale: ctx.locale } },
      {
        status: 202,
        headers: {
          "X-Request-Id": ctx.requestId,
          "X-Correlation-Id": ctx.correlationId,
        },
      },
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
