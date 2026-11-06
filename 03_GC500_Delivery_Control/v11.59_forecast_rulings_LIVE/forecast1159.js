/* Author: Andrew Fisher. v11.59 - the forecast on the project manager's rulings of 23 Oct 2026:
   "Wages and salary we will only track hrs no hrly rate. Event portaloos we do what we know. Damage waiver etc we dont worry
   about unless I tell you different when they invoice. Fix the timeline. You should know this: Alfie's 20 accommodation
   nights, Kyle Gover's 3 shifts without hours. No sheet for week 6: amount and dockets should be what it is. Make it work."
   This block holds the fencing-order rule and the words the other cards read; the patch edits the models and the texts
   in place. Nothing here writes to the record. */
(function (W) {
 'use strict';
 const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
 /* the page's own money and number words (globals in the page's lexical scope, looked up when called) */
 const dollars = v => { try { return money(v); } catch (e) { return String(v); } }, count = v => { try { return fmtNum(v); } catch (e) { return String(v); } };
 /* a week is named three ways on the page - "CON WK5", "Week 5", the schedule row's sheet - so weeks are compared by their key
    (the number for construction weeks, E for the event week, D+number for the demob weeks), as the Purchase orders card does */
 const wkey = s => { s = String(s || '').toUpperCase(); if (!s) return ''; if (/DECON|DEMOB/.test(s)) return 'D' + s.replace(/\D/g, ''); if (/EVENT/.test(s)) return 'E'; return s.replace(/\D/g, ''); };

 /* 1. A receipted fencing order stands at its amount. With no sheet (4647508, week 6) the dockets are what they are and the
    receipt is the cost; with a sheet a few cents off (4647509, week 5) the receipted amount is the cost. The difference
    between the order and what the page counts at the sheet rates for that order's weeks (dockets, green notes, team-leader
    days) is carried on Rehire, and every card says so. An order matched to the cent adjusts nothing. */
 const orders1159 = function(){
  const mk = 'fenceOrders1159'; if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO.has(mk)) return RENDER_MEMO.get(mk);
  const out = {orders: [], adjustment: 0, words: ''};
  try {
   const SP = supplierPricing1014(), dockets = allDockets(), notes = supplierBaseNotes1014(), extras = supplierExtras1014();
   poAll().filter(poFencing866).forEach(o => {
    const amount = Number(o.amount); if (o.receipted !== 'full' || !Number.isFinite(amount) || amount < 0) return;
    const ws = poWeeksOf(o); if (!ws.length) return;
    const sheets = new Set(ws.map(x => wkey(x && x.sheet)).filter(Boolean)); if (!sheets.size) return;
    const inWeek = d => { const k = wkey(d.programme_sheet) || wkey(d.week); return !!k && sheets.has(k); };
    const ds = dockets.filter(d => d.usable && inWeek(d)), ns = notes.filter(n => n.usable !== false && inWeek(n)), xs = extras.filter(x => String(x.po) === String(o.number));
    const counted = r2(ds.reduce((s, d) => s + (Number(d.paid_total) || 0), 0) + ns.reduce((s, n) => s + (Number(n.cost) || 0), 0) + xs.reduce((s, x) => s + (Number(x.paid) || 0), 0));
    const sp = (SP.orders || []).find(x => String(x.number) === String(o.number)) || null, sheet = sp && sp.valid && sp.total != null ? r2(sp.total) : null;
    const adjustment = r2(amount - counted);
    out.orders.push({number: String(o.number), amount, receipt: String(o.invoice_no || ''), weeks: ws.map(x => x.sheet), dockets: ds.length, notes: ns.length, extras: xs.length, counted, sheet, noSheet: sheet == null, adjustment});
    out.adjustment = r2(out.adjustment + adjustment);
   });
   const moved = out.orders.filter(o => o.adjustment);
   if (moved.length) {
    const list = moved.map(o => o.number + ' ' + dollars(o.amount) + ' (' + (o.receipt ? 'receipt ' + o.receipt + ' · ' : '') + (o.noSheet ? o.dockets + ' docket' + (o.dockets === 1 ? '' : 's') + ' as recorded, no sheet' : 'sheet ' + dollars(o.sheet)) + ')');
    out.words = 'receipted order' + (moved.length === 1 ? ' stands' : 's stand') + ' at ' + (moved.length === 1 ? 'its' : 'their') + ' amount: ' + (list.length <= 1 ? list.join('') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]) + ' — ' + dollars(Math.abs(out.adjustment)) + (out.adjustment < 0 ? ' less than' : ' more than') + ' the sheet rates, carried on Rehire (the project manager, 23 Oct 2026)';
   }
  } catch (e) { out.error = String(e && e.message || e); }
  if (typeof RENDER_MEMO !== 'undefined') RENDER_MEMO.set(mk, out);
  return out;
 };
 W.fenceOrders1159 = orders1159;
 W.fenceOrdersWords1159 = function(prefix){ try { const O = orders1159(); return O.adjustment && O.words ? (prefix || '') + O.words : ''; } catch (e) { return ''; } };

 /* the fencing cost the P&L reads: the dockets at the sheet rates (with the supplier extras, v10.14) plus the receipted
    orders' difference; the gear/crew split keeps the difference on the gear side so the two still add to the cent */
 const baseDerived = W.fenceDerived;
 const derived1159 = function(){
  const base = baseDerived.apply(this, arguments);
  try { const O = orders1159(); if (!O.orders.length) return base;
   return Object.assign({}, base, {cost: r2(base.cost + O.adjustment), margin: base.margin == null ? null : r2(base.margin - O.adjustment), sheet_cost: base.cost, receipted_orders1159: O}); }
  catch (e) { return base; }
 };
 W.fenceDerived = derived1159; try { fenceDerived = derived1159; } catch (x) {}
 const baseSplit = W.fencePaidSplit;
 const split1159 = function(){
  const base = baseSplit.apply(this, arguments);
  try { const O = orders1159(); if (!O.orders.length || !O.adjustment) return base;
   const mk = 'fencePaidSplit1159'; if (typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO.has(mk)) return RENDER_MEMO.get(mk);
   const fd = W.fenceDerived(), gear = r2(base.gear + O.adjustment);
   const v = Object.assign({}, base, {gear, paid: fd.cost, clean: !base.other && r2(gear + base.docket_labour) === fd.cost, sheet_gear: base.gear, receipted_adjustment1159: O.adjustment});
   if (typeof RENDER_MEMO !== 'undefined') RENDER_MEMO.set(mk, v); return v; }
  catch (e) { return base; }
 };
 W.fencePaidSplit = split1159; try { fencePaidSplit = split1159; } catch (x) {}

 /* the Purchase orders card: a receipted order's own state */
 const beforeState = W.invoiceState1158;
 const smallDiff = v => Math.abs(v) < 1 ? Math.round(Math.abs(v) * 100) + ' cents' : dollars(Math.abs(v));
 const state1159 = function(o, ws){
  const base = beforeState.apply(this, arguments);
  try {
   const amount = Number(o && o.amount); if (!o || o.receipted !== 'full' || !Number.isFinite(amount)) return base;
   if (base.state === 'matched') return Object.assign({}, base, {words: base.words + (o.invoice_no ? ' · receipt ' + o.invoice_no : '')});
   if (base.state === 'review') return base;
   const O = orders1159().orders.find(x => x.number === String(o.number)); if (!O) return base;
   if (base.state === 'differs' && base.total != null) { const over = r2(base.total - amount);
    return Object.assign({}, base, {state: 'receipted', words: 'sheet recorded · ' + dollars(base.total) + ' · ' + smallDiff(over) + (over > 0 ? ' over' : ' under') + ' the receipted order — the order ' + dollars(amount) + ' stands' + (o.invoice_no ? ' (receipt ' + o.invoice_no + ')' : '')}); }
   return Object.assign({}, base, {state: 'receipted', words: 'invoiced · ' + dollars(amount) + (o.invoice_no ? ' · receipt ' + o.invoice_no : '') + ' · ' + O.dockets + ' docket' + (O.dockets === 1 ? '' : 's') + ' as recorded, no sheet — the order stands'});
  } catch (e) { return base; }
 };
 W.invoiceState1158 = state1159; try { invoiceState1158 = state1159; } catch (x) {}
 const beforeCounts = W.invoiceCounts1158;
 const counts1159 = function(pos){
  const c = beforeCounts.apply(this, arguments);
  try { let n = 0; (pos || []).forEach(o => { if (W.invoiceState1158(o, poWeeksOf(o)).state === 'receipted') n++; }); c.receipted = n; c.other = Math.max(0, (c.other || 0) - n); } catch (e) {}
  return c;
 };
 W.invoiceCounts1158 = counts1159; try { invoiceCounts1158 = counts1159; } catch (x) {}

 /* 2. Coates wages and salary are hours, not dollars: the labour summary counts them as hours only, never as unpriced */
 const coates = r => r && (r.type === 'cna' || r.type === 'salary');
 const beforeSummary = W.fin745Summary;
 const summary1159 = function(){
  const m = beforeSummary.apply(this, arguments);
  try {
   let hoursOnly = 0, hoursOnlyCount = 0, unpH = 0, unpN = 0;
   (m.rows || []).forEach(r => { const cost = r.actualCost != null ? r.actualCost : r.calculatedCost, paid = Number.isFinite(r.paid) ? r.paid : 0; if (coates(r)) { hoursOnly += paid; hoursOnlyCount++; } else if (cost == null) { unpH += paid; unpN++; } });
   const round = typeof fin745Round === 'function' ? fin745Round : r2;
   return Object.assign({}, m, {unpricedHours: round(unpH), unpricedCount: unpN, hoursOnly: round(hoursOnly), hoursOnlyCount, complete: (m.orphanCount || 0) === 0 && !unpN && !(m.missingHoursCount || 0), hoursOnly1159: true});
  } catch (e) { return m; }
 };
 W.fin745Summary = summary1159; try { fin745Summary = summary1159; } catch (x) {}

 /* 3. The Questions the rulings settle: the wage rates (hours only) and Alfie's nights (his own average until the invoice) */
 const beforeQ = W.questionsList;
 const settle = Q => {
  let X = null; try { X = cj764Model(); } catch (e) {}
  const Wg = (X && X.wages) || {};
  const lb = Q.find(q => q && q.id === 'lb-rates');
  if (lb) { lb.original = lb.original || (lb.q + '. ' + lb.why + ' ' + (lb.need || '')).trim(); lb.st = QH_DONE; lb.settled1159 = true;
   lb.q = 'Labour costs — Coates wages and salary in hours only';
   lb.why = 'The project manager’s rule (23 Oct 2026): wages and salary are tracked in hours, with no hourly rate on anyone — ' + count(Wg.hoursOnly || 0) + ' h on the running sheet' + ((Wg.hoursOnlyPeople || []).length ? ' (' + Wg.hoursOnlyPeople.join(', ') + ')' : '') + '. The hired-in people are priced at the rates on the record: ' + dollars(r2((Wg.job || 0) - (Wg.allowanceForecast || 0))) + ' to job end, plus the typed salary allowance forecast ' + dollars(Wg.allowanceForecast || 0) + '. None of it is added to the P&L’s direct costs.';
   lb.need = ''; }
  Q.forEach(q => {
   if (!q || !/^lb-nights-/.test(String(q.id || ''))) return;
   const slug = String(q.id).slice('lb-nights-'.length); let priced = [], un = 0, who = '';
   try { ourCosts().forEach(x => { if (x.kind !== 'accommodation' || !x.usable || !x.person || ourSlug(x.person) !== slug) return; who = x.person; if (x.amount != null) priced.push(Number(x.amount) || 0); else un++; }); } catch (e) { return; }
   if (!who || !un || !priced.length) return;
   const avg = r2(priced.reduce((s, v) => s + v, 0) / priced.length), first = who.split(' ')[0];
   q.original = q.original || (q.q + '. ' + q.why + ' ' + (q.need || '')).trim(); q.st = QH_DONE; q.settled1159 = true;
   q.q = who + ': ' + count(un) + ' night' + (un === 1 ? '' : 's') + ' at ' + first + '’s own average';
   q.why = count(un) + ' night' + (un === 1 ? '' : 's') + ' without a typed rate are forecast at the average of ' + first + '’s ' + count(priced.length) + ' priced night' + (priced.length === 1 ? '' : 's') + ', ' + dollars(avg) + ' a night (' + dollars(r2(avg * un)) + ') — the project manager’s call (23 Oct 2026). The invoice sets the actual when it comes; nothing is typed and no other person’s rate is used.';
   q.need = '';
  });
 };
 const gQ = function(){ const Q = beforeQ.apply(this, arguments); try { if (Q && typeof Q.find === 'function') settle(Q); } catch (e) {} return Q; };
 gQ.rulings1159 = true; W.questionsList = gQ; try { questionsList = gQ; } catch (x) {}
})(window);
