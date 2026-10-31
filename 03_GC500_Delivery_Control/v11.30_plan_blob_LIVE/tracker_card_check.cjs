/* Author: Andrew Fisher. Open the published crew card at one reference's clean code and pump code and check what the crew see
   on v11.25: six job rings (area and everything) with the detailed neon icons inside at 42 px and the percentage beside,
   a three-ring sticky header with the icons at 26 px that fits the phone, Clean & restock and Water checked / refilled on
   the clean code, Pump out alone on the pump code, the small set on the job buttons drawn in the job colour, no old tanker; on v11.26 the rings are keyed and breathe, the
   card registers --p, the still-to-go chips carry missing-job icons.
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
   const t = await page.evaluate(() => { const cp = document.getElementById('compact'), cells = [...document.querySelectorAll('#compact .ccell')], last = cells[cells.length - 1]; return {ref: (document.querySelector('.bigref') || {}).textContent, jobs: [...document.querySelectorAll('.job .jtxt b')].map(b => b.textContent), hints: [...document.querySelectorAll('.job .jtxt small')].map(b => b.textContent), water: document.querySelectorAll('.job.t-refill').length, rings: [...document.querySelectorAll('#bars .jobs3 .j3')].map(j => j.textContent.replace(/\s+/g, ' ').trim()), compact: cells.length, fits: !!cp && cp.scrollWidth <= cp.clientWidth + 1 && (!last || last.getBoundingClientRect().right <= window.innerWidth), chips: document.querySelectorAll('.ahead .jchips').length, oldIcon: document.documentElement.outerHTML.includes('M3 11h10a3 3 0 0 1 3 3v4H3z'), btnIcons: [...document.querySelectorAll('.job .jtxt b svg')].map(svg => { const q = svg.querySelector('path'); const cs = getComputedStyle(svg), ps = getComputedStyle(q); return {stroke: cs.stroke, sw: cs.strokeWidth, w: Math.round(svg.getBoundingClientRect().width), dash: ps.strokeDasharray, off: ps.strokeDashoffset}; }), tickDash: (document.querySelector('.job .jbox svg path') ? getComputedStyle(document.querySelector('.job .jbox svg path')).strokeDasharray : ''), ringIcons: [...document.querySelectorAll('#bars .j3 .ring .ic svg')].map(s => getComputedStyle(s).width), headIcons: [...document.querySelectorAll('#compact .ccell .ring .ic svg')].map(s => getComputedStyle(s).width), pcts: [...document.querySelectorAll('#bars .j3 .j3p')].map(b => b.textContent), keyed: document.querySelectorAll('.ring[data-k]').length, ndIcons: document.querySelectorAll('.left-list .chip .nd-i i svg').length, registered: [...document.styleSheets].flatMap(x => { try { return [...x.cssRules]; } catch (e) { return []; } }).filter(x => x.constructor.name === 'CSSPropertyRule').map(x => x.name).join(), breathe: (document.querySelector('#bars .j3 .ring .ic') ? getComputedStyle(document.querySelector('#bars .j3 .ring .ic')).animationName : ''), newIcons: ['M6.5 9.5h9.5a3 3 0 0 1 3 3v3.5h-9l-3.5-1z', 'M24.5 25v12a9.5 4.2 0 0 0 19 0V25', 'M22 4c-7 9.5-13 17-13 24a13 13 0 0 0 26 0c0-7-6-14.5-13-24z', 'M3 12.5h18V18a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z', 'M7 10.5h7.5l1.5 2.5v7a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20v-7z', 'M12 2.5c-3.6 5-7 8.6-7 12.4a7 7 0 0 0 14 0c0-3.8-3.4-7.4-7-12.4z'].filter(d => document.documentElement.outerHTML.includes(d)).length, bars: ((document.getElementById('bars') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 160)}; });
   /* v11.30 - the area on the plan: a pin per reference, the plan fetched by the card itself and handed to the map as a blob or data URL (the card's CSP allows images from data: and blob: only) */
   const mp = await page.evaluate(() => new Promise(res => { let n = 0; const tick = () => { const svg = document.querySelector('.amap-svg'); const img = svg && svg.querySelector('image'); const src = window.SvcMap1129 && window.SvcMap1129.src ? window.SvcMap1129.src() : ''; if ((src && img) || ++n > 40) res({pins: svg ? svg.querySelectorAll('a').length : 0, me: svg ? ((svg.querySelector('a.me text') || {}).textContent || null) : null, plan: src ? src.slice(0, 5) : 'none', href: img ? (img.getAttribute('href') || '').slice(0, 5) : 'none', locate: !!document.querySelector('[data-locate]'), cached: (function () { try { return Object.keys(localStorage).some(k => /plan1129/.test(k)); } catch (e) { return false; } })()}); else setTimeout(tick, 250); }; tick(); }));
   t.map = mp;
   console.log(group + ' code: ' + JSON.stringify(t));
   await page.screenshot({path: path.join(OUT, 'tracker_' + MODE + '_' + REF + '_' + group + '.png'), fullPage: true});
   ok = ok && t.map && t.map.pins >= 12 && t.map.me === REF && /^(blob:|data:)$/.test(t.map.plan) && /^(blob:|data:)$/.test(t.map.href) && t.map.cached && t.map.locate && t.rings.length === 6 && t.compact === 3 && t.fits && !t.jobs.includes('Water checked') && !t.jobs.includes('Refilled') && !t.oldIcon && t.newIcons === 6 && t.ringIcons.length === 6 && t.ringIcons.every(w => w === '42px') && t.headIcons.length === 3 && t.headIcons.every(w => w === '26px') && t.pcts.length === 6 && t.pcts.every(x => /^\d+%$/.test(x)) && t.keyed >= 11 && t.ndIcons >= 3 && t.registered === '--p' && t.breathe === 'svc-breathe' && t.btnIcons.length === t.jobs.length && t.btnIcons.every(b => b.stroke !== 'rgba(0, 0, 0, 0)' && b.stroke !== 'none' && b.dash === 'none' && b.off === '0px' && b.w === 15 && /^2\.2/.test(b.sw)) && /40/.test(t.tickDash);
   if (group === 'clean') ok = ok && t.jobs.includes('Water checked / refilled') && t.jobs.includes('Clean & restock') && !t.jobs.includes('Pump out') && t.water >= 1 && t.hints.some(h => /Tap when the water is checked or refilled|Completed \d\d:\d\d/.test(h));
   if (group === 'clean') {
    /* v11.27 - Save & close (no tap made, so nothing is sent) must open the status page and the card must stay open */
    const enabled = await page.evaluate(() => { const b = document.getElementById('saveclose'); return !!b && !b.disabled; });
    if (enabled) {
     await page.evaluate(() => document.getElementById('saveclose').click());
     await page.waitForTimeout(2500);
     const sv = await page.evaluate(() => ({open: true, saved: (document.querySelector('.saved h2') || {}).textContent, ref: ((document.querySelector('.saved-ref') || {}).textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80), doneRows: document.querySelectorAll('.status-ref .orow').length, left: document.querySelectorAll('.status-area .left-list .chip').length, near: [...document.querySelectorAll('.near-ref')].map(x => x.querySelector('b').textContent + ' ' + x.querySelector('small').textContent), back: (document.querySelector('[data-unsave]') || {}).textContent, status: (document.getElementById('status') || {}).textContent}));
     console.log('after Save & close: ' + JSON.stringify(sv) + ' · page closed: ' + page.isClosed());
     await page.screenshot({path: path.join(OUT, 'tracker_' + MODE + '_' + REF + '_saved_status.png'), fullPage: true});
     ok = ok && !page.isClosed() && /^Saved/.test(sv.saved || '') && sv.doneRows === 1 && sv.left >= 1 && sv.near.length >= 1 && sv.back === 'Back to ' + REF;
    } else { console.log('Save & close is not enabled on this card right now (day not open, stale or identity pending) - status page not exercised'); }
   }
   else ok = ok && t.jobs.includes('Pump out') && !t.jobs.includes('Water checked / refilled') && t.water === 0;
  }
  /* the card without a code: view mode, where the Not done yet card sits before the audit */
  await page.goto(HOST + '/d/' + encodeURIComponent(links.token), {waitUntil: 'load', timeout: 120000});
  await page.waitForTimeout(4000);
  const v = await page.evaluate(() => { const nd = document.querySelector('.notdone'); return {h3: nd ? nd.querySelector('h3').textContent : '', cls: nd ? nd.className : '', sum: nd && nd.querySelector('.nd-sum') ? nd.querySelector('.nd-sum').textContent.replace(/\s+/g, ' ').trim().slice(0, 120) : '', areas: document.querySelectorAll('.notdone .nd-area').length, refs: document.querySelectorAll('.notdone .nd-ref').length, refIcons: document.querySelectorAll('.notdone .nd-ref .nd-i i svg').length, beforeAudit: !!(nd && nd.nextElementSibling && nd.nextElementSibling.classList.contains('audit')), keyed: document.querySelectorAll('.ring[data-k]').length, status: (document.getElementById('status') || {}).textContent}; });
  console.log('view: ' + JSON.stringify(v));
  await page.screenshot({path: path.join(OUT, 'tracker_' + MODE + '_view_notdone.png'), fullPage: false});
  ok = ok && /^(Not done yet|Nothing missing) · /.test(v.h3) && v.beforeAudit && v.keyed >= 5 && (/Nothing missing/.test(v.h3) || (v.areas >= 1 && v.refs >= 1 && v.refIcons >= v.refs)) && /^Live/.test(v.status || '');
 } finally { await browser.close(); }
 console.log((ok ? 'CARD OK' : 'CARD CHECK FAILED') + ' · writes blocked ' + blocked + ' · page errors ' + errors.length + (errors.length ? ' ' + JSON.stringify(errors.slice(0, 2)) : ''));
 process.exit(ok && !errors.length ? 0 : 1);
})().catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
