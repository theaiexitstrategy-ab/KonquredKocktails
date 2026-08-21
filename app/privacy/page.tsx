// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Privacy Policy — konqueredkocktails.com/privacy.
//
// Written from the data flows this site actually implements, not from a
// template: every processor named here is one the code really calls
// (Supabase, Stripe via the GoElev8 portal, Mux, Vercel), and every category
// of data listed is one a route really writes. Flagged as draft because the
// general legal framing still needs counsel — the factual parts are accurate.

import LegalPage, { H2, P, UL, LEGAL } from '../components/LegalPage';

export const metadata = {
  title: 'Privacy Policy — Konquered Kocktails',
  description:
    'How Konquered Balance protects your personal data and SMS privacy. What we collect, why, who processes it, and how to have it removed.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Privacy Policy — Konquered Kocktails',
    description: 'What we collect, why, and how to have it removed.',
    url: 'https://konqueredkocktails.com/privacy',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      draft
      eyebrow="Privacy"
      title="Privacy Policy"
      intro={`${LEGAL.entity}, operating as ${LEGAL.dba}, runs ${LEGAL.siteLabel}. This policy explains what we collect when you use the site, why we collect it, who processes it on our behalf, and how to have it removed.`}
    >
      <H2>What we collect</H2>
      <P>We only collect what a page actually needs to do its job.</P>
      <UL items={[
        <><strong style={{ color: '#EFE7D5' }}>Enquiries and bookings</strong> — your name, email address, mobile number, the experience you asked about, your rough guest count, and the date and time you selected.</>,
        <><strong style={{ color: '#EFE7D5' }}>SMS consent</strong> — if you tick the opt-in box, we record your number, the verbatim wording you agreed to, the time, your IP address, and your browser user-agent. This is kept as evidence of consent.</>,
        <><strong style={{ color: '#EFE7D5' }}>Guest reviews</strong> — your rating and review text, plus optionally your name, email address, event type, and up to three photos. Name, email and photos are all optional and labelled as such.</>,
        <><strong style={{ color: '#EFE7D5' }}>Purchases</strong> — when you buy merchandise or pay a booking deposit, checkout is hosted by Stripe. Your card details are entered on Stripe&rsquo;s page and never touch this website.</>,
      ]} />
      <UL items={[
        <><strong style={{ color: '#EFE7D5' }}>Usage analytics</strong> — we use Google Analytics to understand which pages are visited and how people move through the site. It sets cookies and collects a truncated IP address, device and browser type, approximate location, and the pages you view.</>,
      ]} />
      <P>
        We do not use advertising trackers, we do not run ads, and we do not build
        profiles of visitors for marketing purposes. Analytics tells us that a page was
        viewed — it is not linked to your enquiry, booking, or review.
      </P>
      <P>
        Most browsers let you block analytics cookies, and Google publishes a{' '}
        <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: '#C39A45' }}>
          browser opt-out add-on
        </a>. Blocking it does not affect anything on this site.
      </P>

      <H2>Why we collect it</H2>
      <UL items={[
        'To reply to your enquiry and design and deliver the experience you booked.',
        'To take and reconcile a booking deposit or a merchandise order.',
        'To send you text messages, but only if you separately and affirmatively opted in.',
        'To publish a guest review, but only after it has been read and approved — reviews are never published automatically.',
        'To keep records we are required to keep, including proof of SMS consent.',
      ]} />

      <H2>Your mobile number and SMS</H2>
      <P>
        <strong style={{ color: '#EFE7D5' }}>
          We do not sell, rent, or share mobile numbers or SMS consent with anyone.
        </strong>{' '}
        No mobile information is shared with third parties or affiliates for their own
        marketing purposes. Consent to receive texts is never a condition of booking or
        buying anything, and the opt-in box is never pre-ticked.
      </P>
      <P>
        <strong style={{ color: '#EFE7D5' }}>Mobile Information Sharing Disclosure:</strong>{' '}
        Konquered Kocktails does NOT share your mobile phone number, SMS consent
        information, or messaging data with third parties or affiliates for marketing or
        promotional purposes. Your phone number and SMS data are used exclusively by
        Konquered Kocktails for delivering your opted-in SMS messaging program.
      </P>
      <P>
        Subscribers receive up to 2–3 messages per week. Standard message and data rates
        charged by your wireless carrier will apply. Our{' '}
        <a href="/terms" style={{ color: '#C39A45' }}>Terms &amp; Conditions</a> govern the
        program.
      </P>
      <P>
        You can withdraw consent at any time by replying STOP to any message, by
        calling {LEGAL.phone}, or by emailing {LEGAL.email}. Withdrawal is recorded as
        a new entry rather than by editing the original, so the history stays intact.
        Full detail is on our <a href="/sms-compliance" style={{ color: '#C39A45' }}>SMS Program page</a>.
      </P>

      <H2>Your email address</H2>
      <P>
        If you leave an email address with a review, it is stored so we can follow up —
        and it is <strong style={{ color: '#EFE7D5' }}>never published</strong>. Review
        data served publicly is limited to an explicit list of fields that excludes
        your email. Leaving an address is not permission to contact you; a separate
        checkbox controls that, and it stays disabled until you enter an address.
      </P>

      <H2>Who processes data for us</H2>
      <P>We use a small number of established providers, each for one purpose:</P>
      <UL items={[
        <><strong style={{ color: '#EFE7D5' }}>Supabase</strong> — database and image storage for reviews, SMS consent records, and site content. Encrypted in transit and at rest.</>,
        <><strong style={{ color: '#EFE7D5' }}>Stripe</strong> — payment processing for deposits and merchandise. Stripe handles card data directly under its own privacy policy.</>,
        <><strong style={{ color: '#EFE7D5' }}>Mux</strong> — video hosting and playback for the event library.</>,
        <><strong style={{ color: '#EFE7D5' }}>Vercel</strong> — website hosting and delivery.</>,
        <><strong style={{ color: '#EFE7D5' }}>Google Analytics</strong> — anonymous usage statistics, so we know which pages are worth keeping.</>,
        <><strong style={{ color: '#EFE7D5' }}>GoElev8</strong> — the booking and operations portal that holds enquiries, bookings, and orders on our behalf.</>,
      ]} />
      <P>
        These providers process data only to deliver their service to us. We do not
        sell personal information to anyone.
      </P>

      <H2>How long we keep it</H2>
      <P>
        Enquiries, bookings and orders are kept for as long as needed to run the
        business and meet tax and accounting obligations. SMS consent records are kept
        for as long as we may need to evidence that consent, and for a reasonable
        period afterwards. Reviews stay published until you or we remove them.
      </P>

      <H2>Security</H2>
      <P>
        The site is served over HTTPS. Data at rest in our database and file storage is
        encrypted by the provider. Access to operational data is restricted to
        {' '}{LEGAL.dba} and GoElev8 personnel who need it. No system is perfectly
        secure, and we do not claim otherwise.
      </P>

      <H2>Your choices</H2>
      <UL items={[
        'Ask what we hold about you, and ask us to correct or delete it.',
        'Withdraw SMS consent at any time — reply STOP, call, or email.',
        'Ask us to take down a published review, or the photos attached to it.',
        'Decline optional fields. Only a rating and a few sentences are needed for a review; only name, email and number are needed for an enquiry.',
      ]} />
      <P>
        To make any of these requests, contact us at {LEGAL.email} or {LEGAL.phone}.
        Depending on where you live you may have additional rights under state privacy
        law, including in {LEGAL.state}; we will honour those requests.
      </P>

      <H2>Children</H2>
      <P>
        This site is not directed at children, and our experiences involve alcohol
        service to adults of legal drinking age. We do not knowingly collect personal
        information from anyone under 13.
      </P>

      <H2>Changes</H2>
      <P>
        If this policy changes we will update the date at the top of this page.
        Changing this wording does not alter what you previously agreed to for SMS —
        those records store the exact language shown at the time.
      </P>

      <H2>Contact</H2>
      <P>
        {LEGAL.entity} d/b/a {LEGAL.dba}<br />
        {LEGAL.address}<br />
        <a href={`mailto:${LEGAL.email}`} style={{ color: '#C39A45' }}>{LEGAL.email}</a>
        {' · '}
        <a href={`tel:${LEGAL.phoneE164}`} style={{ color: '#C39A45' }}>{LEGAL.phone}</a>
      </P>
    </LegalPage>
  );
}
