// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Konquered Kocktails event log — konqueredkocktails.com/portfolio.
//
// A running repository of every event Stephen has done, newest first, with
// filters. Not a highlight reel and not a bartending CV: each entry is a room
// he composed in, logged so the body of work reads as one practice.
//
// Portal-driven — Stephen adds an entry (video + description + the metadata
// the filters run on) from the portal Portfolio tab, no redeploy:
//
//   GET {PORTAL_URL}/api/external/portfolio?slug={PORTAL_SLUG}
//     → { events: [{ key, title, description, playback_id, poster_url,
//                    event_type, event_date, venue, city, guest_count,
//                    sort_order }] }
//
// That endpoint does NOT exist in the portal yet. Until it ships the page
// renders SEED_EVENTS below, so /portfolio is live and honest today and
// switches over silently the moment the portal answers. Any failure — 404,
// network, malformed, empty — keeps the seed on screen; a log showing
// nothing is worse than one that's slightly behind.
//
// `events` is the current key; `videos` is still accepted so an earlier
// portal build that shipped the reel-shaped response doesn't break the page.
//
// Videos are on Mux and the playback IDs are public. Unlike the old reel
// there is no hard cap here — it's a log, it's supposed to grow — but the
// list renders lazily and only the first player preloads.

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

type LoggedEvent = {
  key: string;
  title: string;
  description: string | null;
  playback_id: string;
  poster_url: string | null;
  /** Filter dimension. Free text from the portal so Stephen can add a
   *  category we haven't thought of without a deploy. */
  event_type: string | null;
  /** 'YYYY-MM-DD'. Drives the year filter and the ordering. */
  event_date: string | null;
  venue: string | null;
  city: string | null;
  guest_count: number | null;
  sort_order: number | null;
};

/* Seed log — the three clips on record. Only `event_type` is asserted here,
   because it's inferable from the footage itself. Dates, venues, and guest
   counts are deliberately left null rather than invented: this page is a
   record of real work, and a fabricated venue on it would be worse than a
   blank field. Stephen fills them in from the portal. */
const SEED_EVENTS: LoggedEvent[] = [
  {
    key: 'gentleman-jack-2021',
    title: 'Jack Daniel’s Gentleman Jack — Culture Shakers',
    description:
      'Featured in Jack Daniel’s Gentleman Jack 2021 Culture Shakers, a national spotlight on creators shaping their communities.',
    playback_id: 'MOxiZEb302JK1hwfkQzUQU3EDriQ401stR1CoSrTx02lq00',
    poster_url: null,
    event_type: 'Feature',
    event_date: '2021-01-01',
    venue: null,
    city: null,
    guest_count: null,
    sort_order: 0,
  },
  {
    key: 'behind-the-bar',
    title: 'Behind the Bar',
    description: null,
    playback_id: 'mSxkyXsJ3QPl201AEmwymMEw4iOLASE00x7zL3g9lygi4',
    poster_url: null,
    event_type: 'Live Mixology',
    event_date: null,
    venue: null,
    city: null,
    guest_count: null,
    sort_order: 1,
  },
  {
    key: 'from-the-studio',
    title: 'From the Studio',
    description:
      'Kraft kocktails built to order — the composition behind a Konquered Kocktails pour.',
    playback_id: 'aJAE59oLfQgbyWqAY1cs9avjbrCg6FsIJunL8cNr5nw',
    poster_url: null,
    event_type: 'Studio',
    event_date: null,
    venue: null,
    city: null,
    guest_count: null,
    sort_order: 2,
  },
];

const ALL = '__all__';

export default function PortfolioClient() {
  const [events, setEvents] = useState<LoggedEvent[]>(SEED_EVENTS);
  const [live, setLive] = useState(false);
  const [type, setType] = useState(ALL);
  const [year, setYear] = useState(ALL);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${PORTAL_URL}/api/external/portfolio?slug=${encodeURIComponent(PORTAL_SLUG)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const raw = Array.isArray(data?.events)
        ? data.events
        : Array.isArray(data?.videos)
          ? data.videos
          : [];
      const usable: LoggedEvent[] = raw.filter(
        (e: LoggedEvent) => e && typeof e.playback_id === 'string' && e.playback_id,
      );
      if (usable.length) {
        /* The portal is authoritative, but its first build shipped the
           reel-shaped row (key/title/playback_id only) — no event_type,
           date, venue, or description. Taking it verbatim would blank the
           copy and hide the filters entirely. So: portal wins on every
           field it actually has, and the seed fills only what the portal
           left null, and only for keys the seed already knows. Once
           Stephen backfills the metadata this merge stops doing anything. */
        const seedByKey = new Map(SEED_EVENTS.map((s) => [s.key, s]));
        setEvents(usable.map((e) => {
          const seed = seedByKey.get(e.key);
          if (!seed) return e;
          return {
            ...e,
            description: e.description ?? seed.description,
            event_type: e.event_type ?? seed.event_type,
            event_date: e.event_date ?? seed.event_date,
            venue: e.venue ?? seed.venue,
            city: e.city ?? seed.city,
            guest_count: e.guest_count ?? seed.guest_count,
          };
        }));
        setLive(true);
      }
    } catch (err) {
      console.warn('[event-log] portal fetch failed, using seed:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Newest first. Entries with no date sort last but keep their portal
     ordering among themselves — an undated entry is still real work. */
  const ordered = useMemo(() => {
    return [...events].sort((a, b) => {
      if (a.event_date && b.event_date) return b.event_date.localeCompare(a.event_date);
      if (a.event_date) return -1;
      if (b.event_date) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
  }, [events]);

  const types = useMemo(() => {
    const set = new Set<string>();
    for (const e of ordered) if (e.event_type) set.add(e.event_type);
    return [...set].sort();
  }, [ordered]);

  const years = useMemo(() => {
    const set = new Set<string>();
    for (const e of ordered) if (e.event_date) set.add(e.event_date.slice(0, 4));
    return [...set].sort().reverse();
  }, [ordered]);

  const shown = useMemo(() => ordered.filter((e) => {
    if (type !== ALL && e.event_type !== type) return false;
    if (year !== ALL && e.event_date?.slice(0, 4) !== year) return false;
    return true;
  }), [ordered, type, year]);

  const filtered = type !== ALL || year !== ALL;

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
                Event Log
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/" className="kk-navlink" style={navLink}>Home</Link>
            <Link href="/merch" className="kk-navlink" style={navLink}>Shop</Link>
            <Link href="/book" className="kk-gold-btn" style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
              Reserve a Date
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Header / practice statement ────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(56px, 8vw, 96px) 20px clamp(24px, 3vw, 36px)', overflow: 'hidden' }}>
        <div aria-hidden="true" style={glowBackdrop} />
        <div className="kk-fade-up" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 760 }}>
            <span style={eyebrow}>
              <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
              Stephen Simmons · The Work
            </span>
            <h1 style={{ margin: '20px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(40px, 7vw, 74px)', lineHeight: 1.04 }}>
              Every room, <span style={{ color: GOLD, fontWeight: 600 }}>logged</span>.
            </h1>
            <p style={{ margin: '22px 0 0', color: CREAM, opacity: 0.85, fontSize: 'clamp(15px, 2vw, 17.5px)', lineHeight: 1.75, maxWidth: 640, fontWeight: 300 }}>
              This isn&rsquo;t a bar for hire. Stephen composes a drink experience out of
              the elements already in the room — the people, the light, the occasion, the
              spirits on hand — and no two are the same. What follows is the record:
              every event, as it happened.
            </p>
          </div>

          <dl style={{
            margin: 'clamp(32px, 4vw, 48px) 0 0', padding: 'clamp(22px, 3vw, 30px) 0 0',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 'clamp(16px, 2vw, 26px)', borderTop: `1px solid ${LINE}`,
          }}>
            {([
              ['Events logged', String(ordered.length)],
              ['Based in', CONTACT.area],
              ['Recognition', 'Gentleman Jack Culture Shakers, 2021'],
              ['Status', 'Licensed & insured'],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k}>
                <dt style={{ fontFamily: FB, fontSize: 10, letterSpacing: '1.6px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>{k}</dt>
                <dd style={{ margin: '7px 0 0', fontFamily: FD, fontSize: 19, fontWeight: 600, color: TEXT, lineHeight: 1.3 }}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Filters ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(20px, 3vw, 32px) 20px 0' }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 26px)',
          alignItems: 'flex-end', justifyContent: 'space-between',
          borderTop: `1px solid ${LINE}`, paddingTop: 'clamp(20px, 3vw, 28px)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 26px)' }}>
            {types.length > 1 && (
              <FilterGroup label="Type" value={type} onChange={setType}
                options={[[ALL, 'All'], ...types.map((t) => [t, t] as [string, string])]} />
            )}
            {years.length > 1 && (
              <FilterGroup label="Year" value={year} onChange={setYear}
                options={[[ALL, 'All'], ...years.map((y) => [y, y] as [string, string])]} />
            )}
          </div>

          <p aria-live="polite" style={{ margin: 0, fontFamily: FB, fontSize: 12, color: DIM, letterSpacing: '0.6px' }}>
            {shown.length} {shown.length === 1 ? 'event' : 'events'}
            {filtered && (
              <>
                {' · '}
                <button type="button" onClick={() => { setType(ALL); setYear(ALL); }} style={linkButton}>
                  Clear filters
                </button>
              </>
            )}
          </p>
        </div>
      </section>

      {/* ── The log ────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(22px, 3vw, 32px) 20px clamp(48px, 7vw, 84px)' }}>
        {shown.length === 0 ? (
          <div style={emptyBox}>
            Nothing logged under that filter yet.{' '}
            <button type="button" onClick={() => { setType(ALL); setYear(ALL); }} style={linkButton}>
              Show everything
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'clamp(20px, 2.6vw, 30px)',
          }}>
            {shown.map((e, i) => (
              <EventEntry key={e.key || e.playback_id} event={e} eager={i === 0} />
            ))}
          </div>
        )}

        {!live && (
          <p style={{ margin: 'clamp(28px, 4vw, 40px) 0 0', textAlign: 'center', fontSize: 12.5, color: DIM, lineHeight: 1.7 }}>
            Stephen is still backfilling the log — dates and venues fill in as he adds them.
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

function FilterGroup({
  label: text, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <span style={filterLabel}>{text}</span>
      <div role="group" aria-label={text} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(([v, l]) => {
          const on = value === v;
          return (
            <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={on}
              className="kk-pill"
              style={{
                padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                fontFamily: FB, fontSize: 12.5, letterSpacing: '0.4px',
                background: on ? GOLD : 'rgba(255,255,255,0.04)',
                border: `1px solid ${on ? GOLD : LINE}`,
                color: on ? INK : TEXT, fontWeight: on ? 600 : 400,
              }}>
              {l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EventEntry({ event: e, eager }: { event: LoggedEvent; eager: boolean }) {
  /* Build the meta line from whatever the portal actually has. Every field
     is optional — an entry with only a title still renders cleanly. */
  const meta: string[] = [];
  if (e.event_date) {
    const [y, m, d] = e.event_date.split('-').map(Number);
    meta.push(
      m && d
        ? new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : String(y),
    );
  }
  if (e.venue) meta.push(e.venue);
  if (e.city) meta.push(e.city);
  if (e.guest_count) meta.push(`${e.guest_count} guests`);

  return (
    <figure className="kk-card" style={{
      margin: 0, background: PANEL, border: `1px solid ${LINE}`,
      borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ background: '#000', lineHeight: 0 }}>
        <MuxPlayer
          playbackId={e.playback_id}
          streamType="on-demand"
          accentColor={GOLD}
          preload={eager ? 'metadata' : 'none'}
          playsInline
          {...(e.poster_url ? { poster: e.poster_url } : {})}
          metadata={{ video_title: `Konquered Kocktails — ${e.title}` }}
          style={{ width: '100%', aspectRatio: '16 / 9', display: 'block' }}
        />
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
  display: 'block', fontFamily: FB, fontSize: 10, letterSpacing: '1.6px',
  textTransform: 'uppercase', color: DIM, marginBottom: 8, fontWeight: 500,
};

const linkButton: CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: GOLD, fontFamily: FB, fontSize: 'inherit', textDecoration: 'underline',
};

const emptyBox: CSSProperties = {
  textAlign: 'center', padding: 'clamp(48px, 8vw, 88px) 24px',
  border: `1px dashed ${LINE}`, borderRadius: 16,
  color: MUTED, fontFamily: FB, fontSize: 15, lineHeight: 1.7, fontWeight: 300,
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

const KEYFRAMES = `
.kk-fade-up{animation:kkFadeUp .9s .05s both}
.kk-navlink{transition:color .2s ease}
.kk-navlink:hover{color:${GOLD}}
.kk-contact{transition:opacity .2s ease}
.kk-contact:hover{opacity:.82}
.kk-gold-btn{transition:transform .18s ease, box-shadow .18s ease, filter .18s ease}
.kk-gold-btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 12px 28px rgba(195,154,69,0.34)}
.kk-card{transition:transform .22s ease, border-color .22s ease}
.kk-card:hover{transform:translateY(-3px);border-color:${LINE2}}
.kk-pill{transition:border-color .15s ease, background .15s ease, color .15s ease}
.kk-pill:hover{border-color:${GOLD}}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){
  .kk-fade-up{animation:none!important}
  .kk-card:hover,.kk-gold-btn:hover{transform:none!important}
}
`;
