// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/subscribe — the lead capture at the top of /experiences.
//
// Does two things, in this order, because they have different failure modes:
//
//   1. Records SMS consent in public.sms_consents (if given). This is the
//      leg that must not be lost, so it runs first and its failure is
//      reported. TCPA requires provable express written consent BEFORE any
//      marketing text, and the record has to survive the lead being edited
//      or deleted — hence its own insert-only table storing the VERBATIM
//      disclosure the visitor agreed to, not a boolean.
//
//   2. Sends the lead to the portal so it lands with everything else.
//      A portal failure does NOT fail the request: the visitor has already
//      given us their details, and telling them it broke would just make
//      them submit twice.
//
// NO SMS IS SENT. Konquered Balance has no Twilio number provisioned
// (clients.twilio_phone_number is NULL), so there is nothing to send from.
// Consent is banked now so the welcome text can go out the moment a number
// exists — which is the correct order anyway. Do not add a send here that
// fires before consent is durably stored.

import { sb, CLIENT_ID, isSupabaseConfigured } from '@/lib/supabase';
import { callPortal } from '@/lib/portal';

export const dynamic = 'force-dynamic';

function field(value: unknown, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

/** US-centric E.164 normalisation, matching the portal's own helper. */
function toE164(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    return /^\d{10,15}$/.test(digits) ? cleaned : null;
  }
  const us10 = cleaned.replace(/^1/, '');
  return us10.length === 10 ? `+1${us10}` : null;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const name = field(body.name, 120);
  const email = field(body.email, 200);
  const phoneRaw = field(body.phone, 40);
  const phone = toE164(phoneRaw);

  if (!name) return Response.json({ error: 'Please enter your name.' }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }
  if (!phone) {
    return Response.json({ error: 'Please enter a valid mobile number.' }, { status: 400 });
  }

  const smsConsent = Boolean(body.sms_consent);
  const consentText = field(body.consent_text, 2000);

  // Consent without the language it was given against is not a record of
  // anything. Refuse rather than bank a claim we can't substantiate.
  if (smsConsent && !consentText) {
    return Response.json({ error: 'Consent could not be recorded.' }, { status: 400 });
  }

  /* ── 1. Consent, durably ─────────────────────────────────────────── */
  if (smsConsent && isSupabaseConfigured()) {
    const consent = await sb<null>('sms_consents', {
      method: 'POST',
      body: {
        client_id: CLIENT_ID,
        phone,
        name,
        email,
        granted: true,
        consent_text: consentText,
        source: field(body.source, 60) || 'experiences',
        source_url: field(body.source_url, 300) || null,
        user_agent: (req.headers.get('user-agent') || '').slice(0, 400),
      },
    });
    if (!consent.ok) {
      // Do not proceed as if they opted in. Better to ask again than to text
      // someone whose consent we failed to record.
      console.error('[subscribe] consent write failed', consent.error);
      return Response.json(
        { error: 'We could not record your text preference. Please try again.' },
        { status: 502 },
      );
    }
  }

  /* ── 2. Lead to the portal (best effort) ─────────────────────────── */
  const lead = await callPortal<{ lead_id: string; booking_id: string }>(
    'experience-leads',
    {
      method: 'POST',
      body: {
        name,
        email,
        phone,
        goal: field(body.goal, 200) || 'Experience Collection enquiry',
        experience_key: field(body.experience_key, 80),
        experience_display: field(body.experience_display, 200),
        source: 'kk-experiences',
        source_url: field(body.source_url, 300),
      },
    },
  );

  if (!lead.ok && !lead.demo) {
    console.warn('[subscribe] portal lead capture failed:', lead.error);
  }

  return Response.json({
    ok: true,
    sms_consent_recorded: smsConsent,
    // Surfaced so the confirmation can be honest about what happens next
    // instead of promising a text that cannot be sent yet.
    sms_pending_number: smsConsent,
    lead_captured: lead.ok,
  });
}
