const {chromium} = require('playwright');
(async () => { const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const page = await (await browser.newContext({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true})).newPage(); const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await page.goto(process.argv[2], {waitUntil: 'load'}); await page.waitForTimeout(2000);
  await page.evaluate(() => go('map')); await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('#stage').scrollIntoView({block: 'center'})); await page.waitForTimeout(400);
  const bb = await (await page.$('#stage')).boundingBox();
  // single tap on a marker still opens its panel
  const mk = await page.evaluate(() => { const m = [...document.querySelectorAll('#pane-map .mk')].find(m => { const r = m.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e && e.closest('.mk') === m && document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).filter(x => x.classList.contains('mk')).length === 1; }); if (!m) return null; const r = m.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, m.dataset.keys]; });
  if (mk) { console.log('at point', await page.evaluate(([x,y]) => { const e = document.elementFromPoint(x,y); let s=[]; for(let n=e;n&&s.length<6;n=n.parentElement) s.push(n.tagName+'.'+String(n.className).slice(0,20)+(n.id?'#'+n.id:'')); return s.join(' < ') + ' | ' + (e.textContent||'').slice(0,40); }, mk)); await page.evaluate(() => { window.__clk = []; document.addEventListener('click', e => window.__clk.push(e.target.className), true); }); await page.touchscreen.tap(mk[0], mk[1]); await page.waitForTimeout(900); await page.keyboard.press('Escape'); await page.evaluate(() => { const c = document.querySelector('#drawer .close, #drawer [data-close]'); if (c) c.click(); }); await page.waitForTimeout(400); console.log('marker', mk[2], 'opened', await page.evaluate(() => ({sel: state.sel, drawer: [...document.querySelectorAll('.drawer')].map(d => d.className + ':' + (d.offsetParent !== null || getComputedStyle(d).display)), pick: !!document.querySelector('.mkpick'), clk: window.__clk}))); }
  // find an empty spot (no marker) to tap
  const pt = await page.evaluate(() => { const s = document.querySelector('#stage').getBoundingClientRect(); for (let y = s.top + 20; y < s.bottom - 20; y += 12) for (let x = s.left + 20; x < s.right - 20; x += 12) { const el = document.elementFromPoint(x, y); if (el && !el.closest('.mk, button, .zoomctl, .rotctl')) return [x, y]; } return null; });
  await page.touchscreen.tap(pt[0], pt[1]); await page.waitForTimeout(120); await page.touchscreen.tap(pt[0], pt[1]); await page.waitForTimeout(700);
  console.log('double-tap zoom', await page.evaluate(() => state.zoom.toFixed(2)));
  console.log('errors', JSON.stringify(errs)); await browser.close(); })();
