// Author: Andrew Fisher. v10.57 part 1: legible twin-steer banner, delivery orders folded on Demob, the Timeline rule as
// one red line. GET-only against the live record (the harness aborts every write).
//   node test_part1.cjs path/to/page.html [shotdir]
const {open} = require('../../toolchain/harness/open_page.js');
const page = process.argv[2], shots = process.argv[3];
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'ok  ' : 'FAIL') + ' ' + m); };
const counts = {};
const wait = ms => new Promise(r => setTimeout(r, ms));
async function shot(p, name, sel, offset){
 if (!shots) return;
 if (sel) await p.evaluate(([s, o]) => { const el = document.querySelector(s); if (!el) return; if (o === 'center') { el.scrollIntoView({block: 'center'}); return; } el.scrollIntoView({block: 'start'}); const m = document.querySelector('main'); window.scrollBy(0, -(o || 0)); if (m && m.scrollHeight > m.clientHeight + 4) m.scrollBy(0, -(o || 0)); }, [sel, offset || 0]);
 await p.waitForTimeout(350); await p.screenshot({path: shots + '/' + name});
}
async function drawerCard(p, ref){ await p.evaluate(r => openAsset(r), ref); await p.waitForTimeout(1500); return p.evaluate(() => { const c = document.querySelector('#drawer .seq1054'); return c ? {txt: c.innerText.replace(/\s+/g, ' '), me: [...c.querySelectorAll('.o1054.me')].map(x => x.innerText), h: Math.round(c.getBoundingClientRect().height)} : null; }); }
// the banner reads clean: what is painted at points across it is the banner itself (pointer-events forced on, so the
// header shading cannot hide from the hit test); an element at opacity 0 (the drawer scrim when closed) paints nothing.
const LEGIBLE = () => {
 const st = document.createElement('style'); st.id = 'p1-pe'; st.textContent = '*,*::before,*::after{pointer-events:auto!important}'; document.head.appendChild(st);
 const b = document.getElementById('ts1053-banner'); const r = b.getBoundingClientRect();
 const clear = el => { for (let n = el; n && n.nodeType === 1; n = n.parentElement) if (getComputedStyle(n).opacity === '0') return true; return false; };
 const out = [8, 30, 50, 70, 92].map(pc => { const x = r.left + r.width * pc / 100, y = r.top + r.height / 2; const list = document.elementsFromPoint(x, y).filter(el => !clear(el)); const top = list[0];
  return {pc, top: top ? top.tagName + (top.id ? '#' + top.id : '') + (top.className && typeof top.className === 'string' ? '.' + top.className.split(' ').join('.') : '') : 'none', mine: !!top && b.contains(top)}; });
 st.remove(); return out;
};
const LINES = () => { const b = document.getElementById('ts1053-banner'); const s = getComputedStyle(b); const inner = b.getBoundingClientRect().height - ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce((n, k) => n + parseFloat(s[k] || 0), 0); return {w: innerWidth, h: Math.round(b.getBoundingClientRect().height * 10) / 10, lines: Math.round(inner / parseFloat(s.lineHeight))}; };
(async () => {
 for (const mob of [false, true]) {
  const tag = mob ? 'phone' : 'desktop'; const P0 = pass, F0 = fail;
  const h = await open(Object.assign({pageFile: page, hash: '#timeline'}, mob ? {mobile: true, W: 390, H: 844, dpr: 2} : {})); const p = h.page;
  try {
   await p.waitForFunction(() => typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
   await p.waitForTimeout(4000);
   /* (a) the banner */
   const b = await p.evaluate(() => { const b = document.getElementById('ts1053-banner'), s = getComputedStyle(b); return {text: b.innerText.replace(/\s+/g, ' '), pos: s.position, z: s.zIndex, color: s.color, bg: s.backgroundColor, inHeader: !!b.closest('header.top'), over: document.documentElement.scrollWidth > innerWidth + 1}; });
   ok(/NO TWIN-STEER TRUCKS/.test(b.text) && /Week 3 to demob/.test(b.text) && /Esplanade/.test(b.text) && /Macintosh Island Park/.test(b.text), tag + ': banner words: ' + b.text);
   ok(b.inHeader && b.pos === 'relative' && b.z === '2', tag + ': banner sits above the header shading (position ' + b.pos + ', z-index ' + b.z + ')');
   ok(b.color === 'rgb(255, 255, 255)' && b.bg === 'rgb(179, 18, 11)', tag + ': white on Coates red (' + b.color + ' on ' + b.bg + ')');
   const leg = await p.evaluate(LEGIBLE);
   ok(leg.every(x => x.mine), tag + ': nothing paints over the banner at 8/30/50/70/92% across: ' + leg.map(x => x.pc + '% ' + x.top).join(' | '));
   const sizes = mob ? [360, 375, 390, 414, 430] : [800, 1024, 1440]; const L = [];
   for (const w of sizes) { await p.setViewportSize({width: w, height: mob ? 844 : 900}); await p.waitForTimeout(250); L.push(await p.evaluate(LINES)); }
   await p.setViewportSize({width: mob ? 390 : 1440, height: mob ? 844 : 900}); await p.waitForTimeout(300);
   ok(L.every(x => mob ? x.lines <= 2 : x.lines === 1), tag + ': banner ' + (mob ? 'two lines at most at 360-430 px' : 'one line at 800 px and wider') + ': ' + L.map(x => x.w + 'px ' + x.lines + ' line' + (x.lines === 1 ? '' : 's') + ' ' + x.h + 'px').join(', '));
   if (mob) { await p.evaluate(() => { window.scrollTo(0, 0); const m = document.querySelector('main'); if (m) m.scrollTo(0, 0); }); await p.waitForTimeout(300); if (shots) await p.screenshot({path: shots + '/p1_banner_phone.png', clip: {x: 0, y: 0, width: 390, height: 330}}); }
   else if (shots) { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(300); const bb = await p.evaluate(() => { const r = document.getElementById('ts1053-banner').getBoundingClientRect(); return {y: r.top, h: r.height}; }); await p.screenshot({path: shots + '/p1_banner_desktop.png', clip: {x: 0, y: Math.max(0, bb.y - 120), width: 1440, height: bb.h + 180}}); }
   /* (b) the Timeline: no orders list, Day documents first */
   const tl = await p.evaluate(() => { const pane = document.getElementById('pane-timeline'); const kids = [...pane.children].filter(c => c.getBoundingClientRect().height > 2 && !c.matches('.rochip'));
    return {seq: pane.querySelectorAll('.seq1054').length, list: document.querySelectorAll('.seq1054-all').length, first: kids[0] ? kids[0].tagName + '.' + [...kids[0].classList].join('.') : '', over: document.documentElement.scrollWidth > innerWidth + 1}; });
   ok(tl.seq === 0 && tl.list === 0, tag + ': no delivery-orders list on the Timeline');
   ok(/dplate/.test(tl.first), tag + ': Day documents is the first card on the Build tab (' + tl.first + ')');
   if (mob) await shot(p, 'p1_timeline_top_phone.png', '#pane-timeline', 0);
   /* (c) the rule as one red line in the day panel */
   const rl = await p.evaluate(() => { const c = document.querySelector('#pane-timeline .ts1057-rule'); if (!c) return null; const line = c.querySelector('.ts1057-line'), s = getComputedStyle(line); const full = c.querySelector('.ts1057-full');
    return {n: document.querySelectorAll('#pane-timeline .ts1057-rule').length, old: document.querySelectorAll('section.ts1053-rule, .card.ts1053-rule').length, inDay: !!c.closest('.dayblock'), text: line.innerText.replace(/\s+/g, ' '), h: Math.round(c.getBoundingClientRect().height * 10) / 10, lines: Math.round(line.getBoundingClientRect().height / parseFloat(s.lineHeight)), fullShown: getComputedStyle(full).display !== 'none', color: getComputedStyle(c).color, bg: getComputedStyle(c).backgroundColor, bl: getComputedStyle(c).borderLeftColor}; });
   ok(rl && rl.n === 1 && rl.inDay && rl.old === 0, tag + ': the day panel carries the rule line (old tall card gone): ' + JSON.stringify(rl && {n: rl.n, inDay: rl.inDay, old: rl.old}));
   ok(rl && /No twin-steer trucks/.test(rl.text) && /track, Esplanade, Macintosh Island Park/.test(rl.text) && /Week 3 to demob/.test(rl.text) && /More$/.test(rl.text), tag + ': rule line words: ' + (rl && rl.text));
   ok(rl && (mob ? rl.lines <= 2 && rl.h <= 52 : rl.lines === 1 && rl.h <= 34), tag + ': rule line is compact: ' + (rl && rl.lines + ' line(s), ' + rl.h + ' px (was 219 px phone / 97 px desktop)'));
   ok(rl && !rl.fullShown && rl.color === 'rgb(90, 13, 7)' && rl.bg === 'rgb(253, 232, 230)' && rl.bl === 'rgb(179, 18, 11)', tag + ': red line on pink, full rule folded behind More');
   if (mob) await shot(p, 'p1_rule_closed_phone.png', '#pane-timeline .ts1057-rule', 260);
   await p.evaluate(() => document.querySelector('#pane-timeline .ts1057-rule [data-ts1057-more]').click()); await p.waitForTimeout(300);
   const op = await p.evaluate(() => { const c = document.querySelector('#pane-timeline .ts1057-rule'), f = c.querySelector('.ts1057-full'), m = c.querySelector('[data-ts1057-more]'); return {shown: getComputedStyle(f).display !== 'none', text: f.innerText.replace(/\s+/g, ' '), btn: m.textContent, aria: m.getAttribute('aria-expanded'), dialog: !!document.getElementById('ts1053'), h: Math.round(c.getBoundingClientRect().height)}; });
   ok(op.shown && op.btn === 'Less' && op.aria === 'true' && /must not be used for any GC500 delivery or pick-up/.test(op.text) && /Week 3, Week 2, Week 1, Race Week and demob/.test(op.text) && /nowhere to park/.test(op.text), tag + ': More opens the full rule (' + op.h + ' px)');
   ok(!op.dialog, tag + ': More is not mistaken for a print button (no tick dialog)');
   if (mob) await shot(p, 'p1_rule_open_phone.png', '#pane-timeline .ts1057-rule', 120);
   await p.evaluate(() => { try { RENDER_MEMO.clear && RENDER_MEMO.clear(); } catch (e) {} renderTimeline(); }); await p.waitForTimeout(1500);
   const rr = await p.evaluate(() => { const pane = document.getElementById('pane-timeline'); const c = pane.querySelector('.ts1057-rule'); return {seq: pane.querySelectorAll('.seq1054').length, n: pane.querySelectorAll('.ts1057-rule').length, open: !!c && c.classList.contains('open') && getComputedStyle(c.querySelector('.ts1057-full')).display !== 'none'}; });
   ok(rr.seq === 0 && rr.n === 1 && rr.open, tag + ': after a Timeline redraw: still no orders list, one rule line, still open');
   await p.evaluate(() => document.querySelector('#pane-timeline .ts1057-rule [data-ts1057-more]').click()); await p.waitForTimeout(200);
   ok(await p.evaluate(() => { const c = document.querySelector('#pane-timeline .ts1057-rule'); return !c.classList.contains('open') && getComputedStyle(c.querySelector('.ts1057-full')).display === 'none' && c.querySelector('[data-ts1057-more]').textContent === 'More'; }), tag + ': Less folds it again');
   // another day with trucks: the line follows the Truck flow card
   const od = await p.evaluate(async () => { const today = (typeof todayIso === 'function' ? todayIso() : '');
    const days = [...document.querySelectorAll('#pane-timeline .day[data-day]')].map(d => d.getAttribute('data-day')).filter(d => d > today).slice(0, 8); let res = {iso: '', none: true};
    for (const iso of days) { const card = document.querySelector('#pane-timeline .day[data-day="' + iso + '"]'); if (!card) continue; card.click(); await new Promise(r => setTimeout(r, 1500));
     const blk = document.querySelector('#pane-timeline .dayblock.ldday'); const c = blk && blk.querySelector('.ts1057-rule'); const f = blk && blk.querySelector('.flow891');
     res = {iso, rule: !!c, n: blk ? blk.querySelectorAll('.ts1057-rule').length : 0, afterFlow: !!(c && f && (f.compareDocumentPosition(c) & 4)), flow: !!f}; if (f) break; }
    return res; });
   ok(od.rule && od.n === 1 && od.flow && od.afterFlow, tag + ': a day with trucks (' + od.iso + ') carries the one line under its Truck flow card');
   if (mob) await shot(p, 'p1_rule_truckday_phone.png', '#pane-timeline .dayblock.ldday .ts1057-rule', 300);
   // print: the full rule prints with the day; the strip still prints only once ticked; the lock still wins
   await p.emulateMedia({media: 'print'});
   const pr0 = await p.evaluate(() => ({banner: getComputedStyle(document.getElementById('ts1053-banner')).display, lock: getComputedStyle(document.getElementById('ts1053-lock')).display, strip: getComputedStyle(document.getElementById('ts1053-strip')).display, app: getComputedStyle(document.querySelector('.app') || document.getElementById('tabs')).display}));
   await p.evaluate(() => ts1053.arm('Andrew Fisher'));
   const pr1 = await p.evaluate(() => { const c = document.querySelector('#pane-timeline .ts1057-rule'); return {banner: getComputedStyle(document.getElementById('ts1053-banner')).display, lock: getComputedStyle(document.getElementById('ts1053-lock')).display, strip: getComputedStyle(document.getElementById('ts1053-strip')).display, app: getComputedStyle(document.querySelector('.app') || document.getElementById('tabs')).display, full: c ? getComputedStyle(c.querySelector('.ts1057-full')).display : 'none', more: c ? getComputedStyle(c.querySelector('[data-ts1057-more]')).display : ''}; });
   await p.evaluate(() => ts1053.disarm()); await p.emulateMedia({media: 'screen'});
   ok(pr0.banner === 'none' && pr0.lock === 'block' && pr0.strip === 'none' && pr0.app === 'none', tag + ': print not ticked: only the lock page prints ' + JSON.stringify(pr0));
   ok(pr1.banner === 'none' && pr1.lock === 'none' && pr1.strip === 'block' && pr1.app !== 'none', tag + ': print ticked: the strip prints down the edge, the page prints ' + JSON.stringify({banner: pr1.banner, lock: pr1.lock, strip: pr1.strip, app: pr1.app}));
   ok(pr1.full === 'block' && pr1.more === 'none', tag + ': printed, the day panel shows the full rule (no More button)');
   /* (b) the orders fold at the foot of Demob */
   await p.evaluate(() => go('demob')); await p.waitForTimeout(2500);
   const dm = await p.evaluate(() => { const pane = document.getElementById('pane-demob'); const d = pane.querySelector(':scope > details.orders1057[data-refresh-fold="delivery-orders"]');
    return d ? {n: pane.querySelectorAll('.orders1057').length, open: d.open, prev: (d.previousElementSibling || {}).dataset ? d.previousElementSibling.dataset.refreshFold : '', next: d.nextElementSibling ? d.nextElementSibling.className : '', summary: d.querySelector('summary').innerText.replace(/\s+/g, ' '), h: Math.round(d.getBoundingClientRect().height), over: document.documentElement.scrollWidth > innerWidth + 1} : null; });
   ok(dm && dm.n === 1 && !dm.open, tag + ': Demob carries one delivery-orders fold, closed (' + (dm && dm.h) + ' px)');
   ok(dm && dm.prev === 'demob-programme-basis' && /asm816/.test(dm.next), tag + ': it sits between Programme totals and Planning assumptions (' + (dm && dm.prev + ' / ' + dm.next) + ')');
   ok(dm && /^Delivery orders · locked/.test(dm.summary) && /11 days · 44 references in the exact order to keep · 1 rule/.test(dm.summary), tag + ': fold heading: ' + (dm && dm.summary));
   if (mob) await shot(p, 'p1_demob_fold_closed_phone.png', '#pane-demob > .orders1057', 'center');
   await p.evaluate(() => document.querySelector('#pane-demob > .orders1057 summary').click()); await p.waitForTimeout(500);
   const dx = await p.evaluate(() => { const d = document.querySelector('#pane-demob > .orders1057'); const t = d.innerText; const rows = [...d.querySelectorAll('.c1054')].map(x => x.innerText.replace(/\s+/g, ' '));
    return {open: d.open, days: (t.match(/Day \d+/g) || []).length, g4: rows.find(r => /^Day 4/.test(r)) || '', g11: rows.find(r => /^Day 11/.test(r)) || '', wc17: /WC17's two toilet blocks are delivered before P36 and P10/.test(t), set: /Set by the project manager, 17 Oct 2026/.test(t), h: Math.round(d.getBoundingClientRect().height), over: document.documentElement.scrollWidth > innerWidth + 1}; });
   ok(dx.open && dx.days === 11, tag + ': opened, it lists the 11 locked orders (' + dx.h + ' px)');
   ok(/P55[\s\S]*→[\s\S]*P56[\s\S]*→[\s\S]*P54[\s\S]*→[\s\S]*P52[\s\S]*→[\s\S]*P57/.test(dx.g4) && /waste tank[\s\S]*toilet block[\s\S]*P04/.test(dx.g11) && /P04 comes only after/.test(dx.g11), tag + ': Day 4 ' + dx.g4 + ' | Day 11 keeps its rule');
   ok(dx.wc17 && dx.set, tag + ': the WC17 rule and who set the orders are there');
   if (mob) await shot(p, 'p1_demob_fold_open_phone.png', '#pane-demob > .orders1057', 10);
   await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-demob [data-dday816]')].find(x => x.getAttribute('aria-pressed') !== 'true'); if (b) b.click(); }); await p.waitForTimeout(1500);
   const da = await p.evaluate(() => { const pane = document.getElementById('pane-demob'); const d = pane.querySelectorAll(':scope > .orders1057'); return {n: d.length, open: d[0] && d[0].open, next: d[0] && d[0].nextElementSibling ? d[0].nextElementSibling.className : '', sel: typeof DM816 === 'object' ? DM816.sel : ''}; });
   ok(da.n === 1 && da.open && /asm816/.test(da.next), tag + ': after picking another pick-up day (' + da.sel + '): one fold, still open, still above Planning assumptions');
   ok(!dm.over && !dx.over, tag + ': Demob has no sideways scroll');
   /* drawers keep their own order card, unchanged */
   await p.evaluate(() => go('timeline')); await p.waitForTimeout(1500);
   const c63 = await drawerCard(p, 'P63'); ok(c63 && /^Delivery order · locked/.test(c63.txt) && /P63[\s\S]*→[\s\S]*P62[\s\S]*→[\s\S]*P60/.test(c63.txt) && c63.me.join().includes('P63') && /P63 is 1 of 3 — keep this exact order\./.test(c63.txt), tag + ': P63 drawer: ' + (c63 && c63.txt));
   if (mob) await shot(p, 'p1_p63_drawer_phone.png', '#drawer .seq1054', 'center');
   const c36 = await drawerCard(p, 'P36'); ok(c36 && /HRP/.test(c36.txt) && /WC17/.test(c36.txt), tag + ': P36 drawer: its group and the WC17 rule');
   const c05 = await drawerCard(p, 'WC05'); ok(c05 && c05.me.length === 2 && /waste tank[\s\S]*toilet block[\s\S]*P04/.test(c05.txt) && /P04 comes only after/.test(c05.txt), tag + ': WC05 drawer: tank then block, P04 last');
   const c17 = await drawerCard(p, 'WC17'); ok(c17 && /before P36 and P10/.test(c17.txt), tag + ': WC17 drawer: blocks before P36 and P10');
   await p.evaluate(() => openAsset('P06')); await p.waitForTimeout(1800);
   ok(await p.evaluate(() => { const s = document.querySelector('#drawer .seq1054'), a = document.querySelector('#drawer .align1055'); return !!(s && a && s.nextElementSibling === a); }), tag + ': P06 drawer: Site vs Baseplan still follows the order card');
   ok(await p.evaluate(() => !!document.querySelector('#drawer .ts1053-drawer')), tag + ': the drawer still carries the twin-steer note');
   try { closeDrawer(); } catch (e) {}
   // the tick dialog's rule paragraph no longer takes the card styling
   const dl = await p.evaluate(() => { ts1053.disarm(); ts1053.ask(); const q = document.querySelector('#ts1053 p.ts1053-rule'); const s = q && getComputedStyle(q); return q ? {bg: s.backgroundColor, bl: s.borderLeftWidth, fw: s.fontWeight, text: q.textContent} : null; });
   ok(dl && dl.bg === 'rgba(0, 0, 0, 0)' && dl.bl === '0px' && Number(dl.fw) >= 700 && /must not be used/.test(dl.text), tag + ': the tick dialog rule is plain bold text again ' + JSON.stringify(dl && {bg: dl.bg, bl: dl.bl, fw: dl.fw}));
   if (mob) await shot(p, 'p1_tick_dialog_phone.png');
   await p.evaluate(() => { const b = document.querySelector('[data-ts1053-no]'); if (b) b.click(); });
   ok(!tl.over && !b.over, tag + ': Build tab has no sideways scroll');
   ok(h.errors.length === 0, tag + ': no page errors ' + h.errors.slice(0, 3).join(' | '));
  } catch (e) { ok(false, tag + ': test stopped: ' + String(e && e.message || e).slice(0, 300)); } finally { await h.browser.close(); }
  counts[tag] = (pass - P0) + '/' + (pass - P0 + fail - F0);
 }
 console.log('desktop ' + counts.desktop + ', phone ' + counts.phone);
 console.log(`${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
