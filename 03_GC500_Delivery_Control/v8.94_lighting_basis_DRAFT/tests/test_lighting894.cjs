// Author: Andrew Fisher. v8.94 Lighting scope: the projection counts real towers once; Lighting against the map's scope, capped
// per location, worked out independently from the records and scope_confirmed.json; the surplus note; chip = card; the whole
// job under the seven-group rule; all-green only at 100%; the drawers for a symbol, a big-screen symbol, a copy and its
// source; redraws; no overflow, no errors, no writes.
//   PAGE=<build> [MOB=1] [W=1440] node test_lighting894.cjs                 the release build (scope_confirmed.json beside the patch)
//   UNCONFIRMED=1 PAGE=<scratch build without scope_confirmed.json> node ...  the fallback: Lighting over recorded scope, whole job unavailable
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
(async () => { let s; try {
 const mob = !!process.env.MOB, W = +(process.env.W || (mob ? 390 : 1440)), UNCONFIRMED = !!process.env.UNCONFIRMED;
 const SCOPE = UNCONFIRMED ? null : JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'scope_confirmed.json'), 'utf8'));
 s = await open({pageFile: process.env.PAGE, W, H: mob ? 844 : 1000, mobile: mob, dpr: mob ? 2 : 1});
 const p = s.page, R = []; const ok = (n, v, why) => R.push({name: n, pass: !!v, why: v ? undefined : why});
 await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && document.getElementById('where885') && window.Lighting894, null, {timeout: 150000});
 await p.waitForTimeout(1800);
 const read = () => p.evaluate(SCOPE => holdAssets(() => {
  const L = window.Lighting894, rep = L.report(), ctx = L.context();
  const el = document.getElementById('where885'), chip = document.getElementById('w885-jump-lighting'), card = document.getElementById('tw840-card-lighting');
  const all = allAssets(), lighting = all.filter(a => !a._cancelled && a.discipline === 'Lighting towers');
  const day = todayWorkDay841(), sum = todayWorkSummary848(day), x = sum.byId.lighting, m = progress881Model(day), row = m.rows.find(r => r.id === 'lighting');
  const fence = fenceOverall853(day, sum), ids = ['buildings', 'toilets', 'fencing', 'generators', 'lighting', 'vms', 'equipment'];
  const parts = ids.map(id => id === 'fencing' ? {min: fence.pct?.min, lower: (fence.pct?.max ?? fence.pct?.min) > fence.pct?.min, known: fence.state === 'ready'} : {min: sum.byId[id].pct, lower: sum.byId[id].pctKind === 'lower-bound', known: ['confirmed', 'lower-bound'].includes(sum.byId[id].pctKind)});
  const known = parts.every(q => typeof q.min === 'number' && q.known), mean = known ? parts.reduce((n, q) => n + q.min, 0) / 7 : null, lower = known && parts.some(q => q.lower);
  const seven = known ? (lower ? Math.floor((mean + 1e-9) * 100) / 100 : mean).toLocaleString('en-AU', {maximumFractionDigits: 2}) : '—';
  /* the independent calculation: each location credits the towers its records have verified complete on the page's own work rows
     (complete, a known quantity, no conflict with a short delivery), up to the number D024 keys there; a delivery tick alone is not completion */
  let indep = null;
  if (SCOPE) { const native = (todayWorkMetrics840(day).find(x => x.id === 'lighting') || {rows: []}).rows, rowOf = k => native.find(r => r.key === k);
   const groups = SCOPE.groups.map(g => { const done = g.records.reduce((n, k) => { const a = all.find(q => q.key === k && !q._cancelled), r = rowOf(k); const verified = !!(a && r && r.complete === true && Number.isSafeInteger(r.quantity) && !(r.recordedComplete && !r.complete)); return n + (verified ? Math.min(r.quantity, r.done) : 0); }, 0);
    const recorded = g.records.reduce((n, k) => { const a = all.find(q => q.key === k && !q._cancelled); return n + (a ? unitsAsked(a) : 0); }, 0);
    return {name: g.name, scope: g.scope, done, recorded, credited: Math.min(done, g.scope), surplus: Math.max(0, recorded - g.scope)}; });
   const credited = groups.reduce((n, g) => n + g.credited, 0); indep = {groups, credited, towers: SCOPE.towers, left: SCOPE.towers - credited, pct: Math.round(credited / SCOPE.towers * 10000) / 100}; }
  const kinds = k => ctx.rows.filter(a => a._screenSymbol894 ? k === 'screen' : a._sourceAlias894 ? k === 'copy' : k === 'callout').map(a => a.key).sort();
  const a = k => assetOf(k);
  return {rep, indep, register: {rows: lighting.length, units: lighting.reduce((n, q) => n + unitsAsked(q), 0), keys: lighting.map(q => q.key).sort(), screens: all.filter(q => q.discipline === 'Big screens').length},
   context: {callouts: kinds('callout'), screens: kinds('screen'), copies: kinds('copy'), copyOf: Object.fromEntries(ctx.aliases.map(q => [q.key, q.parent]))},
   reach: {LT01: !!(a('LT01') && a('LT01')._mapContext894), LTC01: a('LTC01') && [a('LTC01').discipline, a('LTC01').name, a('LTC01').item_types.join()], NVLT: a('NVLT') && a('NVLT')._sourceAlias894 && a('NVLT')._sourceAlias894.parent},
   lines: {LT01: chargeLines(a('LT01')).length, LTC01: chargeLines(a('LTC01')).length, NVLT: chargeLines(a('NVLT')).length, T0002: chargeLines(a('T0002')).length},
   sum: {pct: x.pct, kind: x.pctKind, label: x.pctLabel, done: x.done, left: x.left, total: x.total, basis: x.basis},
   model: {ready: m.ready, pct: m.pct, reached: m.reached, allGreen: m.allGreen, provisional: m.provisional, row: {min: row.min, max: row.max, scope: row.scope894}},
   seven, mean, lower, expectLit: known ? (mean === 100 && !lower ? 5 : Math.min(4, Math.floor(mean / 20))) : 0,
   chip: chip ? {tags: chip.querySelectorAll('.w894-scope').length, tag: chip.querySelector('.w894-scope')?.textContent || '', aria: chip.getAttribute('aria-label') || '', title: chip.title, b: chip.querySelector('b')?.textContent || '', bound: !!chip.querySelector('b i')} : null,
   others: ids.filter(id => id !== 'lighting').map(id => el.querySelector('#w885-jump-' + id + ' b')?.textContent || ''),
   whole: {shown: el.querySelector('[data-w885-pct]')?.dataset.text, caption: el.querySelector('.w885-caption')?.textContent, wholeNotes: el.querySelectorAll('.w894-whole').length, lightsAria: el.querySelector('.w885-lights')?.getAttribute('aria-label') || '', lit: el.querySelectorAll('.w885-lights .tl841-lamp.is-on').length, bound: !!el.querySelector('.w885-reading .w885-bound'), basis: el.querySelector('.w885-basis p')?.textContent || '', ready: el.dataset.ready, complete: el.dataset.complete},
   card: card ? {reading: card.querySelector('.tw840-reading')?.textContent || '', caption: card.querySelector('.tw840-caption')?.textContent || '', notes: card.querySelectorAll('.w894-card-scope').length, note: card.querySelector('.w894-card-scope')?.textContent || '', overs: card.querySelectorAll('.w894-card-over').length, over: card.querySelector('.w894-card-over')?.textContent || '', bound: !!card.querySelector('.tw842-bound'), lampsAria: card.querySelector('.tw846-lights')?.getAttribute('aria-label') || '', groupNotes: [...card.querySelectorAll('.tw841-group-notes li')].map(n => n.textContent).filter(n => /^Lighting scope:/.test(n)), counts: [...card.querySelectorAll('.tw840-counts [data-tw840-mode]')].map(b => b.textContent.replace(/\s+/g, ' ').trim())} : null,
   overflow: document.documentElement.scrollWidth <= innerWidth + 2, record: JSON.stringify(S)};
 }), SCOPE);
 const clean = t => String(t || '').replace(/\s+/g, '');
 const a = await read();
 // the projection
 ok('register counts real towers once: 3 rows, 7 towers (LT05, LT06, T0002 ×5)', a.register.rows === 3 && a.register.units === 7 && a.register.keys.join() === 'LT05,LT06,T0002', JSON.stringify(a.register));
 ok('18 rows leave the register: 4 D024 keyed callouts, 13 circuit fans, 1 copy', a.context.callouts.join() === 'LT01,LT02,LT03,LT04' && a.context.screens.length === 13 && a.context.screens.every(k => /^LTC\d\d$/.test(k)) && a.context.copies.join() === 'NVLT' && a.context.copyOf.NVLT === 'T0002', JSON.stringify(a.context));
 ok('the circuit fans are big-screen symbols, not in the register', a.register.screens === 0 && a.reach.LTC01 && a.reach.LTC01[0] === 'Big screens' && /^Big screen 01 · D024 drawing symbol$/.test(a.reach.LTC01[1]) && a.reach.LTC01[2] === 'Big Screen', JSON.stringify(a.reach));
 ok('every left-out row is still reachable through assetOf', a.reach.LT01 === true && a.reach.NVLT === 'T0002', JSON.stringify(a.reach));
 ok('their charge lines are empty; T0002 keeps its line', a.lines.LT01 === 0 && a.lines.LTC01 === 0 && a.lines.NVLT === 0 && a.lines.T0002 >= 1, JSON.stringify(a.lines));
 ok('counts behind the words: 7 on record, 5 complete, D024 keys 6, 13 screens, 17 symbols, BOQ still to be done', a.rep.recorded === 7 && a.rep.complete === 5 && a.rep.keyed === 6 && a.rep.screens === 13 && a.rep.symbols === 17 && a.rep.boq === null, JSON.stringify(a.rep));
 ok('the chip equals the card (' + a.chip.b + ')', a.chip && a.card && clean(a.chip.b) === clean(a.card.reading) && /^\d/.test(a.chip.b), JSON.stringify({chip: a.chip.b, card: a.card.reading}));
 ok('no ≥ anywhere for Lighting', !a.chip.bound && !a.card.bound && !/≥/.test(a.chip.tag + a.card.note), JSON.stringify({chip: a.chip.bound, card: a.card.bound}));
 ok('the six other groups still show their readings', a.others.length === 6 && a.others.every(t => /%$/.test(t.trim())), JSON.stringify(a.others));
 if (!UNCONFIRMED) {
  const I = a.indep, G = I.groups;
  ok('state: confirmed against the map’s ' + I.towers + ' towers', a.rep.state === 'confirmed' && a.rep.scope === I.towers && a.rep.invalid === null, JSON.stringify({state: a.rep.state, scope: a.rep.scope, invalid: a.rep.invalid}));
  ok('Lighting = credited ÷ ' + I.towers + ', worked out independently (' + I.credited + ' of ' + I.towers + ' = ' + I.pct + '%)', a.sum.pct === I.pct && a.sum.done === I.credited && a.sum.total === I.towers && a.sum.left === I.left && a.rep.credited === I.credited && a.rep.pct === I.pct, JSON.stringify({sum: a.sum, indep: I}));
  ok('the cap per location: Molendinar credits ' + G[0].scope + ' of ' + G[0].done + ' verified complete; Seaway credits ' + G[1].credited + ' of ' + G[1].scope, G[0].done === 5 && G[0].scope === 4 && G[0].credited === 4 && G[0].surplus === 1 && G[1].done === 0 && G[1].credited === 0 && a.rep.groups.length === 2 && a.rep.groups.every((g, i) => g.credited === G[i].credited && g.surplus === G[i].surplus && g.delivered === G[i].done), JSON.stringify({indep: G, page: a.rep.groups}));
  ok('the kind is confirmed, with no ≥ and no range', a.sum.kind === 'confirmed' && /^Confirmed complete against the map’s scope/.test(a.sum.label) && a.model.row.scope === 'confirmed' && a.model.row.min === a.model.row.max && a.model.row.min === I.pct, JSON.stringify({kind: a.sum.kind, label: a.sum.label, row: a.model.row}));
  const digits = t => (String(t).match(/\d+/) || [''])[0];
  ok('the card’s counts read the map’s scope (' + a.card.counts.join(' · ') + ')', a.card.counts.length === 2 && digits(a.card.counts[0]) === String(I.credited) && digits(a.card.counts[1]) === String(I.left) && new RegExp(' · ' + I.towers + ' total$').test(a.card.caption), JSON.stringify({counts: a.card.counts, caption: a.card.caption}));
  ok('the surplus note is shown once on the card', a.card.overs === 1 && a.card.over === 'T0002 has 5 towers on record for the BSF storage yard, Molendinar; D024 needs 4, so 1 is surplus to the plan.', JSON.stringify({overs: a.card.overs, over: a.card.over}));
  ok('the chip carries the tag once and says the scope', a.chip.tags === 1 && a.chip.tag === 'Counted against the map’s ' + I.towers + ' towers' && /counted against the map’s 6 towers \(4 credited\)\. Scope confirmed by the project manager on 8 Oct 2026\./.test(a.chip.aria) && /4 at the BSF storage yard, Molendinar; 2 at the Seaway car park transporter compound/.test(a.chip.title), JSON.stringify(a.chip));
  ok('the Lighting card says the same (once)', a.card.notes === 1 && /^Counted against the map’s 6 keyed towers on D024 — 4 at the BSF storage yard, Molendinar, 2 at the Seaway car park transporter compound — confirmed by the project manager on 8 Oct 2026\./.test(a.card.note), a.card.note);
  ok('the whole job returns under the seven-group rule (' + a.whole.shown + ' = ' + a.seven + ')', a.model.ready === true && a.whole.shown === a.seven && a.whole.bound === a.lower && a.whole.lit === a.expectLit && a.whole.caption !== 'Whole job unavailable until the Lighting scope is confirmed' && a.whole.wholeNotes === 0 && a.whole.ready === 'true', JSON.stringify(a.whole));
  ok('all-green only at a confirmed 100%', a.model.allGreen === (a.model.pct.min === 100 && a.model.pct.max === 100 && !a.model.provisional) && a.model.allGreen === false && a.whole.complete === 'false', JSON.stringify(a.model));
  ok('the basis names the map’s scope and cites the words once', /Lighting is counted against the map’s scope: the 6 lighting towers keyed on D024 \(4 at the BSF storage yard, Molendinar; 2 at the Seaway car park transporter compound\), confirmed by the project manager on 8 Oct 2026 — “What ever the map says\. If its 6 its 6”\./.test(a.whole.basis) && (a.whole.basis.match(/What ever the map says/g) || []).length === 1 && /today 4 of 6 \(T0002: 5 verified complete at the BSF storage yard, Molendinar, credited 4, 1 surplus to the plan; LT05, LT06 at the Seaway car park transporter compound are not on site, credited 0\)\./.test(a.whole.basis) && /T0002 has 5 towers on record for the BSF storage yard, Molendinar; D024 needs 4, so 1 is surplus to the plan\. \(8 Oct 2026: “Lets go by d024”\)/.test(a.whole.basis) && /13 circuit light-spread fans on D024 are big-screen symbols \(confirmed 8 Oct 2026\), and NVLT is a copy counted with T0002/.test(a.whole.basis) && /Schedule \(5\) BOQ reconciliation is still to be done/.test(a.whole.basis) && !/unconfirmed|audit pending/.test(a.whole.basis), a.whole.basis.slice(-700));
  ok('the Lighting card fold carries one scope note with the locations', a.card.groupNotes.length === 1 && /^Lighting scope: the map’s 6 keyed towers on D024, confirmed by the project manager on 8 Oct 2026\. BSF storage yard, Molendinar: D024 keys 4; T0002: 5 verified complete, credited 4, 1 surplus to the plan\. Seaway car park transporter compound: D024 keys 2; LT05, LT06 are not on site, credited 0\./.test(a.card.groupNotes[0]), JSON.stringify(a.card.groupNotes));
  ok('no "unconfirmed" or "scope audit pending" wording is left on the card', !/unconfirmed|audit pending/i.test(a.chip.tag + a.chip.aria + a.card.note + a.card.caption + a.card.groupNotes.join(' ')));
  // a fixture at a confirmed 100% in every group still turns all five lights green (the v8.85 rule is untouched)
  const F = await p.evaluate(() => { const byId = {}; ['buildings', 'toilets', 'generators', 'lighting', 'vms', 'equipment'].forEach(id => byId[id] = {id, pct: 100, pctKind: 'confirmed', done: 1, left: 0, total: 1, unit: 'units'});
   const m = progress881Model('2026-10-08', {health: {ready: true}, byId}, {state: 'ready', pct: {min: 100, max: 100}, provisional: false, credited: 1, left: 0, total: 1}); return {allGreen: m.allGreen, reached: m.reached, ready: m.ready}; });
  ok('a confirmed 100% in every group would light all five (fixture)', F.ready && F.allGreen && F.reached === 5, JSON.stringify(F));
 } else {
  ok('state: unconfirmed (no scope file)', a.rep.state === 'unconfirmed' && a.rep.invalid === null && a.rep.scope === null, JSON.stringify({state: a.rep.state, invalid: a.rep.invalid}));
  ok('Lighting reads 5 of 7 (71.43%), labelled "Complete in recorded scope"', a.sum.done === 5 && a.sum.total === 7 && a.sum.left === 2 && a.sum.pct === 71.43 && a.sum.kind === 'recorded-scope' && a.sum.label === 'Complete in recorded scope' && /^Complete in recorded scope/.test(a.card.caption), JSON.stringify(a.sum));
  ok('the chip carries the tag once, and says why', a.chip.tags === 1 && a.chip.tag === 'Complete in recorded scope · scope unconfirmed' && /complete in recorded scope, 5 of 7 towers on record/.test(a.chip.aria) && /scope is unconfirmed/.test(a.chip.aria) && /D024 keys 6/.test(a.chip.title), JSON.stringify(a.chip));
  ok('the Lighting card says the same (once), no surplus note without a map scope', a.card.notes === 1 && /^Scope unconfirmed: 7 towers on record, D024 keys 6; Schedule \(5\) BOQ reconciliation still to be done\./.test(a.card.note) && a.card.overs === 0 && /complete in recorded scope/.test(a.card.lampsAria), JSON.stringify({note: a.card.note, lamps: a.card.lampsAria}));
  ok('the whole job is unavailable: "—", its caption, unlit lights with a matching label, no all-green', a.whole.shown === '—' && a.whole.caption === 'Whole job unavailable until the Lighting scope is confirmed' && a.whole.wholeNotes === 1 && a.whole.lit === 0 && /^Whole job unavailable until the Lighting scope is confirmed\./.test(a.whole.lightsAria) && a.model.ready === false && a.model.allGreen === false && a.whole.complete === 'false' && a.whole.ready === 'false' && !a.whole.bound, JSON.stringify(a.whole));
  ok('the model keeps the Lighting row readable (71.43) while the whole job is unavailable', a.model.row.min === 71.43 && a.model.row.max === 71.43 && a.model.row.scope === 'unconfirmed' && a.model.pct === null && a.model.reached === 0, JSON.stringify(a.model));
  ok('the independent seven-group calculation also has no value', a.seven === '—');
  ok('the basis explains it in plain words', /Lighting counts complete towers over unique recorded equipment: LT05, LT06, T0002 ×5 — 7 towers, 5 complete\./.test(a.whole.basis) && /13 circuit light-spread fans on D024 are big-screen symbols \(confirmed 8 Oct 2026\), and NVLT is a copy counted with T0002/.test(a.whole.basis) && /Schedule \(5\) BOQ reconciliation is still to be done/.test(a.whole.basis) && /no ≥ is shown/.test(a.whole.basis), a.whole.basis.slice(-400));
  ok('the Lighting card fold carries one scope note', a.card.groupNotes.length === 1 && /7 towers on current equipment references \(LT05, LT06, T0002 ×5\); D024 keys 6 lighting callouts/.test(a.card.groupNotes[0]), JSON.stringify(a.card.groupNotes));
 }
 // the drawers: a link opens each left-out row with its notice, first in the drawer body; the source row names its copy and its surplus
 const drawer = async key => { await p.evaluate(k => { location.hash = '#asset/' + k; }, key); await p.waitForTimeout(2200);
  const d = await p.evaluate(() => { const dr = document.getElementById('drawer'), n = dr.querySelector('.lighting894-notice'); return {on: dr.classList.contains('on'), title: dr.querySelector('#drawerTitle')?.textContent?.trim(), notice: n?.textContent || '', kind: n?.dataset.kind, first: dr.querySelector('.db')?.firstElementChild === n, notices: dr.querySelectorAll('.lighting894-notice').length, button: n?.querySelector('button')?.textContent || '', tab: state.tab, sheet: state.sheet}; });
  await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await p.waitForTimeout(400); return d; };
 const d1 = await drawer('LT01');
 ok('LT01 opens from its link on the D024 sheet with the callout notice, first in the drawer (once)', d1.on && d1.title === 'LT01' && d1.kind === 'callout' && /^D024 lighting callout — map context only\./.test(d1.notice) && d1.first && d1.notices === 1 && d1.tab === 'map' && d1.sheet === 'D024', JSON.stringify(d1));
 const d2 = await drawer('LTC01');
 ok('LTC01 opens with the big-screen notice, citing the confirmation', d2.on && d2.title === 'LTC01' && d2.kind === 'screen' && /^D024 big-screen symbol — map context only \(confirmed 8 Oct 2026\)\./.test(d2.notice) && d2.first && d2.notices === 1, JSON.stringify(d2));
 const d3 = await drawer('NVLT');
 ok('NVLT opens with the copy notice: counted with T0002', d3.on && d3.title === 'NVLT' && d3.kind === 'copy' && /^NVLT is a copy of T0002 — counted with T0002\./.test(d3.notice) && d3.first && d3.notices === 1, JSON.stringify(d3));
 const d4 = await drawer('T0002');
 ok('T0002 names its copy' + (UNCONFIRMED ? '' : ' and its surplus against D024') + ', and offers to open the copy', d4.on && d4.title === 'T0002' && d4.kind === 'source' && /^NVLT is a copy of this row \(same asset number\) and is counted here\./.test(d4.notice) && (UNCONFIRMED || /T0002 delivered 5 towers to the BSF storage yard, Molendinar; D024 needs 4, so 1 is surplus to the plan\./.test(d4.notice)) && d4.button === 'Open NVLT', JSON.stringify(d4));
 // keyboard: the D024 pill for LT01 opens the drawer with Enter, and focus is in the drawer
 await p.evaluate(() => { state.sheet = 'D024'; state.sel = null; go('map'); }); await p.waitForTimeout(3500);
 const pill = await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-map .mk')].find(x => /\bLT01\b/.test(x.title || '')); if (!b) return null; b.scrollIntoView({block: 'center'}); b.focus(); return {title: (b.title || '').slice(0, 80), focused: document.activeElement === b, tag: b.tagName}; });
 if (pill && pill.focused) { await p.keyboard.press('Enter'); await p.waitForTimeout(1800); }
 const k1 = await p.evaluate(() => { const dr = document.getElementById('drawer'); return {on: dr.classList.contains('on'), title: dr.querySelector('#drawerTitle')?.textContent?.trim(), notice: !!dr.querySelector('.lighting894-notice'), active: document.activeElement?.id || document.activeElement?.tagName, inDrawer: dr.contains(document.activeElement)}; });
 let k2 = k1;
 if (k1.on) { await p.keyboard.press('Tab'); await p.waitForTimeout(200); k2 = await p.evaluate(() => { const dr = document.getElementById('drawer'); return {inDrawer: dr.contains(document.activeElement), active: document.activeElement?.id || document.activeElement?.className}; }); }
 ok('the LT01 pill on D024 is a keyboard button; Enter opens its drawer with the notice; focus is in the drawer', pill && pill.tag === 'BUTTON' && pill.focused && k1.on && k1.title === 'LT01' && k1.notice && (k1.inDrawer || k2.inDrawer), JSON.stringify({pill, k1, k2}));
 await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await p.waitForTimeout(400);
 // the finder still finds a left-out row, and a pick goes to its callout on the D024 sheet
 await p.evaluate(() => go('today')); await p.waitForTimeout(600);
 const found = await p.evaluate(() => holdAssets(() => { const hits = finderMatches('LT01').map(it => it.kind + ':' + (it.key || it.label || '')); const first = finderMatches('LT01')[0]; FINDER.list = finderMatches('LT01'); FINDER.at = 0; finderPick(0); return {hits, first: first ? first.kind + ':' + first.key : null}; }));
 await p.waitForTimeout(3000);
 const picked = await p.evaluate(() => ({tab: state.tab, sheet: state.sheet, pill: !![...document.querySelectorAll('#pane-map .mk')].find(x => /\bLT01\b/.test(x.title || ''))}));
 ok('the finder finds LT01 and a pick goes to its callout on D024', found.first === 'asset:LT01' && picked.tab === 'map' && picked.sheet === 'D024' && picked.pill, JSON.stringify({found, picked}));
 // redraws keep one note in each place and change no record
 await p.evaluate(() => go('today')); await p.waitForTimeout(800);
 await p.evaluate(() => { renderToday(); renderToday(); }); await p.waitForTimeout(900);
 const b = await read();
 ok('redraws keep one note in each place', b.chip.tags === 1 && b.card.notes === 1 && b.card.groupNotes.length === 1 && b.card.overs === (UNCONFIRMED ? 0 : 1) && b.whole.wholeNotes === (UNCONFIRMED ? 1 : 0) && (b.whole.basis.match(/Lighting (is counted against|counts complete)/g) || []).length === 1, JSON.stringify({chip: b.chip.tags, card: b.card.notes, group: b.card.groupNotes.length, over: b.card.overs, whole: b.whole.wholeNotes}));
 ok('readings unchanged by the redraw', b.chip.b === a.chip.b && b.whole.shown === a.whole.shown && b.whole.lit === a.whole.lit);
 ok('the record is unchanged', b.record === a.record);
 ok('no horizontal overflow', a.overflow && b.overflow);
 ok('no runtime errors', s.errors.length === 0, JSON.stringify(s.errors.slice(0, 3)));
 ok('no attempted live writes', s.counts.blocked === 0);
 R.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.pass ? '' : '  ← ' + String(r.why || '').slice(0, 700))));
 console.log((mob ? 'phone' : W + ' px') + (UNCONFIRMED ? ' unconfirmed' : ' confirmed') + ': ' + R.filter(r => r.pass).length + '/' + R.length);
 if (R.some(r => !r.pass)) process.exitCode = 1;
} finally { if (s) await s.browser.close(); } })().catch(e => { console.error(e); process.exitCode = 1; });
