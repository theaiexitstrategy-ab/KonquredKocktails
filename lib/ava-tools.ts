// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Server-only. Ava's tools call back into this site (/api/ava/lead), so each
// tool's server block needs a shared secret header — otherwise anyone could
// post fake leads into Stephen's portal. The secret lives in AVA_TOOL_SECRET
// and is added here at runtime, so the committed assistant JSON never holds it.
//
// Used by both paths that hand Ava's model to Vapi: the sync route (voice,
// saved on the assistant) and the chat route (per-turn model override, which
// replaces the saved tools and so must carry the header too).

import assistantConfig from '@/konquered-kocktails-vapi-assistant.json';

export const TOOL_SECRET_HEADER = 'x-ava-tool-secret';

export type AvaChannel = 'voice' | 'chat';

export const toolSecret = () => process.env.AVA_TOOL_SECRET || '';

/** Ava's tools with the auth header added and the channel tagged on the URL,
 *  so a saved lead records whether it came from a call or a chat. Returns
 *  null when AVA_TOOL_SECRET is unset — callers refuse rather than ship
 *  tools that would be rejected on every call. */
export function authedTools(channel: AvaChannel) {
  const secret = toolSecret();
  if (!secret) return null;
  return assistantConfig.model.tools.map((tool) => {
    const url = new URL(tool.server.url);
    url.searchParams.set('channel', channel);
    return {
      ...tool,
      server: { ...tool.server, url: url.toString(), headers: { [TOOL_SECRET_HEADER]: secret } },
    };
  });
}
