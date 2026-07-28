// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Konquered Kocktails storefront — konqueredkocktails.com/merch.
//
// Same portal-driven format as theflexfacility.com/merch,
// islaystudiosllc.com/merch, and willpowerfitnessfactory.com/merch:
//
//   THE PORTAL IS THE CATALOG. Nothing about the products is hardcoded here.
//   Stephen lists, hides, re-prices, and re-photographs merch in the GoElev8
//   portal Merch tab; the change appears on the next page load, no redeploy.
//
//   read  →  GET  {PORTAL_URL}/api/external/products?slug={PORTAL_SLUG}
//   buy   →  POST {PORTAL_URL}/api/external/checkout
//
// Checkout is a Stripe Connect DIRECT charge on Stephen's connected account,
// created by the portal — the storefront never sees his acct_ id, and the
// portal validates prices against its own DB, so nothing here can fabricate
// a discounted line item. Stripe collects name / email / phone / shipping
// address natively; this page only gathers the variant (size, color) first.
//
// Order recording, notifications, and the platform fee all happen on the
// portal side via its Stripe webhook. There is deliberately no order state
// in this repo.

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';

import {
  INK, PANEL, PANEL2, GOLD, GOLD_HI, GOLD_D, GARNET, AMETHYST, EMERALD,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB, CONTACT,
} from '../theme';

/* ── Portal wiring ───────────────────────────────────────────────────
   Overridable per-environment so a staging portal can be pointed at
   without a code change. PORTAL_SLUG must match the `slug` on the
   tenant's row in the portal's `clients` table — if they disagree the
   products endpoint returns 404 tenant_not_found and the shelf shows
   its empty state. */
const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://portal.goelev8.ai';
const PORTAL_SLUG =
  process.env.NEXT_PUBLIC_PORTAL_SLUG || 'konquered-kocktails';

/* Flat customer-facing processing fee, shown in each card's price
   breakdown so the total on the shelf matches the total on Stripe's
   page. Mirrors PROCESSING_FEE_DEFAULT_CENTS in the portal's
   api/external/checkout.js — keep in sync if that default changes. */
const PROCESSING_FEE_CENTS = 300;

/* Sizes offered on physical merch. The portal's product rows don't carry
   a size list today, so the storefront offers the standard run and sends
   the choice through as `variant.size`. */
const SIZES = ['S', 'M', 'L', 'XL', '2XL', '3XL'];

/* Products whose key or name matches this are treated as one-size — no
   size picker, nothing sent in variant.size. Glassware, barware, bottles,
   and gift cards are the common cases for a cocktail brand. */
const ONE_SIZE = /glass|tumbler|shaker|jigger|barware|bottle|bitters|syrup|kit|card|coaster|mug|print|poster|sticker/i;

/* Swatch dots next to color names. Substring match, so "Royal Gold" finds
   "gold". Falls through to a neutral disc when nothing matches. */
const COLOR_SWATCHES: Record<string, string> = {
  black: '#0a0a0a', white: '#fafafa', cream: '#E8D8B8', red: '#e8200a',
  emerald: '#123D35', green: '#10b981', gold: '#C39A45', bronze: '#9A633A',
  garnet: '#681F2B', amethyst: '#5C3B70', purple: '#7c3aed', navy: '#1e3a8a',
  blue: '#1d4ed8', grey: '#6b7280', gray: '#6b7280', silver: '#cbd5e1',
  brown: '#92400e', tan: '#c8a97e', pink: '#ec4899', orange: '#f97316',
  yellow: '#fbbf24',
};

function swatchFor(name: string): string {
  const lc = String(name || '').toLowerCase();
  for (const key of Object.keys(COLOR_SWATCHES)) {
    if (lc.includes(key)) return COLOR_SWATCHES[key];
  }
  return 'rgba(232,216,184,0.25)';
}

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ── Portal response shape (api/external/products) ───────────────── */
type PortalColor = { name: string; image_url: string | null };

type PortalProduct = {
  key: string;
  name: string;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  image_url: string | null;
  colors: PortalColor[];
  payment_link: string | null;
  sort_order: number | null;
};

type LoadState = 'loading' | 'ready' | 'error';

export default function MerchClient() {
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [paid, setPaid] = useState(false);

  /* Stripe sends the buyer back to /merch?paid=1 on success. Show the
     banner, then strip the param so a refresh doesn't re-show it. */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('paid') === '1') {
      setPaid(true);
      window.history.replaceState({}, '', '/merch');
    }
  }, []);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await fetch(
        `${PORTAL_URL}/api/external/products?slug=${encodeURIComponent(PORTAL_SLUG)}`,
        { cache: 'no-store' },
      );
      /* 404 tenant_not_found means the portal doesn't have a Konquered
         Kocktails row yet. That's the pre-launch state, not a failure —
         show the friendly "being stocked" shelf rather than an error the
         customer can't do anything about. Same spirit as the deposit
         route's demo mode. */
      if (res.status === 404) {
        setProducts([]);
        setState('ready');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows: PortalProduct[] = Array.isArray(data?.products) ? data.products : [];
      rows.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setProducts(rows);
      setState('ready');
    } catch (err) {
      console.warn('[merch] portal product fetch failed:', err);
      setState('error');
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
                The Shop
              </span>
            </span>
          </Link>
          <nav style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 22 }}>
            <Link href="/" className="kk-navlink" style={navLink}>Home</Link>
            <Link href="/portfolio" className="kk-navlink" style={navLink}>Portfolio</Link>
            <Link href="/#book" className="kk-gold-btn"
              style={{ ...goldButton, padding: '10px 22px', fontSize: 12 }}>
              Book an Event
            </Link>
          </nav>
        </div>
      </header>

      {paid && (
        <div role="status" className="kk-fade-up" style={{
          maxWidth: 1180, margin: '18px auto 0', padding: '0 20px',
        }}>
          <div style={{
            background: 'rgba(18,61,53,0.5)', border: `1px solid ${LINE2}`,
            borderRadius: 12, padding: '14px 18px', color: CREAM, fontSize: 14, lineHeight: 1.55,
          }}>
            <strong style={{ color: GOLD, fontWeight: 600 }}>Order received.</strong>{' '}
            Check your email for the receipt — Stephen will be in touch about fulfillment.
          </div>
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{ position: 'relative', padding: 'clamp(56px, 8vw, 96px) 20px clamp(28px, 4vw, 44px)', textAlign: 'center', overflow: 'hidden' }}>
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: [
            `radial-gradient(46% 60% at 50% 0%, ${AMETHYST}26 0%, transparent 58%)`,
            `radial-gradient(64% 62% at 80% 40%, ${EMERALD}40 0%, transparent 62%)`,
            `radial-gradient(56% 58% at 20% 74%, ${GARNET}22 0%, transparent 60%)`,
            `radial-gradient(50% 54% at 50% 40%, ${GOLD}1a 0%, transparent 62%)`,
          ].join(', '),
        }} />
        <div className="kk-fade-up" style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, fontFamily: FB, fontSize: 11.5, letterSpacing: '2.4px', textTransform: 'uppercase', color: GOLD, fontWeight: 500 }}>
            <span aria-hidden="true" style={{ width: 26, height: 1, background: `linear-gradient(90deg, ${GOLD}, transparent)` }} />
            The Konquered Shop
          </span>
          <h1 style={{ margin: '20px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(40px, 7vw, 74px)', lineHeight: 1.04 }}>
            Take the <span style={{ color: GOLD, fontWeight: 600 }}>experience</span> home.
          </h1>
          <p style={{ margin: '22px auto 0', color: CREAM, opacity: 0.82, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.75, maxWidth: 520, fontWeight: 300 }}>
            Barware, glassware, and Konquered Kocktails gear — the same craft that
            shows up behind the bar. Every order ships from St. Charles.
          </p>
        </div>
      </section>

      {/* ── Shelf ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '0 20px clamp(48px, 7vw, 84px)' }}>
        {state === 'loading' && <Notice>Loading the shelf…</Notice>}

        {state === 'error' && (
          <Notice>
            Couldn&rsquo;t load the shop just now.{' '}
            <button type="button" onClick={load} style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: GOLD, fontFamily: FB, fontSize: 'inherit', textDecoration: 'underline',
            }}>
              Try again
            </button>
            , or{' '}
            <a href={`mailto:${CONTACT.email}`} style={{ color: GOLD }}>email Stephen</a>.
          </Notice>
        )}

        {state === 'ready' && products.length === 0 && (
          <Notice>
            <span style={{ display: 'block', fontFamily: FD, fontSize: 26, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
              The shelf is being stocked.
            </span>
            New pieces are on the way — check back soon, or{' '}
            <Link href="/#book" style={{ color: GOLD }}>book an experience</Link> in the meantime.
          </Notice>
        )}

        {state === 'ready' && products.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 'clamp(18px, 2.4vw, 26px)' }}>
            {products.map((p, i) => (
              <ProductCard key={p.key} product={p} eager={i === 0} />
            ))}
          </div>
        )}
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

/* ── Product card ─────────────────────────────────────────────────── */

function ProductCard({ product, eager }: { product: PortalProduct; eager: boolean }) {
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const oneSize = ONE_SIZE.test(product.key) || ONE_SIZE.test(product.name);

  const [color, setColor] = useState<PortalColor | null>(colors[0] ?? null);
  const [size, setSize] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [nudge, setNudge] = useState(false);

  /* Lead with the selected color's photo when the operator uploaded one,
     so the picture always matches the picked swatch. */
  const image = color?.image_url || product.image_url;

  const showCompareAt =
    product.compare_at_price_cents != null &&
    product.compare_at_price_cents > product.price_cents;

  async function buy() {
    if (busy) return;
    setError('');

    if (!oneSize && !size) {
      setNudge(true);
      setTimeout(() => setNudge(false), 1800);
      return;
    }

    /* Color is optional. Three cases, matching the other storefronts:
         0 colors                 → nothing sent
         1 color, no picker shown → send that color name anyway
         2+ colors, picker shown  → send the selected swatch */
    const variant: { size?: string; color?: string } = {};
    if (!oneSize && size) variant.size = size;
    if (color?.name) variant.color = color.name;

    setBusy(true);
    try {
      const res = await fetch(`${PORTAL_URL}/api/external/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: PORTAL_SLUG,
          product_key: product.key,
          quantity: 1,
          ...(Object.keys(variant).length ? { variant } : {}),
          success_url: `${window.location.origin}/merch?paid=1&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/merch`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      /* Portal couldn't create a session. Fall back to the operator's
         Stripe Payment Link if they pasted one into the portal. */
      if (product.payment_link) {
        window.location.href = product.payment_link;
        return;
      }
      setError(data?.message || data?.error || `Checkout could not start (HTTP ${res.status}).`);
      setBusy(false);
    } catch {
      if (product.payment_link) {
        window.location.href = product.payment_link;
        return;
      }
      setError('Network error. Please check your connection and try again.');
      setBusy(false);
    }
  }

  return (
    <div className="kk-card" style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: PANEL2, overflow: 'hidden' }}>
        {image ? (
          /* Operator-uploaded images live on arbitrary hosts (portal storage,
             Printify CDN, …). A plain <img> avoids having to allow-list every
             possible remote host in next.config for next/image. */
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} loading={eager ? 'eager' : 'lazy'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontSize: 44, opacity: 0.5 }} aria-hidden="true">🥃</div>
        )}
      </div>

      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 24, lineHeight: 1.15, color: TEXT }}>
            {product.name}
          </h2>
          {product.description && (
            /* pre-wrap preserves the line breaks exactly as Stephen types
               them into the portal description field. */
            <p style={{ margin: '8px 0 0', fontFamily: FB, fontWeight: 300, fontSize: 13.5, color: MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {product.description}
            </p>
          )}
        </div>

        {/* Price breakdown — shows the processing fee up front so the total
            here matches the total on Stripe's page. */}
        <div style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <Row label="Price">
            <span>{dollars(product.price_cents)}</span>
            {showCompareAt && (
              <span style={{ marginLeft: 8, color: DIM, textDecoration: 'line-through' }}>
                {dollars(product.compare_at_price_cents!)}
              </span>
            )}
          </Row>
          <Row label="Processing fee">+ {dollars(PROCESSING_FEE_CENTS)}</Row>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 7, marginTop: 3, borderTop: `1px dashed ${LINE}` }}>
            <span style={{ fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase', color: DIM, fontWeight: 500 }}>Total</span>
            <span style={{ fontFamily: FD, fontWeight: 700, fontSize: 26, color: GOLD, lineHeight: 1 }}>
              {dollars(product.price_cents + PROCESSING_FEE_CENTS)}
            </span>
          </div>
          <span style={{ fontFamily: FB, fontSize: 10.5, color: DIM, letterSpacing: '0.4px' }}>
            Shipping calculated at checkout · pickup available
          </span>
        </div>

        {/* Color picker — only when there's a real choice. */}
        {colors.length >= 2 && (
          <div>
            <span style={labelStyle}>Color</span>
            <div role="radiogroup" aria-label={`${product.name} color`} style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {colors.map((c) => {
                const on = color?.name === c.name;
                return (
                  <button key={c.name} type="button" role="radio" aria-checked={on}
                    onClick={() => setColor(c)}
                    className="kk-pill"
                    style={{
                      ...pillStyle,
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: on ? GOLD : 'rgba(255,255,255,0.04)',
                      color: on ? INK : TEXT,
                      borderColor: on ? GOLD : LINE,
                      fontWeight: on ? 600 : 500,
                    }}>
                    <span aria-hidden="true" style={{
                      width: 11, height: 11, borderRadius: '50%', flexShrink: 0,
                      background: swatchFor(c.name),
                      border: `1px solid ${on ? 'rgba(0,0,0,0.3)' : 'rgba(232,216,184,0.35)'}`,
                    }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Size picker — skipped for glassware/barware/gift cards. */}
        {!oneSize && (
          <div>
            <span style={labelStyle}>Size</span>
            <div role="radiogroup" aria-label={`${product.name} size`}
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4,
                outline: nudge ? `2px solid ${GOLD}` : 'none', outlineOffset: 4,
                borderRadius: 8, transition: 'outline-color .2s ease',
              }}>
              {SIZES.map((s) => {
                const on = size === s;
                return (
                  <button key={s} type="button" role="radio" aria-checked={on}
                    onClick={() => setSize(s)}
                    className="kk-pill"
                    style={{
                      ...pillStyle,
                      padding: '9px 0', textAlign: 'center',
                      background: on ? GOLD : 'rgba(255,255,255,0.04)',
                      color: on ? INK : TEXT,
                      borderColor: on ? GOLD : LINE,
                      fontWeight: on ? 600 : 500,
                    }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 4 }}>
          <button type="button" onClick={buy} disabled={busy}
            className="kk-gold-btn"
            aria-label={`Buy ${product.name}`}
            style={{
              ...goldButton, display: 'block', width: '100%', textAlign: 'center',
              padding: '15px 24px', fontSize: 13,
              cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.72 : 1,
            }}>
            {busy ? 'Redirecting…' : nudge ? 'Choose a size first' : 'Add to Cart →'}
          </button>
          {error && (
            <p role="alert" style={{ margin: '10px 0 0', fontSize: 12.5, color: '#d98a8a', lineHeight: 1.45 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small shared bits ────────────────────────────────────────────── */

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontFamily: FB, fontSize: 12, color: MUTED, fontWeight: 300 }}>{label}</span>
      <span style={{ fontFamily: FB, fontSize: 13, color: TEXT, fontWeight: 400 }}>{children}</span>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      textAlign: 'center', padding: 'clamp(48px, 8vw, 88px) 24px',
      border: `1px dashed ${LINE}`, borderRadius: 16,
      color: MUTED, fontFamily: FB, fontSize: 15, lineHeight: 1.7, fontWeight: 300,
    }}>
      {children}
    </div>
  );
}

const navLink: CSSProperties = {
  fontFamily: FB, fontSize: 12, letterSpacing: '1.6px', textTransform: 'uppercase',
  fontWeight: 500, color: MUTED, textDecoration: 'none', whiteSpace: 'nowrap',
};

const labelStyle: CSSProperties = {
  display: 'block', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: DIM, marginBottom: 8, fontWeight: 500,
};

const pillStyle: CSSProperties = {
  border: `1px solid ${LINE}`, borderRadius: 8, padding: '9px 12px',
  fontFamily: FB, fontSize: 13, letterSpacing: '0.4px',
  cursor: 'pointer', lineHeight: 1.2,
};

/* Gold-gradient pill — same CTA as the homepage. */
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
.kk-gold-btn:hover:not(:disabled){transform:translateY(-1px);filter:brightness(1.05);box-shadow:0 12px 28px rgba(195,154,69,0.34)}
.kk-card{transition:transform .22s ease, border-color .22s ease}
.kk-card:hover{transform:translateY(-3px);border-color:${LINE2}}
.kk-pill{transition:border-color .15s ease, background .15s ease, color .15s ease}
.kk-pill:hover{border-color:${GOLD}}
@keyframes kkFadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){
  .kk-fade-up{animation:none!important}
  .kk-card:hover,.kk-gold-btn:hover:not(:disabled){transform:none!important}
}
`;
