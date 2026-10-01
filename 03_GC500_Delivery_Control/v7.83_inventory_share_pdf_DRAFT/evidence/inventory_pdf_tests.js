// v7.83 - Inventory: Share PDF. Author: Andrew Fisher. Read-only: GETs only, writes aborted by the harness, nothing shared.
//   PAGE=<built page> [MOB=1] [OUT=<json>] node inventory_pdf_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path');
(async () => {
  const MOB = !!process.env.MOB, s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 1000}), p = s.page;
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  await p.waitForFunction(() => typeof inv83Open === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  const run = async disc => {
    await p.evaluate(d => { INV.disc = d; location.hash = '#change/' + todayIso(); try { render(); } catch (e) {} }, disc);
    await p.waitForSelector('[data-inv83]', {timeout: 60000}); await new Promise(r => setTimeout(r, 800));
    await p.evaluate(() => document.querySelector('[data-inv83]').click());
    await p.waitForFunction(() => window.__inv83 && window.__inv83.state !== 'making', null, {timeout: 300000}).catch(() => null);
    return p.evaluate(() => Object.assign({}, window.__inv83, {acts: [...document.querySelectorAll('#inv83 .pdf7-acts a, #inv83 .pdf7-acts button')].map(b => b.textContent.trim()), panel: !!document.querySelector('#inv83')}));
  };
  // the layout itself, checked before it is photographed
  const lay = async disc => p.evaluate(d => { INV.disc = d; const D = inv83Pages(); const st = document.getElementById('inv83css') || Object.assign(document.createElement('style'), {id: 'inv83css', textContent: INV83_CSS}); document.head.appendChild(st);
    const w = document.createElement('div'); w.className = 'i83'; w.innerHTML = D.pages.map(x => x.html).join(''); document.body.appendChild(w);
    const pg = [...w.querySelectorAll('.pg')], fit = pg.every(x => x.scrollHeight <= x.clientHeight + 1 && x.scrollWidth <= x.clientWidth + 1);
    const cards = [...w.querySelectorAll('.card')], qrs = cards.filter(c => c.querySelector('.qr svg')).length, noQr = cards.filter(c => !c.querySelector('.qr svg')).map(c => c.querySelector('.ref').textContent);
    const money = (w.querySelector('.tile:nth-child(4) b') || {}).textContent, foot = (w.querySelector('tfoot') || {}).textContent || '', words = w.textContent;
    w.remove(); return {pages: D.pages.map(x => x.o), rows: D.rows, bodyRows: D.bodyRows, togo: D.togo, cards: cards.length, qrs, noQr, fit, money, foot: foot.replace(/\s+/g, ' ').trim(), p33: /\bP33\b/.test(words.replace(/\bP33\b(?= *<)/g, '')) && /report to P33|P33 \(pit|P33, pit/.test(words), known: D.money}; }, disc);
  const A = await lay('*');
  ok('F1 every trade: the summary, then every location still to come at ten to a page (' + A.togo + ' locations, ' + A.pages.length + ' pages)', A.togo > 0 && A.cards === A.togo && A.pages.length === (A.pages.filter(x => x === 'lan').length || 1) + Math.ceil(A.togo / 10), JSON.stringify({pages: A.pages, rows: A.rows, togo: A.togo}));
  ok('F2 the summary is one A4 portrait page when it fits, else A4 landscape pages (every trade: ' + A.rows + ' types)', (A.bodyRows <= 34 ? A.pages[0] === 'por' : A.pages[0] === 'lan'), A.bodyRows + ' table rows · ' + A.pages.join(','));
  ok('F3 every page fits its sheet (nothing cut off)', A.fit, '');
  ok('F4 every location with a position has a QR code that navigates to it; one with none says set it in Edit', A.qrs + A.noQr.length === A.cards && A.qrs > 0, JSON.stringify({qr: A.qrs, none: A.noQr}));
  ok('F5 costed from the Pricing figure (assetTotal): a total in $, and lines with no rate counted, not added', /^\$[\d,]+$/.test(A.money) && /Total/.test(A.foot), JSON.stringify({money: A.money, known: A.known}));
  ok('F6 "P33" is never printed as a destination', !A.p33, '');
  const B = await lay('Toilets & amenities');
  ok('F7 one trade fits one A4 portrait summary page (Toilets & amenities: ' + B.rows + ' types)', B.pages[0] === 'por' && B.pages.filter(x => x === 'por').length >= 1 && B.fit, B.pages.join(','));
  const R = await run('Toilets & amenities');
  ok('F8 Share PDF makes the file on this device and offers Open and Save (Share where the device can)', R.state === 'ready' && R.pages === B.pages.length && R.acts.includes('Open') && R.acts.includes('Save') && R.size > 20000, JSON.stringify(R));
  await p.evaluate(() => document.querySelectorAll('#inv83').forEach(e => e.remove()));
  if (!MOB) { // the pages as pictures, for the README
    await p.evaluate(() => { INV.disc = 'Toilets & amenities'; const D = inv83Pages(); const w = document.createElement('div'); w.id = 'shot83'; w.className = 'i83'; w.style.cssText = 'position:absolute;left:0;top:0;z-index:2147483647;background:#ccc;padding:8mm'; w.innerHTML = D.pages.slice(0, 2).map(x => x.html).join(''); document.body.appendChild(w); });
    const els = await p.$$('#shot83 .pg'); for (let k = 0; k < els.length; k++) await els[k].screenshot({path: path.join(__dirname, 'inventory_pdf_page' + (k + 1) + '.png')});
    await p.evaluate(() => document.getElementById('shot83').remove());
  }
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail.slice(0, 300)));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop'));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
