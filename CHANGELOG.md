# Changelog

Work delivered against the August 2026 audit of corecreator.online, grouped by
phase, newest first. Each entry says what changed and why — the reasoning
matters more than the file list, particularly where something was deliberately
left alone.

---

## Phase 5 — "Looks real, isn't": simulated flows and payment integrity

*In progress.*

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

**Workshop checkout takes no payment at all.** `handlePayment` is a two-second
`setTimeout` followed by a "Payment Successful!" toast and a redirect to the
success page. No API call, no charge, no seat reserved, no record — while a
Razorpay logo sits on the page. Live and reachable. The server half is now built
(the route had only a bare `// Add workshop if needed` comment); the page still
needs wiring to it.

### Fabricated data

**`/studio/[id]` invents verified instructors.** When a user isn't found it serves
made-up people — named, with stock photos, bios, `isVerified: true` and
`example.com` contact details — and *any* unknown ID returns a plausible fake
profile instead of 404, generating unlimited indexable fake pages.

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
