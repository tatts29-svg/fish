<script id="pl1218-script">
/* Author: Andrew Fisher. v12.18 - the P&L tidy: what we pay Advanced counts every receipted order. Andrew, 25 Oct 2026 (this
   chat): "can codex help with anything we need to clean things up and make sure P&L is correct and align things into the
   correct cost area and close off as much as possible to the cent". Advanced's partial collection (order 4658850, receipt
   4922343, their invoice 93920, $195) sits outside the programme weeks, so no docket and no week's order carried it. An
   Advanced order outside the programme weeks with a receipt ID now counts at its amount in the fencing cost, on Rehire
   (2126) with their gear, and the words that list the receipted orders name it. The charge to the V8s does not move. */
(function (W) {
'use strict';
if (W.PlTidy1218 || typeof W.fenceDerived !== 'function' || typeof W.fencePaidSplit !== 'function' || typeof poAll !== 'function') return;
var r2 = function (n) { return Math.round(n * 100) / 100; };
var memo = function () { return typeof RENDER_MEMO !== 'undefined' ? RENDER_MEMO : null; };
var advanced = function (o) { return /Advanced Temporary Fencing/i.test(String(o.supplier_name || '')) || String(o.supplier_code || '') === 'ZINC001'; };
function outside() {
  var M = memo(), mk = 'fenceOutside1218'; if (M && M.has(mk)) return M.get(mk);
  var out = {orders: [], amount: 0};
  try {
    poAll().forEach(function (o) {
      if (!o || !advanced(o) || (typeof poFencing866 === 'function' && !poFencing866(o))) return;
      if (typeof poWeeksOf === 'function' && poWeeksOf(o).length) return;
      var amount = Number(o.amount); if (!o.invoice_no || !isFinite(amount) || amount <= 0) return;
      out.orders.push({number: String(o.number), amount: r2(amount), receipt: String(o.invoice_no), note: String(o.note || '').trim()});
      out.amount = r2(out.amount + amount);
    });
  } catch (e) { out = {orders: [], amount: 0, error: String(e && e.message || e)}; }
  if (M) M.set(mk, out);
  return out;
}
/* the fencing cost: the dockets at the sheet rates, the receipted week orders (v11.59), and now the orders outside the weeks */
var baseDerived = W.fenceDerived;
var derived1218 = function () {
  var base = baseDerived.apply(this, arguments);
  try { var O = outside(); if (!O.amount || !base || base.cost == null) return base;
    return Object.assign({}, base, {cost: r2(base.cost + O.amount), margin: base.margin == null ? null : r2(base.margin - O.amount), outside_orders1218: O}); }
  catch (e) { return base; }
};
W.fenceDerived = derived1218; try { fenceDerived = derived1218; } catch (x) {}
/* the gear/crew split keeps it on the gear side (Rehire), so the two still add to the cent */
var baseSplit = W.fencePaidSplit;
var split1218 = function () {
  var base = baseSplit.apply(this, arguments);
  try { var O = outside(); if (!O.amount || !base) return base;
    var M = memo(), mk = 'fencePaidSplit1218'; if (M && M.has(mk)) return M.get(mk);
    var fd = W.fenceDerived(), gear = r2(base.gear + O.amount);
    var v = Object.assign({}, base, {gear: gear, paid: fd.cost, clean: !base.other && r2(gear + base.docket_labour) === fd.cost, outside_orders1218: O.amount});
    if (M) M.set(mk, v); return v; }
  catch (e) { return base; }
};
W.fencePaidSplit = split1218; try { fencePaidSplit = split1218; } catch (x) {}
/* the receipted-order words (P&L Rehire basis, the cost streams, the Fencing tab) name it */
var baseWords = W.fenceOrdersWords1159;
if (typeof baseWords === 'function') {
  W.fenceOrdersWords1159 = function (prefix) {
    var w = baseWords.apply(this, arguments);
    try { var O = outside(); if (!O.amount) return w;
      var m = function (n) { try { return money(n); } catch (e) { return '$' + Number(n).toFixed(2); } };
      return w + (prefix || ' · ') + O.orders.map(function (o) { return 'order ' + o.number + ' ' + m(o.amount) + ' (receipt ' + o.receipt + (o.note ? ' · ' + o.note : '') + ')'; }).join(', ') +
        (O.orders.length === 1 ? ' sits' : ' sit') + ' outside the programme weeks and counts at ' + (O.orders.length === 1 ? 'its' : 'their') + ' amount';
    } catch (e) { return w; }
  };
  try { fenceOrdersWords1159 = W.fenceOrdersWords1159; } catch (x) {}
}
W.PlTidy1218 = Object.freeze({version: 'v12.18', outside: outside});
})(window);
</script>
