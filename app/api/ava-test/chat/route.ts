// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/ava-test/chat — text chat with Ava, for the private /ava page.
//
// The Vapi call, channel note and model override live in lib/ava-chat.ts,
// shared with the public concierge (/api/ava/chat). This route only adds the
// test page's gate: the 6-digit code, and a per-IP message limit, because
// every message costs model usage. Test chats are NOT logged to the portal's
// Agent tab — they would bury Stephen's real conversations.

import { timingSafeEqual } from 'node:crypto';
import { authedTools } from '@/lib/ava-tools';
import { avaChatTurn, clientIp, ipLimiter, isValidChatId, MAX_INPUT_CHARS } from '@/lib/ava-chat';

export const dynamic = 'force-dynamic';

/** Plenty for two people testing; stops a runaway loop or a leaked code
 *  from quietly burning model spend. */
const limited = ipLimiter(40, 10 * 60_000);

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

  if (limited(clientIp(req))) {
    return Response.json({ error: 'Message limit reached. Try again in a few minutes.' }, { status: 429 });
  }

  const message = String(body.message ?? '').trim().slice(0, MAX_INPUT_CHARS);
  if (!message) return Response.json({ error: 'Empty message.' }, { status: 400 });

  const turn = await avaChatTurn({
    privateKey, assistantId, tools, message,
    previousChatId: isValidChatId(body.previousChatId) ? body.previousChatId : '',
    userAgent: 'konqueredkocktails.com/ava-chat',
  });

  if (!turn.ok) {
    console.error('[ava-chat] vapi', turn.status, turn.detail);
    return Response.json(
      { error: 'Ava couldn’t reply just now.', status: turn.status, detail: turn.detail },
      { status: 502 },
    );
  }

  return Response.json({ chatId: turn.chatId, reply: turn.reply });
}
