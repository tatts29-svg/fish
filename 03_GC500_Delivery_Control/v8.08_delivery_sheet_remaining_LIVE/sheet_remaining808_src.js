/* Author: Andrew Fisher. Print-only context; never allocates receipts to a truck or changes a booking. */
function sheet808Qty(v){
 if (v == null || typeof v === 'boolean' || !/^(?:0|[1-9]\d*)$/.test(String(v).trim())) return null;
 const n = Number(v); return Number.isSafeInteger(n) ? n : null;
}
function sheet808Record(r){
 const a = allAssets().find(x => x.key === r.a.key) || r.a, d = deliveryOf(a.key), items = itemRows(a);
 const units = unitsOf(a.key), types = a.item_types || [];
 // Number lists are not receipts. This narrow fallback requires one unambiguous FWF type,
 // numbered Event Portables units and a person's on-site + Complete record; rental green is insufficient.
 const numbered = types.length === 1 && types[0] === 'FWF' && !(a.accessories || []).length
  && d.recorded === true && d.state === 'on site' && d.done === true && units.length > 0
  && units.every(u => /^Sub-hire:\s*Event Portables$/i.test(String(u.label || '').trim())
   && /^\d+$/.test(String(u.asset_no || '').trim()) && !/^0+$/.test(String(u.asset_no || '').trim()));
 const unitCount = numbered ? new Set(units.map(u => String(u.asset_no).trim().toUpperCase())).size : null;
 const lines = dpItems(r).map(x => {
  const matches = items.filter(y => y.asked === x.item), it = matches.length === 1 ? matches[0] : null;
  const total = it ? sheet808Qty(it.qty_asked) : null, planned = sheet808Qty(x.qty);
  const hasTyped = !!(it && it.qty_supplied != null && String(it.qty_supplied).trim() !== '');
  const typed = it ? sheet808Qty(it.qty_supplied) : null, invalid = hasTyped && typed == null;
  const different = !!(it && it.supplied && it.supplied !== it.asked);
  const recorded = hasTyped ? typed : x.item === 'FWF' ? unitCount : null;
  const conflict = typed != null && unitCount != null && x.item === 'FWF' && typed !== unitCount;
  const remaining = !different && !conflict && total != null && recorded != null ? Math.max(0, total - recorded) : null;
  return {item:x.item, quantity:x.qty, planned, total, recorded, remaining, different, supplied:it && it.supplied,
   basis:typed != null ? 'supplied quantity' : recorded != null ? 'numbered Event Portables units on site' : null,
   conflict, invalid, unitCount, split:total != null && planned != null && total !== planned};
 });
 return {a, d, lines};
}
function sheet808What(r){
 const p = sheet808Record(r), parts = p.lines.map(x => {
  const heading = (x.quantity ? x.quantity + ' × ' : '') + (x.item || (r.a.item_types || []).join(', ')) + ' planned';
  const words = [];
  if (x.split) words.push('Reference plan: ' + x.total);
  if (x.invalid) words.push('Invalid supplied quantity; reconcile before dispatch');
  else if (x.recorded == null) words.push('Supplied quantity not recorded');
  else words.push('Recorded ' + (x.basis === 'supplied quantity' ? 'supplied: ' : 'on site: ') + x.recorded
   + (x.different ? ' as ' + x.supplied : '') + (x.basis === 'supplied quantity' ? '' : ' (numbered Event Portables units)'));
  if (x.conflict) words.push('Count discrepancy: ' + x.unitCount + ' numbered units; reconcile before dispatch');
  words.push((x.split ? 'Reference remaining: ' : 'Remaining: ') + (x.remaining == null ? 'unconfirmed' : x.remaining));
  if (x.recorded != null && x.total != null && x.recorded > x.total) words.push('Recorded count exceeds the reference plan');
  if (x.split) words.push('Receipt allocation to this load is not recorded');
  return '<b>' + esc(heading) + '</b><span>' + esc(words.join(' · ')) + '</span>';
 });
 const status = p.d.recorded ? 'Reference status: ' + p.d.state + (p.d.done ? ' · Complete recorded' : '')
  : 'No explicit arrival recorded for this reference';
 parts.push('<span>' + esc(status) + '. Counts describe the current record, not a new load instruction.</span>');
 // Source reviewed 2 Oct 2026: original toilet workbook, row 39, scheduled 8 Oct.
 // This flags conflicting evidence without changing the active system record.
 if (p.a.key === 'WC32' && !p.a._cancelled) parts.push('<span><b>Source discrepancy:</b> 1-GC500-Toilets-2026.xlsx, row 39 (8 Oct 2026), marks cancelled; current system active. Confirm before dispatch.</span>');
 return parts.join('');
}
function sheet808Sub(a){
 const rows = subOf(a.key);
 // A split DD sheet can name only the numbers supplied for that booking. The reference's
 // other recorded numbers remain visible in its drawer and must not become another truck's cargo.
 return Array.isArray(a._bookingNumbers801) ? rows.filter(x => a._bookingNumbers801.some(n => String(n) === String(x.no))) : rows;
}
