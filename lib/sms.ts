// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// ONE definition of the SMS program's public claims.
//
// This used to be duplicated: the disclosure string was written out in
// ExperiencesClient, again in SmsConsentClient, and quoted a third time in
// /sms-compliance. Three copies of the sentence a carrier reviews is three
// chances for them to disagree — and a consent page that contradicts the
// compliance page is a campaign rejection.
//
// The disclosure is also stored VERBATIM on every consent record, so editing
// it changes what future subscribers agree to. It never alters an existing
// record: past rows keep the wording that was actually shown to them.

/** Shown beside the opt-in checkbox and written to sms_consents.consent_text. */
export const SMS_CONSENT_TEXT =
  'I agree to receive text messages from Konquered Kocktails at the number provided. ' +
  'Message frequency is up to 2–3 messages per week. Consent is not a condition of any ' +
  'purchase. Message and data rates may apply. Reply STOP to opt out, HELP for help.';

/** Frequency ceiling, disclosed as a maximum. Over-disclosing is safe;
 *  under-disclosing is the violation. */
export const SMS_FREQUENCY = 'up to 2–3 messages per week';

/** What subscribers actually receive. Kept truthful to the business: the
 *  weekly drink board is real recipe content, and booking messages are the
 *  bulk of the volume. */
export const SMS_PROGRAM_DESCRIPTION =
  'The weekly drink board — recipes, builds, and technique notes from the studio — ' +
  'plus messages about your own enquiry or booking.';

export const SMS_RATES_DISCLOSURE =
  'Standard message and data rates charged by your wireless carrier will apply.';

export const SMS_NO_SHARING =
  'By submitting this form, you consent to receive SMS messages from Konquered ' +
  'Kocktails. We do not share your phone number or SMS data with third parties for ' +
  'marketing purposes.';
