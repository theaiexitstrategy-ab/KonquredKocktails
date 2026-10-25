// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-only. Logs Ava's public chats to the portal (Messaging → Agent) via
// POST /api/external/agent-conversations, with the tenant write key — the
// same credential /book uses, so nothing new is needed on either side.
//
// One row per session. Every turn appends; the lead tool fills in who the
// guest is. A logging failure never fails the chat: the guest is mid-
// conversation, and losing a log line is better than losing the guest.

import { callPortal } from '@/lib/portal';

/** Matches the portal's session_id check. Minted in the browser with
 *  crypto.randomUUID(), so it is unguessable. */
export const isValidSession = (v: unknown): v is string =>
  typeof v === 'string' && /^[\w-]{8,100}$/.test(v);

export async function logAgentConversation(sessionId: string, entry: {
  messages?: { role: 'user' | 'assistant'; content: string }[];
  vapiChatId?: string;
  sourceUrl?: string;
  leadId?: string;
  name?: string;
  email?: string;
  phone?: string;
}): Promise<void> {
  const at = new Date().toISOString();
  const result = await callPortal<{ ok: boolean; id: string }>('agent-conversations', {
    method: 'POST',
    body: {
      session_id: sessionId,
      channel: 'chat',
      messages: (entry.messages ?? []).map((m) => ({ ...m, at })),
      vapi_chat_id: entry.vapiChatId || undefined,
      source_url: entry.sourceUrl || undefined,
      lead_id: entry.leadId || undefined,
      name: entry.name || undefined,
      email: entry.email || undefined,
      phone: entry.phone || undefined,
    },
  });
  if (!result.ok && !result.demo) console.error('[agent-log]', result.status, result.error);
}
