// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/book/lead
//
// Server-side proxy to the portal's /api/external/experience-leads. Called at
// STEP 1 of the booking flow — BEFORE the guest picks a date or pays — so an
// abandoned enquiry is still captured. The old homepage funnel persisted
// nothing until Stripe, which meant every guest who didn't pay vanished.
//
// Returns { ok, lead_id, booking_id }; the booking_id is carried forward to
// the deposit step so the portal promotes one row instead of creating two.

import { callPortal } from '@/lib/portal';

export const dynamic = 'force-dynamic';

type LeadResult = { ok: boolean; lead_id: string; booking_id: string };

/** Trim and cap a free-text field before forwarding. */
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

  const name = field(body.name, 120);
  const email = field(body.email, 200);
  const phone = field(body.phone, 40);

  // Mirror the portal's own validation so an obviously-bad payload fails here
  // rather than burning a round trip.
  if (!name) return Response.json({ error: 'Please enter your full name.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return Response.json({ error: 'Please enter a valid mobile number.' }, { status: 400 });
  }

  const result = await callPortal<LeadResult>('experience-leads', {
    method: 'POST',
    body: {
      name,
      email,
      phone,
      goal: field(body.goal),
      experience_key: field(body.experience_key, 60),
      experience_display: field(body.experience_display),
      guest_count: Number(body.guest_count) || undefined,
      source: 'kk-book',
      source_url: field(body.source_url, 300),
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
