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

## Site structure (Next.js, served at `/`)
1. Header nav: Experiences | Menu | About | Book an Event
2. Hero — "Handcrafted kocktail experiences, konquered." ($200 deposit, licensed & insured; CTAs: Book Your Event / See Experiences)
3. Experiences (#experiences): Kustom Mixology Experience / Spirits & Kocktail Tasting / Full-Service Mobile Bar
4. Signature Kocktails menu (#menu): Nearest to Happiness / Konquered Sour (house signature) / Uncle's Spiced Side Car
5. About (#about) + contact
6. Booking form (#book): info → date → $200 Stripe deposit → confirmation

## Stack
- Next.js 14 App Router, deployed on Vercel. Stripe (deposits). Video on Mux via `@mux/mux-player-react`.
- Deliberately minimal: no Tailwind, no Supabase, no auth, no middleware. The page is 100% inline-styled and posts to exactly one API route.
- Routes: `/` (the site), `/portfolio` (Stephen's reel), `/merch` (the storefront), and `POST /api/checkout/kbsetup` (the $200 deposit). All public.
- Brand tokens (palette + the two typefaces) live in `app/theme.ts` — both pages import from it so they can't drift.

## /merch — portal-driven storefront
Same format as `theflexfacility.com/merch`, `islaystudiosllc.com/merch`, and `willpowerfitnessfactory.com/merch`. **The GoElev8 portal is the catalog** — nothing about the products is hardcoded here. Stephen lists / hides / re-prices / re-photographs merch in the portal Merch tab and it appears on the next page load. No redeploy.

- read: `GET {NEXT_PUBLIC_PORTAL_URL}/api/external/products?slug={NEXT_PUBLIC_PORTAL_SLUG}`
- buy: `POST {NEXT_PUBLIC_PORTAL_URL}/api/external/checkout` → Stripe Connect **direct** charge on Stephen's connected account, created portal-side. This storefront never sees his `acct_` id, and the portal prices against its own DB so nothing here can fabricate a discounted line item.
- Stripe collects name / email / phone / shipping natively; this page only gathers the variant (size, color) first. Order recording, notifications, and the platform fee all live portal-side. **There is deliberately no order state in this repo.**
- Product images come from arbitrary operator-uploaded hosts, so the cards use a plain `<img>` rather than `next/image` — avoids allow-listing every remote host in `next.config.mjs`.
- A `404 tenant_not_found` is treated as the pre-launch empty shelf, not an error.

## /portfolio — Stephen's reel
A résumé page: credential strip, then up to **5** Mux videos. Portal-driven the same way `/merch` is, so Stephen adds/removes reel entries from the portal Portfolio tab with no redeploy.

- read: `GET {NEXT_PUBLIC_PORTAL_URL}/api/external/portfolio?slug={NEXT_PUBLIC_PORTAL_SLUG}` → `{ videos: [{ key, title, description, playback_id, poster_url, sort_order }] }`
- **This endpoint does not exist in the portal yet.** Until it ships, the page renders `SEED_VIDEOS` in `PortfolioClient.tsx` (the three clips Stephen started with) and switches over silently the moment the portal answers.
- Any failure — 404, network, malformed, or an empty array — keeps the seed reel on screen. A portfolio showing nothing is worse than one that's slightly stale, so there is deliberately no empty state in the normal path.
- `MAX_VIDEOS = 5` is enforced here on render **and** must be enforced portal-side on write. Two independent caps on purpose.
- Credential strip copy must stay independently verifiable — don't add a credential that isn't already carried on the site or in this file.

## Env vars (see `.env.local.example`)
| Var | Purpose | Without it |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://konqueredkocktails.com` — Stripe return URLs | Stripe returns to the wrong origin |
| `STRIPE_SECRET_KEY` | goElev8 platform key | checkout route 500s |
| `KB_STRIPE_CONNECTED_ACCOUNT_ID` | Konquered Balance `acct_...` | route 402s → page shows "Demo mode — no live charge" |
| `NEXT_PUBLIC_PORTAL_URL` | portal origin for /merch | defaults to `https://portal.goelev8.ai` |
| `NEXT_PUBLIC_PORTAL_SLUG` | tenant slug for /merch | defaults to `konquered-kocktails`; must match `clients.slug` in the portal |

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
- 2026-07-28: Added `/portfolio`, portal-driven with a seed-reel fallback (the portal endpoint isn't built yet). Capped at 5 videos.
- 2026-07-25: Added `/merch`, portal-driven. Extracted `app/theme.ts` so the storefront and homepage share one palette. Added a "Shop" nav link (NAV_LINKS entries beginning with `/` are real routes; everything else is a scroll anchor).
- 2026-07-25: Migrated the finished page out of `goelev8-funnels` into this standalone repo as the homepage. Added Cormorant Garamond as the display face alongside Outfit. Dropped the `setup` (client-pays-goElev8) branch from the checkout route — customer-facing site takes deposits only.

## Open items / follow-ups
- Get logo files, fonts, and a written brand-voice guide from client (Drive folders are empty).
- Set `STRIPE_SECRET_KEY` + `KB_STRIPE_CONNECTED_ACCOUNT_ID` in Vercel to take deposits live (site runs in demo mode until then).
- The page still credits goElev8 in the footer (`/images/goelev8-full-logo.png`) — confirm that stays on the client's own domain.
