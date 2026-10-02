// The Coates Way machine — v8.08 interface tests (the info cards, the toast, the controls). Author: Andrew Fisher. Read only:
// the rig serves the folder from disk and fetches models and sounds from the live machine by GET; nothing is ever sent to it.
//
//   cd 03_GC500_Delivery_Control
//   CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) \
//     ROOT=v8.08_coates_way_machine_DRAFT/work DEVICE=phone [SHOTS=<dir outside the repo>] [QUICK=1] \
//     node v8.08_coates_way_machine_DRAFT/evidence/ui_tests.js
//
// DEVICE: phone (390×844 @2, touch), tablet (768×1024 @2, touch), desktop (1440×900 @1), 4k (3840×2160 @1).
// QUICK=1 runs the card and layout checks only (no control sweep). ROOT=…/base runs what applies to the live copy, for comparison
// (the live copy has no window.__cw.pickAt, so spots are taken from a fixed grid there).
// Software rendering runs at about one frame a second: the page is given 25 s after it reports ready before anything is touched.
const path = require('path'), fs = require('fs');
const {openMachine} = require('./machine_rig');
const DEVICES = {
  phone: {W: 390, H: 844, dpr: 2, mobile: true},
  tablet: {W: 768, H: 1024, dpr: 2, mobile: true},
  desktop: {W: 1440, H: 900, dpr: 1, mobile: false},
  '4k': {W: 3840, H: 2160, dpr: 1, mobile: false, query: '?tune=dpr:0.35'}, /* a smaller drawing buffer only, so the software renderer keeps up; the interface is laid out at full 4K */
};
const TUNE = process.env.TUNE || ''; /* e.g. dpr:0.5 — a smaller drawing buffer for a slow software renderer; the interface is unaffected */
const ROOT = process.env.ROOT || 'v8.08_coates_way_machine_DRAFT/work', DEVICE = process.env.DEVICE || 'phone', SHOTS = process.env.SHOTS || '', QUICK = process.env.QUICK === '1';
const dev = DEVICES[DEVICE]; if (!dev) throw new Error('DEVICE must be one of ' + Object.keys(DEVICES).join(', '));
const wait = ms => new Promise(r => setTimeout(r, ms));
const results = []; let page, m, cdp, tag = path.basename(ROOT) + '_' + DEVICE;
function check(name, ok, detail = '') { results.push({name, ok: !!ok, detail}); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); return !!ok; }
async function shot(name) { if (!SHOTS) return; fs.mkdirSync(SHOTS, {recursive: true}); await page.screenshot({path: path.join(SHOTS, `${tag}_${name}.png`), timeout: 300000}).catch(e => console.log('  (screenshot failed: ' + e.message.split('\n')[0] + ')')); }

/* everything the card rules are about, read from the page in screen pixels */
const STATE = () => {
  const vis = el => el && !el.hidden && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
  const R = el => { if (!el) return null; const b = el.getBoundingClientRect(); return {l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height}; };
  const cards = [document.getElementById('exhibit'), document.getElementById('tour-panel')].filter(vis);
  const dialogs = [...document.querySelectorAll('dialog[open]')];
  const card = cards[0] || null;
  let close = null, closeHit = null, closeInView = null;
  if (card) {
    const x = card.querySelector('.card-x') || document.getElementById('exhibit-close') || document.getElementById('tour-close');
    close = R(x);
    if (close && close.w) {
      const cx = close.l + close.w / 2, cy = close.t + close.h / 2, hit = document.elementFromPoint(cx, cy);
      closeHit = !!hit && (hit === x || x.contains(hit)); closeInView = close.l >= 0 && close.t >= 0 && close.r <= innerWidth && close.b <= innerHeight;
    }
  }
  return {cards: cards.map(c => c.id), dialogs: dialogs.map(d => d.id), count: cards.length + dialogs.length, card: card ? R(card) : null, cardId: card ? card.id : null,
    title: (document.getElementById(card && card.id === 'tour-panel' ? 'tour-title' : 'exhibit-name') || {}).textContent || '', close, closeHit, closeInView,
    dock: R(document.querySelector('.dock')), nav: R(document.querySelector('.masthead nav')), studio: R(document.querySelector('.studio')), canvas: R(document.getElementById('canvas')),
    toast: document.getElementById('toast').classList.contains('visible') ? R(document.getElementById('toast')) : null,
    camTools: R(document.querySelector('.camera-tools')), viewOpts: R(document.querySelector('.view-options')),
    W: innerWidth, H: innerHeight, scrollW: document.documentElement.scrollWidth, scrollY: scrollY};
};
const overlap = (a, b) => !!a && !!b && a.w > 0 && b.w > 0 && a.l < b.r - .5 && b.l < a.r - .5 && a.t < b.b - .5 && b.t < a.b - .5;
async function state() { return page.evaluate(STATE); }
async function tap(x, y) { if (dev.mobile) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); await wait(700); }
async function cardRules(label, s) {
  s = s || await state();
  check(`${label}: at most one card or dialog open`, s.count <= 1, `${s.count} open (${[...s.cards, ...s.dialogs].join(', ') || 'none'})`);
  if (!s.card) return s;
  const minX = 44 * (DEVICE === '4k' ? 1.9 : 1) - .5;
  check(`${label}: ✕ is ${Math.round(minX)} px or more`, s.close && s.close.w >= minX && s.close.h >= minX, s.close ? `${Math.round(s.close.w)}×${Math.round(s.close.h)}` : 'no close button');
  check(`${label}: ✕ inside the screen`, s.closeInView, JSON.stringify(s.close && [s.close.l, s.close.t].map(Math.round)));
  check(`${label}: ✕ not covered (elementFromPoint at its centre is the ✕)`, s.closeHit);
  check(`${label}: card clear of the dock`, !overlap(s.card, s.dock), `card ${Math.round(s.card.t)}–${Math.round(s.card.b)}, dock from ${Math.round(s.dock.t)}`);
  check(`${label}: card clear of the view tabs`, !overlap(s.card, s.nav));
  check(`${label}: card inside the screen`, s.card.t >= -.5 && s.card.l >= -.5 && s.card.r <= s.W + .5 && s.card.b <= s.H + .5, JSON.stringify([s.card.l, s.card.t, s.card.r, s.card.b].map(Math.round)));
  if (!dev.mobile || DEVICE === 'tablet') { /* not over the middle of the scene on anything wider than a phone */ }
  if (!dev.mobile) { const cx = (s.canvas.l + s.canvas.r) / 2, cy = (s.canvas.t + s.canvas.b) / 2; check(`${label}: card not over the centre of the scene`, !(s.card.l < cx && s.card.r > cx && s.card.t < cy && s.card.b > cy)); }
  return s;
}
async function closeVia(how) { /* returns the state after */
  if (how === 'x') { const s = await state(); await tap(s.close.l + s.close.w / 2, s.close.t + s.close.h / 2); }
  else if (how === 'escape') { await page.keyboard.press('Escape'); await wait(400); }
  return state();
}
/* a grid of points over the visible scene, each classified by the page's own picking (work only) */
async function survey() {
  return page.evaluate(() => {
    const c = document.getElementById('canvas').getBoundingClientRect(), dock = document.querySelector('.dock').getBoundingClientRect(), out = [];
    const bottom = Math.min(c.bottom, dock.top, innerHeight) - 12;
    for (let y = c.top + 70; y < bottom; y += 24) for (let x = c.left + 14; x < c.right - 14; x += 24) {
      const e = document.elementFromPoint(x, y); if (e !== document.getElementById('canvas')) continue;
      const k = window.__cw.pickAt ? window.__cw.pickAt(x, y) : null; if (k) out.push({x: Math.round(x), y: Math.round(y), kind: k.kind, name: k.name});
    }
    return out;
  });
}
async function touchDrag(x, y, dx, dy, back = false, holdMs = 0) {
  if (dev.mobile) {
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
    if (holdMs) await wait(holdMs);
    const pts = []; for (let i = 1; i <= 6; i++) pts.push([x + dx * i / 6, y + dy * i / 6]); if (back) for (let i = 5; i >= 0; i--) pts.push([x + dx * i / 6, y + dy * i / 6]);
    if (dx || dy) for (const [px, py] of pts) { await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: px, y: py}]}); await wait(30); }
    await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
  } else {
    await page.mouse.move(x, y); await page.mouse.down(); if (holdMs) await wait(holdMs);
    if (dx || dy) { await page.mouse.move(x + dx, y + dy, {steps: 6}); if (back) await page.mouse.move(x, y, {steps: 6}); }
    await page.mouse.up();
  }
  await wait(800);
}
const FORCE = true; /* clicks do not wait for two still frames: on a shared machine a software-rendered frame can take half a minute (the handlers are what is tested) */
async function clickId(id) { await page.click('#' + id, {timeout: 150000, force: FORCE}); await wait(500); }
async function clickSel(q) { await page.click(q, {timeout: 150000, force: FORCE}); await wait(300); }
async function txt(sel) { return page.$eval(sel, e => e.textContent.trim()).catch(() => null); }
async function setRange(id, v) { await page.$eval('#' + id, (e, v) => { e.value = v; e.dispatchEvent(new Event('input', {bubbles: true})); }, v); await wait(200); }
async function until(fn, ms = 15000, arg) { const t = Date.now(); while (Date.now() - t < ms) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await wait(300); } return false; }

(async () => {
  console.log(`v8.08 interface tests · ${ROOT} · ${DEVICE} ${dev.W}×${dev.H} @${dev.dpr}${dev.mobile ? ' touch' : ''}`);
  m = await openMachine({root: ROOT, W: dev.W, H: dev.H, dpr: dev.dpr, mobile: dev.mobile, query: dev.query || (TUNE ? '?tune=' + TUNE : '')}); page = m.page; page.setDefaultTimeout(120000);
  if (dev.mobile) cdp = await page.context().newCDPSession(page);
  await page.waitForFunction(() => window.__cw && window.__cw.ready, null, {timeout: 300000});
  await wait(25000);
  const isWork = await page.evaluate(() => typeof window.__cw.pickAt === 'function');
  let s = await state();
  /* ── layout at rest ── */
  check('no sideways scroll on the page', s.scrollW <= s.W + 1, `${s.scrollW} wide on ${s.W}`);
  check('the whole dock is on the first screen', s.dock.b <= s.H + .5 && s.dock.t >= 0, `dock ${Math.round(s.dock.t)}–${Math.round(s.dock.b)} of ${s.H}`);
  check('nothing is open at rest', s.count === 0);
  const ui = await page.evaluate(() => { const b = document.getElementById('start-text').getBoundingClientRect(), f = parseFloat(getComputedStyle(document.getElementById('start-text')).fontSize); const z = parseFloat(getComputedStyle(document.querySelector('.dock')).zoom) || 1; return {textPx: f * z, h: b.height}; });
  check('dock words a readable size on this screen', ui.textPx >= (DEVICE === '4k' ? 24 : 11.5), `Start V8 at ${ui.textPx.toFixed(1)} px`);
  /* v8.08 review: a quiet "Ready to run" is hidden to the eye only — still in the page for a screen reader (it was display:none) */
  if (isWork) { await until(() => document.getElementById('status').classList.contains('quiet'), 20000); const qs = await page.evaluate(() => { const t = document.getElementById('status-text'), c = getComputedStyle(t), r = t.getBoundingClientRect(); return {quiet: document.getElementById('status').classList.contains('quiet'), text: t.textContent, display: c.display, visibility: c.visibility, w: r.width, h: r.height}; });
    check('quiet status: "Ready to run" still read by a screen reader (visually hidden, not display:none)', qs.quiet && qs.text === 'Ready to run' && qs.display !== 'none' && qs.visibility !== 'hidden' && qs.w <= 1 && qs.h <= 1, JSON.stringify(qs)); }
  await shot('0_rest');

  /* ── where things are: the page's own picking over the scene (work), or a fixed grid (live copy) ── */
  let spots = [];
  if (isWork) spots = await survey();
  const byKind = k => spots.filter(p => p.kind === k);
  const exh = [], seen = new Set(); for (const p of byKind('exhibit')) if (!seen.has(p.name)) { seen.add(p.name); exh.push(p); }
  console.log(`  survey: ${spots.length} points · ${byKind('exhibit').length} on garage exhibits (${exh.length} different) · ${byKind('part').length} on parts · ${byKind('none').length} on nothing`);
  const c = s.canvas, vb = Math.min(c.b, s.dock.t, s.H);
  const grid = [[.15, .25], [.82, .25], [.5, .45], [.25, .65], [.78, .65], [.5, .85]].map(([fx, fy]) => ({x: Math.round(c.l + fx * c.w), y: Math.round(c.t + 60 + fy * (vb - c.t - 80))}));
  /* six taps: up to four exhibits and two parts from the survey, else the grid */
  let six = isWork ? [...exh.slice(0, 4), ...byKind('part').filter((_, i) => i % 7 === 3).slice(0, 2)] : [];
  while (six.length < 6) six.push(grid[six.length]);
  let maxOpen = 0;
  for (const [i, p] of six.entries()) {
    await tap(p.x, p.y); const st = await cardRules(`tap ${i + 1} at ${p.x},${p.y}${p.kind ? ' (' + p.kind + (p.name ? ': ' + p.name : '') + ')' : ''}`);
    maxOpen = Math.max(maxOpen, st.count); if (i === 0 && st.card) await shot('1_card_after_tap');
  }
  check('six taps on the scene: never more than one card', maxOpen <= 1, `most open at once: ${maxOpen}`);

  /* ── the ways a card closes ── */
  if (exh.length || !isWork) {
    /* the camera may have moved since the survey (a tap can select and frame a part): look again */
    if (isWork) { await closeVia('escape'); await page.click('#home', {force: true}); await wait(1500); await until(() => !window.__cw.tween, 120000); const again = (await survey()).filter(p => p.kind === 'exhibit'); if (again.length) exh.splice(0, exh.length, ...again.filter((p, i, a) => a.findIndex(q => q.name === p.name) === i)); }
    const ex = exh[0] || grid[1], open = async () => { await closeVia('escape'); await tap(ex.x, ex.y); return state(); };
    let st = await open();
    /* (the exhibit can move between the survey and the tap — the overhead crane travels — or someone can walk across it: as for the third open
       below, look again and tap what is there now; a card must still open from a real tap on an exhibit) */
    if (!st.card && isWork) { const now = (await survey()).filter(p => p.kind === 'exhibit'); if (now.length) { await closeVia('escape'); await tap(now[0].x, now[0].y); st = await state(); } }
    const opened = !!st.card; check('a tap on a garage exhibit opens its card', opened, st.cardId ? st.title : 'no card');
    if (opened) {
      st = await closeVia('x'); check('closes with ✕', !st.card);
      await open(); st = await closeVia('escape'); check('closes with Escape', !st.card);
      st = await open(); if (!st.card && isWork) { /* the exhibit can move (the overhead crane travels) or a crew member can walk across it: look again and tap what is there now */ const now = (await survey()).filter(p => p.kind === 'exhibit'); if (now.length) { await closeVia('escape'); await tap(now[0].x, now[0].y); st = await state(); } }
      if (!st.card) check('the exhibit card opens again for the empty-scene check', false, 'no card after two taps');
      const empty = isWork && st.card ? (byKind('none').concat(byKind('part'))).find(p => !(p.x > st.card.l && p.x < st.card.r && p.y > st.card.t && p.y < st.card.b)) : null;
      if (empty) { await tap(empty.x, empty.y); const s2 = await state(); check(`closes with a tap on empty scene (${empty.kind}${empty.name ? ': ' + empty.name : ''})`, !s2.card); } else check('closes with a tap on empty scene', false, 'no empty spot clear of the card found');
      await open(); await clickId('tour'); st = await state(); check('starting the tour closes the card (the tour card takes its place)', st.cardId === 'tour-panel' && st.count === 1, st.cards.join(','));
      await cardRules('tour card', st); await shot('2_tour');
      if (isWork) { const f = await page.evaluate(() => document.activeElement && document.activeElement.id); check('starting the tour moves focus to its title', f === 'tour-title', f); }
      await page.keyboard.press('Escape'); await wait(400); st = await state(); check('Escape ends the tour', st.count === 0);
      if (isWork) { const f = await page.evaluate(() => document.activeElement && document.activeElement.id); check('ending the tour puts focus back on Guided tour', f === 'tour', f); }
      await open(); await page.click('[data-view="engine"]', {force: true}); await wait(800); st = await state(); check('switching view closes the card', !st.card && st.count === 0);
      await page.click('[data-view="car"]', {force: true}); await wait(1500); await until(() => !window.__cw.tween, 120000);
      /* ── deliberate taps only ── */
      if (isWork) {
        await closeVia('escape');
        const fresh = async () => (await survey()).find(p => p.kind === 'exhibit') || ex;
        let ex2 = await fresh();
        await touchDrag(ex2.x, ex2.y, 60, 30); st = await state(); check('a drag (orbit) starting on an exhibit opens nothing', st.count === 0);
        await page.click('#home', {force: true}); await wait(1500); await until(() => !window.__cw.tween, 120000); ex2 = await fresh();
        await touchDrag(ex2.x, ex2.y, 50, 0, true); st = await state(); check('a drag that comes back to where it began opens nothing', st.count === 0);
        await page.click('#home', {force: true}); await wait(1500); await until(() => !window.__cw.tween, 120000); ex2 = await fresh();
        await touchDrag(ex2.x, ex2.y, 0, 0, false, 900); st = await state(); check('a long press (0.9 s) opens nothing', st.count === 0);
        ex2 = await fresh(); await tap(ex2.x, ex2.y); st = await state(); check('a quick tap on an exhibit (after all that) does open it', !!st.card, st.title);
        if (st.card) { const t0 = st.title; await touchDrag(Math.round((st.card.l + st.card.r) / 2), Math.round(st.card.b - 30), 0, -60); const s3 = await state(); check('pressing and scrolling the card keeps it open', !!s3.card && s3.title === t0); }
        await wait(16000); st = await state(); check('the card stays until it is closed (no timer)', !!st.card);
        await closeVia('escape');
      }
    }
  } else check('a garage exhibit was found in the scene', false, 'survey found none');

  /* ── the information cards ── */
  await clickId('help'); await wait(1500); let st = await cardRules('Controls ?'); check('Controls ? opens in the card', st.cardId === 'exhibit' && /Explore the car/.test(st.title), st.title);
  /* v8.08 review: the card is said as it opens — focus goes to its title in a dialog named by it — and focus goes back to the opener on close */
  const a11y = () => page.evaluate(() => { const e = document.getElementById('exhibit'), f = document.activeElement; return {focus: f ? f.id || f.tagName : null, role: e.getAttribute('role'), named: e.getAttribute('aria-labelledby'), tab: document.getElementById('exhibit-name').getAttribute('tabindex')}; });
  if (isWork) { const a = await a11y(); check('opening a card moves focus to its title (a dialog named by that title)', a.focus === 'exhibit-name' && a.role === 'dialog' && a.named === 'exhibit-name' && a.tab === '-1', JSON.stringify(a)); }
  await shot('3_help');
  if (st.card) {
    const sc = await page.evaluate(() => { const b = document.getElementById('exhibit-body'); const before = b.scrollHeight > b.clientHeight + 4; b.scrollTop = b.scrollHeight; return {scrolls: before, top: b.scrollTop}; });
    const s2 = await cardRules('Controls ? scrolled to the end'); check('a long card scrolls inside itself, its ✕ stays put in the header', sc.scrolls && s2.close && Math.abs((s2.close.t - s2.card.t) - (st.close.t - st.card.t)) < 1, JSON.stringify(sc));
  }
  await clickId('original'); await wait(1500); st = await cardRules('Original cog'); check('Original cog replaces it (still one card)', st.count === 1 && /original/i.test(st.title), st.title);
  await page.keyboard.press('Escape'); await wait(300);
  if (isWork) { const a = await a11y(); check('closing the card puts focus back on what opened it (Original cog)', a.focus === 'original', JSON.stringify(a)); }
  await page.click('#rings [data-part="1"]', {force: true}); await wait(400); await clickId('learn'); await wait(1500); st = await cardRules('Read more'); check('Read more opens in the card', /Performance pillars/i.test(st.title), st.title);
  await page.keyboard.press('Escape'); await wait(300);
  await clickId('register-open'); st = await state(); check('Find a part opens the register, nothing else', st.dialogs.includes('register') && st.cards.length === 0);
  const rx = await page.$eval('#register .dialog-head button', e => { const b = e.getBoundingClientRect(); return [b.width, b.height]; }).catch(() => [0, 0]); check('register ✕ is 44 px or more', rx[0] >= 43.5 && rx[1] >= 43.5, rx.map(Math.round).join('×'));
  await page.keyboard.press('Escape'); await wait(500);

  /* ── the toast ── */
  await page.evaluate(() => window.scrollTo(0, 0)); await wait(300);
  await clickId('gear-up'); await wait(300); st = await state();
  check('a toast shows for a gear change', !!st.toast);
  if (st.toast) { const hits = ['dock', 'nav', 'camTools', 'viewOpts'].filter(k => overlap(st.toast, st[k])); check('the toast covers no control', !hits.length, hits.join(', ')); check('the toast is inside the screen', st.toast.l >= 0 && st.toast.r <= st.W && st.toast.t >= 0, JSON.stringify([st.toast.l, st.toast.r].map(Math.round))); }
  await clickId('help'); await clickId('gear-down'); await wait(300); st = await state();
  if (st.toast && st.card) check('a toast with a card open covers neither', !overlap(st.toast, st.card) && !overlap(st.toast, st.dock), JSON.stringify({toast: [st.toast.t, st.toast.b].map(Math.round), card: [st.card.t, st.card.b].map(Math.round)}));
  await shot('4_toast_with_card');
  await page.keyboard.press('Escape'); await wait(300);

  /* ── every control still answers ── */
  if (!QUICK) try {
    const cw = (expr) => page.evaluate(expr);
    for (const v of ['engine', 'cog', 'car']) { await clickSel(`[data-view="${v}"]`); await wait(1500); check(`tab: ${v}`, await cw(`window.__cw.view==='${v}'&&document.querySelector('[data-view="${v}"]').classList.contains('active')`)); }
    await wait(6000);
    await clickId('tour'); check('Guided tour starts', await cw(`!document.getElementById('tour-panel').hidden`)); await clickId('tour-next'); check('tour: Next', /02/.test(await txt('#tour-step'))); await clickId('tour-close'); check('tour: End tour', await cw(`document.getElementById('tour-panel').hidden`));
    await clickSel('[data-view="car"]'); await wait(6000);
    const sound0 = await txt('#sound'); await clickId('sound'); await wait(1500); const sound1 = await txt('#sound'), toastS = await txt('#toast'); check('Sound answers', sound1 !== sound0 || /unavailable/i.test(toastS), `${sound0} → ${sound1}`); if (sound1 !== sound0) await clickId('sound');
    await clickId('fullscreen'); await wait(1000); const fs1 = await cw('!!document.fullscreenElement'), toastF = await txt('#toast'); check('Full screen answers', fs1 || /not available/i.test(toastF), fs1 ? 'entered' : toastF); if (fs1) { await page.evaluate(() => document.exitFullscreen()); await wait(1000); }
    await clickId('register-open'); await page.fill('#search', 'piston'); await wait(400); const rc = await txt('#results-count'); check('Find a part: search', /^\d+/.test(rc) && !/^138 /.test(rc), rc);
    await clickSel('#results .result-row'); await wait(600); check('Find a part: picking a row selects it and closes the register', await cw(`!document.getElementById('register').open`) && /piston/i.test(await txt('#selected-name')), await txt('#selected-name'));
    await clickSel('#rings [data-part="2"]'); await wait(400); check('part list (rings) selects', /Scorecard/i.test(await txt('#selected-name')));
    await clickSel('#rings [data-part="0"]'); await wait(400);
    await clickId('start'); check('Start V8', await until(() => window.__cw.drive.running || !window.__cw.drive.stationary, 20000));
    await setRange('throttle', 60); check('throttle', (await txt('#throttle-value')) === '60%');
    await setRange('brake', 30); check('brake', (await txt('#brake-value')) === '30%'); await setRange('brake', 0);
    await setRange('steer', 50); check('steer', (await txt('#steer-value')) !== '0°', await txt('#steer-value')); await setRange('steer', 0);
    await clickId('start'); check('Stop V8', await until(() => !window.__cw.drive.running, 30000));
    await until(() => window.__cw.drive.stationary, 60000);
    await setRange('throttle', 25);
    const g0 = await txt('#gear-readout'); await clickId('gear-up'); const g1 = await txt('#gear-readout'); await clickId('gear-down'); check('gears up and down', g1 !== g0 && (await txt('#gear-readout')) === g0, `${g0} → ${g1} → ${await txt('#gear-readout')}`);
    await clickId('explode'); check('Explode powertrain answers (the driver gets out first)', await until(() => window.__cw.driverExit.state !== 'seated' || window.__cw.drive.spreadTarget > 0, 10000), JSON.stringify(await cw('window.__cw.driverExit.state')));
    await clickId('explode'); await wait(800);
    await clickId('reset'); await wait(1500); check('Reset', await cw(`window.__cw.service.phase==='ready'&&window.__cw.view==='car'&&window.__cw.driverExit.state==='seated'`));
    await until(() => window.__cw.drive.stationary && !window.__cw.drive.running, 30000);
    await clickId('service'); check('Service: first step', await until(() => window.__cw.service.phase !== 'ready', 10000), await cw('window.__cw.service.phase')); await clickId('reset'); await wait(1000);
    const b0 = await txt('#body-mode'); await clickId('body-mode'); check('cutaway toggles', (await txt('#body-mode')) !== b0); await clickId('body-mode');
    await clickId('slow'); check('slow motion', await cw(`document.getElementById('slow').getAttribute('aria-pressed')==='true'`)); await clickId('slow');
    await clickId('power'); check('power path', await cw(`document.getElementById('power').getAttribute('aria-pressed')==='true'`)); await clickId('power');
    for (const id of ['zoom-in', 'zoom-out', 'home']) { await clickSel('#' + id); check(`camera: ${id}`, await until(() => !!window.__cw.tween, 3000)); await wait(1500); }
    /* one press is tested by hand; the two more that bring it round to Laptop are pressed together, so the software renderer never has to draw a High frame */
    const q0 = await txt('#quality'); await clickId('quality'); const q1 = await txt('#quality'); const seen = [q0, q1]; /* as many settings as the machine offers (four since v8.08 added Ultra): click on until it comes round */ for (let i = 0; i < 6 && seen[seen.length - 1] !== q0; i++) { await page.evaluate(() => document.getElementById('quality').click()); await wait(500); seen.push(await txt('#quality')); }
    /* v8.08 review: a phone or a touch tablet is offered Laptop and Balanced only; High and Ultra are more than its graphics memory holds */
    if (dev.mobile) check('Quality cycles Laptop ⇄ Balanced on a phone, never High or Ultra (and comes round again)', q1 !== q0 && seen[seen.length - 1] === q0 && new Set(seen).size === 2 && !seen.some(x => /High|Ultra/.test(x)), seen.join(' → '));
    else check('Quality cycles (and comes round again)', q1 !== q0 && seen[seen.length - 1] === q0 && new Set(seen).size >= 3, seen.join(' → '));
    /* the 4K frame is drawn in the click itself: on a software renderer that is minutes, so the click is fired without waiting on it */
    const dl = page.waitForEvent('download', {timeout: 900000}).catch(() => null); await page.evaluate(() => setTimeout(() => document.getElementById('capture').click(), 0)); const d = await dl; check('4K capture saves a picture', !!d || /saved/.test(await txt('#toast')), d ? d.suggestedFilename() : await txt('#toast'));
    await clickId('original'); check('Original cog', /original/i.test(await txt('#exhibit-name'))); await page.keyboard.press('Escape');
    await clickId('help'); check('Controls', /Explore the car/.test(await txt('#exhibit-name'))); await page.keyboard.press('Escape');
  } catch (e) { check('control sweep ran to the end', false, e.message.split('\n')[0]); }
  await wait(500);
  const errs = m.errors.filter(e => !/favicon/i.test(e));
  check('no page errors', !errs.length, errs.slice(0, 5).join(' | '));
  const failed = results.filter(r => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed · ${ROOT} · ${DEVICE}`);
  if (process.env.JSON_OUT) fs.writeFileSync(process.env.JSON_OUT, JSON.stringify({root: ROOT, device: DEVICE, results}, null, 1));
  await m.close(); process.exitCode = failed.length ? 1 : 0;
})().catch(async e => { console.error(e); try { await m.close(); } catch {} process.exitCode = 2; });
