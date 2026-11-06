// Author: Andrew Fisher. v11.88 Map explorer, one map at a time - on the real page, reading the live record, writing nothing.
//   PAGE=build/GC500_v11.88/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1188.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const look = () => p.evaluate(() => {
    const pane = document.getElementById('pane-map'), card = pane.querySelector('.map1188'), exp = pane.querySelector('#expcard'), sat = pane.querySelector('.s1141-map[data-s1141="map"]');
    const shown = el => !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 0;
    const svg = sat && sat.querySelector('.s1141-svg'), list = sat && sat.querySelector('.s1141-list'), tog = sat && sat.querySelector('.map1188-list');
    return {view: Map1188.view, attr: pane.getAttribute('data-map1188'), card: !!card, select: card && card.querySelector('select').value, hint: card && card.querySelector('.map1188-hint').textContent,
      beforeExp: !!card && card.nextElementSibling === exp, afterFind: !!card && !!card.previousElementSibling && card.previousElementSibling.id === 'f1176find',
      planShown: shown(exp), satShown: shown(sat), svgW: svg ? svg.clientWidth : 0, pins: svg ? svg.querySelectorAll('.s1141-pin').length : 0,
      listShown: shown(list), toggle: tog ? tog.textContent : '', items: list ? list.querySelectorAll('li').length : 0,
      overflow: !!card && card.scrollWidth > card.clientWidth + 1, stored: (() => { try { return localStorage.getItem('gc500.map1188'); } catch (e) { return 'x'; } })()};
  });
  try {
    await p.evaluate(() => { try { localStorage.removeItem('gc500.map1188'); } catch (e) {} go('map'); });
    await p.waitForFunction(() => document.querySelector('#pane-map .map1188') && document.querySelector('#pane-map .s1141-map[data-s1141="map"] .map1188-list') && document.querySelector('#map1147-controls .map1188-why'), null, {timeout: 120000});
    await p.waitForTimeout(800);
    let L = await look();
    check(L.card && L.beforeExp && L.afterFind, 'one "Show map" drop-down, after Find it on the map and before the maps');
    check(L.view === 'plan' && L.select === 'plan' && L.attr === 'plan', 'opens on the site plan');
    check(L.planShown && !L.satShown, 'only the site plan shows');
    check(/master plan/.test(L.hint), 'hint says what the site plan holds');
    check(!L.overflow, 'no sideways scrolling in the drop-down card');
    // v11.96 folds the existing phone tools; all 21 v11.88 assertions stay unchanged.
    if (mobile) await p.locator('[data-map1196-tools]').click();
    const note = await p.evaluate(() => { const c = document.getElementById('map1147-controls'), sm = c.querySelector(':scope > small'); return {hidden: getComputedStyle(sm).display === 'none', text: sm.textContent.length}; });
    check(note.hidden && note.text > 40, 'the long note under Highlight area is folded, not deleted');
    await p.locator('#map1147-controls .map1188-why').click();
    check(await p.evaluate(() => getComputedStyle(document.querySelector('#map1147-controls > small')).display !== 'none'), 'one tap shows the note');
    await p.locator('#map1147-controls .map1188-why').click();
    if (dir) { fs.mkdirSync(dir, {recursive: true}); await p.locator('#pane-map .map1188').scrollIntoViewIfNeeded(); await p.screenshot({path: path.join(dir, tag + '-plan.png')}); }

    await p.locator('#pane-map .map1188 select').selectOption('sat');
    await p.waitForTimeout(700);
    L = await look();
    check(L.view === 'sat' && L.attr === 'sat' && L.stored === 'sat', 'the drop-down switches to the satellite map and remembers it');
    check(!L.planShown && L.satShown, 'only the satellite map shows');
    check(L.svgW > 300 && L.pins > 20, 'the satellite map draws at full width with its pins (' + L.svgW + ' px, ' + L.pins + ' pins)');
    check(!L.listShown && /^Show the list \(\d+\)$/.test(L.toggle) && L.items > 50, 'its long list is folded behind "' + L.toggle + '"');
    await p.locator('#pane-map .map1188-list').click();
    L = await look(); check(L.listShown && /^Hide the list/.test(L.toggle), 'one tap shows the list');
    await p.locator('#pane-map .map1188-list').click();
    if (dir) { await p.locator('#pane-map .map1188').scrollIntoViewIfNeeded(); await p.screenshot({path: path.join(dir, tag + '-satellite.png')}); }

    // A redraw of the tab keeps the choice and puts the drop-down back.
    await p.evaluate(() => { renderMap(); });
    await p.waitForTimeout(900);
    L = await look(); check(L.card && L.view === 'sat' && L.satShown && !L.planShown && L.beforeExp, 'a redraw keeps the choice and the drop-down');

    // A plain return to the tab keeps it; a reference asked for from elsewhere opens the site plan.
    await p.evaluate(() => { go('today'); go('map'); }); await p.waitForTimeout(600);
    L = await look(); check(L.view === 'sat', 'coming back to the tab keeps the satellite map');
    await p.evaluate(() => { state.sheet = '__explorer'; state.sel = 'WC41'; go('map'); }); await p.waitForTimeout(700);
    L = await look(); check(L.view === 'plan' && L.planShown && !L.satShown, 'a reference opened from elsewhere shows the site plan');
    check(L.stored === 'sat', 'that does not change what this device keeps');

    // A gate ringed on the satellite opens the satellite map; the plan explorer from anywhere opens the plan.
    const ringed = await p.evaluate(() => { const b = (SatMap1141.boards() || []).find(x => Number.isFinite(x.lat) && Number.isFinite(x.lon)); if (!b) return null; gate1156Zoom(b.lat, b.lon, 'test'); return Map1188.view; });
    await p.waitForTimeout(700);
    check(ringed === 'sat' && (await look()).satShown, 'a spot ringed on the satellite shows the satellite map');
    await p.evaluate(() => { expOpen2d(); }); await p.waitForTimeout(700);
    L = await look(); check(L.view === 'plan' && L.planShown, 'the plan explorer opened from anywhere shows the site plan');

    // Another tab's own satellite map is untouched.
    await p.evaluate(() => { go('vms'); }); await p.waitForTimeout(1500);
    check(await p.evaluate(() => { const v = document.querySelector('#pane-vms .s1141-map[data-s1141="vms"]'); return !v || getComputedStyle(v).display !== 'none'; }), 'the VMS boards tab keeps its own map');
    await p.evaluate(() => { go('map'); });

    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, svgW: L.svgW, items: L.items}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.88 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
