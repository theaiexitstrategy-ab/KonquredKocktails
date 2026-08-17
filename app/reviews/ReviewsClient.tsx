// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Konquered Kocktails guest reviews — konqueredkocktails.com/reviews.
//
// Minimum friction: a rating and a few sentences is a complete submission.
// Everything else — name, email, event type, photos — is optional and says so.
//
// Submissions land unpublished. Stephen approves before anything appears in
// the strip below the form. Enforced twice: the API route hardcodes
// published: false, and the RLS policy on the table refuses an anon insert
// where published is true.
//
// Photos are downscaled and re-encoded in the browser before upload — a phone
// photo is 4-12 MB and would blow the serverless body limit three at a time.
// Long edge 1600px at JPEG q0.82 lands around 200-400 KB.

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  INK, PANEL, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D, BRONZE,
  GARNET, AMETHYST, CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB,
  CONTACT,
} from '../theme';
import { EXPERIENCE_COLLECTION, experienceBySlug } from '@/data/experiences';

const MAX_PHOTOS = 3;
const MAX_LONG_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/** The brief asks for a "generous" field with a 300-char minimum. A hard gate
 *  at 300 would reject a genuine two-sentence review, so this is a target: the
 *  counter encourages, it never blocks. */
const SUGGESTED_CHARS = 300;

const STAR_LABELS = ['', 'Not for me', 'It was fine', 'Good night', 'Really memorable', 'Unforgettable'];

type PublishedReview = {
  id: string;
  rating: number;
  review_text: string;
  event_type: string | null;
  guest_name: string | null;
  photos: string[];
  created_at: string;
};

/** Downscale + re-encode in a canvas. Returns a data URL, or null if the file
 *  isn't a decodable image. */
async function shrink(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return null;

  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  // Always JPEG out — normalizes HEIC from iPhones, which the bucket would
  // otherwise accept but most browsers can't render.
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

export default function ReviewsClient() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [eventType, setEventType] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactOk, setContactOk] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const [published, setPublished] = useState<PublishedReview[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  /* If the guest arrived from a booking receipt link we can pre-fill the
     email so they don't retype it. Nothing is trusted from this — it only
     seeds a field the guest can still edit or clear. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('email');
    if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) setEmail(e);
    const x = params.get('experience');
    const match = x ? experienceBySlug(x) : undefined;
    if (match) setEventType(match.title);
  }, []);

  const loadPublished = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews?limit=5', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data?.reviews)) setPublished(data.reviews);
    } catch {
      /* Social proof is a bonus; the form is the point. Stay quiet. */
    }
  }, []);

  useEffect(() => { loadPublished(); }, [loadPublished]);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    setPhotoBusy(true);
    setError('');
    const room = MAX_PHOTOS - photos.length;
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      const shrunk = await shrink(file);
      if (shrunk) next.push(shrunk);
    }
    if (!next.length) setError('Those files couldn’t be read as images.');
    setPhotos((p) => [...p, ...next].slice(0, MAX_PHOTOS));
    setPhotoBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');

    if (!rating) return setError('Please choose a rating first.');
    if (!text.trim()) return setError('Please tell us about your experience.');

    setBusy(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          review_text: text,
          event_type: eventType || null,
          guest_name: name || null,
          email: email || null,
          contact_ok: contactOk,
          photos,
          source_url: window.location.href,
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

  const activeStars = hover || rating;
  const charCount = text.trim().length;

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
                Guest Stories
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/portfolio" className="kk-navlink" style={navLink}>Art Gallery</Link>
            <Link href="/book" className="kk-gold-btn" style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
              Reserve a Date
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(48px, 7vw, 84px) 20px clamp(16px, 2vw, 24px)', overflow: 'hidden' }}>
        <div aria-hidden="true" style={glowBackdrop} />
        <div className="kk-fade-up" style={{ position: 'relative', zIndex: 2, maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <span style={eyebrow}>
            <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
            Intention is the experience
          </span>
          <h1 style={{ margin: '20px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(38px, 6.4vw, 66px)', lineHeight: 1.05 }}>
            What did the night <span style={{ color: GOLD, fontWeight: 600 }}>taste</span> like?
          </h1>
          <p style={{ margin: '20px auto 0', color: CREAM, opacity: 0.84, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.75, maxWidth: 500, fontWeight: 300 }}>
            Stephen builds each experience once and never repeats it. Tell him what
            stayed with you — the pour, the room, the moment it turned.
          </p>
        </div>
      </section>

      {/* ── Form / confirmation ────────────────────────────────── */}
      <section style={{ maxWidth: 660, margin: '0 auto', padding: '0 20px clamp(40px, 6vw, 64px)' }}>
        <div style={{
          background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)`,
          border: `1px solid ${LINE2}`, borderRadius: 20,
          padding: 'clamp(24px, 4vw, 40px)', marginTop: 24,
        }}>
          {done ? (
            <div role="status" style={{ textAlign: 'center', padding: 'clamp(16px, 3vw, 32px) 0' }}>
              <span aria-hidden="true" style={{ fontSize: 46, lineHeight: 1 }}>🥃</span>
              <h2 style={{ margin: '16px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(26px, 3.6vw, 34px)', lineHeight: 1.1 }}>
                Thank you — that means something.
              </h2>
              <p style={{ margin: '14px auto 0', maxWidth: 400, fontSize: 14.5, color: CREAM, opacity: 0.85, lineHeight: 1.7, fontWeight: 300 }}>
                Your story goes live once Stephen has read it. He reads every one.
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 26, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/portfolio" className="kk-ghost-btn" style={ghostButton}>See the event log</Link>
                <Link href="/book" className="kk-gold-btn" style={goldButton}>Reserve a date</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              {/* ── Rating ─────────────────────────────────────── */}
              <fieldset style={{ border: 'none', padding: 0, margin: 0, minWidth: 0, textAlign: 'center' }}>
                <legend style={{ ...labelStyle, float: 'left', width: '100%', textAlign: 'center', marginBottom: 14 }}>
                  How was it?
                </legend>
                <div role="radiogroup" aria-label="Rating out of five"
                  onMouseLeave={() => setHover(0)}
                  style={{ display: 'inline-flex', gap: 'clamp(4px, 1.6vw, 10px)' }}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const lit = n <= activeStars;
                    return (
                      <button key={n} type="button" role="radio" aria-checked={rating === n}
                        aria-label={`${n} star${n > 1 ? 's' : ''} — ${STAR_LABELS[n]}`}
                        onClick={() => setRating(n)}
                        onMouseEnter={() => setHover(n)}
                        onFocus={() => setHover(n)}
                        onBlur={() => setHover(0)}
                        className="kk-star"
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                          fontSize: 'clamp(34px, 9vw, 46px)', lineHeight: 1,
                          color: lit ? (hover ? BRONZE : GOLD) : 'rgba(232,216,184,0.22)',
                          filter: lit ? 'drop-shadow(0 3px 10px rgba(195,154,69,0.4))' : 'none',
                          transition: 'color .15s ease, transform .15s ease, filter .15s ease',
                          transform: hover === n ? 'scale(1.14)' : 'none',
                        }}>
                        ★
                      </button>
                    );
                  })}
                </div>
                <p aria-live="polite" style={{
                  margin: '8px 0 0', minHeight: 20, fontFamily: FB, fontSize: 12.5,
                  letterSpacing: '1.4px', textTransform: 'uppercase',
                  color: activeStars ? GOLD : 'transparent', fontWeight: 500,
                }}>
                  {activeStars ? STAR_LABELS[activeStars] : '·'}
                </p>
              </fieldset>

              {/* ── The story ──────────────────────────────────── */}
              <div style={{ marginTop: 26 }}>
                <label htmlFor="kk-story" style={labelStyle}>What made this moment unforgettable?</label>
                <textarea
                  id="kk-story"
                  className="kk-input"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  placeholder="The drink he built for the toast, the way the room went quiet, what your guests still bring up…"
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 190, lineHeight: 1.65 }}
                />
                <p style={{ margin: '7px 0 0', fontFamily: FB, fontSize: 11.5, color: charCount >= SUGGESTED_CHARS ? GOLD : DIM, letterSpacing: '0.4px' }}>
                  {charCount === 0
                    ? 'A few sentences is plenty — more is welcome.'
                    : charCount < SUGGESTED_CHARS
                      ? `${charCount} characters — keep going if there's more.`
                      : `${charCount} characters. Beautiful.`}
                </p>
              </div>

              {/* ── Optional ───────────────────────────────────── */}
              <div style={{ marginTop: 30, paddingTop: 24, borderTop: `1px solid ${LINE2}` }}>
                <p style={{ margin: '0 0 4px', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.6px', textTransform: 'uppercase', color: CREAM, opacity: 0.7, fontWeight: 500 }}>
                  Optional
                </p>
                <p style={{ margin: '0 0 18px', fontSize: 12.5, color: CREAM, opacity: 0.55, lineHeight: 1.6 }}>
                  Every field below can stay blank. Leave it anonymous if you&rsquo;d rather.
                </p>

                <label style={{ display: 'block' }}>
                  <span style={labelStyle}>Which experience was it?</span>
                  <select className="kk-input" value={eventType} onChange={(e) => setEventType(e.target.value)}
                    style={{ ...inputStyle, appearance: 'none' }}>
                    <option value="" style={optionStyle}>Prefer not to say</option>
                    {EXPERIENCE_COLLECTION.map((x) => (
                      <option key={x.slug} value={x.title} style={optionStyle}>{x.title}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'block', marginTop: 16 }}>
                  <span style={labelStyle}>Your name, for attribution</span>
                  <input className="kk-input" style={inputStyle} value={name} autoComplete="name"
                    placeholder="Left blank, it posts anonymously"
                    onChange={(e) => setName(e.target.value)} />
                </label>

                <label style={{ display: 'block', marginTop: 16 }}>
                  <span style={labelStyle}>Email</span>
                  <input className="kk-input" style={inputStyle} type="email" value={email} autoComplete="email"
                    placeholder="Only if you want a reply"
                    onChange={(e) => setEmail(e.target.value)} />
                </label>

                <label style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 12,
                  cursor: email ? 'pointer' : 'not-allowed', opacity: email ? 1 : 0.45,
                }}>
                  <input type="checkbox" checked={contactOk} disabled={!email}
                    onChange={(e) => setContactOk(e.target.checked)}
                    style={{ marginTop: 2, width: 17, height: 17, accentColor: GOLD, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: CREAM, opacity: 0.82, lineHeight: 1.55 }}>
                    Stephen may follow up with me about this review. Your email is never
                    published and never shown with your story.
                  </span>
                </label>

                {/* ── Photos ───────────────────────────────────── */}
                <div style={{ marginTop: 22 }}>
                  <span style={labelStyle}>Photos from the night — up to {MAX_PHOTOS}</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {photos.map((src, i) => (
                      <div key={i} style={{ position: 'relative', width: 84, height: 84, borderRadius: 10, overflow: 'hidden', border: `1px solid ${LINE2}` }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Upload ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <button type="button" aria-label={`Remove photo ${i + 1}`}
                          onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                          style={{
                            position: 'absolute', top: 3, right: 3, width: 22, height: 22,
                            borderRadius: '50%', border: 'none', cursor: 'pointer',
                            background: 'rgba(10,10,10,0.72)', color: CREAM, fontSize: 13, lineHeight: 1,
                          }}>
                          ✕
                        </button>
                      </div>
                    ))}
                    {photos.length < MAX_PHOTOS && (
                      <button type="button" onClick={() => fileRef.current?.click()} disabled={photoBusy}
                        className="kk-pill"
                        style={{
                          width: 84, height: 84, borderRadius: 10, cursor: photoBusy ? 'wait' : 'pointer',
                          border: `1px dashed ${LINE2}`, background: 'rgba(0,0,0,0.18)',
                          color: CREAM, fontFamily: FB, fontSize: 11, lineHeight: 1.4, opacity: photoBusy ? 0.6 : 1,
                        }}>
                        {photoBusy ? '…' : <><span style={{ fontSize: 19, display: 'block' }}>＋</span>Add</>}
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden
                    onChange={(e) => addPhotos(e.target.files)} />
                </div>
              </div>

              {error && <p role="alert" style={errorText}>{error}</p>}

              <button type="submit" disabled={busy} className="kk-gold-btn"
                style={{ ...goldButton, display: 'block', width: '100%', marginTop: 28, padding: '17px 24px', fontSize: 14, opacity: busy ? 0.7 : 1 }}>
                {busy ? 'Sending…' : 'Share Your Story'}
              </button>
              <p style={{ margin: '14px 0 0', fontSize: 11.5, color: CREAM, opacity: 0.5, textAlign: 'center', lineHeight: 1.6 }}>
                Reviews appear after Stephen reads them.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Social proof ───────────────────────────────────────── */}
      {published.length > 0 && (
        <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px clamp(48px, 7vw, 84px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(22px, 3vw, 32px)' }}>
            <span style={eyebrow}>
              <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
              From other rooms
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 'clamp(16px, 2.2vw, 24px)' }}>
            {published.map((r) => (
              <figure key={r.id} className="kk-card" style={{
                margin: 0, background: PANEL, border: `1px solid ${LINE}`,
                borderRadius: 16, padding: 22, display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                <div aria-label={`${r.rating} out of 5`} style={{ color: GOLD, fontSize: 15, letterSpacing: 3 }}>
                  {'★'.repeat(r.rating)}<span style={{ color: 'rgba(232,216,184,0.2)' }}>{'★'.repeat(5 - r.rating)}</span>
                </div>
                <blockquote style={{ margin: 0, fontFamily: FD, fontSize: 18, lineHeight: 1.5, color: TEXT, fontWeight: 500 }}>
                  &ldquo;{r.review_text.length > 240 ? `${r.review_text.slice(0, 240).trimEnd()}…` : r.review_text}&rdquo;
                </blockquote>
                {r.photos?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    {r.photos.slice(0, 3).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" loading="lazy"
                        style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: `1px solid ${LINE}` }} />
                    ))}
                  </div>
                )}
                <figcaption style={{ marginTop: 'auto', fontFamily: FB, fontSize: 11.5, letterSpacing: '1.2px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>
                  {r.guest_name || 'A guest'}
                  {r.event_type ? ` · ${r.event_type}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

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

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: CREAM, opacity: 0.7, marginBottom: 8, fontWeight: 500,
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: 'rgba(10,10,10,0.42)',
  border: `1px solid ${LINE2}`, borderRadius: 10, padding: '14px 15px',
  color: TEXT, fontFamily: FB, fontSize: 15, outline: 'none', fontWeight: 300,
};

const optionStyle: CSSProperties = { background: PANEL2, color: TEXT };

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

const errorText: CSSProperties = {
  margin: '18px 0 0', fontSize: 13, color: '#f0a9a9', lineHeight: 1.5,
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
.kk-pill{transition:border-color .15s ease, background .15s ease}
.kk-pill:hover{border-color:${GOLD}}
.kk-input:focus{border-color:${GOLD}!important;box-shadow:0 0 0 3px rgba(195,154,69,0.13)}
.kk-star:hover{color:${BRONZE}!important}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){
  .kk-fade-up{animation:none!important}
  .kk-card:hover,.kk-gold-btn:hover,.kk-star{transform:none!important}
}
`;
