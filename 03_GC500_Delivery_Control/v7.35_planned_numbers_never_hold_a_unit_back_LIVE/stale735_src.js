/* v7.35 - A PLANNED NUMBER NEVER HOLDS A UNIT BACK (see patch_v735.py). Andrew Fisher, 29 Sep 2026: "Bug with P53 - it says
   it is still waiting for an asset number, or had a number assigned to it. That number is used somewhere else now."
   P53 (Accred Centre) is cancelled and never arrived; the schedule gave it 1327222, and gave the same number to P36, where
   it really is. P53's planned claim counted as the unit being there - the number read as on two locations - and the
   inventory offered to move P53's number to spares, a spare that is not on site.
   Now a claim on a cancelled order that never arrived is STALE: it does not block the number, and putting the number on
   a location takes it off the cancelled order, with the name. Nothing else is guessed - which number is really at a
   location is a person's call (Andrew, same day: 1327222 belongs on P36). */
function claimSources(a, n){ return ((a && a._numberSources) || {})[String(n)] || []; }
function numberIsReal(a, n){ return claimSources(a, n).some(w => /recorded on site|typed here|recorded here|rental/.test(w)); }
function staleClaim(a, n){
 /* only a cancelled order that never arrived: its number was a plan, and the plan was called off. Anything else is a
    person's call - P36's schedule number 1327222 IS its building (Andrew Fisher, 29 Sep 2026), so the page never guesses
    that a schedule number has been overtaken */
 return !!(a && a._cancelled && !invOnSite(a, todayIso()));
}
/* the stale claims on a number, other than on this location */
function staleOwners(n, key){ const s = String(n || '').trim(); if (!s) return []; return allAssets().filter(a => a.key !== key && assetNumbersOf(a).includes(s) && staleClaim(a, s)).map(a => a.key); }
function releaseStale(n, key, who){ const ks = staleOwners(n, key); ks.forEach(k => numberTakeOff(k, String(n), who)); releaseStale.last = {n: String(n), ks}; return ks; }
function releasedWords(n){ const r = releaseStale.last; return r && r.n === String(n) && r.ks.length ? ' - taken off ' + r.ks.join(' and ') + ', where it was only planned' : ''; }
