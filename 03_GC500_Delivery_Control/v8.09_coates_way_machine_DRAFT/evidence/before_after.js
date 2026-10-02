// The Coates Way machine — before (live, base/) and after (v8.09, work/) pictures for Andrew's review. Author: Andrew Fisher.
// Read only: machine_rig.js serves each folder from disk and fetches anything else from the live machine by GET.
//
//   cd 03_GC500_Delivery_Control
//   CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) OUT=<dir outside the repo> \
//     node v8.09_coates_way_machine_DRAFT/evidence/before_after.js [base|work|both] [desk|phone|both]
//
// The same views, the same quality setting (High where offered) and the same simulated time in both, so the pictures compare.
const path = require('path'), fs = require('fs');
const {openMachine} = require('./machine_rig');
const OUT = process.env.OUT; if (!OUT) throw new Error('OUT=<dir> is required (keep pictures out of the repo)');
const which = process.argv[2] || 'both', devs = process.argv[3] || 'both';
const ROOTS = (which === 'both' ? ['work', 'base'] : [which]).map(r => [r, path.join(__dirname, '..', r)]);
const DEVS = {desk: {W: 1440, H: 900, dpr: 1, mobile: false}, phone: {W: 390, H: 844, dpr: 2, mobile: true}};
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, {recursive: true});
  for (const dev of devs === 'both' ? ['desk', 'phone'] : [devs]) for (const [tag, root] of ROOTS) {
    const m = await openMachine({root, ...DEVS[dev]}), {page} = m; page.setDefaultTimeout(600000);
    const shot = async name => { await page.screenshot({path: path.join(OUT, `${dev}_${name}_${tag}.png`)}); console.log('shot', dev, name, tag); };
    const settle = async (ms = 9000) => { await page.waitForFunction(() => !window.__cw.tween, null, {timeout: 300000}).catch(() => {}); await wait(ms); };
    await page.waitForFunction(() => window.__cw && !document.querySelector('[data-view=engine]').disabled, null, {timeout: 600000});
    await wait(6000);
    if (dev === 'desk') { /* High, where the machine offers it */
      for (let i = 0; i < 5 && !/High/.test(await page.textContent('#quality')); i++) { await page.evaluate(() => document.getElementById('quality').click()); await wait(1500); }
    }
    /* the hall a minute in: where the crew and the safety officer stand */
    await page.evaluate(() => { window.__cw.setView('car'); window.__cw.advance(60); }); await settle(); await shot('1_car');
    await page.evaluate(() => { window.__cw.setView('engine'); }); await settle(); await shot('2_v8');
    if (dev === 'desk') { await page.evaluate(() => { window.__cw.setView('cog'); }); await settle(12000); await shot('3_cockpit'); }
    /* an info card: the first garage exhibit the machine reports (work), or the same spot on screen (base) */
    await page.evaluate(() => window.__cw.setView('car')); await settle();
    const spot = dev === 'phone' ? [374, 399] : [1250, 520];
    const found = await page.evaluate(([W, H]) => { if (!window.__cw.pickAt) return null; for (let y = H * .25; y < H * .75; y += 23) for (let x = 12; x < W - 12; x += 29) { const k = window.__cw.pickAt(x, y); if (k && k.kind === 'exhibit') return [x, y]; } return null; }, [DEVS[dev].W, DEVS[dev].H]);
    /* the same spot in both: work finds a garage exhibit and records it; base (run after work) taps that spot */
    const spotFile = path.join(OUT, `spot_${dev}.json`);
    if (found) fs.writeFileSync(spotFile, JSON.stringify(found));
    const [x, y] = found || (fs.existsSync(spotFile) ? JSON.parse(fs.readFileSync(spotFile, 'utf8')) : spot);
    for (let i = 0; i < 3; i++) { await page.mouse.click(x, y); await wait(6000); if (await page.evaluate(() => window.__cw.card !== undefined ? !!window.__cw.card : (e => !!e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0)(document.getElementById('exhibit')))) break; }
    await shot('4_card');
    console.log(tag, dev, 'errors', JSON.stringify(m.errors.slice(0, 5)));
    await m.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
