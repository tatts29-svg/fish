/* Author: Andrew Fisher. A purchase-order check belongs to the saved order that was reviewed. */
function poReviewBasis1021(order){
 const o = order || {}, fields = ['amount','period','programme_sheet','invoice_no','supplier_code','supplier_name','branch','stream','revenue_branch','confirmed','what','note','supplier_pricing'];
 const canonical = v => Array.isArray(v) ? v.map(canonical) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canonical(v[k])])) : v == null ? null : v;
 const values = {};
 fields.forEach(k => {
  let v = o[k];
  if (k === 'amount') v = v == null || v === '' ? null : Number.isFinite(Number(v)) ? Number(v) : String(v);
  else if (k === 'confirmed') v = !!v;
  else if (typeof v === 'string') v = v.trim() || null;
  values[k] = canonical(v);
 });
 return JSON.stringify(values);
}
function poReviewCurrent1021(order){
 const c = order && order.checked;
 return !!(c && c.by && (!c.basis || c.basis === poReviewBasis1021(order)));
}
function poReviewPatch1021(current, patch){
 const p = Object.assign({}, patch), next = Object.assign({}, current || {}, p);
 if (Object.prototype.hasOwnProperty.call(p, 'checked') && p.checked && p.checked.by) {
  p.checked = Object.assign({}, p.checked, {basis: poReviewBasis1021(next)});
 } else if (current && current.checked && current.checked.by && poReviewBasis1021(current) !== poReviewBasis1021(next)) {
  p.checked = null;
 }
 return p;
}
function poReviewFormChanged1021(pane, number){
 const current = poOf(number) || {}, value = key => {
  const input = pane.querySelector(`[data-po-${key}="${number}"]`);
  return input ? input.value.trim() : null;
 };
 const period = value('period'), invoice = value('inv'), amount = value('amt'), note = value('note');
 if ([period,invoice,amount,note].some(v => v === null)) return true;
 const raw = poParseMoney1019(amount);
 if (raw && !(Number.isFinite(Number(raw)) && Number(raw) >= 0)) return true;
 const edited = Object.assign({}, current, {period: period || null, invoice_no: invoice || null, amount: raw === '' ? null : Number(raw), note: note || null});
 return poReviewBasis1021(current) !== poReviewBasis1021(edited);
}
