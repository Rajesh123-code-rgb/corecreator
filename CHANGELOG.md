# Changelog

Work delivered against the August 2026 audit of corecreator.online, grouped by
phase, newest first. Each entry says what changed and why — the reasoning
matters more than the file list, particularly where something was deliberately
left alone.

---

## Phase 10 — Checkout control, mobile cart, and feedback

### Mobile cart access (reported by the site owner)

The cart link sat inside the header's `hidden lg:flex` actions container, so
below 1024px the whole container was `display: none`. The link still existed and
its badge still counted items — on an element measuring 0×0. The mobile menu had
no cart entry either, so **on a phone there was no route to the cart at all**: a
shopper could add items and never reach checkout.

A cart button now renders below `lg` beside the hamburger, at a 44×44 target
with the item count, and the mobile menu carries a Cart row showing how many
items are waiting. The audit missed this because it reached `/cart` by URL
rather than by tapping — a reminder that navigating by address bar is not
testing navigation.

### GST sourced from configuration, at 18%

The rate was a magic number in four files: 8% in the cart, checkout and
`create-order`, and 18% on workshop checkout under a comment reading
`// 18% GST example`. **8% matches no Indian GST band** — they are 0/5/12/18/28 —
so customers were billed an amount reconcilable to no real rate, and products
and workshops disagreed with each other. A configurable `TaxRate` model with
admin endpoints already existed and was never consulted by the purchase path.

Now `src/lib/tax.ts` holds dependency-free helpers safe for client import,
`tax.server.ts` resolves the active rate from `TaxRate` defaulting to 18%, and
`/api/tax-rate` exposes it so the cart and checkout display the figure the
server will actually charge rather than guessing. Labels read "GST (18%)".
Changing the rate is now an admin edit, not a code change in four places.

*Worth confirming with an accountant:* handmade goods often fall under the 5% or
12% band rather than the 18% standard.

### The cart is editable at checkout

The review step listed items read-only. The only way to change a basket was
"Back to Cart", which meant re-entering the shipping form. Each line now carries
a quantity stepper and a remove control, wired to the `updateQuantity` and
`removeItem` already on the cart context. Removing the last item explains why
the page returns to the cart rather than silently bouncing.

### Feedback on every press

Three separate causes, all fixed:

- **`outline`, `ghost` and `link` had no pressed state** — the three most-used
  variants gave no response at all. All eight variants now respond.
- **About 45% of clickable elements are raw `<button>`**, not the design-system
  component — icon buttons, steppers, tabs, chips. A single rule in
  `globals.css` gives them the same quick acknowledgement without touching 329
  call sites, with a `prefers-reduced-motion` fallback that swaps the transform
  for an opacity shift.
- **Hover-scale fired on tap and stuck**, because touch devices have no hover to
  leave. It is now confined to `@media (hover: hover)`.

### Messages that say something

`toast.error` was used 87 times against 12 for `success`; `warning` and `info`
existed and were used **zero** times. Non-errors arrived as red error toasts and
most successes were silent.

The most visible gap: **adding to the cart showed no confirmation at all** — the
only signal was the badge, which on mobile was the invisible one described
above. Add to Cart now confirms in place ("Added to your cart") and raises a
toast naming the item. Because the action is synchronous, a spinner would only
flash; a brief confirmed state is the honest pattern.

Also: promo codes confirm what was saved, removing an item says what left,
clearing the cart says so, and sign-in prompts moved from the error channel to
`info` with the reassurance that the cart is saved. The payment-verification
failure now tells the customer not to pay twice.

Registration already had a proper success screen and was left alone.

---

## Phase 9 — Go-live readiness

Everything outstanding before launch except the Razorpay live keys, which stay
last by decision so the switch to real money happens against a finished system.

### Auth debug logging (security)

`src/lib/auth/index.ts` wrote to `auth-debug.log` in **six** places across the
authorize, JWT and session callbacks — the raw user document, the JWT, and the
full session object including id, email, role and permissions.

Three problems in one: a JWT in a log file is a usable credential;
`appendFileSync` is synchronous, so it blocked the event loop on every session
read, which is every page load for a signed-in user; and the file grew without
limit on a VPS already at 78% disk. All six removed, `*-debug.log` added to
`.gitignore`, and the full-curriculum-payload `console.log` in the course
curriculum route reduced to a section count.

### Google sign-in on, Facebook off

Both providers were already registered and the OAuth `signIn` callback already
created and linked users correctly, so no account plumbing was needed.

Facebook is gone — provider, button, icon and env vars. Google is now registered
**only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are both set**;
previously it registered with empty strings, which advertised the provider and
produced a button that failed on click. `SSOButtons` asks NextAuth what is
actually configured via `getProviders()` and renders from that, so the button
appears the moment credentials are deployed with no separate feature flag to
keep in step, and shows nothing before then.

Sign-in with Google was also missing from `/register` entirely — added. While
doing so, both auth pages had a latent bug: each rendered its own "Or sign in
with email" divider next to `<SSOButtons showDivider={false} />`, so with no
providers configured the divider would strand itself with nothing above it.
`SSOButtons` now owns the divider and renders both or neither.

OAuth-created accounts were being given `preferences.currency: "USD"` while the
entire catalogue is priced in INR.

### Claims the site could not support

- **`/shipping`** advertised 3-5 day domestic and 7-14 day international
  delivery, plus worldwide shipping. None of it was confirmed and there is no
  international shipping configuration. Replaced with what is true: dispatch is
  per creator, cost and destinations are shown at checkout, tracking follows.
- **`support@corecreator.com`** was published on `/contact`, `/terms`, the
  footer and `/accessibility`, but `corecreator.com` resolves to a different
  server than the live site, so that mail may reach nobody. All four now route
  to the contact form.
- **`/terms` had no governing-law clause.** Added: governed by the laws of
  India. The exclusive-jurisdiction city is still open.
- **Footer social icons** all pointed at `#` — a dead link on every page.
  Now the three real profiles (Instagram, YouTube, LinkedIn); Facebook and
  Twitter removed, since there are no profiles to link.

### Figures that did not exist

- **Products with no reviews showed `0.0` beside five grey stars**, which reads
  as a rating of zero rather than the absence of one. Now "No reviews yet".
- **Courses advertised "0 hours on-demand video".** The cause was a data bug,
  not a display one: lessons store `content.videoDuration`, but the curriculum
  save route never aggregated it, so `totalDuration` stayed 0 while the course
  had lessons. Both totals are now recomputed on save. Mind the units — lesson
  durations are in seconds while `totalDuration` is consumed as minutes, so
  summing raw seconds would have overstated every course 60x. The label is
  hidden when unknown, and sub-hour courses report minutes instead of rounding
  to "0 hours".

### Product prices are now exact, not floor-checked

Phase 5 secured payment amounts by deriving prices server-side, but products
could only be **floor-checked** — compared against the cheapest configuration a
product could legitimately sell at — because variant, customization and add-on
selections were never forwarded from the cart. A premium variant could therefore
be bought at the base price.

The product page already attached those selections to the cart item at runtime;
they were simply absent from the `CartItem` type and dropped at checkout. The
whole path is now typed and forwarded — **ids only, never prices** — and
`create-order` rebuilds the figure from the stored catalogue, mirroring
`calculatedPrice` in `ProductClientPage`. A mismatch now rejects the order as a
stale basket rather than being silently accepted.

### Not changed, deliberately

The "Cookie Policy" link measures 17px tall and was logged in Phase 8 as below
the WCAG 2.2 AA 24px minimum. That was wrong: SC 2.5.8 exempts targets inline in
a sentence, where size is constrained by the line-height of the surrounding
text. Padding it would break the paragraph's spacing for no accessibility gain.

---

## Phase 8 — Mobile layout

Measured first: every key page was loaded at a 390x844 viewport and checked for
horizontal overflow, touch-target size and text size, rather than guessed at.

**The core problem was pages being wider than the phone.** Where content
overflows, the browser zooms the whole page out to fit — which is why the site
"didn't look right" rather than simply showing a scrollbar. Measured effective
widths were 535px on product pages (a 73% zoom-out), 412px on `/artists`, 398px
on `/cart` and 397px on `/marketplace`, against a 390px screen.

**Root cause, and it was systemic:** `grid lg:grid-cols-2` sets no column
template below the breakpoint, so the mobile track is implicit `auto`, which
sizes to max-content and is free to exceed the viewport. Tailwind's own
`grid-cols-*` compiles to `minmax(0, 1fr)`, which is capped at the container —
so the fix is simply to state the mobile case. 59 grid containers across 40
files were missing it; all now carry `grid-cols-1`. On the product page that
alone removed 145px of overflow, caused by the image gallery column.

Four narrower overflows, each a row that could not wrap:

- **The footer payment badges appeared on every page.** "We Accept:" plus five
  badges in a non-wrapping flex row measured 438px. Now wraps.
- `/artists` — two filter dropdowns with 150px and 160px minimums, plus a
  `whitespace-nowrap` result count, in one row. The row wraps and the selects
  shrink on mobile.
- `/marketplace` — the results count and sort control could not share a line.
- `/cart` — the two empty-state buttons now stack on mobile.

**Dark mode was switching itself on, and the site is not built for it.**
`globals.css` carried `@media (prefers-color-scheme: dark)`, so any visitor
whose phone was set to dark — which many are, often on an automatic evening
schedule — got the dark palette without asking for it. The palette itself is
correct, but roughly 319 components across 106 files hardcode `bg-white` instead
of `var(--card)`, so those kept white backgrounds while the text turned
near-white. Measured contrast on the checkout screen: **1.02:1** — text and
background effectively the same colour. This is the likeliest explanation for
the site "not looking right" on a phone, and it was a bigger problem than the
layout overflow above.

The site now renders light for everyone: the media query is gone, the theme
provider uses `forcedTheme="light"` (which also overrides a stale `dark` sitting
in a returning visitor's localStorage), and the header toggle is removed since
it would otherwise set a theme that no longer renders. The `.dark` token block
is deliberately kept for the migration. Restoring dark mode means moving those
319 components onto the tokens and verifying both themes visually — worth doing
as its own phase, not as a side effect of a mobile fix.

**Touch targets.** Against the 44px iOS/Android guidance: header icon buttons
were 32-40px and footer navigation links 24px tall. Header buttons now have a
44px minimum, and footer links get their touch height on mobile only, so the
desktop footer keeps its density. The 1x1 skip link is intentional — it is
visually hidden until focused — and one 17px "Cookie Policy" link remains below
the WCAG 2.2 24px minimum.

---

## Phase 7 — Findings from the live audit of Phases 1-5

Everything from Phases 1-5 was re-tested against the live site, by request. The
work verified clean: sitemap and robots, all five security headers, real
platform stats, the commission copy, metadata and canonicals, landmarks and
heading structure, the cookie banner, server-rendering on every list page, the
removal of all fabricated data, and the mobile menu backdrop. What follows is
what that audit turned up that had not been found before.

### SEO

**The homepage was the only page with no canonical tag.** `src/app/page.tsx` was
a client component, and a client component cannot export metadata. The body
moved to `HomeClient.tsx` and `page.tsx` became a server wrapper that supplies
the canonical and OpenGraph tags. Markup is unchanged.

**Every page title carried the brand twice.** Nineteen pages appended
"| Core Creator" themselves and the root layout's template appended the full
site title on top, producing "About Us | Core Creator | Core Creator - Global
Art & Craft eLearning & Marketplace" — about 85 characters where search results
show roughly 60. The template now appends the brand alone, and the self-appended
suffix was removed from all nineteen.

**`robots.txt` disallowed `/(dashboard)/`** — a Next.js route group, which never
appears in a URL, so the rule protected nothing. Replaced with the real paths.
`/cart`, `/checkout`, `/login`, `/forgot-password` and `/reset-password` now
carry `noindex` as well; all are client components, so each needed a thin layout
to hold the metadata.

**Product and course pages had no `BreadcrumbList`.** `generateBreadcrumbJsonLd`
already existed and was wired into the category pages only. Now on both detail
page types.

### Live errors

**The favicon 404'd on every page load.** The layout declared
`<link rel="icon" href="/favicon.ico">` but no such file existed — only
`src/app/icon.png`. Generated `public/favicon.ico` from the existing icon.

**React error #418 on course pages, traced to date formatting.** The server
rendered "Last updated 2/1/2026" and the browser re-rendered "02/02/2026": bare
`toLocaleDateString()` takes the locale and time zone of whoever runs it, and
the server runs in UTC while visitors are in IST, so a timestamp near midnight
lands on a different day.

Added `src/lib/formatDate.ts`, which pins both locale and time zone, and applied
it across every public page that renders a date — the homepage, workshops list
and detail, workshop checkout, product reviews, blog and the course page. Two of
those had `suppressHydrationWarning` on them, which silenced the warning while
leaving the date wrong; both now use the shared formatter instead. `/pricing`
was also pinned: the launch offer ends 23:59:59 IST, which is still the previous
day in UTC, so an unpinned format would have advertised the offer ending a day
early.

**A decorative texture pointed at a dead third-party URL.** The course page
loaded `grainy-gradients.vercel.app/noise.svg`, which returns 404 — a
cross-origin request on every course page for an image that never rendered.
Removed.

---

## Phase 6 — Guest checkout and password reset

**Guest checkout.** Signed-out shoppers now choose at `/checkout` between signing
in, creating an account, and continuing as a guest. Guest is a real option, not a
login wall with extra steps: `create-order` builds an account from the email
typed into the checkout form, attaches the order to it, and the buyer claims it
through a password-reset link.

The accounts are created without a password, so the emailed link is the only way
in. Two consequences that are deliberate:

- If the email already belongs to an account, the order attaches to it and
  **nothing** is returned that would let the buyer into it. Otherwise typing a
  stranger's address at checkout would be an account takeover.
- The "set your password" email is sent from the payment-confirmation path, not
  from order creation, so an abandoned checkout never emails anyone.

`Order.user` stays `required: true` — the account is what makes guest checkout
work, rather than a schema change rippling through order history, course access,
workshop seats and the seller dashboards.

**Password reset, which had never existed.** `/help` already told users to click
"Forgot Password" on the login page; there was no such link, page, route or email
template. Built: `/forgot-password` and `/reset-password` pages, `POST
/api/auth/forgot-password` and `POST /api/auth/reset-password`, a reset email
template, and the missing link on the login page.

Only the SHA-256 hash of the token is stored, so a database dump can't be used to
take over accounts. Tokens expire in an hour, the expiry is part of the lookup
query rather than a later check, and they are single-use. `/api/auth/forgot-password`
answers identically whether or not the account exists, so it can't be used to
discover which addresses are registered.

`authorize()` told passwordless accounts to "sign in with the provider you used
to register" — meaningless for a guest-created account. It now points at the
reset flow.

**The success page invented its order number.** It generated
`ORD-${Date.now().toString(36)}` at render, so every customer saw a reference
that existed nowhere in the system and changed on every refresh. It now shows the
real `orderNumber`, and tells guest buyers that an account was created for them.

---

## Phase 5 — "Looks real, isn't": simulated flows and payment integrity

A pass over the things that render convincingly but aren't backed by anything —
payments that don't charge, profiles for people who don't exist, statistics the
database contradicts.

### Payment

**Logged-out buyers could not purchase anything — confirmed end to end.** Reported
manually as "try again at checkout" and reproduced in a real browser against the
live site for both an artwork and a course. `/checkout` was not in the middleware
matcher, so guests could reach it; the page used `useSession` only to prefill name
and email and never gated on it; `create-order` requires a session and returns
401. The page's catch block then showed "Payment failed. Please try again." So a
visitor filled the entire shipping form, clicked Pay, and was told payment failed
when the real problem was that they weren't signed in. No order, no charge, no
explanation — a total purchase blocker for every first-time buyer.

Fixed by gating `/checkout` in middleware, the same way `/user` and `/studio`
already are, so guests are redirected to login *before* filling anything, with a
callback back to checkout. As defence in depth the page now handles 401
explicitly rather than reporting it as a payment failure, and surfaces the real
API error instead of a fixed string. Guest checkout isn't possible today in any
case: `Order.user` is `required: true`, so supporting it would be a data-model
change and a product decision.

**Payment amounts were client-controlled.** `create-order` never read prices from
the database despite a comment claiming it did — it trusted `item.price` from the
request body, which flowed into `razorpay.orders.create({ amount })`. `verify()`
confirms on Razorpay signature alone and never re-checks the amount, and the
signature is valid because the order really was created for the tampered figure.
So a crafted request could buy any item for any amount, and the order would be
marked paid, access granted, the seller notified and a confirmation emailed.

Prices are now re-derived server-side. Courses and workshops have a single fixed
price so the stored value is used outright and the client's number is discarded.
Products are configurable and those selections aren't forwarded to the route, so
the client price is floor-checked against the cheapest configuration the product
could legitimately sell at. Any mismatch rejects the whole order.

*Follow-up:* forward variant, customization and add-on selections from the cart
through checkout so product prices can be recomputed exactly rather than
floor-checked.

**The charge currency was taken from the request body.** All catalogue prices are
stored in INR — `CurrencyContext` treats INR as the source currency and converts
only for display — and nothing anywhere converts between currencies. Yet the
checkout page sent `currency: "USD"` and `create-order` passed that straight to
Razorpay against the unconverted INR amount. A ₹2,000 item was sent as $2,000.00.
Depending on whether the Razorpay account accepts USD that is either a ~83×
overcharge or an outright rejection — and rejection surfaces to the customer as
"Payment failed. Please try again.", the same symptom as the guest-checkout bug
above but affecting signed-in buyers too.

Currency is now pinned server-side alongside the price and the request value is
ignored. **This one needs checking against the live Razorpay dashboard** to
establish which of the two outcomes actually occurred, and whether any customer
was overcharged.

**Workshop checkout took no payment at all.** `handlePayment` was a two-second
`setTimeout` followed by a "Payment Successful!" toast and a redirect to the
success page. No API call, no charge, no seat reserved, no record — while a
Razorpay logo sat on the page. It now runs the same create-order → Razorpay →
verify flow as the main checkout. Three supporting fixes were needed:

- `verify()` never registered workshop attendance. Course and product ownership
  is derived from confirmed orders, but `/api/user/workshops` looks the buyer up
  in the Workshop's `attendees` array, which nothing ever wrote to — so payment
  alone would have left a paying customer with no booking on their dashboard.
- Workshops have finite capacity and nothing checked it, so they could be booked
  past the seat limit. Now enforced in `create-order`, where the count is
  authoritative rather than in the browser.
- `/workshops/[slug]/checkout` is now gated in middleware, matching `/checkout`.

**The webhook and `verify()` disagreed about fulfilment.** An order can be
confirmed by two independent paths — the browser calling `verify()` after the
Razorpay modal closes, and Razorpay's `payment.captured` webhook — and if the
customer closes the tab straight after paying, only the webhook arrives. The
webhook marked the order paid but never granted workshop attendance, so that
customer would be charged and left without a seat. Both paths now call a shared
`grantWorkshopAttendance()` helper, guarded so a second confirmation cannot
increment the seat count twice.

The Razorpay SDK type declarations moved out of `checkout/page.tsx` — where they
were published globally via `declare global` — into `src/types/razorpay.d.ts`, so
both checkout pages share one definition.

### Fabricated data

**`/studio/[id]` invented verified instructors.** When a user wasn't found the page
served made-up people — named, with stock photos, bios, `isVerified: true` and
`example.com` contact details — and *any* unknown ID returned a plausible fake
profile rather than 404, generating unlimited indexable pages for creators who
don't exist. It also overwrote their statistics with invented figures under a
comment reading "Update stats for mock users to look alive". Unknown and
non-creator IDs now 404.

**The homepage advertised four artists who don't exist**, with stock portraits,
verified check badges and invented course/artwork counts, shown whenever the real
artist list came back empty. The three sibling sections on the same page already
had honest empty states; this one now matches them.

**The homepage carried fabricated testimonials**, including a named person
claiming to have earned over ₹10,00,000 teaching on the platform. Real creator
earnings are ₹0. Section removed rather than rewritten — there are no real
testimonials to substitute yet.

**Scale claims contradicted by the platform's own database.** "50K+ Community",
"Join thousands of students", "Join thousands of artists, learners and art
lovers on the world's most vibrant creative platform" and the same claim on the
registration page, against real figures of 9 creators and 3 learners. Replaced
with copy that doesn't assert a scale, and the unsupportable superlative dropped.

**Artists with no ratings were shown 4.5 stars.** Both artist API routes ended
their rating calculation with `|| 4.5`, so an artist nobody had ever rated
displayed a solid score. They now return `null` and the UI shows "Not yet rated"
or omits the figure. The `randomuser.me` "lego" placeholder portrait was replaced
with an initials avatar generated from the artist's own name.

**The community page was a forum that doesn't exist.** 317 lines of hardcoded
discussion threads with authors and reply counts, five categories with invented
topic counts, and a statistics panel reading 12.8K members / 3.5K topics / 45K
replies / 234 online. There is no forum backend at all — the `Post` model powers
the blog. The page was orphaned (nothing linked to it, absent from the sitemap),
so it has been replaced with an honest placeholder carrying `noindex` until the
feature exists. Deleting the route outright is a reasonable alternative.

### Copy and claims

**`/shipping` promised expedited delivery that checkout doesn't offer.** "Expedited
options are available at checkout for most items, delivering within 1-2 business
days" — there is no expedited option anywhere in the checkout flow. Claim removed.

**`/terms`** had "Creators must accuracy represent their items" — corrected.

### `/artists` now server-renders its list

`getArtists()` extracted to `src/lib/artistSearch.ts`, mirroring the existing
`productSearch.ts` and `courseSearch.ts`. The page is now an async Server
Component that seeds the client list, which skips its redundant first fetch via a
`useRef` mount guard. `/api/artists` became a thin wrapper over the same
function.

### Open, needs your input

- **Razorpay dashboard check** for the currency bug above — were customers
  overcharged, or were all payments failing?
- **`support@corecreator.com`** is published as the contact address on `/contact`
  and `/terms`, but `corecreator.com` resolves to a different server than
  `corecreator.online`. Confirm it's a mailbox you actually control; left
  unchanged pending that.
- **`/terms` states no governing law or jurisdiction.** For an Indian company this
  should say so explicitly. Not written in, since the jurisdiction city is yours
  to specify.
- **`/shipping`'s 3–5 and 7–14 day windows** remain unverified, as does whether
  international shipping is genuinely offered.
- **Real social profile URLs** for the footer icons, still `href="#"`.

---

## Phase 4 — Indexation & trust claims

**Corrected the refund policy sitewide.** The site advertised a 30-day
money-back guarantee in nine places - homepage hero, course and workshop detail
pages, product pages, the studio course preview, and the /returns, /faqs and
/pricing policy pages - and it isn't a policy the business offers. Advertising a
refund right that isn't honoured is a consumer-law exposure, not just inaccurate
copy, so all nine were corrected to the real terms:

- Digital courses, tutorials and downloads are **final sale**, no refunds or
  returns, since access is granted immediately on payment.
- Physical items can be returned or replaced within **7 days of delivery**, and
  only for a damaged item or a wrong/mismatched product. No change-of-mind
  returns.
- **Customized and personalized items** can't be returned or replaced at all.

Product pages previously showed "30-day returns / Free returns on this item" on
every listing; they now state the 7-day damaged-or-wrong-item terms. /returns was
restructured around the three real categories rather than the guarantee it opened
with.

**Canonical URLs and `metadataBase`.** Neither existed anywhere on the site.
Without `metadataBase`, Next emits *relative* canonical and Open Graph URLs,
which crawlers and social scrapers can't resolve — so even the OG tags that did
exist were weakened. Canonicals now cover the 12 pages with static metadata plus
per-item canonicals on product and course detail pages. These matter most on the
filter-driven listings, where every combination of category, price, rating, sort
and page is a distinct URL competing with the others.

**Per-page metadata for `/workshops`, `/artists`, `/blog`, `/help`.** These were
the last four pages serving the generic site-wide title, because a `"use client"`
component can't export metadata. Verified against the live site first: they did
*not* need the SSR treatment applied to marketplace/learn — all four already
server-render (58–66 KB of HTML, no `BAILOUT_TO_CLIENT_SIDE_RENDERING` marker).
They're client components for search boxes, tabs and accordions, not for data.
So each got a thin server wrapper carrying metadata, with the previous body
re-exported as `XClient.tsx`.

**Removed unsourced hero claims.** "4.9/5 Rating" and "Trusted by 500K+" had
nothing behind them — no linked review platform, no rating data to compute from,
and a real learner count nowhere near 500K. Replaced with "Secure checkout" and
"Worldwide shipping", both of which the platform actually does.

Still open: the five footer social icons still point at `href="#"` (awaiting real
profile URLs, which should also populate the Organization schema's `sameAs`), and
`/artists` still loads its artist list client-side — fixing that properly needs a
`getArtists()` lib function alongside `getProducts`/`getCourses`.

---

## Phase 3 — Accessibility, performance, and the deferred backlog

### Measured fixes (3A)

Driven by a real Lighthouse run rather than inference.

**Accessible names** on the wishlist buttons, course-card overlay links, the
newsletter button and input, and the currency select — all previously
unreachable by screen reader.

**Contrast.** `--muted-foreground` (#737373) scored 4.34 against a 4.5 minimum
and is used site-wide; darkened to #666666. Footer section headings went from
`white/40` (3.84) to `white/60` (7.02). The brand gold `--primary-500` (#d4a017)
scored **2.38** with white text and failed on every default button — the gold is
untouched and the text is now dark (7.55), with the gradient's dark end narrowed
so dark text passes across the whole surface.

**Google Translate lazy-loaded.** It was the single largest remaining chunk of
unused JavaScript (~50 KiB of 104 KiB) loading on every page view, for the
majority of visitors who never touch the language picker. Now loads only when a
translation is already active or the picker is engaged.

**Homepage images lazy-loaded.** The 9.7 s mobile LCP was investigated before
acting, and the data didn't support the assumed cause: no render-blocking
resources, 90 ms server response, but **1,365 KiB of images in a 2,234 KiB page**
and 3.6 s of main-thread work dominated by style/layout, not scripting. An SSR
conversion would have been a large refactor aimed at the wrong problem. The
8 below-the-fold `<img>` tags now lazy-load.

### Deferred backlog (3B)

**Course stats rendered as NaN/0.** The Course model stores `averageRating`,
`totalReviews`, `totalStudents`, `totalDuration`, `totalLectures`, but the public
UI read `rating`, `reviewCount`, `enrollmentCount`, `duration`, `totalLessons` —
names that don't exist on the documents. `Math.round(course.duration / 60)` with
an undefined duration is what produced the "NaNh" in the audit. Fixed to the real
names (not an alias layer — admin and studio APIs already use the model's names).
Chasing it surfaced three more bugs of the same family: `courseSearch` never
*selected* three of those fields; the rating filter queried a non-existent field
so **filtering by rating matched nothing**; and the default "popular" sort ordered
by a non-existent field, making it a silent no-op. `/api/artists` had the same
issue, so artist student totals were permanently zero.

**Literal markdown on `/returns`.** Five `**asterisks**` were rendering raw to
visitors — markdown written into plain JSX, which React never parses. Especially
poor on the authoritative refund policy page.

**Remaining 8 stretched logos.** The header was corrected earlier; the login,
register, studio-login, studio-register pages and both dashboard layouts still
declared ~4:1 ratios against a 150×80 file.

**Checkout draft persistence.** Shipping details now survive a reload via
`sessionStorage` — deliberately not `localStorage`, since these are real personal
details that shouldn't outlive the tab on a shared machine. Cleared on successful
payment.

### Monitoring & onboarding (3C)

**`/api/health` probe.** Returns 200 only when the app can actually reach
MongoDB — process-liveness alone would report "up" while every page was broken.
Wired into the container `HEALTHCHECK` so bad deploys surface in `docker ps`.
Point external uptime monitoring here.

**Creator verification documented.** Worse than "undocumented": verification is
*mandatory* to sell — product, course and workshop creation all reject unless
`kyc.status === "approved"` — and nothing told creators it existed. `/studio/register`
now explains the real flow. No turnaround time stated, because none is defined
anywhere in the code and inventing an SLA would be another unverifiable claim.

**Structured data.** Product, course and blog pages already carried JSON-LD, but
there was no brand entity at all. Organization + WebSite now emitted sitewide,
with BreadcrumbList on category pages. `sameAs` deliberately omitted while the
social links are placeholders.

Error tracking was scoped out by decision: real tools need a third-party account
and add 30–100 KiB to the bundle, against the ~90 KiB just removed.

---

## Phase 2 — Server rendering, consent, bundle size

**Server-rendered the catalog.** `/marketplace` and `/learn` shipped as empty
shells to crawlers and non-JS clients — the audit confirmed the literal
`BAILOUT_TO_CLIENT_SIDE_RENDERING` marker on the two primary discovery pages of a
marketplace. Query logic was extracted into `src/lib/productSearch.ts` and
`src/lib/courseSearch.ts` (mirroring the existing `platformStats.ts` pattern) so
the same code serves both the API routes and Server Components. Client components
now seed from props with a mount guard, so hydration doesn't discard the
server-rendered data.

Two further instances were found during the work and folded in: **course detail
pages** looked like they followed the Server+Client split but rendered
`<CourseClientPage />` with zero props and refetched everything client-side; and
the **category listing grids** only server-rendered a static hero while
delegating the actual grid to a fetch-on-mount client component. While fixing the
course detail page, a `status: "published"` filter was added to the server query —
without it, serving server-fetched data directly would have exposed **unpublished
and draft courses publicly**.

**JS bundle.** Lighthouse found ~193 KiB of unused JS shipped identically on every
route. The cause wasn't a heavy library but a barrel-export leak: `Header.tsx`
imported `SearchBar` from the `molecules` barrel, which wildcard-re-exports 14
modules including `CertificateDownloadButton` → `jsPDF`. With no `sideEffects`
field, Webpack couldn't tree-shake it, and Header renders on ~41 pages. Fixed via
direct-path import, lazy `jsPDF` loading, and a `sideEffects` declaration scoped
to CSS (a blanket `false` would have let Webpack drop four real style imports).
Removed three unused `@dnd-kit` dependencies.

**Cookie consent.** `/cookies` described four categories but nothing gated them —
Google Analytics set `_ga`/`_gid` unconditionally, with EUR/GBP support implying
EU/UK visitors. A consent banner now gates it. Google Translate is deliberately
ungated: it sets only a first-party language-preference cookie, mapping to the
site's own "Functional" category rather than Analytics/Marketing.

**Content and accessibility.** Per-page metadata on 9 pages; `<main>` landmark and
a skip-navigation link site-wide (reusing a `SkipLink` component that already
existed but had never been exported or rendered); heading-hierarchy fixes on
three pages; CTA vocabulary collapsed from five creator labels to one; a data
retention section added to the Privacy Policy; fabricated per-category counts
removed; the FAQ refund answer corrected to match the actual returns policy.

---

## Phase 1 — Trust, discoverability, and critical bugs

**Commission rate reconciled.** The homepage and studio signup said creators keep
85%; the FAQ and Help Center said a flat 10% commission. Both were live
simultaneously, and `/pricing` — the page meant to resolve it — was a 404. Now a
single source of truth in `src/lib/commission.ts` (15% standard, 10% launch offer
through 31 Dec 2026) that expires automatically, with a real `/pricing` page.

**Platform stats made real.** The homepage, `/about` and `/learn` each hardcoded
conflicting figures (100,000+ artworks, 2,500+ courses, ₹54,695+ vs "50L+" vs
"$10M+"). Now computed from the database. *The footer carried its own copy of
these, missed in this pass and fixed in Phase 3 — since the footer renders
everywhere, those fabricated numbers were on every page.*

**Sitemap and robots.** `sitemap.xml` pointed every URL at `corecreator.com`, a
parked domain, and `robots.txt` didn't exist. The generator behind it had two
further bugs: it built `/product/{slug}` and `/course/{slug}` URLs when the real
routes are `/marketplace/{slug}` and `/learn/{slug}`, and filtered workshops by a
status value absent from the model's enum. Replaced with a native `sitemap.ts`
computed from live data.

**Public studio profiles were behind auth.** An over-broad middleware matcher
gated all of `/studio/*`, so `/studio/[id]` — the public seller profile — redirected
logged-out visitors to `/login`, breaking every "View Studio" button.

**Checkout bounced buyers to an empty cart.** `CartContext` loads from
`localStorage` in an effect, but the checkout page's guard checked
`items.length === 0` on first render and redirected before that landed. A
hydration race, not an empty cart. The same race caused a flash of "Your Cart is
Empty" on `/cart`.

**Security headers** (HSTS, X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy) added; `X-Powered-By` disabled. CSP was
deliberately deferred — the app embeds Razorpay, Google Translate, Analytics and
Bunny Stream, and a wrong policy could silently break payments.

**Mobile header.** The logo declared 160×40 against a real 150×80 file, so the
browser stretched it. The mobile menu had no backdrop; the first fix was
incomplete because the backdrop was nested inside an element with
`backdrop-blur-md`, and a non-`none` `backdrop-filter` makes an element the
containing block for its `fixed` descendants — so it sized against the header
rather than the viewport and never covered the page.

---

## Known deferred items

- Footer social links are placeholders; real URLs should also populate the
  Organization schema's `sameAs`.
- `/artists` loads its list client-side; needs a `getArtists()` lib function.
- No Content-Security-Policy (needs a full checkout run against a draft policy).
- `nginx` still advertises its version — set `server_tokens off;` on the VPS;
  it's outside this repo.
- `community/page.tsx` has its own hardcoded forum counts.
- No app-level error tracking.
- Google Translate is machine translation, not real i18n — no per-language
  content or locale routes.
