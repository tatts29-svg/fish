// read-only: v12.61 candidate checks - water barrier positions, the last build day card, the departed marks, the three-map strip
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
const PAGE = process.env.PAGE || '/home/user/fish/03_GC500_Delivery_Control/build/GC500_v12.61/GC500_Delivery_Control_hosted.html';
const OUTDIR = process.env.OUTDIR || '/tmp/gc500-scratch/shots1261';
const MOB = process.env.MOB === '1';
fs.mkdirSync(OUTDIR, {recursive: true});
(async () => {
  const tag = MOB ? 'phone' : 'desktop';
  const h = await open({pageFile: PAGE, hash: '#timeline', W: MOB ? 390 : 1440, H: MOB ? 1700 : 1400, ...(MOB ? {dpr: 2, mobile: true} : {})});
  const p = h.page; const r = {};
  const hide = () => p.evaluate(() => { [...document.querySelectorAll('body *')].forEach(el => { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height < 200) el.style.visibility = 'hidden'; }); });
  const shot = async (key, finder, arg) => { try { const handle = await p.evaluateHandle(finder, arg); const el = handle.asElement(); if (!el) { r[key] = 'not found'; return; } await el.scrollIntoViewIfNeeded({timeout: 15000}); await p.waitForTimeout(1200); await el.screenshot({path: OUTDIR + '/' + tag + '-' + key + '.png', timeout: 60000, animations: 'disabled'}); r[key] = 'ok'; } catch (e) { r[key] = 'fail ' + String(e.message || e).slice(0, 100); } };
  try {
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live', null, {timeout: 180000});
    await p.waitForTimeout(8000);
    r.footer = await p.evaluate(() => (document.body.innerText.match(/v12\.\d+(?:\.\d+)?/g) || []).slice(-1)[0]);
    r.charge = await p.evaluate(() => moneySummary().charge.total);
    // 1. water barriers: the one destination and the finder for every WB key
    r.wb = await p.evaluate(() => {
      const out = {}; const keys = Object.keys(WFB1261 || {});
      for (const k of keys) {
        const a = (DATA.assets || []).find(x => x.key === k);
        const o = {name: a ? a.name : null};
        try { const D = a ? dest782(a) : null; o.dest = D ? {kind: D.kind, lat: D.ll.lat, lon: D.ll.lon, sms: D.sms} : null; } catch (e) { o.dest = 'err ' + e.message; }
        try { const L = Find1176.locate({kind: 'asset', key: k}); o.locate = L && Number.isFinite(L.lat) ? {lat: L.lat, lon: L.lon, how: L.how} : (L ? L.none : null); } catch (e) { o.locate = 'err ' + e.message; }
        try { const m = MASTER_LOC[k]; o.master = m ? {prec: m.prec, pt: m.pt, how: m.how} : null; } catch (e) { o.master = 'err ' + e.message; }
        try { const s = MASTER_SHAPES926_DATA.shapes[k]; o.shape = s ? {comps: s.c.length, pieces: s.c.reduce((n, c) => n + (c.m || []).length, 0), k: s.k} : null; } catch (e) { o.shape = 'err'; }
        out[k] = o;
      }
      out._placed = WaterBarriers1261.placed; out._same = window.dest782 === dest782;
      return out;
    });
    r.programme = await p.evaluate(() => { try { const rows = DATA.wfb_programme1030.rows; const r19 = rows.find(x => x.ref === 'WB19'), r01 = rows.find(x => x.ref === 'WB01'); return {wb19: [r19.install.date, r19.days_hire, r19.fms_quantity, r19.grid], wb01: r01.removal.comment.slice(0, 60), updates: DATA.wfb_programme1030.updates}; } catch (e) { return 'err ' + e.message; } });
    // 2. the last build day card
    await p.evaluate(() => { const b = document.querySelector('#pane-timeline [data-view="day"]'); if (b) b.click(); });
    await p.waitForTimeout(2500);
    await p.evaluate(() => { const d = document.querySelector('.daystrip .day[data-day="2026-10-22"]'); if (d) d.click(); });
    await p.waitForTimeout(3000);
    r.cards = await p.evaluate(() => [...document.querySelectorAll('.daystrip .day')].filter(d => ['2026-10-21', '2026-10-22'].includes(d.getAttribute('data-day'))).map(d => ({iso: d.getAttribute('data-day'), pct: (d.querySelector('.bc984-progress') || {}).textContent, stamp: !!d.querySelector('.bc984-stamp'), aria: (d.getAttribute('aria-label') || '').slice(0, 160)})));
    r.moreInfo = await p.evaluate(() => { const m = document.querySelector('#pane-timeline .bc984-more'); if (m) m.open = true; return m ? (m.innerText || '').replace(/\s+/g, ' ').slice(0, 520) : null; });
    await hide();
    await shot('lastday', () => document.querySelector('.daystrip .day[data-day="2026-10-22"]'));
    // 4. the three-map strip on the WB load cards
    await p.evaluate(() => { window.scrollTo(0, 0); });
    const strips = await p.evaluate(async () => {
      const out = [];
      const buttons = [...document.querySelectorAll('#pane-timeline .b1247-location')];
      for (const b of buttons) b.scrollIntoView({block: 'center'});
      await new Promise(r => setTimeout(r, 9000));
      for (const b of buttons.slice(0, 8)) out.push({key: b.dataset.build1247Key, state: b.dataset.picture1247, how: (b.querySelector('.b1247-map-copy>small') || {}).textContent, img: !!b.querySelector('img'), w: Math.round(b.getBoundingClientRect().width)});
      return out;
    });
    r.strips = strips;
    await hide();
    await shot('strip_wb17', () => document.querySelector('#pane-timeline .b1247-location[data-build1247-key="WB17"]')?.closest('.ld') || document.querySelector('#pane-timeline .b1247-location')?.closest('.ld'));
    // 3. the map explorer: departed marks
    await p.evaluate(() => go('map')); await p.waitForTimeout(10000);
    const fr = await p.$('#expwrap iframe'); const frame = fr ? await fr.contentFrame() : null;
    r.explorer = frame ? await frame.evaluate(() => ({ key: (document.getElementById('map1256-key') || {}).textContent, keyHidden: (document.getElementById('map1256-key') || {}).hidden, showLeft: window.GC500MapLeft1256 ? GC500MapLeft1256.state.showLeft : null, rings: (() => { try { return Offsite1225.points.length; } catch (e) { return 'n/a'; } })(), sample: (() => { try { return Offsite1225.points.slice(0, 4).map(q => ({kind: q.kind, n: q.n, total: q.total})); } catch (e) { return 'n/a'; } })() })).catch(e => 'err ' + e.message) : 'no frame';
    r.barSwitch = await p.evaluate(() => { const l = document.querySelector('#map1147-controls .map1256-left'); return l ? {hidden: l.hidden} : null; });
    await p.evaluate(() => { const b = [...document.querySelectorAll('#expcard button')].find(x => /^sat \+ plan$|^satellite only$/i.test((x.textContent || '').trim())); if (b) b.click(); });
    await p.waitForTimeout(4000);
    // zoom to the pit lane departed group (BJR01)
    try { await p.evaluate(() => { const L = Find1176.locate({kind: 'asset', key: 'BJR01'}); if (L && typeof gate1156Zoom === 'function') gate1156Zoom(L.lat, L.lon, 'BJR01'); }); await p.waitForTimeout(6000); } catch (e) {}
    await hide();
    try { await p.evaluate(() => { const c = document.getElementById('expcard'); if (c) c.scrollIntoView({block: 'start'}); }); await p.waitForTimeout(2500); await p.screenshot({path: OUTDIR + '/' + tag + '-explorer_departed.png', timeout: 60000, animations: 'disabled'}); r.explorer_departed = 'viewport ok'; } catch (e) { r.explorer_departed = 'fail ' + String(e.message || e).slice(0, 100); }
    // the departed status object for a known departed reference
    r.departedStatus = frame ? await frame.evaluate(() => { try { const it = ITEMS.find(i => i.code === 'BJR01' || i.code === 'T0162'); const s = it && mapStatus1009(it); return s ? {code: it.code, state: s.state, shape: s.shape, glyph: s.glyph, glyphCode: s.glyph ? s.glyph.charCodeAt(0).toString(16) : null, colour: s.colour, fill: s.fill} : 'no item'; } catch (e) { return 'err ' + e.message; } }).catch(e => 'err ' + e.message) : null;
    // the Demob WB cards' pictures (desktop only)
    if (!MOB) {
      await p.evaluate(() => go('demob')); await p.waitForTimeout(9000);
      r.demobSpot = await p.evaluate(() => { const out = {}; for (const k of ['WB16', 'WB06', 'WB03', 'WB13', 'WB17']) { try { const s = DemobMap1236.spot(k); out[k] = s ? {fx: +s.fx.toFixed(4), fy: +s.fy.toFixed(4), exact: s.exact, kind: s.kind} : null; } catch (e) { out[k] = 'err ' + e.message; } } return out; });
      r.demobWb = await p.evaluate(async () => { const el = [...document.querySelectorAll('#pane-demob [data-key^="WB"], #pane-demob [data-k^="WB"], #pane-demob [data-ref^="WB"]')].slice(0, 6); for (const e of el) e.scrollIntoView({block: 'center'}); await new Promise(r => setTimeout(r, 6000)); return el.map(e => ({k: e.getAttribute('data-key') || e.getAttribute('data-k') || e.getAttribute('data-ref'), text: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 200), imgs: e.querySelectorAll('img[src]').length})); });
    }
    r.pageErrors = h.errors.length; r.errorsSample = h.errors.slice(0, 4).map(e => String(e).slice(0, 160));
  } catch (e) { r.err = String(e).slice(0, 400); } finally { await h.browser.close(); }
  fs.writeFileSync(OUTDIR + '/probe1261_' + tag + '.json', JSON.stringify(r, null, 1));
  console.log(JSON.stringify(r, null, 1).slice(0, 16000));
})().catch(e => { console.error('FATAL', e && e.stack || e); process.exit(1); });
