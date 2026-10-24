// Author: Andrew Fisher. v12.04 (claimed as v12.01) on the real Build and Demob tabs, reading the live record, writing nothing: a
// closed day card has no CLOSED label and its stamp is ink (no glow, no pulse, its own angle), centred in the gap beside the date;
// a late delivery whose Coates booking text names no reference is called by the text's own words, and "Item" is printed nowhere in
// the on-time list; the tidy-up: 440 px cards on a computer screen (phones unchanged), the chart key on one line without counts,
// What went in without boxes, and the 8 Oct card no longer crowded (it was 1,097 px tall).
//   PAGE=build/GC500_v12.05/GC500_Delivery_Control_hosted.html [MOB=1] [EVIDENCE=dir] node tests/test_native1201.cjs
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
    await day('2026-10-21');

    /* the naming rule itself, on the exported what() */
    const named = await p.evaluate(() => { const w = window.ontime1057.what; return [
      w({i: 'Knuckle Boom 61ft (18.6M) - Diesel', k: 'Item', r: []}), w({i: 'Portable Airconditioner 4.5kW Electric (240', k: 'Item', r: []}),
      w({i: '', k: 'Scissor lift', r: []}), w({i: 'Toilet Block 6.0M x 3.0M', k: 'Toilet block', r: ['WC05']})]; });
    check(named[0] === 'Knuckle Boom 61ft (18.6M) – Diesel' && named[1] === 'Portable Airconditioner 4.5kW Electric' && named[2] === 'Scissor lift' && /^WC05\b/.test(named[3]),
      'no reference: the text\'s own words, a cut-off bracket left off, the kind only when the text has no words; a reference still leads: ' + JSON.stringify(named));

    /* 21 Oct: what was late, by name */
    const late21 = await p.evaluate(() => [...document.querySelectorAll('#pane-timeline .bc984-day[data-day="2026-10-21"] .ot1059-late')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
    check(late21.includes('Knuckle Boom 61ft (18.6M) – Diesel · 1 h 21 min late') && late21.includes('Straight Boom Lift 60ft – Diesel · 34 min late') && late21.includes('Portable Airconditioner 4.5kW Electric · 4 min late'),
      '21 Oct names what was late: ' + late21.join(' | '));

    /* "Item" nowhere: every card's on-time row and every day's More info */
    const items = await p.evaluate(() => { const O = window.ontime1057, days = [...new Set(O.units.map(u => u.d))];
      const more = days.map(d => ({d, t: (() => { const x = document.createElement('div'); x.innerHTML = O.moreHtml(d) || ''; return x.textContent.replace(/\s+/g, ' '); })()}));
      const cards = [...document.querySelectorAll('#pane-timeline .bc984-day .ot1057')].map(r => ({d: r.closest('.bc984-day').dataset.day, t: r.textContent.replace(/\s+/g, ' ')}));
      return {days: days.length, bad: more.concat(cards).filter(x => /\bItem\b/.test(x.t)).map(x => x.d + ': ' + (x.t.match(/.{0,40}\bItem\b.{0,40}/) || [''])[0])}; });
    check(items.days >= 20 && items.bad.length === 0, '"Item" printed nowhere in the on-time rows or More info (' + items.days + ' days)' + (items.bad.length ? ': ' + items.bad.join(' | ') : ''));

    /* CLOSED off closed cards only; the stamp is ink, centred in the gap */
    const look = await p.evaluate(() => [...document.querySelectorAll('#pane-timeline .bc984-day')].map(c => {
      const past = c.classList.contains('past984'), lab = c.querySelector('.bc984-closed'), s = c.querySelector('.bc984-stamp');
      const out = {day: c.dataset.day, past, label: lab ? getComputedStyle(lab).display : 'missing', labelText: lab ? lab.textContent.trim() : ''};
      if (!past || !s) return out;
      const cs = getComputedStyle(s), n = c.querySelector('.bc984-date-number'), w = c.querySelector('.bc984-weather-reading'), wk = c.querySelector('.bc984-week');
      const rg = document.createRange(); rg.selectNodeContents(n);
      const cb = c.getBoundingClientRect(), r = s.getBoundingClientRect(), digits = rg.getBoundingClientRect(), rw = w.getBoundingClientRect(), rk = wk.getBoundingClientRect();
      const cx = (r.left + r.right) / 2 - cb.left, cy = (r.top + r.bottom) / 2 - cb.top, rad = s.offsetWidth / 2 * 1.014;
      const gx = (digits.right - cb.left + (rw.right - cb.left)) / 2, gy = (rk.top - cb.top + (rw.top - cb.top)) / 2;
      return Object.assign(out, {anim: cs.animationName, filter: cs.filter, blend: cs.mixBlendMode, op: +cs.opacity, mask: /feTurbulence/.test(cs.webkitMaskImage || cs.maskImage || ''), transform: cs.transform,
        dx: Math.round(cx - gx), dy: Math.round(cy - gy), clearLeft: Math.round(cx - rad - (digits.right - cb.left)), clearRight: Math.round((rw.right - cb.left) - (cx + rad)),
        clearTop: Math.round(cy - rad - (rk.top - cb.top)), clearBottom: Math.round((rw.top - cb.top) - (cy + rad))});
    }));
    const closed = look.filter(x => x.past), open_ = look.filter(x => !x.past);
    check(closed.length >= 40 && closed.every(x => x.label === 'none'), 'CLOSED is off all ' + closed.length + ' closed Build cards');
    check(open_.every(x => x.label !== 'none' && /^(TODAY|UPCOMING)$/.test(x.labelText)), 'open cards keep their label (' + open_.map(x => x.day + ' ' + x.labelText).join(', ') + ')');
    check(closed.every(x => x.anim === 'none' && !/drop-shadow/.test(x.filter) && x.blend === 'normal' && x.op > 0.9 && x.mask), 'every stamp is ink: no pulse, no glow, no screen blend, the speckle and pressure mask on');
    check(new Set(closed.map(x => x.transform)).size >= 4, 'stamps struck at ' + new Set(closed.map(x => x.transform)).size + ' different angles');
    const worst = closed.reduce((a, x) => ({dx: Math.max(a.dx, Math.abs(x.dx)), dy: Math.max(a.dy, Math.abs(x.dy)), clear: Math.min(a.clear, x.clearLeft, x.clearRight, x.clearTop, x.clearBottom)}), {dx: 0, dy: 0, clear: 1e9});
    check(worst.dx <= 10 && worst.dy <= 10 && worst.clear >= 4, 'the stamp is centred in the gap beside the date on every closed card, clear of the date, the label line and the weather (worst ' + JSON.stringify(worst) + ')');

    /* the tidy-up, on 8 Oct: card width, the key, What went in, the height */
    await day('2026-10-08');
    const tidy = await p.evaluate(() => { const d = document.querySelector('#pane-timeline .bc984-day[data-day="2026-10-08"]'), c = d.querySelector('.bc984-card');
      const key = c.querySelector('.bw1197-key'), cats = [...c.querySelectorAll('.bw1197-cat')], tiles = [...c.querySelectorAll('.dc1057-tile')];
      const tops = new Set([...key.querySelectorAll('.bw1197-cat, [class^="bw1197-key-"]:not(.bw1197-key-cats):not(.bw1197-key-done)')].map(x => Math.round(x.getBoundingClientRect().top)));
      return {w: Math.round(d.getBoundingClientRect().width), h: Math.round(c.getBoundingClientRect().height), vw: innerWidth, keyRow: getComputedStyle(key).flexDirection, keyLines: tops.size,
        counts: cats.filter(k => k.querySelector('b') && getComputedStyle(k.querySelector('b')).display !== 'none').length, cats: cats.length,
        boxes: tiles.filter(t => { const s = getComputedStyle(t); return parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderRadius) > 0 || (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent'); }).length, tiles: tiles.length}; });
    check(mobile ? tidy.w <= 390 : tidy.w === 440, 'card width ' + tidy.w + ' px on a ' + tidy.vw + ' px screen (' + (mobile ? 'phone unchanged' : '440 on a computer') + ')');
    check(tidy.keyRow === 'row' && tidy.keyLines <= 2 && tidy.cats >= 2 && tidy.counts === 0, 'the chart key runs along one line (' + tidy.keyLines + ' line' + (tidy.keyLines === 1 ? '' : 's') + ' at this width), no counts printed');
    check(tidy.tiles >= 3 && tidy.boxes === 0, 'What went in: ' + tidy.tiles + ' plain lines, no boxes');
    check(tidy.h <= (mobile ? 960 : 920), '8 Oct card ' + tidy.h + ' px tall (was 1,097 px)');

    if (dir) { fs.mkdirSync(dir, {recursive: true});
      /* a window tall enough for the whole card (the page scrolls inside main, so a short window clips the shot); same width */
      await p.setViewportSize({width: mobile ? 390 : 1440, height: 2200});
      await p.addStyleTag({content: '.staff988 li,.tm-person,.bc984-names span{filter:blur(7px)}'});
      for (const iso of ['2026-10-21', '2026-10-08']) {
        await day(iso);
        const el = await p.$('#pane-timeline .bc984-day[data-day="' + iso + '"] .bc984-card');
        await el.evaluate(n => { n.scrollIntoView({block: 'start', inline: 'center'}); document.querySelector('main').scrollTop -= 8; });
        await p.waitForTimeout(800); await el.screenshot({path: path.join(dir, tag + '-card-' + iso + '.png')});
      }
      await p.setViewportSize({width: mobile ? 390 : 1440, height: mobile ? 844 : 1000});
    }

    /* Demob: the same rule there */
    await p.evaluate(() => go('demob')); await p.waitForTimeout(2500);
    const dm = await p.evaluate(() => [...document.querySelectorAll('#pane-demob .bc984-day')].map(c => ({past: c.classList.contains('past984'), label: getComputedStyle(c.querySelector('.bc984-closed')).display, text: c.querySelector('.bc984-closed').textContent.trim()})));
    check(dm.length > 0 && dm.every(x => x.past ? x.label === 'none' : (x.label !== 'none' && /^(TODAY|UPCOMING)$/.test(x.text))), 'Demob: ' + dm.length + ' cards, CLOSED off the closed ones, TODAY/UPCOMING kept');
    check(s.errors.length === 0, 'no page errors: ' + s.errors.join(' | '));
    check(s.counts.blocked === 0, 'zero record writes');
    console.log(JSON.stringify({checks, mobile, closed: closed.length, worst}));
  } finally { await s.browser.close(); }
})().catch(e => { console.error('FAIL ' + String(e && e.message).slice(0, 600)); process.exit(1); });
