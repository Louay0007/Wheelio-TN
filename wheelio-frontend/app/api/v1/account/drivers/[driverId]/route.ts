import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonError, jsonNoContent, jsonOk } from "@/server/core/http/response";
import {
  deleteCustomerDriver,
  getCustomerDriver,
  updateCustomerDriver,
} from "@/server/modules/customers/application/drivers";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ driverId: string }> };

export async function GET(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { driverId } = await params;
    const principal = await requirePrincipal(request);
    const driver = await getCustomerDriver(principal, driverId);
    return jsonOk(driver, ctx, { etag: `"v${driver.version}"` });
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { driverId } = await params;
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const driver = await updateCustomerDriver(principal, driverId, body, ctx);
    return jsonOk(driver, ctx, { etag: `"v${driver.version}"` });
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  const ctx = await createRequestContext(request.headers);
  try {
    const { driverId } = await params;
    const principal = await requirePrincipal(request);
    const url = new URL(request.url);
    const version = Number(url.searchParams.get("version") ?? "0");
    await deleteCustomerDriver(principal, driverId, version, ctx);
    return jsonNoContent(ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
