// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/revalidate — the portal tells this site to drop a cached section
// the moment Stephen changes it, instead of waiting out the 60s (hero) or
// 300s (events) revalidate window. That lag is what made a hero change that
// had worked look like it hadn't.
//
//   header x-portal-key-sha256: sha256(KK_PORTAL_WRITE_KEY), lowercase hex
//   body   { "tag": "hero-video" | "kk-events" }
//
// WHY A HASH: this site holds the raw tenant write key; the portal stores
// only its sha256 (tenant_write_keys.key_hash), so the hash is the one value
// both sides already have — no new secret on either. The hash is a verifier,
// not the key: it can't call the portal's write endpoints. A raw
// `x-portal-key` equal to KK_PORTAL_WRITE_KEY is accepted too.
//
// Only the two known tags are honoured, so this can't purge arbitrary cache.

import { createHash, timingSafeEqual } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';

import { HERO_VIDEO_TAG } from '@/lib/hero-video';
import { EVENTS_TAG } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TAGS = new Set([HERO_VIDEO_TAG, EVENTS_TAG]);

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const key = process.env.KK_PORTAL_WRITE_KEY || '';
  if (!key) return Response.json({ error: 'not_configured' }, { status: 500 });

  const hash = (req.headers.get('x-portal-key-sha256') || '').trim().toLowerCase();
  const raw = (req.headers.get('x-portal-key') || '').trim();
  const authed =
    (hash && sameSecret(hash, createHash('sha256').update(key).digest('hex'))) ||
    (raw && sameSecret(raw, key));
  if (!authed) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { tag?: unknown } | null;
  const tag = typeof body?.tag === 'string' ? body.tag : '';
  if (!TAGS.has(tag)) return Response.json({ error: 'unknown_tag' }, { status: 400 });

  revalidateTag(tag);
  // Both sections render on the homepage, which is statically regenerated.
  revalidatePath('/');
  console.log('[revalidate]', tag);
  return Response.json({ ok: true, revalidated: true, tag });
}

const notAllowed = () =>
  Response.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST' } });
export { notAllowed as GET, notAllowed as PUT, notAllowed as PATCH, notAllowed as DELETE };
