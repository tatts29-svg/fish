#!/usr/bin/env node
/* Author: Andrew Fisher. Practice tests for the VMS boards tab (v10.24), read only through the toolchain harness: the
   page is opened at the live address reading the live record and every write it tries is ABORTED.

     PAGE=build/GC500_v10.24/GC500_Delivery_Control_hosted.html node test_vms1024.cjs [--shots dir]

   1 view link, phone: #vms renders 28 cards (10 construction, 13 event, 5 end-of-session), each with a pin, a QR, a
     navigate link, the plan crop; satellite close-ups arrive for the positions inside the aerial; fields disabled; no
     page errors; nothing pre-ticked.
   2 edit practice, phone (capability overridden, every PUT aborted): asset number, number plate, notes, a typed
     position, a bad position refused, the in-place tick; exactly the planned loads/stamps/by documents are tried; the
     record shape; the card re-renders with the values.
   3 print path, desktop: #print/vms/20 → the tab, the bar, one sheet with the two messages, the QR, the pin, the
     identity boxes; #print/vms/all → 28 sheets with page breaks, every one fitted; Close restores the page.
   4 the other tabs still route; the Equipment tab's VMS register fold is still there. */
'use strict';
const fs = require('fs'), path = require('path');
const TOOLCHAIN = path.join(__dirname, '..', '..', 'toolchain');
const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
const PAGE = process.env.PAGE; if (!PAGE) { console.error('PAGE=... is needed'); process.exit(2); }
const args = process.argv.slice(2), shots = args.includes('--shots') ? args[args.indexOf('--shots') + 1] : path.join(__dirname, 'shots');
fs.mkdirSync(shots, {recursive: true});
const out = {page: path.basename(PAGE), checks: [], fails: []};
const check = (name, ok, detail) => { out.checks.push({name, ok: !!ok, detail}); if (!ok) out.fails.push(name); console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail !== undefined ? '  ' + JSON.stringify(detail).slice(0, 240) : '')); };
const live = async page => page.waitForFunction(() => typeof SYNC !== 'undefined' && (SYNC.status === 'live' || SYNC.status === 'unreachable'), null, {timeout: 240000});
const docIdOf1024 = key => [...String(key)].map(ch => /[A-Za-z0-9_\-.:@+]/.test(ch) ? ch : '~' + ch.codePointAt(0).toString(16) + '~').join('').slice(0, 180);

(async () => {
  let s = await open({pageFile: PAGE, hash: '#vms', mobile: true, W: 390, H: 844, dpr: 2});
  await live(s.page); await s.page.waitForTimeout(3000);
  await s.page.waitForFunction(() => { const im = [...document.querySelectorAll('#pane-vms .v1024-sat img')]; return im.length >= 56 && im.every(i => i.complete); }, null, {timeout: 180000}).catch(() => null);
  const v = await s.page.evaluate(() => {
    const pane = document.getElementById('pane-vms'), cards = [...pane.querySelectorAll('.v1024-card')];
    const N = window.VMS1024, bs = N.boards();
    return {tab: state.tab, shown: pane.classList.contains('on'), cards: cards.length, boards: bs.length,
      construction: bs.filter(b => b.phase === 'construction').length, event: bs.filter(b => b.phase === 'event' && !b.session).length, session: bs.filter(b => b.session).length,
      qrs: pane.querySelectorAll('.v1024-qr svg').length, navs: [...pane.querySelectorAll('a[href*="google.com/maps/dir"]')].length, plans: pane.querySelectorAll('.v1024-plan img').length,
      airs: [...pane.querySelectorAll('.v1024-sat img')].filter(i => i.complete && i.naturalWidth > 0).length, satFail: [...pane.querySelectorAll('.v1024-sat img')].filter(i => i.complete && i.naturalWidth === 0).length, key: !!(typeof liveMapKey === 'function' && liveMapKey()), inFrame: bs.filter(b => N.frame(N.position(b))).length,
      disabled: [...pane.querySelectorAll('.v1024-txt, [data-v1024]')].filter(e => e.disabled).length, fields: pane.querySelectorAll('.v1024-txt, [data-v1024]').length,
      preTicked: [...pane.querySelectorAll('[data-v1024="inplace"]')].filter(e => e.checked).length,
      msgs20: pane.querySelectorAll('.v1024-card[data-pos="20"] .v1024-msg').length, msg20text: (pane.querySelector('.v1024-card[data-pos="20"] .v1024-msg code') || {}).textContent,
      asset01: (pane.querySelector('.v1024-card[data-pos="01"] [data-f="asset"]') || {}).value, asset09: (pane.querySelector('.v1024-card[data-pos="09"] [data-f="asset"]') || {}).value,
      notes13: (pane.querySelector('.v1024-card[data-pos="13"] [data-f="notes"]') || {}).value, footer: (document.body.innerText.match(/v10\.\d+/g) || []).pop(),
      latlon20: (pane.querySelector('.v1024-card[data-pos="20"] [data-v1024="latlon"]') || {}).value};
  });
  check('1 #vms opens the VMS boards pane with 28 cards (10 + 13 + 5)', v.tab === 'vms' && v.shown && v.cards === 28 && v.boards === 28 && v.construction === 10 && v.event === 13 && v.session === 5, {cards: v.cards, c: v.construction, e: v.event, s: v.session});
  check('1 every card has a QR, a navigate link and the plan crop', v.qrs === 28 && v.navs === 28 && v.plans === 28, {qrs: v.qrs, navs: v.navs, plans: v.plans});
  check('1 the service gave the map key and two satellite close-ups loaded on every card (56)', v.key && v.airs === 56 && v.satFail === 0, {key: v.key, loaded: v.airs, failed: v.satFail});
  check('1 view link: every field disabled, nothing pre-ticked', v.disabled === v.fields && v.preTicked === 0, {fields: v.fields, disabled: v.disabled});
  check('1 VMS 20 shows its two messages', v.msgs20 === 2 && /TICKETS/.test(v.msg20text || ''), {msgs: v.msgs20, text: v.msg20text});
  check('1 asset numbers come from the record (vms1 → 1211354) and the register (VMS09 → 1211404)', v.asset01 === '1211354' && v.asset09 === '1211404', {a01: v.asset01, a09: v.asset09});
  check('1 VMS 13 carries Brenden’s go-out-early note; VMS 20 its pin', /go out early/.test(v.notes13 || '') && /^-27\.9935/.test(v.latlon20 || ''), {latlon20: v.latlon20});
  check('1 footer v10.24, no page errors, no writes', /v10\.24/.test(v.footer || '') && s.errors.length === 0 && s.counts.blocked === 0, {footer: v.footer, errors: s.errors, blocked: s.counts.blocked});
  await s.page.screenshot({path: path.join(shots, 'phone_vms_top.png')});
  await s.page.evaluate(() => document.querySelector('.v1024-card[data-pos="20"]').scrollIntoView());
  await s.page.waitForTimeout(600);
  await s.page.screenshot({path: path.join(shots, 'phone_vms_20.png')});

  /* 2 edit practice */
  const puts = []; s.page.on('request', r => { if (r.method() !== 'GET' && /\/api\/doc\//.test(r.url())) puts.push({url: r.url().replace(/^https:\/\/[^/]+/, ''), body: r.postData() || ''}); });
  const before = s.counts.blocked;
  const e = await s.page.evaluate(async () => {
    window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit';
    S.operator = 'Practice Operator 1024'; if (document.querySelector('#who')) document.querySelector('#who').value = 'Practice Operator 1024';
    const N = window.VMS1024; const r = {};
    const keysBefore = Object.keys(S.loads || {}).filter(k => k.startsWith('vms1024/'));
    r.asset = N.write('20', {asset: '1211383'}, 'practice'); r.rego = N.write('20', {rego: 'ABC123'}, 'practice'); r.notes = N.write('20', {notes: 'practice note'}, 'practice');
    r.pos = N.setPosition('20', -27.99351, 153.43108, 'typed on the page'); r.badPos = N.setPosition('20', -33.8, 151.2, 'typed on the page');
    r.inplace = N.write('20', {inPlace: true}, 'practice'); r.wrong = N.write('99', {asset: 'x'}, 'practice');
    r.rec = S.loads['vms1024/20']; r.keys = Object.keys(S.loads || {}).filter(k => k.startsWith('vms1024/') && !keysBefore.includes(k));
    r.stamp = !!S.stamps['loads/vms1024/20']; r.by = S.by['loads/vms1024/20'];
    N.render(); const c = document.querySelector('.v1024-card[data-pos="20"]');
    r.ui = {asset: c.querySelector('[data-f="asset"]').value, rego: c.querySelector('[data-f="rego"]').value, latlon: c.querySelector('[data-v1024="latlon"]').value, inplace: c.querySelector('[data-v1024="inplace"]').checked, done: c.classList.contains('done')};
    SYNC.readonly = false; SYNC.level = 'edit'; try { syncSend(); } catch (x) { r.sendErr = String(x); }
    await new Promise(res => setTimeout(res, 2500)); return r;
  });
  check('2 writes accepted; a non-Gold-Coast position and an unknown position refused', e.asset && e.rego && e.notes && e.pos && e.inplace && e.badPos === false && e.wrong === false, {badPos: e.badPos, wrong: e.wrong});
  check('2 record shape: kind, pos, asset, rego, notes, lat/lon with how/by, inPlace, by, at', e.rec && e.rec.kind === 'vms1024' && e.rec.pos === '20' && e.rec.asset === '1211383' && e.rec.rego === 'ABC123' && e.rec.notes === 'practice note' && e.rec.lat === -27.99351 && e.rec.lon === 153.43108 && e.rec.posHow === 'typed on the page' && e.rec.inPlace === true && e.rec.by === 'Practice Operator 1024', e.rec);
  check('2 one document for the position, stamped and named', e.keys.length === 1 && e.keys[0] === 'vms1024/20' && e.stamp && e.by === 'Practice Operator 1024', {keys: e.keys, by: e.by});
  check('2 the card shows the saved values and the in-place state', e.ui.asset === '1211383' && e.ui.rego === 'ABC123' && /^-27\.993510, 153\.431080$/.test(e.ui.latlon) && e.ui.inplace && e.ui.done, e.ui);
  const ids = puts.map(p => p.url.replace(/^\/api\/doc\//, '')), want = ['loads/' + docIdOf1024('vms1024/20'), 'stamps/' + docIdOf1024('loads/vms1024/20'), 'by/' + docIdOf1024('loads/vms1024/20')];
  const extra = ids.filter(i => !want.includes(i)), missing = want.filter(w => !ids.includes(w));
  check('2 the page tried exactly the planned PUTs (loads, stamps, by), all aborted by the harness', puts.length > 0 && !missing.length && !extra.length && s.counts.blocked > before, {tried: ids, missing, extra});
  check('2 no page errors in edit practice', s.errors.length === 0, s.errors);
  await s.page.screenshot({path: path.join(shots, 'phone_vms_edit_practice.png')});
  await s.browser.close();

  /* 3 print path */
  s = await open({pageFile: PAGE, hash: '#print/vms/20', W: 1280, H: 1000});
  await live(s.page);
  await s.page.waitForFunction(() => document.getElementById('dpbar') && !document.querySelector('[data-dpbar-print]').disabled, null, {timeout: 120000}).catch(() => null);
  await s.page.waitForTimeout(1000);
  const p = await s.page.evaluate(() => {
    const w = document.getElementById('dayprint'), secs = w ? [...w.querySelectorAll('.ps7.v1024')] : [], sec = secs[0], bar = document.getElementById('dpbar');
    return {tab: state.tab, bar: bar && bar.querySelector('.dpbar-t').textContent, ready: bar && !bar.querySelector('[data-dpbar-print]').disabled, sheets: secs.length,
      msgs: sec ? sec.querySelectorAll('.v-msg').length : 0, qr: sec ? !!sec.querySelector('.v-nav svg') : false, air: sec ? [...sec.querySelectorAll('.v-pics .v1024-sat img')].filter(i => i.complete && i.naturalWidth > 0).length === 2 : false,
      plan: sec ? !!sec.querySelector('.v-nav img[alt="iEDM plan crop"]') : false, ids: sec ? sec.querySelectorAll('.v-id div').length : 0, zoom: sec ? (sec.style.zoom || '1') : null,
      title: sec ? sec.querySelector('.v-title').textContent : '', issued: sec ? sec.querySelector('.issued').textContent : '', printing: document.body.classList.contains('printing-day')};
  });
  check('3 #print/vms/20 lands on the VMS tab with the bar ready and one sheet', p.tab === 'vms' && p.ready && p.sheets === 1 && /VMS board sheet/.test(p.bar || ''), {bar: p.bar, sheets: p.sheets});
  check('3 the VMS 20 sheet: two messages, QR, both satellite close-ups loaded, the plan picture, four identity boxes, fits one page', p.msgs === 2 && p.qr && p.air && p.plan && p.ids === 4 && Number(p.zoom) >= 0.8 && /P60/.test(p.title), {msgs: p.msgs, qr: p.qr, air: p.air, plan: p.plan, zoom: p.zoom});
  check('3 issued line names the author and 15 Oct 2026', /Issued:/.test(p.issued) && /15 Oct 2026/.test(p.issued) && !/undefined|NaN/.test(p.issued), p.issued.slice(0, 100));
  await s.page.screenshot({path: path.join(shots, 'desktop_print_vms20.png')});
  await s.page.evaluate(() => { location.hash = '#print/vms/all'; });
  await s.page.waitForFunction(() => { const b = document.getElementById('dpbar'); return b && !b.querySelector('[data-dpbar-print]').disabled && document.querySelectorAll('#dayprint .ps7.v1024').length >= 28; }, null, {timeout: 180000}).catch(() => null);
  const all = await s.page.evaluate(() => { const secs = [...document.querySelectorAll('#dayprint .ps7.v1024')]; return {sheets: secs.length, brk: secs.filter(x => x.classList.contains('brk')).length, minZoom: Math.min(...secs.map(x => Number(x.style.zoom || '1'))), bar: (document.querySelector('#dpbar .dpbar-t') || {}).textContent}; });
  check('3 #print/vms/all: 28 sheets, a page break before each after the first, every one fitted', all.sheets === 28 && all.brk === 27 && all.minZoom >= 0.8, all);
  await s.page.evaluate(() => dpBarClose()); await s.page.waitForTimeout(500);
  const closed = await s.page.evaluate(() => ({bar: !!document.getElementById('dpbar'), printing: document.body.classList.contains('printing-day')}));
  check('3 Close puts the page back; no page errors on the print path', !closed.bar && !closed.printing && s.errors.length === 0, {closed, errors: s.errors});

  /* 4 other tabs */
  for (const h of ['today', 'plant', 'nights', 'map']) {
    await s.page.evaluate(x => { location.hash = '#' + x; }, h); await s.page.waitForTimeout(1200);
    const t = await s.page.evaluate(x => ({tab: state.tab, on: !!document.querySelector('.pane.on'), register: x === 'plant' ? !!document.querySelector('#vms913Board, [id^="vms913"]') : null}), h);
    check('4 #' + h + ' still routes' + (h === 'plant' ? ' and the VMS register fold is there' : ''), t.tab === h && t.on && (h !== 'plant' || t.register), t);
  }
  check('4 no page errors after routing through the other tabs', s.errors.length === 0, s.errors);
  await s.browser.close();
  out.result = out.fails.length ? 'FAIL' : 'PASS';
  fs.writeFileSync(path.join(__dirname, 'test_vms1024_result.json'), JSON.stringify(out, null, 1) + '\n');
  console.log(out.result + ' test_vms1024: ' + out.checks.filter(c => c.ok).length + '/' + out.checks.length + ' checks');
  process.exit(out.fails.length ? 1 : 0);
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
