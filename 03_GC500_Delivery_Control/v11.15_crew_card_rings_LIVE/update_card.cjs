#!/usr/bin/env node
/* Author: Andrew Fisher. Re-post the live servicing crew card under its EXISTING token from the page's own
   "Create / update event tracker" control, so every printed QR code keeps working and the crews get the v3.1 card.

     node update_card.cjs             DRY RUN (default): the edit link is opened in Chromium with every write ABORTED;
                                      the one POST /api/cards the page tries is inspected and reported, nothing is sent.
     node update_card.cjs --apply     needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA (the live page the operator reviewed).

   What it checks, in order: the public page's sha256 is the reviewed one; GET /api/cards and /api/ticks (edit) give ONE
   live event tracker, its token, contact, tracker config and signed links (kept as the backup, in the private folder
   given by --backup-dir or the scratchpad, never in the repo); the page's admin form is prefilled with the live contact
   (the page does that itself), both confirmation boxes are ticked, the confirm dialogs are accepted, the button is
   pressed; the write gate lets through exactly one POST /api/cards whose body carries the live token, the SAME tracker
   config and a v3.1 card html (and nothing else: every other non-GET is aborted); the page's own read-back must report
   "Event tracker saved and read back"; afterwards /api/ticks says key_kept, the signed links are identical to before,
   the tick count is unchanged, and /d/<token> serves the v3.1 card. The key is never printed; the token is never
   printed; the report in the release folder carries only hashes. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
module.paths.unshift(path.join(TOOLCHAIN, 'node_modules'));
const { chromium } = require('playwright');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026', LOAD = 'servicing-tracker:GC500-2026';
const args = process.argv.slice(2), applying = args.includes('--apply');
const argValue = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const token = process.env.GC500_EDIT_TOKEN || '', expectedSha = process.env.GC500_EXPECTED_PAGE_SHA || '';
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
const utc = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
let cardToken = '';
const redact = s => { let t = String(s); if (token) t = t.split(token).join('[key]'); if (cardToken) t = t.split(cardToken).join('[card-token]'); return t; };
const log = (...a) => console.log(...a.map(redact));
const fail = m => { throw new Error(redact(m)); };
if (!token) fail('GC500_EDIT_TOKEN is not set');
async function get(p, tok) {
  const r = await fetch(HOST + p, { headers: { 'x-gc500-token': tok || token, 'cache-control': 'no-cache' } });
  const bytes = Buffer.from(await r.arrayBuffer()), text = bytes.toString('utf8'); let j = null; try { j = JSON.parse(text); } catch (e) {}
  return { status: r.status, j, text, bytes };
}

(async () => {
  const started = utc(); let browser = null; let code = 0;
  try {
    log(`update_card ${applying ? 'APPLY' : 'DRY RUN'}`);
    const live = await get('/v/' + VIEW_TOKEN, VIEW_TOKEN); if (live.status !== 200) fail('public page answered ' + live.status);
    const pageSha = sha256(live.bytes); log('public page sha256 ' + pageSha + ' (' + live.bytes.length + ' bytes)');
    if (applying) { if (!/^[a-f0-9]{64}$/.test(expectedSha)) fail('GC500_EXPECTED_PAGE_SHA must be set'); if (pageSha !== expectedSha) fail('the public page is not the reviewed one'); }
    /* --page <built page>: a dry run before the upload serves that build as the edit link (the live service answers everything else) */
    const pageFile = argValue('--page');
    if (pageFile && applying) fail('--page is for the dry run only');
    const pageText = pageFile ? fs.readFileSync(pageFile, 'utf8') : live.text;
    if (pageFile) log('dry run page: ' + pageFile + ' (' + pageText.length + ' bytes, sha256 ' + sha256(pageText) + ')');
    const vm = pageText.match(/^var SVC1067_CARD=(.*);$/m); if (!vm) fail('the page carries no crew card template');
    const template = JSON.parse(vm[1]).html; if (!/svc-ringdone/.test(template)) fail('the page does not carry the v3.1 card template yet - upload v11.15 first');

    const state = (await get('/api/state', VIEW_TOKEN)).j || {};
    const cards = await get('/api/cards'); if (cards.status !== 200) fail('cannot read the cards: ' + cards.status);
    const mine = (cards.j.cards || []).filter(c => c.load === LOAD && !c.expired && !c.card_withdrawn);
    if (mine.length !== 1) fail('expected one live event tracker card, found ' + mine.length);
    cardToken = mine[0].token; const brief = mine[0];
    const meta = await get('/api/ticks?token=' + encodeURIComponent(cardToken) + '&links=1'); if (meta.status !== 200 || !meta.j.tracker) fail('cannot read the tracker');
    if (!meta.j.key_kept) fail('the tracker key is not kept on the service - stop');
    const before = { brief, meta: meta.j, html: (await get('/d/' + encodeURIComponent(cardToken), VIEW_TOKEN)).text };
    const backupDir = argValue('--backup-dir') || path.join(os.homedir(), '.gc500_private'); fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const bk = path.join(backupDir, 'crew_card_backup_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1), { mode: 0o600 });
    const tickCount = m => Array.isArray(m.ticks) ? m.ticks.length : (m.active_ticks != null ? m.active_ticks : m.ticks);
    log(`backup of the live card (html ${before.html.length} bytes, ${Object.keys(meta.j.links || {}).length} signed links, ${tickCount(meta.j)} ticks, contact ${brief.contact ? 'yes' : 'no'}) -> ${bk}`);
    const linksBefore = canon(meta.j.links), trackerBefore = canon(meta.j.tracker), ticksBefore = tickCount(meta.j);
    if (/svc-ringdone/.test(before.html)) log('note: the live card already is a v3.1 card');

    const launch = { args: ['--no-sandbox', '--lang=en-AU'] }; if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
    browser = await chromium.launch(launch);
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-AU', timezoneId: 'Australia/Brisbane' });
    const page = await ctx.newPage(); const errors = [], posts = [], blocked = [];
    page.on('pageerror', e => errors.push(e.message.slice(0, 200)));
    page.on('dialog', d => { log('dialog: ' + d.message().slice(0, 120)); d.accept(); });
    await ctx.route('**/*', async route => {
      const r = route.request(), u = new URL(r.url()), m = r.method();
      if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
      if (m === 'GET') { if (pageFile && u.origin === HOST && u.pathname === '/e/' + token) return route.fulfill({ status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }, body: pageText }); return route.continue(); }
      if (u.origin === HOST && u.pathname === '/api/cards' && m === 'POST') {
        let body = null; try { body = JSON.parse(r.postData() || 'null'); } catch (e) {}
        const ok = body && body.token === cardToken && body.load === LOAD && canon(body.tracker) === trackerBefore && typeof body.html === 'string' && /svc-ringdone/.test(body.html) && body.html.indexOf('/*SVC1067_DATA*/null') < 0 && body.contact && body.contact.phone === (brief.contact || {}).phone;
        posts.push({ ok, token_same: body && body.token === cardToken, tracker_same: body && canon(body.tracker) === trackerBefore, html_bytes: body && body.html ? body.html.length : 0, v3: !!(body && /svc-ringdone/.test(body.html)), contact_same: !!(body && body.contact && body.contact.phone === (brief.contact || {}).phone), html_sha256: body && body.html ? sha256(body.html) : null });
        if (applying && ok && posts.length === 1) return route.continue();
        blocked.push('POST /api/cards' + (ok ? '' : ' (did not match the plan)')); return route.abort();
      }
      /* the page re-queues a document or two at startup when its serialisation differs from the service's (key order); they are
         aborted here (this runner writes nothing but the card) and reported as no-op or real change against the record */
      const dm = u.origin === HOST && u.pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/);
      if (dm && m === 'PUT') { let body = null; try { body = JSON.parse(r.postData() || 'null'); } catch (e) {} const have = ((state.docs || {})[decodeURIComponent(dm[1])] || {})[decodeURIComponent(dm[2])]; blocked.push(m + ' ' + u.pathname + (have !== undefined && canon(body) === canon(have) ? ' (no-op: equal to the record)' : ' (DIFFERS from the record)')); return route.abort(); }
      blocked.push(m + ' ' + u.pathname); return route.abort();
    });
    await page.goto(HOST + '/e/' + token + '#servicing', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, { timeout: 180000 });
    await page.evaluate(() => go('servicing'));
    await page.waitForSelector('#svc1067-host:not([hidden])', { timeout: 60000 });
    /* the page records who presses: the operator name, as every record change by this runner is made (by Andrew Fisher) */
    await page.evaluate(() => { const w = document.getElementById('who'); if (w) { w.value = 'Andrew Fisher'; w.dispatchEvent(new Event('change', { bubbles: true })); w.dispatchEvent(new Event('input', { bubbles: true })); } if (typeof S === 'object') S.operator = 'Andrew Fisher'; });
    const fold = page.locator('.svc1067-admin').first();
    await fold.locator('summary').click();
    await page.waitForFunction(() => { const n = document.querySelector('[data-contact-name]'), p = document.querySelector('[data-contact-phone]'); return n && p && n.value && p.value; }, null, { timeout: 30000 }).catch(() => {});
    const form = await page.evaluate(() => ({ name: !!document.querySelector('[data-contact-name]').value, phone: !!document.querySelector('[data-contact-phone]').value, editable: SYNC.level }));
    if (!form.name || !form.phone) fail('the admin form did not prefill the live contact - nothing pressed');
    log('admin form prefilled from the live card (level ' + form.editable + ')');
    await page.locator('[data-test-checked]').check(); await page.locator('[data-site-checked]').check();
    await page.locator('[data-make="event"]').click();
    const status = page.locator('[data-admin-status]');
    await page.waitForFunction(() => { const t = document.querySelector('[data-admin-status]').textContent; return /saved and read back|Publishing stopped|not confirmed|refused|error|Error|failed|Do not print/i.test(t) || (t && !/Saving/.test(t) && t.length > 0 && !/^$/.test(t)); }, null, { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const said = await status.textContent();
    log('admin status: ' + said);
    log('POST attempts: ' + JSON.stringify(posts) + ' · blocked: ' + JSON.stringify(blocked) + ' · page errors: ' + JSON.stringify(errors));
    if (!posts.length) fail('the page never tried to post the card');
    if (!posts[0].ok) fail('the post did not match the plan - ' + (applying ? 'it was aborted' : 'it would be refused'));
    if (!applying) { log('DRY RUN PASSED - the page would post the v3.1 card under the live token with the same tracker and contact; nothing was sent'); return; }
    if (!/saved and read back/.test(said)) fail('the page did not confirm the update: ' + said);

    const after = await get('/api/ticks?token=' + encodeURIComponent(cardToken) + '&links=1');
    const cardAfter = await get('/d/' + encodeURIComponent(cardToken), VIEW_TOKEN);
    const checks = { key_kept: !!after.j.key_kept, links_same: canon(after.j.links) === linksBefore, tracker_same: canon(after.j.tracker) === trackerBefore, ticks_same: tickCount(after.j) === ticksBefore, card_v3: /svc-ringdone/.test(cardAfter.text), card_filled: cardAfter.text.indexOf('/*SVC1067_DATA*/null') < 0, card_sha256: sha256(cardAfter.text), card_bytes: cardAfter.text.length, posted_sha256: posts[0].html_sha256, same_as_posted: sha256(cardAfter.text) === posts[0].html_sha256 };
    log('after: ' + JSON.stringify(checks));
    if (!(checks.key_kept && checks.links_same && checks.tracker_same && checks.ticks_same && checks.card_v3 && checks.card_filled && checks.same_as_posted)) fail('VERIFICATION FAILED - restore from the backup');
    const report = { started, finished: utc(), by: 'Andrew Fisher', page_sha256: pageSha, card_before: { bytes: before.html.length, sha256: sha256(before.html) }, card_after: { bytes: checks.card_bytes, sha256: checks.card_sha256 }, links: Object.keys(after.j.links || {}).length, links_unchanged: checks.links_same, key_kept: checks.key_kept, ticks: tickCount(after.j), backup: 'private, outside the repo', admin_status: said };
    fs.writeFileSync(path.join(HERE, 'report_' + started + '.json'), JSON.stringify(report, null, 1) + '\n');
    log('VERIFIED - the live crew card is the v3.1 card under the same token; every signed link unchanged; report_' + started + '.json');
  } catch (e) { code = 1; console.error('FAILED: ' + redact(e.message)); }
  finally { if (browser) await browser.close(); process.exit(code); }
})();
