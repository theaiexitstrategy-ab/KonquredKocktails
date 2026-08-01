// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// The Experience Collection, the Konquered Experience Journey, and the
// Begin the Conversation CTA. All three render from data/experiences.ts —
// price changes are one-line edits there, never here.
//
// Presentational only, no state, so these stay server components inside the
// client page. Contrast note: every price sits on PANEL/PANEL2 in Royal Gold
// (#C39A45), which clears 4.5:1 on both — Konquered Bronze (#9A633A) does
// not, so bronze is used for rules and accents, never for pricing text.

import {
  PANEL, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, BRONZE, GOLD_D,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB,
} from '../theme';
import {
  EXPERIENCE_COLLECTION, JOURNEY, JOURNEY_INTRO, CTA_COPY,
  type Experience,
} from '@/data/experiences';

import type { CSSProperties } from 'react';

/* ── The collection ───────────────────────────────────────────────── */

export function ExperienceCollection() {
  const flagship = EXPERIENCE_COLLECTION.find((e) => e.flagship);
  const rest = EXPERIENCE_COLLECTION.filter((e) => !e.flagship);

  return (
    <>
      {flagship && <FlagshipCard experience={flagship} />}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
        gap: 'clamp(16px, 2.2vw, 24px)',
        marginTop: 'clamp(20px, 3vw, 30px)',
      }}>
        {rest.map((e) => <ExperienceCard key={e.slug} experience={e} />)}
      </div>
    </>
  );
}

function FlagshipCard({ experience: e }: { experience: Experience }) {
  return (
    <article className="kk-card" style={{
      marginTop: 'clamp(28px, 4vw, 44px)',
      background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)`,
      border: `1px solid ${LINE2}`, borderRadius: 18, overflow: 'hidden',
    }}>
      <div style={{ padding: 'clamp(24px, 3.6vw, 38px)' }}>
        <span style={{
          display: 'inline-block', fontFamily: FB, fontSize: 9.5, fontWeight: 600,
          letterSpacing: '1.8px', textTransform: 'uppercase', color: '#151310',
          background: `linear-gradient(180deg, ${GOLD_HI}, ${GOLD})`,
          borderRadius: 999, padding: '4px 11px',
        }}>
          The Signature
        </span>

        <h3 style={{
          margin: '14px 0 0', fontFamily: FD, fontWeight: 700,
          fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.12, color: TEXT,
        }}>
          {e.title}
        </h3>
        <p style={{
          margin: '8px 0 0', fontFamily: FD, fontSize: 'clamp(17px, 2.2vw, 21px)',
          color: GOLD, lineHeight: 1.4, fontWeight: 500,
        }}>
          {e.tagline}
        </p>

        {e.experience && (
          <p style={{
            margin: '18px 0 0', fontFamily: FB, fontWeight: 300,
            fontSize: 'clamp(14.5px, 1.8vw, 16px)', color: CREAM, opacity: 0.86,
            lineHeight: 1.75, maxWidth: 660,
          }}>
            {e.experience}
          </p>
        )}

        {e.tiers && <TierTable tiers={e.tiers} />}

        <IncludedList items={e.included} onEmerald />
      </div>
    </article>
  );
}

/** The four expressions. A real <table> on desktop for the row/column
 *  relationship, restacked into labelled rows on narrow screens via CSS —
 *  a horizontally scrolling price table is miserable on a phone. */
function TierTable({ tiers }: { tiers: NonNullable<Experience['tiers']> }) {
  return (
    <div style={{ marginTop: 'clamp(22px, 3vw, 30px)' }}>
      <table className="kk-tiers" style={{
        width: '100%', borderCollapse: 'collapse', fontFamily: FB,
      }}>
        <caption style={{
          captionSide: 'top', textAlign: 'left', fontFamily: FB, fontSize: 10.5,
          letterSpacing: '1.6px', textTransform: 'uppercase', color: CREAM,
          opacity: 0.62, fontWeight: 500, paddingBottom: 10,
        }}>
          Expressions
        </caption>
        <thead>
          <tr>
            <th scope="col" style={thStyle}>Expression</th>
            <th scope="col" style={thStyle}>Designed for</th>
            <th scope="col" style={{ ...thStyle, textAlign: 'right' }}>Budget minimum</th>
          </tr>
        </thead>
        <tbody>
          {tiers.map((t) => (
            <tr key={t.name}>
              <th scope="row" data-label="Expression" style={{
                ...tdStyle, fontFamily: FD, fontSize: 19, fontWeight: 700,
                color: TEXT, textAlign: 'left',
              }}>
                {t.name}
              </th>
              <td data-label="Designed for" style={{ ...tdStyle, color: CREAM, opacity: 0.8 }}>
                {t.designedFor}
              </td>
              <td data-label="Budget minimum" style={{
                ...tdStyle, textAlign: 'right', fontFamily: FD, fontSize: 21,
                fontWeight: 700, color: GOLD, whiteSpace: 'nowrap',
              }}>
                {t.budgetMinimum}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExperienceCard({ experience: e }: { experience: Experience }) {
  return (
    <article className="kk-card" style={{
      background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16,
      padding: 'clamp(20px, 2.6vw, 26px)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div>
        <h3 style={{
          margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 24,
          lineHeight: 1.18, color: TEXT,
        }}>
          {e.title}
        </h3>
        <p style={{
          margin: '6px 0 0', fontFamily: FD, fontSize: 17, color: GOLD,
          lineHeight: 1.4, fontWeight: 500,
        }}>
          {e.tagline}
        </p>
      </div>

      {e.investment && (
        <p style={{
          margin: 0, fontFamily: FB, fontSize: 14.5, fontWeight: 600,
          color: GOLD, letterSpacing: '0.3px',
          paddingBottom: 12, borderBottom: `1px solid ${LINE}`,
        }}>
          {e.investment}
          {e.experience && (
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 400, color: DIM, marginTop: 3, letterSpacing: '0.4px' }}>
              {e.experience}
            </span>
          )}
        </p>
      )}

      {e.designedFor && (
        <p style={{
          margin: 0, fontFamily: FB, fontWeight: 300, fontSize: 13.5,
          color: MUTED, lineHeight: 1.65,
        }}>
          {e.designedFor}
        </p>
      )}

      <IncludedList items={e.included} />
    </article>
  );
}

function IncludedList({ items, onEmerald }: { items: string[]; onEmerald?: boolean }) {
  return (
    <div style={{ marginTop: onEmerald ? 'clamp(22px, 3vw, 30px)' : 'auto', paddingTop: onEmerald ? 0 : 4 }}>
      <h4 style={{
        margin: '0 0 10px', fontFamily: FB, fontSize: 10, letterSpacing: '1.6px',
        textTransform: 'uppercase', color: onEmerald ? CREAM : DIM,
        opacity: onEmerald ? 0.62 : 1, fontWeight: 500,
      }}>
        What&rsquo;s included
      </h4>
      <ul style={{
        listStyle: 'none', margin: 0, padding: 0,
        display: 'grid', gap: 7,
        ...(onEmerald ? { gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', columnGap: 22 } : {}),
      }}>
        {items.map((item) => (
          <li key={item} style={{
            display: 'flex', gap: 9, alignItems: 'flex-start',
            fontFamily: FB, fontWeight: 300, fontSize: 13.5,
            color: onEmerald ? CREAM : MUTED, opacity: onEmerald ? 0.86 : 1,
            lineHeight: 1.6,
          }}>
            <span aria-hidden="true" style={{
              width: 5, height: 5, borderRadius: '50%', background: GOLD,
              marginTop: 8, flexShrink: 0,
            }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── The Journey ──────────────────────────────────────────────────── */

export function ExperienceJourney() {
  return (
    <ol style={{
      listStyle: 'none', margin: 'clamp(26px, 4vw, 40px) 0 0', padding: 0,
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: 'clamp(16px, 2.2vw, 26px)',
    }}>
      {JOURNEY.map((s, i) => (
        <li key={s.step}>
          <div aria-hidden="true" style={{
            height: 2, background: i === 0
              ? `linear-gradient(90deg, ${GOLD}, ${BRONZE})`
              : `linear-gradient(90deg, ${BRONZE}, ${LINE})`,
            borderRadius: 2, marginBottom: 14,
          }} />
          <span style={{
            display: 'block', fontFamily: FB, fontSize: 10, letterSpacing: '1.8px',
            textTransform: 'uppercase', color: DIM, fontWeight: 500,
          }}>
            {String(i + 1).padStart(2, '0')}
          </span>
          <h3 style={{
            margin: '6px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 24,
            lineHeight: 1.15, color: TEXT,
          }}>
            {s.step}
          </h3>
          <p style={{
            margin: '8px 0 0', fontFamily: FB, fontWeight: 300, fontSize: 13.5,
            color: MUTED, lineHeight: 1.65,
          }}>
            {s.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function JourneyIntro() {
  return (
    <p style={{
      margin: 'clamp(16px, 2vw, 22px) 0 0', fontFamily: FB, fontWeight: 300,
      fontSize: 'clamp(14.5px, 1.8vw, 16px)', color: CREAM, opacity: 0.8,
      lineHeight: 1.75, maxWidth: 620,
    }}>
      {JOURNEY_INTRO}
    </p>
  );
}

/* ── Begin the Conversation ───────────────────────────────────────── */

export function BeginTheConversation({ href }: { href: string }) {
  return (
    <div style={{
      background: PANEL2, border: `1px solid ${LINE2}`, borderRadius: 18,
      padding: 'clamp(26px, 4vw, 44px)', textAlign: 'center',
      maxWidth: 720, marginLeft: 'auto', marginRight: 'auto',
      marginTop: 'clamp(28px, 4vw, 44px)',
    }}>
      <h2 style={{
        margin: 0, fontFamily: FD, fontWeight: 700,
        fontSize: 'clamp(30px, 4.4vw, 46px)', lineHeight: 1.1, color: TEXT,
      }}>
        {CTA_COPY.heading}
      </h2>
      <p style={{
        margin: '16px auto 0', fontFamily: FB, fontWeight: 300,
        fontSize: 'clamp(14.5px, 1.9vw, 16.5px)', color: CREAM, opacity: 0.86,
        lineHeight: 1.75, maxWidth: 540,
      }}>
        {CTA_COPY.body}
      </p>

      <a href={href} className="kk-gold-btn" style={{ ...goldButton, marginTop: 28 }}>
        {CTA_COPY.button}
      </a>

      <p style={{
        margin: '18px auto 0', fontFamily: FB, fontSize: 12, color: MUTED,
        lineHeight: 1.7, maxWidth: 460,
      }}>
        {CTA_COPY.finePrint}
      </p>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const thStyle: CSSProperties = {
  textAlign: 'left', fontFamily: FB, fontSize: 10, letterSpacing: '1.4px',
  textTransform: 'uppercase', color: CREAM, opacity: 0.55, fontWeight: 500,
  padding: '0 0 10px', borderBottom: `1px solid ${LINE2}`,
};

const tdStyle: CSSProperties = {
  fontFamily: FB, fontSize: 14, fontWeight: 300,
  padding: '13px 0', borderBottom: `1px solid rgba(232,216,184,0.10)`,
  verticalAlign: 'middle',
};

const goldButton: CSSProperties = {
  display: 'inline-block',
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`,
  color: '#151310', fontFamily: FB, fontWeight: 600, fontSize: 13,
  letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '16px 32px',
  cursor: 'pointer', textDecoration: 'none', lineHeight: 1.2, textAlign: 'center',
  boxShadow: '0 8px 22px rgba(195,154,69,0.22)',
};
