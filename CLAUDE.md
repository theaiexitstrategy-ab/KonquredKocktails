# CLAUDE.md — Konquered Kocktails funnel

> Persistent project context for Claude Code. Auto-loaded every session.
> Client: **Stephen Simmons** — Konquered Balance / Konquered Kocktails.
> This repo is the standalone site for **konqueredkocktails.com**. Migrated 2026-07-25 from the draft at goelev8.ai/kk in the `goelev8-funnels` monorepo; that copy remains the upstream source of the page.

## Brand essence
- North star / tagline: **"Intention is the experience."**
- Positioning: premium, sensory, craft-cocktail *experience* brand. St. Charles / St. Louis mobile bar built on handcrafted drinks, Uncle Nearest bourbon, and showmanship.
- Primary funnel goals: **event booking inquiries** and **brand awareness**. Booking flow takes a **$200 deposit** via Stripe. Licensed & insured.

## Brand color palette
| Name | Hex |
|------|-----|
| Deep Emerald | `#123D35` |
| Konquered Bronze | `#9A633A` |
| Royal Gold | `#C39A45` |
| Warm Black | `#151310` |
| Cream Highlight | `#E8D8B8` |
| Amethyst Accent | `#5C3B70` |
| Konquered Garnet | `#681F2B` |

Usage guidance: Warm Black / Deep Emerald for backgrounds, Cream Highlight for body text on dark, Royal Gold / Konquered Bronze for accents and CTAs, Garnet/Amethyst sparingly for depth.

## Typography
- Display / headlines: **Cormorant Garamond** (600–700). Hero, section heads, package + drink names, step headings, the $200 figure.
- Body, labels, buttons, inputs, nav, and the **wordmark**: **Outfit** (300–600). The wordmark stays Outfit deliberately — it matches the Konquered Balance logo.
- Both load from Google Fonts in `app/layout.tsx`. `KkClient.tsx` selects between them via the `FD` / `FB` constants — change the pairing in one place.

## POSITIONING — read this before editing any copy
**This is not a bartender-for-hire service.** Stephen Simmons is an artist who composes a drink experience out of the elements already in the room — the people, the occasion, the light, the spirits on hand. Copy should read as commissioning an artist, never as booking a bar. The hero is "An art gallery in a glass"; the about section names the distinction outright.

## Site structure
1. Header nav: Experiences | Menu | About | Event Log | Reviews | Shop | **Reserve a Date**
2. Hero — "An art gallery in a glass." CTAs: Reserve a Date / See the Work
3. Experiences (#experiences) — three starting points, not packages; each deep-links to `/book?experience=<key>`
4. Signature Kocktails (#menu) — standing works from the studio; your event gets its own list
5. About (#about) — the artist
6. #book — a pitch that links to `/book`. **The homepage does not take bookings.**

## Stack
- Next.js 14 App Router, deployed on Vercel. Stripe (deposits). Video on Mux via `@mux/mux-player-react`.
- Deliberately minimal: no Tailwind, no auth, no middleware, no Stripe SDK. Every page is 100% inline-styled. Supabase is reached over REST from the server, for `/reviews` only.
- Routes: `/`, `/book` (booking calendar), `/portfolio` (event log), `/reviews` (guest stories), `/merch` (storefront), plus `/api/book/*` and `/api/reviews`. All public.
- Brand tokens (palette + the two typefaces) live in `app/theme.ts` — both pages import from it so they can't drift.

## /merch — portal-driven storefront
Same format as `theflexfacility.com/merch`, `islaystudiosllc.com/merch`, and `willpowerfitnessfactory.com/merch`. **The GoElev8 portal is the catalog** — nothing about the products is hardcoded here. Stephen lists / hides / re-prices / re-photographs merch in the portal Merch tab and it appears on the next page load. No redeploy.

- read: `GET {NEXT_PUBLIC_PORTAL_URL}/api/external/products?slug={NEXT_PUBLIC_PORTAL_SLUG}`
- buy: `POST {NEXT_PUBLIC_PORTAL_URL}/api/external/checkout` → Stripe Connect **direct** charge on Stephen's connected account, created portal-side. This storefront never sees his `acct_` id, and the portal prices against its own DB so nothing here can fabricate a discounted line item.
- Stripe collects name / email / phone / shipping natively; this page only gathers the variant (size, color) first. Order recording, notifications, and the platform fee all live portal-side. **There is deliberately no order state in this repo.**
- Product images come from arbitrary operator-uploaded hosts, so the cards use a plain `<img>` rather than `next/image` — avoids allow-listing every remote host in `next.config.mjs`.
- A `404 tenant_not_found` is treated as the pre-launch empty shelf, not an error.

## /book — the booking calendar
The ONE booking flow. Availability is real: the portal computes weekly rules − blackout blocks − existing bookings, so a slot shown cannot already be taken.

1. details → `POST /api/book/lead` (captured BEFORE payment, so abandoned enquiries still reach Stephen)
2. date → `GET /api/book/availability`
3. deposit → `POST /api/book/deposit` → portal-created Stripe Checkout
4. confirmed

All three are **server-side proxies**. The portal's `experience-*` endpoints authenticate with a tenant write key (`KK_PORTAL_WRITE_KEY`) that is sha256-hashed at rest and grants write access to this tenant's leads and bookings — it must never reach the browser. See `lib/portal.ts`.

Without the key the proxies return 402 `{demo:true}` and `/book` shows provisional dates clearly labelled as placeholders. Nothing pretends a booking was made.

**This repo holds no Stripe key.** The portal owns Stripe end to end. The old `/api/checkout/kbsetup` is retired — two deposit paths with two notions of availability is how you double-book.

## /portfolio — the event log
Every event Stephen has composed, newest first, filterable by type and year. Not a reel and not a CV. No cap — a log is supposed to grow.

- read: `GET {NEXT_PUBLIC_PORTAL_URL}/api/external/portfolio?slug={NEXT_PUBLIC_PORTAL_SLUG}`
- Preferred response key is `events`, carrying `event_type` / `event_date` / `venue` / `city` / `guest_count` (the filters run on these). The portal currently returns the older reel shape under `videos`; both are accepted.
- Because the portal rows have no metadata yet, portal values are **merged over** `SEED_EVENTS` by key: portal wins on any field it has, the seed fills only what the portal left null. Once Stephen backfills, the merge stops doing anything.
- Any failure keeps the seed on screen. Seed entries assert only `event_type` — dates and venues stay null rather than invented, because a fabricated venue on a record of real work is worse than a blank field.

## Env vars (see `.env.local.example`)
| Var | Purpose | Without it |
|---|---|---|
| `KK_PORTAL_WRITE_KEY` | **secret** — tenant write key for `/book` | proxies 402 → /book demo mode |
| `SUPABASE_ANON_KEY` | **server-side only** — `/reviews` | reviews route 503 |
| `NEXT_PUBLIC_PORTAL_URL` | portal origin | defaults to `https://portal.goelev8.ai` |
| `NEXT_PUBLIC_PORTAL_SLUG` | tenant slug | defaults to `konquered-balance` |
| `NEXT_PUBLIC_APP_URL` | canonical origin for metadata | metadata URLs fall back |

**The tenant slug is `konquered-balance`** (the LLC), NOT `konquered-kocktails`. The portfolio endpoint happens to accept both via an alias; the products endpoint only accepts the real one.

`STRIPE_SECRET_KEY` and `KB_STRIPE_CONNECTED_ACCOUNT_ID` are **no longer used in this repo** — they moved portal-side with the deposit flow.

The 402 is intentional, not a bug: without the connected account, charging would route guest deposits into goElev8's balance, contradicting the "you keep 100% of the deposits" promise on the page. Never add a platform-charge fallback.

## Asset source of truth
- Client Google Drive (READ-ONLY — never edit): https://drive.google.com/drive/folders/1X8WXmzLMo55YspnCYhjnbIMlLb6NIDVv
- Owner: stephen@konqueredbalance.com
- Folders: 00_CONTENT DASHBOARD, 01_BRAND ASSETS (Logos/Fonts/Brand Voice folders currently EMPTY — request from client), 02_FOOTAGE BANK, 03_ACTIVE CONTENT, 04_PUBLISHED CONTENT, 05_ARCHIVE.
- Naming convention: `YYYY-MM-DD_Feature_Shot-Version`.

## Video hosting decision
- All site video is on **Mux**, played through `@mux/mux-player-react` (dynamically imported with `ssr: false` — the custom element can't render during SSR). Playback IDs are hard-coded in `KkClient.tsx` and work from any domain.
- Never commit raw MP4 masters to the repo or serve them un-optimized from `public/`.

## Current work log
- 2026-08-01: Added `/reviews`. Created `public.reviews` + the `event-photos` bucket. Granted `anon` EXECUTE on `public.locs_is_admin()` — four PUBLIC storage policies call it, and anon's lack of EXECUTE was erroring and blocking ALL anonymous uploads to every bucket.
- 2026-07-29: Repositioned as artist-led. Added `/book` on real portal availability; deleted the homepage's fake calendar and retired `/api/checkout/kbsetup`. Rebuilt `/portfolio` as a filterable event log. Corrected the tenant slug to `konquered-balance`.
- 2026-07-28: Added `/portfolio`, portal-driven with a seed fallback.
- 2026-07-25: Added `/merch`, portal-driven. Extracted `app/theme.ts` so the storefront and homepage share one palette. Added a "Shop" nav link (NAV_LINKS entries beginning with `/` are real routes; everything else is a scroll anchor).
- 2026-07-25: Migrated the finished page out of `goelev8-funnels` into this standalone repo as the homepage. Added Cormorant Garamond as the display face alongside Outfit. Dropped the `setup` (client-pays-goElev8) branch from the checkout route — customer-facing site takes deposits only.

## /reviews — guest stories
Rating + a few sentences is a complete submission; name, email, event type, and photos are all optional and labelled so.

- `POST /api/reviews` inserts into `public.reviews` with `published = false`. Approval is enforced twice: the route hardcodes the flag, and the RLS policy refuses an anon insert where `published` is true.
- `GET /api/reviews` returns approved rows only, via an explicit column list that **excludes `email`** — storing an address for follow-up is not consent to publish it.
- Photos: browser downscales to 1600px / JPEG q0.82 before upload (a raw phone photo would blow the serverless body limit three at a time), then the route uploads to the `event-photos` bucket. Max 3, enforced in the UI, the route, and a table constraint.
- **The Supabase anon key is held SERVER-SIDE only** (`SUPABASE_ANON_KEY`, no `NEXT_PUBLIC_` prefix). This project is shared across every portal tenant, so its anon key is only as safe as the weakest RLS policy in it — and at least one table (`public.sms_credits`) currently has RLS disabled entirely. Do not move this to a browser client until that's fixed.
- Stephen has no approval UI yet. Until the portal Reviews tab exists, approving means `UPDATE reviews SET published = true, published_at = now()`.

## Open items / follow-ups
- Get logo files, fonts, and a written brand-voice guide from client (Drive folders are empty).
- Set `STRIPE_SECRET_KEY` + `KB_STRIPE_CONNECTED_ACCOUNT_ID` in Vercel to take deposits live (site runs in demo mode until then).
- The page still credits goElev8 in the footer (`/images/goelev8-full-logo.png`) — confirm that stays on the client's own domain.
