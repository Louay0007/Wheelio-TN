import { sql } from "drizzle-orm";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import { getDb } from "@/server/core/database/client";
import { pingRedis } from "@/server/core/queue/redis";
import { pingMinio } from "@/server/core/storage/minio";
import { AppError } from "@/server/core/errors/app-error";
import { getLogger } from "@/server/core/observability/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await createRequestContext();
  const log = getLogger();
  const checks: Record<string, "ok" | "error"> = {
    database: "error",
    redis: "error",
    minio: "error",
  };

  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    checks.database = "ok";
  } catch (error) {
    log.error({ err: error }, "Readiness database check failed");
  }

  try {
    await pingRedis();
    checks.redis = "ok";
  } catch (error) {
    log.error({ err: error }, "Readiness redis check failed");
  }

  try {
    await pingMinio();
    checks.minio = "ok";
  } catch (error) {
    log.error({ err: error }, "Readiness minio check failed");
  }

  const ready = Object.values(checks).every((status) => status === "ok");
  if (!ready) {
    return jsonError(
      new AppError({
        code: "TEMPORARY_UNAVAILABLE",
        message: "One or more dependencies are unavailable",
        status: 503,
        details: checks,
        expose: true,
      }),
      ctx,
    );
  }

  return jsonOk(
    {
      status: "ready",
      checks,
      ts: new Date().toISOString(),
    },
    ctx,
  );
}
