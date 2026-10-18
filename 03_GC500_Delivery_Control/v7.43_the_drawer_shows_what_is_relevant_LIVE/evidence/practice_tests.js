// v7.43 practice tests: the drawer shows what is relevant. Page from the kit file, live GETs read-only, nothing written.
const {open} = require('/tmp/claude-0/stage18/lh18au');
const R = {}; const ok = (n, c, note) => { R[n] = !!c; console.log((c ? 'PASS ' : 'FAIL ') + n + (note ? ' - ' + note : '')); };
(async () => {
 const s = await open({pageFile: process.env.PAGE, hash: '', W: 1300, H: 950, dpr: 1, gl: false}); const p = s.page;
 await p.waitForFunction(() => typeof allAssets === 'function' && allAssets().length > 50 && SYNC && SYNC.status === 'live' && typeof drawerTidy === 'function', null, {timeout: 240000}); await p.waitForTimeout(2000);
 const look = async key => { await p.evaluate(k => openAsset(k), key); await p.waitForTimeout(700); return p.evaluate(k => { const a = assetOf(k), d = document.getElementById('drawer'); return {kind: refKind(a), acc: (a.accessories || []).length, accForm: !!d.querySelector('#accForm'), contents: !!d.querySelector('.sect.contents'), rental: !!d.querySelector('#rentalSel'), branch: !!d.querySelector('[data-branch]'), banner: (d.querySelector('.subhirebanner') || {}).textContent || '', chip: !!d.querySelector('.dh .subhirechip'), numAdd: !!d.querySelector('#numAdd'), numPh: (d.querySelector('#numAdd') || {}).placeholder || '', fold: (d.querySelector('#unitsFold > summary') || {}).textContent || '', headerRental: /Rental ID/.test((d.querySelector('.dh .sub') || {}).textContent || '')}; }, key); };
 const gens = await p.evaluate(() => allAssets().filter(a => a.discipline === 'Generators' && !(a.accessories || []).length).map(a => a.key).slice(0, 3));
 const g = await look(gens[0]); console.log(gens[0], JSON.stringify(g));
 ok('generator: no accessory form, no contents part, Coates blocks still there', g.kind === 'generator' && !g.accForm && !g.contents && g.rental && g.branch && /distribution board/.test(g.fold));
 const b = await look('P17'); console.log('P17', JSON.stringify(b));
 ok('building: accessory form offered as before', b.kind === 'building' && b.accForm && b.contents);
 const t = await look('WC17'); console.log('WC17', JSON.stringify(t));
 ok('Coates toilet block: contract and branch shown, no banner, Rental ID in the header', t.kind === 'toilet' && t.rental && t.branch && !t.banner && t.headerRental && /a second block/.test(t.fold));
 const w = await look('WC43'); console.log('WC43', JSON.stringify(w));
 ok('WC43: SUB-HIRED banner with Event Portables and its 10 numbers, chip in the header, no Rental ID, no contract, no branch, their number box', /SUB-HIRED · Event Portables/.test(w.banner) && /0723/.test(w.banner) && /10 units/.test(w.banner) && w.chip && !w.headerRental && !w.rental && !w.branch && /Event Portables asset number/.test(w.numPh));
 const bar = await p.evaluate(() => (allAssets().find(a => typeof unnumbered === 'function' && unnumbered(a)) || {}).key);
 const u = bar ? await look(bar) : null; console.log('unnumbered', bar, JSON.stringify(u));
 ok('not numbered: no number box', u && !u.numAdd);
 const ids = await p.evaluate(() => { const was = S.operator; const out = {}; ['Andrew Fisher (via Claude)', 'A.F. (test)', 'Brenden', ''].forEach(n => { S.operator = n; out[n || '(blank)'] = nextIdFor('F', [S.fenceDockets]); }); S.operator = was; return out; });
 console.log(JSON.stringify(ids)); ok('id generator: letters only in the initials, never a bracket or a dot', /^F-AFV-\d{4}$/.test(ids['Andrew Fisher (via Claude)']) && /^F-AT-\d{4}$/.test(ids['A.F. (test)']) && /^F-B-\d{4}$/.test(ids['Brenden']) && /^F-\d{4}$/.test(ids['(blank)']));
 // practice edit: the banner offers the way back; the accessory handler tolerates the missing form
 await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => true; window.whoAmI = () => 'Andrew Fisher'; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Andrew Fisher'; SYNC.db.doc = path => ({id: path.split('/')[1], path, set: async () => {}, delete: async () => {}}); });
 const e = await p.evaluate(async () => { await openAsset('WC43'); await new Promise(r => setTimeout(r, 500)); const btn = document.querySelector('#drawer [data-subhireoff="WC43"]'); return {btn: !!btn}; });
 ok('editor sees Not sub-hired after all on the banner', e.btn);
 const g2 = await p.evaluate(async k => { await openAsset(k); await new Promise(r => setTimeout(r, 500)); return {err: window.__lastErr || null, form: !!document.querySelector('#drawer #accForm')}; }, gens[0]);
 ok('generator drawer draws in edit mode without the form and without errors', !g2.form && !s.errors.length, JSON.stringify(s.errors.slice(0, 2)));
 const summary = Object.entries(R); console.log('RESULT', summary.filter(x => x[1]).length + '/' + summary.length, 'errors', JSON.stringify(s.errors.slice(0, 5)));
 await s.browser.close(); process.exit(summary.every(x => x[1]) && !s.errors.length ? 0 : 1);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
