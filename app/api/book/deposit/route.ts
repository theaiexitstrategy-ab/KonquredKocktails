// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/book/deposit
//
// Server-side proxy to the portal's /api/external/experience-deposit, which
// creates the Stripe Checkout Session for the $200 deposit and returns a
// checkout_url. The portal owns Stripe end to end — this site never holds a
// Stripe key and never touches the SDK.
//
// This replaces the old /api/checkout/kbsetup, which built its own Checkout
// Session from a Stripe key held in this repo. Two independent deposit paths
// with two different notions of what's available is how you double-book a
// wedding, so there is now exactly one.
//
// MONEY-SAFETY RULE, unchanged and enforced portal-side: if Stephen's Stripe
// account isn't connected the portal returns 402 rather than falling back to
// a platform charge. The page promises the guest their deposit goes to
// Konquered Balance; routing it into goElev8's balance would break a promise
// made in writing. A 402 that surfaces as "Demo mode — no live charge" is the
// correct failure.

import { callPortal, DEPOSIT_CENTS } from '@/lib/portal';

export const dynamic = 'force-dynamic';

type DepositResult = { checkout_url: string; booking_id: string };

function field(value: unknown, max = 200): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const startsAt = field(body.event_starts_at, 40);
  if (!startsAt) {
    return Response.json({ error: 'Please choose a date and time.' }, { status: 400 });
  }

  const origin = new URL(req.url).origin;

  const result = await callPortal<DepositResult>('experience-deposit', {
    method: 'POST',
    body: {
      ...(field(body.booking_id, 40) ? { booking_id: field(body.booking_id, 40) } : {}),
      ...(field(body.lead_id, 40) ? { lead_id: field(body.lead_id, 40) } : {}),
      name: field(body.name, 120),
      email: field(body.email, 200),
      phone: field(body.phone, 40),
      experience_key: field(body.experience_key, 60),
      experience_display: field(body.experience_display),
      // Machine-readable instant with offset — the portal stores UTC and
      // renders back in the tenant's tz. when_display is only for humans
      // (Stripe line item, confirmation email).
      event_starts_at: startsAt,
      event_tz: field(body.event_tz, 60) || 'America/Chicago',
      when_display: field(body.when_display, 120),
      duration_min: Number(body.duration_min) || undefined,
      guest_count: Number(body.guest_count) || undefined,
      deposit_cents: DEPOSIT_CENTS,
      success_url: `${origin}/book?booked=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/book`,
    },
  });

  if (!result.ok) {
    return Response.json(
      { error: result.error, ...(result.demo ? { demo: true } : {}) },
      { status: result.status },
    );
  }
  return Response.json(result.data);
}
