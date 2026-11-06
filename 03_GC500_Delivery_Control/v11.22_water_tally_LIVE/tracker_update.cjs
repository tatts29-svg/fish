/* Author: Andrew Fisher. Publish the servicing tracker again from the page's own admin fold, so the crews' card carries the
   water tally and the Water checked job. TEST first (its own token, practice only), the event tracker on Andrew's word.

     GC500_EDIT_TOKEN=... node tracker_update.cjs test            the TEST tracker (default)
     GC500_EDIT_TOKEN=... node tracker_update.cjs event           the event tracker: its printed completion codes stay the same

   Exactly as an editor would: the edit link opens on Event nights, "Manage servicing tracker" is expanded, the contact is the
   one the service already holds for the event tracker, the mode's button is pressed and the page's own confirm dialogs are
   answered yes. The only write let through is the page's own POST /api/cards; every other non-GET is aborted and counted.
   Afterwards the published card is opened at one reference's clean code (from the private links the fold offers) and checked
   for the water line and the Water checked job. The private links file is kept beside this script and is NOT committed. */
'use strict';
const path = require('path'), fs = require('fs');
const {chromium} = require('playwright');
const HOST = 'https://gc500-production.up.railway.app';
const MODE = (process.argv[2] || 'test') === 'event' ? 'event' : 'test';
const token = process.env.GC500_EDIT_TOKEN || '';
if (!token) { console.error('GC500_EDIT_TOKEN is not set - nothing published'); process.exit(2); }
const OUT = path.join(__dirname, 'evidence'); fs.mkdirSync(OUT, {recursive: true});
const log = s => console.log(new Date().toISOString().slice(11, 19) + ' ' + s);
(async () => {
 const browser = await chromium.launch({args: ['--no-sandbox', '--lang=en-AU'], executablePath: process.env.CHROMIUM_PATH || undefined});
 const ctx = await browser.newContext({viewport: {width: 1300, height: 1000}, locale: 'en-AU', timezoneId: 'Australia/Brisbane', acceptDownloads: true});
 const counts = {blocked: [], cards: 0};
 await ctx.route('**/*', route => {
  const r = route.request(), u = r.url(), m = r.method();
  if (u.startsWith('data:') || u.startsWith('blob:')) return route.continue();
  if (m === 'GET') return route.continue();
  let p; try { p = new URL(u); } catch (e) { return route.abort(); }
  if (m === 'POST' && p.origin === HOST && p.pathname === '/api/cards') { counts.cards++; return route.continue(); }
  counts.blocked.push(m + ' ' + p.pathname); return route.abort();
 });
 const page = await ctx.newPage(); const errors = [];
 page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
 const dialogs = [];
 page.on('dialog', async d => { dialogs.push(d.message()); log('dialog: ' + d.message()); await d.accept(); });
 try {
  await page.goto(HOST + '/e/' + token + '#nights', {waitUntil: 'load', timeout: 180000});
  await page.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.level === 'edit', null, {timeout: 180000});
  log('edit link live, level ' + await page.evaluate(() => SYNC.level) + ', footer ' + await page.evaluate(() => (document.body.innerText.match(/v11\.\d+/) || [''])[0]));
  await page.evaluate(() => { const w = document.getElementById('who'); if (w) { w.value = 'Andrew Fisher'; w.dispatchEvent(new Event('input', {bubbles: true})); w.dispatchEvent(new Event('change', {bubbles: true})); } });
  await page.waitForSelector('details.svc1067-admin', {state: 'attached', timeout: 60000});
  /* the fold lives on the Event nights pane, which the page hides until that tab is shown; the controls are driven through the
     DOM's own click(), exactly what a tap does, whether or not the pane is on screen */
  await page.evaluate(() => { const b = [...document.querySelectorAll('button, a')].find(x => /^Event nights$/i.test((x.textContent || '').trim())); if (b) b.click(); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const f = document.querySelector('details.svc1067-admin'); f.open = true; f.dispatchEvent(new Event('toggle')); });
  await page.waitForFunction(() => { const n = document.querySelector('details.svc1067-admin [data-contact-name]'); return n && n.value.trim().length > 0; }, null, {timeout: 30000}).catch(() => {});
  const contact = await page.evaluate(() => ({name: document.querySelector('details.svc1067-admin [data-contact-name]').value, phone: document.querySelector('details.svc1067-admin [data-contact-phone]').value.replace(/\d(?=\d{3})/g, '•')}));
  log('contact from the service: ' + JSON.stringify(contact));
  if (!contact.name) throw new Error('the fold did not fill the servicing contact from the service - stopping, nothing published');
  if (MODE === 'event') await page.evaluate(() => { for (const k of ['[data-test-checked]', '[data-site-checked]']) { const c = document.querySelector('details.svc1067-admin ' + k); c.checked = true; } });
  await page.evaluate(m => document.querySelector('details.svc1067-admin [data-make="' + m + '"]').click(), MODE);
  await page.waitForFunction(() => /saved and read back|Do not print|not saved|stopped|Enter|Connect|More than one|Confirm the TEST/i.test((document.querySelector('details.svc1067-admin [data-admin-status]') || {}).textContent || ''), null, {timeout: 120000});
  const status = await page.evaluate(() => document.querySelector('details.svc1067-admin [data-admin-status]').textContent);
  log('status: ' + status);
  if (!/saved and read back/.test(status)) throw new Error('not published: ' + status);
  const href = await page.evaluate(() => (document.querySelector('details.svc1067-admin [data-admin-links] a') || {}).getAttribute('href'));
  const ttoken = decodeURIComponent((href || '').replace('/d/', ''));
  log('tracker link /d/' + ttoken.slice(0, 6) + '… (' + MODE + ')');
  const [download] = await Promise.all([page.waitForEvent('download', {timeout: 30000}), page.evaluate(() => document.querySelector('details.svc1067-admin [data-download-links]').click())]);
  const linksPath = path.join(__dirname, 'private_links_' + MODE + '.json'); await download.saveAs(linksPath);
  const links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
  log('private links saved beside this script (not committed): ' + path.basename(linksPath) + ', ' + Object.keys(links.links || {}).length + ' entries');
  // the published card, as a crew phone sees it: view mode, then one reference's clean code
  const card = await ctx.newPage(); card.on('pageerror', e => errors.push('card: ' + e.message.slice(0, 200)));
  await card.goto(HOST + '/d/' + encodeURIComponent(ttoken), {waitUntil: 'load', timeout: 120000});
  await card.waitForTimeout(4000);
  const v = await card.evaluate(() => ({title: document.title, bars: ((document.getElementById('bars') || {}).innerText || '').replace(/\s+/g, ' ').slice(0, 220), waters: document.querySelectorAll('.water').length, small: document.querySelectorAll('.water.small').length}));
  log('card view: ' + JSON.stringify(v));
  await card.screenshot({path: path.join(OUT, 'tracker_' + MODE + '_card_view.png')});
  // a clean code: the links file carries each reference's codes
  const L = links.links || {}; const refKey = Object.keys(L).find(k => /^PG01\b|PG01/.test(k)) || Object.keys(L)[0];
  const entry = L[refKey]; const url = entry && (entry.clean || entry.clean_url || (Array.isArray(entry) ? entry.find(x => /clean/.test(JSON.stringify(x))) : null));
  let hash = null;
  if (typeof url === 'string') hash = url.includes('#') ? url.slice(url.indexOf('#')) : null;
  if (!hash && entry) { const s = JSON.stringify(entry); const m = s.match(/#r=[A-Za-z0-9]+\.[A-Za-z0-9_-]+~clean/); if (m) hash = m[0]; }
  if (hash) {
   await card.goto(HOST + '/d/' + encodeURIComponent(ttoken) + hash, {waitUntil: 'load', timeout: 120000});
   await card.waitForTimeout(4000);
   const t = await card.evaluate(() => ({jobs: [...document.querySelectorAll('.job .jtxt b')].map(b => b.textContent), hints: [...document.querySelectorAll('.job .jtxt small')].map(b => b.textContent), waters: document.querySelectorAll('.water').length, refWater: (document.querySelector('.refcard .water') || {}).innerText || ''}));
   log('card at ' + hash.slice(0, 8) + '…~clean: ' + JSON.stringify(t).slice(0, 500));
   await card.screenshot({path: path.join(OUT, 'tracker_' + MODE + '_card_clean_code.png'), fullPage: true});
   console.log(t.jobs.includes('Water checked') && t.jobs.includes('Refilled') && t.waters >= 2 ? 'CARD OK: Water checked and Refilled on the clean code, water lines present' : 'CARD CHECK FAILED');
  } else log('no clean-code hash found in the links file for ' + refKey + ' - card checked in view mode only');
  await card.close();
  log('writes let through: POST /api/cards x' + counts.cards + '; other non-GET aborted: ' + counts.blocked.length + (counts.blocked.length ? ' ' + JSON.stringify(counts.blocked.slice(0, 5)) : '') + '; dialogs answered: ' + dialogs.length + '; page errors: ' + errors.length);
  fs.writeFileSync(path.join(OUT, 'tracker_update_' + MODE + '.json'), JSON.stringify({at: new Date().toISOString(), mode: MODE, status, contact: contact.name, dialogs, cards: counts.cards, blocked: counts.blocked, errors, view: v}, null, 1));
 } finally { await browser.close(); }
})().catch(e => { console.error('FAILED: ' + e.message); process.exit(1); });
