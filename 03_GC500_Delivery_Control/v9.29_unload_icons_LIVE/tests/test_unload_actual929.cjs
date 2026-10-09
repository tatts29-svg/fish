// Author: Andrew Fisher. v9.29 unload-order icons on the real page, reading the live record (GET only; every write aborted).
// Every delivery day, laptop and phone: one strip per row, stops in the load's order, every scheduled item named, a tank
// before its block, no sideways overflow, and the rows otherwise byte-identical to the live page's.
//   node tests/test_unload_actual929.cjs <candidate.html> <live.html> <out-dir>
const {open} = require('../../toolchain/harness/open_page.js');
const fs = require('fs'), path = require('path'), assert = require('assert');
const [cand, live, out] = process.argv.slice(2); fs.mkdirSync(out, {recursive: true});

async function collect(pageFile, mobile, withChecks) {
  const s = await open({pageFile, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 900, dpr: 1, hash: '#timeline'});
  const p = s.page; await p.waitForTimeout(6000);
  const days = await p.evaluate(() => programmeDays().filter(d => dpLoads(d).some(g => g.kind === 'deliveries')).map(d => d.iso));
  const res = {};
  for (const day of days) {
    res[day] = await p.evaluate(async ({day, withChecks}) => {
      const t0 = performance.now();
      state.day = day; state.tlView = 'day'; go('timeline');
      await new Promise(r => setTimeout(r, 600));
      const b = document.querySelector('#pane-timeline [data-drop911-open]');
      if (!b) return {none: true};
      b.click(); await new Promise(r => setTimeout(r, 900));
      const ws = document.querySelector('#pane-timeline .drops911'); if (!ws) return {none: true, ws: false};
      const list = ws.querySelector('.drops911-order');
      const clone = list.cloneNode(true); clone.querySelectorAll('.unload929').forEach(x => x.remove());
      const r = {rowsHtml: clone.innerHTML, rows: ws.querySelectorAll('.drops911-order-row').length,
        ovf: list.scrollWidth - list.clientWidth, docOvf: document.documentElement.scrollWidth - document.documentElement.clientWidth, ms: Math.round(performance.now() - t0)};
      if (withChecks) {
        const d = programmeDays().find(x => x.iso === day), byId = new Map(dpLoads(d).filter(g => g.kind === 'deliveries').map(g => [ldId(d, g), g]));
        const fails = []; let strips = 0, items = 0, tanks = 0;
        const model = Drops911.report().model;
        model.loads.forEach(load => {
          const btn = [...ws.querySelectorAll('[data-drop911-select]')].find(x => x.dataset.drop911Select === load.id);
          const li = btn && btn.closest('li'); const st = li ? li.querySelectorAll('.unload929') : [];
          if (st.length !== 1) { fails.push(load.id + ': ' + st.length + ' strips'); return; }
          strips++;
          const g = byId.get(load.id); if (!g) { fails.push(load.id + ': no native load'); return; }
          const refs = [...new Set(g.rows.map(x => x.a.key))];
          const stops = [...st[0].querySelectorAll('.unload929-stop')].map(x => x.dataset.unload929Ref);
          if (JSON.stringify(stops) !== JSON.stringify(refs)) fails.push(load.id + ': stops ' + stops + ' vs ' + refs);
          const label = st[0].getAttribute('aria-label') || '';
          g.rows.forEach(x => dpItems(x).forEach(it => { if (it.item && !label.includes(it.item)) fails.push(load.id + ': label misses ' + it.item); }));
          st[0].querySelectorAll('.unload929-stop').forEach(stop => {
            const kinds = [...stop.querySelectorAll('.unload929-item')].map(i => i.dataset.unload929Kind); items += kinds.length;
            if (!kinds.length) fails.push(load.id + ': empty stop');
            const tk = kinds.indexOf('waste_tank'); if (tk >= 0) tanks++;
            if (tk > 0 && kinds.slice(0, tk).some(k => /toilet/.test(k))) fails.push(load.id + ': tank after a toilet at ' + stop.dataset.unload929Ref);
            if (tk >= 0 && !/tank/i.test(stop.textContent)) fails.push(load.id + ': tank not labelled');
          });
          // the button still selects the load and the order buttons are still there
          if (!li.querySelector('[data-drop911-move="up"]') || !li.querySelector('[data-drop911-move="down"]')) fails.push(load.id + ': order buttons missing');
        });
        // selecting a row still works with the icons inside it
        const second = ws.querySelectorAll('[data-drop911-select]')[1];
        if (second) { second.querySelector('.unload929-item, strong').dispatchEvent(new MouseEvent('click', {bubbles: true})); await new Promise(r => setTimeout(r, 300)); if (second.getAttribute('aria-pressed') !== 'true') fails.push('select by tapping an icon failed'); }
        const t1 = performance.now(); const f = Unload929.forDay(day); model.loads.forEach(l => f(l)); r.iconMs = +(performance.now() - t1).toFixed(1);
        Object.assign(r, {fails, strips, items, tanks});
      }
      const c = ws.querySelector('[data-drop911-close]'); if (c) c.click();
      return r;
    }, {day, withChecks});
  }
  if (withChecks) {
    for (const day of ['2026-09-14', '2026-10-07', '2026-10-09']) {
      await p.evaluate(async day => { state.day = day; state.tlView = 'day'; go('timeline'); await new Promise(r => setTimeout(r, 600)); document.querySelector('#pane-timeline [data-drop911-open]').click(); await new Promise(r => setTimeout(r, 2500)); const o = document.querySelector('#pane-timeline .drops911-order'); o.scrollIntoView({block: 'center'}); }, day);
      await p.waitForTimeout(800); await p.screenshot({path: path.join(out, `unload929_${day}_${mobile ? 390 : 1440}.png`)});
      await p.evaluate(() => { const c = document.querySelector('#pane-timeline [data-drop911-close]'); if (c) c.click(); });
    }
  }
  const meta = {errors: s.errors.slice(), blocked: s.counts.blocked};
  await s.browser.close();
  return {res, meta};
}
(async () => {
  const report = {};
  for (const mobile of [false, true]) {
    const view = mobile ? 'phone 390' : 'laptop 1440';
    const c = await collect(cand, mobile, true), l = await collect(live, mobile, false);
    const days = Object.keys(c.res); let rows = 0, strips = 0, items = 0, tanks = 0; const fails = [];
    assert.deepStrictEqual(days, Object.keys(l.res), view + ': delivery days differ from live');
    days.forEach(d => {
      const a = c.res[d], b = l.res[d];
      if (a.none) { fails.push(d + ': Arrange loads did not open'); return; }
      if (a.rowsHtml !== b.rowsHtml) fails.push(d + ': rows differ from live beyond the icons');
      if (a.ovf > 0) fails.push(d + ': list overflows sideways by ' + a.ovf);
      if (a.docOvf > 0) fails.push(d + ': page overflows sideways by ' + a.docOvf);
      if (a.rows !== a.strips) fails.push(d + ': ' + a.rows + ' rows, ' + a.strips + ' strips');
      a.fails.forEach(f => fails.push(d + ' ' + f));
      rows += a.rows; strips += a.strips; items += a.items; tanks += a.tanks;
    });
    if (c.meta.errors.length) fails.push('page errors: ' + c.meta.errors.join(' | '));
    if (c.meta.blocked) fails.push('writes attempted: ' + c.meta.blocked);
    const maxIconMs = Math.max(...days.map(d => c.res[d].iconMs || 0));
    report[view] = {days: days.length, rows, strips, items, tanks, maxIconMs, liveErrors: l.meta.errors.length, fails};
    console.log(view, JSON.stringify(report[view]));
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(report, null, 1));
  const bad = Object.values(report).some(r => r.fails.length);
  console.log(bad ? 'FAIL' : 'PASS: every row on every delivery day, laptop and phone');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
