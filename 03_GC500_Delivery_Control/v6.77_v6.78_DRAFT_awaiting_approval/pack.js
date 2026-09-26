// element-level shots for the approval pack: node pack.js <tag>
const {chromium} = require('playwright');
const SHOTS = [
 ['01_today_gauge', '#today', 'js:document.querySelector(".dialcard")'],
 ['02_header_daybox', '#today', 'js:document.querySelector("#hztd")'],
 ['03_header_countdown', '#today', 'js:document.querySelector("#hzcd")'],
 ['04_coatesway_centre', '#coatesway', 'js:[...document.querySelectorAll(".cwc")].find(c=>/The centre/.test(c.textContent))'],
 ['05_coatesway_red', '#coatesway', 'js:[...document.querySelectorAll(".cwc")].find(c=>/third ring/.test(c.textContent))'],
 ['06_coatesway_financials', '#coatesway', 'js:[...document.querySelectorAll(".cwpill")].find(c=>/Financials/.test(c.textContent))'],
 ['07_costs_headline', '#costs', 'js:document.querySelector("#pane-costs .verdict")'],
 ['08_costs_raceweekend', '#costs', 'js:[...document.querySelectorAll("#pane-costs .kpi")].find(k=>/Race weekend/.test(k.textContent))'],
 ['09_fence_plate', '#progress', 'js:document.querySelector(".grp.fence")'],
 ['10_fencing_rates', '#fencing', 'js:document.querySelector(".fratetbl")'],
 ['11_wb02_removal', '#day/2026-09-27', 'js:document.querySelector("[data-dckey=WB02]")'],
 ['12_labour_pricing', '#pricing', 'js:document.querySelector(".labplan") || [...document.querySelectorAll("#pane-pricing .card")].find(c=>/Labour per piece/.test(c.textContent))'],
 ['13_wwa_money', '#progress', 'js:document.querySelector(".mcard.ledgerc")'],
];
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']}); const tag = process.argv[2];
  const p = await (await b.newContext({viewport: {width: 1366, height: 900}})).newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 160)));
  let cur = null;
  for (const [name, hash, sel] of SHOTS) {
    if (cur !== hash) { await p.goto('http://127.0.0.1:8814/v/viewtokenviewtoken1/' + hash, {waitUntil: 'load'}); await p.waitForTimeout(2600); cur = hash; }
    const h = await p.evaluateHandle(s => eval(s.slice(3)) || null, sel); const el = h.asElement();
    if (!el) { console.log(name, 'NOT FOUND'); continue; }
    await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
    try { await el.screenshot({path: `pack/${tag}_${name}.png`, timeout: 20000}); console.log(name, 'ok'); } catch (e) { console.log(name, 'fail', String(e).slice(0, 80)); }
  }
  console.log('errors', JSON.stringify(errs)); await b.close(); })();
