/* Author: Andrew Fisher. GC500 servicing tracker: tests for the crew card against the local in-memory mock service
   (mock_server.js, 127.0.0.1 only, made-up tokens). Never calls the live service.
     node test_card.cjs
   Playwright from the toolchain's node_modules or /opt/node-tools; Chromium from /opt/pw-browsers.
   Two phone contexts (A and B, different addresses) tick and read the same tracker. Phone screenshots go to evidence/. */
'use strict';
const fs = require('fs'), path = require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
let pw;
try { pw = require(path.join(__dirname, '..', '..', 'toolchain', 'node_modules', 'playwright')); }
catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const { chromium } = pw;
const { createMock, cardCspFromServer, cardScriptHash, sigFor } = require('./mock_server.js');
const { buildCardHtml, trackerConfig, cardScriptHash: genHash } = require('./build_card.js');

const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tracker_data.json'), 'utf8'));
const SERVER_JS = path.join(__dirname, '..', '..', 'server_v5.87_pictures_from_shared_number_LIVE', 'server.js');
const EVID = path.join(__dirname, 'evidence'); fs.mkdirSync(EVID, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0; const fails = [];
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + ' — ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 600)); }
};
const section = t => console.log('\n== ' + t);

/* ---- what the data says (never typed in here) */
const ALL_REFS = [].concat(...DATA.areas.map(a => a.refs));
const REF = Object.fromEntries(ALL_REFS.map(r => [r.ref, r]));
const AREA_OF = Object.fromEntries([].concat(...DATA.areas.map(a => a.refs.map(r => [r.ref, a]))));
const planOf = d => DATA.days.find(x => x.id === d).plan;
const tasksOf = (line, d) => DATA.plans[line.kind][planOf(d)];
const weight = (refs, d) => refs.reduce((n, r) => n + r.lines.reduce((m, l) => m + l.qty * tasksOf(l, d).length, 0), 0);
const words = (line, d) => tasksOf(line, d).map(t => DATA.tasks[t]);
const pctOf = (done, w) => Math.floor(done * 100 / w);
const hm = ms => new Date(ms + 10 * 3600e3).toISOString().slice(11, 16);
const tickTime = t => Math.min(Date.parse(t.tapped_at || t.at), Date.parse(t.at));
const FRI = '2026-10-23', SAT = '2026-10-24', SUN = '2026-10-25';
const at = s => Date.parse(s);       /* '2026-10-23T22:00:00+10:00' */

(async () => {
  const t0 = Date.now();
  /* ================================================================ 1. the generated card */
  section('1. generated card HTML');
  const html = buildCardHtml(DATA);
  const again = buildCardHtml(DATA);
  check('build is deterministic (same bytes twice)', html === again);
  const scripts = html.match(/<script\b[^>]*>/gi) || [];
  check('exactly one <script>, and it is bare', scripts.length === 1 && scripts[0] === '<script>', scripts);
  const outside = html.replace(/<script>[\s\S]*?<\/script>/, '');
  check('no inline on*= handler in the markup', !/\son[a-z]+\s*=/i.test(outside));
  const urls = [...new Set(html.match(/https?:\/\/[^\s"'<>)\\]+/g) || [])];
  check('only Google Maps links leave the card', urls.length > 0 && urls.every(u => u.startsWith('https://www.google.com/maps/')), urls);
  check('no external fonts, stylesheets or scripts', !/<link\b/i.test(html) && !/@import/i.test(html) && !/url\(/i.test(html) && !/fonts\.g/i.test(html));
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const dataJson = script.slice(script.indexOf('var D = ') + 8, script.indexOf(';\n', script.indexOf('var D = ')));
  check('the embedded data has no "<" at all, and nothing in the script can close it early (</script, <!--)', dataJson.length > 10000 && dataJson.indexOf('<') < 0 && !/<\/script/i.test(script) && !/<!--/.test(script), dataJson.length);
  check('the embedded data is the tracker data (75 references, 83 lines)', (d => [].concat(...d.areas.map(a => a.refs)).length === 75 && [].concat(...d.areas.map(a => [].concat(...a.refs.map(r => r.lines)))).length === 83)(JSON.parse(dataJson)));
  check('the script parses', (() => { try { new Function(script); return true; } catch (e) { return false; } })());
  const hostile = JSON.parse(JSON.stringify(DATA)); hostile.areas[1].name = 'Island </script><img src=x onerror=alert(1)> North';
  const hh = buildCardHtml(hostile);
  check('a "<" in the data is written as \\u003c and the card still has one script', (hh.match(/<script\b/gi) || []).length === 1 && hh.indexOf('\\u003c/script>\\u003cimg') > 0);
  check('the card is well under the 2 MB card limit', Buffer.byteLength(html) < 200 * 1024, Buffer.byteLength(html));
  check('Author line present', /Author: Andrew Fisher/.test(html));
  check('the generator hash matches the service hash', genHash(html) === cardScriptHash(html));
  const cfg = trackerConfig(DATA);
  check('tracker config: 4 days, 83 lines, 75 references, 263 units', cfg.days.length === 4 && cfg.lines.length === 83 && new Set(cfg.lines.map(l => l.ref)).size === 75 && cfg.lines.reduce((n, l) => n + l.qty, 0) === 263,
    { days: cfg.days.length, lines: cfg.lines.length, units: cfg.lines.reduce((n, l) => n + l.qty, 0) });
  check('tracker config days carry their plans', JSON.stringify(cfg.days) === JSON.stringify(DATA.days.map(d => ({ id: d.id, plan: d.plan }))));
  const readme = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8').match(/Jobs per night: (\d+) \(Sunday (\d+)\)(?![\s\S]*Jobs per night:)/);
  check('weighted jobs: ' + weight(ALL_REFS, FRI) + ' a night, ' + weight(ALL_REFS, SUN) + ' on Sunday, as the README says (' + (readme ? readme[1] + ' / ' + readme[2] : 'not stated') + ')',
    !!readme && weight(ALL_REFS, FRI) === +readme[1] && weight(ALL_REFS, SUN) === +readme[2]);

  /* ================================================================ 2. the mock keeps the contract */
  section('2. mock service keeps the API contract');
  const mock = createMock({ control: true }); await mock.listen();
  const E = { 'Content-Type': 'application/json', 'x-gc500-token': mock.options.editToken };
  const api = async (method, p, body, headers) => {
    const r = await fetch(mock.base + p, { method, headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}), body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
    const text = await r.text(); let j = null; try { j = JSON.parse(text); } catch (e) {}
    return { status: r.status, j, text, h: r.headers };
  };
  mock.setNow('2026-10-17T22:00:00Z');     /* Sun 18 Oct 08:00 AEST: before the event */
  const cardBody = extra => Object.assign({ load: 'servicing-tracker:GC500-2026', title: 'GC500 servicing tracker', run_date: FRI, expires: '2026-10-26', keys: [], targets: [], html, tracker: cfg }, extra || {});
  check('a bad tracker is refused with 400', (await api('POST', '/api/cards', cardBody({ tracker: { days: [], lines: [], plans: {} } }), E)).status === 400);
  const made = await api('POST', '/api/cards', cardBody(), E);
  const TOKEN = made.j && made.j.token, LINKS = made.j && made.j.tracker && made.j.tracker.links;
  check('the edit link makes the tracker card and gets 75 signed links', made.status === 200 && LINKS && Object.keys(LINKS).length === 75 && Object.values(LINKS).every(s => /^[A-Za-z0-9_-]{16}$/.test(s)), made.j);
  check('the view link cannot make cards', (await api('POST', '/api/cards', cardBody(), { 'x-gc500-token': mock.options.viewToken })).status === 403);
  check('a second live tracker for the load without a token: 409 with the existing token', (r => r.status === 409 && r.j.token === TOKEN)(await api('POST', '/api/cards', cardBody(), E)));
  check('re-posting the tracker card without its tracker: 409', (await api('POST', '/api/cards', cardBody({ token: TOKEN, tracker: undefined }), E)).status === 409);
  const repost = await api('POST', '/api/cards', cardBody({ token: TOKEN }), E);
  check('re-posting with the token keeps the token and the links', repost.status === 200 && repost.j.token === TOKEN && JSON.stringify(repost.j.tracker.links) === JSON.stringify(LINKS));
  const secretHex = mock.cards.get(TOKEN).secret.toString('hex'), secretB64 = mock.cards.get(TOKEN).secret.toString('base64');
  const BASE = mock.base + '/d/' + TOKEN;
  const tickUrl = (ref, base) => (base || BASE) + '#r=' + ref + '.' + LINKS[ref];
  const g0 = await api('GET', '/d/' + TOKEN + '/ticks?since=0');
  check('GET ticks answers now, epoch, seq, days, ticks', g0.status === 200 && g0.j.now && g0.j.epoch && g0.j.seq === 0 && Array.isArray(g0.j.days) && Array.isArray(g0.j.ticks), g0.j);
  const leak = [made.text, repost.text, g0.text, (await api('GET', '/api/ticks?token=' + TOKEN, null, E)).text].join('');
  check('the secret is in no answer', leak.indexOf(secretHex) < 0 && leak.indexOf(secretB64) < 0 && leak.indexOf(secretB64.replace(/=+$/, '')) < 0);
  check('links are not handed to phones', g0.text.indexOf(LINKS.WC07) < 0);
  check('sig = base64url(HMAC-SHA256(secret, token:REF)) cut to 16', LINKS.WC07 === sigFor(mock.cards.get(TOKEN).secret, TOKEN, 'WC07'));
  const mk = (o) => Object.assign({ id: 'contract' + Math.random().toString(36).slice(2, 12).padEnd(10, 'x'), ref: 'WC07', sig: LINKS.WC07, line: 'WC07-FWF', task: 'pump', day: FRI, done: true, undoes: [], tapped_at: new Date(mock.now()).toISOString() }, o);
  const post = (ticks, h) => api('POST', '/d/' + TOKEN + '/ticks', { ticks }, h);
  check('before the event a Friday tick is refused (day after the current service day)', (await post([mk()])).status === 400);
  mock.setNow('2026-10-23T12:00:00Z');     /* Fri 23 22:00 AEST */
  check('the wrong sig for a reference: 403', (await post([mk({ sig: LINKS.WC06 })])).status === 403);
  check('a line of another reference: 400', (await post([mk({ ref: 'WC06', sig: LINKS.WC06 })])).status === 400);
  check('a task not on the day\'s plan (lock on Friday): 400', (await post([mk({ task: 'lock' })])).status === 400);
  check('water on a waste tank: 400', (await post([mk({ ref: 'WC20', sig: LINKS.WC20, line: 'WC20-WASTETAN', task: 'water' })])).status === 400);
  check('21 ticks in one post: 400', (await post(Array.from({ length: 21 }, () => ({})))).status === 400);
  check('a post over 2 KB: 413', (await api('POST', '/d/' + TOKEN + '/ticks', JSON.stringify({ ticks: [mk()], pad: 'x'.repeat(2100) }))).status === 413);
  check('a short id: 400', (await post([mk({ id: 'short' })])).status === 400);
  check('an untick that names nothing: 400', (await post([mk({ done: false, undoes: [] })])).status === 400);
  check('report routes on a tracker card: 404', (await api('POST', '/d/' + TOKEN + '/report', {})).status === 404 && (await api('POST', '/d/' + TOKEN + '/report/scoped', {})).status === 404);
  check('prototype names are not tokens (propertyIsEnumerable, constructor)', (await api('GET', '/d/propertyIsEnumerable/ticks')).status === 404 && (await api('GET', '/d/constructor_constructor_x/ticks')).status === 404);
  check('the card page is served under the card CSP read from server.js', (await api('GET', '/d/' + TOKEN)).h.get('content-security-policy') === cardCspFromServer(SERVER_JS)(cardScriptHash(html)));
  const csp = (await api('GET', '/d/' + TOKEN)).h.get('content-security-policy');
  check('that CSP is the v5.87 card policy word for word', csp === "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; script-src '" + cardScriptHash(html) + "'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'", csp);

  /* ================================================================ browser */
  const browser = await chromium.launch();
  const phones = [];
  async function phone(name, opts) {
    opts = opts || {};
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      extraHTTPHeaders: { 'X-Real-IP': opts.ip || ('10.0.0.' + (phones.length + 1)) } }, opts.ctx || {}));
    await ctx.addInitScript(() => {
      window.__cspv = []; document.addEventListener('securitypolicyviolation', e => window.__cspv.push(e.violatedDirective + ' ' + e.blockedURI));
      window.__lsget = []; const gi = Storage.prototype.getItem;
      Storage.prototype.getItem = function (k) { window.__lsget.push(String(k)); return gi.call(this, k); };
    });
    const page = await ctx.newPage();
    const P = { name, ctx, page, reqs: [], errors: [], posts: [] };
    page.on('request', r => { P.reqs.push({ url: r.url(), method: r.method(), t: Date.now() }); if (r.method() === 'POST') P.posts.push(r.postData()); });
    page.on('pageerror', e => P.errors.push('pageerror ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) P.errors.push(m.text()); });
    if (opts.clock) await page.clock.install({ time: Date.now() });
    phones.push(P); return P;
  }
  const live = P => P.page.waitForFunction(() => /^Live/.test(document.getElementById('status').textContent), null, { timeout: 20000 });
  /* a fresh load (a goto that only changes the # does not reload the page) */
  const open = async (P, url) => { await P.page.goto('about:blank'); await P.page.goto(url); await live(P); };
  /* pages on fake timers are watched from here, with real sleeps */
  const until = async (P, fn, arg, ms) => { const end = Date.now() + (ms || 10000); while (Date.now() < end) { if (await P.page.evaluate(fn, arg)) return true; await wait(150); } return false; };
  const liveSlow = P => until(P, () => /^Live/.test(document.getElementById('status').textContent), null, 15000);
  const settle = P => P.page.waitForFunction(() => window.svc1063 && window.svc1063.outbox().length === 0, null, { timeout: 30000 });
  const kick = P => P.page.evaluate(() => window.dispatchEvent(new Event('online')));
  const jobs = P => P.page.$$eval('[data-job]', bs => bs.map(b => ({ key: b.dataset.job, word: b.querySelector('b').textContent, sub: b.querySelector('small').textContent, pressed: b.getAttribute('aria-pressed'), cls: b.className, disabled: b.disabled })));
  const job = async (P, key) => (await jobs(P)).find(j => j.key === key);
  const bars = P => P.page.$$eval('#bars > div', ds => ds.map(d => ({ label: d.querySelector('.pn').textContent, pct: d.querySelector('em').textContent, meta: d.querySelector('.pm').textContent })));
  const areaPct = (P, n) => P.page.$eval('#a' + n + ' .apct', e => e.textContent).catch(() => null);
  const areaMeta = (P, n) => P.page.$eval('#a' + n + ' .ameta', e => e.textContent).catch(() => null);
  const pressedDay = P => P.page.$eval('.day[aria-pressed="true"]', b => b.dataset.day);
  const banners = P => P.page.$eval('#banners', e => e.textContent);
  const tap = async (P, key) => { await P.page.click('[data-job="' + key + '"]'); };
  const waitText = (P, sel, re, ms) => P.page.waitForFunction(([s, r]) => { const e = document.querySelector(s); return e && new RegExp(r).test(e.textContent); }, [sel, re.source || re], { timeout: ms || 20000 });
  const serverTicks = () => mock.ticks(TOKEN);
  const findTick = (q) => serverTicks().filter(t => Object.keys(q).every(k => t[k] === q[k]));
  const openArea = async (P, n) => { if (await P.page.$eval('#ah-' + n, b => b.getAttribute('aria-expanded')) !== 'true') await P.page.click('#ah-' + n); };

  /* ================================================================ 3. day from the service's clock */
  section('3. the service day comes from the service clock');
  const C = await phone('C (phone clock on Sat 24)');
  mock.setNow('2026-10-17T22:00:00Z');     /* the service says Sun 18 Oct 08:00 */
  await C.page.clock.setFixedTime(at('2026-10-24T10:00:00+10:00'));
  await C.page.goto(tickUrl('WC07')); await live(C);
  check('phone clock says Sat 24, service says 18 Oct: the card opens on Friday', await pressedDay(C) === FRI, await pressedDay(C));
  check('before the event the jobs are shut ("Opens Fri 23 08:00")', (await jobs(C)).every(j => j.disabled && /Opens Fri 23 08:00/.test(j.sub)), await jobs(C));
  check('a banner says servicing has not started', /Servicing has not started/.test(await banners(C)));
  const days = await C.page.evaluate(() => {
    const f = window.svc1063.autoDay, p = s => Date.parse(s);
    return [f(p('2026-10-22T07:59:59+10:00')), f(p('2026-10-22T08:00:00+10:00')), f(p('2026-10-23T07:59:00+10:00')), f(p('2026-10-23T08:00:00+10:00')),
      f(p('2026-10-25T23:59:00+10:00')), f(p('2026-10-26T07:59:00+10:00')), f(p('2026-10-26T09:00:00+10:00')), window.svc1063.svcDay(p('2026-10-24T08:00:00+10:00'))];
  });
  check('day boundaries: Thu 07:59:59 Fri, 08:00 Thu, Fri 07:59 Thu, 08:00 Fri, Sun late Sun, Mon 07:59 Sun, Mon 09:00 Sun', JSON.stringify(days) === JSON.stringify([FRI, '2026-10-22', '2026-10-22', FRI, SUN, SUN, SUN, SAT]), days);
  check('Thursday is labelled "if needed"', await C.page.$eval('#day-2026-10-22', b => b.textContent) === 'Thu 22if needed');
  await C.page.click('[data-job="WC07-FWF|pump"]', { force: true }).catch(() => {});
  check('a shut job cannot be ticked', (await C.page.evaluate(() => window.svc1063.outbox().length)) === 0);
  await C.ctx.close();

  /* pure rules */
  const pure = await (async () => {
    const P = await phone('pure'); await P.page.goto(BASE); await live(P);
    const r = await P.page.evaluate(() => {
      const S = window.svc1063, out = {};
      const ev = (id, o) => Object.assign({ id, ref: 'WC07', line: 'WC07-FWF', task: 'pump', day: '2026-10-23', done: true, undoes: [] }, o);
      const nowMs = Date.parse('2026-10-23T14:00:00Z');
      let st = S.jobStates([ev('a', { at: '2026-10-23T12:10:00Z', tapped_at: '2026-10-23T12:05:00Z' }), ev('b', { at: '2026-10-23T12:20:00Z', tapped_at: '2026-10-23T12:01:00Z' })], nowMs);
      out.earliest = new Date(st['WC07-FWF|pump|2026-10-23'].at).toISOString();
      st = S.jobStates([ev('a', { at: '2026-10-23T12:10:00Z', tapped_at: '2026-10-23T12:30:00Z' })], nowMs);
      out.notAfterAt = new Date(st['WC07-FWF|pump|2026-10-23'].at).toISOString();
      st = S.jobStates([ev('a', { tapped_at: '2026-10-23T20:00:00Z', local: true })], nowMs);
      out.notFuture = new Date(st['WC07-FWF|pump|2026-10-23'].at).toISOString();
      st = S.jobStates([ev('a', { at: '2026-10-23T12:10:00Z' }), ev('u', { done: false, undoes: ['a'], at: '2026-10-23T12:30:00Z' }), ev('b', { at: '2026-10-23T12:20:00Z' })], nowMs);
      out.untickNamesItsTick = !!st['WC07-FWF|pump|2026-10-23'] && new Date(st['WC07-FWF|pump|2026-10-23'].at).toISOString();
      st = S.jobStates([ev('a', { at: '2026-10-23T12:10:00Z' }), ev('u', { done: false, undoes: ['a'], line: 'WC06-FWF', ref: 'WC06' })], nowMs);
      out.untickOtherJobIgnored = !!st['WC07-FWF|pump|2026-10-23'];
      st = S.jobStates([ev('a', { at: '2026-10-23T12:10:00Z', voided: true })], nowMs);
      out.voided = !!st['WC07-FWF|pump|2026-10-23'];
      /* 99.x never shows 100: everything done but one waste tank (1 unit) */
      const all = [].concat.apply([], S.areas.map(a => a.refs)), done = {};
      all.forEach(rf => rf.lines.forEach(l => S.tasksFor(l, '2026-10-23').forEach(t => { if (l.id !== 'WC05-WASTETAN') done[l.id + '|' + t + '|2026-10-23'] = { at: nowMs }; })));
      const g = S.groupStats(all, '2026-10-23', done); out.almost = [g.d, g.w, g.pct, g.finished];
      return out;
    });
    await P.ctx.close(); return r;
  })();
  check('a job\'s time is the earliest tap of its uncancelled ticks', pure.earliest === '2026-10-23T12:01:00.000Z', pure);
  check('a job\'s time is never later than the service\'s own time for it', pure.notAfterAt === '2026-10-23T12:10:00.000Z', pure);
  check('a job\'s time is never in the future', pure.notFuture === '2026-10-23T14:00:00.000Z', pure);
  check('an untick cancels only the tick it names (a later tick from another phone stands)', pure.untickNamesItsTick === '2026-10-23T12:20:00.000Z', pure);
  check('an untick naming a tick of another job cancels nothing', pure.untickOtherJobIgnored === true);
  check('a voided tick counts for nothing', pure.voided === false);
  const WF = weight(ALL_REFS, FRI);
  check((WF - 1) + ' of ' + WF + ' shows 99%, never 100%, and no finish time', JSON.stringify(pure.almost) === JSON.stringify([WF - 1, WF, 99, 0]), pure.almost);

  /* ================================================================ 4. two phones: ticking limited by the QR code, percentages */
  section('4. two phones: one reference per QR code; area and overall percentages by units');
  mock.setNow('2026-10-23T12:00:00Z');     /* Fri 23 22:00 AEST */
  const A = await phone('A'), B = await phone('B');
  await B.page.goto(BASE); await live(B);
  check('no code: read-only overview, no tick buttons', (await B.page.$$('[data-job]')).length === 0 && /View only/.test(await B.page.textContent('#view')));
  check('the overview lists all 14 groups', (await B.page.$$('.area')).length === 14);
  check('the overview opens on the service day (Fri 23)', await pressedDay(B) === FRI);
  await A.page.goto(tickUrl('WC06')); await live(A);
  const r06 = REF.WC06, a5 = AREA_OF.WC06;
  check('completion mode: big reference, its area, units and asset numbers', await A.page.textContent('#refh') === 'WC06' && /Area 5/.test(await A.page.textContent('.refarea')) &&
    (await A.page.textContent('.count')) === r06.lines[0].qty + ' units at WC06' && (await A.page.textContent('.ltitle')) === r06.lines[0].label && (await A.page.textContent('.nos')).indexOf(r06.lines[0].nos.join(', ')) >= 0);
  const nav = await A.page.$eval('a.nav', a => ({ href: a.href, target: a.target }));
  check('Navigate opens Google Maps at the pin', nav.href === 'https://www.google.com/maps/dir/?api=1&destination=' + r06.pin[0] + ',' + r06.pin[1] && nav.target === '_blank', nav);
  let J = await jobs(A);
  check('Friday FWF jobs in Andrew\'s words: ' + words(r06.lines[0], FRI).join(' · '), JSON.stringify(J.map(j => j.word)) === JSON.stringify(words(r06.lines[0], FRI)), J.map(j => j.word));
  check('only this QR code\'s reference can be ticked', J.length > 0 && J.every(j => j.key.startsWith('WC06-')));
  check('jobs are big tap targets (at least 56 px high)', (await A.page.$$eval('[data-job]', bs => bs.every(b => b.getBoundingClientRect().height >= 56))));
  const w5 = weight(a5.refs, FRI), wAll = weight(ALL_REFS, FRI), q06 = r06.lines[0].qty;
  await tap(A, 'WC06-FWF|pump'); await settle(A);
  let t1 = findTick({ ref: 'WC06', task: 'pump' });
  check('the tap reached the service once, as WC06 · Pumped out · Fri 23', t1.length === 1 && t1[0].line === 'WC06-FWF' && t1[0].day === FRI && t1[0].done === true, t1);
  J = await jobs(A);
  check('the button shows "Done hh:mm" with the tap time', (J.find(j => j.key === 'WC06-FWF|pump') || {}).sub === 'Done ' + hm(tickTime(t1[0])), J);
  let BA = await bars(A);
  check('after the tap: this area ' + pctOf(q06, w5) + '% and everything ' + pctOf(q06, wAll) + '% (weighted by units)', BA[0].pct === pctOf(q06, w5) + '%' && BA[1].pct === pctOf(q06, wAll) + '%' && /Area 5/.test(BA[0].label), BA);
  check('the counts say the jobs done of the jobs there are', BA[0].meta.indexOf(q06 + ' of ' + w5 + ' jobs') >= 0 && BA[1].meta.indexOf(q06 + ' of ' + wAll + ' jobs') >= 0, BA);
  const tB = Date.now();
  await B.page.waitForFunction(p => { const e = document.querySelector('#a5 .apct'); return e && e.textContent === p; }, pctOf(q06, w5) + '%', { timeout: 19000 }).catch(() => {});
  check('phone B shows it within one 15 s poll (' + Math.round((Date.now() - tB) / 1000) + ' s)', await areaPct(B, 5) === pctOf(q06, w5) + '%', await areaPct(B, 5));
  await openArea(B, 5);
  const chipB = await B.page.$eval('#a5 .orow .chip.ok', c => c.textContent).catch(() => null);
  check('phone B shows the same time as phone A', chipB === 'Pumped out ' + hm(tickTime(t1[0])), chipB);
  for (const t of tasksOf(r06.lines[0], FRI).slice(1)) await tap(A, 'WC06-FWF|' + t);
  await settle(A);
  BA = await bars(A);
  check('WC06 all done: area 5 ' + pctOf(3 * q06, w5) + '%, 1 of 2 references', BA[0].pct === pctOf(3 * q06, w5) + '%' && /1 of 2 references/.test(BA[0].meta), BA);
  /* a second QR code scanned into the same open card */
  await A.page.evaluate(u => { location.hash = u.slice(u.indexOf('#')); }, tickUrl('WC07'));
  await A.page.waitForFunction(() => document.getElementById('refh') && document.getElementById('refh').textContent === 'WC07');
  const r07 = REF.WC07;
  check('scanning WC07 in the open card switches to WC07 (hashchange), 20 asset numbers shown', (await A.page.textContent('.ltitle')) === r07.lines[0].label && (await A.page.textContent('.nos')).indexOf(r07.lines[0].nos.join(', ')) >= 0 && r07.lines[0].nos.length === 20);
  check('the open card did not reload its page (no extra card open)', A.reqs.filter(r => r.method === 'GET' && /\/d\/[^/]+\/?$/.test(new URL(r.url).pathname)).length === 1);
  for (const t of tasksOf(r07.lines[0], FRI)) await tap(A, 'WC07-FWF|' + t);
  await settle(A);
  const area5 = serverTicks().filter(t => (t.ref === 'WC06' || t.ref === 'WC07') && t.done);
  const fin = hm(Math.max(...area5.map(tickTime)));
  BA = await bars(A);
  check('area 5 complete: 100% and "Area finished ' + fin + '" (its last job)', BA[0].pct === '100%' && BA[0].meta.indexOf('Area finished ' + fin) >= 0, BA);
  check('everything: ' + pctOf(w5, wAll) + '%', BA[1].pct === pctOf(w5, wAll) + '%', BA[1]);
  await kick(B); await B.page.waitForFunction(() => /Area finished/.test((document.querySelector('#a5 .ameta') || {}).textContent || ''), null, { timeout: 15000 }).catch(() => {});
  check('phone B: area 5 100%, finished ' + fin, await areaPct(B, 5) === '100%' && (await areaMeta(B, 5) || '').indexOf('Area finished ' + fin) >= 0, [await areaPct(B, 5), await areaMeta(B, 5)]);
  /* undo, with a confirm */
  await tap(A, 'WC07-FWF|clean');
  check('tapping a done job asks first', await A.page.$('.confirm') !== null && /Undo “Cleaned & restocked”/.test(await A.page.textContent('.confirm')));
  const postsBefore = A.posts.length;
  await A.page.click('[data-keep]'); await wait(300);
  check('"Keep it done" keeps it, nothing sent', (await job(A, 'WC07-FWF|clean')).pressed === 'true' && await A.page.$('.confirm') === null && A.posts.length === postsBefore);
  await tap(A, 'WC07-FWF|clean'); await A.page.click('[data-undo="WC07-FWF|clean"]'); await settle(A);
  const cleanTick = findTick({ ref: 'WC07', task: 'clean', done: true })[0], undo = findTick({ ref: 'WC07', task: 'clean', done: false })[0];
  check('the undo is sent as done:false naming the tick it cancels', undo && JSON.stringify(undo.undoes) === JSON.stringify([cleanTick.id]) && A.posts.length === postsBefore + 1, undo);
  const after = 3 * q06 + 3 * r07.lines[0].qty - r07.lines[0].qty;
  BA = await bars(A);
  check('after the undo: area 5 back to ' + pctOf(after, w5) + '%, no finish time', BA[0].pct === pctOf(after, w5) + '%' && BA[0].meta.indexOf('finished') < 0 && (await job(A, 'WC07-FWF|clean')).pressed === 'false', BA);
  await kick(B); await B.page.waitForFunction(p => (document.querySelector('#a5 .apct') || {}).textContent === p, pctOf(after, w5) + '%', { timeout: 15000 }).catch(() => {});
  check('phone B follows the undo', await areaPct(B, 5) === pctOf(after, w5) + '%' && (await areaMeta(B, 5) || '').indexOf('finished') < 0);
  /* a QR code for one reference cannot tick another */
  await A.page.evaluate(s => { location.hash = '#r=WC07.' + s; }, LINKS.WC06);
  await A.page.waitForFunction(() => (document.getElementById('refh') || {}).textContent === 'WC07');
  const before07 = serverTicks().length;
  await tap(A, 'WC07-FWF|clean');
  await A.page.waitForFunction(() => /Not saved/.test(document.getElementById('banners').textContent), null, { timeout: 15000 }).catch(() => {});
  check('WC06\'s code on WC07: the service refuses it (403), the card says so and drops it', serverTicks().length === before07 && /Not saved:.*WC07.*Cleaned & restocked.*not the one printed for WC07/.test(await banners(A)) && (await job(A, 'WC07-FWF|clean')).pressed === 'false', await banners(A));
  await A.page.click('[data-dismiss="n0"]');
  await A.page.evaluate(() => { location.hash = '#r=WC07'; });
  await A.page.waitForFunction(() => window.svc1063.mode() === 'view');
  check('a code with no signature: view only, says so, no tick buttons', (await A.page.$$('[data-job]')).length === 0 && /no completion code/.test(await banners(A)));
  await A.page.evaluate(() => { location.hash = '#r=ZZ99.abcdefghijklmnop'; });
  await A.page.waitForFunction(() => /not on this tracker/.test(document.getElementById('banners').textContent));
  check('a code for a reference not on the tracker: view only', (await A.page.$$('[data-job]')).length === 0);

  /* ================================================================ 5. offline, then signal back */
  section('5. no signal: the outbox keeps the taps, then sends them');
  mock.setNow('2026-10-23T13:00:00Z');     /* Fri 23 23:00 */
  await open(A, tickUrl('WC41'));
  await A.ctx.setOffline(true);
  for (const t of tasksOf(REF.WC41.lines[0], FRI)) await tap(A, 'WC41-FWF|' + t);
  await A.page.waitForFunction(() => /3 ticks waiting/.test(document.getElementById('status').textContent), null, { timeout: 15000 }).catch(() => {});
  check('offline: "No signal · 3 ticks waiting"', /No signal · 3 ticks waiting/.test(await A.page.textContent('#status')), await A.page.textContent('#status'));
  check('offline: the jobs show as waiting for signal', (await jobs(A)).every(j => /pending/.test(j.cls) && /waiting for signal/.test(j.sub)));
  check('offline: 3 in the outbox on the phone, none on the service', (await A.page.evaluate(t => JSON.parse(localStorage.getItem('gc500.svc1063.' + t + '.outbox')).length, TOKEN)) === 3 && findTick({ ref: 'WC41' }).length === 0);
  const area6 = AREA_OF.WC41, w6 = weight(area6.refs, FRI), q41 = REF.WC41.lines[0].qty;
  check('offline: the area percentage already counts them (' + pctOf(3 * q41, w6) + '%)', (await bars(A))[0].pct === pctOf(3 * q41, w6) + '%');
  mock.setNow('2026-10-23T13:05:00Z');     /* five minutes later */
  await A.ctx.setOffline(false);
  await settle(A);
  const t41 = findTick({ ref: 'WC41' });
  check('signal back: the outbox drains, 3 on the service', t41.length === 3, t41.length);
  check('each keeps the time it was tapped (earlier than the service received it)', t41.length === 3 && t41.every(t => Date.parse(t.tapped_at) < Date.parse(t.at) - 60000), t41.map(t => [t.tapped_at, t.at]));
  J = await jobs(A);
  check('the buttons show the tap time, not the arrival time', J.length === 3 && J.every(j => { const t = t41.find(x => x.task === j.key.split('|')[1]); return t && j.sub === 'Done ' + hm(tickTime(t)) && j.sub !== 'Done ' + hm(Date.parse(t.at)); }), J.map(j => j.sub));
  await kick(B); await B.page.waitForFunction(p => (document.querySelector('#a6 .apct') || {}).textContent === p, pctOf(3 * q41, w6) + '%', { timeout: 15000 }).catch(() => {});
  check('phone B sees them', await areaPct(B, 6) === pctOf(3 * q41, w6) + '%', await areaPct(B, 6));

  /* ================================================================ 6. an offline untick never wipes another phone's later tick */
  section('6. offline untick against a later tick from another phone');
  await open(B, tickUrl('WC11'));
  await B.ctx.setOffline(true);                             /* B has the card open, then loses signal */
  await open(A, tickUrl('WC11'));
  await tap(A, 'WC11-FWF|pump'); await settle(A);
  const a1 = findTick({ ref: 'WC11', task: 'pump' })[0];
  await A.ctx.setOffline(true);
  await tap(A, 'WC11-FWF|pump'); await A.page.click('[data-undo="WC11-FWF|pump"]');
  check('A (offline) queues an untick naming its own tick', JSON.stringify((await A.page.evaluate(() => window.svc1063.outbox()))[0].undoes) === JSON.stringify([a1.id]));
  mock.setNow('2026-10-23T13:15:00Z');
  await tap(B, 'WC11-FWF|pump');                             /* B services it again, offline */
  await B.ctx.setOffline(false); await settle(B);
  await A.ctx.setOffline(false); await settle(A);
  const w11 = findTick({ ref: 'WC11', task: 'pump' });
  check('the service holds A\'s tick, B\'s tick, then A\'s untick (arrival order)', w11.length === 3 && w11[2].done === false && w11[2].seq > w11[1].seq, w11.map(t => [t.done, t.seq]));
  await kick(A); await kick(B); await wait(1500);
  const bTick = w11.find(t => t.done && t.id !== a1.id);
  check('WC11 · Pumped out still done on both phones, at B\'s time', (await job(A, 'WC11-FWF|pump')).pressed === 'true' && (await job(B, 'WC11-FWF|pump')).pressed === 'true' &&
    (await job(A, 'WC11-FWF|pump')).sub === 'Done ' + hm(tickTime(bTick)), [await job(A, 'WC11-FWF|pump'), await job(B, 'WC11-FWF|pump')]);

  /* ================================================================ 7. reply lost: the retry is not counted twice */
  section('7. a lost reply is retried and counted once');
  await open(A, tickUrl('WC50'));
  let cut = false;
  await A.page.route('**/ticks', async route => {
    if (route.request().method() === 'POST' && !cut) { cut = true; await route.fetch(); await route.abort(); } else await route.continue();
  });
  await tap(A, 'WC50-FWF|pump');
  await A.page.waitForFunction(() => window.svc1063.outbox().length === 0, null, { timeout: 30000 }).catch(() => {});
  const w50 = findTick({ ref: 'WC50', task: 'pump' });
  check('the service got it on the first try, the card retried, exactly 1 stored', cut && w50.length === 1 && mock.log.filter(l => l.what === 'ticks' && l.already === 1).length >= 1, { stored: w50.length });
  await A.page.unroute('**/ticks');

  /* ================================================================ 8. a queued tick for a line taken off the tracker */
  section('8. a tick the service will not take is dropped with a message; the rest go');
  await open(A, tickUrl('WC86'));
  await A.ctx.setOffline(true);
  await tap(A, 'WC86-ACCESSIB|pump');
  await A.page.evaluate(u => { location.hash = u.slice(u.indexOf('#')); }, tickUrl('WC19'));
  await A.page.waitForFunction(() => (document.getElementById('refh') || {}).textContent === 'WC19');
  await tap(A, 'WC19-FWF|pump');
  const cut86 = Object.assign({}, cfg, { lines: cfg.lines.filter(l => l.ref !== 'WC86') });
  check('(edit link re-posts the tracker without WC86)', (await api('POST', '/api/cards', cardBody({ token: TOKEN, tracker: cut86 }), E)).status === 200);
  const posts86 = A.posts.length;
  await A.ctx.setOffline(false); await settle(A);
  check('the service named the refused tick, so the rest went in one more post (2 posts)', A.posts.length - posts86 === 2, A.posts.length - posts86);
  check('WC86 dropped with a plain message naming it', /Not saved:.*WC86.*Accessible toilet.*Pumped out/.test(await banners(A)) && findTick({ ref: 'WC86' }).length === 0, await banners(A));
  check('WC19 went through', findTick({ ref: 'WC19', task: 'pump' }).length === 1);
  check('(tracker restored)', (await api('POST', '/api/cards', cardBody({ token: TOKEN }), E)).status === 200);
  const noThu = Object.assign({}, cfg, { days: cfg.days.filter(d => d.id !== '2026-10-22') });
  await api('POST', '/api/cards', cardBody({ token: TOKEN, tracker: noThu }), E); await kick(A);
  await A.page.waitForFunction(() => /changed on the service/.test(document.getElementById('banners').textContent), null, { timeout: 10000 }).catch(() => {});
  check('when the service\'s tracker days no longer match the card, it says "Reload"', /changed on the service/.test(await banners(A)) && await A.page.$('[data-reload]') !== null);
  await api('POST', '/api/cards', cardBody({ token: TOKEN }), E);
  await A.page.click('[data-reload]'); await live(A);
  check('Reload loads the card again and the banner goes', !/changed on the service/.test(await banners(A)) && A.reqs.filter(r => r.method === 'GET' && new URL(r.url).pathname === '/d/' + TOKEN).length >= 2);

  /* ================================================================ 9. the service recovered from a snapshot */
  section('9. epoch change: the phone re-reads and re-sends what the service lost');
  await open(A, tickUrl('WC50'));
  await tap(A, 'WC50-FWF|water'); await tap(A, 'WC50-FWF|clean'); await settle(A);
  const lostIds = findTick({ ref: 'WC50' }).filter(t => t.task !== 'pump').map(t => t.id);
  const rec = mock.recover(TOKEN, 2);
  check('(service loses the newest 2 ticks, new epoch, seq reused)', rec.lost === 2 && lostIds.every(id => !serverTicks().some(t => t.id === id)), rec);
  await kick(A);
  await A.page.waitForFunction(() => window.svc1063.outbox().length === 0, null, { timeout: 20000 }).catch(() => {});
  await wait(1500); await kick(A); await wait(1000);
  check('the phone re-sent them (same ids)', lostIds.every(id => serverTicks().some(t => t.id === id)), serverTicks().filter(t => t.ref === 'WC50').map(t => t.id));
  check('and still shows WC50 done', (await jobs(A)).every(j => j.pressed === 'true'));
  /* void (edit link): the phones follow */
  const v = await api('POST', '/api/ticks/void', { token: TOKEN, ids: lostIds }, E);
  await kick(A); await A.page.waitForFunction(() => document.querySelectorAll('[data-job][aria-pressed="true"]').length === 1, null, { timeout: 15000 }).catch(() => {});
  await wait(1500);
  check('ticks voided on the edit link drop off the phone and are not re-sent', v.status === 200 && (await jobs(A)).filter(j => j.pressed === 'true').length === 1 && serverTicks().filter(t => lostIds.indexOf(t.id) >= 0).every(t => t.voided), await jobs(A));

  /* ================================================================ 10. too many at once */
  section('10. 429: the phone waits as told');
  await api('POST', '/__mock/limits', { perAddrPerMin: 1, retryAfter: 3 });
  await open(A, tickUrl('WC23'));
  await tap(A, 'WC23-FWF|pump'); await settle(A);
  await tap(A, 'WC23-FWF|water');
  await A.page.waitForFunction(() => /^Busy · trying again/.test(document.getElementById('status').textContent), null, { timeout: 10000 }).catch(() => {});
  check('"Busy · trying again in …" while held back', /^Busy · trying again in \d+ s/.test(await A.page.textContent('#status')), await A.page.textContent('#status'));
  await api('POST', '/__mock/limits', { perAddrPerMin: 120, retryAfter: 0 });
  await settle(A);
  check('then it goes', findTick({ ref: 'WC23', task: 'water' }).length === 1);

  /* 503: the service cannot check codes */
  mock.mode.noKey = true;
  await tap(A, 'WC23-FWF|clean');
  await A.page.waitForFunction(() => /cannot check completion codes/.test(document.getElementById('banners').textContent), null, { timeout: 10000 }).catch(() => {});
  check('503 no_key: a banner, the tick kept on the phone', /cannot check completion codes/.test(await banners(A)) && (await A.page.evaluate(() => window.svc1063.outbox().length)) === 1);
  mock.mode.noKey = false; await kick(A); await settle(A);
  check('and it goes once the service can', findTick({ ref: 'WC23', task: 'clean' }).length === 1 && !/cannot check/.test(await banners(A)));

  /* ================================================================ 11. Sunday */
  section('11. Sunday: lock added, no water; waste tanks pump only; blocks as the data says');
  mock.setNow('2026-10-25T11:00:00Z');     /* Sun 25 21:00 */
  await open(A, tickUrl('WC20'));
  J = await jobs(A);
  const wc20 = REF.WC20;
  check('opens on Sunday', await pressedDay(A) === SUN);
  check('WC20 block (' + wc20.lines[0].kind + '): ' + words(wc20.lines[0], SUN).join(' · '), JSON.stringify(J.filter(j => j.key.startsWith(wc20.lines[0].id + '|')).map(j => j.word)) === JSON.stringify(words(wc20.lines[0], SUN)), J);
  check('WC20 waste tank: Pumped out only', JSON.stringify(J.filter(j => j.key.startsWith('WC20-WASTETAN|')).map(j => j.word)) === JSON.stringify(['Pumped out']));
  await A.page.evaluate(u => { location.hash = u.slice(u.indexOf('#')); }, tickUrl('WC17'));
  await A.page.waitForFunction(() => (document.getElementById('refh') || {}).textContent === 'WC17');
  check('WC17 block: ' + words(REF.WC17.lines[0], SUN).join(' · '), JSON.stringify((await jobs(A)).map(j => j.word)) === JSON.stringify(words(REF.WC17.lines[0], SUN)));
  await A.page.evaluate(u => { location.hash = u.slice(u.indexOf('#')); }, tickUrl('WC07'));
  await A.page.waitForFunction(() => (document.getElementById('refh') || {}).textContent === 'WC07');
  J = await jobs(A);
  check('FWF on Sunday: Pumped out · Cleaned & restocked · Locked & confirmed empty (no water)', JSON.stringify(J.map(j => j.word)) === JSON.stringify(['Pumped out', 'Cleaned & restocked', 'Locked & confirmed empty']) && !/Fresh water/.test(await A.page.textContent('#view')), J.map(j => j.word));
  await tap(A, 'WC07-FWF|lock'); await settle(A);
  check('Locked & confirmed empty is accepted on Sunday', findTick({ ref: 'WC07', task: 'lock', day: SUN }).length === 1);
  check('Sunday counts ' + weight(ALL_REFS, SUN) + ' jobs', (await bars(A))[1].meta.indexOf(' of ' + weight(ALL_REFS, SUN) + ' jobs') >= 0, await bars(A));
  await A.page.click('#day-' + FRI);
  check('Friday chosen: loud banner names it; Friday\'s jobs include the water', /You are on Friday 23's service/i.test(await banners(A)) && (await jobs(A)).map(j => j.word).indexOf('Fresh water refilled') >= 0);
  check('Friday\'s WC07 ticks still show on Friday', (await job(A, 'WC07-FWF|pump')).pressed === 'true');
  await A.page.click('[data-back]');
  check('"Back to Sunday 25" returns to today', await pressedDay(A) === SUN && !/You are on/.test(await banners(A)));

  /* ================================================================ 12. 08:00: the day moves on; a chosen day lapses */
  section('12. 08:00 change-over and the day chosen by hand');
  mock.setNow('2026-10-24T21:59:20Z');     /* Sun 25 07:59:20: still Saturday's service */
  await open(A, tickUrl('WC10'));
  check('07:59 Sunday morning is Saturday\'s service', await pressedDay(A) === SAT);
  await tap(A, 'WC10-FWF|pump'); await settle(A);
  mock.setNow('2026-10-24T22:00:20Z');     /* 08:00:20 */
  await kick(A); await A.page.waitForFunction(d => (document.querySelector('.day[aria-pressed="true"]') || {}).dataset.day === d, SUN, { timeout: 15000 }).catch(() => {});
  check('at 08:00 the card moves on to Sunday by itself and says so', await pressedDay(A) === SUN && /Now Sunday 25's service/.test(await banners(A)), await banners(A));
  check('a crew that ticked in the last hour is offered "Stay on Saturday 24"', await A.page.$('[data-stay="' + SAT + '"]') !== null);
  await A.page.click('[data-stay="' + SAT + '"]');
  check('staying: loud banner "You are on Saturday 24\'s service"', await pressedDay(A) === SAT && /You are on Saturday 24's service/i.test(await banners(A)));
  await tap(A, 'WC10-FWF|water'); await settle(A);
  check('a late tick lands on Saturday (a past day is accepted)', findTick({ ref: 'WC10', task: 'water', day: SAT }).length === 1);
  mock.setNow('2026-10-25T22:00:30Z');     /* Mon 26 08:00:30: the choice lapses */
  await kick(A); await A.page.waitForFunction(d => (document.querySelector('.day[aria-pressed="true"]') || {}).dataset.day === d, SUN, { timeout: 15000 }).catch(() => {});
  check('at the next 08:00 the chosen day lapses (after the event it stays on Sunday)', await pressedDay(A) === SUN && !/You are on/.test(await banners(A)), await banners(A));
  mock.setNow('2026-10-24T12:00:00Z');     /* Sat 24 22:00 */
  await open(A, tickUrl('WC10'));
  await A.page.click('#day-' + SUN);
  check('a day not started yet can be looked at but not ticked', (await jobs(A)).every(j => j.disabled && /Opens Sun 25 08:00/.test(j.sub)) && /You are on Sunday 25's service/i.test(await banners(A)));

  /* ================================================================ 13. address with a trailing slash */
  section('13. /d/<token>/ works the same');
  await open(A, tickUrl('WC28', BASE + '/'));
  await tap(A, 'WC28-FWF|pump'); await settle(A);
  const slashReqs = A.reqs.filter(r => /\/ticks/.test(r.url));
  check('ticks go to /d/<token>/ticks, never //ticks', findTick({ ref: 'WC28' }).length === 1 && slashReqs.every(r => new URL(r.url).pathname === '/d/' + TOKEN + '/ticks'), slashReqs.slice(-3).map(r => r.url));

  /* paging: the service sends a few at a time with more:true */
  await api('POST', '/__mock/limits', { pageSize: 4 });
  const PG = await phone('paging');
  await PG.page.goto(BASE); await live(PG); await wait(500);
  const pages = PG.reqs.filter(r => r.method === 'GET' && /\/ticks\?since=/.test(r.url)).map(r => +new URL(r.url).searchParams.get('since'));
  const visible = serverTicks().filter(t => !t.voided).length;
  await api('POST', '/__mock/limits', { pageSize: 500 });
  const bigA = await phone('paging check'); await bigA.page.goto(BASE); await live(bigA);
  const m1 = (await bars(PG))[0].meta, m2 = (await bars(bigA))[0].meta;
  check('read in pages of 4 (' + pages.length + ' reads for ' + visible + ' ticks), the same totals as one read', pages.length >= Math.ceil(visible / 4) && pages.every((x, i) => i === 0 || x > pages[i - 1]) && m1 === m2, { pages, m1, m2 });
  await PG.ctx.close(); await bigA.ctx.close();

  /* ================================================================ 14. what the phone keeps and sends */
  section('14. storage, names, CSP, requests');
  for (const P of [A, B]) {
    const keys = await P.page.evaluate(() => Object.keys(localStorage));
    const got = await P.page.evaluate(() => window.__lsget);
    check(P.name + ': localStorage holds only gc500.svc1063.* keys', keys.length > 0 && keys.every(k => k.startsWith('gc500.svc1063.')), keys);
    check(P.name + ': never reads gc500.edit, gc500.view or any other key', got.every(k => k.startsWith('gc500.svc1063.')), got.filter(k => !k.startsWith('gc500.svc1063.')));
    check(P.name + ': no Content-Security-Policy violation', (await P.page.evaluate(() => window.__cspv)).length === 0, await P.page.evaluate(() => window.__cspv));
    check(P.name + ': every request stayed on the service (127.0.0.1)', P.reqs.every(r => new URL(r.url).hostname === '127.0.0.1'), P.reqs.filter(r => new URL(r.url).hostname !== '127.0.0.1').map(r => r.url));
    check(P.name + ': no script errors', P.errors.length === 0, P.errors);
  }
  const bodies = [A, B].flatMap(P => P.posts).filter(Boolean).map(b => JSON.parse(b));
  const keysSent = [...new Set(bodies.flatMap(b => b.ticks.flatMap(t => Object.keys(t))))].sort();
  check('ticks carry only id, ref, sig, line, task, day, done, undoes, tapped_at (no names)', JSON.stringify(keysSent) === JSON.stringify(['day', 'done', 'id', 'line', 'ref', 'sig', 'tapped_at', 'task', 'undoes']), keysSent);
  check('every post stays under 2 KB', bodies.every(b => JSON.stringify(b).length <= 2048));
  check('the page renders no on* attribute anywhere', await A.page.evaluate(() => [...document.querySelectorAll('*')].every(el => [...el.attributes].every(a => !/^on/i.test(a.name)))));
  /* hostile text in the data is drawn as text (escaped), even without the CSP to stop it */
  const H = await phone('hostile');
  await H.page.goto(mock.base + '/health');
  const evil = JSON.parse(JSON.stringify(DATA)); evil.areas[2].name = '<img src=x onerror="window.__pwn=1">"\'</script>'; evil.areas[2].refs[0].where = '<b onmouseover=alert(1)>x</b>';
  await H.page.setContent(buildCardHtml(evil)); await wait(800);
  await H.page.click('#ah-3').catch(() => {}); await wait(300);
  check('hostile text in the data shows as text and runs nothing', await H.page.evaluate(() => window.__pwn === undefined && !document.querySelector('#view img') && /<img src=x onerror/.test(document.getElementById('a3').textContent)));
  await H.ctx.close();
  check('every button has words a screen reader can read', await A.page.evaluate(() => [...document.querySelectorAll('button')].every(b => (b.getAttribute('aria-label') || b.textContent).trim().length > 1)));

  /* ================================================================ 15. withdrawn, finished, being updated */
  section('15. withdrawn and finished stop the card; an older service answer waits');
  mock.setNow('2026-10-23T12:00:00Z');
  const mw = await api('POST', '/api/cards', cardBody({ load: 'servicing-tracker:TEST-W', title: 'test card W' }), E);
  const TW = mw.j.token, LW = mw.j.tracker.links;
  const W = await phone('W (fake timers)', { clock: true });
  await W.page.goto(mock.base + '/d/' + TW + '#r=WC12.' + LW.WC12); await liveSlow(W);
  await W.page.route('**/ticks', route => route.request().method() === 'POST' ? route.abort() : route.continue());
  await tap(W, 'WC12-FWF|pump'); await wait(500);
  await W.page.unroute('**/ticks');
  await api('DELETE', '/api/cards/' + TW, null, E);
  await W.page.clock.runFor(16000);
  await until(W, () => window.svc1063.final() === 'withdrawn');
  check('withdrawn: banner, ticking stops', await W.page.evaluate(() => window.svc1063.final()) === 'withdrawn' && /withdrawn/i.test(await banners(W)) && (await jobs(W)).every(j => j.disabled), await banners(W));
  check('withdrawn: the unsent tick is kept on the phone and said so', (await W.page.evaluate(() => window.svc1063.outbox().length)) === 1 && /1 unsent tick is kept/.test(await banners(W)));
  let n0 = W.reqs.filter(r => /\/ticks/.test(r.url)).length;
  await W.page.clock.runFor(61000);
  await W.page.evaluate(() => { window.dispatchEvent(new Event('online')); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new HashChangeEvent('hashchange')); });
  await wait(800);
  check('withdrawn: no request for 60 s, nor on signal, focus or a new scan', W.reqs.filter(r => /\/ticks/.test(r.url)).length === n0, W.reqs.slice(-3).map(r => r.method + ' ' + r.url));
  await W.ctx.close();
  /* finished (after Mon 26) */
  const X = await phone('X (fake timers)', { clock: true });
  await X.page.goto(tickUrl('WC12')); await liveSlow(X);
  mock.setNow('2026-10-26T14:30:00Z');     /* Tue 27 00:30 AEST: the card's expires day has passed */
  await X.page.clock.runFor(16000);
  await until(X, () => window.svc1063.final() === 'expired');
  check('finished (410): banner, ticking stops', await X.page.evaluate(() => window.svc1063.final()) === 'expired' && /Servicing has finished/.test(await banners(X)));
  n0 = X.reqs.filter(r => /\/ticks/.test(r.url)).length;
  await X.page.clock.runFor(61000); await wait(500);
  check('finished: no request for 60 s', X.reqs.filter(r => /\/ticks/.test(r.url)).length === n0);
  await X.ctx.close();
  /* an older service (rollback) answers the ticks route with its HTML 404 */
  mock.setNow('2026-10-23T12:00:00Z');
  const Y = await phone('Y (fake timers)', { clock: true });
  await Y.page.goto(tickUrl('WC12')); await liveSlow(Y);
  mock.mode.html404 = true;
  await Y.page.clock.runFor(16000);
  await until(Y, () => /being updated/.test(document.getElementById('banners').textContent));
  check('an HTML 404 (older service): "being updated", not stopped', /being updated/.test(await banners(Y)) && await Y.page.evaluate(() => window.svc1063.final()) === null);
  n0 = Y.reqs.filter(r => /\/ticks/.test(r.url)).length;
  await Y.page.clock.runFor(30000); await wait(400);
  const n30 = Y.reqs.filter(r => /\/ticks/.test(r.url)).length;
  await Y.page.clock.runFor(31000); await wait(800);
  const n61 = Y.reqs.filter(r => /\/ticks/.test(r.url)).length;
  check('it tries again after 60 s, not sooner', n30 === n0 && n61 === n0 + 1, { n0, n30, n61 });
  mock.mode.html404 = false;
  await Y.page.clock.runFor(61000);
  await liveSlow(Y);
  check('when the service is back the card carries on', /^Live/.test(await Y.page.textContent('#status')) && !/being updated/.test(await banners(Y)));
  await Y.ctx.close();

  /* ================================================================ 16. 360 px, light and dark */
  section('16. 360 px phone, light and dark: no sideways scroll; screenshots');
  mock.setNow('2026-10-23T14:14:00Z');     /* Sat 00:14, Friday's service */
  for (const [scheme, ref, key] of [['light', 'WC09', 'WC09-FWF|pump'], ['dark', 'WC31', 'WC31-ACCESSIB|pump']]) {
    const S = await phone('360 ' + scheme, { ctx: { viewport: { width: 360, height: 740 }, colorScheme: scheme } });
    await S.page.goto(tickUrl(ref)); await live(S);
    await tap(S, key); await settle(S);
    const sw1 = await S.page.evaluate(() => document.documentElement.scrollWidth);
    await S.page.screenshot({ path: path.join(EVID, 'card_tick_' + ref + '_' + scheme + '_360.png'), fullPage: true });
    await tap(S, key);
    await S.page.screenshot({ path: path.join(EVID, 'card_undo_confirm_' + scheme + '_360.png') });
    check(scheme + ': the undo confirm is in view when it opens (clear of the header)', await S.page.$eval('.confirm', e => { const r = e.getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect(); return r.top >= h.bottom - 1 && r.bottom <= window.innerHeight; }));
    await open(S, BASE + '#a7');
    const sw2 = await S.page.evaluate(() => document.documentElement.scrollWidth);
    check(scheme + ': #a7 opens area 7 clear of the header', await S.page.evaluate(() => { const a = document.getElementById('a7').getBoundingClientRect(), h = document.querySelector('header').getBoundingClientRect(); return a.top >= h.bottom - 1 && a.top < window.innerHeight / 2; }));
    await S.page.screenshot({ path: path.join(EVID, 'card_overview_' + scheme + '_360.png') });
    check(scheme + ': no sideways scroll at 360 px (tick ' + sw1 + ', overview ' + sw2 + ')', sw1 <= 360 && sw2 <= 360);
    check(scheme + ': day buttons at least 44 px', await S.page.$$eval('.day', bs => bs.every(b => b.getBoundingClientRect().height >= 44)));
    check(scheme + ': no CSP violation, no script error', (await S.page.evaluate(() => window.__cspv)).length === 0 && S.errors.length === 0, S.errors);
    await S.ctx.close();
  }

  await browser.close(); await mock.close();
  console.log('\n' + pass + ' passed, ' + fail + ' failed in ' + Math.round((Date.now() - t0) / 1000) + ' s' + (fail ? '\nFAILED: ' + fails.join(' | ') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
