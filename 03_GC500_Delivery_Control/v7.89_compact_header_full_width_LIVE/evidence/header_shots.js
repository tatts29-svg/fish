// v7.89 - before/after pictures and measurements of the header. Read-only: GETs only, writes aborted by the harness.
//   PAGE=<built page> TAG=<name> OUT=<dir> node header_shots.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs'), path = require('path');
(async () => { const R = {};
 for (const [W, H, mob, name] of [[1333, 693, false, 'laptop'], [1920, 1040, false, 'wide'], [1100, 800, false, 'small'], [390, 844, true, 'phone']]) {
  const s = await open(mob ? {pageFile: process.env.PAGE, W, H, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W, H}), p = s.page;
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 240000}); await new Promise(r => setTimeout(r, 3000));
  await p.evaluate(() => { location.hash = '#timeline'; }); await new Promise(r => setTimeout(r, 3500));
  const m = () => p.evaluate(() => { const h = document.querySelector('header.top'), pods = ['#tpod', '#hzcd', '#recstrip'].map(s => document.querySelector(s)).filter(Boolean).map(e => Math.round(e.getBoundingClientRect().width)), pane = [...document.querySelectorAll('main > section.pane')].find(e => !e.hidden && e.offsetHeight > 50);
   return {header: Math.round(h.getBoundingClientRect().height), win: innerHeight, pct: Math.round(h.getBoundingClientRect().height / innerHeight * 100), pods, paneW: pane ? pane.offsetWidth : 0, winW: innerWidth, over: document.documentElement.scrollWidth > innerWidth + 1}; });
  const top = await m(); await p.screenshot({path: path.join(process.env.OUT, process.env.TAG + '_' + name + '_top.png')});
  await p.evaluate(() => { const mm = document.querySelector('main'); mm.scrollTop = 600; mm.dispatchEvent(new Event('scroll')); }); await new Promise(r => setTimeout(r, 800));
  const scrolled = await m(); await p.screenshot({path: path.join(process.env.OUT, process.env.TAG + '_' + name + '_scrolled.png')});
  await p.evaluate(() => { const mm = document.querySelector('main'); mm.scrollTop = 0; mm.dispatchEvent(new Event('scroll')); }); await new Promise(r => setTimeout(r, 600));
  const back = await m();
  R[name] = {top, scrolled, back, errors: s.errors.length, blocked: s.counts.blocked}; console.log(process.env.TAG, name, JSON.stringify(R[name]));
  await s.browser.close(); }
 fs.writeFileSync(path.join(process.env.OUT, process.env.TAG + '_header.json'), JSON.stringify(R, null, 1)); })();
