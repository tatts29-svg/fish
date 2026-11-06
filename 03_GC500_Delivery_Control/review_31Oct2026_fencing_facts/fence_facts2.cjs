// Author: Andrew Fisher. Read-only: the dockets by id and number, and what each of Advanced's approved sheets lists, so each docket can be matched to a sheet.
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
(async () => {
  const s = await open({pageFile: process.env.PAGE, hash: '#costs', W: 1440, H: 1000}); const p = s.page;
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 150000});
    await p.waitForFunction(() => document.getElementById('pl1267'), null, {timeout: 60000});
    const r = await p.evaluate(() => holdAssets(() => {
      const pick = (o, ks) => { const r = {}; ks.forEach(k => { if (o && o[k] !== undefined) r[k] = o[k]; }); return r; };
      const trim = v => JSON.parse(JSON.stringify(v, (k, x) => typeof x === 'string' && x.length > 160 ? x.slice(0, 160) + '…' : x));
      const dockets = allDockets().map(d => trim(Object.assign(pick(d, ['id', 'origin', 'docket_no', 'crew', 'map_ref', 'location', 'note', 'signed_by', 'scope', 'date', 'week', 'programme_sheet', 'usable', 'problems', 'paid_total', 'cost_total', 'invoiced1219', 'to_be_charged', 'not_charged_here', 'source']),
        {lines: (d.lines || []).map(l => pick(l, ['column', 'qty', 'paid', 'cost', 'rate', 'paid_rate'])), paper: (d.paper_lines1219 || []).map(l => pick(l, ['column', 'qty', 'paid', 'cost']))})));
      const SP = supplierPricing1014();
      const sheets = (SP.orders || []).map(o => trim(Object.assign(pick(o, ['number', 'branch', 'source', 'valid', 'errors', 'total', 'extrasTotal', 'difference']),
        {recordKeys: o.records && o.records[0] ? Object.keys(o.records[0]) : [], records: (o.records || []), extras: o.extras, red: o.red, green: o.green})));
      const notes = supplierBaseNotes1014().map(n => trim(pick(n, ['id', 'key', 'note_no', 'date', 'week', 'programme_sheet', 'labour_hours', 'cost', 'usable', 'location', 'source'])));
      const extras = supplierExtras1014().map(x => trim(pick(x, ['id', 'key', 'column', 'name', 'unit', 'qty', 'paid_rate', 'paid', 'po', 'date', 'week', 'docket', 'docket_no', 'source'])));
      return {dockets, sheets, notes, extras};
    }));
    require('fs').writeFileSync('/tmp/gc500-scratch/progress/fence_facts2.json', JSON.stringify(r, null, 1));
    console.log('ok');
  } catch (e) { console.error('FAILED', e.message); process.exitCode = 1; } finally { await s.browser.close(); }
})();
