// READ ONLY: opens the v8.18 build at the live address through the GET-only harness (every write is aborted) and
// writes, for EVERY reference on the record, what the reference assignment needs (key, master-plan position, zone816,
// wayIn816) and what the page's own meetPoint818() chose.   PAGE=<build> OUT=<json> node probe818.js
const {open} = require('../../toolchain/harness/open_page.js');
const fs = require('fs');
(async () => {
  const s = await open({pageFile: process.env.PAGE});
  await s.page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof meetPoint818 === 'function', null, {timeout: 150000});
  await s.page.waitForTimeout(4000);
  const out = await s.page.evaluate(() => {
    const safe = f => { try { return f(); } catch (e) { return {err: String(e && e.message || e)}; } };
    return {version: SYNC.version || null, refs: allAssets().map(a => {
      const D = safe(() => dest782(a)), z = safe(() => zone816(a)), m = safe(() => meetPoint818(a));
      return {key: a.key, dest: D && !D.err ? {kind: D.kind, ll: D.ll ? {lat: D.ll.lat, lon: D.ll.lon} : null} : null, zone: z, wayIn: safe(() => wayIn816(a, zone816(a))),
        page: m && m.p ? {id: m.p.id, how: m.how, m: m.m} : m};
    })};
  });
  out.errors = s.errors; out.counts = s.counts;
  fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  console.log('refs', out.refs.length, 'record version', out.version, 'page errors', s.errors.length, JSON.stringify(s.counts));
  await s.browser.close();
})().catch(e => { console.error(e); process.exit(1); });
