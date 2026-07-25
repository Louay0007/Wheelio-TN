# Wheelio TN — Post-Booking & Trip Tracking Pages (UI/UX Prompts)

**Product:** Tunisia-first multi-agency car rental marketplace  
**Scope:** Everything the **customer** needs **after** they finish checkout — track the reservation, see the calendar, open all trip details, manage changes, and close the loop after return.  
**Audience:** Renters (not agency portal / admin)  
**Currency:** TND · **Visual:** monochrome black / white / zinc · Host Grotesk · light + dark  

Use each **Creation prompt** as a design or coding brief. Keep prompts intact when generating screens.

**Related docs**
- Pre-booking IA: `WHEELIO_CLIENT_PAGES_UIUX_PROMPTS.md`
- Contract / PDF: checkout + `/bookings/[id]` downloads
- Agency portal (inbox / handover / return): `WHEELIO_AGENCY_DASHBOARD_UIUX_PROMPTS.md`
- Wheelio admin (cases / claims / refunds): `WHEELIO_ADMIN_DASHBOARD_UIUX_PROMPTS.md`

---

## 0. Current state vs missing (honest inventory)

### Already built (thin / demo)

| Route | What exists | Gaps |
|---|---|---|
| `/bookings/[id]/confirmation` | Reference, status, car summary, docs list, contract downloads, manage / WhatsApp / email CTAs | Calendar export is a non-working button; no voucher PDF; weak next-steps timeline; no SMS/email deep-link states |
| `/bookings/[id]` | Status timeline, price snapshot, edit phone/flight, cancel + refund estimate, contracts | No full trip schedule; no calendar; no modify-dates; no messages; no day-of pickup guide; no payment receipt |
| `/account` | Demo list of 2 bookings + stub profile | Not a real trips hub; no tabs; no calendar; no guest lookup; auth not live |
| `/login` `/signup` | Auth shells | Not wired to booking history |

### Missing (this document)

Everything below is **not built** (or only a stub). Build these so a user can **track the calendar**, **track the reservation**, and open **all details after booking**.

---

## 1. Post-booking information architecture

```text
Checkout complete
  → /bookings/[id]/confirmation          (receipt moment)
      ├─ Add to calendar                  → .ics + Google/Outlook deep links
      ├─ Open voucher                     → /bookings/[id]/voucher
      ├─ Manage booking                   → /bookings/[id]
      └─ Find my booking (guest)          → /bookings/find

Account / trips hub
  → /trips                                (list + filters)   OR expand /account
  → /trips/calendar                       (month / week view of rentals)
  → /trips/[id]                           (alias of /bookings/[id] — one canonical)

Per booking deep pages
  → /bookings/[id]                        (command center — enhance existing)
  → /bookings/[id]/schedule               (calendar + countdown + day plan)
  → /bookings/[id]/voucher                (printable / offline pickup card)
  → /bookings/[id]/documents              (contracts, receipts, invoices)
  → /bookings/[id]/payments               (money timeline)
  → /bookings/[id]/messages               (agency + Wheelio thread)
  → /bookings/[id]/modify                 (dates / extras / drivers — policy gated)
  → /bookings/[id]/pickup                 (day-of instructions)
  → /bookings/[id]/return                 (drop-off checklist + deposit release)
  → /bookings/[id]/review                 (post-trip review)
  → /bookings/[id]/claim                  (damage / dispute — careful wording)

Cross-cutting
  → /account/profile                      (drivers, licences, prefs)
  → /account/notifications                (activity feed)
  → /bookings/find                        (guest: reference + email)
```

**Canonical rule:** One booking truth URL = `/bookings/[id]`. Other routes are focused tools that link back.

---

## 2. Shared post-booking design rules

1. **Operational calm** — airline “manage booking” energy, not social feed.
2. **Status always visible** — chip + short plain-language next step.
3. **TND clarity** — trip total vs deposit at pickup vs amount paid / due, always labeled.
4. **Instant vs Request** — never hide pending agency acceptance.
5. **Or similar** — keep disclosure on every car summary.
6. **Offline-ready voucher** — QR + reference large enough for desk staff.
7. **Policy gates** — modify / cancel / extend only when status + cancellation rules allow.
8. **Empty / loading / error / offline** on every data page.
9. **No fake 24/7** — desk-time language for Tunisia agencies.
10. **Guest-safe** — magic link or reference+email lookup; never require account for a booked trip.

### Creation prompt — Post-booking shell

```text
Design the shared Wheelio TN post-booking chrome for customer trip pages.

Monochrome black/white/zinc, light+dark, Host Grotesk, rectangular controls.
Every booking page includes:
- Compact booking header: reference (mono), status chip, car + agency one-liner, pickup datetime
- Secondary nav tabs or sticky subnav: Overview · Schedule · Voucher · Documents · Payments · Messages · Pickup
- Primary next-step banner (one sentence + one CTA)
- Footer support strip: WhatsApp, email, Help article link — “desk hours, not 24/7”

Mobile: tabs collapse into a “Trip tools” sheet. Desktop: horizontal subnav under header.
Accessible, keyboardable, skeleton loaders for demo/local data first.
```

---

## 3. Trips hub — list all reservations (`/trips` or upgrade `/account`)

**Priority:** P0 for “track my reservation”  
**Status:** Missing (account has only 2 demo rows)

### Job
One place to see upcoming, active, past, and cancelled bookings.

### UI
1. Title: **Your trips**
2. Tabs / filters: Upcoming · Active · Past · Cancelled · All
3. Sort: Pickup soonest · Recently booked
4. Trip cards:
   - Car image thumb + model (+ or similar)
   - Agency + city
   - Pickup → return dates/times + locations
   - Status chip + next-step microcopy
   - Reference (`WTN-######`)
   - Total TND + deposit note
   - CTAs: Open · Voucher · Add to calendar
5. Empty states per tab (“No upcoming trips” + Find a car)
6. Guest banner: “Booked without account? Find booking”
7. Optional: calendar preview strip (next 30 days dots)

### Creation prompt — Trips hub

```text
Build Wheelio TN /trips (or expand /account into a real trips hub).

Purpose: customer tracks every reservation after booking.

Layout:
- Header “Your trips”
- Filter chips: Upcoming / Active / Past / Cancelled / All
- List of trip cards (not a dashboard grid): image, car name, agency, route dates, status chip, reference, TND total with deposit separate, CTAs Open + Voucher
- Sticky “Find a booking” for guests (link to /bookings/find)
- Empty state with Find a car CTA
- Loading skeletons; error retry

Monochrome travel UI. Mobile-first. Deep-link each card to /bookings/[id].
Demo data ok for local; structure as if API-backed.
```

---

## 4. Trip calendar (`/trips/calendar`)

**Priority:** P0 for “track the calendar”  
**Status:** Missing

### Job
See rentals on a month/week calendar; tap a day to open the booking.

### UI
1. Month navigation (prev/next) + Today
2. Toggle: Month | Agenda (list by day)
3. Events = rental blocks from pickup → return (inclusive)
4. Event chip: car short name + city + status color (mono: solid / outline / dashed)
5. Day detail drawer / panel: bookings that day + “Pickup today” / “Return today” labels
6. Legend: Confirmed · Pending agency · Active · Cancelled
7. CTA: Add all upcoming to calendar (.ics zip or multi-event .ics)
8. Empty month: muted “No rentals this month”

### States
- Overlapping trips (rare) — stack chips
- Multi-day span across month boundary
- Timezone note: Africa/Tunis

### Creation prompt — Trip calendar

```text
Create Wheelio TN /trips/calendar for customers to track rental dates.

Month view + Agenda view. Events span pickup→return for each booking.
Monochrome chips (no rainbow colors): filled = confirmed/active, outline = pending, dashed = cancelled.
Click event → /bookings/[id]/schedule or overview.
Header actions: Today, Add upcoming to calendar (.ics).
Mobile: agenda-first; desktop: classic month grid.
Show Africa/Tunis timezone note. Accessible keyboard month nav.
Match Wheelio design system. No purple calendar widgets.
```

---

## 5. Guest find booking (`/bookings/find`)

**Priority:** P0  
**Status:** Missing

### Job
Let guests retrieve a trip with **booking reference + email** (or SMS code later).

### UI
1. Form: Reference (`WTN-…`) + Email used at checkout
2. Optional phone last-4 for extra check
3. Success → redirect `/bookings/[id]` with short-lived session token (demo: query flag)
4. Failure: clear error, link to support / help
5. Privacy note: we never show another customer’s trip

### Creation prompt — Find booking

```text
Design Wheelio TN /bookings/find guest lookup page.

Minimal monochrome form: booking reference + email. Primary CTA “Find my booking”.
On success route to /bookings/[id]. On failure show calm error + Contact support.
Explain that guest checkout does not require an account.
No social login clutter. Mobile-first, accessible labels.
```

---

## 6. Booking overview — enhance manage (`/bookings/[id]`)

**Priority:** P0 (exists — needs expansion)  
**Status:** Partial

### Job
Command center: status, money, people, vehicle, policies, tools.

### Add / complete
1. **Next step banner** (dynamic by status)
2. **Trip schedule strip** (pickup / return with countdown)
3. **Quick tools row:** Voucher · Calendar · Documents · Messages · Modify · Cancel
4. **People:** contact + main driver + extras drivers
5. **Vehicle & policies** accordion (fuel, mileage, exclusions)
6. **Money snapshot** with link to Payments
7. **Contract** block (already partially there)
8. **Agency card:** name, city, WhatsApp rules, desk hours
9. **Activity mini-feed** (last 3 events) → full notifications

### Creation prompt — Booking overview

```text
Enhance Wheelio TN /bookings/[id] into a full reservation command center.

Keep existing timeline, cancel, phone/flight edit, contract downloads.
Add:
- Dynamic next-step banner by status (requested / confirmed / payment_pending / active / completed / cancelled)
- Pickup→return schedule strip with countdown (“Pickup in 2 days”)
- Tool row linking to voucher, schedule/calendar, documents, payments, messages, modify
- People + vehicle + policy sections
- Money snapshot (total / paid / due / deposit separate)
- Agency contact card with desk-hours language

Monochrome, operational, airline-manage style. Mobile sticky “Trip tools” button.
```

---

## 7. Booking schedule & countdown (`/bookings/[id]/schedule`)

**Priority:** P0  
**Status:** Missing

### Job
Calendar-centric view of **this** reservation only.

### UI
1. Hero dates: pickup and return with large typography
2. Countdown module (days / hours to pickup or to return if active)
3. Single-trip calendar highlight (range shaded)
4. Day plan:
   - T−2: documents reminder
   - T−1: flight / landing time check
   - Pickup day: meet point, what to bring
   - Return day: fuel, time, deposit release expectation
5. Actions: Add to calendar · Get directions (maps link) · Open pickup guide
6. Change dates CTA → `/modify` if allowed

### Creation prompt — Schedule

```text
Build Wheelio TN /bookings/[id]/schedule.

Purpose: track this reservation on a calendar with countdown and day plan.
Show large pickup/return datetimes (Africa/Tunis), countdown, shaded date range, checklist timeline (T-2, T-1, pickup, return).
CTAs: Download .ics, Open in Google Calendar, Open pickup instructions, Request date change.
Monochrome. Calm. No gamification. Mobile-first.
```

---

## 8. Add to calendar flows (component + confirmation wiring)

**Priority:** P0  
**Status:** Button exists on confirmation — **not implemented**

### Job
Export pickup + return (or one all-day rental block) to device calendars.

### Deliverables
1. Generate `.ics` (VEVENT) with:
   - Title: `Wheelio · {car} · {city}`
   - Location: pickup address / airport label
   - Description: reference, agency, voucher URL, deposit note
   - Alarms: T−24h and T−2h (configurable)
2. Deep links: Google Calendar, Outlook web
3. “Copy event details” fallback
4. Multi-booking export from `/trips/calendar`

### Creation prompt — Calendar export

```text
Implement Wheelio TN “Add to calendar” for bookings.

Replace the inert confirmation button with:
- Download .ics (pickup event + return event, or one spanning event — pick one and document)
- Open Google Calendar template URL
- Open Outlook compose URL
- Copy plain-text trip summary

Include booking reference, agency, deposit reminder, link to /bookings/[id]/voucher in description.
Timezone Africa/Tunis. Monochrome action sheet on mobile.
```

---

## 9. Digital voucher / pickup card (`/bookings/[id]/voucher`)

**Priority:** P0  
**Status:** Missing

### Job
Offline-friendly page staff can scan/read at the desk.

### UI
1. Large reference + QR (verify URL)
2. Status watermark (CONFIRMED / PENDING)
3. Car, or-similar, category
4. Agency name + pickup method note
5. Pickup / return datetime + locations
6. Driver name
7. Amounts: paid online / pay at desk / deposit at pickup
8. Documents checklist
9. Print button + “Add to Wallet” later (optional P3)
10. Screen-wake / high-contrast print CSS

### Creation prompt — Voucher

```text
Create Wheelio TN /bookings/[id]/voucher printable pickup card.

Large mono booking reference, QR to booking verify URL, car + agency, pickup/return, driver name, TND paid vs deposit-at-pickup separately labeled, documents list.
Print-optimized layout + on-screen version.
PENDING bookings show clear “Not yet confirmed — show only after agency accepts”.
No decorative clutter. High contrast. Works offline once loaded (demo note ok).
```

---

## 10. Documents hub (`/bookings/[id]/documents`)

**Priority:** P1  
**Status:** Partial (contracts only on confirmation/manage)

### Job
One shelf for all trip files.

### Document types
| Doc | When available |
|---|---|
| Customer contract PDF | After e-sign |
| Agency contract PDF | After e-sign (+ stamp when confirmed) |
| Booking voucher PDF | When confirmed (or pending watermark) |
| Payment receipt | When online payment captured |
| Invoice / tax receipt | When issued (demo placeholder) |
| Agency desk papers | After pickup (upload/placeholder) |
| Deposit release note | After return |

### UI
List with type, issued date, download / view, integrity hash for contracts.

### Creation prompt — Documents

```text
Build Wheelio TN /bookings/[id]/documents.

File list for rental trip: customer PDF contract, agency PDF contract, voucher, payment receipt, invoice placeholder, deposit release.
Each row: title, status (Ready / Pending), date, Download.
Reuse existing contract download helpers. Monochrome list UI, empty pending states.
Explain SHA-256 / do-not-alter for signed contracts in a short note.
```

---

## 11. Payments & money timeline (`/bookings/[id]/payments`)

**Priority:** P1  
**Status:** Missing

### Job
Clear money story so customers are not surprised at the desk.

### UI
1. Summary tiles: Trip total · Paid online · Due at agency · Deposit hold (separate)
2. Timeline rows: authorization, capture, refund, deposit hold/release
3. Payment method masked (demo)
4. CTA: Pay remaining (if `payment_pending`)
5. Link to cancellation refund estimate
6. FAQ teaser: “Deposit is not a fee”

### Creation prompt — Payments

```text
Design Wheelio TN /bookings/[id]/payments money timeline.

Show TND trip total, amount paid online, amount due at agency desk, refundable deposit at pickup as a separate track.
Vertical timeline of payment events. CTA to complete payment when status is payment_pending.
Calm finance UI, monochrome, no fintech neon. Explain deposit clearly.
```

---

## 12. Messages / agency thread (`/bookings/[id]/messages`)

**Priority:** P1  
**Status:** Missing (only WhatsApp deep link)

### Job
In-app thread for “agency asked a question” / “please send flight update” without leaving Wheelio.

### UI
1. Thread list (Wheelio Support · Agency)
2. Message bubbles, timestamps, read state (demo)
3. Composer with attachments (licence photo later)
4. System events mixed in (“Agency accepted booking”)
5. Escalation: “Continue on WhatsApp”
6. Closed thread when completed/cancelled (read-only)

### Creation prompt — Messages

```text
Create Wheelio TN /bookings/[id]/messages.

Simple two-party messaging UI: Agency + Wheelio support system notices.
Monochrome chat, not colorful social. Composer, empty state, disabled state when booking cancelled.
Include “WhatsApp agency/support” escape hatch.
Demo seed messages for requested vs confirmed bookings.
```

---

## 13. Modify booking (`/bookings/[id]/modify`)

**Priority:** P1  
**Status:** Missing (only phone/flight edit today)

### Job
Request changes that policy allows: dates, times, extras, additional driver, flight.

### UI
1. Policy gate banner (what can change now)
2. Sections:
   - Dates / times (reprice preview)
   - Extras add/remove
   - Additional driver
   - Flight / landing
3. Diff summary: old → new, price delta TND, deposit impact
4. Submit → “Request sent” or instant apply (by agency rules)
5. Denied state with explanation

### Creation prompt — Modify

```text
Build Wheelio TN /bookings/[id]/modify.

Policy-gated change request flow for dates, extras, drivers, flight info.
Show live TND price delta and deposit note. Confirm step with summary.
If booking is active/completed/cancelled, show blocked state with contact support.
Monochrome stepper or single long form with sticky summary. Mobile-first.
```

---

## 14. Day-of pickup guide (`/bookings/[id]/pickup`)

**Priority:** P1  
**Status:** Missing (short note on confirmation only)

### Job
Reduce desk friction on pickup day.

### UI
1. Countdown / “Pickup today · 10:00”
2. Meet instructions (counter / meet & greet / delivery)
3. Map pin + copy address + open in Maps
4. What to bring checklist (interactive checkboxes, localStorage ok)
5. Who to ask for / queue tip
6. Late arrival policy summary
7. Emergency contacts
8. Link voucher + contracts

### Creation prompt — Pickup guide

```text
Create Wheelio TN /bookings/[id]/pickup day-of guide.

Operational checklist page: time countdown, meet method, map actions, documents checklist with checkboxes, late policy, agency contact, open voucher CTA.
Monochrome, large tap targets, works in bright airport light (high contrast).
Pending bookings warn “Wait for confirmation before travelling to desk”.
```

---

## 15. Return & deposit release (`/bookings/[id]/return`)

**Priority:** P1  
**Status:** Missing

### Job
Guide return day and set expectations for deposit release.

### UI
1. Return datetime + location
2. Fuel / mileage checklist
3. Condition photos upload (optional demo)
4. Deposit release expectation (“agency desk · timing varies”)
5. Mark returned (customer ack) → status `completed` (demo)
6. CTA: Write review

### Creation prompt — Return

```text
Design Wheelio TN /bookings/[id]/return.

Return-day checklist: location/time, fuel policy reminder, mileage, optional condition notes, deposit release expectations in plain language.
CTA mark returned + write review. Monochrome. No false instant-refund promises.
```

---

## 16. Post-trip review (`/bookings/[id]/review`)

**Priority:** P2  
**Status:** Missing (reviews hub exists; write-gated flow does not)

### Job
Collect structured feedback only for completed bookings.

### UI
1. Gate: only `completed`
2. Stars: overall, car condition, agency desk, value
3. Free text
4. Optional photo
5. Publish to `/reviews` (moderation placeholder)
6. Thank-you + rebook CTA

### Creation prompt — Review write

```text
Build Wheelio TN /bookings/[id]/review for completed trips only.

Star ratings + short text, monochrome form, success state linking to /reviews and /search.
Block early access with “Available after return”. No incentivized fake review copy.
```

---

## 17. Claim / issue report (`/bookings/[id]/claim`)

**Priority:** P2  
**Status:** Missing

### Job
Structured path for deposit disputes, no-show, wrong car — careful legal tone.

### UI
1. Issue type select
2. Description + attachments
3. Booking snapshot attached automatically
4. Submit → ticket id + expected desk-time response
5. Link help articles

### Creation prompt — Claim

```text
Create Wheelio TN /bookings/[id]/claim issue report form.

Types: deposit question, vehicle condition, pickup problem, billing, other.
Attach booking reference automatically. Calm legal-safe copy: Wheelio is marketplace intermediary; agency may own deposit process.
Confirmation with ticket id. Monochrome. Not a chat toy.
```

---

## 18. Account profile & saved drivers (`/account/profile`)

**Priority:** P2  
**Status:** Stub on `/account`

### Job
Save renter identity for faster rebook; never block guest checkout.

### UI
- Name, email, phone, language, currency note (TND)
- Saved drivers (name, licence country, age band)
- Default extras preferences
- Notification prefs (email / SMS)
- Logout / delete request

### Creation prompt — Profile

```text
Design Wheelio TN /account/profile.

Profile fields + saved drivers list + notification preferences.
Monochrome settings UI. Emphasize guest checkout still works.
Link back to /trips.
```

---

## 19. Notifications / activity (`/account/notifications`)

**Priority:** P2  
**Status:** Missing

### Job
Chronological feed of booking events across trips.

### Event examples
- Agency accepted
- Payment received
- Reminder: pickup in 48h
- Contract ready
- Message from agency
- Cancelled / refund update
- Deposit release note

### Creation prompt — Notifications

```text
Build Wheelio TN /account/notifications activity feed.

List rows: icon, title, booking reference, time, deep link.
Filters: All / Action needed. Mark read. Empty state.
Monochrome. No red badge spam — use restrained unread dots.
```

---

## 20. Email / SMS templates (content pages for eng)

**Priority:** P1 (content + optional `/dev/emails` preview)  
**Status:** Missing

### Required transactional moments
1. Booking received (request or confirmed)
2. Agency accepted / declined
3. Payment receipt
4. Contract signed (links to documents)
5. Pickup reminder T−48h / T−24h
6. Day-of pickup
7. Return reminder
8. Review ask
9. Cancellation + refund estimate

### Creation prompt — Notifications content

```text
Write Wheelio TN transactional email/SMS copy set for post-booking lifecycle.

Tone: clear, calm, Tunisia marketplace, TND amounts, deposit separate, desk hours.
Each template: subject, preview, body sections, primary CTA URL pattern (/bookings/[id]/…).
Provide SMS variants ≤160 chars where possible.
```

---

## 21. Status model (use on every tracking page)

| Status | Customer sees | Primary next step |
|---|---|---|
| `requested` | Waiting for agency | You’ll get email/SMS when they answer |
| `held` | Agency holding car | Complete payment if required |
| `payment_pending` | Payment needed | Pay now |
| `confirmed` | Confirmed | Add to calendar · Open voucher |
| `active` | Rental in progress | Open return guide |
| `completed` | Trip finished | Write review · Rebook |
| `cancelled` | Cancelled | Refund status · Book again |

---

## 22. Priority build order (post-booking)

### Sprint A — “I can track it” (P0)
1. `/trips` hub (or real `/account` trips)
2. `/bookings/find`
3. Working **Add to calendar** (.ics + Google)
4. `/bookings/[id]/schedule` + countdown
5. `/bookings/[id]/voucher`
6. Enhance `/bookings/[id]` tool row + next-step banner
7. Wire confirmation calendar button

### Sprint B — “All the details” (P1)
8. `/bookings/[id]/documents`
9. `/bookings/[id]/payments`
10. `/bookings/[id]/pickup`
11. `/bookings/[id]/return`
12. `/bookings/[id]/modify`
13. `/bookings/[id]/messages`
14. Email/SMS copy pack

### Sprint C — “Close the loop” (P2)
15. `/trips/calendar`
16. `/bookings/[id]/review`
17. `/bookings/[id]/claim`
18. `/account/profile`
19. `/account/notifications`

---

## 23. Page map — post-booking only

| Route | Page | Priority | Status |
|---|---|---|---|
| `/trips` | Trips list hub | P0 | Missing |
| `/trips/calendar` | Multi-trip calendar | P2 | Missing |
| `/bookings/find` | Guest lookup | P0 | Missing |
| `/bookings/[id]/confirmation` | Confirmation | P0 | Partial |
| `/bookings/[id]` | Overview / manage | P0 | Partial |
| `/bookings/[id]/schedule` | Schedule + countdown | P0 | Missing |
| `/bookings/[id]/voucher` | Pickup voucher | P0 | Missing |
| `/bookings/[id]/documents` | Files hub | P1 | Missing |
| `/bookings/[id]/payments` | Money timeline | P1 | Missing |
| `/bookings/[id]/messages` | Thread | P1 | Missing |
| `/bookings/[id]/modify` | Change request | P1 | Missing |
| `/bookings/[id]/pickup` | Day-of guide | P1 | Missing |
| `/bookings/[id]/return` | Return + deposit | P1 | Missing |
| `/bookings/[id]/review` | Write review | P2 | Missing |
| `/bookings/[id]/claim` | Issue report | P2 | Missing |
| `/account` | Account home | P0/P2 | Stub |
| `/account/profile` | Profile & drivers | P2 | Missing |
| `/account/notifications` | Activity feed | P2 | Missing |

---

## 24. End-to-end post-booking journey

```text
Checkout → confirmation
  → Add to calendar
  → Open voucher (save offline)
  → Manage overview
      → Schedule (countdown)
      → Documents (contracts)
      → Payments (what I owe / paid)
      → Messages (if agency asks)
      → Modify (if needed)
  → Pickup day guide
  → Active rental
  → Return guide + deposit expectations
  → Review
  → Trips hub (history) + calendar
```

Guest without account: email link **or** `/bookings/find` → same journey.

---

## 25. Component inventory (post-booking)

Create / reuse:
- `BookingHeader` (reference, status, next step)
- `BookingSubnav`
- `StatusChip` / `StatusTimeline` (exists — extend)
- `TripCard` (list)
- `TripCalendar` / `AgendaList`
- `Countdown` (pickup/return)
- `VoucherCard` + print styles
- `DocumentsList`
- `MoneyTimeline`
- `MessageThread`
- `PolicyGateBanner`
- `Checklist` (pickup/return)
- `AddToCalendarMenu` (.ics / Google / Outlook)
- `FindBookingForm`
- `EmptyState` / `Skeleton`

---

## 26. Master prompt — generate the full post-booking set

```text
You are designing the complete post-booking customer experience for Wheelio TN (Tunisia multi-agency car rental marketplace).

Customer goal: after checkout, track the reservation on a calendar, open every trip detail, manage changes, and finish return/review — with or without an account.

Stack: Next.js App Router, TypeScript, Tailwind, existing monochrome Wheelio design system, demo booking helpers in lib/bookings.ts.

Implement or specify UI/UX for all P0 then P1 routes in WHEELIO_POST_BOOKING_PAGES_UIUX_PROMPTS.md:
- wireframe-level layout
- components
- status-driven next steps
- empty/loading/error
- mobile + desktop
- English copy
- accessibility
- Africa/Tunis timezone for dates
- TND totals with deposit always separate

Do not build agency portal or admin. Prefer enhancing /bookings/[id] as the canonical hub with focused child routes.
```

---

## 27. Out of scope

- Agency acceptance console
- Admin CMS / refunds ops tools
- Native wallet passes (optional later)
- Live GPS telematics
- Loyalty points
- Real payment provider settlement UI beyond customer-facing receipt

---

*Document version: 1.0 — Post-booking & trip tracking UI/UX prompts for Wheelio TN*
*Created to cover missing calendar, reservation tracking, and after-booking detail pages*
