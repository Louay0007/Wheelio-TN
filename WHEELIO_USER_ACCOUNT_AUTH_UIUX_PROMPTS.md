# Wheelio TN — User Account, Profile & Auth Pages (UI/UX Prompts)

**Product:** Tunisia-first multi-agency car rental marketplace  
**Scope:** Everything left for the **signed-in (or about-to-sign-in) customer** — auth, profile, personal details, preferences, security, and how the account connects to trips.  
**Audience:** Renters only (not agency portal / admin)  
**Currency:** TND · **Visual:** monochrome black / white / zinc · Host Grotesk · light + dark  

**Hard rule:** Guest checkout and guest booking lookup **never** require an account. Auth is optional speed + history.

Use each **Creation prompt** as a design or coding brief.

**Related docs**
- Pre-booking marketplace: `WHEELIO_CLIENT_PAGES_UIUX_PROMPTS.md`
- Post-booking trips: `WHEELIO_POST_BOOKING_PAGES_UIUX_PROMPTS.md`
- Agency portal: `WHEELIO_AGENCY_DASHBOARD_UIUX_PROMPTS.md`
- Wheelio admin: `WHEELIO_ADMIN_DASHBOARD_UIUX_PROMPTS.md`
- This file owns: identity, auth, profile, settings, security

---

## 0. Current state vs missing (honest inventory)

### Already built (thin / demo)

| Route | What exists | Gaps |
|---|---|---|
| `/login` `/signup` | Shared `AuthForm` (email + password, signup name) | No magic link, OAuth, validation UX, forgot password, success/error states, session, redirect-after-login |
| `/account` | Link hub → trips, calendar, profile, notifications, find booking | No signed-in identity strip, no upcoming-trip teaser, no logout, no guest vs member states |
| `/account/profile` | Static name/email/phone/language, 2 demo drivers, 3 notification checkboxes | No save, no driver CRUD, no licence details form, no currency/theme prefs, no security section, no delete |
| `/account/notifications` | Demo activity feed + filters + mark read (client state) | Not wired to real prefs; no empty signed-out state; no email digest settings link |
| Header | Account + Trips links | No avatar menu; same for guest and “logged in”; no Login CTA when guest |
| Footer | Trips / Find booking | No Account / Login |

### Missing (this document)

Full auth lifecycle, account shell, deep profile/details, drivers vault, security & privacy, claim-guest-booking, preferences, and signed-in chrome.

---

## 1. Information architecture

```text
Guest
  → /login | /signup | /bookings/find | /search (checkout)

Auth entry
  → /login
  → /signup
  → /auth/magic                      (request / check email)
  → /auth/verify                     (email link landing)
  → /forgot-password
  → /reset-password
  → /logout                          (action route or confirm page)

Account home
  → /account                         (hub + identity + next trip)

Profile & details
  → /account/profile                 (personal details)
  → /account/drivers                 (saved drivers vault)
  → /account/drivers/new
  → /account/drivers/[driverId]
  → /account/preferences             (language, theme, TND note, defaults)
  → /account/notifications           (feed — exists)
  → /account/notifications/settings  (channel prefs — split from profile)
  → /account/security                (password, sessions, 2FA later)
  → /account/privacy                 (data export, delete request)
  → /account/payments                (saved cards placeholder — careful PCI)
  → /account/claim                   (attach guest booking to account)

Optional later
  → /account/wishlist                (saved cars / searches)
  → /account/reviews                 (reviews you’ve written)
```

**Canonical split**
- **Trips live under `/trips`** (already built).
- **Identity & settings live under `/account/*`.**
- Never duplicate the full trips list on `/account` — show a **teaser** (next 1–2 trips) + “View all trips”.

---

## 2. Shared design rules (account / auth)

1. **Operational calm** — settings energy, not social network.
2. **Guest-first copy** on every auth screen: “You can book without an account.”
3. **One primary action** per auth screen.
4. **Monochrome** — black/white/zinc; rectangular controls `rounded-[7–8px]`.
5. **Signed-in chrome** — compact identity (initials avatar + name) in header menu.
6. **Desk-hours honesty** for support links (no fake 24/7).
7. **TND always** — currency preference is informational (“Prices shown in TND”), not a multi-currency switcher for MVP.
8. **RTL-ready** fields for Arabic names/phone later; ship EN first with FR/AR language select.
9. **Empty / loading / error / offline** on every data page.
10. **Demo mode banner** until real auth ships (“Preview — changes are not saved”).

### Creation prompt — Account shell

```text
Design the shared Wheelio TN account chrome for /account/* pages.

Monochrome black/white/zinc, Host Grotesk, light+dark.
Every account page includes:
1) Identity strip: avatar initials, display name, email, status chip (Guest preview | Signed in demo)
2) Secondary nav: Overview · Profile · Drivers · Preferences · Notifications · Security · Privacy
3) Mobile: “Account menu” sheet with the same links + Log out
4) Persistent guest note if not authenticated: Continue as guest → /search · Find booking → /bookings/find
5) Footer support strip: Help · Contact · desk hours

Match existing PageShell / trips styling. Accessible focus rings. Skeleton loaders for demo data.
```

---

## 3. Auth — Log in (`/login`)

**Priority:** P0  
**Status:** Stub form

### Job
Sign in returning customers; never block booking.

### UI
1. Title: Log in
2. Methods toggle (MVP): **Email + password** | **Email magic link**
3. Fields: email, password (password mode)
4. Links: Forgot password · Sign up · Continue as guest · Find booking
5. States: loading, invalid credentials, unverified email, rate limited
6. After success: redirect `?next=` or `/account`

### Creation prompt — Login

```text
Rebuild Wheelio TN /login as a polished guest-safe auth screen.

Monochrome, max-w-md, calm.
Two tabs: Password | Magic link.
Password: email + password, Log in CTA, Forgot password link.
Magic link: email only, “Email me a link”, success state “Check your inbox”.
Always show: Continue as guest → /search, Find a booking → /bookings/find, Sign up link.
Error states in plain language. Demo submit can simulate success → /account?demo=1.
No social login clutter unless we add Google later as secondary.
```

---

## 4. Auth — Sign up (`/signup`)

**Priority:** P0  
**Status:** Stub form

### Job
Create optional account; pre-fill from last guest checkout when possible (demo).

### UI
1. Full name, email, phone (optional), password + confirm (or magic-link-only signup)
2. Language default EN/FR/AR
3. Marketing opt-in unchecked by default
4. Legal: accept Terms + Privacy (links)
5. Success → verify email interstitial OR `/account` with banner

### Creation prompt — Signup

```text
Rebuild Wheelio TN /signup.

Fields: full name, email, phone optional, password (+ strength hint), language select, unchecked marketing opt-in, required Terms/Privacy checkboxes with links.
Primary CTA Create account. Secondary Continue as guest.
After submit (demo): go to /auth/verify with email shown.
Explain benefits in one short list: trip history, saved drivers, faster rebook — not a sales page.
Monochrome, mobile-first, accessible labels.
```

---

## 5. Auth — Magic link (`/auth/magic`, `/auth/verify`)

**Priority:** P0 (preferred Tunisia-friendly path)  
**Status:** Missing

### Job
Passwordless entry via email; handle open-on-phone / open-on-desktop.

### UI
- Request link form
- “Check your email” waiting state + resend cooldown
- Verify landing: success / expired / already used
- Deep link handoff copy if opened on wrong device

### Creation prompt — Magic link

```text
Create Wheelio TN /auth/magic and /auth/verify pages.

Magic: email field, Send link, 60s resend cooldown demo, guest escapes.
Verify: three states — Verified (CTA Continue to account), Link expired (request new), Already used.
Calm monochrome. No countdown gamification. Africa/Tunis timestamps on “sent at” if shown.
```

---

## 6. Auth — Forgot / reset password

**Priority:** P1  
**Status:** Missing

### Routes
- `/forgot-password`
- `/reset-password?token=…`

### Creation prompt — Password recovery

```text
Design Wheelio TN forgot-password and reset-password screens.

Forgot: email → “If an account exists, we sent a link” (no email enumeration).
Reset: new password + confirm, strength hint, success → /login.
Monochrome, minimal, accessible. Link back to magic link as alternative.
```

---

## 7. Auth — Logout (`/logout` or confirm)

**Priority:** P0  
**Status:** Missing

### Job
Clear session; confirm if unfinished profile edits (demo toast ok).

### Creation prompt — Logout

```text
Add Wheelio TN logout confirmation (modal or /logout page).

Copy: You’ll return to guest mode. Trips already booked stay reachable via Find booking.
CTA Log out · Cancel. After logout → / with toast “Signed out”.
```

---

## 8. Account home (`/account`) — enhance hub

**Priority:** P0  
**Status:** Partial hub

### Job
Signed-in landing: who I am + what’s next + shortcuts.

### UI add
1. Identity card (name, email, member since demo)
2. **Next trip** teaser (from `listDemoTrips` upcoming) → manage / voucher
3. Action needed count → notifications
4. Shortcut grid (keep existing cards)
5. Log out
6. Guest state variant: “You’re browsing as guest” + Log in / Sign up / Find booking

### Creation prompt — Account home

```text
Enhance Wheelio TN /account into a real account home.

Signed-in (demo): identity strip, next upcoming trip card, notifications badge count, existing shortcut grid, Log out.
Guest: explain guest mode, CTAs Log in / Sign up / Find booking / Your trips (demo list still viewable).
Monochrome. No dashboard KPI spam. One next-trip focus only.
```

---

## 9. Profile — personal details (`/account/profile`)

**Priority:** P0  
**Status:** Static stub

### Job
Edit the person behind the bookings.

### Fields
| Field | Notes |
|---|---|
| Full name | As on ID / passport |
| Preferred name | Optional display |
| Email | Change → verify flow |
| Phone | +216 default country; SMS opt-in separate |
| Date of birth | Optional; age band for rentals |
| Nationality / residence country | For licence context |
| Language | EN / FR / AR |
| Address (optional) | Billing / invoice later |
| Avatar | Initials default; optional upload P3 |

### UI
- Sectioned form with sticky Save on mobile
- Unsaved changes guard
- “Used at checkout” microcopy
- Link: Change email · Change phone verify
- Move notification toggles to `/account/notifications/settings` (keep short link here)

### Creation prompt — Profile details

```text
Rebuild Wheelio TN /account/profile as a complete personal details page.

Sections: Identity, Contact, Language, Optional address.
Sticky Save bar. Demo toast “Saved (preview)”.
Email change opens confirm step. Phone with Tunisia +216 default.
Show AccountShell subnav. Link to Drivers and Security.
Monochrome settings UI, calm SaaS-meets-travel — not social profile.
```

---

## 10. Saved drivers vault (`/account/drivers`)

**Priority:** P0  
**Status:** Embedded stub on profile only

### Job
Store main + additional drivers for faster checkout.

### Driver fields
- Full name (as on licence)
- Date of birth / age band
- Licence country
- Licence number (masked display)
- Licence expiry
- Licence category (B default)
- Primary driver flag
- Notes (optional)

### Pages
- List `/account/drivers`
- Create `/account/drivers/new`
- Edit `/account/drivers/[id]`
- Delete confirm

### Creation prompt — Drivers

```text
Build Wheelio TN saved drivers vault.

/account/drivers list with Primary badge, Edit, Delete.
/new and /[id] forms with licence country, number, expiry, age band, primary toggle.
Empty state: Add your main driver for faster checkout.
Checkout integration note: “We’ll offer these at booking step 1”.
Monochrome. No fake licence OCR for MVP — upload placeholder “Coming with verified accounts”.
```

---

## 11. Preferences (`/account/preferences`)

**Priority:** P1  
**Status:** Missing (language buried in profile)

### Job
Defaults that shape search + booking UX.

### Prefs
- Language EN/FR/AR
- Theme: System / Light / Dark (wire to existing theme toggle)
- Default driver age band
- Default extras interests (child seat, additional driver) — soft prefs only
- Home city / usual pickup (Tunis-Carthage, etc.)
- Currency note: Prices always TND (read-only explanation)

### Creation prompt — Preferences

```text
Create Wheelio TN /account/preferences.

Controls: language, theme (system/light/dark), default driver age, usual pickup location select, optional extras interests checkboxes.
Read-only callout: All marketplace prices stay in Tunisian dinar (TND).
Save demo toast. Monochrome. Keep it one scroll — not a control panel jungle.
```

---

## 12. Notification settings (`/account/notifications/settings`)

**Priority:** P1  
**Status:** Partially on profile

### Job
Channel + event matrix; separate from the activity feed.

### Matrix
| Event | Email | SMS | Push (later) |
|---|---|---|---|
| Booking status changes | ✓ | ✓ | — |
| Pickup / return reminders | ✓ | ✓ | — |
| Agency messages | ✓ | optional | — |
| Payment receipts | ✓ | — | — |
| Marketing / guides | opt-in | — | — |

### Creation prompt — Notification settings

```text
Create Wheelio TN /account/notifications/settings.

Table or stacked rows: event × Email/SMS toggles.
Marketing opt-in separate and off by default.
Link back to activity feed /account/notifications.
Copy: SMS uses desk-time sending; not 24/7 blast.
Monochrome, accessible switches with labels.
```

---

## 13. Security (`/account/security`)

**Priority:** P1  
**Status:** Missing

### Job
Password, sessions, account recovery.

### UI
1. Change password
2. Magic link as alternate sign-in (toggle)
3. Active sessions list (demo devices) + Revoke
4. Recent security events (login success/fail demo)
5. 2FA placeholder “Coming soon” (no fake enable)

### Creation prompt — Security

```text
Build Wheelio TN /account/security.

Sections: Password change form, Sign-in methods, Active sessions (demo revoke), Recent activity list.
No fake 2FA enable — show Coming soon.
Monochrome, serious tone. Success/error toasts.
```

---

## 14. Privacy & data (`/account/privacy`)

**Priority:** P1  
**Status:** Missing

### Job
Transparency + delete path (Tunisia/GDPR-minded marketplace).

### UI
1. Download my data (demo JSON)
2. Delete account request (confirm type DELETE)
3. What we store (short plain list + link Privacy policy)
4. Marketing consent status

### Creation prompt — Privacy

```text
Create Wheelio TN /account/privacy.

Actions: Download data (demo), Request delete account (typed confirm), view consents.
Explain Wheelio is a marketplace intermediary; booking records may be retained for legal/accounting with agencies.
Link /privacy. Monochrome. Careful legal-safe copy — not scary, not vague.
```

---

## 15. Payments methods (`/account/payments`) — customer wallet UI

**Priority:** P2  
**Status:** Missing  
**Note:** Do **not** invent full PCI vault. Placeholder / masked demo only.

### Job
Show how online deposits were paid; optional saved card for faster pay (future PSP).

### UI
- Masked card •••• 4242 (demo)
- Add payment method → “Available when payments go live”
- Link to per-booking `/bookings/[id]/payments`
- Invoice email = profile email

### Creation prompt — Account payments

```text
Design Wheelio TN /account/payments placeholder.

Show one masked demo card, empty add-method state explaining payments provider coming soon.
List recent payment receipts linking to booking payment pages.
Never ask for raw full PAN in demo. Monochrome finance calm.
```

---

## 16. Claim guest booking (`/account/claim`)

**Priority:** P0  
**Status:** Missing (find booking exists for guests)

### Job
After signup/login, attach past guest bookings (reference + email) to this account.

### UI
1. Reference + email (must match)
2. Success → booking appears under /trips
3. Failure calm errors
4. Bulk: “We’ll also look for bookings with your account email” (demo)

### Creation prompt — Claim booking

```text
Build Wheelio TN /account/claim.

Form: booking reference + checkout email. CTA Attach to my account.
Success: toast + link to /bookings/[id]. Explain this is how guest trips join your history.
Reuse find-booking validation patterns. Monochrome.
```

---

## 17. Header account menu (global chrome)

**Priority:** P0  
**Status:** Missing (plain Account link)

### Guest menu
- Log in
- Sign up
- Find booking
- Your trips (demo)

### Signed-in menu
- Account home
- Trips
- Profile
- Notifications (dot if unread)
- Log out

### Creation prompt — Header menu

```text
Upgrade Wheelio TN site header Account control into a dropdown/sheet menu.

Guest vs signed-in variants as specified. Initials avatar when signed in.
Keyboard accessible. Monochrome. Keep Find a car primary CTA unchanged.
Mobile: include items in existing drawer if present, or account sheet.
```

---

## 18. Post-auth onboarding (`/account/welcome`)

**Priority:** P2  
**Status:** Missing

### Job
One-time 3-step after first signup: add phone → add primary driver → claim a booking (skippable).

### Creation prompt — Welcome

```text
Create Wheelio TN /account/welcome onboarding.

Three skippable steps: phone, primary driver, claim booking. Progress dots. Done → /account.
Monochrome, short copy, never block /search.
```

---

## 19. Wishlist / saved searches (optional)

**Priority:** P3  
**Status:** Missing

### Routes
- `/account/saved` — saved offers + saved search queries

### Creation prompt — Saved

```text
Optional later: Wheelio TN /account/saved for saved cars and search queries.

List with Remove and Search again. Empty state. Monochrome. Only if it doesn’t distract from booking completion.
```

---

## 20. Demo user model (for local UI)

Define a single `DemoUser` shape (even if mocked in `lib/user.ts`):

```ts
type DemoUser = {
  id: string
  name: string
  email: string
  phone?: string
  language: "en" | "fr" | "ar"
  theme: "system" | "light" | "dark"
  createdAt: string
  emailVerified: boolean
  marketingOptIn: boolean
  drivers: DemoDriver[]
  notificationPrefs: Record<string, { email: boolean; sms: boolean }>
}
```

Signed-out = `null`. Demo login sets `localStorage` flag `wheelio-demo-session=1`.

### Creation prompt — Demo session

```text
Add Wheelio TN lib/user.ts + demo session helper (localStorage).

demoLogin(), demoLogout(), getDemoUser(), listSavedDrivers().
Wire AuthForm success and header menu to this session so UI can toggle guest vs member without a backend.
```

---

## 21. State matrix (every account page)

| State | Treatment |
|---|---|
| Guest | CTA to log in; show what they’ll unlock; never dead-end |
| Signed-in demo | Full forms; “Preview — not persisted to server” banner |
| Loading | Skeletons matching final layout |
| Error | Retry + Contact support |
| Empty drivers | Add driver CTA |
| Empty notifications | “You’re all caught up” |
| Unverified email | Banner + Resend |

---

## 22. Priority build order

### Sprint U1 — “I can sign in (demo) and see myself” (P0)
1. Demo session (`lib/user.ts`)
2. Rebuild `/login` + `/signup` (password + magic request)
3. `/auth/magic` + `/auth/verify` (UI states)
4. Header account menu (guest vs signed-in)
5. Enhance `/account` home (identity + next trip + logout)
6. Rebuild `/account/profile` (real sections + save toast)
7. `/account/drivers` list + new/edit
8. `/account/claim`
9. `/logout` confirm

### Sprint U2 — “Settings depth” (P1)
10. `/forgot-password` + `/reset-password`
11. `/account/preferences`
12. `/account/notifications/settings`
13. `/account/security`
14. `/account/privacy`
15. Footer Account / Login links
16. Wire theme preference to ThemeToggle

### Sprint U3 — “Polish & optional” (P2–P3)
17. `/account/welcome` onboarding
18. `/account/payments` placeholder
19. `/account/saved` wishlist
20. Email change / phone verify microflows
21. Avatar upload (optional)

---

## 23. Page map — account & auth only

| Route | Page | Priority | Status |
|---|---|---|---|
| `/login` | Log in | P0 | Stub → rebuild |
| `/signup` | Sign up | P0 | Stub → rebuild |
| `/auth/magic` | Magic link request | P0 | Missing |
| `/auth/verify` | Magic / email verify | P0 | Missing |
| `/forgot-password` | Forgot | P1 | Missing |
| `/reset-password` | Reset | P1 | Missing |
| `/logout` | Log out confirm | P0 | Missing |
| `/account` | Account home | P0 | Partial hub |
| `/account/welcome` | Onboarding | P2 | Missing |
| `/account/profile` | Personal details | P0 | Stub |
| `/account/drivers` | Drivers list | P0 | Missing |
| `/account/drivers/new` | Add driver | P0 | Missing |
| `/account/drivers/[id]` | Edit driver | P0 | Missing |
| `/account/preferences` | Prefs | P1 | Missing |
| `/account/notifications` | Activity feed | P1 | Demo exists |
| `/account/notifications/settings` | Channel prefs | P1 | Missing |
| `/account/security` | Security | P1 | Missing |
| `/account/privacy` | Privacy / delete | P1 | Missing |
| `/account/payments` | Payment methods | P2 | Missing |
| `/account/claim` | Claim guest booking | P0 | Missing |
| `/account/saved` | Wishlist | P3 | Missing |

---

## 24. End-to-end user identity journey

```text
Guest books → confirmation email
  → optional Sign up
      → verify email
          → welcome (phone → driver → claim booking)
              → account home
                  → profile / drivers / prefs
                  → trips (already built)
                  → security / privacy

Guest returns later
  → /bookings/find  OR  /login (magic link)
      → claim booking if needed
          → same account surfaces
```

---

## 25. Component inventory

Create / reuse:
- `AccountShell` (subnav + identity strip)
- `AccountSubnav`
- `AuthCard` / rebuild `AuthForm`
- `MagicLinkForm`
- `PasswordFields` (show/hide, strength)
- `DemoSessionBanner`
- `UserAvatar` (initials)
- `AccountMenu` (header dropdown)
- `DriverCard` / `DriverForm`
- `PrefsGroup`
- `NotificationMatrix`
- `SessionRow`
- `DangerZone` (delete account)
- `ClaimBookingForm`
- `NextTripTeaser`
- Reuse: `PageShell`, `PageHero`, `ThemeToggle`, trips helpers

---

## 26. Copy principles (account)

1. Say **Log in** / **Sign up** / **Log out** — not “Signin” mashups.
2. Prefer **Save changes** over Submit.
3. Errors name the fix: “Check your email and password.”
4. Never shame guests for not registering.
5. Delete/privacy language: clear, calm, non-alarmist.
6. Benefits of account in one breath: history, drivers, faster rebook.

---

## 27. Master prompt — generate the full account & auth set

```text
You are designing the complete customer account, profile, and authentication experience for Wheelio TN (Tunisia multi-agency car rental marketplace).

Hard constraint: guest checkout and Find booking always work without an account.

Stack: Next.js App Router, TypeScript, Tailwind, existing monochrome Wheelio system, demo trips in lib/bookings.ts.

Implement UI/UX for all P0 then P1 routes in WHEELIO_USER_ACCOUNT_AUTH_UIUX_PROMPTS.md:
- wireframe-level layout
- guest vs signed-in states
- demo session via localStorage
- empty/loading/error
- mobile + desktop
- English copy
- accessibility
- AccountShell on /account/*
- Header AccountMenu

Do not build agency portal, admin, or real IdP integration yet — demo session is enough for UI fidelity.
Keep /trips as the reservation hub; account owns identity and settings only.
```

---

## 28. Out of scope

- Real OAuth / Clerk / Auth.js production wiring (document hooks only)
- Agency staff accounts
- KYC / licence OCR verification backend
- Full PCI card vault
- Social profile / followers
- Loyalty points
- Admin impersonation

---

## 29. Relationship to trips (do not re-build)

Already covered in post-booking doc — link only from account:
- `/trips`, `/trips/calendar`
- `/bookings/[id]/*`
- `/bookings/find`

Account teaser → deep link. Single source of truth for reservations remains bookings/trips.

---

*Document version: 1.0 — User account, profile & auth UI/UX prompts for Wheelio TN*  
*Covers the last customer-facing identity surfaces after search, checkout, and trip tracking*
