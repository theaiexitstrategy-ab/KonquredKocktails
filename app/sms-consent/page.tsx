// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Standalone SMS opt-in — konqueredkocktails.com/sms-consent. Public, no auth.

import LegalPage, { H2, P, UL, LEGAL } from '../components/LegalPage';
import SmsConsentClient from './SmsConsentClient';

export const metadata = {
  title: 'SMS Opt-In — Konquered Kocktails',
  description:
    'Opt in to text messages from Konquered Kocktails about experiences, availability, and offers. Consent is never required to book.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'SMS Opt-In — Konquered Kocktails',
    description: 'Opt in to text messages from Konquered Kocktails.',
    url: 'https://konqueredkocktails.com/sms-consent',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
};

export default function SmsConsentPage() {
  return (
    <LegalPage
      eyebrow="SMS Opt-In"
      title="Text messages from Konquered Kocktails"
      intro={`Add your number if you'd like Stephen to reach you by text about your enquiry, your booking, or what's on the board this week. This is entirely optional — you can book an experience without it, and you can stop at any time.`}
    >
      <SmsConsentClient />

      <H2>What you&rsquo;re agreeing to</H2>
      <UL items={[
        'Messages about your enquiry or booking, and — occasionally — what is on the weekly drink board.',
        'Message frequency varies. Most people receive only messages tied to an event they asked about.',
        'Message and data rates may apply. These are set by your carrier; we do not charge for messages.',
        'Consent is not a condition of booking anything, or of any purchase.',
        <>We never sell, rent, or share your mobile number. See our{' '}
          <a href="/privacy" style={{ color: '#C39A45' }}>Privacy Policy</a>.</>,
      ]} />

      <H2>Stopping, or getting help</H2>
      <P>
        Reply <strong style={{ color: '#EFE7D5' }}>STOP</strong> to any message to end
        them immediately. Reply <strong style={{ color: '#EFE7D5' }}>HELP</strong> for
        our contact details. You can also call {LEGAL.phone} or email {LEGAL.email} at
        any time — no keyword needed. If you change your mind later, reply{' '}
        <strong style={{ color: '#EFE7D5' }}>START</strong> to resume.
      </P>

      <H2>Not sending yet</H2>
      <P>
        Our messaging number is still being provisioned, so no texts are going out at
        the moment. Consent given here is recorded now, and the first message will
        arrive once the number is live. Full detail of the program is on our{' '}
        <a href="/sms-compliance" style={{ color: '#C39A45' }}>SMS Program page</a>.
      </P>
    </LegalPage>
  );
}
