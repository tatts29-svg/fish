// Author: Andrew Fisher. v10.51 drawer tidy, GET-only against the live record.
//   node test_tidy1051.cjs path/to/page.html [shotdir]
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2], shots = process.argv[3]; let pass = 0, fail = 0;
const ok = (c, m, x) => { if (c) { pass++; console.log('ok  ', m, x === undefined ? '' : x); } else { fail++; console.log('FAIL', m, x === undefined ? '' : x); } };
async function drawer(s, ref){ await s.page.evaluate(r => openAsset(r), ref); await s.page.waitForTimeout(2500); }
(async () => {
  for (const mobile of [false, true]) {
    const s = await open(mobile ? {pageFile: page, mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: page});
    const tag = mobile ? 'phone' : 'desktop';
    await s.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
    await s.page.waitForTimeout(3000);
    const units = await s.page.evaluate(() => ({p09: dropPhotoUnits(assetOf('P09')).map(u => Items933.friendly('P09', u)), wc09: dropPhotoUnits(assetOf('WC09')).length, wc09items: dropPhotoUnits(assetOf('WC09')).map(u => Items933.friendly('WC09', u)).filter(x => /FWF|Toilet/.test(x)).length}));
    ok(units.p09.length === 1 && /Building 6m/.test(units.p09[0]), tag + ': P09 photo places are the building only', JSON.stringify(units.p09));
    ok(!units.p09.some(x => /Urn|Fridge|Aircon/i.test(x)), tag + ': no urn, fridge or aircon places on P09');
    ok(units.wc09 >= 10 && units.wc09items >= 10, tag + ': WC09 keeps its FWF and toilet block units', units.wc09);
    const accTotal = await s.page.evaluate(() => { let n = 0; for (const a of allAssets()) { const rows = (gcModel925(a) || {}).rows || []; for (const u of dropPhotoUnits(a)) { const r = rows.find(x => x.id === u); if (r && tidy1051.accessoryRow(a, r)) n++; } } return n; });
    ok(accTotal === 0, tag + ': no accessory photo places anywhere on the page', accTotal);
    await drawer(s, 'P09');
    const d = await s.page.evaluate(() => { const box = document.querySelector('#drawer .cmp816 .hublights'); const rows = [...box.querySelectorAll('button.hl')].map(b => b.innerText.replace(/\s+/g, ' ').trim()); const ph = document.querySelector('#drawer .dphform'); return {rows, photoBlocks: ph ? [...ph.querySelectorAll('.dphunit summary')].map(x => x.innerText.replace(/\s+/g, ' ')) : null, accText: document.querySelector('#drawer').innerText.match(/Urn · 1284061|Fridge · 1328958|Aircon · 1270403/g)}; });
    const words = d.rows.map(r => r.toLowerCase().replace(/[^a-z ]/g, ' ').trim().split(/\s+/).filter(w => !/^(of|ticked|at|the|card|sep|oct)$/.test(w))[0]);
    ok(!d.rows.some(r => /^✓?\s*levelled/i.test(r.replace(/^[^A-Za-z]*/, ''))), tag + ': no separate LEVELLED row', JSON.stringify(d.rows));
    ok(d.rows.filter(r => /\bsteps\b/i.test(r)).length === 1, tag + ': STEPS shows once');
    ok(d.rows.some(r => /level/i.test(r) && /16 Sep/i.test(r) && /\$52\.05/.test(r)) && !d.rows.some(r => /1 of 1 ticked/i.test(r)), tag + ': LEVEL row carries the date and the charge, no "1 of 1 ticked"');
    ok(d.rows.some(r => /steps/i.test(r) && /18 Sep/i.test(r) && /\$156\.15/.test(r)), tag + ': STEPS row carries the date and the charge');
    ok(d.rows.some(r => /complete/i.test(r)) && d.rows.some(r => /on site/i.test(r)), tag + ': on site and complete still there');
    ok(!d.photoBlocks || d.photoBlocks.every(x => !/Urn|Fridge|Aircon/i.test(x)), tag + ': drawer photo section has no accessory blocks', JSON.stringify(d.photoBlocks));
    if (shots) await s.page.screenshot({path: shots + '/p09_' + tag + '.png', fullPage: false});
    if (shots && mobile) { await s.page.evaluate(() => { const c = document.querySelector('#drawer .cmp816'); if (c) c.scrollIntoView(); }); await s.page.waitForTimeout(500); await s.page.screenshot({path: shots + '/p09_ticks_phone.png'}); await s.page.evaluate(() => { const c = document.querySelector('#drawer .dphform') || document.querySelector('#drawer .ph816'); if (c) c.scrollIntoView(); }); await s.page.waitForTimeout(500); await s.page.screenshot({path: shots + '/p09_photos_phone.png'}); }
    ok(s.errors.length === 0, tag + ': no page errors', JSON.stringify(s.errors.slice(0, 3)));
    ok(s.counts.blocked === 0, tag + ': no writes attempted', s.counts.blocked);
    await s.browser.close();
  }
  console.log(pass + '/' + (pass + fail) + ' passed'); process.exit(fail ? 1 : 0);
})();
