// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Reads the GA4 client id out of gtag so it can travel with a lead or a
// booking.
//
// WHY THIS MATTERS: the marketing visit happens here, but the conversion
// (deposit paid, booking confirmed) completes inside the portal, on a
// different origin, hours or days later. Without carrying the client id
// across, GA4 sees an anonymous server event and the booking attributes to
// nothing — the whole funnel breaks at the last step. Passing the id lets
// the portal's Measurement Protocol call join the conversion back to the
// original session, so acquisition reports show which campaign actually
// produced the booking.
//
// Returns null when gtag hasn't loaded, when the id isn't ready yet, or when
// a blocker has removed it. Callers must treat that as normal: an
// un-attributed booking is still a booking, and nothing here may block a
// submission.

const GA_ID = 'G-NTL8CFVYY6';
/** gtag's callback is fire-and-forget; don't let it hold up a form. */
const TIMEOUT_MS = 800;

type Gtag = (...args: unknown[]) => void;

export async function getGaClientId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== 'function') return null;

  return new Promise<string | null>((resolve) => {
    let settled = false;
    const done = (v: string | null) => {
      if (settled) return;
      settled = true;
      resolve(v);
    };
    const timer = setTimeout(() => done(null), TIMEOUT_MS);
    try {
      gtag('get', GA_ID, 'client_id', (id: unknown) => {
        clearTimeout(timer);
        done(typeof id === 'string' && id ? id : null);
      });
    } catch {
      clearTimeout(timer);
      done(null);
    }
  });
}
