// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Shared by Ava's voice and chat surfaces, so both are checked against the
// same words and open with the same line.

/** Ava's opening line in chat. Also sent to Vapi as the first assistant turn,
 *  so the model knows it has already greeted the guest. */
export const CHAT_GREETING =
  "Welcome to Konquered Kocktails, where intention is the experience. I'm Ava, your experience concierge. What are you gathering to celebrate, honor, or create?";

/** Words Ava must never say. Mirrors the NON-NEGOTIABLE BRAND LANGUAGE block
 *  in her system prompt. Check her lines only — a guest using them is fine. */
export const FORBIDDEN = [
  'bartending', 'bartender', 'book now', 'booking', 'drink menu',
  'cocktail class', 'mixology education', 'mixology lesson', 'just drinks',
  'available for hire',
];

export function forbiddenIn(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN.filter((w) => lower.includes(w));
}
