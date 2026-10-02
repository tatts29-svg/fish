// v8.16 - the reference drawer and the Demob tab: checks. Author: Andrew Fisher.
// Read only: open_page.js serves the build at the live address and aborts every write. The editor checks simulate the
// edit link inside the page (capability, mayWrite) and stub the page's own push (syncPush, folderWrite) so nothing is
// even attempted; every record change they make lives in that one tab and dies with it.
//   cd 03_GC500_Delivery_Control && CHROMIUM_PATH=/opt/pw-browsers/chromium node v8.16_reference_and_demob_DRAFT/evidence/v816_tests.js
const path = require('path'), fs = require('fs');
const {open} = require('../../toolchain/harness/open_page');
const ROOT = path.join(__dirname, '..', '..');
const BUILD = process.env.PAGE || path.join(ROOT, 'build/GC500_v8.16/GC500_Delivery_Control_hosted.html');
const BASE = process.env.BASE || path.join(ROOT, 'build/GC500_v8.16/base_live.html');
const wait = ms => new Promise(r => setTimeout(r, ms));
let fails = 0, passes = 0; const ok = (c, what, d = '') => { if (c) passes++; else fails++; console.log((c ? 'PASS ' : 'FAIL ') + what + (d !== '' && d != null ? '  - ' + (typeof d === 'string' ? d : JSON.stringify(d)).slice(0, 400) : '')); };
const EMPTY = [/Nothing reported against this one/, /No cost line names this asset/, /None filed on the admin page/, /No map attached/, /Nothing recorded inside this one/, /no drawing link found/i, /No drawing callout matches/, /Nothing on the 2026 drawings places this one/, /No drawing link\./, /nothing takes it off site/i, /Demob-week row/, /THIS LINK/i, /Observed by/i, /Rental ID/];
const SAMPLE = ['P42', 'WC05', 'WC07', 'P46', 'GN20', 'LT01', 'WB04', 'T0085', 'WC60'];
async function ready(p) {
  await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  await wait(2500);
}
const drawerHeight = p => p.evaluate(() => { const dr = document.getElementById('drawer'); const dh = dr.querySelector('.dh'), db = dr.querySelector('.db'), df = dr.querySelector('.df'); return Math.round(dh.offsetHeight + db.scrollHeight + df.offsetHeight); });
async function heights(file, dev) {
  const s = await open({pageFile: file, hash: '#today', ...dev}); const p = s.page; await ready(p);
  const out = {};
  for (const k of ['P42', 'WC05', 'P46']) { await p.evaluate(k => openAsset(k), k); await wait(1500); out[k] = await drawerHeight(p); await p.evaluate(() => { const c = document.getElementById('dclose'); if (c) c.click(); }); await wait(300); }
  await s.browser.close(); return out;
}
async function run(name, dev) {
  console.log(`\n== ${name}`);
  const before = await heights(BASE, dev);
  const s = await open({pageFile: BUILD, hash: '#today', ...dev}); const p = s.page; await ready(p);
  // ---------------- the drawer, view link
  const after = {};
  for (const k of ['P42', 'WC05', 'P46']) { await p.evaluate(k => openAsset(k), k); await wait(1500); after[k] = await drawerHeight(p); await p.evaluate(() => document.getElementById('dclose').click()); await wait(300); }
  console.log('drawer height (folds closed) before → after:', JSON.stringify(before), '→', JSON.stringify(after));
  ok(Object.keys(after).every(k => after[k] < before[k] * 0.6), `${name}: the drawer opens short (under 60% of live for P42, WC05, P46)`, {before, after});
  const seen = {};
  for (const k of SAMPLE) {
    await p.evaluate(k => openAsset(k), k); await wait(1200);
    seen[k] = await p.evaluate(() => {
      const dr = document.getElementById('drawer'), vis = el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      dr.querySelectorAll('details.f816').forEach(d => { if (vis(d)) d.open = true; });
      const text = dr.innerText;
      const r = {text, money: (text.match(/\$\s?\d[\d,.]*/g) || []).slice(0, 5), done: dr.querySelectorAll('[data-done]').length, lv: dr.querySelectorAll('[data-levelled]').length, st: dr.querySelectorAll('[data-steps]').length,
        slot: !!dr.querySelector('section[data-photo-slot]'), slotAfterWhere: (() => { const s = dr.querySelector('section[data-photo-slot]'); return !!(s && s.previousElementSibling && s.previousElementSibling.classList.contains('where816')); })(),
        slotKey: (dr.querySelector('section[data-photo-slot]') || {dataset: {}}).getAttribute && dr.querySelector('section[data-photo-slot]').getAttribute('data-photo-slot'),
        src: (dr.querySelector('.srcp816') || {}).textContent || '', air: !!dr.querySelector('.air816 .pin816'), charges: !!dr.querySelector('[data-f816="charges"]'), chargesVisible: (() => { const f = dr.querySelector('[data-f816="charges"]'); return !!(f && vis(f)); })(),
        out: (dr.querySelector('.dt816.out') || {}).innerText || '', outProp: !!dr.querySelector('.dt816.out .src816.s-proposed'),
        tags: !!dr.querySelector('.ptags'), headerTicks: dr.querySelector('.dh').querySelectorAll('[data-done],[data-levelled],[data-steps]').length, more: !!dr.querySelector('details.more816'),
        foot: [...dr.querySelectorAll('.df > .btn, .df > a.btn')].map(b => b.textContent.trim())};
      dr.querySelectorAll('details.f816').forEach(d => { d.open = false; });
      return r; });
    await p.evaluate(() => document.getElementById('dclose').click()); await wait(250);
  }
  ok(SAMPLE.every(k => !seen[k].money.length), `${name}: no money on the public view (${SAMPLE.length} drawers, every fold a viewer can open, opened)`, SAMPLE.filter(k => seen[k].money.length).map(k => k + ':' + seen[k].money.join(' ')).join(' | '));
  ok(SAMPLE.every(k => !seen[k].chargesVisible) && seen.P42.charges, `${name}: Contract & charges is in the drawer and hidden from the view link`);
  const emptyHits = SAMPLE.flatMap(k => EMPTY.filter(re => re.test(seen[k].text)).map(re => k + ':' + re.source));
  ok(!emptyHits.length, `${name}: the empty states, precision tags, This link, Demob-week and Off-hire lines and Rental ID are gone`, emptyHits.join(' | '));
  ok(/master plan/i.test(seen.P42.src) && seen.P42.air && !/no drawing link/i.test(seen.P42.text), `${name}: P42 shows the master-plan position with the pin, not "no drawing link"`, seen.P42.src);
  ok(SAMPLE.every(k => seen[k].done === 1 && seen[k].lv <= 1 && seen[k].st <= 1 && seen[k].headerTicks === 0), `${name}: the complete buttons appear once (none in the header)`, SAMPLE.map(k => k + ':' + seen[k].done + seen[k].lv + seen[k].st + '/' + seen[k].headerTicks).join(' '));
  ok(SAMPLE.every(k => seen[k].slot && seen[k].slotAfterWhere && seen[k].slotKey === k), `${name}: the photo slot section[data-photo-slot] is there, straight after Where it is`);
  ok(SAMPLE.every(k => !seen[k].tags), `${name}: the five precision tags are gone`);
  ok(SAMPLE.every(k => seen[k].more && seen[k].foot.join('|') === 'Print drop sheet|Text it|Copy link'), `${name}: footer is Print drop sheet, Text it, Copy link and More`, seen.P42.foot);
  ok(seen.P42.outProp && /proposed/.test(seen.P42.out), `${name}: P42's Out date is proposed, with the dashed chip`, seen.P42.out);
  // folds open and close, with the slide
  await p.evaluate(() => openAsset('P42')); await wait(1200);
  const fold = await p.evaluate(async () => { const d = document.querySelector('#drawer [data-f816="history"]'), s = d.querySelector('summary'), w = ms => new Promise(r => setTimeout(r, ms));
    s.click(); const anim = d.querySelector('.fb816').getAnimations().length; await w(450); const opened = d.open; s.click(); await w(450); return {anim, opened, closed: !d.open}; });
  ok(fold.opened && fold.closed && fold.anim > 0, `${name}: History and notes opens and closes, animated`, fold);
  await p.evaluate(() => document.getElementById('dclose').click()); await wait(300);
  // ---------------- the Demob tab
  const navOrder = await p.evaluate(() => [...document.querySelectorAll('#tabs [role="tab"]')].map(b => b.dataset.tab));
  ok(navOrder.indexOf('demob') === navOrder.indexOf('plant') + 1, `${name}: Demob sits after Equipment on the tab row`, navOrder);
  await p.evaluate(() => go('demob')); await wait(2000);
  const T = await p.evaluate(() => { const pane = document.getElementById('pane-demob'), M = demob816();
    return {kpi: pane.querySelector('.kp816').innerText, days: pane.querySelectorAll('.dday816').length, hash: location.hash, txt: pane.innerText.slice(0, 300),
      n: M.refs.length, keys: new Set(M.refs.map(r => r.key)).size, everyDate: M.refs.every(r => /^\d{4}-\d{2}-\d{2}$/.test(r.iso || '') && ['confirmed', 'plan', 'contract', 'proposed'].includes(r.src)),
      wrong: M.refs.filter(r => r.src === 'proposed' && ((r.side === 'outside' && week816(r.iso) !== 1) || (r.side === 'inside' && week816(r.iso) < 2) || (r.side === 'unknown' && week816(r.iso) !== 3))).map(r => r.key + ':' + r.iso),
      counts: M.counts, perDay: M.days.map(d => M.day[d].list.length), proposedChips: pane.querySelectorAll('.src816.s-proposed').length,
      bars: getComputedStyle(pane.querySelector('.bar816')).animationName, sideways: document.documentElement.scrollWidth > innerWidth + 1,
      strip: (() => { const st = pane.querySelector('.strip816'); return {cw: st.clientWidth, sw: st.scrollWidth, ox: getComputedStyle(st).overflowX}; })()}; });
  ok(/\b197\b/.test(T.kpi) && T.days === 15 && T.hash === '#demob', `${name}: the Demob tab shows 197 and all 15 working days`, {kpi: T.kpi.replace(/\n/g, ' '), days: T.days});
  ok(T.n === 197 && T.keys === 197 && T.everyDate, `${name}: every live reference has exactly one out date and one source`, T.counts);
  ok(T.counts.plan === 50 && T.counts.contract === 15 && T.counts.proposed === 132, `${name}: 50 by the plan, 15 by a contract before 13 Nov, 132 proposed`, T.counts);
  ok(!T.wrong.length, `${name}: proposed outside the island in week 1, Macintosh Island in weeks 2-3, no position at the end of week 3`, T.wrong.join(' '));
  ok(T.proposedChips > 0, `${name}: proposed dates carry the dashed proposed chip on the Demob tab`);
  ok(T.bars === 'bar816', `${name}: the day bars grow in`, T.bars);
  ok(!T.sideways, `${name}: no sideways scroll on the page`, T);
  if (name === 'phone') ok(T.strip.ox === 'auto' && T.strip.sw > T.strip.cw, `${name}: the day strip scrolls sideways inside its own container`, T.strip);
  // the branch filter
  const BR = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); DM816.sel = '2026-10-28'; DM816.branch = 'all'; DM816.view = 'list'; render(); await w(300);
    const b = [...document.querySelectorAll('#pane-demob [data-br816]')].find(x => x.dataset.br816 === 'KINP'); const all = document.querySelectorAll('#pane-demob .row816').length; b.click(); await w(300);
    const rows = [...document.querySelectorAll('#pane-demob .row816 .brn816')].map(e => e.textContent.trim()); const r = {all, kinp: rows.length, only: rows.every(x => x === 'KINP')}; DM816.branch = 'all'; render(); return r; });
  ok(BR.kinp > 0 && BR.kinp < BR.all && BR.only, `${name}: the branch filter shows only that branch`, BR);
  // print and email
  const PR = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); window.__printed = 0; window.print = () => { window.__printed++; };
    DM816.sel = '2026-10-28'; DM816.branch = 'all'; render(); await w(200);
    const mail = (document.querySelector('#pane-demob [data-mail816]') || {}).href || '';
    document.querySelector('#pane-demob [data-print816="day"]').click(); await w(400);
    const wrap = document.getElementById('dayprint'), pages = wrap ? [...wrap.querySelectorAll('.rs816')] : [];
    const one = pages.find(pg => /Toilet run/.test(pg.innerText)) || pages[0];
    const r = {mail: mail.slice(0, 7), mailBody: decodeURIComponent(mail.split('body=')[1] || '').slice(0, 200), pages: pages.length, expect: trucks816('2026-10-28', 'all').length, printed: window.__printed,
      head: one ? one.querySelector('.dp-hd').innerText.replace(/\s+/g, ' ') : '', hours: one ? /07:00–17:00/.test(one.innerText) : false, depot: one ? /Coates Kingston/.test(one.innerText) : false,
      sign: one ? /Driver/.test(one.querySelector('.rss816').innerText) && /Site lead/.test(one.querySelector('.rss816').innerText) : false,
      empt: pages.some(pg => /MUST BE EMPTIED BEFORE LOADING — DO NOT LOAD IF NOT PUMPED OUT/.test(pg.innerText) && pg.querySelectorAll('.rsb816 i').length > 0),
      notReady: pages.some(pg => /NOT READY: empty first/.test(pg.innerText))};
    document.body.classList.remove('printing-day'); if (wrap) { wrap.classList.remove('dpwrap'); wrap.innerHTML = ''; } document.querySelectorAll('#dayPage').forEach(e => e.remove()); return r; });
  ok(PR.mail === 'mailto:' && /GC500 demob/.test(PR.mailBody), `${name}: Email the branch is a mailto draft with the list`, PR.mailBody);
  ok(PR.pages === PR.expect && PR.pages > 0 && PR.printed === 1, `${name}: Print run sheets lays out one A4 per load and opens print`, {pages: PR.pages, expect: PR.expect, printed: PR.printed});
  ok(/Collection/.test(PR.head) && /Truck \d+ · Load \d+ of \d+/.test(PR.head) && PR.hours && PR.depot && PR.sign, `${name}: a run sheet carries the date, branch, truck and load, site hours, depot and the sign-off`, PR.head);
  ok(PR.empt && PR.notReady, `${name}: run sheets carry the emptied line with a tick box per unit, and NOT READY for a toilet not yet emptied`);
  // ---------------- toilets, tanks, times
  const D = await p.evaluate(() => { const M = demob816(), all = [];
    M.days.forEach(d => M.day[d].loads.forEach(L => all.push({d, n: L.n, units: L.units, sides: [...new Set(L.rows.map(x => x.r.side))], rows: L.rows.map(x => [x.r.key, x.n])})));
    const per = {}; all.forEach(L => L.rows.forEach(([k, n]) => { per[k] = (per[k] || 0) + n; }));
    const evt = M.refs.filter(r => r.evtN > 0 && r.iso >= M.days[0] && r.iso <= M.days[M.days.length - 1]);
    const mismatch = evt.filter(r => per[r.key] !== r.evtN).map(r => r.key + ':' + per[r.key] + '/' + r.evtN);
    const dayOrder = M.days.filter(d => { const sides = M.day[d].loads.map(L => L.rows[0].r.side === 'outside' ? 0 : 1); return sides.some((s, i) => i && s < sides[i - 1]); });
    const planned = M.planned.map(L => ({side: L.rows[0].r.side, wk: week816(L.iso)})), badWeek = planned.filter(x => (x.side === 'outside' && x.wk !== 1) || (x.side !== 'outside' && x.wk < 2));
    const times = [], tankBad = [], noPump = [];
    M.days.forEach(d => trucks816(d, 'all').forEach(L => { const t = L.t;
      if (t.over || t.arrive < 420 || t.leave > 1020 || t.st.some(s => s.at < 420 || s.end > 1020) || ban816(t.dep, t.dep + assume816().run.v) || ban816(t.leave, t.leave + assume816().run.v)) times.push(d + ' ' + L.group + ' load ' + L.n);
      L.stops.forEach(s => { const ix = s.parts.map(p => p.tank ? 1 : 0); if (ix.some((v, i) => i && v < ix[i - 1])) tankBad.push(d + ' ' + s.r.key); }); }));
    const pairs = M.refs.filter(r => r.tank && r.units.some(u => !u.tank && !u.evt && u.n > 0)).map(r => r.key);
    M.refs.filter(r => r.empty && !r.emptied && r.iso >= M.days[0] && r.iso <= M.days[M.days.length - 1]).forEach(r => { if (!M.days.some(d => d <= r.iso && M.day[d].pump.some(x => x.r.key === r.key))) noPump.push(r.key); });
    return {loads: all.length, over: all.filter(L => L.units > 24).map(L => L.d + ' L' + L.n + ' ' + L.units), mismatch, evtRefs: evt.length, units: evt.reduce((s, r) => s + r.evtN, 0), dayOrder, badWeek: badWeek.length, planned: planned.length, mixedSide: all.filter(L => L.sides.length > 1 && !L.sides.includes('unknown')).length,
      times, tankBad, pairs, noPump, types: [...new Set(M.refs.flatMap(r => r.units.filter(u => u.evt).map(u => u.type)))]}; });
  ok(D.loads > 0 && !D.over.length, `${name}: no toilet load is over 24 units (${D.loads} loads)`, D.over.join(' '));
  ok(!D.mismatch.length && D.units > 0, `${name}: every event-portable unit is in exactly one load (${D.units} units on ${D.evtRefs} references; types ${D.types.join(', ')})`, D.mismatch.join(' '));
  ok(!D.dayOrder.length && !D.badWeek && !D.mixedSide, `${name}: toilet loads keep the island priority (outside loads first, outside in week 1, island in weeks 2-3, sides not mixed)`, {dayOrder: D.dayOrder, badWeek: D.badWeek, mixed: D.mixedSide});
  ok(!D.tankBad.length && D.pairs.length > 0, `${name}: no waste tank is ordered before its toilet (pairs ${D.pairs.join(', ')})`, D.tankBad.join(' '));
  ok(!D.times.length, `${name}: every pick-up runs inside 07:00-17:00 and no truck travels 07:00-09:00 or 16:00-18:00`, D.times.join(' | '));
  ok(!D.noPump.length, `${name}: every toilet and tank is on a pump-out list on or before its pick-up day`, D.noPump.join(' '));
  // ---------------- the Timeline gap: a typed due-out reaches its day
  const TL = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)), k = 'P42', iso = '2026-11-04';
    const had = (S.delivery || {})[k] ? JSON.parse(JSON.stringify(S.delivery[k])) : null, a = assetOf(k);
    const noRemove = !(a.events || []).some(e => e.movement === 'remove');
    const beforeDay = (calendarDays().find(d => d.iso === iso) || {removals: []}).removals.some(r => r.a.key === k);
    S.delivery = S.delivery || {}; S.delivery[k] = Object.assign({}, had || {}, {out_date: iso, out_by: 'test', out_at: new Date().toISOString()}); RENDER_MEMO.clear();
    const afterDay = (calendarDays().find(d => d.iso === iso) || {removals: []}).removals.some(r => r.a.key === k);
    state.day = iso; go('timeline'); await w(1500);
    const pane = document.getElementById('pane-timeline'), txt = pane.innerText, onTl = /P42/.test(txt) && /Due out|due out|Removal|removal/.test(txt);
    const loads = dpLoads(programmeDays().find(d => d.iso === iso)).some(g => g.kind === 'removals' && g.rows.some(r => r.a.key === k));
    const src = demobOf816(k).src;
    if (had) S.delivery[k] = had; else delete S.delivery[k]; RENDER_MEMO.clear(); go('demob'); await w(500);
    return {noRemove, beforeDay, afterDay, onTl, loads, src}; });
  ok(TL.noRemove && !TL.beforeDay && TL.afterDay && TL.onTl && TL.loads && TL.src === 'confirmed', `${name}: a typed due-out on a reference with no remove event reaches the Timeline, the day list and the day documents`, TL);
  // ---------------- editors (simulated in the page; the page's own push is stubbed)
  const E = await p.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms));
    const sent = []; window.syncPush = () => { sent.push('push'); }; window.folderWrite = () => {}; window.confirm = () => { throw new Error('no confirm() dialogs'); };
    window.capability = () => 'edit'; window.mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; S.operator = 'Test editor'; applyCapability();
    EMPTY816.from = '2026-01-01';
    const r = {};
    // the drawer, as an editor
    openAsset('P42'); await w(1000);
    const dr = document.getElementById('drawer'), vis = el => !!(el && (el.offsetWidth || el.offsetHeight));
    const ch = dr.querySelector('[data-f816="charges"]'); r.chargesVisible = vis(ch); ch.open = true; r.chargesMoney = /\$\s?\d/.test(ch.innerText); r.rentalId = /Rental ID|9968862/.test(ch.innerText);
    r.changeWhere = vis(dr.querySelector('[data-chg816="where"]')); r.addPhoto = vis(dr.querySelector('.add816'));
    dr.querySelector('#dclose').click(); await w(300);
    // the emptied gate
    const k = allAssets().filter(a => !a._cancelled && needsEmpty816(a) && deliveryOf(a.key).state === 'on site' && !emptiedOf816(a.key).on && units816(a).some(u => u.evt)).map(a => a.key).sort()[0]; const st0 = deliveryOf(k).state, em0 = emptiedOf816(k).on;
    r.gateKey = k; r.st0 = st0; r.em0 = em0;
    r.collectRefused = collect816(k) === false && deliveryOf(k).state === st0;
    r.lightRefused = setLight(k, 'in transit') === false && deliveryOf(k).state === st0;
    openAsset(k); await w(800); r.emptiedPod = !!document.querySelector('#drawer .pod816.emp'); document.getElementById('dclose').click(); await w(200);
    r.emptiedSet = setEmptied816(k, true) && emptiedOf816(k).on && !!S.delivery[k].emptied_by && !!S.delivery[k].emptied_at;
    r.collectAllowed = collect816(k) !== false && deliveryOf(k).state === 'in transit';
    r.recordKept = (() => { const d = {emptied: true}; return !deliveryEmpty(d); })();
    // confirm the proposed, with the page's own confirmation step
    go('demob'); DM816.sel = '2026-10-29'; DM816.branch = 'all'; DM816.view = 'list'; render(); await w(300);
    const n = demob816().day['2026-10-29'].list.filter(x => x.src === 'proposed').length;
    const calls = []; const sd = window.setDate; window.setDate = (key, iso, which) => { calls.push([key, iso, which]); return sd(key, iso, which); };
    document.querySelector('#pane-demob [data-conf816="1"]').click(); await w(300);
    r.confirmBar = !!document.querySelector('#pane-demob .confirm816');
    document.querySelector('#pane-demob [data-conf816="yes"]').click(); await w(500);
    window.setDate = sd;
    r.confirmN = n; r.calls = calls.length; r.callsOk = calls.every(c => c[1] === '2026-10-29' && c[2] === 'out');
    r.nowConfirmed = demob816().day['2026-10-29'].list.filter(x => x.src === 'confirmed').length;
    r.pushes = sent.length;
    return r; });
  ok(E.chargesVisible && E.chargesMoney && E.rentalId, `${name}: editors see Contract & charges, with the money and the Rental ID`, E);
  ok(E.changeWhere && E.addPhoto, `${name}: editors see Moved? Change it and Add a photo`);
  ok(E.collectRefused && E.lightRefused, `${name}: the pump-out gate refuses a collection (and the light off site) until the toilet is emptied (${E.gateKey}, ${E.st0})`, E);
  ok(E.emptiedPod && E.emptiedSet && E.collectAllowed && E.recordKept, `${name}: Emptied (pumped out) records who and when, then the collection is allowed`, E);
  ok(E.confirmBar && E.calls === E.confirmN && E.callsOk && E.nowConfirmed === E.confirmN && E.confirmN > 0, `${name}: Confirm the N proposed asks on the page, then writes each through setDate(key, iso, 'out')`, {n: E.confirmN, calls: E.calls, confirmed: E.nowConfirmed});
  ok(!s.errors.length, `${name}: no page errors`, s.errors.join(' | '));
  console.log(`blocked writes: ${s.counts.blocked} (the harness aborts any)`);
  await s.browser.close();
  // reduced motion
  const s2 = await open({pageFile: BUILD, hash: '#demob', ...dev}); await s2.page.emulateMedia({reducedMotion: 'reduce'}); await ready(s2.page);
  const rm = await s2.page.evaluate(async () => { go('demob'); await new Promise(r => setTimeout(r, 800)); const b = document.querySelector('#pane-demob .bar816'); openAsset('P42'); await new Promise(r => setTimeout(r, 800));
    const d = document.querySelector('#drawer [data-f816="history"]'); d.querySelector('summary').click(); const anims = d.querySelector('.fb816').getAnimations().length;
    return {bar: getComputedStyle(b).animationName, pin: getComputedStyle(document.querySelector('#drawer .pin816') || document.body).animationName, anims, open: d.open}; });
  ok(rm.bar === 'none' && rm.anims === 0 && rm.open && (rm.pin === 'none'), `${name}: reduced motion is respected (no bar growth, no pulse, folds open without sliding)`, rm);
  ok(!s2.errors.length, `${name}: no page errors (reduced motion)`, s2.errors.join(' | '));
  await s2.browser.close();
  return {before, after};
}
(async () => {
  const H = {};
  for (const [name, dev] of [['desktop', {W: 1440, H: 900}], ['phone', {W: 390, H: 844, dpr: 2, mobile: true}]]) H[name] = await run(name, dev);
  if (process.env.OUTJ) fs.writeFileSync(process.env.OUTJ, JSON.stringify({heights: H, passes, fails}, null, 1));
  console.log(fails ? `\n${fails} FAILED, ${passes} passed` : `\nALL PASSED (${passes})`); process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
