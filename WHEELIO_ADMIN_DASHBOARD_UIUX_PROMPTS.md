# Wheelio TN — Admin Dashboard (UI/UX Prompts)

**Product:** Tunisia-first multi-agency car rental marketplace  
**Scope:** Everything **Wheelio staff** need to run the marketplace — partner verification, supply quality, booking support, finance reconciliation, catalog/CMS, promotions, risk, and analytics.  
**Audience:** Wheelio founder / super-admin, partner success, support agent, finance operator, content editor (not renters, not agency staff)  
**Currency:** TND · **Visual:** monochrome black / white / zinc · Host Grotesk · light + dark  
**Commission (locked for UI):** Standard **12%** of customer mandatory trip total (deposit excluded). Launch / volume **10%**. Deposit never in GMV or commission.

Use each **Creation prompt** as a design or coding brief. Keep prompts intact when generating screens.

**Related docs**
- Master plan: `WHEELIO_TN_PROJECT_PLAN.md` (Admin MVP §7, finance §13, quality §15, journeys §10)
- Customer marketplace: `WHEELIO_CLIENT_PAGES_UIUX_PROMPTS.md`
- Customer post-booking: `WHEELIO_POST_BOOKING_PAGES_UIUX_PROMPTS.md`
- Customer account/auth: `WHEELIO_USER_ACCOUNT_AUTH_UIUX_PROMPTS.md`
- Agency portal: `WHEELIO_AGENCY_DASHBOARD_UIUX_PROMPTS.md`
- Pricing source: `wheelio-frontend/lib/partner-pricing.ts`
- Agency demo model: `wheelio-frontend/lib/agency.ts`
- Customer bookings model: `wheelio-frontend/lib/bookings.ts`
- This file owns: **Wheelio admin IA, pages, ops flows, sprints, demo model**

**Canonical route prefixes**
- Wheelio staff app: `/admin/*`
- Agency app: `/agency/*` (never reuse AdminShell here)
- Customer app: `/`, `/search`, `/cars/*`, `/checkout`, `/bookings/*`, `/trips/*`, `/account/*`
- Public partner funnel: `/partners/*`
- Never mix admin chrome into customer or agency shells

---

## 0. Frontend status — what remains

### Honest inventory (Jul 2026)

| Surface | Status in `wheelio-frontend` | Notes |
|---|---|---|
| Customer marketing + search + offer + checkout | **Built** (demo) | Home, search, cars, checkout, confirmation |
| Customer post-booking + trips | **Built** (demo) | Manage, schedule, voucher, docs, payments, messages, modify, pickup, return, review, claim, find booking |
| Customer account + auth | **Built** (demo) | Login/signup/magic/reset, profile, drivers, prefs, security, privacy, payments, claim, welcome, saved |
| Content / trust pages | **Built** | Help, FAQ, how-it-works, locations, agencies public, reviews hub, guides, about, legal |
| Partner funnel | **Built** (demo) | `/partners`, FAQ, join, join success |
| Agency portal | **Built** (demo) | Full `/agency/*` ops: inbox, bookings day-of, fleet, rates, calendar, branches, policies, payouts, team, settings, onboarding |
| **Wheelio admin dashboard** | **Not built** | No `/admin` routes, no admin shell, no staff MFA UI |

**Conclusion:** the only major frontend product surface still missing is the **Wheelio admin dashboard**. This document plans it end-to-end.

### What admin must control (because customer + agency already exist)

Admin is the **control plane** for surfaces that already have UI:

| Already in product | Admin owns |
|---|---|
| `/partners/join` applications | Review, request docs, approve → live, reject, pause |
| Agency verification chip (`draft` / `review` / `live` / `paused` / `suspended`) | Transition + reason + audit |
| Agency Instant vs request-to-book | Unlock / lock Instant from quality gates |
| Commission tier 10% / 12% | Assign launch / standard / volume; freeze on bookings |
| Public `/agencies/[slug]` | Approve profile edits; force hide suspended agencies |
| Search offers from fleet + rates | Hide vehicles, force photo quality, category map |
| Customer bookings `/bookings/[id]` | Support override, cancel/refund escalation, thread with both sides |
| Agency inbox SLA / expired requests | Monitor breaches; coach or restrict agency |
| Customer claims `/bookings/[id]/claim` + agency issues | Case queue, decisions, deposit disputes |
| Reviews | Moderate, hide, respond as Wheelio if needed |
| Locations / guides / FAQ / help articles | CMS publish |
| Payouts agency sees | Batch generation, hold, release, dispute |
| Promotions / featured uplift | Create campaigns; label sponsored in search |
| Legal policy pages | Version publish dates (content ops) |

### Product truth from master plan (must drive UI)

Admin MVP (plan §7):

```text
Approve agencies, branches, vehicles, and content
  → manage bookings and support cases
  → configure commissions and reconciliation
  → handle cancellation / refund workflows
  → manage locations, categories, policies, promotions, audit logs
  → basic marketplace analytics
```

Agency journey admin gates (plan §10):

```text
Partner applies
  → Wheelio verifies / countersigns
  → agency onboards supply
  → Wheelio activates “live”
  → marketplace sells
  → ops support during trip
  → reconcile payout
  → quality coach / restrict / suspend
```

Finance (plan §13 + partner pricing): ledger not a boolean · deposit never in commission · 12% standard take rate · admin can adjust with audit + dual control for large amounts.

Booking integrity (plan §9): holds, SLA, no double-booking, immutable snapshots — admin tools must **not** silently rewrite historical money lines without an adjustment entry.

---

## 1. Information architecture (full admin map)

```text
ADMIN AUTH
  /admin/login
  /admin/mfa                              (TOTP / backup codes — required for finance)
  /admin/forgot-password
  /admin/reset-password
  /admin/logout

ADMIN HOME
  /admin                                  (ops command center)
  /admin/notifications                    (staff activity feed)
  /admin/search                           (global lookup: booking ref, phone, agency, plate)

PARTNERS / AGENCIES
  /admin/applications                     (partner join queue)
  /admin/applications/[id]                (review dossier + decide)
  /admin/agencies                         (all agencies list)
  /admin/agencies/[agencyId]              (agency command center)
  /admin/agencies/[agencyId]/documents    (compliance vault)
  /admin/agencies/[agencyId]/contract     (tier, signed docs, amendments)
  /admin/agencies/[agencyId]/quality      (scorecard + Instant gate)
  /admin/agencies/[agencyId]/branches
  /admin/agencies/[agencyId]/fleet
  /admin/agencies/[agencyId]/rates
  /admin/agencies/[agencyId]/payouts
  /admin/agencies/[agencyId]/staff        (agency staff directory — read/intervene)
  /admin/agencies/[agencyId]/notes        (internal partner-success notes)

SUPPLY & CATALOG
  /admin/vehicles                         (cross-agency vehicle queue / flags)
  /admin/vehicles/[vehicleId]
  /admin/categories                       (marketplace category taxonomy)
  /admin/locations                        (pickup hubs / city pages)
  /admin/locations/new
  /admin/locations/[slug]
  /admin/fees-catalog                     (airport / young driver fee definitions)

BOOKINGS & SUPPORT
  /admin/bookings                         (marketplace-wide bookings)
  /admin/bookings/[id]                    (same booking id as customer + agency)
  /admin/bookings/[id]/timeline
  /admin/bookings/[id]/money              (ledger lines + adjustments)
  /admin/bookings/[id]/messages           (triad: customer · agency · Wheelio)
  /admin/bookings/[id]/override           (status / allocation override — audited)
  /admin/cases                            (support case queue)
  /admin/cases/new
  /admin/cases/[caseId]
  /admin/claims                           (customer claims + agency issues merged)
  /admin/claims/[claimId]
  /admin/sla                              (expiring request-to-book & response breaches)

FINANCE
  /admin/finance                          (finance home)
  /admin/finance/ledger                   (marketplace ledger)
  /admin/finance/payouts                  (payout batches)
  /admin/finance/payouts/new
  /admin/finance/payouts/[payoutId]
  /admin/finance/refunds                  (refund queue)
  /admin/finance/refunds/[refundId]
  /admin/finance/invoices                 (Wheelio → agency invoices)
  /admin/finance/commissions              (tier config + exceptions)
  /admin/finance/reconciliation           (period close)

GROWTH & CMS
  /admin/promotions                       (codes, featured uplift)
  /admin/promotions/new
  /admin/promotions/[promoId]
  /admin/content                          (CMS hub)
  /admin/content/guides
  /admin/content/guides/[slug]
  /admin/content/help
  /admin/content/faq
  /admin/content/reviews                  (moderation)
  /admin/content/reviews/[reviewId]
  /admin/content/legal                    (terms / privacy versions)

CUSTOMERS
  /admin/customers                        (customer directory)
  /admin/customers/[userId]
  /admin/customers/[userId]/bookings
  /admin/customers/[userId]/risk          (fraud flags, chargebacks)

ANALYTICS
  /admin/analytics                        (marketplace KPIs)
  /admin/analytics/supply
  /admin/analytics/demand
  /admin/analytics/quality
  /admin/analytics/finance

PLATFORM
  /admin/staff                            (Wheelio employees)
  /admin/staff/invite
  /admin/staff/[staffId]
  /admin/settings                         (org settings)
  /admin/settings/security                (SSO/MFA policy)
  /admin/audit                            (immutable audit log browser)
  /admin/feature-flags                    (demo / gradual rollout)
  /admin/dev/emails                       (link to /dev/emails or mirror)
```

**Canonical rules**
1. One booking truth across three UIs: customer `/bookings/[id]` · agency `/agency/bookings/[id]` · admin `/admin/bookings/[id]` — **same id**.
2. Admin money changes create **adjustment ledger rows**; they never silently rewrite snapshot totals.
3. Deposit always separate from commission math in every admin screen.
4. Destructive actions (suspend agency, force cancel, release payout) require reason + confirm + audit.
5. Support agents can message both sides; finance actions are role-gated + MFA for large amounts.

---

## 2. Shared design rules (admin portal)

1. **Control-plane density** — denser than agency portal; still Wheelio monochrome (no purple SaaS admin cliché).
2. **Queue-first** — home and section hubs lead with “needs decision now”, not vanity charts.
3. **Deep links everywhere** — booking ref, agency trade name, customer phone open the right command center in one click.
4. **Money triad always labeled:** Customer listed · Agency net · Wheelio commission · Deposit (memo).
5. **Role + MFA aware** — hide finance write for support; require MFA step-up for payouts / tier changes.
6. **Audit strip** — every detail page ends with “Recent admin actions” (who / when / what).
7. **Impersonation caution** — “View as agency” / “View as customer” opens read-only preview with bright banner; no silent write.
8. **Empty / loading / error / forbidden / dual-control pending** on every data page.
9. **Demo mode banner** until real auth: “Admin preview — demo data, not live money”.
10. **EN / FR only** (no Arabic platform); Tunisian phone (+216) and TND formatting.

### Creation prompt — Admin shell

```text
Design the shared Wheelio TN AdminShell for all /admin/* authenticated pages.

Monochrome black/white/zinc, Host Grotesk, light+dark, rectangular controls rounded-[7–8px].
Desktop: left sticky sidebar + top utility bar.
Sidebar sections:
- Home
- Applications (badge)
- Agencies
- Bookings · Cases · Claims · SLA
- Finance (payouts, refunds, ledger)
- Vehicles · Categories · Locations
- Promotions · Content · Reviews
- Customers
- Analytics
- Staff · Audit · Settings

Top bar: global search (ref / phone / email / plate / agency), environment chip (Demo | Staging | Live), notification bell, staff avatar, theme toggle.
Mobile: bottom nav (Home · Queues · Bookings · Finance · More) + sheet for secondary.
Show staff role chip: Super · Partner success · Support · Finance · Content.
Persistent demo banner until live auth.
Accessible focus rings, skip link, skeleton loaders.
Never reuse AgencyShell or customer AccountShell — this is denser marketplace ops UI.
```

---

## 3. Roles & permissions (UI gating)

| Role | Typical access |
|---|---|
| `super` | Everything including staff invites, feature flags, destructive overrides |
| `partner_success` | Applications, agencies, quality, Instant gates, contracts, notes |
| `support` | Bookings, cases, claims, messages, SLA; read finance; limited overrides |
| `finance` | Ledger, payouts, refunds, invoices, commissions, reconciliation |
| `content` | Guides, help, FAQ, locations copy, review moderation, legal versions |
| `readonly_analyst` | Analytics + read-only lists; no writes |

### Dual control (UI)

For: payout release ≥ threshold, commission tier permanent change, agency suspend, force booking cancel with refund.

Flow: requester submits → second approver confirms on `/admin/.../approve` panel → audit both signatures.

### Creation prompt — Admin RBAC

```text
Specify Wheelio TN admin RBAC for the portal UI.

Roles: super, partner_success, support, finance, content, readonly_analyst.
Every page documents: who can view / edit / approve.
Show “You don’t have access” with ask-super CTA — never a blank crash.
Step-up MFA modal before finance writes and suspend actions.
Demo: seed one of each role so permission differences are visible.
```

---

## 4. Admin auth (`/admin/login`, `/admin/mfa`)

**Priority:** P0  
**Status:** Missing

### Job
Only Wheelio employees sign in. Separate from customer and agency auth.

### UI
- Work email + password
- MFA required after password for finance / super (demo: any 6-digit code)
- Clear exits: “Agency portal → /agency/login”, “Customer → /login”
- Session timeout warning for finance roles

### Creation prompt — Admin login

```text
Build /admin/login and /admin/mfa for Wheelio TN staff.

Monochrome, Host Grotesk, light+dark.
Demo: accept seeded emails (admin@wheelio.tn, support@wheelio.tn, finance@wheelio.tn) with password 4+ chars, then MFA 000000.
Never share cookies/session keys with customer or agency demos.
Redirect ?next= safely within /admin only.
```

---

## 5. Home — ops command center (`/admin`)

**Priority:** P0  
**Status:** Missing

### Job
Answer: “What needs a Wheelio human in the next few hours?”

### UI sections
1. **Queues strip** — Applications pending · Cases open · Claims open · SLA breaches · Payouts awaiting release · Reviews flagged
2. **Today risk** — agencies with Instant at risk, bookings stuck in `payment_pending` / `held`, no-shows today
3. **Money pulse** — GMV (excl. deposit) 7d · commission accrued · payouts due · refunds open
4. **Supply pulse** — new agencies live · vehicles awaiting photo QA · locations unpublished
5. **Shortcuts** — Global search, New case, Create payout batch, Moderate reviews

### Creation prompt — Admin home

```text
Create /admin home as a Wheelio marketplace command center.

Queue-first, not dashboard-vanity. Each queue tile shows count + oldest age + CTA.
Money pulse must exclude deposits and show take-rate context (12% standard).
Deep-link every row into the correct admin detail page.
Role-aware: finance sees payout urgency; support sees cases/claims; partner success sees applications.
```

---

## 6. Global search (`/admin/search`)

**Priority:** P0  
**Status:** Missing

### Job
Find anything from one box: `WTN-######`, phone, email, plate, agency trade name, customer name.

### UI
- Typeahead groups: Bookings · Agencies · Customers · Vehicles · Cases
- Recent searches
- Exact ref match jumps straight to booking command center

### Creation prompt — Global search

```text
Build /admin/search with grouped results and keyboard focus.

Booking results show status + agency + pickup time.
Agency results show verification chip + tier.
Empty state teaches formats: WTN-123456, +216…, plate.
```

---

## 7. Partner applications (`/admin/applications`, `/admin/applications/[id]`)

**Priority:** P0  
**Status:** Missing  
**Feeds from:** `/partners/join` → stored application (demo: `wheelio-partner-application`)

### Job
Turn a join form into a verified agency or a clear rejection.

### Application list filters
- Status: new · docs requested · in review · approved · rejected · withdrawn
- City / airport focus
- Age in queue
- Assigned partner-success owner

### Application detail dossier
- Legal name, trade name, tax ID, contacts
- Branches planned, fleet size estimate
- Uploaded docs checklist (RC, insurance, fleet auth) — approve / request re-upload
- Contract preview (12% standard, launch notes)
- Decision panel: Approve → create agency draft · Request docs · Reject (reason codes) · Assign owner

### Creation prompt — Applications queue

```text
Build Wheelio admin partner application review.

List + detail. Approving creates /admin/agencies/[id] in verification=review or live (choose),
and unlocks agency onboarding for that partner.
Rejection reasons are structured (incomplete docs, unserviceable city, compliance).
Show the exact join payload the partner submitted. Audit every decision.
```

---

## 8. Agency command center (`/admin/agencies`, `/admin/agencies/[agencyId]`)

**Priority:** P0  
**Status:** Missing

### Job
Operate one partner end-to-end: status, quality, contract, supply health, money, notes.

### List columns
Trade name · city · verification · tier (10/12) · Instant yes/no · open SLA breaches · GMV 30d · quality score · last active

### Agency overview tabs / sections
- Summary (status, contacts, public slug → `/agencies/[slug]`)
- Verification actions: Live · Pause · Suspend (reason required)
- Quality scorecard + Instant unlock/lock
- Contract & commission tier
- Branches / fleet / rates (read + flag)
- Bookings snapshot
- Payouts snapshot
- Staff directory (agency users)
- Internal notes (partner success only)
- Audit

### Mapping to agency portal statuses

| Admin action | Agency portal effect | Customer effect |
|---|---|---|
| Set `live` | Portal unlocks go-live; listings eligible | Agency appears in search when supply ready |
| Set `paused` | Soft lock new Instant; warn banner | Soft-hide or mark unavailable |
| Set `suspended` | Hard lock portal write | Force-hide public profile + offers |
| Unlock Instant | Booking mode Instant available | Instant badge on offers |
| Lock Instant | Force request-to-book | Remove Instant badge |
| Change tier | New bookings use new take rate | Snapshot old bookings unchanged |

### Creation prompt — Agency admin detail

```text
Build /admin/agencies list + [agencyId] command center.

Verification chip controls with confirm modals and mandatory reason.
Quality panel explains Instant gates (acceptance, response time, agency cancels, complaints, reviews).
Contract panel shows launch/standard/volume and 95→~108 example; tier change warns about snapshot immutability.
“Open agency portal (read-only preview)” and “Open public profile” links.
Never allow editing agency banking numbers without finance role + MFA.
```

---

## 9. Agency documents & contract (`.../documents`, `.../contract`)

**Priority:** P0–P1  
**Status:** Missing

### Documents vault
- Doc types: company registration, tax, insurance, fleet authorization, ID of signatory
- States: missing · uploaded · approved · rejected · expired
- Expiry calendar for insurance

### Contract
- Signed Partner Marketplace Agreement version
- Commission tier history
- Amendments (featured uplift, custom fees)
- Download countersigned PDF stub

### Creation prompt — Compliance vault

```text
Create admin document vault and contract pages per agency.

Approve/reject each file with notes visible to agency onboarding documents step.
Insurance expiry raises a home-queue item 30/14/7 days before.
```

---

## 10. Quality & Instant gates (`/admin/agencies/[agencyId]/quality`)

**Priority:** P1  
**Status:** Missing

### KPIs (align agency reports)
- Acceptance rate
- Median response time
- Agency-initiated cancel rate
- Inventory accuracy / vehicle match complaints
- Review score
- SLA miss count

### Actions
- Coach note (email template)
- Restrict to request-to-book
- Pause Instant
- Pause listings
- Suspend

### Creation prompt — Quality admin

```text
Build agency quality scorecard for Wheelio admins.

Show thresholds and current values. One primary recommended action.
Explain impact on customer Instant badge and agency /settings/booking-mode.
```

---

## 11. Vehicles & categories (`/admin/vehicles`, `/admin/categories`)

**Priority:** P1  
**Status:** Missing

### Job
Protect search quality. Flag bad photos, wrong category, unsafe listings.

### Vehicle queue flags
- Missing photos
- Low photo count
- Category mismatch
- Plate conflict
- Hidden by agency vs forced-hidden by Wheelio

### Categories taxonomy
- Marketplace categories used on `/cars/types` and search filters
- Map agency free-text categories → canonical types
- “Or similar” pool rules

### Creation prompt — Supply QA

```text
Build cross-agency vehicle moderation and category taxonomy admin.

Force-hide removes offer from /search without deleting agency fleet row.
Agency sees reason in fleet status. Audit every hide/unhide.
```

---

## 12. Locations CMS (`/admin/locations`)

**Priority:** P1  
**Status:** Missing  
**Powers:** `/locations`, `/locations/[slug]`, search pickup hubs

### Job
Maintain Tunis airport, city desks, delivery zones copy and geo metadata.

### UI
- List published / draft locations
- Editor: name, slug, hero, tips, linked agencies count, map pin stub
- Publish / unpublish

### Creation prompt — Locations admin

```text
Build /admin/locations CMS for Wheelio TN.

Publishing updates customer /locations/[slug]. Show broken-link warnings if slug changes.
Keep monochrome editorial layout, not a heavy CMS theme.
```

---

## 13. Bookings — marketplace list (`/admin/bookings`)

**Priority:** P0  
**Status:** Missing

### Job
See every reservation across agencies. Support and finance start here.

### Filters
Status · confirmation type · agency · branch · payment mode · date range · SLA at risk · has open case/claim

### Row
Reference · status · customer · agency · pickup · listed / net / commission · deposit · deep links

### Creation prompt — Admin bookings list

```text
Create /admin/bookings with dense filterable table and CSV export for finance.

Use same status vocabulary as customer and agency (requested, held, payment_pending, confirmed, active, completed, cancelled, expired, rejected, no_show).
Highlight SLA-critical requested rows.
```

---

## 14. Booking command center (`/admin/bookings/[id]`)

**Priority:** P0  
**Status:** Missing

### Job
Single place for Wheelio to understand and intervene on one trip.

### UI blocks
1. Header: reference, status, Instant/request, agency, customer contacts
2. Next-risk banner (SLA, stuck payment, open claim, no-show window)
3. Money triad + deposit callout + payment mode
4. Trip facts: category, plate (if assigned), branch, pickup/return, extras, flight
5. Timeline (customer + agency + admin events merged)
6. Messages triad entry
7. Linked case/claim chips
8. Actions (role-gated): open override · open refund · add internal note · message both sides · view as customer · view as agency (read-only)

### Creation prompt — Admin booking detail

```text
Build /admin/bookings/[id] as the marketplace booking command center.

Same booking id as /bookings/[id] and /agency/bookings/[id].
Show immutable price snapshot + any later adjustments separately.
Deposit never rolls into commission widgets.
Provide clear CTAs into money, messages, override, and claims.
```

---

## 15. Booking money & adjustments (`/admin/bookings/[id]/money`)

**Priority:** P0  
**Status:** Missing

### Ledger lines (must match product truth)
- Customer listed total (snapshot)
- Wheelio commission (take rate at confirm)
- Agency net
- Online collected
- Desk rental due
- Deposit (memo only — excluded)
- Refunds
- Manual adjustments (with reason codes)
- Payout inclusion status

### Adjustment reasons
Goodwill · policy exception · fraud write-off · fee correction · currency rounding · other (text)

### Creation prompt — Admin booking money

```text
Build booking money page for Wheelio finance/support.

Creating an adjustment appends a ledger row; it does not edit the original snapshot fields.
Require reason + optional dual control above threshold.
Show payout batch link if included.
```

---

## 16. Messages triad (`/admin/bookings/[id]/messages`)

**Priority:** P0  
**Status:** Missing

### Job
Wheelio can read and write in the customer–agency thread, and post internal-only notes.

### UI
- Tabs or filters: All · Customer-visible · Agency-visible · Internal
- Templates: delay apology, desk directions, docs request, refund update
- Desk-hours honesty in templates (no fake 24/7)

### Creation prompt — Admin messages

```text
Build admin messaging on a booking.

Internal notes never send to customer/agency.
Staff signature shows Wheelio Support / Partner Success role.
Link out to create a case from a message.
```

---

## 17. Status override (`/admin/bookings/[id]/override`)

**Priority:** P1  
**Status:** Missing

### Job
Rare, audited status/allocation fixes when systems or agencies fail.

### Allowed transitions (guarded)
- Force confirm after payment proof
- Force cancel (customer or agency fault) + inventory release
- Mark no-show
- Reassign vehicle / category with conflict check
- Extend hold briefly

### UI
- Current → proposed status
- Side effects checklist (notify customer, notify agency, release car, start refund draft)
- Reason (required)
- Confirm + audit

### Creation prompt — Override

```text
Build booking override tool with maximum friction for safety.

Show side effects before confirm. Block illegal transitions.
Super/support only; finance required if refund draft created.
```

---

## 18. Support cases (`/admin/cases`)

**Priority:** P0  
**Status:** Missing

### Job
Track work that is not yet a formal claim (questions, desk confusion, failed Instant, etc.).

### Case fields
Subject · linked booking and/or agency and/or customer · priority · status (open / waiting / resolved) · owner · channel (email, in-app, phone) · tags

### Creation prompt — Cases

```text
Build /admin/cases queue and detail.

SLA clocks on open cases. Relate multiple bookings if needed.
Resolution requires outcome code. Create claim from case when money/dispute appears.
```

---

## 19. Claims & disputes (`/admin/claims`, `/admin/claims/[claimId]`)

**Priority:** P0  
**Status:** Missing  
**Feeds from:** customer `/bookings/[id]/claim` · agency `/agency/bookings/[id]/issue`

### Claim types
No-show · late · vehicle mismatch · breakdown · accident · deposit dispute · overcharge · fraud suspicion · agency cancel after confirm

### Decision outcomes
Uphold customer · uphold agency · split · goodwill refund · escalate legal · close no action

### UI
- Evidence gallery (uploads stubs)
- Money impact calculator (refund vs commission clawback vs deposit hold)
- Notify both sides templates

### Creation prompt — Claims admin

```text
Build Wheelio claims console merging customer claims and agency issues.

Always show deposit separately from trip refund math.
Commission clawback creates finance adjustment, not a silent rewrite.
```

---

## 20. SLA monitor (`/admin/sla`)

**Priority:** P1  
**Status:** Missing

### Job
Catch request-to-book deadlines before they expire; review already-expired hits for quality coaching.

### UI
- Expiring < 2h
- Expired last 24h
- Agencies with repeated misses
- One-click: message agency · open booking · restrict Instant

### Creation prompt — SLA admin

```text
Create /admin/sla focused on agency response deadlines.

Sort by time left. Deep-link to agency quality and booking accept pages (agency portal) as reference, but admin acts from admin UI.
```

---

## 21. Finance home & ledger (`/admin/finance`, `/admin/finance/ledger`)

**Priority:** P0  
**Status:** Missing

### Finance home cards
- Commission accrued (period)
- Payouts scheduled / held / paid
- Refunds open
- Unreconciled adjustments
- Deposit memo total (informational only)

### Ledger
Chronological marketplace movements in TND: booking confirm commissions, refunds, payouts, fees, adjustments.

### Creation prompt — Finance home

```text
Build /admin/finance hub and ledger.

Every amount labeled. Filters by agency, booking, type, period.
Export CSV. Deposit memo filter clearly marked “excluded from GMV”.
```

---

## 22. Payout batches (`/admin/finance/payouts`)

**Priority:** P0  
**Status:** Missing  
**Mirrors:** agency `/agency/payouts`

### Job
Create, review, hold, and release payouts to agencies.

### Batch detail
- Period label
- Included booking lines (net, commission, listed)
- Fees / clawbacks
- Net payable
- Bank hint (last4 only)
- Status: draft · pending approval · scheduled · paid · failed · held

### Creation prompt — Admin payouts

```text
Build payout batch tools for Wheelio finance.

Creating a batch pulls completed bookings not yet paid.
Hold reasons required. Release requires MFA for finance role.
Agency portal payout detail must show the same period and totals.
```

---

## 23. Refunds (`/admin/finance/refunds`)

**Priority:** P0  
**Status:** Missing

### Job
Execute customer refunds from policy or claim decisions; adjust commission if needed.

### UI
- Queue: requested · approved · sent · failed
- Policy calculator stub (cancellation policy page rules)
- Linked booking + claim
- Commission impact preview

### Creation prompt — Refunds

```text
Build refund queue and detail.

Show customer-facing refund amount vs agency clawback vs Wheelio absorbs.
Never include deposit release inside “refund of rent” unless explicitly chosen as separate action.
```

---

## 24. Commissions config (`/admin/finance/commissions`)

**Priority:** P1  
**Status:** Missing  
**Source of truth:** `lib/partner-pricing.ts`

### UI
- Global defaults: launch 10% · standard **12%** · volume 10%
- Featured uplift optional +2%
- Per-agency exceptions list
- Eligibility rules copy for volume (≥ ~30 confirmed / month + SLA)
- Worked example: net 95 → listed ~108 at 12%

### Creation prompt — Commissions admin

```text
Build commissions configuration UI reflecting PARTNER_PRICING.

Changing global defaults does not rewrite historical booking snapshots.
Per-agency exception requires reason + audit (+ dual control if permanent).
```

---

## 25. Reconciliation (`/admin/finance/reconciliation`)

**Priority:** P2  
**Status:** Missing

### Job
Period close: GMV, commission, payouts, refunds, payment fees, contribution margin.

### UI
- Period picker
- Totals vs ledger
- Exception list (unbatched completed trips, failed payouts)
- Lock period (super/finance)

### Creation prompt — Reconciliation

```text
Create a simple period reconciliation screen.

Use contribution margin language from the master plan.
Keep charts monochrome. Export pack stub.
```

---

## 26. Customers (`/admin/customers`)

**Priority:** P1  
**Status:** Missing

### Job
Support lookup and light risk review for travellers.

### Detail
- Profile fields (from `/account/profile`)
- Bookings list
- Saved drivers count (no raw licence images in MVP admin unless support needs — blur stub)
- Risk flags: chargeback, multi-claim, velocity
- Actions: reset password link, force logout sessions, note

### Creation prompt — Customers admin

```text
Build customer directory and detail for Wheelio support.

Privacy-first: mask email/phone partially in lists; full on detail with audit when copied.
Do not expose payment PAN — tokens only.
```

---

## 27. Promotions (`/admin/promotions`)

**Priority:** P2  
**Status:** Missing

### Job
Codes, percent/amount off, agency-specific campaigns, featured uplift (sponsored).

### Rules
- Sponsored results must be labelable in customer search UI
- Stacking rules simple for MVP
- Budget / max redemptions

### Creation prompt — Promotions

```text
Build promotions admin.

Creating a featured uplift links to partner-pricing featuredUpliftPercent concept.
Preview how a search card would show “Sponsored”.
```

---

## 28. Content CMS & review moderation

**Priority:** P1–P2  
**Status:** Missing  
**Powers:** `/guides`, `/help`, `/faq`, `/reviews`, legal pages

### Content hub
- Guides CRUD
- Help articles CRUD
- FAQ CRUD
- Legal version notes (publish date)

### Reviews moderation
- List newest / flagged / hidden
- Hide / restore
- Link to booking and agency
- Optional Wheelio public reply (rare)

### Creation prompt — Content & reviews

```text
Build light CMS + review moderation for Wheelio admin.

Not a full headless CMS — enough to publish guides/help/FAQ and moderate /reviews.
Hidden reviews disappear from agency public profile and reviews hub.
```

---

## 29. Analytics (`/admin/analytics`)

**Priority:** P1  
**Status:** Missing

### MVP KPIs
- Searches → offer views → checkouts → confirmed bookings
- GMV excl. deposit · take rate realized · contribution margin estimate
- Supply: live agencies, ready vehicles, Instant share
- Quality: acceptance, response time, agency cancel rate
- Geography: Tunis airport vs city mix
- Payment mix: desk vs online deposit

### Creation prompt — Analytics

```text
Build /admin/analytics with monochrome charts and plain-language KPI definitions.

No fake-perfect percentages. Demo data messy on purpose.
Role readonly_analyst lands here by default.
```

---

## 30. Staff, audit, settings

**Priority:** P1  
**Status:** Missing

### Staff
Invite Wheelio employees, assign admin roles, deactivate.

### Audit log browser (`/admin/audit`)
Filter by actor, entity (booking/agency/payout), action, date. Immutable.

### Settings
- Org contacts (partners@, support@)
- Payout threshold for dual control
- Default SLA hours for request-to-book
- Feature flags (demo Instant, SMS on/off)

### Creation prompt — Platform admin

```text
Build staff management, audit browser, and org settings.

Audit entries are append-only in demo (localStorage).
Feature flags clearly labeled as non-production when demo.
```

---

## 31. Cross-surface workflows (must stay consistent)

### A. Partner apply → live

```text
Customer-facing: /partners/join submit
Admin: /admin/applications/[id] approve
Admin: agency verification → live
Agency: /agency/onboarding complete
Admin (optional): Instant unlock later
Customer: offers appear on /search and /agencies/[slug]
```

### B. Request-to-book

```text
Customer: checkout → status requested
Agency: /agency/inbox accept/decline (SLA)
Admin: /admin/sla monitors; /admin/bookings/[id] if stuck
Customer + agency booking ids identical
```

### C. Cancellation / refund

```text
Customer: modify/cancel or claim
Agency: may issue
Admin: /admin/claims + /admin/finance/refunds
Ledger adjustments; inventory release; notifications both sides
```

### D. Payout

```text
Trips complete on agency return flow
Admin: create payout batch
Agency: sees /agency/payouts
Admin: release → paid
```

### E. Quality restrict

```text
Admin quality action → Instant locked
Agency /settings/booking-mode shows locked reason
Customer Instant badges removed on that agency’s offers
```

---

## 32. Status model (admin-facing)

Align with `lib/bookings.ts` / agency statuses.

| Status | Admin focus |
|---|---|
| `requested` | SLA monitor; intervene if agency silent |
| `held` | Hold expiry; payment issues |
| `payment_pending` | Customer pay friction; support |
| `confirmed` | Watch agency prepare; day-of risk |
| `active` | On-rent support; breakdown claims |
| `completed` | Payout eligibility; review moderation |
| `cancelled` | Refund path; fault attribution |
| `expired` | Quality hit on agency |
| `rejected` | Customer recovery / alternative offer (future) |
| `no_show` | Policy money + free inventory |

Agency verification (admin-controlled): `draft` → `review` → `live` → (`paused` \| `suspended`).

---

## 33. Commission & money rules (admin UI must never lie)

| Tier | Take rate | When |
|---|---|---|
| Launch | 10% | First 90 days or first ~20 agencies |
| Standard | **12%** (recommended) | Default |
| Volume | 10% | ≥ ~30 confirmed bookings/month + SLA |

Formulas:
- `listed = round(net / (1 - takeRate))`
- `commission = listed × takeRate` (equiv. `listed - net`)
- Deposit **excluded** from GMV and commission
- Booking snapshot freezes tier/rate at confirmation
- Admin adjustments are **new ledger rows**

Show on: finance home, booking money, payouts, commissions config, agency contract, analytics.

---

## 34. Demo data model (local UI)

```ts
// Suggested wheelio-frontend/lib/admin.ts (demo)
type AdminRole =
  | "super"
  | "partner_success"
  | "support"
  | "finance"
  | "content"
  | "readonly_analyst"

type AdminSession = {
  staffId: string
  email: string
  name: string
  role: AdminRole
  mfaOk: boolean
}

type PartnerApplication = {
  id: string
  status: "new" | "docs_requested" | "in_review" | "approved" | "rejected"
  tradeName: string
  legalName: string
  city: string
  email: string
  phone: string
  fleetSizeEstimate: number
  submittedAt: string
  assignedTo?: string
}

type AdminCase = {
  id: string
  subject: string
  status: "open" | "waiting" | "resolved"
  priority: "low" | "normal" | "high"
  bookingId?: string
  agencyId?: string
  customerId?: string
  ownerStaffId?: string
}

type AdminClaim = {
  id: string
  type: string
  status: "open" | "decided" | "closed"
  bookingId: string
  source: "customer" | "agency" | "wheelio"
  decision?: string
}

type AdminPayoutBatch = {
  id: string
  agencyId: string
  periodLabel: string
  status: "draft" | "pending_approval" | "scheduled" | "paid" | "held" | "failed"
  netPayableTnd: number
  commissionTnd: number
  bookingIds: string[]
}

type AdminWorkspace = {
  applications: PartnerApplication[]
  cases: AdminCase[]
  claims: AdminClaim[]
  payoutBatches: AdminPayoutBatch[]
  audit: { at: string; actor: string; action: string; entity: string }[]
}
```

**Seed suggestions**
- 3 applications (new, docs_requested, in_review)
- Reuse demo agency Carthage Drive from `lib/agency.ts` as a live agency under admin
- 2–3 other agencies (paused, review)
- Bookings spanning statuses (same ids as customer demo where possible)
- 2 open cases, 2 claims, 1 payout draft, 1 payout scheduled
- Staff users for each admin role

Persist demo edits in `localStorage` keys namespaced `wheelio-admin-*`.  
Optionally **read** `wheelio-agency-*` and `wheelio-partner-application` so admin demos reflect agency/partner actions in the same browser.

---

## 35. State matrix (every admin page)

| State | UI requirement |
|---|---|
| Loading | Skeletons matching final layout |
| Empty | One sentence + primary CTA |
| Error | Retry + internal escalate |
| Forbidden (role) | Explain + ask super |
| MFA required | Step-up modal, return to action |
| Dual-control pending | Waiting on approver banner |
| Demo | Top banner, no real money movement |
| Impersonation preview | Bright “read-only preview” banner |

---

## 36. Priority build order (sprints)

### Sprint W0 — Shell & access (P0)
1. `AdminShell` + `lib/admin-session.ts` + `lib/admin.ts` demo workspace
2. `/admin/login` + `/admin/mfa` + `/admin/logout`
3. `/admin` home queues
4. `/admin/search` global lookup
5. `/admin/notifications` stub feed

### Sprint W1 — Partners go live (P0)
6. `/admin/applications` + detail decide flow
7. `/admin/agencies` + agency command center
8. Documents vault + contract/tier
9. Verification transitions (live / pause / suspend)
10. Wire join success → application appears in admin demo

### Sprint W2 — Bookings & support (P0)
11. `/admin/bookings` + `[id]` command center
12. Messages triad
13. `/admin/cases`
14. `/admin/claims`
15. `/admin/sla`
16. Booking money (read) + simple adjustment

### Sprint W3 — Finance (P0–P1)
17. `/admin/finance` + ledger
18. Payout batches create/hold/release
19. Refunds queue
20. Commissions config (read + per-agency exception)
21. MFA gate on release

### Sprint W4 — Supply & trust (P1)
22. Vehicles moderation + categories
23. Locations CMS
24. Quality / Instant gates UI
25. Reviews moderation
26. Customers directory

### Sprint W5 — Growth & platform (P2)
27. Promotions
28. Content CMS (guides/help/FAQ)
29. Analytics
30. Staff + audit + feature flags
31. Override tool + dual control polish
32. Reconciliation
33. FR strings pass (EN baseline; no AR)

---

## 37. Page map — admin portal only

| Route | Page | Priority | Status |
|---|---|---|---|
| `/admin/login` | Staff login | P0 | Built |
| `/admin/mfa` | MFA step-up | P0 | Built |
| `/admin/logout` | Logout | P0 | Built |
| `/admin` | Command center | P0 | Built |
| `/admin/search` | Global search | P0 | Built |
| `/admin/notifications` | Staff feed | P1 | Built |
| `/admin/applications` | Join queue | P0 | Built |
| `/admin/applications/[id]` | Application dossier | P0 | Built |
| `/admin/agencies` | Agencies list | P0 | Built |
| `/admin/agencies/[agencyId]` | Agency command center | P0 | Built |
| `/admin/agencies/[agencyId]/documents` | Compliance vault | P0 | Built |
| `/admin/agencies/[agencyId]/contract` | Contract & tier | P0 | Built |
| `/admin/agencies/[agencyId]/quality` | Quality / Instant | P1 | Built |
| `/admin/agencies/[agencyId]/branches` | Branches read/flag | P1 | Built |
| `/admin/agencies/[agencyId]/fleet` | Fleet read/flag | P1 | Built |
| `/admin/agencies/[agencyId]/rates` | Rates read | P1 | Built |
| `/admin/agencies/[agencyId]/payouts` | Agency payouts | P1 | Built |
| `/admin/agencies/[agencyId]/staff` | Agency staff | P2 | Built |
| `/admin/agencies/[agencyId]/notes` | Internal notes | P1 | Built |
| `/admin/vehicles` | Vehicle QA queue | P1 | Built |
| `/admin/vehicles/[vehicleId]` | Vehicle detail | P1 | Built |
| `/admin/categories` | Category taxonomy | P1 | Built |
| `/admin/locations` | Locations CMS | P1 | Built |
| `/admin/locations/new` | New location | P1 | Built |
| `/admin/locations/[slug]` | Edit location | P1 | Built |
| `/admin/fees-catalog` | Fee definitions | P2 | Built |
| `/admin/bookings` | All bookings | P0 | Built |
| `/admin/bookings/[id]` | Booking command center | P0 | Built |
| `/admin/bookings/[id]/timeline` | Full timeline | P1 | Built |
| `/admin/bookings/[id]/money` | Money + adjustments | P0 | Built |
| `/admin/bookings/[id]/messages` | Triad messages | P0 | Built |
| `/admin/bookings/[id]/override` | Audited override | P1 | Built |
| `/admin/cases` | Support cases | P0 | Built |
| `/admin/cases/new` | New case | P0 | Built |
| `/admin/cases/[caseId]` | Case detail | P0 | Built |
| `/admin/claims` | Claims queue | P0 | Built |
| `/admin/claims/[claimId]` | Claim decision | P0 | Built |
| `/admin/sla` | SLA monitor | P1 | Built |
| `/admin/finance` | Finance home | P0 | Built |
| `/admin/finance/ledger` | Ledger | P0 | Built |
| `/admin/finance/payouts` | Payout batches | P0 | Built |
| `/admin/finance/payouts/new` | Create batch | P0 | Built |
| `/admin/finance/payouts/[payoutId]` | Batch detail | P0 | Built |
| `/admin/finance/refunds` | Refunds | P0 | Built |
| `/admin/finance/refunds/[refundId]` | Refund detail | P0 | Built |
| `/admin/finance/invoices` | Agency invoices | P1 | Built |
| `/admin/finance/commissions` | Take-rate config | P1 | Built |
| `/admin/finance/reconciliation` | Period close | P2 | Built |
| `/admin/promotions` | Promos list | P2 | Built |
| `/admin/promotions/new` | Create promo | P2 | Built |
| `/admin/promotions/[promoId]` | Edit promo | P2 | Built |
| `/admin/content` | CMS hub | P1 | Built |
| `/admin/content/guides` | Guides | P2 | Built |
| `/admin/content/help` | Help articles | P2 | Built |
| `/admin/content/faq` | FAQ | P2 | Built |
| `/admin/content/reviews` | Review moderation | P1 | Built |
| `/admin/content/legal` | Legal versions | P2 | Built |
| `/admin/customers` | Customers | P1 | Built |
| `/admin/customers/[userId]` | Customer detail | P1 | Built |
| `/admin/analytics` | KPI home | P1 | Built |
| `/admin/analytics/supply` | Supply analytics | P2 | Built |
| `/admin/analytics/demand` | Demand analytics | P2 | Built |
| `/admin/analytics/quality` | Quality analytics | P2 | Built |
| `/admin/analytics/finance` | Finance analytics | P2 | Built |
| `/admin/staff` | Wheelio staff | P1 | Built |
| `/admin/staff/invite` | Invite staff | P1 | Built |
| `/admin/staff/[staffId]` | Staff detail | P1 | Built |
| `/admin/settings` | Org settings | P1 | Built |
| `/admin/settings/security` | MFA policy | P1 | Built |
| `/admin/audit` | Audit browser | P1 | Built |
| `/admin/feature-flags` | Flags | P2 | Built |

---

## 38. Acceptance criteria (admin MVP done when)

1. Wheelio staff can sign in on `/admin/login` (demo) with role-aware navigation.
2. A `/partners/join` application can be reviewed and approved into an agency record.
3. Agency verification can move to live / paused / suspended with audit + agency portal effect.
4. Any booking is findable by `WTN-` ref and opened in admin command center with money triad (deposit separate).
5. Support can open a case, message in the triad thread, and decide a claim.
6. Finance can draft a payout batch that matches what the agency would see under `/agency/payouts`.
7. Commission UI shows 12% standard and cannot silently rewrite old booking snapshots.
8. Destructive actions require reason; finance release requires MFA step-up (demo).
9. Admin chrome never appears on `/agency/*` or customer routes.
10. Light + dark contrast remains readable (zinc, not faint gray-on-gray).

---

## 39. Out of scope (admin UI — same as master plan)

- Native apps for admins
- AI pricing / damage recognition
- Full accounting suite / Tunisian tax filing automation
- Public partner API console (post-MVP)
- Real payment-provider settlement files (stub exports only in demo)
- Nationwide multi-country admin (Tunisia-first)

---

## 40. Implementation notes for Cursor / eng

1. New libs: `lib/admin.ts`, `lib/admin-session.ts` (mirror agency session patterns).
2. New components: `components/admin/admin-shell.tsx`, `components/admin/admin-kit.tsx` (reuse density patterns from `agency-kit`, do not import agency chrome).
3. Prefer linking demo workspaces: reading `wheelio-agency-workspace` and `wheelio-partner-application` makes end-to-end demos believable.
4. Keep Host Grotesk + monochrome tokens from the main app theme.
5. Update this file’s Status column as routes ship.
6. When admin ships, add cross-links from:
   - `WHEELIO_AGENCY_DASHBOARD_UIUX_PROMPTS.md` (verification / Instant / payouts owned by admin)
   - `WHEELIO_TN_PROJECT_PLAN.md` Admin MVP checklist

---

**End of admin planning doc.**  
Next build step when ready: Sprint W0 (`AdminShell` + login + home queues).
