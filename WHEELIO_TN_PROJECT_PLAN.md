# Wheelio TN — Master Project Plan

**Market:** Tunisia first  
**Product:** Multi-agency car-rental marketplace  
**Currency:** Tunisian dinar (TND / DT)

## 1. Executive summary

Wheelio TN will bring rental cars from independent Tunisian agencies into one searchable marketplace. A customer selects a pickup place and rental period, compares normalized offers, applies filters, and reserves through one consistent flow. Agencies receive new bookings and a portal for managing cars, rates, availability, and reservations.

Wheelio earns a contracted commission or markup. For example, an agency may supply a 95 DT/day net rate and Wheelio may sell it at 105 DT/day—but only if the agency contract, customer terms, invoices, and Tunisian tax treatment support this arrangement.

Wheelio is two connected products:

1. **Customer marketplace:** search, compare, reserve, pay, and manage bookings.
2. **Agency system:** fleet, rates, availability, policies, bookings, and reports.

Launch as a managed marketplace with 3–6 agencies in one region. Use request-to-book when inventory is uncertain and instant booking only where synchronization is reliable. The hardest problem is not the catalog interface; it is preventing stale prices and double bookings.

## 2. Positioning

In English, use **car rental**, not “car location,” which can mean GPS tracking.

- “Compare rental cars from trusted local agencies.”
- “One search. Multiple agencies. The right car for your trip.”
- “Local choices, clear prices, easy booking.”

Compete on selection, transparent total prices, dependable confirmation, multilingual support, and trusted agencies—not price alone.

## 3. Problems

### Customers

- Inventory is scattered across social media, WhatsApp, calls, and offices.
- Prices are hard to compare because mileage, deposits, insurance, and fees differ.
- Advertised cars may no longer be available.
- Requirements and cancellation rules are unclear.
- International customers face language, payment, and trust problems.
- Confirmation is often slow outside business hours.

### Agencies

- Many lack an effective website or booking system.
- Staff repeatedly answer price and availability questions.
- Inventory is managed in notebooks, spreadsheets, or chats.
- Manual processes create double-booking risk.
- Agencies have limited digital distribution and analytics.

## 4. Users and value

### Customer segments

- Tunisian residents renting for trips, events, replacement cars, or business.
- Tunisian diaspora reserving before arrival, especially in summer.
- International tourists needing airport delivery and clear requirements.
- Business customers needing dependable service and invoices.
- Customers referred by hotels and travel agents.

### Platform users

- Agency owner, branch manager, reservation agent, fleet operator, accountant.
- Wheelio administrator, support agent, agency manager, finance operator.

### Value

Customers search once, compare consistent terms, reserve easily, and use one support channel. Agencies receive qualified bookings, digitize operations, and pay mainly for completed business. Wheelio's long-term advantage becomes its agency relationships, structured supply data, operational software, reviews, and trusted brand.

## 5. Business model

### Model A — Net rate plus margin

- Agency contracted net rate: 95 DT/day.
- Customer price: 105 DT/day.
- Wheelio gross margin: 10 DT/day before costs and taxes.

### Model B — Retail price plus commission

- Agency sets the retail price.
- Wheelio receives a fixed or percentage commission.
- Example: 105 DT/day with 12% commission.

**Recommendation:** start with transparent commission because it is easier to explain and reconcile. Add net-rate contracts selectively.

Never depend on an informal hidden markup. Contracts must define:

- Whether Wheelio is agent, intermediary, or reseller.
- Who collects payment and issues the rental invoice.
- VAT/tax treatment, refunds, and chargebacks.
- Payout timing and commission calculation.
- Whether displayed totals include every mandatory fee.
- Promotions, direct-price parity, no-shows, and cancellations.

Use a Tunisian lawyer and accountant before taking live payments.

Test 10–15% of completed rental value or 8–15 DT per rental day with a minimum fee. Track:

`contribution margin = commission − payment fees − refunds/fraud − support − promotions − acquisition cost − partner share`

Future revenue: allowed protection products, delivery/add-on shares, sponsored placement, corporate accounts, hotel affiliates, agency SaaS, and booking widgets.

## 6. Booking model

- **Request-to-book:** agency accepts before a deadline; easiest with imperfect inventory.
- **Instant booking:** immediate confirmation; requires dependable live inventory.
- **Recommended hybrid:** label each offer clearly, rank reliable instant supply higher, and graduate agencies to instant booking after proving inventory accuracy and response quality.

## 7. MVP scope

Launch in one area such as Greater Tunis/Tunis-Carthage Airport, Djerba, Monastir/Sousse, or Enfidha/Hammamet. Select the location based on reliable agency supply and operations.

### Customer MVP

- Pickup/return location, date/time, driver age, and different-return toggle.
- Results showing total and per-day prices.
- “Vehicle or similar” disclosure.
- Filters: price, category, seats, luggage, transmission, fuel, mileage, deposit, cancellation, confirmation type, pickup method, and rating.
- Sort: recommended, total price, rating, deposit, and capacity.
- Detail page with features, price breakdown, deposit, mileage, fuel, protection, requirements, documents, pickup, cancellation, and provider.
- Checkout with contact, driver, flight, and optional add-on details.
- Deposit/payment or pay-at-agency flow.
- Reference, status, email, and optional SMS/WhatsApp notifications.
- Cancellation request and support.
- Arabic, French, and English-ready architecture.

### Agency MVP

- Secure login and staff roles.
- Agency, branch, and fleet management.
- Base, seasonal, weekend, and duration pricing.
- Availability calendar and manual blocks.
- Locations, delivery zones, and fees.
- Policies and driver requirements.
- Reservation inbox and accept/reject.
- Booking status, notifications, and basic reports.

### Admin MVP

- Approve agencies, branches, vehicles, and content.
- Manage bookings and support cases.
- Configure commissions and reconciliation.
- Handle cancellation/refund workflows.
- Manage locations, categories, policies, promotions, and audit logs.
- Basic marketplace analytics.

### Not in MVP

Native apps, AI pricing, nationwide launch, loyalty, telematics, damage-recognition AI, complete agency accounting, and a public API.

## 8. Search, pricing, and ranking

Normalize every agency's data into:

- Vehicle category/model, transmission, seats, doors, luggage, fuel, and AC.
- Location, branch, and delivery method.
- Rent, taxes, mandatory fees, delivery, and add-ons.
- Mileage, deposit, fuel, cancellation, no-show, and late-return policies.
- Driver/licence-age requirements.
- Protection inclusions and exclusions.
- Availability and confirmation type.

Price:

`rental subtotal + mandatory fees + delivery + selected add-ons + taxes − discounts = total`

Rules must support rental-day definition, extra hours, seasons, weekends, duration discounts, minimum stay, one-way/airport/after-hours/young-driver fees, and rounding.

Show the **total mandatory price** prominently. Per-day price is secondary. Show the refundable/security deposit separately.

A starting “Recommended” ranking can combine price competitiveness (30%), search fit (20%), instant confirmation (15%), agency reliability (15%), reviews (10%), and policy quality (10%). Sponsored results must be labeled.

## 9. Availability and booking integrity

Support:

- **Specific vehicle:** one physical car.
- **Pooled category:** agency guarantees one of several equivalent cars.

State machine:

`draft → pending_agency/payment_pending → held → confirmed → active → completed`

Exit states:

`expired | rejected | cancelled_by_customer | cancelled_by_agency | no_show | refunded`

Controls:

- Transactional availability checks.
- 10–15 minute checkout holds where possible.
- Automatic hold expiry.
- Idempotency keys for booking/payment requests.
- Database protection against overlapping reservations.
- Cleaning, delivery, and maintenance buffers.
- Agency response deadlines and complete status history.

Availability must be calculated for a time range from confirmed bookings, holds, maintenance, allocation, and buffers—not an `available=true` flag.

Agency data progression:

1. Wheelio-assisted manual entry.
2. Validated CSV/XLSX import.
3. Agency portal self-management.
4. API/webhooks for mature providers.

## 10. Essential journeys

### Customer

Search → compare/filter → read conditions → enter details → select extras → accept terms → pay/request → receive reference → receive confirmation/reminders → collect car → review.

### Agency

Verify/sign contract → add branches/fleet/rates/policies → maintain calendar → receive booking → accept/prepare → hand over/return → close booking → reconcile payout.

### Cancellation

Show policy/refundable amount → request → calculate or escalate → notify both sides → refund/adjust commission → release inventory.

## 11. Data model

Core entities:

- Users, customer profiles, agency staff, roles.
- Agencies, verification documents, branches, locations.
- Vehicle categories, vehicles, features, images.
- Rate plans/rules, seasonal rates, fees, add-ons.
- Availability/maintenance blocks and allocations.
- Policies, driver requirements, protection options.
- Searches, offers, price snapshots, ranking versions.
- Holds, bookings, booking items, status history.
- Payments, refunds, payouts, commissions.
- Promotions, reviews, support cases, notifications, audit logs.

Preserve an immutable booking snapshot of the quoted vehicle/category, prices, policies, commission agreement, and customer acceptance. Later agency edits must not change an old booking.

## 12. Technical architecture

### Suggested MVP stack

- Next.js and TypeScript.
- Tailwind CSS with an accessible component system.
- PostgreSQL with Prisma or Drizzle.
- Managed authentication, role-based access, and admin MFA.
- Redis/queue for holds, expiry, and notifications when needed.
- S3-compatible storage for documents and images.
- Transactional email and a validated regional SMS/WhatsApp provider.
- A map/geocoding provider selected after pricing review.
- Error tracking, structured logs, uptime, and product analytics.

Build a modular monolith first. Main domains: identity, agencies, fleet, pricing, search, booking, finance ledger, notifications, support, admin, and analytics.

API rules: server validation, idempotency, signed webhooks, rate limits, UTC internally with location time zones, stable error codes, and audit events.

## 13. Payments and finance

Launch choices:

1. Pay at agency: simplest; weakest no-show and commission control.
2. Wheelio booking deposit: useful compromise if legally/payment-provider supported.
3. Full online payment: convenient but adds refund, payout, and chargeback complexity.

Validate authorized Tunisian payment options first. Use a financial ledger, not a `paid` boolean. Record gross value, amount collected, collector, commission, provider due, payment fee, refunds, chargebacks, payout, tax references, and approved manual adjustments.

## 14. Trust, legal, and privacy

- Verify agency registration, banking, insurance, fleet authority, and contacts.
- Sign provider agreements with service standards.
- Publish customer terms, privacy, cancellation, cookie, and complaint policies.
- Professionally review e-commerce, consumer, tax, invoicing, payment, and personal-data obligations.
- Assign responsibility for accidents, damage, fines, deposits, substitutions, breakdowns, and assistance.
- Collect only necessary personal data and define retention periods.
- Never store raw card data.
- Encrypt sensitive data/backups; use least privilege, MFA, secret management, rate limits, and audit logs.
- Maintain incident response and tested backup restoration.

Substitutions should be equivalent or upgraded, preserve essential features, add no charge without consent, and provide escalation/refund options.

## 15. Agency onboarding and quality

Qualify legal status, fleet, vehicle condition, locations, reservation process, pricing consistency, response speed, and seasonal capacity.

Collect branches/hours, cars/photos, rates, mandatory fees, deposits, payment methods, mileage, fuel, cancellation, driver rules, insurance, delivery rules, and unavailable dates.

Pilot process:

1. Load sample inventory.
2. Test search, booking, cancellation, expiry, and refund.
3. Verify notifications and train staff.
4. Start with limited allocation.
5. Review after the first 10 bookings.

Score acceptance, response time, agency cancellations, inventory accuracy, complaints, vehicle match, and reviews. Coach, lower ranking, restrict to request-to-book, pause, or remove poor performers.

## 16. Operations and support

Prepare procedures for failed confirmation, missing bookings, unavailable cars, price/deposit disputes, delays, breakdowns, accidents, cancellation/refunds, vehicle complaints, and lost property.

- **Emergency:** accident, safety issue, stranded customer.
- **Urgent:** pickup failure or same-day cancellation.
- **Standard:** amendment, document question, refund status.

Maintain agency escalation contacts and out-of-hours rules. Do not advertise 24/7 support until it is staffed.

## 17. UX, localization, and accessibility

- Mobile-first for social and travel traffic.
- Arabic RTL, French, and English.
- Store proper translated fields, not mixed-language text.
- Summarize policies in plain language and link full terms.
- Target WCAG 2.2 AA: keyboard, labels, contrast, focus, errors, reduced motion.
- Optimize for slow mobile connections.
- Localize dates, phones, currency, and names.
- Allow guest checkout.

## 18. Analytics

Track:

- Search-to-results, result clicks, checkout starts, booking requests, confirmations, payment, and completion.
- Offers/search, zero-result searches, response time, acceptance, mismatch, provider cancellations, instant-bookable share.
- Gross booking value, revenue, take rate, contribution margin, acquisition cost, repeats, refunds, chargebacks, no-shows.
- Support contacts/booking, pickup failures, review score, and resolution time.

Set targets after a concierge pilot provides real baselines.

## 19. Go-to-market

Supply first:

- Sign 3–6 dependable agencies in one area.
- Ensure enough categories and prices for meaningful comparison.
- Offer assisted onboarding and photography guidance.
- Agree on commissions and response standards.

Demand:

- SEO pages for city/airport rental intent.
- High-intent search ads.
- Hotels, guest houses, travel agencies, and tourism creators.
- Diaspora trip-planning content.
- Referral codes, repeat offers, and agency co-marketing.

Do not scale advertising until zero-result rate, confirmation speed, and pickup reliability are healthy.

## 20. Roadmap

### Phase 0 — Validate (2–4 weeks)

- Interview 15–25 customers and 8–12 agencies.
- Map real rates, deposits, cancellations, and operations.
- Obtain sample agency data.
- Choose one region and test commission willingness.
- Review the legal/accounting model.
- Prototype and test the customer journey.

**Gate:** at least three pilot agencies willing to maintain availability.

### Phase 1 — Concierge pilot (2–4 weeks)

- Launch a landing/search request form.
- Manually collect and normalize offers.
- Manage confirmation and log every exception.
- Test demand with a small budget.

**Gate:** completed bookings, reliable agency response, and plausible economics.

### Phase 2 — MVP (8–12 weeks)

- Build customer marketplace, agency portal, and admin.
- Add request-to-book, selected instant supply, notifications, analytics, security, backups, and monitoring.

### Phase 3 — Controlled launch (4–8 weeks)

- Limit initial inventory/audience.
- Run end-to-end bookings.
- Review agency quality weekly.
- Fix pricing, availability, and policy failures before growth.

### Phase 4 — Scale

- Add locations based on unmet search demand.
- Automate imports/APIs, payments, and payouts.
- Add affiliates/B2B and improve ranking using real data.

## 21. Team

Lean team:

- Founder/product and agency partnerships.
- Full-stack engineer.
- Contract/part-time product designer.
- Operations/customer-support lead.
- Legal and accounting advisers.
- Growth specialist after operations stabilize.

Agency data cleanup, confirmations, support, and reconciliation may initially take more work than software.

## 22. Risks

- **Stale inventory:** holds, overlap constraints, reminders, quality score.
- **Hidden fees:** structured mandatory fees and immutable quote snapshots.
- **Provider cancellation:** reliability ranking, penalties, replacement process.
- **Weak supply:** launch narrowly and expand supply first.
- **Direct bypass:** useful support/booking value, fair pricing, repeat benefits.
- **Commission leakage:** contracts, reconciliation, deposits where suitable.
- **Seasonality:** multiple use cases/regions and conservative cash planning.
- **Payment disputes:** clear ownership, evidence, ledger, and policies.
- **Vehicle quality:** verification, reviews, complaint process, suspension.
- **Overbuilding:** concierge pilot and explicit phase gates.

## 23. Testing

- Unit tests for prices, durations, fees, commissions, cancellation, and eligibility.
- Boundary tests for midnight, time zones, extra hours, and seasons.
- Integration tests for holds, expiry, overlap prevention, webhooks, and refunds.
- End-to-end customer, agency, and admin journeys.
- Role/permission and security tests.
- Load testing for seasonal peaks.
- Accessibility and Arabic RTL testing.
- Backup restoration and incident drills.

Money and availability logic require deterministic tests before release.

## 24. Immediate next actions

### Week 1

1. Write a one-page agency pitch.
2. Prepare interview scripts and a provider data spreadsheet template.
3. List 20 target agencies in one candidate region.
4. Interview at least five agencies and five customers.
5. Gather real rate cards, policies, and availability examples.

### Week 2

1. Select the launch region and three pilot agencies.
2. Decide request-to-book timing and cancellation ownership.
3. Draft commercial terms for professional review.
4. Create low-fidelity customer and agency prototypes.
5. Define pilot metrics and exception log.

### Weeks 3–4

1. Run a manual concierge test.
2. Process searches and bookings without overbuilding software.
3. Measure response time, availability mismatch, conversion, and support effort.
4. Revise the data model and workflow from evidence.
5. Make the MVP build decision at the validation gate.

## 25. Decisions still required

- First launch city/airport.
- Customer languages at day-one launch.
- Request-to-book deadline.
- Commission versus net-rate agreements.
- Payment collector and deposit model.
- Cancellation/refund authority.
- Specific-car versus category guarantees per agency.
- Customer support hours.
- Agency verification requirements.
- Initial marketing budget.

## 26. Definition of MVP success

Wheelio has validated its MVP when customers can find real offers, understand the complete price and conditions, reserve without manual confusion, receive a dependable car, and get support when needed; agencies can maintain inventory and fulfill bookings profitably; and Wheelio earns positive contribution margin with acceptably low mismatch, cancellation, and complaint rates.

