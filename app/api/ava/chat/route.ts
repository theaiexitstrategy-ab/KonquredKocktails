// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/ava/chat — the public concierge behind every "Reserve a Date"
// button (app/components/AvaConcierge.tsx).
//
// Same Ava as the phone and the private test page (lib/ava-chat.ts). What
// this route adds:
//   * no passcode — it's the front door — so a tighter per-IP limit and a
//     cap on turns per conversation, because every message costs model usage;
//   * every turn is logged to the portal's Messaging → Agent tab
//     (lib/agent-log.ts), keyed by the browser's session id. The first turn
//     also logs Ava's greeting, so the transcript reads as the guest saw it;
//   * the session id rides on Ava's tool URL, so when she saves a lead the
//     conversation picks up the guest's name and lead id.
//
// Body: { session, message, previousChatId?, page? }
// 503 when Vapi or the tool secret isn't configured — the widget then sends
// the guest to the /book calendar instead.

import { CHAT_GREETING } from '@/lib/ava';
import { authedTools } from '@/lib/ava-tools';
import { avaChatTurn, clientIp, ipLimiter, isValidChatId, MAX_INPUT_CHARS } from '@/lib/ava-chat';
import { isValidSession, logAgentConversation } from '@/lib/agent-log';

export const dynamic = 'force-dynamic';

/** A real guest sends maybe 10–20 messages. */
const limited = ipLimiter(30, 10 * 60_000);
/** Matches the widget's cap; past it the guest is pointed to the calendar. */
const MAX_TURNS = 40;

export async function POST(req: Request) {
  let body: { session?: unknown; message?: unknown; previousChatId?: unknown; turn?: unknown; page?: unknown } = {};
  try { body = await req.json(); } catch { /* treated as empty */ }

  const session = body.session;
  if (!isValidSession(session)) return Response.json({ error: 'bad session' }, { status: 400 });

  const privateKey = process.env.VAPI_PRIVATE_KEY || '';
  const assistantId = process.env.VAPI_ASSISTANT_ID || '';
  const tools = authedTools('chat', session);
  if (!privateKey || !assistantId || !tools) {
    return Response.json({ error: 'unavailable' }, { status: 503 });
  }

  if (limited(clientIp(req)) || Number(body.turn) > MAX_TURNS) {
    return Response.json({ error: 'limit' }, { status: 429 });
  }

  const message = String(body.message ?? '').trim().slice(0, MAX_INPUT_CHARS);
  if (!message) return Response.json({ error: 'empty' }, { status: 400 });

  const previousChatId = isValidChatId(body.previousChatId) ? body.previousChatId : '';
  const turn = await avaChatTurn({
    privateKey, assistantId, tools, message, previousChatId,
    userAgent: 'konqueredkocktails.com/concierge',
  });

  if (!turn.ok) {
    console.error('[ava-concierge] vapi', turn.status, turn.detail);
    await logAgentConversation(session, { messages: [{ role: 'user', content: message }] });
    return Response.json({ error: 'unavailable' }, { status: 502 });
  }

  const page = typeof body.page === 'string' && body.page.startsWith('/') ? body.page.slice(0, 200) : '/';
  await logAgentConversation(session, {
    messages: [
      ...(previousChatId ? [] : [{ role: 'assistant' as const, content: CHAT_GREETING }]),
      { role: 'user', content: message },
      ...(turn.reply ? [{ role: 'assistant' as const, content: turn.reply }] : []),
    ],
    vapiChatId: turn.chatId,
    sourceUrl: previousChatId ? undefined : `https://konqueredkocktails.com${page}`,
  });

  return Response.json({ chatId: turn.chatId, reply: turn.reply });
}
