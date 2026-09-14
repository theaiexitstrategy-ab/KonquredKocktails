// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Text chat with Ava on the private test page. Same assistant as the voice
// call, reached through /api/ava-test/chat. Brand words are flagged on Ava's
// replies the same way the voice transcript flags them.

import { useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  INK, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D,
  CREAM, TEXT, MUTED, LINE, LINE2, FB,
} from '../theme';
import { CHAT_GREETING, forbiddenIn } from '@/lib/ava';

type Msg = { role: 'assistant' | 'user'; text: string; flags: string[] };

const MAX_CHARS = 1000;

const opening = (): Msg[] => [{ role: 'assistant', text: CHAT_GREETING, flags: [] }];

export default function AvaChatPanel({ passcode }: { passcode: string }) {
  const [messages, setMessages] = useState<Msg[]>(opening);
  const [draft, setDraft] = useState('');
  const [chatId, setChatId] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState('');

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, waiting]);

  const flagged = messages.filter((m) => m.flags.length).length;
  const avaReplied = messages.filter((m) => m.role === 'assistant').length > 1;

  async function send() {
    const text = draft.trim();
    if (!text || waiting) return;
    setError('');
    setDraft('');
    setMessages((prev) => [...prev, { role: 'user', text, flags: [] }]);
    setWaiting(true);

    try {
      const res = await fetch('/api/ava-test/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode, message: text, previousChatId: chatId || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.detail ? `${data.error} (${data.status}: ${String(data.detail).slice(0, 160)})` : data?.error || 'Something went wrong.');
        return;
      }
      if (data.chatId) setChatId(data.chatId);
      const reply = String(data.reply || '').trim();
      setMessages((prev) => [
        ...prev,
        reply
          ? { role: 'assistant', text: reply, flags: forbiddenIn(reply) }
          : { role: 'assistant', text: '(Ava returned an empty reply.)', flags: [] },
      ]);
    } catch {
      setError('Network error.');
    } finally {
      setWaiting(false);
      inputRef.current?.focus();
    }
  }

  function reset() {
    setMessages(opening());
    setChatId('');
    setDraft('');
    setError('');
    inputRef.current?.focus();
  }

  return (
    <section style={{ ...card, background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, letterSpacing: '1.2px', textTransform: 'uppercase', color: CREAM, fontWeight: 500 }}>
          Text chat
        </span>
        <button type="button" onClick={reset} disabled={waiting} style={{ ...linkBtn, marginLeft: 'auto' }}>
          New conversation
        </button>
      </div>

      <div ref={logRef} style={log} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
            <div style={{ maxWidth: '82%' }}>
              <div style={m.role === 'user' ? userBubble : avaBubble}>
                {m.text}
              </div>
              {m.flags.length > 0 && (
                <p style={{ margin: '4px 2px 0', fontSize: 12, color: '#f0a9a9' }}>⚠ Off-brand: {m.flags.join(', ')}</p>
              )}
            </div>
          </div>
        ))}
        {waiting && (
          <div style={{ ...avaBubble, display: 'inline-block', opacity: 0.7 }} aria-label="Ava is typing">
            <span className="kk-dots">Ava is typing</span>
          </div>
        )}
      </div>

      {error && <p role="alert" style={errorText}>{error}</p>}

      <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ marginTop: 12 }}>
        <textarea
          ref={inputRef}
          value={draft}
          rows={2}
          maxLength={MAX_CHARS}
          placeholder="Type as a guest would…"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, Shift+Enter makes a new line — the usual chat convention.
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
          }}
          style={textarea}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span style={{ fontSize: 11.5, color: CREAM, opacity: 0.55 }}>
            Enter to send · Shift+Enter for a new line
          </span>
          <button type="submit" disabled={waiting || !draft.trim()} style={{ ...goldBtn, marginLeft: 'auto', opacity: waiting || !draft.trim() ? 0.55 : 1 }}>
            Send
          </button>
        </div>
      </form>

      <p style={{ margin: '14px 0 0', fontSize: 12, color: CREAM, opacity: 0.6 }}>
        Brand check this chat:{' '}
        {avaReplied
          ? flagged
            ? <strong style={{ color: '#f0a9a9' }}>{flagged} off-brand repl{flagged > 1 ? 'ies' : 'y'}</strong>
            : <strong style={{ color: '#8fd4a8' }}>clean so far</strong>
          : 'waiting for Ava to reply'}
      </p>
    </section>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const card: CSSProperties = {
  border: `1px solid ${LINE2}`, borderRadius: 16, padding: 'clamp(18px, 3vw, 26px)',
};

const log: CSSProperties = {
  marginTop: 16, height: 380, overflowY: 'auto', background: 'rgba(10,10,10,0.35)',
  border: `1px solid ${LINE2}`, borderRadius: 12, padding: 14,
};

const bubbleBase: CSSProperties = {
  padding: '10px 13px', borderRadius: 14, fontSize: 14.5, lineHeight: 1.55,
  whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: FB,
};

const avaBubble: CSSProperties = {
  ...bubbleBase, background: PANEL2, color: TEXT, border: `1px solid ${LINE}`, borderBottomLeftRadius: 4,
};

const userBubble: CSSProperties = {
  ...bubbleBase, background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 100%)`, color: INK, borderBottomRightRadius: 4,
};

const textarea: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0c0b0a', border: `1px solid ${LINE2}`,
  borderRadius: 10, padding: '11px 13px', color: TEXT, fontFamily: FB, fontSize: 15,
  outline: 'none', resize: 'vertical', lineHeight: 1.5,
};

const goldBtn: CSSProperties = {
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`, color: INK,
  fontFamily: FB, fontWeight: 600, fontSize: 12.5, letterSpacing: '1.3px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '11px 22px', cursor: 'pointer',
};

const linkBtn: CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
  color: MUTED, fontFamily: FB, fontSize: 12, textDecoration: 'underline',
};

const errorText: CSSProperties = {
  margin: '12px 0 0', fontSize: 13, color: '#f0a9a9', lineHeight: 1.5,
  background: 'rgba(104,31,43,0.4)', border: '1px solid rgba(240,169,169,0.35)',
  borderRadius: 10, padding: '10px 12px',
};
