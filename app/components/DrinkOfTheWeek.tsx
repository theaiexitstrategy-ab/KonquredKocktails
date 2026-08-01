// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// This week's signature Kocktails — the "from the studio" board.
//
// Portal-driven: reads public.client_signature_drinks through /api/drinks, so
// Stephen sets 3–5 drinks for the week and the board changes on the next page
// load with no redeploy. One may be flagged is_feature, which renders larger
// as the drink of the week.
//
// Falls back to SEED_DRINKS (the three standing house drinks) on any failure
// or empty response. A menu section showing nothing is worse than one showing
// last week's — and these three are genuinely house standards, not filler.
//
// Goes through our own API route rather than Supabase-in-the-browser: the
// anon key is shared across every portal tenant. See lib/supabase.ts.

import { useCallback, useEffect, useState, type CSSProperties } from 'react';

import {
  PANEL, PANEL2, GOLD, GOLD_HI, CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB,
} from '../theme';

type Drink = {
  drink_key: string;
  name: string;
  build: string | null;
  notes: string | null;
  zero_proof: boolean;
  is_feature: boolean;
  image_url: string | null;
  sort_order: number;
  week_of: string | null;
};

const SEED_DRINKS: Drink[] = [
  {
    drink_key: 'nearest-to-happiness',
    name: 'Nearest to Happiness',
    build: '1.5 oz Uncle Nearest 1856 · ½ oz Lillet Rouge · ½ oz lemon · ½ oz simple · 3–4 blueberries',
    notes: null, zero_proof: false, is_feature: false, image_url: null, sort_order: 0, week_of: null,
  },
  {
    drink_key: 'konquered-sour',
    name: 'Konquered Sour',
    build: '2 oz bourbon · ¾ oz fresh lemon · ½ oz barrel-aged maple · ½ oz Big O Ginger Liqueur · egg white',
    notes: null, zero_proof: false, is_feature: true, image_url: null, sort_order: 1, week_of: null,
  },
  {
    drink_key: 'uncles-spiced-side-car',
    name: "Uncle's Spiced Side Car",
    build: '2 oz Uncle Nearest 1856 · ½ oz Big O Ginger Liqueur · ½ oz orange curaçao · ½ oz lemon · ¼ oz simple',
    notes: null, zero_proof: false, is_feature: false, image_url: null, sort_order: 2, week_of: null,
  },
];

/** "Week of August 3" — only shown when the operator actually set week_of. */
function weekLabel(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return `Week of ${new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
}

export default function DrinkOfTheWeek() {
  const [drinks, setDrinks] = useState<Drink[]>(SEED_DRINKS);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/drinks', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      const rows: Drink[] = Array.isArray(data?.drinks) ? data.drinks : [];
      if (rows.length) setDrinks(rows);
    } catch {
      /* Seed stays on screen. */
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const feature = drinks.find((d) => d.is_feature);
  const rest = drinks.filter((d) => !d.is_feature);
  const week = weekLabel(drinks.find((d) => d.week_of)?.week_of ?? null);

  return (
    <div style={{ marginTop: 'clamp(24px, 3.4vw, 36px)' }}>
      {week && (
        <p style={{
          margin: '0 0 16px', fontFamily: FB, fontSize: 10.5, letterSpacing: '1.8px',
          textTransform: 'uppercase', color: DIM, fontWeight: 500,
        }}>
          {week}
        </p>
      )}

      {feature && <FeatureCard drink={feature} />}

      <div style={{
        display: 'grid', gap: 'clamp(12px, 1.8vw, 18px)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        marginTop: feature ? 'clamp(14px, 2vw, 20px)' : 0,
      }}>
        {rest.map((d) => <DrinkCard key={d.drink_key} drink={d} />)}
      </div>
    </div>
  );
}

function FeatureCard({ drink: d }: { drink: Drink }) {
  return (
    <article className="kk-card" style={{
      background: PANEL2, border: `1px solid ${LINE2}`, borderRadius: 16,
      padding: 'clamp(20px, 2.8vw, 30px)',
      display: 'flex', gap: 'clamp(16px, 2.4vw, 26px)', flexWrap: 'wrap', alignItems: 'center',
    }}>
      {d.image_url && (
        // Operator-uploaded host — plain img avoids allow-listing every source.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={d.image_url} alt={d.name} loading="lazy"
          style={{ width: 132, height: 132, objectFit: 'cover', borderRadius: 12, border: `1px solid ${LINE}`, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 220 }}>
        <span style={{
          display: 'inline-block', fontFamily: FB, fontSize: 9.5, fontWeight: 600,
          letterSpacing: '1.8px', textTransform: 'uppercase', color: '#151310',
          background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`,
          borderRadius: 999, padding: '4px 11px',
        }}>
          Drink of the Week
        </span>
        <h3 style={{ margin: '12px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(26px, 3.4vw, 34px)', lineHeight: 1.12, color: TEXT }}>
          {d.name}
          {d.zero_proof && <ZeroProof />}
        </h3>
        {d.build && (
          <p style={{ margin: '10px 0 0', fontFamily: FB, fontWeight: 300, fontSize: 14.5, color: CREAM, opacity: 0.84, lineHeight: 1.7 }}>
            {d.build}
          </p>
        )}
        {d.notes && (
          <p style={{ margin: '10px 0 0', fontFamily: FD, fontSize: 16, color: MUTED, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {d.notes}
          </p>
        )}
      </div>
    </article>
  );
}

function DrinkCard({ drink: d }: { drink: Drink }) {
  return (
    <article className="kk-card" style={{
      background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14,
      padding: 'clamp(16px, 2.2vw, 22px)',
    }}>
      <h3 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 22, lineHeight: 1.2, color: TEXT }}>
        {d.name}
        {d.zero_proof && <ZeroProof />}
      </h3>
      {d.build && (
        <p style={{ margin: '8px 0 0', fontFamily: FB, fontWeight: 300, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
          {d.build}
        </p>
      )}
      {d.notes && (
        <p style={{ margin: '8px 0 0', fontFamily: FD, fontSize: 15, color: DIM, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
          {d.notes}
        </p>
      )}
    </article>
  );
}

function ZeroProof() {
  return (
    <span style={zeroProofStyle}>Zero-proof</span>
  );
}

const zeroProofStyle: CSSProperties = {
  marginLeft: 9, verticalAlign: 'middle',
  fontFamily: FB, fontSize: 9, fontWeight: 600, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: GOLD,
  border: `1px solid ${LINE2}`, borderRadius: 999, padding: '3px 8px',
  whiteSpace: 'nowrap',
};
