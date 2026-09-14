// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/ava-test/chat — text chat with Ava, for the private /ava page.
//
// Same assistant as the voice concierge, via Vapi's Chat API, so pricing,
// routing, brand-language rules and the Experience Discovery handoff are
// defined once and shared by phone and chat. Nothing about Ava is copied here.
//
// What IS added is a short text-channel note. Ava's master prompt is written
// for speech — "say seven hundred fifty dollars, not $750" — which reads
// strangely in a chat window.
//
// The note is applied through assistantOverrides.model on EVERY turn, as the
// top of a system prompt built at runtime from the same master prompt file.
// Sending it as a system message inside `input` does not work: Vapi's Chat API
// drops system messages there. Verified by asking Ava which channel she was on
// — she answered "a phone call" despite the note.
//
// Server-side only: Vapi's Chat API requires the PRIVATE key, which must never
// reach a browser. Locked to the test page's 6-digit code, with a per-IP
// message limit, because every message costs model usage.

import { timingSafeEqual } from 'node:crypto';
import { CHAT_GREETING } from '@/lib/ava';
import assistantConfig from '@/konquered-kocktails-vapi-assistant.json';
import { authedTools } from '@/lib/ava-tools';

export const dynamic = 'force-dynamic';

const MAX_INPUT_CHARS = 1000;
const WINDOW_MS = 10 * 60_000;
/** Plenty for two people testing; stops a runaway loop or a leaked code
 *  from quietly burning model spend. */
const MAX_MESSAGES_PER_WINDOW = 40;

const HITS = new Map<string, { n: number; until: number }>();

/** The text-channel override. Delivery only — every business rule stays with
 *  the master prompt in konquered-kocktails-vapi-assistant.json. */
const CHANNEL_NOTE = [
  'CHANNEL: This conversation is a TEXT CHAT on konqueredkocktails.com, not a phone call.',
  'Only the voice-delivery instructions change for this channel:',
  '- Write prices as numerals, e.g. "$750" and "$1,250", not spelled out.',
  '- Keep replies brief: two or three short sentences. Plain text. No markdown headings, bold, or tables.',
  '- A short list is fine only when naming a few options helps the guest choose.',
  '- Ask one question at a time.',
  'Every other rule still applies exactly as written: identity, brand language, offerings and minimums,',
  'routing, graceful redirect, booking rules, and guardrails.',
  'To move an aligned guest forward, ask for their name, email and phone here so Stephen can arrange',
  'the complimentary 15-minute Experience Discovery. Never take payment in chat.',
].join('\n');

/** Ava's model block with the channel note placed first, so it is read before
 *  the voice-delivery rules it adjusts. Derived from the master prompt at
 *  runtime — never a hand-maintained copy. The override replaces the saved
 *  tools, so they are re-attached here with their auth header and tagged as
 *  chat. */
const chatModel = (tools: NonNullable<ReturnType<typeof authedTools>>) => ({
  ...assistantConfig.model,
  tools,
  messages: [{
    role: 'system',
    content: `${CHANNEL_NOTE}

${assistantConfig.model.messages[0].content}`,
  }],
});

function limited(ip: string): boolean {
  const now = Date.now();
  const rec = HITS.get(ip);
  if (!rec || now > rec.until) {
    HITS.set(ip, { n: 1, until: now + WINDOW_MS });
    if (HITS.size > 2000) HITS.clear();
    return false;
  }
  rec.n += 1;
  return rec.n > MAX_MESSAGES_PER_WINDOW;
}

function matches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const passcode = process.env.AVA_TEST_PASSCODE || '';
  const privateKey = process.env.VAPI_PRIVATE_KEY || '';
  const assistantId = process.env.VAPI_ASSISTANT_ID || '';
  const tools = authedTools('chat');
  if (!passcode || !privateKey || !assistantId || !tools) {
    return Response.json({ error: 'Chat isn’t configured yet.' }, { status: 503 });
  }

  let body: { passcode?: unknown; message?: unknown; previousChatId?: unknown } = {};
  try { body = await req.json(); } catch { /* treated as empty */ }

  if (!matches(String(body.passcode ?? ''), passcode)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) {
    return Response.json({ error: 'Message limit reached. Try again in a few minutes.' }, { status: 429 });
  }

  const message = String(body.message ?? '').trim().slice(0, MAX_INPUT_CHARS);
  if (!message) return Response.json({ error: 'Empty message.' }, { status: 400 });

  const previousChatId = typeof body.previousChatId === 'string' && /^[\w-]{1,100}$/.test(body.previousChatId)
    ? body.previousChatId
    : '';

  const assistantOverrides = { model: chatModel(tools) };
  const payload = previousChatId
    ? { assistantId, assistantOverrides, previousChatId, input: message }
    : {
        assistantId,
        assistantOverrides,
        input: [
          { role: 'assistant', content: CHAT_GREETING },
          { role: 'user', content: message },
        ],
      };

  const res = await fetch('https://api.vapi.ai/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${privateKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'konqueredkocktails.com/ava-chat',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await res.text();
  let data: { id?: string; output?: { role?: string; content?: string }[] } = {};
  try { data = JSON.parse(text); } catch { /* non-JSON error */ }

  if (!res.ok) {
    console.error('[ava-chat] vapi', res.status, text.slice(0, 500));
    return Response.json(
      { error: 'Ava couldn’t reply just now.', status: res.status, detail: text.slice(0, 500) },
      { status: 502 },
    );
  }

  const reply = (data.output ?? [])
    .filter((m) => m.role === 'assistant' && typeof m.content === 'string')
    .map((m) => m.content)
    .join('\n\n')
    .trim();

  return Response.json({ chatId: data.id ?? '', reply });
}
