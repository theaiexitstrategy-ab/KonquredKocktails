// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Ava, the experience concierge, behind every "Reserve a Date" button.
//
// The guest talks to Ava instead of filling in a static form; she learns the
// occasion, routes it to the right experience, captures their details for
// Stephen (her capture_lead tool → the portal), and arranges the complimentary
// Experience Discovery. Every turn is logged to the portal's Messaging → Agent
// tab by /api/ava/chat.
//
// <AvaConcierge /> is mounted once, in app/layout.tsx, and opens on the
// 'kk:concierge' window event. <ReserveButton> dispatches that event. It is
// still a real link to /book: if the concierge never mounted (a script
// failure), the click falls through to the calendar, so the button always
// goes somewhere. /book stays one tap away inside the panel too, for guests
// who would rather pick a date themselves.
//
// The conversation survives closing the panel and moving between pages
// (sessionStorage), so "Reserve a Date" on another page picks up where the
// guest left off.

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';

import {
  INK, PANEL, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D,
  TEXT, MUTED, DIM, LINE, LINE2, FD, FB,
} from '../theme';
import { CHAT_GREETING } from '@/lib/ava';

const OPEN_EVENT = 'kk:concierge';
const STORE_KEY = 'kk-concierge-v1';
const MAX_CHARS = 1000;
/** Matches MAX_TURNS in /api/ava/chat. */
const MAX_TURNS = 40;

declare global {
  interface Window { __kkConcierge?: boolean }
}

type Msg = { role: 'assistant' | 'user'; text: string };
type Saved = { session: string; chatId: string; messages: Msg[] };

const greeting = (): Msg[] => [{ role: 'assistant', text: CHAT_GREETING }];

const newSession = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

function load(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const s = raw ? (JSON.parse(raw) as Saved) : null;
    return s && typeof s.session === 'string' && Array.isArray(s.messages) ? s : null;
  } catch { return null; }
}

function save(s: Saved) {
  try { sessionStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

/** A "Reserve a Date" link that opens Ava. Takes the page's own button
 *  styling, so each page keeps its look. */
export function ReserveButton({ className, style, onClick, children = 'Reserve a Date' }: {
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
}) {
  return (
    <a href="/book" className={className} style={style}
       onClick={(e: MouseEvent<HTMLAnchorElement>) => {
         onClick?.();
         if (!window.__kkConcierge || e.metaKey || e.ctrlKey || e.shiftKey) return;
         e.preventDefault();
         window.dispatchEvent(new Event(OPEN_EVENT));
       }}>
      {children}
    </a>
  );
}

export default function AvaConcierge() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState('');
  const [chatId, setChatId] = useState('');
  const [messages, setMessages] = useState<Msg[]>(greeting);
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [notice, setNotice] = useState<'' | 'unavailable' | 'limit'>('');

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastFocus = useRef<Element | null>(null);

  useEffect(() => {
    window.__kkConcierge = true;
    const s = load();
    if (s) { setSession(s.session); setChatId(s.chatId); setMessages(s.messages.length ? s.messages : greeting()); }
    else setSession(newSession());
    const onOpen = () => { lastFocus.current = document.activeElement; setOpen(true); };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => { window.__kkConcierge = false; window.removeEventListener(OPEN_EVENT, onOpen); };
  }, []);

  useEffect(() => {
    if (session) save({ session, chatId, messages });
  }, [session, chatId, messages]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      (lastFocus.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, waiting, open]);

  const turns = messages.filter((m) => m.role === 'user').length;

  async function send() {
    const text = draft.trim();
    if (!text || waiting || !session) return;
    if (turns >= MAX_TURNS) { setNotice('limit'); return; }
    setNotice('');
    setDraft('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setWaiting(true);
    try {
      const res = await fetch('/api/ava/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session, message: text, previousChatId: chatId || undefined,
          turn: turns + 1, page: window.location.pathname,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setNotice(res.status === 429 ? 'limit' : 'unavailable'); return; }
      if (data.chatId) setChatId(data.chatId);
      const reply = String(data.reply || '').trim();
      if (reply) setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      else setNotice('unavailable');
    } catch {
      setNotice('unavailable');
    } finally {
      setWaiting(false);
      inputRef.current?.focus();
    }
  }

  function restart() {
    setSession(newSession());
    setChatId('');
    setMessages(greeting());
    setDraft('');
    setNotice('');
    inputRef.current?.focus();
  }

  if (!open) return null;

  return (
    <div className="kk-cg-root" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <section className="kk-cg-panel" role="dialog" aria-modal="true" aria-labelledby="kk-cg-title" style={panel}>
        <header style={head}>
          <div style={{ minWidth: 0 }}>
            <h2 id="kk-cg-title" style={title}>Reserve a Date</h2>
            <p style={subtitle}>with Ava, Stephen&rsquo;s experience concierge</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={closeBtn}>✕</button>
        </header>

        <div ref={logRef} style={log} aria-live="polite">
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={m.role === 'user' ? userBubble : avaBubble}>{m.text}</div>
            </div>
          ))}
          {waiting && (
            <div style={{ ...avaBubble, display: 'inline-block', opacity: 0.7 }} aria-label="Ava is writing">
              <span className="kk-cg-dots"><i /><i /><i /></span>
            </div>
          )}
          {notice && (
            <p role="alert" style={noticeBox}>
              {notice === 'limit'
                ? 'That’s all the room this conversation has. Choose a date on the calendar and Stephen will take it from here.'
                : 'Ava can’t reply just now. You can choose a date on the calendar instead, and Stephen will follow up personally.'}
              {' '}<a href="/book" style={{ color: GOLD_HI }}>Open the calendar →</a>
            </p>
          )}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ padding: '12px 16px 0' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={draft}
              rows={1}
              maxLength={MAX_CHARS}
              aria-label="Message Ava"
              placeholder="Tell Ava about your occasion…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              style={textarea}
            />
            <button type="submit" disabled={waiting || !draft.trim()} className="kk-gold-btn"
                    style={{ ...sendBtn, opacity: waiting || !draft.trim() ? 0.5 : 1 }}>
              Send
            </button>
          </div>
        </form>

        <footer style={foot}>
          <span>
            Ava is an AI concierge. Conversations are shared with Stephen so he can follow up.
          </span>
          <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <a href="/book" style={footLink}>Prefer the calendar?</a>
            {turns > 0 && <button type="button" onClick={restart} disabled={waiting} style={{ ...footLink, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Start over</button>}
          </span>
        </footer>
      </section>
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const CSS = `
.kk-cg-root{position:fixed;inset:0;z-index:1000;background:rgba(8,7,6,0.62);display:flex;justify-content:flex-end;animation:kk-cg-fade .2s ease-out}
.kk-cg-panel{animation:kk-cg-in .26s cubic-bezier(.2,.8,.2,1)}
@keyframes kk-cg-fade{from{opacity:0}to{opacity:1}}
@keyframes kk-cg-in{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
@media (max-width:560px){
  .kk-cg-panel{width:100% !important;max-width:none !important;border-left:none !important}
  @keyframes kk-cg-in{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
}
.kk-cg-dots{display:inline-flex;gap:4px;padding:2px 0}
.kk-cg-dots i{width:6px;height:6px;border-radius:50%;background:${GOLD};opacity:.35;animation:kk-cg-dot 1.1s infinite}
.kk-cg-dots i:nth-child(2){animation-delay:.15s}.kk-cg-dots i:nth-child(3){animation-delay:.3s}
@keyframes kk-cg-dot{0%,60%,100%{opacity:.35}30%{opacity:1}}
@media (prefers-reduced-motion:reduce){.kk-cg-root,.kk-cg-panel,.kk-cg-dots i{animation:none}}
`;

const panel: CSSProperties = {
  width: 420, maxWidth: '100%', height: '100%', boxSizing: 'border-box',
  display: 'flex', flexDirection: 'column',
  background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 38%, ${INK} 100%)`,
  borderLeft: `1px solid ${LINE2}`, boxShadow: '-24px 0 60px rgba(0,0,0,0.45)',
  fontFamily: FB, color: TEXT,
};

const head: CSSProperties = {
  display: 'flex', alignItems: 'flex-start', gap: 12,
  padding: '18px 16px 14px', borderBottom: `1px solid ${LINE}`,
};

const title: CSSProperties = {
  margin: 0, fontFamily: FD, fontWeight: 600, fontSize: 26, lineHeight: 1.1, color: TEXT,
};

const subtitle: CSSProperties = {
  margin: '4px 0 0', fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', color: GOLD, fontWeight: 500,
};

const closeBtn: CSSProperties = {
  marginLeft: 'auto', width: 40, height: 40, flexShrink: 0, borderRadius: '50%',
  background: 'rgba(0,0,0,0.25)', border: `1px solid ${LINE2}`, color: TEXT,
  fontSize: 15, cursor: 'pointer',
};

const log: CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '16px 16px 6px',
};

const bubbleBase: CSSProperties = {
  maxWidth: '86%', padding: '10px 13px', borderRadius: 14, fontSize: 15, lineHeight: 1.55,
  whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: FB,
};

const avaBubble: CSSProperties = {
  ...bubbleBase, background: PANEL2, color: TEXT, border: `1px solid ${LINE}`, borderBottomLeftRadius: 4,
};

const userBubble: CSSProperties = {
  ...bubbleBase, background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 100%)`, color: INK, borderBottomRightRadius: 4,
};

const noticeBox: CSSProperties = {
  margin: '6px 0 10px', fontSize: 13.5, lineHeight: 1.55, color: TEXT,
  background: PANEL, border: `1px solid ${LINE2}`, borderRadius: 12, padding: '10px 12px',
};

const textarea: CSSProperties = {
  flex: 1, minWidth: 0, boxSizing: 'border-box', background: '#0c0b0a', border: `1px solid ${LINE2}`,
  borderRadius: 12, padding: '11px 13px', color: TEXT, fontFamily: FB, fontSize: 16,
  outline: 'none', resize: 'none', lineHeight: 1.45, maxHeight: 140,
};

const sendBtn: CSSProperties = {
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`, color: INK,
  fontFamily: FB, fontWeight: 600, fontSize: 12.5, letterSpacing: '1.3px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '13px 18px', cursor: 'pointer', flexShrink: 0,
};

const foot: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6,
  padding: '10px 16px calc(14px + env(safe-area-inset-bottom))', fontSize: 11.5, lineHeight: 1.5, color: DIM,
};

const footLink: CSSProperties = {
  color: MUTED, fontFamily: FB, fontSize: 12, textDecoration: 'underline',
};
