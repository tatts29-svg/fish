/* Author: Andrew Fisher. Open the published crew card at one reference's clean (or pump) code and print what the crew read on
   each line in v11.46: the title in words, the symbol's kind, the record's label in small print and the asset numbers.
   GET only. Reads the private links file beside this script (never committed); prints no code.
     node card_words_check.cjs test|event [REF] [clean|pump]      (default test, PG01, clean) */
'use strict';
const path = require('path'), fs = require('fs');
const {chromium} = require('playwright');
const HOST = 'https://gc500-production.up.railway.app';
const MODE = (process.argv[2] || 'test') === 'event' ? 'event' : 'test', REF = (process.argv[3] || 'PG01').toUpperCase(), GROUP = process.argv[4] === 'pump' ? 'pump' : 'clean';
const links = JSON.parse(fs.readFileSync(path.join(__dirname, 'private_links_' + MODE + '.json'), 'utf8'));
const sig = links.links[REF]; if (!sig) { console.error(REF + ' is not in the links file'); process.exit(2); }
(async () => {
 const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU'], executablePath: process.env.CHROMIUM_PATH || undefined});
 const ctx = await browser.newContext({viewport: {width: 390, height: 844}, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
 let blocked = 0; await ctx.route('**/*', r => r.request().method() === 'GET' || r.request().url().startsWith('data:') ? r.continue() : (blocked++, r.abort()));
 const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
 try {
  await page.goto(HOST + '/d/' + encodeURIComponent(links.token) + '#r=' + REF + '.' + sig + '~' + GROUP, {waitUntil: 'load', timeout: 120000});
  await page.waitForTimeout(4000);
  const t = await page.evaluate(() => ({title: document.title, ref: (document.querySelector('.bigref') || {}).textContent, footer: (document.body.innerText.match(/v11\.\d+/) || [''])[0],
   lines: [...document.querySelectorAll('.refcard .line')].map(d => { const h = d.querySelector('.ltitle'), n = d.querySelector('.nos'), g = h && h.querySelector('svg.lsym g.sym');
    return {title: h ? h.textContent.trim() : null, sym: g ? [...g.classList].find(x => /^sym-/.test(x)) : null, rec: n && n.querySelector('.rec') ? n.querySelector('.rec').textContent : null, nos: n ? n.textContent : null, jobs: [...d.querySelectorAll('.job .jtxt b')].map(b => b.textContent)}; }),
   focusKey: document.querySelectorAll('.amap-foot .skey').length}));
  console.log(MODE + ' ' + REF + ' ' + GROUP + ' code: ' + JSON.stringify(t));
  const ok = t.ref === REF && t.lines.length >= 1 && t.lines.every(l => l.title && /^\d+ /.test(l.title) && !/FWF|×/.test(l.title) && l.sym && l.rec && /×/.test(l.rec));
  console.log((ok ? 'WORDS OK' : 'WORDS CHECK FAILED') + ' · writes blocked ' + blocked + ' · page errors ' + errors.length);
  process.exitCode = ok && !errors.length ? 0 : 1;
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(2); });
