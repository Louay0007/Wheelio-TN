import { and, eq } from "drizzle-orm";
import { customerProfiles } from "@/db/schema";
import type { Database } from "@/server/core/database/client";
import type { DbTransaction } from "@/server/core/database/transaction";
import { createId } from "@/server/contracts/ids";
import type {
  CustomerProfileDto,
  UpdateCustomerProfileInput,
} from "@/server/modules/customers/contracts/profile";

type Tx = Database | DbTransaction;

export function toProfileDto(
  row: typeof customerProfiles.$inferSelect,
): CustomerProfileDto {
  return {
    id: row.id,
    userId: row.userId,
    legalName: row.legalName,
    preferredName: row.preferredName ?? null,
    phone: row.phone ?? null,
    dateOfBirth: row.dateOfBirth ?? null,
    nationality: row.nationality ?? null,
    residenceCountry: row.residenceCountry ?? null,
    addressLine: row.addressLine ?? null,
    city: row.city ?? null,
    preferredLocale: row.preferredLocale === "fr" ? "fr" : "en",
    theme: row.theme === "light" || row.theme === "dark" ? row.theme : "system",
    usualPickup: row.usualPickup ?? null,
    defaultAgeBand: row.defaultAgeBand ?? null,
    marketingOptIn: row.marketingOptIn,
    welcomeCompleted: row.welcomeCompleted,
    extrasInterests: row.extrasInterests ?? [],
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function findProfileByUserId(db: Tx, userId: string) {
  return db.query.customerProfiles.findFirst({
    where: eq(customerProfiles.userId, userId),
  });
}

export async function ensureProfile(
  db: Tx,
  opts: { userId: string; legalName: string; preferredLocale?: string },
) {
  const existing = await findProfileByUserId(db, opts.userId);
  if (existing) return existing;
  const id = createId("cpf");
  const [created] = await db
    .insert(customerProfiles)
    .values({
      id,
      userId: opts.userId,
      legalName: opts.legalName,
      preferredLocale: opts.preferredLocale === "fr" ? "fr" : "en",
    })
    .returning();
  return created;
}

export async function updateProfileRow(
  db: Tx,
  profileId: string,
  input: UpdateCustomerProfileInput,
) {
  const { version, ...patch } = input;
  const [updated] = await db
    .update(customerProfiles)
    .set({
      ...patch,
      version: version + 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customerProfiles.id, profileId),
        eq(customerProfiles.version, version),
      ),
    )
    .returning();
  return updated;
}
