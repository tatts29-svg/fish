/* v7.53 - THE CIRCUIT IN THREE.JS. The project manager, 1 Oct 2026: "Redo the showcase car track. Fix visual. Better
 camera work - follow-cam, low trackside shots, overhead circuit views, controlled zooms. More convincing car motion -
 braking, cornering, acceleration, overtaking-style movement, smoother racing lines. Track perspective - stronger
 depth, kerbs, barriers, fencing, signage, Gold Coast visual identity. Car branding - the Coates livery, number,
 headlights, wheels, the orange-black colourway. Motion blur and road effects. Cinematic lighting - sunset and night
 variants, track lighting, event atmosphere. Race-control overlays. Three.js. I want 10/10."

 WHAT THIS IS. A new renderer for the showcase's 3D backdrop, built on Three.js (r152, loaded from cdn.jsdelivr.net
 when the backdrop is first chosen; nothing else on the page changes if it cannot load - the flat circuit stays, as
 it always has). It takes over the same handles the showcase already holds on the old engine (window.GC3D):
 mount(pack, look), S (paused, needsRender, syncLayout, unmount ...), frame(t), setView/VIEWS, setVehicle/PLANT,
 setPace, setQuality, renderAt, graphicsReport, stepDown - and it keeps feeding the V8 sound (GC3D.sound, part 7)
 the same scene state it has always read (clock, sim, pose, cam, tune). The old engine's code stays in the page,
 untouched, as the fallback when WebGL is missing.

 WHAT IT DRAWS. The real circuit - iEDM's key-plan ring off sheet K220, the same DATA.circuit.ring the flat scene
 and the old engine draw - as a road ribbon with lane lines, kerbs at the corners, concrete barriers with hoardings
 in Coates orange and the event's own words, debris fencing, gantries over the straights, the pink Gold Coast
 pedestrian bridge, street lights, floodlights, grandstands, marquees, palms; the real buildings, roads, water,
 beach and parks of Surfers Paradise from OpenStreetMap (DATA.surrounds, ODbL, credited on the plate). The words on
 the walls are Coates' and the event's - "GOLD COAST 500", "SURFERS PARADISE STREET CIRCUIT", "THE FINALS START
 HERE · 23-25 OCT 2026" - never another company's logo. The car is the Coates #26 in orange and black, a
 purpose-built coupe of this file's own geometry; no game asset, no third-party mesh. Decoration, never a record:
 nothing here reads or writes the shared record. Coates Industrial Solutions · GC500 · Author: Andrew Fisher. */
(function(){
'use strict';
const G = window.GC3D; if (!G) return;
const X = G.X = {ver: '2.0-three', THREE: null, loading: null, failedWhy: '', built: false};
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';
const M = G.M_PER_PT || 5.937552372855356; /* metres per PDF point on sheet K220 */
X.M = M;

/* ---------- loading Three.js, once, from the CDN the page already uses for its maps ---------- */
X.load = function(){
 if (window.THREE && window.THREE.WebGLRenderer) { X.THREE = window.THREE; return Promise.resolve(X.THREE); }
 if (X.loading) return X.loading;
 X.loading = new Promise((res, rej) => {
 const s = document.createElement('script'); s.src = THREE_URL; s.async = true; s.crossOrigin = 'anonymous';
 const t = setTimeout(() => rej(new Error('three.js did not load in 25 s')), 25000);
 s.onload = () => { clearTimeout(t); if (window.THREE) { X.THREE = window.THREE; res(X.THREE); } else rej(new Error('three.js loaded but THREE is missing')); };
 s.onerror = () => { clearTimeout(t); rej(new Error('three.js could not be fetched from ' + THREE_URL)); };
 document.head.appendChild(s);
 });
 X.loading.catch(e => { X.failedWhy = String(e && e.message || e); X.loading = null; });
 return X.loading;
};
G.preload = function(){ try { X.load(); } catch (e) {} };

/* ---------- the looks: day, sunset, night ---------- */
X.LOOKS = {
 /* physically based units (renderer.useLegacyLights = false): the sun and sky in 'lux'-like intensities, floods and headlights scale candela */
 day: {name: 'day', label: 'Day', day: 1, sky: ['#5fa3d6', '#bcdaea', '#eef2ee'], sun: {az: -0.9, el: 0.95, col: 0xfff3dc, i: 3.4}, hemi: [0xbfd8ee, 0x6f6a5a, 1.1], fog: ['#c9dbe4', 900, 3200], exposure: 1.0, windows: 0.0, floods: 0, headlights: 0.15, stars: 0},
 dusk: {name: 'dusk', label: 'Sunset', day: 1, sky: ['#3a4f8a', '#e0885a', '#ffd7a8'], sun: {az: 2.35, el: 0.16, col: 0xffb060, i: 2.8}, hemi: [0x9fb0d8, 0x6a4a3a, 1.05], fog: ['#e2b48c', 700, 2600], exposure: 0.95, windows: 0.55, floods: 0.6, headlights: 0.9, stars: 0.25},
 dark: {name: 'dark', label: 'Night', day: 0, sky: ['#05070f', '#0d1a2e', '#1a2436'], sun: {az: 0.6, el: 0.55, col: 0x8fa6d8, i: 0.35}, hemi: [0x1a2a44, 0x0a0a10, 0.55], fog: ['#0a1220', 500, 2200], exposure: 1.05, windows: 1.0, floods: 1, headlights: 1, stars: 1}
};
X.lookOf = name => X.LOOKS[name === 'day' ? 'day' : name === 'dusk' || name === 'sunset' ? 'dusk' : 'dark'];

/* ---------- quality ---------- */
X.QUALITY = {
 ultra: {name: 'ultra', dpr: 2, shadow: 2048, shadows: true, fence: true, palms: true, lights: 8, aa: true, pixels: 5200000},
 high: {name: 'high', dpr: 1.5, shadow: 1024, shadows: true, fence: true, palms: true, lights: 6, aa: true, pixels: 3600000},
 balanced: {name: 'balanced', dpr: 1, shadow: 512, shadows: false, fence: true, palms: true, lights: 4, aa: false, pixels: 2200000}
};
X.autoQuality = function(){ try { const c = navigator.hardwareConcurrency || 4, m = navigator.deviceMemory || 4, mob = /Mobi|Android/i.test(navigator.userAgent); return mob || c <= 4 || m <= 4 ? 'balanced' : c >= 8 ? 'high' : 'high'; } catch (e) { return 'high'; } };

/* ---------- the public handles the showcase already holds ---------- */
G.VIEWS = [['hero', 'Car follow'], ['auto', 'Auto — race director'], ['onboard', 'Onboard'], ['chase', 'Chase'], ['heli', 'Helicopter'],
 ['top', 'Overhead circuit'], ['wide', 'Trackside'], ['detail', 'Car detail'], ['frontdetail', 'Front detail']];
G.PLANT = G.PLANT || {forklift: {label: 'Forklift', speed: .48, grip: .62, note: .60}, boom: {label: 'Boom lift', speed: .38, grip: .55, note: .55}, scissor: {label: 'Scissor lift', speed: .34, grip: .52, note: .55}, tractor: {label: 'Tractor', speed: .55, grip: .66, note: .50}};
G.GRID = 3.4; G.SHOTS = [['wide', 10], ['chase', 9], ['heli', 8], ['top', 7]]; G.OPENING = ['chase', 7]; G.BLEND = 2.8;
G.M_PER_PT = M;

G.setView = function(name){
 const S = G.S; if (!S) return null;
 if (name && name !== 'auto' && !G.VIEWS.some(v => v[0] === name)) return null;
 const next = (!name || name === 'auto') ? 'auto' : name;
 S.view = next; S.forceShot = next === 'auto' ? null : next; S.needsRender = true;
 if (S.cam3) S.cam3.cut = true;
 return S.view;
};
G.viewReport = function(){ const S = G.S; return {view: (S && S.view) || 'auto', shot: S ? (S.shotName || null) : null, views: G.VIEWS.map(v => v[0])}; };
G.setVehicle = function(kind){ const S = G.S; const k = G.PLANT[kind] ? kind : 'car'; if (S) { S.vehicle = k; S.needsRender = true; if (S.car && S.car.setKind) S.car.setKind(k); } return k; };
G.setPace = function(tc){ const S = G.S; const p = Math.max(.1, Math.min(3, +tc || 1)); if (S) { S.pace = p; S.needsRender = true; } return p; };
G.setQuality = function(name, automatic){
 const S = G.S; const q = X.QUALITY[name === 'auto' || !name ? X.autoQuality() : name] || X.QUALITY.high; if (!S) return false;
 S.quality = q; S.needsRender = true; if (!automatic) { S.qualityChoice = name; S.qualityStep = null; }
 if (S.applyQuality) S.applyQuality();
 return G.graphicsReport();
};
G.graphicsReport = function(){ const S = G.S || {}, Q = S.quality || X.QUALITY.high; return {version: X.ver, engine: 'three.js r152', quality: Q.name, shadowMap: Q.shadows ? Q.shadow : 0, resolution: S.renderer ? [S.renderer.domElement.width, S.renderer.domElement.height] : [0, 0], steppedDownTo: S.qualityStep || null, fps: S.fps || null, look: S.look ? S.look.name : null, view: S.view || null, shot: S.shotName || null, built: !!(S.world)}; };
G.stepDown = function(){
 const S = G.S; if (!S) return null;
 const Q = S.quality || X.QUALITY.high;
 if (Q.name === 'ultra') { G.setQuality('high', true); S.qualityStep = 'detail High'; }
 else if (Q.name === 'high') { G.setQuality('balanced', true); S.qualityStep = 'detail Balanced'; }
 else if (!S.lowRes) { S.lowRes = true; S.qualityStep = 'drawn at 70%'; if (S.applyQuality) S.applyQuality(); }
 else { G.failed = 'frame rate'; S.qualityStep = 'handed back to the flat circuit'; S.unmount(); }
 return S.qualityStep;
};
G.sceneReport = function(){ const S = G.S; if (!S) return null; return {clock: S.clock, view: S.view, shot: S.shotName, kmh: Math.round(S.kmh || 0), gear: S.gear, lap: S.lap, s_m: Math.round(S.drive && S.drive.car ? S.drive.car.s : 0), look: S.look.name, built: !!S.world, quality: S.quality.name, frames: S.frames || 0}; };
G.simReset = function(){ const S = G.S; if (!S) return; S.clock = 0; S.frames = 0; if (S.drive && S.drive.reset) S.drive.reset(); if (G.sound && G.sound.sceneReset) try { G.sound.sceneReset(); } catch (e) {} };

/* ---------- mount: the canvas goes into the showcase's plate, over the flat circuit, under the words ---------- */
G.mount = function(pack, look){
 if (typeof DATA === 'undefined' || !DATA.circuit || !DATA.circuit.ring) return 'no circuit on this page';
 if (typeof LAPS === 'undefined') return 'no lap-lights hook on this page';
 if (G.S && G.S.unmount) G.S.unmount(true);
 document.querySelectorAll('canvas.gc3d,.gc3d-ui').forEach(e => e.remove()); document.querySelectorAll('.shplate').forEach(e => { e.__gc3d = false; });
 const probe = document.createElement('canvas'); let gl = null; try { gl = probe.getContext('webgl2') || probe.getContext('webgl'); } catch (e) {}
 if (!gl) return 'WebGL is not available here — the flat scene stays';
 const S = G.S = {engine: 'three', paused: false, last: null, needsRender: true, needsLayout: true, frames: 0, clock: 0, revived: 0,
 look: X.lookOf(look), pack: pack || null, view: 'auto', forceShot: null, shotI: -1, prevShot: null, camT: 0, calmK: 0, shotName: 'chase',
 tune: {shiftX: 0, tc: 1, carS: 4.9 / M, vmax: 76 / M}, distK: 1, pace: 1, vehicle: 'car',
 sim: {v: 0, brake: 0, go: false, burn: 0, slip: 0, s: 0}, pose: {pos: [0, 0, 0], fwd: [1, 0, 0]}, cam: null, vAt: () => 0,
 quality: X.QUALITY[X.autoQuality()], cv: document.createElement('canvas')};
 S.cv.className = 'gc3d gc3dx'; S.cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:4;pointer-events:none;background:transparent';
 const show = document.querySelector('section.show') || document.body, bg = getComputedStyle(show).backgroundColor || 'rgb(19,25,27)';
 const mid = a => bg.replace('rgb(', 'rgba(').replace(')', ',' + a + ')'), clear = mid(0), DAY = !!S.look.day;
 /* the plate: hide the flat drawing only once the scene is really drawn, so a slow load never leaves an empty plate */
 const dress = plate => {
 if (plate.__gc3d) return; plate.__gc3d = true;
 const fade = document.createElement('div'); fade.className = 'gc3d-ui'; fade.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5';
 const cap = document.createElement('div'); cap.className = 'gc3d-ui'; cap.style.cssText = 'position:absolute;right:1.2%;top:1.6%;z-index:6;pointer-events:none;font:500 11px Inter,system-ui,sans-serif;letter-spacing:.03em;text-align:right;max-width:46%;color:rgba(238,243,245,.92);text-shadow:0 1px 2px rgba(6,10,12,.85),0 0 8px rgba(6,10,12,.6)';
 S.credit = 'Circuit: iEDM key plan K220-K231-26003-02 · ' + (pack && pack.credit ? pack.credit + ' · ' : '') + 'drawn in Three.js · the backdrop is decoration, the figures are the record';
 S.creditShort = 'iEDM key plan K220 · © OpenStreetMap contributors (ODbL) · decoration, not the record';
 S.creditNow = () => (S.cv.clientWidth || 0) < 700 ? S.creditShort : S.credit;
 cap.textContent = S.creditNow();
 plate.appendChild(fade); plate.appendChild(cap); S.fadeEl = fade; S.capEl = cap; S.fadeTr = -1;
 if (X.hud) X.hud.mount(S, plate);
 };
 S.hideFlat = plate => { plate.querySelectorAll('svg.shcircuit,svg.shhalo').forEach(e => { e.style.visibility = 'hidden'; }); };
 const textRight = () => { const sc = document.querySelector('.shscene'), pr = S.cv.getBoundingClientRect(); if (!sc || !pr.width) return .48; let right = pr.left;
 const tw = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT), rg = document.createRange(); let nd;
 while ((nd = tw.nextNode())) { if (!nd.nodeValue.trim()) continue; const pe = nd.parentElement; if (!pe) continue; const cs = getComputedStyle(pe); if (cs.visibility === 'hidden' || +cs.opacity < .05) continue;
 rg.selectNodeContents(nd); const r = rg.getBoundingClientRect(); if (r.width > 0 && r.left < pr.right && r.top < pr.bottom && r.bottom > pr.top) right = Math.max(right, Math.min(r.right, pr.right)); }
 return Math.max(.2, Math.min(.8, (right - pr.left) / pr.width)); };
 const makeRoom = () => {
 const focus = show.classList.contains('car-focus');
 if (focus) { if (S.fadeEl) S.fadeEl.style.background = 'none'; S.fadeTr = -1; S.textRight = 0; S.shiftGoal = 0; S.distGoal = 1; return; }
 const tr = textRight(); S.textRight = tr;
 const r = S.cv.getBoundingClientRect(), asp = (r.width || 1) / Math.max(1, r.height), beside = asp > 1.5 && tr <= .60;
 if (S.fadeEl && (Math.abs(tr - S.fadeTr) > .01 || S.fadeB !== beside)) { S.fadeTr = tr; S.fadeB = beside; const pc = v => (Math.max(0, Math.min(1, v)) * 100).toFixed(1) + '%';
 const W = DAY ? [.86, .70, .30, .06] : [.84, .74, .46, .28];
 S.fadeEl.style.background = beside ? 'linear-gradient(to right,' + bg + ' 0%,' + bg + ' ' + pc(tr - .14) + ',' + mid(.9) + ' ' + pc(tr - .05) + ',' + mid(.62) + ' ' + pc(tr + .02) + ',' + mid(.25) + ' ' + pc(tr + .09) + ',' + clear + ' ' + pc(tr + .17) + ')'
 : 'linear-gradient(to right,' + mid(W[0]) + ' 0%,' + mid(W[1]) + ' ' + pc(tr * .55) + ',' + mid(W[2]) + ' ' + pc(tr * .92) + ',' + mid(W[3]) + ' 100%)'; }
 S.shiftGoal = beside ? Math.max(.2, Math.min(.8, 2 * (tr + (1 - tr) * .52) - 1)) : 0;
 S.distGoal = beside ? Math.max(1, Math.min(1.9, .40 / Math.max(.1, 1 - tr - .04))) : 1; };
 S.syncLayout = makeRoom;

 /* the frame loop: taken over from the lap lights exactly as the old engine took it, and handed back on unmount */
 let lastT = -1, acc = 0, n = 0, slow = 0, stalled = 0, sampledActive = false, layoutDone = false; const STALL_MS = 250;
 const gen = window.__gc3dGen = (window.__gc3dGen || 0) + 1, orig = G.origFrame = G.origFrame || window.lapsFrame;
 const frame = function(t){
 if (gen !== window.__gc3dGen) return;
 LAPS.raf = requestAnimationFrame(window.lapsFrame);
 { const nw = performance.now(), live = !S.paused && !document.hidden;
 if (live && S.beatLive && S.beatAt != null) { const g = nw - S.beatAt; if (g > (S.beatWorst || 0) && g < 60000) S.beatWorst = g; }
 S.beatAt = nw; S.beatLive = live; S.beatN = (S.beatN || 0) + 1; }
 if (t === lastT) return; let dtm = lastT < 0 ? 16 : t - lastT; lastT = t;
 const active = !S.paused && !document.hidden;
 if (!active || !sampledActive || S.last == null) { dtm = 16; acc = 0; n = 0; slow = 0; stalled = 0; }
 sampledActive = active;
 const cv = LAPS.cv; if (!cv || !cv.isConnected || S.lost) { sampledActive = false; return; }
 const plate = cv.parentNode; dress(plate);
 if (S.cv.parentNode !== plate) { plate.querySelectorAll('canvas.gc3d').forEach(c => { if (c !== S.cv) c.remove(); }); plate.insertBefore(S.cv, plate.querySelector('.gc3d-ui')); }
 if (LAPS.ctx && LAPS.dirty !== 0 && S.world) { LAPS.ctx.clearRect(0, 0, cv.width, cv.height); LAPS.dirty = 0; }
 if (!layoutDone || (active && n % 30 === 0) || S.needsLayout) { makeRoom(); layoutDone = true; S.needsLayout = false; }
 if (S.shiftGoal != null) { S.tune.shiftX += (S.shiftGoal - S.tune.shiftX) * .05; S.distK = (S.distK || 1) + ((S.distGoal || 1) - (S.distK || 1)) * .05; }
 G.frame(t);
 if (!active) return;
 acc += dtm; n++;
 if (S.world) { if (dtm > STALL_MS) { stalled++; if (stalled >= 2) { stalled = 0; acc = 0; n = 0; S.fps = Math.max(1, Math.round(1000 / dtm)); if (!G.noGuard) G.stepDown(); X.caption(S); return; } } else stalled = 0;
 if (n >= 60 || (acc >= 1500 && n >= 8)) { S.fps = Math.round(1000 / (acc / n)); acc = 0; n = 0; X.caption(S); if (S.fps < 26 && !G.noGuard) { slow++; if (slow >= 2) { slow = 0; G.stepDown(); } } else slow = 0; } }
 };
 window.lapsFrame = frame; try { lapsFrame = frame; } catch (e) {}
 S.unmount = function(quiet){
 window.__gc3dGen = (window.__gc3dGen || 0) + 1;
 if (G.sound) try { G.sound.close(); } catch (e) {}
 if (X.hud) X.hud.unmount(S);
 document.querySelectorAll('canvas.gc3d,.gc3d-ui').forEach(e => e.remove());
 document.querySelectorAll('.shplate').forEach(p => { p.__gc3d = false; p.querySelectorAll('svg.shcircuit,svg.shhalo').forEach(e => { e.style.visibility = ''; }); });
 if (orig) { window.lapsFrame = orig; try { lapsFrame = orig; } catch (e) {} }
 if (!quiet && LAPS.cv && LAPS.raf) { cancelAnimationFrame(LAPS.raf); if (typeof lapsSize === 'function') lapsSize(); LAPS.raf = requestAnimationFrame(window.lapsFrame); }
 try { if (S.renderer) { S.renderer.dispose(); S.renderer.forceContextLoss(); } } catch (e) {}
 G.S = null;
 };
 S.cv.addEventListener('webglcontextlost', e => { e.preventDefault(); S.lost = true; });
 S.cv.addEventListener('webglcontextrestored', () => { if (G.S === S) G.mount(pack, look); });
 if (G.sound && typeof DATA !== 'undefined' && G.sound.setClips) try { G.sound.setClips(DATA.showSound || null); } catch (e) {}
 /* Three.js: build the scene the moment it is here; until then the flat circuit shows through */
 X.load().then(() => { if (G.S === S && !S.world) X.build(S); }).catch(e => { if (G.S === S) { G.failed = 'three.js: ' + (e && e.message || e); S.unmount(); } });
 if (LAPS.cv && LAPS.raf) { cancelAnimationFrame(LAPS.raf); LAPS.raf = requestAnimationFrame(window.lapsFrame); }
 return 'mounted · three.js · ' + ((pack && pack.b) ? pack.b.length : 0) + ' buildings';
};
X.caption = function(S){ if (!S.capEl || !S.creditNow) return; S.capEl.textContent = S.creditNow() + (S.cv.clientWidth < 700 ? '' : ' · ' + (S.renderer ? S.renderer.domElement.width + ' × ' + S.renderer.domElement.height + ' · ' : '') + (S.fps ? S.fps + ' fps' : '') + (S.qualityStep ? ' · ' + S.qualityStep + ' to hold the frame rate' : '')); };

/* ---------- one frame: step the world, place the camera, draw ---------- */
G.frame = function(tms){
 const S = G.S; if (!S) return;
 const now = tms / 1000, dt = S.last == null ? 0 : Math.min(.05, Math.max(0, now - S.last)); S.last = now;
 if (!S.world) return;
 if (S.paused) { if (S.needsRender) { X.render(S, 0); S.needsRender = false; } return; }
 const h = 1 / 120, maxSteps = 8; S.accum = Math.min(h * maxSteps, (S.accum || 0) + dt * (S.pace || 1));
 for (let k = 0; S.accum + 1e-9 >= h && k < maxSteps; k++) { X.step(S, h); S.accum -= h; }
 if (S.accum < 1e-9) S.accum = 0;
 X.render(S, dt);
 if (G.sound && G.sound.isOn && G.sound.isOn()) try { G.sound.tick(S); } catch (e) {}
 S.frames = (S.frames || 0) + 1;
};
/* deterministic still for a test: run the clock to T seconds in the named view, then draw */
G.renderAt = function(T, shotName){ const S = G.S; if (!S || !S.world || !Number.isFinite(T) || T < 0) return null;
 G.simReset(); G.setView(shotName || 'auto'); let t = 0; while (t < T) { X.step(S, 1 / 60); t += 1 / 60; } X.render(S, 1 / 60); return G.sceneReport(); };
})();
