// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// GET /api/book/availability?from=YYYY-MM-DD&to=YYYY-MM-DD&experience_key=…
//
// Server-side proxy to the portal's /api/external/experience-availability.
// Exists because that endpoint needs the secret tenant write key — see
// lib/portal.ts. Real availability = weekly rules − blackout blocks −
// existing bookings, so unlike the old hardcoded slot list it cannot
// double-book.
//
// Returns { tz, days: [{ date, slots: [{ starts_at, duration_min }] }] }.

import { callPortal } from '@/lib/portal';

export const dynamic = 'force-dynamic';

type Availability = {
  tz: string;
  days: { date: string; slots: { starts_at: string; duration_min: number }[] }[];
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  const experienceKey = url.searchParams.get('experience_key') || '';

  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return Response.json({ error: 'from and to must be YYYY-MM-DD' }, { status: 400 });
  }

  const result = await callPortal<Availability>('experience-availability', {
    method: 'GET',
    query: { from, to, ...(experienceKey ? { experience_key: experienceKey } : {}) },
  });

  if (!result.ok) {
    // 402 = no write key yet (pre-launch). The page shows demo dates and a
    // clear "not connected" note rather than an empty calendar.
    return Response.json(
      { error: result.error, ...(result.demo ? { demo: true } : {}) },
      { status: result.status },
    );
  }
  return Response.json(result.data);
}
