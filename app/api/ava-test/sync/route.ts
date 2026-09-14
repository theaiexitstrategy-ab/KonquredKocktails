// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/ava-test/sync — push konquered-kocktails-vapi-assistant.json to Vapi.
//
// Creates the assistant if VAPI_ASSISTANT_ID is unset, otherwise PATCHes the
// existing one, so edits after testing are one call rather than a rebuild.
//
// WHY THIS RUNS SERVER-SIDE: VAPI_PRIVATE_KEY is stored in Vercel as a
// Sensitive variable. Sensitive values are injected into running deployments
// but are never returned to the CLI, so the key cannot be used from a
// terminal. It can be used here.
//
// Locked to a bearer admin token (AVA_ADMIN_TOKEN) compared in constant time.
// The private key never appears in any response — only the assistant's id,
// name, voice and model come back.

import { timingSafeEqual } from 'node:crypto';
import config from '@/konquered-kocktails-vapi-assistant.json';
import { authedTools } from '@/lib/ava-tools';

export const dynamic = 'force-dynamic';

function tokenMatches(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const adminToken = process.env.AVA_ADMIN_TOKEN || '';
  const privateKey = process.env.VAPI_PRIVATE_KEY || '';
  const existingId = process.env.VAPI_ASSISTANT_ID || '';

  if (!adminToken) return Response.json({ error: 'AVA_ADMIN_TOKEN not set' }, { status: 503 });

  const auth = req.headers.get('authorization') || '';
  const given = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!tokenMatches(given, adminToken)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(privateKey)) {
    // Report the shape, never the value.
    return Response.json(
      { error: 'VAPI_PRIVATE_KEY missing or not UUID-shaped', length: privateKey.length },
      { status: 503 },
    );
  }

  // Ava's capture_lead tool posts back to this site; without its secret
  // header every save would be rejected, so refuse to sync at all.
  const tools = authedTools('voice');
  if (!tools) return Response.json({ error: 'AVA_TOOL_SECRET not set' }, { status: 503 });
  const payload = { ...config, model: { ...config.model, tools } };

  const url = existingId
    ? `https://api.vapi.ai/assistant/${encodeURIComponent(existingId)}`
    : 'https://api.vapi.ai/assistant';

  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${privateKey}`,
      'Content-Type': 'application/json',
      // Vapi sits behind Cloudflare, which rejects some default client
      // signatures (error 1010). Send an explicit, honest user agent.
      'User-Agent': 'konqueredkocktails.com/ava-sync',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try { data = JSON.parse(text); } catch { /* non-JSON error body */ }

  if (!res.ok) {
    return Response.json(
      { error: 'Vapi rejected the request', status: res.status, body: text.slice(0, 2000) },
      { status: 502 },
    );
  }

  const model = (data.model ?? {}) as { provider?: string; model?: string };
  return Response.json({
    action: existingId ? 'updated' : 'created',
    id: data.id,
    name: data.name,
    voice: data.voice,
    model: `${model.provider ?? ''} ${model.model ?? ''}`.trim(),
    tools: ((data.model as { tools?: { function?: { name?: string } }[] })?.tools ?? []).map((t) => t.function?.name),
    dashboard: data.id ? `https://dashboard.vapi.ai/assistants/${data.id}` : null,
  });
}
