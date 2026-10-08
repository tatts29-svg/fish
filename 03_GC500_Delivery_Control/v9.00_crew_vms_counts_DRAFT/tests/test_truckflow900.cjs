// Author: Andrew Fisher. v9.00 truck flow part - the Timeline's Truck flow card folds to one closed line. Opens the base page and
// the built page, one after the other, at the live address, reading the live record (every write the page tries is aborted by
// open_page; nothing here sends anything), on Wed 14 Oct (the project manager's screenshot) and today, and checks:
//   1. the built page draws, in the card's place, one closed line "Truck flow · N loads · K to check" (or "nothing to check"),
//      K counted independently here from the day model (loads with Curfew first not ok, in an area over its limit, oversized at a
//      moment over the guide, or with no arrival window - each load once); the card inside is not shown while closed;
//   2. the line is compact: laptop at most 44 px tall; phone one line, a tap target of at least 44 px, no horizontal overflow at
//      390 px; light and dark (DARK=1) read from the page's own colour tokens;
//   3. opening it shows the card exactly as the base draws it: the card's markup byte for byte and its text the same;
//   4. the rest of the Timeline pane - the load cards, v9.11's Workers picker, the dropdowns and the Arrange loads control - is
//      byte for byte the base's once the fold is unwrapped;
//   5. opening, closing and redrawing write nothing: the local record (S) and browser storage are identical before and after, and
//      the harness blocked no write (counts.blocked 0); an opened fold stays open through a redraw, a closed one stays closed;
//   6. edit practice (stubs, captured, never saved): the Make it Load 1 buttons, the Stagger buttons, the People on Save and the
//      order controls (down / up) inside and beside the card call the same functions with the same arguments as on the base;
//   7. a load's "Curfew first" / "Area full" jump opens the fold; a print opens every fold and closes it after, the line never prints;
//   8. money identical (moneySummary, fh866Model); no page errors.
//   PAGE=<build> [BASE=<base; default base_live.html beside PAGE>] [MOB=1] [DARK=1] [SHOTS=<dir>] [OUT=<json>]
//   node v9.00_crew_vms_counts_DRAFT/tests/test_truckflow900.cjs
const fs = require('fs'), path = require('path'), {open} = require('../../toolchain/harness/open_page');
const PAGE = process.env.PAGE, BASE = process.env.BASE || path.join(path.dirname(PAGE), 'base_live.html'), MOB = !!process.env.MOB, DARK = !!process.env.DARK;
const W = MOB ? 390 : 1440, H = MOB ? 844 : 900, SHOTS = process.env.SHOTS || '', tag = (MOB ? 'phone' : 'laptop') + '_' + (DARK ? 'dark' : 'light');
const DAY = '2026-10-14';
const R = []; const ok = (name, pass, detail) => { R.push({name, pass: !!pass, detail}); console.log((pass ? 'PASS ' : 'FAIL ') + name + (pass ? '' : ' ' + JSON.stringify(detail === undefined ? null : detail).slice(0, 600))); };

async function boot(file) {
  const s = await open({pageFile: file, hash: '#timeline', W, H, mobile: MOB, dpr: MOB ? 2 : 1});
  if (DARK) await s.page.emulateMedia({colorScheme: 'dark'}); else await s.page.emulateMedia({colorScheme: 'light'});
  await s.page.waitForFunction(() => typeof go === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof flow891Day === 'function', null, {timeout: 150000});
  await s.page.waitForTimeout(2500); return s;
}
const show = (p, iso) => p.evaluate(iso => { state.day = iso; state.tlView = 'day'; go('timeline'); render(); }, iso).then(() => p.waitForTimeout(700));

/* what differs between two draws and is not content: SVG ids numbered from a running counter on every draw (the weather art
   wx818-<n>, the load gantry tl841-<n>), the gantry's tl841-live class (set while the lamps are on screen), the weather's
   "fetched hh:mm", and an empty style attribute */
const norm = h => h == null ? h : h.replace(/ tl841-live\b/g, '').replace(/\b(wx818-|tl841-)\d+/g, '$1#').replace(/(fetched )\d\d:\d\d/g, '$1#').replace(/ style=""/g, '');
/* in the page: the pane with every Truck flow fold unwrapped (the card put back where the fold was), the card, the day model */
function grab(iso) {
  const pane = document.getElementById('pane-timeline'), clone = pane.cloneNode(true);
  clone.querySelectorAll('details.flow909').forEach(d => { const c = d.querySelector(':scope > section.flow891'); if (c) d.replaceWith(c); else d.remove(); });
  const card = pane.querySelector('section.flow891[data-flow891="' + iso + '"]');
  const d = programmeDays().find(x => x.iso === iso); let M = null; try { M = d ? flow891Day(d) : null; } catch (e) { M = null; }
  return {version: (() => { try { return SYNC.backend.readVersion821(); } catch (e) { return null; } })(), pane: clone.innerHTML, card: card ? card.outerHTML : null,
    cardText: card ? card.textContent.replace(/\s+/g, ' ').trim() : null, loads: M ? M.loads : 0, money: JSON.stringify([moneySummary(), fh866Model()]),
    workers: pane.querySelectorAll('[data-workers911], .workers911, [class*="workers911"]').length, arrange: pane.querySelectorAll('.drops911-open').length,
    selects: pane.querySelectorAll('select').length, ords: pane.querySelectorAll('.flow891-ord').length};
}
/* the local record and browser storage, as SHA-256 digests worked out in the page (the record is large; only the digest comes back) */
async function snapshot() {
  const h = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const st = k => { try { return JSON.stringify(Object.entries(window[k]).sort()); } catch (e) { return 'n/a'; } };
  return {S: await h(JSON.stringify(S)), ls: await h(st('localStorage')), ss: await h(st('sessionStorage'))};
}
/* independent count of the loads with a check needing action */
function expected(iso) {
  const d = programmeDays().find(x => x.iso === iso); if (!d) return null; const M = flow891Day(d); if (!M.loads) return {loads: 0, n: 0};
  const flag = new Set();
  M.deliveries.forEach(x => { if (x.curfew && x.curfew.state !== 'ok') flag.add(x.n); if (!x.win.known) flag.add(x.n); });
  M.areas.forEach(a => a.conflicts.forEach(c => c.loads.forEach(n => flag.add(n))));
  const ov = M.deliveries.filter(x => x.oversize && x.win.known), cap = FLOW891.oversized.total;
  ov.forEach(x => { const on = ov.filter(y => y.win.start <= x.win.start && x.win.start < y.win.finish); if (on.length > cap) on.forEach(y => flag.add(y.n)); });
  return {loads: M.loads, n: flag.size, unknown: M.curfew.filter(x => x.curfew.state === 'unknown').length, noWindow: M.unknownWindows};
}
/* edit practice: capture what the card's buttons and the order controls call; nothing is saved */
function practise(iso) {
  window.__keep900 = {flow891Move, flow891SetWindow, crew883SaveDay, mayWrite, capability, readonly: SYNC.readonly};
  const calls = []; window.flow891Move = (...a) => { calls.push(['flow891Move'].concat(a)); return true; };
  window.flow891SetWindow = (...a) => { calls.push(['flow891SetWindow'].concat(a)); return true; };
  window.crew883SaveDay = (...a) => { calls.push(['crew883SaveDay', a[0], a[1]]); return true; };
  window.mayWrite = () => true; window.capability = () => 'edit'; SYNC.readonly = false; render();
  try {
    const fold = document.querySelector('details.flow909[data-flow909="' + iso + '"]'); if (fold) fold.open = true;
    const card = document.querySelector('section.flow891[data-flow891="' + iso + '"]'); if (!card) return {calls, none: true};
    const first = [...card.querySelectorAll('[data-flow891-first]')], stag = [...card.querySelectorAll('[data-flow891-stagger]')];
    first.forEach(b => b.click()); stag.forEach(b => b.click());
    const save = card.querySelector('[data-flow891-people-save]'); if (save) save.click();
    const down = document.querySelector('#pane-timeline [data-flow891-move="down"]:not(:disabled)'), up = document.querySelector('#pane-timeline [data-flow891-move="up"]:not(:disabled)');
    if (down) down.click(); if (up) up.click();
    return {calls, first: first.length, stagger: stag.length, save: !!save, down: !!down, up: !!up};
  } finally { const k = window.__keep900; window.flow891Move = k.flow891Move; window.flow891SetWindow = k.flow891SetWindow; window.crew883SaveDay = k.crew883SaveDay;
    window.mayWrite = k.mayWrite; window.capability = k.capability; SYNC.readonly = k.readonly; render(); }
}
async function shot(p, sel, file) {
  if (!SHOTS) return; fs.mkdirSync(SHOTS, {recursive: true});
  /* the day's figures above the card stay in frame: the element goes about a fifth of the way down the screen */
  await p.evaluate(sel => { const el = document.querySelector(sel); if (!el) return; el.scrollIntoView({block: 'start'});
    let sc = el.parentElement; while (sc && !(sc.scrollHeight > sc.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
    (sc || document.scrollingElement).scrollTop -= Math.round(innerHeight * 0.22); }, sel);
  await p.waitForTimeout(500); await p.screenshot({path: path.join(SHOTS, file)});
}

(async () => { let s;
  try {
    /* ---- the base */
    s = await boot(BASE); let p = s.page;
    const today = await p.evaluate(() => todayIso()), days = [...new Set([DAY, today])];
    const B = {}; let baseErr = [], baseBlocked = 0;
    for (const iso of days) { if (!s) { s = await boot(BASE); p = s.page; }
      await show(p, iso); B[iso] = await p.evaluate(grab, iso); B[iso].practice = B[iso].card ? await p.evaluate(practise, iso) : null;
      if (iso === DAY) await shot(p, 'section.flow891[data-flow891="' + iso + '"]', 'before_' + tag + '_14oct.png');
      baseErr = baseErr.concat(s.errors); baseBlocked += s.counts.blocked; await s.browser.close(); s = null; }

    /* ---- the build */
    const C = {}; let buildErr = [], buildBlocked = 0;
    for (const iso of days) {
      if (s) { buildErr = buildErr.concat(s.errors); buildBlocked += s.counts.blocked; await s.browser.close(); s = null; }
      s = await boot(PAGE); p = s.page;   /* a fresh page for each day */
      await show(p, iso);
      const G = await p.evaluate(grab, iso);   /* straight after the first draw, as on the base */
      const before = await p.evaluate(snapshot);
      const exp = await p.evaluate(expected, iso);
      const closed = await p.evaluate(iso => { const f = [...document.querySelectorAll('details.flow909')], d = f.find(x => x.dataset.flow909 === iso); if (!d) return {folds: f.length, none: true};
        const sm = d.querySelector(':scope > summary'), w = sm.querySelector('.flow909-w'), r = sm.getBoundingClientRect(), dr = d.getBoundingClientRect(), card = d.querySelector(':scope > section.flow891'), cs = getComputedStyle(sm);
        const lh = parseFloat(getComputedStyle(w).lineHeight) || 16;
        return {folds: f.length, open: d.open, text: sm.textContent.replace(/\s+/g, ' ').trim(), h: Math.round(r.height), dh: Math.round(dr.height), wH: Math.round(w.getBoundingClientRect().height), lh,
          wClip: w.scrollWidth > w.clientWidth + 1, smOver: sm.scrollWidth > sm.clientWidth + 1, pageOver: document.documentElement.scrollWidth > innerWidth, right: Math.round(r.right), vw: innerWidth,
          cardShown: card ? card.checkVisibility() : null, bg: cs.backgroundColor, ink: cs.color, firstChildOfDay: true}; }, iso);
      C[iso] = {exp, closed};
      if (closed.none) { ok(iso + ': no Truck flow fold where the base has no card', !B[iso].card && exp.loads === 0, {base: !!B[iso].card, exp}); continue; }
      const want = 'Truck flow · ' + exp.loads + ' load' + (exp.loads === 1 ? '' : 's') + ' · ' + (exp.n ? exp.n + ' to check' : 'nothing to check');
      ok(iso + ': one closed line in the card’s place, “' + closed.text + '” (expected ' + exp.n + ' to check: ' + JSON.stringify(exp) + ')', closed.folds === 1 && !closed.open && closed.text === want && closed.cardShown === false, {closed, want});
      if (iso === DAY) ok('14 Oct: the four loads with no Kingston load time read “4 loads · 4 to check”', exp.loads === 4 ? closed.text === 'Truck flow · 4 loads · 4 to check' : true, {text: closed.text, exp});
      ok(iso + ': compact — ' + (MOB ? 'one line, tap target ≥ 44 px, no sideways overflow at 390 px' : 'at most 44 px tall') + ' (summary ' + closed.h + ' px, fold ' + closed.dh + ' px)',
        MOB ? (closed.h >= 44 && closed.dh <= 48 && closed.wH <= closed.lh * 1.5 && !closed.smOver && !closed.pageOver && closed.right <= closed.vw && !closed.wClip) : (closed.dh <= 44 && closed.h <= 44 && !closed.wClip), closed);
      const lum = c => { const m = c.match(/\d+(\.\d+)?/g) || [0, 0, 0]; return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
      ok(iso + ': ' + (DARK ? 'dark' : 'light') + ' — the line takes the page’s paper and ink (' + closed.bg + ' on ' + closed.ink + ')', DARK ? lum(closed.bg) < 0.25 && lum(closed.ink) > 0.6 : lum(closed.bg) > 0.85 && lum(closed.ink) < 0.35, {bg: closed.bg, ink: closed.ink});
      if (iso === DAY) await shot(p, 'details.flow909[data-flow909="' + iso + '"]', 'after_closed_' + tag + '_14oct.png');
      /* open it with a real press on the line */
      await p.click('details.flow909[data-flow909="' + iso + '"] > summary'); await p.waitForTimeout(300);
      const opened = await p.evaluate(iso => { const d = document.querySelector('details.flow909[data-flow909="' + iso + '"]'), card = d.querySelector(':scope > section.flow891');
        return {open: d.open, shown: card.checkVisibility(), html: card.outerHTML, text: card.textContent.replace(/\s+/g, ' ').trim(), inner: card.innerText}; }, iso);
      ok(iso + ': a press opens the card exactly as the base draws it (markup byte for byte, ' + opened.text.length + ' characters of text the same)', opened.open && opened.shown && norm(opened.html) === norm(B[iso].card) && opened.text === B[iso].cardText,
        {open: opened.open, shown: opened.shown, sameHtml: norm(opened.html) === norm(B[iso].card), sameText: opened.text === B[iso].cardText});
      ok(iso + ': the opened card carries Order, People on, the areas, Oversized, Curfew first, Could share a truck and Rules', ['Order', 'People on', 'Oversized', 'Curfew first', 'Could share a truck', 'Rules · '].every(w => opened.inner.includes(w)), opened.inner.slice(0, 300));
      if (iso === DAY) await shot(p, 'details.flow909[data-flow909="' + iso + '"]', 'after_open_' + tag + '_14oct.png');
      await p.evaluate(() => { render(); }); await p.waitForTimeout(400);
      const keptOpen = await p.evaluate(iso => { const d = document.querySelector('details.flow909[data-flow909="' + iso + '"]'); return !!d && d.open; }, iso);
      await p.click('details.flow909[data-flow909="' + iso + '"] > summary'); await p.waitForTimeout(300);
      await p.evaluate(() => { render(); }); await p.waitForTimeout(400);
      const keptShut = await p.evaluate(iso => { const d = document.querySelector('details.flow909[data-flow909="' + iso + '"]'); return !!d && !d.open; }, iso);
      ok(iso + ': an opened fold stays open through a redraw; closed again, it stays closed', keptOpen && keptShut, {keptOpen, keptShut});
      const after = await p.evaluate(snapshot);
      ok(iso + ': opening, closing and redrawing wrote nothing (local record, localStorage and sessionStorage identical; blocked writes ' + s.counts.blocked + ')', after.S === before.S && after.ls === before.ls && after.ss === before.ss && s.counts.blocked === 0, {S: after.S === before.S, ls: after.ls === before.ls, ss: after.ss === before.ss, blocked: s.counts.blocked});
      /* the rest of the pane is the base's */
      ok(iso + ': the rest of the Timeline pane is the base’s byte for byte with the fold unwrapped — load cards, Workers, dropdowns (' + G.selects + '), order controls (' + G.ords + '), Arrange loads (' + G.arrange + ')',
        G.version === B[iso].version ? norm(G.pane) === norm(B[iso].pane) : 'record moved', {version: [B[iso].version, G.version], same: norm(G.pane) === norm(B[iso].pane), len: [B[iso].pane.length, G.pane.length]});
      const firstDiff = (a, b, what) => { a = norm(a) || ''; b = norm(b) || ''; if (a === b) return; let k = 0; while (k < a.length && a[k] === b[k]) k++; console.log('  ' + what + ': first difference at', k, JSON.stringify(a.slice(k - 160, k + 160)), JSON.stringify(b.slice(k - 160, k + 160))); };
      firstDiff(B[iso].pane, G.pane, 'pane'); firstDiff(B[iso].card, opened.html, 'card');
      ok(iso + ': money identical (moneySummary, fh866Model)', G.money === B[iso].money, null);
      /* a second fresh page for the edit practice, the jump and the print: the headless renderer here crashes after about ten
         Timeline redraws in one page on the base (v9.10 and v9.11) as on the build, so no page in this test draws more than four times */
      buildErr = buildErr.concat(s.errors); buildBlocked += s.counts.blocked; await s.browser.close(); s = null; s = await boot(PAGE); p = s.page; await show(p, iso);
      /* edit practice */
      const P = await p.evaluate(practise, iso);
      ok(iso + ': edit practice — Make it Load 1 (' + P.first + '), Stagger (' + P.stagger + '), People on Save and the order controls call the same functions with the same arguments as the base (captured, never saved)',
        JSON.stringify(P.calls) === JSON.stringify(B[iso].practice.calls) && P.calls.length > 0, {cand: P, base: B[iso].practice});
      if (iso === DAY) ok('14 Oct: the three Make it Load 1 buttons (Loads 2, 3, 4) are there in edit and call flow891Move(day, load, "first")', exp.unknown === 4 ? P.first === 3 && P.calls.filter(c => c[0] === 'flow891Move' && c[3] === 'first').length === 3 : true, P);
      /* the jump, the print */
      const J = await p.evaluate(iso => { const b = document.createElement('button'); b.type = 'button'; b.dataset.flow891Jump = iso; document.getElementById('pane-timeline').appendChild(b); b.click(); b.remove();
        const d = document.querySelector('details.flow909[data-flow909="' + iso + '"]'), o = d.open; d.open = false; return o; }, iso);
      await p.waitForTimeout(200);
      const Pr = await p.evaluate(iso => { const all = () => [...document.querySelectorAll('details.flow909')]; window.dispatchEvent(new Event('beforeprint')); const during = all().every(d => d.open);
        window.dispatchEvent(new Event('afterprint')); const afterOpen = all().filter(d => d.open).length; return {during, afterOpen, n: all().length}; }, iso);
      /* the print rule read from the page's own stylesheet (print media is not emulated: a print layout of the whole page is heavy) */
      const printHidden = await p.evaluate(() => { const st = document.getElementById('flow909-style'); if (!st || !st.sheet) return false;
        return [...st.sheet.cssRules].some(r => r.media && /print/.test(r.media.mediaText) && [...r.cssRules].some(x => x.selectorText === 'details.flow909 > summary' && x.style.display === 'none')); });
      await p.waitForTimeout(200); const shutAfter = await p.evaluate(() => { render(); return [...document.querySelectorAll('details.flow909')].every(d => !d.open); });
      ok(iso + ': a load’s jump chip opens the fold; a print opens every fold and closes it after; the line never prints', J && Pr.during && Pr.afterOpen === 0 && printHidden && shutAfter, {J, Pr, printHidden, shutAfter});
    }
    /* every day of the programme, on a fresh page: the line's count and the independent count agree; days with nothing to check */
    buildErr = buildErr.concat(s.errors); buildBlocked += s.counts.blocked; await s.browser.close(); s = null; s = await boot(PAGE); p = s.page;
    const all = await p.evaluate(fn => { const exp = eval('(' + fn + ')'); const out = []; programmeDays().forEach(d => { const html = flow891Card(d); const e = exp(d.iso); if (!e || !e.loads) { out.push({iso: d.iso, html: !!html, loads: 0}); return; }
      const m = /<summary[^>]*>([\s\S]*?)<\/summary>/.exec(html || ''); const t = m ? m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : null; out.push({iso: d.iso, loads: e.loads, n: e.n, text: t, closed: !/<details class="flow909"[^>]* open>/.test(html || '')}); }); return out; }, expected.toString());
    const withLoads = all.filter(x => x.loads), bad = withLoads.filter(x => x.text !== 'Truck flow · ' + x.loads + ' load' + (x.loads === 1 ? '' : 's') + ' · ' + (x.n ? x.n + ' to check' : 'nothing to check') || !x.closed);
    ok('every programme day with loads (' + withLoads.length + ') reads the right line and draws closed; nothing to check on ' + withLoads.filter(x => !x.n).map(x => x.iso).join(', '), bad.length === 0 && all.filter(x => !x.loads).every(x => !x.html), {bad: bad.slice(0, 5)});
    const quiet = withLoads.find(x => !x.n && x.iso >= today) || withLoads.find(x => !x.n);
    if (quiet) { await show(p, quiet.iso); await shot(p, 'details.flow909[data-flow909="' + quiet.iso + '"]', 'after_closed_' + tag + '_nothing_' + quiet.iso + '.png'); }
    buildErr = buildErr.concat(s.errors); buildBlocked += s.counts.blocked;
    ok('no page errors (base ' + baseErr.length + ', build ' + buildErr.length + '); no write attempted on either (blocked ' + baseBlocked + ', ' + buildBlocked + ')', buildErr.length === 0 && baseErr.length === 0 && baseBlocked === 0 && buildBlocked === 0, {base: baseErr, build: buildErr});
    if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({tag, days, results: R, perDay: all.filter(x => x.loads).map(x => ({iso: x.iso, text: x.text})), C}, null, 1));
    await s.browser.close(); s = null;
    const fail = R.filter(x => !x.pass).length; console.log((fail ? 'FAILED ' : 'ALL PASS ') + (R.length - fail) + '/' + R.length + ' (' + tag + ')'); process.exit(fail ? 1 : 0);
  } catch (e) { console.error('ERROR', e && e.stack || e); if (s) await s.browser.close().catch(() => {}); process.exit(2); }
})();
