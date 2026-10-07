// Author: Andrew Fisher. v8.96 Today scene: the plate is centred; the sky is the forecast for the day shown and follows the day
// picker; a day with no forecast stays unknown; lamps lit = the model's reached and none green unless all green; Pause and reduced
// motion settle every number and stop the sky; offscreen, a hidden page, a dialog and the drawer pause it; five redraws and tab
// changes leave nothing behind; the group cards keep their folds, links and keyboard focus and the chips still jump; the banner
// is in a closed fold and nothing plays; text keeps 4.5:1 over every sky and over the pictures; no overflow, no errors, no writes.
//   PAGE=<build> [W=2560|1600|1440] [MOB=1] [ATLAS896=folder] [OUT=dir] node v8.96_today_scene_DRAFT/tests/test_scene896.cjs
// The pictures are served locally from ATLAS896 (default ../assets) until they are on the service.
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
const A = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'atlas896.json'), 'utf8'));
const WAPI = [1000, 1003, 1006, 1009, 1030, 1063, 1066, 1069, 1072, 1087, 1114, 1117, 1135, 1147, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1240, 1243, 1246, 1249, 1252, 1255, 1258, 1261, 1264, 1273, 1276, 1279, 1282];
const KINDS = ['sun', 'part', 'cloud', 'fog', 'rain', 'pour', 'storm', 'sleet'];
(async () => { let s; try {
 const mob = !!process.env.MOB, W = mob ? 390 : Number(process.env.W || 1600), H = mob ? 844 : Number(process.env.H || (W >= 2560 ? 1370 : 1000)), dpr = mob ? 2 : 1;
 s = await open({pageFile: process.env.PAGE, W, H, mobile: mob, dpr}); const p = s.page, R = []; const ok = (n, v, d) => R.push({name: n, pass: !!v, detail: d});
 const cons = []; p.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|ERR_FAILED|net::/.test(m.text())) cons.push(m.text().slice(0, 160)); });
 const dir = process.env.ATLAS896 || path.join(__dirname, '..', 'assets'); let served = 0;
 for (const c of A.cells) { const f = path.join(dir, c.file); if (fs.existsSync(f)) await p.route(new RegExp('/m/Coates-GC500-2026/' + c.file + '(\\?.*)?$'), r => { served++; r.fulfill({status: 200, contentType: c.type, body: fs.readFileSync(f)}); }); }
 await p.waitForFunction(() => typeof Scene896 === 'object' && typeof Where885 === 'object' && SYNC.status === 'live' && todayWorkHealth840().ready, null, {timeout: 150000});
 await p.evaluate(() => go('today')); await p.waitForTimeout(1200);
 // the pictures may have been asked for before the local route was in place: ask again, then let both forecast sources answer
 // (the browser may already hold a failed fetch of the hosted addresses from before the route was in place, so each address is given a fresh query)
 await p.evaluate(shas => { shas.forEach(sha => { if (typeof DATA.media[sha] === 'string' && !/\?/.test(DATA.media[sha])) DATA.media[sha] += '?s896=' + Date.now(); }); document.getElementById('scene896-atlas')?.remove(); Scene896.mount(); }, A.cells.map(c => c.sha256));
 await p.waitForFunction(() => !['loading', 'idle'].includes(WXF.state) && !['loading', 'idle'].includes(WXO.state), null, {timeout: 30000}).catch(() => {});
 await p.waitForTimeout(400);
 const clean = t => String(t || '').replace(/\s+/g, ' ').trim();
 const money = t => /\$\s?\d/.test(t || '');
 const scrollTo = sel => p.evaluate(sel => { const h = document.querySelector(sel), main = document.querySelector('main'); main.scrollTop += h.getBoundingClientRect().top - main.getBoundingClientRect().top - 10; }, sel);

 /* 1. the release is in */
 const A1 = await p.evaluate(() => ({style: !!document.getElementById('scene896-style'), script: !!document.getElementById('scene896-script'), footer: ((document.getElementById('footL') || {}).textContent || '').replace(/\s+/g, ' ').trim(), r: Scene896.report(), atlas: !!document.getElementById('scene896-atlas')}));
 ok('v8.96 style, script and atlas stylesheet are in; the footer ends in v8.96', A1.style && A1.script && A1.atlas && /v8\.96$/.test(A1.footer) && A1.r.version === 'v8.96' && A1.r.mounted);

 /* 2. the plate: its lights, title and figure are centred on it; the plate is centred in the card when it stands alone */
 const M = await p.evaluate(() => {
  const el = document.getElementById('where885'), g = el.querySelector('.w885-gauge'), gr = g.getBoundingClientRect(), card = el.getBoundingClientRect(), body = g.parentElement;
  const centred = r => Math.abs((r.left - gr.left) - (gr.right - r.right)) <= 2.5;
  const cols = getComputedStyle(body).gridTemplateColumns.split(' ').length;
  const parts = ['.w885-lights', '.w885-title', '.w885-reading', '.w885-caption', '.s896-wx'].map(sel => { const n = g.querySelector(sel); return {sel, centred: !!n && centred(n.getBoundingClientRect())}; });
  return {cols, plateW: Math.round(gr.width), parts, alone: cols === 1, inCard: cols === 1 ? Math.abs((gr.left - card.left) - (card.right - gr.right)) <= 3 : gr.left >= card.left && gr.right <= card.right,
   skyFits: (() => { const sk = g.querySelector('.s896-sky').getBoundingClientRect(); return Math.abs(sk.left - gr.left) <= 2 && Math.abs(sk.right - gr.right) <= 2 && Math.abs(sk.top - gr.top) <= 4 && Math.abs(sk.bottom - gr.bottom) <= 2; })()};
 });
 ok('the lights, title, figure, caption and weather line are centred on the plate' + (M.alone ? ', and the plate on the card' : ' (' + M.cols + ' columns: the plate fills its column)'), M.parts.every(x => x.centred) && M.inCard && M.skyFits, M);

 /* 3. the sky is the forecast for the day shown */
 const X = await p.evaluate(WAPI => {
  const day = todayWorkDay841(), f = wxfDay(day);
  const valid = !!f && String(f.date || '').slice(0, 10) === day && Number.isFinite(f.code) && (f.src === 'om' ? Object.prototype.hasOwnProperty.call(WX_WMO, f.code) : WAPI.includes(Number(f.code)));
  const expect = valid ? wxKind(f.code, f.src) : 'unknown';
  const g = document.querySelector('#where885 .w885-gauge'), sky = g.querySelector('.s896-sky'), wx = g.querySelector('.s896-wx');
  const layers = [...sky.children].filter(n => getComputedStyle(n).display !== 'none').map(n => n.getAttribute('class'));
  const d = document.createElement('div'); d.innerHTML = valid ? wxDayHtml(day, 'line') : '';
  return {day, expect, kind: g.dataset.weather, skyKind: sky.dataset.kind, words: wx.textContent.replace(/\s+/g, ' ').trim(), title: wx.title, layers, pageLine: d.textContent.replace(/\s+/g, ' ').trim(), why: valid ? '' : wxNoneWhy(day), src: {wapi: WXF.state, om: WXO.state, srcTag: f ? wxSrcTag(f) : null}, valid};
 }, WAPI);
 ok('the sky shows the forecast kind for the day shown (' + X.day + ': ' + X.expect + (X.src.srcTag ? ', ' + X.src.srcTag : '') + ')', X.kind === X.expect && X.skyKind === X.expect, X);
 ok(X.valid ? 'the weather line is the page\'s own day line, with its full words as the title' : 'no forecast reached this run (WeatherAPI ' + X.src.wapi + ', Open-Meteo ' + X.src.om + '): the plate says so in the page\'s words',
  X.valid ? X.words.includes(X.pageLine) && X.title.length > 10 : /No forecast/.test(X.words) && X.words.includes(X.why) && !X.title, X.words);
 ok('the layers shown match the kind (' + X.layers.length + ')', X.expect === 'unknown' ? X.layers.every(c => /s896-(yard|shield)/.test(c)) : X.layers.length >= 4 && X.layers.some(c => /s896-yard/.test(c)) && X.layers.some(c => /s896-shield/.test(c)), X.layers);

 /* 4. the day picker drives the sky: another forecast day, through the page's own date control, then a day that has passed */
 const D = await p.evaluate(() => {
  const keep = state.asOf, day0 = todayWorkDay841(), g0 = document.querySelector('#where885 .w885-gauge'), k0 = g0.dataset.weather, w0 = g0.querySelector('.s896-wx').textContent.replace(/\s+/g, ' ').trim();
  const rows = wxfDates().map(d => { const f = wxfDay(d); return {d, k: f ? wxKind(f.code, f.src) : 'unknown'}; });
  const other = rows.find(x => x.d !== day0 && x.k !== k0) || rows.find(x => x.d !== day0) || null;
  const out = {day0, k0, w0, other, control: null};
  const read = () => { const g = document.querySelector('#where885 .w885-gauge'); return {kind: g.dataset.weather, skyKind: g.querySelector('.s896-sky').dataset.kind, words: g.querySelector('.s896-wx').textContent.replace(/\s+/g, ' ').trim(), title: g.querySelector('.s896-wx').title, layers: [...g.querySelector('.s896-sky').children].filter(n => getComputedStyle(n).display !== 'none').map(n => n.getAttribute('class')), notes: [...document.querySelectorAll('#where885 .w885-note')].map(n => n.textContent).join(' ')}; };
  const input = document.querySelector('#pane-today #asOf');
  if (other) {
   if (input) { input.value = other.d; input.dispatchEvent(new Event('change', {bubbles: true})); out.control = 'date control'; } else { state.asOf = other.d; renderToday(); out.control = 'state'; }
   out.otherShown = read(); out.otherDay = todayWorkDay841();
  }
  state.asOf = '2026-10-01'; renderToday(); out.past = read(); out.pastWhy = wxNoneWhy('2026-10-01');
  state.asOf = keep; renderToday(); out.back = read().kind;
  return out;
 });
 ok(D.other ? 'changing the day (' + D.other.d + ' via the ' + D.control + ') changes the sky to that day\'s forecast (' + D.other.k + ')' : 'only one forecast day is known this run; the day change is checked on the past day below',
  !D.other || (D.otherShown.kind === D.other.k && D.otherShown.skyKind === D.other.k && D.otherDay === D.other.d && (D.other.k !== D.k0 || D.otherShown.words !== D.w0)), D);
 ok('a day with no forecast stays unknown: plain words, no sky, nothing guessed', D.past.kind === 'unknown' && D.past.skyKind === 'unknown' && /No forecast/.test(D.past.words) && D.past.words.includes(D.pastWhy) && !D.past.title && D.past.layers.every(c => /s896-(yard|shield)/.test(c)) && /As of/.test(D.past.notes), D.past);
 ok('back on today the sky is today\'s again', D.back === D.k0);

 /* 5. the lamps */
 const L = await p.evaluate(() => { const m = progress881Model(todayWorkDay841()), el = document.getElementById('where885'); return {ready: m.ready, reached: m.reached, allGreen: m.allGreen, lit: el.querySelectorAll('.w885-lights .tl841-lamp.is-on').length, green: el.querySelectorAll('.w885-lights .tl841-lamp.is-on.is-finished').length, complete: el.dataset.complete}; });
 ok('lamps lit = the model\'s reached (' + L.lit + ' of 5)', L.lit === (L.ready ? L.reached : 0), L);
 ok('no lamp is green unless the model says all green', L.allGreen ? L.green === 5 && L.complete === 'true' : L.green === 0 && L.complete === 'false', L);

 /* 6. Pause and reduced motion settle every displayed number at once and stop the sky */
 await scrollTo('#where885'); await p.waitForTimeout(2800);
 const settled = () => p.evaluate(() => {
  const el = document.getElementById('where885'), t = el.querySelector('[data-w885-pct]'), m = progress881Model(todayWorkDay841());
  const ids = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'vms', 'equipment'], clean = x => String(x || '').replace(/\s+/g, '');
  const chips = ids.map(id => ({id, chip: clean(el.querySelector('[data-w885-jump="' + id + '"] b')?.textContent), card: clean(document.querySelector('#tw840-card-' + id + ' .tw840-reading')?.textContent)}));
  const cards = ids.map(id => { const r = document.querySelector('#tw840-card-' + id + ' .tw840-reading > span:not(.tw842-bound)'); return {id, shown: r ? r.textContent.trim() : null}; });
  const sum = todayWorkSummary848(todayWorkDay841()), fence = fenceOverall853(todayWorkDay841(), sum);
  const expectCard = id => { if (id === 'fencing') return null; const x = sum.byId[id]; if (!x || typeof x.pct !== 'number') return '—'; const b = Math.max(0, Math.min(100, x.pct)); return (x.pctKind === 'lower-bound' ? Math.floor((b + 1e-9) * 100) / 100 : b).toLocaleString('en-AU', {maximumFractionDigits: 2}); };
  return {figure: t.textContent === t.dataset.text, shown: t.textContent, chipsMatch: chips.every(c => c.chip === c.card), cardsMatch: cards.every(c => c.id === 'fencing' || c.shown === expectCard(c.id)), r: Scene896.report(), w: Where885.report(), label: document.getElementById('w885-motion').textContent.trim()};
 });
 const run0 = await p.evaluate(() => Scene896.report());
 ok('with the plate in view the sky plays (' + run0.animating + ' of ' + run0.animations + ' animations running)', run0.visible && run0.running && run0.animations > 0 && run0.animating === run0.animations, run0);
 await p.click('#w885-motion'); await p.waitForTimeout(200);
 const P = await settled();
 ok('Pause settles the whole-job figure, the chips and the card readings at once, and stops the sky', P.w.paused && P.figure && P.chipsMatch && P.cardsMatch && !P.r.running && P.r.animating === 0 && P.r.paused && /Play/.test(P.label), P);
 await p.click('#w885-motion'); await p.waitForTimeout(300);
 const P2 = await p.evaluate(() => Scene896.report());
 ok('Play starts the sky again', P2.running && P2.animating > 0 && !P2.paused, P2);
 await p.emulateMedia({reducedMotion: 'reduce'}); await p.evaluate(() => renderToday()); await p.waitForTimeout(400);
 const RM = await settled();
 ok('reduced motion shows every number settled with no sky motion', RM.r.still && !RM.r.running && RM.r.animations === 0 && RM.figure && RM.chipsMatch && RM.cardsMatch && !RM.w.intro, RM);
 await p.emulateMedia({reducedMotion: 'no-preference'}); await p.evaluate(() => renderToday()); await p.waitForTimeout(400);

 /* 7. offscreen, a hidden page, a dialog and the drawer pause the sky; back on, it runs */
 await p.evaluate(() => { document.querySelector('main').scrollTop = document.querySelector('main').scrollHeight; }); await p.waitForTimeout(400);
 const off = await p.evaluate(() => Scene896.report());
 await scrollTo('#where885'); await p.waitForTimeout(400);
 const on = await p.evaluate(() => Scene896.report());
 ok('the sky pauses when the plate is scrolled off screen and plays again when it is back', !off.visible && !off.running && off.animating === 0 && on.visible && on.running && on.animating > 0, {off, on});
 const hid = await p.evaluate(async () => { Object.defineProperty(document, 'hidden', {configurable: true, get: () => true}); document.dispatchEvent(new Event('visibilitychange')); const a = Scene896.report(); delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return {a, b: Scene896.report()}; });
 ok('a hidden page pauses the sky; showing it again plays', !hid.a.running && hid.a.animating === 0 && hid.b.running, hid);
 await p.evaluate(() => { document.querySelector('#tw840-card-generators [data-tw840-detail][data-tw840-mode="done"]').click(); }); await p.waitForTimeout(400);
 const dlg = await p.evaluate(() => ({open: !!document.querySelector('dialog[open]'), r: Scene896.report()}));
 await p.evaluate(() => { document.querySelector('dialog[open] [data-tw840-close]')?.click(); }); await p.waitForTimeout(400);
 const dlg2 = await p.evaluate(() => ({open: !!document.querySelector('dialog[open]'), r: Scene896.report()}));
 ok('a Review dialog (native card control) pauses the sky; closing it plays again', dlg.open && dlg.r.modal && !dlg.r.running && dlg.r.animating === 0 && !dlg2.open && dlg2.r.running, {dlg, dlg2});
 const key = await p.evaluate(() => { const a = allAssets().filter(x => !x._cancelled && (x.events || []).length); return (a.find(x => /^GN/.test(x.key)) || a[0]).key; });
 await p.evaluate(k => openAsset(k), key); await p.waitForTimeout(600);
 const dr = await p.evaluate(() => ({on: document.getElementById('drawer').classList.contains('on'), r: Scene896.report()}));
 await p.evaluate(() => { if (state.drawerClose) state.drawerClose(); }); await p.waitForTimeout(600);
 const dr2 = await p.evaluate(() => ({on: document.getElementById('drawer').classList.contains('on'), r: Scene896.report()}));
 ok('the reference drawer pauses the sky; closing it plays again', dr.on && !dr.r.running && dr.r.animating === 0 && !dr2.on && dr2.r.running, {dr, dr2});

 /* 8. five redraws and tab changes leave nothing behind: one sky, one weather line, one fold, the same animations, one observer of each kind, no timers of its own */
 const K = await p.evaluate(async () => {
  const counts = () => ({skies: document.querySelectorAll('.s896-sky').length, lines: document.querySelectorAll('.s896-wx').length, parks: document.querySelectorAll('#pane-today .dsnband.s896-park').length, folds: document.querySelectorAll('#pane-today .s896-showcase').length, bands: document.querySelectorAll('#pane-today .dsnband').length, styles: document.querySelectorAll('#scene896-atlas').length, anims: document.getAnimations().length, basis: (document.querySelector('#where885 .w885-basis p')?.textContent.match(/rendered illustrations/g) || []).length});
  const before = counts(), sky0 = Scene896.report().animations;
  for (let i = 0; i < 5; i++) renderToday();
  await new Promise(r => setTimeout(r, 300)); const mid = counts(), midSky = Scene896.report().animations;
  go('timeline'); await new Promise(r => setTimeout(r, 500)); const away = {skies: document.querySelectorAll('.s896-sky').length, r: Scene896.report()};
  go('today'); await new Promise(r => setTimeout(r, 500)); go('plant'); await new Promise(r => setTimeout(r, 500)); go('today'); await new Promise(r => setTimeout(r, 800));
  return {before, sky0, mid, midSky, away, after: counts(), r: Scene896.report()};
 });
 await scrollTo('#where885'); await p.waitForTimeout(300);
 const K2 = await p.evaluate(() => Scene896.report());
 ok('five redraws keep one sky, one weather line, one fold, one atlas stylesheet, one basis sentence and the same sky animations', K.mid.skies === 1 && K.mid.lines === 1 && K.mid.parks === 1 && K.mid.folds === 1 && K.mid.bands === 1 && K.mid.styles === 1 && K.mid.basis === 1 && K.midSky === K.sky0, K);
 // the page's own instruments start and stop with what is on screen, so after a change of tab only the scene's own footprint is compared
 ok('tab changes leave nothing behind: away from Today no sky and nothing running; back on Today one sky, one line, one fold, the same sky animations, one observer of each kind and no timers', !K.away.r.running && K.away.skies === 0 && K.after.skies === 1 && K.after.lines === 1 && K.after.parks === 1 && K.after.folds === 1 && K.after.bands === 1 && K.after.styles === 1 && K.after.basis === 1 && K2.animations === K.sky0 && K.r.observers.intersection === 1 && K.r.observers.mutation === 1 && K.r.timers === 0 && K2.running, {K, K2});

 /* 9. the group cards keep their folds, links and keyboard focus; the chips still jump to their cards */
 await p.evaluate(() => document.querySelector('#tw840-card-generators .tw846-counts').scrollIntoView({block: 'center'})); await p.waitForTimeout(300);
 const C = await p.evaluate(() => {
  const card = document.getElementById('tw840-card-generators'), sum = card.querySelector('.tw846-summary'), cs = getComputedStyle(sum, '::before');
  const btn = card.querySelector('.tw846-counts button'), r = btn.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const pics = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'vms', 'equipment'].map(id => { const su = document.querySelector('#tw840-card-' + id + ' .tw846-summary'); return su ? /url\(/.test(getComputedStyle(su, '::before').backgroundImage) : false; });
  return {pic: /url\(/.test(cs.backgroundImage), opacity: parseFloat(cs.opacity), z: cs.zIndex, pe: cs.pointerEvents, pics, reviews: card.querySelectorAll('[data-tw840-detail]').length, hitInsideButton: !!hit && !!hit.closest('.tw846-counts button'), fold: !!card.querySelector('[data-tw848-group-fold]'), motion: !!card.querySelector('[data-tw840-motion]'), toggle: !!card.querySelector('.tw848-group-toggle')};
 });
 ok('every group card carries its picture behind the instrument (faint, behind, taking no clicks), with its Review links, fold and Play control as before', C.pic && C.pics.every(Boolean) && C.opacity > 0 && C.opacity <= .3 && C.z === '-1' && C.pe === 'none' && C.reviews >= 3 && C.hitInsideButton && C.fold && C.motion && C.toggle, C);
 const foldSel = '#tw840-card-generators [data-tw848-group-fold]';
 await p.click(foldSel + ' > summary'); await p.waitForTimeout(250);
 const closed = await p.evaluate(sel => !document.querySelector(sel).open, foldSel);
 await p.click(foldSel + ' > summary'); await p.waitForTimeout(250);
 const reopened = await p.evaluate(sel => document.querySelector(sel).open, foldSel);
 ok('the group fold still closes and opens', closed && reopened);
 await p.focus(foldSel + ' > summary'); await p.keyboard.press('Tab'); await p.waitForTimeout(100);
 const F = await p.evaluate(() => { const a = document.activeElement, cs = getComputedStyle(a); return {inCard: !!a.closest('#tw840-card-generators'), tag: a.tagName, focusVisible: a.matches(':focus-visible'), ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'}; });
 ok('keyboard focus moves on to the card\'s own next control, with a visible ring', F.inCard && F.focusVisible && F.ring, F);
 await scrollTo('#where885'); await p.waitForTimeout(200);
 await p.click('#w885-jump-generators'); await p.waitForTimeout(900);
 ok('a chip still jumps to its card', await p.evaluate(() => { const c = document.getElementById('tw840-card-generators').getBoundingClientRect(), mr = document.querySelector('main').getBoundingClientRect(); return c.top < mr.bottom && c.bottom > mr.top; }));

 /* 10. the banner and clip: in a closed fold at the foot of Today; nothing plays; opened, it is whole and still silent */
 const B = await p.evaluate(() => {
  const pane = document.getElementById('pane-today'), band = pane.querySelector(':scope > .dsnband'), d = band && band.querySelector(':scope > details.s896-showcase'), fig = d && d.querySelector('.bhero'), v = fig && fig.querySelector('video'), board = document.getElementById('gc500-work-board840'), w = document.getElementById('where885');
  const after = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
  return {parked: !!fig, closed: !!d && !d.open, afterBoard: after(board, band), afterHero: after(w, band), last: band === pane.lastElementChild, hidden: !!fig && !fig.checkVisibility() && (d.getBoundingClientRect().height < 90), heightClosed: d ? Math.round(d.getBoundingClientRect().height) : null, video: !!v, paused: !v || v.paused, autoplay: !!v && v.autoplay, preload: v ? v.preload : null, play: !!(fig && fig.querySelector('.bplay')), summary: d ? d.querySelector('summary').textContent.replace(/\s+/g, ' ').trim() : '', bands: pane.querySelectorAll('.dsnband').length, heroes: pane.querySelectorAll('.bhero').length, firstBlock: (pane.querySelector(':scope > *:not(.panehead)') || {}).className || ''};
 });
 ok('the banner and clip sit in a closed fold at the foot of Today, after the plate and the cards, and Today opens on the plate', B.parked && B.closed && B.afterBoard && B.afterHero && B.last && B.hidden && B.bands === 1 && B.heroes === 1 && /^Event banner and clip/.test(B.summary) && !/dsnband/.test(B.firstBlock), B);
 ok('the clip does not autoplay: paused, no autoplay, preload none, its own Play with sound button kept', !B.video || (B.paused && !B.autoplay && B.preload === 'none' && B.play), B);
 await p.evaluate(() => { const d = document.querySelector('#pane-today .s896-showcase'); d.open = true; d.scrollIntoView({block: 'start'}); }); await p.waitForTimeout(700);
 const O = await p.evaluate(() => { const band = document.querySelector('#pane-today > .dsnband.s896-park'), fig = band.querySelector('.bhero'), win = fig.querySelector('.bwin') || fig, br = band.getBoundingClientRect(), hr = fig.getBoundingClientRect(), v = fig.querySelector('video'); return {shown: hr.height > 50, centred: Math.abs((hr.left - br.left) - (br.right - hr.right)) <= 2, cap: win.getBoundingClientRect().height <= innerHeight * .42 + 2 && hr.width <= 1762, inBand: hr.left >= br.left - 1 && hr.right <= br.right + 1, paused: !v || v.paused, board: !!fig.querySelector('.vmsb'), remembered: Scene896.report().showcaseOpen, dark: /linear-gradient/.test(getComputedStyle(band).backgroundImage)}; });
 ok('opened, the banner shows whole in its dark band, centred and capped at 42% of the screen (as v8.84 had it), and the clip is still paused', O.shown && O.centred && O.cap && O.inBand && O.paused && O.board && O.remembered && O.dark, O);
 if (process.env.OUT) { fs.mkdirSync(process.env.OUT, {recursive: true}); const band = p.locator('#pane-today > .dsnband.s896-park'); if (!money(await band.innerText())) await band.screenshot({path: process.env.OUT + '/banner-fold-open-' + (mob ? 'phone' : W) + '.png'}); }
 await p.evaluate(() => renderToday()); await p.waitForTimeout(400);
 const O2 = await p.evaluate(() => ({open: document.querySelector('#pane-today .s896-showcase').open, bands: document.querySelectorAll('#pane-today .dsnband').length, paused: [...document.querySelectorAll('#pane-today video')].every(v => v.paused)}));
 await p.evaluate(() => { document.querySelector('#pane-today .s896-showcase').open = false; }); await p.waitForTimeout(200);
 ok('a redraw keeps the fold as it was left (open), once, with the clip still paused; it closes again', O2.open && O2.bands === 1 && O2.paused && await p.evaluate(() => !document.querySelector('#pane-today .s896-showcase').open), O2);

 /* 11. contrast: at least 4.5:1 for every word on the plate over every sky (at three moments of each), and on a card over its picture */
 const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
 const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
 // a root taller than the screen is read in two passes: top-aligned, then bottom-aligned; each pass reads only the text boxes it shows whole
 const bring = (rootSel, end) => p.evaluate(([rootSel, end]) => { const root = document.querySelector(rootSel), main = document.querySelector('main'), mr = main.getBoundingClientRect(), r = root.getBoundingClientRect(); main.scrollTop += end ? (r.bottom - mr.bottom + 6) : (r.top - mr.top - 6); }, [rootSel, end]);
 const measure = async (rootSel, textSel, label) => { const out = []; for (const end of [false, true]) { await bring(rootSel, end); await p.waitForTimeout(120); out.push(...await measureOnce(rootSel, textSel, label)); } return out; };
 const measureOnce = async (rootSel, textSel, label) => {
  // glyphs made transparent, their backgrounds kept; the lightest pixel under each text box is read back from a screenshot
  const info = await p.evaluate(([rootSel, textSel]) => {
   const root = document.querySelector(rootSel), rr = root.getBoundingClientRect(), items = [];
   // the clip is the part of the root inside the viewport; text boxes are measured from that clip's corner
   const x0 = Math.max(0, rr.left), y0 = Math.max(0, rr.top), x1 = Math.min(innerWidth, rr.right), y1 = Math.min(innerHeight, rr.bottom);
   root.querySelectorAll(textSel).forEach((n, i) => { if (!n.textContent.trim()) return; const r = n.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.top < y0 || r.bottom > y1) return; const cs = getComputedStyle(n); const m = cs.color.match(/\d+(\.\d+)?/g).map(Number); n.dataset.s896c = n.style.color || '-'; n.style.color = 'transparent'; items.push({i, sel: n.className || n.tagName, text: n.textContent.trim().slice(0, 24), color: m.slice(0, 3), x: r.left - x0, y: r.top - y0, w: r.width, h: r.height}); });
   return {clip: {x: x0, y: y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0)}, viewport: [innerWidth, innerHeight], items};
  }, [rootSel, textSel]);
  if (info.clip.width < 2 || info.clip.height < 2 || !info.items.length) { await p.evaluate(rootSel => { document.querySelectorAll(rootSel + ' [data-s896c]').forEach(n => { n.style.color = n.dataset.s896c === '-' ? '' : n.dataset.s896c; delete n.dataset.s896c; }); }, rootSel); return [{label, sel: 'clip', text: JSON.stringify(info.clip) + ' ' + JSON.stringify(info.viewport), ratio: null, bg: null}]; }
  const shot = await p.screenshot({clip: info.clip});
  const got = await p.evaluate(([b64, items, dpr]) => new Promise(res => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const cx = c.getContext('2d'); cx.drawImage(im, 0, 0); const out = items.map(it => { const x0 = Math.max(0, Math.floor(it.x * dpr)), y0 = Math.max(0, Math.floor(it.y * dpr)), w = Math.min(c.width - x0, Math.ceil(it.w * dpr)), h = Math.min(c.height - y0, Math.ceil(it.h * dpr)); if (w <= 0 || h <= 0) return Object.assign({}, it, {max: null}); const d = cx.getImageData(x0, y0, w, h).data; let best = null, bl = -1; for (let k = 0; k < d.length; k += 4) { const l = .2126 * d[k] + .7152 * d[k + 1] + .0722 * d[k + 2]; if (l > bl) { bl = l; best = [d[k], d[k + 1], d[k + 2]]; } } return Object.assign({}, it, {max: best}); }); res(out); }; im.src = 'data:image/png;base64,' + b64; }), [shot.toString('base64'), info.items, dpr]);
  await p.evaluate(rootSel => { document.querySelectorAll(rootSel + ' [data-s896c]').forEach(n => { n.style.color = n.dataset.s896c === '-' ? '' : n.dataset.s896c; delete n.dataset.s896c; }); }, rootSel);
  return got.map(it => ({label, sel: it.sel, text: it.text, ratio: it.max ? Math.round(ratio(lum(it.color), lum(it.max)) * 100) / 100 : null, bg: it.max}));
 };
 const plateText = '.w885-title, .w885-reading > span[aria-hidden] > span, .w885-reading small, .w885-caption, .w885-note, .s896-wx .wxw, .s896-wx strong, .s896-wx small, .s896-wx > span:not(.w885-sr), .w885-lights .tl841-unit small';
 const results = [], kindsSeen = [], cardResults = [];
 let worstPlate = [], worstCard = [];
 try {
 for (const k of ['actual'].concat(KINDS)) {
  const set = await p.evaluate(k => { const g = document.querySelector('#where885 .w885-gauge'), sky = g.querySelector('.s896-sky'); if (k !== 'actual') { sky.dataset.kind = k; g.dataset.weather = k; } return sky.dataset.kind; }, k);
  if (k !== 'actual' && kindsSeen.includes(set)) continue; kindsSeen.push(set);
  for (const t of [0, .325, .66]) {
   await p.evaluate(t => { document.querySelector('#where885 .s896-sky').getAnimations({subtree: true}).forEach(a => { try { a.pause(); const tm = a.effect.getComputedTiming(); a.currentTime = (tm.delay || 0) + (tm.duration || 0) * t; } catch (e) {} }); }, t);
   await p.waitForTimeout(60);
   const got = await measure('#where885 .w885-gauge', plateText, set + '@' + t);
   results.push(...got);
   if (process.env.OUT && t === .325 && ['rain', 'storm', 'sun', 'actual'].includes(k)) { await bring('#where885 .w885-gauge', false); await p.waitForTimeout(100); const g = p.locator(mob ? '#where885 .w885-gauge' : '#where885'); if (!money(await g.innerText())) await g.screenshot({path: process.env.OUT + '/plate-' + (k === 'actual' ? 'today-' + set : k) + '-' + (mob ? 'phone' : W) + '.png'}); }
  }
 }
 await p.evaluate(() => { document.querySelector('#where885 .s896-sky').getAnimations({subtree: true}).forEach(a => { try { a.play(); } catch (e) {} }); Scene896.weather(); Scene896.sync(); });
 worstPlate = results.filter(r => r.ratio !== null).sort((a, b) => a.ratio - b.ratio);
 ok('every word on the plate keeps at least 4.5:1 over every sky (worst ' + (worstPlate[0] ? worstPlate[0].ratio + ':1 ' + worstPlate[0].label + ' ' + worstPlate[0].text : '-') + '; ' + results.length + ' readings over ' + kindsSeen.length + ' skies)', worstPlate.length > 20 && worstPlate.every(r => r.ratio >= 4.5), worstPlate.slice(0, 8).concat(results.filter(r => r.ratio === null).slice(0, 3)));
 await p.evaluate(() => document.getElementById('tw840-card-generators').scrollIntoView({block: 'start'})); await p.waitForTimeout(300);
 const cardText = '.tw846-title, .tw840-reading > span, .tw840-reading small, .tw840-caption, .tw846-counts button > span, .tw846-counts strong, .tw846-counts .tw840-count-link, .tw846-lights .tl841-unit small';
 for (const id of ['generators', 'buildings', 'toilets']) { await p.evaluate(id => document.getElementById('tw840-card-' + id).scrollIntoView({block: 'start'}), id); await p.waitForTimeout(200); cardResults.push(...await measure('#tw840-card-' + id + ' .tw846-summary', cardText, id)); }
 worstCard = cardResults.filter(r => r.ratio !== null).sort((a, b) => a.ratio - b.ratio);
 ok('every word on the cards keeps at least 4.5:1 over its picture (worst ' + (worstCard[0] ? worstCard[0].ratio + ':1 ' + worstCard[0].label + ' ' + worstCard[0].text : '-') + '; ' + cardResults.length + ' readings)', worstCard.length > 10 && worstCard.every(r => r.ratio >= 4.5), worstCard.slice(0, 8).concat(cardResults.filter(r => r.ratio === null).slice(0, 3)));
 if (process.env.OUT) { await bring(mob ? '#tw840-card-generators .tw846-summary' : '#tw840-card-generators', false); await p.waitForTimeout(150); const c = p.locator(mob ? '#tw840-card-generators .tw846-summary' : '#tw840-card-generators'); if (!money(await c.innerText())) await c.screenshot({path: process.env.OUT + '/card-generators-' + (mob ? 'phone' : W) + '.png'}); }
 } catch (err) { ok('contrast measured', false, String(err && err.message || err).slice(0, 300)); }

 /* 12. print holds a still frame; overflow; errors; writes */
 await scrollTo('#where885'); await p.waitForTimeout(200);
 await p.emulateMedia({media: 'print'}); await p.waitForTimeout(250);
 const PR = await p.evaluate(() => { const g = document.querySelector('#where885 .w885-gauge'), layers = [...g.querySelectorAll('.s896-sky > *')].filter(n => getComputedStyle(n).display !== 'none'); return {layers: layers.length, paused: layers.every(n => getComputedStyle(n).animationPlayState === 'paused' || getComputedStyle(n).animationName === 'none'), words: getComputedStyle(g.querySelector('.s896-wx')).display !== 'none', figure: getComputedStyle(document.querySelector('#where885 .w885-reading')).display !== 'none', action: getComputedStyle(document.querySelector('#pane-today .s896-showcase-action')).display === 'none'}; });
 await p.emulateMedia({media: 'screen'});
 ok('print holds the sky still and keeps the figure and the weather words', PR.paused && PR.words && PR.figure && PR.action, PR);
 ok('no page-wide horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2 && document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth + 2));
 ok('no runtime errors' + (cons.length ? ' (console: ' + cons.length + ')' : ''), s.errors.length === 0 && cons.length === 0, {errors: s.errors, cons});
 ok('no attempted live writes', s.counts.blocked === 0);
 R.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name));
 R.filter(r => !r.pass && r.detail !== undefined).forEach(r => console.log('  detail: ' + JSON.stringify(r.detail).slice(0, 1600)));
 console.log('contrast worst plate ' + JSON.stringify(worstPlate.slice(0, 3)) + ' cards ' + JSON.stringify(worstCard.slice(0, 3)));
 console.log((mob ? 'phone' : W + ' px') + ': ' + R.filter(r => r.pass).length + '/' + R.length + ' (media served locally: ' + served + ')');
 if (R.some(r => !r.pass)) process.exitCode = 1;
} finally { if (s) await s.browser.close(); } })().catch(e => { console.error(e); process.exitCode = 1; });
