// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-only helper for the portal's /api/external/experience-* endpoints.
//
// WHY THIS EXISTS: those endpoints authenticate with a tenant write key sent
// as `x-portal-write-key`. The portal stores only sha256(key), and the key
// grants write access to this tenant's leads and bookings — so it must never
// reach the browser. Every /book call therefore goes:
//
//   browser → our /api/book/* route (server) → portal /api/external/*
//
// The merch storefront needs no equivalent: /api/external/products and
// /api/external/checkout are deliberately public with open CORS, so the
// browser calls those directly.

const PORTAL_URL =
  process.env.PORTAL_URL ||
  process.env.NEXT_PUBLIC_PORTAL_URL ||
  'https://portal.goelev8.ai';

/** Secret. Server-side only — never prefix this with NEXT_PUBLIC_. */
const WRITE_KEY = process.env.KK_PORTAL_WRITE_KEY || '';

export const PORTAL_SLUG =
  process.env.NEXT_PUBLIC_PORTAL_SLUG || 'konquered-kocktails';

/** Deposit amount, in cents. The portal re-validates this against the
 *  tenant's own config, so this is a request, not an authority. */
export const DEPOSIT_CENTS = 20000;

export const isPortalConfigured = () => Boolean(WRITE_KEY);

export type PortalResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; demo?: boolean };

/**
 * Call a portal experience-* endpoint with the tenant write key.
 *
 * Returns `demo: true` with status 402 when no write key is configured. That
 * is the pre-launch state, not a crash: the portal has no Konquered
 * Kocktails tenant yet, so there is no key to hold. /book surfaces it as
 * "Demo mode — no live charge", exactly as the old deposit route did.
 * Deliberately NOT a fallback that pretends to book something.
 */
export async function callPortal<T>(
  path: string,
  init: { method: 'GET' | 'POST'; query?: Record<string, string>; body?: unknown },
): Promise<PortalResult<T>> {
  if (!WRITE_KEY) {
    return {
      ok: false,
      status: 402,
      demo: true,
      error:
        'Booking isn’t connected yet — the Konquered Kocktails portal tenant still needs to be set up.',
    };
  }

  const url = new URL(`/api/external/${path}`, PORTAL_URL);
  for (const [k, v] of Object.entries(init.query ?? {})) {
    if (v != null && v !== '') url.searchParams.set(k, v);
  }

  try {
    const res = await fetch(url, {
      method: init.method,
      headers: {
        'x-portal-write-key': WRITE_KEY,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(init.body ? { body: JSON.stringify(init.body) } : {}),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        // Portal errors are operator-facing strings; pass them through so a
        // misconfiguration is diagnosable instead of a generic failure.
        error: data?.message || data?.error || `Portal returned ${res.status}`,
      };
    }
    return { ok: true, data: data as T };
  } catch (err) {
    console.error('[portal]', path, err);
    return { ok: false, status: 502, error: 'Could not reach the booking service.' };
  }
}
