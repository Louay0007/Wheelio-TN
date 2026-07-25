import { requirePrincipal } from "@/server/core/auth/principal";
import { createRequestContext } from "@/server/core/http/request-context";
import { jsonCollection, jsonError } from "@/server/core/http/response";
import { forbidden } from "@/server/core/errors/app-error";
import { getDb } from "@/server/core/database/client";
import { ledgerEntries, ledgerTransactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await createRequestContext(request.headers);
  try {
    const principal = await requirePrincipal(request);
    if (
      principal.actorClass !== "admin" ||
      !principal.adminMembership ||
      !["super", "finance", "readonly_analyst"].includes(
        principal.adminMembership.role,
      )
    ) {
      throw forbidden("FORBIDDEN", "Admin finance role required");
    }

    const db = getDb();
    const txs = await db.query.ledgerTransactions.findMany({
      orderBy: [desc(ledgerTransactions.effectiveAt)],
      limit: 50,
    });

    // Deposit accounts must never appear in GMV analytics consumers.
    const data = [];
    for (const tx of txs) {
      const entries = await db.query.ledgerEntries.findMany({
        where: eq(ledgerEntries.transactionId, tx.id),
      });
      data.push({
        id: tx.id,
        type: tx.type,
        bookingId: tx.bookingId,
        description: tx.description,
        effectiveAt: tx.effectiveAt.toISOString(),
        entries: entries.map((e) => ({
          accountId: e.accountId,
          debitMillimes: String(e.debitMillimes),
          creditMillimes: String(e.creditMillimes),
        })),
      });
    }

    return jsonCollection(data, { nextCursor: null, hasMore: false }, ctx);
  } catch (error) {
    return jsonError(error, ctx);
  }
}
