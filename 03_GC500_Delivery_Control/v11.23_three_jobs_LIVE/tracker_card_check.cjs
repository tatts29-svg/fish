/* Author: Andrew Fisher. Open the published crew card at one reference's clean code and pump code and check what the crew see
   on v11.23: three rings (area and everything), a three-ring sticky header that fits the phone, Clean & restock and Water
   checked / refilled on the clean code, Pump out alone on the pump code.
   GET only. Reads the private links file the fold downloaded (beside this script, never committed); prints no code.
     node tracker_card_check.cjs test|event [REF]      (default test, PG01) */
'use strict';
const path = require('path'), fs = require('fs');
const {chromium} = require('playwright');
const HOST = 'https://gc500-production.up.railway.app';
const MODE = (process.argv[2] || 'test') === 'event' ? 'event' : 'test', REF = (process.argv[3] || 'PG01').toUpperCase();
const links = JSON.parse(fs.readFileSync(path.join(__dirname, 'private_links_' + MODE + '.json'), 'utf8'));
const sig = links.links[REF]; if (!sig) { console.error(REF + ' is not in the links file'); process.exit(2); }
const OUT = path.join(__dirname, 'evidence'); fs.mkdirSync(OUT, {recursive: true});
(async () => {
 const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU'], executablePath: process.env.CHROMIUM_PATH || undefined});
 const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
 let blocked = 0; await ctx.route('**/*', r => r.request().method() === 'GET' || r.request().url().startsWith('data:') ? r.continue() : (blocked++, r.abort()));
 const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
 let ok = true;
 try {
  for (const group of ['clean', 'pump']) {
   await page.goto(HOST + '/d/' + encodeURIComponent(links.token) + '#r=' + REF + '.' + sig + '~' + group, {waitUntil: 'load', timeout: 120000});
   await page.waitForTimeout(4000);
   const t = await page.evaluate(() => { const cp = document.getElementById('compact'), cells = [...document.querySelectorAll('#compact .ccell')], last = cells[cells.length - 1]; return {ref: (document.querySelector('.bigref') || {}).textContent, jobs: [...document.querySelectorAll('.job .jtxt b')].map(b => b.textContent), hints: [...document.querySelectorAll('.job .jtxt small')].map(b => b.textContent), water: document.querySelectorAll('.job.t-refill').length, rings: [...document.querySelectorAll('#bars .jobs3 .j3')].map(j => j.textContent.replace(/\s+/g, ' ').trim()), compact: cells.length, fits: !!cp && cp.scrollWidth <= cp.clientWidth + 1 && (!last || last.getBoundingClientRect().right <= window.innerWidth), chips: document.querySelectorAll('.ahead .jchips').length, bars: ((document.getElementById('bars') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 160)}; });
   console.log(group + ' code: ' + JSON.stringify(t));
   await page.screenshot({path: path.join(OUT, 'tracker_' + MODE + '_' + REF + '_' + group + '.png'), fullPage: true});
   ok = ok && t.rings.length === 6 && t.compact === 3 && t.fits && !t.jobs.includes('Water checked') && !t.jobs.includes('Refilled');
   if (group === 'clean') ok = ok && t.jobs.includes('Water checked / refilled') && t.jobs.includes('Clean & restock') && !t.jobs.includes('Pump out') && t.water >= 1 && t.hints.some(h => /Tap when the water is checked or refilled|Completed \d\d:\d\d/.test(h));
   else ok = ok && t.jobs.includes('Pump out') && !t.jobs.includes('Water checked / refilled') && t.water === 0;
  }
 } finally { await browser.close(); }
 console.log((ok ? 'CARD OK' : 'CARD CHECK FAILED') + ' · writes blocked ' + blocked + ' · page errors ' + errors.length + (errors.length ? ' ' + JSON.stringify(errors.slice(0, 2)) : ''));
 process.exit(ok && !errors.length ? 0 : 1);
})().catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
