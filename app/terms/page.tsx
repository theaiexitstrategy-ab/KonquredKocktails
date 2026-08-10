// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Terms & Conditions — konqueredkocktails.com/terms.
//
// Marked as draft. The operational sections (booking, deposit, SMS) describe
// what the site actually does and are accurate; the general legal framing —
// liability, indemnity, dispute resolution — is conservative boilerplate that
// needs an attorney before it is relied on.
//
// DEPOSIT NOTE: the Experience Collection copy says a 50% non-refundable
// deposit begins the design process, while /book charges a flat $200. Both
// are stated below because both are currently true of different parts of the
// business. That contradiction is a real open question, not an oversight —
// see the TODO in app/book/BookClient.tsx.

import LegalPage, { H2, P, UL, LEGAL } from '../components/LegalPage';

export const metadata = {
  title: 'Terms & Conditions — Konquered Kocktails',
  description:
    'Terms & Conditions for Konquered Balance experiences, bookings, deposits, merchandise, and SMS messaging.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Terms & Conditions — Konquered Kocktails',
    description: 'Terms for experiences, bookings, deposits, and SMS messaging.',
    url: 'https://konqueredkocktails.com/terms',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <LegalPage
      draft
      eyebrow="Terms"
      title="Terms & Conditions"
      intro={`These terms govern your use of ${LEGAL.siteLabel} and any experience, deposit, or purchase arranged through it. The site is operated by ${LEGAL.entity}, a ${LEGAL.state} limited liability company, trading as ${LEGAL.dba}. By using the site you agree to them.`}
    >
      <H2>1. What we do</H2>
      <P>
        {LEGAL.dba} designs and delivers craft cocktail experiences — on-site
        experiences, guided tastings, hands-on sessions, bespoke recipe development,
        and related consulting — principally in {LEGAL.city} and the greater St. Louis
        area. Each experience is designed individually; nothing on the site is an offer
        of a fixed, off-the-shelf package.
      </P>

      <H2>2. Enquiries, quotes and availability</H2>
      <UL items={[
        'Submitting an enquiry does not reserve a date. A date is held only once we confirm it in writing and the required deposit has been received.',
        'Prices shown are budget minimums or starting points. The final quote depends on guest count, location, duration, and what the experience actually requires.',
        'Availability shown on the booking calendar reflects our current schedule but is not a guarantee until confirmed.',
        'We accept a limited number of experiences each month and may decline any enquiry.',
      ]} />

      <H2>3. Deposits and payment</H2>
      <P>
        A deposit is required to begin design work and hold a date. The booking
        calendar currently collects a <strong style={{ color: '#EFE7D5' }}>$200
        deposit</strong> to hold a date; for full commissioned experiences we require a
        signed agreement and a <strong style={{ color: '#EFE7D5' }}>50% non-refundable
        deposit</strong> before design begins. Which applies to you will be confirmed
        in writing before you pay anything beyond the initial hold.
      </P>
      <UL items={[
        'Deposits are applied in full to your final balance.',
        'The $200 date hold is refundable up to 14 days before the event.',
        'The 50% design deposit is non-refundable once design work has begun, because it pays for that work.',
        'The balance is due as set out in your written agreement.',
        'Payments are processed by Stripe. We never see or store your card details.',
      ]} />

      <H2>4. Changes and cancellation</H2>
      <UL items={[
        'Ask to move a date as early as you can — we will do our best, subject to availability.',
        'If you cancel, refundability follows section 3 and your written agreement.',
        'If we must cancel for reasons within our control, you receive a full refund of everything paid, including otherwise non-refundable amounts.',
        'Neither party is liable for failure to perform due to events beyond reasonable control, including severe weather, illness, or venue closure.',
      ]} />

      <H2>5. Alcohol, venue and conduct</H2>
      <UL items={[
        'We are licensed and insured. We serve only guests of legal drinking age and require identification where there is any doubt.',
        'We may refuse or stop service to any guest who appears intoxicated or underage. This is not negotiable and no refund is due for service refused on these grounds.',
        'You are responsible for securing the venue, its permissions, and safe, lawful access for our team and equipment.',
        'You are responsible for damage to our equipment caused by you or your guests.',
      ]} />

      <H2>6. Text messages</H2>
      <P>
        If you opt in, you agree to receive text messages from {LEGAL.dba} at the
        number you provided. Consent is not a condition of any purchase. Message
        frequency varies. Message and data rates may apply. Reply STOP to opt out,
        HELP for help. Full detail is on our{' '}
        <a href="/sms-compliance" style={{ color: '#C39A45' }}>SMS Program page</a>, and
        how we handle your number is covered in our{' '}
        <a href="/privacy" style={{ color: '#C39A45' }}>Privacy Policy</a>.
      </P>

      <H2>7. Merchandise</H2>
      <P>
        Merchandise is sold subject to availability and the price shown at checkout. A
        processing fee is displayed before you pay. Shipping options and costs are
        presented at checkout. Contact us at {LEGAL.email} about a problem with an
        order.
      </P>

      <H2>8. Reviews and submitted content</H2>
      <P>
        If you submit a review or photographs, you confirm they are your own and that
        you have the right to share them, and you grant us permission to publish them
        on our site and marketing. Reviews are read before publication and we may
        decline or remove any submission. Ask us at {LEGAL.email} to take yours down
        and we will.
      </P>

      <H2>9. Our content</H2>
      <P>
        Recipes, photographs, video, and written material on this site belong to{' '}
        {LEGAL.entity} or are used with permission. Please do not reproduce them
        commercially without asking.
      </P>

      <H2>10. Liability</H2>
      <P>
        The site is provided as-is. To the fullest extent the law allows, our total
        liability arising from an experience or purchase is limited to the amount you
        paid for it, and we are not liable for indirect or consequential loss. Nothing
        here limits liability that cannot lawfully be limited, including for death or
        personal injury caused by negligence.
      </P>

      <H2>11. Governing law</H2>
      <P>
        These terms are governed by the laws of the State of {LEGAL.state}, without
        regard to conflict-of-law rules. Disputes are subject to the courts serving
        {' '}{LEGAL.city}, {LEGAL.state}.
      </P>

      <H2>12. Changes to these terms</H2>
      <P>
        We may update these terms; the date at the top of this page shows when. The
        terms in force when you booked continue to govern that booking.
      </P>

      <H2>13. Contact</H2>
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
