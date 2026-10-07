// Author: Andrew Fisher. Before-and-after pictures of the Map explorer at the places the 2 Oct issue changes, inside the
// dashboard, read-only. Run once with the live explorer files (CODE/ASSETS = live) and once with the v8.90 candidate.
//   PAGE=<dashboard build> CODE=<explorer code folder> ASSETS=<assets folder> OUT=<dir> TAG=<before|after> [MOB=1] node tests/shots890.cjs
const {openMap} = require('./xembed890'); const fs = require('fs'), path = require('path');
const OUT = process.env.OUT || '.', TAG = process.env.TAG || 'shot'; fs.mkdirSync(OUT, {recursive: true});
const SPOTS = {   // sheet rectangles (17 Sep frame): each changed reference with room around it, and two unchanged places
  P45_old_place: [1250, 280, 1410, 380], P45_new_place: [1130, 280, 1290, 380], WC51: [1880, 210, 2040, 310], WC38_WC39: [420, 1090, 580, 1190],
  WC10: [560, 610, 720, 710], WC32_WC40a: [340, 1050, 500, 1150], WC69: [60, 1020, 220, 1120], inset_WC81_CP1: [2090, 1190, 2250, 1290],
  unchanged_pit_lane: [820, 560, 980, 660], unchanged_beachfront: [1430, 290, 1590, 390], title_block: [1880, 1480, 2360, 1680]};
(async () => {
  const s = await openMap({settle: 4000}); const {page: p, f} = s;
  for (const mode of ['original', 'hybrid']) {
    await f.evaluate(m => GC500Explorer.setMode(m), mode); await p.waitForTimeout(2500);
    for (const [name, r] of Object.entries(SPOTS)) {
      await f.evaluate(r => GC500Explorer.goto(r, 'spot'), r); await p.waitForTimeout(s.MOB ? 5500 : 4500);
      await p.screenshot({path: path.join(OUT, `${TAG}_${mode}_${name}${s.MOB ? '_phone' : ''}.png`)});
    }
  }
  console.log(TAG, 'done; local files', s.counts.local, 'live explorer requests', s.counts.liveExplorer, 'errors', s.errors.length, 'blocked', s.counts.blocked);
  await s.browser.close(); process.exit(s.errors.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e.stack); process.exit(2); });
