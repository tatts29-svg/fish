// v7.82 - one destination, read the same everywhere (Codex recheck, 2 Oct 2026). Author: Andrew Fisher.
// Read-only: GETs only, writes aborted by the harness. Synthetic changes are made in this browser only and put back.
//   PAGE=<built page> [MOB=1] [OUT=<json>] node one_destination_tests.js
const {open} = require('../../toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const MOB = !!process.env.MOB, s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 2, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 1000}), p = s.page;
  const T = [], ok = (name, pass, detail) => T.push({name, pass: !!pass, detail: String(detail)});
  await p.waitForFunction(() => typeof dest782 === 'function' && typeof SYNC !== 'undefined' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length, null, {timeout: 240000});
  const R = await p.evaluate(() => {
    const mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} };
    const llOfUrl = u => { const m = /destination=(-?[\d.]+)(?:%2C|,)(-?[\d.]+)/.exec(u || ''); return m ? [+m[1], +m[2]] : null; };
    const same = (x, y) => !!x && !!y && Math.abs(x[0] - y[0]) < 2e-6 && Math.abs(x[1] - y[1]) < 2e-6;
    const box = document.createElement('div'); document.body.appendChild(box);
    /* every surface's point for one item */
    const surfaces = a => { const D = dest782(a); if (!D) return null; const want = [D.ll.lat, D.ll.lon], out = {kind: D.kind};
      box.innerHTML = navBtn(a, {}); const b = box.querySelector('a.navbtn'); out.button = b ? llOfUrl(b.getAttribute('href')) : null;
      out.label = b ? ((b.querySelector('.navpinned') || {}).textContent || '') : ''; out.spoken = b ? ((b.querySelector('.vh') || {}).textContent || '') : ''; out.title = b ? b.getAttribute('title') || '' : '';
      const sms = dropSmsText(a), nav = /Navigate: (\S+)/.exec(sms); out.text = nav ? llOfUrl(nav[1]) : null; out.gps = (/GPS: [^\n]*/.exec(sms) || [''])[0]; out.sms = sms;
      const full = dropSmsLong(a), dir = /Directions: (\S+)/.exec(full); out.full = dir ? llOfUrl(dir[1]) : null;
      const P = dpPos(a); out.sheet = P && P.lat != null ? [P.lat, P.lon] : null; out.sheetKind = P && P.kind;
      out.navPoint = (q => q ? [q.lat, q.lon] : null)(navPointFor(a));
      out.agree = ['button', 'text', 'full', 'sheet', 'navPoint'].filter(k => out[k] && !same(out[k], want));
      out.missing = ['button', 'text', 'sheet', 'navPoint'].filter(k => !out[k]);
      return out; };
    const all = allAssets().filter(a => !a._cancelled), res = {n: 0, kinds: {}, disagree: [], missing: [], provenance: [], approx: [], approxN: 0};
    const WORDS = {report: /pit lane/i, desc: /description/i, confirmed: /confirmed/i, unverified: /not verified/i, master: /master plan/i, pinned: /pinned/i, placed: /placed/i, area: /area/i};
    all.forEach(a => { const S7 = surfaces(a); if (!S7) return; res.n++; res.kinds[S7.kind] = (res.kinds[S7.kind] || 0) + 1;
      if (S7.agree.length) res.disagree.push(a.key + ':' + S7.agree.join('/'));
      if (S7.missing.length) res.missing.push(a.key + ':' + S7.missing.join('/'));
      const w = WORDS[S7.kind]; const seen = [S7.kind === 'area' ? 'area' : S7.label, S7.spoken, S7.title].map(x => w.test(x));
      if (!seen.every(Boolean)) res.provenance.push(a.key + ' ' + S7.kind + ' [label:' + S7.label + '|spoken:' + S7.spoken.trim().slice(0, 60) + '|title:' + S7.title.slice(0, 60) + ']');
      const D = dest782(a); if (D.approx) { res.approxN++; if (!/approximate|not the exact spot|not yet checked|not verified/i.test(S7.gps)) res.approx.push(a.key + ' ' + S7.gps); } });
    /* A: a synthetic fallback - an item on the seaside of Main Beach, marked unverified so it has no drop-off: every surface
       must send the driver to the pit lane, and the way in must be the pit lane's, not the seaside one from its own spot */
    let fb = {skip: 'no seaside master item'};
    const sea = all.find(a => { const m = MASTER_LOC[a.key]; if (!m || m.unverified || m.confirmed || !masterUnit(a.key) || inPlace782(a.key)) return false; const e = entry782(a); return e && e.side === 'seaside'; });
    if (sea) { const m = MASTER_LOC[sea.key], before = entry782(sea);
      m.unverified = true; mc();
      try { const S7 = surfaces(sea), pit = reportTo782(), pitA = [pit.ll.lat, pit.ll.lon], ent = (/ENTRY: [^\n]*/.exec(S7.sms) || [''])[0], way = (/Site access: [^\n]*/.exec(S7.sms) || [''])[0];
        const pe = entry782(pit.a), pw = text747WayIn(pit.a);
        fb = {ref: sea.key, kind: S7.kind, own: before.sms, entry: ent, pitEntry: pe ? pe.sms : '', way, pitWay: pw, onPit: ['button', 'text', 'full', 'sheet', 'navPoint'].filter(k => !(S7[k] && same(S7[k], pitA))), label: S7.label, spoken: S7.spoken.trim(), title: S7.title,
          says: /report to the pit lane/i.test(S7.sms) }; }
      finally { delete m.unverified; mc(); } }
    /* B1: the time asked for stays in a text padded to the limit */
    let tight = {skip: 'nothing due'};
    const due = all.find(a => !inPlace782(a.key) && text747When(a) && dest782(a));
    if (due) { const keepD = S.delivery, keepW = window.text747What, keepL = window.text747Link;
      try { S.delivery = Object.assign({}, keepD || {}, {[due.key]: Object.assign({}, (keepD || {})[due.key] || {}, {eta: '10:00'})}); mc();
        const base = smsShape(text747Plain(['Welcome to Coates GC500', keepW(due)].concat(text747Where(due), [text747WayIn(due)].filter(Boolean), rules782Sms(due)).join('\n'))).units;
        const pad = Math.max(0, TEXT747_MAX - base - 8); window.text747What = x => keepW(x) + ' ' + 'x'.repeat(pad); window.text747Link = () => 'https://example.invalid/' + 'l'.repeat(300);
        const txt = dropSmsText(due), w = text747When(due); tight = {ref: due.key, when: w, kept: txt.includes(w), hasDue: /Due /.test(txt), hasTime: /unloaded by 10:00/.test(txt), units: smsShape(txt).units, linkDropped: !/example\.invalid/.test(txt)}; }
      finally { window.text747What = keepW; window.text747Link = keepL; S.delivery = keepD; mc(); } }
    /* B3: WB06 - the description spot is approximate; the short text keeps that */
    const wb6 = all.find(a => a.key === 'WB06'), wb6s = wb6 ? surfaces(wb6) : null;
    box.remove();
    return {res, fb, tight, wb6: wb6s ? {kind: wb6s.kind, gps: wb6s.gps, label: wb6s.label, spoken: wb6s.spoken.trim()} : null};
  });
  const r = R.res;
  ok('D1 every item: the Navigate button, the text, Full details, the sheet and its QR all go to the same point (' + r.n + ' items)', r.n > 100 && !r.disagree.length && !r.missing.length, JSON.stringify({kinds: r.kinds, disagree: r.disagree.slice(0, 12), missing: r.missing.slice(0, 12)}));
  const f = R.fb;
  ok('D2 synthetic fallback: an item with no drop-off goes to the pit lane on every surface', !f.skip && f.kind === 'report' && !f.onPit.length && f.says, JSON.stringify(f));
  ok('D3 synthetic fallback: the way in is the pit lane\'s own - never the one worked out from the item\'s own spot', !f.skip && f.entry === (f.pitEntry ? 'ENTRY: ' + f.pitEntry.replace(/^ENTRY: /, '') : '') && f.way === f.pitWay && !!f.pitWay && f.entry !== f.own && !/seaside/i.test(f.entry + f.way), JSON.stringify({own: f.own, entry: f.entry, pitEntry: f.pitEntry, way: f.way, pitWay: f.pitWay}));
  ok('D4 synthetic fallback: the button\'s label, spoken words and tooltip all say pit lane', !f.skip && /pit lane/i.test(f.label) && /pit lane/i.test(f.spoken) && /pit lane/i.test(f.title), JSON.stringify({label: f.label, spoken: f.spoken, title: f.title}));
  const b = R.tight;
  ok('D5 a time asked for keeps the due date and the time, even when the text is full - the link and generated wording give way, and it stays sendable', !b.skip && b.hasDue && b.hasTime && b.linkDropped && b.units <= 459, JSON.stringify(b));
  ok('D6 every Navigate button: visible label, spoken words and tooltip name the same source', !r.provenance.length, JSON.stringify(r.provenance.slice(0, 10)));
  ok('D7 every approximate destination keeps its qualification in the short text (' + r.approxN + ' approximate)', !r.approx.length, JSON.stringify(r.approx.slice(0, 10)));
  ok('D8 WB06 (description spot, approximate) says so in the text and on the button', R.wb6 && /approximate/i.test(R.wb6.gps) && /approximate/i.test(R.wb6.spoken), JSON.stringify(R.wb6));
  /* Codex recheck 4: the picture goes where the text goes; and a requested time never makes the text unsendable */
  const P = await p.evaluate(async () => { const mc = () => { try { RENDER_MEMO.clear(); } catch (e) {} };
    const same = (x, y) => !!x && !!y && Math.abs(x.lat - y.lat) < 2e-6 && Math.abs(x.lon - y.lon) < 2e-6, out = {};
    const all = allAssets().filter(a => !a._cancelled);
    /* the fallback: a seaside master item marked unverified (in this browser only) - the picture frames the pit lane */
    const sea = all.find(a => { const m = MASTER_LOC[a.key]; if (!m || m.unverified || m.confirmed || !masterUnit(a.key) || inPlace782(a.key)) return false; const e = entry782(a); return e && e.side === 'seaside'; });
    if (sea) { const m = MASTER_LOC[sea.key]; m.unverified = true; mc();
      try { const D = dest782(sea), can = typeof pic782Can === 'function' ? pic782Can(sea) : 'none on this page'; let pic = null, err = null; try { pic = await mms757Picture(sea); } catch (e) { err = String(e.message || e); }
        out.fallback = {ref: sea.key, kind: D.kind, can, err, centred: !!pic && same(pic.ll, D.ll), notOwn: !!pic && !same(pic.ll, {lat: m.ll[0], lon: m.ll[1]}), word: pic && pic.word, tag: pic && pic.tag}; }
      finally { delete m.unverified; mc(); } }
    /* a destination placed only by its description (no position of its own on the record) */
    const dsc = all.find(a => { const D = dest782(a); return D && D.kind === 'desc' && !navTargetFor(a) && !inPlace782(a.key); }) || all.find(a => { const D = dest782(a); return D && D.kind === 'desc' && !inPlace782(a.key); });
    if (dsc) { const D = dest782(dsc), can = typeof pic782Can === 'function' ? pic782Can(dsc) : 'none on this page'; let pic = null, err = null; try { pic = await mms757Picture(dsc); } catch (e) { err = String(e.message || e); }
      out.desc = {ref: dsc.key, ownPosition: !!navTargetFor(dsc), can, err, centred: !!pic && same(pic.ll, D.ll), word: pic && pic.word}; }
    /* every item still to come, with a time asked for: within three texts, and nothing the driver needs is lost */
    const keep = S.delivery, bad = [], over = []; let n = 0, max = 0;
    all.filter(a => !inPlace782(a.key)).forEach(a => { S.delivery = Object.assign({}, keep || {}, {[a.key]: Object.assign({}, (keep || {})[a.key] || {}, {eta: '10:00'})}); mc();
      const t = dropSmsText(a), u = smsShape(t).units, D = dest782(a), miss = []; n++; max = Math.max(max, u); if (u > TEXT747_MAX) over.push(a.key + ':' + u);
      const eff = effectiveDates(a), day = (eff && eff.in) || a.first_date;
      if (day && !t.includes('Due ' + fmtDate(day))) miss.push('due date'); if (day && !/unloaded by 10:00/.test(t)) miss.push('time asked for');
      if (D && !t.includes(D.ll.lat.toFixed(6) + ',' + D.ll.lon.toFixed(6))) miss.push('destination');
      if (D && D.approx && !/approximate|not the exact spot|not yet checked|not verified/i.test(t)) miss.push('qualification');
      const w = text747WayIn(a); if (w && !t.includes(w)) miss.push('site access');
      rules782Sms(a).forEach(x => { if (!t.includes(x)) miss.push(x.slice(0, 12)); });
      if (miss.length) bad.push(a.key + ': ' + miss.join(', ')); });
    S.delivery = keep; mc(); out.text = {n, max, limit: TEXT747_MAX, service: TEXT747_SERVICE_MAX, over, bad: bad.slice(0, 12)};
    return out; });
  ok('D9 synthetic fallback: the picture frames, pins and labels the pit lane - not the item\'s own spot', P.fallback && P.fallback.can === true && !P.fallback.err && P.fallback.centred && P.fallback.notOwn && /pit lane/.test(P.fallback.word) && /pit lane/.test(P.fallback.tag), JSON.stringify(P.fallback));
  ok('D10 a destination placed by its description has a picture, centred on that spot', P.desc && P.desc.can === true && !P.desc.err && P.desc.centred && /description/.test(P.desc.word), JSON.stringify(P.desc));
  ok('D11 with a time asked for, every text stays within three texts (sendable) and keeps the due date, the time, the destination, its qualification, the way in, the order and any hold (' + P.text.n + ' items, longest ' + P.text.max + ')', !P.text.over.length && !P.text.bad.length && P.text.max <= P.text.limit, JSON.stringify(P.text));
  ok('E1 no page errors', !s.errors.length, JSON.stringify(s.errors).slice(0, 200));
  const passed = T.filter(t => t.pass).length;
  T.forEach(t => console.log((t.pass ? 'PASS ' : 'FAIL ') + t.name + ' — ' + t.detail.slice(0, 600)));
  console.log(passed + '/' + T.length + ' ' + (MOB ? 'phone' : 'desktop'));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify({page: process.env.PAGE, passed, of: T.length, tests: T}, null, 1));
  await s.browser.close(); process.exit(passed === T.length ? 0 : 1);
})();
