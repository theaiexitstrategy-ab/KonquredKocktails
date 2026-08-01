// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useEffect, useState, type CSSProperties } from 'react';

/* Brand palette + typefaces live in app/theme.ts so this page and the
   storefront at /merch can't drift apart. CLAUDE.md is the source of truth
   for the values themselves. */
import {
  INK, PANEL, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, BRONZE, GOLD_D,
  GARNET, AMETHYST, CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB, CONTACT,
} from './theme';

/* Videos are hosted on Mux — nothing lives in the repo. The <mux-player>
   custom element can't render during SSR, so load it client-side only. */
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false });

/* Public Mux playback IDs. */
const HERO_VIDEO_ID = 'FSsAfj00KwDZSPPaApJjMHqx5msnrneNULZFEdDov01g8';   // silent background loop
const ABOUT_VIDEO_ID = 'MOxiZEb302JK1hwfkQzUQU3EDriQ401stR1CoSrTx02lq00'; // Gentleman Jack feature
const MENU_VIDEO_ID = 'aJAE59oLfQgbyWqAY1cs9avjbrCg6FsIJunL8cNr5nw';      // "From the studio" feature

/* Header / mobile-menu links — shared by desktop nav and the mobile drawer.
   A target starting with '/' is a real route (rendered as a plain link);
   anything else is an on-page section id that smooth-scrolls. */
const NAV_LINKS: [string, string][] = [
  ['Experiences', 'experiences'],
  ['Menu', 'menu'],
  ['About', 'about'],
  ['Event Log', '/portfolio'],
  ['Shop', '/merch'],
];

const isRoute = (target: string) => target.startsWith('/');

/* ── Real Konquered Kocktails content (verbatim from the live page) ── */

const PACKAGES = [
  {
    accent: GOLD,
    img: '/images/kk/bourbon-bar.jpeg',
    name: 'The Kustom Mixology Experience',
    tagline: 'Our signature private event',
    bullets: [
      'Custom Kocktail list built for your event',
      '2.5 hours of kustom mixology, live',
      'Handcrafted, themed Kocktails all night',
    ],
    experienceKey: 'kustom_mixology',
  },
  {
    accent: GOLD,
    img: '/images/kk/signature-sour.png',
    imgContain: true,
    name: 'Spirits & Kocktail Tasting',
    tagline: 'A guided tasting for the curious',
    bullets: [
      'Custom spirits & cocktail tasting',
      'Personalized tasting profile kit',
      'Thoughtfully paired snacks',
    ],
    experienceKey: 'spirits_tasting',
  },
  {
    accent: GOLD,
    img: '/images/kk/live-mixology.jpg',
    name: 'Full-Service Kreative Experience',
    tagline: 'Weddings, corporate & private parties',
    bullets: [
      'We bring the artistry, tools & talent to you',
      'Signature Kocktails tailored to your event',
      'Professional, curated Kreative service',
    ],
    experienceKey: 'kreative_private',
  },
];

const MENU = [
  {
    name: 'Nearest to Happiness',
    build: '1.5 oz Uncle Nearest 1856 · ½ oz Lillet Rouge · ½ oz lemon · ½ oz simple · 3–4 blueberries',
  },
  {
    name: 'Konquered Sour',
    build: '2 oz bourbon · ¾ oz fresh lemon · ½ oz barrel-aged maple · ½ oz Big O Ginger Liqueur · egg white',
    signature: true,
  },
  {
    name: "Uncle's Spiced Side Car",
    build: '2 oz Uncle Nearest 1856 · ½ oz Big O Ginger Liqueur · ½ oz orange curaçao · ½ oz lemon · ¼ oz simple',
  },
];

function smoothScrollTo(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function KkClient() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [heroMuted, setHeroMuted] = useState(true);

  return (
    <main style={{ background: INK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Animation + a couple of pseudo-element effects that inline styles can't express. */}
      <style>{KEYFRAMES}</style>

      {/* ── Sticky header ──────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,10,0.86)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Brand />
          {/* Desktop nav — hidden below the mobile breakpoint (see kk-desktop-nav) */}
          <nav aria-label="Sections" className="kk-desktop-nav"
            style={{ fontFamily: FB, fontSize: 12, letterSpacing: '1.6px', textTransform: 'uppercase', fontWeight: 500 }}>
            {NAV_LINKS.map(([label, target]) => (
              <a key={target}
                 href={isRoute(target) ? target : `#${target}`}
                 onClick={isRoute(target) ? undefined : (e) => smoothScrollTo(e, target)}
                 className="kk-navlink"
                 style={{ color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                {label}
              </a>
            ))}
            <a href="/book"
               className="kk-gold-btn" style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
              Reserve a Date
            </a>
          </nav>
          {/* Mobile menu tab — only shown below the breakpoint (see kk-menu-toggle) */}
          <button
            type="button"
            className="kk-menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="kk-mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              background: 'transparent', color: CREAM, border: `1px solid ${LINE2}`,
              borderRadius: 999, padding: '9px 16px', cursor: 'pointer',
              fontFamily: FB, fontSize: 12, letterSpacing: '1.4px', textTransform: 'uppercase', fontWeight: 500,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 15, lineHeight: 1 }}>{menuOpen ? '✕' : '☰'}</span>{' '}Menu
          </button>
        </div>
        {menuOpen && (
          <nav id="kk-mobile-menu" className="kk-mobile-menu" aria-label="Menu">
            {NAV_LINKS.map(([label, target]) => (
              <a key={target}
                 href={isRoute(target) ? target : `#${target}`}
                 className="kk-mobile-link"
                 onClick={(e) => {
                   if (!isRoute(target)) smoothScrollTo(e, target);
                   setMenuOpen(false);
                 }}>
                {label}
              </a>
            ))}
            <a href="/book" className="kk-gold-btn"
               onClick={() => setMenuOpen(false)}
               style={{ ...goldButton, ...fullButton, marginTop: 10, fontSize: 13 }}>
              Reserve a Date
            </a>
          </nav>
        )}
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section style={{ ...shell, position: 'relative', paddingTop: 'clamp(36px, 6vw, 72px)', paddingBottom: 'clamp(36px, 6vw, 72px)' }}>
        {/* warm ambient wash — royal gold core with emerald depth and a
            whisper of amethyst/garnet, per the brand palette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            `radial-gradient(46% 52% at 50% 6%, ${AMETHYST}2b 0%, transparent 55%)`,   // amethyst top
            `radial-gradient(70% 68% at 82% 46%, ${EMERALD}4d 0%, transparent 62%)`,    // emerald right
            `radial-gradient(60% 60% at 24% 78%, ${GARNET}29 0%, transparent 60%)`,     // garnet lower-left
            `radial-gradient(52% 56% at 50% 44%, ${GOLD}1f 0%, transparent 62%)`,       // gold core
          ].join(', '),
        }} />
        {/* Single centered column: copy, then the animated drink medallion,
            then the CTAs directly beneath it. */}
        <div className="kk-fade-up" style={{
          position: 'relative', zIndex: 2,
          maxWidth: 760, margin: '0 auto', textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <Eyebrow>Not a bar service · An artist at work · {CONTACT.area}</Eyebrow>
          <h1 style={{
            margin: '20px 0 0', fontFamily: FD, fontWeight: 700,
            fontSize: 'clamp(46px, 8vw, 92px)',
            lineHeight: 1.02,
          }}>
            An art gallery<br />
            in a <span style={{ color: GOLD, fontWeight: 600 }}>glass</span>.
          </h1>
          <p style={{
            margin: '24px auto 0', color: CREAM, opacity: 0.82,
            fontSize: 'clamp(15px, 2vw, 18px)', lineHeight: 1.75, maxWidth: 560, fontWeight: 300,
          }}>
            You don&rsquo;t hire Stephen Simmons to pour drinks. He composes an experience out
            of the elements already in the room — your people, your occasion, the light, the
            spirits on hand — and builds it live, in front of them. Ninety percent of what he
            creates is emotion in the moment. No two nights are the same, and none of them
            are a bar.
          </p>

          {/* Hero video framed as an iPhone — the Mux loop plays on the
              screen, the Konquered seal spins as a badge, a gold glow sits
              behind. Directly above the CTAs. */}
          <div className="kk-stage" style={{ width: '100%', maxWidth: 300, margin: 'clamp(16px, 3vw, 30px) auto 0' }}>
            <div className="kk-glow" />
            <div className="kk-phone">
              <div className="kk-phone-island" />
              <div className="kk-phone-screen">
                <MuxPlayer
                  playbackId={HERO_VIDEO_ID}
                  streamType="on-demand"
                  autoPlay="muted"
                  loop
                  muted={heroMuted}
                  playsInline
                  style={{
                    width: '100%', height: '100%',
                    '--controls': 'none',
                    '--media-object-fit': 'cover',
                    '--media-object-position': 'center',
                  }}
                />
              </div>
              <button
                type="button"
                className="kk-sound-btn"
                aria-label={heroMuted ? 'Turn video sound on' : 'Mute video'}
                aria-pressed={!heroMuted}
                onClick={() => setHeroMuted((m) => !m)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
                  {heroMuted ? (
                    <>
                      <line x1="16" y1="9" x2="21" y2="14" />
                      <line x1="21" y1="9" x2="16" y2="14" />
                    </>
                  ) : (
                    <>
                      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                      <path d="M18.5 6a8 8 0 0 1 0 12" />
                    </>
                  )}
                </svg>
              </button>
              <div className="kk-badge">
                <Image
                  src="/images/kbalance-logo.jpg"
                  alt="Konquered Kocktails seal"
                  width={120}
                  height={120}
                  priority
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
              </div>
            </div>
            <span className="kk-spark kk-spark-1" />
            <span className="kk-spark kk-spark-2" />
            <span className="kk-spark kk-spark-3" />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 'clamp(20px, 3vw, 34px)', justifyContent: 'center' }}>
            <a href="/book"
               className="kk-gold-btn" style={{ ...goldButton, padding: '15px 30px', fontSize: 13 }}>
              Reserve a Date
            </a>
            <a href="/portfolio"
               className="kk-ghost-btn" style={{ ...ghostButton, padding: '15px 30px', fontSize: 13 }}>
              See the Work
            </a>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginTop: 30, flexWrap: 'wrap', justifyContent: 'center',
            fontFamily: FB, fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', fontWeight: 500,
          }}>
            <span className="kk-live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
            <span style={{ color: GOLD }}>Now booking</span>
            <span style={{ color: BRONZE }}>·</span>
            <span style={{ color: MUTED }}>Licensed &amp; insured</span>
            <span style={{ color: BRONZE }}>·</span>
            <span style={{ color: MUTED }}>Deposit secured by Stripe</span>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ── Experiences / packages ─────────────────────────────────── */}
      <section id="experiences" style={{ ...shell, ...sectionPad }}>
        <SectionHead
          eyebrow="The commissions"
          title={<>Three ways to <em style={{ color: GOLD }}>compose</em></>}
          sub="Not packages off a menu — starting points. Stephen builds each one around your room, your guests, and what the night is actually for. A $200 deposit holds the date and applies to your final balance."
        />
        <div style={{
          display: 'grid', gap: 20, marginTop: 44,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}>
          {PACKAGES.map((p) => (
            <article key={p.name} className="kk-card" style={{ ...card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', width: '100%', height: 210, background: PANEL2 }}>
                <Image src={p.img} alt={p.name} fill sizes="(max-width: 700px) 100vw, 380px"
                  style={{ objectFit: p.imgContain ? 'contain' : 'cover', objectPosition: 'center' }} />
                <div aria-hidden="true" style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(10,10,10,0.55) 100%)',
                }} />
              </div>
              <div style={{ padding: 26, display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontFamily: FB, fontSize: 11, letterSpacing: '1.8px', textTransform: 'uppercase', color: GOLD, fontWeight: 500 }}>
                  {p.tagline}
                </span>
                <h3 style={{ margin: '10px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 28, lineHeight: 1.14 }}>
                  {p.name}
                </h3>
                <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 10 }}>
                  {p.bullets.map((b) => (
                    <li key={b} style={{ display: 'flex', gap: 10, fontSize: 14.5, color: MUTED, lineHeight: 1.5 }}>
                      <span aria-hidden="true" style={{ color: GOLD, flexShrink: 0 }}>◆</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <a href={`/book?experience=${p.experienceKey}`}
                   className="kk-gold-btn" style={{ ...goldButton, marginTop: 24, textAlign: 'center', padding: '14px 20px', fontSize: 12 }}>
                  Check dates — $200 deposit
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GoldDivider />

      {/* ── Signature menu ─────────────────────────────────────────── */}
      <section id="menu" style={{ ...shell, ...sectionPad }}>
        <div style={{
          display: 'grid', gap: 'clamp(28px, 4vw, 52px)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', minHeight: 360, borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE2}` }}>
            <MuxPlayer
              playbackId={MENU_VIDEO_ID}
              streamType="on-demand"
              autoPlay="muted"
              loop
              muted
              playsInline
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                '--controls': 'none',
                '--media-object-fit': 'cover',
                '--media-object-position': 'center',
              }}
            />
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 55%, rgba(10,10,10,0.5) 100%)',
            }} />
          </div>
          <div>
            <SectionHead
              eyebrow="From the studio"
              title={<>Signature <em style={{ color: GOLD }}>Kocktails</em></>}
              sub="Standing works from the studio. Your event won’t get these — it gets its own list, composed for the occasion. These are here so you can see the hand."
            />
            <div style={{ marginTop: 32 }}>
              {MENU.map((m, i) => (
                <div key={m.name} style={{ padding: '20px 0', borderBottom: i < MENU.length - 1 ? `1px solid ${LINE}` : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 26, color: TEXT }}>
                      {m.name}
                    </h3>
                    {m.signature && (
                      <span style={{
                        fontFamily: FB, fontSize: 9.5, letterSpacing: '1.6px', textTransform: 'uppercase', fontWeight: 600,
                        color: INK, background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`, borderRadius: 999, padding: '4px 10px',
                      }}>
                        House signature
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: 14, color: MUTED, lineHeight: 1.6, fontFamily: FB, fontWeight: 300 }}>
                    {m.build}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GoldDivider />

      {/* ── About / team ───────────────────────────────────────────── */}
      <section id="about" style={{ ...shell, ...sectionPad }}>
        <div style={{
          display: 'grid', gap: 'clamp(28px, 4vw, 52px)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          alignItems: 'center',
        }}>
          <div>
            <SectionHead
              eyebrow="The artist"
              title={<>Intention is the <em style={{ color: GOLD }}>experience</em></>}
              sub="Stephen Simmons is an artist whose medium happens to be a glass. He reads a room — the people in it, the occasion, the light, the spirits within reach — and composes from what’s there. That’s the difference between hiring a bartender and commissioning a piece: a bartender executes a list, an artist responds to the room. You bring the guests; he brings everything else."
            />
            <div style={{ display: 'grid', gap: 14, marginTop: 30 }}>
              <ContactRow icon="☎" label="Call or text" value={CONTACT.phone} href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} />
              <ContactRow icon="✉" label="Email" value={CONTACT.email} href={`mailto:${CONTACT.email}`} />
              <ContactRow icon="✦" label="Based in" value={CONTACT.address} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE2}` }}>
              <Image src="/images/kk/founder-portrait.jpeg" alt="Konquered Kocktails founder" fill
                sizes="(max-width: 700px) 50vw, 260px" style={{ objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            <div style={{ position: 'relative', aspectRatio: '3/4', borderRadius: 14, overflow: 'hidden', border: `1px solid ${LINE2}`, marginTop: 28 }}>
              <Image src="/images/kk/team-aprons.jpeg" alt="The Konquered Kocktails team in branded aprons" fill
                sizes="(max-width: 700px) 50vw, 260px" style={{ objectFit: 'cover', objectPosition: 'center' }} />
            </div>
          </div>
        </div>

        {/* Authority / social proof — 2021 Jack Daniel's Gentleman Jack feature.
            Click-to-play with sound, lazy-loaded, framed in a Royal Gold ring. */}
        <div style={{ marginTop: 'clamp(36px, 5vw, 60px)', maxWidth: 920, marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
          <Eyebrow>As seen · Gentleman Jack Culture Shakers</Eyebrow>
          <div style={{
            marginTop: 20, borderRadius: 16, overflow: 'hidden',
            border: `1px solid ${GOLD}`, boxShadow: `0 0 0 1px ${GOLD}26, 0 20px 50px rgba(0,0,0,0.5)`,
            background: PANEL2, lineHeight: 0,
          }}>
            <MuxPlayer
              playbackId={ABOUT_VIDEO_ID}
              streamType="on-demand"
              accentColor={GOLD}
              preload="none"
              playsInline
              metadata={{ video_title: "Konquered Kocktails — Gentleman Jack Culture Shakers (2021)" }}
              style={{ width: '100%', aspectRatio: '16 / 9', display: 'block' }}
            />
          </div>
          <p style={{ margin: '14px 0 0', fontSize: 14, color: MUTED, fontFamily: FB, fontWeight: 300 }}>
            Stephen featured in Jack Daniel’s Gentleman Jack — 2021 Culture Shakers.
          </p>
        </div>
      </section>

      {/* ── Booking funnel — on a full-bleed Deep Emerald band ───────── */}
      <div style={{
        background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)`,
        borderTop: `1px solid ${LINE2}`, borderBottom: `1px solid ${LINE2}`,
        marginTop: 'clamp(24px, 4vw, 44px)',
      }}>
      <section id="book" style={{ ...shell, ...sectionPad, paddingBottom: 'clamp(40px, 6vw, 72px)' }}>
        <SectionHead
          center
          eyebrow="Reserve your date"
          title={<>Start with a <em style={{ color: GOLD }}>conversation</em></>}
          sub="Stephen takes one event at a time and designs it around your room. Check the live calendar, tell him what the night is for, and hold the date with a $200 deposit — applied in full to your final balance."
        />

        <div style={{
          ...card, marginTop: 44, maxWidth: 620, marginLeft: 'auto', marginRight: 'auto',
          padding: 'clamp(26px, 4vw, 40px)', textAlign: 'center',
        }}>
          <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 46, color: GOLD, lineHeight: 1 }}>$200</span>
          <p style={{ margin: '10px 0 0', fontFamily: FB, fontSize: 13.5, color: MUTED, lineHeight: 1.65, fontWeight: 300 }}>
            holds your date · refundable up to 14 days out · licensed &amp; insured
          </p>
          <a href="/book" className="kk-gold-btn"
             style={{ ...goldButton, ...fullButton, marginTop: 26 }}>
            Check Available Dates &rarr;
          </a>
          <p style={{ margin: '18px 0 0', fontFamily: FB, fontSize: 12.5, color: DIM, lineHeight: 1.7 }}>
            Rather talk it through?{' '}
            <a href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} className="kk-contact" style={{ color: GOLD, textDecoration: 'none' }}>{CONTACT.phone}</a>
          </p>
        </div>
      </section>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${LINE}`, marginTop: 0 }}>
        <div style={{
          maxWidth: 1180, margin: '0 auto', padding: '36px 20px 48px',
          display: 'flex', flexWrap: 'wrap', gap: 22, alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Brand />
          <div style={{ fontFamily: FB, fontSize: 12.5, color: MUTED, letterSpacing: '0.3px', lineHeight: 1.9 }}>
            <div>{CONTACT.phone} · {CONTACT.email}</div>
            <div>{CONTACT.address}</div>
          </div>
          <a href="https://goelev8.ai" className="kk-navlink" style={{
            fontFamily: FB, fontSize: 11, color: DIM, letterSpacing: '1.2px',
            textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500,
          }}>
            <Image src="/images/goelev8-full-logo.png" alt="" width={22} height={22} style={{ width: 22, height: 22, opacity: 0.75 }} />
            Powered by goElev8
          </a>
        </div>
      </footer>
    </main>
  );
}

/* ── Presentational helpers ───────────────────────────────────────── */

function Brand() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Image src="/images/kbalance-logo.jpg" alt="Konquered Kocktails" width={42} height={42}
        style={{ height: 42, width: 42, display: 'block', borderRadius: '50%', border: `1px solid ${LINE2}` }} />
      <span style={{ lineHeight: 1 }}>
        {/* Wordmark stays Outfit — it matches the Konquered Balance logo. */}
        <span style={{ display: 'block', fontFamily: FB, fontWeight: 600, fontSize: 22, letterSpacing: '0.02em', color: TEXT }}>
          Konquered Kocktails
        </span>
        <span style={{ display: 'block', fontFamily: FB, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginTop: 3, fontWeight: 500 }}>
          Kraft Kocktail Experiences
        </span>
      </span>
    </span>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 11,
      fontFamily: FB, fontSize: 11.5, letterSpacing: '2.4px', textTransform: 'uppercase', color: GOLD, fontWeight: 500,
    }}>
      <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
      {children}
    </span>
  );
}

function SectionHead({ eyebrow, title, sub, center }: { eyebrow: string; title: React.ReactNode; sub: string; center?: boolean }) {
  return (
    <div style={{ maxWidth: 640, ...(center ? { marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' } : {}) }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 style={{ margin: '18px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(34px, 5.4vw, 58px)', lineHeight: 1.06 }}>
        {title}
      </h2>
      <p style={{ margin: '16px 0 0', fontSize: 'clamp(14.5px, 2vw, 16.5px)', color: MUTED, lineHeight: 1.7, ...(center ? { marginLeft: 'auto', marginRight: 'auto' } : {}) }}>
        {sub}
      </p>
    </div>
  );
}

function GoldDivider() {
  return (
    <div aria-hidden="true" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${LINE2}, transparent)`, marginTop: 'clamp(24px, 4vw, 44px)' }} />
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: string; label: string; value: string; href?: string }) {
  const inner = (
    <span style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
      <span style={{
        width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center',
        fontSize: 15, color: GOLD, background: PANEL2, border: `1px solid ${LINE2}`, flexShrink: 0,
      }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: FB, fontSize: 10, letterSpacing: '1.6px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>{label}</span>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 400, color: TEXT, marginTop: 3, wordBreak: 'break-word' }}>{value}</span>
      </span>
    </span>
  );
  return href ? <a href={href} className="kk-contact" style={{ textDecoration: 'none' }}>{inner}</a> : inner;
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', padding: '11px 0', borderBottom: last ? 'none' : `1px solid ${LINE}` }}>
      <span style={{ fontFamily: FB, fontSize: 11, letterSpacing: '1px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 400, textAlign: 'right', minWidth: 0, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function Field({ id, label, value, onChange, error, type = 'text', placeholder, autoComplete }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  error?: string; type?: string; placeholder?: string; autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>{label}</label>
      <input id={id} type={type} value={value} placeholder={placeholder} autoComplete={autoComplete}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)} className="kk-input"
        style={{ ...inputStyle, borderColor: error ? '#c65b5b' : LINE }} />
      {error && <p id={`${id}-err`} role="alert" style={{ ...errorTextStyle, marginTop: 7 }}>{error}</p>}
    </div>
  );
}

/* ── Shared style objects ─────────────────────────────────────────── */

const shell: CSSProperties = { maxWidth: 1180, margin: '0 auto', padding: '0 20px' };

const sectionPad: CSSProperties = {
  paddingTop: 'clamp(40px, 6vw, 72px)',
  paddingBottom: 'clamp(8px, 2vw, 16px)',
  scrollMarginTop: 84,
};

const card: CSSProperties = { background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16 };

const stepHeading: CSSProperties = {
  margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 'clamp(26px, 3.6vw, 34px)', lineHeight: 1.1,
};

/* Gold-gradient pill — deliberately unlike goElev8's flat monospace rectangles. */
const goldButton: CSSProperties = {
  display: 'inline-block', background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`, color: INK,
  fontFamily: FB, fontWeight: 600, fontSize: 13, letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '15px 28px', cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
  boxShadow: '0 8px 22px rgba(195,154,69,0.22)',
};

const ghostButton: CSSProperties = {
  display: 'inline-block', background: 'transparent', color: CREAM,
  fontFamily: FB, fontWeight: 500, fontSize: 13, letterSpacing: '1.4px', textTransform: 'uppercase',
  border: `1px solid ${LINE2}`, borderRadius: 999, padding: '15px 28px', cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
};

const fullButton: CSSProperties = { display: 'block', width: '100%', textAlign: 'center', padding: '17px 24px', fontSize: 14 };

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: DIM, marginBottom: 8, fontWeight: 500,
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0c0b0a',
  border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 15px', color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none',
};

const chipStyle: CSSProperties = {
  padding: '10px 14px', borderRadius: 10, border: `1px solid ${LINE}`, fontFamily: FB, cursor: 'pointer', textAlign: 'center', lineHeight: 1.25,
};

const fieldsetStyle: CSSProperties = { border: 'none', padding: 0, margin: '26px 0 0', minWidth: 0 };

const legendStyle: CSSProperties = {
  padding: 0, fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: DIM, marginBottom: 12, fontWeight: 500,
};

const errorTextStyle: CSSProperties = { margin: '10px 0 0', fontSize: 13, color: '#d98a8a', lineHeight: 1.45 };

/* ── Keyframes + effects (things inline styles can't do) ──────────────
   The hero medallion: KB logo as a slow-spinning gold seal behind the
   drink, a counter-rotating conic gold ring, a pulsing radial glow, the
   drink gently floating, and a few rising gold sparkles. */
const KEYFRAMES = `
.kk-stage{position:relative;display:flex;align-items:center;justify-content:center;min-height:0}
.kk-glow{position:absolute;width:82%;aspect-ratio:1;border-radius:50%;
  background:radial-gradient(circle, ${GOLD}57 0%, ${GARNET}29 44%, transparent 68%);
  filter:blur(10px);animation:kkGlow 6s ease-in-out infinite}
.kk-phone{position:relative;z-index:2;width:100%;max-width:250px;aspect-ratio:9/19;
  background:linear-gradient(155deg,#3a3a3f 0%,#161618 55%,#0c0c0e 100%);
  border-radius:44px;padding:9px;
  box-shadow:0 32px 64px rgba(0,0,0,0.6),0 0 0 2px rgba(0,0,0,0.55),inset 0 1px 1px rgba(255,255,255,0.10);
  animation:kkFadeUp 1s .1s both, kkFloat 6.5s ease-in-out 1s infinite}
.kk-phone::after{content:'';position:absolute;inset:0;border-radius:44px;padding:1.5px;
  background:linear-gradient(155deg, ${GOLD} 0%, transparent 34%, transparent 66%, ${BRONZE} 100%);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;mask-composite:exclude;pointer-events:none;opacity:.55}
.kk-phone-screen{position:relative;width:100%;height:100%;border-radius:36px;overflow:hidden;background:#000}
.kk-phone-island{position:absolute;top:14px;left:50%;transform:translateX(-50%);
  width:32%;height:19px;background:#000;border-radius:20px;z-index:4;box-shadow:0 0 0 1px rgba(255,255,255,0.06)}
.kk-badge{position:absolute;z-index:5;bottom:-10px;left:50%;transform:translateX(-50%);
  width:58px;height:58px;border-radius:50%;overflow:hidden;border:2px solid ${GOLD};
  box-shadow:0 8px 20px rgba(0,0,0,0.55),0 0 18px ${GOLD}55;animation:kkSpin 22s linear infinite}
.kk-sound-btn{position:absolute;z-index:6;bottom:18px;right:16px;width:40px;height:40px;border-radius:50%;
  display:grid;place-items:center;cursor:pointer;color:${CREAM};
  background:rgba(10,10,10,0.55);border:1px solid ${GOLD};
  -webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);
  transition:background .2s ease, transform .2s ease}
.kk-sound-btn:hover{background:rgba(10,10,10,0.8);transform:scale(1.06)}
.kk-spark{position:absolute;bottom:22%;width:6px;height:6px;border-radius:50%;
  background:radial-gradient(circle, ${GOLD_HI}, ${GOLD_D});box-shadow:0 0 8px rgba(217,178,90,0.8);
  opacity:0;z-index:3}
.kk-spark-1{left:38%;animation:kkRise 4.2s ease-in 0.4s infinite}
.kk-spark-2{left:54%;width:4px;height:4px;animation:kkRise 5s ease-in 1.6s infinite}
.kk-spark-3{left:62%;width:5px;height:5px;animation:kkRise 4.6s ease-in 2.9s infinite}
.kk-fade-up{animation:kkFadeUp .9s .05s both}
.kk-live-dot{animation:kkGlow 2.4s ease-in-out infinite}
.kk-navlink{transition:color .2s ease}
.kk-navlink:hover{color:${GOLD}}
.kk-desktop-nav{display:flex;align-items:center;gap:26px;margin-left:auto}
.kk-menu-toggle{display:none;align-items:center;gap:8px;margin-left:auto}
.kk-mobile-menu{display:none;flex-direction:column;gap:2px;padding:8px 20px 18px;border-top:1px solid ${LINE};background:rgba(21,19,16,0.98)}
.kk-mobile-link{display:block;padding:14px 6px;color:${CREAM};text-decoration:none;font-family:${FB};font-size:14px;letter-spacing:1.4px;text-transform:uppercase;border-bottom:1px solid ${LINE}}
.kk-mobile-link:hover{color:${GOLD}}
@media (max-width:760px){
  .kk-desktop-nav{display:none}
  .kk-menu-toggle{display:inline-flex}
  .kk-mobile-menu{display:flex}
}
.kk-contact{transition:opacity .2s ease}
.kk-contact:hover{opacity:.82}
.kk-gold-btn{transition:transform .18s ease, box-shadow .18s ease, filter .18s ease}
.kk-gold-btn:hover{transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 12px 28px rgba(195,154,69,0.34)}
.kk-ghost-btn{transition:border-color .2s ease, color .2s ease, background .2s ease}
.kk-ghost-btn:hover{border-color:${GOLD};color:${GOLD};background:rgba(195,154,69,0.06)}
.kk-card{transition:transform .22s ease, border-color .22s ease}
.kk-card:hover{transform:translateY(-3px);border-color:${LINE2}}
.kk-input:focus{border-color:${GOLD}!important}
@keyframes kkSpin{to{transform:rotate(360deg)}}
@keyframes kkGlow{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:.95;transform:scale(1.07)}}
@keyframes kkFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@keyframes kkRise{0%{opacity:0;transform:translateY(24px) scale(.5)}18%{opacity:1}100%{opacity:0;transform:translateY(-150px) scale(1)}}
@media (prefers-reduced-motion: reduce){
  .kk-glow,.kk-phone,.kk-badge,.kk-spark,.kk-fade-up,.kk-live-dot{animation:none!important}
  .kk-phone{opacity:1;transform:none}
}
`;
