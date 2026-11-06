// Author: Andrew Fisher. Probe: what the Costs, P&L, labour plan, Pricing and Finance handover rows SAY when fire extinguishers
// with no card figure arrive (GN01 x2, WC09 x2, T0023 x1). View link, read only; amounts masked ($# for any non-zero, $0 for nought).
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const {curlFetch} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/curlfetch');
const CAND = process.env.CAND;
const mask = t => String(t).replace(/\$\s?-?[\d,]+(\.\d+)?/g, m => /^\$\s?-?0+(\.0+)?$/.test(m.replace(/,/g, '')) ? '$0' : '$#');
const row = (n, at) => ({type: 'Fire extinguisher', qty: n, qty_stated: true, as_written: 'Fire extinguisher', asset_no: null, asset_no_state: 'not numbered - counted by quantity', origin: 'added in this page', source_task: null, _added: true, added_at: at, added_by: 'Practice Recorder'});
(async () => {
  const s = await open({pageFile: CAND, W: 1440, H: 900}); const p = s.page; let phase = 0;
  const ADD = {GN01: row(2, '2026-10-08T06:31:00.000Z'), WC09: row(2, '2026-10-08T06:32:00.000Z'), T0023: row(1, '2026-10-08T06:33:00.000Z')};
  await p.route(/\/api\/(version|state)(\?|$)/, async route => { const r = route.request(); const res = await curlFetch(r.url(), r.headers(), 'GET'); let body = res.body;
    if (phase && res.status === 200) { const j = JSON.parse(body.toString()); j.version += 1000000; if (j.docs) { const acc = j.docs.accessories = j.docs.accessories || {};
      Object.entries(ADD).forEach(([k, x]) => { const id = Object.keys(acc).find(i => acc[i] && acc[i]._k === k) || k; const d = acc[id] = acc[id] || {_k: k, v: []}; d.v = (d.v || []).filter(y => y.type !== 'Fire extinguisher').concat([x]); }); } body = Buffer.from(JSON.stringify(j)); }
    await route.fulfill({status: res.status, headers: res.headers, body}); });
  try {
    await p.waitForFunction(() => typeof fire914Of === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.has('accessories'), null, {timeout: 240000}); await p.waitForTimeout(2500);
    const grab = async () => p.evaluate(async () => { const out = {};
      const items = {GN01: chargeLines(assetOf('GN01')).map(l => l.discipline + '|' + l.item), WC09: chargeLines(assetOf('WC09')).map(l => l.discipline + '|' + l.item), T0023: chargeLines(assetOf('T0023')).map(l => l.discipline + '|' + l.item)};
      out.items = items;
      out.hostItem = Object.fromEntries(['GN01', 'WC09', 'T0023'].map(k => { const F = fire914Of(assetOf(k)); return [k, F && F.host ? F.host.item : null]; }));
      go('costs'); await new Promise(r => setTimeout(r, 3000)); let pane = document.getElementById('pane-costs'); pane.querySelectorAll('details').forEach(d => { d.open = true; }); await new Promise(r => setTimeout(r, 1500));
      const L = el => el.innerText.replace(/\s+/g, ' ').trim();
      out.costsLabourLine = [...pane.querySelectorAll('*')].filter(e => /^Labour ticked on references/.test((e.innerText || '').trim()) && e.children.length < 6).map(e => L(e.closest('div,tr,li') || e)).slice(0, 2);
      out.plFireLine = [...pane.querySelectorAll('*')].filter(e => /Fire extinguishers, per piece/.test(e.innerText || '') && (e.innerText || '').length < 300).map(e => L(e)).slice(-1);
      out.labourPlanFire = [...pane.querySelectorAll('tr')].filter(tr => /^Fire ext/i.test(((tr.cells[0] || {}).innerText || '').trim())).map(L);
      out.costsFireMentions = pane.innerText.split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(x => /fire ext/i.test(x)).slice(0, 30);
      const fh = [...pane.querySelectorAll('section,div.card,details')].find(e => /Finance handover/i.test((e.querySelector('h2,h3,summary') || {}).innerText || ''));
      out.financeHandover = fh ? fh.innerText.split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(x => /fire|unpriced|not priced|unknown|to confirm|incomplete/i.test(x)).slice(0, 12) : 'no Finance handover section found by heading';
      go('pricing'); await new Promise(r => setTimeout(r, 3000)); pane = document.getElementById('pane-pricing'); pane.querySelectorAll('details').forEach(d => { d.open = true; }); await new Promise(r => setTimeout(r, 1500));
      const want = new Set(Object.values(out.hostItem).filter(Boolean));
      out.pricingRows = [...pane.querySelectorAll('tr')].filter(tr => [...tr.cells].some(c => want.has((c.innerText || '').trim()))).map(L).slice(0, 12);
      out.pricingLabourPlanFire = [...pane.querySelectorAll('tr')].filter(tr => /^Fire ext/i.test(((tr.cells[0] || {}).innerText || '').trim())).map(L);
      out.labourCardFireRows = [...pane.querySelectorAll('tr')].filter(tr => /fire ext/i.test(tr.innerText) && tr.cells.length >= 6).map(L).slice(0, 8);
      go('pricing'); await new Promise(r => setTimeout(r, 2000)); pane = document.getElementById('pane-pricing');
      out.pricingGroupRows = [...pane.querySelectorAll('tr')].filter(tr => /Event Container|60kva|FWF/.test(tr.innerText) && /hire|tick/.test(tr.innerText) && !/Tick all/.test(tr.innerText)).map(L).slice(0, 8);
      go('costs'); await new Promise(r => setTimeout(r, 2500)); pane = document.getElementById('pane-costs'); pane.querySelectorAll('details').forEach(d => { d.open = true; }); await new Promise(r => setTimeout(r, 1200));
      const lines = pane.innerText.split('\n').map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
      const at = re => { const i = lines.findIndex(x => re.test(x)); return i < 0 ? null : lines.slice(Math.max(0, i - 1), i + 3); };
      out.costsLabourTicked = at(/^Labour ticked on references/);
      out.plFireAround = at(/^Fire extinguishers, per piece$/);
      out.fhHeads = lines.filter(x => /Finance handover|handover/i.test(x)).slice(0, 6);
      out.fhFire = (() => { const i = lines.findIndex(x => /Finance handover/i.test(x)); if (i < 0) return null; return lines.slice(i, i + 80).filter(x => /fire|unpriced|not priced|unknown|to confirm|incomplete|partial/i.test(x)).slice(0, 8); })();
      return out; });
    const before = await grab();
    phase = 1; await p.waitForFunction(() => fire914Qty('GN01') === 2 && fire914Qty('WC09') === 2 && fire914Qty('T0023') === 1, null, {timeout: 60000}); await p.waitForTimeout(2000);
    const after = await grab();
    const show = (o, tag) => { console.log('== ' + tag); Object.entries(o).forEach(([k, v]) => console.log('  ' + k + ': ' + mask(JSON.stringify(v)).slice(0, 2500))); };
    show(before, 'before (record as it is)'); show(after, 'after GN01 x2, WC09 x2, T0023 x1 (no card figure)');
    console.log('errors ' + s.errors.length + ' blocked ' + s.counts.blocked);
  } finally { await s.browser.close(); }
})().catch(e => { console.error('PROBE FAIL', e); process.exit(2); });
