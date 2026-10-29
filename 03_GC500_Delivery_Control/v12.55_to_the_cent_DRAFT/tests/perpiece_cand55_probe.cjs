// read-only: every per-piece charge the page carries (install, levelling, steps, cleaning, demob, fire extinguisher ...)
// with the reference's contract(s), so the charges can be set against Baseplan (10) contract by contract
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const h = await open({pageFile: '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.55/GC500_Delivery_Control_hosted.html', hash: '#costs', W: 1440, H: 1000});
  const p = h.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3000);
  const R = await p.evaluate(() => {
    const c2 = n => Math.round(n * 100) / 100;
    const out = {};
    // contracts per reference from the on-hire rows
    const byRef = {};
    try {
      (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).forEach(r => {
        const refs = [];
        if (r.match && r.match.to) refs.push(String(r.match.to));
        if (r.ref) refs.push(String(r.ref));
        if (Array.isArray(r.refs)) r.refs.forEach(x => refs.push(String(x)));
        refs.forEach(ref => { (byRef[ref] = byRef[ref] || new Set()).add(String(r.rental_contract)); });
      });
    } catch (e) { out.onhireErr = String(e); }
    out.rowKeys = Object.keys((typeof ONHIRE_ROWS !== 'undefined' && ONHIRE_ROWS[0]) || {});
    out.matchSample = (typeof ONHIRE_ROWS !== 'undefined' ? ONHIRE_ROWS : []).slice(0, 3).map(r => ({c: r.rental_contract, line: r.line, match: r.match || null, ref: r.ref || null}));
    // assets: contract fields
    const assetContract = {};
    try {
      allAssets().forEach(a => {
        const cs = new Set();
        ['rental_contract', 'contract', 'rental_contracts', 'contracts'].forEach(k => { const v = a[k]; if (!v) return; (Array.isArray(v) ? v : [v]).forEach(x => cs.add(String(x && x.rental_contract ? x.rental_contract : x))); });
        if (Array.isArray(a.contract_lines)) a.contract_lines.forEach(l => l && l.rental_contract && cs.add(String(l.rental_contract)));
        if (Array.isArray(a.coverage)) a.coverage.forEach(l => { const c = l && (l.charge && l.charge.rental_contract || l.rental_contract); if (c) cs.add(String(c)); });
        assetContract[a.key] = {contracts: [...cs], discipline: a.discipline, name: a.name, branch: (a.branch && (a.branch.code || a.branch)) || null, kind: a.kind || null, origin: a.origin || null};
      });
    } catch (e) { out.assetErr = String(e); }
    out.assetKeysSample = (() => { try { const a = allAssets()[0]; return Object.keys(a); } catch (e) { return String(e); } })();
    // every slot
    try {
      const LP = labourPlan();
      out.lpKeys = Object.keys(LP);
      out.slots = (LP.slots || []).map(sl => {
        const refKey = String(sl.ref);
        const ac = assetContract[refKey] || assetContract[refKey.split('/')[0]] || null;
        const oc = byRef[refKey] || byRef[refKey.split('/')[0]] || null;
        return {ref: sl.ref, key: sl.key, line: sl.line, disc: sl.disc, item: sl.item, unit: sl.unit, rate: sl.rate, qty: sl.qty, value: sl.value, state: sl.state, branch: sl.branch, auto: sl.automaticCharge1006, incl: sl.chargeInclusion1006, contracts: ac ? ac.contracts : [], onhireContracts: oc ? [...oc] : [], origin: ac && ac.origin, kind: ac && ac.kind};
      });
      out.slotKeys = [...new Set(out.slots.map(s => s.key))];
      out.byLine = JSON.parse(JSON.stringify(LP.byLine || null));
      out.byBranch = JSON.parse(JSON.stringify(LP.byBranch || null));
      out.fwf1244 = JSON.parse(JSON.stringify(LP.fwf1244 || null));
      out.chargeInclusion1006 = JSON.parse(JSON.stringify(LP.chargeInclusion1006 || null));
    } catch (e) { out.lpErr = String(e); }
    try { const P = pl770Model(); out.rev = P.rev.map(r => ({key: r.key, code: r.code, line: r.line, now: c2(r.now), job: c2(r.job), basis: String(r.basis || '').slice(0, 900)})); } catch (e) { out.plErr = String(e); }
    try { const m = moneySummary(); out.charge = JSON.parse(JSON.stringify(m.charge, (k, v) => (typeof v === 'string' && v.length > 300 ? v.slice(0, 300) : v))); } catch (e) { out.chErr = String(e); }
    try { out.buildingsLock = JSON.parse(S.runRules.buildingsLock1049); } catch (e) {}
    return out;
  });
  R.pageErrors = h.errors.length;
  fs.writeFileSync('/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/perpiece_cand55.json', JSON.stringify(R, null, 1));
  console.log('slots', (R.slots || []).length, 'keys', JSON.stringify(R.slotKeys), 'errors', R.pageErrors, R.lpErr || '', R.assetErr || '', R.onhireErr || '');
  console.log('byLine', JSON.stringify(R.byLine).slice(0, 1500));
  console.log('rowKeys', JSON.stringify(R.rowKeys));
  console.log('matchSample', JSON.stringify(R.matchSample).slice(0, 800));
  console.log('assetKeys', JSON.stringify(R.assetKeysSample).slice(0, 1200));
  const noC = (R.slots || []).filter(s => !s.contracts.length && !s.onhireContracts.length).length;
  console.log('slots with no contract found', noC);
  await h.browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
