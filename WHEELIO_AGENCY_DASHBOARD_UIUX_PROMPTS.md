# Wheelio TN — Agency Dashboard & Partner Portal (UI/UX Prompts)

**Product:** Tunisia-first multi-agency car rental marketplace  
**Scope:** Everything the **rental agency** needs after partner interest — onboarding, staff login, fleet, rates, availability, reservation inbox, day-of operations, payouts, quality, and settings.  
**Audience:** Agency owner, branch manager, reservation agent, fleet operator, accountant (not renters, not Wheelio admin CMS)  
**Currency:** TND · **Visual:** monochrome black / white / zinc · Host Grotesk · light + dark  
**Commission (locked for UI):** Standard **12%** of customer mandatory trip total (deposit excluded). Launch / volume **10%**. Worked example: agency net **95 TND** → listed **~108 TND**.

Use each **Creation prompt** as a design or coding brief. Keep prompts intact when generating screens.

**Related docs**
- Master plan: `WHEELIO_TN_PROJECT_PLAN.md`
- Customer marketplace: `WHEELIO_CLIENT_PAGES_UIUX_PROMPTS.md`
- Customer post-booking: `WHEELIO_POST_BOOKING_PAGES_UIUX_PROMPTS.md`
- Customer account/auth: `WHEELIO_USER_ACCOUNT_AUTH_UIUX_PROMPTS.md`
- Wheelio admin (control plane): `WHEELIO_ADMIN_DASHBOARD_UIUX_PROMPTS.md`
- Partner pricing source: `wheelio-frontend/lib/partner-pricing.ts`
- This file owns: **agency portal IA, pages, ops flows, sprints, demo model**

**Canonical route prefixes**
- Public partner funnel: `/partners/*` (join + pitch)
- Authenticated agency app: `/agency/*`
- Never mix agency chrome into customer `/account` or `/trips`

---

## 0. Audit — current frontend vs missing (honest inventory)

### Already built (thin / public only)

| Route / area | What exists today | Gaps for a real agency product |
|---|---|---|
| `/partners/join` | 3-step join form (agency details → portal access → contract agree) | No verification workflow UI, no status tracking after submit, no document upload vault, no multi-branch wizard |
| Partner contract paper | Articles + 12% commission example (95 → ~108) | Not countersigned PDF flow; no version history; no live contract in portal |
| `lib/partner-pricing.ts` | Take-rate model, scale scenarios | Pricing panel removed from join (by product choice); model not exposed inside dashboard |
| `lib/partner-contract.ts` | Contract copy | Portal “Agreements” page missing |
| Auth CTA on login/signup | “Join as a partner agency” | No agency staff login separate from customer |
| Public `/agencies`, `/agencies/[slug]` | Customer-facing directory | **Not** the private dashboard; no edit bridge from portal → public profile |
| Customer bookings | Full manage / schedule / voucher / messages / pickup / return | Agency **inbox** and agency-side booking tools do **not** exist |
| Customer account shell | `/account/*` | Agency needs its **own** shell (`AgencyShell`) |

### Explicitly not built (this document)

| Domain | Status |
|---|---|
| Agency staff auth (`/agency/login`) | Built |
| Agency home / ops dashboard | Built |
| Reservation inbox + accept/reject | Built |
| Agency booking detail & day-of tools | Built |
| Fleet CRUD + photos + allocation | Built |
| Rate plans / seasonal / fees | Built |
| Availability calendar + blocks | Built |
| Branches, desk hours, delivery zones | Built |
| Policies editor (mileage, cancel, deposit, fuel) | Built |
| Payouts / commission ledger | Built |
| Reports & quality score | Built |
| Staff roles & invite | Built |
| Agency messages / notifications | Built |
| Compliance documents vault | Built |
| Listing preview / public profile editor | Built |
| Instant vs request-to-book graduation | Built |

### Product truth from master plan (must drive UI)

Agency journey (plan §10):

```text
Verify/sign contract
  → add branches / fleet / rates / policies
  → maintain calendar
  → receive booking
  → accept / prepare
  → hand over / return
  → close booking
  → reconcile payout
```

Agency MVP (plan §7): secure login + roles · agency/branch/fleet · base/seasonal/weekend/duration pricing · availability + manual blocks · locations/delivery · policies · reservation inbox accept/reject · booking status + notifications · basic reports.

Booking integrity (plan §9): request-to-book vs instant · holds · response deadlines · no double-booking · cleaning/maintenance buffers.

Finance (plan §13 + partner pricing): ledger not a boolean · deposit never in commission · 12% standard take rate.

---

## 1. Information architecture (full portal map)

```text
PUBLIC PARTNER FUNNEL
  /partners                              (pitch / why join — optional marketing)
  /partners/join                         (application — EXISTS)
  /partners/join/success                 (post-submit status + next steps)
  /partners/pricing                      (optional; or keep pricing internal only)
  /partners/faq                          (partner FAQ)

AGENCY AUTH
  /agency/login
  /agency/forgot-password
  /agency/reset-password
  /agency/invite/[token]                 (accept staff invite)
  /agency/logout

ONBOARDING (gated until “go-live ready”)
  /agency/onboarding                     (checklist hub)
  /agency/onboarding/profile             (legal + trade + tax + banking)
  /agency/onboarding/documents           (upload RC, insurance, fleet auth)
  /agency/onboarding/branch              (first branch / desk)
  /agency/onboarding/fleet               (first 1–3 cars)
  /agency/onboarding/rates               (first rate plan)
  /agency/onboarding/policies            (deposit, mileage, cancel)
  /agency/onboarding/review              (request Wheelio activation)

AGENCY APP SHELL — daily ops
  /agency                                (home / today board)
  /agency/inbox                          (requests needing action)
  /agency/bookings                       (all reservations list)
  /agency/bookings/calendar              (ops calendar)
  /agency/bookings/[id]                  (booking command center)
  /agency/bookings/[id]/accept           (accept / reject / counter)
  /agency/bookings/[id]/prepare          (pre-pickup checklist)
  /agency/bookings/[id]/handover         (pickup / contract at desk)
  /agency/bookings/[id]/return           (return inspection + deposit)
  /agency/bookings/[id]/messages         (thread with customer + Wheelio)
  /agency/bookings/[id]/documents        (agency copies of PDFs)
  /agency/bookings/[id]/finance          (this booking money split)
  /agency/bookings/[id]/issue            (report problem / no-show / damage)

SUPPLY
  /agency/fleet                          (vehicle list)
  /agency/fleet/new
  /agency/fleet/[vehicleId]
  /agency/fleet/[vehicleId]/photos
  /agency/fleet/[vehicleId]/availability (per-car blocks)
  /agency/fleet/categories               (pooled “or similar” groups)
  /agency/rates                          (rate plans list)
  /agency/rates/new
  /agency/rates/[planId]
  /agency/rates/fees                     (airport, delivery, young driver, after-hours)
  /agency/rates/preview                  (net → listed @ 12% calculator)
  /agency/calendar                       (fleet-wide availability)
  /agency/calendar/blocks                (maintenance / owner use / cleaning)
  /agency/branches                       (branches list)
  /agency/branches/new
  /agency/branches/[branchId]
  /agency/branches/[branchId]/hours
  /agency/branches/[branchId]/delivery   (zones + fees)
  /agency/policies                       (hub)
  /agency/policies/cancellation
  /agency/policies/mileage
  /agency/policies/fuel
  /agency/policies/deposit
  /agency/policies/drivers               (age, licence, documents)
  /agency/policies/protection            (included / optional)

MONEY & QUALITY
  /agency/payouts                        (payout schedule + history)
  /agency/payouts/[payoutId]
  /agency/ledger                         (commission / GMV ledger)
  /agency/invoices                       (Wheelio invoices to agency)
  /agency/reports                        (ops + revenue reports)
  /agency/reports/quality                (scorecard)
  /agency/reviews                        (customer reviews about this agency)

PEOPLE & SETTINGS
  /agency/team                           (staff list)
  /agency/team/invite
  /agency/team/[memberId]
  /agency/notifications                  (activity feed)
  /agency/notifications/settings
  /agency/settings                       (agency profile, logo, languages)
  /agency/settings/public-profile        (what customers see on /agencies/[slug])
  /agency/settings/booking-mode          (request vs instant graduation)
  /agency/settings/contract              (partner agreement + commission tier)
  /agency/settings/security              (password, sessions, MFA later)
  /agency/help                           (agency help center)
  /agency/help/[article]
```

**Canonical rules**
1. One booking truth for agencies = `/agency/bookings/[id]` (customer truth remains `/bookings/[id]` — same booking id).
2. Supply edits never mutate historical booking snapshots.
3. Deposit always separate from trip total and commission math.
4. Desk-hours honesty — no fake 24/7 agency support claims.

---

## 2. Shared design rules (agency portal)

1. **Ops-first, not marketing** — denser than customer site; still monochrome Wheelio, not generic ERP purple.
2. **Today board** — every session lands on what needs action in the next 24–48h.
3. **SLA clocks** — request-to-book deadlines visible as countdown chips.
4. **Money triad always labeled:** Customer listed total · Agency net · Wheelio commission · Deposit (separate).
5. **Role-aware UI** — hide finance for reservation agents; hide team invites for non-owners.
6. **Mobile desk usable** — inbox + accept/reject + handover must work on phone at the airport desk.
7. **Conflict prevention UI** — overlapping allocation warnings before accept.
8. **Empty / loading / error / offline / read-only (suspended)** on every data page.
9. **Demo mode banner** until real auth: “Agency preview — demo data, not live bookings”.
10. **EN / FR only** (no Arabic platform); Tunisian phone (+216) and TND formatting.

### Creation prompt — Agency shell

```text
Design the shared Wheelio TN AgencyShell for all /agency/* authenticated pages.

Monochrome black/white/zinc, Host Grotesk, light+dark, rectangular controls rounded-[7–8px].
Desktop: left sticky sidebar + top utility bar.
Sidebar sections:
- Today (home)
- Inbox (with unread badge)
- Bookings · Calendar
- Fleet · Rates · Availability
- Branches · Policies
- Payouts · Reports
- Team · Settings · Help

Top bar: agency trade name, branch switcher, notification bell, staff avatar menu, theme toggle.
Mobile: bottom nav (Today · Inbox · Bookings · Fleet · More) + sheet for secondary links.
Show verification chip: Draft | Under review | Live | Paused | Suspended.
Show commission chip: Standard 12% | Launch 10% | Volume 10%.
Persistent demo banner until live auth.
Accessible focus rings, skip link, skeleton loaders.
Do not reuse customer AccountShell layout blindly — this is denser ops UI.
```

---

## 3. Roles & permissions (UI gating)

| Role | Typical access |
|---|---|
| `owner` | Everything including banking, contract, team, payouts |
| `manager` | Ops + fleet + rates + reports; no banking change |
| `agent` | Inbox, bookings, messages, handover/return; read-only fleet |
| `fleet` | Fleet, calendar blocks, vehicle status; limited bookings |
| `accountant` | Payouts, ledger, invoices, reports; read-only bookings |

### Creation prompt — Role model UI

```text
Specify Wheelio TN agency RBAC for the portal UI.

Roles: owner, manager, agent, fleet, accountant.
Every page documents: who can view / edit / approve.
Show a “You don’t have access” empty state with ask-owner CTA — never a blank crash.
Invite flow assigns one role. Owner can transfer ownership (confirm modal).
Demo: seed one owner + one agent so role differences are visible.
```

---

## 4. Public funnel — Partners pitch (`/partners`)

**Priority:** P1  
**Status:** Missing (join exists; hub pitch optional)

### Job
Convert agency owners to apply; explain commission clearly without the removed join-page pricing panel.

### UI
1. Hero: “List your fleet on Wheelio” + Join CTA
2. How it works (4 steps): Apply → Verify → List → Get bookings
3. Commission strip: 12% standard · 10% launch/volume · deposit never included
4. Example calculator: net → listed
5. Requirements checklist (legal, insurance, fleet photos)
6. FAQ + link to `/partners/join`

### Creation prompt — Partners hub

```text
Create /partners marketing page for Wheelio TN agency acquisition.

Monochrome, brand-forward first viewport, one CTA “Start partner application”.
Explain 12% commission with 95→108 TND example. Deposit separate.
No SaaS feature-grid spam. Honest desk-ops tone. Link to /partners/join.
```

---

## 5. Partner application — enhance (`/partners/join`, `/partners/join/success`)

**Priority:** P0  
**Status:** Join form exists; success page thin / inline only

### Job
Capture agency interest + electronic contract acceptance; hand off to onboarding.

### Enhance UI
1. Keep 3 steps; add document upload step **or** defer uploads to `/agency/onboarding/documents`
2. Dedicated success route with application reference, expected review SLA (e.g. 2–5 business days), mailto `partners@wheelio.tn`
3. Email confirmation template link
4. “What happens next” timeline

### Creation prompt — Join success

```text
Add /partners/join/success for Wheelio TN after partner application submit.

Show application reference, agency name, commission acknowledged (12%), next steps timeline (Wheelio review → portal invite → onboarding checklist → go live).
CTAs: Return home · Contact partners@wheelio.tn · (later) Log in to agency portal.
Demo-only note until real CRM exists.
```

---

## 6. Agency auth — Login (`/agency/login`)

**Priority:** P0  
**Status:** Missing

### Job
Staff sign-in separate from customer `/login`. Never send agencies into renter account chrome.

### UI
1. Title: Agency portal login
2. Email + password (MVP); magic link secondary optional
3. Links: Forgot password · Apply to partner · Customer login (escape)
4. After success → `/agency` or incomplete onboarding checklist
5. States: invalid, locked, agency suspended, invite-only pending activation

### Creation prompt — Agency login

```text
Build Wheelio TN /agency/login as a calm ops auth screen distinct from customer /login.

Monochrome max-w-md. Email + password. Forgot password. Link “Not a partner yet? Apply” → /partners/join.
Link “Looking for your rental booking?” → /bookings/find.
Demo submit → /agency?demo=1 with AgencyShell.
Suspended agency: show pause reason + contact partners@.
```

---

## 7. Agency auth — Invite accept (`/agency/invite/[token]`)

**Priority:** P1  
**Status:** Missing

### Job
New staff set password + join agency workspace.

### UI
Invitee name, agency name, role chip, password fields, accept CTA, expired token state.

### Creation prompt — Staff invite

```text
Create /agency/invite/[token] for Wheelio TN staff onboarding.

Show invited email, agency trade name, role. Set password. Accept → /agency.
Expired/used token states. Demo token works offline.
```

---

## 8. Onboarding checklist hub (`/agency/onboarding`)

**Priority:** P0  
**Status:** Missing

### Job
Get a newly approved agency to go-live readiness without Wheelio manually entering everything forever.

### UI
Progress % + checklist cards:
1. Company profile & banking
2. Compliance documents
3. First branch + hours
4. First vehicles + photos
5. First rate plan (with net→list preview @ 12%)
6. Policies (deposit, cancel, mileage, fuel, drivers)
7. Booking mode (start Request-to-book)
8. Request activation

Block “Go live” until required items complete. Optional: Wheelio-assisted mode banner (“We’ll help enter your first fleet”).

### Creation prompt — Onboarding hub

```text
Design /agency/onboarding checklist for Wheelio TN partners.

Vertical checklist with status Done / In progress / Blocked. Each row links to a focused subpage.
Show estimated time per step. Require: profile, docs, 1 branch, ≥1 vehicle, 1 rate plan, core policies.
Commission reminder: listed = net ÷ (1 − 0.12). Deposit excluded.
Primary CTA when complete: Request activation.
Mobile friendly. Demo can mark steps complete in localStorage.
```

---

## 9. Agency home — Today board (`/agency`)

**Priority:** P0  
**Status:** Missing

### Job
Answer: “What must I do now?”

### UI sections
1. **Action queue:** pending requests (SLA countdown), pickups today, returns today, messages needing reply
2. **KPI strip (compact):** bookings this week · acceptance rate · avg response time · quality score
3. **Money glance:** next payout estimate · unpaid commission invoices (owner/accountant)
4. **Fleet health:** cars available / on rent / blocked / needs photo
5. **Alerts:** incomplete listing, expired insurance doc, calendar gaps

### Creation prompt — Today board

```text
Create Wheelio TN /agency home as an operations today board.

Monochrome dense layout. Top: greeting + branch filter + date.
Primary column: actionable cards (Accept request · Prepare pickup · Complete return · Reply message) with deep links.
Secondary: KPIs, next payout, fleet snapshot, compliance alerts.
Empty state for brand-new agency → Continue onboarding.
No marketing charts. Desk-ops calm. Mobile stacks action queue first.
```

---

## 10. Inbox — requests needing action (`/agency/inbox`)

**Priority:** P0  
**Status:** Missing (core marketplace integrity)

### Job
Accept / reject / ask-for-info on request-to-book before deadline; surface instant bookings that still need prep.

### UI
1. Tabs: Needs decision · Expiring soon · Instant to prepare · All open
2. Row: reference, car/category, pickup→return, customer name (masked phone until accept if needed), listed total, agency net, SLA timer, Instant/Request badge
3. Bulk? No for MVP — one-by-one decisions
4. Sound/badge optional later

### Creation prompt — Inbox

```text
Build /agency/inbox for Wheelio TN reservation agents.

List pending request-to-book with countdown SLA (demo default 6 desk hours).
Each row shows WTN reference, vehicle, dates, locations, customer first name, listed TND, agency net TND, commission line.
CTA: Review → /agency/bookings/[id]/accept.
Tabs for Instant bookings awaiting prep.
Empty state: “No requests waiting — calendar looks clear.”
Highlight conflicts (overlapping allocation) in amber.
```

---

## 11. Bookings list (`/agency/bookings`)

**Priority:** P0  
**Status:** Missing

### Job
Search and filter all agency reservations.

### UI
Filters: status · date range · branch · vehicle · confirmation type · payment state  
Search: reference, customer name, email, phone  
Sort: pickup soonest · newest request · SLA risk  
Table (desktop) / cards (mobile) with status chip + net TND

### Creation prompt — Bookings list

```text
Create /agency/bookings list page for Wheelio TN.

Desktop data table; mobile cards. Columns: Ref, Status, Customer, Vehicle, Pickup, Return, Listed, Net, Commission, Branch.
Filters and search. Click row → /agency/bookings/[id].
Status chips match customer model: requested, held, payment_pending, confirmed, active, completed, cancelled, expired, rejected, no_show.
Export CSV (demo) for accountant role.
```

---

## 12. Ops calendar (`/agency/bookings/calendar` & `/agency/calendar`)

**Priority:** P0 (availability), P1 (bookings calendar)  
**Status:** Missing

### Job
See cars on rent, holds, maintenance blocks, cleaning buffers across time.

### UI
- Views: Day · Week · Month
- Lanes by vehicle or by category pool
- Color: confirmed / hold / maintenance / cleaning buffer
- Click empty slot → create block
- Click booking → booking detail
- Conflict badges

### Creation prompt — Availability calendar

```text
Design Wheelio TN /agency/calendar fleet availability UI.

Week view default, lanes per vehicle. Show confirmed bookings, checkout holds, maintenance, owner-use, cleaning buffers.
Drag to create block (demo). Warn on overlap. Branch filter. “Vehicle or similar” pools group lane option.
Mobile: agenda list by day. Monochrome with status tones via zinc borders, not rainbow.
```

---

## 13. Booking command center (`/agency/bookings/[id]`)

**Priority:** P0  
**Status:** Missing

### Job
Agency equivalent of customer manage booking — single place for status, money, next action.

### UI
1. Header: reference, status, SLA/next step banner, Instant/Request
2. Subnav: Overview · Accept · Prepare · Handover · Return · Messages · Documents · Finance · Issue
3. Snapshot: customer, drivers, flight, pickup method, vehicle allocation, “or similar” note
4. Money panel: listed · net · commission % · deposit at desk · amount collected online · amount due at desk
5. Timeline (immutable history)
6. Primary CTA driven by status

### Creation prompt — Agency booking overview

```text
Build /agency/bookings/[id] command center for Wheelio TN agencies.

Match operational calm of customer /bookings/[id] but agency-sided.
Show money triad (listed / net / commission) and deposit separately.
Next-step banner examples:
- requested → Accept or decline before 18:40
- confirmed → Prepare vehicle checklist
- active → Open return inspection
Include allocate specific plate when pooled category.
Never allow editing past snapshot prices. Link to customer-facing voucher preview (read-only).
```

---

## 14. Accept / reject / counter (`/agency/bookings/[id]/accept`)

**Priority:** P0  
**Status:** Missing

### Job
Decide on request-to-book; optionally allocate a plate; optionally suggest alternative car (phase 2).

### UI
1. Summary of request + conflict check
2. Allocate vehicle (required for specific-car; optional for pool until handover)
3. Accept CTA → confirmed / held
4. Reject with reason codes (unavailable, documents, out of area, other) + free text
5. Expire automatically if SLA passes (show read-only expired state)

### Creation prompt — Accept flow

```text
Create /agency/bookings/[id]/accept decision page.

Two clear columns: Accept (allocate car, confirm net, optional note to customer) and Decline (reason codes).
Show SLA countdown. Block accept if hard calendar conflict unless manager override with reason.
Success → booking overview with status confirmed. Demo local state update.
```

---

## 15. Prepare pickup (`/agency/bookings/[id]/prepare`)

**Priority:** P1  
**Status:** Missing

### Job
Desk checklist before customer arrives.

### UI checklist
- Vehicle cleaned / fueled to policy
- Documents packet ready
- Child seat / extras staged
- Customer flight tracked (if provided)
- Pickup method instructions confirmed
- Staff assignee

### Creation prompt — Prepare

```text
Design /agency/bookings/[id]/prepare checklist for Wheelio TN.

Checkbox list with assignee and due-by time. Mark ready → status note “Ready for handover”.
Show extras and deposit reminder. Mobile-first for lot staff.
```

---

## 16. Handover / pickup desk (`/agency/bookings/[id]/handover`)

**Priority:** P0  
**Status:** Missing

### Job
Complete pickup: verify IDs, collect deposit, start rental, capture condition.

### UI
1. Scan / enter booking reference or QR from customer voucher
2. Verify drivers & licence details
3. Confirm vehicle plate + odometer + fuel
4. Deposit collection method (cash / card at desk) — amount shown separately
5. Condition photos (demo upload)
6. Customer signs agency paper (note: Wheelio PDF is marketplace copy; physical Tunisian papers remain agency)
7. Mark **Active**

### Creation prompt — Handover

```text
Build /agency/bookings/[id]/handover day-of desk flow.

Steps: Identify booking → Verify drivers → Confirm car & meter → Collect deposit (separate from rental) → Condition notes/photos → Start rental.
Large reference + QR verify field. Offline-friendly layout. Cannot start if status not confirmed.
After success status=active and customer trip tools unlock return guide.
```

---

## 17. Return inspection (`/agency/bookings/[id]/return`)

**Priority:** P0  
**Status:** Missing

### Job
Close the rental: inspection, fuel/mileage charges, deposit release or hold, mark completed.

### UI
1. Return time vs scheduled (late fee rules from policy)
2. Odometer / fuel out vs in
3. Damage checklist + photos
4. Extra charges (with customer acknowledgment note)
5. Deposit: release full / partial hold / claim path
6. Mark completed → triggers review request to customer (customer side)

### Creation prompt — Agency return

```text
Create /agency/bookings/[id]/return inspection page.

Compare out vs in readings. Deposit panel separate. Extra charges itemized in TND.
Actions: Complete return · Hold deposit for review · Open issue.
Completing sets status=completed. Show commission already owed on trip total (not on deposit).
```

---

## 18. Agency messages (`/agency/bookings/[id]/messages` + `/agency/notifications`)

**Priority:** P1  
**Status:** Missing

### Job
Reply to customer operational questions; Wheelio support may be in-thread as third party.

### UI
Thread with role labels (Customer · Agency · Wheelio). Canned replies for pickup point, delay, docs. Desk-hours autoresponse note.

### Creation prompt — Agency messages

```text
Implement agency side of booking messages at /agency/bookings/[id]/messages.

Same thread model as customer messages page. Staff name on outbound. Templates: “Meet at T1 desk”, “Delayed 20 min”, “Need licence photo”.
Notifications feed at /agency/notifications for new requests, messages, cancellations, payout events.
```

---

## 19. Booking finance strip (`/agency/bookings/[id]/finance`)

**Priority:** P1  
**Status:** Missing

### Job
Explain money for this one booking.

### UI ledger lines
- Customer listed mandatory total
- Wheelio commission (12% or tier)
- Agency net due
- Online amount collected by Wheelio (if any)
- Desk amount for rental balance
- Deposit (memo only — not commissionable)
- Refunds / adjustments
- Payout batch reference when settled

### Creation prompt — Booking finance

```text
Create /agency/bookings/[id]/finance money breakdown.

Clear table in TND. Never mix deposit into commission base.
Show formula reminder: commission = listed × take_rate; net = listed − commission.
Link to parent payout when paid.
```

---

## 20. Issue / no-show / damage (`/agency/bookings/[id]/issue`)

**Priority:** P1  
**Status:** Missing

### Job
Structured ops incidents that affect ranking and finance.

### Types
No-show · Customer late · Vehicle unavailable (agency cancel) · Breakdown · Accident · Deposit dispute · Fraud suspicion

### Creation prompt — Issues

```text
Build /agency/bookings/[id]/issue report form.

Issue type, severity, free text, photo upload (demo), notify Wheelio toggle.
Agency-initiated cancel after confirm warns about ranking impact.
```

---

## 21. Fleet list & vehicle editor (`/agency/fleet`, `/agency/fleet/new`, `/agency/fleet/[vehicleId]`)

**Priority:** P0  
**Status:** Missing

### Job
Maintain cars that power search offers.

### Vehicle fields
- Plate (private to agency; customers see model/category)
- Make/model/year, category, transmission, fuel, seats, bags, doors, AC
- Specific car vs pool membership
- Branch home
- Features, protection defaults
- Photos (min 4 for go-live)
- Status: Ready · On rent · Maintenance · Hidden
- Instant eligible? (derived from quality + sync)

### Creation prompt — Fleet

```text
Design Wheelio TN fleet module.

/agency/fleet: filterable grid/table with photo thumb, model, plate, status, branch, next booking.
/agency/fleet/new and [id]: multi-section form (basics, specs, features, photos, allocation mode, visibility).
Warn if missing photos or expired inspection doc. Soft-delete hides from search but keeps history.
“or similar” pool manager at /agency/fleet/categories.
```

---

## 22. Rates & fees (`/agency/rates`, `/agency/rates/[planId]`, `/agency/rates/fees`, `/agency/rates/preview`)

**Priority:** P0  
**Status:** Missing

### Job
Agency sets **net** (or retail — product uses commission on listed). UI must always preview **customer listed** at current take rate.

### Rate capabilities (MVP)
- Base daily net
- Seasonal windows
- Weekend uplift
- Duration discounts (3+, 7+, 14+)
- Minimum rental days
- Per-branch overrides (phase 1.5)

### Fees
Airport / after-hours / young driver / one-way / delivery — marked mandatory vs optional.

### Preview calculator
Input net day rate → output listed @ 12% (or launch 10%) using `listed = net ÷ (1 − rate)`.

### Creation prompt — Rates

```text
Build Wheelio TN agency rates UI.

Plans list + editor with seasonal rules and duration discounts.
Always show live preview: Agency net X TND/day → Customer listed Y TND/day at 12% (deposit separate).
Fees page for mandatory extras that must appear in customer total.
/rates/preview standalone calculator for owners negotiating nets.
Prevent saving rates that omit mandatory fee disclosures.
```

---

## 23. Branches & delivery (`/agency/branches/*`)

**Priority:** P0  
**Status:** Missing

### Job
Where pickups happen; desk hours; delivery zones.

### UI
Address, geo pin (later), airport terminal notes, hours per weekday, after-hours flag, meet&greet vs counter, delivery radius + fee table, contact phone for that desk.

### Creation prompt — Branches

```text
Create branches module for Wheelio TN agencies.

List + editor. Hours grid. Pickup methods enabled. Delivery zones with TND fees.
Show how this branch appears on public /agencies/[slug]. Require at least one branch before go-live.
```

---

## 24. Policies hub (`/agency/policies/*`)

**Priority:** P0  
**Status:** Missing

### Job
Normalize what customers see on offer detail / checkout.

### Policy pages
Cancellation tiers · Mileage (limited km + overage) · Fuel (full-full etc.) · Deposit amounts by category · Driver age/licence docs · Protection inclusions

Plain-language summary + full text. Changes apply to **new** offers only (snapshot rule).

### Creation prompt — Policies

```text
Design /agency/policies hub and subpages.

Each policy: short customer-facing summary (required) + detailed rules.
Deposit policy emphasizes refundable and timing.
Cancellation mirrors customer cancellation-policy language.
Preview panel: “How this appears on the offer page.”
```

---

## 25. Payouts & ledger (`/agency/payouts`, `/agency/ledger`, `/agency/invoices`)

**Priority:** P1  
**Status:** Missing

### Job
Agency trusts Wheelio on money.

### Payouts list
Period, gross GMV (excl deposit), commission, net payable, status (scheduled / paid / on hold), bank last4

### Ledger
Immutable event stream: booking confirmed commission accrual, refund reversal, manual adjustment (Wheelio only), payout batch

### Invoices
Wheelio → agency commission invoices (PDF placeholder)

### Creation prompt — Finance module

```text
Build agency finance area for Wheelio TN.

/payouts list + detail with included booking lines.
/ledger chronological TND movements.
/invoices download stubs.
Always exclude deposits from GMV/commission.
Show current tier 12% or 10%. Accountant role default landing.
```

---

## 26. Reports & quality (`/agency/reports`, `/agency/reports/quality`, `/agency/reviews`)

**Priority:** P1–P2  
**Status:** Missing

### Reports MVP
- Bookings count by status
- Acceptance rate & median response time
- Cancellation rate (agency vs customer)
- Utilization by vehicle
- Revenue net + commission share
- Peak pickup hours

### Quality scorecard (plan §15)
Acceptance · response time · agency cancels · inventory accuracy · complaints · vehicle match · reviews  
Actions: coach → restrict to request-to-book → pause

### Creation prompt — Reports

```text
Create /agency/reports and quality scorecard pages.

Simple monochrome charts (bars/lines, no rainbow). Explain each KPI and how it affects Instant eligibility.
Reviews page lists public customer reviews with reply (optional MVP: read-only).
```

---

## 27. Team (`/agency/team/*`)

**Priority:** P1  
**Status:** Missing

### Job
Invite staff; assign roles; deactivate.

### Creation prompt — Team

```text
Build /agency/team management.

Table of members: name, email, role, last active, status.
Invite modal: email + role. Resend / revoke.
Owner transfer guarded. Agents cannot see banking.
```

---

## 28. Settings & contract (`/agency/settings/*`)

**Priority:** P1  
**Status:** Missing

### Pages
- Profile: legal name, trade name, logo, tax id, contacts
- Public profile editor → drives `/agencies/[slug]`
- Booking mode: Request-only / Hybrid / Instant (gated by quality)
- Contract: current Partner Marketplace Agreement, commission tier, example 95→108, download PDF
- Security: password, sessions
- Notification settings: email/SMS/WhatsApp for new request, reminder, payout

### Creation prompt — Settings

```text
Implement /agency/settings suite.

Public profile editor with live preview card.
Booking mode page explains Instant requirements.
Contract page shows signed date, 12% standard, launch/volume notes, articles summary, download.
Security page mirrors customer security but agency-branded.
```

---

## 29. Agency help (`/agency/help`)

**Priority:** P2  
**Status:** Missing

### Topics
Accepting requests · Avoiding double booking · Setting nets vs listed · Deposits · Handover · Rankings · Payouts · Contact partner success

### Creation prompt — Agency help

```text
Create agency help center separate from customer /help.

Ops articles, short, with screenshots placeholders. Contact partners@wheelio.tn with desk hours.
```

---

## 30. Status model (agency-facing)

Align with customer `BookingStatus` in `lib/bookings.ts` and plan state machine.

| Status | Agency sees | Primary agency action |
|---|---|---|
| `requested` | New request · SLA live | Accept / decline |
| `held` | Soft hold | Wait payment / confirm allocation |
| `payment_pending` | Customer must pay | Monitor; prepare tentatively |
| `confirmed` | Booked | Prepare → handover |
| `active` | On rent | Support · plan return |
| `completed` | Closed | Finance reconcile · review reply |
| `cancelled` | Cancelled | Confirm inventory release · refund note |
| `expired` | SLA missed | Review why · quality hit |
| `rejected` | Agency declined | Done |
| `no_show` | Customer no-show | Apply policy · free car |

Listing modes:
- **Request to book** — default for new partners
- **Instant** — only after quality gates

---

## 31. Commission & money rules (UI must never lie)

From `PARTNER_PRICING` / contract:

| Tier | Take rate | When |
|---|---|---|
| Launch | 10% | First 90 days or first ~20 agencies |
| Standard | **12%** (recommended) | Default |
| Volume | 10% | ≥ ~30 confirmed bookings/month + SLA |

Formulas:
- `listed = round(net / (1 - takeRate))`
- `commission = listed - net` (equiv. `listed × takeRate`)
- Deposit **excluded** from GMV and commission
- Booking snapshot freezes the tier/rate at confirmation time

Show on: accept page, booking finance, rates preview, contract settings, payout lines.

---

## 32. Demo data model (local UI)

```ts
// Suggested wheelio-frontend/lib/agency.ts (demo)
type AgencyWorkspace = {
  id: string
  slug: string
  legalName: string
  tradeName: string
  verification: "draft" | "review" | "live" | "paused" | "suspended"
  commissionTier: "launch" | "standard" | "volume"
  takeRatePercent: 10 | 12
  branches: AgencyBranch[]
  vehicles: AgencyVehicle[]
  ratePlans: RatePlan[]
  staff: AgencyStaff[]
}

type AgencyBookingView = {
  id: string // same id as customer booking
  reference: string // WTN-######
  status: BookingStatus
  confirmation: "instant" | "request"
  slaExpiresAt?: string
  customer: { name: string; email: string; phone: string }
  vehicleId?: string
  categoryLabel: string
  listedTotalTnd: number
  agencyNetTnd: number
  commissionTnd: number
  depositTnd: number
  pickupAt: string
  returnAt: string
  branchId: string
}
```

Seed: 1 live demo agency (Tunis airport), 6 vehicles, 2 branches, 12 bookings across statuses, 3 pending inbox items, 1 scheduled payout.

Persist demo edits in `localStorage` keys namespaced `wheelio-agency-*`.

---

## 33. State matrix (every agency page)

| State | UI requirement |
|---|---|
| Loading | Skeletons matching final layout |
| Empty | One sentence + primary CTA |
| Error | Retry + support mailto |
| Offline | Cached read-only banner |
| Forbidden (role) | Explain + ask owner |
| Suspended agency | Full-page lock with reason |
| Onboarding incomplete | Soft gate with checklist link |
| Demo | Top banner, no real payouts |

---

## 34. Priority build order (sprints)

### Sprint A0 — Partner edge (already partly done)
1. Keep `/partners/join` + contract @ 12%
2. Add `/partners/join/success`
3. Optional `/partners` pitch page

### Sprint A — “I can log in and decide” (P0)
1. `AgencyShell` + demo session (`lib/agency-session.ts`)
2. `/agency/login` `/agency/logout`
3. `/agency` today board
4. `/agency/inbox`
5. `/agency/bookings` + `/agency/bookings/[id]`
6. `/agency/bookings/[id]/accept`
7. Wire notification badges (demo)

### Sprint B — “Day-of ops” (P0)
8. `/agency/bookings/[id]/prepare`
9. `/agency/bookings/[id]/handover`
10. `/agency/bookings/[id]/return`
11. `/agency/bookings/[id]/messages`
12. `/agency/bookings/[id]/finance`
13. `/agency/bookings/calendar` (ops view)

### Sprint C — “Supply that powers search” (P0)
14. `/agency/onboarding` checklist
15. `/agency/fleet` CRUD + photos
16. `/agency/rates` + `/agency/rates/preview` (net→list @ 12%)
17. `/agency/calendar` + blocks
18. `/agency/branches` + hours
19. `/agency/policies/*` core set

### Sprint D — “Money & trust” (P1)
20. `/agency/payouts` + ledger + invoices
21. `/agency/settings/contract`
22. `/agency/reports` + quality
23. `/agency/team` + invites
24. `/agency/settings/public-profile`
25. `/agency/settings/booking-mode`

### Sprint E — “Harden & scale” (P2)
26. Issues / no-show flows
27. Categories / pools polish
28. Agency help center
29. CSV import (plan progression step 2)
30. Instant graduation UX
31. FR strings pass (EN baseline; no AR)

---

## 35. Page map — agency portal only

| Route | Page | Priority | Status |
|---|---|---|---|
| `/partners` | Pitch hub | P1 | Built |
| `/partners/join` | Application | P0 | Built |
| `/partners/join/success` | Post-submit | P0 | Missing / inline |
| `/agency/login` | Staff login | P0 | Built |
| `/agency/forgot-password` | Reset request | P1 | Built |
| `/agency/reset-password` | Reset confirm | P1 | Built |
| `/agency/invite/[token]` | Accept invite | P1 | Built |
| `/agency/logout` | Logout | P0 | Built |
| `/agency/onboarding` | Checklist hub | P0 | Built |
| `/agency/onboarding/*` | Onboarding steps | P0 | Built |
| `/agency` | Today board | P0 | Built |
| `/agency/inbox` | Action inbox | P0 | Built |
| `/agency/bookings` | All bookings | P0 | Built |
| `/agency/bookings/calendar` | Bookings calendar | P1 | Built |
| `/agency/bookings/[id]` | Booking overview | P0 | Built |
| `/agency/bookings/[id]/accept` | Accept/decline | P0 | Built |
| `/agency/bookings/[id]/prepare` | Prep checklist | P1 | Built |
| `/agency/bookings/[id]/handover` | Pickup desk | P0 | Built |
| `/agency/bookings/[id]/return` | Return desk | P0 | Built |
| `/agency/bookings/[id]/messages` | Thread | P1 | Built |
| `/agency/bookings/[id]/documents` | Docs | P1 | Built |
| `/agency/bookings/[id]/finance` | Money | P1 | Built |
| `/agency/bookings/[id]/issue` | Incident | P1 | Built |
| `/agency/fleet` | Fleet list | P0 | Built |
| `/agency/fleet/new` | Add vehicle | P0 | Built |
| `/agency/fleet/[vehicleId]` | Edit vehicle | P0 | Built |
| `/agency/fleet/[vehicleId]/photos` | Gallery | P0 | Built |
| `/agency/fleet/[vehicleId]/availability` | Per-car blocks | P1 | Built |
| `/agency/fleet/categories` | Pools | P1 | Built |
| `/agency/rates` | Rate plans | P0 | Built |
| `/agency/rates/new` | New plan | P0 | Built |
| `/agency/rates/[planId]` | Edit plan | P0 | Built |
| `/agency/rates/fees` | Fees | P0 | Built |
| `/agency/rates/preview` | Net→list calc | P0 | Built |
| `/agency/calendar` | Availability | P0 | Built |
| `/agency/calendar/blocks` | Block manager | P0 | Built |
| `/agency/branches` | Branches | P0 | Built |
| `/agency/branches/new` | New branch | P0 | Built |
| `/agency/branches/[branchId]` | Edit branch | P0 | Built |
| `/agency/branches/[branchId]/hours` | Hours | P0 | Built |
| `/agency/branches/[branchId]/delivery` | Delivery | P1 | Built |
| `/agency/policies` | Policies hub | P0 | Built |
| `/agency/policies/*` | Policy editors | P0 | Built |
| `/agency/payouts` | Payouts | P1 | Built |
| `/agency/payouts/[payoutId]` | Payout detail | P1 | Built |
| `/agency/ledger` | Ledger | P1 | Built |
| `/agency/invoices` | Invoices | P1 | Built |
| `/agency/reports` | Reports | P1 | Built |
| `/agency/reports/quality` | Scorecard | P1 | Built |
| `/agency/reviews` | Reviews | P2 | Built |
| `/agency/team` | Staff | P1 | Built |
| `/agency/team/invite` | Invite | P1 | Built |
| `/agency/team/[memberId]` | Member | P1 | Built |
| `/agency/notifications` | Feed | P1 | Built |
| `/agency/notifications/settings` | Prefs | P1 | Built |
| `/agency/settings` | Settings hub | P1 | Built |
| `/agency/settings/public-profile` | Public page | P1 | Built |
| `/agency/settings/booking-mode` | Instant/request | P1 | Built |
| `/agency/settings/contract` | Agreement | P1 | Built |
| `/agency/settings/security` | Security | P1 | Built |
| `/agency/help` | Help | P2 | Built |
| `/agency/help/[article]` | Article | P2 | Built |

---

## 36. End-to-end agency journeys (wire pages together)

### Journey 1 — First partner
```text
/partners → /partners/join → agree 12% contract → /partners/join/success
  → Wheelio approves → email invite → /agency/invite/[token]
  → /agency/onboarding → profile/docs/branch/fleet/rates/policies
  → Request activation → /agency (live)
```

### Journey 2 — Request-to-book day
```text
Customer books (request) → agency notification
  → /agency/inbox → /agency/bookings/[id]/accept → Accept + allocate
  → /agency/bookings/[id]/prepare → /handover (deposit separate)
  → status active → /return → completed → /agency/payouts (later)
```

### Journey 3 — Instant booking day
```text
Customer instant confirm → /agency today board “Prepare pickup”
  → prepare → handover → return → finance line in payout
```

### Journey 4 — Rate change without breaking old trips
```text
/agency/rates/[planId] edit net → preview listed @ 12%
  → save applies to new searches only
  → old /agency/bookings/[id] snapshot unchanged
```

### Journey 5 — Quality → Instant unlock
```text
/agency/reports/quality shows gates met
  → /agency/settings/booking-mode enable Instant
  → search cards show Instant for eligible cars
```

---

## 37. Component inventory (agency)

| Component | Purpose |
|---|---|
| `AgencyShell` | Sidebar + top bar + mobile bottom nav |
| `AgencyDemoBanner` | Preview mode notice |
| `VerificationChip` | Draft/Review/Live/Paused/Suspended |
| `CommissionChip` | 10%/12% tier |
| `SlaCountdown` | Request deadline |
| `BookingStatusChip` | Shared statuses |
| `MoneyTriad` | Listed / net / commission |
| `DepositCallout` | Always separate |
| `InboxRow` | Request row |
| `FleetVehicleCard` | Fleet grid item |
| `RatePreviewCalculator` | Net→listed |
| `AvailabilityLane` | Calendar lane |
| `ChecklistPanel` | Prepare / onboarding |
| `HandoverWizard` | Multi-step desk flow |
| `ReturnInspectionForm` | Close rental |
| `PayoutTable` | Finance |
| `QualityScorecard` | KPI cards |
| `BranchHoursGrid` | Weekly hours |
| `PolicyPreview` | Customer-facing snip |
| `RoleGate` | RBAC wrapper |
| `AgencyEmptyState` | Consistent empties |

Reuse from customer where sensible: `PageShell` patterns, checkbox/button primitives, PDF download patterns, message thread UI (restyled).

---

## 38. Copy principles (agency)

1. Speak like desk ops: short verbs (Accept, Prepare, Start rental, Complete return).
2. Never say “earnings guaranteed.”
3. Always label TND and deposit.
4. Explain Instant vs Request in one line.
5. Ranking / pause consequences in plain language when declining after confirm.
6. FR later — EN baseline; no Arabic platform. Keep string keys clean now.
7. No fake 24/7 — “Wheelio partner desk hours”.

---

## 39. Email / notification pack (agency)

| Event | Channel | Deep link |
|---|---|---|
| New request-to-book | Email + push/SMS optional | `/agency/bookings/[id]/accept` |
| Instant booking created | Email | `/agency/bookings/[id]/prepare` |
| SLA 60 min left | Email/SMS | accept |
| Customer message | Email | messages |
| Customer cancelled | Email | booking overview |
| Payout paid | Email | `/agency/payouts/[id]` |
| Document expired | Email | onboarding/documents |
| Quality warning | Email | reports/quality |
| Activation approved | Email | `/agency` |

Content pages for eng preview can live under `/dev/emails` (agency templates section).

---

## 40. Analytics events (agency portal)

Track: `agency_login`, `inbox_open`, `booking_accepted`, `booking_rejected`, `handover_completed`, `return_completed`, `vehicle_created`, `rate_updated`, `calendar_block_created`, `payout_viewed`, `instant_mode_enabled`, `onboarding_step_completed`.

Pair with customer funnel events from the client docs.

---

## 41. Accessibility & mobile desk checklist

- Target 44px tap targets on handover/return
- High contrast status chips
- Keyboard accept/reject
- Reduced motion on countdowns
- Don’t rely on color alone for conflicts (icon + text)
- Works on mid-range Android in bright airport light (avoid ultra-thin gray text)

---

## 42. Master prompt — generate the full agency dashboard set

```text
Build the Wheelio TN Agency Dashboard & Partner Portal as a Next.js + TypeScript + Tailwind app section under /agency/*, plus public /partners join funnel enhancements.

Product: Tunisia multi-agency car rental marketplace. Agencies manage fleet, rates, availability, bookings, handover/return, and payouts. Wheelio takes 12% standard commission on customer trip total (deposit excluded). Example: net 95 TND → listed ~108 TND.

Visual: monochrome black/white/zinc, Host Grotesk, light+dark, rectangular controls, ops-dense but calm — not generic colorful SaaS.

Implement in sprint order:
A) AgencyShell, demo session, login, today board, inbox, bookings list, booking overview, accept/decline
B) prepare, handover, return, messages, booking finance, bookings calendar
C) onboarding checklist, fleet CRUD, rates + net→list preview, availability calendar + blocks, branches, policies
D) payouts/ledger/invoices, contract settings, reports/quality, team invites, public profile editor, booking mode
E) issues, pools polish, help, CSV import hooks, Instant graduation

Rules:
- Same booking IDs as customer /bookings/[id]
- Snapshots immutable
- Deposit never in commission
- Request-to-book default; Instant gated
- Role-aware screens
- Empty/loading/error/offline/demo states everywhere
- Reuse existing design tokens; do not reinvent customer marketing pages

Deliver page-by-page with Creation prompts from WHEELIO_AGENCY_DASHBOARD_UIUX_PROMPTS.md.
```

---

## 43. Out of scope (this doc)

- Wheelio **admin CMS** (approve agencies globally, marketplace config) — separate future doc
- Native agency apps
- Full accounting / payroll
- Telematics / damage AI
- Public partner API
- Customer marketplace pages (already covered)
- Changing the recommended take rate away from 12% without business + contract update

---

## 44. Relationship to other surfaces (do not rebuild)

| Surface | Owner doc | Agency interaction |
|---|---|---|
| Customer search/checkout | Client prompts | Agency supply feeds offers |
| Customer trips/manage | Post-booking prompts | Agency handover/return changes status customer sees |
| Customer account | Account/auth prompts | Separate login universe |
| Partner join/contract | This doc + existing join UI | Entry into `/agency` |
| Pricing model lib | `partner-pricing.ts` | Rates preview + contract settings consume it |

---

## 45. Open product decisions (document assumptions in UI copy)

1. **Who invoices the customer rental?** Assume agency issues physical rental invoice; Wheelio issues marketplace/commission docs — show this on finance pages.
2. **Pay-at-agency vs online deposit:** support both; finance UI branches on collector.
3. **Specific plate vs category pool:** both; allocation UI required before/at handover.
4. **Multi-branch payouts:** MVP single IBAN per agency; per-branch later.
5. **Counter-offer (different car/price):** not MVP; decline + customer rebooks.
6. **WhatsApp as official channel:** notifications may deep-link; in-app thread remains source of truth.

---

## 46. Definition of done — Agency MVP portal

An agency owner can:
1. Apply and accept 12% terms  
2. Log into `/agency`  
3. Finish onboarding checklist  
4. Add branch, cars, rates (with listed preview), policies, calendar blocks  
5. Accept a request before SLA  
6. Prepare, hand over (deposit separate), and return a booking  
7. See net vs commission on the booking and on a payout  
8. Invite one staff agent with limited role  
9. See why Instant is locked and what quality to improve  

When those nine work in demo mode with local data, Sprint A–D are complete enough to pilot with 3–6 Tunis agencies.

---

*End of agency dashboard UI/UX prompts. Use section Creation prompts one screen at a time; follow sprint order unless a pilot partner is blocked on a specific P0 path.*
