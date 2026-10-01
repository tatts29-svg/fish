// Crystal audit: every tab, desktop (dpr 2) and phone (dpr 3) — text contrast, blur sources, soft images and canvases,
// tab-open time and long tasks. GETs only; every write the page tries is aborted (the harness).
//   OUT=<dir> PAGE=<build html> [MOB=1] node audit_crystal.js
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const OUT = process.env.OUT, MOB = !!process.env.MOB;
  const s = await open(MOB ? {pageFile: process.env.PAGE, W: 390, H: 844, dpr: 3, mobile: true} : {pageFile: process.env.PAGE, W: 1440, H: 900, dpr: 2});
  const p = s.page;
  const t0 = Date.now();
  await p.waitForFunction(() => typeof go === 'function' && typeof TABS !== 'undefined', null, {timeout: 150000});
  const tReady = Date.now() - t0;
  await p.waitForTimeout(2500);
  await p.evaluate(() => { window.__lt = []; try { new PerformanceObserver(l => l.getEntries().forEach(e => window.__lt.push({d: Math.round(e.duration), t: Math.round(e.startTime)}))).observe({entryTypes: ['longtask']}); } catch (e) {} });
  const tabs = await p.evaluate(() => TABS.map(t => [t[0], String(t[1] || '')]));
  const out = {mobile: MOB, readyMs: tReady, tabs: []};
  for (const [k, name] of tabs) {
    const before = await p.evaluate(() => window.__lt.length);
    const t1 = Date.now();
    await p.evaluate(k => { window.__goT0 = performance.now(); try { go(k); } catch (e) { window.__goerr = k + ': ' + e.message; } }, k);
    // painted: two frames after the pane is visible
    const paintMs = await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(performance.now() - window.__goT0)))));
    await p.waitForTimeout(k === 'map' ? 5000 : 1200);
    const wall = Date.now() - t1;
    const A = await p.evaluate(({k, MOB}) => {
      const pane = document.getElementById('pane-' + k); if (!pane) return null;
      pane.querySelectorAll('details').forEach(d => { d.open = true; });
      const vis = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(',').map(Number); return {r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1}; };
      const lum = ({r, g, b}) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const blend = (fg, bg) => ({r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1});
      const bgOf = el => { let e = el; const layers = []; while (e && e !== document.documentElement) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (c && c.a > 0) layers.push(c); if (c && c.a >= 1) break; if (cs.backgroundImage && cs.backgroundImage !== 'none') layers.push({img: true}); e = e.parentElement; }
        let bg = {r: 255, g: 255, b: 255, a: 1}; let hasImg = false; for (let i = layers.length - 1; i >= 0; i--) { const L = layers[i]; if (L.img) { hasImg = true; continue; } bg = blend(L, bg); } return {bg, hasImg}; };
      const effOpacity = el => { let o = 1, e = el; while (e && e !== document.documentElement) { o *= Number(getComputedStyle(e).opacity); e = e.parentElement; } return o; };
      const blurOf = el => { let e = el; const f = []; while (e && e !== document.documentElement) { const cs = getComputedStyle(e); if (/blur\(/.test(cs.filter) ) f.push('filter:' + cs.filter); if (cs.backdropFilter && cs.backdropFilter !== 'none') f.push('backdrop:' + cs.backdropFilter); const tr = cs.transform; if (tr && tr !== 'none') { const m = tr.match(/matrix\(([^)]+)\)/); if (m) { const a = m[1].split(',').map(Number); const sc = Math.hypot(a[0], a[1]); if (Math.abs(sc - 1) > 0.001) f.push('scale:' + sc.toFixed(3)); const tx = a[4], ty = a[5]; if (tx % 1 || ty % 1) f.push('subpx:' + tx.toFixed(2) + ',' + ty.toFixed(2)); } } e = e.parentElement; } return f; };
      const texts = []; const seen = new Map();
      const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT);
      let node; let count = 0;
      while ((node = walker.nextNode())) { const txt = node.nodeValue.replace(/\s+/g, ' ').trim(); if (txt.length < 2) continue; const el = node.parentElement; if (!el || !vis(el)) continue; count++;
        const cs = getComputedStyle(el); const fg0 = parse(cs.color); if (!fg0) continue; const {bg, hasImg} = bgOf(el); const op = effOpacity(el); const fg = blend({r: fg0.r, g: fg0.g, b: fg0.b, a: fg0.a * op}, bg);
        const l1 = lum(fg), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400; const large = size >= 24 || (size >= 18.66 && weight >= 700);
        const key = [cs.color, `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, Math.round(size), weight, op.toFixed(2)].join('|');
        const sel = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '') + (el.id ? '#' + el.id : '');
        const blur = blurOf(el); const sh = cs.textShadow && cs.textShadow !== 'none' ? cs.textShadow : '';
        if (!seen.has(key)) seen.set(key, {key, color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, bgImg: hasImg, size, weight, opacity: Number(op.toFixed(2)), ratio: Number(ratio.toFixed(2)), large, n: 0, samples: [], sels: new Set(), blur: new Set(), shadow: new Set()});
        const g = seen.get(key); g.n++; if (g.samples.length < 3) g.samples.push(txt.slice(0, 60)); g.sels.add(sel); blur.forEach(b => g.blur.add(b)); if (sh) g.shadow.add(sh); }
      const groups = [...seen.values()].map(g => Object.assign(g, {sels: [...g.sels].slice(0, 6), blur: [...g.blur], shadow: [...g.shadow]}));
      const low = groups.filter(g => g.ratio < (g.large ? 3 : 4.5)).sort((a, b) => a.ratio - b.ratio);
      const small = groups.filter(g => g.size < (MOB ? 12 : 11)).sort((a, b) => a.size - b.size);
      const blurred = groups.filter(g => g.blur.length);
      const imgs = [...pane.querySelectorAll('img')].filter(vis).map(i => { const r = i.getBoundingClientRect(); return {src: (i.currentSrc || i.src || '').slice(-60), nat: [i.naturalWidth, i.naturalHeight], css: [Math.round(r.width), Math.round(r.height)], up: i.naturalWidth ? Number((r.width * devicePixelRatio / i.naturalWidth).toFixed(2)) : null, rendering: getComputedStyle(i).imageRendering}; }).filter(x => x.up != null && x.up > 1.2);
      const canv = [...pane.querySelectorAll('canvas')].filter(vis).map(c => { const r = c.getBoundingClientRect(); return {id: c.id || c.className, back: [c.width, c.height], css: [Math.round(r.width), Math.round(r.height)], ratio: c.width ? Number((c.width / (r.width * devicePixelRatio)).toFixed(2)) : null}; }).filter(x => x.ratio != null && x.ratio < 0.95);
      const scrollW = document.documentElement.scrollWidth, vw = document.documentElement.clientWidth;
      return {textNodes: count, groups: groups.length, low, small, blurred, imgs, canv, nodes: pane.querySelectorAll('*').length, wide: scrollW > vw + 1 ? scrollW : 0, goerr: window.__goerr || null};
    }, {k, MOB});
    const lt = await p.evaluate(b => window.__lt.slice(b), before);
    out.tabs.push(Object.assign({k, name, paintMs: Math.round(paintMs), wallMs: wall, longTasks: lt.length, longTaskMs: lt.reduce((a, x) => a + x.d, 0), longest: lt.reduce((a, x) => Math.max(a, x.d), 0)}, A || {missing: true}));
    try { await p.screenshot({path: `${OUT}/shot_${k}${MOB ? '_phone' : ''}.png`, fullPage: false}); } catch (e) {}
  }
  out.errors = s.errors; fs.writeFileSync(`${OUT}/audit${MOB ? '_phone' : ''}.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out.tabs.map(t => ({k: t.k, paint: t.paintMs, wall: t.wallMs, lt: t.longTasks, ltMs: t.longTaskMs, longest: t.longest, low: t.low ? t.low.length : null, small: t.small ? t.small.length : null, blur: t.blurred ? t.blurred.length : null, imgs: t.imgs ? t.imgs.length : null, canv: t.canv ? t.canv.length : null, nodes: t.nodes, wide: t.wide}))));
  await s.browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
