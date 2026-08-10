// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Shared shell for the compliance pages (/terms, /privacy, /sms-consent,
// /sms-compliance). Brand-styled, mobile-first, publicly reachable with no
// auth, and cross-linked to each other — A2P 10DLC review checks that the
// policy links on a consent form actually resolve.
//
// Long-form prose here, so measure is capped around 68ch and the type is
// bigger than the marketing pages. Reading a privacy policy at 13px on a
// phone is its own kind of dark pattern.

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

import {
  INK, PANEL, GOLD, GOLD_HI, GOLD_D, CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB, CONTACT,
} from '../theme';

/** Single source for the entity details that appear across all four pages. */
export const LEGAL = {
  entity: 'Konquered Balance LLC',
  dba: 'Konquered Kocktails',
  address: '920 Hemsath, Suite 100, St. Charles, MO 63303',
  city: 'St. Charles',
  state: 'Missouri',
  phone: CONTACT.phone,
  phoneE164: '+13145039198',
  email: CONTACT.email,
  site: 'https://konqueredkocktails.com',
  siteLabel: 'konqueredkocktails.com',
};

export const LAST_UPDATED = 'August 1, 2026';

export default function LegalPage({
  eyebrow, title, intro, children, draft,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
  /** Shows a review banner. Set on pages whose legal wording still needs
   *  counsel — better to say so on the page than to let it read as final. */
  draft?: boolean;
}) {
  return (
    <main style={{ background: INK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{KEYFRAMES}</style>

      <header style={headerStyle}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <Image src="/images/kbalance-logo.jpg" alt="Konquered Kocktails" width={42} height={42}
              style={{ height: 42, width: 42, display: 'block', borderRadius: '50%', border: `1px solid ${LINE2}` }} />
            <span style={{ lineHeight: 1 }}>
              <span style={{ display: 'block', fontFamily: FB, fontWeight: 600, fontSize: 20, letterSpacing: '0.02em', color: TEXT }}>
                Konquered Kocktails
              </span>
              <span style={{ display: 'block', fontFamily: FB, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginTop: 3, fontWeight: 500 }}>
                {eyebrow}
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto' }}>
            <Link href="/" className="kk-navlink" style={navLink}>Home</Link>
          </nav>
        </div>
      </header>

      <article style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(40px, 6vw, 72px) 20px clamp(40px, 6vw, 64px)' }}>
        <h1 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 'clamp(34px, 5.4vw, 54px)', lineHeight: 1.08 }}>
          {title}
        </h1>
        <p style={{ margin: '14px 0 0', fontFamily: FB, fontSize: 12, letterSpacing: '1.2px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>
          {LEGAL.entity} d/b/a {LEGAL.dba} · Last updated {LAST_UPDATED}
        </p>

        {draft && (
          <div role="note" style={{
            margin: '24px 0 0', background: 'rgba(104,31,43,0.30)',
            border: '1px solid rgba(240,169,169,0.35)', borderRadius: 12,
            padding: '14px 16px', fontSize: 13.5, color: CREAM, lineHeight: 1.65,
          }}>
            <strong style={{ color: GOLD, fontWeight: 600 }}>Draft pending legal review.</strong>{' '}
            This document describes how the site actually handles data today and is
            published so the messaging program can be reviewed. It has not been
            reviewed by an attorney and should be replaced with counsel-approved
            wording before it is relied upon.
          </div>
        )}

        {intro && (
          <p style={{ margin: '26px 0 0', fontSize: 'clamp(15px, 2vw, 17px)', color: CREAM, opacity: 0.86, lineHeight: 1.8 }}>
            {intro}
          </p>
        )}

        <div style={{ marginTop: 'clamp(26px, 4vw, 40px)' }}>{children}</div>

        {/* Cross-links. TCR checks that the policy links on a consent flow
            resolve, so every compliance page points at the other three. */}
        <nav aria-label="Compliance documents" style={{
          marginTop: 'clamp(36px, 5vw, 56px)', paddingTop: 'clamp(22px, 3vw, 30px)',
          borderTop: `1px solid ${LINE}`, display: 'flex', flexWrap: 'wrap', gap: 10,
        }}>
          <Link href="/privacy" className="kk-ghost-btn" style={ghostButton}>Privacy Policy</Link>
          <Link href="/terms" className="kk-ghost-btn" style={ghostButton}>Terms &amp; Conditions</Link>
          <Link href="/sms-consent" className="kk-ghost-btn" style={ghostButton}>SMS Opt-In</Link>
          <Link href="/sms-compliance" className="kk-ghost-btn" style={ghostButton}>SMS Program</Link>
        </nav>
      </article>

      <footer style={{ borderTop: `1px solid ${LINE}`, padding: 'clamp(28px, 4vw, 44px) 20px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', fontFamily: FB, fontSize: 12.5, color: MUTED, lineHeight: 1.9 }}>
          <strong style={{ color: TEXT, fontWeight: 500 }}>{LEGAL.entity}</strong> d/b/a {LEGAL.dba}
          <br />
          {LEGAL.address}
          <br />
          <a href={`tel:${LEGAL.phoneE164}`} className="kk-contact" style={{ color: GOLD, textDecoration: 'none' }}>{LEGAL.phone}</a>
          {' · '}
          <a href={`mailto:${LEGAL.email}`} className="kk-contact" style={{ color: GOLD, textDecoration: 'none' }}>{LEGAL.email}</a>
        </div>
      </footer>
    </main>
  );
}

/* ── Prose building blocks ────────────────────────────────────────── */

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 style={{
      margin: 'clamp(30px, 4vw, 42px) 0 0', fontFamily: FD, fontWeight: 700,
      fontSize: 'clamp(24px, 3.2vw, 31px)', lineHeight: 1.2, color: TEXT,
    }}>
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p style={{
      margin: '14px 0 0', fontFamily: FB, fontWeight: 300,
      fontSize: 'clamp(14.5px, 1.9vw, 16px)', color: MUTED, lineHeight: 1.8,
    }}>
      {children}
    </p>
  );
}

export function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'grid', gap: 9 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: 'flex', gap: 10, alignItems: 'flex-start',
          fontFamily: FB, fontWeight: 300, fontSize: 'clamp(14px, 1.8vw, 15.5px)',
          color: MUTED, lineHeight: 1.7,
        }}>
          <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, marginTop: 9, flexShrink: 0 }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Verbatim message sample, shown as it would arrive on a handset. */
export function Sample({ label, body }: { label: string; body: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <span style={{ display: 'block', fontFamily: FB, fontSize: 10, letterSpacing: '1.6px', textTransform: 'uppercase', color: DIM, fontWeight: 500, marginBottom: 7 }}>
        {label}
      </span>
      <blockquote style={{
        margin: 0, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12,
        padding: '14px 16px', fontFamily: FB, fontSize: 14.5, color: CREAM,
        lineHeight: 1.65, whiteSpace: 'pre-wrap',
      }}>
        {body}
      </blockquote>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const headerStyle: CSSProperties = {
  position: 'sticky', top: 0, zIndex: 50,
  background: 'rgba(10,10,10,0.86)',
  backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${LINE}`,
};

const navLink: CSSProperties = {
  fontFamily: FB, fontSize: 12, letterSpacing: '1.6px', textTransform: 'uppercase',
  fontWeight: 500, color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap',
};

const ghostButton: CSSProperties = {
  display: 'inline-block', background: 'transparent', color: CREAM,
  fontFamily: FB, fontWeight: 500, fontSize: 11.5, letterSpacing: '1.3px',
  textTransform: 'uppercase', border: `1px solid ${LINE2}`, borderRadius: 999,
  padding: '11px 18px', cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
};

export const legalGoldButton: CSSProperties = {
  display: 'inline-block',
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`,
  color: INK, fontFamily: FB, fontWeight: 600, fontSize: 13,
  letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '15px 28px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2, textAlign: 'center',
  boxShadow: '0 8px 22px rgba(195,154,69,0.22)',
};

const KEYFRAMES = `
.kk-navlink{transition:color .2s ease}
.kk-navlink:hover{color:${GOLD}}
.kk-contact{transition:opacity .2s ease}
.kk-contact:hover{opacity:.82}
.kk-ghost-btn{transition:border-color .2s ease, color .2s ease, background .2s ease}
.kk-ghost-btn:hover{border-color:${GOLD};color:${GOLD};background:rgba(195,154,69,0.06)}
.kk-gold-btn{transition:transform .18s ease, box-shadow .18s ease, filter .18s ease}
.kk-gold-btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.05)}
.kk-input:focus{border-color:${GOLD}!important;box-shadow:0 0 0 3px rgba(195,154,69,0.13)}
`;
