/* Author: Andrew Fisher. v11.56 checks: the finder answers "gate 6", "g6", "gate 5a", "gate 1" and "gates" with the gate first;
   twelve gates from the master plan, each at one point (fence line where drawn, else the approach, never the inset copy);
   picking a gate opens the Maps tab with the plan on the gate's label and the satellite map zoomed and ringed on it; the
   satellite map under the explorer carries the gates as pins with a Gates filter and a list. GET only; record compared.
     PAGE=build/GC500_v11.56/GC500_Delivery_Control_hosted.html node tests/test_v1156.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 1200))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
const FACES = ['G1', 'G2', 'G3', 'G4', 'G5A', 'G5B', 'G6', 'G7', 'G8', 'G8A', 'G9', 'G10'];
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page; const navs = [];
 p.on('framenavigated', f => { if (f === p.mainFrame()) navs.push(f.url()); }); const doc0 = () => navs.length ? navs[0].split('#')[0] : null; const realNavs = () => navs.filter(u => u.split('#')[0] !== (doc0() || u.split('#')[0]) || !u.includes('#'));
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3000);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.56'));
  const G = await p.evaluate(() => { const g = Gates1156.gates(); const m = q => finderMatches(q).map(it => it.kind + ':' + (it.kind === 'gate' ? it.label : (it.key || it.label || it.title || '')));
   return {faces: g.map(x => x.face), g1: g.find(x => x.face === 'G1'), g6: g.find(x => x.face === 'G6'), g8a: g.find(x => x.face === 'G8A'),
    q: {'gate 6': m('gate 6'), 'g6': m('g6'), 'gate 5a': m('gate 5a'), 'gate 5': m('gate 5'), 'gate 1': m('gate 1'), 'gates': m('gates'), 'gate 10': m('gate 10'), 'P33': m('P33').slice(0, 3)}}; });
  check('twelve gates from the master plan, G1 to G10 with 5A, 5B and 8A', G.faces.length === 12 && FACES.every(f => G.faces.includes(f)), G.faces);
  check('one point a gate: G1 and G8A on the fence line where the master draws it, G6 the approach on the main sheet (not the inset copy)',
   G.g1 && G.g1.where === 'on the fence line' && Math.abs(G.g1.lat + 27.981657) < 1e-6 && Math.abs(G.g1.lon - 153.423601) < 1e-6 && G.g8a && G.g8a.where === 'on the fence line' && Math.abs(G.g8a.lat + 27.981585) < 1e-6 && G.g6 && G.g6.where === 'the approach' && Math.abs(G.g6.lat + 27.993254) < 1e-6 && Math.abs(G.g6.lon - 153.430472) < 1e-6, {g1: G.g1, g6: G.g6, g8a: G.g8a});
  check('"gate 6", "g6" and "gate 10" put that gate first; "gate 1" is Gate 1, not Gate 10', G.q['gate 6'][0] === 'gate:Gate 6' && G.q['g6'][0] === 'gate:Gate 6' && G.q['gate 10'][0] === 'gate:Gate 10' && G.q['gate 1'][0] === 'gate:Gate 1', G.q);
  check('"gate 5a" is Gate 5A; "gate 5" offers 5A and 5B; "gates" lists all twelve first; an ordinary search is untouched', G.q['gate 5a'][0] === 'gate:Gate 5A' && G.q['gate 5'].slice(0, 2).join() === 'gate:Gate 5A,gate:Gate 5B' && G.q['gates'].slice(0, 12).every(x => x.startsWith('gate:')) && G.q['gates'].filter(x => x.startsWith('gate:')).length === 12 && G.q['P33'][0] && !G.q['P33'][0].startsWith('gate:'), G.q);
  await p.evaluate(() => holdAssets(() => { finderOpen('gate 6'); }));
  await p.waitForTimeout(600);
  const F = await p.evaluate(() => ({first: FINDER.list && FINDER.list[0] && FINDER.list[0].kind + ':' + FINDER.list[0].label, row: (document.querySelector('.fi.gate1156') || {}).textContent}));
  check('the finder row for the gate says what it is and what opens', /gate:Gate 6/.test(F.first) && /Gate 6/.test(F.row || '') && /master plan D001-26003-03/.test(F.row || '') && /opens the Maps tab/.test(F.row || ''), F);
  navs.length = 0;
  await p.evaluate(() => holdAssets(() => { finderPick(0); }));
  await p.waitForTimeout(MOB ? 7000 : 6000);
  const M = await p.evaluate(() => { const svg = document.querySelector('#pane-map .s1141-map[data-s1141="map"] .s1141-svg'); const ring = svg && svg.querySelector('g.gate1156-ring'); const Mm = SatMap1141.maps.map; const card = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'); const pane = document.querySelector('#pane-map');
   return {tab: typeof state !== 'undefined' ? state.tab : null, hash: location.hash, sheet: typeof state !== 'undefined' ? state.sheet : null, sel: typeof state !== 'undefined' ? JSON.stringify(state.sel || null).slice(0, 200) : null,
    mapShown: !!pane && !pane.hidden && getComputedStyle(pane).display !== 'none', pct: SatMap1141.pct('map'), ring: !!ring, ringGate: ring && ring.getAttribute('data-gate'), ringKids: ring && ring.childElementCount, ringErr: window.gate1156Err || null, gateItems: Mm ? Mm.items.filter(i => i.kind === 'gate').length : null, pins: svg ? [...svg.querySelectorAll('g.s1141-pin[data-id]')].filter(g => /^G\d/.test(g.dataset.id)).length : null,
    filterBtn: !!(card && card.querySelector('[data-s1141-filter="gate"]')), filterText: card && card.querySelector('[data-s1141-filter="gate"]') ? card.querySelector('[data-s1141-filter="gate"]').textContent : null, listRows: card ? card.querySelectorAll('li[data-kind="gate"]').length : null,
    g6pin: svg && svg.querySelector('g.s1141-pin[data-id="G6"]') ? svg.querySelector('g.s1141-pin[data-id="G6"]').textContent : null, finderOpen: document.body.classList.contains('search-open')}; });
  check('picking the gate opens the Maps tab in its explorer view, closes the finder, no page reload (hash moves only)', M.mapShown && !M.finderOpen && M.sheet === '__explorer' && realNavs().length === 0, {tab: M.tab, hash: M.hash, sheet: M.sheet, mapShown: M.mapShown, finderOpen: M.finderOpen, navs});
  check('the satellite map is zoomed on Gate 6 and ringed', M.pct >= 1500 && M.ring && M.ringGate === 'G6', {pct: M.pct, ring: M.ring, ringGate: M.ringGate});
  check('the satellite map carries the twelve gates: items, pins, a Gates filter and a list', M.gateItems === 12 && M.pins === 12 && M.filterBtn && /Gates \(12\)/.test(M.filterText || '') && M.listRows === 12 && /G6/.test(M.g6pin || '') && /Gate 6/.test(M.g6pin || ''), M);
  await p.evaluate(() => { const c = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'); if (c) c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(1500);
  await p.screenshot({path: path.join(out, 'gate6_' + tag + '.png'), fullPage: false});
  const Fl = await p.evaluate(() => { const card = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'); const b = card && card.querySelector('[data-s1141-filter="gate"]'); if (b) b.click(); return new Promise(r => setTimeout(() => { const svg = card.querySelector('.s1141-svg'); r({filter: SatMap1141.maps.map.filter, pins: svg.querySelectorAll('g.s1141-pin').length, gatePins: [...svg.querySelectorAll('g.s1141-pin[data-id]')].filter(g => /^G\d/.test(g.dataset.id)).length, hiddenOthers: [...card.querySelectorAll('.s1141-list li')].filter(li => li.dataset.kind !== 'gate').every(li => li.hidden)}); }, 400)); });
  check('the Gates filter shows the gates alone', Fl.filter === 'gate' && Fl.gatePins === 12 && Fl.pins === 12 && Fl.hiddenOthers, Fl);
  /* "On the plan": the master drawing on the gate's label */
  const Pl = await p.evaluate(() => new Promise(r => { const b = document.querySelector('#pane-map .s1141-map[data-s1141="map"] [data-gate1156-plan="G6"]'); if (!b) return r({btn: false}); b.click(); setTimeout(() => r({btn: true, sheet: state.sheet, hash: location.hash, sel: JSON.stringify(state.sel || null).slice(0, 160)}), 1500); }));
  check('"On the plan" shows the gate on the master drawing, no page reload', Pl.btn && Pl.sheet === 'MASTER' && realNavs().length === 0, {Pl, navs});
  await p.waitForTimeout(800);
  await p.screenshot({path: path.join(out, 'gate6_plan_' + tag + '.png'), fullPage: false});
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, tag + '_test_v1156.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
