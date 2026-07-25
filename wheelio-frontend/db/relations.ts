import { relations } from "drizzle-orm"
import {
  account,
  session,
  twoFactor,
  user,
  verification,
} from "./schema/auth"
import {
  consentEvents,
  customerDrivers,
  customerNotifications,
  customerProfiles,
  notificationPreferences,
  privacyRequests,
  savedOffers,
  savedSearches,
} from "./schema/customers"
import {
  cmsEntries,
  cmsPublications,
  cmsRevisions,
} from "./schema/content"
import {
  adminMemberships,
  agencyMemberships,
} from "./schema/platform"
import {
  agencies,
  agencyProfilesI18n,
  locationTranslations,
  locations,
  reviews,
  vehicleCategories,
  vehicleCategoryTranslations,
} from "./schema/catalog"
import {
  bookingClaimTokens,
  bookingSnapshots,
  bookingStatusHistory,
  bookings,
  depositMemos,
  inventoryAllocations,
  inventoryHolds,
  quoteSnapshots,
  quotes,
  ratePlans,
  searchSessions,
} from "./schema/bookings"
import {
  ledgerAccounts,
  ledgerEntries,
  ledgerTransactions,
} from "./schema/admin"
import {
  agencyOnboardingSteps,
  analyticsRollups,
  bookingModificationRequests,
  branches,
  handoverRecords,
  impersonationGrants,
  paymentIntents,
  paymentTransactions,
  payoutBatches,
  payoutItems,
  returnRecords,
  vehiclePools,
} from "./schema/operations"
import { vehicles } from "./schema/vehicles"
import {
  agencyFees,
  agencyNotificationPreferences,
  agencyNotifications,
  agencyPolicies,
  availabilityBlocks,
  bookingMessages,
  vehicleMedia,
} from "./schema/agency-ops"
import {
  adminAgencyNotes,
  adminStaffInvitations,
  agencyInvitations,
  agencyReviewReplies,
  agencySettings,
  bookingIssues,
  claimNotes,
  claims,
  featureFlags,
  invoices,
  promotions,
  reconciliationRuns,
} from "./schema/longtail"
import {
  adminNotifications,
  agencyDocuments,
  branchDeliveryZones,
  branchHours,
  feesCatalog,
  platformSettings,
  slaPolicies,
} from "./schema/api-surface"

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  twoFactor: one(twoFactor),
  customerProfile: one(customerProfiles),
  agencyMemberships: many(agencyMemberships),
  adminMembership: one(adminMemberships),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

export const verificationRelations = relations(verification, () => ({}))

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, { fields: [twoFactor.userId], references: [user.id] }),
}))

export const customerProfilesRelations = relations(
  customerProfiles,
  ({ one, many }) => ({
    user: one(user, {
      fields: [customerProfiles.userId],
      references: [user.id],
    }),
    drivers: many(customerDrivers),
    notifications: many(customerNotifications),
    savedSearches: many(savedSearches),
    savedOffers: many(savedOffers),
    privacyRequests: many(privacyRequests),
  }),
)

export const customerNotificationsRelations = relations(
  customerNotifications,
  ({ one }) => ({
    profile: one(customerProfiles, {
      fields: [customerNotifications.customerProfileId],
      references: [customerProfiles.id],
    }),
  }),
)

export const customerDriversRelations = relations(
  customerDrivers,
  ({ one }) => ({
    profile: one(customerProfiles, {
      fields: [customerDrivers.customerProfileId],
      references: [customerProfiles.id],
    }),
  }),
)

export const consentEventsRelations = relations(consentEvents, () => ({}))

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  () => ({}),
)

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  profile: one(customerProfiles, {
    fields: [savedSearches.customerProfileId],
    references: [customerProfiles.id],
  }),
}))

export const savedOffersRelations = relations(savedOffers, ({ one }) => ({
  profile: one(customerProfiles, {
    fields: [savedOffers.customerProfileId],
    references: [customerProfiles.id],
  }),
}))

export const privacyRequestsRelations = relations(
  privacyRequests,
  ({ one }) => ({
    profile: one(customerProfiles, {
      fields: [privacyRequests.customerProfileId],
      references: [customerProfiles.id],
    }),
  }),
)

export const cmsEntriesRelations = relations(cmsEntries, ({ many }) => ({
  revisions: many(cmsRevisions),
  publications: many(cmsPublications),
}))

export const cmsRevisionsRelations = relations(cmsRevisions, ({ one }) => ({
  entry: one(cmsEntries, {
    fields: [cmsRevisions.entryId],
    references: [cmsEntries.id],
  }),
}))

export const cmsPublicationsRelations = relations(
  cmsPublications,
  ({ one }) => ({
    entry: one(cmsEntries, {
      fields: [cmsPublications.entryId],
      references: [cmsEntries.id],
    }),
    revision: one(cmsRevisions, {
      fields: [cmsPublications.revisionId],
      references: [cmsRevisions.id],
    }),
  }),
)

export const locationsRelations = relations(locations, ({ many }) => ({
  translations: many(locationTranslations),
  reviews: many(reviews),
}))

export const locationTranslationsRelations = relations(
  locationTranslations,
  ({ one }) => ({
    location: one(locations, {
      fields: [locationTranslations.locationId],
      references: [locations.id],
    }),
  }),
)

export const vehicleCategoriesRelations = relations(
  vehicleCategories,
  ({ many }) => ({
    translations: many(vehicleCategoryTranslations),
  }),
)

export const vehicleCategoryTranslationsRelations = relations(
  vehicleCategoryTranslations,
  ({ one }) => ({
    category: one(vehicleCategories, {
      fields: [vehicleCategoryTranslations.categoryId],
      references: [vehicleCategories.id],
    }),
  }),
)

export const agenciesRelations = relations(agencies, ({ many }) => ({
  profiles: many(agencyProfilesI18n),
  reviews: many(reviews),
  memberships: many(agencyMemberships),
}))

export const agencyProfilesI18nRelations = relations(
  agencyProfilesI18n,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [agencyProfilesI18n.agencyId],
      references: [agencies.id],
    }),
  }),
)

export const reviewsRelations = relations(reviews, ({ one }) => ({
  agency: one(agencies, {
    fields: [reviews.agencyId],
    references: [agencies.id],
  }),
  location: one(locations, {
    fields: [reviews.locationId],
    references: [locations.id],
  }),
}))

export const searchSessionsRelations = relations(searchSessions, ({ one }) => ({
  customer: one(customerProfiles, {
    fields: [searchSessions.customerProfileId],
    references: [customerProfiles.id],
  }),
}))

export const quotesRelations = relations(quotes, ({ one }) => ({
  agency: one(agencies, {
    fields: [quotes.agencyId],
    references: [agencies.id],
  }),
  searchSession: one(searchSessions, {
    fields: [quotes.searchSessionId],
    references: [searchSessions.id],
  }),
  snapshot: one(quoteSnapshots),
}))

export const quoteSnapshotsRelations = relations(quoteSnapshots, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteSnapshots.quoteId],
    references: [quotes.id],
  }),
}))

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [bookings.agencyId],
    references: [agencies.id],
  }),
  customer: one(customerProfiles, {
    fields: [bookings.customerProfileId],
    references: [customerProfiles.id],
  }),
  snapshot: one(bookingSnapshots),
  statusHistory: many(bookingStatusHistory),
  allocations: many(inventoryAllocations),
  depositMemos: many(depositMemos),
  claimTokens: many(bookingClaimTokens),
}))

export const bookingClaimTokensRelations = relations(bookingClaimTokens, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingClaimTokens.bookingId],
    references: [bookings.id],
  }),
}))

export const bookingSnapshotsRelations = relations(
  bookingSnapshots,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingSnapshots.bookingId],
      references: [bookings.id],
    }),
  }),
)

export const bookingStatusHistoryRelations = relations(
  bookingStatusHistory,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingStatusHistory.bookingId],
      references: [bookings.id],
    }),
  }),
)

export const inventoryHoldsRelations = relations(inventoryHolds, ({ one }) => ({
  quote: one(quotes, {
    fields: [inventoryHolds.quoteId],
    references: [quotes.id],
  }),
}))

export const inventoryAllocationsRelations = relations(
  inventoryAllocations,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [inventoryAllocations.bookingId],
      references: [bookings.id],
    }),
  }),
)

export const ratePlansRelations = relations(ratePlans, ({ one }) => ({
  agency: one(agencies, {
    fields: [ratePlans.agencyId],
    references: [agencies.id],
  }),
}))

export const depositMemosRelations = relations(depositMemos, ({ one }) => ({
  booking: one(bookings, {
    fields: [depositMemos.bookingId],
    references: [bookings.id],
  }),
}))
export const vehiclePoolsRelations = relations(vehiclePools, ({ one }) => ({
  agency: one(agencies, {
    fields: [vehiclePools.agencyId],
    references: [agencies.id],
  }),
}))

export const bookingModificationRequestsRelations = relations(
  bookingModificationRequests,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingModificationRequests.bookingId],
      references: [bookings.id],
    }),
  }),
)

export const branchesRelations = relations(branches, ({ one }) => ({
  agency: one(agencies, {
    fields: [branches.agencyId],
    references: [agencies.id],
  }),
}))

export const agencyOnboardingStepsRelations = relations(
  agencyOnboardingSteps,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [agencyOnboardingSteps.agencyId],
      references: [agencies.id],
    }),
  }),
)

export const handoverRecordsRelations = relations(handoverRecords, ({ one }) => ({
  booking: one(bookings, {
    fields: [handoverRecords.bookingId],
    references: [bookings.id],
  }),
}))

export const returnRecordsRelations = relations(returnRecords, ({ one }) => ({
  booking: one(bookings, {
    fields: [returnRecords.bookingId],
    references: [bookings.id],
  }),
}))

export const paymentIntentsRelations = relations(
  paymentIntents,
  ({ one, many }) => ({
    booking: one(bookings, {
      fields: [paymentIntents.bookingId],
      references: [bookings.id],
    }),
    transactions: many(paymentTransactions),
  }),
)

export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one }) => ({
    intent: one(paymentIntents, {
      fields: [paymentTransactions.intentId],
      references: [paymentIntents.id],
    }),
  }),
)

export const payoutBatchesRelations = relations(
  payoutBatches,
  ({ one, many }) => ({
    agency: one(agencies, {
      fields: [payoutBatches.agencyId],
      references: [agencies.id],
    }),
    items: many(payoutItems),
  }),
)

export const payoutItemsRelations = relations(payoutItems, ({ one }) => ({
  payout: one(payoutBatches, {
    fields: [payoutItems.payoutId],
    references: [payoutBatches.id],
  }),
}))

export const impersonationGrantsRelations = relations(
  impersonationGrants,
  () => ({}),
)

export const analyticsRollupsRelations = relations(analyticsRollups, () => ({}))

export const ledgerAccountsRelations = relations(ledgerAccounts, ({ many }) => ({
  entries: many(ledgerEntries),
}))

export const ledgerTransactionsRelations = relations(
  ledgerTransactions,
  ({ many }) => ({
    entries: many(ledgerEntries),
  }),
)

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  transaction: one(ledgerTransactions, {
    fields: [ledgerEntries.transactionId],
    references: [ledgerTransactions.id],
  }),
  account: one(ledgerAccounts, {
    fields: [ledgerEntries.accountId],
    references: [ledgerAccounts.id],
  }),
}))

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [vehicles.agencyId],
    references: [agencies.id],
  }),
  media: many(vehicleMedia),
  availabilityBlocks: many(availabilityBlocks),
}))

export const vehicleMediaRelations = relations(vehicleMedia, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleMedia.vehicleId],
    references: [vehicles.id],
  }),
  agency: one(agencies, {
    fields: [vehicleMedia.agencyId],
    references: [agencies.id],
  }),
}))

export const availabilityBlocksRelations = relations(
  availabilityBlocks,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [availabilityBlocks.agencyId],
      references: [agencies.id],
    }),
    vehicle: one(vehicles, {
      fields: [availabilityBlocks.vehicleId],
      references: [vehicles.id],
    }),
  }),
)

export const agencyPoliciesRelations = relations(agencyPolicies, ({ one }) => ({
  agency: one(agencies, {
    fields: [agencyPolicies.agencyId],
    references: [agencies.id],
  }),
}))

export const agencyFeesRelations = relations(agencyFees, ({ one }) => ({
  agency: one(agencies, {
    fields: [agencyFees.agencyId],
    references: [agencies.id],
  }),
}))

export const agencyNotificationsRelations = relations(
  agencyNotifications,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [agencyNotifications.agencyId],
      references: [agencies.id],
    }),
  }),
)

export const agencyNotificationPreferencesRelations = relations(
  agencyNotificationPreferences,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [agencyNotificationPreferences.agencyId],
      references: [agencies.id],
    }),
  }),
)

export const bookingMessagesRelations = relations(
  bookingMessages,
  ({ one }) => ({
    booking: one(bookings, {
      fields: [bookingMessages.bookingId],
      references: [bookings.id],
    }),
  }),
)

export const agencyInvitationsRelations = relations(
  agencyInvitations,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [agencyInvitations.agencyId],
      references: [agencies.id],
    }),
  }),
)

export const agencySettingsRelations = relations(agencySettings, ({ one }) => ({
  agency: one(agencies, {
    fields: [agencySettings.agencyId],
    references: [agencies.id],
  }),
}))

export const claimsRelations = relations(claims, ({ many }) => ({
  notes: many(claimNotes),
}))

export const claimNotesRelations = relations(claimNotes, ({ one }) => ({
  claim: one(claims, {
    fields: [claimNotes.claimId],
    references: [claims.id],
  }),
}))

export const featureFlagsRelations = relations(featureFlags, () => ({}))
export const promotionsRelations = relations(promotions, () => ({}))
export const invoicesRelations = relations(invoices, ({ one }) => ({
  agency: one(agencies, {
    fields: [invoices.agencyId],
    references: [agencies.id],
  }),
}))
export const reconciliationRunsRelations = relations(
  reconciliationRuns,
  () => ({}),
)
export const adminAgencyNotesRelations = relations(
  adminAgencyNotes,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [adminAgencyNotes.agencyId],
      references: [agencies.id],
    }),
  }),
)
export const adminStaffInvitationsRelations = relations(
  adminStaffInvitations,
  () => ({}),
)
export const agencyReviewRepliesRelations = relations(
  agencyReviewReplies,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [agencyReviewReplies.agencyId],
      references: [agencies.id],
    }),
  }),
)
export const bookingIssuesRelations = relations(bookingIssues, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingIssues.bookingId],
    references: [bookings.id],
  }),
}))

export const branchHoursRelations = relations(branchHours, ({ one }) => ({
  branch: one(branches, {
    fields: [branchHours.branchId],
    references: [branches.id],
  }),
}))
export const branchDeliveryZonesRelations = relations(
  branchDeliveryZones,
  ({ one }) => ({
    branch: one(branches, {
      fields: [branchDeliveryZones.branchId],
      references: [branches.id],
    }),
  }),
)
export const agencyDocumentsRelations = relations(
  agencyDocuments,
  ({ one }) => ({
    agency: one(agencies, {
      fields: [agencyDocuments.agencyId],
      references: [agencies.id],
    }),
  }),
)
export const feesCatalogRelations = relations(feesCatalog, () => ({}))
export const slaPoliciesRelations = relations(slaPolicies, () => ({}))
export const platformSettingsRelations = relations(platformSettings, () => ({}))
export const adminNotificationsRelations = relations(
  adminNotifications,
  () => ({}),
)
