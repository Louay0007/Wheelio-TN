import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { customerDrivers } from "@/db/schema";
import { createId } from "@/server/contracts/ids";
import type { Database } from "@/server/core/database/client";
import type { DbTransaction } from "@/server/core/database/transaction";
import { getEnv } from "@/server/core/env";

type Tx = Database | DbTransaction;

const AGE_BANDS = ["21-24", "25-29", "30"] as const;

export type DriverDto = {
  id: string;
  fullName: string;
  ageBand: string;
  dateOfBirth: string | null;
  licenseCountry: string;
  licenseNumberMasked: string;
  licenseExpiry: string;
  licenseCategory: string;
  isPrimary: boolean;
  notes: string | null;
  version: number;
  updatedAt: string;
};

function deriveKey() {
  return createHash("sha256").update(getEnv().BETTER_AUTH_SECRET).digest();
}

export function hashLicenseNumber(raw: string) {
  const normalized = raw.trim().toUpperCase().replace(/\s+/g, "");
  return createHash("sha256").update(normalized).digest("hex");
}

export function encryptLicenseNumber(raw: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(raw.trim(), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptLicenseNumber(payload: string) {
  const buf = Buffer.from(payload, "base64url");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

export function maskLicenseNumber(raw: string | null | undefined) {
  if (!raw) return "••••";
  const cleaned = raw.replace(/\s+/g, "");
  const last = cleaned.slice(-4);
  return `••••-${last}`;
}

export function toDriverDto(
  row: typeof customerDrivers.$inferSelect,
  opts?: { unmask?: boolean },
): DriverDto {
  let masked = "••••";
  if (row.licenseNumberEncrypted) {
    try {
      const plain = decryptLicenseNumber(row.licenseNumberEncrypted);
      masked = opts?.unmask ? plain : maskLicenseNumber(plain);
    } catch {
      masked = "••••";
    }
  }
  return {
    id: row.id,
    fullName: row.fullName,
    ageBand: row.ageBand,
    dateOfBirth: row.dateOfBirth ?? null,
    licenseCountry: row.licenseCountry,
    licenseNumberMasked: masked,
    licenseExpiry: row.licenseExpiry,
    licenseCategory: row.licenseCategory,
    isPrimary: row.isPrimary,
    notes: row.notes ?? null,
    version: row.version,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listDrivers(db: Tx, profileId: string) {
  return db.query.customerDrivers.findMany({
    where: and(
      eq(customerDrivers.customerProfileId, profileId),
      isNull(customerDrivers.deletedAt),
    ),
  });
}

export async function findDriver(db: Tx, profileId: string, driverId: string) {
  return db.query.customerDrivers.findFirst({
    where: and(
      eq(customerDrivers.id, driverId),
      eq(customerDrivers.customerProfileId, profileId),
      isNull(customerDrivers.deletedAt),
    ),
  });
}

export async function createDriverRow(
  db: Tx,
  opts: {
    profileId: string;
    fullName: string;
    ageBand: string;
    dateOfBirth?: string | null;
    licenseCountry: string;
    licenseNumber: string;
    licenseExpiry: string;
    licenseCategory?: string;
    isPrimary?: boolean;
    notes?: string | null;
  },
) {
  if (!AGE_BANDS.includes(opts.ageBand as (typeof AGE_BANDS)[number])) {
    throw new Error("INVALID_AGE_BAND");
  }
  const id = createId("drv");
  const [created] = await db
    .insert(customerDrivers)
    .values({
      id,
      customerProfileId: opts.profileId,
      fullName: opts.fullName,
      ageBand: opts.ageBand,
      dateOfBirth: opts.dateOfBirth ?? null,
      licenseCountry: opts.licenseCountry,
      licenseNumberEncrypted: encryptLicenseNumber(opts.licenseNumber),
      licenseNumberHash: hashLicenseNumber(opts.licenseNumber),
      licenseExpiry: opts.licenseExpiry,
      licenseCategory: opts.licenseCategory ?? "B",
      isPrimary: Boolean(opts.isPrimary),
      notes: opts.notes ?? null,
    })
    .returning();
  return created;
}

export async function clearPrimaryDrivers(db: Tx, profileId: string) {
  await db
    .update(customerDrivers)
    .set({ isPrimary: false, updatedAt: new Date() })
    .where(
      and(
        eq(customerDrivers.customerProfileId, profileId),
        isNull(customerDrivers.deletedAt),
      ),
    );
}

export async function updateDriverRow(
  db: Tx,
  driverId: string,
  patch: Partial<{
    fullName: string;
    ageBand: string;
    dateOfBirth: string | null;
    licenseCountry: string;
    licenseNumber: string;
    licenseExpiry: string;
    licenseCategory: string;
    isPrimary: boolean;
    notes: string | null;
    version: number;
  }>,
) {
  const values: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (patch.fullName !== undefined) values.fullName = patch.fullName;
  if (patch.ageBand !== undefined) values.ageBand = patch.ageBand;
  if (patch.dateOfBirth !== undefined) values.dateOfBirth = patch.dateOfBirth;
  if (patch.licenseCountry !== undefined)
    values.licenseCountry = patch.licenseCountry;
  if (patch.licenseExpiry !== undefined)
    values.licenseExpiry = patch.licenseExpiry;
  if (patch.licenseCategory !== undefined)
    values.licenseCategory = patch.licenseCategory;
  if (patch.isPrimary !== undefined) values.isPrimary = patch.isPrimary;
  if (patch.notes !== undefined) values.notes = patch.notes;
  if (patch.licenseNumber !== undefined) {
    values.licenseNumberEncrypted = encryptLicenseNumber(patch.licenseNumber);
    values.licenseNumberHash = hashLicenseNumber(patch.licenseNumber);
  }
  if (patch.version !== undefined) values.version = patch.version + 1;

  const [updated] = await db
    .update(customerDrivers)
    .set(values)
    .where(
      patch.version === undefined
        ? eq(customerDrivers.id, driverId)
        : and(
            eq(customerDrivers.id, driverId),
            eq(customerDrivers.version, patch.version),
          ),
    )
    .returning();
  return updated;
}

export async function softDeleteDriver(
  db: Tx,
  driverId: string,
  version: number,
) {
  const [updated] = await db
    .update(customerDrivers)
    .set({
      deletedAt: new Date(),
      isPrimary: false,
      version: version + 1,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customerDrivers.id, driverId),
        eq(customerDrivers.version, version),
        isNull(customerDrivers.deletedAt),
      ),
    )
    .returning();
  return updated;
}
