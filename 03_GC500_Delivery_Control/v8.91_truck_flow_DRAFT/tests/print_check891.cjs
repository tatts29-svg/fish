// Author: Andrew Fisher. v8.91 — the real Drivers and Install PDFs the page makes (pdf7, one A4 per load plus location signs), saved
// from the page's own blobs so they can be looked at; the daily page for the install teams; the day's load lines. No live writes.
//   PAGE=<candidate> OUT=<dir> [DAY=2026-10-08] node v8.91_truck_flow_DRAFT/tests/print_check891.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
(async () => { let s; try { const OUT = process.env.OUT; fs.mkdirSync(OUT, {recursive: true});
  s = await open({pageFile: process.env.PAGE, hash: '#timeline', W: 1440, H: 900}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof dpLoads === 'function', null, {timeout: 150000}); await p.waitForTimeout(2500);
  /* runs on the base page too (for the before pictures): the v8.91 helpers are optional there */
  await p.evaluate(() => { if (typeof flow891Remember !== 'function') window.flow891Remember = n => { try { localStorage.setItem('gc500.printedBy', n); } catch (e) {} }; });
  const day = process.env.DAY || await p.evaluate(() => { const t0 = todayIso(); const d = programmeDays().find(x => x.iso >= t0 && dpLoads(x).filter(g => g.kind === 'deliveries').length >= 4) || programmeDays().find(x => x.iso >= t0 && dpLoads(x).length >= 2); return d ? d.iso : t0; });
  console.log('day', day);
  /* the edit stubs: the pre-dispatch check needs an edit link to be meaningful, the PDFs do not; the record is never written */
  await p.evaluate(iso => { window.__saved = JSON.stringify(S); window.bump = () => { render(); }; window.whoAmI = () => 'Andrew Fisher'; window.mayWrite = () => true; window.capability = () => 'edit'; SYNC.readonly = false; flow891Remember('Andrew Fisher'); S.operator = 'Andrew Fisher'; state.day = iso; state.tlView = 'day'; go('timeline'); render(); }, day);
  await p.waitForTimeout(800);
  /* 1. the day's load lines, as drawn */
  await p.evaluate(() => { const el = document.querySelector('#pane-timeline .ldlist'); if (el) el.scrollIntoView({block: 'start'}); }); await p.waitForTimeout(400); await p.screenshot({path: path.join(OUT, 'day_lines.png')});
  /* 2. Drivers PDFs: the pre-dispatch check, then the page's own PDF maker */
  const savePdfs = async (kind) => { const files = await p.evaluate(() => new Promise(res => { const t0 = Date.now(); const tick = () => { const st = window.__pdf707 || {}; if (st.state === 'ready') { Promise.all(PDF7.files.map(f => new Promise(r => { const fr = new FileReader(); fr.onload = () => r({name: f.name, label: f.label, pages: f.pages, role: f.role, b64: String(fr.result).split(',')[1]}); fr.readAsDataURL(f.blob); }))).then(res); }
      else if (st.state === 'failed' || Date.now() - t0 > 240000) res({error: st.error || 'timed out', state: st.state}); else setTimeout(tick, 500); }; tick(); }));
    if (files.error) { console.log(kind + ' FAILED ' + files.error); return []; }
    files.forEach(f => fs.writeFileSync(path.join(OUT, f.name), Buffer.from(f.b64, 'base64'))); console.log(kind + ' files: ' + files.map(f => f.name + ' (' + f.pages + ' p)').join(', ')); return files; };
  await p.evaluate(iso => new Promise(res => { drvCheck782(iso, null, () => { pdf7Open('drivers', iso, null, false); res('opened'); }); setTimeout(() => { const box = document.getElementById('drv782'); if (!box) return res('no dialog'); box.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = true; c.dispatchEvent(new Event('change', {bubbles: true})); }); const nm = box.querySelector('#drv782n'); nm.value = 'Andrew Fisher'; nm.dispatchEvent(new Event('input', {bubbles: true})); box.querySelector('.b-go').click(); }, 300); }), day);
  await p.waitForTimeout(500); await p.screenshot({path: path.join(OUT, 'pdf_panel_making.png')});
  const drv = await savePdfs('drivers'); await p.screenshot({path: path.join(OUT, 'pdf_panel_ready.png')}); await p.evaluate(() => pdf7Close());
  /* 3. Install PDFs */
  await p.evaluate(iso => { pdf7Open('install', iso, null, false); }, day); const ins = await savePdfs('install'); await p.evaluate(() => pdf7Close());
  /* 4. the daily page for an install team, as it would be sent (local preview, nothing published) */
  const html = await p.evaluate(iso => daily821Html(daily821Model(iso), {name: 'Install team'}, 'local'), day); fs.writeFileSync(path.join(OUT, 'daily_page.html'), html);
  const ctx2 = await s.browser.newContext({viewport: {width: 430, height: 1400}, deviceScaleFactor: 2}); const p2 = await ctx2.newPage(); await p2.setContent(html, {waitUntil: 'load'}); await p2.waitForTimeout(400);
  await p2.evaluate(() => document.querySelectorAll('details').forEach(d => d.open = true)); await p2.screenshot({path: path.join(OUT, 'daily_page_phone.png'), fullPage: true}); await ctx2.close();
  const sms = await p.evaluate(iso => daily861Body(iso, {name: 'Install team'}, 'https://example.invalid/d/x', {text: 'Fine, 24°'}), day); fs.writeFileSync(path.join(OUT, 'sms_text.txt'), sms);
  await p.evaluate(() => { S = JSON.parse(window.__saved); });
  console.log('errors', JSON.stringify(s.errors), 'blocked', s.counts.blocked, 'drivers', drv.length, 'install', ins.length); await s.browser.close(); process.exit(s.errors.length || s.counts.blocked ? 1 : 0);
} catch (e) { console.error('FAIL', e && e.stack || e); if (s && s.browser) await s.browser.close().catch(() => {}); process.exit(2); } })();
