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
- Routes: `/` (the site) and `POST /api/checkout/kbsetup` (the $200 deposit). Both public.

## Env vars (see `.env.local.example`)
| Var | Purpose | Without it |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://konqueredkocktails.com` — Stripe return URLs | Stripe returns to the wrong origin |
| `STRIPE_SECRET_KEY` | goElev8 platform key | checkout route 500s |
| `KB_STRIPE_CONNECTED_ACCOUNT_ID` | Konquered Balance `acct_...` | route 402s → page shows "Demo mode — no live charge" |

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
- 2026-07-25: Migrated the finished page out of `goelev8-funnels` into this standalone repo as the homepage. Added Cormorant Garamond as the display face alongside Outfit. Dropped the `setup` (client-pays-goElev8) branch from the checkout route — customer-facing site takes deposits only.

## Open items / follow-ups
- Get logo files, fonts, and a written brand-voice guide from client (Drive folders are empty).
- Set `STRIPE_SECRET_KEY` + `KB_STRIPE_CONNECTED_ACCOUNT_ID` in Vercel to take deposits live (site runs in demo mode until then).
- The page still credits goElev8 in the footer (`/images/goelev8-full-logo.png`) — confirm that stays on the client's own domain.
