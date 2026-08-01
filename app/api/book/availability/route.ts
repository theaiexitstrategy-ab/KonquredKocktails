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

type Slot = { starts_at: string; duration_min: number };
type Availability = { tz: string; days: { date: string; slots: Slot[] }[] };

/** True UTC offset, in minutes east of UTC, for an instant in an IANA zone.
 *  America/Chicago in August is -300. */
function trueOffsetMinutes(instant: Date, tz: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(instant);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    const asUtc = Date.UTC(
      get('year'), get('month') - 1, get('day'),
      get('hour') % 24, get('minute'), get('second'),
    );
    return (asUtc - instant.getTime()) / 60000;
  } catch {
    return null;
  }
}

/**
 * Reject slots whose stamped UTC offset disagrees with the timezone the
 * response itself declares.
 *
 * Guarding here because the portal's isoInTz() inverts its sign convention:
 * a 09:00 America/Chicago rule comes back as `2026-08-05T04:00:00+05:00`,
 * which is actually 6:00 PM the PREVIOUS day in Chicago. Showing a guest a
 * time that isn't the one they'd get is worse than showing none.
 *
 * Deliberately a validation, not a correction. Silently re-deriving the
 * "intended" time would guess at the portal's intent and would then be wrong
 * a second time the moment the portal is fixed. This check simply stops
 * passing once the offsets agree, and needs no follow-up removal.
 */
function keepOnlyConsistentSlots(data: Availability): { data: Availability; dropped: number } {
  let dropped = 0;
  const days = data.days.map((day) => {
    const slots = day.slots.filter((s) => {
      const m = /([+-])(\d{2}):(\d{2})$/.exec(s.starts_at);
      if (!m) return true; // 'Z' or offset-less — nothing to contradict
      const stamped = (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
      const instant = new Date(s.starts_at);
      if (Number.isNaN(instant.getTime())) { dropped++; return false; }
      const actual = trueOffsetMinutes(instant, data.tz);
      if (actual === null) return true;
      if (stamped !== actual) { dropped++; return false; }
      return true;
    });
    return { ...day, slots };
  });
  return { data: { ...data, days }, dropped };
}

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
  const { data, dropped } = keepOnlyConsistentSlots(result.data);
  if (dropped) {
    console.error(
      `[book/availability] dropped ${dropped} slot(s) whose UTC offset contradicts tz=${result.data.tz}. ` +
      'Portal isoInTz() sign bug — see the guard in this file.',
    );
  }
  return Response.json(data);
}
