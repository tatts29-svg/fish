/* v7.32 - A LOCATION'S NUMBERS SPLIT BY ITEM (see patch_v732.py). Andrew Fisher, 29 Sep 2026, WC01: "2 portable toilets
   turned up, but the description of the install is wrong and there are 4 places to click install. I had 2 x portaloos
   turn up and allocated, but no 1 x accessible toilet."
   Before this, every item on a location was given every one of the location's numbers as its own buildings, so WC01's
   two FWF numbers showed twice - under FWF and again under Accessible Toilet - four install boxes for two toilets.
   Now each number counts against ONE item: the one a person chose (Change form, "counts as"), else filled by what
   turned up (or the order, where nobody has counted), biggest first. A single-item location is unchanged. */
function lineNumbersOf(a){
 const L = chargeLines(a).filter(l => l.item); if (L.length <= 1) return null;
 const nums = buildingNumbersOf(a).filter(Boolean); if (!nums.length) return null;
 const rows = itemRows(a), sup = (localSupplied(a.key).items || []);
 const out = {}, taken = new Set();
 L.forEach(l => { out[l.item] = []; });
 /* chosen by a person */
 L.forEach(l => { const x = sup.find(i => i.asked === l.item); (x && Array.isArray(x.nums) ? x.nums : []).map(String).forEach(n => { if (nums.includes(n) && !taken.has(n)) { out[l.item].push(n); taken.add(n); } }); });
 /* the rest, by room: what turned up where it was counted, else the order */
 const room = L.map((l, i) => { const r = rows.find(x => x.asked === l.item) || {}, g = r.qty_supplied != null && String(r.qty_supplied).trim() !== '' ? Number(r.qty_supplied) : null;
  const o = qtyOf(l) != null ? qtyOf(l) : 1, q = g != null ? g : o; return {item: l.item, left: Math.max(0, q - out[l.item].length), o, i}; });
 /* the biggest order fills first (WC01: FWF x2 takes both before the one accessible toilet); a line counted as none takes none */
 room.sort((x, y) => y.o - x.o || x.i - y.i);
 nums.filter(n => !taken.has(n)).forEach(n => { const r = room.find(x => x.left > 0) || room[0]; out[r.item].push(n); r.left--; });
 return out;
}
/* which item a number counts as, on a location with more than one */
function numberItemOf(a, n){ const m = lineNumbersOf(a); if (!m) return null; return Object.keys(m).find(k => m[k].includes(String(n))) || null; }
function setNumberItem(key, n, item){
 if (!mayWrite('which item a number counts as')) return false;
 const a = assetOf(key); if (!a) return false;
 const who = whoAmI(); if (!who) return false;
 const L = chargeLines(a).filter(l => l.item), s = String(n);
 L.forEach(l => { const x = (localSupplied(key).items || []).find(i => i.asked === l.item), cur = (x && Array.isArray(x.nums) ? x.nums : []).map(String);
  const next = l.item === item ? [...new Set(cur.concat([s]))] : cur.filter(v => v !== s);
  if (next.length !== cur.length || next.some((v, i) => v !== cur[i])) setSupplied(key, l.item, {nums: next.length ? next : null}); });
 chSay(key + ': ' + s + ' counts as ' + item); bump(); return true;
}
function chNumItemSel(a, n, dis){
 const L = chargeLines(a).filter(l => l.item); if (L.length <= 1) return '';
 const cur = numberItemOf(a, n);
 return `<select class="chnumit" data-chnumit="${esc(n)}" aria-label="Which item ${esc(n)} is"${dis}>${L.map(l => `<option value="${esc(l.item)}"${l.item === cur ? ' selected' : ''}>${esc(l.item)}</option>`).join('')}</select>`;
}
/* an item nobody delivered: counted, and none arrived */
function noneArrived(a, item){ const r = itemRows(a).find(x => x.asked === item); return !!(r && r.qty_supplied != null && String(r.qty_supplied).trim() !== '' && Number(r.qty_supplied) === 0); }
