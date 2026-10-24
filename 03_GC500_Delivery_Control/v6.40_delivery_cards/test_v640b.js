// v6.40 interactions on the edit link: set a light from the card, tick complete, type a note, move to next day - the record changes and the card re-draws
const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 1400, height: 1000}})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(process.argv[2] + '#day/2026-09-28', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3500);
  await page.evaluate(() => { try { localStorage.setItem('gc500.who', 'Test Person'); } catch (e) {} const w = document.querySelector('#who'); if (w) { w.value = 'Test Person'; w.dispatchEvent(new Event('change', {bubbles: true})); } });
  const key = await page.evaluate(() => document.querySelector('#pane-timeline .dcard').dataset.dckey);
  // 1. the amber lamp
  await page.evaluate(k => document.querySelector(`.dcard[data-dckey="${k}"] [data-light][data-s="in transit"]`).click(), key); await page.waitForTimeout(800);
  const s1 = await page.evaluate(k => { const c = document.querySelector(`.dcard[data-dckey="${k}"]`); return {state: deliveryOf(k).state, word: c.querySelector('.ds-w b').textContent, upd: (c.querySelector('.dcupd') || {}).textContent, hist: c.querySelectorAll('.dchl li').length, pct: c.querySelector('.dcpct').textContent}; }, key);
  console.log('after amber', JSON.stringify(s1));
  // 2. tick complete
  await page.evaluate(k => document.querySelector(`.dcard[data-dckey="${k}"] [data-done]`).click(), key); await page.waitForTimeout(800);
  const s2 = await page.evaluate(k => { const c = document.querySelector(`.dcard[data-dckey="${k}"]`); return {done: deliveryOf(k).done, state: deliveryOf(k).state, pct: c.querySelector('.dcpct').textContent, checks: [...c.querySelectorAll('.dcchecks li')].map(l => l.textContent + ':' + l.classList.contains('on')), hist: [...c.querySelectorAll('.dchl li b')].map(b => b.textContent)}; }, key);
  console.log('after tick', JSON.stringify(s2));
  // 3. the note
  await page.fill(`.dcard[data-dckey="${key}"] [data-dnote]`, 'gate 3, ask for Sam'); await page.dispatchEvent(`.dcard[data-dckey="${key}"] [data-dnote]`, 'change'); await page.waitForTimeout(600);
  console.log('note', JSON.stringify(await page.evaluate(k => deliveryOf(k).note, key)));
  // 4. the time
  await page.fill(`.dcard[data-dckey="${key}"] [data-eta]`, '07:30'); await page.dispatchEvent(`.dcard[data-dckey="${key}"] [data-eta]`, 'change'); await page.waitForTimeout(600);
  console.log('eta', JSON.stringify(await page.evaluate(k => deliveryOf(k).eta, key)));
  await page.evaluate(() => { const c = document.querySelector('#pane-timeline .dcard'); c.scrollIntoView({block: 'start'}); window.scrollBy(0, -8); }); await page.waitForTimeout(500);
  const box = await page.evaluate(() => { const r = document.querySelector('#pane-timeline .dcard').getBoundingClientRect(); return {y: Math.max(0, r.top - 4), h: Math.min(r.height + 8, innerHeight)}; });
  await page.screenshot({path: 'tabs610/dcard640_edit_after.png', clip: {x: 0, y: box.y, width: 1400, height: box.h}});
  console.log('errors', errs.slice(0, 4));
  await browser.close(); })();
