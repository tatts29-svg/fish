// read-only smoke test of the LIVE view link through curl (GETs only; writes aborted)
const {chromium} = require('playwright'); const {curlRoute} = require('/tmp/claude-0/explorer_audit/curlroute.js');
(async () => { const b = await chromium.launch({executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox']});
  const ctx = await b.newContext({viewport: {width: 1366, height: 900}}); await ctx.route('**/*', curlRoute);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
  await p.goto('https://gc500-production.up.railway.app/v/Coates-GC500-2026/#today', {waitUntil: 'load', timeout: 120000}); await p.waitForTimeout(6000);
  const out = {};
  for (const t of ['today', 'progress', 'runsheet', 'questions', 'pricing', 'costs', 'coatesway']) { await p.evaluate(t => go(t), t); await p.waitForTimeout(1500);
    out[t] = await p.evaluate(() => { const pn = document.querySelector('.pane.on'); return pn ? pn.innerText.length : 0; }); }
  const facts = await p.evaluate(() => ({rec: (document.querySelector('#recstrip') || {}).innerText, labour: (() => { try { const L = labourPlan().all; return [L.charged, Math.round(L.expected), Math.round(L.tocome), Math.round(L.later)]; } catch (e) { return String(e); } })(), q: (() => { try { return questionsList().length; } catch (e) { return String(e); } })(), hours: (() => { try { return trackerFigures().labour.hours; } catch (e) { return String(e); } })()}));
  await p.evaluate(() => go('runsheet')); await p.waitForTimeout(1200); await p.screenshot({path: 'pack/live_runsheet.png'});
  console.log(JSON.stringify({out, facts, errs}, null, 1)); await b.close(); })();
