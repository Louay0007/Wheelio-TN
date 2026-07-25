import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonOk } from "@/server/core/http/response";
import {
  getOnboarding,
  putOnboardingStep,
} from "@/server/modules/agencies/application/ops-extended";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    return jsonOk(await getOnboarding(principal), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PUT(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const step = typeof body?.step === "string" ? body.step : "";
    return jsonOk(await putOnboardingStep(principal, step, body, ctx), ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
