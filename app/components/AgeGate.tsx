// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// 21+ age gate — CTIA SHAFT guidance for alcohol content.
//
// TWO DELIBERATE DEVIATIONS FROM THE BRIEF, both load-bearing:
//
// 1. The year list runs the full ~100 years, NOT 1905-2005. Capping the list
//    at a year that is always 21+ means an underage visitor cannot enter
//    their real birthdate — they pick a qualifying year and pass. A gate that
//    cannot fail is theatre, and worse, it manufactures a "verification"
//    record for someone who was never verified. The range has to include
//    failing years for the check to mean anything.
//
// 2. The compliance pages are NOT gated. A2P 10DLC / TCR review requires the
//    privacy policy, terms, and SMS program pages to be reachable with no
//    barrier. A reviewer who lands on /sms-compliance and hits a modal may
//    fail the campaign — which is the exact thing this site is being prepared
//    for. Alcohol-marketing content is gated; legal disclosures are not.
//
// The content still renders underneath the overlay rather than being replaced
// by it, so crawlers continue to index the site and the sitemap stays
// meaningful. This is a good-faith control, not a security boundary: anyone
// with devtools can remove an overlay, and no client-side gate anywhere
// changes that.

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import {
  INK, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB,
} from '../theme';

const MIN_AGE = 21;
const STORAGE_KEY = 'kk_age_verified';

/** Reachable without the gate. Carrier and Campaign Registry reviewers must
 *  be able to read these directly; an age modal in front of a privacy policy
 *  reads as a barrier to exactly the audience that must not hit one. */
const UNGATED = ['/privacy', '/terms', '/sms-consent', '/sms-compliance'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

type Status = 'checking' | 'prompt' | 'denied' | 'allowed';

/** Whole years between two dates, counting a birthday that hasn't happened
 *  yet this year as not-yet-reached. */
function ageOn(birth: Date, today: Date): number {
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

/** Days in a given month, so 31 February can't be selected. */
function daysInMonth(month: number, year: number): number {
  if (!month) return 31;
  if (!year) return month === 2 ? 29 : [4, 6, 9, 11].includes(month) ? 30 : 31;
  return new Date(year, month, 0).getDate();
}

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ungated = UNGATED.some((p) => pathname === p || pathname.startsWith(p + '/'));

  const [status, setStatus] = useState<Status>('checking');
  const [month, setMonth] = useState(0);
  const [day, setDay] = useState(0);
  const [year, setYear] = useState(0);
  const [error, setError] = useState('');

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  const thisYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 101 }, (_, i) => thisYear - i),
    [thisYear],
  );
  const days = useMemo(
    () => Array.from({ length: daysInMonth(month, year) }, (_, i) => i + 1),
    [month, year],
  );

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    [],
  );

  /* Read the session on mount. sessionStorage throws in some privacy modes,
     so a failure to read means "not verified" rather than an exception. */
  useEffect(() => {
    if (ungated) { setStatus('allowed'); return; }
    try {
      const v = window.sessionStorage.getItem(STORAGE_KEY);
      if (v) {
        const parsed = JSON.parse(v) as { verified?: boolean };
        setStatus(parsed?.verified ? 'allowed' : 'denied');
        return;
      }
    } catch { /* fall through to prompt */ }
    setStatus('prompt');
  }, [ungated]);

  const blocking = status === 'prompt' || status === 'denied';

  /* Lock scroll and hold focus inside the dialog while it's up. */
  useEffect(() => {
    if (!blocking) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstFieldRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      // No Escape-to-dismiss: there is deliberately no way out but answering.
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); return; }
      if (e.key !== 'Tab') return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'select, button, a[href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes?.length) return;
      const list = Array.from(nodes).filter((n) => !n.hasAttribute('disabled'));
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [blocking]);

  const verify = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!month || !day || !year) {
      setError('Please select your full date of birth.');
      return;
    }
    // Guard an impossible date (e.g. 31 April) before trusting the Date.
    if (day > daysInMonth(month, year)) {
      setError('That date doesn’t exist. Please check your birthdate.');
      return;
    }

    const birth = new Date(year, month - 1, day);
    const age = ageOn(birth, new Date());

    if (age >= MIN_AGE) {
      try {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ verified: true, timestamp: new Date().toISOString() }),
        );
      } catch { /* private mode — allow for this render, re-ask next load */ }
      setStatus('allowed');
    } else {
      try {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ verified: false, timestamp: new Date().toISOString() }),
        );
      } catch { /* nothing to persist to; the denial still shows */ }
      setStatus('denied');
    }
  }, [month, day, year]);

  return (
    <>
      {/* Content stays mounted so crawlers still index the site; the overlay
          covers it and scroll is locked while the gate is up. */}
      <div {...(blocking ? { 'aria-hidden': true } : {})}>{children}</div>

      {/* 'checking' renders an opaque cover with no dialog, so verified
          visitors never see a flash of the modal on load. */}
      {status === 'checking' && !ungated && (
        <div aria-hidden="true" style={{ ...overlay, background: INK }} />
      )}

      {blocking && (
        <div style={overlay} role="presentation">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="kk-age-title"
            aria-describedby="kk-age-desc"
            style={dialog}
          >
            {status === 'denied' ? (
              <div style={{ textAlign: 'center' }}>
                <h2 id="kk-age-title" style={titleStyle}>
                  You must be 21 or older to access this site
                </h2>
                <p id="kk-age-desc" style={{ ...bodyStyle, marginTop: 16 }}>
                  Thank you for your interest in Konquered Kocktails. We serve guests of
                  legal drinking age only, and we can&rsquo;t let you continue.
                </p>
                <p style={{ ...footnote, marginTop: 22 }}>
                  If you entered your date of birth incorrectly, close this tab and open
                  the site again.
                </p>
              </div>
            ) : (
              <form onSubmit={verify} noValidate>
                <p style={eyebrowStyle}>Konquered Kocktails</p>
                <h2 id="kk-age-title" style={{ ...titleStyle, marginTop: 12 }}>
                  Are you 21 or older?
                </h2>
                <p id="kk-age-desc" style={{ ...bodyStyle, marginTop: 12 }}>
                  You must be at least {MIN_AGE} years old to enter. Please enter your
                  date of birth.
                </p>
                <p style={{ ...footnote, marginTop: 6 }}>Today is {todayLabel}.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr)', gap: 10, marginTop: 22 }}>
                  <label style={{ display: 'block' }}>
                    <span style={labelStyle}>Month</span>
                    <select
                      ref={firstFieldRef}
                      className="kk-input"
                      value={month || ''}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      required
                      aria-required="true"
                      style={selectStyle}
                    >
                      <option value="" style={optStyle}>Month</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1} style={optStyle}>{m}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'block' }}>
                    <span style={labelStyle}>Day</span>
                    <select
                      className="kk-input"
                      value={day || ''}
                      onChange={(e) => setDay(Number(e.target.value))}
                      required
                      aria-required="true"
                      style={selectStyle}
                    >
                      <option value="" style={optStyle}>Day</option>
                      {days.map((d) => (
                        <option key={d} value={d} style={optStyle}>{d}</option>
                      ))}
                    </select>
                  </label>

                  <label style={{ display: 'block' }}>
                    <span style={labelStyle}>Year</span>
                    <select
                      className="kk-input"
                      value={year || ''}
                      onChange={(e) => setYear(Number(e.target.value))}
                      required
                      aria-required="true"
                      style={selectStyle}
                    >
                      <option value="" style={optStyle}>Year</option>
                      {years.map((y) => (
                        <option key={y} value={y} style={optStyle}>{y}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {error && (
                  <p role="alert" style={errorStyle}>{error}</p>
                )}

                <button type="submit" className="kk-gold-btn" style={submitStyle}>
                  Enter
                </button>

                <p style={{ ...footnote, marginTop: 18, textAlign: 'center' }}>
                  By entering you confirm you are of legal drinking age. Please enjoy
                  responsibly.
                </p>
              </form>
            )}

            <p style={{ ...footnote, marginTop: 20, textAlign: 'center', color: DIM, borderTop: `1px solid ${LINE}`, paddingTop: 16 }}>
              Age verification required by CTIA SHAFT guidelines.
              {' '}
              <a href="/privacy" style={{ color: MUTED }}>Privacy</a>
              {' · '}
              <a href="/terms" style={{ color: MUTED }}>Terms</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const overlay: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(8,7,6,0.94)',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20, overflowY: 'auto',
};

const dialog: CSSProperties = {
  width: '100%', maxWidth: 440,
  background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)`,
  border: `1px solid ${LINE2}`, borderRadius: 18,
  padding: 'clamp(24px, 5vw, 36px)',
  boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
  maxHeight: '100%',
};

const eyebrowStyle: CSSProperties = {
  margin: 0, fontFamily: FB, fontSize: 10.5, letterSpacing: '2.6px',
  textTransform: 'uppercase', color: GOLD, fontWeight: 500, textAlign: 'center',
};

const titleStyle: CSSProperties = {
  margin: 0, fontFamily: FD, fontWeight: 700,
  fontSize: 'clamp(26px, 5vw, 33px)', lineHeight: 1.15, color: TEXT, textAlign: 'center',
};

const bodyStyle: CSSProperties = {
  margin: 0, fontFamily: FB, fontWeight: 300, fontSize: 14.5,
  color: CREAM, opacity: 0.88, lineHeight: 1.7, textAlign: 'center',
};

const footnote: CSSProperties = {
  margin: 0, fontFamily: FB, fontSize: 11.5, color: CREAM,
  opacity: 0.62, lineHeight: 1.65, textAlign: 'center',
};

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: CREAM, opacity: 0.72, marginBottom: 6, fontWeight: 500,
};

const selectStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(10,10,10,0.5)',
  border: `1px solid ${LINE2}`, borderRadius: 10, padding: '13px 11px',
  color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none', fontWeight: 300,
  cursor: 'pointer',
};

const optStyle: CSSProperties = { background: PANEL2, color: TEXT };

const errorStyle: CSSProperties = {
  margin: '16px 0 0', fontSize: 13, color: '#f0a9a9', lineHeight: 1.5,
  background: 'rgba(104,31,43,0.4)', border: '1px solid rgba(240,169,169,0.35)',
  borderRadius: 10, padding: '11px 14px', textAlign: 'center',
};

const submitStyle: CSSProperties = {
  display: 'block', width: '100%', marginTop: 22,
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`,
  color: INK, fontFamily: FB, fontWeight: 600, fontSize: 14,
  letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '16px 28px',
  cursor: 'pointer', lineHeight: 1.2,
  boxShadow: '0 8px 22px rgba(195,154,69,0.22)',
};
