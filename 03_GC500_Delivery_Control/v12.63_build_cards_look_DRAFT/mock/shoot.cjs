const {chromium} = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
  const page = await ctx.newPage();
  await page.goto('file:///home/user/fish/03_GC500_Delivery_Control/v12.63_build_cards_look_DRAFT/mock/build_cards_mock.html', {waitUntil: 'load'});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(2200);
  const out = '/tmp/gc500-scratch/mock1263/';
  await page.screenshot({path: out + 'phone-all.png', fullPage: true});
  const cards = await page.$$('article.card');
  for (let i = 0; i < cards.length; i++) { await cards[i].screenshot({path: out + 'card' + (i + 1) + '.png'}); }
  const scenes = await page.$('.scenes'); if (scenes) await scenes.screenshot({path: out + 'scenes.png'});
  console.log('cards', cards.length, fs.readdirSync(out).filter(f => f.endsWith('.png')));
  await browser.close();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
