/* Author: Andrew Fisher. v12.29 - the departed icon on the main maps. Part A reads the live record (GN10 left site 26 Oct
   07:40). Part B rehearses a part pick-up and a VMS pick-up through the page's own Record departure form with the sync held
   locally: every write is captured in the page and none reaches the network.
     PAGE=<build> OUT=<dir> [MOB=1] node test_v1229.cjs */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = process.env.MOB === '1', out = process.env.OUT, checks = [];
  fs.mkdirSync(out, {recursive: true});
  const h = await open({pageFile: process.env.PAGE, hash: '#map', W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, mobile}), p = h.page;
  const check = (name, ok, detail) => { checks.push({name, ok: !!ok, detail: detail === undefined ? null : detail}); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(checks, null, 1)); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 300))); assert(ok, name); };
  const shot = name => p.screenshot({path: path.join(out, name + (mobile ? '_phone' : '_desktop') + '.png')});
  const SAT = '#pane-map .s1141-map[data-s1141="map"]';
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.Departed1229 && window.SatMap1141, null, {timeout: 180000});
    await p.waitForTimeout(1500);
    check('page loads with no errors and the departure helper', !h.errors.length && await p.evaluate(() => typeof Departed1229.snapshot === 'function'), h.errors);

    /* ---------------- Part A: the live record ---------------- */
    const snap = await p.evaluate(() => { const s = Departed1229.snapshot(); return {refs: Object.fromEntries(s.refs), boards: Object.fromEntries(s.boards)}; });
    const gn = snap.refs.GN10;
    check('the departure record reads GN10 left site in full, 26 Oct 07:40', gn && gn.complete && gn.collected === 1 && gn.remaining === 0 && gn.short === '26 Oct 07:40' && gn.tag === 'LEFT SITE', gn);
    check('every departure it reads is the page\'s own (Departure1211)', await p.evaluate(refs => Object.keys(refs).every(k => { const d = Departure1211.status(k); return d && d.collected === refs[k].collected && !!d.complete === refs[k].complete; }), snap.refs), Object.keys(snap.refs));

    await p.evaluate(() => { state.sheet = '__explorer'; go('map'); Map1188.set('sat'); });
    await p.waitForFunction(s => document.querySelector(s + ' g.s1141-pin[data-id="GN10"]'), SAT, {timeout: 60000});
    const pin = await p.evaluate(s => { const g = document.querySelector(s + ' g.s1141-pin[data-id="GN10"]'); return {cls: g.getAttribute('class'), title: g.querySelector('title').textContent, label: g.querySelector('.s1141-lbl').textContent, badge: !!g.querySelector('.dep1229-badge'), glyph: (g.querySelector('.dep1229-badge text') || {}).textContent, op: g.querySelector('rect').getAttribute('fill-opacity')}; }, SAT);
    check('satellite map: GN10 wears the ↗ departed icon, faded', /s1141-left/.test(pin.cls) && /gone/.test(pin.cls) && pin.badge && pin.glyph === '↗' && pin.op === '.45', pin);
    check('satellite map: GN10 reads "GN10 · LEFT SITE", its title the time', pin.label === 'GN10 · LEFT SITE' && /Left site 26 Oct 07:40/.test(pin.title), pin);
    const exact = await p.evaluate(s => { const D = Departed1229.snapshot(), M = SatMap1141.maps.map;
      const want = M.items.filter(i => (i.kind === 'gen' && D.refs.has(String(i.id))) || (i.kind === 'vms' && D.boards.has(String(i.id)))).map(i => String(i.id)).sort();
      const have = [...document.querySelectorAll(s + ' g.s1141-pin.s1141-left')].map(g => g.dataset.id).sort(), all = document.querySelectorAll(s + ' g.s1141-pin').length;
      return {want, have, all}; }, SAT);
    check('satellite map: the icon is on what has left and nothing else', JSON.stringify(exact.want) === JSON.stringify(exact.have) && exact.all > 20, exact);
    const key = await p.evaluate(s => (document.querySelector(s + ' .dep1229-key') || {}).textContent || '', SAT);
    check('satellite map: one line names what has left', /Left site.*GN10 26 Oct 07:40/.test(key), key);
    const row = await p.evaluate(s => { const li = [...document.querySelectorAll(s + ' .s1141-list li')].find(x => (x.querySelector('b') || {}).textContent === 'GN10'); return li ? (li.querySelector('.dep1229-row') || {}).textContent || '' : null; }, SAT);
    check('satellite map list: GN10\'s row says ↗ Left site · 26 Oct 07:40', row === '↗ Left site · 26 Oct 07:40', row);
    const g10 = await p.evaluate(() => SatMap1141.generators().find(g => g.id === 'GN10'));
    const perf = await p.evaluate(g => { const t0 = performance.now(); for (let k = 0; k < 30; k++) SatMap1141.setZoom('map', 300 + k * 40, g.lat, g.lon); return {ms: Math.round((performance.now() - t0) / 30 * 10) / 10, badge: !!document.querySelector('#pane-map .s1141-map[data-s1141="map"] g.s1141-pin[data-id="GN10"] .dep1229-badge')}; }, g10);
    check('satellite map: zoom and pan redraw keep the icon, and stay quick', perf.badge && perf.ms < 60, perf);
    await p.evaluate(g => { SatMap1141.setZoom('map', 1400, g.lat, g.lon); document.querySelector('#pane-map .s1141-map[data-s1141="map"]').scrollIntoView({block: 'start'}); }, g10);
    await p.waitForTimeout(2500); await shot('sat_gn10_left_site');

    await p.evaluate(() => go('vms'));
    await p.waitForFunction(() => document.querySelector('#pane-vms .s1141-map[data-s1141="vms"] g.s1141-pin'), null, {timeout: 60000});
    const vmsMap = await p.evaluate(() => { const D = Departed1229.snapshot(); const pins = [...document.querySelectorAll('#pane-vms .s1141-map[data-s1141="vms"] g.s1141-pin')]; return {pins: pins.length, left: pins.filter(g => g.classList.contains('s1141-left')).map(g => g.dataset.id), want: pins.map(g => g.dataset.id).filter(id => D.boards.has(id))}; });
    check('VMS tab board map: its pins carry the icon only where a board has left', vmsMap.pins >= 20 && JSON.stringify(vmsMap.left.sort()) === JSON.stringify(vmsMap.want.sort()), vmsMap);

    const sheet = await p.evaluate(() => { const a = assetOf('GN10'), l = (a.drawing_links || [])[0], sh = l && DATA.sheets.find(s => s.sheet_id === l.sheet); if (!sh) return null; state.sheet = sh.key; go('map'); renderMap(); return {key: sh.key, sheet: l.sheet, label: l.label}; });
    check('GN10 has a drawing sheet to show it on', !!sheet, sheet);
    await p.waitForFunction(() => [...document.querySelectorAll('#pane-map button.mk')].some(b => (b.dataset.keys || '').split(',').includes('GN10')), null, {timeout: 60000});
    const pill = await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-map button.mk')].find(x => (x.dataset.keys || '').split(',').includes('GN10')); return {cls: b.className, left: b.dataset.left1229, badge: !!b.querySelector('i.leftx1229'), glyph: (b.querySelector('i.leftx1229') || {}).textContent, title: b.title, aria: b.getAttribute('aria-label')}; });
    check('drawing sheet: the GN10 pill wears the ↗ icon and is dashed', pill.badge && pill.glyph === '↗' && pill.left === 'all' && /mkleft1229/.test(pill.cls), pill);
    check('drawing sheet: its title and name say left site with the time', /LEFT SITE: GN10 Left site 26 Oct 07:40/.test(pill.title) && /left site: GN10 Left site 26 Oct 07:40/.test(pill.aria), pill);
    const pills = await p.evaluate(() => { const D = Departed1229.snapshot(); const bs = [...document.querySelectorAll('#pane-map button.mk')]; return {icons: bs.filter(b => b.querySelector('i.leftx1229')).length, want: bs.filter(b => (b.dataset.keys || '').split(',').filter(Boolean).some(k => D.refs.has(k))).length, all: bs.length}; });
    check('drawing sheet: the icon is on the departed pills and no others', pills.icons === pills.want && pills.all > 5, pills);
    await p.evaluate(s => { try { mapLocate(s.sheet, s.label); } catch (e) {} }, sheet);
    await p.waitForTimeout(2000); await shot('sheet_gn10_pill');
    const box = await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-map button.mk')].find(x => (x.dataset.keys || '').split(',').includes('GN10')); b.scrollIntoView({block: 'center', inline: 'center'}); const r = b.getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; });
    await p.waitForTimeout(500);
    const box2 = await p.evaluate(() => { const r = [...document.querySelectorAll('#pane-map button.mk')].find(x => (x.dataset.keys || '').split(',').includes('GN10')).getBoundingClientRect(); return {x: r.x, y: r.y, w: r.width, h: r.height}; });
    await p.screenshot({path: path.join(out, 'sheet_gn10_pill_close' + (mobile ? '_phone' : '_desktop') + '.png'), clip: {x: Math.max(0, box2.x - 70), y: Math.max(0, box2.y - 50), width: box2.w + 140, height: box2.h + 100}});

    await p.evaluate(() => { state.sheet = '__explorer'; go('map'); Map1188.set('plan'); });
    await p.waitForFunction(() => document.querySelector('#expFrame')?.contentWindow?.GC500Departure1211, null, {timeout: 180000});
    await p.waitForTimeout(1500);
    await p.evaluate(() => { const r = MapSearch1210.search('GN10').rows.find(x => x.code1210 === 'GN10' && !x.none); if (r) MapSearch1210.select(r); });
    await p.waitForTimeout(3000);
    const f = p.frames().find(x => x.url().includes('/explorer/'));
    const cardText = (await f.evaluate(() => document.body.innerText)) + '\n' + (await p.evaluate(() => (document.getElementById('expcard') || {}).innerText || ''));
    check('Map explorer: GN10\'s card shows what left (Qty 1), not the 0 still to leave', /Left site · Qty 1/.test(cardText) && !/Left site · Qty 0/.test(cardText), (cardText.match(/Left site[^\n]{0,30}/g) || []).slice(0, 3));
    check('Map explorer: GN10\'s card says left site with the time, not "still to come: on site"', /Left site 26 Oct 07:40 · nothing still to come on site/.test(cardText) && /Left site · 26\/10\/2026, 07:40:00 AEST/.test(cardText) && !/Still to come: (In transit|On site)/.test(cardText), (cardText.match(/(Left site|Still to come|In transit)[^\n]{0,60}/g) || []).slice(0, 6));
    check('Map explorer: the map still marks GN10 LEFT SITE', await f.evaluate(() => GC500Departure1211.state.some(x => x.key === 'GN10' && x.complete && x.label === 'Left site')));
    await p.locator('#expcard').scrollIntoViewIfNeeded().catch(() => {}); await shot('explorer_gn10_card');

    /* ---------------- Part B: rehearsals, the sync held in the page ---------------- */
    await p.context().route('**/api/version', r => r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({version: 0, level: 'edit'})}));
    await p.context().route('**/api/state*', r => r.abort());
    await p.evaluate(() => { window.__captured1229 = []; SYNC.claims = 'edit'; Object.defineProperty(SYNC, 'level', {configurable: true, get: () => 'edit', set: () => {}}); Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}});
      SYNC.db.doc = name => ({set: async value => { __captured1229.push({name}); return {}; }, delete: async () => { throw Error('Deletion disallowed'); }}); S.operator = 'Example test recorder'; const who = document.getElementById('who'); if (who) who.value = S.operator; });
    /* a part pick-up: one unit of a numbered multi-unit reference that shows on a drawing sheet */
    const part = await p.evaluate(() => holdAssets(() => { const r = demob816().refs.find(r => { const a = assetOf(r.key), s = DemobCollection996.snapshot(r.key); return a && (a.drawing_links || []).length && r.units.length === 1 && r.units[0].n >= 2 && s && s.record.state === 'on site' && s.reading.arrival && !s.reading.issues.length && !s.reading.recorded && (s.pools[String(r.units[0].type).toLowerCase().replace(/\s+/g, ' ')] || []).length >= 2; }); return r ? {key: r.key, type: r.units[0].type, n: r.units[0].n} : null; }));
    check('a numbered multi-unit reference on a drawing is there to rehearse a part pick-up', !!part, part);
    await p.evaluate(k => { const d = S.delivery[k] || (S.delivery[k] = {}); d.emptied = true; d.emptied_at = new Date().toISOString(); d.emptied_by = S.operator; }, part.key);
    check('the Record departure form opens', await p.evaluate(k => DemobCollection996.open(k), part.key));
    await p.locator('#collection996 input[type=checkbox]').first().check(); await p.locator('#collection996 [data-departure-now]').click(); await p.locator('#collection996 button[type=submit]').click();
    await p.waitForFunction(() => !document.querySelector('#collection996'), null, {timeout: 10000});
    const partRead = await p.evaluate(k => Departed1229.ref(k), part.key);
    check('a part pick-up reads "1 LEFT", not left site', partRead && !partRead.complete && partRead.collected === 1 && partRead.tag === '1 LEFT' && /^1 left, \d+ still to leave/.test(partRead.words), partRead);
    const partPill = await p.evaluate(k => { const a = assetOf(k), l = (a.drawing_links || [])[0], sh = DATA.sheets.find(s => s.sheet_id === l.sheet); state.sheet = sh.key; renderMap(); const b = [...document.querySelectorAll('#pane-map button.mk')].find(x => (x.dataset.keys || '').split(',').includes(k)); return b ? {cls: b.className, left: b.dataset.left1229, badge: !!b.querySelector('i.leftx1229'), title: b.title} : null; }, part.key);
    check('drawing sheet: a part pick-up wears the icon but is not dashed', partPill && partPill.badge && partPill.left === 'part' && !/mkleft1229/.test(partPill.cls) && /1 left, \d+ still to leave/.test(partPill.title), partPill);
    /* a VMS pick-up: every board on a VMS delivery reference leaves */
    const vref = await p.evaluate(() => holdAssets(() => { const boards = VmsEquipment1103.model().boards || []; const b = boards.find(b => { if (!b.delivery || b.departure1211) return false; const s = DemobCollection996.snapshot(b.delivery); return s && s.record.state === 'on site' && s.reading.arrival && !s.reading.issues.length && !s.reading.unknown && s.reading.remaining.some(u => u.n > 0); }); return b ? {key: b.delivery, board: b.key, positions: (b.positions || []).map(x => String(x.pos))} : null; }));
    check('a VMS delivery reference is there to rehearse a board pick-up', !!vref && vref.positions.length > 0, vref);
    await p.evaluate(k => DemobCollection996.open(k), vref.key);
    await p.evaluate(() => { document.querySelectorAll('#collection996 input[type=checkbox]').forEach(x => { x.checked = true; }); document.querySelectorAll('#collection996 [name=unidentified]').forEach(x => { x.value = x.max; }); });
    await p.locator('#collection996 [data-departure-now]').click(); await p.locator('#collection996 button[type=submit]').click();
    await p.waitForFunction(() => !document.querySelector('#collection996'), null, {timeout: 10000});
    const vread = await p.evaluate(v => ({ref: Departed1229.ref(v.key), boards: v.positions.map(pos => Departed1229.board(pos))}), vref);
    check('the VMS reference reads left site, and its board\'s plan positions too', vread.ref && vread.ref.complete && vread.boards.every(b => b && b.complete && b.tag === 'LEFT SITE'), vread);
    await p.evaluate(() => { state.sheet = '__explorer'; go('map'); Map1188.set('sat'); });
    await p.waitForFunction(s => document.querySelector(s + ' g.s1141-pin'), SAT, {timeout: 60000});
    const vpins = await p.evaluate(v => v.positions.map(pos => { const g = document.querySelector('#pane-map .s1141-map[data-s1141="map"] g.s1141-pin[data-id="' + pos + '"]'); return g ? {pos, cls: g.getAttribute('class'), badge: !!g.querySelector('.dep1229-badge'), label: g.querySelector('.s1141-lbl').textContent} : {pos, missing: true}; }), vref);
    check('satellite map: the departed board wears the ↗ icon and LEFT SITE', vpins.filter(x => !x.missing).length > 0 && vpins.filter(x => !x.missing).every(x => x.badge && /gone/.test(x.cls) && / · LEFT SITE$/.test(x.label)), vpins);
    await p.evaluate(() => go('vms'));
    await p.waitForFunction(() => document.querySelector('#pane-vms .s1141-map[data-s1141="vms"] g.s1141-pin'), null, {timeout: 60000});
    const vtab = await p.evaluate(v => v.positions.map(pos => { const g = document.querySelector('#pane-vms .s1141-map[data-s1141="vms"] g.s1141-pin[data-id="' + pos + '"]'); return g ? {pos, badge: !!g.querySelector('.dep1229-badge')} : {pos, missing: true}; }), vref);
    check('VMS tab board map: the departed board wears the icon there too', vtab.filter(x => !x.missing).length > 0 && vtab.filter(x => !x.missing).every(x => x.badge), vtab);
    check('the rehearsals were captured in the page; nothing reached the network', await p.evaluate(() => __captured1229.length > 0) && !h.counts.blocked, h.counts);
    check('no runtime errors through the maps and the rehearsals', !h.errors.length, h.errors);
  } catch (e) { console.error('Runtime errors', h.errors); throw e; }
  finally { await h.browser.close(); }
  console.log(checks.filter(c => c.ok).length + '/' + checks.length);
})().catch(e => { console.error(e); process.exit(1); });
