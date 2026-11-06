/* Author: Andrew Fisher. v11.78 checks (the v11.76 checks, plus the turns T1 to T15 in the Maps box, the finder, the card and the
   satellite map). v11.76 checks: the "Find it on the map" box on the Maps tab answers an asset number, a reference, a
   gate, a VMS board and a grandstand with the places that have a position; the twenty grandstands are the D001 markers through
   the master registration; the finder learns them ("stand 5", "s5", "S05", "grandstand 22a", "stands") without disturbing gates,
   VMS boards or references; picking opens the card with a close and a wider picture, Navigate to the right spot and the words;
   Send... hands two JPEGs and the words to the share menu (stubbed); the satellite map carries the stands; Text to a mobile is
   hidden on a view link and, in an edit-mode practice with fetch stubbed, posts the picture message it should. GET only;
   every write the page tries is aborted by the harness; record compared before and after.
     PAGE=build/GC500_v11.78/GC500_Delivery_Control_hosted.html node tests/test_v1178.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 400))); };
const tag = (live ? 'live_' : '') + (MOB ? 'phone' : 'desktop');
const FACES = ['S01', 'S02', 'S04', 'S05', 'S07', 'S08', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S18', 'S19', 'S20', 'S21', 'S22', 'S22A', 'S23', 'S25'];
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#map', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#map', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(3500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.78'));

  /* the grandstands */
  const G = await p.evaluate(() => { const st = Find1176.stands(); const d1 = DATA.sheets.find(s => s.key === 'D001');
   const mk = (d1.markers || []).filter(m => m.kind === 'circuit_sector');
   const L = MASTER_LAYERS.filter(l => !(l.fx > 0.62 && l.fy > 0.5));
   /* refit the master registration here and compare each stand with it */
   const fit = k => { const A = [[0,0,0],[0,0,0],[0,0,0]], b = [0,0,0]; L.forEach(l => { const r = [l.fx, l.fy, 1], y = l.ll[k]; for (let i = 0; i < 3; i++) { b[i] += r[i] * y; for (let j = 0; j < 3; j++) A[i][j] += r[i] * r[j]; } });
    const M = A.map((r, i) => r.concat([b[i]])); for (let c = 0; c < 3; c++) { let pv = c; for (let r = c; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[pv][c])) pv = r; [M[c], M[pv]] = [M[pv], M[c]]; for (let r = 0; r < 3; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let j = c; j < 4; j++) M[r][j] -= f * M[c][j]; } } return M.map((r, i) => r[3] / r[i]); };
   const cl = fit(0), co = fit(1);
   const off = st.map(s => { const la = cl[0] * s.fx + cl[1] * s.fy + cl[2], lo = co[0] * s.fx + co[1] * s.fy + co[2]; return Math.hypot((la - s.lat) * 111320, (lo - s.lon) * 111320 * Math.cos(-27.99 * Math.PI / 180)); });
   return {faces: st.map(s => s.face), fromMarkers: st.every(s => mk.some(m => String(m.label).toUpperCase() === s.face && Math.abs(m.fx - s.fx) < 1e-5 && Math.abs(m.fy - s.fy) < 1e-5)), worst: Math.max(...off)}; });
  check('twenty grandstands, S01 to S25 with S22A, exactly as the master plan labels them', G.faces.length === 20 && FACES.every(f => G.faces.includes(f)), G.faces);
  check('each grandstand is the D001 marker\'s own place on the sheet', G.fromMarkers);
  check('each grandstand\'s position is that place through the master registration (within 0.2 m)', G.worst < 0.2, G.worst);

  /* the finder */
  const F = await p.evaluate(() => { const m = q => held1176(() => finderMatches(q)).map(it => it.kind + ':' + (it.kind === 'stand' || it.kind === 'gate' || it.kind === 'vms' ? it.label : (it.key || it.label || it.title || '')));
   function held1176(fn){ return typeof holdAssets === 'function' ? holdAssets(fn) : fn(); }
   return {'stand 5': m('stand 5'), 's5': m('s5'), 'S05': m('S05'), 'grandstand 22a': m('grandstand 22a'), 'stand 22': m('stand 22'), 'stands': m('stands'), 'gate 6': m('gate 6'), 'VMS 10': m('VMS 10'), 'P33': m('P33'), '1244536': m('1244536')}; });
  check('"stand 5", "s5" and "S05" put Grandstand S05 first', ['stand 5', 's5', 'S05'].every(k => F[k][0] === 'stand:Grandstand S05'), F);
  check('"grandstand 22a" is S22A and "stand 22" is S22, not S22A', F['grandstand 22a'][0] === 'stand:Grandstand S22A' && F['stand 22'][0] === 'stand:Grandstand S22', F);
  check('"stands" lists the twenty first', F['stands'].slice(0, 14).every(x => x.startsWith('stand:')), F['stands']);
  check('gates, VMS boards, references and asset numbers answer as before', F['gate 6'][0] === 'gate:Gate 6' && F['VMS 10'][0] === 'vms:VMS 10' && F['P33'][0] === 'asset:P33' && F['1244536'][0] === 'asset:GN25', F);

  /* the box on the Maps tab */
  const B0 = await p.evaluate(() => { const sec = document.querySelector('#pane-map #f1176find'); return {there: !!sec, before: !!(sec && sec.nextElementSibling && sec.nextElementSibling.id === 'expcard'), vis: !!(sec && sec.offsetParent)}; });
  check('"Find it on the map" sits at the top of the Maps tab, above the explorer', B0.there && B0.before && B0.vis, B0);
  await p.evaluate(() => { renderMap(); });
  await p.waitForTimeout(900);
  check('the box survives the Maps tab drawing itself again', await p.evaluate(() => document.querySelectorAll('#pane-map #f1176find').length === 1));
  const ask = async q => { await p.fill('#f1176q', q); await p.waitForTimeout(450);
   return p.evaluate(() => ({rows: [...document.querySelectorAll('#f1176list .f1176-hit')].map(b => b.querySelector('b').textContent + (b.classList.contains('none') ? ' (none)' : '')), hint: (document.querySelector('#f1176list .hint') || {}).textContent || ''})); };
  const Q = {};
  for (const q of ['1244536', 'WC41', 'gate 6', 'VMS 10', 'stand 5', 'stand 3', '1262224']) Q[q] = await ask(q);
  check('an asset number finds its reference (1244536 → GN25)', Q['1244536'].rows[0] && Q['1244536'].rows[0].startsWith('GN25'), Q['1244536']);
  check('a reference finds itself (WC41)', Q['WC41'].rows[0] && Q['WC41'].rows[0].startsWith('WC41'), Q['WC41']);
  check('"gate 6" finds Gate 6, "VMS 10" finds VMS 10, "stand 5" finds Grandstand S05', Q['gate 6'].rows[0] === 'Gate 6' && Q['VMS 10'].rows[0] === 'VMS 10' && Q['stand 5'].rows[0] === 'Grandstand S05', Q);
  check('"stand 3" says the plan draws no S03 and names the stands it does', /draws no grandstand S03/.test(Q['stand 3'].hint) && /S22A/.test(Q['stand 3'].hint) && !Q['stand 3'].rows.length, Q['stand 3']);
  check('a unit\'s asset number finds its reference (1262224 → EQ0005)', Q['1262224'].rows[0] && /^EQ0005/.test(Q['1262224'].rows[0]), Q['1262224']);
  const NP = await p.evaluate(() => { const L = Find1176.locate({kind: 'asset', key: 'GN25'}), E = Find1176.locate({kind: 'asset', key: 'EQ0005'}); return {gn25: L.none || '', eq: E.warn || ''}; });
  check('a reference with no position says so, and one with no drop-off says the picture is the pit lane', /no position/.test(NP.gn25) && /No drop-off is set for EQ0005/.test(NP.eq), NP);

  /* pick Gate 6: the card */
  await ask('gate 6');
  await p.click('#f1176list .f1176-hit');
  await p.waitForFunction(() => { const d = document.querySelector('.drawer.find1176'); return d && d._pics && d._pics.close && d._pics.wide; }, null, {timeout: 60000});
  const C = await p.evaluate(() => { const d = document.querySelector('.drawer.find1176'); const g = Gates1156.gates().find(x => x.face === 'G6');
   const imgs = [...d.querySelectorAll('.f1176-pics img')].map(i => ({src: i.src.slice(0, 23), w: i.naturalWidth, h: i.naturalHeight, shown: !i.hidden}));
   return {title: d.querySelector('h2').textContent, imgs, bytes: [d._pics.close.bytes, d._pics.wide.bytes], across: [d._pics.close.across, d._pics.wide.across], plan: [d._pics.close.plan, d._pics.wide.plan], src: [d._pics.close.source, d._pics.wide.source],
    nav: d.querySelector('[data-f1176="nav"]').href, want: Find1176.navUrl(g.lat, g.lon), words: Find1176.words(d._loc), textBox: !!d.querySelector('.f1176-text:not([hidden])'), readonly: SYNC.readonly}; });
  check('picking Gate 6 opens its card', /Gate 6/.test(C.title), C.title);
  check('two pictures, close and wider, drawn as JPEGs on the aerial with the master plan', C.imgs.length === 2 && C.imgs.every(i => i.shown && i.src === 'data:image/jpeg;base64,' && i.w === 1000 && i.h === 824) && C.plan.every(Boolean) && C.src.every(x => x === 'aerial') && C.across[0] < 250 && C.across[1] > 600, C);
  check('each picture fits a picture message (under 235 kB)', C.bytes.every(b => b > 20000 && b <= 235000), C.bytes);
  check('Navigate goes to Gate 6 on Google Maps', C.nav === C.want, [C.nav, C.want]);
  check('the words name it and carry the directions, in plain text-message letters', /^Coates GC500: Gate 6 \(spectator gate\)\. Directions: https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-27\.99/.test(C.words) && /^[\x20-\x7e]+$/.test(C.words), C.words);
  check('Text to a mobile is not offered on a view link', C.readonly ? !C.textBox : true, C);
  await p.screenshot({path: path.join(out, 'gate6_card_' + tag + '.png')});

  /* Send... with the share menu stubbed */
  const SH = await p.evaluate(async () => { let got = null; navigator.canShare = () => true; navigator.share = async o => { got = o; };
   document.querySelector('.drawer.find1176 [data-f1176="share"]').click(); await new Promise(r => setTimeout(r, 400));
   return got ? {files: got.files.map(f => [f.name, f.type, f.size]), text: got.text, title: got.title, msg: document.querySelector('#f1176msg').textContent} : null; });
  check('Send… hands the two pictures and the words to the phone\'s share menu', SH && SH.files.length === 2 && SH.files.every(f => f[1] === 'image/jpeg' && f[2] > 20000) && /Gate 6/.test(SH.text) && /google\.com\/maps/.test(SH.text) && /Delivery is handled by the app you chose/.test(SH.msg), SH);

  /* Show on the satellite map */
  await p.evaluate(() => document.querySelector('.drawer.find1176 [data-f1176="ring"]').click());
  await p.waitForTimeout(MOB ? 6000 : 4500);
  const R = await p.evaluate(() => { const svg = document.querySelector('#pane-map .s1141-map[data-s1141="map"] .s1141-svg'); const ring = svg && svg.querySelector('g.gate1156-ring'); return {closed: !document.querySelector('.drawer.find1176'), ring: ring && ring.getAttribute('data-gate'), pct: SatMap1141.pct('map')}; });
  check('Show on the satellite map closes the card and rings the spot at 1600%', R.closed && R.ring === 'G6' && R.pct >= 1500, R);

  /* the stands on the satellite map */
  const P = await p.evaluate(() => { const M = SatMap1141.maps.map; const card = document.querySelector('#pane-map .s1141-map[data-s1141="map"]');
   return {items: M.items.filter(i => i.kind === 'stand').length, btn: (card.querySelector('[data-s1141-filter="stand"]') || {}).textContent, list: card.querySelectorAll('.s1141-list li[data-kind="stand"]').length}; });
  check('the satellite map carries the twenty stands, a Grandstands filter and a list', P.items === 20 && P.btn === 'Grandstands (20)' && P.list === 20, P);
  await p.evaluate(() => document.querySelector('#pane-map [data-s1141-filter="stand"]').click());
  await p.waitForTimeout(800);
  const P2 = await p.evaluate(() => { const svg = document.querySelector('#pane-map .s1141-map[data-s1141="map"] .s1141-svg'); return [...svg.querySelectorAll('g.pins g.s1141-pin')].map(g => g.getAttribute('data-id')); });
  check('the Grandstands filter shows only the stands', P2.length === 20 && P2.every(id => /^S\d\dA?$/.test(id)), P2.slice(0, 6));
  await p.evaluate(() => { const c = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'); c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(600);
  await p.screenshot({path: path.join(out, 'stands_satellite_' + tag + '.png')});
  await p.evaluate(() => document.querySelector('#pane-map [data-s1141-filter="all"]') && document.querySelector('#pane-map [data-s1141-filter="all"]').click());

  /* a stand from the finder at the top: the Maps tab and its card */
  await p.evaluate(() => { const box = document.querySelector('#pane-map #f1176find'); if (box) box.scrollIntoView({block: 'start'}); });
  await p.evaluate(() => holdAssets(() => { finderOpen('stand 21'); }));
  await p.waitForTimeout(700);
  await p.evaluate(() => holdAssets(() => { finderPick(0); }));
  await p.waitForFunction(() => { const d = document.querySelector('.drawer.find1176'); return d && /S21/.test(d.querySelector('h2').textContent) && d._pics && d._pics.close; }, null, {timeout: 60000});
  check('picking "stand 21" in the finder opens the Maps tab and Grandstand S21\'s card', await p.evaluate(() => state.tab === 'map' && /Grandstand S21/.test(document.querySelector('.drawer.find1176 h2').textContent)));
  await p.screenshot({path: path.join(out, 'stand21_card_' + tag + '.png')});
  await p.evaluate(() => document.querySelector('.drawer.find1176 .close').click());

  /* a VMS board out on the roads, outside the site aerial: satellite pictures */
  const V10 = await p.evaluate(async () => { const L = Find1176.search('VMS 10').rows[0]; const d = Find1176.open(L);
   for (let i = 0; i < 120 && !(d._pics.close && d._pics.wide); i++) await new Promise(r => setTimeout(r, 250));
   const o = {label: L.label, inAerial: Find1176.inAerial(L), src: [d._pics.close && d._pics.close.source, d._pics.wide && d._pics.wide.source], bytes: [d._pics.close && d._pics.close.bytes, d._pics.wide && d._pics.wide.bytes], note: d.querySelector('.norate').textContent};
   return o; });
  check('a VMS board outside the site aerial (VMS 10) gets satellite pictures, north up, and says so', V10.label === 'VMS 10' && !V10.inAerial && V10.src.every(x => x === 'satellite') && V10.bytes.every(b => b > 20000 && b <= 235000) && /Esri World Imagery/.test(V10.note), V10);
  await p.screenshot({path: path.join(out, 'vms10_card_' + tag + '.png')});
  await p.evaluate(() => document.querySelector('.drawer.find1176 .close').click());

  /* an asset with a position: WC41 */
  await ask('WC41'); await p.click('#f1176list .f1176-hit');
  await p.waitForFunction(() => { const d = document.querySelector('.drawer.find1176'); return d && (d._pics.close || d.querySelector('.f1176-wait') && /could not/.test(d.querySelector('.f1176-wait').textContent)); }, null, {timeout: 60000});
  const A = await p.evaluate(() => { const d = document.querySelector('.drawer.find1176'); const a = assetOf('WC41'), D7 = dest782(a); return {title: d.querySelector('h2').textContent, pic: !!d._pics.close, ll: [d._loc.lat, d._loc.lon], want: [Number(D7.ll.lat), Number(D7.ll.lon)], details: !!d.querySelector('[data-f1176="details"]')}; });
  check('a reference\'s card uses the same destination as its Text box (dest782), with its details one press away', /WC41/.test(A.title) && A.pic && A.ll[0] === A.want[0] && A.ll[1] === A.want[1] && A.details, A);
  await p.evaluate(() => document.querySelector('.drawer.find1176 .close').click());

  /* edit-mode practice for Text to a mobile, fetch stubbed so nothing leaves the page */
  const T = await p.evaluate(async () => {
   const sent = []; const f0 = window.fetch;
   window.fetch = async (u, o) => { const url = String(u); const meth = (o && o.method) || 'GET';
    if (/\/api\/(sms|mms)$/.test(url) && meth === 'GET') return new Response(JSON.stringify({configured: true, today: {left: 99, cap: 100}}), {status: 200, headers: {'Content-Type': 'application/json'}});
    if (/\/api\/(sms|mms)$/.test(url) && meth === 'POST') { const b = JSON.parse(o.body); sent.push({url, to: b.to, text: b.text, pic: (b.picture || '').slice(0, 23), picLen: (b.picture || '').length, subject: b.subject, dry: b.dry_run});
     return new Response(JSON.stringify(b.dry_run ? {dry_run: true} : {messages: b.to.map(t => ({to: t, status: 'SUCCESS', message_id: 'test-' + t}))}), {status: 200, headers: {'Content-Type': 'application/json'}}); }
    return f0(u, o); };
   const ro = SYNC.readonly; SYNC.readonly = false;
   try {
    const d = Find1176.open(Find1176.locate(Find1176.stands().find(s => s.face === 'S05')));
    for (let i = 0; i < 80 && !(d._pics.close && d._svc); i++) await new Promise(r => setTimeout(r, 250));
    const box = d.querySelector('.f1176-text'); box.open = true;
    d.querySelector('#f1176to').value = '0400 000 000';
    d.querySelector('[data-f1176="dry"]').click(); await new Promise(r => setTimeout(r, 300));
    d.querySelector('[data-f1176="send"]').click(); await new Promise(r => setTimeout(r, 400));
    const res = {shown: !box.hidden, tick: !d.querySelector('.f1176-tick').hidden, msg: d.querySelector('#f1176tmsg').textContent, rows: d.querySelector('#f1176res').textContent, sendLocked: d.querySelector('[data-f1176="send"]').disabled, sent};
    d.querySelector('.close').click(); return res;
   } finally { SYNC.readonly = ro; window.fetch = f0; } });
  check('edit-mode practice: Text to a mobile shows, with the picture tick', T.shown && T.tick, T);
  check('edit-mode practice: the check sends nothing, then Send posts one picture message with the close-up, the number and the words', T.sent.length === 2 && T.sent[0].dry === true && T.sent[1].dry === false && T.sent[1].url.endsWith('/api/mms') && T.sent[1].to[0] === '0400000000' && T.sent[1].pic === 'data:image/jpeg;base64,' && T.sent[1].picLen < 330000 && /Grandstand S05/.test(T.sent[1].text) && /^Coates GC500/.test(T.sent[1].subject), T.sent.map(s => Object.assign({}, s, {text: s.text.slice(0, 60)})));
  check('edit-mode practice: the result is reported truthfully and Send locks against a duplicate', /1 of 1 accepted/.test(T.msg) && /Accepted/.test(T.rows) && T.sendLocked, T);

  /* v11.78 - the turns */
  const TU = await p.evaluate(() => { const t = Find1176.turns(); const spots = Find1176.search('runoff').rows.filter(r => r.kind === 'spot');
   const d = (a, b) => Math.hypot((a.lat - b.lat) * 111320, (a.lon - b.lon) * 111320 * Math.cos(-27.99 * Math.PI / 180));
   const t10 = t.find(x => x.face === 'T10'), s10 = spots.find(x => /T10 runoff/.test(x.label)), t2 = t.find(x => x.face === 'T2'), s2 = spots.find(x => /T2 runoff/.test(x.label));
   const m = q => holdAssets(() => finderMatches(q)).map(it => it.kind + ':' + (it.label || it.key || ''));
   return {faces: t.map(x => x.face), t10: s10 ? d(t10, s10) : null, t2: s2 ? d(t2, s2) : null, spots: spots.map(x => x.label),
    q: {'turn 2': m('turn 2'), 't2': m('t2'), 'T02': m('T02'), 'turn 10': m('turn 10'), 'turns': m('turns'), 'T0085': m('T0085'), 'stand 5': m('stand 5')}}; });
  check('fifteen turns, T1 to T15, as the master plan labels them on the track', TU.faces.join() === Array.from({length: 15}, (_, i) => 'T' + (i + 1)).join(), TU.faces);
  check('Turn 10 sits on the page\'s own "T10 runoff" removal spot (within 5 m) and Turn 2 near "T2 runoff" (within 80 m)', TU.t10 !== null && TU.t10 < 5 && TU.t2 !== null && TU.t2 < 80, TU);
  check('"turn 2", "t2" and "T02" put Turn 2 first; "turn 10" is Turn 10', ['turn 2', 't2', 'T02'].every(k => TU.q[k][0] === 'turn:Turn 2') && TU.q['turn 10'][0] === 'turn:Turn 10', TU.q);
  check('"turns" lists the turns first; T0085 and "stand 5" answer as before', TU.q['turns'].slice(0, 14).every(x => x.startsWith('turn:')) && TU.q['T0085'].some(x => x === 'asset:T0085') && TU.q['T0085'][0] !== 'turn:Turn 0' && TU.q['stand 5'][0] === 'stand:Grandstand S05', TU.q);
  await p.evaluate(() => { const b = document.querySelector('#pane-map #f1176find'); if (b) b.scrollIntoView({block: 'start'}); });
  const QT = {}; for (const q of ['turn 2', 'turn 16']) QT[q] = await ask(q);
  check('the Maps box finds Turn 2 and says the plan labels T1 to T15 for "turn 16"', QT['turn 2'].rows[0] === 'Turn 2' && /T1 to T15/.test(QT['turn 16'].hint) && !QT['turn 16'].rows.length, QT);
  await ask('turn 2'); await p.click('#f1176list .f1176-hit');
  await p.waitForFunction(() => { const d = document.querySelector('.drawer.find1176'); return d && d._pics && d._pics.close && d._pics.wide; }, null, {timeout: 60000});
  const TC = await p.evaluate(() => { const d = document.querySelector('.drawer.find1176'); const t = Find1176.turns().find(x => x.face === 'T2');
   return {title: d.querySelector('h2').textContent, src: [d._pics.close.source, d._pics.wide.source], plan: [d._pics.close.plan, d._pics.wide.plan], nav: d.querySelector('[data-f1176="nav"]').href, want: Find1176.navUrl(t.lat, t.lon), words: Find1176.words(d._loc)}; });
  check('Turn 2\'s card: two aerial-and-plan pictures, Navigate to the turn, and the words', /Turn 2/.test(TC.title) && TC.src.every(x => x === 'aerial') && TC.plan.every(Boolean) && TC.nav === TC.want && /^Coates GC500: Turn 2 \(track turn\)\. Directions: https:\/\/www\.google\.com\/maps\/dir\//.test(TC.words), TC);
  await p.screenshot({path: path.join(out, 'turn2_card_' + tag + '.png')});
  await p.evaluate(() => document.querySelector('.drawer.find1176 .close').click());
  const TP = await p.evaluate(() => { const M = SatMap1141.maps.map; const card = document.querySelector('#pane-map .s1141-map[data-s1141="map"]');
   return {items: M.items.filter(i => i.kind === 'turn').length, btn: (card.querySelector('[data-s1141-filter="turn"]') || {}).textContent, list: card.querySelectorAll('.s1141-list li[data-kind="turn"]').length}; });
  check('the satellite map carries the fifteen turns, a Turns filter and a list', TP.items === 15 && TP.btn === 'Turns (15)' && TP.list === 15, TP);
  await p.evaluate(() => document.querySelector('#pane-map [data-s1141-filter="turn"]').click());
  await p.waitForTimeout(800);
  const TP2 = await p.evaluate(() => [...document.querySelectorAll('#pane-map .s1141-map[data-s1141="map"] g.pins g.s1141-pin')].map(g => g.getAttribute('data-id')));
  check('the Turns filter shows only the turns', TP2.length === 15 && TP2.every(id => /^T\d{1,2}$/.test(id)), TP2.slice(0, 6));
  await p.evaluate(() => { const c = document.querySelector('#pane-map .s1141-map[data-s1141="map"]'); c.scrollIntoView({block: 'start'}); });
  await p.waitForTimeout(600);
  await p.screenshot({path: path.join(out, 'turns_satellite_' + tag + '.png')});
  await p.evaluate(() => document.querySelector('#pane-map [data-s1141-filter="all"]') && document.querySelector('#pane-map [data-s1141-filter="all"]').click());
  await p.evaluate(() => holdAssets(() => { finderOpen('turn 4'); }));
  await p.waitForTimeout(700);
  await p.evaluate(() => holdAssets(() => { finderPick(0); }));
  await p.waitForFunction(() => { const d = document.querySelector('.drawer.find1176'); return d && /Turn 4/.test(d.querySelector('h2').textContent) && d._pics && d._pics.close; }, null, {timeout: 60000});
  check('picking "turn 4" in the finder opens the Maps tab and Turn 4\'s card', await p.evaluate(() => state.tab === 'map' && /Turn 4/.test(document.querySelector('.drawer.find1176 h2').textContent)));
  await p.evaluate(() => document.querySelector('.drawer.find1176 .close').click());

  /* phone look at the box */
  if (MOB) { await p.evaluate(() => { const b = document.querySelector('#pane-map #f1176find'); b.scrollIntoView({block: 'start'}); });
   await p.fill('#f1176q', 'turn 2'); await p.waitForTimeout(500); await p.screenshot({path: path.join(out, 'find_box_' + tag + '.png')}); }

  const after = await p.evaluate(() => JSON.stringify(S));
  check('the record is unchanged', before === after);
  check('no page errors', h.errors.length === 0, h.errors);
  check('no write left the page', h.counts.blocked === 0, h.counts);
 } catch (e) { check('test ran to the end', false, String(e && e.stack || e).slice(0, 600)); }
 finally {
  fs.writeFileSync(path.join(out, 'results_' + tag + '.json'), JSON.stringify({tag, passed: results.filter(r => r.ok).length, failed, results}, null, 1));
  console.log(JSON.stringify({tag, passed: results.filter(r => r.ok).length, failed}));
  await h.browser.close(); process.exit(failed ? 1 : 0);
 }
})();
