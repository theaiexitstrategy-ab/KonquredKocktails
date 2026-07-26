// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved.
//
// Konquered Kocktails brand tokens — single source of truth for both the
// homepage (KkClient.tsx) and the storefront (merch/MerchClient.tsx), so the
// two can't drift apart. Palette is CLAUDE.md's, verbatim.
//
// Warm Black / Deep Emerald backgrounds · Cream Highlight body text ·
// Royal Gold / Konquered Bronze accents & CTAs · Garnet + Amethyst sparingly
// for depth.

export const INK = '#151310';        // Warm Black — base background
export const PANEL = '#1b1813';      // raised surfaces (warm)
export const PANEL2 = '#232019';     // nested surfaces
export const EMERALD = '#123D35';    // Deep Emerald — feature background band
export const EMERALD_D = '#0d2b25';  // deeper emerald for gradients
export const GOLD = '#C39A45';       // Royal Gold — primary accent / CTA
export const GOLD_HI = '#D9B25A';    // lighter royal gold for gradient tops / shimmer
export const BRONZE = '#9A633A';     // Konquered Bronze — secondary accent
export const GOLD_D = '#6f4a26';     // deep bronze for gradient bottoms / shadow
export const GARNET = '#681F2B';     // Konquered Garnet — depth, used sparingly
export const AMETHYST = '#5C3B70';   // Amethyst Accent — depth, used sparingly
export const CREAM = '#E8D8B8';      // Cream Highlight
export const TEXT = '#EFE7D5';       // primary text (bright cream)
export const MUTED = '#A99C82';      // warm muted
export const DIM = '#776C58';        // faint
export const LINE = 'rgba(195,154,69,0.16)';   // royal-gold hairline
export const LINE2 = 'rgba(195,154,69,0.30)';  // stronger gold hairline

/* Two typefaces, loaded in app/layout.tsx. FD carries the editorial voice —
   hero, section headlines, product names, prices. FB carries every functional
   surface: eyebrows, labels, buttons, inputs, nav, and the wordmark itself,
   which stays Outfit to match the Konquered Balance logo. */
export const FD = '"Cormorant Garamond", "Times New Roman", Georgia, serif';
export const FB = '"Outfit", system-ui, -apple-system, sans-serif';

/* Shared contact block — used by both pages' footers. */
export const CONTACT = {
  phone: '(314) 503-9198',
  email: 'stephen@konqueredbalance.com',
  address: '920 Hemsath, Suite 100, St. Charles, MO 63303',
  area: 'St. Charles & Greater St. Louis',
};
