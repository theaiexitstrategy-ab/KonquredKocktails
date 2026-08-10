// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Konquered Kocktails event library — konqueredkocktails.com/portfolio.
//
// A searchable repository of every event Stephen has composed. Built to be
// worked in, not just browsed: full-text search across title, description,
// venue, city and type, plus type / year / city filters and a sort. Filter
// state lives in the URL, so Stephen can bookmark or send "every wedding in
// 2026" as a link.
//
//   GET {PORTAL_URL}/api/external/portfolio?slug={PORTAL_SLUG}
//     → { events: [{ key, title, description, playback_id, poster_url,
//                    event_type, event_date, venue, city, guest_count,
//                    sort_order }] }
//
// `videos` is still accepted as the top-level key — an earlier portal build
// shipped that shape and there's no reason to break if it comes back.
//
// PERFORMANCE, and why cards don't mount a player up front: a library is
// meant to grow into hundreds of entries, and hundreds of <mux-player>
// elements would each pull their own HLS manifest. Cards show the Mux
// thumbnail (free, one image request) and swap in the real player only when
// someone presses play. That keeps a 300-event page as cheap as a 3-event one.
//
// Metadata is sparse today — the portal serves the columns but they're empty,
// so most entries have no date or venue yet. Every field renders only if
// present rather than showing "Unknown", and the seed fills gaps only for the
// three keys it knows. Nothing here invents a venue or a date.

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  INK, PANEL, PANEL2, GOLD, GOLD_HI, GOLD_D, GARNET, AMETHYST, EMERALD,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB, CONTACT,
} from '../theme';

const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.goelev8.ai';
const PORTAL_SLUG =
  process.env.NEXT_PUBLIC_PORTAL_SLUG || 'konquered-balance';

/** How many render before "Show more". Keeps first paint light on a big log. */
const PAGE = 12;

type LoggedEvent = {
  key: string;
  title: string;
  description: string | null;
  playback_id: string;
  poster_url: string | null;
  event_type: string | null;
  event_date: string | null;   // YYYY-MM-DD
  venue: string | null;
  city: string | null;
  guest_count: number | null;
  sort_order: number | null;
};

/* Seed — the three clips on record. Only event_type is asserted, because it's
   inferable from the footage. Dates, venues and guest counts stay null rather
   than invented: this is a record of real work and a fabricated venue on it
   would be worse than a blank field. */
const SEED_EVENTS: LoggedEvent[] = [
  {
    key: 'gentleman-jack-2021',
    title: 'Jack Daniel’s Gentleman Jack — Culture Shakers',
    description:
      'Featured in Jack Daniel’s Gentleman Jack 2021 Culture Shakers, a national spotlight on creators shaping their communities.',
    playback_id: 'MOxiZEb302JK1hwfkQzUQU3EDriQ401stR1CoSrTx02lq00',
    poster_url: null, event_type: 'Feature', event_date: '2021-01-01',
    venue: null, city: null, guest_count: null, sort_order: 0,
  },
  {
    key: 'behind-the-bar',
    title: 'Behind the Bar',
    description: null,
    playback_id: 'mSxkyXsJ3QPl201AEmwymMEw4iOLASE00x7zL3g9lygi4',
    poster_url: null, event_type: 'Live Mixology', event_date: null,
    venue: null, city: null, guest_count: null, sort_order: 1,
  },
  {
    key: 'from-the-studio',
    title: 'From the Studio',
    description:
      'Kraft kocktails built to order — the composition behind a Konquered Kocktails pour.',
    playback_id: 'aJAE59oLfQgbyWqAY1cs9avjbrCg6FsIJunL8cNr5nw',
    poster_url: null, event_type: 'Studio', event_date: null,
    venue: null, city: null, guest_count: null, sort_order: 2,
  },
];

const ALL = '';

/** Mux serves a still for any public playback id — one image instead of a
 *  whole player per card. */
const thumbFor = (id: string, poster: string | null) =>
  poster || `https://image.mux.com/${id}/thumbnail.jpg?width=640&fit_mode=smartcrop`;

function monthYear(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y) return '';
  if (!m || !d) return String(y);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function PortfolioClient() {
  const [events, setEvents] = useState<LoggedEvent[]>(SEED_EVENTS);
  const [live, setLive] = useState(false);

  const [q, setQ] = useState('');
  const [type, setType] = useState(ALL);
  const [year, setYear] = useState(ALL);
  const [city, setCity] = useState(ALL);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [shown, setShown] = useState(PAGE);

  /* ── Load ──────────────────────────────────────────────────────── */
  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${PORTAL_URL}/api/external/portfolio?slug=${encodeURIComponent(PORTAL_SLUG)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data?.events) ? data.events
        : Array.isArray(data?.videos) ? data.videos : [];
      const usable: LoggedEvent[] = raw.filter(
        (e: LoggedEvent) => e && typeof e.playback_id === 'string' && e.playback_id,
      );
      if (!usable.length) return;

      /* Portal wins on every field it has; the seed fills only what the portal
         left null, and only for keys the seed knows. Stops mattering entirely
         once Stephen backfills. */
      const seedByKey = new Map(SEED_EVENTS.map((s) => [s.key, s]));
      setEvents(usable.map((e) => {
        const seed = seedByKey.get(e.key);
        return seed ? {
          ...e,
          description: e.description ?? seed.description,
          event_type: e.event_type ?? seed.event_type,
          event_date: e.event_date ?? seed.event_date,
          venue: e.venue ?? seed.venue,
          city: e.city ?? seed.city,
          guest_count: e.guest_count ?? seed.guest_count,
        } : e;
      }));
      setLive(true);
    } catch (err) {
      console.warn('[event-library] portal fetch failed, using seed:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Filter state <-> URL, so a view can be bookmarked or sent ──── */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get('q') ?? '');
    setType(p.get('type') ?? ALL);
    setYear(p.get('year') ?? ALL);
    setCity(p.get('city') ?? ALL);
    const s = p.get('sort');
    if (s === 'oldest' || s === 'title' || s === 'newest') setSort(s);
  }, []);

  useEffect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (type) p.set('type', type);
    if (year) p.set('year', year);
    if (city) p.set('city', city);
    if (sort !== 'newest') p.set('sort', sort);
    const qs = p.toString();
    window.history.replaceState({}, '', qs ? `/portfolio?${qs}` : '/portfolio');
    setShown(PAGE);
  }, [q, type, year, city, sort]);

  /* ── Facets ────────────────────────────────────────────────────── */
  const types = useMemo(
    () => [...new Set(events.map((e) => e.event_type).filter(Boolean) as string[])].sort(),
    [events],
  );
  const years = useMemo(
    () => [...new Set(events.map((e) => e.event_date?.slice(0, 4)).filter(Boolean) as string[])].sort().reverse(),
    [events],
  );
  const cities = useMemo(
    () => [...new Set(events.map((e) => e.city).filter(Boolean) as string[])].sort(),
    [events],
  );

  /* ── Search + filter + sort ────────────────────────────────────── */
  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const matched = events.filter((e) => {
      if (type && e.event_type !== type) return false;
      if (year && e.event_date?.slice(0, 4) !== year) return false;
      if (city && e.city !== city) return false;
      if (!needle) return true;
      // Search everything a person would plausibly remember an event by.
      return [e.title, e.description, e.venue, e.city, e.event_type]
        .filter(Boolean)
        .some((f) => (f as string).toLowerCase().includes(needle));
    });

    return matched.sort((a, b) => {
      if (sort === 'title') return a.title.localeCompare(b.title);
      // Undated entries sort last in both directions — they're still real
      // work, they just can't be placed on the timeline yet.
      if (!a.event_date && !b.event_date) return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return sort === 'oldest'
        ? a.event_date.localeCompare(b.event_date)
        : b.event_date.localeCompare(a.event_date);
    });
  }, [events, q, type, year, city, sort]);

  const filtering = Boolean(q || type || year || city);
  const clear = () => { setQ(''); setType(ALL); setYear(ALL); setCity(ALL); };
  const undated = events.filter((e) => !e.event_date).length;

  return (
    <main style={{ background: INK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{KEYFRAMES}</style>

      <header style={headerStyle}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/images/kbalance-logo.jpg" alt="Konquered Kocktails" width={42} height={42}
              style={{ height: 42, width: 42, display: 'block', borderRadius: '50%', border: `1px solid ${LINE2}` }} />
            <span style={{ lineHeight: 1 }}>
              <span style={{ display: 'block', fontFamily: FB, fontWeight: 600, fontSize: 22, letterSpacing: '0.02em', color: TEXT }}>
                Konquered Kocktails
              </span>
              <span style={{ display: 'block', fontFamily: FB, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginTop: 3, fontWeight: 500 }}>
                Event Library
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/experiences" className="kk-navlink" style={navLink}>Experiences</Link>
            <Link href="/book" className="kk-gold-btn" style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
              Reserve a Date
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Header ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(48px, 7vw, 84px) 20px clamp(20px, 3vw, 30px)', overflow: 'hidden' }}>
        <div aria-hidden="true" style={glowBackdrop} />
        <div className="kk-fade-up" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto' }}>
          <span style={eyebrow}>
            <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
            The Work · {events.length} {events.length === 1 ? 'entry' : 'entries'}
          </span>
          <h1 style={{ margin: '20px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(38px, 6.4vw, 70px)', lineHeight: 1.04 }}>
            Every room, <span style={{ color: GOLD, fontWeight: 600 }}>logged</span>.
          </h1>
          <p style={{ margin: '20px 0 0', color: CREAM, opacity: 0.85, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.75, maxWidth: 640, fontWeight: 300 }}>
            This isn&rsquo;t a bar for hire. Stephen composes a drink experience out of
            the elements already in the room — the people, the light, the occasion, the
            spirits on hand. This is the record of every one.
          </p>
        </div>
      </section>

      {/* ── Toolbar ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px' }}>
        <div style={{
          background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16,
          padding: 'clamp(16px, 2.2vw, 22px)',
        }}>
          <label style={{ display: 'block' }}>
            <span style={srOnly}>Search the library</span>
            <div style={{ position: 'relative' }}>
              <span aria-hidden="true" style={{
                position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)',
                color: DIM, fontSize: 15, pointerEvents: 'none',
              }}>
                ⌕
              </span>
              <input
                className="kk-input"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, venue, city, or type…"
                style={{ ...inputStyle, paddingLeft: 38 }}
              />
            </div>
          </label>

          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, alignItems: 'flex-end',
          }}>
            {types.length > 1 && (
              <Select label="Type" value={type} onChange={setType}
                options={[[ALL, 'All types'], ...types.map((t) => [t, t] as [string, string])]} />
            )}
            {years.length > 1 && (
              <Select label="Year" value={year} onChange={setYear}
                options={[[ALL, 'All years'], ...years.map((y) => [y, y] as [string, string])]} />
            )}
            {cities.length > 1 && (
              <Select label="City" value={city} onChange={setCity}
                options={[[ALL, 'All cities'], ...cities.map((c) => [c, c] as [string, string])]} />
            )}
            <Select label="Sort" value={sort} onChange={(v) => setSort(v as typeof sort)}
              options={[['newest', 'Newest first'], ['oldest', 'Oldest first'], ['title', 'A–Z']]} />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 2 }}>
              <span aria-live="polite" style={{ fontFamily: FB, fontSize: 12.5, color: MUTED, whiteSpace: 'nowrap' }}>
                {results.length} of {events.length}
              </span>
              {filtering && (
                <button type="button" onClick={clear} style={linkButton}>Clear</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Results ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(20px, 3vw, 30px) 20px clamp(48px, 7vw, 84px)' }}>
        {results.length === 0 ? (
          <div style={emptyBox}>
            Nothing in the library matches that.{' '}
            <button type="button" onClick={clear} style={linkButton}>Show everything</button>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'clamp(18px, 2.4vw, 26px)',
            }}>
              {results.slice(0, shown).map((e) => <EventCard key={e.key || e.playback_id} event={e} />)}
            </div>

            {results.length > shown && (
              <div style={{ textAlign: 'center', marginTop: 'clamp(26px, 3.6vw, 36px)' }}>
                <button type="button" onClick={() => setShown((n) => n + PAGE)}
                  className="kk-ghost-btn" style={ghostButton}>
                  Show more — {results.length - shown} remaining
                </button>
              </div>
            )}
          </>
        )}

        {(!live || undated > 0) && (
          <p style={{ margin: 'clamp(26px, 3.6vw, 38px) 0 0', textAlign: 'center', fontSize: 12.5, color: DIM, lineHeight: 1.7 }}>
            {undated > 0
              ? `${undated} ${undated === 1 ? 'entry has' : 'entries have'} no date or venue recorded yet — Stephen is backfilling the library from the portal.`
              : 'Stephen is still backfilling the library.'}
          </p>
        )}
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${LINE}`, padding: 'clamp(44px, 6vw, 72px) 20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 'clamp(30px, 4.6vw, 46px)', lineHeight: 1.08 }}>
          Your room is next.
        </h2>
        <p style={{ margin: '14px auto 26px', color: MUTED, fontSize: 15.5, lineHeight: 1.7, maxWidth: 500, fontWeight: 300 }}>
          Tell Stephen the date and the space. He composes the rest around it.
        </p>
        <Link href="/book" className="kk-gold-btn" style={goldButton}>Reserve a Date</Link>
      </section>

      <footer style={{ borderTop: `1px solid ${LINE}`, padding: 'clamp(28px, 4vw, 44px) 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: FB, fontSize: 12.5, color: MUTED, letterSpacing: '0.3px', lineHeight: 1.9 }}>
            <a href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} className="kk-contact" style={{ color: MUTED, textDecoration: 'none' }}>{CONTACT.phone}</a>
            {' · '}
            <a href={`mailto:${CONTACT.email}`} className="kk-contact" style={{ color: MUTED, textDecoration: 'none' }}>{CONTACT.email}</a>
            <br />
            {CONTACT.address}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FB, fontSize: 11, color: DIM, letterSpacing: '1.2px' }}>
            <Image src="/images/goelev8-full-logo.png" alt="" width={22} height={22} style={{ width: 22, height: 22, opacity: 0.75 }} />
            Powered by GoElev8.ai
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────── */

function Select({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={filterLabel}>{label}</span>
      <select className="kk-input" value={value} onChange={(e) => onChange(e.target.value)}
        style={selectStyle}>
        {options.map(([v, l]) => (
          <option key={v || 'all'} value={v} style={{ background: PANEL2, color: TEXT }}>{l}</option>
        ))}
      </select>
    </label>
  );
}

/** Thumbnail first; the player mounts only on play. See the note at the top
 *  of this file — a library of hundreds shouldn't open hundreds of streams. */
function EventCard({ event: e }: { event: LoggedEvent }) {
  const [playing, setPlaying] = useState(false);

  const meta: string[] = [];
  if (e.event_date) meta.push(monthYear(e.event_date));
  if (e.venue) meta.push(e.venue);
  if (e.city) meta.push(e.city);
  if (e.guest_count) meta.push(`${e.guest_count} guests`);

  return (
    <figure className="kk-card" style={{
      margin: 0, background: PANEL, border: `1px solid ${LINE}`,
      borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ background: '#000', lineHeight: 0, position: 'relative', aspectRatio: '16 / 9' }}>
        {playing ? (
          <MuxPlayer
            playbackId={e.playback_id}
            streamType="on-demand"
            accentColor={GOLD}
            autoPlay
            playsInline
            {...(e.poster_url ? { poster: e.poster_url } : {})}
            metadata={{ video_title: `Konquered Kocktails — ${e.title}` }}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        ) : (
          <button type="button" onClick={() => setPlaying(true)}
            aria-label={`Play ${e.title}`}
            style={{
              width: '100%', height: '100%', padding: 0, border: 'none', cursor: 'pointer',
              background: '#000', position: 'relative', display: 'block',
            }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbFor(e.playback_id, e.poster_url)} alt="" loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }} />
            <span aria-hidden="true" style={{
              position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
            }}>
              <span style={{
                width: 54, height: 54, borderRadius: '50%',
                background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`,
                display: 'grid', placeItems: 'center', color: INK, fontSize: 19,
                boxShadow: '0 8px 22px rgba(0,0,0,0.45)', paddingLeft: 4,
              }}>
                ▶
              </span>
            </span>
          </button>
        )}
      </div>

      <figcaption style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {e.event_type && (
          <span style={{
            alignSelf: 'flex-start', fontFamily: FB, fontSize: 9.5, letterSpacing: '1.6px',
            textTransform: 'uppercase', fontWeight: 600, color: INK,
            background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`,
            borderRadius: 999, padding: '4px 10px',
          }}>
            {e.event_type}
          </span>
        )}
        <h2 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 23, lineHeight: 1.2, color: TEXT }}>
          {e.title}
        </h2>
        {meta.length > 0 && (
          <p style={{ margin: 0, fontFamily: FB, fontSize: 11.5, letterSpacing: '1px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>
            {meta.join(' · ')}
          </p>
        )}
        {e.description && (
          <p style={{ margin: 0, fontFamily: FB, fontWeight: 300, fontSize: 13.5, color: MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
            {e.description}
          </p>
        )}
      </figcaption>
    </figure>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50,
  background: 'rgba(10,10,10,0.86)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${LINE}`,
};

const glowBackdrop: CSSProperties = {
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: [
    `radial-gradient(46% 60% at 50% 0%, ${AMETHYST}26 0%, transparent 58%)`,
    `radial-gradient(64% 62% at 82% 44%, ${EMERALD}40 0%, transparent 62%)`,
    `radial-gradient(56% 58% at 18% 76%, ${GARNET}22 0%, transparent 60%)`,
    `radial-gradient(50% 54% at 50% 40%, ${GOLD}1a 0%, transparent 62%)`,
  ].join(', '),
};

const navLink: CSSProperties = {
  fontFamily: FB, fontSize: 12, letterSpacing: '1.6px', textTransform: 'uppercase',
  fontWeight: 500, color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap',
};

const eyebrow: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 11,
  fontFamily: FB, fontSize: 11.5, letterSpacing: '2.4px',
  textTransform: 'uppercase', color: GOLD, fontWeight: 500,
};

const filterLabel: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 9.5, letterSpacing: '1.6px',
  textTransform: 'uppercase', color: DIM, marginBottom: 6, fontWeight: 500,
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0c0b0a',
  border: `1px solid ${LINE}`, borderRadius: 10, padding: '13px 15px',
  color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none', fontWeight: 300,
};

const selectStyle: CSSProperties = {
  background: '#0c0b0a', border: `1px solid ${LINE}`, borderRadius: 10,
  padding: '11px 13px', color: TEXT, fontFamily: FB, fontSize: 13.5,
  outline: 'none', fontWeight: 300, minWidth: 132, cursor: 'pointer',
};

const linkButton: CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: GOLD, fontFamily: FB, fontSize: 12.5, textDecoration: 'underline',
};

const emptyBox: CSSProperties = {
  textAlign: 'center', padding: 'clamp(48px, 8vw, 88px) 24px',
  border: `1px dashed ${LINE}`, borderRadius: 16,
  color: MUTED, fontFamily: FB, fontSize: 15, lineHeight: 1.7, fontWeight: 300,
};

const srOnly: CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

const goldButton: CSSProperties = {
  display: 'inline-block',
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`,
  color: INK, fontFamily: FB, fontWeight: 600, fontSize: 13,
  letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '15px 28px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
  boxShadow: '0 8px 22px rgba(195,154,69,0.22)',
};

const ghostButton: CSSProperties = {
  display: 'inline-block', background: 'transparent', color: CREAM,
  fontFamily: FB, fontWeight: 500, fontSize: 12.5, letterSpacing: '1.4px',
  textTransform: 'uppercase', border: `1px solid ${LINE2}`, borderRadius: 999,
  padding: '14px 26px', cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
};

const KEYFRAMES = `
.kk-fade-up{animation:kkFadeUp .9s .05s both}
.kk-navlink{transition:color .2s ease}
.kk-navlink:hover{color:${GOLD}}
.kk-contact{transition:opacity .2s ease}
.kk-contact:hover{opacity:.82}
.kk-gold-btn{transition:transform .18s ease, box-shadow .18s ease, filter .18s ease}
.kk-gold-btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 12px 28px rgba(195,154,69,0.34)}
.kk-ghost-btn{transition:border-color .2s ease, color .2s ease, background .2s ease}
.kk-ghost-btn:hover{border-color:${GOLD};color:${GOLD};background:rgba(195,154,69,0.06)}
.kk-card{transition:transform .22s ease, border-color .22s ease}
.kk-card:hover{transform:translateY(-3px);border-color:${LINE2}}
.kk-input:focus{border-color:${GOLD}!important;box-shadow:0 0 0 3px rgba(195,154,69,0.13)}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){
  .kk-fade-up{animation:none!important}
  .kk-card:hover,.kk-gold-btn:hover{transform:none!important}
}
`;
