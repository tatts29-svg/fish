const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1366, height: 768}})).newPage();
  await page.goto(process.argv[2], {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3500);
  const r = await page.evaluate(() => { const box = document.querySelector('#hzmap'), img = document.querySelector('#hzmapImg'); const b = box.getBoundingClientRect(), i = img.getBoundingClientRect(), cs = getComputedStyle(img);
    return {box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], client: [box.clientWidth, box.clientHeight], img: [Math.round(i.left), Math.round(i.top), Math.round(i.width), Math.round(i.height)], nat: [img.naturalWidth, img.naturalHeight], fit: cs.objectFit, pos: cs.objectPosition, imgPosition: cs.position, brandrow: (() => { const e = document.querySelector('.brandrow').getBoundingClientRect(); return [Math.round(e.width), Math.round(e.height)]; })(), header: document.querySelector('header.top').clientWidth}; });
  console.log(JSON.stringify(r)); await browser.close(); })();
