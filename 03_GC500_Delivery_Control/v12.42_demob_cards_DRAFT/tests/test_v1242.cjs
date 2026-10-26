/* Author: Andrew Fisher. v12.42 (built as v12.38) - the Demob tab, one card per asset. Part A reads the live record through the view link: the
   cards, their owners, the waste tanks with their toilets, the barriers, the building contents, every VMS board, the default Not
   ready, the icons, the two map pictures, arrival, the directions, find and filter, the day cards and a day's list, the progress
   lit up, the counts (on site only) and the VMS stores. Part B rehearses a unit's Ready tick and its booking (calendar, clock, typed
   time, all units at once, clear one), the Picked up light opening the departure form for that unit, Emptied at a mixed reference,
   and a store copy without this browser's ticks arriving on the live sync, with the sync held in the page: every write is captured
   in the page and none reaches the network; the merge is proven on copies.
     PAGE=<build> OUT=<dir> [MOB=1] node test_v1242.cjs */
'use strict';
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page');
(async () => {
  const mobile = process.env.MOB === '1', out = process.env.OUT, checks = [];
  fs.mkdirSync(out, {recursive: true});
  const h = await open({pageFile: process.env.PAGE, hash: '#demob', W: mobile ? 390 : 1440, H: mobile ? 844 : 1000, dpr: mobile ? 2 : 1, mobile}), p = h.page;
  const check = (name, ok, detail) => { checks.push({name, ok: !!ok, detail: detail === undefined ? null : detail}); fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(checks, null, 1)); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok || detail === undefined ? '' : ' · ' + JSON.stringify(detail).slice(0, 900))); };
  /* a card's picture is taken once its two map pictures are drawn, with the sticky filter bar let go so it does not sit over the card */
  const shot = async (name, el) => { const file = path.join(out, name + (mobile ? '_phone' : '_desktop') + '.png');
    try { if (el) { await p.waitForFunction(sel => { const a = document.querySelector(sel); return !a || [...a.querySelectorAll('img[data-pi1238]')].every(i => i.classList.contains('on')); }, el, {timeout: 20000}).catch(() => {});
        await p.evaluate(sel => { const b = document.querySelector('#pane-demob .tb1238'); if (b && !(b.contains(document.querySelector(sel)))) b.style.position = 'static'; }, el); await p.locator(el).first().screenshot({path: file}); }
      else await p.screenshot({path: file}); } catch (e) { console.log('shot ' + name + ': ' + e.message.slice(0, 120)); }
    await p.evaluate(() => { const b = document.querySelector('#pane-demob .tb1238'); if (b) b.style.position = ''; }).catch(() => {}); };
  const card = (k, u) => '#pane-demob article.sg1238[data-sg1238="' + k + '"]' + (u ? '[data-u1238="' + u + '"]' : '');
  const scrollTo = sel => p.evaluate(sel => { const el = document.querySelector(sel); if (!el) return false; el.scrollIntoView({block: 'center'}); return true; }, sel);
  const blurNames = () => p.addStyleTag({content: '.bc984-names,.bc984-names *{filter:blur(7px)!important}'});
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && window.Singles1238 && window.Glow1238 && typeof demob816 === 'function', null, {timeout: 180000});
    await p.evaluate(() => { try { go('demob'); } catch (e) {} });
    await p.waitForFunction(() => document.querySelector('#pane-demob article.sg1238'), null, {timeout: 90000});
    await p.waitForTimeout(2500);
    const foot = await p.evaluate(() => document.body.innerText.match(/v12\.\d+/g) || []);
    check('page loads with no errors, the Demob card helpers on v12.41\'s render boundary, and the footer v12.42', !h.errors.length && foot.includes('v12.42') && !foot.includes('v12.41 ·') && await p.evaluate(() => Singles1238.release === 'v12.42' && !!window.Performance1241), {errors: h.errors, foot: [...new Set(foot)]});

    /* ---------------- Part A: the live record, view link ---------------- */
    const A = await p.evaluate(() => {
      const m = Singles1238.model(), arts = [...document.querySelectorAll('#pane-demob .sgv1238 article.sg1238')];
      const by = k => (m.byKey.get(k) || []).map(c => ({uid: c.uid, owner: c.owner, item: c.item, no: c.no, tank: c.tankNo, s: c.st.s, group: !!c.group, icon: c.icon, inside: c.inside}));
      const secC = document.querySelector('#pane-demob .sx1238.coates'), secS = document.querySelector('#pane-demob .sx1238.sub');
      return {cards: m.cards.length, arts: arts.length, uniq: new Set(arts.map(a => a.dataset.sg1238 + '#' + a.dataset.u1238)).size,
        coatesIn: secC ? secC.querySelectorAll('article.sg1238').length : 0, subIn: secS ? secS.querySelectorAll('article.sg1238').length : 0,
        coatesOwn: m.cards.filter(c => c.owner === 'coates' || c.owner === 'unknown').length, sups: secS ? [...secS.querySelectorAll('.sp1238 > h4')].map(x => x.textContent) : [],
        WC09: by('WC09'), WC31: by('WC31'), WC67: by('WC67'), T0024: by('T0024'), WC20: by('WC20'), WC05: by('WC05'), WC60: by('WC60'), WB01: by('WB01'), P46: by('P46'), P01: by('P01'), T0002: by('T0002'), GN18: by('GN18'), WB19: by('WB19').length + by('WB20').length,
        contentsCards: m.cards.filter(c => c.cat === 'bld' && /aircon|air con|fridge|chair|heater/i.test(c.item)).map(c => c.key + '#' + c.uid), onSite: m.cards.filter(c => c.st.s !== 'gone').length, gone: m.cards.filter(c => c.st.s === 'gone').length,
        count: Singles1238.count(), bar: (document.querySelector('#pane-demob .sgv1238 .th1238 span') || {}).textContent,
        wc09Facts: (m.byKey.get('WC09') || []).map(c => [c.item, (c.facts || []).map(f => f.v).join(' | ')]),
        wbRefs: [...new Set(m.cards.filter(c => c.cat === 'wb').map(c => c.key))].length, wbCards: m.cards.filter(c => c.cat === 'wb').length, wbGroups: m.cards.filter(c => c.cat === 'wb' && c.group).length,
        btn: (document.querySelector('[data-view816="everything"]') || {}).textContent, notChecked: /Not checked yet/i.test(document.getElementById('pane-demob').innerText)};
    });
    check('v12.42: everything on site is one card per asset, each drawn once (' + A.cards + ' cards)', A.cards > 380 && A.arts === A.cards && A.uniq === A.cards && /Everything on site · \d+ assets/.test(A.btn || ''), {cards: A.cards, arts: A.arts, uniq: A.uniq, btn: A.btn});
    check('v12.42: "on site" counts only what is still there (' + A.onSite + ' on site, ' + A.gone + ' picked up), on the tab button and the bar', A.count === A.onSite && A.gone > 0 && (A.btn || '').includes('· ' + A.onSite + ' assets') && (A.bar || '').startsWith(A.onSite + ' assets on site · ' + A.gone + ' picked up'), {count: A.count, onSite: A.onSite, gone: A.gone, btn: A.btn, bar: A.bar});
    check('v12.42: a run the record holds as not on site, with nothing collected, is not on the list (WB19, WB20)', A.WB19 === 0, A.WB19);
    check('v12.42: Coates\' own units are in our list, sub-hired units under their supplier', A.coatesIn === A.coatesOwn && A.subIn === A.cards - A.coatesOwn && A.sups.some(s => /Event Portables/.test(s)) && A.sups.some(s => /Premiair/.test(s)), {coatesIn: A.coatesIn, coatesOwn: A.coatesOwn, subIn: A.subIn, sups: A.sups});
    const split = (list, co, ep) => list.filter(c => c.owner === 'coates').length === co && list.filter(c => c.owner === 'event-portables').length === ep;
    check('v12.42: the mixed toilet references split by owner: WC09 2 Coates + 16 Event Portables, WC31 1 + 2 (the 16 Pan blocks), WC67 1 + 3, T0024 1 + 1', split(A.WC09, 2, 16) && split(A.WC31, 1, 2) && split(A.WC67, 1, 3) && split(A.T0024, 1, 1) && A.WC31.filter(c => /16\s*Pan/i.test(c.item)).length === 2, {WC09: A.WC09.length, WC31: A.WC31, WC67: A.WC67.length, T0024: A.T0024});
    const pair = (list, b, t) => list.some(c => c.no === b && c.tank === t);
    check('v12.42: a waste tank stays on its toilet\'s card, paired on the record\'s word (WC20 by set, WC60 by its note: 1119489 with 1328980, 1087500 with 1328981; WC05 one of each)', A.WC20.length === 2 && pair(A.WC20, '1327228', '1311341') && pair(A.WC20, '1327225', '1328982') && A.WC60.length === 2 && pair(A.WC60, '1119489', '1328980') && pair(A.WC60, '1087500', '1328981') && A.WC05.length === 1 && A.WC05[0].tank === '1328978', {WC20: A.WC20, WC60: A.WC60, WC05: A.WC05});
    check('v12.42: water barriers stay one card a run; what is inside a building is on the building\'s card (P46 with its fridges and air conditioners)', A.wbCards === A.wbRefs && A.wbGroups === A.wbCards && A.P46.length === 1 && A.P46[0].inside.some(x => /Fridge 1318501/.test(x)) && A.P46[0].inside.some(x => /Air conditioner/.test(x)), {wb: [A.wbRefs, A.wbCards, A.wbGroups], P46: A.P46});
    check('v12.42: a building is one card with what is inside it listed on it (P01: its fridge and two air conditioners), never cards of their own', A.P01.length === 1 && /Building/.test(A.P01[0].item) && A.P01[0].inside.some(x => /Fridge 1328956/.test(x)) && A.P01[0].inside.filter(x => /Air conditioner/.test(x)).length === 2 && !A.contentsCards.length, {P01: A.P01, contentsCards: A.contentsCards});
    const ff = it => (A.wc09Facts.find(x => x[0] === it) || [])[1] || '';
    check('v12.42: size and weight are each unit\'s own on a mixed reference (WC09: the FWF guide 117 kg on the FWF, not on the Coates toilet block)', /117 kg/.test(ff('FWF')) && !/117 kg/.test(ff('Toilet Block 6m')), A.wc09Facts.slice(0, 4));
    check('v12.42: a reference of five light towers is five cards, each its own asset number', A.T0002.length === 5 && new Set(A.T0002.map(c => c.no)).size === 5 && A.T0002.every(c => /^\d{7}$/.test(c.no)), A.T0002);
    check('v12.42: nothing reads "Not checked yet": a unit is Not ready until it is ticked Ready or picked up', !A.notChecked, A.notChecked);
    const RS = await p.evaluate(() => { const m = Singles1238.model(), r = m.cards.filter(c => c.st.s === 'ready'); return {ready: r.length, src: [...new Set(r.map(c => c.st.src || 'none'))], emptiedNot: m.cards.filter(c => c.st.s === 'not' && /is emptied; tick it Ready/.test(c.st.why || '')).length}; });
    check('v12.42: only a Ready tick makes a unit Ready (its own or its reference\'s); an Emptied (pumped out) tick alone never does (Andrew: "everything ticked not ready. Unless i have done so")', RS.src.every(x => x === 'unit' || x === 'ref'), RS);
    const ST = await p.evaluate(() => { const g = [...document.querySelectorAll('#pane-demob .sgv1238 article.sg1238.st-gone')]; return {gone: g.length, stamped: g.filter(a => { const s = a.querySelector('.stp1238'); return s && /Picked up/i.test(s.textContent) && /\d{2}:\d{2}|[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2}/.test(s.textContent); }).length, glow: (() => { const s = document.querySelector('#pane-demob .stp1238'); if (!s) return null; const b = getComputedStyle(s, '::before'); return {anim: b.animationName, shadow: getComputedStyle(s).boxShadow !== 'none'}; })()}; });
    check('v12.42: every unit that has left carries the collection stamp: big, glowing and pulsing, with the day and time it left', ST.gone > 0 && ST.stamped === ST.gone && ST.glow && /stg1238/.test(ST.glow.anim) && ST.glow.shadow, ST);
    await scrollTo('#pane-demob .sgv1238 article.sg1238.st-gone'); await p.waitForTimeout(500); await shot('card_picked_up_stamp', '#pane-demob .sgv1238 article.sg1238.st-gone');
    const I = await p.evaluate(() => { const m = Singles1238.model(), ic = k => [...new Set((m.byKey.get(k) || []).map(c => c.icon))];
      const arts = [...document.querySelectorAll('#pane-demob article.sg1238')]; return {GN18: ic('GN18'), WC09: ic('WC09'), T0002: ic('T0002'), P46: ic('P46'), WC20: ic('WC20'), EQ0001: ic('EQ0001'), T0109: ic('T0109'), vms: [...new Set(m.cards.filter(c => c.cat === 'vms').map(c => c.icon))], withIcon: arts.filter(a => a.querySelector('.hd1238 .ic1238 svg')).length, all: arts.length}; });
    check('v12.42: each card carries the icon of what it is (generator, toilet, pee panel, toilet block, lighting tower, building, scissor lift, forklift, message board)', I.withIcon === I.all && I.GN18.join() === 'gen' && ['fwf', 'urinal', 'block'].every(x => I.WC09.includes(x)) && I.T0002.join() === 'tower' && I.P46.join() === 'bld' && I.WC20.join() === 'block' && I.EQ0001.join() === 'scissor' && I.T0109.join() === 'forklift' && I.vms.join() === 'vms', I);
    const V = await p.evaluate(() => { const m = Singles1238.model(), vs = m.cards.filter(c => c.cat === 'vms');
      return {n: vs.length, labels: vs.map(c => c.vms && c.vms.label).sort(), withNo: vs.filter(c => c.no).length, withRego: vs.filter(c => c.rego).length, located: vs.filter(c => c.vms && Number.isFinite(c.vms.lat) && Number.isFinite(c.vms.lon)).length, withWhere: vs.filter(c => c.vms && c.vms.where.length > 1).length,
        v02: (vs.find(c => c.no === '1211370') || {}).vms, text02: (document.querySelector('#pane-demob article.sg1238[data-u1238="coates|1211370"] .wh1238') || {}).textContent}; });
    const VS = await p.evaluate(() => { const m = Singles1238.model(); return ['13', '14', '15', '16', '17'].map(n => { const c = m.cards.find(x => x.vms && x.vms.label === 'VMS ' + n); const a = c && document.querySelector('#pane-demob article.sg1238[data-sg1238="' + c.key + '"][data-u1238="' + c.uid + '"] .wh1238');
      return c ? {n, stored: c.vms.stored, where: c.vms.where, lat: c.vms.lat, lon: c.vms.lon, text: a ? a.textContent : ''} : {n}; }); });
    const due = Date.now() >= Date.parse('2026-10-26T06:00:00+10:00');
    check('v12.42: after the final removal morning the session boards 13-17 are in their store (VMS 15 at T2 runoff, VMS 16 behind 2 Breaker St on their store pins; 13, 14, 17 say their store has no pin yet)', !due || (VS.every(v => v.stored && /^In storage/.test(v.text) && /Was at VMS 1\d/.test(v.text)) && Math.abs(VS[2].lat + 27.990144) < 1e-6 && Math.abs(VS[3].lat + 27.9817267) < 1e-6 && ['13', '14', '17'].every(n => /store is not pinned yet/.test(VS.find(v => v.n === n).text))), VS);
    check('v12.42: every VMS board, 24, each with its asset number, rego and where it stands now (VMS 02 at its 02a pin)', V.n === 24 && new Set(V.labels).size === 24 && V.withNo === 24 && V.withRego === 24 && V.located === 24 && V.withWhere === 24 && V.v02 && V.v02.at === 'VMS 02a' && /Now at VMS 02a/.test(V.text02 || ''), V);
    const R = await p.evaluate(() => { const arts = [...document.querySelectorAll('#pane-demob article.sg1238')], out = {onSite: 0, two: 0, pulse: 0, actions: 0, gonePics: 0, arrived: 0, notBoard: 0, located: 0, missing: []};
      arts.forEach(a => { const c = Singles1238.cardOf(a.dataset.sg1238, a.dataset.u1238); if (!c) return; if (!c.board) { out.notBoard++; if (a.querySelector('.mt1238 .ar')) out.arrived++; }
        if (c.st.s === 'gone') { if (a.querySelector('.ph1238')) out.gonePics++; return; } out.onSite++;
        const L = Singles1238.locOf(c), imgs = a.querySelectorAll('.ph1238 img[data-pi1238]'); if (L) { out.located++; if (imgs.length === 2) out.two++; else out.missing.push(c.key); }
        out.pulse += a.querySelectorAll('.ph1238 .pu1238').length; if (a.querySelectorAll('.ac1238 button').length === 4) out.actions++; });
      return out; });
    check('v12.42: every card still on site with a place has two map pictures (close up and wider area) with a pulsing ring, and Navigate, Text, Email and Send; picked-up cards none', R.located > 300 && R.two === R.located && R.pulse >= R.two * 2 && R.actions === R.onSite && R.gonePics === 0, R);
    check('v12.42: the arrival date is on the cards (' + R.arrived + ' of ' + R.notBoard + ')', R.arrived >= R.notBoard * 0.9, {arrived: R.arrived, of: R.notBoard});
    await scrollTo(card('GN18')); await p.waitForTimeout(400);
    await p.waitForFunction(() => { const a = document.querySelector('#pane-demob article.sg1238[data-sg1238="GN18"]'); return a && a.querySelectorAll('img[data-pi1238].on').length === 2; }, null, {timeout: 90000}).catch(() => {});
    const PIC = await p.evaluate(() => { const a = document.querySelector('#pane-demob article.sg1238[data-sg1238="GN18"]'); const im = [...a.querySelectorAll('img[data-pi1238]')];
      return {on: im.filter(x => x.classList.contains('on') && x.naturalWidth === 560).length, words: [...a.querySelectorAll('.vw1238')].map(x => x.textContent), badge: a.querySelectorAll('.pf1238 .pb1238 svg').length, state: Singles1238.picsState()}; });
    check('v12.42: the pictures are the page\'s own "on the map" pictures (close up 190 m, wider area 840 m), drawn and with the icon on them', PIC.on === 2 && PIC.words.join('|') === 'Close up · 190 m|Wider area · 840 m' && PIC.badge === 2, PIC);
    await shot('card_generator', card('GN18'));
    /* the directions: Navigate, Text, Email and Send */
    await p.evaluate(() => { window.__opened1238 = []; document.addEventListener('click', ev => { const a = ev.target && ev.target.closest && ev.target.closest('a[href]'); if (a && /^(sms:|mailto:|https:\/\/www\.google\.com\/maps)/.test(a.getAttribute('href'))) { window.__opened1238.push(a.getAttribute('href')); ev.preventDefault(); } }, true);
      window.__shared1238 = null; navigator.canShare = () => true; navigator.share = async d => { window.__shared1238 = {title: d.title, text: d.text, files: (d.files || []).map(f => f.name + ':' + f.size)}; }; });
    for (const d of ['data-nv1238', 'data-sm1238', 'data-em1238']) await p.click(card('GN18') + ' [' + d + '="GN18"]');
    const opened = await p.evaluate(() => window.__opened1238.slice());
    const nav = opened.find(u => /^https:\/\/www\.google\.com\/maps\/dir\//.test(u)), sms = opened.find(u => u.startsWith('sms:')), mail = opened.find(u => u.startsWith('mailto:'));
    const smsBody = sms ? decodeURIComponent(sms.split('body=')[1] || '') : '';
    check('v12.42: Navigate gives driving directions; Text and Email open a new message with what it is, its asset number, where, arrival, how it stands and the directions', !!nav && !!mail && /GN18/.test(smsBody) && /Asset no\. 1261273/.test(smsBody) && /Arrived /.test(smsBody) && /Now: /.test(smsBody) && /Navigate: https:\/\/www\.google\.com\/maps/.test(smsBody), {opened, smsBody});
    await p.click(card('GN18') + ' [data-sd1238="GN18"]');
    await p.waitForFunction(() => window.__shared1238, null, {timeout: 30000}).catch(() => {});
    const shared = await p.evaluate(() => window.__shared1238);
    check('v12.42: Send hands the two pictures and the words to the phone\'s share menu', shared && shared.files.length === 2 && shared.files.every(f => /GN18-1261273-(close|wide)\.jpg:\d{4,}/.test(f)) && /1261273/.test(shared.text), shared);
    /* find and filter */
    await scrollTo('#pane-demob [data-fd1238]'); await p.fill('#pane-demob [data-fd1238]', '1211370'); await p.waitForTimeout(400);
    const F1 = await p.evaluate(() => [...document.querySelectorAll('#pane-demob article.sg1238')].filter(a => !a.hidden && getComputedStyle(a).display !== 'none').map(a => a.dataset.u1238));
    const F1v = await p.evaluate(() => [...document.querySelectorAll('#pane-demob article.sg1238')].filter(a => a.getBoundingClientRect().height > 0).length);
    await p.fill('#pane-demob [data-fd1238]', ''); await p.click('#pane-demob [data-f1238="gone"]'); await p.waitForTimeout(400);
    const F2 = await p.evaluate(() => { const vis = [...document.querySelectorAll('#pane-demob article.sg1238')].filter(a => !a.hidden); return {n: vis.length, allGone: vis.every(a => a.dataset.s1238 === 'gone'), want: Singles1238.model().cards.filter(c => c.st.s === 'gone').length}; });
    await p.click('#pane-demob [data-f1238="all"]'); await p.waitForTimeout(300);
    check('v12.42: find by asset no., GC500 ID, VMS or rego (1211370 finds VMS 02 alone); the filter shows only what it says (picked up)', F1.length === 1 && F1[0] === 'coates|1211370' && F1v === 1 && F2.n === F2.want && F2.allGone && F2.n > 0, {F1, F1v, F2});
    /* the progress lit up */
    const G = await p.evaluate(() => { const pg = document.querySelectorAll('#pane-demob .pg1238'); return {n: pg.length, old: document.querySelectorAll('#pane-demob .pg1236').length, ov: document.querySelectorAll('#pane-demob .ov1236').length, stars: pg[0] ? pg[0].querySelectorAll('.sr1238 .s1238').length : 0, line: pg[0] ? !!pg[0].querySelector('.ch1238 path.ln') : false, ring: pg[0] ? (pg[0].querySelector('.rg1238 b') || {}).textContent : '', first: pg[0] ? pg[0] === document.querySelector('#pane-demob .dmday816').firstElementChild : false, text: pg[0] ? pg[0].innerText.replace(/\s+/g, ' ').slice(0, 300) : ''}; });
    check('v12.42: the progress card is lit up: a glowing ring and line, today\'s point pulsing, five stars; v12.36\'s card and master-plan overview give way', G.n === 1 && G.old === 0 && G.ov === 0 && G.stars === 5 && G.line && /^\d+(\.\d)?%$/.test(G.ring) && G.first && /units off site/.test(G.text) && /of 5 stars/.test(G.text), G);
    await scrollTo('#pane-demob .pg1238'); await shot('progress', '#pane-demob .pg1238');
    await shot('everything_top', '#pane-demob .tb1238');
    await shot('booked_pickups_empty', '#pane-demob .bp1238');
    await scrollTo(card('WC09', 'event-portables|0085')); await p.waitForTimeout(2500); await shot('card_wc09_event_portables', card('WC09', 'event-portables|0085'));
    await scrollTo(card('WC09', 'coates|1268858')); await p.waitForTimeout(2500); await shot('card_wc09_coates_block', card('WC09', 'coates|1268858'));
    await scrollTo('#pane-demob .gp1238[data-cat1238="vms"]'); await p.waitForTimeout(3500); await shot('vms_boards', '#pane-demob .gp1238[data-cat1238="vms"] .gg1238 article.sg1238');
    await scrollTo(card('P46')); await p.waitForTimeout(2500); await shot('card_building_contents', card('P46'));
    await scrollTo(card('WC20')); await p.waitForTimeout(2500); await shot('card_toilet_with_tank', card('WC20'));
    /* the day cards: only what was booked for the day or left on it */
    const today = await p.evaluate(() => todayIso()), later = await p.evaluate(() => { const ds = demob816().days || []; return ds.find(d => d > todayIso()) || null; });
    const DC = await p.evaluate(({today, later}) => { const c = iso => document.querySelector('#pane-demob .dc996-day[data-dday816="' + iso + '"]'), t = c(today), l = later && c(later);
      return {today: t ? t.innerText.replace(/\s+/g, ' ') : null, later: l ? l.innerText.replace(/\s+/g, ' ') : null, planned: /PLANNED PICK-UPS|planned/i.test([...document.querySelectorAll('#pane-demob .dc996-day')].map(x => x.innerText).join(' ')), rows: Ready1231.dayRows(later), lines: t ? t.querySelectorAll('.dl1238 span').length : 0}; }, {today, later});
    check('v12.42: today\'s day card lists what was picked up with each reference, what it is, its asset numbers and the time (GN10 · 20kva generator · 1283681 · 07:40; WC23 · FWF portable toilet · 0968 0960 0107)', DC.today && /GN10 20kva generator 1283681 07:40/i.test(DC.today) && /GN24 60kva generator 1277089 08:10/i.test(DC.today) && /WC23 FWF portable toilet 0968 0960 0107/i.test(DC.today) && DC.lines >= 10, {today: (DC.today || '').slice(0, 600), lines: DC.lines});
    const DP = await p.evaluate(({today, later}) => { const c = iso => document.querySelector('#pane-demob .dc996-day[data-dday816="' + iso + '"] .dp1238'), t = c(today), l = later && c(later), F = Glow1238.figures(), all = [...document.querySelectorAll('#pane-demob .dc996-day[data-dday816]')];
      return {cards: all.length, withPct: all.filter(x => x.querySelector('.dp1238')).length, today: t ? t.innerText.replace(/\s+/g, ' ') : null, todayVal: t ? +t.dataset.dp1238 : null, pct: F && F.pct, later: l ? l.innerText.replace(/\s+/g, ' ') : null, laterAhead: l ? l.classList.contains('ahead') : null,
        past: all.filter(x => x.dataset.dday816 < today).map(x => +((x.querySelector('.dp1238') || {dataset: {}}).dataset.dp1238))}; }, {today, later});
    check('v12.42: every demob day card shows how complete the demob is: by the end of a day gone, now for today (the progress ring\'s own figure), and for a day ahead where its bookings would take it', DP.cards > 0 && DP.withPct === DP.cards && Math.abs(DP.todayVal - DP.pct) < 0.01 && /demob complete · now/i.test(DP.today || '') && /so far today/.test(DP.today || '') && /of \d+ off site now/.test(DP.today || '') && DP.laterAhead === true && /Nothing booked for this day yet|booked for this day/.test(DP.later || '') && DP.past.every(v => v <= DP.todayVal + 1e-9), DP);
    await scrollTo('#pane-demob .dc996-day[data-dday816="' + today + '"]'); await p.waitForTimeout(300); await blurNames(); await shot('day_card_percent', '#pane-demob .dc996-day[data-dday816="' + today + '"]');
    check('v12.42: a day ahead shows only what is booked for it (nothing yet), not the schedule\'s plan', DC.later && /Nothing yet/.test(DC.later) && !DC.planned && DC.rows && DC.rows.map(r => r.label).join('|') === 'Booked|Ready of booked|Picked up' && DC.rows[0].value === 0, {later: (DC.later || '').slice(0, 500), planned: DC.planned, rows: DC.rows});
    await scrollTo('#pane-demob .strip816'); await blurNames(); await p.waitForTimeout(300); await shot('day_cards', '#pane-demob .strip816');
    const SEG = await p.evaluate(() => (document.querySelector('#pane-demob .segs816 [data-view816="list"]') || {}).textContent || '');
    check('v12.42: in Everything on site the day-list button counts what was booked and picked up that day, not the old plan', /booked and picked up · \d+$/.test(SEG) && !/Pick-up list/.test(SEG), SEG);
    await p.click('#pane-demob [data-f1238="booked"]'); await p.waitForTimeout(300);
    await p.click('#pane-demob .dc996-day[data-dday816="' + today + '"]'); await p.waitForTimeout(2500);
    const DV = await p.evaluate(today => { const pane = document.getElementById('pane-demob'), arts = [...pane.querySelectorAll('.sgv1238 article.sg1238')], m = Singles1238.model(), qd = v => new Date(Date.parse(v) + 36e6).toISOString().slice(0, 10);
      const evd = ev => ev.info.at ? qd(ev.info.at) : ev.info.day;
      const want = m.cards.filter(c => (c.st.s === 'gone' ? (c.st.at ? qd(c.st.at) : c.st.day) === today : !!(c.book && qd(c.book.at) === today)) || !!(c.group && c.G && c.G.events.some(ev => evd(ev) === today))).length;
      const units = Number((String((Ready1231.dayRows(today)[2] || {}).value || '').match(/^\d+/) || [0])[0]), hidden = arts.filter(a => a.hidden).length;
      const vis = s => { const b = pane.querySelector(s); return !!(b && b.offsetParent); };
      return {mode: pane.dataset.sg1238, n: arts.length, want, units, hidden, allToday: arts.every(a => a.dataset.s1238 === 'gone' || a.dataset.b1238 === today || a.classList.contains('grp')), h3: (pane.querySelector('.dmsh816 h3') || {}).textContent, toilets: vis('.segs816 [data-view816="toilets"]'), trucks: vis('.segs816 [data-view816="trucks"]'), print: vis('[data-print816]'), conf: vis('[data-conf816]')}; }, today);
    check('v12.42: a day\'s list holds only what left that day (by the day it left, and a run part-collected that day even once the rest has gone) or is booked for it; its heading counts units, as the day card does; a "booked" filter from Everything is not carried in; the schedule\'s runs, trucks, print and confirm are put away', DV.mode === 'day' && DV.n === DV.want && DV.n > 0 && DV.hidden === 0 && DV.allToday && new RegExp('booked · ' + DV.units + ' picked up$').test(DV.h3 || '') && DV.units >= DV.n && !DV.toilets && !DV.trucks && !DV.print && !DV.conf, DV);
    await shot('day_list', '#pane-demob .sgv1238 .tb1238');
    if (later) { await p.click('#pane-demob .dc996-day[data-dday816="' + later + '"]'); await p.waitForTimeout(1500);
      const DL = await p.evaluate(() => ({n: document.querySelectorAll('#pane-demob .sgv1238 article.sg1238').length, empty: (document.querySelector('#pane-demob .em1238') || {}).textContent || ''}));
      check('v12.42: a day with nothing booked says so and lists nothing from the schedule', DL.n === 0 && /Nothing booked or picked up/.test(DL.empty), DL); }
    await p.click('#pane-demob [data-view816="everything"]'); await p.waitForTimeout(2000);
    /* layout and quiet */
    const LAY = await p.evaluate(() => { const arts = [...document.querySelectorAll('#pane-demob article.sg1238')].slice(0, 12).map(a => a.getBoundingClientRect()); const top = arts.length ? arts[0].top : 0;
      return {perRow: arts.filter(r => Math.abs(r.top - top) < 4).length, w: arts.length ? Math.round(arts[0].width) : 0, over: document.scrollingElement.scrollWidth - innerWidth}; });
    check('v12.42: the cards lay out ' + (mobile ? 'one to a row on a phone, no sideways scroll' : 'three or more to a row on a desktop'), mobile ? LAY.perRow === 1 && LAY.over <= 1 : LAY.perRow >= 3 && LAY.over <= 1, LAY);
    const idle = await p.evaluate(() => new Promise(res => { const pane = document.getElementById('pane-demob'); let n = 0; const mo = new MutationObserver(ms => { n += ms.length; }); mo.observe(pane, {childList: true, subtree: true}); setTimeout(() => { mo.disconnect(); res(n); }, 3000); }));
    check('v12.42: the tab settles: no redraw loop while nothing changes (' + idle + ' changes in 3 s)', idle <= 60, idle);

    /* ---------------- Part B: a unit's Ready tick and its booking, with the sync held in the page ---------------- */
    await p.evaluate(() => { window.__captured1238 = []; SYNC.claims = 'edit'; Object.defineProperty(SYNC, 'level', {configurable: true, get: () => 'edit', set: () => {}}); Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}});
      SYNC.db.doc = name => ({set: async value => { __captured1238.push({name, value: JSON.parse(JSON.stringify(value || null))}); return {}; }, delete: async () => { throw Error('Deletion disallowed'); }}); S.operator = 'Example test recorder'; const who = document.getElementById('who'); if (who) who.value = S.operator;
      window.confirm = () => true; window.prompt = () => 'test'; applyCapability(); renderDemob816(); });
    await p.waitForTimeout(1500);
    const EP = 'event-portables|0085', CO = 'coates|1268858', G18 = await p.evaluate(() => (Singles1238.model().byKey.get('GN18') || [])[0].uid);
    const shown = await p.evaluate(sel => { const b = document.querySelector(sel + ' .bk1238 button[data-book1238]'); const l = document.querySelector(sel + ' button[data-lamp1238="ready"]'); return {book: b ? b.textContent : null, lamp: !!l}; }, card('GN18', G18));
    check('v12.42: on the edit link every card still on site has its Book pick-up button and its Ready light to press', shown.book === 'Book pick-up' && shown.lamp, shown);
    await scrollTo(card('WC09', EP)); await p.click(card('WC09', EP) + ' button[data-lamp1238="ready"]');
    await p.waitForFunction(() => __captured1238.some(c => /delivery\/WC09$/.test(c.name) && c.value && c.value.ready1238_units), null, {timeout: 30000}).catch(() => {});
    await p.waitForTimeout(900);
    const RD = await p.evaluate(({EP, CO}) => { const c = __captured1238.filter(x => /delivery\/WC09$/.test(x.name)).pop(), v = c && c.value || {}, u = (v.ready1238_units || {})[EP] || null;
      const st = uid => (document.querySelector('#pane-demob article.sg1238[data-sg1238="WC09"][data-u1238="' + uid + '"]') || {}).dataset; return {u, ref: v.ready1231, hist: (v.ready1238_history || []).length, ep: (st(EP) || {}).s1238, co: (st(CO) || {}).s1238}; }, {EP, CO});
    check('v12.42: Ready on one Event Portables unit at WC09 marks that unit only, on its own clock; the Coates toilet block beside it stays Not ready; the reference\'s own tick is untouched', RD.u && RD.u.on === true && RD.u.by === 'Example test recorder' && RD.hist === 1 && RD.ep === 'ready' && RD.co === 'not' && RD.ref === undefined, RD);
    await shot('card_ready_rehearsal', card('WC09', EP));
    /* the booking: a calendar and a clock */
    const tomorrow = await p.evaluate(() => { const d = new Date(Date.parse(todayIso() + 'T12:00:00Z') + 864e5); return d.toISOString().slice(0, 10); });
    await scrollTo(card('GN18', G18)); await p.click(card('GN18', G18) + ' button[data-book1238]');
    await p.waitForSelector('dialog.bkd1238[open]', {timeout: 10000});
    const D0 = await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'), shown = el => !!el && el.getBoundingClientRect().height > 0; return {title: d.querySelector('h3').textContent, sub: d.querySelector('.bs1238').textContent, save: d.querySelector('[data-bk1238="save"]').disabled, days: d.querySelectorAll('.cg1238 button[data-day1238]').length, past: d.querySelectorAll('.cg1238 button[disabled]').length, hours: d.querySelectorAll('.ck1238 button[data-h1238]').length, time: d.querySelector('[name=t1238]').value, clear: shown(d.querySelector('[data-bk1238="clear"]')), all: shown(d.querySelector('label.al1238')), icon: !!d.querySelector('.bi1238 svg')}; });
    check('v12.42: Book pick-up opens a sheet with a calendar (no day picked, past days shut) and a clock (24 hours), naming the asset; Save waits for a day and a time', D0.title === 'Book the pick-up' && /GN18/.test(D0.sub) && /1261273/.test(D0.sub) && D0.save && D0.days >= 28 && D0.hours === 24 && D0.time === '' && !D0.clear && !D0.all && D0.icon, D0);
    await p.click('dialog.bkd1238 [data-day1238="' + tomorrow + '"]'); await p.click('dialog.bkd1238 [data-h1238="7"]'); await p.click('dialog.bkd1238 [data-m1238="30"]');
    const D1 = await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); return {time: d.querySelector('[name=t1238]').value, sum: d.querySelector('.sm1238').textContent, save: d.querySelector('[data-bk1238="save"]').disabled, hand: !!d.querySelector('.ck1238 .hn1238')}; });
    check('v12.42: a day on the calendar, the hour and the minutes on the clock: 07:30, and Save opens', D1.time === '07:30' && /Pick-up .* at 07:30/.test(D1.sum) && !D1.save && D1.hand, D1);
    await p.fill('dialog.bkd1238 [name=n1238]', 'Coates truck'); await shot('booking_sheet', 'dialog.bkd1238');
    await p.click('dialog.bkd1238 [data-bk1238="save"]');
    await p.waitForFunction(() => __captured1238.some(c => /delivery\/GN18$/.test(c.name) && c.value && c.value.pickup1238_units), null, {timeout: 30000}).catch(() => {});
    await p.waitForTimeout(900);
    const B1 = await p.evaluate(G18 => { const c = __captured1238.filter(x => /delivery\/GN18$/.test(x.name)).pop(), v = c && c.value || {}, b = (v.pickup1238_units || {})[G18] || null; const bk = document.querySelector('#pane-demob article.sg1238[data-sg1238="GN18"] .bk1238');
      return {b, hist: (v.pickup1238_history || []).length, card: bk ? bk.innerText.replace(/\s+/g, ' ') : '', on: bk ? bk.classList.contains('on') : false, open: document.querySelector('dialog.bkd1238').open}; }, G18);
    check('v12.42: the booking travels on GN18\'s delivery document for that unit: Queensland time, the note, who and when; the card shows it', B1.b && B1.b.at === tomorrow + 'T07:30:00+10:00' && B1.b.note === 'Coates truck' && B1.b.by === 'Example test recorder' && /^\d{4}-\d{2}-\d{2}T/.test(B1.b.set) && B1.hist === 1 && B1.on && /Pick-up booked .* 07:30/.test(B1.card) && /Coates truck · booked by Example test recorder/.test(B1.card) && !B1.open, B1);
    const BL = await p.evaluate(() => { const bp = document.querySelector('#pane-demob .bp1238'); return {head: bp.querySelector('header').innerText.replace(/\s+/g, ' '), lines: [...bp.querySelectorAll('button.bl1238')].map(b => b.innerText.replace(/\s+/g, ' '))}; });
    check('v12.42: the booked pick-ups list shows it by day and time', /1 booked/.test(BL.head) && BL.lines.length === 1 && /^07:30 GN18 /.test(BL.lines[0]) && /1261273/.test(BL.lines[0]), BL);
    await shot('booked_pickups', '#pane-demob .bp1238');
    const DT = await p.evaluate(t => { const c = document.querySelector('#pane-demob .dc996-day[data-dday816="' + t + '"]'); return c ? c.innerText.replace(/\s+/g, ' ') : null; }, tomorrow);
    check('v12.42: tomorrow\'s day card now carries the booking (GN18 1261273 07:30)', DT && /GN18 50kva generator 1261273 booked 07:30/i.test(DT) && /Booked 1/.test(DT), (DT || '').slice(0, 500));
    const DPT = await p.evaluate(t => { const x = document.querySelector('#pane-demob .dc996-day[data-dday816="' + t + '"] .dp1238'); return x ? {text: x.innerText.replace(/\s+/g, ' '), val: +x.dataset.dp1238, now: Glow1238.figures().pct} : null; }, tomorrow);
    check('v12.42: a booking moves the day ahead: tomorrow\'s card says where its bookings take the demob if every one goes', DPT && /if every booking goes/i.test(DPT.text) && /booked for this day \(1 unit\)/.test(DPT.text) && DPT.val > DPT.now, DPT);
    /* typed time, and all of one supplier's units at a reference at once */
    await scrollTo(card('WC09', EP)); await p.click(card('WC09', EP) + ' button[data-book1238]'); await p.waitForSelector('dialog.bkd1238[open]');
    const AL = await p.evaluate(() => { const l = document.querySelector('dialog.bkd1238 label.al1238'); return {hidden: l.hidden, text: l.textContent}; });
    await p.click('dialog.bkd1238 [data-day1238="' + tomorrow + '"]'); await p.fill('dialog.bkd1238 [name=t1238]', '730');
    const T7 = await p.evaluate(() => document.querySelector('dialog.bkd1238 .sm1238').textContent);
    await p.fill('dialog.bkd1238 [name=t1238]', '1415'); await p.check('dialog.bkd1238 [name=a1238]');
    const TY = await p.evaluate(() => ({sum: document.querySelector('dialog.bkd1238 .sm1238').textContent, save: document.querySelector('dialog.bkd1238 [data-bk1238="save"]').disabled}));
    await p.click('dialog.bkd1238 [data-bk1238="save"]'); await p.waitForTimeout(1200);
    const B2 = await p.evaluate(() => { const c = __captured1238.filter(x => /delivery\/WC09$/.test(x.name)).pop(), v = c && c.value || {}, m = v.pickup1238_units || {}; const ks = Object.keys(m);
      return {n: ks.length, allEP: ks.every(k => /^event-portables\|/.test(k)), at: [...new Set(ks.map(k => m[k].at))], coates: ks.filter(k => /^coates/.test(k)).length, want: (Singles1238.model().byKey.get('WC09') || []).filter(c => c.owner === 'event-portables' && c.st.s !== 'gone').length}; });
    check('v12.42: a typed time (730 -> 07:30, 1415 -> 14:15) and "Book all the Event Portables units at WC09" books every one of them at once, not the Coates blocks', /at 07:30/.test(T7) && !AL.hidden && /Book all 16 Event Portables units at WC09/.test(AL.text) && /at 14:15/.test(TY.sum) && !TY.save && B2.n === B2.want && B2.n === 16 && B2.allEP && B2.at.length === 1 && B2.at[0] === tomorrow + 'T14:15:00+10:00' && B2.coates === 0, {T7, AL, TY, B2});
    /* Clear is for the one unit, even with "Book all" ticked */
    await scrollTo(card('WC09', EP)); await p.click(card('WC09', EP) + ' button[data-book1238]'); await p.waitForSelector('dialog.bkd1238[open]');
    await p.check('dialog.bkd1238 [name=a1238]'); await p.click('dialog.bkd1238 [data-bk1238="clear"]'); await p.waitForTimeout(1200);
    const C1 = await p.evaluate(EP => { const c = __captured1238.filter(x => /delivery\/WC09$/.test(x.name)).pop(), m = (c && c.value || {}).pickup1238_units || {}; return {me: m[EP] ? m[EP].at : null, others: Object.keys(m).filter(k => k !== EP && m[k].at).length, open: document.querySelector('dialog.bkd1238').open}; }, EP);
    check('v12.42: Clear booking clears this unit only, even with "Book all" ticked (WC09 0085 cleared; the other 15 Event Portables bookings stand)', C1.me === '' && C1.others === 15 && !C1.open, C1);
    /* clear */
    await scrollTo(card('GN18', G18)); await p.click(card('GN18', G18) + ' button[data-book1238]'); await p.waitForSelector('dialog.bkd1238[open]');
    const pre = await p.evaluate(() => { const d = document.querySelector('dialog.bkd1238'); return {time: d.querySelector('[name=t1238]').value, note: d.querySelector('[name=n1238]').value, clear: !d.querySelector('[data-bk1238="clear"]').hidden, day: (d.querySelector('.cg1238 button[aria-pressed="true"]') || {}).dataset}; });
    await p.click('dialog.bkd1238 [data-bk1238="clear"]'); await p.waitForTimeout(1000);
    const B3 = await p.evaluate(G18 => { const c = __captured1238.filter(x => /delivery\/GN18$/.test(x.name)).pop(), v = c && c.value || {}, b = (v.pickup1238_units || {})[G18]; const bk = document.querySelector('#pane-demob article.sg1238[data-sg1238="GN18"] .bk1238');
      return {at: b && b.at, hist: (v.pickup1238_history || []).length, card: bk ? bk.innerText.replace(/\s+/g, ' ') : ''}; }, G18);
    check('v12.42: Change opens the booking as it stands; Clear is a dated change too, and the card is back to "to be booked"', pre.time === '07:30' && pre.note === 'Coates truck' && pre.clear && pre.day && pre.day.day1238 === tomorrow && B3.at === '' && B3.hist === 2 && /Pick-up: to be booked/.test(B3.card), {pre, B3});
    /* Picked up: the page's own departure form with this unit ticked; Emptied at a mixed reference turns nobody else Ready */
    const PU = 'event-portables|0551';
    await scrollTo(card('WC09', PU)); await p.click(card('WC09', PU) + ' button[data-lamp1238="gone"]');
    await p.waitForSelector('#collection996', {timeout: 15000}).catch(() => {});
    const PF = await p.evaluate(() => { const f = document.getElementById('collection996'); if (!f) return null; const ch = [...f.querySelectorAll('input[type=checkbox]')]; return {title: (f.querySelector('#collection996-title') || {}).textContent, checked: ch.filter(x => x.checked).map(x => x.value), n: ch.length, emptied: !!(emptiedOf816('WC09') || {}).on}; });
    await shot('pickup_form_one_unit', '#collection996');
    await p.evaluate(() => { const b = document.querySelector('#collection996 [data-collection996-close]'); if (b) b.click(); });
    await p.waitForTimeout(4500); await p.evaluate(() => { try { renderDemob816(); } catch (e) {} }); await p.waitForTimeout(900);
    const EM = await p.evaluate(EP => { const cs = Singles1238.model().byKey.get('WC09') || []; return {co: cs.filter(c => c.owner === 'coates').map(c => c.st.s), epOther: [...new Set(cs.filter(c => c.owner === 'event-portables' && c.uid !== EP).map(c => c.st.s))], ep: (cs.find(c => c.uid === EP) || {st: {}}).st.s, why: (cs.find(c => c.owner === 'coates') || {st: {}}).st.why, form: !!document.getElementById('collection996')}; }, EP);
    check('v12.42: Picked up on one unit opens the page\'s own departure form for WC09 with that unit ticked (Emptied asked for the whole reference first)', PF && /WC09/.test(PF.title || '') && PF.checked.length === 1 && /0551/.test(PF.checked[0]) && PF.emptied === true && !EM.form, PF);
    check('v12.42: at a mixed reference Emptied turns nobody Ready: the Coates blocks and the untouched Event Portables units stay Not ready; the unit ticked Ready stays Ready', EM.co.length === 2 && EM.co.every(s => s === 'not') && EM.epOther.join() === 'not' && EM.ep === 'ready' && /is emptied; tick it Ready/.test(EM.why || ''), EM);
    /* a reference's own Ready tick counts for its units only where one owner holds them all; a departure record the page
       leaves out for review is named on the card (both staged on this page only: the page's own objects swapped, then put back) */
    const RM = await p.evaluate(async () => {
      const R0 = window.Ready1231, D0 = window.Departure1211, at = new Date().toISOString(), why = 'Item quantities changed after a collection record; review the collection scope.';
      const m0 = Singles1238.model(), K = [...m0.byKey.keys()].find(k => { const cs = m0.byKey.get(k); return k !== 'WC09' && cs.length > 0 && cs.every(c => !c.group && !c.board && c.st.s === 'not') && new Set(cs.map(c => c.owner)).size === 1; }) || 'GN25';
      window.Ready1231 = Object.assign({}, R0, {mark: k => (k === 'WC09' || k === K) ? {on: true, at, by: 'test'} : R0.mark(k)});
      window.Departure1211 = Object.assign({}, D0, {read: k => { const v = D0.read(k); return k === K ? Object.assign({}, v, {issues: [why]}) : v; }});
      await new Promise(r => setTimeout(r, 4300)); let out = null;
      try { const m = Singles1238.model(), w = m.byKey.get('WC09') || [], g = m.byKey.get(K) || [];
        out = {K, co: w.filter(c => c.owner === 'coates').map(c => c.st.s), epRef: w.filter(c => c.st.src === 'ref').length, gn: g.map(c => c.st.s + ':' + (c.st.src || '')), why: g.length ? g[0].st.rv || '' : ''};
        try { RENDER_MEMO.delete('demob816'); renderDemob816(); } catch (e) {} await new Promise(r => setTimeout(r, 900)); const art = document.querySelector('#pane-demob article.sg1238[data-sg1238="' + K + '"]'); out.dom = art ? /departure record needs review/.test(art.innerText) : null; }
      finally { window.Ready1231 = R0; window.Departure1211 = D0; }
      await new Promise(r => setTimeout(r, 4300)); const back = (Singles1238.model().byKey.get(K) || [{st: {}}])[0].st.rv || ''; try { RENDER_MEMO.delete('demob816'); renderDemob816(); } catch (e) {} await new Promise(r => setTimeout(r, 900)); return Object.assign(out || {}, {back});
    });
    check('v12.42: a Ready tick on a reference with two owners (WC09: Coates blocks and Event Portables units) turns none of its units Ready; on a one-owner reference it still does', RM.co.length === 2 && RM.co.every(s => s === 'not') && RM.epRef === 0 && RM.gn.length > 0 && RM.gn.every(x => x === 'ready:ref'), RM);
    check('v12.42: when the page leaves a reference\'s pick-ups out for review (quantities changed after one), its cards say so and point to Picked up, a card ticked Ready too', /departure record needs review/.test(RM.why) && /Picked up/.test(RM.why) && RM.gn.every(x => x === 'ready:ref') && RM.dom !== false && !/needs review/.test(RM.back), RM);
    /* the live sync: a store copy of WC09 without this phone's ticks and bookings (another phone wrote over it) */
    const KS = await p.evaluate(async () => {
      const docs = JSON.parse(JSON.stringify(toDocs('delivery'))), id = Object.keys(docs).find(k => docs[k]._k === 'WC09'), before = JSON.stringify(S.delivery.WC09.pickup1238_units), n0 = __captured1238.length;
      ['ready1238_units', 'pickup1238_units', 'ready1238_history', 'pickup1238_history'].forEach(f => delete docs[id][f]);
      syncFold('delivery', docs); await new Promise(r => setTimeout(r, 1800));
      const after = S.delivery.WC09 || {}, sent = __captured1238.slice(n0).filter(x => /delivery\/WC09$/.test(x.name)).pop();
      return {id: !!id, kept: JSON.stringify(after.pickup1238_units) === before, ready: !!(after.ready1238_units || {})['event-portables|0085'], hist: (after.pickup1238_history || []).length, sent: !!(sent && sent.value && sent.value.pickup1238_units && Object.keys(sent.value.pickup1238_units).length === 16), others: __captured1238.slice(n0).filter(x => !/delivery\/WC09$/.test(x.name)).length};
    });
    check('v12.42: on the live sync a store copy without this phone\'s unit ticks and bookings loses none of them: they are kept here and sent back up, and nothing else is written', KS.id && KS.kept && KS.ready && KS.hist > 0 && KS.sent && KS.others === 0, KS);
    const PK = await p.evaluate(() => { const c = Singles1238.cardOf('WC09', 'event-portables|0089'), t = {at: '2026-10-26T01:00:00.000Z', on: true};
      return {unknown: !!Singles1238.pickOf({'unknown|0089': t}, c, 'at'), star: !!Singles1238.pickOf({'*': t}, c, 'at'), doc: !c.u.docKey || !!Singles1238.pickOf({'event-portables|9999': Object.assign({doc: c.u.docKey}, t)}, c, 'at'),
        own: Singles1238.pickOf({'event-portables|0089': {at: '2026-10-25T00:00:00.000Z', on: false}, 'unknown|0089': t}, c, 'at').on === false, none: Singles1238.pickOf({'coates|1268858': t}, c, 'at') === null}; });
    check('v12.42: a tick or booking made before a unit\'s owner or number was filled in, or on its reference\'s one card before its units were recorded, still finds the unit; its own entry comes first', PK.unknown && PK.star && PK.doc && PK.own && PK.none, PK);
    /* the live sync with a send of this phone's own still waiting for WC09: a unit another phone ticked there (in the store's
       copy only) is kept, and this phone's waiting tick is kept too; both go up together (Codex's review, 26 Oct 19:05) */
    const KQ = await p.evaluate(async () => {
      const docs = JSON.parse(JSON.stringify(toDocs('delivery'))), id = Object.keys(docs).find(k => docs[k]._k === 'WC09'), t1 = new Date(Date.now() - 60000).toISOString(), t2 = new Date(Date.now() - 30000).toISOString();
      const mine = JSON.parse(JSON.stringify(docs[id])); mine.ready1238_units = Object.assign({}, mine.ready1238_units, {'test|LOCAL1': {on: true, at: t1, by: 'Phone A', why: ''}});
      docs[id].ready1238_units = Object.assign({}, docs[id].ready1238_units, {'test|REMOTE1': {on: true, at: t2, by: 'Phone B', why: ''}});
      const q0 = SYNC.queue.delivery; SYNC.queue.delivery = Object.assign({}, q0 || {}, {[id]: mine}); const n0 = __captured1238.length;
      syncFold('delivery', docs); await new Promise(r => setTimeout(r, 1800));
      const u = (S.delivery.WC09 || {}).ready1238_units || {}, sent = __captured1238.slice(n0).filter(x => /delivery\/WC09$/.test(x.name)).pop(), su = (sent && sent.value && sent.value.ready1238_units) || {};
      return {id: !!id, local: !!u['test|LOCAL1'], remote: !!u['test|REMOTE1'], sent: !!sent, sentBoth: !!(su['test|LOCAL1'] && su['test|REMOTE1']), others: __captured1238.slice(n0).filter(x => !/delivery\/WC09$/.test(x.name)).length};
    });
    check('v12.42: with a send of this phone\'s own still waiting for a reference, a unit another phone ticked there is not lost: both ticks are kept and go up together, and nothing else is written', KQ.id && KQ.local && KQ.remote && KQ.sent && KQ.sentBoth && KQ.others === 0, KQ);
    /* the merge, on copies */
    const MG = await p.evaluate(() => {
      const m = (a, b) => mergeRecords({delivery: {WC09: a}}, {delivery: {WC09: b}}).merged.delivery.WC09 || null;
      const A1 = {ready1238_units: {'event-portables|0085': {on: true, at: '2026-10-26T06:00:00.000Z', by: 'A', why: ''}, 'event-portables|0551': {on: false, at: '2026-10-26T06:05:00.000Z', by: 'A', why: 'x'}}, ready1238_history: [{unit: 'event-portables|0085', ready: true, at: '2026-10-26T06:00:00.000Z', by: 'A'}]};
      const B1 = {ready1238_units: {'event-portables|0085': {on: false, at: '2026-10-26T07:00:00.000Z', by: 'B', why: 'y'}, 'coates|1268858': {on: true, at: '2026-10-26T05:00:00.000Z', by: 'B', why: ''}}, ready1238_history: [{unit: 'event-portables|0085', ready: false, at: '2026-10-26T07:00:00.000Z', by: 'B'}],
        pickup1238_units: {'event-portables|0085': {at: '2026-10-27T07:00:00+10:00', note: '', by: 'B', set: '2026-10-26T07:00:00.000Z'}}};
      const ab = m(A1, B1), ba = m(B1, A1), onlyUnits = mergeRecords({delivery: {WC10: {pickup1238_units: {'x|1': {at: '', note: '', by: 'A', set: '2026-10-26T06:00:00.000Z'}}}}}, {delivery: {}}).merged.delivery.WC10;
      return {ab: ab.ready1238_units, same: JSON.stringify(Object.keys(ab.ready1238_units).sort().map(k => [k, ab.ready1238_units[k]])) === JSON.stringify(Object.keys(ba.ready1238_units).sort().map(k => [k, ba.ready1238_units[k]])), hist: (ab.ready1238_history || []).length, pk: ab.pickup1238_units, kept: !!onlyUnits}; });
    check('v12.42: on any copy the later tick wins unit by unit, other units are kept, the histories join, and a record holding only these is kept', MG.ab['event-portables|0085'].on === false && MG.ab['event-portables|0085'].by === 'B' && MG.ab['event-portables|0551'].why === 'x' && MG.ab['coates|1268858'].on === true && MG.same && MG.hist === 2 && MG.pk && MG.pk['event-portables|0085'].at === '2026-10-27T07:00:00+10:00' && MG.kept, MG);
    const sent = await p.evaluate(() => __captured1238.map(c => c.name));
    check('v12.42: only WC09\'s and GN18\'s delivery documents were written, all captured in the page; nothing reached the network', sent.length > 0 && sent.every(n => /delivery\/(WC09|GN18)$/.test(n)) && !h.counts.blocked, {sent: [...new Set(sent)], counts: h.counts});
    check('no page errors through the whole run', !h.errors.length, h.errors);
  } catch (e) { check('the test ran to the end', false, String(e && e.stack || e).slice(0, 1500)); await shot('error'); }
  finally {
    const passed = checks.filter(c => c.ok).length; console.log('\n' + passed + '/' + checks.length + ' passed');
    fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({passed, total: checks.length, mobile, counts: h.counts, errors: h.errors}, null, 1));
    await h.browser.close();
  }
})();
