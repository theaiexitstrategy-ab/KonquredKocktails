// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// SMS program documentation for Twilio / TCR A2P 10DLC review.
//
// Every claim on this page describes the system as actually implemented —
// the consent copy is the exact string from ExperiencesClient.tsx, the
// storage description matches public.sms_consents, and the "not yet sending"
// statement is true because clients.twilio_phone_number is NULL for this
// tenant. If the implementation changes, this page has to change with it;
// a compliance document that describes something other than what runs is
// worse than no document.

import LegalPage, { H2, P, UL, Sample, LEGAL } from '../components/LegalPage';
import { SMS_CONSENT_TEXT } from '@/lib/sms';

export const metadata = {
  title: 'SMS Program & Compliance — Konquered Kocktails',
  description:
    'How Konquered Kocktails collects SMS consent, what messages we send, and how to opt out. Documentation for A2P 10DLC campaign review.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'SMS Program & Compliance — Konquered Kocktails',
    description: 'Our SMS opt-in process, message samples, and opt-out instructions.',
    url: 'https://konqueredkocktails.com/sms-compliance',
    siteName: 'Konquered Kocktails',
    type: 'website',
  },
};

export default function SmsCompliancePage() {
  return (
    <LegalPage
      eyebrow="SMS Program"
      title="SMS Program & Compliance"
      intro={`This page documents how ${LEGAL.entity}, operating as ${LEGAL.dba}, collects consent to send text messages, what those messages contain, and how a recipient stops them. It is published for carrier and Campaign Registry review and is publicly accessible without an account.`}
    >
      <H2>1. Program overview</H2>
      <P>
        {LEGAL.dba} is a mobile craft-cocktail experience company serving {LEGAL.city}
        {' '}and the greater St. Louis area. Our messaging program is low-volume and
        exists to support people who have asked us to contact them about an event:
        confirming a booking, reminding them of an upcoming date, answering a question
        about an enquiry, and — only where separately agreed — occasional notes about
        the week&rsquo;s drink board.
      </P>
      <P>
        We do not send account balances, transaction alerts, or verification codes. We
        do not operate a financial or account-based service, and we do not send
        messages to purchased, rented, or third-party lists. Every recipient gave us
        their number directly, on our own website.
      </P>

      <H2>2. Where consent is collected</H2>
      <P>
        There is one place a person can opt in, and one place only:
      </P>
      <UL items={[
        <>The lead capture at the top of <a href="/experiences" style={{ color: '#C39A45' }}>{LEGAL.siteLabel}/experiences</a>, which collects name, email, and mobile number.</>,
        <>A standalone opt-in form at <a href="/sms-consent" style={{ color: '#C39A45' }}>{LEGAL.siteLabel}/sms-consent</a>, which collects the same fields and nothing else.</>,
      ]} />
      <P>
        On both forms the SMS consent checkbox is <strong>unticked by default</strong>,
        is never pre-selected, and is <strong>not a condition of submitting the form or
        of booking anything</strong>. A visitor can complete the form, receive our reply
        by email, and book an experience without ever agreeing to texts. Consent is a
        separate, affirmative act.
      </P>

      <H2>3. The exact consent language</H2>
      <P>
        This is the wording shown immediately beside the checkbox, verbatim:
      </P>
      <Sample label="Consent disclosure shown at opt-in" body={SMS_CONSENT_TEXT} />
      <P>
        The disclosure sits directly adjacent to the checkbox and the phone field, in
        the same visual block — not behind a link, a tooltip, or a modal. Links to this
        page, our Privacy Policy, and our Terms &amp; Conditions appear on the form.
      </P>

      <H2>4. What we record, and when</H2>
      <P>
        Consent is written to durable storage at the moment the form is submitted,
        before any message could be sent. Each record holds:
      </P>
      <UL items={[
        'The mobile number, normalised to E.164 format.',
        'The name and email address given on the same form.',
        'A verbatim copy of the consent disclosure the person actually saw — the full text above, stored on the record itself rather than a reference to it.',
        'The timestamp of consent.',
        'The originating IP address and browser user-agent.',
        'Which page and URL the consent came from.',
      ]} />
      <P>
        Storing the disclosure verbatim on every record is deliberate. If we later
        revise the wording, existing records continue to show what that person actually
        agreed to; a change to our copy cannot retroactively alter a past consent.
        Records are insert-only — a withdrawal is written as a new entry, never as an
        edit to the original.
      </P>
      <P>
        If the consent record cannot be written for any reason, the submission is
        rejected and the person is asked to try again. We do not proceed as though
        someone opted in when we failed to capture the evidence.
      </P>

      <H2>5. Message samples</H2>
      <P>
        Every message identifies the brand and, where required, carries opt-out
        instructions. Representative examples:
      </P>
      <Sample
        label="Booking confirmation (transactional)"
        body={'Konquered Kocktails: Your date is held — Sat, Sep 12 at 6:00 PM. Stephen will reach out within one business day to design the experience. Questions? Reply HELP. Reply STOP to opt out.'}
      />
      <Sample
        label="Event reminder (transactional)"
        body={'Konquered Kocktails: Reminder — your experience is this Saturday at 6:00 PM, 920 Hemsath Ste 100. Reply HELP for help, STOP to opt out.'}
      />
      <Sample
        label="Enquiry follow-up (conversational)"
        body={'Konquered Kocktails: Thanks for your enquiry about the Signature Kraft Kocktail Experience. Stephen has a few dates open in October — want them? Reply STOP to opt out.'}
      />
      <Sample
        label="Weekly drink board (promotional)"
        body={'Konquered Kocktails: This week on the board — Konquered Sour, barrel-aged maple and Big O ginger. See it: konqueredkocktails.com. Msg&data rates may apply. Reply STOP to opt out.'}
      />
      <Sample
        label="Welcome message, sent once on opt-in"
        body={'Konquered Kocktails: You\'re subscribed. Up to 2-3 msgs/week. Msg & data rates may apply. Reply HELP for help, STOP to opt out.'}
      />

      <H2>6. Opting out, getting help, re-subscribing</H2>
      <UL items={[
        <><strong style={{ color: '#EFE7D5' }}>STOP</strong> — replying STOP to any message ends all further messages to that number immediately. No further messages are sent other than a single confirmation that the opt-out was processed. UNSUBSCRIBE, CANCEL, END, and QUIT are honoured the same way.</>,
        <><strong style={{ color: '#EFE7D5' }}>HELP</strong> — replying HELP returns our contact details: {LEGAL.phone} and {LEGAL.email}.</>,
        <><strong style={{ color: '#EFE7D5' }}>START</strong> — a person who previously opted out may reply START to resume messages. Doing so creates a new consent record.</>,
        <>A person can also opt out at any time by calling {LEGAL.phone} or emailing {LEGAL.email}, without using a keyword.</>,
      ]} />
      <Sample
        label="Opt-out confirmation"
        body={'Konquered Kocktails: You have been unsubscribed and will receive no further messages. Reply START to resubscribe.'}
      />
      <Sample
        label="HELP response"
        body={`Konquered Kocktails: Call ${LEGAL.phone} or email ${LEGAL.email}. Msg & data rates may apply. Reply STOP to opt out.`}
      />

      <H2>7. Frequency and cost</H2>
      <P>
        Subscribers receive up to 2–3 messages per week: the weekly drink board, plus
        messages tied to their own enquiry or booking. Volume depends on the
        recipient&rsquo;s own activity and most weeks fall below that ceiling — it is
        disclosed as a maximum so nobody receives more than they were told to expect. Message and data rates may apply; these are set
        by the recipient&rsquo;s mobile carrier, not by us, and we do not charge for
        messages.
      </P>

      <H2>8. Privacy</H2>
      <P>
        Mobile numbers collected for messaging are used only to contact that person
        about {LEGAL.dba}. <strong style={{ color: '#EFE7D5' }}>We do not sell, rent,
        or share mobile numbers or SMS consent with third parties</strong>, and no
        mobile information is shared with third parties or affiliates for their own
        marketing purposes. Full detail is in our{' '}
        <a href="/privacy" style={{ color: '#C39A45' }}>Privacy Policy</a>.
      </P>

      <H2>9. Current operating status</H2>
      <P>
        <strong style={{ color: '#EFE7D5' }}>
          As of {`August 1, 2026`}, no text messages have been sent under this program.
        </strong>{' '}
        Consent is being collected and stored as described above, but no messaging
        number has been provisioned for {LEGAL.entity} yet, so no message has been or
        can be delivered. Sending will begin only after this campaign is approved and a
        number is assigned. The samples in section 5 are the messages we intend to
        send, not messages already sent.
      </P>

      <H2>10. Contact</H2>
      <P>
        {LEGAL.entity} d/b/a {LEGAL.dba}<br />
        {LEGAL.address}<br />
        {LEGAL.phone} · {LEGAL.email}<br />
        {LEGAL.siteLabel}
      </P>
    </LegalPage>
  );
}
