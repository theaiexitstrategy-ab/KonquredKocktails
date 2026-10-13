// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Pure helpers for kk_events, safe on both server and client. Kept apart from
// lib/events.ts so the browser bundle never pulls in lib/supabase.ts.
//
// Every date and time is shown on the Central calendar regardless of the
// visitor's own zone — the events are in St. Louis. Intl with a fixed zone
// formats identically on the server and in the browser, so no hydration drift.

export const EVENT_TZ = 'America/Chicago';

/** What the homepage renders for one upcoming event. */
export type KkEvent = {
  id: string;
  title: string;
  host_name: string | null;
  starts_at: string;
  ends_at: string | null;
  time_tbd: boolean;
  venue_name: string | null;
  venue_address: string | null;
  description: string | null;
  ticket_url: string | null;
  ticket_label: string | null;
  price_label: string | null;
  image_url: string | null;
};

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('en-US', { timeZone: EVENT_TZ, ...opts });

/** YYYY-MM-DD for an instant, on the Central calendar. */
export function chicagoDate(d: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: EVENT_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(d));
}

/** { weekday: 'Fri', month: 'Oct', day: '16' } */
export function dateParts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: fmt({ weekday: 'short' }).format(d),
    month: fmt({ month: 'short' }).format(d),
    day: fmt({ day: 'numeric' }).format(d),
    long: fmt({ weekday: 'long', month: 'long', day: 'numeric' }).format(d),
  };
}

/** "7:00 PM", "7:00 PM – 10:00 PM", or "Time to be announced". */
export function timeLabel(e: Pick<KkEvent, 'starts_at' | 'ends_at' | 'time_tbd'>): string {
  if (e.time_tbd) return 'Time to be announced';
  const t = fmt({ hour: 'numeric', minute: '2-digit' });
  const start = t.format(new Date(e.starts_at));
  return e.ends_at ? `${start} – ${t.format(new Date(e.ends_at))}` : start;
}

/** "Presented by …" only when someone other than Konquered is hosting. */
export function presenter(e: Pick<KkEvent, 'host_name'>): string | null {
  const host = e.host_name?.trim();
  return host && !/konquered/i.test(host) ? host : null;
}
