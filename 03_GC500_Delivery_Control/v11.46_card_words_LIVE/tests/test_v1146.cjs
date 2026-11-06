/* Author: Andrew Fisher. v11.46 checks: the crew card names each line in the crew's words with its symbol ("8 flush
   toilets", not "8 × FWF"), keeps the record's label small beside the asset numbers, and uses the words in the spoken
   labels, the focused reference under the plan and the status page. The card is opened in its own tab from the page's
   template with the page's own data, at a reference's code (the code is checked by the service, not the card, so a
   16-character placeholder shows the reference's lines). GET only; the record is compared.
     PAGE=build/GC500_v11.46/GC500_Delivery_Control_hosted.html node tests/test_v1146.cjs      MOB=1 ...      LIVE=1 ... */
'use strict';
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page.js');
const live = process.env.LIVE === '1', MOB = process.env.MOB === '1';
const pageFile = live ? undefined : process.env.PAGE;
const out = process.env.OUT || path.join(__dirname, '..', 'evidence'); fs.mkdirSync(out, {recursive: true});
const results = []; let failed = 0;
const check = (name, ok, detail) => { results.push({name, ok: !!ok, detail}); if (!ok) failed++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' :: ' + JSON.stringify(detail).slice(0, 900))); };
const SIG = '0000000000000000';
(async () => {
 const h = await open(MOB ? {pageFile, hash: '#today', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile, hash: '#today', W: 1440, H: 1000});
 const p = h.page;
 try {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
  await p.waitForTimeout(1500);
  const before = await p.evaluate(() => JSON.stringify(S));
  check('footer says the expected release', await p.evaluate(v => document.body.innerText.includes(v), process.env.EXPECT_PAGE || 'v11.46'));
  const {card, lines} = await p.evaluate(() => { const data = JSON.parse(JSON.stringify(SVC1067_CARD.data)); data.contact = {name: 'Test contact', phone: '0400 000 000'}; return {card: SvcTrackerAdmin1067.cardHtml(SVC1067_CARD.html, data, true), lines: data.areas.flatMap(a => a.refs.flatMap(r => (r.lines || []).map(l => ({ref: r.ref, id: l.id, type: l.type, kind: l.kind, label: l.label, qty: l.qty, nos: l.nos || []}))))}; });
  check('card template carries the words, the line kind and the inline symbol, one script', card.includes('function words1146') && card.includes('function lineKind1146') && card.includes('function symInline1146') && card.includes('.ltitle .lsym{') && (card.match(/<script/g) || []).length === 1 && lines.length >= 80, {len: card.length, lines: lines.length});
  const c = await p.context().newPage(); const cErrors = []; c.on('pageerror', e => cErrors.push(e.message.slice(0, 200)));
  await c.route('**/*', r => { const u = r.request().url(); if (r.request().method() !== 'GET') return r.abort(); if (u.startsWith('https://card.test/')) return r.fulfill({status: 200, contentType: 'text/html; charset=utf-8', body: card}); return r.fulfill({status: 404, body: ''}); });
  await c.goto('https://card.test/', {waitUntil: 'domcontentloaded'});
  await c.waitForTimeout(2000);
  // every line's words and symbol kind, from the card's own functions
  const table = await c.evaluate(ls => ls.map(l => ({ref: l.ref, label: l.label, words: window.SvcMap1129.words(l), kind: window.SvcMap1129.lineKind(l), k: l.kind})), lines);
  const byLabel = {}; table.forEach(t => { byLabel[t.label] = t.words; });
  const expect = {'1 × FWF': '1 flush toilet', '4 × FWF': '4 flush toilets', '20 × FWF': '20 flush toilets', '2 × Toilet block 6 m': null, '1 × Accessible toilet': '1 accessible toilet', '2 × Waste tank': '2 sewer tanks', '1 × Waste tank': '1 sewer tank', '2 × 16-pan toilet block': '2 toilet blocks, 16 pans each', '1 × 4-person trailer toilet': '1 4-person trailer toilet', '2 × FWF trailer': '2 trailer flush toilets', '1 × FWF at EVL': '1 flush toilet at EVL', '1 × FWF at the Coates office': '1 flush toilet at the Coates office'};
  const wrong = Object.keys(expect).filter(k => expect[k] !== null && byLabel[k] !== expect[k]).map(k => k + ' -> ' + byLabel[k]);
  const blocks = table.filter(t => t.label === '2 × Toilet block 6 m').map(t => t.words);
  check('the words for every kind on the record: flush toilets, toilet blocks (on sewer), sewer tanks, accessible, 16-pan, trailer, a place kept', wrong.length === 0 && blocks.length >= 2 && blocks.every(w => w === '2 toilet blocks on sewer' || w === '2 toilet blocks') && blocks.includes('2 toilet blocks on sewer') && blocks.includes('2 toilet blocks'), {wrong, blocks, sample: table.slice(0, 6)});
  const bad = table.filter(t => /FWF|×/.test(t.words) || !/^\d+ /.test(t.words) || !['fwf', 'block', 'sewer', 'tank', 'access', 'trailer'].includes(t.kind));
  check('no line reads FWF or × in its words; every line has a number and one of the six symbols', bad.length === 0 && table.length === lines.length, {bad: bad.slice(0, 5), n: table.length});
  // the reference view at a code: the title in words with the symbol, the record label small beside the asset numbers
  const pick = kind => table.find(t => t.kind === kind);
  const want = [pick('fwf'), pick('sewer'), pick('tank'), pick('access'), pick('block'), pick('trailer')].filter(Boolean);
  const seen = [];
  for (const w of want) {
   /* a tank's and a pump-only trailer's only job is the pump out, so those lines show on the pump code; every other kind on the clean code */
   await c.goto('https://card.test/#r=' + w.ref + '.' + SIG + (w.k === 'tank' || w.k === 'pump_only' ? '~pump' : '~clean'), {waitUntil: 'domcontentloaded'});
   await c.waitForTimeout(1800);
   const v = await c.evaluate(ref => { const ls = [...document.querySelectorAll('.refcard .line')].map(d => { const t = d.querySelector('.ltitle'), n = d.querySelector('.nos'), g = t && t.querySelector('svg.lsym g.sym'); return {title: t ? t.textContent.trim() : null, sym: g ? [...g.classList].find(x => /^sym-/.test(x)) : null, symW: t && t.querySelector('svg.lsym') ? Math.round(t.querySelector('svg.lsym').getBoundingClientRect().width) : 0, rec: n && n.querySelector('.rec') ? n.querySelector('.rec').textContent : null, nos: n ? n.textContent : null, aria: (d.querySelector('.jobs') || {}).getAttribute ? d.querySelector('.jobs').getAttribute('aria-label') : null, jobAria: (d.querySelector('.job') || {}).getAttribute ? d.querySelector('.job').getAttribute('aria-label') : null}; }); return {ref: (document.querySelector('.bigref') || {}).textContent, mode: document.querySelector('.refcard .qrtag') ? 'tick' : null, lines: ls}; }, w.ref);
   seen.push({want: w, got: v});
   if (seen.length === 1) await c.screenshot({path: path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'card_' + w.ref + '_words.png'), fullPage: true});
  }
  const lineOk = s => s.got.ref === s.want.ref && s.got.mode === 'tick' && s.got.lines.length >= 1 && s.got.lines.every(l => l.title && /^\d+ /.test(l.title) && !/FWF|×/.test(l.title) && l.sym && l.symW >= 20 && l.rec && /×/.test(l.rec) && /Asset nos|^.*× /.test(l.nos || '') && l.aria && l.aria.startsWith(l.title + ',') && (!l.jobAria || l.jobAria.includes(', ' + l.title + ', '))) && s.got.lines.some(l => l.title === s.want.words && l.sym === 'sym-' + s.want.kind && l.rec === s.want.label);
  check('six references of different kinds at their codes: each line title in words with its symbol (28 px), the record label small, the spoken labels in words', want.length === 6 && seen.every(lineOk), seen.filter(s => !lineOk(s)).map(s => ({want: s.want, got: s.got})).slice(0, 3));
  check('each reference drawn is of its own kind: flush toilet, on sewer, sewer tank, accessible, toilet block, trailer', seen.map(s => s.want.kind).join(',') === 'fwf,sewer,tank,access,block,trailer', seen.map(s => s.want.ref + ':' + s.want.kind));
  // the focused reference under the plan names its lines in words
  const focus = await c.evaluate(ref => { const host = document.createElement('div'); host.id = 'zh'; host.style.cssText = 'position:absolute;left:0;top:0;width:390px;'; document.body.appendChild(host); window.SvcMap1129.setZoom(true); window.SvcMap1129.setView(null); window.SvcMap1129.setFocus(ref); host.innerHTML = window.SvcMap1129.html(ref); const f = host.querySelector('.amap-foot .lg.focus'); const t = f ? f.textContent : null; host.remove(); window.SvcMap1129.setFocus(null); window.SvcMap1129.setZoom(false); return t; }, want[0].ref);
  check('the focused reference under the plan reads in words', typeof focus === 'string' && focus.includes(want[0].ref) && focus.includes(want[0].words) && !/FWF|×/.test(focus), focus);
  check('the card tab has no page errors', cErrors.length === 0, cErrors.slice(0, 3));
  await c.close();
  const after = await p.evaluate(() => JSON.stringify(S));
  check('record unchanged by the run', before === after);
  check('no page errors', h.errors.length === 0, h.errors.slice(0, 3));
  check('no writes attempted', !h.counts || !h.counts.blocked, h.counts);
  fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'words_table_v1146.json'), JSON.stringify(table, null, 1));
 } finally { await h.browser.close(); }
 fs.writeFileSync(path.join(out, (live ? 'live_' : '') + (MOB ? 'phone_' : 'desktop_') + 'test_v1146.json'), JSON.stringify({at: new Date().toISOString(), live, results}, null, 1));
 console.log(`${results.length - failed}/${results.length} passed`);
 process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
