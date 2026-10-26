/* Author: Andrew Fisher. v12.38 - the Demob cards: book the pick-up date and time, three pictures on every card, and its
   directions to send by text or email. Part A reads the live record through the view link. Part B rehearses the booking with the
   sync held in the page: every write is captured in the page and none reaches the network; the merge is proven on copies.
     PAGE=<build> OUT=<dir> [MOB=1] node test_v1238.cjs */
'use strict';
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = process.env.MOB === '1', out = process.env.OUT, checks = [];
  fs.mkdirSync(out, {recursive: true});
  const h = await open({pageFile: process.env.PAGE, hash: '#demob', W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, mobile}), p = h.page;
  const check = (name, ok, detail) => { checks.push({name, ok: !!ok, detail: detail === undefined ? null : detail}); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(checks, null, 1)); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 700))); };
  const shot = (name, el) => (el ? p.locator(el).first().screenshot({path: path.join(out, name + (mobile ? '_phone' : '_desktop') + '.png')}) : p.screenshot({path: path.join(out, name + (mobile ? '_phone' : '_desktop') + '.png')}));
  const row = k => '#pane-demob .dmday816 tr[data-row816="' + k + '"]';
  const scrollTo = sel => p.evaluate(sel => { const el = document.querySelector(sel); if (!el) return false; el.scrollIntoView({block: 'center'}); return true; }, sel);
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.Ready1231 && window.DemobMap1236 && window.Pickup1238 && window.CardPics1238 && typeof demob816 === 'function', null, {timeout: 180000});
    await p.evaluate(() => { try { go('demob'); } catch (e) {} });
    await p.waitForFunction(() => document.querySelector('#pane-demob .dmday816 tr[data-row816]'), null, {timeout: 60000});
    await p.waitForTimeout(1500);
    const foot = await p.evaluate(() => document.body.innerText.match(/v12\.\d+/g) || []);
    check('page loads with no errors, the v12.38 helpers and footer', !h.errors.length && foot.includes('v12.38') && !foot.includes('v12.36 ·'), {errors: h.errors, foot: [...new Set(foot)]});

    /* ---------------- Part A: the live record, view link ---------------- */
    const A = await p.evaluate(() => {
      const rows = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')], out = {rows: rows.length, spot: 0, gone: 0, goneLeft: 0, booked: 0, toBook: 0, buttonsShown: 0, bad: []};
      rows.forEach(tr => { const k = tr.dataset.row816, ps = tr.dataset.ps1236, bk = tr.querySelector('td.pk1231 .bk1238');
        if (!bk) { out.bad.push(k + ':no spot'); return; } out.spot++;
        if (ps === 'gone') { out.gone++; if (/Left site/.test(bk.textContent)) out.goneLeft++; return; }
        if (bk.classList.contains('on')) out.booked++; else if (/Pick-up time: to be booked/.test(bk.textContent)) out.toBook++; else out.bad.push(k + ':' + bk.textContent.slice(0, 40));
        const b = bk.querySelector('button.bb1238'); if (b && b.offsetParent) out.buttonsShown++; });
      out.cap = document.body.getAttribute('data-cap'); return out; });
    check('v12.38: every card in everything on site has its pick-up spot: Left site, the booked day and time, or "to be booked" - nothing pre-dated', A.rows > 150 && A.spot === A.rows && A.gone === A.goneLeft && A.booked + A.toBook + A.gone === A.rows && !A.bad.length, A);
    check('v12.38: on the view link the spot shows and cannot be changed (no Book button)', A.cap !== 'edit' && A.buttonsShown === 0, {cap: A.cap, shown: A.buttonsShown});
    const P = await p.evaluate(() => { const card = document.querySelector('#pane-demob .dmday816'), bp = card && card.querySelector('.bp1238'), sum = card && card.querySelector('.sum1231'), pg = card && card.querySelector('.pg1236');
      const order = bp && sum ? !!(bp.compareDocumentPosition(sum) & Node.DOCUMENT_POSITION_FOLLOWING) : false, afterPg = bp && pg ? !!(pg.compareDocumentPosition(bp) & Node.DOCUMENT_POSITION_FOLLOWING) : false;
      return {has: !!bp, head: bp && bp.querySelector('header').innerText.replace(/\s+/g, ' '), empty: bp && (bp.querySelector('.be1238') || {}).innerText, lines: bp ? bp.querySelectorAll('[data-bpgo1238]').length : 0, order, afterPg, booked: Pickup1238.list().length}; });
    check('v12.38: the booked pick-ups sit under the demob percentage, above the tally, built only from bookings', P.has && P.order && P.afterPg && /^Booked pick-ups \d+ booked · \d+ still to book$/.test(P.head || '') && (P.lines > 0 || /No pick-ups booked yet/.test(P.empty || '')), P);

    /* three pictures on every card that has a place, and its directions */
    const C = await p.evaluate(() => { const rows = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')], out = {withRow: 0, located: 0, frames: 0, actions: 0, plan: 0, goneWithRow: [], missing: []};
      rows.forEach(tr => { const k = tr.dataset.row816, pz = tr.querySelector('.pz1238'), L = CardPics1238.locOf(k);
        if (tr.dataset.ps1236 === 'gone') { if (pz) out.goneWithRow.push(k); return; }
        if (L) { out.located++; if (!pz) out.missing.push(k); }
        if (!pz) return; out.withRow++; out.frames += pz.querySelectorAll('.pf1238').length; out.actions += pz.querySelectorAll('.ac1238 button').length; if (tr.querySelector('.mp1236')) out.plan++; });
      return out; });
    check('v12.38: every card with a place carries three pictures (the master plan and two aerials) and Navigate, Text, Email and Send; gone ones none', C.withRow > 100 && !C.missing.length && C.frames === C.withRow * 2 && C.actions === C.withRow * 4 && C.plan === C.withRow && !C.goneWithRow.length, C);
    await p.evaluate(async () => { const pane = document.getElementById('pane-demob'); let sc = pane.parentElement; while (sc && sc !== document.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY) && sc.scrollHeight > sc.clientHeight + 10) break; sc = sc.parentElement; } if (!sc || sc === document.body) sc = document.scrollingElement; for (let i = 0; i < 300; i++) { const b = sc.scrollTop; sc.scrollTop += 900; await new Promise(r => setTimeout(r, 110)); if (sc.scrollTop === b) break; } });
    await p.waitForFunction(() => { const im = [...document.querySelectorAll('#pane-demob img[data-ai1238]')]; return im.length && im.filter(x => x.classList.contains('on')).length >= im.length * 0.97; }, null, {timeout: 180000}).catch(() => {});
    const AE = await p.evaluate(() => { const im = [...document.querySelectorAll('#pane-demob img[data-ai1238]')]; return {imgs: im.length, drawn: im.filter(x => x.classList.contains('on') && x.naturalWidth === 396 && x.naturalHeight === 276).length, notes: document.querySelectorAll('#pane-demob .pz1238 .nm1238').length}; });
    check('v12.38: the aerial pictures are drawn on every card from the page\'s own site aerial (396 × 276), or say why not', AE.imgs > 100 && AE.drawn >= AE.imgs * 0.97, AE);
    const ring = await p.evaluate(async () => { const cv = await CardPics1238.aerialCanvas('GN19', 'close', 1); if (!cv) return null; const L = CardPics1238.locOf('GN19'), g = DATA.georef, fr = frameOf(L.lat, L.lon), FX = g.frame_px[0], FY = g.frame_px[1], pxPerM = 1 / g.m_per_frame_px_ground;
      let fw = 2 * 95 * pxPerM, fh = fw * 276 / 396; let x0 = Math.max(0, Math.min(FX - fw, fr.ax * FX - fw / 2)), y0 = Math.max(0, Math.min(FY - fh, fr.ay * FY - fh / 2)); const X = (fr.ax * FX - x0) / fw * 396, Y = (fr.ay * FY - y0) / fh * 276, R = 396 * 0.118;
      const c = cv.getContext('2d'), px = c.getImageData(Math.round(X + R), Math.round(Y), 1, 1).data; return {X: Math.round(X), Y: Math.round(Y), px: [px[0], px[1], px[2]]}; });
    check('v12.38: on the aerial close up the equipment\'s icon sits on its spot in the same neon ring', ring && ring.px[0] < 140 && ring.px[1] > 170 && ring.px[2] > 200, ring);
    /* Navigate, Text and Email open on this phone; nothing is sent from the page */
    await p.evaluate(() => { window.__opened1238 = []; document.addEventListener('click', ev => { const a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (a && /^(sms:|mailto:|https:\/\/www\.google\.com\/maps)/.test(a.getAttribute('href'))) { window.__opened1238.push(a.getAttribute('href')); ev.preventDefault(); } }, true); });
    await scrollTo(row('GN19')); await p.waitForTimeout(400);
    for (const d of ['data-nv1238', 'data-sm1238', 'data-em1238']) await p.click(row('GN19') + ' [' + d + '="GN19"]');
    const opened = await p.evaluate(() => window.__opened1238.slice());
    const nav = opened.find(u => u.startsWith('https://www.google.com/maps/dir/')), sms = decodeURIComponent((opened.find(u => u.startsWith('sms:')) || '').replace(/^sms:\?&body=/, '')), mail = opened.find(u => u.startsWith('mailto:')) || '';
    const mailBody = decodeURIComponent((mail.split('&body=')[1] || '')), mailSubj = decodeURIComponent(((mail.split('subject=')[1] || '').split('&body=')[0]));
    const nos19 = await p.evaluate(() => Ready1231.specs(demob816().refs.find(r => r.key === 'GN19')).assetNos[0]);
    check('v12.38: Navigate opens driving directions to the spot', /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=-2[78]\.\d{6},153\.\d{6}&travelmode=driving$/.test(nav || ''), nav);
    check('v12.38: Text opens a new message with what it is, its asset number, where, its size and weight and the directions', /Coates GC500 demob · GN19/.test(sms) && sms.includes('Asset no. ' + nos19) && /Where: /.test(sms) && /Size 2562 × 1031 × 1307 mm \(guide\) · Weight 1662 kg \(guide\)/.test(sms) && sms.includes('Navigate: ' + nav), sms);
    check('v12.38: Email opens a new email with the same, its subject naming the reference', /^GC500 demob · GN19/.test(mailSubj) && mailBody === sms, {mailSubj, same: mailBody === sms});
    await p.evaluate(() => { window.__shared1238 = null; navigator.canShare = () => true; navigator.share = async d => { window.__shared1238 = {title: d.title, text: d.text, files: (d.files || []).map(f => ({name: f.name, type: f.type, size: f.size}))}; }; });
    await p.click(row('GN19') + ' [data-sd1238="GN19"]');
    await p.waitForFunction(() => window.__shared1238, null, {timeout: 60000}).catch(() => {});
    const shared = await p.evaluate(() => window.__shared1238);
    check('v12.38: Send hands the three pictures (master plan, close up, wider area) and the words to the phone\'s share menu', shared && shared.files.length === 3 && shared.files.every(f => f.type === 'image/jpeg' && f.size > 15000) && /master-plan/.test(shared.files[0].name) && /close-up/.test(shared.files[1].name) && /wider-area/.test(shared.files[2].name) && shared.text === sms, shared);
    await p.click(row('GN19') + ' .pz1238 .pf1238');
    await p.waitForFunction(() => { const d = document.querySelector('.drawer.find1176.on, .find1176.on, .drawer.on.find1176'); return d || [...document.querySelectorAll('.drawer, [class*=find1176]')].some(x => x.offsetParent && /GN19 · on the map/.test(x.innerText)); }, null, {timeout: 20000}).catch(() => {});
    const drawer = await p.evaluate(() => [...document.querySelectorAll('.drawer, [class*=find1176]')].some(x => x.offsetParent && /GN19 · on the map/.test(x.innerText)));
    check('v12.38: tapping an aerial opens the page\'s own "on the map" card for GN19 (full pictures, Navigate, Send)', drawer, drawer);
    await p.keyboard.press('Escape'); await p.evaluate(() => { const x = document.querySelector('.drawer.on [data-close], .drawer.on .x, .drawer.on button[aria-label="Close"]'); if (x) x.click(); }); await p.waitForTimeout(500);
    await scrollTo(row('GN19')); await p.waitForTimeout(600);
    await shot('demob_card_pictures', row('GN19'));
    const look = await p.evaluate(() => { const rows = [...document.querySelectorAll('#pane-demob .dmday816 tr[data-row816]')].filter(r => r.offsetParent), hs = rows.map(r => r.offsetHeight).sort((a, b) => a - b);
      return {med: hs[Math.floor(hs.length / 2)], max: hs[hs.length - 1], overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth}; });
    check('v12.38: the cards stay tidy with the pictures row (no sideways scroll; tall enough for three pictures, no taller)', look.overflow <= 1 && look.med <= (mobile ? 640 : 700) && look.max <= 980, look);
    const idle = await p.evaluate(async () => { const pane = document.getElementById('pane-demob'); let n = 0; const mo = new MutationObserver(ms => ms.forEach(m => { if (!(m.target.closest && m.target.closest('.mpf1236,.pz1238'))) n++; })); mo.observe(pane, {childList: true, subtree: true, characterData: true}); await new Promise(r => setTimeout(r, 3000)); mo.disconnect(); return n; });
    check('v12.38: the tab sits still once drawn (no redraw loop)', idle <= 3, idle);

    /* every VMS board on site, with its asset number, rego and where it stands */
    const V = await p.evaluate(() => { const want = CardPics1238.vmsBoards(), tr = document.querySelector('#pane-demob tr.vb1238'), head = document.querySelector('#pane-demob .sec1231 tr.zr1231[data-cat1236="vms"]');
      if (!tr) return {want: want.length, has: false, head: !!head};
      const cards = [...tr.querySelectorAll('.vc1238')], inGroup = (() => { for (let x = head && head.nextElementSibling; x && !x.classList.contains('zr1231'); x = x.nextElementSibling) if (x === tr) return true; return false; })();
      return {want: want.length, has: true, inGroup, cards: cards.length, withAsset: cards.filter(c => /Asset no\./.test(c.innerText)).length, withRego: cards.filter(c => /Rego/.test(c.innerText)).length, withWhere: cards.filter(c => (c.querySelector('.vw1238') || {}).innerText.length > 5).length,
        assetsKnown: want.filter(b => b.asset).length, regosKnown: want.filter(b => b.rego).length, sample: cards[0] && cards[0].innerText.replace(/\s+/g, ' ').slice(0, 200), head: (tr.querySelector('.vh1238') || {}).innerText}; });
    check('v12.38: every VMS board on the VMS plan is listed under the VMS boards group, each with where it stands, its asset number and its rego (or says to confirm)', V.has && V.inGroup && V.cards === V.want && V.want >= 10 && V.withAsset === V.cards && V.withRego === V.cards && V.withWhere === V.cards && V.assetsKnown > 0, V);
    const vpos = await p.evaluate(() => { const b = CardPics1238.vmsBoards().find(x => x.asset && x.rego) || CardPics1238.vmsBoards()[0]; return b && b.pos; });
    if (vpos) { await scrollTo('#pane-demob .vc1238[data-vms1238="' + vpos + '"]'); await p.evaluate(() => { window.__opened1238 = []; }); await p.click('#pane-demob [data-vsm1238="' + vpos + '"]'); }
    const vsms = await p.evaluate(() => decodeURIComponent(((window.__opened1238 || []).find(u => u.startsWith('sms:')) || '').replace(/^sms:\?&body=/, '')));
    const vb = await p.evaluate(pos => CardPics1238.vmsBoards().find(x => x.pos === pos), vpos);
    check('v12.38: a VMS board\'s Text names it, its asset number, rego, where it stands and the directions', vb && vsms.includes(vb.label) && vsms.includes('Asset no. ' + (vb.asset || 'to confirm')) && vsms.includes('Rego ' + (vb.rego || 'to confirm')) && /Navigate: https:\/\/www\.google\.com\/maps\/dir\//.test(vsms), {vb, vsms});
    await shot('vms_boards', '#pane-demob tr.vb1238');
    if (!mobile) { const hw = await p.evaluate(() => { const th = document.querySelector('#pane-demob .sec1231 tr.zr1231[data-cat1236] th'), tb = th && th.closest('table'); return th ? {th: Math.round(th.getBoundingClientRect().width), table: Math.round(tb.getBoundingClientRect().width)} : null; });
      check('v12.38: on a desktop the group headers run the full width of the cards', hw && hw.th >= hw.table * 0.9, hw); }

    /* ---------------- Part B: the booking, rehearsed with the sync held in the page ---------------- */
    await p.evaluate(() => { window.__captured1238 = []; SYNC.claims = 'edit'; Object.defineProperty(SYNC, 'level', {configurable: true, get: () => 'edit', set: () => {}}); Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}});
      SYNC.db.doc = name => ({set: async value => { __captured1238.push({name, value: JSON.parse(JSON.stringify(value || null))}); return {}; }, delete: async () => { throw Error('Deletion disallowed'); }}); S.operator = 'Example test recorder'; const who = document.getElementById('who'); if (who) who.value = S.operator;
      window.confirm = () => true; applyCapability(); renderDemob816(); });
    await p.waitForTimeout(900);
    const shown = await p.evaluate(() => { const b = document.querySelector('#pane-demob tr[data-row816="GN19"] button.bb1238'); return b && b.offsetParent ? b.textContent : null; });
    check('v12.38: on the edit link every card still on site has its Book pick-up button', shown === 'Book pick-up', shown);
    const tomorrow = await p.evaluate(() => { const d = new Date(Date.parse(todayIso() + 'T12:00:00Z') + 864e5); return d.toISOString().slice(0, 10); });
    await scrollTo(row('GN19')); await p.click(row('GN19') + ' button.bb1238');
    await p.waitForSelector('dialog.bkd1238[open]', {timeout: 10000});
    const dlg = await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); return {title: d.querySelector('h3').textContent, sub: d.querySelector('.ws1238').textContent, date: d.querySelector('[name=d1238]').value, time: d.querySelector('[name=t1238]').value, clear: !d.querySelector('.cl1238').hidden}; });
    check('v12.38: Book pick-up opens a sheet naming the reference, what it is and its asset number, today\'s date ready and the time to pick', dlg.title === 'Book the pick-up' && dlg.sub.startsWith('GN19 · ') && dlg.sub.includes('Asset no. ' + nos19) && /^\d{4}-\d{2}-\d{2}$/.test(dlg.date) && dlg.time === '' && !dlg.clear, dlg);
    await shot('booking_sheet');
    await p.click('dialog.bkd1238 .sv1238');
    const noTime = await p.evaluate(() => ({err: document.querySelector('dialog.bkd1238 .er1238').textContent, open: document.querySelector('dialog.bkd1238').open, sent: __captured1238.length}));
    check('v12.38: saving without a time is refused in words, nothing recorded', /Pick the time/.test(noTime.err) && noTime.open && noTime.sent === 0, noTime);
    await p.fill('dialog.bkd1238 [name=d1238]', tomorrow); await p.fill('dialog.bkd1238 [name=t1238]', '07:00'); await p.fill('dialog.bkd1238 [name=n1238]', 'Coates truck');
    await p.click('dialog.bkd1238 .sv1238');
    await p.waitForFunction(() => __captured1238.some(c => /delivery\/GN19$/.test(c.name) && c.value && c.value.pickup1238_at), null, {timeout: 30000}).catch(() => {});
    const b1 = await p.evaluate(() => { const c = __captured1238.filter(x => /delivery\/GN19$/.test(x.name)).pop(); const v = c && c.value || {}; return {at: v.pickup1238_at, note: v.pickup1238_note, by: v.pickup1238_by, set: v.pickup1238_set, hist: (v.pickup1238_history || []).length, ready: v.ready1231, state: v.state}; });
    check('v12.38: the booking travels to the shared record on GN19\'s delivery document: the moment in Queensland time, the note, who and when (captured, never sent)', b1.at === tomorrow + 'T07:00:00+10:00' && b1.note === 'Coates truck' && b1.by === 'Example test recorder' && /^\d{4}-\d{2}-\d{2}T/.test(b1.set || '') && b1.hist === 1, b1);
    await p.waitForTimeout(700);
    const card1 = await p.evaluate(() => { const bk = document.querySelector('#pane-demob tr[data-row816="GN19"] .bk1238'); return bk ? {on: bk.classList.contains('on'), text: bk.innerText.replace(/\s+/g, ' '), btn: (bk.querySelector('button') || {}).textContent} : null; });
    const dayWord = await p.evaluate(t => Pickup1238.when(t + 'T07:00:00+10:00'), tomorrow);
    check('v12.38: the card says when it is booked, with the note and who booked it; the button now says Change', card1 && card1.on && card1.text.includes('Pick-up booked: ' + dayWord) && /Coates truck · booked by Example test recorder/.test(card1.text) && card1.btn === 'Change', {card1, dayWord});
    const panel1 = await p.evaluate(() => { const bp = document.querySelector('#pane-demob .bp1238'); return {head: bp.querySelector('header').innerText.replace(/\s+/g, ' '), days: [...bp.querySelectorAll('h4')].map(h => h.innerText.replace(/\s+/g, ' ')), lines: [...bp.querySelectorAll('[data-bpgo1238]')].map(b => b.innerText.replace(/\s+/g, ' '))}; });
    check('v12.38: the booked pick-ups list it by day and time with its state', /^Booked pick-ups 1 booked · \d+ still to book$/.test(panel1.head) && panel1.days.length === 1 && panel1.lines.length === 1 && /^07:00 GN19 · /.test(panel1.lines[0]), panel1);
    await p.click('#pane-demob .bp1238 [data-bpgo1238="GN19"]'); await p.waitForTimeout(400);
    const glow = await p.evaluate(() => document.querySelector('#pane-demob tr[data-row816="GN19"]').classList.contains('fl1236'));
    check('v12.38: tapping a booked pick-up goes to its card', glow, glow);
    await shot('booked_pickups', '#pane-demob .bp1238');
    /* change it, book another, clear the first */
    await scrollTo(row('GN19')); await p.click(row('GN19') + ' button.bb1238'); await p.waitForSelector('dialog.bkd1238[open]');
    const pre = await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); return {title: d.querySelector('h3').textContent, time: d.querySelector('[name=t1238]').value, note: d.querySelector('[name=n1238]').value, clear: !d.querySelector('.cl1238').hidden}; });
    check('v12.38: Change opens the sheet with the booking as it stands and a Clear button', pre.title === 'Change the pick-up' && pre.time === '07:00' && pre.note === 'Coates truck' && pre.clear, pre);
    await p.fill('dialog.bkd1238 [name=t1238]', '09:30'); await p.click('dialog.bkd1238 .sv1238'); await p.waitForTimeout(900);
    await scrollTo(row('WC33')); await p.click(row('WC33') + ' button.bb1238'); await p.waitForSelector('dialog.bkd1238[open]');
    await p.fill('dialog.bkd1238 [name=d1238]', tomorrow); await p.fill('dialog.bkd1238 [name=t1238]', '08:00'); await p.fill('dialog.bkd1238 [name=n1238]', 'Event Portables'); await p.click('dialog.bkd1238 .sv1238'); await p.waitForTimeout(900);
    const panel2 = await p.evaluate(() => [...document.querySelectorAll('#pane-demob .bp1238 [data-bpgo1238]')].map(b => b.getAttribute('data-bpgo1238') + ' ' + b.querySelector('b').textContent));
    const h2 = await p.evaluate(() => (S.delivery.GN19.pickup1238_history || []).map(x => x.pickup.slice(11, 16)));
    check('v12.38: a change is kept in its history, and the list runs in time order across references', JSON.stringify(panel2) === JSON.stringify(['WC33 08:00', 'GN19 09:30']) && JSON.stringify(h2) === JSON.stringify(['07:00', '09:30']), {panel2, h2});
    await scrollTo(row('GN19')); await p.click(row('GN19') + ' button.bb1238'); await p.waitForSelector('dialog.bkd1238[open]'); await p.click('dialog.bkd1238 .cl1238'); await p.waitForTimeout(900);
    const cleared = await p.evaluate(() => { const c = __captured1238.filter(x => /delivery\/GN19$/.test(x.name)).pop(), bk = document.querySelector('#pane-demob tr[data-row816="GN19"] .bk1238'); return {at: c && c.value.pickup1238_at, hist: c && (c.value.pickup1238_history || []).length, card: bk && bk.innerText.replace(/\s+/g, ' '), list: [...document.querySelectorAll('#pane-demob .bp1238 [data-bpgo1238]')].map(b => b.getAttribute('data-bpgo1238'))}; });
    check('v12.38: Clear takes the booking off on the record as a dated change; the card says to be booked again and the list drops it', cleared.at === '' && cleared.hist === 3 && /Pick-up time: to be booked/.test(cleared.card || '') && JSON.stringify(cleared.list) === '["WC33"]', cleared);
    const gone = await p.evaluate(() => { const tr = document.querySelector('#pane-demob tr[data-row816][data-ps1236="gone"]'); return tr ? {k: tr.dataset.row816, text: (tr.querySelector('.bk1238') || {}).innerText, btn: !!tr.querySelector('button.bb1238')} : null; });
    check('v12.38: a reference that has left in full says Left site and offers no booking', gone && /Left site/.test(gone.text || '') && !gone.btn, gone);
    const sms2 = await p.evaluate(() => CardPics1238.wordsOf('WC33').lines.join('\n'));
    check('v12.38: Text and Email carry the booked pick-up once there is one', /Pick-up booked: /.test(sms2), sms2);
    /* the merge, on copies: the later booking wins whichever copy is named first; a clearing is a dated change; histories join */
    const M = await p.evaluate(() => {
      const bk = (at, set, note, by) => ({pickup1238_at: at, pickup1238_note: note || '', pickup1238_by: by || 'A', pickup1238_set: set, pickup1238_history: [{pickup: at, note: note || '', by: by || 'A', at: set}]});
      const m = (a, b) => mergeRecords({delivery: {GN19: a}}, {delivery: {GN19: b}}).merged.delivery.GN19 || null;
      const early = bk('2026-10-27T07:00:00+10:00', '2026-10-26T05:00:00.000Z', 'first', 'A'), late = bk('2026-10-27T09:30:00+10:00', '2026-10-26T06:00:00.000Z', 'second', 'B'), clearLate = bk('', '2026-10-26T07:00:00.000Z', '', 'C');
      const r1 = m(early, late), r2 = m(late, early), r3 = m(early, clearLate), r4 = m(clearLate, bk('2026-10-28T07:00:00+10:00', '2026-10-26T08:00:00.000Z', 'later again', 'D'));
      const onlyBooking = mergeRecords({delivery: {WC10: early}}, {delivery: {}}).merged.delivery.WC10, onlyClear = mergeRecords({delivery: {}}, {delivery: {WC10: clearLate}}).merged.delivery.WC10;
      const mixed = m({ready1231: true, ready1231_by: 'A', ready1231_at: '2026-10-26T04:00:00.000Z', ready1231_why: '', emptied: true, emptied_by: 'A', emptied_at: '2026-10-26T03:00:00.000Z'}, late);
      return {r1: r1 && r1.pickup1238_at, r2: r2 && r2.pickup1238_at, r1note: r1 && r1.pickup1238_note, hist: r1 && (r1.pickup1238_history || []).map(h => h.at), r3: r3 && r3.pickup1238_at, r3by: r3 && r3.pickup1238_by, r4: r4 && r4.pickup1238_at,
        onlyBooking: !!(onlyBooking && onlyBooking.pickup1238_at), onlyClear: !!(onlyClear && onlyClear.pickup1238_at === ''), mixed: mixed && {ready: mixed.ready1231, emptied: mixed.emptied, at: mixed.pickup1238_at}};
    });
    check('v12.38: merge - the later booking wins whichever copy is named first, the note and who travel with it, and both histories are kept', M.r1 === '2026-10-27T09:30:00+10:00' && M.r2 === M.r1 && M.r1note === 'second' && JSON.stringify(M.hist) === JSON.stringify(['2026-10-26T05:00:00.000Z', '2026-10-26T06:00:00.000Z']), M);
    check('v12.38: merge - a later clearing beats an older booking, and a later booking beats an older clearing', M.r3 === '' && M.r3by === 'C' && M.r4 === '2026-10-28T07:00:00+10:00', M);
    check('v12.38: merge - a record holding only a booking, or only its clearing, is kept; Ready and Emptied are untouched beside it', M.onlyBooking && M.onlyClear && M.mixed && M.mixed.ready === true && M.mixed.emptied === true && M.mixed.at === '2026-10-27T09:30:00+10:00', M);
    const sent = await p.evaluate(() => __captured1238.map(c => c.name));
    check('v12.38: only the booked references\' delivery documents were written, all captured in the page; nothing reached the network', sent.length > 0 && sent.every(n => /delivery\/(GN19|WC33)$/.test(n)) && !h.counts.blocked, {sent: [...new Set(sent)], counts: h.counts});
    check('no runtime errors through the Demob tab and the rehearsals', !h.errors.length, h.errors);
  } catch (e) { check('the test ran to the end', false, String(e && e.stack || e).slice(0, 800)); }
  const pass = checks.filter(c => c.ok).length; console.log(pass + '/' + checks.length);
  await h.browser.close();
})();
