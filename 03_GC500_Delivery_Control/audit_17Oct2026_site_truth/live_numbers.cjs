// Author: Andrew Fisher. GET-only: every asset number Andrew's own site entries name (recorded on site, his loading
// sheet, his drop photos) and whether the page shows it on that reference now.  node live_numbers.cjs out.json
const {open} = require('../toolchain/harness/open_page.js');
(async () => {
  const s = await open({});
  await s.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await s.page.waitForTimeout(5000);
  const raw = JSON.parse(require('fs').readFileSync(process.argv[3], 'utf8')).docs;
  const r = await s.page.evaluate((raw) => {
    const st = (typeof STATE === 'object' && STATE) || (typeof S === 'object' && S) || null;
    const rows = [], seen = new Set();
    const refs = new Set(allAssets().map(a => a.ref || a.id || a.key).filter(Boolean));
    const site = {};  // ref -> {no -> [evidence]}
    const add = (ref, no, ev) => { if (!ref || !no) return; no = String(no); (site[ref] = site[ref] || {}); (site[ref][no] = site[ref][no] || []).push(ev); };
    for (const ref of refs) {
      const a = assetOf(ref); if (!a) continue;
      const src = a._numberSources || {};
      for (const [no, ss] of Object.entries(src)) if ((ss || []).some(x => /recorded on site/i.test(x))) add(ref, no, 'recorded on site');
      const d = deliveryOf(ref) || {};
      for (const [u, v] of Object.entries(d.loading872 || {})) add(ref, u.replace(/^u/, ''), 'loading by ' + (v && v.by) + ' ' + (v && v.at));
    }
    for (const [ref, v] of Object.entries(raw.dropPhotos || {})) for (const ph of ((v && v.photos) || [])) if (ph && ph.unit) add(ref, ph.unit, 'drop photo ' + String(ph.name || ph.id || '').slice(0, 60));
    for (const [ref, v] of Object.entries(raw.delivery || {})) for (const [u, x] of Object.entries((v && v.loading872) || {})) add(ref, u.replace(/^u/, ''), 'loading by ' + (x && x.by) + ' ' + (x && x.at));
    for (const [ref, v] of Object.entries(raw.units || {})) add(ref, null, null);
    return {site, refsCount: refs.size, check: Object.entries(site).map(([ref, nos]) => {
      const a = assetOf(ref); if (!a) return [{ref, notAnAsset: true, nos: Object.keys(nos)}]; const now = assetNumbersOf(a), off = a._numbersTakenOff || [];
      return Object.entries(nos).map(([no, ev]) => ({ref, no, ev, showing: now.includes(no), takenOff: off.includes(no), elsewhere: (typeof numberOwners === 'function' ? numberOwners(no) : []).filter(x => (x.ref || x) !== ref).map(x => x.ref || x)}));
    }).flat()};
  }, raw);
  require('fs').writeFileSync(process.argv[2], JSON.stringify(r, null, 1));
  const bad = r.check.filter(x => !x.showing);
  console.log('refs', r.refsCount, 'site numbers', r.check.length, 'not showing', bad.length); console.log(JSON.stringify(bad, null, 1).slice(0, 6000));
  console.log('errors', s.errors.length, 'blocked', s.counts.blocked); await s.browser.close();
})();
