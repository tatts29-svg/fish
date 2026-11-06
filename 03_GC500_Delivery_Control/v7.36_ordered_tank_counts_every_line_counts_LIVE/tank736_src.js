/* v7.36 - AN ORDERED ITEM RECORDED AS ITS OWN UNIT HAS ITS NUMBER (see patch_v736.py). Andrew Fisher, 29 Sep 2026:
   "1328978 waste tank is onsite, inventory says no number for this location. Please ensure this is all correct."
   WC05 ordered a Waste tank x1 and a Toilet Block 6m x1. The tank went on the record as a unit, "Waste tank" 1328978, and
   v5.59 keeps a tank out of a location's BUILDING numbers - rightly, for labour ticks and photo slots. But the count read
   only the building numbers, so the tank the location ordered showed "no number yet". Now a unit whose name is an item the
   location ordered counts as that item's number: in the inventory, the walk-around, the lists under the counts, the
   Questions list and a cancelled order's move to spares. Labour and money read the buildings as before - nothing moves.
   Also: a location's "n of q numbered" counted only its first ordered line (WC01 read 1 of 1 with FWF x2 + Accessible x1);
   it now counts every line - what turned up where it was counted, else the order. */
function lineItemMatch(item, label){
 const n = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
 const i = n(item), l = n(label);
 return !!i && !!l && (i === l || i.startsWith(l + ' ') || l.startsWith(i + ' '));
}
/* item -> the numbers of units recorded under that item's name that are not buildings (a waste tank) */
function lineUnitNumbersOf(a){
 const out = {}; if (!a || typeof unitsOf !== 'function') return out;
 const L = chargeLines(a).filter(l => l.item); if (!L.length) return out;
 const bld = new Set(buildingNumbersOf(a).map(String)), seen = new Set();
 unitsOf(a.key).forEach(u => {
  const no = String(u.asset_no || '').trim();
  if (!/^\d{5,8}$/.test(no) || bld.has(no) || seen.has(no) || !notABuilding(u.label)) return;
  const l = L.find(x => lineItemMatch(x.item, u.label)); if (!l) return;
  seen.add(no); (out[l.item] = out[l.item] || []).push(no);
 });
 return out;
}
function lineUnitNums(a){ return [].concat(...Object.values(lineUnitNumbersOf(a))); }
/* each item's numbers, for counting: the v7.32 split, plus the ordered items recorded as their own units */
function itemNumbersOf(a){
 const L = chargeLines(a).filter(l => l.item); if (L.length <= 1) return null;
 const m = lineNumbersOf(a), U = lineUnitNumbersOf(a);
 if (!m && !Object.keys(U).length) return null;
 const out = {}; L.forEach(l => { out[l.item] = ((m && m[l.item]) || []).slice(); });
 Object.entries(U).forEach(([it, ns]) => ns.forEach(n => { if (out[it] && !out[it].includes(n)) out[it].push(n); }));
 return out;
}
/* the Coates numbers a location's COUNT reads: its own, plus the ordered items recorded as units */
function invCountNums(a){
 const own = invCoatesNums(a), sub = new Set(subOf(a.key).map(x => String(x.no)).filter(Boolean));
 return own.concat(lineUnitNums(a).filter(n => !own.includes(n) && !sub.has(n)));
}
/* the numbers under one row of the inventory: that item's own on a location with more than one */
function invItemNums(a, item){
 const m = itemNumbersOf(a), c = invCountNums(a);
 if (!m) return c;
 const k = Object.keys(m).find(x => x === item) || Object.keys(m).find(x => lineItemMatch(x, item));
 return k ? m[k].filter(n => c.includes(n)) : c;
}
/* how many units a location with more than one item should carry numbers for: every line - what turned up where it was
   counted (plus any rest of the order that has arrived), else the order */
function locQty(a){
 const L = chargeLines(a).filter(l => l.item); if (L.length <= 1) return null;
 const irs = itemRows(a);
 return L.reduce((s, l) => {
  const r = irs.find(x => x.asked === l.item);
  const g = r && r.qty_supplied != null && String(r.qty_supplied).trim() !== '' && Number.isFinite(Number(r.qty_supplied))
   ? Number(r.qty_supplied) + (typeof restArrived === 'function' ? restArrived(a, l.item) : 0) : null;
  return s + (g != null ? g : (qtyOf(l) != null ? qtyOf(l) : 1));
 }, 0);
}
/* the inventory type a number goes to spares as: the item it counts as on a location with more than one (WC05's
   toilet block is a Toilet Block 6m, not the location's first line), else the location's own type */
function invTypeOfNumber(a, n){
 const m = itemNumbersOf(a); if (!m) return invTypeOf(a) || '';
 const it = Object.keys(m).find(k => m[k].includes(String(n))); if (!it) return invTypeOf(a) || '';
 const l = chargeLines(a).find(x => x.item === it); return l ? invTypeKey(l, a) : (invTypeOf(a) || '');
}
/* a cancelled order's ordered-item units (a tank), with the inventory type each goes to spares as */
function lineUnitTypes(a){
 const L = chargeLines(a).filter(l => l.item), own = invCoatesNums(a), out = [];
 Object.entries(lineUnitNumbersOf(a)).forEach(([it, ns]) => { const l = L.find(x => x.item === it);
  ns.forEach(no => { if (!own.includes(no)) out.push({no, type: l ? invTypeKey(l, a) : (invTypeOf(a) || '')}); }); });
 return out;
}
