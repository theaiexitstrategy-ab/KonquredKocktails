// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
'use client';

// Private test page for Ava, the Konquered Kocktails voice concierge.
// konqueredkocktails.com/ava — unlisted, noindex, passcode-locked.
//
// Lets Aaron and Stephen talk to the assistant through the browser mic before
// it is ever attached to a phone number. Nothing here touches Telnyx.
//
// The transcript watcher is a testing aid: it flags any forbidden brand word
// the moment Ava says it, so a slip is caught live instead of discovered in
// the post-call PASS/FAIL evaluation.

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';

import {
  INK, PANEL, PANEL2, EMERALD, EMERALD_D, GOLD, GOLD_HI, GOLD_D,
  CREAM, TEXT, MUTED, DIM, LINE, LINE2, FD, FB,
} from '../theme';

/** Words Ava must never say. Matched on her lines only — a caller using
 *  them is fine. Mirrors the NON-NEGOTIABLE BRAND LANGUAGE block in her
 *  system prompt. */
const FORBIDDEN = [
  'bartending', 'bartender', 'book now', 'booking', 'drink menu',
  'cocktail class', 'mixology education', 'mixology lesson', 'just drinks',
  'available for hire',
];

type Line = { role: 'assistant' | 'user'; text: string; flags: string[] };
type Phase = 'locked' | 'ready' | 'connecting' | 'live' | 'ended';

type VapiLike = {
  start: (assistantId: string, overrides?: Record<string, unknown>) => Promise<unknown>;
  stop: () => Promise<void>;
  setMuted: (m: boolean) => void;
  on: (event: string, cb: (...args: never[]) => void) => void;
  removeAllListeners?: () => void;
};

/* Voices to compare by ear. Applied as a per-call override, so trying one
   never changes the saved assistant — tell Aaron which one wins and it gets
   made permanent with a sync. Names are Vapi's built-in ElevenLabs aliases,
   which Vapi guarantees exist, rather than raw 11labs voice ids.

   eleven_turbo_v2_5 is the realism/latency balance for live calls: clearly
   more natural than the Flash models, still fast enough not to lag. A little
   lower stability lets the delivery vary instead of sounding read-out. */
const ELEVEN = { provider: '11labs', model: 'eleven_turbo_v2_5', stability: 0.45, similarityBoost: 0.8, useSpeakerBoost: true };
const VOICES: { id: string; label: string; note: string; voice: Record<string, unknown> | null }[] = [
  { id: 'saved', label: 'Saved voice', note: 'Whatever Ava is set to right now (Sarah)', voice: null },
  { id: 'sarah', label: 'Sarah', note: 'Soft, warm, composed', voice: { ...ELEVEN, voiceId: 'sarah' } },
  { id: 'matilda', label: 'Matilda', note: 'Warm, friendly, grounded', voice: { ...ELEVEN, voiceId: 'matilda' } },
  { id: 'andrea', label: 'Andrea', note: 'Polished, professional', voice: { ...ELEVEN, voiceId: 'andrea' } },
  { id: 'marissa', label: 'Marissa', note: 'Bright, conversational', voice: { ...ELEVEN, voiceId: 'marissa' } },
  { id: 'myra', label: 'Myra', note: 'Gentle, unhurried', voice: { ...ELEVEN, voiceId: 'myra' } },
  { id: 'paula', label: 'Paula', note: 'Mature, reassuring', voice: { ...ELEVEN, voiceId: 'paula' } },
  { id: 'savannah', label: 'Savannah (old)', note: 'The original Vapi voice, for comparison', voice: { provider: 'vapi', voiceId: 'Savannah' } },
];

const SCENARIOS = [
  { title: 'The ideal caller', body: '40th birthday, ~35 guests, St. Charles, six weeks out. Wants guests to feel celebrated. Should route to the Signature experience and offer the 15-minute Experience Discovery.' },
  { title: 'Under three weeks', body: 'Corporate mixer in 10 days. Should mention the three-week design window and offer Krafted Expressions.' },
  { title: 'Just wants a bar', body: '“I just need a bartender for 4 hours, what’s your hourly rate?” Should redirect gracefully — never say bartender, never disparage.' },
  { title: 'Price pressure', body: 'Push for an exact total and a discount. Should give starting investments only and never discount the flagship.' },
  { title: 'Trying to pay', body: '“Can I just put a deposit down now over the phone?” Should decline payment and point to the Discovery.' },
  { title: 'Is this a robot?', body: 'Ask directly. Should answer honestly and briefly, then keep helping.' },
];

export default function AvaTestClient() {
  const [phase, setPhase] = useState<Phase>('locked');
  const [passcode, setPasscode] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [busy, setBusy] = useState(false);
  const [creds, setCreds] = useState<{ publicKey: string; assistantId: string } | null>(null);

  const [lines, setLines] = useState<Line[]>([]);
  const [partial, setPartial] = useState<{ role: string; text: string } | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callError, setCallError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [voiceId, setVoiceId] = useState('saved');
  const chosenVoice = VOICES.find((v) => v.id === voiceId) ?? VOICES[0];

  const vapiRef = useRef<VapiLike | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const flagged = lines.filter((l) => l.flags.length);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines, partial]);

  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => () => { vapiRef.current?.stop().catch(() => {}); }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setUnlockError('');
    try {
      const res = await fetch('/api/ava-test/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setUnlockError(data?.error || 'Could not unlock.'); return; }
      setCreds(data);
      setPhase('ready');
    } catch {
      setUnlockError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  const startCall = useCallback(async () => {
    if (!creds) return;
    setCallError('');
    setLines([]);
    setPartial(null);
    setSeconds(0);
    setPhase('connecting');

    try {
      // Loaded on demand: the SDK touches WebRTC and window, which don't
      // exist during server rendering.
      const { default: Vapi } = await import('@vapi-ai/web');
      const vapi = new Vapi(creds.publicKey) as unknown as VapiLike;
      vapiRef.current = vapi;

      vapi.on('call-start', () => setPhase('live'));
      vapi.on('call-end', () => { setPhase('ended'); setSpeaking(false); setPartial(null); });
      vapi.on('speech-start', () => setSpeaking(true));
      vapi.on('speech-end', () => setSpeaking(false));
      vapi.on('error', ((err: unknown) => {
        const msg = typeof err === 'object' && err && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'The call hit an error.';
        setCallError(msg);
      }) as never);
      vapi.on('message', ((m: {
        type?: string; role?: 'assistant' | 'user';
        transcriptType?: 'partial' | 'final'; transcript?: string;
      }) => {
        if (m?.type !== 'transcript' || !m.role || !m.transcript) return;
        if (m.transcriptType === 'partial') { setPartial({ role: m.role, text: m.transcript }); return; }
        const text = m.transcript;
        const lower = text.toLowerCase();
        const flags = m.role === 'assistant' ? FORBIDDEN.filter((w) => lower.includes(w)) : [];
        setPartial(null);
        setLines((prev) => [...prev, { role: m.role!, text, flags }]);
      }) as never);

      await vapi.start(
        creds.assistantId,
        chosenVoice.voice ? { voice: chosenVoice.voice } : undefined,
      );
    } catch (err) {
      setPhase('ready');
      setCallError(
        err instanceof Error && /permission|notallowed/i.test(err.message)
          ? 'Microphone access was blocked. Allow the mic for this site and try again.'
          : 'Could not start the call. Check the mic permission and try again.',
      );
    }
  }, [creds, chosenVoice]);

  async function endCall() {
    await vapiRef.current?.stop().catch(() => {});
    setPhase('ended');
  }

  function toggleMute() {
    const next = !muted;
    vapiRef.current?.setMuted(next);
    setMuted(next);
  }

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <main style={{ background: INK, color: TEXT, fontFamily: FB, fontWeight: 300, minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(28px, 5vw, 56px) 20px' }}>
        <p style={eyebrow}>Private · Internal testing</p>
        <h1 style={{ margin: '12px 0 0', fontFamily: FD, fontWeight: 700, fontSize: 'clamp(34px, 5vw, 52px)', lineHeight: 1.08 }}>
          Talk to <span style={{ color: GOLD }}>Ava</span>
        </h1>
        <p style={{ margin: '12px 0 0', color: CREAM, opacity: 0.8, fontSize: 15.5, lineHeight: 1.7, maxWidth: 640 }}>
          The Konquered Kocktails Experience Concierge, before she&rsquo;s on a phone number.
          Use headphones if you can — speakers can feed her own voice back into the mic.
        </p>

        {phase === 'locked' ? (
          <form onSubmit={unlock} style={{ ...card, maxWidth: 420, marginTop: 28 }}>
            <label style={{ display: 'block' }}>
              <span style={label}>6-digit code</span>
              <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                value={passcode} autoFocus autoComplete="one-time-code"
                onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ ...input, letterSpacing: '0.5em', fontSize: 22, textAlign: 'center' }} />
            </label>
            {unlockError && <p role="alert" style={errorText}>{unlockError}</p>}
            <button type="submit" disabled={busy || passcode.length !== 6} style={{ ...goldBtn, width: '100%', marginTop: 16, opacity: busy || passcode.length !== 6 ? 0.6 : 1 }}>
              {busy ? 'Checking…' : 'Unlock'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'grid', gap: 22, marginTop: 28, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'start' }}>
            {/* ── Call panel ─────────────────────────────────────── */}
            <section style={{ ...card, background: `linear-gradient(180deg, ${EMERALD} 0%, ${EMERALD_D} 100%)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span aria-hidden="true" style={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  background: phase === 'live' ? (speaking ? GOLD_HI : '#6fbf8f') : phase === 'connecting' ? GOLD : DIM,
                  boxShadow: phase === 'live' && speaking ? `0 0 14px ${GOLD_HI}` : 'none',
                  transition: 'all .2s ease',
                }} />
                <span aria-live="polite" style={{ fontSize: 13, letterSpacing: '1.2px', textTransform: 'uppercase', color: CREAM, fontWeight: 500 }}>
                  {phase === 'ready' && 'Ready'}
                  {phase === 'connecting' && 'Connecting…'}
                  {phase === 'live' && (speaking ? 'Ava is speaking' : 'Listening')}
                  {phase === 'ended' && 'Call ended'}
                </span>
                {phase === 'live' && <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', color: CREAM, opacity: 0.7, fontSize: 13 }}>{mmss}</span>}
              </div>

              <div ref={logRef} style={transcriptBox} aria-live="polite">
                {lines.length === 0 && !partial && (
                  <p style={{ margin: 0, color: CREAM, opacity: 0.5, fontSize: 13.5 }}>
                    {phase === 'ready' || phase === 'ended'
                      ? 'Start a call — Ava speaks first.'
                      : 'Waiting for Ava…'}
                  </p>
                )}
                {lines.map((l, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: l.role === 'assistant' ? GOLD : MUTED, fontWeight: 600 }}>
                      {l.role === 'assistant' ? 'Ava' : 'You'}
                    </span>
                    <p style={{ margin: '3px 0 0', fontSize: 14.5, lineHeight: 1.6, color: TEXT }}>{l.text}</p>
                    {l.flags.length > 0 && (
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#f0a9a9' }}>
                        ⚠ Off-brand: {l.flags.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
                {partial && (
                  <p style={{ margin: 0, fontSize: 14, color: CREAM, opacity: 0.55, fontStyle: 'italic' }}>
                    {partial.role === 'assistant' ? 'Ava: ' : 'You: '}{partial.text}
                  </p>
                )}
              </div>

              {callError && <p role="alert" style={errorText}>{callError}</p>}

              {(phase === 'ready' || phase === 'ended') && (
                <label style={{ display: 'block', marginTop: 16 }}>
                  <span style={label}>Voice for this call</span>
                  <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} style={input}>
                    {VOICES.map((v) => (
                      <option key={v.id} value={v.id} style={{ background: PANEL2, color: TEXT }}>
                        {v.label} — {v.note}
                      </option>
                    ))}
                  </select>
                  <span style={{ display: 'block', marginTop: 6, fontSize: 11.5, color: CREAM, opacity: 0.6, lineHeight: 1.5 }}>
                    Trying a voice doesn&rsquo;t change Ava. Note the one you like best.
                  </span>
                </label>
              )}

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                {phase === 'live' || phase === 'connecting' ? (
                  <>
                    <button type="button" onClick={toggleMute} disabled={phase !== 'live'} style={{ ...ghostBtn, flex: 1 }}>
                      {muted ? 'Unmute' : 'Mute'}
                    </button>
                    <button type="button" onClick={endCall} style={{ ...ghostBtn, flex: 1, borderColor: '#b85c6a', color: '#f0a9a9' }}>
                      End call
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={startCall} style={{ ...goldBtn, flex: 1 }}>
                    {phase === 'ended' ? 'Call Ava again' : 'Start a call'}
                  </button>
                )}
              </div>

              <p style={{ margin: '14px 0 0', fontSize: 12, color: CREAM, opacity: 0.6, lineHeight: 1.6 }}>
                Brand check this call:{' '}
                {lines.some((l) => l.role === 'assistant')
                  ? flagged.length
                    ? <strong style={{ color: '#f0a9a9' }}>{flagged.length} off-brand line{flagged.length > 1 ? 's' : ''}</strong>
                    : <strong style={{ color: '#8fd4a8' }}>clean so far</strong>
                  : 'waiting for Ava to speak'}
              </p>
            </section>

            {/* ── What to try ───────────────────────────────────── */}
            <section style={card}>
              <h2 style={{ margin: 0, fontFamily: FD, fontWeight: 700, fontSize: 24 }}>What to try</h2>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
                Play a caller. One scenario per call works best.
              </p>
              <ol style={{ listStyle: 'none', margin: '16px 0 0', padding: 0, display: 'grid', gap: 12 }}>
                {SCENARIOS.map((s, i) => (
                  <li key={s.title} style={{ background: PANEL2, border: `1px solid ${LINE}`, borderRadius: 12, padding: '12px 14px' }}>
                    <span style={{ fontSize: 10, letterSpacing: '1.4px', textTransform: 'uppercase', color: GOLD, fontWeight: 600 }}>
                      {String(i + 1).padStart(2, '0')} · {s.title}
                    </span>
                    <p style={{ margin: '5px 0 0', fontSize: 13.5, color: CREAM, opacity: 0.85, lineHeight: 1.6 }}>{s.body}</p>
                  </li>
                ))}
              </ol>
              <p style={{ margin: '16px 0 0', fontSize: 12, color: DIM, lineHeight: 1.6 }}>
                Every call also gets a summary, a structured lead record, and a PASS/FAIL
                brand evaluation in the Vapi dashboard afterwards.
              </p>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

/* ── Styles ───────────────────────────────────────────────────────── */

const eyebrow: CSSProperties = {
  margin: 0, fontSize: 11, letterSpacing: '2.4px', textTransform: 'uppercase', color: GOLD, fontWeight: 500,
};

const card: CSSProperties = {
  background: PANEL, border: `1px solid ${LINE2}`, borderRadius: 16, padding: 'clamp(18px, 3vw, 26px)',
};

const label: CSSProperties = {
  display: 'block', fontSize: 10.5, letterSpacing: '1.4px', textTransform: 'uppercase',
  color: CREAM, opacity: 0.7, marginBottom: 8, fontWeight: 500,
};

const input: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#0c0b0a', border: `1px solid ${LINE2}`,
  borderRadius: 10, padding: '13px 14px', color: TEXT, fontFamily: FB, fontSize: 16, outline: 'none',
};

const transcriptBox: CSSProperties = {
  marginTop: 16, height: 360, overflowY: 'auto', background: 'rgba(10,10,10,0.35)',
  border: `1px solid ${LINE2}`, borderRadius: 12, padding: 16,
};

const goldBtn: CSSProperties = {
  background: `linear-gradient(180deg, ${GOLD_HI} 0%, ${GOLD} 55%, ${GOLD_D} 100%)`, color: INK,
  fontFamily: FB, fontWeight: 600, fontSize: 13, letterSpacing: '1.4px', textTransform: 'uppercase',
  border: 'none', borderRadius: 999, padding: '15px 24px', cursor: 'pointer',
};

const ghostBtn: CSSProperties = {
  background: 'transparent', color: CREAM, fontFamily: FB, fontWeight: 500, fontSize: 13,
  letterSpacing: '1.4px', textTransform: 'uppercase', border: `1px solid ${LINE2}`,
  borderRadius: 999, padding: '14px 20px', cursor: 'pointer',
};

const errorText: CSSProperties = {
  margin: '14px 0 0', fontSize: 13, color: '#f0a9a9', lineHeight: 1.5,
  background: 'rgba(104,31,43,0.4)', border: '1px solid rgba(240,169,169,0.35)',
  borderRadius: 10, padding: '10px 12px',
};
