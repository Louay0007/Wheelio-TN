import { describe, expect, it } from "vitest"
import { AppError } from "@/server/core/errors/app-error"
import { assertCustomerPaymentOwner } from "@/server/modules/finance/application/payment-history"
import type { EffectivePrincipal } from "@/server/core/auth/principal"
const principal = { actorClass: "customer", customerProfileId: "cus_1" } as EffectivePrincipal
describe("payment ownership", () => { it("allows the owning customer", () => expect(() => assertCustomerPaymentOwner(principal, "cus_1")).not.toThrow()); it("blocks cross-customer receipt access", () => { try { assertCustomerPaymentOwner(principal, "cus_2") } catch (error) { expect(error).toBeInstanceOf(AppError); expect((error as AppError).code).toBe("TENANT_SCOPE_VIOLATION"); return } throw new Error("expected ownership rejection") }); it("blocks non-customer account history", () => expect(() => assertCustomerPaymentOwner({ ...principal, actorClass: "agency", customerProfileId: null }, null)).toThrow(AppError)) })
