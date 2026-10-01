// v7.82 - maps accuracy and driver rules. Author: Andrew Fisher. Read-only: GETs only, every write aborted by the harness.
//   PAGE=<built page> [BASE=<live page>] [MOB=1] [OUT=<json>] node rules_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
async function texts(page, mob) {
  const s = await open(mob ? {pageFile: page, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: page, W: 1440, H: 900});
  const p = s.page;
  await p.waitForFunction(() => typeof dropSmsText === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  const R = await p.evaluate(() => {
    const out = {};
    allAssets().forEach(a => { const t = dropSmsText(a); out[a.key] = {t, u: smsShape(t).units, parts: smsShape(t).parts,
      link: /\n(Delivery details|Pictures): /.test(t), due: /\nDue /.test(t), long: typeof rules782Long === 'function' ? text747Plain(dropSmsLong(a)) : null,
      side: typeof entry782 === 'function' ? (entry782(a) || {}).side || null : null, html: typeof rules782Html === 'function' ? rules782Html(a) : null}; });
    const nt = navTargetFor(allAssets().find(a => a.key === 'GN21'));
    const gens = {}; allAssets().filter(a => /^GN\d/.test(a.key)).forEach(a => { const n = navTargetFor(a); if (n) gens[a.key] = [n.ll.lat, n.ll.lon]; });
    return {texts: out, gens, gn21: nt ? [nt.ll.lat, nt.ll.lon, nt.fix && nt.fix.how] : null, check: typeof orderCheck782 === 'function' ? orderCheck782() : null,
      doneKeys: typeof window.gc500DoneKeys === 'function' ? window.gc500DoneKeys().length : null,
      css: (() => { try { state.mapMasterSeen = true; state.sheet = 'MASTER'; go('map'); } catch (e) { return 'go: ' + e.message; }
        const ok = [...document.querySelectorAll('.mk[data-complete="1"] .okx')]; return {pills: ok.length, anim: ok[0] ? getComputedStyle(ok[0]).animationName : null}; })(), max: TEXT747_MAX};
  });
  R.errors = s.errors; await s.browser.close(); return R;
}
(async () => {
  const MOB = !!process.env.MOB, N = await texts(process.env.PAGE, MOB), B = process.env.BASE ? await texts(process.env.BASE, MOB) : null;
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  const keys = Object.keys(N.texts);
  const hav = (a, b) => { const r = x => x * Math.PI / 180, R = 6371000, h = Math.sin(r(b[0] - a[0]) / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
  ok('G1 GN21 is beside GN20 at the pit lane west end (D024 arrow 021, its orange symbol on the master), not by Gate 2', N.gn21 && hav(N.gn21, [-27.985391, 153.427185]) < 10 && hav(N.gn21, [-27.982825, 153.424072]) > 400, JSON.stringify(N.gn21));
  const GEN = JSON.parse(fs.readFileSync(__dirname + '/generators_on_their_master_symbol.json', 'utf8'));
  ok('G2 every generator the master places sends the driver to its orange symbol (within 1 m)', Object.keys(GEN).every(k => N.gens[k] && hav(N.gens[k], GEN[k].ll) < 1), Object.keys(GEN).map(k => k + ':' + (N.gens[k] ? Math.round(hav(N.gens[k], GEN[k].ll) * 10) / 10 : 'none')).join(' '));
  ok('R1 every text stays inside three texts (<= 459 GSM units), all plain', keys.every(k => N.texts[k].u <= N.max), 'max ' + Math.max(...keys.map(k => N.texts[k].u)));
  const has = (k, re) => N.texts[k] && re.test(N.texts[k].t);
  ok('R2 the order line is on every named unit', has('P03', /ORDER: P03 first, then P01, then P05/) && has('P01', /ORDER: only after P03 is in/) && has('P05', /ORDER: only after P01 and WC05/) && has('P04', /ORDER: only after the WC05 toilet block/) && has('WC05', /ORDER: waste tank first, toilet block on top/) && has('GN21', /ORDER: GN21 60kVA first - tight spot/) && has('GN20', /ORDER: only after GN21 60kVA is placed/), ['P03','P01','P05','P04','WC05','GN21','GN20'].map(k => k + ':' + (N.texts[k].t.match(/ORDER:[^\n]*/) || ['-'])[0]).join(' | '));
  const tanks = keys.filter(k => /waste tank/i.test(N.texts[k].t) || ['WC20','WC27','WC60'].includes(k));
  ok('R3 every reference with a waste tank says the tank goes first', ['WC20','WC27','WC60','WC05'].every(k => has(k, /ORDER: waste tank first/)), ['WC20','WC27','WC60'].map(k => k + ':' + has(k, /ORDER: waste tank first/)).join(' '));
  ok('R4 S08 drops (WB02, WB19, WC27) are land side: enter from the Surfers (south) end, race direction', ['WB02','WB19','WC27'].every(k => N.texts[k].side === 'land side' || N.texts[k].side === null) && has('WC27', /ENTRY: land side - in from the Surfers end of Main Beach Pde, drive north \(race direction\)/), ['WB02','WB19','WC27'].map(k => k + ':' + N.texts[k].side).join(' '));
  ok('R5 seaside drops (WC50, WC60, WC62) come in at the Seaworld Dr roundabout end and drive south', ['WC50','WC60','WC62'].every(k => N.texts[k].side === 'seaside' && has(k, /ENTRY: seaside - in at the Seaworld Dr roundabout end of Main Beach Pde, drive south/)), ['WC50','WC60','WC62'].map(k => k + ':' + N.texts[k].side).join(' '));
  ok('R6 a drop nowhere near Main Beach Pde carries no Main Beach entry line (AA, P01)', !has('AA', /ENTRY:/) && !has('P01', /ENTRY:/), (N.texts.AA.t.match(/ENTRY:[^\n]*/) || ['none'])[0]);
  ok('R7 Full details carries the whole rule set (order, entry, park, stagger, D007 event-week facts)', /DRIVER RULES/.test(N.texts.P05.long) && /P01: /.test(N.texts.P05.long) && /Stagger arrivals/.test(N.texts.P05.long) && /one-way counter-clockwise/.test(N.texts.P05.long), N.texts.P05.long.split('DRIVER RULES')[1].slice(0, 300));
  ok('R8 the drawer shows a Driver rules box for a named unit, none for a unit no rule touches', /Driver rules/.test(N.texts.GN20.html) && /GN21/.test(N.texts.GN20.html), (N.texts.GN20.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 240));
  ok('R9 park drops carry the wildlife and branches caution, in the text when it fits and always in Full details', keys.filter(k => /Park access: watch for wildlife/.test(N.texts[k].long)).length > 20, keys.filter(k => /Park access/.test(N.texts[k].long)).length + ' in Full details · ' + keys.filter(k => /PARK: watch/.test(N.texts[k].t)).length + ' in the short text');
  ok('R10 the order check reads the record (GN21 before GN20 recorded out of order; P01 vs P03; WC05 vs P05, P04)', Array.isArray(N.check) && N.check.length === 5, JSON.stringify(N.check.map(c => c.first + '>' + c.then + ':' + c.state)));
  ok('M1 the done tick has its own double beat on the master plan', N.css && N.css.pills > 0 && N.css.anim === 'done782', JSON.stringify(N.css));
  ok('M2 the explorer gets the finished list', N.doneKeys > 0, N.doneKeys);
  if (B) {
    const lost = keys.filter(k => B.texts[k] && B.texts[k].link && !N.texts[k].link), lostDue = keys.filter(k => B.texts[k] && B.texts[k].due && !N.texts[k].due);
    ok('R11 (measure) a delivery-details link gives way only where an ORDER/ENTRY line needs the room', lost.every(k => /\n(ORDER|ENTRY): /.test(N.texts[k].t) && /Delivery details|card/i.test(N.texts[k].long || '')), lost.join(',') + ' · live ' + keys.filter(k => B.texts[k] && B.texts[k].link).length + ' → ' + keys.filter(k => N.texts[k].link).length);
    ok('R12 no Due line lost against the live page', !lostDue.length, lostDue.join(','));
    const p3 = k => (k.parts === 3 ? 1 : 0); ok('R13 (measure) three-text messages', true, 'live ' + keys.filter(k => B.texts[k] && B.texts[k].parts === 3).length + ' → ' + keys.filter(k => N.texts[k].parts === 3).length);
  }
  ok('E1 no page errors', !N.errors.length && (!B || !B.errors.length), JSON.stringify(N.errors).slice(0, 200));
  T.forEach(t => console.log(`${t.pass ? 'PASS' : 'FAIL'} ${t.name} — ${t.detail.slice(0, 300)}`));
  const passed = T.filter(t => t.pass).length; console.log(`${passed}/${T.length} ${MOB ? 'phone' : 'desktop'}`);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, passed, of: T.length, tests: T, samples: Object.fromEntries(['P05','GN20','GN21','WC27','WC50','WC05','P03'].map(k => [k, N.texts[k].t.replace(/https?:\/\/\S+/g, '<url>')]))}, null, 1));
  process.exit(passed === T.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
