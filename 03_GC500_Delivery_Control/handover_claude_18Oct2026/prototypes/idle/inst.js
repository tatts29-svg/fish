(() => {
 /* Idle inventory: wraps timers, rAF, observers and fetch; keys every callback by where it was registered. */
 const I = window.__idle = {on: false, t: {}, i: {}, r: {}, ric: {}, mo: {}, ro: {}, io: {}, fetch: {}, fn: {}, lt: [], t0: 0};
 const now = () => performance.now();
 const site = () => { const lim = Error.stackTraceLimit; Error.stackTraceLimit = 7; const st = (new Error().stack || '').split('\n'); Error.stackTraceLimit = lim;
  for (let i = 1; i < st.length; i++) { const l = st[i]; if (l.includes('__idleinst') || !/at /.test(l)) continue; return l.trim().replace(/https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?/, 'P').replace(/^at /, ''); } return '?'; };
 const rec = (bucket, key, dt, extra) => { if (!I.on) return; const b = I[bucket][key] || (I[bucket][key] = {n: 0, ms: 0, max: 0}); b.n++; b.ms += dt; if (dt > b.max) b.max = dt; if (extra) b.recs = (b.recs || 0) + extra; };
 const oST = window.setTimeout, oSI = window.setInterval, oRAF = window.requestAnimationFrame, oRIC = window.requestIdleCallback;
 window.setTimeout = function (fn, ms, ...a) { if (typeof fn !== 'function') return oST.apply(this, arguments); const k = (ms | 0) + 'ms ' + site();
  return oST.call(this, function () { const t0 = now(); try { return fn.apply(this, arguments); } finally { rec('t', k, now() - t0); } }, ms, ...a); };
 window.setInterval = function (fn, ms, ...a) { if (typeof fn !== 'function') return oSI.apply(this, arguments); const k = (ms | 0) + 'ms ' + site();
  return oSI.call(this, function () { const t0 = now(); try { return fn.apply(this, arguments); } finally { rec('i', k, now() - t0); } }, ms, ...a); };
 window.requestAnimationFrame = function (fn) { const k = site(); return oRAF.call(this, function (ts) { const t0 = now(); try { return fn.call(this, ts); } finally { rec('r', k, now() - t0); } }); };
 if (oRIC) window.requestIdleCallback = function (fn, o) { const k = site(); return oRIC.call(this, function (d) { const t0 = now(); try { return fn.call(this, d); } finally { rec('ric', k, now() - t0); } }, o); };
 const wrapObs = (name, bucket) => { const O = window[name]; if (!O) return; window[name] = class extends O { constructor(cb, opt) { const k = site(); super(function (recs, obs) { const t0 = now(); try { return cb.call(this, recs, obs); } finally { rec(bucket, k, now() - t0, recs.length); } }, opt); } }; };
 wrapObs('MutationObserver', 'mo'); wrapObs('ResizeObserver', 'ro'); wrapObs('IntersectionObserver', 'io');
 const oF = window.fetch; window.fetch = function (u, o) { const k = (typeof u === 'string' ? u : (u && u.url) || '?').replace(/\?.*$/, '').replace(/^https?:\/\/[^/]+/, '').slice(0, 60); if (I.on) { const b = I.fetch[k] || (I.fetch[k] = {n: 0}); b.n++; } return oF.apply(this, arguments); };
 /* wrap named globals once the page has defined them: cost per call, including the patch chain under them */
 I.wrapFns = names => names.forEach(n => { const f = window[n]; if (typeof f !== 'function' || f.__idw) return; const w = function () { const t0 = now(); try { return f.apply(this, arguments); } finally { rec('fn', n, now() - t0); } }; w.__idw = 1; try { window[n] = w; } catch (e) {} });
 try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (I.on) I.lt.push([Math.round(e.startTime - I.t0), Math.round(e.duration)]); })).observe({type: 'longtask', buffered: false}); } catch (e) {}
 I.start = () => { for (const b of ['t', 'i', 'r', 'ric', 'mo', 'ro', 'io', 'fetch', 'fn']) I[b] = {}; I.lt = []; I.t0 = now(); I.on = true; };
 I.stop = () => { I.on = false; const out = {wall: now() - I.t0}; for (const b of ['t', 'i', 'r', 'ric', 'mo', 'ro', 'io', 'fetch', 'fn']) out[b] = Object.entries(I[b]).map(([k, v]) => ({k, n: v.n, ms: +(v.ms || 0).toFixed(1), max: +(v.max || 0).toFixed(1), recs: v.recs})).sort((a, b) => (b.ms - a.ms) || (b.n - a.n)); out.lt = I.lt; return out; };
})();
//# sourceURL=__idleinst.js
