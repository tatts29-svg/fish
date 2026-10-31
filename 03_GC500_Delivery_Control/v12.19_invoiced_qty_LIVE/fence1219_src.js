<script id="fence1219-script">
/* Author: Andrew Fisher. v12.19 - the V8s are charged on Advanced's quantities. Andrew, 25 Oct 2026 (this chat): "we work off the
   advanced fencing qty we have the cost we pay advanced - same qty we have the charge we chARGE V8", after "what we are being
   invoiced for is what we will charge V8s for simple" and the Pay and charge table. What Advanced bill us for is what the V8s are
   charged for, line for line, at the 2026 card or the named rates:
   - a docket on one of their approved sheets is charged on the sheet's quantities: clean, scrim, pedestrian gates, vehicle gates (the
     2.5 m of fence a gate takes the place of, at the clean rate), bases (the card's block rate), relocation hours (the labour rate),
     and their CCB metres split by the docket's own types (their sheet has one CCB line; any they did not bill comes off the type
     they left out);
   - a docket at their rate sheet (week 6, the event week) keeps its own quantities, vehicle gates charged the same way;
   - the labour notes are charged at the labour rate on the hours they bill, and the team leader, the materials and the orders
     outside the programme weeks at what they cost; they are fencing lines on the Costs tab, so the Fencing tab, the Costs
     category, the branch roll-up and the P&L read one figure.
   The area table keeps counting the papers' metres; what we pay does not move. */
(function (W) {
'use strict';
if (W.FenceInvoiced1219 || typeof costDocket !== 'function' || typeof fenceDerived !== 'function' || typeof docketCostLines !== 'function' || typeof fenceRateFor !== 'function') return;
var r2 = function (n) { return Math.round(n * 100) / 100; };
var memo = function () { return typeof RENDER_MEMO !== 'undefined' ? RENDER_MEMO : null; };
var CCB = ['ccb_demarc', 'ccb_event', 'flat_feet'], CUT = ['flat_feet', 'ccb_event', 'ccb_demarc'], GATE_M = 2.5;
var rateOf = function (k) { try { var r = fenceRateFor(k); return r && r.value != null ? {value: r.value, source: r.source} : null; } catch (e) { return null; } };
var colOf = function (k) { return (typeof FCOL !== 'undefined' && FCOL.find(function (x) { return x.key === k; })) || {}; };
var q = function (lines, k) { return r2((lines || []).reduce(function (n, l) { return n + (l && l.column === k ? (Number(l.qty) || 0) : 0); }, 0)); };
var gate = function () { var c = rateOf('clean'); return c ? {value: r2(GATE_M * c.value), source: 'the 2.5 m of fence a gate takes the place of'} : null; };
var money2 = function (n) { try { return money(n); } catch (e) { return '$' + Number(n).toFixed(2); } };
var day = function (v) { var s = String(v || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; };
function mk(column, name, unit, qty, r) {
  return {column: column, name: name, unit: unit, qty: qty, rate: r ? r.value : null, rate_source: r ? r.source : null, card_line: colOf(column).card_line || null,
    cost: r ? r2(qty * r.value) : null, paid_rate: null, paid_rate_source: 'approved supplier pricing', paid: null, margin: null, inclusion: null, invoiced1219: true};
}

/* one docket: on an approved sheet, the sheet's quantities at our rates; at the rate sheet, its own, gates priced */
var base = costDocket;
costDocket = function (d) {
  var out = base.apply(this, arguments);
  try {
    if (!out || out.invoiced1219) return out;
    var lines = Array.isArray(out.lines) ? out.lines : [], G = gate();
    var sl = out.supplier_pricing_basis === 'approved supplier pricing' && Array.isArray(out.supplier_lines) ? out.supplier_lines : null;
    if (sl && sl.length) {
      var nm = function (k, dflt) { var l = lines.find(function (x) { return x && x.column === k && x.name; }); return l ? l.name : (colOf(k).name || dflt); };
      var made = [], add = function (column, name, unit, qty, r) { if (qty) made.push(mk(column, name, unit, qty, r)); };
      add('clean', nm('clean', 'Clean'), 'm', q(sl, 'clean'), rateOf('clean'));
      add('scrim', nm('scrim', 'Scrim'), 'm', q(sl, 'scrim'), rateOf('scrim'));
      add('ped_gates', nm('ped_gates', 'Ped Gates'), 'each', q(sl, 'ped_gates'), rateOf('ped_gates'));
      add('v_gates', nm('v_gates', 'V Gates'), 'each', q(sl, 'v_gates'), G);
      add('fence_blocks', 'Bases', 'each', q(sl, 'bases'), rateOf('fence_blocks'));
      add('labour', 'Relocation labour', 'h', q(sl, 'relocation'), rateOf('labour'));
      add('labour', nm('labour', 'Labour'), 'h', q(sl, 'labour'), rateOf('labour'));
      var theirs = r2(CCB.reduce(function (n, k) { return n + q(sl, k); }, 0));
      if (theirs) {
        var mine = {}; CCB.forEach(function (k) { mine[k] = q(lines, k); });
        var ours = r2(CCB.reduce(function (n, k) { return n + mine[k]; }, 0));
        if (!(ours > 0)) mine = {ccb_demarc: theirs, ccb_event: 0, flat_feet: 0};
        else if (theirs < ours) { var cut = r2(ours - theirs); CUT.forEach(function (k) { var c = Math.min(mine[k], cut); mine[k] = r2(mine[k] - c); cut = r2(cut - c); }); }
        else if (theirs > ours) { var big = CCB.slice().sort(function (a, b) { return mine[b] - mine[a]; })[0]; mine[big] = r2(mine[big] + theirs - ours); }
        CCB.forEach(function (k) { add(k, nm(k, k), 'm', mine[k], rateOf(k)); });
      }
      var known = ['clean', 'scrim', 'ped_gates', 'v_gates', 'bases', 'relocation', 'labour'].concat(CCB);
      sl.forEach(function (l) { if (l && known.indexOf(l.column) < 0 && Number(l.qty)) made.push(mk(l.column, l.name || l.column, l.unit || '', Number(l.qty), rateOf(l.column))); });
      if (!made.length) return out;
      var unpriced = made.filter(function (l) { return l.cost == null; });
      var total = r2(made.reduce(function (n, l) { return n + (l.cost || 0); }, 0)), state = unpriced.length ? 'partly priced' : 'priced';
      return Object.assign({}, out, {lines: made, cost_total: total, cost_state: state, unpriced: unpriced.map(function (l) { return l.name; }),
        margin: out.paid_total == null || state !== 'priced' ? null : r2(total - out.paid_total), paper_lines1219: lines, paper_cost1219: out.cost_total, invoiced1219: 'sheet'});
    }
    if (G && lines.some(function (l) { return l && l.column === 'v_gates' && Number(l.qty); })) {
      var more = 0;
      var nl = lines.map(function (l) {
        if (!l || l.column !== 'v_gates' || !Number(l.qty)) return l;
        var c = r2(l.qty * G.value); more = r2(more + c - (l.cost || 0));
        return Object.assign({}, l, {rate: G.value, rate_source: G.source, cost: c, margin: l.paid == null ? null : r2(c - l.paid), inclusion: null, invoiced1219: true});
      });
      var ct = out.cost_total == null ? null : r2(out.cost_total + more);
      return Object.assign({}, out, {lines: nl, cost_total: ct, margin: out.margin == null || ct == null ? out.margin : r2(out.margin + more), paper_lines1219: lines, paper_cost1219: out.cost_total, invoiced1219: 'rate'});
    }
    return out;
  } catch (e) { return out; }
};

/* the area table counts the papers' metres, never the money */
var area = fenceByArea;
fenceByArea = function (dockets) {
  return area.call(this, (dockets || []).map(function (d) { return d && Array.isArray(d.paper_lines1219) ? Object.assign({}, d, {lines: d.paper_lines1219}) : d; }));
};

/* what else Advanced bill: the labour notes at the labour rate on their hours; the team leader, materials and outside orders at cost */
function billed() {
  var M = memo(), key = 'fenceInvoicedExtras1219'; if (M && M.has(key)) return M.get(key);
  var out = {lines: [], total: 0, notes: {count: 0, hours: 0, charge: 0}};
  try {
    var lab = rateOf('labour'), last = function (a, b) { return !a || (b && b > a) ? b : a; };
    var rows = typeof serviceNoteRows === 'function' ? serviceNoteRows().filter(function (n) { return n && n.usable !== false && n.cost != null; }) : [];
    var nd = null;
    rows.forEach(function (n) {
      var h = Array.isArray(n.supplier_lines) && n.supplier_lines.length ? r2(n.supplier_lines.reduce(function (a, l) { return a + (Number(l.qty) || 0); }, 0)) : (Number(n.labour_hours) || 0);
      if (!h || !lab) return;
      out.notes.count++; out.notes.hours = r2(out.notes.hours + h); out.notes.charge = r2(out.notes.charge + r2(h * lab.value)); nd = last(nd, day(n.date));
    });
    if (out.notes.charge) out.lines.push({id: 'LABOUR-NOTES', key: 'notes', date: nd, amount: out.notes.charge, reference: 'labour notes',
      words: 'labour notes — ' + out.notes.hours + ' h they bill on ' + out.notes.count + ' note' + (out.notes.count === 1 ? '' : 's') + ', at the labour rate ' + money2(lab.value) + ' an hour'});
    var g = {}, order = [];
    (typeof supplierExtras1014 === 'function' ? supplierExtras1014() : []).forEach(function (x) {
      var k = String(x.column || '') + '|' + String(x.name || '');
      if (!g[k]) { g[k] = {column: x.column, name: String(x.name || x.column || 'supplier charge'), unit: x.unit || '', qty: 0, amount: 0, rates: {}, date: null}; order.push(k); }
      g[k].qty = r2(g[k].qty + (Number(x.qty) || 0)); g[k].amount = r2(g[k].amount + (Number(x.paid) || 0)); g[k].rates[String(x.paid_rate != null ? x.paid_rate : x.rate)] = true; g[k].date = last(g[k].date, day(x.date));
    });
    order.forEach(function (k) {
      var x = g[k]; if (!x.amount) return;
      var label = x.column === 'team_leader' ? 'team leader' : x.name.replace(/\s+—.*$/, '').replace(/ supply$/i, '').toLowerCase();
      var rates = Object.keys(x.rates), each = rates.length === 1 && isFinite(Number(rates[0])) ? ' (' + money2(Number(rates[0])) + ' a ' + (x.unit === 'day' || x.unit === 'days' ? 'day' : String(x.unit || 'unit').replace(/s$/, '')) + ')' : '';
      out.lines.push({id: label.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, ''), key: 'extra', date: x.date, amount: x.amount, reference: label,
        words: label + ' — ' + x.qty + ' ' + (x.unit || '') + ' at what they cost' + each});
    });
    var O = W.PlTidy1218 && typeof W.PlTidy1218.outside === 'function' ? W.PlTidy1218.outside() : {orders: []};
    (O.orders || []).forEach(function (o) {
      var po = typeof poAll === 'function' ? poAll().find(function (p) { return String(p.number) === String(o.number); }) : null;
      out.lines.push({id: 'ORDER-' + o.number, key: 'order', date: day(po && (po.at || po.updated_at)), amount: o.amount, reference: o.number, po: o.number,
        words: (/collection/i.test(o.note) ? 'partial collection' : 'order outside the programme weeks') + ', order ' + o.number + ' (receipt ' + o.receipt + ') — at what it cost'});
    });
    var fallback = null; try { fallback = allDockets().filter(function (d) { return d.usable && day(d.date); }).map(function (d) { return day(d.date); }).sort().pop() || null; } catch (e) {}
    out.lines.forEach(function (l) { if (!l.date) l.date = fallback || new Date().toISOString().slice(0, 10); });
    out.total = r2(out.lines.reduce(function (n, l) { return n + l.amount; }, 0));
  } catch (e) { out = {lines: [], total: 0, notes: {count: 0, hours: 0, charge: 0}, error: String(e && e.message || e)}; }
  if (M) M.set(key, out);
  return out;
}

/* the Costs tab: they are fencing lines, subhire on the contractor's branch, like the dockets */
var baseLines = docketCostLines;
docketCostLines = function () {
  var out = baseLines.apply(this, arguments);
  try {
    if (!Array.isArray(out) || typeof COST_FENCE_CAT === 'undefined' || !COST_FENCE_CAT) return out;
    var X = billed(); if (!X.lines.length) return out;
    var sup = (typeof PO_SRC !== 'undefined' && PO_SRC.supplier) || {}, name = sup.name || 'the fencing contractor';
    var branch = typeof normBranch === 'function' ? (normBranch(sup.branch_code || '') || null) : null;
    return out.concat(X.lines.map(function (l) {
      return {id: 'C-FD-' + l.id, date: l.date, category: COST_FENCE_CAT, description: name + ' ' + l.words + ', charged as they bill it', amount: l.amount, hours: null, overtime_hours: null,
        supplier: name, reference: l.reference != null ? String(l.reference) : null, ref: null, area: null, note: null, recorded_by: 'the fencing dockets (from the record)', recorded_on: null,
        updated_at: null, updated_by: null, branch: branch, kind: 'subhire', po_no: l.po || null, from: 'record', docket: null, invoiced1219: l.key};
    }));
  } catch (e) { return out; }
};
if (typeof costFromWords === 'function') {
  var baseFrom = costFromWords;
  costFromWords = function (c) { return c && c.invoiced1219 ? 'what Advanced bill (' + (c.reference || 'their invoice') + '), charged to the V8s on the same quantity — nothing typed' : baseFrom.apply(this, arguments); };
}

/* the Fencing tab's figure: the dockets plus what else they bill, so it is the Costs category to the cent */
var baseDerived = W.fenceDerived;
var derived1219 = function () {
  var b = baseDerived.apply(this, arguments);
  try { var X = billed(); if (!X.total || !b) return b;
    return Object.assign({}, b, {charged: r2(b.charged + X.total), margin: b.margin == null ? null : r2(b.margin + X.total), invoiced_extras1219: X}); }
  catch (e) { return b; }
};
W.fenceDerived = derived1219; try { fenceDerived = derived1219; } catch (x) {}
W.FenceInvoiced1219 = Object.freeze({version: 'v12.19', billed: billed});
})(window);
</script>
