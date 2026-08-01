// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// THE EXPERIENCE COLLECTION — single source of truth for the offerings and
// their pricing. The homepage section renders entirely from this file, so a
// price change is a one-line edit here and nothing else.
//
// Copy is approved and close to verbatim. Two brand rules govern edits:
//   - Never "bartending" — it's intentional hospitality / culinary artistry.
//   - Never "book now" / "buy" — it's Begin the Experience Discovery /
//     Begin the Conversation.
// Capital-K styling is deliberate: Kocktail, Krafted, Kustom.
//
// NOTE ON `slug` vs the booking flow: these slugs are for the marketing
// section only. /book sends an `experience_key` from app/theme.ts, and those
// keys are what the portal's availability_rules are keyed on. The two lists
// do NOT correspond — see the TODO in app/KkClient.tsx.

export type Tier = {
  name: string;
  designedFor: string;
  budgetMinimum: string;
  /** Inclusive guest bounds behind `designedFor`. /book uses the guest count
   *  the visitor already enters to name the tier they're heading for, rather
   *  than asking them to self-select from a price table. */
  minGuests: number;
  maxGuests: number | null;
};

export type Experience = {
  slug: string;
  title: string;
  tagline: string;
  /** Long-form positioning for the flagship; short blurb elsewhere. */
  designedFor?: string;
  experience?: string;
  included: string[];
  /** Single-price offerings. Mutually exclusive with `tiers` in practice. */
  investment?: string;
  /** The tiered flagship. */
  tiers?: Tier[];
  /** Renders larger, first, and full-width. Exactly one should carry it. */
  flagship?: boolean;
};

export const EXPERIENCE_COLLECTION: Experience[] = [
  {
    slug: 'signature-kraft-kocktail',
    title: 'Signature Kraft Kocktail Experience',
    tagline: 'Designed around your people, your atmosphere, your story.',
    flagship: true,
    experience:
      'A custom culinary experience designed around your people, your atmosphere, and the story you are gathering to share. Every expression is shaped through flavor architecture, intentional presentation, and a thoughtful guest journey — from arrival to the final pour.',
    tiers: [
      { name: 'Share My Art', designedFor: 'Up to 15 guests', budgetMinimum: '$750', minGuests: 1, maxGuests: 15 },
      { name: 'Signature', designedFor: '16–50 guests', budgetMinimum: '$1,250', minGuests: 16, maxGuests: 50 },
      { name: 'Imprint', designedFor: '51–100 guests', budgetMinimum: '$3,250', minGuests: 51, maxGuests: 100 },
      { name: 'Konquered', designedFor: '100+ guests', budgetMinimum: '$4,500', minGuests: 101, maxGuests: null },
    ],
    included: [
      'Experience discovery and concept direction',
      'Custom Kocktail and zero-proof expression development',
      'Curated menu language and sensory presentation',
      'Thoughtful ingredient sourcing and preparation',
      'On-site experience curation, setup, and breakdown',
      'Intentional guest interaction and hospitality',
    ],
  },
  {
    slug: 'krafted-expressions',
    title: 'Krafted Expressions',
    tagline: 'Your gathering, expressed beautifully in every pour.',
    investment: 'Starting at $300',
    designedFor:
      'Designed for hosts who want Konquered artistry without a full on-site experience. Prepared in advance for effortless, elevated sharing.',
    included: [
      'Krafted Kocktail or zero-proof expressions',
      'Flavor and presentation direction',
      'Preparation guidance',
      'Optional garnish, delivery, and display enhancements',
    ],
  },
  {
    slug: 'guided-spirit-wine',
    title: 'Guided Spirit & Wine Experiences',
    tagline: 'Every bottle carries a story.',
    investment: 'Starting at $650',
    designedFor:
      'Guided tasting for private gatherings, executive groups, celebrations, and curious palates. Discovery through origin, craftsmanship, aroma, and flavor.',
    included: [
      'Curated tasting flight',
      'Palate progression and tasting guidance',
      'Cultural and historical storytelling',
      'Intentional sensory elements',
      'Interactive conversation',
    ],
  },
  {
    slug: 'create-your-expression',
    title: 'Create Your Expression',
    tagline: 'Step inside the creative process.',
    investment: 'Starting at $750',
    designedFor:
      'A participatory experience for teams, celebrations, and private groups. Guests explore citrus, herbs, botanicals, spices, syrups, spirits, and zero-proof foundations to build their own expression.',
    included: [
      'Guided flavor exploration',
      'Creative foundations and ingredients',
      'Hands-on expression development',
      'Sensory and presentation guidance',
      'All experience materials',
    ],
  },
  {
    slug: 'art-of-the-pour',
    title: 'The Art of the Pour',
    tagline: 'Understand flavor. Expand your creative language.',
    investment: 'Private from $250 · Group from $500',
    designedFor:
      'An intimate exploration of balance, aroma, texture, and taste — learning how ingredients relate and how a point of view becomes an expression.',
    included: [
      'Guided sensory exploration',
      'Flavor balance and architecture',
      'Ingredient pairing',
      'Hands-on creative development',
      'Personalized guidance',
    ],
  },
  {
    slug: 'kustom-kocktail-development',
    title: 'Kustom Kocktail Development',
    tagline: 'Every story deserves its own expression.',
    investment: 'Starting at $250',
    designedFor:
      'For milestones, gifts, personal traditions, and concepts that deserve a signature flavor. Meaning translated into an original recipe through flavor, aroma, presentation, naming, and story.',
    included: [
      'Creative discovery',
      'Original recipe development and testing',
      'Final specifications',
      'Ingredient and garnish direction',
      'Naming and story direction',
    ],
  },
  {
    slug: 'brand-culinary-development',
    title: 'Brand & Culinary Development',
    tagline: 'Brand identity, translated into flavor.',
    investment: 'Starting at $1,000',
    /** Shown beneath the investment line — scope varies too much for a flat figure. */
    experience: 'Custom proposals reflect scope.',
    designedFor:
      'For restaurants, hospitality groups, creative teams, and brands. Signature Kocktails, collections, and beverage experiences that strengthen identity and deepen the guest journey.',
    included: [
      'Brand and concept discovery',
      'Original Kocktail development',
      'Flavor and sensory direction',
      'Menu and presentation strategy',
      'Activation or launch recommendations',
    ],
  },
];

/** Look up an offering by slug. The slug doubles as the `experience_key`
 *  sent to the portal — availability rules and bookings are keyed on it.
 *  Renaming a slug therefore detaches any availability bound to it. */
export function experienceBySlug(slug: string): Experience | undefined {
  return EXPERIENCE_COLLECTION.find((e) => e.slug === slug);
}

/** Which expression a guest count lands in. Returns undefined for offerings
 *  without tiers, or when no count has been entered yet. */
export function tierForGuestCount(
  experience: Experience,
  guests: number | null,
): Tier | undefined {
  if (!experience.tiers || !guests || guests < 1) return undefined;
  return experience.tiers.find(
    (t) => guests >= t.minGuests && (t.maxGuests === null || guests <= t.maxGuests),
  );
}

/** The line shown under an offering while booking: its tier budget minimum
 *  once we know the guest count, otherwise its starting investment. */
export function investmentLine(experience: Experience, guests: number | null): string | null {
  const tier = tierForGuestCount(experience, guests);
  if (tier) return `${tier.name} · from ${tier.budgetMinimum}`;
  if (experience.tiers) return `Budget minimums from ${experience.tiers[0].budgetMinimum}`;
  return experience.investment ?? null;
}

/* ── The Konquered Experience Journey ──────────────────────────────── */

export type JourneyStep = { step: string; body: string };

export const JOURNEY_INTRO =
  'A minimum three-week experience-design window protects the intention, craftsmanship, and care behind every detail.';

export const JOURNEY: JourneyStep[] = [
  {
    step: 'Discover',
    body: 'A complimentary 15-minute consultation to understand your guests, your vision, and the feeling you want them to carry away.',
  },
  {
    step: 'Design',
    body: 'Flavor, presentation, story, and sensory details are shaped into one cohesive direction.',
  },
  {
    step: 'Refine',
    body: 'Expressions are perfected, ingredients sourced, and every element prepared for seamless delivery.',
  },
  {
    step: 'Experience',
    body: 'Guests enter an environment where culinary artistry, hospitality, and connection move together.',
  },
  {
    step: 'Legacy',
    body: 'The experience continues through memory, conversation, and the relationships created around the moment.',
  },
];

/* ── Closing CTA ───────────────────────────────────────────────────── */

export const CTA_COPY = {
  heading: 'Begin the Conversation',
  body: 'Konquered Kocktails accepts a limited number of experiences each month. If our approach aligns with the feeling you want to create, the next step is a brief Experience Discovery.',
  // TODO(Aaron): confirm deposit model — copy says 50%, current flow charges $200 flat
  finePrint:
    'Inquiry does not reserve a date. A signed agreement and 50% non-refundable deposit begin the design process.',
  button: 'Begin the Experience Discovery',
};
