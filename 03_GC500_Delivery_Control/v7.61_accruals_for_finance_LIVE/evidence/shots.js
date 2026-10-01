// Pictures of the Accruals for Finance section at its full height (the Costs pane scrolls inside the page, so an element
// screenshot at the normal viewport clips). Read only. CHROMIUM_PATH=/opt/pw-browsers/chromium [MOB=1] node shots.js <build.html>
const {open} = require('../../toolchain/harness/open_page.js'); const path = require('path');
(async () => {
 const MOB = process.env.MOB === '1'; const s = await open(MOB ? {pageFile: process.argv[2], mobile: true, W: 390, H: 844, dpr: 2} : {pageFile: process.argv[2], W: 1440, H: 1000}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live', null, {timeout: 240000}); await p.waitForTimeout(1500);
 await p.evaluate(() => { location.hash = '#costs'; }); await p.waitForTimeout(3500);
 const h = await p.evaluate(() => { const el = document.getElementById('accruals761'); el.scrollIntoView(); return Math.ceil(el.getBoundingClientRect().height); });
 await p.setViewportSize({width: MOB ? 390 : 1440, height: Math.min(9000, h + 300)}); await p.waitForTimeout(800);
 await p.evaluate(() => document.getElementById('accruals761').scrollIntoView({block: 'start'})); await p.waitForTimeout(600);
 const el = await p.$('#accruals761'); await el.screenshot({path: path.join(__dirname, 'shot761_accruals' + (MOB ? '_phone' : '') + '.png')});
 console.log('shot', MOB ? 'phone' : 'desktop', 'section height', h, 'errors', JSON.stringify(s.errors)); await s.browser.close();
})();
