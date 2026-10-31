// Author: Andrew Fisher. v12.64 on the real page with the live record, writing nothing: every contract line the page carries,
// priced by the page's own contractCharge, against Baseplan (11)'s prebill on the VMS (9961265) and water barrier (9972648)
// contracts - the nineteen re-pinned lines to the cent, WB02 the one line left different; and the charge to the V8s moves
// by exactly the nineteen lines' net against the v12.63 candidate (same live record, read seconds apart).
//   PAGE=build/GC500_v12.64/GC500_Delivery_Control_hosted.html BASE=build/GC500_v12.63/GC500_Delivery_Control_hosted.html \
//   BP11=/path/to/bp11.json [MOB=1] [EVIDENCE=dir] node tests/test_v1264.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
const CHANGES = require('./changes_v1264.json');
async function probe(pageFile, mobile) {
  const s = await open({pageFile, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, hash: '#costs'}), p = s.page;
  const cons = []; p.on('console', m => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(3000);
    const r = await p.evaluate(() => {
      const rows = [];
      (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).forEach(r => { let c = null; try { c = contractCharge(r); } catch (e) { c = {err: String(e)}; }
        rows.push({contract: String(r.rental_contract), line: String(r.line), description: r.description, amount: c && Number.isFinite(c.amount) ? Math.round(c.amount * 100) / 100 : null, basis: c && c.basis || null, err: c && c.err || null}); });
      const m = moneySummary();
      const foot = (document.body.innerText.match(/v12\.\d+(?:\.\d+)?/g) || []).slice(-1)[0] || null;
      return {rows, charge: {total: m.charge.total, contracts: m.charge.contracts}, foot, version: typeof SYNC !== 'undefined' ? SYNC.version : null};
    });
    return Object.assign(r, {errors: s.errors.slice(), cons, blocked: s.counts.blocked});
  } finally { await s.browser.close(); }
}
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const lines = [];
  try {
    const bp = JSON.parse(fs.readFileSync(process.env.BP11, 'utf8'));
    const bpLines = {}; for (const c of ['9961265', '9972648']) for (const l of bp[c]) { const k = c + '|' + String(l.Line); if (!(k in bpLines)) bpLines[k] = l; }
    const cand = await probe(process.env.PAGE, mobile);
    const base = process.env.BASE ? await probe(process.env.BASE, mobile) : null;
    const byKey = {}; cand.rows.forEach(r => { byKey[r.contract + '|' + r.line] = r; });
    /* 1. the nineteen re-pinned lines read Baseplan (11) to the cent, with the (11) basis */
    const bad = [];
    for (const [k, [was, now]] of Object.entries(CHANGES)) { const r = byKey[k]; if (!r || r.amount == null || Math.abs(r.amount - now) > 0.005 || !/Baseplan \(11\)/.test(r.basis || '')) bad.push(k + ': page ' + (r ? r.amount + ' / ' + (r.basis || '').slice(0, 40) : 'missing') + ', Baseplan (11) ' + now); }
    check(bad.length === 0, 'the nineteen lines are Baseplan (11) to the cent: ' + bad.join(' · '));
    /* 2. every priced line on the two contracts against (11): the only difference left is WB02 */
    const diffs = [], noRate = [];
    for (const [k, l] of Object.entries(bpLines)) { const bpv = Number(l['Prebill Amount']) || 0, r = byKey[k]; if (!r) { if (bpv) diffs.push(k + ' not on the page (' + bpv + ')'); continue; }
      /* a line with no rate on Baseplan (a lump line whose scope the P&L carries elsewhere, as the (10) review found for 9961265/44) is not priced per line on the page */
      if (r.amount == null) { if (bpv) (Number(l['Rate 1']) ? diffs : noRate).push(k + ' ' + (r.description || '').slice(0, 40) + ' (' + bpv + ')'); continue; }
      if (Math.abs(r.amount - bpv) > 0.005) diffs.push(k + ' page ' + r.amount + ' vs (11) ' + bpv); }
    lines.push('no-rate lines carried elsewhere on the page: ' + (noRate.join(' · ') || 'none'));
    const pageOnly = cand.rows.filter(r => (r.contract === '9961265' || r.contract === '9972648') && !(r.contract + '|' + r.line in bpLines) && r.amount).map(r => r.contract + '|' + r.line + ' ' + r.amount);
    lines.push('lines different from Baseplan (11) on 9961265 and 9972648: ' + (diffs.join(' · ') || 'none'), 'page-only lines on those contracts: ' + (pageOnly.join(' · ') || 'none'));
    const wb02 = byKey['9972648|3'];
    check(wb02 && Math.abs(wb02.amount - 1364.08) < 0.005, 'WB02 stays at the site record, 1,364.08: ' + (wb02 && wb02.amount));
    check(diffs.length === 1 && /^9972648\|3 /.test(diffs[0]), 'WB02 is the one priced line left different from (11) on the two contracts: ' + diffs.join(' · '));
    /* 3. the charge moves by exactly the nineteen lines' net against v12.63 on the same record */
    if (base) {
      const baseBy = {}; base.rows.forEach(r => { baseBy[r.contract + '|' + r.line] = r; });
      const expect = Object.entries(CHANGES).reduce((t, [k, [was, now]]) => t + (now - (baseBy[k] ? baseBy[k].amount : 0)), 0);
      const moved = cand.charge.total - base.charge.total;
      check(base.version === cand.version || Math.abs(moved - expect) < 0.011, 'the charge moves by the pins alone: ' + moved.toFixed(2) + ' against ' + expect.toFixed(2) + ' (records ' + base.version + ' / ' + cand.version + ')');
      check(Math.abs(expect - 409.70) < 0.011, 'the net of the nineteen lines against v12.63 is +409.70: ' + expect.toFixed(2));
      lines.push('charge to the V8s: v12.63 ' + base.charge.total.toFixed(2) + ' -> v12.64 ' + cand.charge.total.toFixed(2) + ' (' + moved.toFixed(2) + ')');
    }
    check(cand.foot === 'v12.64', 'footer reads v12.64: ' + cand.foot);
    check(cand.errors.length === 0 && cand.cons.length === 0, 'no page errors or console errors: ' + JSON.stringify(cand.errors.slice(0, 2)) + JSON.stringify(cand.cons.slice(0, 2)));
    check(cand.blocked === 0 && (!base || base.blocked === 0), 'no write attempted');
    lines.unshift(`v12.64 ${tag}: ${checks}/${checks} checks passed`);
    if (dir) { fs.mkdirSync(dir, {recursive: true}); fs.writeFileSync(path.join(dir, `test_${tag}.txt`), lines.join('\n') + '\n'); fs.writeFileSync(path.join(dir, `lines_${tag}.json`), JSON.stringify(cand.rows.filter(r => r.contract === '9961265' || r.contract === '9972648'), null, 1)); }
    console.log(lines.join('\n'));
  } catch (e) {
    console.error(`v12.64 ${tag}: FAILED after ${checks} checks: ${e.message}`); process.exitCode = 1;
  }
})();
