// v7.96 - whole-page pictures of Equipment (desktop 1,440 px and phone 390 px). Read only.
const path = require('path');
const {open} = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
(async () => { const MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900}), p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await new Promise(r => setTimeout(r, 4000));
  await p.evaluate(() => go('plant')); await new Promise(r => setTimeout(r, 4000));
  await p.evaluate(() => { const st = document.createElement('style'); st.textContent = '*{animation-duration:0s!important;transition:none!important}'; document.head.appendChild(st);
    let e = document.getElementById('pane-plant'); while (e && e !== document.body) { const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) || cs.height !== 'auto') { e.style.overflow = 'visible'; e.style.height = 'auto'; e.style.maxHeight = 'none'; } e = e.parentElement; } document.documentElement.style.overflow = 'visible'; });
  await new Promise(r => setTimeout(r, 3000));
  await p.screenshot({path: path.join(process.env.OUTD, 'equipment_' + (MOB ? 'phone' : 'desktop') + '.png'), fullPage: true});
  await s.browser.close(); })();
