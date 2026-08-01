// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// GET /api/drinks — this week's signature Kocktails, 3–5 of them, in the
// order Stephen set. Reads public.client_signature_drinks.
//
// Server-side rather than browser-direct for the same reason as /api/reviews:
// the Supabase anon key is shared across every portal tenant, so it stays off
// the client. See lib/supabase.ts.
//
// The portal has no Drinks tab yet, so today this table is edited by hand.
// The site is already reading it, so that tab is purely a UI job — no
// contract change needed here.

import { sb, CLIENT_ID, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** The list is meant to feel curated, not exhaustive. */
const MAX_DRINKS = 5;

const COLUMNS = 'drink_key,name,build,notes,zero_proof,is_feature,image_url,sort_order,week_of';

export async function GET() {
  if (!isSupabaseConfigured()) return Response.json({ drinks: [] });

  const result = await sb<unknown[]>(
    `client_signature_drinks?select=${COLUMNS}` +
      `&client_id=eq.${CLIENT_ID}` +
      `&is_active=is.true` +
      `&order=sort_order.asc&limit=${MAX_DRINKS}`,
    { method: 'GET' },
  );

  // A read failure shouldn't blank the menu — the page falls back to its own
  // seed list, which is better than an empty section.
  if (!result.ok) return Response.json({ drinks: [] });
  return Response.json({ drinks: result.data ?? [] });
}
