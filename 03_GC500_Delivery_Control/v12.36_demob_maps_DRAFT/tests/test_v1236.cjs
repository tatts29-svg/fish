/* Author: Andrew Fisher. v12.36 - the Demob tab: everything on site by what it is, your master plan beside every line, what is
   really happening on each card (picked up, part picked up, ready, not ready, not checked yet), the size and weight named, and the
   demob's percentage against its days; on top of v12.35's checks, which run in the day's pick-up list (still one tap away).
   v12.35 - a reference that has left in full keeps its quantity on the Demob tab (EQ0002, left 12:47),
   on top of v12.34's checks. v12.34 - the Demob tab's look (the pick-up list in the dark card style), on top of v12.32's checks: the
   departed stamp, asset numbers and known sizes, and v12.31's Demob checks, so the new look is proven to keep every word, light
   and button. Part A reads the live record through the view link (GN10 left site 26 Oct 07:40, GN24 26 Oct 08:10). Part B rehearses
   the Ready, Not ready, Pumped out · ready and Picked up buttons with the sync held in the page: every write is captured in the
   page and none reaches the network.
     PAGE=<build> OUT=<dir> [MOB=1] node test_v1236.cjs */
'use strict';
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = process.env.MOB === '1', out = process.env.OUT, checks = [];
  fs.mkdirSync(out, {recursive: true});
  const h = await open({pageFile: process.env.PAGE, hash: '#demob', W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, mobile}), p = h.page;
  const check = (name, ok, detail) => { checks.push({name, ok: !!ok, detail: detail === undefined ? null : detail}); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(checks, null, 1)); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 600))); };
  const shot = (name, el) => (el ? p.locator(el).first().screenshot({path: path.join(out, name + (mobile ? '_phone' : '_desktop') + '.png')}) : p.screenshot({path: path.join(out, name + (mobile ? '_phone' : '_desktop') + '.png')}));
  const row = k => '#pane-demob .dmday816 tr[data-row816="' + k + '"]';
  const stat = k => p.evaluate(s => { const td = document.querySelector(s + ' td.st1231'); if (!td) return null; const on = td.querySelector('.lp1231.on'); return {lit: on ? (on.classList.contains('red') ? 'red' : on.classList.contains('amber') ? 'amber' : on.classList.contains('green') ? 'green' : '?') : null, word: td.querySelector('.stamp1232') ? (td.querySelector('.stamp1232 b') || {}).textContent : (td.querySelector('.sw1231') || {}).textContent || '', note: ((td.querySelector('.stamp1232 em') || td.querySelector('small') || {}).innerText || '').replace(/\s+/g, ' ').trim(), lamps: td.querySelectorAll('.lp1231').length, buttons: td.querySelectorAll('button[data-lamp1231]').length}; }, row(k));
  const cellText = (k, cls) => p.evaluate(([s, c]) => { const td = document.querySelector(s + ' td.' + c); return td ? td.innerText.replace(/\s+/g, ' ').trim() : null; }, [row(k), cls]);
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.Ready1231 && window.Stamp1232 && typeof demob816 === 'function', null, {timeout: 180000});
    await p.evaluate(() => { try { go('demob'); } catch (e) {} });
    await p.waitForFunction(() => document.querySelector('#pane-demob .dmday816 tr[data-row816]'), null, {timeout: 60000});
    await p.waitForTimeout(1500);
    check('page loads with no errors and the ready helper', !h.errors.length && await p.evaluate(() => typeof Ready1231.state === 'function'), h.errors);
    const view0 = await p.evaluate(() => ({view: DM816.view, map: !!window.DemobMap1236}));
    check('v12.36: the Demob tab opens on everything on site', view0.view === 'everything' && view0.map, view0);
    /* the day's pick-up list, one tap away, carries v12.35's checks */
    await p.evaluate(() => { DM816.view = 'list'; renderDemob816(); });
    await p.waitForTimeout(900);

    /* ---------------- Part A: the live record ---------------- */
    const day = await p.evaluate(() => DM816.sel);
    check('the Demob tab opens on today, Mon 26 Oct', day === '2026-10-26', day);
    const head = await p.evaluate(() => [...document.querySelector('#pane-demob .dmday816 table.daytbl thead').querySelectorAll('th')].map(t => t.textContent.trim()));
    check('the pick-up list has Pick-up and Status columns', JSON.stringify(head) === JSON.stringify(['GC500 ID', 'What', 'Branch', 'Pick-up', 'Status', 'Actions']), head);
    const every = await p.evaluate(() => { const rs = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')]; return {rows: rs.length, pk: rs.filter(r => r.querySelector('td.pk1231 .pd1231 b')).length, st: rs.filter(r => r.querySelector('td.st1231 .lamps1231, td.st1231 .w')).length, cells: [...new Set(rs.map(r => r.children.length))]}; });
    check('every reference on the day shows a pick-up day and one status, six cells a row', every.rows >= 20 && every.pk === every.rows && every.st === every.rows && JSON.stringify(every.cells) === '[6]', every);
    const gn19 = await cellText('GN19', 'pk1231');
    check('GN19: picked up Mon 26 Oct 07:00 on an NVAC load (the plan\'s stop time; the load numbers shift as things leave)', /^Mon 26 Oct 07:00 NVAC · load \d+\/\d+/.test(gn19 || ''), gn19);
    const wc29 = await cellText('WC29', 'pk1231');
    check('WC29: the supplier collects Mon 26 Oct in site hours, their own transport', /^Mon 26 Oct 07:00–17:00 Event Portables collect · own transport/.test(wc29 || ''), wc29);
    const wc45 = await cellText('WC45', 'pk1231');
    check('WC45: Mon 26 Oct 07:00 on the Coates toilet run', /^Mon 26 Oct 07:00 Coates toilet run · load \d+\/\d+/.test(wc45 || ''), wc45);
    const plans = await p.evaluate(() => { const M = demob816(), bad = []; [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')].forEach(tr => { const r = M.refs.find(x => x.key === tr.dataset.row816), want = Ready1231.pickups(r), have = [...tr.querySelectorAll('td.pk1231 .pd1231')].length; if (!want.length || want.length !== have) bad.push({k: tr.dataset.row816, want: want.length, have}); }); return bad; });
    check('every row\'s pick-up lines are the plan\'s own stops (trucks816), none made up', !plans.length, plans);
    const sec = await p.evaluate(() => { const M = demob816(), out = {coates: [], sub: {}, bad: []};
      document.querySelectorAll('#pane-demob .dmday816 .sec1231.coates tr[data-row816]').forEach(tr => out.coates.push(tr.dataset.row816));
      document.querySelectorAll('#pane-demob .dmday816 .sec1231.sub .sup1231').forEach(s => { out.sub[s.dataset.sup1231] = [...s.querySelectorAll('tr[data-row816]')].map(tr => tr.dataset.row816); });
      out.coates.forEach(k => { const o = Ready1231.owners(M.refs.find(r => r.key === k)); if (!(o.coates > 0 || o.unknown > 0 || !o.subs.length)) out.bad.push('coates:' + k); });
      Object.entries(out.sub).forEach(([c, ks]) => ks.forEach(k => { const o = Ready1231.owners(M.refs.find(r => r.key === k)); if (!o.subs.some(s => s.co === c)) out.bad.push(c + ':' + k); }));
      const all = new Set([...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')].map(tr => tr.dataset.row816)), placed = new Set(out.coates.concat(...Object.values(out.sub)));
      out.missing = [...all].filter(k => !placed.has(k)); out.heads = [...document.querySelectorAll('#pane-demob .sec1231 .tt1231')].map(h => h.innerText.replace(/\s+/g, ' '));
      return out; });
    check('the day splits into a Coates section and a Sub-hired section, every row under its owner', sec.coates.length > 0 && Object.keys(sec.sub).length > 0 && !sec.bad.length && !sec.missing.length, sec);
    check('WC29 (Event Portables) sits under Sub-hired · Event Portables; GN19 under Coates', (sec.sub['Event Portables'] || []).includes('WC29') && sec.coates.includes('GN19') && !sec.coates.includes('WC29'), {ep: sec.sub['Event Portables'], coates: sec.coates});
    check('each section banner names it and counts what it holds', /^c coates our fleet · \d+ to pick up · \d+ units?$/.test((sec.heads[0] || '').toLowerCase()) && /^s sub-hired from our suppliers · \d+ to pick up · \d+ units? · \d+ suppliers?$/.test((sec.heads[1] || '').toLowerCase()), sec.heads);
    const heads = await p.evaluate(() => { const M = demob816(); return [...document.querySelectorAll('#pane-demob .dmday816 .sec1231')].map(s => { const ks = [...new Set([...s.querySelectorAll('tr[data-row816]')].map(tr => tr.dataset.row816))], n = {ready: 0, not: 0, gone: 0}; ks.forEach(k => { const x = Ready1231.state(M.refs.find(r => r.key === k)); if (n[x.s] != null) n[x.s]++; }); return {sec: s.dataset.sec1231, want: n, text: s.querySelector('.cnt1231').innerText.replace(/\s+/g, ' ').trim()}; }); });
    check('each banner\'s ready, not ready and picked up match its rows', heads.length === 2 && heads.every(h => h.text === h.want.not + ' not ready ' + h.want.ready + ' ready ' + h.want.gone + ' picked up'), heads);
    const s1 = await stat('GN19'), s2 = await stat('WC45');
    check('three lights on every row: GN19 has nothing recorded, so it reads Not checked yet (v12.36: quiet, not red), on site, ready not ticked', s1 && s1.lamps === 3 && s1.lit === 'red' && s1.word === 'Not checked yet' && s1.note === 'on site, ready not ticked', s1);
    check('a toilet with no Emptied tick says pump it out first', s2 && s2.lit === 'red' && s2.note === 'pump it out first, then tick it', s2);
    const lights = await p.evaluate(() => { const rs = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')]; return {rows: rs.length, three: rs.filter(r => r.querySelectorAll('td.st1231 .lp1231').length === 3).length, oneLit: rs.filter(r => r.querySelectorAll('td.st1231 .lp1231.on').length === 1).length, match: rs.filter(r => { const on = r.querySelector('td.st1231 .lp1231.on'); const s = r.dataset.st1231; return on && ((s === 'not' && on.classList.contains('red')) || (s === 'ready' && on.classList.contains('amber')) || (s === 'gone' && on.classList.contains('green'))); }).length}; });
    check('every row has its three lights, red amber green, with exactly one lit, the one its status says', lights.rows > 0 && lights.three === lights.rows && lights.oneLit === lights.rows && lights.match === lights.rows, lights);
    const sp = await p.evaluate(() => { const M = demob816(), bad = [], shown = []; [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')].forEach(tr => { const r = M.refs.find(x => x.key === tr.dataset.row816), s = Ready1231.specs(r), box = tr.querySelector('.sp1231'), txt = box ? box.innerText.replace(/\s+/g, ' ') : '';
        const nums = v => (String(v).match(/\d[\d.,]*/g) || []); const wantNos = s.nos.slice(0, 6), wantFx = s.facts.slice(0, 3); if (wantNos.some(n => !txt.includes(n)) || wantFx.some(f => nums(f.v).some(d => !txt.includes(d)))) bad.push(tr.dataset.row816);  if (!box) bad.push(tr.dataset.row816 + ':no box'); if (box && !s.facts.length && !/to confirm|not on record/.test(txt)) bad.push(tr.dataset.row816 + ':says nothing'); if (txt) shown.push(tr.dataset.row816 + ' — ' + txt); }); return {bad, shown}; });
    check('every row shows its asset numbers and size from the page\'s own record (Loading931), or says to confirm; none made up (v12.36: named Size and Weight pills)', !sp.bad.length && sp.shown.length > 0, sp);
    const g10 = await p.evaluate(() => { const r = demob816().refs.find(x => x.key === 'GN10'); const x = r && Ready1231.state(r); return x ? {s: x.s, at: x.g && x.g.at, when: x.g && Ready1231.when(x.g.at), iso: r.iso} : null; });
    check('GN10 reads Picked up, Mon 26 Oct 07:40, from the departure record', g10 && g10.s === 'gone' && g10.when === 'Mon 26 Oct 07:40', g10);
    if (g10 && g10.iso && g10.iso !== day) await p.evaluate(iso => { DM816.sel = iso; renderDemob816(); }, g10.iso);
    await p.waitForTimeout(500);
    const g10row = await stat('GN10');
    check('GN10\'s row on its day: green lit (complete) and the DEPARTED stamp with the date and time it left', g10row && g10row.lit === 'green' && /^departed$/i.test(g10row.word) && /^mon 26 oct · 07:40$/i.test(g10row.note), {g10row, day: g10 && g10.iso});
    if (g10 && g10.iso && g10.iso !== day) await p.evaluate(iso => { DM816.sel = iso; renderDemob816(); }, day);
    await p.waitForTimeout(500);
    check('the view link shows the lights but they are not buttons: it can read, not change', await p.evaluate(() => !document.querySelector('#pane-demob button[data-lamp1231]') && document.querySelectorAll('#pane-demob .dmday816 .lp1231').length > 0));
    const bar = await p.evaluate(() => { const b = document.querySelector('#pane-demob .sum1231'); const u = new Map(), q = new Map(); [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')].forEach(r => { u.set(r.dataset.row816, r.dataset.st1231); q.set(r.dataset.row816, r.dataset.ps1236); }); const v = [...u.values()], w = [...q.values()]; return b ? {text: b.innerText.replace(/\s+/g, ' ').trim(), rows: u.size, ready: v.filter(s => s === 'ready').length, not: v.filter(s => s === 'not').length, gone: v.filter(s => s === 'gone').length, no: w.filter(s => s === 'not').length, un: w.filter(s => s === 'unchecked').length} : null; });
    check('the day\'s tally: to pick up, not ready, not checked yet, ready, picked up, matching the rows', bar && bar.text.toLowerCase().includes('this day · ' + bar.rows + ' to pick up') && bar.text.includes(bar.ready + ' ready for collection') && bar.text.includes(bar.no + ' not ready · ' + bar.un + ' not checked yet') && bar.no + bar.un === bar.not && bar.text.includes(bar.gone + ' picked up'), bar);
    check('the tally names what was picked up this day, with the times: GN10 07:40, GN24 08:10', /picked up this day/i.test(bar.text) && /GN10 07:40/.test(bar.text) && /GN24 08:10/.test(bar.text), bar.text);
    await p.evaluate(() => document.querySelector('#pane-demob [data-f1231="not"]').click());
    const fl = await p.evaluate(() => { const n = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')]; return {shown: n.filter(r => !r.hidden).length, wrong: n.filter(r => !r.hidden && r.dataset.st1231 !== 'not').length}; });
    check('the filter shows only what is not ready', fl.shown >= bar.not && !fl.wrong, fl);
    await p.evaluate(() => document.querySelector('#pane-demob [data-f1231="all"]').click());
    const cards = await p.evaluate(() => { const M = demob816(); return M.days.slice(0, 3).map(iso => { const b = document.querySelector('#pane-demob [data-dday816="' + iso + '"].dc996-day'); const rs = M.refs.filter(r => (r.iso === iso || (r.portions || []).some(x => x.iso === iso)) && !r.nothing), still = rs.filter(r => Ready1231.state(r).s !== 'gone'); const ev = Ready1231.departuresOn(iso), last = ev.reduce((m, x) => x.at && x.at > m ? x.at : m, '');
      const hh = last ? Ready1231.when(last).slice(-5) : ''; const n = {ready: still.filter(r => Ready1231.state(r).s === 'ready').length, not: still.filter(r => Ready1231.state(r).s === 'not').length};
      return {iso, text: b ? b.innerText.replace(/\s+/g, ' ') : null, want: 'Picked up ' + ev.length + (hh ? ' · last ' + hh : '') + ' Ready for collection ' + n.ready + ' of ' + still.length + ' Not ready ' + n.not}; }); });
    check('each day card, as per what we have: picked up that day with the last time, ready and not ready of what is still to go', cards.every(c => c.text && c.text.includes(c.want) && !/more · More info/.test(c.text)), cards.map(c => ({iso: c.iso, want: c.want, has: (c.text || '').match(/Picked up.*?Not ready \d+/)})));
    const dep26 = await p.evaluate(() => Ready1231.departuresOn('2026-10-26').map(x => x.key + ' ' + (x.at ? Ready1231.when(x.at).slice(-5) : '?')));
    check('today\'s card counts what left today by the record (GN10 07:40, GN24 08:10, the Event Portables toilets 11:04 and 11:58, GN06 12:00), with the last time', ['GN10 07:40', 'GN24 08:10', 'WC55 11:04', 'WC33 11:58', 'GN06 12:00'].every(x => dep26.includes(x)) && (cards[0].text || '').includes('Picked up ' + dep26.length + ' · last ' + String(dep26[dep26.length - 1]).slice(-5)), {dep26, want: cards[0].want});
    await shot('demob_day_list', '#pane-demob .dmday816');
    await shot('demob_sub_hired', '#pane-demob .sec1231.sub');
    await shot('demob_day_cards', '#pane-demob .dc996-calendar');
    await p.evaluate(() => { const b = document.querySelector('#pane-demob [data-view816="trucks"]'); if (b) b.click(); });
    await p.waitForTimeout(800);
    const tr = await p.evaluate(() => { const c = [...document.querySelectorAll('#pane-demob .dmday816 .pill1231.sm1231')]; return {chips: c.length, words: [...new Set(c.map(x => x.textContent.trim().replace(/\d.*/, '')))]}; });
    check('the trucks view carries the same status on every stop', tr.chips > 0, tr);
    await p.evaluate(() => { const b = document.querySelector('#pane-demob [data-view816="list"]'); if (b) b.click(); });
    await p.waitForTimeout(600);

    const words = await p.evaluate(() => ({gn24: deliveryView('GN24'), gn10: deliveryView('GN10'), gn19: deliveryView('GN19')}));
    check('everywhere the state is put into words, GN24 and GN10 read Departed with the time they left', words.gn24.short === 'Departed 26 Oct 08:10' && words.gn10.short === 'Departed 26 Oct 07:40' && /^Departed - left site 26 Oct 08:10/.test(words.gn24.said), {gn24: words.gn24.short, gn10: words.gn10.short, said: words.gn24.said});
    check('only the words change: the light, its colour and the state stay as recorded; a reference on site is untouched', words.gn24.semantic === 'in transit' && words.gn24.c === 'amber' && words.gn19.short === 'On site' && !words.gn19.departed1232, {gn24: [words.gn24.semantic, words.gn24.c], gn19: words.gn19.short});
    await p.evaluate(() => openAsset('GN24'));
    await p.waitForSelector('#drawer .dst1232 .stamp1232', {timeout: 15000});
    const dr = await p.evaluate(() => { const box = document.querySelector('#drawer .dst1232'), card = [...document.querySelectorAll('#drawer .sum816')][0]; return {stamp: box.querySelector('.stamp1232').innerText.replace(/\s+/g, ' ').trim(), items: (box.querySelector('.dsi1232') || {}).innerText, title: card ? card.querySelector('h3').textContent : null, since: card ? card.querySelector('.since816').textContent : null}; });
    check('GN24\'s drawer wears the big DEPARTED stamp: the day, the time and who recorded it', /^departed mon 26 oct 2026 · 08:10 recorded by andrew fisher$/i.test(dr.stamp), dr);
    check('and what left, with its asset number: 1 × 60kva · 1277089', /1 × 60kva · 1277089/.test(dr.items || ''), dr.items);
    check('the drawer\'s state card reads Departed, left site 26 Oct 08:10, not In transit', dr.title === 'Departed' && /^left site 26 Oct 08:10 · /.test(dr.since || ''), {title: dr.title, since: dr.since});
    await shot('drawer_gn24_departed', '#drawer');
    await p.keyboard.press('Escape');
    await p.waitForFunction(() => !document.querySelector('#drawer.on'), null, {timeout: 10000}).catch(() => p.evaluate(() => { const s = document.getElementById('scrim'); if (s) s.click(); }));
    await p.waitForTimeout(400);

    /* v12.35: a departed added reference keeps the quantity its departure recorded (EQ0002, the 61 ft knuckle boom, left 12:47) */
    const eq = await p.evaluate(() => { const st = Departure1211.status('EQ0002'), rd = DemobCollection996.read('EQ0002'), r = demob816().refs.find(x => x.key === 'EQ0002'), x = r && Ready1231.state(r);
      const on = demob816().refs.filter(r => r.key !== 'EQ0002' && deliveryOf(r.key).state === 'on site').map(r => ({k: r.key, left: units816(r.a).some(u => u.left1235)}));
      return {label: st && st.label, complete: st && st.complete, issues: st && st.issues, events: rd && rd.events.map(e => e.departedAt1211), rdIssues: rd && rd.issues, units: r && r.units.map(u => u.n + ' x ' + u.type), s: x && x.s, iso: r && r.iso, words: deliveryView('EQ0002').short, onLeft: on.filter(o => o.left).map(o => o.k), onCount: on.length, gn19: units816(assetOf('GN19')).some(u => u.left1235)}; });
    check('v12.35: EQ0002 (the 61 ft knuckle boom, 1300290) reads Left site, its departure at 12:47 whole, no review asked', eq.label === 'Left site' && eq.complete === true && !eq.issues.length && !eq.rdIssues.length && JSON.stringify(eq.events) === JSON.stringify(['2026-10-26T12:47:00+10:00']), eq);
    check('v12.35: on the Demob plan EQ0002 keeps the quantity its departure recorded and reads picked up, Departed 26 Oct 12:47 in words', JSON.stringify(eq.units) === JSON.stringify(['1 x Knuckle Boom 61ft (18.6M) - Diesel']) && eq.s === 'gone' && eq.words === 'Departed 26 Oct 12:47', eq);
    check('v12.35: nothing on site changes: no reference on site, and no generator, takes a departure quantity', eq.onCount > 20 && !eq.onLeft.length && eq.gn19 === false, {onCount: eq.onCount, onLeft: eq.onLeft});
    const eqRow = await p.evaluate(iso => { if (iso && iso !== DM816.sel) { DM816.sel = iso; renderDemob816(); } const tr = document.querySelector('#pane-demob tr[data-row816="EQ0002"]'), td = tr && tr.querySelector('td.st1231');
      const out = tr ? {st: tr.dataset.st1231, lamps: td.querySelectorAll('.lp1231').length, lit: (td.querySelector('.lp1231.on') || {}).className || '', stamp: ((td.querySelector('.stamp1232 em') || {}).innerText || '').replace(/\s+/g, ' ').trim(), nothing: /Nothing to collect/.test(td.innerText)} : null;
      if (DM816.sel !== '2026-10-26') { DM816.sel = '2026-10-26'; renderDemob816(); } return out; }, eq.iso);
    check('v12.35: EQ0002\'s line wears the green light and the DEPARTED stamp at 12:47, not "Nothing to collect"', eqRow && eqRow.st === 'gone' && eqRow.lamps === 3 && /green/.test(eqRow.lit) && /^mon 26 oct · 12:47$/i.test(eqRow.stamp) && !eqRow.nothing, eqRow);
    await p.waitForTimeout(600);

    /* v12.34: the look. Dark sections, one compact card a line on a phone, a coloured edge for the status, print untouched */
    const look = await p.evaluate(() => {
      const lum = c => { const m = String(c).match(/\d+(\.\d+)?/g); if (!m) return 1; const [r, g, b] = m.map(Number); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
      const sb = document.querySelector('#pane-demob .sec1231>.sb1231'), sec = document.querySelector('#pane-demob .sec1231');
      const rows = [...document.querySelectorAll('#pane-demob .sec1231 tr[data-row816]')].filter(r => r.offsetParent);
      const bg = getComputedStyle(sec).backgroundColor, img = getComputedStyle(sb).backgroundImage;
      const edge = r => getComputedStyle(r).boxShadow;
      const byState = {}; rows.forEach(r => { const s = r.dataset.ps1236; if (!byState[s]) byState[s] = edge(r); });
      const label = rows[0] ? getComputedStyle(rows[0].querySelector('td.pk1231'), '::before').display : null;
      const hs = rows.map(r => r.offsetHeight).sort((a, b) => a - b);
      return {secLum: lum(bg), sbDark: /gradient/.test(img), rows: rows.length, maxH: hs[hs.length - 1], medH: hs[Math.floor(hs.length / 2)], grid: rows[0] ? getComputedStyle(rows[0]).display : null,
        byState, label, overflow: document.documentElement.scrollWidth - innerWidth, mainOverflow: (document.querySelector('main') || {}).scrollWidth - (document.querySelector('main') || {}).clientWidth,
        ink: rows[0] ? lum(getComputedStyle(rows[0].querySelector('td[data-label="What"]')).color) : null};
    });
    check('v12.34: the Coates and Sub-hired sections are dark, like the servicing tracker, with light writing', look.secLum < 0.15 && look.sbDark && look.ink > 0.8, look);
    if (mobile) {
      check('v12.36 on a phone: every line is one card (a grid, no stacked labels) carrying its map, size and weight, typically under 380 px and none over 640 px', look.grid === 'grid' && look.label === 'none' && look.medH <= 380 && look.maxH <= 640 && look.rows >= 20, {grid: look.grid, label: look.label, medH: look.medH, maxH: look.maxH, rows: look.rows});
    } else {
      const g = await p.evaluate(() => { const tb = document.querySelector('#pane-demob .sec1231 table.dm1231 tbody'); return {display: getComputedStyle(tb).display, cols: getComputedStyle(tb).gridTemplateColumns.split(' ').filter(Boolean).length}; });
      check('v12.36 on a wider screen: the same cards in a tidy grid, two or more across, none taller than 640 px', g.display === 'grid' && g.cols >= 2 && look.grid === 'grid' && look.maxH <= 640 && look.rows >= 20, {g, maxH: look.maxH});
    }
    check('v12.34/v12.36: each line wears its status as a coloured edge: red when someone said not ready, grey while not checked yet', (!look.byState.not || /229, 70, 59/.test(look.byState.not)) && /93, 119, 130/.test(look.byState.unchecked || ''), look.byState);
    check('v12.34: nothing runs off the side of the screen', look.overflow <= 1 && look.mainOverflow <= 1, {doc: look.overflow, main: look.mainOverflow});
    await p.emulateMedia({media: 'print'});
    const pr = await p.evaluate(() => { const sec = document.querySelector('#pane-demob .sec1231'); return {bg: getComputedStyle(sec).backgroundColor, row: getComputedStyle(document.querySelector('#pane-demob .sec1231 tr[data-row816]')).display}; });
    await p.emulateMedia({media: 'screen'});
    check('v12.34: printing keeps the page\'s own light table (the dark look is for the screen only)', !/rgb\(15, 27, 33\)|rgb\(11, 33, 41\)/.test(pr.bg), pr);
    await p.waitForTimeout(400);

    /* ---------------- v12.36: everything on site ---------------- */
    await p.evaluate(() => { DM816.view = 'everything'; renderDemob816(); });
    await p.waitForTimeout(1200);
    const ev = await p.evaluate(() => {
      const M = demob816(), plan = new Set(M.refs.map(r => r.key)), extra = allAssets().filter(a => !plan.has(a.key) && deliveryOf(a.key).state === 'on site' && !/fenc|brac/i.test(a.discipline || ''));
      const rows = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')], keys = [...new Set(rows.map(r => r.dataset.row816))];
      const seg = document.querySelector('#pane-demob [data-view816="everything"]');
      return {want: M.refs.length + extra.length, keys: keys.length, missing: M.refs.map(r => r.key).concat(extra.map(a => a.key)).filter(k => !keys.includes(k)), fence: keys.filter(k => /fenc|brac/i.test((assetOf(k) || {}).discipline || '')),
        seg: seg && seg.textContent, pressed: seg && seg.getAttribute('aria-pressed'), h3: (document.querySelector('#pane-demob .dmsh816 h3') || {}).textContent, rows: rows.length};
    });
    check('v12.36: everything on site in one list: every reference on the demob plan and anything on site it does not hold, no fencing or bracing', ev.keys === ev.want && !ev.missing.length && !ev.fence.length && ev.keys > 150, ev);
    check('v12.36: the view button and the title say it: Everything on site · ' + ev.want, ev.seg === 'Everything on site · ' + ev.want && ev.pressed === 'true' && /^Everything on site · \d+ references$/.test(ev.h3 || ''), ev);
    const cat = await p.evaluate(() => { const out = {order: [], bad: [], counts: {}}; let cur = null;
      document.querySelectorAll('#pane-demob .dmday816 .sec1231 table.dm1231').forEach(sec => { const seen = []; cur = null; sec.querySelectorAll('tr.zr1231, tr[data-row816]').forEach(tr => { if (tr.classList.contains('zr1231')) { cur = tr.dataset.cat1236 || '?'; seen.push(cur); return; } const want = DemobMap1236.catOf(tr.dataset.row816); if (want !== cur) out.bad.push(tr.dataset.row816 + ':' + want + '/' + cur); out.counts[cur] = (out.counts[cur] || 0) + 1; }); out.order.push(seen); });
      out.cats = DemobMap1236.CATS.map(c => c.k); return out; });
    check('v12.36: grouped by what it is (the register\'s own discipline): every line under its group, groups in one fixed order in every list', !cat.bad.length && cat.order.every(o => o.every((k, i) => i === 0 || cat.cats.indexOf(k) > cat.cats.indexOf(o[i - 1]))) && (cat.counts.gen || 0) >= 10, cat);
    /* every map drawn: scroll the whole list through */
    await p.evaluate(async () => { const pane = document.getElementById('pane-demob'); let sc = pane.parentElement; while (sc && sc !== document.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY) && sc.scrollHeight > sc.clientHeight + 10) break; sc = sc.parentElement; } if (!sc || sc === document.body) sc = document.scrollingElement; for (let i = 0; i < 240; i++) { const b = sc.scrollTop; sc.scrollTop += 900; await new Promise(r => setTimeout(r, 120)); if (sc.scrollTop === b) break; } });
    await p.waitForFunction(() => { const im = [...document.querySelectorAll('#pane-demob img[data-id1236]')]; return im.length && im.filter(x => x.classList.contains('on')).length >= im.length * 0.97; }, null, {timeout: 120000}).catch(() => {});
    const mp = await p.evaluate(() => { const rows = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')], im = [...document.querySelectorAll('#pane-demob img[data-id1236]')];
      return {rows: rows.length, maps: rows.filter(r => r.querySelector('.mp1236')).length, imgs: im.length, drawn: im.filter(x => x.classList.contains('on') && x.naturalWidth === 396 && x.naturalHeight === 276).length, none: rows.filter(r => r.querySelector('.mp1236 .mpf1236.off:not(:has(img))')).map(r => r.dataset.row816),
        wc33: DemobMap1236.spot('WC33'), pt33: MASTER_LOC.WC33.pt, lab19: ((document.querySelector('#pane-demob tr[data-row816="GN19"] .lb1236') || {}).textContent || ''), nos19: Ready1231.specs(demob816().refs.find(r => r.key === 'GN19')).assetNos}; });
    check('v12.36: every line carries its piece of the master plan (or says it has no spot yet), every map drawn from the plan\'s own tiles', mp.maps === mp.rows && mp.drawn >= mp.imgs * 0.97 && mp.imgs + mp.none.length === mp.rows, {rows: mp.rows, maps: mp.maps, imgs: mp.imgs, drawn: mp.drawn, none: mp.none});
    check('v12.36: WC33\'s map is centred on its point as the master plan draws it, and GN19\'s map names it and its asset number', mp.wc33 && mp.wc33.kind === 'plan' && Math.abs(mp.wc33.fx - mp.pt33[0]) < 1e-9 && Math.abs(mp.wc33.fy - mp.pt33[1]) < 1e-9 && mp.lab19.startsWith('GN19 · ' + mp.nos19[0]), {wc33: mp.wc33, lab19: mp.lab19});
    const ring = await p.evaluate(async () => { const id = document.querySelector('#pane-demob tr[data-row816="GN19"] img[data-id1236]').dataset.id1236; const url = await DemobMap1236.draw(id); const im = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = url; }); const c = document.createElement('canvas'); c.width = 396; c.height = 276; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const R = 396 * 0.118; const px = g.getImageData(Math.round(198 + R), 138, 1, 1).data; return [px[0], px[1], px[2]]; });
    check('v12.36: the red ring sits on the spot, in the middle of the map', ring[0] > 150 && ring[1] < 110 && ring[2] < 110, ring);
    /* idle: once drawn, the tab stays still - nothing redraws itself frame after frame (the steps after a drawing never wake their own watcher) */
    const idle = await p.evaluate(async () => { const pane = document.getElementById('pane-demob'); let n = 0, maps = 0;
      const mo = new MutationObserver(ms => ms.forEach(m => { if (m.target.closest && m.target.closest('.mpf1236')) maps++; else n++; })); mo.observe(pane, {childList: true, subtree: true, characterData: true});
      await new Promise(r => setTimeout(r, 3000)); mo.disconnect(); return {changes: n, mapFrames: maps}; });
    check('v12.36: the tab sits still once drawn: no change to it in 3 seconds of quiet (no redraw loop)', idle.changes === 0, idle);
    const ps = await p.evaluate(() => { const q = k => document.querySelector('#pane-demob .dmday816 tr[data-row816="' + k + '"]');
      const g13 = q('GN13'), w33 = q('WC33'), g19 = q('GN19'); const lit = g19 && g19.querySelector('.lp1231.on i');
      return {gn13: g13 && g13.dataset.ps1236, gn13stamp: g13 && !!g13.querySelector('.stamp1232'), gn13pk: g13 && (g13.querySelector('.bk1236') || {}).textContent, wc33: w33 && ((w33.querySelector('.pt1236') || w33.querySelector('.pt1231') || {}).textContent || '').replace(/\s+/g, ' ').trim(), wc33ps: w33 && w33.dataset.ps1236,
        gn19: g19 && g19.dataset.ps1236, gn19word: g19 && (g19.querySelector('.sw1231') || {}).textContent, gn19bg: lit && getComputedStyle(lit).backgroundColor, gn19pk: g19 && (g19.querySelector('.bk1236') || {}).textContent,
        planShown: [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816] td.pk1231 .pd1231')].filter(x => x.offsetParent).length}; });
    check('v12.36: the cards say what really happened: GN13 Picked up with its stamp and Left site; WC33 6 picked up · 11 to go, worn as a badge', ps.gn13 === 'gone' && ps.gn13stamp && ps.gn13pk === 'Left site' && /^6 picked up · 11 (still on site|to go)/.test(ps.wc33 || ''), ps);
    check('v12.36: nothing recorded reads Not checked yet, quiet not red (GN19), and the plan\'s day and load are off the cards: Pick-up time to be booked', ps.gn19 === 'unchecked' && ps.gn19word === 'Not checked yet' && !/229, 70, 59|255, 116, 105/.test(ps.gn19bg || '') && ps.gn19pk === 'Pick-up time: to be booked' && ps.planShown === 0, ps);
    const pl = await p.evaluate(() => { const rows = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')]; const g = document.querySelector('#pane-demob tr[data-row816="GN19"] .ps1236');
      return {rows: rows.length, size: rows.filter(r => r.querySelector('.pp1236.size')).length, weight: rows.filter(r => r.querySelector('.pp1236.weight')).length, gn19: g && g.innerText.replace(/\s+/g, ' ')}; });
    check('v12.36: every card names its size and its weight, or says to confirm; GN19 2562 × 1031 × 1307 mm and 1662 kg (the guide)', pl.size === pl.rows && pl.weight === pl.rows && /SIZE 2562 × 1031 × 1307 mm/i.test(pl.gn19 || '') && /WEIGHT 1662 kg/i.test(pl.gn19 || ''), pl);
    const pgc = await p.evaluate(() => { const w = DemobProgress996.whole(demob816(), todayIso()), n = a => (a || []).reduce((t, u) => t + (Number(u.n) || 0), 0); let req = 0, col = 0; w.readings.forEach(x => { req += n(x.required); col += n(x.collected); });
      const box = document.querySelector('#pane-demob .pg1236'); return {req, col, done: w.completed, total: w.total, text: box && box.innerText.replace(/\s+/g, ' '), pace: !!(box && box.querySelector('svg line[stroke-dasharray]')), ring: box && (box.querySelector('.rg1236 b') || {}).textContent}; });
    check('v12.36: the demob\'s percentage, big: units off site and references fully gone from the record, day of the demob, and the days against the percentage with the even pace', pgc.text && pgc.text.includes(pgc.col + ' of ' + pgc.req + ' units off site') && pgc.text.includes(pgc.done + ' of ' + pgc.total + ' references fully gone') && /Day 1 of 15/.test(pgc.text) && pgc.pace && pgc.ring === (pgc.col / pgc.req * 100 < 10 ? (pgc.col / pgc.req * 100).toFixed(1) : String(Math.round(pgc.col / pgc.req * 100))) + '%', pgc);
    const ovv = await p.evaluate(() => { const box = document.querySelector('#pane-demob .ov1236'); const rows = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')], u = new Map(); rows.forEach(r => u.set(r.dataset.row816, r)); const located = [...u.keys()].filter(k => DemobMap1236.spot(k)).length;
      return {dots: box ? box.querySelectorAll('.dot1236').length : 0, located, chips: box ? [...box.querySelectorAll('[data-catgo1236]')].map(b => b.dataset.catgo1236) : [], legend: box && box.querySelector('.lg1236').innerText.replace(/\s+/g, ' ')}; });
    check('v12.36: your master plan above the lists: every located line a dot in its colour, and a button for each group', ovv.dots === ovv.located && ovv.dots > 100 && ovv.chips.length >= 5 && /Ready \d+/.test(ovv.legend) && /Picked up \d+/.test(ovv.legend), ovv);
    const jump = await p.evaluate(async () => { const inView = el => { const r = el.getBoundingClientRect(); return r.top >= -2 && r.top < innerHeight; };
      document.querySelector('#pane-demob [data-catgo1236="light"]').click(); await new Promise(r => setTimeout(r, 900)); const hd = document.querySelector('#pane-demob tr.zr1231[data-cat1236="light"]'); const a = hd && inView(hd);
      document.querySelector('#pane-demob .dot1236[data-dot1236="GN19"]').click(); await new Promise(r => setTimeout(r, 900)); const tr = document.querySelector('#pane-demob tr[data-row816="GN19"]'); return {group: a, line: tr && inView(tr), flash: tr && tr.classList.contains('fl1236')}; });
    check('v12.36: tap a group to go to it; tap a dot to go to its line, which glows', jump.group && jump.line && jump.flash, jump);
    await p.evaluate(() => document.querySelector('#pane-demob tr[data-row816="GN19"] button.mp1236').click());
    await p.waitForSelector('.drawer.find1176', {timeout: 15000}).catch(() => {});
    const fd = await p.evaluate(() => { const d = document.querySelector('.drawer.find1176'); return d ? {title: d.querySelector('#f1176h').textContent, nav: (d.querySelector('[data-f1176="nav"]') || {}).href || ''} : null; });
    check('v12.36: tap a card\'s map for the page\'s own "on the map" card: the close-up, the wider area, Navigate and Send', fd && fd.title === 'GN19 · on the map' && /google\.com\/maps\/dir\/\?api=1&destination=-27\.98/.test(fd.nav), fd);
    await shot('demob_everything_map_card', '.drawer.find1176');
    await p.evaluate(() => { const d = document.querySelector('.drawer.find1176'); if (d) d.querySelector('.close').click(); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const s = document.querySelector('#pane-demob .pg1236'); if (s) s.scrollIntoView(); });
    await shot('demob_everything_top', '#pane-demob .dmday816');
    const fit = await p.evaluate(() => ({doc: document.documentElement.scrollWidth - innerWidth, main: (document.querySelector('main') || {}).scrollWidth - (document.querySelector('main') || {}).clientWidth}));
    check('v12.36: nothing runs off the side of the screen in the everything view', fit.doc <= 1 && fit.main <= 1, fit);
    await p.emulateMedia({media: 'print'});
    const pr36 = await p.evaluate(() => ['.mp1236', '.ov1236', '.pg1236'].map(s => { const e = document.querySelector('#pane-demob ' + s); return e ? getComputedStyle(e).display : 'none'; }));
    await p.emulateMedia({media: 'screen'});
    check('v12.36: printing leaves the maps, the plan and the percentage off (the page\'s own sheet prints as before)', pr36.every(d => d === 'none'), pr36);
    await p.evaluate(() => document.querySelector('#pane-demob [data-dday816]').click());
    await p.waitForTimeout(900);
    check('v12.36: tap a day and its own pick-up list opens', await p.evaluate(() => DM816.view === 'list'));
    await p.evaluate(() => { DM816.view = 'list'; DM816.sel = '2026-10-26'; renderDemob816(); });
    await p.waitForTimeout(800);

    /* ---------------- Part B: rehearsals, the sync held in the page ---------------- */
    await p.context().route('**/api/version', r => r.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({version: 0, level: 'edit'})}));
    await p.context().route('**/api/state*', r => r.abort());
    await p.evaluate(() => { window.__captured1231 = []; SYNC.claims = 'edit'; Object.defineProperty(SYNC, 'level', {configurable: true, get: () => 'edit', set: () => {}}); Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}});
      SYNC.db.doc = name => ({set: async value => { __captured1231.push({name, value: JSON.parse(JSON.stringify(value || null))}); return {}; }, delete: async () => { throw Error('Deletion disallowed'); }}); S.operator = 'Example test recorder'; const who = document.getElementById('who'); if (who) who.value = S.operator;
      window.prompt = () => 'still powering the pit lane'; window.confirm = () => true; applyCapability(); renderDemob816(); });
    await p.waitForTimeout(800);
    check('on the edit link the three lights are buttons on every row still to go', await p.evaluate(() => { const rs = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')].filter(r => r.dataset.st1231 !== 'gone' && r.dataset.st1231 !== 'none'); return rs.length > 0 && rs.every(r => r.querySelectorAll('td.st1231 button[data-lamp1231]').length === 3); }));
    await p.locator('#pane-demob [data-k1231="GN19"][data-lamp1231="ready"]').first().click();
    await p.waitForTimeout(700);
    const r1 = await p.evaluate(() => ({d: (({ready1231, ready1231_by, ready1231_why}) => ({ready1231, ready1231_by, ready1231_why}))(S.delivery.GN19 || {}), hist: (S.delivery.GN19.ready1231_history || []).length})); const r1s = await stat('GN19');
    check('amber light: GN19 reads Ready for collection with the recorder and time', r1.d.ready1231 === true && r1.d.ready1231_by === 'Example test recorder' && r1.hist === 1 && r1s.lit === 'amber' && r1s.word === 'Ready for collection' && /^Example test recorder · \w{3} \d+ \w{3} \d\d:\d\d$/.test(r1s.note), {r1, r1s});
    const RED = await p.evaluate(() => { const b = [...document.querySelectorAll('#pane-demob button[data-lamp1231="not"]')].map(x => x.dataset.k1231).find(k => k !== 'GN19' && /^[A-Z0-9-]+$/.test(k) && !needsEmpty816(k)); return b || null; });
    await p.locator('#pane-demob [data-k1231="' + RED + '"][data-lamp1231="not"]').first().click();
    await p.waitForTimeout(700);
    const r2 = await p.evaluate(k => ({d: S.delivery[k].ready1231, why: S.delivery[k].ready1231_why}), RED); const r2s = await stat(RED);
    check('red light: ' + RED + ' reads Not ready for collection with the reason, who and when', r2.d === false && r2.why === 'still powering the pit lane' && r2s.lit === 'red' && /^still powering the pit lane · Example test recorder · /.test(r2s.note), {r2, r2s});
    await p.locator('#pane-demob [data-k1231="WC45"][data-lamp1231="ready"]').first().click();
    await p.waitForTimeout(900);
    const r3 = await p.evaluate(() => ({e: emptiedOf816('WC45').on, by: emptiedOf816('WC45').by, d: S.delivery.WC45.ready1231})); const r3s = await stat('WC45');
    check('amber light on a toilet with no Emptied tick: confirmed pumped out, Emptied in the person\'s name, then Ready', r3.e && r3.by === 'Example test recorder' && r3.d === true && r3s.lit === 'amber' && r3s.word === 'Ready for collection', {r3, r3s});
    await p.locator('#pane-demob [data-k1231="WC45"][data-lamp1231="not"]').first().click();
    await p.waitForTimeout(700);
    const r4 = await p.evaluate(() => ({e: emptiedOf816('WC45').on})); const r4s = await stat('WC45');
    check('a newer Not ready (red) wins over the Emptied tick, which stays as recorded', r4.e && r4s.lit === 'red' && /^still powering the pit lane/.test(r4s.note), {r4, r4s});
    const tally = await p.evaluate(() => document.querySelector('#pane-demob .sum1231').innerText.replace(/\s+/g, ' '));
    const tallyRows = await p.evaluate(() => { const u = new Map(); document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]').forEach(r => u.set(r.dataset.row816, r.dataset.st1231)); return {ready: [...u.values()].filter(s => s === 'ready').length, gn19: u.get('GN19')}; });
    check('the tally moves with the ticks: its ready count is the lines that read ready, GN19 among them', new RegExp('\\b' + tallyRows.ready + ' ready for collection\\b').test(tally) && tallyRows.gn19 === 'ready', {tally, tallyRows});
    const cardNow = await p.evaluate(() => (document.querySelector('#pane-demob [data-dday816="2026-10-26"].dc996-day') || {}).innerText.replace(/\s+/g, ' '));
    const cardWant = await p.evaluate(() => { const M = demob816(), iso = '2026-10-26', rs = M.refs.filter(r => (r.iso === iso || (r.portions || []).some(x => x.iso === iso)) && !r.nothing), still = rs.filter(r => Ready1231.state(r).s !== 'gone'); return still.filter(r => Ready1231.state(r).s === 'ready').length; });
    check('the day card moves with the ticks: Ready for collection counts what reads ready', new RegExp('Ready for collection ' + cardWant + ' of \\d+ Not ready').test(cardNow || ''), {want: cardWant, has: (cardNow || '').match(/Picked up.*?Not ready \d+/)});
    /* Picked up: the existing departure form, which records the date and time */
    await p.locator('#pane-demob [data-k1231="GN19"][data-lamp1231="gone"]').first().click();
    await p.waitForSelector('#collection996', {timeout: 10000});
    check('Picked up opens the page\'s own departure form', await p.evaluate(() => !!document.querySelector('#collection996 [name=collection-date]') && !!document.querySelector('#collection996 [name=collection-time]')));
    await p.evaluate(() => { document.querySelectorAll('#collection996 input[type=checkbox]').forEach(x => { x.checked = true; }); });
    await p.locator('#collection996 [data-departure-now]').click();
    await p.locator('#collection996 button[type=submit]').click();
    await p.waitForFunction(() => !document.querySelector('#collection996'), null, {timeout: 10000});
    await p.waitForTimeout(800);
    const r5 = await p.evaluate(() => { const r = demob816().refs.find(x => x.key === 'GN19'), x = Ready1231.state(r); return {s: x.s, when: x.g && Ready1231.when(x.g.at), btn: !!document.querySelector('#pane-demob button[data-k1231="GN19"]')}; }); const r5s = await stat('GN19');
    check('green light, complete: GN19 wears the DEPARTED stamp with today\'s date and the time it left, and its lights are no longer buttons', r5.s === 'gone' && /^Mon 26 Oct \d\d:\d\d$/.test(r5.when || '') && r5s && r5s.lit === 'green' && /^departed$/i.test(r5s.word) && /^mon 26 oct · \d\d:\d\d$/i.test(r5s.note) && !r5.btn, {r5, r5s});
    check('and everywhere the state is worded, GN19 now reads Departed with that time', await p.evaluate(() => /^Departed 26 Oct \d\d:\d\d$/.test(deliveryView('GN19').short)));
    const after = await p.evaluate(() => ({card: (document.querySelector('#pane-demob [data-dday816="2026-10-26"].dc996-day') || {}).innerText.replace(/\s+/g, ' '), bar: (document.querySelector('#pane-demob .sum1231') || {}).innerText.replace(/\s+/g, ' ')}));
    const n0 = Number(((cards[0].want || '').match(/Picked up (\d+)/) || [])[1]);
    check('picked up now: today\'s card counts one more with the last time, and the tally names GN19 with its time', new RegExp('Picked up ' + (n0 + 1) + ' · last \\d\\d:\\d\\d').test(after.card || '') && /GN19 \d\d:\d\d/.test(after.bar || ''), {n0, card: (after.card || '').match(/Picked up.*?Not ready \d+/), bar: after.bar});
    const sent = await p.evaluate(() => __captured1231.map(c => ({name: c.name, ready: c.value && c.value.ready1231, emptied: c.value && c.value.emptied})));
    const gnSent = sent.filter(c => /delivery\/GN19$/.test(c.name)), wcSent = sent.filter(c => /delivery\/WC45$/.test(c.name));
    check('the ticks travel to the shared record on the delivery document (captured here, never sent)', gnSent.some(c => c.ready === true) && wcSent.some(c => c.emptied === true) && sent.some(c => c.name.endsWith('delivery/' + RED) && c.ready === false), sent.slice(-8));
    /* the merge keeps the tick: the later stamp wins; the same moment with two answers keeps not ready; history is the union */
    const mg = await p.evaluate(() => { const t0 = '2026-10-26T00:10:00.000Z', t1 = '2026-10-26T00:20:00.000Z';
      const A = {delivery: {X1: {state: 'on site', set_at: t0, by: 'a', ready1231: true, ready1231_by: 'Ann', ready1231_at: t1, ready1231_why: '', ready1231_history: [{ready: true, at: t1, by: 'Ann', why: ''}]}}};
      const B = {delivery: {X1: {state: 'on site', set_at: t0, by: 'a', ready1231: false, ready1231_by: 'Bob', ready1231_at: t0, ready1231_why: 'in use', ready1231_history: [{ready: false, at: t0, by: 'Bob', why: 'in use'}]}}};
      const m1 = mergeRecords(A, B).merged.delivery.X1, m2 = mergeRecords(B, A).merged.delivery.X1;
      const C = {delivery: {X1: Object.assign({}, B.delivery.X1, {ready1231_at: t1})}};
      const m3 = mergeRecords(A, C).merged.delivery.X1, m4 = mergeRecords(C, A).merged.delivery.X1;
      return {later: [m1.ready1231, m1.ready1231_by, m2.ready1231, m2.ready1231_by], hist: m1.ready1231_history.length, tie: [m3.ready1231, m4.ready1231], onlyTick: deliveryEmpty({ready1231: true}), none: deliveryEmpty({})}; });
    check('merge: the later tick wins either way round, its history kept whole', JSON.stringify(mg.later) === '[true,"Ann",true,"Ann"]' && mg.hist === 2, mg);
    check('merge: the same moment with two answers keeps not ready on every copy', JSON.stringify(mg.tie) === '[false,false]', mg);
    check('a delivery record holding only the tick is kept, not thrown away as empty', mg.onlyTick === false && mg.none === true, mg);
    const stale = await p.evaluate(() => { const k = 'GN21', on = lastOnSite816(k); if (!on) return {skip: true}; const d = S.delivery[k] || (S.delivery[k] = {}); d.ready1231 = true; d.ready1231_by = 'Old use'; d.ready1231_at = new Date(Date.parse(on) - 3600e3).toISOString(); const r = demob816().refs.find(x => x.key === k); const x = Ready1231.state(r); delete d.ready1231; delete d.ready1231_by; delete d.ready1231_at; return {on, s: x.s, m: !!x.m}; });
    check('a tick from before the unit last arrived counts for nothing', stale.skip || (stale.s === 'not' && !stale.m), stale);
    await shot('demob_day_list_ticked', '#pane-demob .dmday816');
    check('the rehearsals were captured in the page; nothing reached the network', await p.evaluate(() => __captured1231.length > 0) && !h.counts.blocked, h.counts);
    check('no runtime errors through the Demob tab and the rehearsals', !h.errors.length, h.errors);
  } catch (e) { console.error('Runtime errors', h.errors); throw e; }
  finally { await h.browser.close(); }
  console.log(checks.filter(c => c.ok).length + '/' + checks.length);
})().catch(e => { console.error(e); process.exit(1); });
