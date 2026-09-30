/* v7.44 - Supplier asset numbers are real asset numbers, not missing Coates numbers.
   Author: Andrew Fisher
   DISPLAY ONLY: never add supplier numbers to the Coates allocation, labour or quantity projections.
   subOf reads the current unit record, including its removals and moves. */
function supplierGroups744(a){
 const key = a && a.key ? a.key : a, groups = [];
 subOf(key).forEach(x => {
  let g = groups.find(y => y.co === x.co);
  if (!g) { g = {co:x.co, numbers:[], unknown:0}; groups.push(g); }
  const no = String(x.no == null ? '' : x.no).trim();
  if (no) { if (!g.numbers.includes(no)) g.numbers.push(no); } else g.unknown++;
 });
 const marked = subhireCo(key);
 if (marked && !groups.some(g => g.co.toLowerCase() === marked.toLowerCase())) groups.push({co:marked, numbers:[], unknown:0});
 return groups;
}
function supplierNumbersHtml744(a){
 return supplierGroups744(a).map(g => `<span class="suppliernos744" style="display:inline-block;max-width:100%;white-space:normal;overflow-wrap:anywhere"><small>Sub-hire · ${esc(g.co)} · asset no.</small> ${g.numbers.length ? g.numbers.map(no => `<b class="mono">${esc(no)}</b>`).join(', ') : '<span class="norate">not recorded yet</span>'}${g.unknown ? `<span class="norate"> · ${g.unknown} unit${g.unknown === 1 ? '' : 's'} awaiting a number</span>` : ''}</span>`).join('<br>');
}
function supplierNumbersText744(a){
 return supplierGroups744(a).map(g => 'Sub-hire · ' + g.co + ' · asset no. ' + (g.numbers.length ? g.numbers.join(', ') : 'not recorded yet') + (g.unknown ? ' · ' + g.unknown + ' unit' + (g.unknown === 1 ? '' : 's') + ' awaiting a number' : '')).join('; ');
}
function displayNumbers744(a){
 const groups = supplierGroups744(a), supplier = new Set(groups.flatMap(g => g.numbers));
 const own = assetNumbersOf(a).filter(n => String(n).toUpperCase() !== 'MISCITEM' && !supplier.has(String(n)));
 return {own, groups, supplier:[...supplier], all:own.concat([...supplier])};
}
function displayNumbersHtml744(a){
 const n = displayNumbers744(a), supplier = supplierNumbersHtml744(a);
 const own = n.own.length ? `<small>${n.groups.length ? 'Coates ' : ''}asset no.</small> ${n.own.map(no => assetNo(no, {bare:true})).join(' ')}` : '';
 if (own || supplier) return own + (own && supplier ? '<br>' : '') + supplier;
 return unnumbered(a) ? '<span class="ano none">Not numbered — counted by quantity</span>' : '<span class="ano none">Asset number not recorded yet</span>';
}
function displayNumbersText744(a){
 const n = displayNumbers744(a), supplier = supplierNumbersText744(a);
 const own = n.own.length ? (n.groups.length ? 'Coates ' : '') + 'asset no. ' + n.own.join(', ') : '';
 return [own, supplier].filter(Boolean).join('; ') || (unnumbered(a) ? 'not numbered — counted by quantity' : 'asset number not recorded yet');
}
function unitNumberHtml744(u){
 if (!u.asset_no) return '<span class="chip">asset number not recorded yet</span>';
 if (SUB_RX.test(String(u.label || ''))) return `<span class="ano"><small>supplier asset no.</small> ${esc(u.asset_no)}</span>`;
 return assetNo(u.asset_no);
}
