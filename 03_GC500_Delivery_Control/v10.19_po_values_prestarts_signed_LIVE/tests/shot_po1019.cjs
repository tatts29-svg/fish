/* Author: Andrew Fisher. Phone and desktop screenshots of the Fencing tab's purchase-order table on the built page, read only.
   PAGE=build/GC500_v10.19/GC500_Delivery_Control_hosted.html node tests/shot_po1019.cjs
 The harness opens the public view link, which hides Save and Mark checked. For the shots the body's `viewonly` class
 is taken off so the card shows as an editor sees it (nothing is written; every write is aborted by the harness).
 Writes tests/po_phone.png (table start), tests/po_phone_value.png (scrolled to the Value column), tests/po_desktop.png,
 and tests/po_desktop_viewonly.png (the public link as it is), and prints the measured layout so a clipped field is a
 number, not an opinion. */
'use strict';
const path = require('path');
const {open} = require(path.resolve(__dirname, '../../toolchain/harness/open_page.js'));
const PAGE = process.env.PAGE || path.resolve(__dirname, '../../build/GC500_v10.19/GC500_Delivery_Control_hosted.html');
async function shot(mobile) {
 const h = await open(mobile ? {pageFile: PAGE, hash: '#fencing', W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: PAGE, hash: '#fencing', W: 1440, H: 900});
 try {
  const p = h.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof poCard === 'function' && SYNC.first && typeof SYNC_COLLS !== 'undefined' && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 180000});
  await p.evaluate(() => { go('fencing'); }); await p.waitForTimeout(2500);
  const toCard = () => { const card = document.querySelector('#pane-fencing [data-po-values1014]'); for (let n = card; n; n = n.parentElement) if (n.tagName === 'DETAILS') n.open = true; card.scrollIntoView({block: 'start'}); window.scrollBy(0, -6); };
  await p.evaluate(toCard); await p.waitForTimeout(800);
  if (!mobile) await p.screenshot({path: path.join(__dirname, 'po_desktop_viewonly.png')});
  const measure = () => { const card = document.querySelector('#pane-fencing [data-po-values1014]'); const w = card.querySelector('.tblwrap'); const i = card.querySelector('[data-po-amt="4647519"]'); const b = card.querySelector('[data-po-check1019]'), s = card.querySelector('[data-po-save]');
   const r = i.getBoundingClientRect(), wr = w.getBoundingClientRect(), br = b ? b.getBoundingClientRect() : null, sticky = i.closest('tr').cells[0].getBoundingClientRect();
   return {viewonly: document.body.classList.contains('viewonly'), saveShown: s ? getComputedStyle(s).display !== 'none' : null, markShown: b ? getComputedStyle(b).display !== 'none' : null,
    innerW: window.innerWidth, pageScrollW: document.documentElement.scrollWidth, tblwrapW: Math.round(wr.width), tableScrollW: w.scrollWidth, scrollLeft: w.scrollLeft, stickyColW: Math.round(sticky.width), inputW: Math.round(r.width), inputH: Math.round(r.height), inputTextFits: i.scrollWidth <= i.clientWidth, inputInView: r.left >= wr.left - 1 && r.right <= wr.right + 1, inputClearOfSticky: r.left >= sticky.right - 1, inputLeftMinusStickyRight: Math.round(r.left - sticky.right), markBtnW: br ? Math.round(br.width) : null, markBtnInView: br ? br.left >= wr.left - 1 && br.right <= wr.right + 1 : null, rowH: Math.round(i.closest('tr').getBoundingClientRect().height)}; };
  const asView = await p.evaluate(measure);
  await p.evaluate(() => { document.body.classList.remove('viewonly'); }); await p.evaluate(toCard); await p.waitForTimeout(500);
  const out = path.join(__dirname, mobile ? 'po_phone.png' : 'po_desktop.png');
  await p.screenshot({path: out});
  const asEditor = await p.evaluate(measure);
  let scrolledToValue = null;
  if (mobile) { await p.evaluate(() => { const w = document.querySelector('#pane-fencing [data-po-values1014] .tblwrap'); w.scrollLeft = w.scrollWidth; }); await p.waitForTimeout(500); await p.screenshot({path: path.join(__dirname, 'po_phone_value.png')}); scrolledToValue = await p.evaluate(measure); }
  console.log(JSON.stringify({mobile, out, asView, asEditor, scrolledToValue, errors: h.errors, counts: h.counts}));
 } finally { await h.browser.close().catch(() => {}); }
}
(async () => { await shot(true); await shot(false); })().catch(e => { console.error('FAIL', e.message); process.exit(1); });
