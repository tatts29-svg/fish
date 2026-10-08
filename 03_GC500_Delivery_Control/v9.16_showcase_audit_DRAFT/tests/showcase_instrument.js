/* Author: Andrew Fisher. v9.16 showcase audit (M2) - the in-page instrument, injected with addInitScript BEFORE any page
   script runs (measure_showcase.cjs does that). Read only: it wraps browser APIs to COUNT and TIME what the page asks for,
   and never changes what the page does or what it sends. Everything is kept on window.__M; the driver reads it per phase.
   What it records:
     - requestAnimationFrame: every callback timed (ms), grouped by frame (the timestamp the browser hands every callback of
       one frame), and by a label (function name, else the first 60 characters of its source);
     - WebGL / WebGL2 (prototype wraps, so every context is covered): draw calls, vertices, instances, buffer upload bytes,
       texture upload bytes (+ allocation bytes for null-data texImage), shader compiles, program links, program switches,
       pipeline-stalling reads (readPixels, getError, get*Parameter, getUniformLocation, ...), contexts created / lost /
       alive (WeakRef, so the instrument never keeps a context alive), and per-frame deltas of all of these;
     - AudioContext: contexts made / closed / alive and their state, nodes created by kind, connect / disconnect calls,
       decodeAudioData calls and bytes, and the audio clock against the wall clock (a stalled audio thread shows as drift);
     - media elements (the Broadcast takes): play() calls, distinct elements, and waiting / stalled / error / ended events;
     - setInterval / setTimeout: live intervals and pending timeouts, by label, and the ms their callbacks take;
     - addEventListener on window and document: net live listeners by type;
     - long tasks and long animation frames (PerformanceObserver), with the LoAF script attribution;
     - the 3D watchdog: GC3D.failed, the scene being up, the quality rung, S.fps, S.revived, every GC3D.stepDown() call,
       and #show3dNote, polled every 250 ms with the time each changed. */
(() => {
  'use strict';
  if (window.__M) return;
  const now = performance.now.bind(performance);
  const nSetInterval = window.setInterval.bind(window), nSetTimeout = window.setTimeout.bind(window);
  const nClearInterval = window.clearInterval.bind(window), nClearTimeout = window.clearTimeout.bind(window);
  const nRAF = window.requestAnimationFrame.bind(window);
  const WR = typeof WeakRef === 'function' ? (o => new WeakRef(o)) : (o => ({deref: () => o}));
  const labelCache = new WeakMap();
  const label = fn => {
    if (typeof fn !== 'function') return 'string-code';
    let l = labelCache.get(fn); if (l) return l;
    l = fn.name ? fn.name.replace(/^bound /, 'bound:') : ('anon:' + String(Function.prototype.toString.call(fn)).replace(/\s+/g, ' ').slice(0, 60));
    labelCache.set(fn, l); return l;
  };
  const M = window.__M = {t0: now(), phase: 'load', phaseT0: now()};
  /* ---------- cumulative counters (never reset; per-frame and per-phase figures are deltas) */
  const C = M.C = {draws: 0, verts: 0, inst: 0, bufB: 0, bufCalls: 0, texB: 0, texAllocB: 0, texCalls: 0, compiles: 0, links: 0,
    progSw: 0, syncReads: 0, readPixels: 0, ctxMade: 0, ctxLost: 0, ctxRestored: 0, ctx2d: 0, rafCalls: 0, rafMs: 0,
    timerMs: 0, timerCalls: 0, audioNodes: 0, audioConnect: 0, audioDisconnect: 0, audioCtxMade: 0, audioCtxClosed: 0,
    decodeCalls: 0, decodeB: 0, mediaPlay: 0, mediaWaiting: 0, mediaStalled: 0, mediaError: 0, mediaEnded: 0, loseContextCalls: 0,
    glMs: 0, syncMs: 0, texCreated: 0, texDeleted: 0, bufCreated: 0, bufDeleted: 0, fbCreated: 0, fbDeleted: 0, progCreated: 0, progDeleted: 0};
  /* ---------- per-phase containers */
  const newPhase = name => ({name, t0: now(), frames: [], rafBy: {}, timerBy: {}, audioBy: {}, longtasks: [], loaf: [], events: [], captures: [], c0: Object.assign({}, C)});
  let P = M.P = newPhase('load');
  M.phaseStart = name => { const old = P; P = M.P = newPhase(name); M.phase = name; frame = null; return old.name; };
  const ev = (what, detail) => { P.events.push([+(now() - P.t0).toFixed(1), what, detail === undefined ? null : detail]); if (P.events.length > 2000) P.events.shift(); };
  M.ev = ev;
  /* ---------- requestAnimationFrame */
  let frame = null; // {t, js, n, c} for the frame being collected
  const cap = M.cap = {left: 0, cur: null, prevT: 0};
  M.captureFrames = n => { cap.left = n; cap.cur = null; };
  const progSig = new WeakMap(); let progN = 0; const curProg = new WeakMap();
  const closeFrame = () => {
    if (!frame) return;
    const f = frame, d = k => C[k] - f.c[k];
    P.frames.push([+(f.t).toFixed(2), +f.js.toFixed(3), f.n, d('draws'), d('verts'), d('inst'), d('bufB'), d('texB'), d('compiles'), d('progSw'), d('syncReads'), +(d('timerMs')).toFixed(3), d('links'), d('texAllocB'), +(d('glMs')).toFixed(3), +(d('syncMs')).toFixed(3)]);
    if (cap.left > 0 && cap.cur) { cap.cur.jsMs = +f.js.toFixed(2); cap.cur.dt = +(f.t - (cap.prevT || f.t)).toFixed(1); P.captures.push(cap.cur); cap.left--; }
    cap.cur = cap.left > 0 ? {draws: []} : null; cap.prevT = f.t;
    if (P.frames.length > 60000) P.frames.shift();
  };
  M.frameCols = ['t', 'jsMs', 'callbacks', 'draws', 'verts', 'instances', 'bufBytes', 'texBytes', 'shaderCompiles', 'programSwitches', 'syncReads', 'timerMsBetween', 'programLinks', 'texAllocBytes', 'glMs', 'syncMs'];
  window.requestAnimationFrame = function requestAnimationFrame(cb) {
    if (typeof cb !== 'function') return nRAF(cb);
    C.rafCalls++;
    const lab = label(cb);
    return nRAF(function (t) {
      if (!frame || frame.t !== t) { closeFrame(); frame = {t, js: 0, n: 0, c: Object.assign({}, C)}; }
      const a = now();
      try { return cb.apply(this, arguments); }
      finally {
        const ms = now() - a; frame.js += ms; frame.n++; C.rafMs += ms;
        const r = P.rafBy[lab] || (P.rafBy[lab] = {n: 0, ms: 0, max: 0}); r.n++; r.ms += ms; if (ms > r.max) r.max = ms;
      }
    });
  };
  /* ---------- timers */
  const liveIntervals = new Map(), pendingTimeouts = new Map();
  const timed = (fn, lab, kind, id) => function () {
    const a = now();
    try { return fn.apply(this, arguments); }
    finally {
      const ms = now() - a; C.timerMs += ms; C.timerCalls++;
      const r = P.timerBy[kind + ' ' + lab] || (P.timerBy[kind + ' ' + lab] = {n: 0, ms: 0, max: 0}); r.n++; r.ms += ms; if (ms > r.max) r.max = ms;
      if (kind === 'timeout') pendingTimeouts.delete(id.v);
    }
  };
  window.setInterval = function setInterval(fn, ms, ...rest) {
    if (typeof fn !== 'function') return nSetInterval(fn, ms, ...rest);
    const lab = label(fn); const id = nSetInterval(timed(fn, lab, 'interval'), ms, ...rest);
    liveIntervals.set(id, {lab, ms: ms || 0, at: +(now() - M.t0).toFixed(0), phase: M.phase}); return id;
  };
  window.clearInterval = function clearInterval(id) { liveIntervals.delete(id); return nClearInterval(id); };
  window.setTimeout = function setTimeout(fn, ms, ...rest) {
    if (typeof fn !== 'function') return nSetTimeout(fn, ms, ...rest);
    const box = {v: 0}, lab = label(fn); box.v = nSetTimeout(timed(fn, lab, 'timeout', box), ms, ...rest);
    pendingTimeouts.set(box.v, {lab, ms: ms || 0}); return box.v;
  };
  window.clearTimeout = function clearTimeout(id) { pendingTimeouts.delete(id); return nClearTimeout(id); };
  /* ---------- listeners on window / document */
  const listen = {};
  const nAdd = EventTarget.prototype.addEventListener, nRem = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opt) {
    if (this === window || this === document) { const k = (this === window ? 'w:' : 'd:') + type; listen[k] = (listen[k] || 0) + 1; }
    return nAdd.call(this, type, fn, opt);
  };
  EventTarget.prototype.removeEventListener = function (type, fn, opt) {
    if (this === window || this === document) { const k = (this === window ? 'w:' : 'd:') + type; listen[k] = (listen[k] || 0) - 1; }
    return nRem.call(this, type, fn, opt);
  };
  /* ---------- WebGL */
  const contexts = []; // {ref, kind, made, cls, w, h}
  const lastProg = new WeakMap();
  const bytesOfView = (v, off, len) => {
    if (!v) return 0;
    if (v instanceof ArrayBuffer) return v.byteLength;
    if (ArrayBuffer.isView(v)) { const bpe = v.BYTES_PER_ELEMENT || 1; if (len) return len * bpe; if (off) return Math.max(0, (v.length - off)) * bpe; return v.byteLength; }
    return 0;
  };
  const srcPixels = s => {
    if (!s || typeof s !== 'object') return 0;
    const w = s.videoWidth || s.naturalWidth || s.displayWidth || s.width || 0, h = s.videoHeight || s.naturalHeight || s.displayHeight || s.height || 0;
    return w * h * 4;
  };
  const wrapGL = proto => {
    if (!proto) return;
    const W = (name, pre, sync) => { const f = proto[name]; if (typeof f !== 'function') return; proto[name] = function () { pre.call(this, arguments); const a = now();
      try { return f.apply(this, arguments); } finally { const ms = now() - a; C.glMs += ms; if (sync) C.syncMs += ms; } }; };
    const D = (mode, count, inst, gl) => { if (cap.cur && cap.cur.draws.length < 3000) { const pr = curProg.get(gl); cap.cur.draws.push([pr ? (progSig.get(pr) || {}).i : -1, mode, count, inst]); } };
    W('drawArrays', function (a) { C.draws++; C.verts += a[2] | 0; D(a[0], a[2] | 0, 0, this); });
    W('drawElements', function (a) { C.draws++; C.verts += a[1] | 0; D(a[0], a[1] | 0, 0, this); });
    W('drawArraysInstanced', function (a) { C.draws++; C.verts += (a[2] | 0) * (a[3] | 0); C.inst += a[3] | 0; D(a[0], a[2] | 0, a[3] | 0, this); });
    W('drawElementsInstanced', function (a) { C.draws++; C.verts += (a[1] | 0) * (a[4] | 0); C.inst += a[4] | 0; D(a[0], a[1] | 0, a[4] | 0, this); });
    W('drawRangeElements', function (a) { C.draws++; C.verts += a[3] | 0; D(a[0], a[3] | 0, 0, this); });
    W('bufferData', a => { C.bufCalls++; C.bufB += typeof a[1] === 'number' ? a[1] : bytesOfView(a[1], a[3], a[4]); });
    W('bufferSubData', a => { C.bufCalls++; C.bufB += bytesOfView(a[2], a[3], a[4]); });
    W('texImage2D', a => { C.texCalls++;
      if (a.length >= 9) { const p = a[8]; if (p == null) C.texAllocB += (a[3] | 0) * (a[4] | 0) * 4; else if (typeof p === 'number') C.texB += (a[3] | 0) * (a[4] | 0) * 4; else if (ArrayBuffer.isView(p)) C.texB += p.byteLength; else C.texB += srcPixels(p) || (a[3] | 0) * (a[4] | 0) * 4; }
      else C.texB += srcPixels(a[5]); });
    W('texSubImage2D', a => { C.texCalls++;
      if (a.length >= 9) { const p = a[8]; if (ArrayBuffer.isView(p)) C.texB += p.byteLength; else C.texB += srcPixels(p) || (a[4] | 0) * (a[5] | 0) * 4; }
      else C.texB += srcPixels(a[6]); });
    W('texImage3D', a => { C.texCalls++; const p = a[9]; if (p == null) C.texAllocB += (a[3] | 0) * (a[4] | 0) * (a[5] | 0) * 4; else if (ArrayBuffer.isView(p)) C.texB += p.byteLength; else C.texB += (a[3] | 0) * (a[4] | 0) * (a[5] | 0) * 4; });
    W('texSubImage3D', a => { C.texCalls++; const p = a[10]; C.texB += ArrayBuffer.isView(p) ? p.byteLength : (a[5] | 0) * (a[6] | 0) * (a[7] | 0) * 4; });
    W('texStorage2D', a => { C.texCalls++; let w = a[3] | 0, h = a[4] | 0, s = 0; for (let i = 0; i < (a[1] | 0); i++) { s += w * h * 4; w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); } C.texAllocB += s; });
    W('compressedTexImage2D', a => { C.texCalls++; C.texB += bytesOfView(a[6]); });
    W('compileShader', () => { C.compiles++; });
    W('linkProgram', function (a) { C.links++; try { const pr = a[0]; if (pr && !progSig.has(pr)) { const sh = (this.getAttachedShaders(pr) || []).map(x => String(this.getShaderSource(x) || '')); 
      const vs = sh.find(t => /gl_Position/.test(t)) || sh[0] || '', fs = sh.find(t => /out\s+vec4|gl_FragColor/.test(t) && t !== vs) || '';
      const ids = t => (t.match(/\b(?:in|attribute|uniform)\s+\w+\s+(\w+)/g) || []).map(x => x.split(/\s+/).pop()).slice(0, 10).join(',');
      progSig.set(pr, {i: progN++}); (M.programs = M.programs || []).push({i: progN - 1, vs: ids(vs).slice(0, 140), fs: ids(fs).slice(0, 140), vsLen: vs.length, fsLen: fs.length}); } } catch (e) {} });
    W('useProgram', function (a) { const prev = lastProg.get(this); if (prev !== a[0]) { C.progSw++; lastProg.set(this, a[0]); } curProg.set(this, a[0]); });
    W('readPixels', () => { C.readPixels++; C.syncReads++; }, true);
    for (const n of ['getError', 'getParameter', 'getShaderParameter', 'getProgramParameter', 'getUniformLocation', 'getAttribLocation', 'getShaderInfoLog', 'getProgramInfoLog', 'getBufferSubData', 'clientWaitSync', 'finish', 'checkFramebufferStatus'])
      W(n, () => { C.syncReads++; }, true);
    W('createTexture', () => { C.texCreated++; }); W('deleteTexture', () => { C.texDeleted++; });
    W('createBuffer', () => { C.bufCreated++; }); W('deleteBuffer', () => { C.bufDeleted++; });
    W('createFramebuffer', () => { C.fbCreated++; }); W('deleteFramebuffer', () => { C.fbDeleted++; });
    W('createProgram', () => { C.progCreated++; }); W('deleteProgram', () => { C.progDeleted++; });
  };
  wrapGL(window.WebGLRenderingContext && WebGLRenderingContext.prototype);
  wrapGL(window.WebGL2RenderingContext && WebGL2RenderingContext.prototype);
  if (window.WEBGL_lose_context) { const f = WEBGL_lose_context.prototype.loseContext; WEBGL_lose_context.prototype.loseContext = function () { C.loseContextCalls++; ev('loseContext() called'); return f.apply(this, arguments); }; }
  const wrapGetContext = proto => {
    if (!proto || !proto.getContext) return; const f = proto.getContext;
    proto.getContext = function (kind) {
      const had = this.__mctx; const ctx = f.apply(this, arguments);
      if (ctx && /webgl/i.test(kind) && had !== ctx) {
        this.__mctx = ctx; C.ctxMade++;
        contexts.push({ref: WR(ctx), kind, made: +(now() - M.t0).toFixed(0), phase: M.phase, cls: String(this.className || (this instanceof HTMLCanvasElement ? 'canvas' : 'offscreen')).slice(0, 40), w: this.width, h: this.height});
        ev('webgl context made', {kind, cls: String(this.className || '').slice(0, 40), w: this.width, h: this.height});
        try { nAdd.call(this, 'webglcontextlost', () => { C.ctxLost++; ev('webglcontextlost'); }); nAdd.call(this, 'webglcontextrestored', () => { C.ctxRestored++; ev('webglcontextrestored'); }); } catch (e) {}
      } else if (ctx && kind === '2d' && had !== ctx) { this.__mctx = ctx; C.ctx2d++; }
      return ctx;
    };
  };
  wrapGetContext(window.HTMLCanvasElement && HTMLCanvasElement.prototype);
  wrapGetContext(window.OffscreenCanvas && OffscreenCanvas.prototype);
  /* ---------- Web Audio */
  const audioCtxs = [];
  const AudioProto = window.BaseAudioContext ? BaseAudioContext.prototype : (window.AudioContext && AudioContext.prototype);
  if (AudioProto) {
    for (const n of Object.getOwnPropertyNames(AudioProto)) {
      if (!/^create/.test(n) || n === 'createBuffer' || n === 'createPeriodicWave') continue;
      const d = Object.getOwnPropertyDescriptor(AudioProto, n); if (!d || typeof d.value !== 'function') continue;
      const f = d.value; AudioProto[n] = function () { C.audioNodes++; const k = n.slice(6); P.audioBy[k] = (P.audioBy[k] || 0) + 1; return f.apply(this, arguments); };
    }
    const dec = AudioProto.decodeAudioData;
    if (dec) AudioProto.decodeAudioData = function (buf) { C.decodeCalls++; C.decodeB += (buf && buf.byteLength) || 0; return dec.apply(this, arguments); };
  }
  if (window.AudioNode) {
    const c = AudioNode.prototype.connect, d = AudioNode.prototype.disconnect;
    AudioNode.prototype.connect = function () { C.audioConnect++; return c.apply(this, arguments); };
    AudioNode.prototype.disconnect = function () { C.audioDisconnect++; return d.apply(this, arguments); };
  }
  for (const k of ['AudioContext', 'webkitAudioContext']) {
    const N = window[k]; if (typeof N !== 'function') continue;
    const Wrapped = function () { const ctx = new N(...arguments); C.audioCtxMade++; audioCtxs.push({ref: WR(ctx), made: +(now() - M.t0).toFixed(0), phase: M.phase, last: null}); ev('AudioContext made'); return ctx; };
    Wrapped.prototype = N.prototype; Object.setPrototypeOf(Wrapped, N);
    try { Object.defineProperty(window, k, {value: Wrapped, writable: true, configurable: true}); } catch (e) { window[k] = Wrapped; }
  }
  if (window.AudioContext && AudioContext.prototype.close) { const f = AudioContext.prototype.close; AudioContext.prototype.close = function () { C.audioCtxClosed++; ev('AudioContext.close()'); return f.apply(this, arguments); }; }
  /* ---------- media elements (Broadcast takes) */
  const mediaSeen = new WeakSet(); let mediaDistinct = 0; const mediaLog = [];
  if (window.HTMLMediaElement) {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      C.mediaPlay++;
      if (!mediaSeen.has(this)) {
        mediaSeen.add(this); mediaDistinct++;
        const el = this, src = () => { try { return new URL(el.currentSrc || el.src, location.href).pathname.slice(-24); } catch (e) { return ''; } };
        const on = (type, key) => nAdd.call(el, type, () => { C[key]++; ev('media ' + type, {src: src(), t: +(el.currentTime || 0).toFixed(2), rs: el.readyState}); if (mediaLog.length < 400) mediaLog.push([+(now() - M.t0).toFixed(0), type, src()]); });
        on('waiting', 'mediaWaiting'); on('stalled', 'mediaStalled'); on('error', 'mediaError'); on('ended', 'mediaEnded');
        nAdd.call(el, 'playing', () => { if (mediaLog.length < 400) mediaLog.push([+(now() - M.t0).toFixed(0), 'playing', src()]); });
      }
      return play.apply(this, arguments);
    };
  }
  /* ---------- long tasks and long animation frames */
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) { P.longtasks.push([+(e.startTime - P.t0).toFixed(0), +e.duration.toFixed(0)]); if (P.longtasks.length > 5000) P.longtasks.shift(); } }).observe({type: 'longtask', buffered: true}); M.longtaskOK = true; } catch (e) { M.longtaskOK = false; }
  try {
    new PerformanceObserver(l => { for (const e of l.getEntries()) {
      const scripts = (e.scripts || []).slice().sort((a, b) => b.duration - a.duration).slice(0, 3).map(s => ({fn: String(s.sourceFunctionName || '').slice(0, 50), inv: String(s.invoker || '').slice(0, 60), type: s.invokerType, ms: +s.duration.toFixed(0), forced: +(s.forcedStyleAndLayoutDuration || 0).toFixed(0)}));
      P.loaf.push({at: +(e.startTime - P.t0).toFixed(0), ms: +e.duration.toFixed(0), block: +(e.blockingDuration || 0).toFixed(0), render: +((e.renderStart ? (e.startTime + e.duration - e.renderStart) : 0)).toFixed(0), style: +((e.styleAndLayoutStart ? (e.startTime + e.duration - e.styleAndLayoutStart) : 0)).toFixed(0), scripts});
      if (P.loaf.length > 3000) P.loaf.shift(); } }).observe({type: 'long-animation-frame', buffered: true}); M.loafOK = true;
  } catch (e) { M.loafOK = false; }
  /* ---------- the 3D watchdog and the scene's own state, polled */
  const W3 = M.W3 = {last: null, stepDowns: [], trips: []};
  const snap3d = () => {
    const G = window.GC3D, S = G && G.S, note = document.getElementById('show3dNote');
    return {open: !!(window.SHOW && SHOW.open), failed: G ? (G.failed || null) : 'no GC3D', up: !!S, rung: S ? (S.qualityStep || null) : null, q: S && S.quality ? S.quality.name : null,
      ss: S && S.o ? S.o.ss : null, revived: S ? (S.revived || 0) : null, note: note && !note.hidden ? String(note.textContent || '').slice(0, 90) : null, lost: S ? !!S.lost : null,
      vehicle: G ? (G.vehicle || null) : null, paused: S ? !!S.paused : null, cv: S && S.cv ? [S.cv.width, S.cv.height] : null, fps: S ? (S.fps || null) : null, bloom: S ? S.bloom !== false : null, shadow: S ? S.shadowOff !== true : null};
  };
  M.snap3d = snap3d;
  nSetInterval(() => {
    try {
      const G = window.GC3D;
      if (G && G.stepDown && !G.stepDown.__m) {
        const f = G.stepDown;
        G.stepDown = function () { const S = G.S, before = S ? {stalledAt: S.stalledAt || null, fps: S.fps || null} : {}; const r = f.apply(this, arguments);
          const rec = {at: +(now() - M.t0).toFixed(0), phase: M.phase, phaseAt: +(now() - P.t0).toFixed(0), rung: r, stalledAt: before.stalledAt, fps: before.fps, failed: G.failed || null};
          W3.stepDowns.push(rec); ev('stepDown', rec); return r; };
        G.stepDown.__m = true;
      }
      const s = snap3d(), k = JSON.stringify([s.open, s.failed, s.up, s.rung, s.q, s.revived, s.note, s.lost, s.vehicle]);
      if (k !== W3.lastK) { W3.lastK = k; const rec = Object.assign({at: +(now() - M.t0).toFixed(0), phase: M.phase, phaseAt: +(now() - P.t0).toFixed(0)}, s); W3.trips.push(rec); if (W3.trips.length > 3000) W3.trips.shift(); }
      /* the audio clock against the wall: a running context whose clock falls behind the wall is an audio thread starved */
      for (const a of audioCtxs) { const ctx = a.ref.deref(); if (!ctx || ctx.state !== 'running') { a.last = null; continue; }
        const w = now(), t = ctx.currentTime;
        if (a.last) { const dw = (w - a.last[0]) / 1000, dt = t - a.last[1]; a.wall = (a.wall || 0) + dw; a.audio = (a.audio || 0) + dt; if (dw > 0.2 && dt / dw < 0.9) a.slowTicks = (a.slowTicks || 0) + 1; }
        a.last = [w, t]; }
    } catch (e) {}
  }, 250);
  /* ---------- reading it out */
  M.state = () => {
    const ctxAlive = contexts.map(c => { const g = c.ref.deref(); return {kind: c.kind, cls: c.cls, made: c.made, phase: c.phase, alive: !!g && !g.isContextLost(), collected: !g}; });
    const ac = audioCtxs.map(a => { const x = a.ref.deref(); return {made: a.made, phase: a.phase, state: x ? x.state : 'collected', audioS: a.audio ? +a.audio.toFixed(2) : 0, wallS: a.wall ? +a.wall.toFixed(2) : 0, slowTicks: a.slowTicks || 0, baseLatency: x && x.baseLatency, outputLatency: x && x.outputLatency}; });
    const ivals = {}; for (const v of liveIntervals.values()) { const k = v.lab + ' @' + v.ms; ivals[k] = (ivals[k] || 0) + 1; }
    const touts = {}; for (const v of pendingTimeouts.values()) { const k = v.lab + ' @' + v.ms; touts[k] = (touts[k] || 0) + 1; }
    return {t: +(now() - M.t0).toFixed(0), C: Object.assign({}, C), webgl: {made: contexts.length, alive: ctxAlive.filter(c => c.alive).length, list: ctxAlive},
      audio: {made: audioCtxs.length, list: ac}, media: {distinct: mediaDistinct, log: mediaLog.slice(-60)},
      intervals: {live: liveIntervals.size, by: ivals}, timeouts: {pending: pendingTimeouts.size, by: touts},
      listeners: Object.fromEntries(Object.entries(listen).filter(([, v]) => v !== 0)), dom: document.getElementsByTagName('*').length,
      canvases: document.getElementsByTagName('canvas').length, iframes: document.getElementsByTagName('iframe').length, threeD: snap3d(), longtaskOK: M.longtaskOK, loafOK: M.loafOK};
  };
  M.drain = () => { closeFrame(); frame = null; const p = P; return {name: p.name, durMs: +(now() - p.t0).toFixed(0), frameCols: M.frameCols, frames: p.frames, rafBy: p.rafBy, timerBy: p.timerBy, audioBy: p.audioBy,
    longtasks: p.longtasks, loaf: p.loaf, events: p.events, captures: p.captures, programs: M.programs || [], cDelta: Object.fromEntries(Object.keys(C).map(k => [k, +(C[k] - p.c0[k]).toFixed(3)]))}; };
  M.watch = () => ({stepDowns: W3.stepDowns.slice(), trips: W3.trips.slice()});
})();
