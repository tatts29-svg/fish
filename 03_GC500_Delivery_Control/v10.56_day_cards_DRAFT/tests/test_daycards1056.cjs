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
   const r = await p.evaluate(() => {
    const card = iso => [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')].find(c => c.getAttribute('data-day') === iso);
    const ot = iso => { const c = card(iso); const x = c && c.querySelector('.ot1056'); return x ? x.innerText.replace(/\s+/g, ' ') : null; };
    const work = iso => { const c = card(iso); return c ? [...c.querySelectorAll('.bc986-work-row')].map(x => x.innerText.replace(/\s+/g, ' ')) : null; };
    const det = BuildWork986.day('2026-10-07', todayIso()).details.filter(d => d.kind === 'arrival').map(d => d.label);
    const cards = [...document.querySelectorAll('#pane-timeline .day.past984[data-day]')];
    return {foot: document.getElementById('footL').textContent, n: cards.length, withOt: cards.filter(c => c.querySelector('.ot1056')).length, sep14: ot('2026-09-14'), oct7: ot('2026-10-07'), oct16: ot('2026-10-16'), work7: work('2026-10-07'), det7: det, over: document.documentElement.scrollWidth > window.innerWidth + 1, today: !!document.querySelector('#pane-timeline .day.today .ot1056')};
   });
   ok(/v10\.5[6-9]$/.test(r.foot), tag + ': footer v10.56');
   ok(r.withOt >= 15, tag + ': completed day cards carry Coates on time (' + r.withOt + ' of ' + r.n + ')');
   ok(/COATES ON TIME/.test(r.sep14 || '') && /1 OF 13/.test(r.sep14) && /8 ?%/.test(r.sep14), tag + ': 14 Sep 8%, 1 of 13 (as v10.48): ' + r.sep14);
   ok(/11 OF 11/.test(r.oct7 || '') && /100 ?%/.test(r.oct7), tag + ': 7 Oct 100%, 11 of 11: ' + r.oct7);
   ok(!r.today, tag + ': today\'s card has no on-time row (days that have passed only)');
   ok(r.work7 && /^P55 · Gate 1 Ticket Box 1 × Ticket Box 6m$/.test(r.work7[0]) && r.work7.length === 3, tag + ': 7 Oct work recorded lists what came in: ' + JSON.stringify(r.work7));
   ok(r.det7.length >= 6 && r.det7.every(x => /^Came in: /.test(x)) && r.det7.some(x => /× /.test(x)), tag + ': More info lists every arrival with quantity (' + r.det7.length + ')');
   ok(!r.over, tag + ': no sideways scroll');
   ok(h.errors.length === 0, tag + ': no page errors ' + h.errors.slice(0, 3).join(' | '));
  } finally { await h.browser.close(); }
 }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
