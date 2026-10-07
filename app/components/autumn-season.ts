// (c) 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// The autumn season window and its accent colours. Separate from
// AutumnTheme.tsx so the server layout can inline the pre-paint script
// without pulling a client component (and its hooks) into the server graph.
//
// Season: Sept 22 (equinox) → Nov 30, in the VISITOR's local time. Dec 1 hands
// the page to the winter holidays.
//   Preview out of season:  /?theme=autumn
//   Opt out in season:      /?theme=default

/** Set on <html> while the season is on. Every seasonal style is gated on it. */
export const AUTUMN_CLASS = 'kk-autumn';

/* Seasonal accents only — NOT brand tokens, which is why they are not in
   app/theme.ts. Each is a warmer neighbour of a real palette colour
   (Konquered Bronze #9A633A, Konquered Garnet #681F2B), so the page still
   reads as itself with the season laid over it. */
export const EMBER = '#B2652A';   // Konquered Bronze, lit
export const MAPLE = '#8E3B22';   // deep maple, between bronze and garnet
export const HARVEST = '#C9913F'; // dry-wheat gold, a half-step warm of Royal Gold

/** Is the season on right now, for this visitor, including the query-string
 *  overrides? Used by the post-hydration re-apply in AutumnTheme.tsx. */
export function isAutumnNow(now: Date, search: string): boolean {
  if (/[?&]theme=default(&|$)/.test(search)) return false;
  const m = now.getMonth();
  const inSeason = (m === 8 && now.getDate() >= 22) || m === 9 || m === 10;
  return inSeason || /[?&]theme=autumn(&|$)/.test(search);
}

/** The same check as a pre-paint inline script, so the seasonal band renders
 *  in its final place rather than appearing after hydration and pushing the
 *  page down. Kept in sync with isAutumnNow above by hand — it is four lines,
 *  and it has to run before any bundle loads. */
export const AUTUMN_SCRIPT = `(function(){try{
var d=new Date(),m=d.getMonth(),q=location.search;
if(/[?&]theme=default(&|$)/.test(q))return;
var s=(m===8&&d.getDate()>=22)||m===9||m===10;
if(s||/[?&]theme=autumn(&|$)/.test(q))document.documentElement.classList.add('${AUTUMN_CLASS}');
}catch(e){}})();`;
