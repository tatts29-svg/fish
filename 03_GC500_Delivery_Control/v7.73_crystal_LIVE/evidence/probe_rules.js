// For the low-contrast text the audit found (opacity >= .85, no gradient behind), report each element's ancestor chain and
// the stylesheet rules that set its colour / background — so the fix is one rule per problem. GETs only.
//   OUT=<dir> PAGE=<build html> TABS=fencing,prestarts,docs,costs,today,timeline,progress,plant,change node probe_rules.js
const {open} = require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page');
const fs = require('fs');
(async () => {
  const OUT = process.env.OUT, TABS = (process.env.TABS || 'fencing,prestarts,docs,costs,today,timeline,progress,plant,change,about').split(',');
  const s = await open({pageFile: process.env.PAGE, W: 1440, H: 900, dpr: 2}); const p = s.page;
  await p.waitForFunction(() => typeof go === 'function', null, {timeout: 150000}); await p.waitForTimeout(2000);
  const out = {};
  for (const k of TABS) {
    await p.evaluate(k => { try { go(k); } catch (e) {} }, k); await p.waitForTimeout(1500);
    out[k] = await p.evaluate(k => {
      const pane = document.getElementById('pane-' + k); if (!pane) return null;
      pane.querySelectorAll('details').forEach(d => { d.open = true; });
      const parse = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return null; const a = m[1].split(',').map(Number); return {r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1}; };
      const lum = ({r, g, b}) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const blend = (fg, bg) => ({r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1});
      const bgOf = el => { let e = el; const layers = []; let img = false; while (e && e !== document.documentElement) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (c && c.a > 0) layers.push(c); if (cs.backgroundImage && cs.backgroundImage !== 'none') img = true; if (c && c.a >= 1) break; e = e.parentElement; } let bg = {r: 255, g: 255, b: 255, a: 1}; for (let i = layers.length - 1; i >= 0; i--) bg = blend(layers[i], bg); return {bg, img}; };
      const effOp = el => { let o = 1, e = el; while (e && e !== document.documentElement) { o *= Number(getComputedStyle(e).opacity); e = e.parentElement; } return o; };
      const vis = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const rulesFor = (el, prop) => { const hits = []; for (const sh of document.styleSheets) { let rules; try { rules = sh.cssRules; } catch (e) { continue; } const walk = (rs, media) => { for (const r of rs) { if (r.cssRules && r.media) { walk(r.cssRules, (media ? media + ' ' : '') + '@media ' + r.media.mediaText); continue; } if (r.cssRules && r.conditionText !== undefined && !r.media) { walk(r.cssRules, (media ? media + ' ' : '') + (r.conditionText || '')); continue; } if (!r.selectorText || !r.style) continue; const v = r.style.getPropertyValue(prop); if (!v) continue; let ok = false; try { ok = el.matches(r.selectorText); } catch (e) {} if (ok) hits.push({sel: r.selectorText.slice(0, 90), v: v.slice(0, 60), media: media || ''}); } }; walk(rules, ''); } return hits.slice(-4); };
      const chain = el => { const a = []; let e = el; while (e && e !== pane && a.length < 6) { a.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 3).join('.') : '')); e = e.parentElement; } return a.join(' < '); };
      const seen = new Map(); const walker = document.createTreeWalker(pane, NodeFilter.SHOW_TEXT); let node;
      while ((node = walker.nextNode())) { const txt = node.nodeValue.replace(/\s+/g, ' ').trim(); if (txt.length < 2) continue; const el = node.parentElement; if (!el || !vis(el)) continue;
        const cs = getComputedStyle(el); const fg0 = parse(cs.color); if (!fg0) continue; const op = effOp(el); if (op < 0.85) continue; const {bg, img} = bgOf(el); if (img) continue;
        const fg = blend({r: fg0.r, g: fg0.g, b: fg0.b, a: fg0.a * op}, bg); const l1 = lum(fg), l2 = lum(bg); const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight, 10) || 400; const large = size >= 24 || (size >= 18.66 && weight >= 700);
        if (ratio >= (large ? 3 : 4.5) && size >= 10) continue;
        const key = cs.color + '|' + `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` + '|' + chain(el).split(' < ')[0];
        if (seen.has(key)) { seen.get(key).n++; continue; }
        seen.set(key, {n: 1, color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`, ratio: Number(ratio.toFixed(2)), size, weight, text: txt.slice(0, 50), chain: chain(el), colorRules: rulesFor(el, 'color'), sizeRules: rulesFor(el, 'font-size'), opRules: rulesFor(el, 'opacity')}); }
      return [...seen.values()].sort((a, b) => a.ratio - b.ratio);
    }, k);
  }
  fs.writeFileSync(`${OUT}/rules.json`, JSON.stringify(out, null, 1));
  for (const [k, v] of Object.entries(out)) { console.log(`\n### ${k}: ${(v || []).length} groups`); (v || []).slice(0, 40).forEach(g => console.log(` ${g.ratio} ${g.size}px w${g.weight} n=${g.n} ${g.color} on ${g.bg} | ${g.text} | ${g.chain}\n     color: ${g.colorRules.map(r => (r.media ? '[' + r.media + '] ' : '') + r.sel + ' → ' + r.v).join(' ;; ')}\n     size: ${g.sizeRules.slice(-2).map(r => (r.media ? '[' + r.media + '] ' : '') + r.sel + ' → ' + r.v).join(' ;; ')}${g.opRules.length ? '\n     opacity: ' + g.opRules.slice(-2).map(r => r.sel + ' → ' + r.v).join(' ;; ') : ''}`)); }
  await s.browser.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
