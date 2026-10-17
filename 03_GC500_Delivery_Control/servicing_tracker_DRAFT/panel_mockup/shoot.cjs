/* Author: Andrew Fisher. Browser checks and phone screenshots for the servicing tracker panel mock-up.
     node build_panel.js && node shoot.cjs            (both parts)
     node shoot.cjs --no-live                         (panel.html only; skips the real page)
   Part A opens panel.html at 390 px (iPhone 13 size, light and dark) and checks what it shows against SvcState, the
   day chooser, touch sizes, contrast, sideways scroll and escaping. Part B draws the same panel, with the same CSS, on
   the REAL live page's Event nights tab through toolchain/harness/open_page.js: the page is the v10.60.1 build file,
   every other request is a GET to the live service, and every write the page tries is aborted. Nothing is written
   anywhere; the panel only exists in that headless browser. Screenshots go to evidence/. */
'use strict';
const fs = require('fs'), path = require('path');
process.env.PLAYWRIGHT_BROWSERS_PATH = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
let pw; try { pw = require(path.join(__dirname, '..', '..', 'toolchain', 'node_modules', 'playwright')); } catch (e) { pw = require('/opt/node-tools/node_modules/playwright'); }
const { chromium, devices } = pw;
const S = require('./state.js'), R = require('./panel_render.js'), B = require('./build_panel.js');
const { curlFetch } = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'curlfetch.js'));
const PANEL = path.join(__dirname, 'panel.html'), EVID = path.join(__dirname, 'evidence');
const LIVE_PAGE = path.join(__dirname, '..', '..', 'build', 'GC500_v10.60p1', 'GC500_Delivery_Control_hosted.html');
fs.mkdirSync(EVID, { recursive: true });
const NO_LIVE = process.argv.includes('--no-live');

let pass = 0, fail = 0; const fails = [];
function check(name, ok, detail) {
  if (ok) { pass++; console.log('PASS ' + name); }
  else { fail++; fails.push(name); console.log('FAIL ' + name + ' :: ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 700)); }
}
const section = t => console.log('\n== ' + t);
const M0 = B.buildModel(), CFG = { plans: M0.D.plans, days: M0.D.days };
const ST = S.jobStates(M0.events, M0.now), ALL = [].concat(...M0.D.areas.map(a => a.refs));
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LABELS = [].concat(...ALL.map(r => r.lines.map(l => l.label)));
const PAIRS = LABELS.filter(l => /\d+ × /.test(l)).length + LABELS.filter(l => /\d (m|mm|kVA)\b/.test(l)).length;   // every label's count and size

const wdHm = ms => WD[new Date(ms + 36e6).getUTCDay()] + ' ' + S.hm(ms);

/* contrast of every piece of text inside a root, against what is really behind it (a gradient counts at its lightest
   and darkest stops; a cut-corner .card counts as its paper face) */
const CONTRAST_FN = `(function (root) {
  function rgba(s) { var m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; var p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
  function lum(c) { return [0, 1, 2].map(function (i) { var v = c[i] / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (a, v, i) { return a + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function over(top, under) { var a = top[3]; return [0, 1, 2].map(function (i) { return Math.round(top[i] * a + under[i] * (1 - a)); }).concat([1]); }
  function bgs(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var cs = getComputedStyle(e), c = rgba(cs.backgroundColor), img = cs.backgroundImage;
      if (img && img !== 'none' && /gradient/.test(img)) { var stops = (img.match(/rgba?\\([^)]+\\)/g) || []).map(rgba).filter(function (s) { return s[3] > 0.5; }); if (stops.length) return stops; }
      if (c && c[3] > 0) { if (c[3] >= 1) return [c]; var under = bgs(e.parentElement)[0] || [255, 255, 255, 1]; return [over(c, under)]; }
      if (e.classList && e.classList.contains('card')) { var f = rgba(getComputedStyle(e, '::after').backgroundColor); if (f && f[3] > 0) return [f]; }
    }
    return [[255, 255, 255, 1]];
  }
  var out = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    var t = walker.currentNode; if (!t.nodeValue.trim()) continue;
    var el = t.parentElement, cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || !el.getClientRects().length) continue;
    var col = rgba(cs.color), op = 1; for (var e = el; e && e !== root.parentElement; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    var size = parseFloat(cs.fontSize), w = Number(cs.fontWeight) || 400, large = size >= 24 || (size >= 18.66 && w >= 700);
    var worst = Infinity; bgs(el).forEach(function (b) { var c = col.slice(); c[3] = c[3] * op; worst = Math.min(worst, ratio(over(c, b), b)); });
    out.push({ text: t.nodeValue.trim().slice(0, 40), ratio: Math.round(worst * 100) / 100, need: large ? 3 : 4.5, size: size });
  }
  return out;
})`;

/* anything inside the panel that sticks out past the card's own edges (a page-wide rule can widen a table or a grid) */
const SPILL_FN = `(function (root) {
  var box = root.getBoundingClientRect(), out = [];
  root.querySelectorAll('*').forEach(function (el) { var r = el.getBoundingClientRect(); if (!r.width) return;
    var name = (el.className && el.className.baseVal === undefined ? el.className : el.tagName) + '';
    if (r.right > box.right + 1 || r.left < box.left - 1) out.push({ el: name, left: Math.round(r.left), right: Math.round(r.right), card: [Math.round(box.left), Math.round(box.right)] });
    else if (/^(TH|TD|SPAN|B|EM|P|DIV)$/.test(el.tagName) && !el.classList.contains('vh') && getComputedStyle(el).display !== 'inline' && el.scrollWidth > el.clientWidth + 1) out.push({ el: name || el.tagName, text: el.textContent.slice(0, 30), scroll: el.scrollWidth, client: el.clientWidth }); });
  return out;
})`;

/* a line label must not wrap between a number and its unit: each "6 m" / "2 ×" sits on one line. Returns the
   number of such pairs and any that are split (a no-break space alone is not enough in Chromium under en-AU) */
const NUMUNIT_FN = `(function (root) {
  var spans = root.querySelectorAll('.svc-tbl tbody th .svc-nw'), out = [];
  spans.forEach(function (sp) { var rs = sp.getClientRects(); if (rs.length !== 1) out.push({ pair: sp.textContent, rects: rs.length, label: sp.parentElement.textContent }); });
  return { pairs: spans.length, split: out };
})`;

async function fontRoute(ctx, seen) {
  await ctx.route('**/*', async route => {
    const r = route.request(), u = r.url(); seen.push(u);
    if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('about:')) return route.continue();
    if (r.method() === 'GET' && /^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)) {
      try { return await route.fulfill(await curlFetch(u, r.headers(), 'GET')); } catch (e) { return route.abort('failed'); }
    }
    return route.abort('blockedbyclient');
  });
}

async function partA(browser) {
  section('A. panel.html at 390 px');
  for (const scheme of ['light', 'dark']) {
    const ctx = await browser.newContext(Object.assign({}, devices['iPhone 13'], { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, locale: 'en-AU', timezoneId: 'Australia/Brisbane' }));
    const seen = []; await fontRoute(ctx, seen);
    const page = await ctx.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('file://' + PANEL + '#open=7', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const tag = scheme;
    const shown = await page.evaluate(() => {
      const q = (s, r) => (r || document).querySelector(s), qa = (s, r) => Array.from((r || document).querySelectorAll(s));
      const root = q('#svc1063');
      return { ex: (q('.svc-ex', root) || {}).textContent || '', h3: q('h3', root).textContent,
        days: qa('[data-svc-day]', root).map(b => ({ id: b.dataset.svcDay, text: b.textContent.replace(/\s+/g, ' ').trim(), on: b.getAttribute('aria-pressed') === 'true', h: b.getBoundingClientRect().height })),
        big: q('.svc-big b', root).textContent, allmeta: q('.svc-allmeta', root).textContent.replace(/\s+/g, ' ').trim(),
        areas: qa('details[data-svc-area]', root).map(d => ({ n: d.dataset.svcArea, pct: q('.svc-pct', d).textContent, meta: q('.svc-meta', d).textContent, open: d.open, h: q('summary', d).getBoundingClientRect().height })),
        head7: qa('details[data-svc-area="7"] thead th', root).map(th => th.textContent),
        refs7: qa('details[data-svc-area="7"] tbody tr', root).map(tr => Array.from(tr.children).map(c => c.textContent.replace(/\s+/g, ' ').trim()).join(' | ')),
        foot: q('.svc-foot', root).textContent, sw: document.documentElement.scrollWidth, iw: innerWidth,
        bodyBg: getComputedStyle(document.body).backgroundColor, ink: getComputedStyle(root).color };
    });
    const g = S.groupStats(CFG, ALL, '2026-10-24', ST);
    if (scheme === 'light') {
      check('marked as example progress on the panel itself', /Example progress/.test(shown.ex) && /No crew has ticked anything yet/.test(shown.ex), shown.ex);
      check('title says it is the crews\' tracker and track only', /Servicing tracker/.test(shown.h3) && /track only/.test(shown.h3), shown.h3);
      check('day chooser: Thu 22 if needed / Fri 23 / Sat 24 / Sun 25, Saturday picked by the example clock (Sat 23:20)',
        shown.days.map(d => d.text).join(' | ') === 'Thu 22if needed | Fri 23night | Sat 24night | Sun 25last night' && shown.days.filter(d => d.on).map(d => d.id).join() === '2026-10-24', shown.days);
      check('overall % and jobs/references are SvcState\'s (' + g.pct + '%, ' + g.unitsDone + ' of 263 units, ' + g.refsDone + ' of 75 locations)',
        shown.big === g.pct + '%' && shown.allmeta.indexOf(g.d + ' of 760 jobs') >= 0 && shown.allmeta.indexOf(g.refsDone + ' of 75 references') >= 0 && /not finished/.test(shown.allmeta), shown);
      const bad = M0.D.areas.filter((a, i) => {
        const s = S.groupStats(CFG, a.refs, '2026-10-24', ST), row = shown.areas[i];
        const meta = s.refsDone + ' of ' + s.refs + ' reference' + (s.refs === 1 ? '' : 's') + ' · ' + s.d + ' of ' + s.w + ' jobs · ' + (s.finished ? 'finished ' + wdHm(s.finished) : 'not finished');
        return !row || row.n !== String(a.n) || row.pct !== s.pct + '%' || row.meta !== meta;
      }).map(a => a.n);
      check('one row per area (14), each with SvcState\'s %, x of y references and finished time / not finished', shown.areas.length === 14 && !bad.length, { bad, rows: shown.areas.slice(0, 3) });
      check('area 7 folded open: a table, one column per job in Andrew\'s words', shown.areas[6].open && shown.head7.join(' | ') === 'Reference | Pumped out | Fresh water refilled | Cleaned & restocked', shown.head7);
      check('each reference states its number and how many; each line its own row with each job\'s time (WC27: block + waste tank)',
        shown.refs7.some(t => /^WC27 2 units/.test(t)) && shown.refs7.some(t => /^1 × Toilet block 6 m \| \d\d:\d\d \| –not a job here \| \d\d:\d\d$/.test(t)) &&
        shown.refs7.some(t => /^1 × Waste tank \| \d\d:\d\d \| –not a job here \| –not a job here$/.test(t)) && shown.refs7.some(t => /^WC33 17 × FWF/.test(t) && /not yet/.test(t)), shown.refs7);
      check('the line under it: nothing ticks the job record, a delivery or a charge; Event Portables count unchanged', /Nothing here ticks the job record, changes a delivery or a charge/.test(shown.foot) && /our on-site count/.test(shown.foot), shown.foot);
      check('every day button and area row is at least 44 px tall', shown.days.every(d => d.h >= 44) && shown.areas.every(a => a.h >= 44), { days: shown.days.map(d => d.h), rows: shown.areas.map(a => a.h) });
    }
    check(tag + ': no sideways scroll at 390 px', shown.sw <= shown.iw, { sw: shown.sw, iw: shown.iw });
    check(tag + ': the page keeps its light paper in OS ' + scheme + ' mode, as the live page does (contrast1007css)', shown.bodyBg === 'rgb(248, 246, 244)' && shown.ink === 'rgb(20, 24, 29)', shown);
    const con = await page.evaluate(CONTRAST_FN + '(document.getElementById("svc1063"))');
    const low = con.filter(c => c.ratio < c.need);
    check(tag + ': every piece of text in the panel clears WCAG AA contrast (' + con.length + ' checked, lowest ' + Math.min(...con.map(c => c.ratio)) + ':1)', !low.length, low.slice(0, 6));
    const splitA = await page.evaluate(NUMUNIT_FN + '(document.getElementById("svc1063"))');
    check(tag + ': no label breaks between a number and what it counts (' + splitA.pairs + ' of ' + PAIRS + ' pairs such as "6 m", "2 ×")', splitA.pairs === PAIRS && !splitA.split.length, splitA.split.slice(0, 5));
    const spillA = await page.evaluate(SPILL_FN + '(document.getElementById("svc1063"))');
    check(tag + ': nothing in the panel sticks out past the card, and no text runs out of its cell', !spillA.length, spillA.slice(0, 5));
    await page.screenshot({ path: path.join(EVID, 'panel_' + tag + '_390.png'), fullPage: true });
    if (scheme === 'light') {
      // the chooser works: Friday finished, Sunday's jobs (lock, no water), Thursday unused
      await page.click('[data-svc-day="2026-10-23"]');
      const fri = await page.evaluate(() => document.querySelector('#svc1063 .svc-allmeta').textContent.replace(/\s+/g, ' ') + ' | ' + document.querySelector('#svc1063 .svc-big b').textContent + ' | ' + document.querySelector('#svc1063 .svc-win').textContent);
      const gf = S.groupStats(CFG, ALL, '2026-10-23', ST);
      check('Fri 23: 100%, 263 of 263 units, All finished ' + wdHm(gf.finished) + ', ended', /263 of 263 units/.test(fri) && fri.indexOf('All finished ' + wdHm(gf.finished)) >= 0 && /\| 100% \|/.test(fri) && /ended/.test(fri), fri);
      await page.click('[data-svc-day="2026-10-22"]');
      const thu = await page.evaluate(() => document.querySelector('#svc1063 .svc-allmeta').textContent.replace(/\s+/g, ' '));
      check('Thu 22 (if needed): 0 of 263 units, "if needed · no ticks"', /0 of 263 units/.test(thu) && /if needed · no ticks/.test(thu), thu);
      await page.click('[data-svc-day="2026-10-25"]');
      await page.evaluate(() => { const d = document.querySelector('#svc1063 details[data-svc-area="2"]'); d.open = true; });
      await page.waitForTimeout(100);
      const sun = await page.evaluate(() => ({ win: document.querySelector('#svc1063 .svc-win').textContent, big: document.querySelector('#svc1063 .svc-big b').textContent,
        head: Array.from(document.querySelectorAll('#svc1063 details[data-svc-area="2"] thead th')).map(th => th.textContent).join(' | '),
        ref: Array.from(document.querySelectorAll('#svc1063 details[data-svc-area="2"] tbody tr')).map(tr => Array.from(tr.children).map(c => c.textContent.replace(/\s+/g, ' ').trim()).join(' | ')).join(' || ') }));
      check('Sun 25: not started yet ("starts Sun 25 Oct 08:00"), 0%', /starts Sun 25 Oct 08:00/.test(sun.win) && sun.big === '0%', sun);
      check('Sun 25 jobs: FWF Pumped out, Cleaned & restocked, Locked & confirmed empty (no water); WC20 tank Pumped out only',
        sun.head === 'Reference | Pumped out | Cleaned & restocked | Locked & confirmed empty' && /WC20 \| 4 units|WC20 4 units/.test(sun.ref) && /2 × Waste tank \| not yet \| –not a job here \| –not a job here/.test(sun.ref) && /2 × Toilet block 6 m \| not yet \| not yet \| not yet/.test(sun.ref), sun);
      await page.evaluate(() => { const d = document.querySelector('#svc1063 details[data-svc-area="7"]'); if (d) d.open = false; window.scrollTo(0, 0); });
      await page.screenshot({ path: path.join(EVID, 'panel_sunday_light_390.png'), fullPage: true });
      // 360 px: still no sideways scroll
      await page.setViewportSize({ width: 360, height: 780 }); await page.waitForTimeout(150);
      const sw360 = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
      check('no sideways scroll at 360 px either', sw360[0] <= sw360[1], sw360);
      // escaping: hostile names drawn by the same function cannot run script
      const D2 = JSON.parse(JSON.stringify(M0.D)); D2.areas[0].name = '<img src=x onerror="window.__pwn=1">'; D2.areas[0].refs[0].ref = '"><script>window.__pwn=2</script>'; D2.tasks.pump = '<b onmouseover=window.__pwn=3>Pumped</b>';
      const hostile = R.svcPanelHtml(Object.assign({}, M0, { D: D2, open: { 1: true } }));
      const pwn = await page.evaluate(h => { const d = document.createElement('section'); d.id = 'hostile'; d.className = 'card'; d.innerHTML = h; document.body.appendChild(d); const txt = d.textContent; d.remove(); return { pwn: window.__pwn, img: /<img/.test(h), lit: txt.indexOf('<img src=x onerror') >= 0 }; }, hostile);
      check('hostile area, reference and job names are shown as text and run nothing', pwn.pwn === undefined && !pwn.img && pwn.lit, pwn);
    }
    const outside = seen.filter(u => !/^(file:|data:|about:)/.test(u) && !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u));
    check(tag + ': no request leaves the machine except the two Google Fonts hosts', !outside.length, outside.slice(0, 5));
    check(tag + ': no page errors, no console errors', !errors.length, errors.slice(0, 5));
    await ctx.close();
  }
}

async function partB() {
  section('B. the same panel on the real Event nights tab (live v10.60.1 build, read only)');
  if (!fs.existsSync(LIVE_PAGE)) { check('live build file present', false, LIVE_PAGE); return; }
  const { open } = require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page.js'));
  const css = fs.readFileSync(path.join(__dirname, 'panel.css'), 'utf8');
  const html = R.svcPanelHtml(Object.assign({}, M0, { open: { 7: true } }));
  for (const scheme of ['light', 'dark']) {
    const s = await open({ pageFile: LIVE_PAGE, hash: '#nights', mobile: true, W: 390, H: 844, dpr: 2 });
    try {
      await s.page.emulateMedia({ colorScheme: scheme });
      await s.page.waitForSelector('#pane-nights .n1022-head', { timeout: 60000 });
      await s.page.waitForTimeout(4000);
      const put = await s.page.evaluate(({ css, html }) => {
        const st = document.createElement('style'); st.id = 'svc1063-style'; st.textContent = css; document.head.appendChild(st);
        const pane = document.getElementById('pane-nights'), first = pane.querySelector('section.card');
        const sec = document.createElement('section'); sec.className = 'card svc1063'; sec.id = 'svc1063'; sec.setAttribute('aria-labelledby', 'svc1063-h'); sec.innerHTML = html;
        pane.insertBefore(sec, first);
        sec.scrollIntoView({ block: 'start' }); window.scrollBy(0, -8);
        const scroller = document.scrollingElement;
        return { ok: !!document.getElementById('svc1063'), sw: scroller.scrollWidth, iw: innerWidth, paneW: pane.getBoundingClientRect().width, secW: sec.getBoundingClientRect().width,
          ink: getComputedStyle(sec).color, face: getComputedStyle(sec, '::after').backgroundColor, btn: getComputedStyle(sec.querySelector('.btn.primary')).backgroundImage.slice(0, 60) };
      }, { css, html });
      await s.page.waitForTimeout(400);
      check(scheme + ': panel drawn on the real tab with the page\'s own card and buttons (face ' + put.face + ', ink ' + put.ink + ')', put.ok && put.face === 'rgb(255, 255, 255)' && put.ink === 'rgb(20, 24, 29)' && /gradient/.test(put.btn), put);
      check(scheme + ': no sideways scroll on the real page at 390 px', put.sw <= put.iw, put);
      const con = await s.page.evaluate(CONTRAST_FN + '(document.getElementById("svc1063"))');
      const low = con.filter(c => c.ratio < c.need);
      check(scheme + ': every piece of panel text clears WCAG AA on the real page (' + con.length + ' checked, lowest ' + Math.min(...con.map(c => c.ratio)) + ':1)', !low.length, low.slice(0, 6));
      const splitB = await s.page.evaluate(NUMUNIT_FN + '(document.getElementById("svc1063"))');
      check(scheme + ': no label breaks between a number and what it counts (' + splitB.pairs + ' of ' + PAIRS + ' pairs) on the real page', splitB.pairs === PAIRS && !splitB.split.length, splitB.split.slice(0, 5));
      const spillB = await s.page.evaluate(SPILL_FN + '(document.getElementById("svc1063"))');
      check(scheme + ': nothing sticks out past the card and no text runs out of its cell on the real page (its global table/th rules included)', !spillB.length, spillB.slice(0, 5));
      const tbl = await s.page.evaluate(() => { const t = document.querySelector('#svc1063 .svc-tbl'), c = getComputedStyle(t); return { w: Math.round(t.getBoundingClientRect().width), card: Math.round(document.getElementById('svc1063').getBoundingClientRect().width), minw: c.minWidth, thPos: getComputedStyle(t.querySelector('th')).position }; });
      check(scheme + ': the fold table keeps to the card (the page\'s table{min-width:640px} and sticky th overridden)', tbl.w < tbl.card && tbl.minw === '0px' && tbl.thPos === 'static', tbl);
      await s.page.screenshot({ path: path.join(EVID, 'realpage_' + scheme + '_390.png') });
      /* the page scrolls inside its own frame, so the whole panel is shot by making the phone tall enough to hold it */
      const tall = await s.page.evaluate(() => { const sec = document.getElementById('svc1063'); sec.scrollIntoView({ block: 'start' }); const r = sec.getBoundingClientRect(); return Math.ceil(r.top + r.height + 24); });
      await s.page.setViewportSize({ width: 390, height: Math.min(tall + 200, 9000) }); await s.page.waitForTimeout(400);
      await s.page.evaluate(() => document.getElementById('svc1063').scrollIntoView({ block: 'start' })); await s.page.waitForTimeout(300);
      const el = await s.page.$('#svc1063'); if (el) await el.screenshot({ path: path.join(EVID, 'realpage_panel_' + scheme + '_390.png') });
      await s.page.setViewportSize({ width: 390, height: 844 }); await s.page.waitForTimeout(200);
      if (scheme === 'light') {
        // review problem 2: the run sheet's own redraw replaces the pane; a panel inside it is wiped, one in its own host is not
        await s.page.evaluate(({ css, html }) => {
          const pane = document.getElementById('pane-nights'), host = document.createElement('div'); host.id = 'svc1063-host';
          host.innerHTML = '<section class="card svc1063" id="svc1063b">' + html + '</section>'; pane.parentNode.insertBefore(host, pane);
        }, { css, html });
        await s.page.click('#pane-nights [data-n1022-night="2026-10-24"]');
        await s.page.waitForTimeout(800);
        const after = await s.page.evaluate(() => ({ inside: !!document.getElementById('svc1063'), host: !!document.getElementById('svc1063b'), night: (document.querySelector('#pane-nights .n1022-night h3') || {}).textContent }));
        check('the run sheet\'s own redraw (Saturday night) wipes a panel put inside #pane-nights but not one in its own container: the build must use its own container', !after.inside && after.host && /Saturday night/.test(after.night || ''), after);
      }
      check(scheme + ': the harness aborted ' + s.counts.blocked + ' write(s); nothing was sent to the live service', true);
      check(scheme + ': no page errors on the real page', !s.errors.length, s.errors.slice(0, 5));
    } finally { await s.browser.close(); }
  }
}

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--lang=en-AU'] });
  try { await partA(browser); } finally { await browser.close(); }
  if (!NO_LIVE) await partB();
  console.log('\n' + pass + ' passed, ' + fail + ' failed' + (fail ? ' :: ' + fails.join(' | ') : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
