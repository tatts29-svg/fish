// Author: Andrew Fisher. Isolated inherited suite; original source remains unchanged.
__dirname = "/workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/v8.14_today_trimmed_DRAFT/evidence";
require = require("node:module").createRequire("/workspace/gc500-showcase-full-lap/03_GC500_Delivery_Control/v8.14_today_trimmed_DRAFT/evidence/v814_tests.js");
// v8.14 - Today, trimmed: checks. Author: Andrew Fisher. Read only: open_page.js serves the build at the live address
// and aborts every write.
//   cd 03_GC500_Delivery_Control && CHROMIUM_PATH=/opt/pw-browsers/chromium node v8.14_today_trimmed_DRAFT/evidence/v814_tests.js
const path = require('path');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE;
const BASE = process.env.BASE;
const GONE = [/^Map$/, /^Documents$/, /^Also on the schedule/, /^Roads between/, /^Fencing$/, /^Your records$/, /^Next programme day$/];
const STAY = [/^Deliveries due by today met$/, /^Delivery updates today$/, /^Who to call$/, /^Costs & charges$/, /^Breakdowns$/];
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0; const ok = (c, what, d = '') => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d ? '  - ' + String(d).slice(0, 300) : '')); };
async function titles(file, dev) {
  const s = await open({pageFile: file, hash: '#today', ...dev}); const {page} = s;
  await page.waitForFunction(() => document.querySelector('#pane-today .hubcard'), null, {timeout: 180000}); await wait(2500);
  const r = await page.evaluate(() => ({
    titles: [...document.querySelectorAll('#pane-today .hubcard h3')].filter(h => h.offsetParent !== null).map(h => h.textContent.trim()),
    all: [...document.querySelectorAll('#pane-today .hubcard h3')].map(h => h.textContent.trim()),
    exportText: (document.getElementById('exportBtn') || {}).textContent,
    overflow: document.documentElement.scrollWidth > innerWidth + 1}));
  r.errors = s.errors.slice(); await s.browser.close(); return r;
}
(async () => {
  for (const [name, dev] of [['desktop', {W: 1440, H: 900}], ['phone', {W: 390, H: 844, dpr: 2, mobile: true}]]) {
    console.log(`\n== ${name}`);
    const b = await titles(BASE, dev), w = await titles(BUILD, dev);
    console.log('live :', b.all.join(' | ')); console.log('v8.14:', w.all.join(' | '));
    for (const re of GONE) ok(!w.all.some(t => re.test(t)), `${name}: off Today: ${re.source}`, w.all.filter(t => re.test(t)).join(', '));
    ok(GONE.filter(re => b.all.some(t => re.test(t))).length >= 4, `${name}: the live page had the cards being removed (the check is real)`, b.all.join(' | '));
    for (const re of STAY) ok(w.all.some(t => re.test(t)) === b.all.some(t => re.test(t)), `${name}: unchanged: ${re.source}`);
    ok(w.all.length < b.all.length, `${name}: fewer cards (${b.all.length} -> ${w.all.length})`);
    ok(/^Export/.test(w.exportText || ''), `${name}: Tools > Export still there`, w.exportText);
    ok(!w.overflow, `${name}: no sideways scroll`);
    ok(!w.errors.length, `${name}: no page errors`, w.errors.join(' | '));
  }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
