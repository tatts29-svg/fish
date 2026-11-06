// Author: Andrew Fisher. Synthetic business-contract checks for the released pricing wrapper.
// Rates and references here are invented test fixtures, never operational records.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const text = fs.readFileSync(path.join(__dirname, '../../v12.16_fence_once_gn20_LIVE/fence1216_src.js'), 'utf8');
const script = text.replace(/^<script[^>]*>\s*/, '').replace(/\s*<\/script>\s*$/, '');
let checks = 0;
function check(ok, message) { assert(ok, message); checks++; console.log('PASS ' + message); }
function rig(options = {}) {
  const charge = {clean: 10, scrim: 25}, paid = {clean: 5, scrim: 15};
  const context = {
    window: {}, FCOL: [{key: 'clean', unit: 'm'}], docketQuantity: x => Number(x) || 0,
    fenceRateFor: key => ({value: charge[key], source: options.included ? 'included' : 'fixture'}),
    fenceCostFor: key => ({value: paid[key], source: 'fixture'}),
    fenceByArea: rows => rows.flatMap(d => d.lines),
    costDocket: d => {
      const lines = Object.entries(d.quantities).filter(([,q]) => q > 0).map(([column,qty]) => ({column,qty,cost: options.unpriced && column === 'scrim' ? null : qty * charge[column],paid: qty * paid[column]}));
      const cost = lines.reduce((n,l) => n + (l.cost || 0),0);
      const payment = options.approved ? 400 : lines.reduce((n,l) => n + l.paid,0);
      return {lines,cost_total:cost,paid_total:payment,margin: options.unpriced ? null : cost-payment,supplier_pricing_basis:options.approved ? 'approved supplier pricing' : 'fixture'};
    }
  };
  vm.createContext(context); vm.runInContext(script, context);
  return context;
}
const d = (clean,scrim) => ({quantities:{clean,scrim}});
let c = rig(), out = c.costDocket(d(100,40));
check(out.cost_total === 1600, 'new installation charges 60 plain metres and 40 complete scrim metres');
check(out.paid_total === 900, 'unapproved supplier estimate counts each fence metre once');
check(out.margin === 700, 'margin is charge less supplier estimate');
out = c.costDocket(d(0,40));
check(out.cost_total === 600, 'retrofit retains the credit for plain fence charged on an earlier docket');
check(out.lines.find(l=>l.under_scrim1216).qty === -40, 'cross-docket credit is not capped at this docket’s new fence');
out = c.costDocket(d(10,40));
check(out.cost_total === 700, 'mixed new fence and retrofit keeps both parts of the charge');
out = c.costDocket(d(100,0));
check(out.cost_total === 1000 && !out.scrim_once1216, 'plain fence is unchanged');
out = rig({approved:true}).costDocket(d(0,40));
check(out.paid_total === 400 && out.scrim_once1216.paid === null, 'approved supplier amount is not credited a second time');
out = rig({unpriced:true}).costDocket(d(100,40));
check(out.cost_total === 1000 && out.margin === null && !out.scrim_once1216, 'unpriced scrim does not remove a known charge or invent a margin');
out = rig({included:true}).costDocket(d(100,40));
check(!out.scrim_once1216, 'included clean category is not credited again');
const input = d(100,40), before = JSON.stringify(input); out = c.costDocket(input);
check(JSON.stringify(input) === before, 'source quantities are never mutated');
const area = c.fenceByArea([out]);
check(area.length === 2 && area.find(l=>l.column==='clean').qty === 100, 'area quantities exclude accounting adjustments');
vm.runInContext(script,c); out = c.costDocket(input);
check(out.cost_total === 1600 && out.lines.filter(l=>l.under_scrim1216).length === 1, 'repeated wrapping cannot apply the credit twice');
console.log(JSON.stringify({checks,failed:0,synthetic:true}));
