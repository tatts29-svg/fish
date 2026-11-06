const {open} = require('./lh2'); const OUT = '/tmp/claude-0/stage4/shots/';
const PAGE = process.env.PAGE, TAG = process.env.TAG, MOB = !!process.env.MOB;
(async () => { const s = await open(MOB ? {pageFile: PAGE, W: 412, H: 915, dpr: 2, mobile: true} : {pageFile: PAGE, hash: '#sheet/MASTER'}); const p = s.page; const res = {};
  await p.waitForFunction(() => typeof go === 'function' && typeof gc500PlanItems === 'function', null, {timeout: 120000}); await p.waitForTimeout(3000);
  if (!MOB) { await p.evaluate(() => { location.hash = '#sheet/MASTER'; }); await p.waitForTimeout(5000);
    res.masterTrade = await p.evaluate(() => [...document.querySelectorAll('#pane-map .lightbar[aria-label="Filter by trade"] button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
    res.masterShow = await p.evaluate(() => [...document.querySelectorAll('#pane-map [data-maplayer]')].map(b => b.textContent.replace(/\s+/g, ' ').trim())); }
  res.host = await p.evaluate(() => { const h = gc500PlanItems(); return {trades: h.trades.map(t => t.name + ' ' + t.count), layers: h.layers.map(l => l.name + ' ' + l.n + (l.marks.length !== l.n ? ' (placed ' + l.marks.length + ')' : '')), items: h.items.length, unplaced: h.unplaced.map(u => u.key)}; });
  await p.evaluate(() => machineOpen('explorer'));
  const fr = await (async () => { for (let i = 0; i < 240; i++) { const f = p.frames().find(f => /explorer\/index\.html/.test(f.url())); if (f) { try { if (await f.evaluate(() => !!window.__ready)) return f; } catch (e) {} } await p.waitForTimeout(1000); } return null; })();
  if (!fr) { res.fail = 'explorer not ready'; console.log(JSON.stringify(res)); await s.browser.close(); return; }
  res.findTitle = await fr.evaluate(() => document.querySelector('#findCard h3').textContent);
  res.chips = await fr.evaluate(() => [...document.querySelectorAll('#chips .chip')].map(b => b.textContent.replace(/\s+/g, ' ').trim()));
  // generators: the list and a pick
  res.gen = await fr.evaluate(() => { const b = [...document.querySelectorAll('#chips .chip')].find(x => /Generators/.test(x.textContent)); b.click(); return {head: document.querySelector('#findList .rh').textContent, rows: [...document.querySelectorAll('#findList button')].slice(0, 20).map(x => x.textContent.replace(/\s+/g, ' ').trim()), marks: window.__marksCount()}; });
  await p.waitForTimeout(6000);
  if (MOB) await fr.evaluate(() => document.body.classList.add('nav'));
  console.log(JSON.stringify(res, null, 1)); try { await p.screenshot({path: OUT + TAG + '_gens.png', timeout: 150000}); } catch (e) { console.log('shot1 timeout'); }
  res.search = await fr.evaluate(() => { const q = document.getElementById('q'); q.value = 'GN04'; q.dispatchEvent(new Event('input')); return [...document.querySelectorAll('#results button')].slice(0, 3).map(x => x.textContent.replace(/\s+/g, ' ').trim()); });
  await fr.evaluate(() => { document.querySelector('#results [data-code]').click(); }); await p.waitForTimeout(6000);
  res.selected = await fr.evaluate(() => window.__marksCount());
  try { await p.screenshot({path: OUT + TAG + '_gn04.png', timeout: 150000}); } catch (e) { console.log('shot2 timeout'); }
  res.errors = s.errors; console.log(JSON.stringify(res, null, 1)); await s.browser.close(); })().catch(e => { console.error('FAIL', e); process.exit(1); });
