// Author: Andrew Fisher. v8.87 Map explorer checks inside the dashboard, read-only against the live record.
//   PAGE=<dashboard build> LOCAL=<prepared explorer folder> [MOB=1] [OUT=<folder>] node tests/test_explorer887.cjs
// LOCAL serves the seven prepared explorer files from the folder; every other explorer asset is the live registered one.
const L = require('./lib887.cjs');
(async () => { const MOB = L.MOB, R = []; const ok = (name, pass, detail) => R.push({name, pass: !!pass, detail});
  const s = await L.openMap(); const p = s.page, f = s.f; const shot = async name => { try { await p.screenshot({path: (process.env.OUT || '.') + '/explorer887_' + name + '_' + (MOB ? 'phone' : 'laptop') + '.png'}); } catch (e) {} };
  await f.waitForFunction(() => window.GC500Explorer887 && window.GC500FencingMap && typeof GC500FencingMap.hits === 'function', null, {timeout: 30000});
  ok('the prepared explorer is the one running (close bar, hits(), setHostShown, local files served)', await f.evaluate(() => GC500Explorer887.state.closeBar && typeof GC500Explorer.setHostShown === 'function') && (s.counts.local || 0) >= 7, {local: s.counts.local});
  // ---- 1. a building tapped with no chip on says what has been done, in the Timeline's words
  const unit = await L.pickUnit(s); ok('a placed unit with a recorded delivery exists to tap', !!unit, unit);
  await f.evaluate(() => { GC500Explorer864.clear(); const c = document.getElementById('xcard'); if (c) c.hidden = true; });
  await f.evaluate(code => GC500Explorer.find(code), unit.key); await p.waitForTimeout(1200);   /* glide there */
  await f.evaluate(() => { GC500Explorer864.clear(); const c = document.getElementById('xcard'); if (c) c.hidden = true; });
  const chipOn0 = await f.evaluate(() => !!document.querySelector('#chips .chip[aria-pressed="true"]'));
  let at = await L.unitScreen(s, unit.key);
  await p.mouse.click(at.x, at.y); await p.waitForTimeout(600);
  const card = await f.evaluate(() => { const c = document.getElementById('xcard'); if (!c || c.hidden) return null; return {shown: true, st: (c.querySelector('.xc-st') || {}).textContent || '', lamps: [...c.querySelectorAll('.xc-lamps span')].map(x => (x.classList.contains('on') ? '*' : '') + x.textContent), why: (c.querySelector('.xc-why') || {}).textContent || '', lines: [...c.querySelectorAll('.xc-lines li')].map(x => (x.querySelector('b') || {}).textContent + (x.classList.contains('done') ? ' (done)' : '') + (/\d\d:\d\d/.test(x.textContent) ? ' · when recorded' : '')), left: (c.querySelector('.xc-left') || {}).textContent || '', due: [...c.querySelectorAll('.xc-s')].map(x => x.textContent).find(t => /^Due /.test(t)) || '', prog: !!c.querySelector('[data-xprog]'), open: !!c.querySelector('[data-xopen]'), code: (c.querySelector('.xc-t b') || {}).textContent}; });
  ok('tap on ' + unit.key + ' with no chip on shows its card', !chipOn0 && !!card && card.code === unit.key, {chipOn0, card: card && {code: card.code, st: card.st}});
  ok('the card\'s stage is the Timeline\'s own (timeline841State label)', !!card && card.st.trim() === unit.label, {card: card && card.st, timeline: unit.label});
  ok('the card shows the five lamps with the reached ones lit, the why, who/when lines, due and what is left', !!card && card.lamps.length === 5 && card.lamps.filter(x => x[0] === '*').length === unit.stage && card.why.trim() === unit.why.trim() && card.lines.length >= 2 && !!card.left && card.prog && card.open, card && {lamps: card.lamps, lines: card.lines, left: card.left, due: card.due});
  await shot('card');
  // the on-hire case: the card must not say "On site" where the Timeline says the delivery is unconfirmed
  const hire = await L.pickUnit(s, 'hire');
  if (hire) { const info = await p.evaluate(k => gc500PlanCard(k), hire.key); ok('on hire, delivery unconfirmed reads as the Timeline does, never "On site" (' + hire.key + ')', info && info.status === 'On hire · delivery unconfirmed' && info.stage.label === hire.label && !/^On site$/.test(info.status), info && {status: info.status, label: info.stage && info.stage.label, lines: (info.lines || []).map(l => l.k)}); }
  else ok('on hire, delivery unconfirmed reads as the Timeline does (no such unit on the record today)', true, {});
  // every placed unit: what the card says is what the Timeline says, unit by unit (on-hire unconfirmed included where it exists)
  const all = await p.evaluate(() => { const out = {n: 0, same: 0, hire: 0, diff: []}; for (const a of allAssets()) { if (a._cancelled || !(typeof MASTER_LOC !== 'undefined' && MASTER_LOC[a.key] && MASTER_LOC[a.key].pt)) continue; const v = timeline841State(a), c = gc500PlanCard(a.key); out.n++; if (c && c.hire) out.hire++; if (c && c.status === v.label && c.stage && c.stage.n === v.stage && c.stage.label === v.label) out.same++; else if (out.diff.length < 5) out.diff.push(a.key + ': ' + (c && c.status) + ' vs ' + v.label); } return out; });
  ok('every placed unit\'s card reads as its Timeline stage (' + all.same + ' of ' + all.n + (all.hire ? ', ' + all.hire + ' on hire unconfirmed' : '') + ')', all.n > 0 && all.same === all.n, all.diff);
  // ---- 2. the card stays through a pan and a wheel zoom; a tap on the map closes it
  const empty = await L.emptySpot(s);
  await L.drag(p, {x: empty.x, y: empty.y}, {x: empty.x - 140, y: empty.y + 60}); await p.waitForTimeout(500);
  const afterPan = await f.evaluate(() => { const c = document.getElementById('xcard'); return !!c && !c.hidden; });
  await p.mouse.move(empty.x, empty.y); await p.mouse.wheel(0, -120); await p.waitForTimeout(600);
  const afterWheel = await f.evaluate(() => { const c = document.getElementById('xcard'); return !!c && !c.hidden; });
  const empty2 = await L.emptySpot(s); await p.mouse.click(empty2.x, empty2.y); await p.waitForTimeout(500);
  const afterTap = await f.evaluate(() => { const c = document.getElementById('xcard'); return !!c && !c.hidden; });
  ok('the card stays through a pan and a zoom, and a tap on the map closes it', afterPan && afterWheel && !afterTap, {afterPan, afterWheel, afterTap});
  // ---- 3. Fencing: the × on the map, Escape from the host page, a tap on the map closing the details, one press in the frame
  await f.evaluate(() => document.querySelector('#chips .chip') && document.querySelector('#chips .chip').click()); await p.waitForTimeout(400);
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  await f.click('#fenceMode'); await f.waitForFunction(() => document.body.classList.contains('fencing-map'), null, {timeout: 10000}); await p.waitForTimeout(2500);
  const chipAfter = await f.evaluate(() => !!document.querySelector('#chips .chip[aria-pressed="true"]'));
  ok('entering Fencing leaves no category chip pressed', !chipAfter, {chipAfter});
  const barVis = await f.evaluate(() => { const b = document.getElementById('x887FenceBar'), x = document.getElementById('x887FenceClose'); return !!b && !!x && getComputedStyle(b).display !== 'none' && !!x.offsetParent && x.getBoundingClientRect().width >= 36; });
  const drawerOnPhone = await f.evaluate(() => document.body.classList.contains('nav'));
  ok('Fencing shows a close bar with × Close on the map' + (MOB ? ', and the drawer stays closed on a phone' : ''), barVis && (!MOB || !drawerOnPhone), {barVis, drawerOnPhone});
  await shot('fencing_open');
  await f.click('#x887FenceClose'); await p.waitForTimeout(500);
  ok('× Close leaves Fencing', !(await f.evaluate(() => document.body.classList.contains('fencing-map'))), {});
  // Escape with the focus in the host page
  await f.click('#fenceMode'); await f.waitForFunction(() => document.body.classList.contains('fencing-map'), null, {timeout: 10000}); await p.waitForTimeout(1500);
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  await L.focusHost(p); const hostFocus = await p.evaluate(() => document.activeElement && document.activeElement.id === 't887focus');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  ok('Escape with the focus in the dashboard closes Fencing', hostFocus && !(await f.evaluate(() => document.body.classList.contains('fencing-map'))), {hostFocus});
  // a pick, then a tap on the map closes the details; Escape in the frame then closes Fencing in one press
  await f.click('#fenceMode'); await f.waitForFunction(() => document.body.classList.contains('fencing-map'), null, {timeout: 10000}); await p.waitForTimeout(2500);
  const picked = await f.evaluate(async () => { const sel = document.getElementById('fmSource'); const opt = [...sel.options].find(o => o.value !== 'all'); if (!opt) return {none: true}; sel.value = opt.value; sel.onchange(); await new Promise(r => setTimeout(r, 300)); const b = document.querySelector('#fmList [data-fmrow]'); if (!b) return {norows: true}; b.click(); await new Promise(r => setTimeout(r, 300)); return {selected: GC500FencingMap.selected}; });
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  await p.waitForTimeout(800);
  const spot = await L.emptySpot(s); await p.mouse.click(spot.x, spot.y); await p.waitForTimeout(600);
  const afterMapTap = await f.evaluate(() => ({selected: GC500FencingMap.selected, on: document.body.classList.contains('fencing-map'), details: !document.getElementById('fmDetails').hidden}));
  ok('a tap on the map (not on a line) closes the fencing details and keeps Fencing open', !!picked.selected && afterMapTap.selected == null && afterMapTap.on && !afterMapTap.details, {picked, afterMapTap});
  await f.evaluate(async () => { const b = document.querySelector('#fmList [data-fmrow]'); if (b) { b.click(); await new Promise(r => setTimeout(r, 200)); } });
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  await f.focus('#stage'); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  const e1 = await f.evaluate(() => ({on: document.body.classList.contains('fencing-map'), selected: GC500FencingMap.selected}));
  ok('Escape in the frame with a fence pick closes Fencing in one press, and the pick goes with it', !e1.on && e1.selected == null, e1);
  // ---- 4. the stuck pointer: tap a fence line, then move the mouse with no button down; the map must not follow
  await f.click('#fenceMode'); await f.waitForFunction(() => document.body.classList.contains('fencing-map'), null, {timeout: 10000}); await p.waitForTimeout(2500);
  if (MOB) await f.evaluate(() => typeof panel813 === 'function' && panel813(false));
  let hit = await L.fenceHit(s);
  if (!hit) { await f.evaluate(() => GC500Explorer.fit()); await p.waitForTimeout(1200); hit = await L.fenceHit(s); }
  ok('a fence line is on the screen to tap', !!hit, hit);
  if (hit) {
    await p.mouse.click(hit.x, hit.y); await p.waitForTimeout(700);
    const sel = await f.evaluate(() => GC500FencingMap.selected);
    const cam0 = await L.cameraOf(s);
    await p.mouse.move(hit.x + 60, hit.y + 40); await p.waitForTimeout(100); await p.mouse.move(hit.x + 120, hit.y + 90); await p.waitForTimeout(400);
    const cam1 = await L.cameraOf(s);
    ok('tapping a fence line selects it (' + (sel || 'nothing') + ')', sel != null, {sel});
    ok('after the tap the map does not follow the mouse (no stuck pointer)', cam0.cx === cam1.cx && cam0.cy === cam1.cy && cam1.pointers === 0 && !cam1.gesture, {cam0, cam1});
    if (MOB) { const pc = await f.evaluate(() => { const c = document.getElementById('fmCard887'); return !!c && !c.hidden && !!c.querySelector('[data-fmcardx]') && !document.body.classList.contains('nav'); }); ok('phone: the tapped line gets its card at the foot of the map, not the drawer', pc, {pc}); await shot('fencing_phone_card'); }
    // the drag that follows pans as a drag should (one pointer, no phantom pinch)
    const camA = await L.cameraOf(s); const sp = await L.emptySpot(s); await L.drag(p, {x: sp.x, y: sp.y}, {x: sp.x - 120, y: sp.y + 40}); await p.waitForTimeout(400); const camB = await L.cameraOf(s);
    ok('the next drag pans normally', (camA.cx !== camB.cx || camA.cy !== camB.cy) && camB.pointers === 0 && !camB.pinch, {camA, camB});
  }
  await f.click('#x887FenceClose'); await p.waitForTimeout(400);
  // ---- 5. nothing polls or draws while the map is hidden (another tab shown)
  await p.evaluate(() => { window.__c887 = {done: 0, snap: 0}; const d0 = window.gc500DoneKeys, s0 = window.gc500FencingMapSnapshot; window.gc500DoneKeys = function () { __c887.done++; return d0.apply(this, arguments); }; window.gc500FencingMapSnapshot = function () { __c887.snap++; return s0.apply(this, arguments); }; });
  await p.evaluate(() => go('today')); await p.waitForTimeout(1500);   /* a frame already queued may land as the pane hides; after that, none */
  const frames0 = await f.evaluate(() => __frames.length); await p.waitForTimeout(10000);
  const hidden = await p.evaluate(() => ({calls: window.__c887, parked: !!document.querySelector('#expPark iframe'), moveBefore: typeof document.body.moveBefore === 'function'}));
  const frames1 = await f.evaluate(() => __frames.length).catch(() => -1);
  ok('10 s on another tab: no Done poll, no fencing snapshot, no frames drawn', hidden.calls.done === 0 && hidden.calls.snap === 0 && (frames1 === -1 || frames1 === frames0), {hidden, frames0, frames1});
  await p.evaluate(() => go('map')); await p.waitForTimeout(2500);
  const back = await f.evaluate(() => ({shown: GC500Explorer.shown(), frames: __frames.length, ready: GC500Explorer.state.ready})).catch(e => ({error: String(e)}));
  ok('back on Map the explorer draws again and the Done poll resumes', back.shown && back.frames > 0 && (await p.evaluate(() => __c887.done)) >= 1, back);
  ok('the frame log is capped (600, not 30,000)', (await f.evaluate(() => __frames.length)) <= 600, {});
  ok('no page errors (dashboard or explorer)', s.errors.length === 0, s.errors.slice(0, 4));
  ok('no writes attempted', s.counts.blocked === 0, s.counts);
  for (const r of R) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + ' ' + JSON.stringify(r.detail));
  const fails = R.filter(r => !r.pass).length; console.log(`${MOB ? 'phone' : 'laptop'}: ${R.length - fails}/${R.length} pass`); await s.browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
