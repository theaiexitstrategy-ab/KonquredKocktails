// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Private Ava test page — konqueredkocktails.com/ava.
// Unlisted: not in the sitemap, disallowed in robots.txt, noindex, and
// passcode-locked. Exists so the voice concierge can be tested in a browser
// before it is attached to a phone number.

import AvaTestClient from './AvaTestClient';

export const metadata = {
  title: 'Ava — internal test',
  robots: { index: false, follow: false, nocache: true },
};

export default function AvaTestPage() {
  return <AvaTestClient />;
}
