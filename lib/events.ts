// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Upcoming public events for the homepage's "Upcoming Experiences" section.
//
// Stephen posts these in the portal (Bookings → Events). They are LISTINGS —
// someone else's event he's pouring at, ticketed on an outside site (Posh,
// Eventbrite…) — not seats this site or the portal sells. Source table is
// public.kk_events (portal migration 0050), read server-side with the shared
// anon key; RLS lets anon see published rows only. Read-only: nothing here
// ever writes to it.
//
// Any failure returns [] and the section renders nothing at all, heading
// included — no "nothing scheduled" placeholder.

import { sb, CLIENT_ID, isSupabaseConfigured, publicPhotoUrl } from './supabase';
import { chicagoDate, type KkEvent } from './event-format';

export type { KkEvent };

/** Fallback freshness, in seconds (see EVENTS_TAG). */
export const EVENTS_REVALIDATE_SECONDS = 300;

/** Cache tag on the events read; the portal pings /api/revalidate with it
 *  after every event save or delete, so the 300s above is only a fallback. */
export const EVENTS_TAG = 'kk-events';
const MAX_EVENTS = 6;

type EventRow = {
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
  image_path: string | null;
  sort_order: number;
};

const COLUMNS =
  'id,title,host_name,starts_at,ends_at,time_tbd,venue_name,venue_address,' +
  'description,ticket_url,ticket_label,price_label,image_path,sort_order';

/**
 * Still worth listing? With an end time, until it ends. Without one, through
 * the end of its day in Central — an event shouldn't vanish the minute it
 * starts, and a time_tbd row's starts_at is only a placeholder hour.
 */
function isUpcoming(e: EventRow, now: Date): boolean {
  if (e.ends_at) return new Date(e.ends_at) >= now;
  return chicagoDate(e.starts_at) >= chicagoDate(now);
}

export async function getUpcomingEvents(): Promise<KkEvent[]> {
  if (!isSupabaseConfigured()) return [];

  // Coarse bound in the query (yesterday, Central), exact rule in isUpcoming.
  // The bound only changes once a day, so the URL — and the cache entry —
  // stays stable between regenerations.
  const yesterday = chicagoDate(new Date(Date.now() - 24 * 3600 * 1000));
  const result = await sb<EventRow[]>(
    `kk_events?select=${COLUMNS}` +
      `&client_id=eq.${CLIENT_ID}` +
      `&published=is.true` +
      `&or=(starts_at.gte.${yesterday},ends_at.gte.${yesterday})` +
      `&order=starts_at.asc,sort_order.asc&limit=30`,
    { method: 'GET', revalidate: EVENTS_REVALIDATE_SECONDS, tags: [EVENTS_TAG] },
  );
  if (!result.ok || !Array.isArray(result.data)) return [];

  const now = new Date();
  return result.data
    .filter((e) => isUpcoming(e, now))
    .slice(0, MAX_EVENTS)
    .map(({ image_path, sort_order: _sort, ...e }) => ({
      ...e,
      // Only ever a path inside the event-photos bucket (the portal enforces it).
      image_url: image_path ? publicPhotoUrl(image_path) : null,
    }));
}

/** schema.org/Event JSON-LD for each listed event. */
export function eventsJsonLd(events: KkEvent[]) {
  return events.map((e) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    // Time unconfirmed → date only, so search results don't show a made-up hour.
    startDate: e.time_tbd ? chicagoDate(e.starts_at) : e.starts_at,
    ...(e.ends_at && !e.time_tbd ? { endDate: e.ends_at } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(e.venue_name || e.venue_address
      ? {
          location: {
            '@type': 'Place',
            ...(e.venue_name ? { name: e.venue_name } : {}),
            ...(e.venue_address ? { address: e.venue_address } : {}),
          },
        }
      : {}),
    ...(e.ticket_url ? { url: e.ticket_url } : {}),
    organizer: { '@type': 'Organization', name: e.host_name?.trim() || 'Konquered Kocktails' },
    ...(e.image_url ? { image: e.image_url } : {}),
    ...(e.description ? { description: e.description } : {}),
  }));
}
