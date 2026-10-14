const {chromium} = require('playwright');
(async () => {
  const D = process.argv[2];
  const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox']});
  const p = await b.newPage({viewport: {width: 794, height: 1123}, deviceScaleFactor: 2});
  await p.route('**/*',r=>r.abort());await p.setContent(require('fs').readFileSync(D+'/sheet.html','utf8')); await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>[...document.images].every(im=>im.complete&&im.naturalWidth));
  const over = await p.evaluate(() => [...document.querySelectorAll('.page')].map(pg => ({sh: pg.scrollHeight, ch: pg.clientHeight})));
  console.log('fit', JSON.stringify(over));
  for(let i=0;i<2;i++)await p.locator('.page').nth(i).screenshot({path:D+'/sheet_p'+(i+1)+'.png'});
  await p.pdf({path: D + '/sheet.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true});
  await b.close();
})();
