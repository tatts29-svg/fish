/* DCL / load-event only, no profiler. env PAGES (comma list of files), N (rounds), MOB, CPU. Order alternates each round. */
const {open} = require('./open2.cjs');
const INIT = `(() => { const P = window.__m = {}; document.addEventListener('DOMContentLoaded', () => { P.dcl = Math.round(performance.now()); }); addEventListener('load', () => { P.load = Math.round(performance.now()); }); })();`;
(async () => { const pages = process.env.PAGES.split(','), N = +(process.env.N || 5), MOB = process.env.MOB === '1', CPU = +(process.env.CPU || 0); const res = {};
  for (let r = 0; r < N; r++) { const order = r % 2 ? pages.slice().reverse() : pages;
    for (const f of order) { const s = await open({pageFile: f, init: INIT, cpu: CPU, ...(MOB ? {W: 390, H: 844, dpr: 2, mobile: true} : {W: 1440, H: 900})}); const m = await s.page.evaluate(() => window.__m); await s.browser.close(); (res[f] = res[f] || []).push([m.dcl, m.load]); } }
  const med = a => { a = a.slice().sort((x, y) => x - y); const k = a.length >> 1; return a.length % 2 ? a[k] : (a[k - 1] + a[k]) / 2; };
  for (const f of pages) console.log(f.split('/').pop(), 'DCL med', med(res[f].map(x => x[0])), 'load med', med(res[f].map(x => x[1])), JSON.stringify(res[f])); })();
