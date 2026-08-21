// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Standalone SMS opt-in form — konqueredkocktails.com/sms-consent.
//
// Exists as its own page so A2P 10DLC review has a single URL that shows the
// consent flow start to finish: the fields, the unticked checkbox, the exact
// disclosure, and the policy links, with nothing else competing for
// attention.
//
// Posts to /api/subscribe, the same endpoint the /experiences capture uses,
// so there is exactly one consent-writing path. That route stores the
// verbatim disclosure, timestamp, IP and user-agent, and rate-limits per IP.
//
// On CSRF: this form has no session and no authenticated action to forge, so
// a token would protect nothing — there is no privileged state an attacker
// could act on by making a visitor submit it. The real controls are the
// per-IP rate limit and the fact that a submission grants no access.
//
// NO CONFIRMATION SMS IS SENT. There is no messaging number provisioned yet,
// so the success state says the consent is recorded rather than claiming a
// text is on its way.

import Link from 'next/link';
import { useState, type CSSProperties } from 'react';

import {
  INK, PANEL, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB,
} from '../theme';
import { LEGAL } from '../components/LegalPage';
import {
  SMS_CONSENT_TEXT, SMS_FREQUENCY, SMS_PROGRAM_DESCRIPTION,
  SMS_RATES_DISCLOSURE, SMS_NO_SHARING,
} from '@/lib/sms';

type Errors = Partial<Record<'name' | 'email' | 'phone' | 'consent', string>>;

export default function SmsConsentClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');

    const next: Errors = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Please enter a valid email address.';
    if (phone.replace(/\D/g, '').length < 10) next.phone = 'Please enter a valid mobile number.';
    // On THIS page the checkbox is the point, so it is required here even
    // though it is optional on the /experiences capture.
    if (!consent) next.consent = 'Please tick the box to agree to receive texts.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone,
          sms_consent: true,
          consent_text: SMS_CONSENT_TEXT,
          source: 'sms-consent',
          source_url: window.location.href,
          goal: 'SMS opt-in',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" style={{ ...cardStyle, textAlign: 'center' }}>
        <span aria-hidden="true" style={{ fontSize: 42, lineHeight: 1 }}>✓</span>
        <h2 style={{ margin: '14px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 27, lineHeight: 1.15, color: TEXT }}>
          Your consent is recorded.
        </h2>
        <p style={{ margin: '12px auto 0', maxWidth: 380, fontSize: 14, color: CREAM, opacity: 0.85, lineHeight: 1.7 }}>
          We&rsquo;ve saved your preference along with the exact wording you agreed to,
          the time, and your device details.
        </p>
        <p style={{ margin: '14px auto 0', maxWidth: 400, fontSize: 12.5, color: CREAM, opacity: 0.6, lineHeight: 1.65 }}>
          Our messaging number is still being provisioned, so no text has been sent yet.
          Your first message will arrive once it&rsquo;s live. You can withdraw at any
          time by replying STOP, or by calling {LEGAL.phone}.
        </p>
        <Link href="/experiences" className="kk-ghost-btn" style={{ ...ghostButton, marginTop: 22 }}>
          See the Experience Collection
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate style={cardStyle}>
      <Field label="Full name" error={errors.name}>
        <input className="kk-input" style={inputStyle} value={name} autoComplete="name"
          onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Email address" error={errors.email}>
        <input className="kk-input" style={inputStyle} type="email" value={email} autoComplete="email"
          onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Mobile number" error={errors.phone}>
        <input className="kk-input" style={inputStyle} type="tel" value={phone} autoComplete="tel"
          placeholder="(314) 555-0123"
          onChange={(e) => setPhone(e.target.value)} />
      </Field>

      {/* Affirmative-consent statement, stated before the checkbox rather
          than only inside its label, so a reviewer sees it without having to
          read the control. */}
      <div style={{
        marginTop: 24, padding: '16px 18px', borderRadius: 12,
        background: 'rgba(10,10,10,0.32)', border: `1px solid ${LINE2}`,
      }}>
        <p style={{ margin: 0, fontFamily: FB, fontSize: 13, color: CREAM, opacity: 0.9, lineHeight: 1.7 }}>
          By providing your phone number and checking the box below, you are giving
          Konquered Kocktails your affirmative consent to send you SMS messages.
          Message frequency: {SMS_FREQUENCY}. {SMS_RATES_DISCLOSURE}
        </p>
        <p style={{ margin: '10px 0 0', fontFamily: FB, fontSize: 12.5, color: CREAM, opacity: 0.72, lineHeight: 1.7 }}>
          <strong style={{ color: TEXT, fontWeight: 500 }}>What you&rsquo;ll receive:</strong>{' '}
          {SMS_PROGRAM_DESCRIPTION}
        </p>
        <p style={{ margin: '10px 0 0', fontFamily: FB, fontSize: 12.5, color: CREAM, opacity: 0.72, lineHeight: 1.7 }}>
          I agree to Konquered Kocktails&rsquo;{' '}
          <Link href="/privacy" style={{ color: GOLD, fontWeight: 500 }}>Privacy Policy</Link>
          {' and '}
          <Link href="/terms" style={{ color: GOLD, fontWeight: 500 }}>Terms &amp; Conditions</Link>.
        </p>
      </div>

      <label style={{ display: 'flex', gap: 11, alignItems: 'flex-start', marginTop: 18, cursor: 'pointer' }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
          style={{ marginTop: 3, width: 18, height: 18, accentColor: GOLD, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, color: CREAM, opacity: 0.82, lineHeight: 1.65 }}>
          {SMS_CONSENT_TEXT}
        </span>
      </label>
      {errors.consent && (
        <p style={{ margin: '8px 0 0 29px', fontSize: 12.5, color: '#f0a9a9' }}>{errors.consent}</p>
      )}

      <p style={{ margin: '14px 0 0 29px', fontSize: 12, color: CREAM, opacity: 0.6, lineHeight: 1.6 }}>
        Full detail on our{' '}
        <Link href="/sms-compliance" style={{ color: GOLD }}>SMS Program page</Link>.
      </p>

      {error && <p role="alert" style={errorText}>{error}</p>}

      <button type="submit" disabled={busy} className="kk-gold-btn"
        style={{ ...goldButton, display: 'block', width: '100%', marginTop: 24, opacity: busy ? 0.7 : 1 }}>
        {busy ? 'Recording…' : 'Opt In to Text Messages'}
      </button>

      {/* Form footer — restates the commitment after the button, where a
          reviewer checking the submit path will see it. */}
      <p style={{ margin: '16px 0 0', fontFamily: FB, fontSize: 11.5, color: CREAM, opacity: 0.58, lineHeight: 1.7, textAlign: 'center' }}>
        {SMS_NO_SHARING}
      </p>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginTop: 16 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {error && <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: '#f0a9a9' }}>{error}</span>}
    </label>
  );
}

const cardStyle: CSSProperties = {
  background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)`,
  border: `1px solid ${LINE2}`, borderRadius: 18,
  padding: 'clamp(22px, 3.4vw, 34px)',
};

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: CREAM, opacity: 0.7, marginBottom: 8, fontWeight: 500,
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(10,10,10,0.42)',
  border: `1px solid ${LINE2}`, borderRadius: 10, padding: '14px 15px',
  color: TEXT, fontFamily: FB, fontSize: 16, outline: 'none', fontWeight: 300,
};

const goldButton: CSSProperties = {
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`,
  color: INK, fontFamily: FB, fontWeight: 600, fontSize: 13,
  letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '16px 28px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2, textAlign: 'center',
  boxShadow: '0 8px 22px rgba(195,154,69,0.22)',
};

const ghostButton: CSSProperties = {
  display: 'inline-block', background: 'transparent', color: CREAM,
  fontFamily: FB, fontWeight: 500, fontSize: 12, letterSpacing: '1.4px',
  textTransform: 'uppercase', border: `1px solid ${LINE2}`, borderRadius: 999,
  padding: '13px 24px', cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2,
};

const errorText: CSSProperties = {
  margin: '16px 0 0', fontSize: 13, color: '#f0a9a9', lineHeight: 1.5,
  background: 'rgba(104,31,43,0.35)', border: '1px solid rgba(240,169,169,0.3)',
  borderRadius: 10, padding: '11px 14px',
};
