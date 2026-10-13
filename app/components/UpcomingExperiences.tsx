{/* © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited. */}

// Upcoming Experiences — public events Stephen is pouring at, posted from the
// portal (Bookings → Events) into public.kk_events. See lib/events.ts.
//
// The soonest event is featured; the rest sit beneath as a compact list. An
// invitation, not a ticket grid. Renders nothing when there's nothing upcoming
// — KkClient drops the whole section, heading and nav link included.

import Image from 'next/image';
import type { CSSProperties } from 'react';

import {
  INK, PANEL, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D, CREAM, TEXT, MUTED, LINE, LINE2, FD, FB,
} from '../theme';
import { dateParts, timeLabel, presenter, type KkEvent } from '@/lib/event-format';

export default function UpcomingExperiences({ events }: { events: KkEvent[] }) {
  if (!events.length) return null;
  const [featured, ...rest] = events;
  return (
    <div style={{ display: 'grid', gap: 18, marginTop: 'clamp(26px, 4vw, 40px)' }}>
      <FeaturedEvent e={featured} />
      {rest.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {rest.map((e) => <li key={e.id}><CompactEvent e={e} /></li>)}
        </ul>
      )}
    </div>
  );
}

function FeaturedEvent({ e }: { e: KkEvent }) {
  const titleId = `kk-event-${e.id}`;
  const by = presenter(e);
  return (
    <article aria-labelledby={titleId} style={{
      display: 'grid', gridTemplateColumns: e.image_url ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
      // Without a flyer it's all text — full width would leave it marooned.
      ...(e.image_url ? {} : { maxWidth: 820 }),
      background: PANEL, border: `1px solid ${LINE2}`, borderRadius: 16, overflow: 'hidden',
    }}>
      {e.image_url && (
        // Flyers carry their own type, so contain rather than cover: cropping
        // would cut off the date and the venue printed on them.
        <div style={{ position: 'relative', aspectRatio: '4 / 5', background: '#0d0c0a' }}>
          <Image src={e.image_url} alt={e.title} fill sizes="(max-width: 640px) 100vw, 520px"
            style={{ objectFit: 'contain' }} />
        </div>
      )}
      <div style={{ padding: 'clamp(22px, 3.6vw, 36px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          <DateBlock iso={e.starts_at} size="lg" />
          <div style={{ minWidth: 0 }}>
            <h3 id={titleId} style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 'clamp(26px, 3.6vw, 36px)', lineHeight: 1.08, color: TEXT }}>
              {e.title}
            </h3>
            {by && (
              <p style={{ margin: '8px 0 0', fontSize: 13.5, color: MUTED }}>
                Presented by <span style={{ color: CREAM, fontWeight: 400 }}>{by}</span>
              </p>
            )}
          </div>
        </div>

        <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
          {(e.venue_name || e.venue_address) && (
            <Detail label="Where">
              {e.venue_name}
              {e.venue_address && (
                <span style={{ display: 'block', color: MUTED, fontSize: 14, marginTop: e.venue_name ? 2 : 0 }}>{e.venue_address}</span>
              )}
            </Detail>
          )}
          <Detail label="When">
            {dateParts(e.starts_at).long} · {timeLabel(e)}
          </Detail>
        </dl>

        {e.description && (
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: MUTED }}>{e.description}</p>
        )}

        {(e.price_label || e.ticket_url) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 18px', marginTop: 4 }}>
            {e.ticket_url && <TicketLink e={e} variant="gold" />}
            {e.price_label && (
              <span style={{ fontFamily: FB, fontSize: 13, letterSpacing: '1px', textTransform: 'uppercase', color: GOLD, fontWeight: 500 }}>
                {e.price_label}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function CompactEvent({ e }: { e: KkEvent }) {
  const titleId = `kk-event-${e.id}`;
  const by = presenter(e);
  const where = [e.venue_name, timeLabel(e)].filter(Boolean).join(' · ');
  return (
    <article aria-labelledby={titleId} style={{
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '14px 18px',
      padding: '16px 18px', background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14,
    }}>
      <DateBlock iso={e.starts_at} size="sm" />
      <div style={{ flex: '1 1 220px', minWidth: 0 }}>
        <h3 id={titleId} style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 22, lineHeight: 1.15, color: TEXT }}>
          {e.title}
        </h3>
        <p style={{ margin: '5px 0 0', fontSize: 13.5, color: MUTED, lineHeight: 1.5 }}>
          {where}
          {by && <> · Presented by {by}</>}
          {e.price_label && <span style={{ color: GOLD }}> · {e.price_label}</span>}
        </p>
      </div>
      {e.ticket_url && <TicketLink e={e} variant="ghost" />}
    </article>
  );
}

/** Weekday / day / month tile on Deep Emerald. */
function DateBlock({ iso, size }: { iso: string; size: 'lg' | 'sm' }) {
  const p = dateParts(iso);
  const lg = size === 'lg';
  const small: CSSProperties = {
    display: 'block', fontFamily: FB, fontWeight: 600, fontSize: lg ? 11 : 10,
    letterSpacing: '1.8px', textTransform: 'uppercase', lineHeight: 1,
  };
  return (
    <time dateTime={iso} aria-label={p.long} style={{
      flexShrink: 0, width: lg ? 78 : 62, padding: lg ? '12px 0 11px' : '9px 0 8px', textAlign: 'center',
      background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)`,
      border: `1px solid ${LINE2}`, borderRadius: 12,
    }}>
      <span aria-hidden="true" style={{ ...small, color: GOLD }}>{p.weekday}</span>
      <span aria-hidden="true" style={{ display: 'block', fontFamily: FD, fontWeight: 700, fontSize: lg ? 38 : 28, lineHeight: 1, color: TEXT, margin: lg ? '6px 0 5px' : '4px 0 3px' }}>
        {p.day}
      </span>
      <span aria-hidden="true" style={{ ...small, color: CREAM }}>{p.month}</span>
    </time>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr', gap: 12, alignItems: 'baseline' }}>
      <dt style={{ fontFamily: FB, fontSize: 10.5, letterSpacing: '1.6px', textTransform: 'uppercase', color: GOLD, fontWeight: 500 }}>{label}</dt>
      <dd style={{ margin: 0, fontSize: 15.5, color: TEXT, fontWeight: 400, lineHeight: 1.5, minWidth: 0, wordBreak: 'break-word' }}>{children}</dd>
    </div>
  );
}

function TicketLink({ e, variant }: { e: KkEvent; variant: 'gold' | 'ghost' }) {
  const label = e.ticket_label?.trim() || 'Reserve your seat';
  const base: CSSProperties = {
    display: 'inline-block', fontFamily: FB, fontSize: 12.5, letterSpacing: '1.4px', textTransform: 'uppercase',
    borderRadius: 999, textDecoration: 'none', lineHeight: 1.2, whiteSpace: 'nowrap',
  };
  const style: CSSProperties = variant === 'gold'
    ? { ...base, background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`, color: INK, fontWeight: 600, padding: '14px 26px', boxShadow: '0 8px 22px rgba(195,154,69,0.22)' }
    : { ...base, background: PANEL2, color: CREAM, fontWeight: 500, padding: '11px 18px', border: `1px solid ${LINE2}` };
  return (
    <a href={e.ticket_url!} target="_blank" rel="noopener noreferrer"
       className={variant === 'gold' ? 'kk-gold-btn' : 'kk-ghost-btn'}
       aria-label={`${label}: ${e.title} (opens in a new tab)`} style={style}>
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}
