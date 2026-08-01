// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Konquered Kocktails booking calendar — konqueredkocktails.com/book.
//
// The official booking flow. Availability is REAL: the portal computes it as
// weekly rules − blackout blocks − existing bookings, so a slot shown here
// cannot already be taken. This replaces the homepage's old client-side
// buildDays() + hardcoded SLOTS array, which showed the next six days at
// seven fixed times and happily let two guests book the same evening.
//
//   1. Experience + party size + details  → POST /api/book/lead  (captured
//      BEFORE payment, so an abandoned enquiry still reaches Stephen)
//   2. Date + time                        → GET  /api/book/availability
//   3. $200 deposit                       → POST /api/book/deposit
//   4. Confirmed
//
// All three go through our own server routes, never straight to the portal:
// the tenant write key is secret. See lib/portal.ts.
//
// Pre-launch, those routes answer 402 { demo: true } because there's no
// portal tenant yet. Step 2 then offers provisional dates clearly labelled
// as such, and step 3 lands on the demo confirmation. Nothing pretends a
// real booking was made.

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import {
  INK, PANEL, PANEL2, GOLD, GOLD_HI, GOLD_D, GARNET, AMETHYST, EMERALD,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB, CONTACT, EXPERIENCES,
} from '../theme';

const TZ = 'America/Chicago';
const STEP_LABELS = ['Your event', 'Pick a date', 'Deposit', 'Booked'];
/** How far ahead the calendar looks. The portal caps its own range at 60. */
const WINDOW_DAYS = 60;

type Slot = { starts_at: string; duration_min: number };
type Day = { date: string; slots: Slot[] };
type Availability = { tz: string; days: Day[] };

type Lead = { name: string; phone: string; email: string; guests: string };
type FieldErrors = Partial<Record<'name' | 'phone' | 'email', string>>;

/* ── Date helpers ────────────────────────────────────────────────────
   The portal returns 'YYYY-MM-DD' day keys and full ISO instants for
   slots. Format the day key without constructing a Date from it —
   `new Date('2026-08-03')` parses as UTC midnight and renders as the
   previous day for anyone west of Greenwich. */
function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function labelForDayKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  const local = new Date(y, m - 1, d);
  return {
    dow: local.toLocaleDateString('en-US', { weekday: 'short' }),
    md: local.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    month: local.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
  };
}

function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: TZ,
  });
}

/** Provisional dates for demo mode only — never used once the portal
 *  answers. Deliberately sparse so it doesn't read as real availability. */
function demoDays(): Day[] {
  const out: Day[] = [];
  const d = new Date();
  for (let i = 0; out.length < 8; i++) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 0 || dow === 1) continue; // closed Sun/Mon in the demo
    const key = ymd(d);
    out.push({
      date: key,
      slots: ['17:00', '19:00', '21:00'].map((t) => {
        const [hh, mm] = t.split(':').map(Number);
        const [Y, M, D] = key.split('-').map(Number);
        return { starts_at: new Date(Y, M - 1, D, hh, mm).toISOString(), duration_min: 150 };
      }),
    });
  }
  return out;
}

export default function BookClient() {
  const [step, setStep] = useState(1);

  const [experience, setExperience] = useState(EXPERIENCES[0].key);
  const [lead, setLead] = useState<Lead>({ name: '', phone: '', email: '', guests: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [leadBusy, setLeadBusy] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [bookingId, setBookingId] = useState('');

  const [days, setDays] = useState<Day[]>([]);
  const [dayKey, setDayKey] = useState('');
  const [slot, setSlot] = useState<Slot | null>(null);
  const [availBusy, setAvailBusy] = useState(false);
  const [availError, setAvailError] = useState('');
  const [demo, setDemo] = useState(false);

  const [depositBusy, setDepositBusy] = useState(false);
  const [depositError, setDepositError] = useState('');

  const chosen = useMemo(
    () => EXPERIENCES.find((e) => e.key === experience) ?? EXPERIENCES[0],
    [experience],
  );

  const whenDisplay = useMemo(() => {
    if (!dayKey || !slot) return '';
    const { dow, md } = labelForDayKey(dayKey);
    return `${dow}, ${md} at ${timeOf(slot.starts_at)}`;
  }, [dayKey, slot]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    /* Stripe returns the guest to /book?booked=1. */
    if (params.get('booked') === '1') setStep(4);
    /* Homepage package cards deep-link with the experience preselected.
       Ignore an unknown key rather than landing on a blank selection. */
    const pre = params.get('experience');
    if (pre && EXPERIENCES.some((x) => x.key === pre)) setExperience(pre);
  }, []);

  /* ── Step 2: real availability ─────────────────────────────────── */
  const loadAvailability = useCallback(async () => {
    setAvailBusy(true);
    setAvailError('');
    const from = new Date();
    from.setDate(from.getDate() + 1);
    const to = new Date();
    to.setDate(to.getDate() + WINDOW_DAYS);

    try {
      const res = await fetch(
        `/api/book/availability?from=${ymd(from)}&to=${ymd(to)}&experience_key=${encodeURIComponent(experience)}`,
      );
      const data = await res.json().catch(() => ({}));

      if (res.status === 402 || data?.demo) {
        // No portal tenant yet. Show provisional dates, clearly labelled.
        setDemo(true);
        const d = demoDays();
        setDays(d);
        setDayKey(d[0]?.date ?? '');
        return;
      }
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      const withSlots: Day[] = (data.days ?? []).filter((d: Day) => d.slots?.length);
      setDays(withSlots);
      setDayKey(withSlots[0]?.date ?? '');
      if (!withSlots.length) {
        setAvailError(
          'No open dates in the next two months. Call or email and Stephen will find you a date.',
        );
      }
    } catch (err) {
      setAvailError(
        err instanceof Error ? err.message : 'Could not load available dates.',
      );
    } finally {
      setAvailBusy(false);
    }
  }, [experience]);

  useEffect(() => {
    if (step === 2) loadAvailability();
  }, [step, loadAvailability]);

  const slotsForDay = useMemo(
    () => days.find((d) => d.date === dayKey)?.slots ?? [],
    [days, dayKey],
  );

  /* Group day chips by month so a 60-day window stays readable. */
  const monthGroups = useMemo(() => {
    const groups: { month: string; days: Day[] }[] = [];
    for (const d of days) {
      const { month } = labelForDayKey(d.date);
      const last = groups[groups.length - 1];
      if (last && last.month === month) last.days.push(d);
      else groups.push({ month, days: [d] });
    }
    return groups;
  }, [days]);

  /* ── Step 1 submit ─────────────────────────────────────────────── */
  function validateLead(): boolean {
    const next: FieldErrors = {};
    if (!lead.name.trim()) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) next.email = 'Please enter a valid email address.';
    if (lead.phone.replace(/\D/g, '').length < 10) next.phone = 'Please enter a valid mobile number.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!validateLead() || leadBusy) return;
    setLeadBusy(true);
    setLeadError('');
    try {
      const res = await fetch('/api/book/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          guest_count: lead.guests,
          goal: chosen.name,
          experience_key: chosen.key,
          experience_display: chosen.name,
          source_url: window.location.href,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.booking_id) setBookingId(data.booking_id);
      // A capture failure must not block the guest from booking — the
      // deposit step re-sends every field, so nothing is lost.
      if (!res.ok && res.status !== 402) {
        console.warn('[book] lead capture failed:', data?.error);
      }
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setLeadBusy(false);
    }
  }

  /* ── Step 3: deposit ───────────────────────────────────────────── */
  async function payDeposit() {
    if (depositBusy || !slot) return;
    setDepositBusy(true);
    setDepositError('');
    try {
      const res = await fetch('/api/book/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          guest_count: lead.guests,
          experience_key: chosen.key,
          experience_display: chosen.name,
          event_starts_at: slot.starts_at,
          event_tz: TZ,
          when_display: whenDisplay,
          duration_min: slot.duration_min,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      if (res.status === 402) {
        setDemo(true);
        setStep(4);
        return;
      }
      setDepositError(data.error || 'Checkout could not start. Please try again.');
      setDepositBusy(false);
    } catch {
      setDepositError('Network error. Please check your connection and try again.');
      setDepositBusy(false);
    }
  }

  function reset() {
    setStep(1);
    setLead({ name: '', phone: '', email: '', guests: '' });
    setErrors({});
    setSlot(null);
    setDayKey('');
    setBookingId('');
    setDepositBusy(false);
    setDepositError('');
  }

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
                Reserve a Date
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/" className="kk-navlink" style={navLink}>Home</Link>
            <Link href="/portfolio" className="kk-navlink" style={navLink}>Event Log</Link>
          </nav>
        </div>
      </header>

      <section style={{ position: 'relative', padding: 'clamp(48px, 7vw, 84px) 20px clamp(20px, 3vw, 32px)', overflow: 'hidden' }}>
        <div aria-hidden="true" style={glowBackdrop} />
        <div className="kk-fade-up" style={{ position: 'relative', zIndex: 2, maxWidth: 780, margin: '0 auto', textAlign: 'center' }}>
          <span style={eyebrow}>
            <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
            The Booking Calendar
          </span>
          <h1 style={{ margin: '20px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(38px, 6.4vw, 68px)', lineHeight: 1.05 }}>
            Reserve the <span style={{ color: GOLD, fontWeight: 600 }}>room</span>.
          </h1>
          <p style={{ margin: '20px auto 0', color: CREAM, opacity: 0.84, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.75, maxWidth: 560, fontWeight: 300 }}>
            Stephen designs one experience at a time, around your space and your people.
            Pick a date that&rsquo;s genuinely open — this calendar is his.
          </p>
        </div>
      </section>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px clamp(56px, 8vw, 96px)' }}>
        <Stepper step={step} />

        <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 18, padding: 'clamp(22px, 3.4vw, 34px)', marginTop: 22 }}>

          {/* ── Step 1 ─────────────────────────────────────────── */}
          {step === 1 && (
            <form onSubmit={submitLead} noValidate>
              <h2 style={stepHeading}>Tell Stephen about the event</h2>

              <fieldset style={fieldset}>
                <legend style={legend}>The experience</legend>
                <div style={{ display: 'grid', gap: 8 }}>
                  {EXPERIENCES.map((x) => {
                    const on = experience === x.key;
                    return (
                      <button key={x.key} type="button" onClick={() => setExperience(x.key)}
                        aria-pressed={on} className="kk-pill"
                        style={{
                          textAlign: 'left', padding: '13px 15px', borderRadius: 10, cursor: 'pointer',
                          background: on ? 'rgba(195,154,69,0.10)' : PANEL2,
                          border: `1px solid ${on ? GOLD : LINE}`,
                          color: TEXT, fontFamily: FB, lineHeight: 1.35,
                        }}>
                        <span style={{ display: 'block', fontFamily: FD, fontSize: 19, fontWeight: 700, color: on ? GOLD : TEXT }}>
                          {x.name}
                        </span>
                        <span style={{ display: 'block', fontSize: 12.5, color: MUTED, marginTop: 3, fontWeight: 300 }}>
                          {x.tagline}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset style={fieldset}>
                <legend style={legend}>Your details</legend>
                <Field label="Full name" error={errors.name}>
                  <input className="kk-input" style={input} value={lead.name} autoComplete="name"
                    onChange={(e) => setLead({ ...lead, name: e.target.value })} />
                </Field>
                <Field label="Email" error={errors.email}>
                  <input className="kk-input" style={input} type="email" value={lead.email} autoComplete="email"
                    onChange={(e) => setLead({ ...lead, email: e.target.value })} />
                </Field>
                <Field label="Mobile" error={errors.phone}>
                  <input className="kk-input" style={input} type="tel" value={lead.phone} autoComplete="tel"
                    onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
                </Field>
                <Field label="Roughly how many guests?">
                  <input className="kk-input" style={input} inputMode="numeric" value={lead.guests}
                    placeholder="e.g. 25"
                    onChange={(e) => setLead({ ...lead, guests: e.target.value })} />
                </Field>
              </fieldset>

              {leadError && <p style={errorText}>{leadError}</p>}

              <button type="submit" disabled={leadBusy} className="kk-gold-btn"
                style={{ ...goldButton, display: 'block', width: '100%', marginTop: 26, padding: '17px 24px', fontSize: 14, opacity: leadBusy ? 0.7 : 1 }}>
                {leadBusy ? 'One moment…' : 'See Available Dates →'}
              </button>
            </form>
          )}

          {/* ── Step 2 ─────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <h2 style={stepHeading}>Pick a date</h2>
              <p style={{ margin: '10px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.6, fontWeight: 300 }}>
                {chosen.name} · {chosen.duration}
              </p>

              {demo && (
                <div role="note" style={noteBox}>
                  <strong style={{ color: GOLD, fontWeight: 600 }}>Provisional dates.</strong>{' '}
                  Stephen&rsquo;s live calendar isn&rsquo;t connected yet, so these are
                  placeholders — nothing here is confirmed or charged. Call{' '}
                  <a href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} style={{ color: GOLD }}>{CONTACT.phone}</a>{' '}
                  to lock a real date today.
                </div>
              )}

              {availBusy && <p style={{ margin: '22px 0 0', color: MUTED, fontSize: 14 }}>Checking the calendar…</p>}

              {!availBusy && availError && (
                <div role="alert" style={noteBox}>
                  {availError}{' '}
                  <button type="button" onClick={loadAvailability} style={linkButton}>Try again</button>
                </div>
              )}

              {!availBusy && !!days.length && (
                <>
                  {monthGroups.map((g) => (
                    <div key={g.month} style={{ marginTop: 22 }}>
                      <span style={label}>{g.month}</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: 7 }}>
                        {g.days.map((d) => {
                          const { dow, md } = labelForDayKey(d.date);
                          const on = dayKey === d.date;
                          return (
                            <button key={d.date} type="button" className="kk-pill"
                              onClick={() => { setDayKey(d.date); setSlot(null); }}
                              aria-pressed={on}
                              style={{
                                padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                                background: on ? GOLD : PANEL2,
                                border: `1px solid ${on ? GOLD : LINE}`,
                                color: on ? INK : TEXT, fontFamily: FB, textAlign: 'center', lineHeight: 1.25,
                              }}>
                              <span style={{ display: 'block', fontSize: 10.5, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.75 }}>{dow}</span>
                              <span style={{ display: 'block', fontSize: 17, fontWeight: 600, marginTop: 2 }}>{md}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div style={{ marginTop: 26 }}>
                    <span style={label}>Start time</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 7 }}>
                      {slotsForDay.map((s) => {
                        const on = slot?.starts_at === s.starts_at;
                        return (
                          <button key={s.starts_at} type="button" className="kk-pill"
                            onClick={() => setSlot(s)} aria-pressed={on}
                            style={{
                              padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                              background: on ? GOLD : PANEL2,
                              border: `1px solid ${on ? GOLD : LINE}`,
                              color: on ? INK : TEXT, fontFamily: FB, fontSize: 14, fontWeight: on ? 600 : 400,
                            }}>
                            {timeOf(s.starts_at)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 28, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setStep(1)} className="kk-ghost-btn" style={ghostButton}>
                      Back
                    </button>
                    <button type="button" disabled={!slot} onClick={() => setStep(3)} className="kk-gold-btn"
                      style={{ ...goldButton, flex: 1, minWidth: 200, opacity: slot ? 1 : 0.45, cursor: slot ? 'pointer' : 'not-allowed' }}>
                      Continue →
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 3 ─────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <h2 style={stepHeading}>Hold the date</h2>
              <div style={{ marginTop: 20, background: PANEL2, border: `1px solid ${LINE}`, borderRadius: 12, padding: '18px 20px' }}>
                <Summary label="Experience" value={chosen.name} />
                <Summary label="When" value={whenDisplay} />
                {lead.guests && <Summary label="Guests" value={`about ${lead.guests}`} />}
                <Summary label="Name" value={lead.name} />
              </div>

              <div style={{ marginTop: 22, textAlign: 'center' }}>
                <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 42, color: GOLD, lineHeight: 1 }}>$200</span>
                <p style={{ margin: '8px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.6, fontWeight: 300 }}>
                  Applied in full to your final balance. Refundable up to 14 days before the event.
                </p>
              </div>

              {depositError && <p style={errorText}>{depositError}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setStep(2)} className="kk-ghost-btn" style={ghostButton}>Back</button>
                <button type="button" onClick={payDeposit} disabled={depositBusy} className="kk-gold-btn"
                  style={{ ...goldButton, flex: 1, minWidth: 220, opacity: depositBusy ? 0.7 : 1 }}>
                  {depositBusy ? 'Opening checkout…' : 'Pay Deposit & Confirm →'}
                </button>
              </div>
              <p style={{ margin: '16px 0 0', fontFamily: FB, fontSize: 11, color: DIM, textAlign: 'center', letterSpacing: '0.6px' }}>
                Secure checkout by Stripe. Your card details never touch this site.
              </p>
            </div>
          )}

          {/* ── Step 4 ─────────────────────────────────────────── */}
          {step === 4 && (
            <div style={{ textAlign: 'center' }}>
              <span aria-hidden="true" style={{ fontSize: 44, lineHeight: 1 }}>🥃</span>
              <h2 style={{ ...stepHeading, marginTop: 14 }}>
                {demo ? 'That’s the flow' : 'Your date is held'}
              </h2>
              {demo ? (
                <p style={{ margin: '14px auto 0', maxWidth: 420, fontSize: 14.5, color: MUTED, lineHeight: 1.7, fontWeight: 300 }}>
                  <strong style={{ color: GOLD, fontWeight: 600 }}>Demo mode — no live charge.</strong>{' '}
                  Deposits go live once Stephen&rsquo;s Stripe account is connected. To book
                  for real right now, call{' '}
                  <a href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} style={{ color: GOLD }}>{CONTACT.phone}</a>.
                </p>
              ) : (
                <p style={{ margin: '14px auto 0', maxWidth: 420, fontSize: 14.5, color: MUTED, lineHeight: 1.7, fontWeight: 300 }}>
                  Check your email for the receipt. Stephen will reach out within one
                  business day to design the experience around your room.
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 26, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/portfolio" className="kk-ghost-btn" style={ghostButton}>See past events</Link>
                <button type="button" onClick={reset} className="kk-ghost-btn" style={ghostButton}>Book another</button>
              </div>
            </div>
          )}
        </div>

        <p style={{ margin: '22px 0 0', textAlign: 'center', fontSize: 13, color: DIM, lineHeight: 1.7 }}>
          Prefer to talk it through?{' '}
          <a href={`tel:${CONTACT.phone.replace(/\D/g, '')}`} className="kk-contact" style={{ color: GOLD, textDecoration: 'none' }}>{CONTACT.phone}</a>
          {' · '}
          <a href={`mailto:${CONTACT.email}`} className="kk-contact" style={{ color: GOLD, textDecoration: 'none' }}>{CONTACT.email}</a>
        </p>
      </section>
    </main>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────── */

function Stepper({ step }: { step: number }) {
  return (
    <ol style={{ display: 'flex', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}>
      {STEP_LABELS.map((s, i) => {
        const n = i + 1;
        const done = step > n;
        const on = step === n;
        return (
          <li key={s} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 2, background: done || on ? GOLD : LINE }} />
            <span style={{
              display: 'block', marginTop: 8, fontFamily: FB, fontSize: 10.5,
              letterSpacing: '1.2px', textTransform: 'uppercase',
              color: on ? GOLD : done ? MUTED : DIM, fontWeight: 500,
            }}>
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label: text, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginTop: 16 }}>
      <span style={label}>{text}</span>
      {children}
      {error && <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, color: '#d98a8a' }}>{error}</span>}
    </label>
  );
}

function Summary({ label: text, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, padding: '6px 0', alignItems: 'baseline' }}>
      <span style={{ fontFamily: FB, fontSize: 11, letterSpacing: '1.2px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>{text}</span>
      <span style={{ fontFamily: FB, fontSize: 14, color: TEXT, textAlign: 'right' }}>{value}</span>
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
    `radial-gradient(64% 62% at 80% 44%, ${EMERALD}40 0%, transparent 62%)`,
    `radial-gradient(56% 58% at 20% 76%, ${GARNET}22 0%, transparent 60%)`,
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

const stepHeading: CSSProperties = {
  margin: 0, fontFamily: FD, fontWeight: 700,
  fontSize: 'clamp(26px, 3.6vw, 34px)', lineHeight: 1.1,
};

const label: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: DIM, marginBottom: 8, fontWeight: 500,
};

const legend: CSSProperties = { ...label, padding: 0, marginBottom: 12 };

const fieldset: CSSProperties = { border: 'none', padding: 0, margin: '26px 0 0', minWidth: 0 };

const input: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0c0b0a',
  border: `1px solid ${LINE}`, borderRadius: 10, padding: '14px 15px',
  color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none',
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
  fontFamily: FB, fontWeight: 500, fontSize: 13, letterSpacing: '1.4px',
  textTransform: 'uppercase', border: `1px solid ${LINE2}`, borderRadius: 999,
  padding: '15px 28px', cursor: 'pointer', textDecoration: 'none',
  lineHeight: 1.2, textAlign: 'center',
};

const linkButton: CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: GOLD, fontFamily: FB, fontSize: 'inherit', textDecoration: 'underline',
};

const noteBox: CSSProperties = {
  margin: '20px 0 0', background: 'rgba(195,154,69,0.07)',
  border: `1px solid ${LINE2}`, borderRadius: 12, padding: '14px 16px',
  fontSize: 13.5, color: CREAM, lineHeight: 1.65, fontWeight: 300,
};

const errorText: CSSProperties = { margin: '16px 0 0', fontSize: 13, color: '#d98a8a', lineHeight: 1.45 };

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
.kk-pill{transition:border-color .15s ease, background .15s ease, color .15s ease}
.kk-pill:hover{border-color:${GOLD}}
.kk-input:focus{border-color:${GOLD}!important}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){ .kk-fade-up{animation:none!important} }
`;
