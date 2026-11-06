// Author: Andrew Fisher. v11.93 on the real Today tab, reading the live record, writing nothing: no Milestones section, the board's
// 100% badges and the Build complete count kept; "Andrew Fisherp" put right on the device and the name opens Recording as;
// Available staff and Who to call fold to their title row with Show / Hide, remembered, back after a redraw, printed in full.
//   PAGE=build/GC500_v11.93/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1193.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; };
  const ready = () => p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && document.querySelector('#pane-today > #gc500-work-board840 .tw840-card') && document.getElementById('build1191') && document.querySelector('#pane-today > .staff988 .t1193-btn'), null, {timeout: 120000});
  const edit = () => p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); go('timeline'); go('today'); });
  const settle = (ms = 400) => p.waitForTimeout(ms);
  const look = () => p.evaluate(() => {
    const shown = e => !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0;
    const st = document.querySelector('#pane-today > .staff988'), tm = document.querySelector('#pane-today > .hub > .teamhub'), T = document.getElementById('pane-today');
    const sb = st && st.querySelector('.staff988-heading > .t1193-btn'), tb = tm && tm.querySelector('.hubtitle > .t1193-btn'), head = st && st.querySelector('.staff988-heading');
    let stored = 'x'; try { stored = localStorage.getItem('gc500.today1193'); } catch (e) {}
    return {staffAttr: document.documentElement.getAttribute('data-t1193-staff'), teamAttr: document.documentElement.getAttribute('data-t1193-team'),
      staffHead: shown(head), staffNames: shown(st && st.querySelector('.staff988-names')), staffEdit: shown(st && st.querySelector(':scope > details')),
      teamHead: shown(tm && tm.querySelector('.hubtitle')), teamList: shown(tm && tm.querySelector('.tm-list')), teamGo: shown(tm && tm.querySelector('.hubgo')),
      sbText: sb ? sb.textContent : null, sbExp: sb ? sb.getAttribute('aria-expanded') : null, tbText: tb ? tb.textContent : null, tbExp: tb ? tb.getAttribute('aria-expanded') : null,
      buttons: document.querySelectorAll('#pane-today .t1193-btn').length, headH: head ? Math.round(head.getBoundingClientRect().height) : 0,
      btnInRow: !!(sb && head) && sb.getBoundingClientRect().top < head.getBoundingClientRect().top + head.getBoundingClientRect().height / 2,
      stored, h: Math.round(T.getBoundingClientRect().height), over: document.documentElement.scrollWidth > innerWidth + 1};
  });
  const shot = async name => { if (!dir) return; fs.mkdirSync(dir, {recursive: true});
    await p.evaluate(() => { const st = document.getElementById('blur1193') || Object.assign(document.createElement('style'), {id: 'blur1193', textContent: '.staff988 li,.tm-person{filter:blur(7px)}'}); document.head.appendChild(st); });
    await p.waitForTimeout(600); await p.screenshot({path: path.join(dir, tag + '-' + name + '.png')}); };
  const toTop = () => p.evaluate(() => { const m = document.querySelector('main'); if (m) m.scrollTop = 0; window.scrollTo(0, 0); });
  const scrollTo = sel => p.evaluate(sel => { const m = document.querySelector('main'), e = document.querySelector(sel); m.scrollTop += e.getBoundingClientRect().top - m.getBoundingClientRect().top - 12; }, sel);
  const tapBtn = async part => { await p.evaluate(part => document.querySelector('#pane-today .t1193-btn[data-t1193="' + part + '"]').click(), part); await settle(); };
  try {
    await ready();
    // 0. The name, put right on the device: plant the misspelling in this browser's own copy, reload, and read it back.
    await p.evaluate(() => { S.operator = 'Andrew Fisherp'; persist(); });
    await p.reload({waitUntil: 'load', timeout: 180000}); await ready(); await settle(1500);
    const fixed = await p.evaluate(() => { let kept = null; try { kept = JSON.parse(localStorage.getItem(STORE) || '{}').operator; } catch (e) {} return {op: S.operator, box: document.getElementById('who').value, kept}; });
    check(fixed.op === 'Andrew Fisher' && fixed.box === 'Andrew Fisher' && fixed.kept === 'Andrew Fisher', 'after a reload "Andrew Fisherp" reads "Andrew Fisher" in the record name, the Recording as box and this device\'s storage');
    await edit(); await ready(); await settle(1500);
    const who = await p.evaluate(() => { const b = document.querySelector('#pane-today .hubwho b'); return b ? {t: b.textContent, role: b.getAttribute('role')} : null; });
    check(who && who.t === 'Andrew Fisher' && who.role === 'button', 'the Today card: "Recording as Andrew Fisher", and the name is a button');
    await p.evaluate(() => document.querySelector('#pane-today .hubwho b').click()); await settle();
    const menu = await p.evaluate(() => ({open: !document.getElementById('moreMenu').hidden, focus: document.activeElement && document.activeElement.id}));
    check(menu.open && menu.focus === 'who', 'tapping the name opens Tools with the Recording as box ready to type');
    // the page's own box handler saves; the test makes the link read-only for that moment so nothing can be sent
    await p.evaluate(() => { SYNC.readonly = true; const w = document.getElementById('who'); w.value = 'Andrew Fisherp'; w.dispatchEvent(new Event('change')); SYNC.readonly = false; if (typeof moreClose === 'function') moreClose(); });
    await settle();
    const again = await p.evaluate(() => ({op: S.operator, box: document.getElementById('who').value, card: (document.querySelector('#pane-today .hubwho b') || {}).textContent}));
    check(again.op === 'Andrew Fisher' && again.box === 'Andrew Fisher' && again.card === 'Andrew Fisher', 'typed again in the box, the misspelling is put right and Today shows it at once');
    const toast = await p.evaluate(() => { const f = document.getElementById('flash'); return f && !f.hidden ? f.textContent.trim() : ''; });
    check(toast === 'Recording as Andrew Fisher.', 'the message says "' + toast + '"');
    await p.waitForTimeout(4500);

    // 1. Milestones are off Today; the badges and the bar's count stay.
    let m = await p.evaluate(() => ({sec: !!document.getElementById('ms1025'), badges: document.querySelectorAll('#gc500-work-board840 .ms1025-badge').length, kept: window.__ms1193,
      bar: [...document.querySelectorAll('#build1191 .b1191-title, #build1191 .b1191-sub, #build1191 .b1191-act')].map(e => e.textContent)}));
    check(!m.sec, 'no Milestones section on Today');
    check(m.badges === 7 && m.kept && m.kept.total === 7 && m.kept.rest === 0, 'the board keeps its seven 100% badges; the count kept from the Milestones code: ' + JSON.stringify(m.kept));
    check(m.bar[0] === 'Build complete' && m.bar[1] === '7 of 7 areas at 100% · Where we are, Work progress and By group' && m.bar[2] === 'Show', 'the bar: ' + m.bar.join(' | '));
    await p.evaluate(() => window.gc500Build1191.open()); await settle();
    m = await p.evaluate(() => ({sec: !!document.getElementById('ms1025'), parts: ['where885', 'gc500-work-board840', 'pane-progress'].map(id => { const e = document.getElementById(id); return !!e && getComputedStyle(e).display !== 'none'; })}));
    check(!m.sec && m.parts.every(Boolean), 'with the build open: the plate, the board and By group, and still no Milestones');
    await p.evaluate(() => window.gc500Build1191.close()); await settle();

    // 2. Closed by default: the title rows stay, with Show; the names, the list and the links fold away.
    let L = await look();
    check(L.staffAttr === 'closed' && L.teamAttr === 'closed' && L.stored === null, 'a first visit opens with both folded');
    check(L.staffHead && !L.staffNames && !L.staffEdit && L.sbText === 'Show' && L.sbExp === 'false', 'Available staff: the heading and "7 available" with Show; names and Edit availability folded');
    check(L.teamHead && !L.teamList && !L.teamGo && L.tbText === 'Show' && L.tbExp === 'false', 'Who to call: the title and "20 on the team" with Show; the people and the whole-team link folded');
    check(L.btnInRow && !L.over, 'the Show button sits in the heading row (' + L.headH + ' px); no sideways scroll');
    const closedH = L.h;
    await toTop(); await shot('today-closed');

    // 3. Show / Hide, remembered; the heading itself toggles too.
    await tapBtn('staff'); L = await look();
    check(L.staffAttr === 'open' && L.staffNames && L.sbText === 'Hide' && L.sbExp === 'true' && L.stored === '{"staff":"open","team":"closed"}', 'Show on Available staff: the names are back, Hide, remembered');
    await scrollTo('#pane-today > .staff988'); await shot('staff-open');
    await p.evaluate(() => document.querySelector('#pane-today > .staff988 .staff988-heading h3').click()); await settle(); L = await look();
    check(L.staffAttr === 'closed' && !L.staffNames && L.sbText === 'Show', 'a tap on the heading folds it again');
    await tapBtn('team'); L = await look();
    check(L.teamAttr === 'open' && L.teamList && L.teamGo && L.tbText === 'Hide' && L.stored === '{"staff":"closed","team":"open"}', 'Show on Who to call: the people and the whole-team link are back, remembered');
    await scrollTo('#pane-today > .hub'); await shot('team-open');

    // 4. A full redraw keeps the buttons and the state; and a Today redraw does not loop.
    await p.evaluate(() => renderToday()); await settle(800); L = await look();
    check(L.buttons === 2 && L.teamAttr === 'open' && L.teamList && L.tbText === 'Hide' && L.sbText === 'Show' && !L.staffNames, 'after a full redraw both buttons are back and each card is as it was left');
    const quiet = await p.evaluate(() => new Promise(res => { let n = 0; const o = new MutationObserver(r => { n += r.length; }); o.observe(document.getElementById('pane-today'), {childList: true}); setTimeout(() => { o.disconnect(); res(n); }, 8000); }));
    check(quiet <= 6, 'Today\'s top level changed ' + quiet + ' times in 8 s (no loop)');
    await tapBtn('team'); L = await look();
    check(L.teamAttr === 'closed' && !L.teamList, 'Hide folds Who to call again');

    // 5. Paper prints both in full, without the buttons.
    await p.emulateMedia({media: 'print'});
    const paper = await p.evaluate(() => ({names: getComputedStyle(document.querySelector('#pane-today > .staff988 .staff988-names')).display, list: getComputedStyle(document.querySelector('#pane-today > .hub > .teamhub .tm-list')).display, btn: getComputedStyle(document.querySelector('#pane-today .t1193-btn')).display}));
    check(paper.names !== 'none' && paper.list !== 'none' && paper.btn === 'none', 'print: the names and the people print, the buttons do not');
    await p.emulateMedia({media: 'screen'});

    // 6. The folded Today, and the record untouched.
    L = await look();
    check(L.h < (mobile ? 1600 : 1200), 'Today folded: ' + L.h + ' px (first look ' + closedH + ' px; a full redraw adds a little to the contacts area by itself)');
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, closedH, endH: L.h, quiet, bar: m.bar}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v11.93 native: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
