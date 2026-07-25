# Wheelio TN — Complete API Cutover Implementation Runbook

**Status:** execution checklist  
**Scope:** schema recovery and Waves 3–12  
**Application:** `wheelio-frontend`  
**Authority:** PostgreSQL, `/api/v1/**`, and Better Auth  
**Locales:** `en`, `fr`  
**Money:** integer millimes in PostgreSQL; decimal strings over HTTP

This document turns the architecture and cutover plans into an ordered implementation runbook. Complete each stage and its exit gate before moving forward. Never reset or overwrite the current working tree.

## 0. Non-negotiable execution rules

- Preserve every existing modified and untracked file.
- Never use destructive Git commands.
- Back up PostgreSQL before schema or migration work.
- Reconstruct existing schema from PostgreSQL and verified migrations, never assumptions.
- Never run migration generation against incomplete schema modules.
- Test migrations on a disposable database before the live database.
- Keep credentials, sessions, users, bookings, licence data, and financial records out of browser storage.
- Validate every API request and response with Zod.
- Require authorization, tenant scope, CSRF, idempotency, and atomic concurrency where applicable.
- Keep deposits separate from GMV, commission, invoices, refunds, payouts, and analytics.
- Commit one reviewed stage at a time only when explicitly requested.

## 1. Standard stage workflow

Use this workflow for every stage:

1. Inventory current routes, services, schemas, contracts, UI, and tests.
2. Define the canonical database and HTTP contract.
3. Add or adjust schema and generate a forward-only migration.
4. Implement repository and application services.
5. Add authorization, CSRF, idempotency, concurrency, audit, and outbox handling.
6. Add Route Handlers and runtime-validated contracts.
7. Add frontend gateway, query keys, hooks, and invalidations.
8. Replace demo UI state and implement loading, empty, error, forbidden, conflict, and offline states.
9. Add unit, route, integration, security, concurrency, and UI tests.
10. Run the stage gate:

```bash
pnpm typecheck
pnpm db:check
pnpm test
pnpm lint
pnpm build
```

Record failures and fixes before proceeding. Do not treat route count or compilation alone as completion.

## 2. Stage 1 — Recover the canonical database schema

### 2.1 Back up and inspect

- [ ] Confirm PostgreSQL health and list public tables.
- [ ] Create a custom-format data backup and plain schema-only export.
- [ ] Read `db/schema/index.ts`, `db/relations.ts`, migration SQL, snapshots, repositories, services, and tests.
- [ ] Query `drizzle.__drizzle_migrations`; record applied hashes and timestamps.
- [ ] Search backups, CI artifacts, deployment bundles, and other checkouts for missing migration files.
- [ ] Do not fabricate missing historical migrations.

### 2.2 Introspect safely

- [ ] Run Drizzle introspection into an isolated temporary directory.
- [ ] Compare introspected definitions with `pg_dump`, existing schema modules, and application usage.
- [ ] Correct introspection defects such as malformed empty-string defaults, bigint modes, generated `tstzrange` columns, partial indexes, and operator-class output.
- [ ] Preserve existing exported TypeScript identifiers expected by imports.

### 2.3 Restore missing modules

Reconstruct:

- [ ] `db/schema/catalog.ts`
- [ ] `db/schema/bookings.ts`
- [ ] `db/schema/vehicles.ts`
- [ ] `db/schema/admin.ts`
- [ ] `db/schema/operations.ts`
- [ ] `db/schema/partners.ts`
- [ ] `db/schema/agency-ops.ts`
- [ ] `db/schema/longtail.ts`
- [ ] `db/schema/api-surface.ts`

Table ownership:

- `catalog`: agencies, profiles/translations, locations/translations, categories/translations, reviews.
- `bookings`: search sessions, quotes/snapshots, bookings/snapshots/history, holds, allocations, rate plans, deposit memos.
- `vehicles`: vehicles.
- `admin`: ledger accounts/transactions/entries and dual-control requests.
- `operations`: branches, pools, onboarding, modifications, handover/return, payments, payouts, impersonation, analytics.
- `partners`: partner applications and notes.
- `agency-ops`: media, availability, policies, fees, notifications/preferences, messages.
- `longtail`: invitations, settings, claims, flags, promotions, invoices, reconciliation, notes, replies, issues.
- `api-surface`: branch hours/delivery, agency documents, fee catalog, SLA, platform settings, admin notifications, refunds, support cases/notes.

### 2.4 Relations and migration continuity

- [ ] Reconcile all physical foreign keys and semantic Drizzle relations.
- [ ] Confirm every table is exported once through `db/schema/index.ts`.
- [ ] Recover historical SQL/snapshots only when hashes can be verified.
- [ ] If history is unrecoverable, document and implement a reviewed baseline migration for new databases while preserving live migration metadata.
- [ ] Apply the migration chain to a disposable empty database.
- [ ] Compare normalized disposable and live `pg_dump --schema-only` outputs.

### 2.5 Gate

- [ ] Remove only stale `*.tsbuildinfo` metadata.
- [ ] `drizzle-kit check` passes.
- [ ] Clean typecheck, tests, lint, and production build pass.
- [ ] No migration was applied to live PostgreSQL during reconstruction.

## 3. Stage 2 — Shared security and correctness

### 3.1 Route boundary

- [ ] Add a common Route Handler wrapper for context, logging, principal resolution, validation, and errors.
- [ ] Enforce CSRF for every cookie-authenticated `POST`, `PUT`, `PATCH`, and `DELETE` below `/api/v1`.
- [ ] Permit exemption only for cryptographically verified provider webhooks.
- [ ] Reject cross-origin `Origin` and invalid `Sec-Fetch-Site`.
- [ ] Replace headers-only principal calls on write routes with full `Request` handling.
- [ ] Add a static route audit and CSRF method matrix tests.

### 3.2 Authorization

- [ ] Define customer, agency, admin, system, and webhook actor scopes.
- [ ] Require verified customer email where booking or sensitive account access depends on email.
- [ ] Validate active agency and branch membership on every tenant request.
- [ ] Enforce read-only impersonation at the common command boundary.
- [ ] Fix profile-ID/user-ID mismatches during impersonation.
- [ ] Add permission matrices for agency and admin commands.

### 3.3 Atomic concurrency

- [ ] Standardize `If-Match` or required `expectedVersion`.
- [ ] Update rows using `WHERE id = ? AND version = ?`.
- [ ] Return `409 VERSION_CONFLICT` when no row is updated.
- [ ] Fix profile, preferences, all driver commands, and primary-driver reassignment first.
- [ ] Apply the same pattern to every versioned entity in later stages.
- [ ] Add concurrent update tests.

### 3.4 Idempotency

- [ ] Atomically claim `(principal, scope, key)` without select-then-insert races.
- [ ] Hash canonical request payloads.
- [ ] Replay completed responses.
- [ ] Reject same key with a changed payload.
- [ ] Return an explicit in-flight response.
- [ ] Expire abandoned records.
- [ ] Require stable keys for all high-risk commands.
- [ ] Add parallel replay/race tests.

### 3.5 Pagination

- [ ] Implement opaque signed/base64url cursors.
- [ ] Require deterministic sort plus ID tie-breaker.
- [ ] Bound limits to 1–100.
- [ ] Return `422` for malformed or filter-incompatible cursors.
- [ ] Replace placeholder cursors as each collection is migrated.

### 3.6 Outbox and workers

- [ ] Claim events with `FOR UPDATE SKIP LOCKED` or an atomic lease.
- [ ] Prevent concurrent publication.
- [ ] Add typed event handlers and payload validation.
- [ ] Dispatch durable BullMQ jobs.
- [ ] Configure retries, exponential backoff, terminal failure, and dead-letter handling.
- [ ] Make every consumer idempotent.
- [ ] Add worker concurrency and replay tests.

### 3.7 Frontend error behavior

- [ ] Add shared handling for `MFA_REQUIRED`, `STEP_UP_REQUIRED`, `VERSION_CONFLICT`, `RATE_LIMITED`, and stale data.
- [ ] Preserve drafts during conflicts and refetch the latest entity.
- [ ] Clear sensitive query caches on logout and tenant changes.
- [ ] Add account, checkout, bookings, agency, and admin route boundaries.

### 3.8 Gate

- [ ] CSRF matrix, ownership, tenant, impersonation, idempotency race, and version race tests pass.
- [ ] No unsafe route can bypass the common boundary.

## 4. Stage 3 — Complete customer account and security

### 4.1 Notification inbox

- [ ] Add customer notification table, indexes, migration, and relations.
- [ ] Persist localized type, title/body, href, read timestamp, and creation timestamp.
- [ ] Add cursor list and unread-count APIs.
- [ ] Add mark-read and mark-unread commands with ownership checks.
- [ ] Consume relevant outbox events into notifications.
- [ ] Update account contracts, gateways, query keys, infinite query, and optimistic read state.
- [ ] Replace the placeholder inbox and add account-hub unread summary.

### 4.2 Notification preferences

- [ ] Define an event/channel allowlist.
- [ ] Add versioning and atomic replacement semantics.
- [ ] Save all settings in one transaction.
- [ ] Keep mandatory transactional channels enabled.
- [ ] Synchronize marketing preferences with consent events.

### 4.3 Canonical customer payments

- [ ] Define a provider adapter interface while keeping the current internal/stub provider.
- [ ] Add owned customer payment history and receipt/detail endpoints.
- [ ] Add booking payment/refund/deposit timeline.
- [ ] Authorize receipt download through stored-object metadata.
- [ ] Enforce idempotency on intent/confirmation commands.
- [ ] Never expose fake cards, raw card data, or unowned records.
- [ ] Integrate account and booking payment pages.

### 4.4 Secure guest booking attachment

- [ ] Add claim-request persistence with token hash, booking/email binding, expiry, attempts, used timestamp, requester, and audit fields.
- [ ] Return a generic response for claim requests.
- [ ] Normalize and compare booking email with authenticated verified account email.
- [ ] Send the one-time token through the existing mail transport.
- [ ] Rate-limit request and confirmation attempts.
- [ ] Atomically attach `customerProfileId` with expected booking version.
- [ ] Return conflict if another account already owns the booking.
- [ ] Emit audit and outbox events.
- [ ] Replace insecure booking lookup/claim demo flows.

### 4.5 Privacy workflows

- [ ] Add current-user request list and detail endpoints.
- [ ] Prevent duplicate active requests by type.
- [ ] Require recent authentication/step-up for export and deletion.
- [ ] Queue export jobs and build a complete, redacted archive.
- [ ] Store private artifacts in MinIO and authorize download.
- [ ] Add expiry and cleanup for export artifacts.
- [ ] Implement staged deletion/anonymization with legal-hold and financial-retention rules.
- [ ] Expose pending, processing, completed, failed, and blocked states.
- [ ] Poll status from the account UI.

### 4.6 MFA and security

- [ ] Implement Better Auth TOTP setup, QR display, verification, backup codes, disable, and recovery.
- [ ] Add recent-authentication assurance to the effective principal.
- [ ] Add reusable step-up guards.
- [ ] Add revoke-other-sessions.
- [ ] Build security-event history from audit events.
- [ ] Rate-limit sensitive authentication commands.
- [ ] Remove demo admin MFA acceptance.

### 4.7 Gate

- [ ] Notification, preference, payment ownership, claim replay/conflict, privacy worker, MFA, session, and rate-limit tests pass.
- [ ] No customer PII or domain state is authoritative in browser storage.

## 5. Stage 4 — Search, quotes, holds, checkout, and booking creation

- [ ] Validate canonical search criteria and create expiring search sessions.
- [ ] Query only published agencies, branches, categories, rates, policies, fees, and available inventory.
- [ ] Return server-calculated TND string millimes.
- [ ] Create immutable quote snapshots with rental, fees, extras, discounts, commissionable total, agency net, commission, online/desk due, and separate deposit.
- [ ] Acquire and release holds idempotently with exclusion constraints.
- [ ] Recover gracefully from hold expiry.
- [ ] Build checkout from quote, hold, account profile, and drivers.
- [ ] Revalidate quote/hold server-side when creating a booking.
- [ ] Create one booking per logical idempotency key.
- [ ] Create booking snapshot, status history, inventory allocation, audit, and outbox atomically.
- [ ] Integrate payment intent creation without adding an external provider.
- [ ] Replace demo/localStorage checkout and search authority.

Gate:

- [ ] Concurrent checkout produces one booking.
- [ ] Overlapping inventory cannot be double allocated.
- [ ] Client-supplied prices are ignored.
- [ ] Hold-expiry recovery works in EN and FR.

## 6. Stage 5 — Customer booking lifecycle

Implement canonical APIs and UI for:

- [ ] Booking/trip list with real cursor and date filters.
- [ ] Booking detail and timeline.
- [ ] Confirmation.
- [ ] Authorized documents, vouchers, receipts, and signed downloads.
- [ ] Booking messages and idempotent sends.
- [ ] Cancellation quote and application.
- [ ] Modification quote and application.
- [ ] Pickup/return scheduling.
- [ ] Payment/refund/deposit timeline.
- [ ] Pickup and return checklists.
- [ ] Incident/claim creation and evidence.
- [ ] One verified post-completion review.
- [ ] Scoped guest booking access grants where anonymous access remains necessary.

Gate:

- [ ] Customer, agency, and admin views use the same booking ID and version.
- [ ] Every booking subresource enforces ownership or a scoped grant.
- [ ] Cancellation/modification races and message replay tests pass.

## 7. Stage 6 — Agency authentication, tenant selection, onboarding, and shell

- [ ] Use Better Auth for agency login, recovery, logout, MFA, and sessions.
- [ ] Add explicit active-agency selection; never select the first membership.
- [ ] Validate tenant and branch scope on every request.
- [ ] Clear agency caches when tenant changes.
- [ ] Secure invitation acceptance by token, expiry, single use, and matching email.
- [ ] Persist all onboarding steps and prerequisites.
- [ ] Integrate compliance document uploads and scan states.
- [ ] Add dashboard, inbox, notifications, preferences, and help.
- [ ] Remove agency session/workspace browser authority.

Gate:

- [ ] Multi-agency, role, branch, invitation, MFA, and tenant-isolation tests pass.

## 8. Stage 7 — Agency operations

### Branches and fleet

- [ ] Branch CRUD, hours, exceptions, delivery zones, and fees.
- [ ] GET requests return defaults without writing.
- [ ] Vehicle CRUD, plate/VIN hashing, categories, branches, pools, and statuses.
- [ ] Vehicle media upload, quarantine, scan, ordering, moderation, and signed access.
- [ ] Availability/maintenance/owner-use blocks and calendar conflicts.

### Rates and policies

- [ ] Rate plans, effective periods, weekday/weekend/season rules, fees, extras, and protection.
- [ ] Server-side rate preview with separate deposit.
- [ ] Versioned localized policies with future effective dates.
- [ ] Existing booking snapshots remain immutable.

### Booking operations

- [ ] List/detail/calendar with real cursors.
- [ ] Accept/decline with SLA and allocation.
- [ ] Prepare checklist and vehicle assignment.
- [ ] Handover with documents, desk payment, condition, and deposit memo.
- [ ] Return with mileage, fuel, condition, charges, disputes, and deposit release memo.
- [ ] Messages, documents, finance, and issues.

Gate:

- [ ] Tenant/branch isolation, lifecycle state machine, inventory concurrency, and snapshot immutability tests pass.

## 9. Stage 8 — Agency organization and finance

- [ ] Team list, invites, role/branch updates, disablement, and versioning.
- [ ] Public profile, booking mode, contract, and security settings.
- [ ] Review replies with one-reply/version rules.
- [ ] Operational, quality, utilization, and revenue reports.
- [ ] Ledger and commission invoice reads.
- [ ] Authorized invoice downloads.
- [ ] Payout list/detail and dispute creation.
- [ ] Ensure agency staff cannot mark payouts paid.
- [ ] Ensure every payout item has `includesDeposit = false`.

Gate:

- [ ] Role matrix, invitation replay, report reconciliation, and deposit-exclusion tests pass.

## 10. Stage 9 — Admin operations

- [ ] Replace demo admin identity and workspace state.
- [ ] Require Better Auth admin membership and MFA.
- [ ] Implement RBAC for super admin, operations, finance, support, content, and read-only analyst.
- [ ] Add global search with role-based redaction.
- [ ] Add admin notifications, audit explorer, and SLA operations.
- [ ] Migrate partner application review and agency creation.
- [ ] Migrate agency detail and all branch/fleet/rate/document/contract/staff/quality/payout/note views.
- [ ] Migrate booking list/detail/timeline/money/messages/override.
- [ ] Migrate customers, bookings, risk, restrictions, and read-only impersonation.
- [ ] Migrate cases and claims.
- [ ] Require reason/ticket fields and audit sensitive reads/writes.
- [ ] Apply dual control to sensitive commands.

Gate:

- [ ] RBAC, PII redaction, MFA, dual control, self-approval prevention, and impersonation read-only tests pass.

## 11. Stage 10 — Admin finance

- [ ] Complete append-only double-entry ledger views and posting services.
- [ ] Reconcile commission accruals against booking snapshots.
- [ ] Implement invoice generation lifecycle and PDF jobs.
- [ ] Implement payout batch generation, holds, approval, release, and item allocation.
- [ ] Implement refunds with customer, agency clawback, and Wheelio absorption allocations.
- [ ] Keep deposit release outside refund and revenue calculations.
- [ ] Implement provider-adapter reconciliation without adding an external provider.
- [ ] Add replay-safe finance commands and dual control.

Gate:

- [ ] Every transaction balances.
- [ ] Replay creates no duplicate postings.
- [ ] Payout allocation equals canonical agency net.
- [ ] Deposit is absent from commercial totals.

## 12. Stage 11 — Admin content, catalog, settings, and analytics

- [ ] Categories, aliases, fees catalog, locations/translations, vehicles, and promotions.
- [ ] CMS entry, revision, scheduling, publication, unpublication, and legal approval.
- [ ] Review moderation with canonical `published` status.
- [ ] Staff invitation, role, MFA, and session security.
- [ ] Platform settings, SLA, and server-delivered feature flags.
- [ ] Analytics for demand, supply, finance, and quality from canonical data.
- [ ] Invalidate public caches after catalog/CMS publication.
- [ ] Require MFA/dual control for legal, security, and rollout-sensitive changes.

Gate:

- [ ] Publication, moderation, rollout, and analytics reconciliation tests pass.

## 13. Stage 12 — Infrastructure and final cutover

### Uploads and workers

- [ ] Bind upload intents to principal, owner, purpose, MIME, size, and checksum.
- [ ] Verify actual MinIO object properties before finalization.
- [ ] Keep objects quarantined pending a real scan result.
- [ ] Authorize every signed private download.
- [ ] Complete email, notification, document/PDF, privacy export, analytics, and provider event workers.

### Observability and operations

- [ ] Correlate request, audit, outbox, queue, and worker IDs.
- [ ] Add readiness checks for PostgreSQL, Redis, and MinIO.
- [ ] Add metrics for API errors, conflicts, retries, holds, queues, payment events, and cutover cohorts.
- [ ] Redact tokens, cookies, PII, bodies, messages, and signed URLs.
- [ ] Document backup/restore, worker recovery, rollback, and incident procedures.

### Remove demo authority

- [ ] Remove demo workspaces and synchronization modules.
- [ ] Remove domain localStorage keys.
- [ ] Remove obsolete broad public cutover flags after rollback windows close.
- [ ] Add CI checks forbidding client imports from `server/**`, `db/**`, and demo modules.
- [ ] Classify all 213 pages as static or API-backed.
- [ ] Register every endpoint with method, schemas, auth, permission, tenant, idempotency, concurrency, cache, and invalidations.

## 14. Final acceptance matrix

Before declaring completion:

- [ ] Clean schema generation and migration on an empty database.
- [ ] Restore from backup and verify application readiness.
- [ ] Full unit, contract, route, integration, security, concurrency, worker, and webhook replay suites pass.
- [ ] EN and FR Playwright flows pass for customer, agency, and admin journeys.
- [ ] Accessibility and keyboard checks pass.
- [ ] Load tests cover public reads, search, checkout, operational queues, and workers.
- [ ] Cross-tenant and cross-owner abuse tests pass.
- [ ] No unsafe cookie-authenticated mutation lacks CSRF protection.
- [ ] No high-risk command lacks idempotency.
- [ ] No versioned command can silently overwrite concurrent changes.
- [ ] No booking/payment/object data is exposed by opaque ID alone.
- [ ] Deposits remain excluded from all commercial finance and analytics.
- [ ] No mutable domain record uses browser storage as authority.
- [ ] Production build passes with development-only routes disabled.
- [ ] Rollout and rollback exercises pass without dual-writing mutable data.

## 15. Recommended delivery units

Keep reviews manageable:

1. Schema recovery and migration baseline.
2. Shared security, concurrency, idempotency, pagination, and outbox.
3. Customer notifications and preferences.
4. Customer payments and booking attachment.
5. Privacy and MFA/security.
6. Search/quote/hold.
7. Checkout/booking/payment.
8. Customer booking lifecycle.
9. Agency auth/onboarding/shell.
10. Agency fleet/branches/rates/policies.
11. Agency booking operations.
12. Agency organization/finance.
13. Admin identity/RBAC/operations.
14. Admin finance.
15. Admin content/catalog/settings/analytics.
16. Workers/uploads/observability.
17. Demo removal and final acceptance.

Each unit must include backend, frontend, migration, tests, and documentation together. Do not merge partially authoritative flows that leave the UI writing to one source and reading from another.
