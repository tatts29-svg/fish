// v7.91 - Today on a wide screen: Back in the header row, picture band capped, Deliveries fills, cards fill each row.
// Read-only: GETs only, writes aborted.   PAGE=<built page> TAG=<name> node today_tidy_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path');
(async () => { const R = {};
 for (const [W, H, mob, name] of [[2000, 1040, false, 'wide'], [1333, 693, false, 'laptop'], [390, 844, true, 'phone']]) {
  const s = await open(mob ? {pageFile: process.env.PAGE, W, H, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W, H}), p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await new Promise(r => setTimeout(r, 3000));
  for (const h of ['#timeline', '#plant', '#today']) { await p.evaluate(x => { location.hash = x; }, h); await new Promise(r => setTimeout(r, 2500)); }
  const m = await p.evaluate(() => { const q = s => document.querySelector(s), r = e => { if (!e) return null; const b = e.getBoundingClientRect(); return {x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height)}; };
    const back = q('header.top .navback'), del = [...document.querySelectorAll('#pane-today .hubcard.island')][1], cb = del && del.querySelector('.cblock');
    const cards = [...document.querySelectorAll('#pane-today .hub > .card')].filter(c => c.offsetWidth).map(c => r(c));
    const rows = {}; cards.forEach(c => { (rows[c.y] = rows[c.y] || []).push(c); });
    const rowFill = Object.values(rows).map(rw => { const L = Math.min(...rw.map(c => c.x)), Rr = Math.max(...rw.map(c => c.x + c.w)); return {n: rw.length, span: Rr - L}; });
    const hub = r(q('#pane-today .hub'));
    return {header: Math.round(q('header.top').getBoundingClientRect().height), back: back && back.offsetWidth ? r(back) : null, brandrow: r(q('header.top .brandrow')), search: r(q('header.top .brandrow > .search')),
      band: r(q('#pane-today .dsnband')), delCard: r(del), cblock: r(cb), hubW: hub && hub.w, rows: rowFill, over: document.documentElement.scrollWidth > innerWidth + 1}; });
  await p.screenshot({path: path.join(__dirname, process.env.TAG + '_' + name + '_top.png')});
  // the cards and the deliveries panel
  await p.evaluate(() => { const e = [...document.querySelectorAll('#pane-today .hubcard.island')][1]; if (e) e.scrollIntoView({block: 'start'}); }); await new Promise(r => setTimeout(r, 800));
  await p.screenshot({path: path.join(__dirname, process.env.TAG + '_' + name + '_deliveries.png')});
  await p.evaluate(() => { const e = document.querySelector('#pane-today .hub'); if (e) e.scrollIntoView({block: 'start'}); }); await new Promise(r => setTimeout(r, 800));
  await p.screenshot({path: path.join(__dirname, process.env.TAG + '_' + name + '_cards.png')});
  R[name] = Object.assign(m, {errors: s.errors.length, blocked: s.counts.blocked}); console.log(process.env.TAG, name, JSON.stringify(R[name]));
  await s.browser.close(); }
 fs.writeFileSync(path.join(__dirname, process.env.TAG + '_today.json'), JSON.stringify(R, null, 1)); })();
