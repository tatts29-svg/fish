// v6.30 - the Timeline's race day cards with the forecast on them. Usage: node test_v630.js <url> [forecast.json|none]
// With a forecast file the /api/weather/forecast call is answered from it (dates re-based to today); "none" leaves the
// service to answer (locally a 503, no key) so the cards must draw cleanly with no weather at all.
const {chromium} = require('playwright'); const fs = require('fs');
const url = process.argv[2]; const src = process.argv[3] || 'none';
const iso = d => d.toISOString().slice(0, 10);
(async () => {
  const browser = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  let mock = null;
  if (src !== 'none') { mock = JSON.parse(fs.readFileSync(src, 'utf8'));
    const t0 = new Date(); t0.setHours(12, 0, 0, 0);
    mock.days = mock.days.map((d, i) => Object.assign({}, d, {date: iso(new Date(t0.getTime() + i * 86400000))})); }
  for (const [name, vp, mobile] of [['1400', {width: 1400, height: 900}, false], ['1366', {width: 1366, height: 768}, false], ['phone', {width: 390, height: 844}, true]]) {
    const ctx = await browser.newContext({viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile});
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    if (mock) await page.route('**/api/weather/forecast', r => r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(mock)}));
    await page.goto(url + '#timeline', {waitUntil: 'load', timeout: 120000}); await page.waitForTimeout(3000);
    const info = await page.evaluate(() => {
      const strip = document.querySelector('#pane-timeline .daystrip'); const cards = [...strip.querySelectorAll('.day')];
      const today = cards.find(c => c.classList.contains('today')); const on = strip.querySelector('.day.on');
      const wx = cards.filter(c => c.querySelector('.dwx').innerHTML.trim()).length;
      return {cards: cards.length, wx, todayWx: today ? today.querySelector('.dwx').textContent.trim().slice(0, 40) : null,
              todayMotto: today ? (today.querySelector('.dmotto, .dsel') || {}).textContent : null,
              onIso: on && on.dataset.day, h: Math.round(cards[0].getBoundingClientRect().height), w: Math.round(cards[0].getBoundingClientRect().width),
              heads: (document.querySelector('.dayhead h3') || {}).textContent, wxf: WXF.state, why: WXF.why,
              sw: document.documentElement.scrollWidth};
    });
    console.log(name, JSON.stringify(info));
    // scroll the strip so today is in view, shoot the strip and the day heading
    await page.evaluate(() => { const t = document.querySelector('#pane-timeline .day.today') || document.querySelector('#pane-timeline .day.on'); if (t) t.scrollIntoView({block: 'center', inline: 'center'}); });
    await page.waitForTimeout(600);
    const box = await page.evaluate(() => { const s = document.querySelector('#pane-timeline .daystrip').getBoundingClientRect(); const h = document.querySelector('.dayhead').getBoundingClientRect();
      return {x: 0, y: Math.max(0, Math.floor(s.top) - 8), w: document.documentElement.clientWidth, h: Math.ceil(h.bottom - s.top) + 16}; });
    await page.screenshot({path: `tabs610/cards630_${name}_${src === 'none' ? 'nowx' : 'wx'}.png`, clip: {x: box.x, y: box.y, width: box.w, height: Math.min(box.h, vp.height - box.y)}});
    // click another day: the re-drawn strip must carry the weather without waiting for a fetch
    const r = await page.evaluate(() => { const cards = [...document.querySelectorAll('#pane-timeline .day')]; const i = cards.findIndex(c => c.classList.contains('today')); const nx = cards[i + 1] || cards[0]; nx.click();
      const on = document.querySelector('#pane-timeline .day.on'); return {clicked: nx.dataset.day, on: on && on.dataset.day, onWx: on && on.querySelector('.dwx').textContent.trim().slice(0, 30), head: (document.querySelector('.dayhead h3') || {}).textContent}; });
    console.log(name, 'after click', JSON.stringify(r));
    await page.waitForTimeout(400);
    if (name === '1400') { await page.evaluate(() => { const t = document.querySelector('#pane-timeline .day.on'); t.scrollIntoView({block: 'center', inline: 'center'}); });
      await page.waitForTimeout(500); const b2 = await page.evaluate(() => { const s = document.querySelector('#pane-timeline .daystrip').getBoundingClientRect(); return {y: Math.max(0, Math.floor(s.top) - 8), h: Math.ceil(s.height) + 16}; });
      await page.screenshot({path: `tabs610/cards630_1400_${src === 'none' ? 'nowx' : 'wx'}_next.png`, clip: {x: 0, y: b2.y, width: 1400, height: b2.h}}); }
    console.log(name, 'errors', errors.length, errors.slice(0, 3));
    await ctx.close();
  }
  await browser.close();
})();
