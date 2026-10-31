// Author: Andrew Fisher. 25 Oct 2026 - every contract line the live page charges from (its embedded copy of the branch's
// contracts), with the branch the P&L puts it on and what the page charges for it. Read only: the harness serves the page
// file and aborts every write.
//   PAGE=<live page file> OUT=<private json> node dump_lines.cjs
'use strict';
const fs = require('fs');
const {open} = require('../toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000});
  const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    const out = await p.evaluate(() => holdAssets(() => {
      const rows = ONHIRE_ROWS.map(r => {
        let ch = {}; try { ch = contractCharge(r) || {}; } catch (e) { ch = {error: String(e).slice(0, 80)}; }
        let owner = null; try { owner = finance928ContractOwner(r); } catch (e) {}
        let decided = null; try { decided = typeof contractTreatment747 === 'function' ? contractTreatment747(r) : null; } catch (e) {}
        let br = null; try { br = generatorBranch1004(r); } catch (e) {}
        return {contract: String(r.rental_contract), line: r.line, asset_no: r.asset_no, description: r.description, status: r.status_as_written, branch_code: r.branch_code, branch: br,
          rate_1: r.rate_1, quantity: r.quantity, start: r.start_date, demob: r.demob_date, family: r.family, subhired: !!r.subhired, subhired_machine: !!r.subhired_machine, charge_line: !!r.charge_line,
          match: r.match ? {to: r.match.to, key: r.match.key, via: r.match.via} : null, amount: typeof ch.amount === 'number' ? ch.amount : null, filled: ch.filled || null, basis: ch.basis || ch.why || null,
          rehire: owner ? !!owner.rehire : null, decided: decided ? (typeof decided === 'object' ? (decided.label || decided.kind || 'yes') : String(decided)) : null};
      });
      let B = null; try { B = pl752Rows().map(b => ({code: b.code, lines: b.lines, contract: b.contract, card: b.card, transport: b.transport, rehire: b.rehire, total: b.total, none: b.none, decided: b.decided})); } catch (e) { B = 'error ' + String(e).slice(0, 120); }
      let M = null; try { const m = moneySummary(); M = {charge: m.charge, cost: m.cost}; } catch (e) { M = 'error ' + String(e).slice(0, 120); }
      return {at: ONHIRE_AT || null, source: (ONHIRE && (ONHIRE.source || ONHIRE.generated || ONHIRE.version)) || null, rows, B, M};
    }));
    fs.writeFileSync(process.env.OUT, JSON.stringify(out));
    console.log(JSON.stringify({at: out.at, source: out.source, rows: out.rows.length, branches: Array.isArray(out.B) ? out.B.map(b => b.code + ' ' + b.total).join(' | ') : out.B, errors: s.errors.length, blocked: s.counts.blocked}));
  } catch (e) { console.log('ERR', String(e).slice(0, 400)); }
  await s.browser.close();
})();
