// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// AUTUMN THEME — time-boxed, Sept 22 → Nov 30 (the visitor's local time).
//
// Autumn, deliberately NOT Halloween: harvest, amber light, spiced and smoked
// flavours. No pumpkins, bats, cobwebs or orange-and-black. iSlay Studios and
// The FLEX Facility carry Halloween themes in October; this brand is an
// artist's studio, so the season shows up as warmth rather than costume.
//
// HOW IT TURNS ON: `kk-autumn` on <html> gates every selector here, and the
// seasonal markup below always renders — only its visibility is seasonal. That
// keeps the server and client markup identical, which a `useEffect` that
// rendered the band conditionally could not do without either a hydration
// mismatch or the band popping in and shoving the page down after load.
//
// The class is set twice, on purpose:
//   1. a pre-paint inline script in app/layout.tsx, so the band is in its
//      final place on the very first frame; and
//   2. an effect here as a backstop. A hydration failure anywhere on the page
//      makes React re-render the document and drop a class set by a script —
//      which is exactly what happened when this theme was written, before the
//      escaped-<style> bug was fixed. Four lines to make the season immune to
//      the next one.
// Window and overrides live in ./autumn-season.
//
// TO RETIRE THE SEASON: delete this file and ./autumn-season, the mounts in
// KkClient.tsx
// (<AutumnStyles />, <AutumnBand />, <AutumnLeaves />, plus <AutumnWash /> in
// the hero), and the seasonId script in layout.tsx. Nothing else references it.

'use client';

import { useEffect } from 'react';

import { BRONZE, CREAM, FB, LINE2 } from '../theme';
import { AUTUMN_CLASS, EMBER, MAPLE, HARVEST, isAutumnNow } from './autumn-season';

/* ── Marquee band ──────────────────────────────────────────────────── */

/** One pass of the marquee. Repeated enough times to fill a wide viewport. */
const BAND_COPY = [
  'Autumn at Konquered Kocktails',
  'Smoked maple, spiced pear and toasted pecan expressions',
  'Harvest gatherings, composed around your table',
  'Reserve your autumn date',
];

function BandPass({ k }: { k: number }) {
  return (
    <span className="kk-autumn-pass" key={k}>
      {BAND_COPY.map((line, i) => (
        <span key={i}>
          <span className="kk-autumn-line">{line}</span>
          <span className="kk-autumn-sep" aria-hidden="true">{i === BAND_COPY.length - 1 ? '🍂' : '✦'}</span>
        </span>
      ))}
    </span>
  );
}

/**
 * The seasonal band. Sits directly under the sticky header and links to the
 * one booking flow. The scrolling copy is hidden from assistive tech — a
 * marquee read aloud four times over is noise — and the link carries a single
 * plain label instead.
 */
export function AutumnBand() {
  return (
    <a
      href="/book"
      className="kk-autumn-band"
      aria-label="Autumn at Konquered Kocktails — reserve your autumn date"
    >
      <span className="kk-autumn-track" aria-hidden="true">
        {[0, 1, 2, 3].map((k) => <BandPass k={k} key={k} />)}
      </span>
    </a>
  );
}

/* ── Drifting leaves ───────────────────────────────────────────────── */

/** Fixed, decorative, and sized/timed from a constant table rather than
 *  Math.random, so the server and client render the same thing. Sits below
 *  the sticky header's z-index (50) so it never drifts over the nav.
 *
 *  `at` is how far through its fall each leaf already is when the page loads,
 *  applied as a NEGATIVE animation-delay. Without it the first visitor stares
 *  at an empty sky for most of a minute while nine leaves queue up off-screen. */
const LEAVES: { left: number; size: number; dur: number; at: number; sway: number; spin: number; color: string; wide?: boolean }[] = [
  { left: 4,  size: 22, dur: 15, at: 0.05, sway: 4.5, spin: 9,  color: EMBER },
  { left: 16, size: 17, dur: 20, at: 0.62, sway: 6,   spin: 13, color: HARVEST, wide: true },
  { left: 27, size: 26, dur: 17, at: 0.28, sway: 5,   spin: 11, color: MAPLE },
  { left: 39, size: 15, dur: 23, at: 0.81, sway: 7,   spin: 15, color: BRONZE, wide: true },
  { left: 50, size: 20, dur: 16, at: 0.44, sway: 4,   spin: 8,  color: HARVEST },
  { left: 61, size: 24, dur: 21, at: 0.17, sway: 6.5, spin: 12, color: EMBER, wide: true },
  { left: 72, size: 18, dur: 18, at: 0.70, sway: 5.5, spin: 10, color: BRONZE },
  { left: 83, size: 21, dur: 24, at: 0.36, sway: 7.5, spin: 14, color: HARVEST, wide: true },
  { left: 92, size: 16, dur: 19, at: 0.90, sway: 5,   spin: 11, color: EMBER },
];

/** A leaf: pointed blade, stem, midrib and two pairs of veins. The veins are
 *  cut in as translucent black rather than drawn in a lighter colour, so one
 *  shape works for every leaf tint. Reads as a leaf down to about 14px. */
function Leaf({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size * 1.08} viewBox="0 0 24 26" aria-hidden="true" focusable="false">
      <path fill={color} d="M12 1.2c-5.7 4.3-8.4 9-8.4 13.3 0 4.5 3.8 7.9 8.4 7.9s8.4-3.4 8.4-7.9c0-4.3-2.7-9-8.4-13.3z" />
      <g stroke="rgba(0,0,0,0.3)" strokeWidth="0.9" strokeLinecap="round" fill="none">
        <path d="M12 3.6v21" />
        <path d="M12 9.6l4.2 3.1M12 9.6L7.8 12.7M12 15.1l4.6 3.2M12 15.1l-4.6 3.2" strokeWidth="0.75" />
      </g>
    </svg>
  );
}

export function AutumnLeaves() {
  return (
    <div className="kk-leaf-layer" aria-hidden="true">
      {LEAVES.map((l, i) => (
        <span
          key={i}
          className={`kk-leaf${l.wide ? ' kk-leaf-wide' : ''}`}
          style={{ left: `${l.left}%`, animationDuration: `${l.dur}s`, animationDelay: `-${(l.dur * l.at).toFixed(1)}s` }}
        >
          <span className="kk-leaf-sway" style={{ animationDuration: `${l.sway}s`, animationDelay: `-${(l.sway * l.at).toFixed(1)}s` }}>
            <span className="kk-leaf-spin" style={{ animationDuration: `${l.spin}s`, animationDelay: `-${(l.spin * l.at).toFixed(1)}s` }}>
              <Leaf color={l.color} size={l.size} />
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}

/** Extra warmth over the hero's existing wash — ember above, maple below. */
export function AutumnWash() {
  return <div className="kk-autumn-wash" aria-hidden="true" />;
}

/* ── Styles ────────────────────────────────────────────────────────────
   Everything is gated on html.kk-autumn and hidden by default, so out of
   season this whole block costs one unmatched selector per rule. */

export function AutumnStyles() {
  // Backstop for the pre-paint script — see the note at the top of the file.
  // Idempotent: classList.add on a class already present is a no-op.
  useEffect(() => {
    if (isAutumnNow(new Date(), window.location.search)) {
      document.documentElement.classList.add(AUTUMN_CLASS);
    }
  }, []);

  // Raw, not a text child — see the note in KkClient.tsx.
  return <style dangerouslySetInnerHTML={{ __html: AUTUMN_CSS }} />;
}

const AUTUMN_CSS = `
.kk-autumn-band,.kk-leaf-layer,.kk-autumn-wash{display:none}

/* ── band ── */
html.${AUTUMN_CLASS} .kk-autumn-band{
  display:block;position:relative;overflow:hidden;text-decoration:none;
  background:linear-gradient(90deg,#2E1109 0%,#5A2313 26%,${MAPLE} 50%,#5A2313 74%,#2E1109 100%);
  border-bottom:1px solid ${LINE2};
  padding:9px 0;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);
}
html.${AUTUMN_CLASS} .kk-autumn-track{
  display:inline-flex;align-items:center;white-space:nowrap;will-change:transform;
  animation:kkAutumnMarquee 44s linear infinite;
}
html.${AUTUMN_CLASS} .kk-autumn-band:hover .kk-autumn-track,
html.${AUTUMN_CLASS} .kk-autumn-band:focus-visible .kk-autumn-track{animation-play-state:paused}
html.${AUTUMN_CLASS} .kk-autumn-band:focus-visible{outline:2px solid ${CREAM};outline-offset:-2px}
html.${AUTUMN_CLASS} .kk-autumn-pass{display:inline-flex;align-items:center}
html.${AUTUMN_CLASS} .kk-autumn-line{
  font-family:${FB};font-size:11.5px;font-weight:500;letter-spacing:2.2px;text-transform:uppercase;
  color:${CREAM};
}
html.${AUTUMN_CLASS} .kk-autumn-sep{margin:0 14px;font-size:11px;color:${HARVEST}}
@keyframes kkAutumnMarquee{from{transform:translateX(0)}to{transform:translateX(-25%)}}

/* ── hero wash ── */
html.${AUTUMN_CLASS} .kk-autumn-wash{
  display:block;position:absolute;inset:0;pointer-events:none;
  background:
    radial-gradient(54% 48% at 50% 0%, ${EMBER}2e 0%, transparent 60%),
    radial-gradient(44% 44% at 14% 22%, ${HARVEST}1f 0%, transparent 62%),
    radial-gradient(58% 52% at 86% 86%, ${MAPLE}26 0%, transparent 62%);
}

/* ── leaves ── */
html.${AUTUMN_CLASS} .kk-leaf-layer{
  display:block;position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden;
}
.kk-leaf{position:absolute;top:-10vh;animation-name:kkLeafFall;animation-timing-function:linear;animation-iteration-count:infinite}
.kk-leaf-sway{display:block;animation-name:kkLeafSway;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-direction:alternate}
.kk-leaf-spin{display:block;animation-name:kkLeafSpin;animation-timing-function:linear;animation-iteration-count:infinite;opacity:.55}
@keyframes kkLeafFall{to{transform:translateY(118vh)}}
@keyframes kkLeafSway{from{transform:translateX(-24px)}to{transform:translateX(24px)}}
@keyframes kkLeafSpin{to{transform:rotate(360deg)}}

/* Thin the drift on phones — nine leaves on a 390px-wide screen is weather,
   not atmosphere. */
@media (max-width:760px){
  html.${AUTUMN_CLASS} .kk-leaf-wide{display:none}
  html.${AUTUMN_CLASS} .kk-autumn-line{font-size:10.5px;letter-spacing:1.8px}
  html.${AUTUMN_CLASS} .kk-autumn-track{animation-duration:30s}
}

/* Decoration only: no leaves and no scroll when motion is unwelcome. The
   band keeps its colour and shows the first pass, standing still. */
@media (prefers-reduced-motion: reduce){
  html.${AUTUMN_CLASS} .kk-leaf-layer{display:none}
  html.${AUTUMN_CLASS} .kk-autumn-track{animation:none}
  html.${AUTUMN_CLASS} .kk-leaf,
  html.${AUTUMN_CLASS} .kk-leaf-sway,
  html.${AUTUMN_CLASS} .kk-leaf-spin{animation:none!important}
}
`;
