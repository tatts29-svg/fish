// v7.87 - Inventory one line per location. Author: Andrew Fisher. Read-only: GETs only, writes aborted by the harness.
//   PAGE=<built page> [MOB=1] [OUT=<json>] [SHOTS=<dir>] node one_line_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path');
(async () => {
  const MOB = !!process.env.MOB, s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 1000}), p = s.page;
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)}), tag = MOB ? 'phone' : 'desktop', SH = process.env.SHOTS;
  await p.waitForFunction(() => typeof inv83Open === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  const t0 = await p.evaluate(() => { INV.disc = '*'; location.hash = '#change/' + todayIso(); const a = performance.now(); try { render(); } catch (e) {} return performance.now() - a; });
  await p.waitForSelector('#tg782 li.ln87', {timeout: 60000}); await new Promise(r => setTimeout(r, 1500));
  const A = await p.evaluate(() => { const box = document.querySelector('#tg782'), lis = [...box.querySelectorAll('li')];
    const want = inv83Togo(inventory()).map(e => e.key);
    const L = lis.map(li => { const r = li.getBoundingClientRect(), q = li.querySelector('.ln87-qr').getBoundingClientRect(), rf = li.querySelector('.tg-ref').getBoundingClientRect(), mp = li.querySelector('.ln87-map').getBoundingClientRect(), d = li.querySelector('.ln87-do').getBoundingClientRect();
      return {k: li.querySelector('.tg-ref').dataset.open, todo: li.querySelector('.ln87-its').textContent.trim(), tags: li.querySelectorAll('.ln87-tag').length, loc: (li.querySelector('.tg-loc') || {}).textContent || '', pin: !!li.querySelector('.ln87-loc i'), sat: !!li.querySelector('img[data-sat87]'), qr: !!li.querySelector('[data-qr87]'), map: !!li.querySelector('[data-map], .tg-map[data-open]'), h: Math.round(r.height),
        sameRow: Math.abs(rf.top - q.top) < 60 && Math.abs(d.top - rf.top) < 120, mapRow: mp.top < r.bottom }; });
    return {n: L.length, want: want.length, missing: want.filter(k => !L.some(x => x.k === k)), L, over: document.documentElement.scrollWidth > innerWidth + 1}; });
  ok('L1 every location still to come is a line (' + A.n + ' of ' + A.want + ')', A.n === A.want && !A.missing.length, A.missing.join(','));
  ok('L2 each line says what is still to do, with its tags', A.L.every(x => x.todo.length > 0 && x.tags >= 1), A.L.filter(x => !x.todo || !x.tags).map(x => x.k).join(','));
  ok('L3 each line has its map location words and a locator pin', A.L.every(x => x.loc.trim() && x.pin), A.L.filter(x => !x.loc.trim() || !x.pin).map(x => x.k).join(','));
  ok('L4 each line has a QR code place and a satellite picture place', A.L.every(x => x.qr && x.sat), A.L.filter(x => !x.qr || !x.sat).map(x => x.k).join(','));
  ok('L5 reference, still to do and QR on the same line' + (MOB ? ' (phone: map location under them)' : ''), A.L.every(x => x.sameRow), A.L.filter(x => !x.sameRow).map(x => x.k).join(','));
  ok('L6 no sideways scroll', !A.over, A.over);
  // scroll to the list: codes and pictures arrive as their lines come into view
  await p.evaluate(() => document.querySelector('#tg782').scrollIntoView({block: 'start'})); await new Promise(r => setTimeout(r, 2500));
  await p.waitForFunction(() => { const im = [...document.querySelectorAll('#tg782 img[data-sat87]')].slice(0, 3); return im.length && im.every(i => i.complete && i.naturalWidth > 0 || i.parentNode.classList.contains('none')); }, null, {timeout: 30000}).catch(() => null);
  const B = await p.evaluate(() => { const lis = [...document.querySelectorAll('#tg782 li')].slice(0, 3); return lis.map(li => ({k: li.querySelector('.tg-ref').dataset.open, qr: !!li.querySelector('[data-qr87] svg'), satW: (li.querySelector('img[data-sat87]') || {}).naturalWidth || 0, none: li.querySelector('.ln87-sat').classList.contains('none'), host: ((li.querySelector('img[data-sat87]') || {}).src || '').split('/')[2] || ''})); });
  ok('L7 the first lines in view have their QR drawn', B.every(x => x.qr), JSON.stringify(B));
  ok('L8 the first lines in view have their satellite picture (Mapbox)', B.every(x => x.satW > 0 && x.host === 'api.mapbox.com'), JSON.stringify(B));
  const lazy = await p.evaluate(() => { const c = [...document.querySelectorAll('#tg782 [data-qr87]')]; return {drawn: c.filter(x => x.querySelector('svg')).length, all: c.length}; });
  ok('L9 QR codes far down the list wait until they are scrolled to (' + lazy.drawn + ' of ' + lazy.all + ' drawn)', lazy.drawn < lazy.all || lazy.all < 12, JSON.stringify(lazy));
  const qrOk = await p.evaluate(() => { const li = document.querySelector('#tg782 li'), k = li.querySelector('.tg-ref').dataset.open, a = assetOf(k), P = dpPos(a); return li.querySelector('[data-qr87]').dataset.qr87 === navUrl({lat: P.lat, lon: P.lon}); });
  ok('L10 the QR is the same navigation the drivers get', qrOk, qrOk);
  ok('L11 the card draws in good time (' + Math.round(t0) + ' ms)', t0 < 2500, t0);
  if (SH) { fs.mkdirSync(SH, {recursive: true});
    const bb = await p.evaluate(() => { const e = document.querySelector('#tg782'); e.scrollIntoView({block: 'start'}); const r = e.getBoundingClientRect(); return {x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y))}; });
    await new Promise(r => setTimeout(r, 2500)); await p.screenshot({path: path.join(SH, 'screen_' + tag + '.png'), clip: bb}); }
  // the references under each Still-to-come number in the table, keeping its look
  const TR = await p.evaluate(() => { const I = inventory(), bad = [], rows = I.list.filter(r => r.asked - r.on > 0);
    rows.forEach(r => { const b = [...document.querySelectorAll('[data-invdrill]')].find(x => x.dataset.invdrill === r.type + '|togo'); const td = b && b.closest('td'); const chips = td ? [...td.querySelectorAll('.inv87ref')] : [];
      const want = Object.values(r.refs).filter(x => x.asked - x.on > 0), sum = chips.reduce((n, c) => n + (+((c.querySelector('i') || {}).textContent || '×1').slice(1)), 0);
      if (chips.length !== want.length || sum !== Math.max(0, r.asked - r.on) || !want.every(x => chips.some(c => c.textContent.startsWith(x.key)))) bad.push(r.item + ':' + chips.length + '/' + want.length + ' sum ' + sum + '/' + (r.asked - r.on)); });
    const none = [...document.querySelectorAll('.invtab tbody tr')].filter(tr => !tr.querySelector('[data-invdrill$="|togo"]') && tr.querySelector('.inv87ref')).length;
    return {rows: rows.length, bad, none}; });
  ok('T1 under every Still-to-come number, the reference of each location it waits on, adding up to the number (' + TR.rows + ' types)', TR.rows > 0 && !TR.bad.length && !TR.none, JSON.stringify(TR));
  if (SH) { const bb = await p.evaluate(() => { const e = document.querySelector('#invCard .invwrap'); e.scrollIntoView({block: 'start'}); const r = e.getBoundingClientRect(); return {x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y))}; });
    await new Promise(r => setTimeout(r, 800)); await p.screenshot({path: path.join(SH, 'table_refs_' + tag + '.png'), clip: bb}); }
  const pr = await p.evaluate(() => { const c = [...document.querySelectorAll('.inv87ref')].pop(); const v = c.dataset.invref87; c.click(); return v.slice(v.lastIndexOf('|') + 1); }); await new Promise(r => setTimeout(r, 1500));
  const hit = await p.evaluate(ref => { const li = document.querySelector('#invDrill li.ln87-hit'); return li ? {k: li.dataset.k87, go: !!li.querySelector('a.ln87-go'), r: Math.round(li.getBoundingClientRect().top), h: innerHeight} : null; }, pr);
  ok('T2 pressing a reference opens where it goes, on its own line (' + pr + ')', hit && hit.k === pr && hit.go && hit.r >= -5 && hit.r < hit.h, JSON.stringify(hit));
  await p.evaluate(() => { INV.drill = null; render(); }); await new Promise(r => setTimeout(r, 800));
  // the Still-to-come number in the table (a toilet type): one line per location not turned up yet, where it goes, directions
  const dk = await p.evaluate(() => { const I = inventory(), r = I.list.filter(x => /toilet/i.test(x.disc) && x.asked - x.on > 0).sort((a, b) => (b.asked - b.on) - (a.asked - a.on))[0]; if (!r) return null;
    const b = [...document.querySelectorAll('[data-invdrill]')].find(x => x.dataset.invdrill === r.type + '|togo'); if (!b) return null; b.click(); return {item: r.item, n: Object.values(r.refs).filter(x => x.asked - x.on > 0).length}; });
  await p.waitForSelector('#invDrill li.ln87', {timeout: 30000}).catch(() => null); await new Promise(r => setTimeout(r, 2500));
  const DR = await p.evaluate(() => { const box = document.querySelector('#invDrill'); if (!box) return null; const lis = [...box.querySelectorAll('li.ln87')];
    return {head: box.querySelector('.invdrillh b').textContent, n: lis.length, rows: lis.map(li => { const k = li.querySelector('.tg-ref').dataset.open, a = assetOf(k), P = dpPos(a), go = li.querySelector('a.ln87-go');
      return {k, due: !!li.querySelector('.ln87-due'), loc: (li.querySelector('.tg-loc') || {}).textContent || '', go: go ? go.href === navUrl({lat: P.lat, lon: P.lon}) && go.target === '_blank' : false, qr: (li.querySelector('[data-qr87]') || {dataset: {}}).dataset.qr87 === navUrl({lat: P.lat, lon: P.lon})}; }),
      first: (() => { const li = lis[0]; return li ? {qr: !!li.querySelector('[data-qr87] svg'), sat: (li.querySelector('img[data-sat87]') || {}).naturalWidth || 0} : null; })()}; });
  ok('D1 pressing Still to come for ' + (dk && dk.item) + ' lists every location not turned up yet, one line each (' + (DR && DR.n) + ' of ' + (dk && dk.n) + ')', dk && DR && DR.n === dk.n && DR.n > 0, JSON.stringify(DR && DR.head));
  ok('D2 each says its due day and where it goes', DR && DR.rows.every(x => x.due && x.loc.trim()), JSON.stringify(DR && DR.rows.filter(x => !x.due || !x.loc.trim())));
  ok('D3 each has a Directions link straight to the spot (the same navigation as the QR and the drivers)', DR && DR.rows.every(x => x.go && x.qr), JSON.stringify(DR && DR.rows.filter(x => !x.go || !x.qr).map(x => x.k)));
  ok('D4 the first line has its QR and satellite picture', DR && DR.first && DR.first.qr && DR.first.sat > 0, JSON.stringify(DR && DR.first));
  if (SH) { const bb = await p.evaluate(() => { const e = document.querySelector('#invDrill'); e.scrollIntoView({block: 'start'}); const r = e.getBoundingClientRect(); return {x: Math.max(0, r.x), y: Math.max(0, r.y), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(0, r.y))}; });
    await new Promise(r => setTimeout(r, 2500)); await p.screenshot({path: path.join(SH, 'drill_' + tag + '.png'), clip: bb}); }
  // pressing the map opens the map at that reference
  const mk = await p.evaluate(() => { const b = document.querySelector('#tg782 .ln87-pics[data-map]'); if (!b) return null; b.click(); return b.dataset.map; }); await new Promise(r => setTimeout(r, 2500));
  const where = await p.evaluate(() => location.hash);
  ok('L12 pressing the pictures opens the map (' + mk + ' -> ' + where + ')', mk && /sheet|map/.test(where), where);
  ok('E1 no page errors', !s.errors.length, s.errors.join(' | '));
  ok('E2 nothing written', s.counts.blocked === 0, JSON.stringify(s.counts));
  const pass = T.filter(x => x.pass).length; T.forEach(x => console.log((x.pass ? 'PASS ' : 'FAIL ') + x.name + (x.pass ? '' : ' :: ' + x.detail.slice(0, 300))));
  console.log(tag + ': ' + pass + '/' + T.length); if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({tag, T, heights: A.L.map(x => x.k + ':' + x.h)}, null, 1));
  await s.browser.close(); process.exit(pass === T.length ? 0 : 1);
})();
