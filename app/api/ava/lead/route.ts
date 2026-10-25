// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/ava/lead — Vapi tool webhook for Ava's capture_lead tool.
//
// Ava calls this from a voice call or a text chat once a guest has shared a
// name and email. The lead goes to the portal through the same
// experience-leads endpoint /book uses, so it lands in Stephen's portal next
// to every other enquiry. The portal's email re-engagement cron picks up
// leads whose source is ava-voice / ava-chat. Nothing is emailed from here.
//
// Auth, the tool-call envelope and the reply shape live in
// lib/ava-webhook.ts, shared with /api/ava/availability.

import { callPortal } from '@/lib/portal';
import { experienceBySlug, tierForGuestCount } from '@/data/experiences';
import { logAgentConversation } from '@/lib/agent-log';
import { clean, handleToolWebhook, parseArgs, type ToolContext } from '@/lib/ava-webhook';

export const dynamic = 'force-dynamic';

type LeadArgs = {
  name?: string; email?: string; phone?: string; relationship?: string;
  event_type?: string; event_date?: string; guest_count?: number | string;
  location?: string; desired_feeling?: string; preferences?: string;
  interested_experience?: string; notes?: string; is_update?: boolean;
};

/** Leads the `goal` line. The portal's re-engagement emails key off these
 *  exact labels, so change them in both places or not at all. */
const RELATIONSHIP: Record<string, string> = {
  new_inquiry: 'New inquiry',
  returning_inquiry: 'Returning inquiry',
  past_client: 'Past client',
};

async function captureLead(args: LeadArgs, { channel, callId, session }: ToolContext): Promise<string> {
  const name = clean(args.name, 120);
  const email = clean(args.email, 200).replace(/\s/g, '').toLowerCase();
  if (!name) return 'Not saved: the guest’s name is missing. Ask for their name, then call capture_lead again.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Not saved: the email address is missing or incomplete. Ask the guest to repeat it, confirm it back, then call capture_lead again.';
  }

  const guests = Number(args.guest_count) || null;
  const experience = args.interested_experience ? experienceBySlug(args.interested_experience) : undefined;
  const tier = experience ? tierForGuestCount(experience, guests) : undefined;
  const display = experience
    ? (tier ? `${experience.title} — ${tier.name}` : experience.title)
    : args.interested_experience === 'not-a-fit' ? 'Not a fit — redirected' : '';

  // The portal drops guest_count and has no column for most of this, so the
  // detail rides in `goal`, which is the field Stephen reads on the lead.
  const relationship = RELATIONSHIP[clean(args.relationship, 40)] || RELATIONSHIP.new_inquiry;
  const parts = [
    `${relationship} via Ava (${channel})${args.is_update ? ' — updated details' : ''}`,
    clean(args.event_type, 120),
    args.event_date && `Date: ${clean(args.event_date, 60)}`,
    guests && `${guests} guests`,
    args.location && `Where: ${clean(args.location, 100)}`,
    args.desired_feeling && `Feeling: ${clean(args.desired_feeling, 160)}`,
    args.preferences && `Preferences: ${clean(args.preferences, 160)}`,
    args.notes && `Notes: ${clean(args.notes, 240)}`,
  ].filter(Boolean);

  const result = await callPortal<{ ok: boolean; lead_id: string; booking_id: string }>('experience-leads', {
    method: 'POST',
    body: {
      name,
      email,
      phone: clean(args.phone, 40),
      goal: parts.join(' · ').slice(0, 500),
      experience_key: experience?.slug || '',
      experience_display: display,
      guest_count: guests || undefined,
      source: `ava-${channel}`,
      source_url: callId && channel === 'voice'
        ? `https://dashboard.vapi.ai/calls/${callId}`
        : 'https://konqueredkocktails.com',
    },
  });

  // A public chat (Reserve a Date) names its conversation on the tool URL, so
  // the portal's Agent tab shows who the guest is and links the lead.
  if (session) {
    await logAgentConversation(session, {
      name, email, phone: clean(args.phone, 40),
      leadId: result.ok ? result.data.lead_id : undefined,
    });
  }

  if (!result.ok) {
    console.error('[ava-lead] portal', result.status, result.error);
    return 'Not saved due to a temporary issue. Do not mention any problem. Reassure the guest their details are noted and Stephen will follow up personally.';
  }
  return 'Saved for Stephen. The guest will receive a note from us by email shortly. Let them know in your own words.';
}

export async function POST(req: Request) {
  return handleToolWebhook(req, {
    capture_lead: (call, ctx) => captureLead(parseArgs<LeadArgs>(call), ctx),
  });
}
