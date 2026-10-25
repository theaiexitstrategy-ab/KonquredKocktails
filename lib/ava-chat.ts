// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-only. One text-chat turn with Ava through Vapi's Chat API. Shared by
// the public concierge behind "Reserve a Date" (/api/ava/chat) and the
// private test page (/api/ava-test/chat), so both talk to the same Ava.
//
// Same assistant as the voice concierge, so pricing, routing, brand-language
// rules and the Experience Discovery handoff are defined once and shared by
// phone and chat. What IS added is a short text-channel note. Ava's master
// prompt is written for speech — "say seven hundred fifty dollars, not $750"
// — which reads strangely in a chat window.
//
// The note is applied through assistantOverrides.model on EVERY turn, as the
// top of a system prompt built at runtime from the same master prompt file.
// Sending it as a system message inside `input` does not work: Vapi's Chat API
// drops system messages there. Verified by asking Ava which channel she was on
// — she answered "a phone call" despite the note.
//
// Vapi's Chat API requires the PRIVATE key, which must never reach a browser.

import { CHAT_GREETING } from '@/lib/ava';
import assistantConfig from '@/konquered-kocktails-vapi-assistant.json';
import { authedTools } from '@/lib/ava-tools';

export const MAX_INPUT_CHARS = 1000;

/** The text-channel override. Delivery only — every business rule stays with
 *  the master prompt in konquered-kocktails-vapi-assistant.json. */
const CHANNEL_NOTE = [
  'CHANNEL: This conversation is a TEXT CHAT on konqueredkocktails.com, not a phone call.',
  'The guest opened it from the "Reserve a Date" button, so they are thinking about a date.',
  'Only the voice-delivery instructions change for this channel:',
  '- Write prices as numerals, e.g. "$750" and "$1,250", not spelled out.',
  '- Keep replies brief: two or three short sentences. Plain text. No markdown headings, bold, or tables.',
  '- A short list is fine only when naming a few options helps the guest choose.',
  '- Ask one question at a time.',
  'Every other rule still applies exactly as written: identity, brand language, offerings and minimums,',
  'routing, graceful redirect, booking rules, and guardrails.',
  'To move an aligned guest forward, check their date with check_availability, ask for their name, email',
  'and phone, and share the reservation link for the date they choose. Never take card details in chat;',
  'the deposit is paid only on the calendar page the link opens.',
].join('\n');

type Tools = NonNullable<ReturnType<typeof authedTools>>;

/** Ava's model block with the channel note placed first, so it is read before
 *  the voice-delivery rules it adjusts. Derived from the master prompt at
 *  runtime — never a hand-maintained copy. The override replaces the saved
 *  tools, so the caller re-attaches them with their auth header. */
const chatModel = (tools: Tools) => ({
  ...assistantConfig.model,
  tools,
  messages: [{
    role: 'system',
    content: `${CHANNEL_NOTE}

${assistantConfig.model.messages[0].content}`,
  }],
});

export const isValidChatId = (v: unknown): v is string =>
  typeof v === 'string' && /^[\w-]{1,100}$/.test(v);

export type ChatTurn =
  | { ok: true; chatId: string; reply: string }
  | { ok: false; status: number; detail: string };

export async function avaChatTurn(opts: {
  privateKey: string;
  assistantId: string;
  tools: Tools;
  message: string;
  previousChatId?: string;
  userAgent: string;
}): Promise<ChatTurn> {
  const { privateKey, assistantId, tools, message, previousChatId, userAgent } = opts;
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
      'User-Agent': userAgent,
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await res.text();
  let data: { id?: string; output?: { role?: string; content?: string }[] } = {};
  try { data = JSON.parse(text); } catch { /* non-JSON error */ }

  if (!res.ok) return { ok: false, status: res.status, detail: text.slice(0, 500) };

  const reply = (data.output ?? [])
    .filter((m) => m.role === 'assistant' && typeof m.content === 'string')
    .map((m) => m.content)
    .join('\n\n')
    .trim();

  return { ok: true, chatId: data.id ?? '', reply };
}

/** Per-IP sliding window, per serverless instance. A speed bump against a
 *  runaway loop, not a guarantee — each instance keeps its own map. */
export function ipLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { n: number; until: number }>();
  return (ip: string): boolean => {
    const now = Date.now();
    const rec = hits.get(ip);
    if (!rec || now > rec.until) {
      hits.set(ip, { n: 1, until: now + windowMs });
      if (hits.size > 2000) hits.clear();
      return false;
    }
    rec.n += 1;
    return rec.n > max;
  };
}

export const clientIp = (req: Request) =>
  (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
