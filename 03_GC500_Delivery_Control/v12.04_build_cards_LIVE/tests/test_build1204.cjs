// Author: Andrew Fisher. The Build cards suite from v12.04 on (it supersedes v11.99's test_native1197.cjs, whose checks it keeps),
// on the real Build tab, reading the live record, writing nothing: every Build day card with a Coates booking text has one
// delivery-window row straight after the whole-build progress, and DAY'S DELIVERIES is told once, in that row's heading, with
// the same figure the card reads out; its dots are the on-time model's own; every Coates load says "Delivery booked between
// HH:MM and HH:MM"; Event Portables loads say nothing; the weather for 10-22 Oct is the Bureau's; the inked stamp sits centred
// in the gap beside the date.
//   PAGE=build/GC500_v12.05/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_build1204.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = !!process.env.MOB, dir = process.env.EVIDENCE, tag = mobile ? 'phone' : 'desktop';
  const s = await open({pageFile: process.env.PAGE, mobile, W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1}), p = s.page;
  let checks = 0; const check = (v, msg) => { assert(v, msg); checks++; console.log('ok   ' + msg); };
  const day = async iso => { await p.evaluate(iso => { location.hash = '#day/' + iso; }, iso); await p.waitForFunction(iso => { const c = document.querySelector('#pane-timeline .bc984-day.on'); return c && c.dataset.day === iso && document.querySelector('#pane-timeline .ldlist, #pane-timeline .dcards'); }, iso, {timeout: 60000}); await p.waitForTimeout(1500); };
  const norm = t => String(t || '').replace(/\s+/g, ' ').trim();
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 120000});
    await p.evaluate(() => { window.capability = () => 'edit'; window.mayWrite = () => false; SYNC.readonly = false; SYNC.level = 'edit'; SYNC.claims = 'edit'; applyCapability(); });
    await day('2026-09-14');
    const w = await p.evaluate(() => ({v: window.cards1197 && window.cards1197.version, pack: !!(window.cards1197 && typeof window.cards1197.pack1204 === 'function'), card: !!(BuildCards984.html && BuildCards984.html.__bw1197), line: !!(window.timeline846Line && window.timeline846Line.__bw1197)}));
    check(w.v === 'v11.99' && w.pack && w.card && w.line, 'v11.99 cards with v12.04 on them: the day card and the load line are wrapped, one deliveries block');

    /* every card: a row exactly where the day has a booked window, in the right place, its dots the on-time model's */
    const cards = await p.evaluate(() => holdAssets(() => {
      const O = window.ontime1057, booked = new Set(O.units.filter(u => Array.isArray(u.w)).map(u => u.d));
      return [...document.querySelectorAll('#pane-timeline .bc984-day')].map(c => {
        const iso = c.dataset.day, rows = c.querySelectorAll('.bw1197-row'), row = rows[0] || null, M = O.model(iso);
        const prev = row && row.previousElementSibling, next = row && row.nextElementSibling;
        const counted = (M.counted || []), plain = c.querySelector('.bc984-card>.bc984-load-row:not(.ot1057)');
        const fig = (c.getAttribute('aria-label') || '').match(/DAY’S (DELIVERIES|LOADS|PICKUPS): (.+?)\. Available staff/) || [];
        return {iso, booked: booked.has(iso), rows: rows.length, plain: !!plain, title: fig[1] || '', value: fig[2] || '', n: row ? +row.dataset.bw1197.split('|')[0] : 0,
          sub: row ? norm(row.querySelector('.bw1197-head .bc984-at-close').textContent) : '',
          placed: !row || (prev && (prev.matches('.bc984-progress') && !plain || prev.matches('.bc984-load-row:not(.ot1057)') && fig[1] === 'PICKUPS') && next && next.matches('.ot1057, .bc986-work, .bc984-crew')),
          dots: row ? row.querySelectorAll('.bw1197-dot').length : 0, fails: row ? row.querySelectorAll('.bw1197-x').length : 0, later: row ? row.querySelectorAll('.bw1197-arrow').length : 0,
          wantDots: counted.filter(r => !r.failed && !r.laterDay && Number.isFinite(r.arr) && Array.isArray(r.u.w)).length, wantFails: counted.filter(r => r.failed && Array.isArray(r.u.w)).length, wantLater: counted.filter(r => r.laterDay && Array.isArray(r.u.w)).length,
          span: row ? norm(row.querySelector('.bw1197-span').textContent) : '', label: row ? norm(row.querySelector('.bw1197-head .bc984-label').firstChild.textContent) + ' · ' + norm(row.querySelector('.bw1197-head .bc984-at-close').textContent) : '', aria: c.getAttribute('aria-label') || ''};
      });
      function norm(t){ return String(t || '').replace(/\s+/g, ' ').trim(); }
    }));
    const withText = cards.filter(c => c.booked);
    check(cards.length >= 40 && withText.length === 23, 'the strip: ' + cards.length + ' day cards, ' + withText.length + ' with Coates booking texts');
    check(cards.every(c => c.rows === (c.booked ? 1 : 0)), 'one delivery-window row on each day with a booking text, none elsewhere');
    check(cards.every(c => c.placed), 'each row sits straight after the whole-build progress, before Coates on time');
    /* DAY'S DELIVERIES once: in the chart's heading where the day has the chart, its own row everywhere else; the same figure the card reads out */
    const said = c => { const unit = c.title === 'LOADS' ? ' LOADS' : ' REFERENCES', v = c.value.replace(/\s+/g, ' ').trim(), got = /^(\d+) \/ (\d+)$/.exec(v), plan = /^(\d+) planned$/.exec(v);
      return got ? got[1] + '/' + got[2] + unit + ' IN' : plan ? plan[1] + unit + ' PLANNED' : v.toUpperCase(); };
    const folded = cards.filter(c => c.rows && !c.plain);
    check(cards.every(c => c.title && (c.rows && c.title !== 'PICKUPS' ? !c.plain : c.plain)), 'DAY\'S DELIVERIES shows once on every card: in the chart heading on ' + folded.length + ', its own row on ' + cards.filter(c => c.plain).length);
    check(folded.length && folded.every(c => c.sub === said(c) + ' · ' + c.n + ' COATES TEXT' + (c.n === 1 ? '' : 'S')), 'each heading carries the card\'s own figure and its Coates texts: ' + folded.slice(0, 3).map(c => c.iso.slice(5) + ' "' + c.sub + '"').join(', ') + ' …');
    check(cards.every(c => c.dots === c.wantDots && c.fails === c.wantFails && c.later === c.wantLater), 'every dot, cross and arrow is the on-time model\'s own count (' + cards.reduce((n, c) => n + c.dots, 0) + ' dots)');
    const d14 = cards.find(c => c.iso === '2026-09-14');
    check(d14.span === '04:30–13:30' && /^\d+ \/ \d+$/.test(d14.value) && d14.label === 'DELIVERIES BOOKED BETWEEN · ' + said(d14) + ' · 14 COATES TEXTS', '14 Sep: "' + d14.label + '" ' + d14.span + ' (read out as "DAY’S ' + d14.title + ': ' + d14.value + '")');
    check(/Deliveries booked between 04:30 and 13:30 by 14 Coates booking texts/.test(d14.aria) && d14.aria.indexOf('Deliveries booked between') < d14.aria.indexOf(' Weather: '), '14 Sep read out: the windows, before the weather');

    /* the loads, in Andrew's words */
    const loads14 = await p.evaluate(() => [...document.querySelectorAll('#pane-timeline .ld.lc991')].map(c => {
      const b = c.querySelectorAll('.bw1197-band');
      const t = n => n ? n.innerText.replace(/\s+/g, ' ').trim() : '';
      return {refs: b[0] ? b[0].dataset.bw1197Load : null, n: b.length, says: b[0] ? [...b[0].querySelectorAll('.bw1197-say')].map(x => [t(x.querySelector('.bw1197-line'))].concat([...x.querySelectorAll('.bw1197-re')].map(t)).join(' ')) : [],
        done: b[0] ? [...b[0].querySelectorAll('.bw1197-done')].map(t) : [], inSummary: !b[0] || !!b[0].closest('.lc991-summary'),
        fits: !b[0] || b[0].getBoundingClientRect().right <= c.getBoundingClientRect().right + 1};
    }));
    const L = ref => loads14.find(x => x.refs === ref) || {says: []};
    check(loads14.every(x => x.n <= 1) && loads14.filter(x => x.n).length === 8, '14 Sep: eight of the loads carry one window band each');
    check(JSON.stringify(L('P05').says) === JSON.stringify(['Delivery booked between 05:00 and 08:00 Re-booked 05:00–10:00 · Coates text 9 Sep 13:29']) && L('P05').done.length === 1 && /^Done \d\d:\d\d, /.test(L('P05').done[0]), 'P05: ' + L('P05').says.join(' / ') + ' · ' + L('P05').done.join(' / '));
    check(L('WC05').says.length === 2 && /^Waste tank: delivery booked between 08:00 and 12:30$/.test(L('WC05').says[0]) && /^Toilet block: delivery booked between 08:30 and 11:30 Re-booked 08:30–13:00/.test(L('WC05').says[1]), 'WC05: ' + L('WC05').says.join(' / '));
    check(JSON.stringify(L('P01').says) === JSON.stringify(['Delivery booked between 04:30 and 07:30']), 'P01: ' + L('P01').says.join(' / '));
    check(loads14.every(x => x.inSummary && x.fits), 'each band sits in the load card summary, inside the card');
    const look = await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-timeline .bw1197-band')].find(x => x.dataset.bw1197Load === 'WC05');
      return {tracks: b ? b.querySelectorAll('.bw1197-track').length : 0, wins: b ? [...b.querySelectorAll('.bw1197-win')].map(w => w.className) : [], chips: b ? [...b.querySelectorAll('.bw1197-done')].map(c => c.className + ' ' + c.textContent) : []}; });
    check(look.tracks === 2 && look.wins.every(c => /cat-wc/.test(c)) && look.chips.length === 2 && look.chips.every(c => /late Done \d\d:\d\d, \d+ h \d+ min late/.test(c)), 'WC05: two windows on their own tracks, toilet colour, each with its done chip: ' + look.chips.join(' / '));
    const ring = await p.evaluate(() => { const c = document.querySelector('#pane-timeline .bc984-day[data-day="2026-09-14"] .bw1197-ring'); return c ? {p: c.style.getPropertyValue('--p'), text: c.textContent} : null; });
    check(ring && ring.p === '31' && ring.text === '31%', 'Coates on time ring on 14 Sep: ' + JSON.stringify(ring));
    /* the key on one line with no counts printed; the chart shows each booking */
    const cats = await p.evaluate(() => { const c = document.querySelector('#pane-timeline .bc984-day[data-day="2026-09-14"]');
      return [...c.querySelectorAll('.bw1197-cat')].map(k => { const cat = [...k.classList].find(x => /^cat-/.test(x)); return k.innerText.replace(/\s+/g, ' ').trim() + ' ' + c.querySelectorAll('.bw1197-bar.' + cat).length; }); });
    check(JSON.stringify(cats) === JSON.stringify(['Buildings 7', 'Toilets 7']), '14 Sep key without counts, the chart\'s bookings by kind: ' + cats.join(', '));
    /* the inked stamp centred in the gap: between the date's digits and the card's right edge, from the week label (CLOSED is off) down to the weather */
    const stamp = await p.evaluate(() => [...document.querySelectorAll('#pane-timeline .bc984-day.past984')].map(c => {
      const s = c.querySelector('.bc984-stamp'), n = c.querySelector('.bc984-date-number'), w = c.querySelector('.bc984-weather-reading'), wk = c.querySelector('.bc984-week');
      if (!s || !n || !w || !wk) return null; const rg = document.createRange(); rg.selectNodeContents(n);
      const cb = c.getBoundingClientRect(), r = s.getBoundingClientRect(), digits = rg.getBoundingClientRect(), rw = w.getBoundingClientRect(), rk = wk.getBoundingClientRect();
      const cx = (r.left + r.right) / 2 - cb.left, cy = (r.top + r.bottom) / 2 - cb.top, rad = s.offsetWidth / 2 * 1.014;
      const gx = (digits.right - cb.left + (rw.right - cb.left)) / 2, gy = (rk.top - cb.top + (rw.top - cb.top)) / 2;
      return {day: c.dataset.day, op: +getComputedStyle(s).opacity, dx: Math.round(cx - gx), dy: Math.round(cy - gy), clearLeft: Math.round(cx - rad - (digits.right - cb.left)), clearRight: Math.round((rw.right - cb.left) - (cx + rad)), clearTop: Math.round(cy - rad - (rk.top - cb.top)), clearBottom: Math.round((rw.top - cb.top) - (cy + rad))};
    }).filter(Boolean));
    const worst = stamp.reduce((a, x) => ({dx: Math.max(a.dx, Math.abs(x.dx)), dy: Math.max(a.dy, Math.abs(x.dy)), clear: Math.min(a.clear, x.clearLeft, x.clearRight, x.clearTop, x.clearBottom), op: Math.min(a.op, x.op)}), {dx: 0, dy: 0, clear: 1e9, op: 1});
    check(stamp.length >= 40 && worst.op >= 0.8 && worst.dx <= 10 && worst.dy <= 10 && worst.clear >= 4, 'the inked stamp is centred in the gap beside the date on all ' + stamp.length + ' closed cards (worst: ' + JSON.stringify(worst) + ')');

    await day('2026-10-08');
    const ep = await p.evaluate(() => [...document.querySelectorAll('#pane-timeline .ld.lc991')].map(c => ({carrier: ((c.querySelector('.ld-t em') || {}).textContent || '').trim(), refs: [...c.querySelectorAll('.tl841-ref')].map(r => r.dataset.tl841Ref).join('/'), band: !!c.querySelector('.bw1197-band')})));
    const epLoads = ep.filter(x => /event portables/i.test(x.carrier)), wc09 = ep.filter(x => x.refs === 'WC09' && !/event portables/i.test(x.carrier));
    check(epLoads.length >= 1 && epLoads.every(x => !x.band) && wc09.length >= 1 && wc09.every(x => x.band), '8 Oct: Event Portables loads no window (' + epLoads.length + '), the Coates WC09 loads windowed (' + wc09.length + ')');

    /* the weather: the Bureau's for 10-22 Oct */
    await day('2026-10-14');
    const wx = await p.evaluate(() => { const c = document.querySelector('#pane-timeline .bc984-day[data-day="2026-10-14"]'), h = window.BuildHistory984, r = h.get('2026-10-14');
      return {text: (c.querySelector('.bc984-weather-reading') || {}).innerText || '', dates: h.dates().length, last: h.dates().slice(-1)[0], src: r && r.source_id, url: r && r.provenance && r.provenance.data_url,
        missing: [...document.querySelectorAll('#pane-timeline .bc984-day')].filter(c => /History unavailable/.test(c.innerText)).map(c => c.dataset.day)}; });
    check(/BOM RECORDED/.test(wx.text) && /26°/.test(wx.text) && /19°/.test(wx.text), '14 Oct weather: ' + norm(wx.text));
    check(wx.dates === 46 && wx.last === '2026-10-22' && wx.src === '202610-24oct' && /IDCJDW4050\.202610\.csv$/.test(wx.url), 'the archive: 46 days to 22 Oct, 10-22 Oct from the Bureau October file');
    check(wx.missing.length === 0, 'no Build card says "History unavailable"' + (wx.missing.length ? ': ' + wx.missing.join(', ') : ''));

    /* redraws and the Details toggle never double anything */
    await day('2026-09-14');
    await p.evaluate(() => { renderTimeline(); renderTimeline(); });
    await p.waitForTimeout(1200);
    const again = await p.evaluate(() => ({rows: [...document.querySelectorAll('#pane-timeline .bc984-day')].map(c => c.querySelectorAll('.bw1197-row').length), bands: [...document.querySelectorAll('#pane-timeline .ld.lc991')].map(c => c.querySelectorAll('.bw1197-band').length)}));
    check(again.rows.every(n => n <= 1) && again.bands.every(n => n <= 1) && again.bands.filter(n => n).length === 8, 'two redraws: still one row per card and one band per load');
    await p.evaluate(() => { const c = [...document.querySelectorAll('#pane-timeline .ld.lc991')].find(x => x.querySelector('.bw1197-band[data-bw1197-load="P05"]')); c.querySelector('.lc991-toggle').click(); });
    await p.waitForTimeout(1500);
    const open1 = await p.evaluate(() => { const c = [...document.querySelectorAll('#pane-timeline .ld.lc991')].find(x => x.querySelector('.bw1197-band[data-bw1197-load="P05"]')); return c ? {bands: c.querySelectorAll('.bw1197-band').length, open: c.querySelector('.lc991-toggle').getAttribute('aria-expanded')} : null; });
    check(open1 && open1.bands === 1 && open1.open === 'true', 'P05 opened: its details show, the band once');
    const over = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    check(!over, 'no sideways scroll on the Build tab');
    if (dir) { fs.mkdirSync(dir, {recursive: true});
      await p.addStyleTag({content: '.staff988 li,.tm-person,.bc984-names span{filter:blur(7px)}'});
      for (const iso of ['2026-09-14', '2026-10-21']) {
        await day(iso);
        await p.evaluate(iso => { const c = document.querySelector('#pane-timeline .bc984-day[data-day="' + iso + '"]'), r = c.querySelector('.bw1197-row'), m = document.querySelector('main'); c.scrollIntoView({block: 'start', inline: 'center'}); m.scrollTop += r.getBoundingClientRect().top - m.getBoundingClientRect().top - (innerHeight > 900 ? 380 : 260); }, iso);
        await p.waitForTimeout(700); await p.screenshot({path: path.join(dir, tag + '-card-' + iso + '.png')});
      }
      await day('2026-09-14');
      await p.evaluate(() => { const b = document.querySelector('#pane-timeline .bw1197-band[data-bw1197-load="WC05"]'), m = document.querySelector('main'); m.scrollTop += b.getBoundingClientRect().top - m.getBoundingClientRect().top - (innerHeight > 900 ? 520 : 420); });
      await p.waitForTimeout(700); await p.screenshot({path: path.join(dir, tag + '-load-WC05.png')});
    }

    /* Demob carries no booking texts: no rows there */
    await p.evaluate(() => go('demob'));
    await p.waitForTimeout(2500);
    const demob = await p.evaluate(() => ({cards: document.querySelectorAll('#pane-demob .bc984-day').length, rows: document.querySelectorAll('#pane-demob .bw1197-row').length}));
    check(demob.rows === 0, 'Demob: ' + demob.cards + ' cards, no delivery-window rows (no booking texts after 22 Oct)');
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, cards: cards.length, withText: withText.length}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL v12.04 Build: ' + String(e && e.message).slice(0, 400)); process.exit(1); });
