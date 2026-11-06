// Author: Andrew Fisher. 25 Oct 2026 - the site record as the live page reads it, for the Baseplan (7) check. Read only:
// the harness serves the page file and aborts every write. For every reference: what it is, whether it is on site and
// when it turned up, its asset numbers, the branch the P&L puts it on (and where that came from), the contract lines the
// page matched it to, and what the page charges for it. Also the event labour scope and the branch split on Costs.
//   PAGE=<live page file> OUT=<private json> node dump_site.cjs
'use strict';
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000});
  const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const out = await p.evaluate(() => {
      const iso = v => (v == null ? null : String(v));
      const refs = [];
      holdAssets(() => {
        for (const a of allAssets()) {
          const d = deliveryOf(a.key) || {}, b = branchOf(a.key) || {}, r = rentalOf(a.key), h = hireStartOf(a.key);
          let total = null, lines = [];
          try { const t = assetTotal(a); total = t.total; lines = (t.lines || []).map(l => ({item: l.item, quantity: l.quantity, discipline: l.discipline, total: l.total, rate: l.rate && l.rate.value, per: l.rate && l.rate.per})); } catch (e) { total = 'error ' + String(e).slice(0, 80); }
          const hist = (d.history || []).filter(x => x.state === 'on site').map(x => x.at || x.set_at).filter(Boolean).sort();
          refs.push({ref: a.key, discipline: a.discipline, cancelled: !!a._cancelled, rest_of: a.rest_of || null, item: a.item || null,
            state: d.state || null, where: d.where || null, set_at: iso(d.set_at), first_on_site: hist[0] || null, date: iso(d.date), date_where: d.date_where || null,
            out_date: iso(d.out_date), done: !!d.done, hire_start: h ? h.iso : null,
            branch: b.code || null, branch_where: b.where || null, branch_contracts: b.contracts || null, branch_via: b.via || null,
            asset_numbers: (() => { try { return assetNumbersOf(a); } catch (e) { return []; } })(),
            rental: r ? r.lines.map(x => ({contract: String(x.rental_contract), line: x.line, asset_no: x.asset_no, branch: x.branch_code, rate_1: x.rate_1, start: x.start_date, status: x.status_as_written, description: x.description})) : [],
            total, lines});
        }
      });
      let scope = null; try { const F = scopeFigures(); scope = F && {lines: F.lines.map(l => ({key: l.key, role: l.role, section: l.section, rate: l.rate, hours: l.hours, amount: l.amount, amount_exact: l.amount_exact, invoicing: l.invoicing})), people: F.people, at: F.at, total: F.total}; } catch (e) { scope = 'error ' + String(e).slice(0, 120); }
      let alloc = null; try { alloc = scopeBranchAllocation978(); } catch (e) { alloc = 'error ' + String(e).slice(0, 120); }
      const table = [...document.querySelectorAll('[data-branch978] table tr')].map(tr => [...tr.children].map(td => td.textContent.replace(/\s+/g, ' ').trim()));
      return {version: SYNC.version, scopes: financeScopes1013(), refs, scope, alloc, branchTable: table, toiletBranch: pl760ToiletBranch(), fencingByBranch: pl760FencingByBranch()};
    });
    fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    console.log(JSON.stringify({version: out.version, refs: out.refs.length, scopes: out.scopes.length, branchRows: out.branchTable.length, errors: s.errors.length, blocked: s.counts.blocked}));
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
