import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import {
  jsonCollection,
  jsonCreated,
  jsonError,
} from "@/server/core/http/response";
import {
  createCustomerDriver,
  listCustomerDrivers,
} from "@/server/modules/customers/application/drivers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const drivers = await listCustomerDrivers(principal);
    return jsonCollection(drivers, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}

export async function POST(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    const body = await request.json();
    const driver = await createCustomerDriver(principal, body, ctx);
    return jsonCreated(driver, ctx, `/api/v1/account/drivers/${driver.id}`);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
