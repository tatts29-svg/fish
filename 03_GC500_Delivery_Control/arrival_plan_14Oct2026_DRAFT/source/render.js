const {chromium} = require('playwright');
(async () => {
  const D = process.argv[2];
  const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const p = await b.newPage({viewport: {width: 794, height: 1123}, deviceScaleFactor: 2});
  await p.goto('file://' + D + '/sheet.html'); await p.waitForTimeout(800);
  const over = await p.evaluate(() => { const pg = document.querySelector('.page'); return {sh: pg.scrollHeight, ch: pg.clientHeight, sw: pg.scrollWidth, cw: pg.clientWidth}; });
  console.log('fit', JSON.stringify(over));
  await p.screenshot({path: D + '/sheet.png', fullPage: true});
  await p.pdf({path: D + '/sheet.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true});
  await b.close();
})();
