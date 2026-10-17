/* flicker probe: layout shifts with rects, long tasks, late stylesheets, key container rebuilds and size changes */
(() => { if (window.__fl) return; const P = window.__fl = {ls: [], lt: [], ev: [], ro: [], css: [], rb: {}, paint: []};
 const now = () => Math.round(performance.now());
 const desc = n => { if (!n || !n.nodeName) return ''; if (n.nodeType === 3) n = n.parentElement || n; let s = n.nodeName.toLowerCase(); if (n.id) s += '#' + n.id; else if (n.className && typeof n.className === 'string') s += '.' + n.className.trim().split(/\s+/).slice(0, 2).join('.');
   let p = n.parentElement, d = 0; while (p && d < 8 && !p.id) { p = p.parentElement; d++; } if (p && p !== n && p.id) s = '#' + p.id + ' > ' + s; return s; };
 const R = r => r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null;
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.lt.push([Math.round(e.startTime), Math.round(e.duration)]))).observe({type: 'longtask', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.paint.push([e.name, Math.round(e.startTime)]))).observe({type: 'paint', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.paint.push(['lcp', Math.round(e.startTime), desc(e.element), e.size]))).observe({type: 'largest-contentful-paint', buffered: true}); } catch (e) {}
 try { new PerformanceObserver(l => l.getEntries().forEach(e => P.ls.push({t: Math.round(e.startTime), v: +e.value.toFixed(4), inp: e.hadRecentInput, src: (e.sources || []).map(s => ({n: desc(s.node), a: R(s.previousRect), b: R(s.currentRect)}))}))).observe({type: 'layout-shift', buffered: true}); } catch (e) {}
 const KEY = /^(pane-|tabs$|recstrip$|hzcluster|foot|refresh904$|printnote$|drawer$|scrim$|tpod|hzcd|wip|search|lockup)/;
 const mo = new MutationObserver(ms => { const t = now(); for (const m of ms) {
   if (m.type === 'attributes') { const tg = m.target; if (tg === document.documentElement || tg === document.body) P.ev.push([t, 'ATTR', tg.nodeName, m.attributeName, String(tg.getAttribute(m.attributeName)).slice(0, 60)]);
     else if (m.attributeName === 'hidden' && tg.id && /^pane-/.test(tg.id)) P.ev.push([t, 'HIDDEN', tg.id, tg.hidden]);
     else if ((m.attributeName === 'class' || m.attributeName === 'style') && tg.id && /^pane-|^tabs$|^recstrip$/.test(tg.id)) P.ev.push([t, m.attributeName.toUpperCase(), tg.id, String(tg.getAttribute(m.attributeName)).slice(0, 80)]);
     continue; }
   if (m.type !== 'childList') continue;
   for (const n of m.addedNodes) { if (n.nodeName === 'STYLE' || n.nodeName === 'LINK') P.css.push([t, n.nodeName, n.id || '', (n.textContent || n.href || '').length, document.readyState, desc(m.target)]);
     else if (n.nodeName === 'IMG' && n.closest && n.closest('header')) P.ev.push([t, 'IMG+', desc(n)]); }
   const tg = m.target; if (tg && tg.id && KEY.test(tg.id)) { const k = tg.id; const r = P.rb[k] || (P.rb[k] = []); if (r.length < 4000) r.push([t, m.addedNodes.length, m.removedNodes.length]); }
 } });
 mo.observe(document, {childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'style', 'data-refresh904', 'data-theme', 'data-mode']});
 P.mo = 1;
 const sa = Element.prototype.setAttribute; Element.prototype.setAttribute = function (n, v) { if (n === 'data-refresh904' && this === document.documentElement) P.ev.push([now(), 'REFRESH904', String(v)]); return sa.apply(this, arguments); };
 const sizes = new Map();
 const ro = new ResizeObserver(es => { const t = now(); for (const e of es) { const el = e.target, k = el.id || el.className || el.nodeName; const r = e.contentRect; const w = Math.round(r.width), h = Math.round(r.height); const prev = sizes.get(el);
   if (!prev || prev[0] !== w || prev[1] !== h) { sizes.set(el, [w, h]); if (P.ro.length < 20000) P.ro.push([t, String(k).slice(0, 40), w, h]); } } });
 const watch = () => { ['header.top', '#tabs', 'main', '#foot', '#refresh904', '#recstrip', '.hzcluster', '#hzcluster', '#printnote', '.lockup', '#search', '.hbar', 'body'].forEach(sel => document.querySelectorAll(sel).forEach(el => ro.observe(el)));
   document.querySelectorAll('main > .pane').forEach(el => ro.observe(el)); };
 document.addEventListener('DOMContentLoaded', () => { P.ev.push([now(), 'DCL']); watch(); });
 addEventListener('load', () => P.ev.push([now(), 'LOAD']));
 document.addEventListener('readystatechange', () => P.ev.push([now(), 'RS', document.readyState]));
 // which pane is visible, sampled every 250 ms (cheap)
 let lastPane = ''; setInterval(() => { const v = [...document.querySelectorAll('main > .pane')].filter(p => p.offsetHeight > 0).map(p => p.id + ':' + p.offsetHeight).join(','); const ref = document.documentElement.getAttribute('data-refresh904') || ''; const s = v + '|' + ref + '|y' + Math.round(scrollY); if (s !== lastPane) { lastPane = s; P.ev.push([now(), 'VIS', s]); } }, 250);
})();
