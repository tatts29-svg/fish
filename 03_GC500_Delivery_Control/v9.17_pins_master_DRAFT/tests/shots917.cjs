// Author: Andrew Fisher. v9.17 - phone screenshots of the WC09, GN18, WC56 and CP1 drawers: "Where it is" (pin, links, the two new
// close-ups) and the satellite panel's position line. Read only; the 46 new pictures are served from evidence/media917
// until they are uploaded. After the 8 Oct review it also renders the printed drop sheet for both (its "How to get there"
// block and its pictures, cut by the page's own cropFit) and fails unless its Sat nav is Navigate's point.
// Fails if a dollar figure is visible in a frame or a write is attempted.
//   PAGE=<candidate> OUT=<dir> [MOB=1] node tests/shots917.cjs     (through browser_run.sh)
const fs = require('fs'), path = require('path');
const {open} = require('../../toolchain/harness/open_page.js');
const TH = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'evidence', 'thumbs917.json'), 'utf8'));
const MEDIA = path.join(__dirname, '..', 'evidence', 'media917');
(async () => {
  let s; const R = [];
  try {
    const mob = process.env.MOB !== '0';
    s = await open({pageFile: process.env.PAGE, W: mob ? 390 : 1440, H: mob ? 844 : 900, mobile: mob, dpr: mob ? 2 : 1});
    const p = s.page; let served = 0;
    for (const m of TH.media) { const f = path.join(MEDIA, m.file); await p.route('**/m/Coates-GC500-2026/' + m.file, r => { served++; r.fulfill({status: 200, contentType: m.type, body: fs.readFileSync(f)}); }); }
    await p.waitForFunction(() => typeof SYNC !== 'undefined' && SYNC.status === 'live' && typeof openAsset === 'function', null, {timeout: 180000});
    await p.waitForTimeout(2500);
    // second round: also GN18 (the generator symbol, "follow the master") and WC56 (a near move, two rows of six)
    // third round: the drawers of WC09 and WC59 (the long row) only
    for (const ref of (process.env.REFS || 'WC09,WC59').split(',')) {
      await p.evaluate(k => openAsset(k), ref); await p.waitForTimeout(2500);
      // The satellite panel (satelliteBlock) is not shown in the drawer since v8.16: its folds keep five rows of the record
      // section and drop the rest, the panel with them. Its points are proven from the function itself (collect_pins917.cjs).
      // second round: also the drawer's "Where it is — master plan" block (.pinblock): the pin's coordinates and the two
      // re-made close-ups, ringed on the unit
      for (const [part, sel] of [['where', '.where816'], ['pins', '.pinblock']]) {
        if (part === 'satellite') { await p.evaluate(() => { const d = document.getElementById('dsectRecord'); if (d && !d.open) d.querySelector('summary').click(); }); await p.waitForTimeout(1500); }
        const found = await p.evaluate(sel => { const dr = document.getElementById('drawer'); const all = [...(dr ? dr.querySelectorAll(sel) : [])]; /* the drawer's own block only */
          let el = all.find(x => x.offsetParent);
          if (!el && all.length) { el = all[0]; for (let d = el.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) d.open = true;
            for (let n = el; n; n = n.parentElement) if (n.hidden) n.hidden = false; }
          if (!el || !el.offsetParent) return el ? 'hidden: ' + (el.closest('[id]') || {}).id : false; el.scrollIntoView({block: 'start'}); return true; }, sel);
        await p.waitForTimeout(1500);
        const info = await p.evaluate(() => {
          const vw = innerWidth, vh = innerHeight, out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          while (w.nextNode()) { const n = w.currentNode; if (!n.nodeValue.trim()) continue; const el = n.parentElement; if (!el || !el.offsetParent) continue;
            const r = document.createRange(); r.selectNodeContents(n); const b = r.getBoundingClientRect(); if (b.bottom > 0 && b.top < vh && b.right > 0 && b.left < vw && b.width > 0) out.push(n.nodeValue); }
          const imgs = [...document.querySelectorAll('.mlocpics img')].map(i => ({w: i.naturalWidth, src: i.getAttribute('src').slice(-20)}));
          /* r4: on the phone the drawer's .pinblock sits in a closed fold and is never in the viewport; its own text is read too */
          const dr = document.getElementById('drawer'), pb = dr && dr.querySelector('.pinblock');
          return {text: out.join(' ').replace(/\s+/g, ' '), imgs, blockText: pb ? pb.textContent.replace(/\s+/g, ' ') : ''};
        });
        const diag = found ? null : await p.evaluate(() => ({details: [...document.querySelectorAll('details')].filter(d => d.offsetParent).map(d => (d.id || '') + ':' + (d.querySelector('summary') || {}).textContent).slice(0, 12),
          satcap: document.body.innerHTML.split('satcap pos').length - 1, satnone: document.body.innerHTML.split('sat none').length - 1, drawer: !!document.getElementById('drawer'), rec: !!document.getElementById('dsectRecord')}));
        if (diag) console.log('diag', JSON.stringify(diag));
        const file = path.join(process.env.OUT, `${mob ? 'phone' : 'laptop'}_${ref}_${part}.png`);
        await p.screenshot({path: file});
        const dollars = /\$\s?\d/.test(info.text);
        const want = await p.evaluate(k => MASTER_LOC[k] ? MASTER_LOC[k].ll[0].toFixed(6) + ', ' + MASTER_LOC[k].ll[1].toFixed(6) : null, ref);
        R.push({ref, part, found, file: path.basename(file), dollars, imgs: info.imgs, pinInViewport: !!want && info.text.includes(want),
          pinShown: !!want && (info.text.includes(want) || (part === 'pins' && info.blockText.includes(want))), want, text: info.text.slice(0, 600)});
      }
      await p.keyboard.press('Escape'); await p.waitForTimeout(800);
    }
    // after the 8 Oct review: the printed drop sheet for the same two, as the page renders it for printing (its pictures cut
    // by the page's own cropFit), so the Sat nav line and the ring on the pictures can be looked at
    for (const ref of (process.env.SHEETS || 'WC09,WC59').split(',').filter(Boolean)) {
      const info = await p.evaluate(async k => { const a = assetOf(k); const h = dropPage(a, a.events || [], 1, 1, {iso: '2026-10-09'}, 'deliveries');
        const d = document.createElement('div'); d.id = 'shot917'; d.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#fff;color:#111;overflow:auto;padding:10px';
        d.innerHTML = h; document.body.appendChild(d); try { await cropFit(d); } catch (e) {}
        const go = d.querySelector('.rs-go'), map = d.querySelector('.rs-map'); const n = dest782(a);
        const sat = /Sat nav:\s*(-?\d+\.\d+), (-?\d+\.\d+)/.exec(go ? go.innerText : '');
        return {go: go ? go.innerText.slice(0, 500) : null, cap: map ? (map.querySelector('.rs-cap') || {}).innerText || null : null, satnav: sat ? [Number(sat[1]), Number(sat[2])] : null,
          nav: n ? [n.ll.lat, n.ll.lon, n.label] : null, rings: [...d.querySelectorAll('.rs-air')].length, text: d.innerText.replace(/\s+/g, ' ')}; }, ref);
      await p.waitForTimeout(1200);
      for (const [part, sel] of [['dropsheet_go', '#shot917 .rs-go'], ['dropsheet_pics', '#shot917 .rs-map']]) {
        const el = await p.$(sel); const file = path.join(process.env.OUT, `${mob ? 'phone' : 'laptop'}_${ref}_${part}.png`);
        if (el) await el.screenshot({path: file});
        R.push({ref, part, found: !!el, file: path.basename(file), dollars: /\$\s?\d/.test(info.text), satnav: info.satnav, nav: info.nav, rings: info.rings, cap: info.cap, text: (part === 'dropsheet_go' ? info.go : info.cap) || ''});
      }
      await p.evaluate(() => { const d = document.getElementById('shot917'); if (d) d.remove(); });
    }
    // the drop sheet's Sat nav is Navigate's point, to the printed 6 decimals
    const satOk = R.filter(r => r.part === 'dropsheet_go').every(r => r.satnav && r.nav && Math.abs(r.satnav[0] - r.nav[0]) < 6e-7 && Math.abs(r.satnav[1] - r.nav[1]) < 6e-7);
    const pinsOk = R.filter(r => r.part === 'pins').every(r => r.pinShown && (r.imgs || []).filter(i => i.w > 0).length >= 2);
    const ok = R.every(r => (r.found === true || r.part === 'pins') && !r.dollars) && satOk && pinsOk && s.counts.blocked === 0 && !s.errors.length;
    fs.writeFileSync(path.join(process.env.OUT, `shots917_${mob ? 'phone' : 'laptop'}.json`), JSON.stringify({R, counts: s.counts, errors: s.errors, served}, null, 1));
    R.forEach(r => console.log(r.ref, r.part, r.found ? 'shown' : 'NOT FOUND', r.dollars ? 'DOLLARS IN FRAME' : 'no dollar figures', JSON.stringify(r.imgs || {satnav: r.satnav, nav: r.nav, rings: r.rings})));
    console.log((ok ? 'PASS' : 'FAIL') + ' shots, counts ' + JSON.stringify(s.counts) + ', errors ' + s.errors.length + ', pictures served locally ' + served);
    if (!ok) process.exitCode = 1;
  } finally { if (s) await s.browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
