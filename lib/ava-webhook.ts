// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-only. The shared half of Ava's Vapi tool webhooks (/api/ava/lead,
// /api/ava/availability): the secret-header check, the tool-call envelope,
// and the reply shape.
//
// Vapi expects HTTP 200 with { results: [{ toolCallId, result }] }. The result
// string is read by the model, not the guest, so it is written as an
// instruction to Ava. A failure still returns 200 with a result telling Ava
// what to say; a non-200 would surface as a tool error mid-conversation.

import { timingSafeEqual } from 'node:crypto';
import { TOOL_SECRET_HEADER, toolSecret } from '@/lib/ava-tools';

export type ToolCall = {
  id?: string;
  name?: string;
  function?: { name?: string; arguments?: unknown };
  arguments?: unknown;
};

export type ToolContext = { channel: 'voice' | 'chat'; callId: string; session: string };

export const clean = (v: unknown, max = 200) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

export const isValidSessionParam = (v: unknown): v is string =>
  typeof v === 'string' && /^[\w-]{8,100}$/.test(v);

function matches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseArgs<T>(call: ToolCall): T {
  const raw = call.function?.arguments ?? call.arguments ?? {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return {} as T; }
  }
  return raw as T;
}

/** Authenticates the webhook, unpacks the tool calls, runs each through
 *  `handlers` by tool name, and replies in Vapi's shape. */
export async function handleToolWebhook(
  req: Request,
  handlers: Record<string, (call: ToolCall, ctx: ToolContext) => Promise<string>>,
): Promise<Response> {
  const secret = toolSecret();
  if (!secret) return Response.json({ error: 'not configured' }, { status: 503 });
  if (!matches(req.headers.get(TOOL_SECRET_HEADER) || '', secret)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: {
    message?: { toolCallList?: ToolCall[]; toolCalls?: ToolCall[]; call?: { id?: string } };
  } = {};
  try { body = await req.json(); } catch { /* treated as empty */ }

  const msg = body.message ?? {};
  const calls = msg.toolCallList ?? msg.toolCalls ?? [];
  const params = new URL(req.url).searchParams;
  const session = params.get('session');
  const ctx: ToolContext = {
    channel: params.get('channel') === 'chat' ? 'chat' : 'voice',
    callId: clean(msg.call?.id, 80),
    session: isValidSessionParam(session) ? session : '',
  };

  const results = await Promise.all(calls.map(async (call) => {
    const name = call.function?.name ?? call.name ?? '';
    const handler = handlers[name];
    const result = handler ? await handler(call, ctx) : `Unknown tool ${clean(name, 40)}.`;
    return { toolCallId: call.id ?? '', result };
  }));

  return Response.json({ results });
}
