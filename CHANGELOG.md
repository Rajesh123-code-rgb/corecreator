# Changelog

Work delivered against the August 2026 audit of corecreator.online, grouped by
phase, newest first. Each entry says what changed and why — the reasoning
matters more than the file list, particularly where something was deliberately
left alone.

---

## Phase 4 — Indexation & trust claims

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
nothing behind them — no linked review platform, no rating data to compute from.
Replaced with a 30-day money-back guarantee and secure checkout, both true and
already documented on `/returns`.

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
