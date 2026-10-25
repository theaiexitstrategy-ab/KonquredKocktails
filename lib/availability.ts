// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-only. Real availability from the portal (weekly rules − blackout
// blocks − existing bookings), shared by the /book calendar
// (/api/book/availability) and Ava's check_availability tool
// (/api/ava/availability), so the two can never disagree about a date.

import { callPortal, type PortalResult } from '@/lib/portal';

export type Slot = { starts_at: string; duration_min: number };
export type Availability = { tz: string; days: { date: string; slots: Slot[] }[] };

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
export function keepOnlyConsistentSlots(data: Availability): { data: Availability; dropped: number } {
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

/** Portal availability with inconsistent slots already dropped. */
export async function fetchAvailability(from: string, to: string, experienceKey = ''): Promise<PortalResult<Availability>> {
  const result = await callPortal<Availability>('experience-availability', {
    method: 'GET',
    query: { from, to, ...(experienceKey ? { experience_key: experienceKey } : {}) },
  });
  if (!result.ok) return result;
  const { data, dropped } = keepOnlyConsistentSlots(result.data);
  if (dropped) {
    console.error(
      `[availability] dropped ${dropped} slot(s) whose UTC offset contradicts tz=${result.data.tz}. ` +
      'Portal isoInTz() sign bug — see keepOnlyConsistentSlots.',
    );
  }
  return { ok: true, data };
}
