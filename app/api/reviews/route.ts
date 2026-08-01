// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// GET  /api/reviews — published reviews, newest first, for the social-proof
//                     strip under the form. Never returns email.
// POST /api/reviews — capture a new review. Always lands unpublished; Stephen
//                     approves before anything shows.
//
// Goes through the server rather than straight from the browser because the
// Supabase anon key is shared across every tenant in the portal's project —
// see lib/supabase.ts for why that key must not be published.

import { sb, uploadPhoto, CLIENT_ID, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const MAX_PHOTOS = 3;
/** Per-image ceiling after the browser has downscaled. The bucket enforces
 *  5 MB independently; this is the cheap check that runs first. */
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MIN_REVIEW_CHARS = 1;
/** No hard ceiling on the review itself, per the brief — but an unbounded
 *  text column is a free denial-of-wallet, so there's a sanity stop well
 *  past any real testimonial. */
const MAX_REVIEW_CHARS = 20000;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

/** Columns safe to hand back to an anonymous caller. `email` is deliberately
 *  absent — a guest leaving their address for follow-up has not agreed to
 *  have it published. */
const PUBLIC_COLUMNS = 'id,rating,review_text,event_type,guest_name,photos,created_at';

function field(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return Response.json({ reviews: [] });

  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit')) || 5, 20);
  const result = await sb<unknown[]>(
    `reviews?select=${PUBLIC_COLUMNS}` +
      `&client_id=eq.${CLIENT_ID}` +
      `&published=is.true` +
      `&order=created_at.desc&limit=${limit}`,
    { method: 'GET' },
  );

  // A read failure shouldn't break the page — the form is the point, the
  // social proof is a bonus.
  if (!result.ok) return Response.json({ reviews: [] });
  return Response.json({ reviews: result.data ?? [] });
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return Response.json(
      { error: 'Reviews aren’t connected yet.', demo: true },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rating = Math.floor(Number(body.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: 'Please choose a rating from 1 to 5.' }, { status: 400 });
  }

  const reviewText = field(body.review_text, MAX_REVIEW_CHARS);
  if (reviewText.length < MIN_REVIEW_CHARS) {
    return Response.json({ error: 'Please tell us about your experience.' }, { status: 400 });
  }

  const email = field(body.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'That email address doesn’t look right.' }, { status: 400 });
  }
  // Consent is only meaningful alongside an address.
  const contactOk = Boolean(body.contact_ok) && Boolean(email);

  /* Photos arrive as data URLs — the browser downscales and re-encodes before
     sending, so these are small. Decoding here (rather than accepting a URL)
     means nothing reaches storage that we haven't seen the bytes of. */
  const photos: string[] = [];
  const incoming = Array.isArray(body.photos) ? body.photos.slice(0, MAX_PHOTOS) : [];
  for (const [i, raw] of incoming.entries()) {
    const match = /^data:([\w/+.-]+);base64,(.+)$/.exec(String(raw ?? ''));
    if (!match) continue;
    const [, contentType, b64] = match;
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) continue;

    const buf = Buffer.from(b64, 'base64');
    if (!buf.length || buf.length > MAX_PHOTO_BYTES) continue;
    // Slice to an exact ArrayBuffer — Buffer views share a pooled backing
    // store, so passing buf.buffer straight through would upload neighbouring
    // requests' bytes as well.
    const bytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

    const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
    // crypto.randomUUID keeps guests from guessing or overwriting each
    // other's object paths; the storage policy grants insert but never
    // update or delete.
    const objectPath = `${CLIENT_ID}/${crypto.randomUUID()}-${i}.${ext}`;
    const url = await uploadPhoto(objectPath, bytes, contentType);
    if (url) photos.push(url);
  }

  /* Deliberately NOT Prefer: return=representation. Asking PostgREST to
     return the row makes it RETURNING, which is evaluated against the SELECT
     policy — and that policy only exposes published rows. A brand-new review
     is unpublished by definition, so the whole INSERT would fail 42501. The
     guest doesn't need the id back. */
  const result = await sb<null>('reviews', {
    method: 'POST',
    body: {
      client_id: CLIENT_ID,
      rating,
      review_text: reviewText,
      event_type: field(body.event_type, 80) || null,
      guest_name: field(body.guest_name, 120) || null,
      email: email || null,
      contact_ok: contactOk,
      photos,
      // Never trust the client for these. The RLS policy also enforces it,
      // so a caller sending published: true is rejected at the database.
      published: false,
      published_at: null,
      source: 'website',
      source_url: field(body.source_url, 300) || null,
    },
  });

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ ok: true, photos_saved: photos.length });
}
