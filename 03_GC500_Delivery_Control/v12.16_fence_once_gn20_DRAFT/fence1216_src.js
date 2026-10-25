<script id="fence1216-script">
/* Author: Andrew Fisher. v12.16 - the fence under the scrim is charged once (Andrew, 25 Oct 2026: "we charge once").
   The crews write the whole fence run as clean, scrimmed sections included: on 109 of the 115 dockets Advanced have
   invoiced, their clean metres are exactly the paper's clean less the scrim and 2.5 m a vehicle gate. The scrim rate is
   the fence with the shade cloth on it ($25.53 = the card's $16.16 fence + $9.37 cloth). So each priced docket with scrim
   carries one more line: its scrim metres off the clean, at the clean rate, named. The paper's quantities stay as
   written; progress, Today and the area metres read the paper, not the charge. The paid side does the same where the
   docket is at Advanced's rate sheet; where their approved pricing stands, it already bills the fence once. */
(function(W){
 'use strict';
 if (typeof costDocket !== 'function' || typeof fenceByArea !== 'function') return;
 const r2 = n => Math.round(n * 100) / 100;
 const NAME = 'Clean — the fence under the scrim, charged once in the scrim';
 const base = costDocket;
 costDocket = function(d){
  const out = base.apply(this, arguments);
  try {
   if (!d || !out || !Array.isArray(out.lines) || out.lines.some(l => l && l.under_scrim1216)) return out;
   if (!out.lines.some(l => l && l.column === 'scrim' && l.cost != null)) return out;
   const scrim = docketQuantity((d.quantities || {}).scrim);
   if (!(scrim > 0)) return out;
   const r = fenceRateFor('clean'), p = fenceCostFor('clean');
   if (r.value == null || r.source === 'included') return out;
   const c = FCOL.find(x => x.key === 'clean') || {};
   const approved = out.supplier_pricing_basis === 'approved supplier pricing';
   const cost = r2(-scrim * r.value), paid = approved || p.value == null ? null : r2(-scrim * p.value);
   const line = {column: 'clean', name: NAME, unit: c.unit || 'm', qty: -scrim, rate: r.value, rate_source: r.source,
    card_line: c.card_line || null, cost, paid_rate: approved ? null : p.value,
    paid_rate_source: approved ? 'approved supplier pricing' : p.source, paid,
    margin: paid == null ? null : r2(cost - paid), inclusion: null, under_scrim1216: true};
   const cost_total = out.cost_total == null ? null : r2(out.cost_total + cost);
   const paid_total = approved || out.paid_total == null ? out.paid_total : r2(out.paid_total + (paid || 0));
   const margin = out.margin == null || cost_total == null || paid_total == null ? null : r2(cost_total - paid_total);
   return Object.assign({}, out, {lines: out.lines.concat([line]), cost_total, paid_total, margin,
    scrim_once1216: {metres: scrim, charge: cost, paid}});
  } catch (e) { return out; }
 };
 /* the area table counts the metres on the papers; the charge line is money, not fence on the ground */
 const area = fenceByArea;
 fenceByArea = function(dockets){
  return area.call(this, (dockets || []).map(d => d && Array.isArray(d.lines) && d.lines.some(l => l && l.under_scrim1216)
   ? Object.assign({}, d, {lines: d.lines.filter(l => !(l && l.under_scrim1216))}) : d));
 };
 W.FenceOnce1216 = Object.freeze({version: 'v12.16', name: NAME});
})(window);
</script>
