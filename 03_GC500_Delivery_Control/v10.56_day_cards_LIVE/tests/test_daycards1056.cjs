// Author: Andrew Fisher. v10.56 completed day cards. GET-only against the live record.
//   node test_daycards1056.cjs path/to/page.html
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2]; let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop';
  const h = await open(Object.assign({pageFile: page, hash: '#timeline'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {})); const p = h.page;
  try {
   await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
   await p.waitForTimeout(5000);
   // Exercise day-card behaviour explicitly; cold hash routing has its own boot regression.
   await p.evaluate(() => { if (state.tab !== 'timeline') go('timeline'); });
   await p.waitForFunction(() => !!document.querySelector('#pane-timeline .day.past984[data-day]'));
   const r = await p.evaluate(async () => {
    const card = iso => [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')].find(c => c.getAttribute('data-day') === iso);
    const ot = iso => { const c = card(iso); const x = c && c.querySelector('.ot1056'); return x ? x.innerText.replace(/\s+/g, ' ') : null; };
    const work = iso => { const c = card(iso); return c ? Object.fromEntries([...c.querySelectorAll('.dc1057-tile')].map(x => [x.dataset.cat1057, Number(x.querySelector('.dc1057-n').firstChild.textContent)])) : null; };
    const detail = BuildWork986.day('2026-10-07', todayIso());
    const det = {oldArrival: detail.details.some(d => d.kind === 'arrival' || /^Came in: /.test(d.label || '')), categories: detail.rows.filter(d => d.kind === 'cat1057').map(d => d.label)};
    const cards = [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')];
    openAsset('P06'); await new Promise(res => setTimeout(res, 1500));
    const align = (document.querySelector('#drawer .align1055') || {}).innerText || '';
    try { closeDrawer(); } catch (x) {}
    const pageText = document.documentElement.innerHTML;
    return {align, tankOld: pageText.includes('WASTE TANK (under toilet block 1311341)'), tankNew: pageText.includes('WASTE TANK (under toilet block 1327228)') && pageText.includes('WASTE TANK (under toilet block 1327225)'),
     wc20: assetNumbersOf(assetOf('WC20')).join(','), foot: document.getElementById('footL').textContent, n: cards.length, withOt: cards.filter(c => c.querySelector('.ot1056')).length, sep14: ot('2026-09-14'), oct7: ot('2026-10-07'), oct16: ot('2026-10-16'), work7: work('2026-10-07'), det7: det, over: document.documentElement.scrollWidth > window.innerWidth + 1, today: !!document.querySelector('#pane-timeline .day.today .ot1056')};
   });
   const version = /v(\d+)\.(\d+)(?:\.\d+)?$/.exec(r.foot);
   ok(version && (Number(version[1]) > 10 || Number(version[1]) === 10 && Number(version[2]) >= 56), tag + ': footer v10.56 or later');
   ok(r.withOt >= 15, tag + ': completed day cards carry Coates on time (' + r.withOt + ' of ' + r.n + ')');
   ok(/COATES ON TIME/.test(r.sep14 || '') && /4 OF 13/.test(r.sep14) && /31 ?%/.test(r.sep14), tag + ': 14 Sep 31%, 4 of 13 (site notes retained by v10.58/59): ' + r.sep14);
   ok(/11 OF 11/.test(r.oct7 || '') && /100 ?%/.test(r.oct7), tag + ': 7 Oct 100%, 11 of 11: ' + r.oct7);
   ok(!r.today, tag + ': today\'s card has no on-time row (days that have passed only)');
   ok(r.work7 && r.work7.buildings === 6 && r.work7.toilets === 3 && r.work7.generators === 1, tag + ': 7 Oct category totals retained from v10.58: ' + JSON.stringify(r.work7));
   ok(!r.det7.oldArrival && r.det7.categories.length >= 3, tag + ': category rows replace duplicate arrival rows as v10.58 requires');
   ok(/\$1,426\.07/.test(r.align) && !/\$\d{4,}\./.test(r.align), tag + ': Site vs Baseplan money has its comma: ' + (r.align.match(/\$[\d,]+\.\d{2}/g) || []).join(' '));
   ok(!r.tankOld && r.tankNew, tag + ': WC20 map tanks sit under 1327228 and 1327225');
   ok(r.wc20 === '1327228,1327225,1311341,1328982', tag + ': WC20 carries 1327228, 1327225 (blocks) and 1311341, 1328982 (tanks): ' + r.wc20);
   ok(!r.over, tag + ': no sideways scroll');
   ok(h.errors.length === 0, tag + ': no page errors ' + h.errors.slice(0, 3).join(' | '));
  } finally { await h.browser.close(); }
 }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
