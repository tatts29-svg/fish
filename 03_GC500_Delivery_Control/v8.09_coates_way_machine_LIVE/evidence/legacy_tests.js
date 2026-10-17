// The legacy cog page (mechanism.html with app.js) under the v8.09 style.css. Author: Andrew Fisher. Read only: machine_rig.js serves
// the folder from disk and fetches anything else from the live machine by GET, checked against the manifest; nothing is sent anywhere.
//
// v8.09 changes one rule in style.css, which only mechanism.html uses: its two dialog close buttons (#info-close, #register-close) are a
// full 44 px touch target. Codex's v8.09 release audit (gap 3) asked for a bounded check of the legacy page's controls and readability.
// On a desktop and a phone, for the folder given (work, or base for comparison):
//   · the page loads and reports ready (the loading cover goes), with no page or console errors;
//   · every header, toolbar, mode, zoom and footer control and the motor button is drawn, its text at least 11 px, and on top where
//     it is (the element at its centre is the control or inside it) — after scrolling it into view on the phone;
//   · Controls ? opens the info dialog and Open parts register opens the register; in each, the close button is at least 44 × 44 px,
//     wholly on screen, on top at its centre, and a click on it closes the dialog.
// With BASELINE=<json from a base run> the work run also checks that no control moved or resized by more than 1 px against the live copy.
//
//   cd 03_GC500_Delivery_Control
//   CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) [OUT=<file.json>] [BASELINE=<file.json>] \
//     node v8.09_coates_way_machine_DRAFT/evidence/legacy_tests.js [work|base] [desk|phone]
const path = require('path'), fs = require('fs');
const {openMachine} = require('./machine_rig');
const which = process.argv[2] || 'work', device = process.argv[3] || 'desk', mob = device === 'phone';
const ROOT = path.isAbsolute(which) ? which : path.join(__dirname, '..', which);
const CONTROLS = ['tour', 'sound', 'fullscreen', 'view-3d', 'view-front', 'view-back', 'gearbox', 'zoom-out', 'zoom-in', 'motor', 'quality', 'reference', 'help', 'part-register'];
const checks = [];
const check = (name, ok, detail = '') => { checks.push({name, ok: !!ok, detail}); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`); };
const MEASURE = id => { const el = document.getElementById(id); if (!el) return null; el.scrollIntoView({block: 'center', inline: 'center'});
  const r = el.getBoundingClientRect(), cs = getComputedStyle(el), at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return {id, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), font: parseFloat(cs.fontSize),
    shown: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none', onTop: !!at && (at === el || el.contains(at)),
    inView: r.left >= -0.5 && r.top >= -0.5 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5}; };
(async () => {
  const m = await openMachine({root: ROOT, entry: 'mechanism.html', W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: mob ? 2 : 1, mobile: mob}), {page} = m;
  page.setDefaultTimeout(600000);
  const out = {root: ROOT, device, at: new Date().toISOString(), controls: {}};
  try {
    await page.waitForFunction(() => document.getElementById('loading').hidden || !!document.querySelector('#fallback:not([hidden])'), null, {timeout: 600000, polling: 500});
    check(`${device}: loads ready (loading cover gone, no graphics fallback)`, await page.evaluate(() => document.getElementById('loading').hidden && document.getElementById('fallback').hidden));
    await new Promise(r => setTimeout(r, 4000));
    for (const id of CONTROLS) {
      const c = await page.evaluate(MEASURE, id); out.controls[id] = c;
      check(`${device}: #${id} drawn, on top, text ≥ 11 px`, c && c.shown && c.onTop && c.font >= 11, c);
    }
    for (const [opener, dialog, close] of [['help', 'info', 'info-close'], ['part-register', 'parts-dialog', 'register-close']]) {
      await page.evaluate(id => { const el = document.getElementById(id); el.scrollIntoView({block: 'center'}); el.click(); }, opener);
      await page.waitForFunction(id => document.getElementById(id).open, dialog, {timeout: 30000}).catch(() => {});
      const c = await page.evaluate(MEASURE, close); out.controls[close] = c;
      check(`${device}: ${opener} opens #${dialog}; #${close} ≥ 44 × 44, wholly on screen, on top`, c && c.shown && c.w >= 44 && c.h >= 44 && c.inView && c.onTop, c);
      const box = await page.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, close);
      if (mob) await page.touchscreen.tap(box[0], box[1]); else await page.mouse.click(box[0], box[1]);
      await page.waitForFunction(id => !document.getElementById(id).open, dialog, {timeout: 15000}).catch(() => {});
      check(`${device}: a ${mob ? 'tap' : 'click'} on #${close} closes #${dialog}`, await page.evaluate(id => !document.getElementById(id).open, dialog));
    }
    if (process.env.BASELINE) {
      const base = JSON.parse(fs.readFileSync(process.env.BASELINE, 'utf8')).controls, moved = [];
      for (const id of CONTROLS) { const a = base[id], b = out.controls[id]; if (!a || !b || ['w', 'h', 'x', 'y', 'font'].some(k => Math.abs(a[k] - b[k]) > 1)) moved.push({id, base: a, work: b}); }
      check(`${device}: no legacy control moved or resized against the live copy (${path.basename(process.env.BASELINE)})`, !moved.length, moved.slice(0, 3));
    }
  } catch (e) { check(`${device}: run completed`, false, String(e).slice(0, 300)); }
  const errs = m.errors.filter(e => !/favicon/i.test(e)); check(`${device}: no page or console errors`, !errs.length, errs.slice(0, 4).join(' | '));
  await m.close();
  const failed = checks.filter(c => !c.ok).length;
  console.log(`\n${checks.length - failed}/${checks.length} checks passed (${which}, ${device})`);
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({...out, checks}, null, 1));
  process.exitCode = failed ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
