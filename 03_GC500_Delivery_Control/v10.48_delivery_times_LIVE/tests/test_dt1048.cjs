// v10.48 delivery times on past day cards. GET-only: opens the built page against the live service, no writes.
//   node test_dt1048.cjs path/to/page.html [shot.png]
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2], shot = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
async function day(iso, mob){
 const h = await open(Object.assign({pageFile: page, hash: '#day/' + iso}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {}));
 await h.page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
 await h.page.waitForTimeout(3000); return h;
}
(async () => {
 let h = await day('2026-09-14');
 try {
  const r = await h.page.evaluate(() => { const p = document.querySelectorAll('#pane-timeline details.dt1048'); const d = p[0];
   if (d) d.open = true; return {n: p.length, iso: d && d.dataset.dt1048, sum: d && d.querySelector('summary').innerText, li: d ? d.querySelectorAll('li').length : 0,
    first: d && d.querySelector('li') && d.querySelector('li').innerText, foot: document.getElementById('footL').textContent,
    today: todayIso(), s16: sum1048('2026-10-16'), p16: panel1048('2026-10-16'), p19: panel1048('2026-10-19'), p23: panel1048('2026-09-23'),
    noAgent: !/via (Codex|Claude)|Claude|Codex/.test(d ? d.innerText : '') }; });
  console.log(JSON.stringify({sum: r.sum, first: r.first}));
  ok(r.n === 1, 'one delivery-times fold on 14 Sep');
  ok(r.iso === '2026-09-14', 'fold is for the day shown');
  ok(/^Coates trucks · delivery times\s*8%\s*on time, out of 100%/.test(r.sum) && /1 of 13 inside the booked window/.test(r.sum), 'headline leads with 8% out of 100%; 1 of 13 matches the analysis');
  ok(r.li === 14, 'one line per texted truck (14)');
  ok(/v10\.48$/.test(r.foot), 'footer v10.48');
  ok(r.today === '2026-10-16' ? r.p16 === '' : true, 'today shows no fold (not a day gone by yet)');
  ok(r.s16 && r.s16.inside === 11 && r.s16.booked === 11, '16 Oct data held for tomorrow: 11 of 11');
  ok(r.p19 === '', 'a future day shows nothing');
  ok(/build to date 8% \(1 of 13\)/.test(r.sum), '14 Sep: build to date is the day itself (first texted day)');
  ok(r.s16 && r.s16.toDate && r.s16.toDate.pct === 55 && r.s16.toDate.inside === 52 && r.s16.toDate.booked === 95, '16 Oct: build to date 52 of 95 (55%), as the analysis');
  ok(/no delivered text for these bookings/i.test(r.p23), '23 Sep reads no delivered text, not late');
  ok(r.noAgent, 'no agent name in the fold');
  // every-day view
  await h.page.evaluate(() => { state.tlView = 'agenda'; renderTimeline(); });
  await h.page.waitForTimeout(1500);
  const a = await h.page.evaluate(() => [...document.querySelectorAll('#pane-timeline details.dt1048')].map(d => d.dataset.dt1048));
  ok(a.length === 18 && !a.includes('2026-10-16') && !a.includes('2026-10-19'), 'every-day view: 18 past days carry the fold (' + a.length + ')');
 } finally { await h.browser.close(); }
 h = await day('2026-10-07', true);
 try {
  const m = await h.page.evaluate(() => { const d = document.querySelector('details.dt1048'); d.open = true; d.scrollIntoView();
   return {sum: d.querySelector('summary').innerText, over: document.documentElement.scrollWidth > window.innerWidth + 1}; });
  ok(/100%\s*on time, out of 100%/.test(m.sum) && /11 of 11/.test(m.sum), 'phone: 7 Oct reads 100% on time, 11 of 11');
  ok(!m.over, 'phone: no sideways scroll');
  if (shot) await h.page.screenshot({path: shot});
 } finally { await h.browser.close(); }
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
