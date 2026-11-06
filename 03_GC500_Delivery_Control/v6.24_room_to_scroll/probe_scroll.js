const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  for (const [name, vp, mobile] of [['phone-portrait', {width: 390, height: 844}, true], ['phone-landscape', {width: 844, height: 390}, true], ['fold-inner', {width: 904, height: 1000}, true], ['fold-landscape', {width: 1000, height: 904}, true], ['tablet-landscape', {width: 1180, height: 820}, true], ['laptop', {width: 1366, height: 768}, false]]) {
    const page = await (await browser.newContext({viewport: vp, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile})).newPage();
    await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3500);
    const before = await page.evaluate(() => { const m = document.querySelector('main'); return {header: Math.round(document.querySelector('header.top').getBoundingClientRect().height), mainH: m.clientHeight, mainSH: m.scrollHeight, bodySH: document.body.scrollHeight, winH: innerHeight, mainTop: m.scrollTop, cars: document.querySelectorAll('.hzcar, .hzcarimg').length, carW: Math.round(document.querySelector('.hzcar').getBoundingClientRect().width)}; });
    await page.mouse.move(vp.width / 2, Math.min(vp.height - 20, before.header + 60)); await page.mouse.wheel(0, 600); await page.waitForTimeout(400);
    const after = await page.evaluate(() => ({mainTop: document.querySelector('main').scrollTop, winY: scrollY}));
    console.log(name, JSON.stringify({...before, scrolledMain: after.mainTop, scrolledWin: after.winY}));
    await page.screenshot({path: `tabs610/scroll_${name}.png`}); await page.context().close(); }
  await browser.close(); })();
