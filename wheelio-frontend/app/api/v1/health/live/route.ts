import { createRequestContext } from "@/server/core/http/request-context";
import { jsonOk } from "@/server/core/http/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await createRequestContext();
  return jsonOk(
    {
      status: "ok",
      service: "wheelio-web",
      ts: new Date().toISOString(),
    },
    ctx,
  );
}
