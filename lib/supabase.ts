// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-only Supabase access for /reviews. Thin REST wrapper — no SDK, since
// two calls don't justify the dependency.
//
// WHY THE KEY IS NOT PUBLIC, even though anon keys normally are:
// this Supabase project is the GoElev8 portal's, shared across every tenant
// (Konquered Balance, Flex Facility, iSlay, WillPower, Locs, Hush…). Its anon
// key is therefore a key to *all* of them, and it is only as safe as the
// weakest RLS policy in the project. At the time of writing at least one
// table (public.sms_credits) has RLS disabled entirely, so anything holding
// the anon key can read and write it.
//
// Publishing that key in a marketing site's client bundle would hand it to
// anyone who views source. So the key stays server-side and the browser talks
// only to our own /api/reviews. If the project's RLS is ever fully cleaned
// up, moving to a browser-side client is a small change — but it should be a
// deliberate one, not the default.
//
// The reviews table's own policies are tight regardless: anon may INSERT only
// with published = false, and may SELECT only published = true.

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://bnkoqybkmwtrlorhowyv.supabase.co';

/** Server-side only. Never prefix with NEXT_PUBLIC_. */
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

/** Konquered Balance's `clients.id`. The reviews table is tenant-scoped; this
 *  is the tenant every review from this site belongs to. Overridable so a
 *  staging project with different ids works without a code change. */
export const CLIENT_ID =
  process.env.SUPABASE_CLIENT_ID || '87a43aae-98df-44b4-a550-70da22154654';

export const STORAGE_BUCKET = 'event-photos';

export const isSupabaseConfigured = () => Boolean(SUPABASE_ANON_KEY);

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  };
}

export type SbResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string };

/** PostgREST call against a table in the public schema. */
export async function sb<T>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: unknown; prefer?: string } = { method: 'GET' },
): Promise<SbResult<T>> {
  if (!SUPABASE_ANON_KEY) {
    return { ok: false, status: 503, error: 'Reviews aren’t connected yet.' };
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method: init.method,
      headers: headers({
        'Content-Type': 'application/json',
        ...(init.prefer ? { Prefer: init.prefer } : {}),
      }),
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
      cache: 'no-store',
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      console.error('[supabase]', path, res.status, data);
      return {
        ok: false,
        status: res.status,
        // PostgREST messages name columns and constraints — useful in logs,
        // but not something to show a guest verbatim.
        error: 'Could not save your review. Please try again.',
      };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    console.error('[supabase]', path, err);
    return { ok: false, status: 502, error: 'Could not reach the review service.' };
  }
}

/** Upload one image to the event-photos bucket. Returns its public URL. */
export async function uploadPhoto(
  objectPath: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string | null> {
  if (!SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${objectPath}`,
      {
        method: 'POST',
        headers: headers({ 'Content-Type': contentType, 'x-upsert': 'false' }),
        body: bytes,
        cache: 'no-store',
      },
    );
    if (!res.ok) {
      console.error('[supabase/storage]', objectPath, res.status, await res.text());
      return null;
    }
    return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${objectPath}`;
  } catch (err) {
    console.error('[supabase/storage]', objectPath, err);
    return null;
  }
}
