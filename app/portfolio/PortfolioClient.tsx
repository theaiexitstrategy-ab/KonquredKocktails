// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Konquered Kocktails portfolio — konqueredkocktails.com/portfolio.
//
// A résumé of Stephen's work: credentials up top, then his reel. Same
// portal-driven shape as /merch — the GoElev8 portal is the source of truth
// for the reel, and Stephen adds/removes videos from the portal Portfolio
// tab without a redeploy.
//
//   read → GET {PORTAL_URL}/api/external/portfolio?slug={PORTAL_SLUG}
//          → { videos: [{ key, title, description, playback_id,
//                         poster_url, sort_order }] }
//
// That endpoint does NOT exist in the portal yet. Until it ships, the page
// renders SEED_VIDEOS below so /portfolio is live and correct today, and
// silently switches to the portal the moment it starts answering. Any
// failure — 404, network, malformed — falls back to the seed rather than
// showing an empty page, because a portfolio with nothing on it is worse
// than a slightly stale one.
//
// Videos are on Mux and the playback IDs are public; nothing lives in this
// repo. Cap is MAX_VIDEOS — enforced here on render AND, per spec, on write
// in the portal. Two independent caps on purpose: this one keeps the page
// sane if the portal ever returns more.

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';

import {
  INK, PANEL, GOLD, GOLD_HI, GOLD_D, GARNET, AMETHYST, EMERALD,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB, CONTACT,
} from '../theme';

/* The <mux-player> custom element can't render during SSR. */
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.goelev8.ai';
const PORTAL_SLUG =
  process.env.NEXT_PUBLIC_PORTAL_SLUG || 'konquered-kocktails';

/* Hard cap on how many reel entries render. The portal enforces the same
   number on write; this is the belt to that suspenders. */
export const MAX_VIDEOS = 5;

type PortfolioVideo = {
  key: string;
  title: string;
  description: string | null;
  playback_id: string;
  poster_url: string | null;
  sort_order: number | null;
};

/* Seed reel — the three clips Stephen is starting with. Titles for the
   first and third are the ones already used on the homepage; the second
   is a new upload with no description on record yet, so it carries a
   neutral title for Stephen to rename in the portal. */
const SEED_VIDEOS: PortfolioVideo[] = [
  {
    key: 'gentleman-jack-2021',
    title: 'Jack Daniel’s Gentleman Jack — Culture Shakers',
    description:
      'Stephen featured in Jack Daniel’s Gentleman Jack 2021 Culture Shakers, a national spotlight on creators shaping their communities.',
    playback_id: 'MOxiZEb302JK1hwfkQzUQU3EDriQ401stR1CoSrTx02lq00',
    poster_url: null,
    sort_order: 0,
  },
  {
    key: 'behind-the-bar',
    title: 'Behind the Bar',
    description: null,
    playback_id: 'mSxkyXsJ3QPl201AEmwymMEw4iOLASE00x7zL3g9lygi4',
    poster_url: null,
    sort_order: 1,
  },
  {
    key: 'from-the-studio',
    title: 'From the Studio',
    description:
      'Kraft kocktails built to order — the process behind a Konquered Kocktails pour.',
    playback_id: 'aJAE59oLfQgbyWqAY1cs9avjbrCg6FsIJunL8cNr5nw',
    poster_url: null,
    sort_order: 2,
  },
];

/* Résumé strip. Every line here is a fact already carried on the site or in
   CLAUDE.md — don't add a credential that isn't independently verifiable. */
const CREDENTIALS: [string, string][] = [
  ['Based in', CONTACT.area],
  ['Recognition', 'Gentleman Jack Culture Shakers, 2021'],
  ['Pours', 'Uncle Nearest 1856 & craft spirits'],
  ['Status', 'Licensed & insured'],
];

type LoadState = 'loading' | 'ready';

export default function PortfolioClient() {
  const [videos, setVideos] = useState<PortfolioVideo[]>(SEED_VIDEOS);
  const [state, setState] = useState<LoadState>('loading');

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${PORTAL_URL}/api/external/portfolio?slug=${encodeURIComponent(PORTAL_SLUG)}`,
        { cache: 'no-store' },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows: PortfolioVideo[] = Array.isArray(data?.videos) ? data.videos : [];
      /* Only take over from the seed when the portal actually has a reel.
         An empty array means the tenant exists but hasn't uploaded yet —
         keep showing the seed rather than blanking the page. */
      const usable = rows.filter((v) => v && typeof v.playback_id === 'string' && v.playback_id);
      if (usable.length) {
        usable.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setVideos(usable.slice(0, MAX_VIDEOS));
      }
    } catch (err) {
      /* Endpoint not built yet, tenant missing, or network trouble. The
         seed reel is already on screen; leave it there. */
      console.warn('[portfolio] portal fetch failed, using seed reel:', err);
    } finally {
      setState('ready');
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <main style={{ background: INK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{KEYFRAMES}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.86)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${LINE}`,
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/images/kbalance-logo.jpg" alt="Konquered Kocktails" width={42} height={42}
              style={{ height: 42, width: 42, display: 'block', borderRadius: '50%', border: `1px solid ${LINE2}` }} />
            <span style={{ lineHeight: 1 }}>
              <span style={{ display: 'block', fontFamily: FB, fontWeight: 600, fontSize: 22, letterSpacing: '0.02em', color: TEXT }}>
                Konquered Kocktails
              </span>
              <span style={{ display: 'block', fontFamily: FB, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginTop: 3, fontWeight: 500 }}>
                Portfolio
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/" className="kk-navlink" style={navLink}>Home</Link>
            <Link href="/merch" className="kk-navlink" style={navLink}>Shop</Link>
            <Link href="/#book" className="kk-gold-btn" style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
              Book an Event
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero / résumé header ───────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(56px, 8vw, 96px) 20px clamp(24px, 3vw, 36px)', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            `radial-gradient(46% 60% at 50% 0%, ${AMETHYST}26 0%, transparent 58%)`,
            `radial-gradient(64% 62% at 82% 44%, ${EMERALD}40 0%, transparent 62%)`,
            `radial-gradient(56% 58% at 18% 76%, ${GARNET}22 0%, transparent 60%)`,
            `radial-gradient(50% 54% at 50% 40%, ${GOLD}1a 0%, transparent 62%)`,
          ].join(', '),
        }} />
        <div className="kk-fade-up" style={{ position: 'relative', zIndex: 2, maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ maxWidth: 720 }}>
            <span style={eyebrow}>
              <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
              Stephen Simmons · Founder & Lead Mixologist
            </span>
            <h1 style={{ margin: '20px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(40px, 7vw, 74px)', lineHeight: 1.04 }}>
              Intention is the <span style={{ color: GOLD, fontWeight: 600 }}>experience</span>.
            </h1>
            <p style={{ margin: '22px 0 0', color: CREAM, opacity: 0.85, fontSize: 'clamp(15px, 2vw, 17.5px)', lineHeight: 1.75, maxWidth: 620, fontWeight: 300 }}>
              An art gallery in a glass. Ninety percent of what Stephen creates is emotion
              in the moment — kraft kocktails, live mixology, and curated Art + Kreativity
              for weddings, corporate events, and private parties across Greater St.&nbsp;Louis.
            </p>
          </div>

          {/* Credential strip — the "resume" line of the page. */}
          <dl style={{
            margin: 'clamp(32px, 4vw, 48px) 0 0', padding: 0,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 'clamp(16px, 2vw, 26px)',
            borderTop: `1px solid ${LINE}`, paddingTop: 'clamp(22px, 3vw, 30px)',
          }}>
            {CREDENTIALS.map(([label, value]) => (
              <div key={label}>
                <dt style={{ fontFamily: FB, fontSize: 10, letterSpacing: '1.6px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>
                  {label}
                </dt>
                <dd style={{ margin: '7px 0 0', fontFamily: FD, fontSize: 19, fontWeight: 600, color: TEXT, lineHeight: 1.3 }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── The reel ───────────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(28px, 4vw, 44px) 20px clamp(48px, 7vw, 84px)' }}>
        <span style={eyebrow}>
          <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          Selected Work
        </span>

        <div style={{
          marginTop: 'clamp(22px, 3vw, 32px)',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 'clamp(20px, 2.6vw, 30px)',
        }}>
          {videos.slice(0, MAX_VIDEOS).map((v, i) => (
            <figure key={v.key || v.playback_id} className="kk-card" style={{
              margin: 0, background: PANEL, border: `1px solid ${LINE}`,
              borderRadius: 16, overflow: 'hidden',
            }}>
              <div style={{ background: '#000', lineHeight: 0 }}>
                <MuxPlayer
                  playbackId={v.playback_id}
                  streamType="on-demand"
                  accentColor={GOLD}
                  preload={i === 0 ? 'metadata' : 'none'}
                  playsInline
                  {...(v.poster_url ? { poster: v.poster_url } : {})}
                  metadata={{ video_title: `Konquered Kocktails — ${v.title}` }}
                  style={{ width: '100%', aspectRatio: '16 / 9', display: 'block' }}
                />
              </div>
              <figcaption style={{ padding: 20 }}>
                <h2 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 23, lineHeight: 1.2, color: TEXT }}>
                  {v.title}
                </h2>
                {v.description && (
                  <p style={{ margin: '8px 0 0', fontFamily: FB, fontWeight: 300, fontSize: 13.5, color: MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                    {v.description}
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>

        {state === 'ready' && videos.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 'clamp(48px, 8vw, 88px) 24px',
            border: `1px dashed ${LINE}`, borderRadius: 16,
            color: MUTED, fontFamily: FB, fontSize: 15, lineHeight: 1.7, fontWeight: 300,
          }}>
            The reel is being cut. Check back soon.
          </div>
        )}
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${LINE}`, padding: 'clamp(44px, 6vw, 72px) 20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 'clamp(30px, 4.6vw, 46px)', lineHeight: 1.08 }}>
          Let&rsquo;s build yours.
        </h2>
        <p style={{ margin: '14px auto 26px', color: MUTED, fontSize: 15.5, lineHeight: 1.7, maxWidth: 480, fontWeight: 300 }}>
          Tell Stephen the date and the room — he&rsquo;ll design the rest.
        </p>
        <Link href="/#book" className="kk-gold-btn" style={goldButton}>Book an Event</Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
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

/* ── Shared style bits ────────────────────────────────────────────── */

const navLink: CSSProperties = {
  fontFamily: FB, fontSize: 12, letterSpacing: '1.6px', textTransform: 'uppercase',
  fontWeight: 500, color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap',
};

const eyebrow: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 11,
  fontFamily: FB, fontSize: 11.5, letterSpacing: '2.4px',
  textTransform: 'uppercase', color: GOLD, fontWeight: 500,
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
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){
  .kk-fade-up{animation:none!important}
  .kk-card:hover,.kk-gold-btn:hover{transform:none!important}
}
`;
