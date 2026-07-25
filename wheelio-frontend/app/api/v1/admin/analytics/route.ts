import { eq } from "drizzle-orm";
import { analyticsRollups } from "@/db/schema";
import { requirePrincipal } from "@/server/core/auth/principal";
import { getDb } from "@/server/core/database/client";
import { forbidden } from "@/server/core/errors/app-error";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    if (!principal.adminMembership) throw forbidden();
    const rows = await getDb().query.analyticsRollups.findMany({
      where: eq(analyticsRollups.includesDeposit, false),
      limit: 100,
    });
    return jsonCollection(
      rows.map((r) => ({
        id: r.id,
        metricKey: r.metricKey,
        valueMillimes: r.valueMillimes?.toString() ?? null,
        valueCount: r.valueCount,
        includesDeposit: r.includesDeposit,
        periodStart: r.periodStart.toISOString(),
        periodEnd: r.periodEnd.toISOString(),
      })),
      { nextCursor: null, hasMore: false },
      ctx,
    );
  } catch (error) {
    return jsonError(error, ctx);
  }
}
