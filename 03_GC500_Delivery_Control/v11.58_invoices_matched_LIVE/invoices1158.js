/* Author: Andrew Fisher. v11.58 - "We match invoices up with dockets as we get dockets. So any not matched means we dont have a
   invoice for it yet" (Andrew, 23 Oct 2026). The Purchase orders card says it that way: an order with its supplier sheet on the
   record reads "invoice matched to the cent"; an order without one reads "invoice not matched yet", with the dockets so far and
   what they come to at the supplier's sheet rates - the figure the invoice is matched against when it arrives. Nothing is a
   fault for being unmatched. Nothing is written. */
function invoiceState1158(o, ws){
 const out = {state: 'awaiting', n: 0, est: 0, words: ''};
 try {
  const p = supplierPricing1014().orders.find(x => String(x.number) === String(o.number));
  if (p && p.valid && p.difference === 0) return Object.assign(out, {state: 'matched', total: p.total, words: 'invoice matched to the cent · ' + money0(p.total)});
  if (p && p.valid && p.difference != null) return Object.assign(out, {state: 'differs', total: p.total, words: 'invoice recorded · ' + money0(p.total) + ' · ' + (p.difference > 0 ? '+' : '') + money(p.difference) + ' against the order'});
  if (p && !p.valid) return Object.assign(out, {state: 'review', words: 'supplier pricing needs review'});
  /* a week is named three ways on the page - "CON WK5", "Week 5", the schedule row's sheet - so weeks are compared by their key:
     the number for construction weeks, E for the event week, D+number for the demob (DECON) weeks */
  const wkey = s => { s = String(s || '').toUpperCase(); if (!s) return ''; if (/DECON|DEMOB/.test(s)) return 'D' + s.replace(/\D/g, ''); if (/EVENT/.test(s)) return 'E'; return s.replace(/\D/g, ''); };
  const sheets = new Set((ws || []).map(x => wkey(x && x.sheet)).filter(Boolean));
  const inWeek = d => { const k = wkey(d.programme_sheet) || wkey(d.week); return !!k && sheets.has(k); };
  (typeof allDockets === 'function' ? allDockets() : []).forEach(d => { if (inWeek(d)) { out.n++; out.est += Number(d.paid_total) || 0; } });
  (typeof supplierBaseNotes1014 === 'function' ? supplierBaseNotes1014() : []).forEach(x => { if (inWeek(x)) { out.n++; out.est += Number(x.cost) || 0; } });
  out.est = Math.round(out.est * 100) / 100;
  out.words = out.n ? 'invoice not matched yet · ' + out.n + ' docket' + (out.n === 1 ? '' : 's') + ' so far · about ' + money0(out.est) + ' at the supplier’s sheet rates' : 'invoice not matched yet · no dockets yet';
 } catch (e) { out.words = out.words || 'invoice not matched yet'; }
 return out;
}
function invoiceCounts1158(pos){
 const c = {matched: 0, awaiting: 0, other: 0};
 (pos || []).forEach(o => { const s = invoiceState1158(o, poWeeksOf(o)).state; if (s === 'matched') c.matched++; else if (s === 'awaiting') c.awaiting++; else c.other++; });
 return c;
}
