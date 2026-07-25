// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// POST /api/checkout/kbsetup
//   Body: { plan: 'deposit', ...leadFields }
//   Returns: { url: string } — Stripe-hosted Checkout Session URL.
//
// One payment: the $200 event deposit. A guest pays KONQUERED BALANCE, not
// goElev8. The page promises "you keep 100% of the deposits", so this is a
// Connect destination charge to Stephen's connected account, with our
// $10/booking fee taken as the application_fee_amount.
//
// (The route name is a holdover from goelev8.ai/kbsetup, where this endpoint
// originated. It also carried a 'setup' plan there — the $400 + $99/mo that
// Konquered Balance pays goElev8. That branch is dropped here: it never
// belonged on the customer-facing site, and this page only ever posts
// plan: 'deposit'.)
//
// This route REFUSES to charge until Stephen's connected account is
// configured. Falling back to a plain platform charge would quietly route
// guest deposits into goElev8's balance — money that isn't ours, against a
// promise made in writing on the page. A 402 that the funnel surfaces as
// "Demo mode — no live charge" is the correct failure.

import Stripe from 'stripe';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://konqueredkocktails.com';

// Stephen's Stripe Connect account (acct_...). Set once he has connected.
// Kept as an env var because Konquered Balance has no `clients` row yet —
// when one exists, prefer reading clients.stripe_connected_account_id.
const KB_ACCOUNT = process.env.KB_STRIPE_CONNECTED_ACCOUNT_ID;

const DEPOSIT_CENTS = 20000; // $200 event deposit
const BOOKING_FEE_CENTS = 1000; // $10 per booked event — our cut of the deposit

/** Trim and hard-cap a free-text field before it goes into Stripe metadata
 *  (Stripe rejects values over 500 chars). */
function meta(value: unknown, max = 200): string {
  return String(value ?? '').trim().slice(0, max);
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const plan = meta(body.plan, 20);
  if (plan !== 'deposit') {
    return Response.json({ error: 'Unknown plan' }, { status: 400 });
  }

  /* ── $200 event deposit — guest → Konquered Balance ───────────────
     This guard runs BEFORE the STRIPE_SECRET_KEY check on purpose. Without
     the connected account there is no correct way to take this money, so the
     answer is 402 whether or not a platform key happens to be configured —
     and the page turns that into its "Demo mode — no live charge"
     confirmation. Checking the key first would 500 on a fresh deploy with no
     env vars at all, showing guests a hard error instead of demo mode.

     Deliberately not falling back to a platform charge. See file header. */
  if (!KB_ACCOUNT) {
    return Response.json(
      {
        error:
          'Deposits aren’t connected yet — Konquered Balance’s Stripe account still needs to be linked.',
      },
      { status: 402 },
    );
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }
  const stripe = new Stripe(stripeKey);

  try {
    const experience = meta(body.experience) || 'Kocktail experience';
    const when = meta(body.when);
    const name = meta(body.name, 120);
    const email = meta(body.email, 200);
    const phone = meta(body.phone, 40);
    // Attribution only — which page originated the deposit. KkClient posts
    // 'kk'; the fallback covers a bare POST with no source field.
    const src = meta(body.source, 20) || 'kk';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: DEPOSIT_CENTS,
            product_data: {
              name: `Konquered Kocktails — ${experience}`,
              description: when
                ? `$200 deposit holding ${when}. Applied in full to your final event balance.`
                : '$200 deposit holding your event date. Applied in full to your final event balance.',
            },
          },
        },
      ],
      ...(email ? { customer_email: email } : {}),
      phone_number_collection: { enabled: true },
      payment_intent_data: {
        // Our $10/booking fee, taken automatically off the deposit.
        application_fee_amount: BOOKING_FEE_CENTS,
        transfer_data: { destination: KB_ACCOUNT },
        metadata: {
          source: src,
          plan: 'deposit',
          business: 'Konquered Balance',
          experience,
          event_when: when,
          guest_name: name,
          guest_phone: phone,
        },
      },
      metadata: {
        source: src,
        plan: 'deposit',
        business: 'Konquered Balance',
        experience,
        event_when: when,
        guest_name: name,
        guest_email: email,
        guest_phone: phone,
      },
      // Back to the homepage. ?booked=1 puts KkClient's booking flow straight
      // into its confirmation step; the cancel path drops the guest back at
      // the booking form.
      success_url: `${APP_URL}/?booked=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/#book`,
    });

    if (!session.url) {
      return Response.json({ error: 'Stripe returned no URL' }, { status: 500 });
    }
    return Response.json({ url: session.url, session_id: session.id });
  } catch (err: any) {
    console.error('[checkout/kbsetup]', err?.message ?? err);
    return Response.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
  }
}
