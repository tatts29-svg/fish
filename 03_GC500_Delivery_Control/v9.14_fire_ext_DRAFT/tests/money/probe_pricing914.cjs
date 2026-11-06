// Author: Andrew Fisher. Probe: a rate-to-confirm fire extinguisher on a location whose item group has no labour ticked - what the
// Pricing row says. View link, read only; amounts masked ($# for non-zero, $0 for nought).
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch');
const mask = t => String(t).replace(/\$\s?-?[\d,]+(\.\d+)?/g, m => /^\$\s?-?0+(\.0+)?$/.test(m.replace(/,/g, '')) ? '$0' : '$#');
const row = n => ({type: 'Fire extinguisher', qty: n, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, asset_no_state: 'not numbered - counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at: '2026-10-08T06:31:00.000Z', added_by: 'Practice Recorder'});
(async () => {
  const s = await open({pageFile: process.env.CAND, W: 1440, H: 900}); const p = s.page; let KEY = null;
  await p.route(/\/api\/(version|state)(\?|$)/, async route => { const r = route.request(); const res = await curlFetch(r.url(), r.headers(), 'GET'); let body = res.body;
    if (KEY && res.status === 200) { const j = JSON.parse(body.toString()); j.version += 1000000; if (j.docs) { const acc = j.docs.accessories = j.docs.accessories || {}; const id = Object.keys(acc).find(i => acc[i] && acc[i]._k === KEY) || KEY; const d = acc[id] = acc[id] || {_k: KEY, v: []}; d.v = (d.v || []).filter(y => y.type !== 'Fire extinguisher').concat([row(2)]); } body = Buffer.from(JSON.stringify(j)); }
    await route.fulfill({status: res.status, headers: res.headers, body}); });
  try {
    await p.waitForFunction(() => typeof fire914Of === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories'), null, {timeout: 240000}); await p.waitForTimeout(2500);
    const cand = await p.evaluate(() => holdAssets(() => { const groups = new Map(); allAssets().filter(a => !a._cancelled).forEach(a => (assetTotal(a).lines || []).forEach(l => { const k = l.discipline + '|' + l.item; const g = groups.get(k) || {ticks: 0, priced: false}; g.ticks += (l.labour && l.labour.ticked.length) || 0; if (l.total != null) g.priced = true; groups.set(k, g); }));
      const out = []; allAssets().filter(a => !a._cancelled && !a.rest_of && !movedAway(a.key)).forEach(a => { const l = chargeLines(a)[0]; if (!l) return; if (chargeLines(a).some(x => fire914CardLine(x, a.key))) return; const g = groups.get(l.discipline + '|' + l.item); if (g && g.ticks === 0 && g.priced) out.push({key: a.key, item: l.item, disc: l.discipline}); });
      return out; }));
    console.log('locations with no card figure whose host item group is hire-priced and has no labour ticked: ' + cand.length + ' e.g. ' + JSON.stringify(cand.slice(0, 6).map(x => x.key + ' (' + x.item + ')')));
    if (!cand.length) return;
    const pick = cand[0]; KEY = pick.key;
    const rowText = () => p.evaluate(async it => { go('pricing'); await new Promise(r => setTimeout(r, 3000)); const pane = document.getElementById('pane-pricing');
      return [...pane.querySelectorAll('tr')].map(tr => tr.innerText.replace(/\s+/g, ' ').trim()).filter(x => x.startsWith(it.disc + ' ' + it.item + ' ') && !/Tick all/.test(x)).slice(0, 3); }, pick);
    await p.evaluate(() => go('today')); await p.waitForTimeout(500);
    KEY = null; const before = await rowText();
    KEY = pick.key; await p.waitForFunction(k => fire914Qty(k) === 2, pick.key, {timeout: 60000}); await p.waitForTimeout(1500);
    const after = await rowText();
    console.log('picked ' + pick.key + ' (' + pick.disc + ' / ' + pick.item + '), 2 fire extinguishers, rate to confirm');
    console.log('Pricing row before: ' + mask(JSON.stringify(before)));
    console.log('Pricing row after:  ' + mask(JSON.stringify(after)));
    console.log('errors ' + s.errors.length + ' blocked ' + s.counts.blocked);
  } finally { await s.browser.close(); }
})().catch(e => { console.error('PROBE FAIL', e); process.exit(2); });
