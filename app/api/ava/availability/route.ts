// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/ava/availability — Vapi tool webhook for Ava's check_availability.
//
// Ava manages Stephen's calendar: when a guest names a date (or asks what is
// open), she checks the portal's REAL availability — the same source the
// /book calendar uses (lib/availability.ts) — and gets back the open dates
// with a link that opens /book on that date with the experience preselected,
// where the guest secures it with the $200 deposit. In chat she shares the
// link; on a call she sends them to Reserve a Date on the website.
//
// The result also states today's date in Central time, because Ava's prompt
// has no clock and guests say "the second Saturday in December".

import { fetchAvailability, type Slot } from '@/lib/availability';
import { experienceBySlug } from '@/data/experiences';
import { clean, handleToolWebhook, parseArgs, type ToolContext } from '@/lib/ava-webhook';

export const dynamic = 'force-dynamic';

const TZ = 'America/Chicago';
const SITE = 'https://konqueredkocktails.com';
/** The portal caps a request at 60 days. */
const MAX_RANGE_DAYS = 60;
const MAX_DATES_LISTED = 6;

type AvailabilityArgs = { preferred_date?: string; from_date?: string; to_date?: string; interested_experience?: string };

const isYmd = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/** Today's date as YYYY-MM-DD in Central time. */
function todayYmd(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const dayLabel = (ymd: string) =>
  new Date(`${ymd}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

const timeLabel = (s: Slot) =>
  new Date(s.starts_at).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });

async function checkAvailability(args: AvailabilityArgs, { channel }: ToolContext): Promise<string> {
  const today = todayYmd();
  const experience = args.interested_experience ? experienceBySlug(clean(args.interested_experience, 60)) : undefined;
  const preferred = isYmd(args.preferred_date) && args.preferred_date > today ? args.preferred_date : '';

  // Look around the guest's date if they have one, otherwise from tomorrow.
  let from = isYmd(args.from_date) && args.from_date > today ? args.from_date : addDays(today, 1);
  if (preferred && !isYmd(args.from_date)) from = addDays(preferred, -7) > today ? addDays(preferred, -7) : addDays(today, 1);
  let to = isYmd(args.to_date) && args.to_date > from ? args.to_date : addDays(from, 45);
  if (preferred && to < preferred) to = addDays(preferred, 14);
  if (to > addDays(from, MAX_RANGE_DAYS - 1)) to = addDays(from, MAX_RANGE_DAYS - 1);

  const header = `Today is ${dayLabel(today)} (Central time).`;
  const result = await fetchAvailability(from, to, experience?.slug ?? '');
  if (!result.ok) {
    console.error('[ava-availability] portal', result.status, result.error);
    return `${header} The live calendar could not be checked just now. Do not promise or rule out any date. `
      + 'Take their preferred date with capture_lead and tell them Stephen will confirm it personally.';
  }

  const open = result.data.days.filter((d) => d.slots?.length);
  const link = (date: string) => {
    const q = new URLSearchParams({ ...(experience ? { experience: experience.slug } : {}), date });
    return `${SITE}/book?${q.toString()}`;
  };
  const describe = (d: { date: string; slots: Slot[] }) =>
    `${dayLabel(d.date)} (${d.slots.map(timeLabel).join(', ')})${channel === 'chat' ? ` — ${link(d.date)}` : ''}`;

  const lines = [header];
  if (experience) lines.push(`Checked for: ${experience.title}.`);
  if (preferred) {
    const hit = open.find((d) => d.date === preferred);
    lines.push(hit
      ? `The guest's date IS open: ${describe(hit)}.`
      : `The guest's date (${dayLabel(preferred)}) is NOT open. Offer the nearest open dates below instead.`);
  }
  if (open.length) {
    const nearest = preferred
      ? [...open].sort((a, b) => Math.abs(Date.parse(a.date) - Date.parse(preferred)) - Math.abs(Date.parse(b.date) - Date.parse(preferred)))
      : open;
    const listed = nearest.filter((d) => d.date !== preferred).slice(0, MAX_DATES_LISTED)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (listed.length) lines.push(`Open dates between ${dayLabel(from)} and ${dayLabel(to)}:`, ...listed.map((d) => `- ${describe(d)}`));
  } else {
    lines.push(`No open dates between ${dayLabel(from)} and ${dayLabel(to)}. Offer to check a later window, or capture their details so Stephen can find a date personally.`);
  }
  lines.push(channel === 'chat'
    ? 'To hold a date, the guest secures it with the $200 deposit through that date\'s link. Share only the link for the date they choose, as a plain URL. Never claim a date is held until they have paid through the link.'
    : 'On this call you cannot send links. To hold a date, the guest secures it with the $200 deposit at konqueredkocktails.com — tap Reserve a Date. Never claim a date is held until they have done that.');
  return lines.join('\n');
}

export async function POST(req: Request) {
  return handleToolWebhook(req, {
    check_availability: (call, ctx) => checkAvailability(parseArgs<AvailabilityArgs>(call), ctx),
  });
}
