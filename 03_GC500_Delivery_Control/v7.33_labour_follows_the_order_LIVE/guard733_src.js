/* v7.33 - LABOUR FOLLOWS THE ORDER (see patch_v733.py). Andrew Fisher, 29 Sep 2026: "Check all similar for bugs."
   Found on the live record:
   - P36 (Harry the Hirer, 1 x Building 6m) carries two numbers - 1282487, recorded on site and on the rental contract,
     and 1327222, the schedule's, which the schedule also gives P53. Its ticks count once per number: install, steps and
     levelling charged twice, $707.88 for one building.
   - A location with some numbers but fewer than it ordered (WC51's six FWF with two numbered, say) offered ticks for
     the numbered ones only; the rest could not be ticked or charged.
   - WC05's one number counted as its waste tank, not its toilet block (a tie).
   Now: never more buildings than the order - numbers recorded on site or typed here are kept first; units without a
   number are one more tick set, "n more with no number yet", charged for n; an ancillary item (a tank, a pee panel)
   loses a tie; and Questions names every location carrying more numbers than it ordered. */
const LAB_REST = 'rest';
const LAB_ANCILLARY = /waste tank|holding tank|water tank|pee panel|steps|stairs/i;
function labourLineQty(a, item){ const l = chargeLines(a).find(x => x.item === item); return l && qtyOf(l) != null ? qtyOf(l) : null; }
/* which numbers to keep when a location carries more than it ordered: what was recorded on site or typed here first */
function labourKeep(a, u, q){
 const src = a._numberSources || {}, rank = n => { const s = (src[n] || []).join(' '); return /recorded on site|typed here|recorded here/.test(s) ? 0 : /rental/.test(s) ? 1 : 2; };
 return u.map((n, i) => ({n, i, r: rank(n)})).sort((x, y) => x.r - y.r || x.i - y.i).slice(0, q).sort((x, y) => x.i - y.i).map(x => x.n);
}
function labourRestN(a, item, units){ const q = labourLineQty(a, item); return units.includes(LAB_REST) && q != null ? Math.max(0, q - (units.length - 1)) : 0; }
/* locations carrying more numbers than they ordered */
function extraNumbers(){
 return allAssets().filter(a => !a._cancelled && !a.relocation && !movedAway(a.key)).map(a => { const L = chargeLines(a).filter(l => l.item); if (!L.length) return null;
  const q = L.reduce((n, l) => n + (qtyOf(l) != null ? qtyOf(l) : 1), 0), nums = buildingNumbersOf(a).filter(Boolean);
  return nums.length > q ? {a, q, nums, src: a._numberSources || {}} : null; }).filter(Boolean);
}
