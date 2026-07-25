import { eq } from "drizzle-orm";
import { z } from "zod";
import { consentEvents, customerProfiles } from "@/db/schema";
import { createId } from "@/server/contracts/ids";
import { localeSchema } from "@/server/contracts/pagination";
import type { EffectivePrincipal } from "@/server/core/auth/principal";
import { getDb } from "@/server/core/database/client";
import { withTransaction } from "@/server/core/database/transaction";
import {
  conflict,
  forbidden,
  validationError,
} from "@/server/core/errors/app-error";
import type { RequestContext } from "@/server/core/http/request-context";
import { recordAudit } from "@/server/modules/audit/application/record-audit";
import { enqueueOutbox } from "@/server/modules/audit/infrastructure/outbox-repository";
import {
  ensureProfile,
  findProfileByUserId,
  toProfileDto,
} from "@/server/modules/customers/infrastructure/customer-repository";
import { and } from "drizzle-orm";
import { notificationPreferences } from "@/db/schema";

const preferencesSchema = z.object({
  preferredLocale: localeSchema.optional(),
  theme: z.enum(["system", "light", "dark"]).optional(),
  usualPickup: z.string().max(120).nullable().optional(),
  defaultAgeBand: z.string().max(40).nullable().optional(),
  extrasInterests: z.array(z.string().max(40)).max(20).optional(),
  marketingOptIn: z.boolean().optional(),
  version: z.number().int().positive(),
});

const MANDATORY_EMAIL_EVENTS = new Set([
  "booking_updates",
  "payment_receipts",
  "legal",
]);

const DEFAULT_PREF_MATRIX: Array<{
  eventKey: string;
  channel: "email" | "sms";
  enabled: boolean;
}> = [
  { eventKey: "booking_updates", channel: "email", enabled: true },
  { eventKey: "booking_updates", channel: "sms", enabled: true },
  { eventKey: "pickup_reminders", channel: "email", enabled: true },
  { eventKey: "pickup_reminders", channel: "sms", enabled: true },
  { eventKey: "agency_messages", channel: "email", enabled: true },
  { eventKey: "agency_messages", channel: "sms", enabled: false },
  { eventKey: "payment_receipts", channel: "email", enabled: true },
  { eventKey: "payment_receipts", channel: "sms", enabled: false },
  { eventKey: "marketing", channel: "email", enabled: false },
  { eventKey: "marketing", channel: "sms", enabled: false },
  { eventKey: "legal", channel: "email", enabled: true },
];

async function requireOwnProfile(principal: EffectivePrincipal) {
  const db = getDb();
  let profile = await findProfileByUserId(db, principal.effectiveUserId);
  if (!profile) {
    profile = await ensureProfile(db, {
      userId: principal.effectiveUserId,
      legalName: principal.name || principal.email,
    });
  }
  if (profile.userId !== principal.effectiveUserId) {
    throw forbidden("TENANT_SCOPE_VIOLATION", "Preferences profile mismatch");
  }
  return profile;
}

export async function getPreferences(principal: EffectivePrincipal) {
  const profile = await requireOwnProfile(principal);
  const dto = toProfileDto(profile);
  return {
    preferredLocale: dto.preferredLocale,
    theme: dto.theme,
    usualPickup: dto.usualPickup,
    defaultAgeBand: dto.defaultAgeBand,
    extrasInterests: dto.extrasInterests,
    marketingOptIn: dto.marketingOptIn,
    version: dto.version,
  };
}

export async function updatePreferences(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation sessions cannot mutate preferences",
    );
  }
  const parsed = preferencesSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw validationError("Invalid preferences payload", {
      issues: parsed.error.issues,
    });
  }
  const input = parsed.data;
  const profile = await requireOwnProfile(principal);

  return withTransaction(getDb(), async (tx) => {
    if (profile.version !== input.version) {
      throw conflict(
        "VERSION_CONFLICT",
        "Preferences were updated elsewhere; refresh and retry",
        { expected: input.version, actual: profile.version },
      );
    }

    const [updated] = await tx
      .update(customerProfiles)
      .set({
        preferredLocale: input.preferredLocale ?? profile.preferredLocale,
        theme: input.theme ?? profile.theme,
        usualPickup:
          input.usualPickup !== undefined
            ? input.usualPickup
            : profile.usualPickup,
        defaultAgeBand:
          input.defaultAgeBand !== undefined
            ? input.defaultAgeBand
            : profile.defaultAgeBand,
        marketingOptIn:
          input.marketingOptIn !== undefined
            ? input.marketingOptIn
            : profile.marketingOptIn,
        extrasInterests:
          input.extrasInterests !== undefined
            ? input.extrasInterests
            : profile.extrasInterests,
        version: input.version + 1,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(customerProfiles.id, profile.id),
          eq(customerProfiles.version, input.version),
        ),
      )
      .returning();

    if (!updated) {
      throw conflict(
        "VERSION_CONFLICT",
        "Preferences were updated elsewhere; refresh and retry",
        { expected: input.version },
      );
    }

    if (
      input.marketingOptIn !== undefined &&
      input.marketingOptIn !== profile.marketingOptIn
    ) {
      await tx.insert(consentEvents).values({
        id: createId("cns"),
        subjectType: "customer",
        subjectId: profile.id,
        consentType: "marketing",
        consentVersion: "v1",
        granted: input.marketingOptIn,
        source: "account.preferences",
        ipAddress: ctx.ipAddress,
      });
    }

    const after = {
      preferredLocale: (updated.preferredLocale === "fr" ? "fr" : "en") as
        | "en"
        | "fr",
      theme:
        updated.theme === "light" || updated.theme === "dark"
          ? updated.theme
          : ("system" as const),
      usualPickup: updated.usualPickup ?? null,
      defaultAgeBand: updated.defaultAgeBand ?? null,
      extrasInterests: updated.extrasInterests ?? [],
      marketingOptIn: updated.marketingOptIn,
      version: updated.version,
    };

    await recordAudit(
      tx,
      {
        action: "customer.preferences.updated",
        resourceType: "customer_profile",
        resourceId: profile.id,
        tenantType: "customer",
        tenantId: profile.id,
        after,
      },
      ctx,
      principal,
    );
    await enqueueOutbox(tx, {
      aggregateType: "customer_profile",
      aggregateId: profile.id,
      eventType: "customer.preferences.updated",
      payload: { profileId: profile.id },
      correlationId: ctx.correlationId,
      causationId: ctx.requestId,
    });

    return after;
  });
}

export async function getNotificationPreferenceMatrix(
  principal: EffectivePrincipal,
) {
  const profile = await requireOwnProfile(principal);
  const db = getDb();
  const rows = await db.query.notificationPreferences.findMany({
    where: and(
      eq(notificationPreferences.principalType, "customer"),
      eq(notificationPreferences.principalId, profile.id),
    ),
  });
  const matrix: Record<string, { email: boolean; sms: boolean }> = {};
  for (const def of DEFAULT_PREF_MATRIX) {
    matrix[def.eventKey] ??= { email: true, sms: false };
    matrix[def.eventKey]![def.channel] = def.enabled;
  }
  for (const row of rows) {
    matrix[row.eventKey] ??= { email: true, sms: false };
    if (row.channel === "email" || row.channel === "sms") {
      matrix[row.eventKey]![row.channel] = row.enabled;
    }
  }
  return { preferences: matrix, version: profile.version };
}

export async function putNotificationPreferenceMatrix(
  principal: EffectivePrincipal,
  rawInput: unknown,
  ctx: RequestContext,
) {
  if (principal.impersonating) {
    throw forbidden(
      "IMPERSONATION_READ_ONLY",
      "Impersonation sessions cannot mutate notification preferences",
    );
  }
  const schema = z.object({
    preferences: z.record(
      z.string(),
      z.object({ email: z.boolean(), sms: z.boolean() }),
    ),
  });
  const parsed = schema.safeParse(rawInput);
  if (!parsed.success) {
    throw validationError("Invalid notification preferences", {
      issues: parsed.error.issues,
    });
  }
  const profile = await requireOwnProfile(principal);

  return withTransaction(getDb(), async (tx) => {
    for (const [eventKey, channels] of Object.entries(
      parsed.data.preferences,
    )) {
      for (const channel of ["email", "sms"] as const) {
        let enabled = channels[channel];
        if (channel === "email" && MANDATORY_EMAIL_EVENTS.has(eventKey)) {
          enabled = true;
        }
        const existing = await tx.query.notificationPreferences.findFirst({
          where: and(
            eq(notificationPreferences.principalType, "customer"),
            eq(notificationPreferences.principalId, profile.id),
            eq(notificationPreferences.eventKey, eventKey),
            eq(notificationPreferences.channel, channel),
          ),
        });
        if (existing) {
          await tx
            .update(notificationPreferences)
            .set({
              enabled,
              locale: profile.preferredLocale,
              updatedAt: new Date(),
            })
            .where(eq(notificationPreferences.id, existing.id));
        } else {
          await tx.insert(notificationPreferences).values({
            id: createId("npref"),
            principalType: "customer",
            principalId: profile.id,
            eventKey,
            channel,
            enabled,
            locale: profile.preferredLocale === "fr" ? "fr" : "en",
          });
        }
      }
    }

    await recordAudit(
      tx,
      {
        action: "customer.notification_preferences.updated",
        resourceType: "customer_profile",
        resourceId: profile.id,
        tenantType: "customer",
        tenantId: profile.id,
        after: parsed.data.preferences,
      },
      ctx,
      principal,
    );
    return getNotificationPreferenceMatrix(principal);
  });
}
