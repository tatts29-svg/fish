// Author: Andrew Fisher. Actual hosted reads, local candidate, all non-GET requests aborted.
// PAGE=... PRIVATE_OUT=/private/path NODE_PATH=... node control798_browser.js
const fs = require('fs'), path = require('path'), assert = require('assert'), crypto = require('crypto');
const {chromium, devices} = require('playwright');
const {curlFetch} = require('../../toolchain/harness/curlfetch');
const candidate = fs.readFileSync(process.env.PAGE);
const out = process.env.PRIVATE_OUT;
if (!out) throw new Error('PRIVATE_OUT is required; screenshots contain operational details');
fs.mkdirSync(out, {recursive: true});
const results = {author: 'Andrew Fisher', candidateSha256: crypto.createHash('sha256').update(candidate).digest('hex'), runs: []};
const save = () => fs.writeFileSync(path.join(out, 'browser_results.json'), JSON.stringify(results, null, 2));
async function run(browser, mobile) {
  const R = {mode: mobile ? 'phone' : 'desktop', checks: [], errors: [], console: [], blocked: [], apiGets: 0};
  results.runs.push(R); save();
  let offline = false, level = 'edit';
  const ctx = await browser.newContext({...mobile ? {...devices['iPhone 13'], viewport: {width: 390, height: 844}, deviceScaleFactor: 1} : {viewport: {width: 1440, height: 900}}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
  await ctx.route('**/*', async route => {
    const request = route.request(), url = request.url();
    if (request.method() !== 'GET') { R.blocked.push({method: request.method(), path: new URL(url).pathname, host: new URL(url).hostname}); return route.abort(); }
    if (/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:\?.*)?$/.test(url.split('#')[0])) return route.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: candidate});
    if (/\/api\/(version|state)(?:\?|$)/.test(url)) {
      R.apiGets++;
      if (offline) return route.fulfill({status: 503, contentType: 'text/plain', body: 'Test-only unavailable response'});
    }
    if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    try {
      const response = await curlFetch(url, request.headers(), 'GET');
      // Practice editing controls on the view URL, without an editing credential or a record write.
      if (/\/api\/version(?:\?|$)/.test(url) && response.status === 200) {
        const body = JSON.parse(response.body); body.level = level;
        response.body = Buffer.from(JSON.stringify(body));
      }
      return route.fulfill(response);
    } catch (error) { return route.abort(); }
  });
  const p = await ctx.newPage();
  p.on('pageerror', error => R.errors.push(error.message));
  p.on('console', msg => { if (msg.type() === 'error') R.console.push({text: msg.text(), path: (() => { try { return new URL(msg.location().url).pathname; } catch { return ''; } })()}); });
  const check = (name, yes, detail) => { R.checks.push({name, pass: !!yes, ...(detail === undefined ? {} : {detail})}); save(); assert(yes, name); };
  const pull = () => p.evaluate(async () => { await SYNC.db.pull(false); });
  const label = () => p.locator('#drawer .ptag.sync b').innerText();
  const stable = () => p.evaluate(() => {
    const d = document.querySelector('#drawer'), a = d.__audit798, input = a.input;
    return {sameInput: document.querySelector('#drawer textarea') === input, sameBadge: document.querySelector('#drawer .ptag.sync b') === a.badge, sameValue: input.value === a.value, sameFocus: document.activeElement === input, sameSelection: input.selectionStart === a.selectionStart && input.selectionEnd === a.selectionEnd, sameDrawerScroll: d.scrollTop === a.drawerScroll, sameBodyScroll: document.querySelector('#drawer .db').scrollTop === a.bodyScroll};
  });
  await p.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/#docs', {waitUntil: 'load', timeout: 180000});
  R.browserVersion = browser.version();
  R.capabilities = await p.evaluate(() => ({isSecureContext, cryptoSubtle: !!crypto.subtle, blobArrayBuffer: typeof Blob.prototype.arrayBuffer === 'function', webLocks: !!navigator.locks}));
  await p.waitForFunction(() => typeof drawerSync798Refresh === 'function' && SYNC.status === 'live' && SYNC.level === 'edit', null, {timeout: 120000});
  await p.evaluate(() => {
    // Defence in depth: any unexpected document write would also fail before transport.
    SYNC.db.doc = () => ({set: () => Promise.reject(new Error('Test prohibits record writes')), delete: () => Promise.reject(new Error('Test prohibits record writes'))});
    openAsset('P46');
  });
  await p.waitForTimeout(800);
  check('online drawer reflects editing capability', await label() === 'Live');
  await p.evaluate(() => {
    const d = document.querySelector('#drawer'), input = d.querySelector('textarea'), badge = d.querySelector('.ptag.sync b');
    if (!input || input.disabled) throw new Error('Editable drawer textarea required for focus/draft preservation test');
    input.value = 'Unsubmitted test draft — never dispatched or saved';
    input.focus({preventScroll: true}); input.setSelectionRange(4, 15);
    d.scrollTop = 113; const body = d.querySelector('.db'); body.scrollTop = 127;
    d.__audit798 = {input, badge, value: input.value, selectionStart: input.selectionStart, selectionEnd: input.selectionEnd, drawerScroll: d.scrollTop, bodyScroll: body.scrollTop};
    d.__audit798.mutations = 0;
    const observer = new MutationObserver(records => { d.__audit798.mutations += records.length; });
    observer.observe(badge, {childList: true, characterData: true, subtree: true}); d.__audit798.observer = observer;
  });
  await pull();
  check('unchanged status causes no badge DOM mutation', await p.evaluate(() => document.querySelector('#drawer').__audit798.mutations) === 0);
  offline = true;
  await pull(); await pull(); await pull();
  await p.waitForFunction(() => SYNC.status === 'unreachable', null, {timeout: 20000});
  check('open drawer changes to Offline after failed GETs', await label() === 'Offline · will send');
  let kept = await stable(); check('outage preserves draft, focus, selection, node identity and scroll', Object.values(kept).every(Boolean), kept);
  await p.screenshot({path: path.join(out, R.mode + '-offline.png')});
  offline = false; await pull();
  await p.waitForFunction(() => SYNC.status === 'live', null, {timeout: 15000});
  check('same open drawer returns to Live after GET recovery', await label() === 'Live');
  kept = await stable(); check('recovery preserves draft, focus, selection, node identity and scroll', Object.values(kept).every(Boolean), kept);
  // Isolate existing capability behaviour: disabling a focused field may blur it and adjust phone scroll.
  // Repeat that transition once with only the new badge refresh suppressed, then compare its effects.
  await p.evaluate(() => { window.__refresh798 = drawerSync798Refresh; drawerSync798Refresh = () => {}; });
  level = 'view'; await pull(); await p.waitForFunction(() => SYNC.level === 'view', null, {timeout: 15000});
  R.capabilityWithoutBadgeRefresh = await stable();
  level = 'edit'; await pull(); await p.waitForFunction(() => SYNC.level === 'edit', null, {timeout: 15000});
  await p.evaluate(() => {
    drawerSync798Refresh = window.__refresh798; delete window.__refresh798;
    const d = document.querySelector('#drawer'), a = d.__audit798;
    a.input.focus({preventScroll: true}); a.input.setSelectionRange(a.selectionStart, a.selectionEnd);
    d.scrollTop = a.drawerScroll; d.querySelector('.db').scrollTop = a.bodyScroll;
  });
  level = 'view'; await pull();
  await p.waitForFunction(() => SYNC.level === 'view', null, {timeout: 15000});
  check('capability downgrade refreshes the same badge', await label() === 'Live · view only');
  kept = await stable(); check('capability downgrade keeps field node and draft', kept.sameInput && kept.sameBadge && kept.sameValue && kept.sameSelection, kept);
  check('badge refresh adds no capability focus or scroll change', kept.sameFocus === R.capabilityWithoutBadgeRefresh.sameFocus && kept.sameDrawerScroll === R.capabilityWithoutBadgeRefresh.sameDrawerScroll && kept.sameBodyScroll === R.capabilityWithoutBadgeRefresh.sameBodyScroll, {withoutBadgeRefresh: R.capabilityWithoutBadgeRefresh, withBadgeRefresh: kept});
  offline = true; await pull(); await pull(); await pull();
  await p.waitForFunction(() => SYNC.status === 'unreachable', null, {timeout: 20000});
  check('read-only outage never promises a send', await label() === 'Offline · view only');
  await p.evaluate(() => { const d = document.querySelector('#drawer'); d.scrollTop = 0; d.querySelector('.db').scrollTop = 0; });
  await p.screenshot({path: path.join(out, R.mode + '-readonly-offline.png')});
  offline = false; await pull();
  await p.waitForFunction(() => SYNC.status === 'live', null, {timeout: 15000});
  check('read-only recovery updates without reopening', await label() === 'Live · view only');
  level = 'edit'; await pull(); await p.waitForFunction(() => SYNC.level === 'edit', null, {timeout: 15000});
  check('capability upgrade refreshes the same badge', await label() === 'Live');
  check('no page exceptions', R.errors.length === 0, R.errors);
  check('no service or other non-GET requests attempted', R.blocked.every(x => x.host === 'tile.googleapis.com' && x.path === '/v1/createSession'), R.blocked);
  // Console errors from the deliberate HTTP 503 responses and blocked tile-session POST are expected here.
  const unexpected = R.console.filter(x => !['/api/version', '/api/state', '/v1/createSession'].includes(x.path));
  check('no unexpected console errors', unexpected.length === 0, unexpected);
  R.passed = R.checks.length; save(); await ctx.close();
}
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox', '--lang=en-AU']});
  try { await run(browser, false); await run(browser, true); } finally { await browser.close(); save(); }
  console.log(JSON.stringify({candidateSha256: results.candidateSha256, runs: results.runs.map(r => ({mode: r.mode, passed: r.passed, errors: r.errors.length}))}));
})().catch(error => { results.fatal = error.stack; save(); console.error(error.stack); process.exitCode = 1; });
