// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// The Experience Collection — konqueredkocktails.com/experiences.
//
// Order is deliberate: capture, then the Journey, then the Collection. The
// visitor gives their details before they've read the pricing, while intent
// is highest; the Journey then earns the prices that follow by showing the
// three-week design process behind them.
//
// SMS consent is opt-IN, unticked, and never a condition of submitting —
// the form works fine with it left alone. The exact disclosure shown is sent
// with the submission and stored verbatim, because TCPA consent has to be
// provable against the language the person actually saw. See
// app/api/subscribe/route.ts.
//
// No text is sent today: Konquered Balance has no Twilio number provisioned,
// so the confirmation says the consent is banked rather than promising a
// message that cannot arrive.

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type CSSProperties } from 'react';

import {
  INK, PANEL, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D,
  GARNET, AMETHYST, CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB, CONTACT,
} from '../theme';
import {
  ExperienceCollection, ExperienceJourney, JourneyIntro, BeginTheConversation,
} from '../components/ExperienceCollection';

/** Stored verbatim with the consent record. Changing this wording changes
 *  what future visitors agree to; it never alters an existing record. */
const SMS_CONSENT_TEXT =
  'I agree to receive text messages from Konquered Kocktails about experiences, ' +
  'availability, and offers at the number provided. Consent is not a condition of ' +
  'any purchase. Message frequency varies. Message and data rates may apply. ' +
  'Reply STOP to opt out, HELP for help.';

type Errors = Partial<Record<'name' | 'email' | 'phone', string>>;

export default function ExperiencesClient() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ smsPending: boolean } | null>(null);

  /* Arriving from a specific offering keeps that context on the enquiry. */
  const [fromExperience, setFromExperience] = useState('');
  useEffect(() => {
    const x = new URLSearchParams(window.location.search).get('experience');
    if (x) setFromExperience(x);
  }, []);

  function validate(): boolean {
    const next: Errors = {};
    if (!name.trim()) next.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Please enter a valid email address.';
    if (phone.replace(/\D/g, '').length < 10) next.phone = 'Please enter a valid mobile number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!validate()) return;

    setBusy(true);
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone,
          sms_consent: smsConsent,
          consent_text: smsConsent ? SMS_CONSENT_TEXT : '',
          experience_key: fromExperience,
          source: 'experiences',
          source_url: window.location.href,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      setDone({ smsPending: Boolean(data?.sms_pending_number) });
    } catch {
      setError('Network error. Please check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <main style={{ background: INK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{KEYFRAMES}</style>

      {/* ── Header ─────────────────────────────────────────────── */}
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
                The Experience Collection
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/portfolio" className="kk-navlink" style={navLink}>Event Log</Link>
            <Link href="/book" className="kk-gold-btn" style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
              Reserve a Date
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero + lead capture ────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(48px, 7vw, 88px) 20px clamp(28px, 4vw, 44px)', overflow: 'hidden' }}>
        <div aria-hidden="true" style={glowBackdrop} />
        <div className="kk-fade-up" style={{ position: 'relative', zIndex: 2, maxWidth: 1080, margin: '0 auto' }}>
          <div style={{
            display: 'grid', gap: 'clamp(26px, 4vw, 48px)',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'center',
          }}>
            <div>
              <span style={eyebrow}>
                <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
                Intention is the experience
              </span>
              <h1 style={{ margin: '20px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(38px, 6vw, 68px)', lineHeight: 1.05 }}>
                The Experience <span style={{ color: GOLD, fontWeight: 600 }}>Collection</span>
              </h1>
              <p style={{ margin: '20px 0 0', color: CREAM, opacity: 0.85, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.75, maxWidth: 520, fontWeight: 300 }}>
                Seven ways into the work — from a single Kustom expression to a full
                on-site experience composed around your people, your atmosphere, and
                the story you are gathering to share.
              </p>
              <p style={{ margin: '16px 0 0', color: MUTED, fontSize: 13.5, lineHeight: 1.7, maxWidth: 520 }}>
                Tell Stephen where to send the collection and he&rsquo;ll follow up
                personally. Konquered Kocktails accepts a limited number of
                experiences each month.
              </p>
            </div>

            {/* ── The capture ────────────────────────────────── */}
            <div style={{
              background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)`,
              border: `1px solid ${LINE2}`, borderRadius: 18,
              padding: 'clamp(22px, 3vw, 32px)',
            }}>
              {done ? (
                <div role="status" style={{ textAlign: 'center', padding: '10px 0' }}>
                  <span aria-hidden="true" style={{ fontSize: 40, lineHeight: 1 }}>🥃</span>
                  <h2 style={{ margin: '14px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 27, lineHeight: 1.15 }}>
                    Thank you.
                  </h2>
                  <p style={{ margin: '12px auto 0', maxWidth: 320, fontSize: 14, color: CREAM, opacity: 0.86, lineHeight: 1.7, fontWeight: 300 }}>
                    Stephen will be in touch personally. The collection is below —
                    have a look while you wait.
                  </p>
                  {done.smsPending && (
                    <p style={{ margin: '14px auto 0', maxWidth: 340, fontSize: 12, color: CREAM, opacity: 0.62, lineHeight: 1.65 }}>
                      Your text preference is saved. Konquered Kocktails&rsquo; texting
                      number is still being set up, so the first message will arrive
                      once it&rsquo;s live.
                    </p>
                  )}
                  <a href="#collection" className="kk-ghost-btn" style={{ ...ghostButton, marginTop: 20 }}>
                    See the collection
                  </a>
                </div>
              ) : (
                <form onSubmit={submit} noValidate>
                  <h2 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 26, lineHeight: 1.15 }}>
                    Begin the conversation
                  </h2>
                  <p style={{ margin: '8px 0 0', fontSize: 13, color: CREAM, opacity: 0.72, lineHeight: 1.6 }}>
                    Three details. No obligation.
                  </p>

                  <Field label="Your name" error={errors.name}>
                    <input className="kk-input" style={inputStyle} value={name} autoComplete="name"
                      onChange={(e) => setName(e.target.value)} />
                  </Field>
                  <Field label="Email" error={errors.email}>
                    <input className="kk-input" style={inputStyle} type="email" value={email} autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Mobile" error={errors.phone}>
                    <input className="kk-input" style={inputStyle} type="tel" value={phone} autoComplete="tel"
                      onChange={(e) => setPhone(e.target.value)} />
                  </Field>

                  {/* Opt-IN. Unticked by default, and submitting without it works. */}
                  <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 18, cursor: 'pointer' }}>
                    <input type="checkbox" checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      style={{ marginTop: 3, width: 17, height: 17, accentColor: GOLD, flexShrink: 0 }} />
                    {/* TODO(Aaron): link Privacy + Terms here once those pages
                        exist. They are a hard prerequisite for A2P 10DLC
                        registration, so the texting number can't be approved
                        without them. Deliberately not linking yet — a dead
                        link inside a consent disclosure is worse than none. */}
                    <span style={{ fontSize: 11.5, color: CREAM, opacity: 0.75, lineHeight: 1.6 }}>
                      {SMS_CONSENT_TEXT}
                    </span>
                  </label>

                  {error && <p role="alert" style={errorText}>{error}</p>}

                  <button type="submit" disabled={busy} className="kk-gold-btn"
                    style={{ ...goldButton, display: 'block', width: '100%', marginTop: 22, padding: '16px 24px', fontSize: 13, opacity: busy ? 0.7 : 1 }}>
                    {busy ? 'Sending…' : 'Send Me the Collection'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Journey ────────────────────────────────────────── */}
      <section id="journey" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) 20px' }}>
        <span style={eyebrow}>
          <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          The Konquered Experience Journey
        </span>
        <h2 style={{ margin: '18px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.06 }}>
          Five movements, one <em style={{ color: GOLD, fontStyle: 'normal' }}>intention</em>
        </h2>
        <JourneyIntro />
        <ExperienceJourney />
      </section>

      <GoldDivider />

      {/* ── The Collection ─────────────────────────────────────── */}
      <section id="collection" style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(28px, 4vw, 48px) 20px clamp(20px, 3vw, 32px)', scrollMarginTop: 84 }}>
        <span style={eyebrow}>
          <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
          The Collection
        </span>
        <h2 style={{ margin: '18px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.06 }}>
          Kocktails as a <em style={{ color: GOLD, fontStyle: 'normal' }}>medium</em>
        </h2>
        <ExperienceCollection />
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px clamp(48px, 7vw, 84px)' }}>
        <BeginTheConversation href="/book" />
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

/* ── Pieces ───────────────────────────────────────────────────────── */

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginTop: 16 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {error && <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: '#f0a9a9' }}>{error}</span>}
    </label>
  );
}

function GoldDivider() {
  return (
    <div aria-hidden="true" style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px' }}>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${LINE2}, transparent)`, marginTop: 'clamp(24px, 4vw, 44px)' }} />
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

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: CREAM, opacity: 0.7, marginBottom: 8, fontWeight: 500,
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(10,10,10,0.42)',
  border: `1px solid ${LINE2}`, borderRadius: 10, padding: '14px 15px',
  color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none', fontWeight: 300,
};

const goldButton: CSSProperties = {
  display: 'inline-block',
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`,
  color: INK, fontFamily: FB, fontWeight: 600, fontSize: 13,
  letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '15px 28px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2, textAlign: 'center',
  boxShadow: '0 8px 22px rgba(195,154,69,0.22)',
};

const ghostButton: CSSProperties = {
  display: 'inline-block', background: 'transparent', color: CREAM,
  fontFamily: FB, fontWeight: 500, fontSize: 12, letterSpacing: '1.4px',
  textTransform: 'uppercase', border: `1px solid ${LINE2}`, borderRadius: 999,
  padding: '13px 24px', cursor: 'pointer', textDecoration: 'none',
  lineHeight: 1.2, textAlign: 'center',
};

const errorText: CSSProperties = {
  margin: '16px 0 0', fontSize: 13, color: '#f0a9a9', lineHeight: 1.5,
  background: 'rgba(104,31,43,0.35)', border: '1px solid rgba(240,169,169,0.3)',
  borderRadius: 10, padding: '11px 14px',
};

const KEYFRAMES = `
.kk-fade-up{animation:kkFadeUp .9s .05s both}
.kk-navlink{transition:color .2s ease}
.kk-navlink:hover{color:${GOLD}}
.kk-contact{transition:opacity .2s ease}
.kk-contact:hover{opacity:.82}
.kk-gold-btn{transition:transform .18s ease, box-shadow .18s ease, filter .18s ease}
.kk-gold-btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 12px 28px rgba(195,154,69,0.34)}
.kk-ghost-btn{transition:border-color .2s ease, color .2s ease, background .2s ease}
.kk-ghost-btn:hover{border-color:${GOLD};color:${GOLD};background:rgba(195,154,69,0.06)}
.kk-card{transition:transform .22s ease, border-color .22s ease}
.kk-card:hover{transform:translateY(-3px);border-color:${LINE2}}
.kk-input:focus{border-color:${GOLD}!important;box-shadow:0 0 0 3px rgba(195,154,69,0.13)}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media (max-width:720px){
  .kk-tiers thead{display:none}
  .kk-tiers tr{display:block;padding:10px 0;border-bottom:1px solid rgba(232,216,184,0.10)}
  .kk-tiers td,.kk-tiers th{display:flex;justify-content:space-between;gap:14px;border:none!important;padding:4px 0!important;text-align:left!important}
  .kk-tiers td::before,.kk-tiers th::before{content:attr(data-label);font-size:10px;letter-spacing:1.2px;text-transform:uppercase;opacity:.55;flex-shrink:0}
}
@media (prefers-reduced-motion: reduce){
  .kk-fade-up{animation:none!important}
  .kk-card:hover,.kk-gold-btn:hover{transform:none!important}
}
`;
