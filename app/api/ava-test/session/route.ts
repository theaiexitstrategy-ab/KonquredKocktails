// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/ava-test/session — unlocks the private Ava test page.
//
// Returns the Vapi PUBLIC key and the assistant id only after a correct
// passcode. A public key is designed to live in a browser, but anyone holding
// it can start calls billed to the Vapi org — so it stays off the static page
// and is handed out only to someone who knows the passcode. This is a testing
// convenience for Aaron and Stephen, not an auth system.
//
// Env (set in Vercel; "Sensitive" is fine — these are read at runtime):
//   AVA_TEST_PASSCODE   6-digit code for the test page. Short on purpose, so
//                       the attempt limit below is what protects it: 10
//                       tries per IP per 10 minutes. Acceptable for an
//                       internal test page; not a pattern for anything real.
//   VAPI_PUBLIC_KEY     Vapi *public* key (NOT the private key)
//   VAPI_ASSISTANT_ID   the Konquered Kocktails concierge assistant

import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';

const HITS = new Map<string, { n: number; until: number }>();
const WINDOW_MS = 10 * 60_000;
/** Generous for two people testing, tight enough to stop guessing. */
const MAX_ATTEMPTS = 10;

function limited(ip: string): boolean {
  const now = Date.now();
  const rec = HITS.get(ip);
  if (!rec || now > rec.until) {
    HITS.set(ip, { n: 1, until: now + WINDOW_MS });
    if (HITS.size > 2000) HITS.clear();
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_ATTEMPTS;
}

/** Constant-time compare so the response time doesn't leak how much of a
 *  guess was right. */
function matches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const passcode = process.env.AVA_TEST_PASSCODE || '';
  const publicKey = process.env.VAPI_PUBLIC_KEY || '';
  const assistantId = process.env.VAPI_ASSISTANT_ID || '';

  if (!passcode || !publicKey || !assistantId) {
    return Response.json(
      { error: 'The Ava test page isn’t configured yet.' },
      { status: 503 },
    );
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) {
    return Response.json({ error: 'Too many attempts. Try again in a few minutes.' }, { status: 429 });
  }

  let body: { passcode?: unknown } = {};
  try { body = await req.json(); } catch { /* treated as empty */ }

  if (!matches(String(body.passcode ?? ''), passcode)) {
    return Response.json({ error: 'That passcode isn’t right.' }, { status: 401 });
  }

  return Response.json({ publicKey, assistantId }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
