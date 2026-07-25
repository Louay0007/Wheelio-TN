# Wheelio TN — Client Pages UI/UX Spec & Creation Prompts

**Product:** Tunisia-first multi-agency car rental marketplace  
**Audience:** Customers (renters), not agency portal / admin  
**Currency:** Tunisian dinar (TND / DT)  
**Languages (architecture-ready):** English, French, Arabic (RTL)  
**Visual system:** Monochrome black / white / zinc; light + dark mode; Host Grotesk; rectangular controls (`rounded-[6–8px]`); no purple/cream AI defaults  

Use each **Creation prompt** block as a design or coding brief. Keep prompts intact when generating screens.

---

## 0. Global design system (apply to every page)

### Shared chrome
- Sticky or static header: Wheelio icon + wordmark, primary nav, theme toggle, language switcher (EN / FR / AR), **Find a car** CTA.
- Footer: brand block, Explore / Support / Legal columns, contact (`hello@wheelio.tn`, Tunis), languages, social icons, copyright, TND note.
- Mobile: hamburger drawer; bottom-safe CTAs where needed.

### Interaction rules
- Primary CTA: solid black (light) / solid white (dark).
- Secondary CTA: outline border.
- Total **mandatory price** always more prominent than per-day price.
- **Security / refundable deposit** always shown separately (never mixed into “total to pay” without a label).
- Confirmation type badge: **Instant** vs **Request to book**.
- “Vehicle or similar” disclosure whenever category/pooled inventory is used.
- Empty, loading, error, and offline states required on every data page.
- WCAG 2.2 AA: focus rings, contrast, labels, keyboard, reduced motion.
- Mobile-first; optimize for slow connections (lazy images, skeleton loaders).

### Creation prompt — Global shell

```text
Design and implement the shared Wheelio TN customer shell for a Next.js + Tailwind + TypeScript app.

Product: Tunisia multi-agency car rental marketplace (Skyscanner-like compare + book).
Visual: monochrome black/white/zinc only, light and dark mode, Host Grotesk, crisp borders, restrained motion (Framer Motion ok), no purple gradients, no cream terracotta look, no glow spam.

Include:
1) Header: logo (icon + Wheelio), links (How it works, Locations, Reviews, Help), theme toggle, language EN/FR/AR, Find a car.
2) Footer: logo, short marketplace description, email + Tunis location, columns Explore / Support / Legal, EN FR AR, Instagram Facebook LinkedIn, © Wheelio TN, “Prices in TND”.
3) Responsive drawer for mobile.
4) Accessible focus states and skip-to-content link.

Match existing Wheelio landing aesthetic already on the site.
```

---

## 1. Home / Landing (`/`)

**Status:** Partially built (Hero, logos, rental search, testimonials, footer).

### Job
Convert visitors into a search; build trust; route agencies to partner interest later (secondary).

### UI sections (top → bottom)
1. Full-bleed coastal hero + brand + headline + Find a car / List your agency.
2. Trusted partners logo marquee.
3. Rental search bar (pickup, optional different return, dates/times, driver age, Search).
4. Testimonials scroller.
5. Optional later: How it works strip, featured locations, FAQ teaser.
6. Footer.

### States
- Search validation errors (missing location, return before pickup).
- Theme light/dark continuity across sections and car artwork.

### Creation prompt — Home

```text
Refine the Wheelio TN landing page for a Tunisia car-rental marketplace.

Keep monochrome light/dark design. First viewport: brand-forward hero with one headline (“Compare rental cars across Tunisia”), one short support line, CTAs Find a car + List your agency, full-bleed coastal car image, soft fade into next section. No cards or badges overlaid on the hero image.

Below hero: logo trust marquee, then a prominent rental search panel with:
- Pickup location (Tunisian airports/cities)
- Toggle: return to different location (+ drop-off field)
- Pickup date/time, drop-off date/time
- Driver age
- Primary Search CTA
- Note: “Prices shown in TND”
Place optional car cutout beside search on desktop; keep form readable.

Then testimonials, then full footer. Mobile-first. Accessible. Use existing tokens and components where possible.
```

---

## 2. Search results (`/search`)

**Priority:** P0 — next page after landing.

### Job
Compare normalized offers from multiple agencies for a given trip.

### Layout
- **Top sticky search summary bar:** editable chips (location, dates, times, age, passengers if added) + Modify search.
- **Left filters (desktop) / bottom sheet (mobile):**
  - Total price range
  - Category (economy, compact, SUV, van, luxury)
  - Seats, luggage
  - Transmission (auto / manual)
  - Fuel
  - Mileage (limited / unlimited)
  - Deposit amount
  - Cancellation (free until X / non-refundable)
  - Confirmation (instant / request)
  - Pickup method (counter / meet & greet / delivery)
  - Agency rating
- **Main list:** offer cards sorted by Recommended / Total price / Rating / Deposit / Capacity.
- **Empty state:** “No cars for these dates” + suggestions (widen dates, nearby location).
- **Map optional (phase 2):** pickup points; not required for MVP.

### Offer card anatomy
- Vehicle image + category label + “or similar” if applicable
- Model name / category
- Key specs icons: seats, bags, transmission, AC, fuel
- Agency name + rating stars (compact)
- Badges: Instant / Request to book, Free cancellation, Unlimited km
- **Total price (large)** + per-day (small) in TND
- Deposit line (secondary): “Refundable deposit from X TND”
- CTA: View deal

### Ranking note (UI)
- “Recommended” default.
- Sponsored rows must say **Sponsored**.

### Creation prompt — Search results

```text
Create the Wheelio TN /search results page UI for a multi-agency car rental marketplace in Tunisia.

Context: user already chose pickup/return, dates/times, driver age. Currency TND. Monochrome black/white/zinc, light+dark.

Desktop: sticky trip summary bar; left filter sidebar; right vertical list of offer cards.
Mobile: summary bar; filter button opens bottom sheet; full-width cards.

Each offer card must show: car image, category, “or similar” when needed, seats/bags/transmission, agency + rating, badges (Instant or Request to book, cancellation, mileage), TOTAL price large, per-day small, refundable deposit separately, View deal CTA.

Filters: price, category, seats, luggage, transmission, fuel, mileage, deposit, cancellation, confirmation type, pickup method, rating.
Sort: Recommended, Total price, Rating, Deposit, Capacity.

Include loading skeletons, zero-results state, error retry. Clear hierarchy: total price never buried. No colorful marketing clutter. Production-quality Tailwind + TypeScript React.
```

---

## 3. Offer / vehicle detail (`/cars/[offerId]`)

**Priority:** P0.

### Job
Explain the full deal so the customer understands price, rules, and agency before checkout.

### Layout
- **Gallery:** main image + thumbnails (grayscale-friendly).
- **Title block:** category / model, or similar, seats, bags, transmission, fuel, AC.
- **Sticky price rail (desktop right / mobile bottom):**
  - Total mandatory price
  - Per day
  - Deposit (separate)
  - Confirmation type
  - CTA Continue / Request to book
  - Timer if hold exists (“Price held for 12:00”)
- **Tabs or stacked sections:**
  1. What’s included
  2. Price breakdown (rental + mandatory fees + delivery − discounts = total)
  3. Mileage & fuel policy
  4. Protection / insurance summary + exclusions
  5. Driver requirements & documents
  6. Pickup instructions & location map/static pin
  7. Cancellation & no-show
  8. Agency profile (name, rating, response style)
- **Important notices:** young driver fee, after-hours, one-way fee if applicable.

### Creation prompt — Offer detail

```text
Design Wheelio TN offer detail page /cars/[offerId].

Goal: transparent car-rental deal page for Tunisia marketplace. Monochrome light/dark UI.

Show photo gallery, vehicle title with “or similar” if pooled category, spec chips, and a sticky booking rail with TOTAL mandatory price in TND (dominant), per-day secondary, refundable deposit separate, Instant vs Request badge, primary Continue CTA.

Body sections with clear typography (not cards-for-everything):
- Included features
- Itemized price breakdown
- Mileage and fuel policy in plain language
- Protection inclusions/exclusions
- Documents & minimum age
- Pickup method and location
- Cancellation / no-show
- Agency trust block (name, rating, short verification note)

Mobile: bottom sticky CTA bar. Accessible. Avoid hidden fees UX. Copy should feel local and clear, not corporate ERP boilerplate.
```

---

## 4. Checkout (`/checkout`)

**Priority:** P0.

### Job
Collect booking data, extras, consent; start payment or request-to-book.

### Layout (multi-step or single long form with sticky summary)
1. **Trip recap** (editable link back to search).
2. **Contact:** name, email, phone (Tunisia + intl formats).
3. **Main driver:** full name as on license, age confirmation, license country.
4. **Flight / arrival (optional but recommended for airport):** flight number, landing time.
5. **Extras:** child seat, additional driver, GPS, full-to-full prepaid fuel if offered — each with price.
6. **Payment choice:**
   - Pay booking deposit online (if enabled)
   - Pay at agency
   - Full prepay (later phase)
7. **Terms:** accept customer terms + cancellation summary checkbox.
8. **Sticky order summary:** total, deposit due now vs at pickup, hold countdown.

### States
- Validation inline errors.
- Hold expired → reload offer.
- Idempotent submit (double-click safe).
- Pending agency vs payment pending messaging.

### Creation prompt — Checkout

```text
Build Wheelio TN checkout /checkout for car rental marketplace.

Monochrome UI, light/dark, mobile-first. Left/main form + right sticky summary on desktop; stacked on mobile with sticky total bar.

Form blocks:
- Trip summary
- Contact details
- Main driver details
- Optional flight number for airport pickup
- Add-ons with TND prices
- Payment mode: deposit online OR pay at agency (clear copy)
- Required terms acceptance with plain-language cancellation summary

Summary must separate: mandatory rental total, extras, amount due now, refundable security deposit at pickup.
Show Instant confirmation vs “Agency will confirm within X hours”.
Prevent double submit. Strong error and expired-hold states. No visual clutter; trust through clarity.
```

---

## 5. Confirmation (`/bookings/[id]/confirmation`)

**Priority:** P0.

### Job
Reassure the customer that the request/booking exists and what happens next.

### UI
- Success header with large booking reference.
- Status chip: Confirmed / Pending agency / Payment pending.
- Trip + car + agency summary.
- What to bring checklist.
- Pickup time/place map or address.
- CTAs: Add to calendar, Manage booking, Contact support (WhatsApp/email).
- Email/SMS note.

### Creation prompt — Confirmation

```text
Create Wheelio TN booking confirmation screen.

Celebrate without confetti spam. Monochrome. Large booking reference, clear status badge (Confirmed / Waiting for agency / Payment pending), summary of car, dates, location, total TND, deposit note, agency name.

Checklist: documents to bring, pickup instructions, response deadline if request-to-book.
CTAs: Manage booking, Download/print voucher (simple), Contact support.
Mobile-optimized. Accessible status text not color-only.
```

---

## 6. Manage booking (`/bookings/[id]`)

**Priority:** P0.

### Job
View status history, cancel if allowed, update contact/flight, contact support.

### UI
- Status timeline: requested → held → confirmed → active → completed (and exit states).
- Booking details editable where policy allows (phone, flight).
- Cancellation panel: policy quote + refundable amount estimate + confirm dialog.
- Documents: voucher PDF link.
- Support: open case / WhatsApp deep link.
- If pending agency: countdown / expected response window.

### Creation prompt — Manage booking

```text
Design Wheelio TN manage booking page /bookings/[id].

Show status timeline, trip details, price snapshot (immutable quote), agency contact rules, voucher access.
Cancellation flow: explain policy, show estimated refund, confirm modal, success/failure toasts.
Allow editing flight number and phone when booking not yet active.
If request-to-book pending, show waiting state and agency deadline.
Monochrome, calm, operational UI—more airline manage-booking than social feed.
```

---

## 7. How it works (`/how-it-works`)

**Priority:** P1.

### Job
Reduce first-time anxiety; explain marketplace model.

### UI
- 4–5 horizontal/vertical steps: Search → Compare totals & policies → Book or request → Get confirmation → Pickup.
- Callouts: Instant vs Request; why total price matters; deposit vs rental.
- CTA to search.
- Optional short video placeholder later.

### Creation prompt — How it works

```text
Create Wheelio TN /how-it-works page.

Editorial monochrome layout. One composition per section. Steps:
1) Search Tunisian locations and dates
2) Compare agencies with total TND prices and clear conditions
3) Book instantly or send a request
4) Receive confirmation and voucher
5) Pickup with required documents

Explain Instant vs Request-to-book and deposit vs rental cost in plain language.
End with Find a car CTA. No dense card grids. Light and dark modes.
```

---

## 8. FAQ (`/faq`)

**Priority:** P1.

### Job
Answer rental questions before support load.

### Topics (accordion)
- Minimum age / young driver fees
- Documents (license, passport/ID, credit card)
- Deposit holds
- Fuel policy
- Mileage
- One-way / different return
- Airport pickup after hours
- Cancellation
- Who to contact if car unavailable
- Payment methods (online deposit vs pay at agency)
- Language of contracts

### Creation prompt — FAQ

```text
Build Wheelio TN FAQ page with accessible accordion.

Categories: Booking, Prices & deposits, Documents & age, Pickup & return, Cancellation, Payments.
Answers specific to Tunisia car rental marketplace context (TND, local agencies, airport pickups).
Search box to filter questions. Monochrome. Mobile-friendly large tap targets. Link to Help/Contact.
```

---

## 9. Help center & contact (`/help`, `/help/[article]`, `/contact`)

**Priority:** P1.

### Job
Self-serve articles + escalation.

### UI
- Help hub: search + topic cards (Booking, Pickup problems, Refunds, Account).
- Article template: title, updated date, steps, related links.
- Contact: email, WhatsApp button, form (booking ref optional), expected response time (do not promise 24/7 unless true).

### Creation prompt — Help & contact

```text
Design Wheelio TN help center and contact pages.

Help hub with search and topic tiles. Article layout with clear steps and “Was this helpful?”.
Contact page with form (name, email, booking reference optional, message), WhatsApp CTA, email hello@wheelio.tn / support@wheelio.tn.
Set honest support hours copy. Monochrome trust-focused UI. Light/dark.
```

---

## 10. Locations hub & location landing (`/locations`, `/locations/[slug]`)

**Priority:** P1 (SEO + demand).

### Job
Capture “car rental Tunis / Djerba / Monastir airport” intent.

### Locations hub
- Grid of cities/airports with image, starting-from price (optional), short blurb.
- Launch set: Tunis-Carthage, Tunis Centre, Monastir, Sousse, Enfidha-Hammamet, Djerba, Hammamet, Sfax.

### Location landing
- H1: “Car rental in {Place}”
- Embedded search prefilled with location
- Why rent here
- Popular categories
- Tips (airport desk vs delivery)
- FAQ subset
- Internal links to other locations

### Creation prompt — Locations

```text
Create Wheelio TN locations system: /locations index + /locations/[slug] landings for Tunisian cities/airports.

Monochrome, SEO-friendly, brand-first headers without clutter.
Each location page: prefilled search widget, short local intro, popular car types, pickup tips, FAQ, links to other destinations.
No fake stats. Emphasize comparing local agencies in TND. Mobile-first.
```

---

## 11. Car types (`/cars/types`, `/cars/types/[type]`)

**Priority:** P2.

### Job
SEO + guided browsing by category.

### UI
- Type cards: Economy, Compact, Intermediate, SUV, Van/Minivan, Automatic, Luxury.
- Type page: description, who it’s for, sample offers CTA into search with filter applied.

### Creation prompt — Car types

```text
Design Wheelio TN car types browse pages.

Index of categories with simple icons/photography, short benefit lines, CTA “See cars”.
Detail page explains category, typical use (city, family, airport), and button launching search with that filter.
Monochrome marketplace aesthetic, not dealership brochure spam.
```

---

## 12. Agencies directory & agency public profile (`/agencies`, `/agencies/[slug]`)

**Priority:** P2.

### Job
Trust and transparency for local partners (DiscoverCars-style supplier list, localized).

### Directory
- Verified agencies list with city coverage, rating, response style (instant share %).
- Filters by city.

### Public profile
- Agency story, branches, policies summary, ratings, sample fleet CTA to search filtered by agency.
- Verification badges (documents reviewed — careful legal wording).

### Creation prompt — Agencies

```text
Create Wheelio TN public agency directory and agency profile pages.

Directory: searchable list of verified Tunisian rental agencies with location coverage and rating.
Profile: agency name, verification note, branches, policy highlights, reviews excerpt, CTA to view available cars.
Keep neutral marketplace tone. Monochrome. No fake certifications.
```

---

## 13. Reviews hub (`/reviews`)

**Priority:** P2 (home already has teaser).

### Job
Aggregate social proof; filter by location/agency.

### UI
- Overall score
- Filters
- Review cards (trip month, car category, agency, rating, text)
- “Write a review” only for completed bookings (gate later)

### Creation prompt — Reviews hub

```text
Build Wheelio TN /reviews page.

Large overall rating, filters (location, rating), scrolling/paginated review list with avatar, name, role/trip context, quote, agency name.
Match testimonial-v2 aesthetic but as a full page with filters. Light/dark monochrome.
```

---

## 14. Account — auth & profile (`/login`, `/signup`, `/account`)

**Priority:** P2 (guest checkout first).

### Job
Optional accounts for booking history; never block checkout.

### UI
- Login / signup: email magic link or password; phone optional later.
- Account home: upcoming bookings, past trips, saved drivers, preferences (language).
- Security: logout, delete request link.

### Creation prompt — Account

```text
Design Wheelio TN customer auth and account pages.

Guest checkout remains possible. Login/signup minimal monochrome forms.
Account dashboard lists upcoming and past bookings with status chips and deep links to manage booking.
Profile: name, email, phone, language. Calm SaaS-meets-travel UI, not social network.
```

---

## 15. Legal (`/terms`, `/privacy`, `/cookies`, `/cancellation-policy`)

**Priority:** P1 before payments.

### Job
Publish policies customers must accept.

### UI
- Readable long-form typography
- Sticky table of contents on desktop
- Last updated date
- Language note (official version)

### Creation prompt — Legal pages

```text
Create Wheelio TN legal page templates for Terms, Privacy, Cookies, Cancellation.

Clean typographic layout, TOC, last updated, print-friendly. Monochrome. Placeholders for lawyer-reviewed Tunisia-specific clauses (marketplace intermediary role, payments, deposits, data). Not decorative.
```

---

## 16. Content guides (`/guides`, `/guides/[slug]`)

**Priority:** P2–P3.

### Suggested guides
- What you need to rent a car in Tunisia
- Airport pickup at Tunis-Carthage
- Understanding deposits and insurance excess
- Manual vs automatic for Tunisia trips
- Diaspora summer rental tips

### Creation prompt — Guides

```text
Design Wheelio TN guides blog/resources section.

Index + article template with hero title, short intro, structured headings, CTAs to search cars mid-article and end.
Editorial monochrome travel-marketplace look. Optimized for mobile reading.
```

---

## 17. About (`/about`)

**Priority:** P2.

### Job
Explain Wheelio as Tunisia marketplace, not a fleet owner.

### UI
- Mission
- How marketplace works
- Trust & verification approach
- Team/contact
- CTA search + partner

### Creation prompt — About

```text
Create Wheelio TN about page.

Position Wheelio as a multi-agency car rental marketplace for Tunisia: compare local agencies, clear TND totals, reliable booking.
Sections: mission, how supply works, customer promise, contact. Monochrome brand-first layout. No fake global scale claims.
```

---

## 18. 404 / system pages

### Creation prompt — System

```text
Design Wheelio 404 and generic error pages.

Helpful monochrome screens with link home and Find a car. Optional search widget on 404. Light/dark.
```

---

## Page map (client only)

| Route | Page | MVP priority |
|---|---|---|
| `/` | Home + search | Done / polish |
| `/search` | Results | P0 |
| `/cars/[offerId]` | Offer detail | P0 |
| `/checkout` | Checkout | P0 |
| `/bookings/[id]/confirmation` | Confirmation | P0 |
| `/bookings/[id]` | Manage booking | P0 |
| `/how-it-works` | How it works | P1 |
| `/faq` | FAQ | P1 |
| `/help` | Help center | P1 |
| `/contact` | Contact | P1 |
| `/terms` `/privacy` `/cookies` `/cancellation-policy` | Legal | P1 |
| `/locations` `/locations/[slug]` | SEO locations | P1 |
| `/cars/types` `/cars/types/[type]` | Categories | P2 |
| `/agencies` `/agencies/[slug]` | Partners public | P2 |
| `/reviews` | Reviews hub | P2 |
| `/login` `/signup` `/account` | Account | P2 |
| `/guides` `/guides/[slug]` | Content | P2–P3 |
| `/about` | About | P2 |

---

## End-to-end customer journey (wire pages together)

```text
Home search
  → /search (compare)
    → /cars/[offerId] (understand)
      → /checkout (commit)
        → /bookings/[id]/confirmation
          → /bookings/[id] (manage / cancel)
            → /reviews (optional after completed)
```

Support exits: `/faq`, `/help`, `/contact` available from header/footer and checkout errors.

---

## Component inventory to reuse / create

**Reuse:** `Button`, header patterns from `hero`, `RentalSearch` fields, `ThemeToggle`, `Footer`, testimonial cards.

**Create:**
- `TripSummaryBar`
- `FiltersPanel` + `FiltersSheet`
- `OfferCard`
- `PriceBreakdown`
- `StatusBadge` / `StatusTimeline`
- `BookingSummaryRail`
- `PolicyAccordion`
- `LocationCard`
- `EmptyState` / `ErrorState` / `Skeleton`

---

## Copy & UX principles (all client pages)

1. Prefer **car rental** wording (not “car location”).
2. Show **total mandatory price** first; deposit separate.
3. Label **Instant** vs **Request to book** everywhere.
4. Disclose **or similar** for pooled cars.
5. Plain-language policies; link to full legal text.
6. Never invent 24/7 support.
7. Design Arabic RTL-ready spacing even if EN ships first.
8. Keep marketing sections one-job-per-section; booking UI can use structured cards where interaction needs them.

---

## Master prompt — generate the full client IA set

```text
You are designing the complete customer-facing page set for Wheelio TN, a Tunisia-first multi-agency car rental marketplace (compare local agencies, commission model, TND pricing).

Stack: Next.js App Router, TypeScript, Tailwind, existing monochrome light/dark Wheelio design system.

Produce UI/UX for all P0 and P1 client routes listed in WHEELIO_CLIENT_PAGES_UIUX_PROMPTS.md with:
- wireframe-level layout descriptions
- component breakdown
- empty/loading/error states
- mobile and desktop behavior
- key copy in English
- accessibility notes

Focus only on client pages (not agency portal, not admin). Optimize for trust, price clarity, and booking completion. Avoid generic SaaS/ERP visual language; keep premium travel-marketplace monochrome aesthetic.
```

---

## Out of scope (client doc)

Agency portal — detailed in `WHEELIO_AGENCY_DASHBOARD_UIUX_PROMPTS.md`.  
Admin CMS, payment provider back-office, native apps, loyalty, telematics — documented in `WHEELIO_TN_PROJECT_PLAN.md` but not detailed here.

---

*Document version: 1.0 — Client pages UI/UX prompts for Wheelio TN*
