/* Author: Andrew Fisher. v9.16 showcase audit (M3, history and regression) - the SIMPLE probe's in-page instrument.
   Injected with addInitScript before any page script, identically into every build measured (v6.x to live), so the
   same counters read the same way whichever release is on the plate. Read only: it counts and times what the page asks
   the browser for and never changes what the page does.
     - requestAnimationFrame: every callback timed; callbacks sharing one timestamp make one frame; per frame the JS ms
       (sum of callbacks), the ms of that spent inside WebGL calls (timed, so the rest is the page's own script), and
       the WebGL deltas below; per callback label (function name, else its first 50 characters) calls and ms;
     - WebGL / WebGL2 (prototype wraps, every context): draw calls, vertices (count x instances), all GL calls,
       buffer upload bytes, texture upload bytes, shader compiles, program links, program switches, pipeline-stalling
       reads (getError, readPixels, get*Parameter, get*Location, checkFramebufferStatus), contexts made and lost;
       and, on request, one or two frames captured draw by draw (program, vertices) for attribution;
     - setInterval / setTimeout: live intervals by label, callback calls and ms;
     - long tasks (PerformanceObserver). Heap, DOM nodes and main-thread task time come from CDP in the driver. */
(() => {
  'use strict';
  if (window.__P) return;
  const now = performance.now.bind(performance);
  const lab = new WeakMap();
  const label = fn => { if (typeof fn !== 'function') return 'string-code'; let l = lab.get(fn); if (l) return l;
    l = fn.name ? fn.name : 'anon:' + String(Function.prototype.toString.call(fn)).replace(/\s+/g, ' ').slice(0, 50); lab.set(fn, l); return l; };
  const C = {draws: 0, verts: 0, glCalls: 0, glMs: 0, bufB: 0, texB: 0, compiles: 0, links: 0, progSw: 0, sync: 0, ctxMade: 0, ctxLost: 0, ctx2d: 0};
  const P = window.__P = {C, rec: false, frames: [], rafBy: {}, timerBy: {}, lt: [], cap: {left: 0, cur: null, frames: []}, progs: [], t0: now()};
  P.reset = () => { P.frames = []; P.rafBy = {}; P.timerBy = {}; P.rec = true; P.tReset = now(); P.c0 = Object.assign({}, C); };
  /* ---- requestAnimationFrame */
  const nRAF = window.requestAnimationFrame.bind(window);
  let fr = null;
  const sceneUp = () => { const G = window.GC3D; return (G && G.S ? 1 : 0) + (G && G.geo && G.geo.S ? 2 : 0); };
  const closeFrame = () => {
    if (!fr) return;
    const f = fr, d = k => C[k] - f.c[k];
    if (P.rec) P.frames.push([+f.t.toFixed(1), +f.js.toFixed(2), f.n, d('draws'), d('verts'), d('glCalls'), +d('glMs').toFixed(2), d('bufB'), d('texB'), d('compiles'), d('progSw'), d('sync'), sceneUp()]);
    if (P.cap.cur) { P.cap.frames.push(P.cap.cur); P.cap.cur = null; P.cap.left--; }
    if (P.cap.left > 0) P.cap.cur = {draws: []};
    fr = null;
  };
  P.closeFrame = closeFrame;
  P.cols = ['t', 'jsMs', 'callbacks', 'draws', 'verts', 'glCalls', 'glMs', 'bufBytes', 'texBytes', 'compiles', 'progSwitches', 'syncReads', 'sceneUp(1=3d,2=geo)'];
  window.requestAnimationFrame = function requestAnimationFrame(cb) {
    if (typeof cb !== 'function') return nRAF(cb);
    return nRAF(function (t) {
      if (!fr || fr.t !== t) { closeFrame(); fr = {t, js: 0, n: 0, c: Object.assign({}, C)}; }
      const a = now();
      try { return cb.apply(this, arguments); } finally {
        const ms = now() - a; fr.js += ms; fr.n++;
        if (P.rec) { const l = label(cb), r = P.rafBy[l] || (P.rafBy[l] = {n: 0, ms: 0, max: 0}); r.n++; r.ms += ms; if (ms > r.max) r.max = ms; }
      }
    });
  };
  /* ---- timers */
  const live = P.intervals = new Map();
  const nSI = window.setInterval.bind(window), nCI = window.clearInterval.bind(window), nST = window.setTimeout.bind(window);
  const timed = (fn, l) => function () { const a = now(); try { return fn.apply(this, arguments); } finally { if (P.rec) { const ms = now() - a, r = P.timerBy[l] || (P.timerBy[l] = {n: 0, ms: 0, max: 0}); r.n++; r.ms += ms; if (ms > r.max) r.max = ms; } } };
  window.setInterval = function setInterval(fn, ms, ...rest) { if (typeof fn !== 'function') return nSI(fn, ms, ...rest); const l = 'iv ' + label(fn);
    const id = nSI(timed(fn, l), ms, ...rest); live.set(id, {l, ms: ms || 0, at: Math.round(now())}); return id; };
  window.clearInterval = function clearInterval(id) { live.delete(id); return nCI(id); };
  window.setTimeout = function setTimeout(fn, ms, ...rest) { if (typeof fn !== 'function') return nST(fn, ms, ...rest); return nST(timed(fn, 'to ' + label(fn)), ms, ...rest); };
  /* ---- long tasks */
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) P.lt.push([Math.round(e.startTime), Math.round(e.duration)]); if (P.lt.length > 5000) P.lt.splice(0, 1000); }).observe({type: 'longtask', buffered: true}); } catch (e) {}
  /* ---- canvas contexts */
  const gc = HTMLCanvasElement.prototype.getContext;
  const seen = new WeakSet();
  HTMLCanvasElement.prototype.getContext = function (type) { const r = gc.apply(this, arguments);
    if (r && !seen.has(this)) { seen.add(this); if (/webgl/.test(String(type))) { C.ctxMade++; try { this.addEventListener('webglcontextlost', () => { C.ctxLost++; }); } catch (e) {} } else C.ctx2d++; }
    return r; };
  /* ---- WebGL */
  const viewBytes = (v, so, len) => { if (!v) return 0; if (v instanceof ArrayBuffer) return v.byteLength;
    if (ArrayBuffer.isView(v)) { const b = v.BYTES_PER_ELEMENT || 1; if (len) return len * b; if (so) return Math.max(0, v.length - so) * b; return v.byteLength; } return 0; };
  const srcBytes = s => { if (!s || typeof s !== 'object') return 0; if (ArrayBuffer.isView(s) || s instanceof ArrayBuffer) return viewBytes(s);
    const w = s.videoWidth || s.naturalWidth || s.displayWidth || s.width || 0, h = s.videoHeight || s.naturalHeight || s.displayHeight || s.height || 0; return w * h * 4; };
  const progIdx = new WeakMap(), shSrc = new WeakMap(), progVs = new WeakMap(), lastProg = new WeakMap(), curProg = new WeakMap();
  const SYNC = ['getError', 'readPixels', 'getParameter', 'getShaderParameter', 'getProgramParameter', 'getUniformLocation', 'getAttribLocation', 'checkFramebufferStatus', 'getActiveUniform', 'getActiveAttrib', 'getBufferSubData', 'clientWaitSync', 'getQueryParameter', 'getShaderInfoLog', 'getProgramInfoLog'];
  const wrapProto = proto => {
    if (!proto) return;
    for (const name of Object.getOwnPropertyNames(proto)) {
      let desc; try { desc = Object.getOwnPropertyDescriptor(proto, name); } catch (e) { continue; }
      if (!desc || typeof desc.value !== 'function' || name === 'constructor') continue;
      const f = desc.value, isSync = SYNC.includes(name);
      let pre = null;
      if (name === 'drawArrays') pre = a => { C.draws++; C.verts += a[2] | 0; };
      else if (name === 'drawElements') pre = a => { C.draws++; C.verts += a[1] | 0; };
      else if (name === 'drawArraysInstanced') pre = a => { C.draws++; C.verts += (a[2] | 0) * Math.max(1, a[3] | 0); };
      else if (name === 'drawElementsInstanced') pre = a => { C.draws++; C.verts += (a[1] | 0) * Math.max(1, a[4] | 0); };
      else if (name === 'drawRangeElements') pre = a => { C.draws++; C.verts += a[3] | 0; };
      else if (name === 'bufferData') pre = a => { C.bufB += typeof a[1] === 'number' ? a[1] : viewBytes(a[1], a[3], a[4]); };
      else if (name === 'bufferSubData') pre = a => { C.bufB += viewBytes(a[2], a[3], a[4]); };
      else if (name === 'texImage2D' || name === 'texSubImage2D' || name === 'texImage3D' || name === 'texSubImage3D') pre = a => {
        const last = a[a.length - 1];
        if (last && typeof last === 'object') C.texB += srcBytes(last);
        else if (name === 'texImage2D' && a.length >= 9) C.texB += (a[3] | 0) * (a[4] | 0) * 4; };
      else if (name === 'compressedTexImage2D' || name === 'compressedTexSubImage2D') pre = a => { C.texB += viewBytes(a[a.length - 1]); };
      else if (name === 'compileShader') pre = () => { C.compiles++; };
      else if (name === 'linkProgram') pre = a => { C.links++; if (a[0] && !progIdx.has(a[0])) { progIdx.set(a[0], P.progs.length); P.progs.push({vs: progVs.get(a[0]) || ''}); } };
      else if (name === 'shaderSource') pre = a => { if (a[0]) shSrc.set(a[0], String(a[1] || '')); };
      else if (name === 'attachShader') pre = function (a) { const s = shSrc.get(a[1]) || ''; if (/gl_Position/.test(s)) progVs.set(a[0], s.replace(/\s+/g, ' ').slice(0, 2000)); };
      else if (name === 'useProgram') pre = function (a) { if (lastProg.get(this) !== a[0]) { C.progSw++; lastProg.set(this, a[0]); } curProg.set(this, a[0]); };
      const isDraw = /^draw(Arrays|Elements|RangeElements)/.test(name);
      proto[name] = function () {
        C.glCalls++; if (isSync) C.sync++;
        if (pre) pre.call(this, arguments);
        if (isDraw && P.cap.cur) { const pr = curProg.get(this), a = arguments; const v = name === 'drawArrays' ? a[2] : name === 'drawElements' ? a[1] : name === 'drawArraysInstanced' ? a[2] * a[3] : name === 'drawElementsInstanced' ? a[1] * a[4] : a[3];
          P.cap.cur.draws.push([pr && progIdx.has(pr) ? progIdx.get(pr) : -1, v | 0]); }
        const t = now();
        try { return f.apply(this, arguments); } finally { C.glMs += now() - t; }
      };
    }
  };
  wrapProto(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
  wrapProto(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
})();
