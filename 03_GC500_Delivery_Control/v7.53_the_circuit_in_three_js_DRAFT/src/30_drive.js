/* v7.53 part 4 - THE DRIVE AND THE CAMERAS. The car runs the racing line worked out from the ring: it brakes into
 the corners, holds them at what the tyres allow, accelerates out, and rolls, pitches and steers as it does. A
 second car - plain white, no livery - shares the track so there is something to pass and be passed by. The
 cameras: a follow-cam, an onboard, a chase, a helicopter that orbits, an overhead of the whole circuit, trackside
 statics at the corners that pan and zoom as the car comes through, and a race director that cuts between them. */
(function(){
'use strict';
const G = window.GC3D; if (!G || !G.X) return;
const X = G.X, M = X.M;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* ---------- the scene: renderer, lights, car, rival ---------- */
X.build = function(S){
 const T3 = X.THREE; if (!T3 || S.world) return;
 const cv = S.cv;
 let renderer; try { renderer = new T3.WebGLRenderer({canvas: cv, antialias: !!S.quality.aa, alpha: true, powerPreference: 'high-performance'}); } catch (e) { G.failed = 'WebGL renderer: ' + (e && e.message || e); S.unmount(); return; }
 renderer.outputColorSpace = T3.SRGBColorSpace; renderer.toneMapping = T3.ACESFilmicToneMapping; renderer.toneMappingExposure = S.look.exposure;
 /* physically based light units: the sun in the look is a few 'lux', the floodlights and headlights are candela with inverse-square fall-off */
 if ('useLegacyLights' in renderer) renderer.useLegacyLights = false; else if ('physicallyCorrectLights' in renderer) renderer.physicallyCorrectLights = true;
 renderer.shadowMap.enabled = !!S.quality.shadows; renderer.shadowMap.type = T3.PCFSoftShadowMap;
 S.renderer = renderer; S.scene = new T3.Scene(); S.camera = new T3.PerspectiveCamera(55, 16 / 9, .3, 6000);
 /* lights */
 const L = S.look; S.sun = new T3.DirectionalLight(L.sun.col, L.sun.i); S.sun.castShadow = !!S.quality.shadows; S.sun.shadow.mapSize.set(S.quality.shadow, S.quality.shadow); S.sun.shadow.camera.near = 10; S.sun.shadow.camera.far = 600; S.sun.shadow.bias = -.0006; S.sun.shadow.normalBias = .02;
 const sc = S.sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; S.scene.add(S.sun); S.scene.add(S.sun.target);
 S.hemi = new T3.HemisphereLight(L.hemi[0], L.hemi[1], L.hemi[2]); S.scene.add(S.hemi);
 S.scene.fog = new T3.Fog(new T3.Color(L.fog[0]), L.fog[1], L.fog[2]);
 /* the world and the cars */
 X.buildWorld(S);
 S.car = X.buildCar(S, {kind: S.vehicle}); S.car.setKind(S.vehicle || 'car'); S.scene.add(S.car.group);
 S.rival = X.buildCar(S, {rival: true}); S.scene.add(S.rival.group);
 /* floodlights: a handful of real spotlights that follow the car round the corners at night */
 S.floods = []; for (let i = 0; i < Math.min(S.quality.lights, 6); i++) { const sp = new T3.SpotLight(0xdfe9ff, 0, 160, .55, .6, 2); sp.castShadow = false; const tg = new T3.Object3D(); S.scene.add(tg); sp.target = tg; S.scene.add(sp); S.floods.push(sp); }
 /* environment for the paint: the sky, once, through a PMREM */
 try { const pm = new T3.PMREMGenerator(renderer); const skyScene = new T3.Scene(); skyScene.add(S.world.sky.clone()); S.scene.environment = pm.fromScene(skyScene, .04).texture; pm.dispose(); } catch (e) {}
 X.applyLook(S, S.look);
 S.drive = X.makeDrive(S); S.cam3 = {mode: 'chase', t: 0, cut: true, eye: new T3.Vector3(), tgt: new T3.Vector3(), fov: 55, shake: 0, statIdx: -1, dirI: 0, dirT: 0};
 S.applyQuality = () => { const Q = S.quality; renderer.shadowMap.enabled = !!Q.shadows; S.sun.castShadow = !!Q.shadows; if (Q.shadows) S.sun.shadow.mapSize.set(Q.shadow, Q.shadow); S.sun.shadow.map = null; S.sizeDirty = true; };
 S.sizeDirty = true; X.fx && X.fx.build(S); if (X.hud && S.hudRoot) X.hud.show(S);
 S.world.built = true; S.needsRender = true;
 const plate = LAPS.cv && LAPS.cv.parentNode; if (plate && S.hideFlat) S.hideFlat(plate);
};
X.applyLook = function(S, look){
 const T3 = X.THREE; if (!S || !S.renderer || !S.world) return; S.look = look;
 S.renderer.toneMappingExposure = look.exposure;
 S.sun.color.set(look.sun.col); S.sun.intensity = look.sun.i; const az = look.sun.az, el = look.sun.el; S.sunDir = new T3.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)).normalize();
 S.hemi.color.set(look.hemi[0]); S.hemi.groundColor.set(look.hemi[1]); S.hemi.intensity = look.hemi[2];
 S.scene.fog.color.set(look.fog[0]); S.scene.fog.near = look.fog[1]; S.scene.fog.far = look.fog[2];
 const sky = S.world.sky; if (sky) { sky.material.uniforms.top.value.set(look.sky[0]); sky.material.uniforms.mid.value.set(look.sky[1]); sky.material.uniforms.bot.value.set(look.sky[2]); sky.material.uniforms.stars.value = look.stars; sky.material.uniforms.sunDir.value.copy(S.sunDir); sky.material.uniforms.sunCol.value.set(look.sun.col); }
 (S.world.buildings || []).forEach(m => { m.material.emissiveIntensity = look.windows * .9; });
 if (S.world.lampHeads) S.world.lampHeads.material.emissiveIntensity = look.day && look.floods === 0 ? .1 : 2.4;
 S.world.gantries.forEach(g => { g.mesh.material.emissiveIntensity = look.day && look.floods === 0 ? 0 : .35; });
 S.floods.forEach(sp => { sp.intensity = look.floods * 3400; sp.visible = look.floods > 0; });
 S.car.setLook(look); S.car.lookDay = !!look.day; S.rival.setLook(look);
 if (S.world.water) { S.world.water.material.color.set(look.day ? 0xffffff : 0x8090b0); }
 S.needsRender = true;
};

/* ---------- the drive: two cars on the racing line ---------- */
X.makeDrive = function(S){
 const Tk = X.track, T3 = X.THREE;
 const carLen = 4.9;
 const mk = (s0, factor, lane) => ({s: s0, v: 0, a: 0, brake: 0, lat: 0, latV: 0, roll: 0, pitch: 0, steer: 0, wheel: 0, factor, lane, lap: 0, lapT: 0, lastLap: null, best: null, sectorAt: 0});
 const D = {clock: 0, go: false, car: mk(Tk.startS, 1, 0), rival: mk((Tk.startS + 70) % Tk.L, .965, 2.6), burn: 0, passing: 0, sectors: [0, Tk.L / 3, 2 * Tk.L / 3]};
 D.reset = () => { D.clock = 0; D.go = false; D.burn = 0; D.passing = 0; Object.assign(D.car, mk(Tk.startS, 1, 0)); Object.assign(D.rival, mk((Tk.startS + 70) % Tk.L, .965, 2.6)); S.sim.go = false; S.sim.v = 0; };
 const gap = (a, b) => { let d = (b.s - a.s) % Tk.L; if (d < 0) d += Tk.L; return d > Tk.L / 2 ? d - Tk.L : d; };
 function stepCar(c, h, targetFactor){
 const vt = Tk.at(c.s, Tk.v) * targetFactor;
 const aBrake = 13.5, aAcc = 9.2 * (1 - .78 * c.v / Tk.vmax);
 const dv = vt - c.v; let a = clamp(dv / Math.max(h, .01), -aBrake, Math.max(1.2, aAcc));
 /* look ahead: start braking early enough for the corner that is coming */
 for (let look = 10; look <= 120; look += 10) { const vAhead = Tk.at(c.s + look, Tk.v) * targetFactor; const need = (c.v * c.v - vAhead * vAhead) / (2 * look); if (need > aBrake * .92) { a = Math.min(a, -aBrake); break; } else if (need > 0) a = Math.min(a, -need * 1.15); }
 c.a = a; c.v = Math.max(0, c.v + a * h); c.brake = a < -2 ? clamp(-a / aBrake, 0, 1) : 0;
 c.s += c.v * h; if (c.s >= Tk.L) { c.s -= Tk.L; c.lap++; c.lastLap = c.lapT; if (c.best == null || c.lapT < c.best) c.best = c.lapT; c.lapT = 0; } c.lapT += h;
 /* the line: racing line plus the lane offset (the pass), smoothed */
 const want = Tk.at(c.s, Tk.e) + c.lane; c.latV += (want - c.lat) * 6 * h - c.latV * 3.2 * h; c.lat += c.latV * h;
 const k = Tk.at(c.s, Tk.kap); const latAcc = c.v * c.v * k; /* m/s^2 */
 c.roll += ((clamp(latAcc / 14, -1, 1) * .055) - c.roll) * 5 * h; c.pitch += ((clamp(a / 12, -1, 1) * -.035) - c.pitch) * 5 * h;
 c.steer += ((clamp(k * 2.85 * 5.2, -.5, .5)) - c.steer) * 7 * h; c.wheel += c.v / .34 * h;
 }
 D.step = function(h){
 D.clock += h; S.clock = D.clock;
 if (!D.go) { if (D.clock >= G.GRID) { D.go = true; D.burn = 1; S.sim.go = true; } else { D.car.v = 0; D.rival.v = 0; D.burn = D.clock > 1.2 ? .6 : 0; S.sim.burn = D.burn; return; } }
 D.burn = Math.max(0, D.burn - h * .8); S.sim.burn = D.burn;
 /* the pass: when the two are close, the one behind moves to the other lane and gets a little more speed */
 const g = gap(D.car, D.rival); const near = Math.abs(g) < 26;
 let rf = D.rival.factor, cf = 1; if (near) { D.passing = clamp(D.passing + h * 1.5, 0, 1); } else D.passing = clamp(D.passing - h * 1.2, 0, 1);
 if (g > 0) { D.car.lane = lerp(D.car.lane, -2.4 * D.passing, h * 3); D.rival.lane = lerp(D.rival.lane, 2.4, h * 3); cf = 1 + .035 * D.passing; } else { D.car.lane = lerp(D.car.lane, 2.4 * D.passing * (g < -60 ? 0 : 1), h * 3); D.rival.lane = lerp(D.rival.lane, -2.2 * D.passing, h * 3); rf = g < -90 ? 1.06 : .965 + .06 * D.passing; }
 if (D.car.v < 1 && D.clock < G.GRID + .5) D.car.v = 1; if (D.rival.v < 1 && D.clock < G.GRID + .5) D.rival.v = .8;
 stepCar(D.car, h, cf); stepCar(D.rival, h, rf);
 /* what the sound reads, in the sheet's points */
 const c = D.car; S.sim.v = c.v / M; S.sim.brake = c.brake; S.sim.slip = clamp(c.v * c.v * Math.abs(Tk.at(c.s, Tk.kap)) / 17, 0, .3) * Math.sign(Tk.at(c.s, Tk.kap)); S.sim.s = c.s / M;
 S.vAt = sPt => Tk.at(sPt * M, Tk.v) / M; S.kmh = c.v * 3.6; S.gear = c.v < 1 ? 1 : Math.min(6, 1 + Math.floor(c.v / 13.5)); S.lap = c.lap; S.lapT = c.lapT; S.lastLap = c.lastLap; S.bestLap = c.best;
 };
 D.place = function(){ [D.car, D.rival].forEach((c, i) => { const p = Tk.pos(c.s, c.lat); /* the car's own +x is its nose: rotateY sends local +x to (cos, -sin) */ const heading = Math.atan2(-p.tz, p.tx); const api = i ? S.rival : S.car; api.pose(p.x, 0, p.z, heading, c.roll, c.pitch, c.steer, c.wheel, c.brake > .25); c.px = p.x; c.pz = p.z; c.heading = heading; c.tx = p.tx; c.tz = p.tz; });
 const c = D.car; S.pose = {pos: [c.px / M, 0, c.pz / M], fwd: [c.tx, 0, c.tz]}; };
 return D;
};
X.step = function(S, h){ S.drive.step(h); S.drive.place(); X.fx && X.fx.step(S, h); };

/* ---------- cameras ---------- */
const SHOT_LEN = {chase: 9, wide: 7.5, heli: 9, onboard: 5.5, detail: 4.5, top: 7, hero: 8, frontdetail: 4};
const DIRECTOR = ['chase', 'wide', 'heli', 'onboard', 'wide', 'detail', 'chase', 'top', 'wide', 'frontdetail', 'heli', 'wide'];
X.placeCamera = function(S, dt){
 const T3 = X.THREE, Tk = X.track, C = S.cam3, c = S.drive.car, cam = S.camera, R = S.rival && S.drive.rival;
 const car = new T3.Vector3(c.px, .55, c.pz), fwd = new T3.Vector3(c.tx, 0, c.tz), right = new T3.Vector3(-c.tz, 0, c.tx); /* the driver's right: fwd x up */
 /* which shot */
 let mode = S.view === 'auto' ? null : S.view;
 if (!mode) { C.dirT += dt; const name = DIRECTOR[C.dirI % DIRECTOR.length]; if (C.dirT > (SHOT_LEN[name] || 7) || C.cut) { if (!C.cut) { C.dirI++; } C.dirT = 0; C.cut = true; } mode = DIRECTOR[C.dirI % DIRECTOR.length]; }
 if (mode === 'hero') mode = 'chase'; /* the follow-cam is the chase */
 if (mode !== C.mode) { C.mode = mode; C.cut = true; C.t = 0; S.prevShot = S.shotName; S.camT = 0; }
 C.t += dt; S.camT += dt; S.shotName = mode; S.forceShot = mode; S.shotI = Math.max(-1, G.SHOTS.findIndex(x => x[0] === mode));
 let eye = new T3.Vector3(), tgt = new T3.Vector3(), fov = 55, lag = .12;
 const v = c.v, spd = clamp(v / Tk.vmax, 0, 1);
 if (mode === 'chase') { eye.copy(car).addScaledVector(fwd, -(9.5 + spd * 3.5)).addScaledVector(right, S.tune.shiftX * 3).setY(2.6 + spd * .6); tgt.copy(car).addScaledVector(fwd, 9).setY(.9); fov = 52 + spd * 10; lag = .1; }
 else if (mode === 'onboard') { eye.copy(car).addScaledVector(fwd, .9).addScaledVector(right, .38).setY(1.18); tgt.copy(car).addScaledVector(fwd, 40).setY(1.0); fov = 72; lag = 1; C.shake = spd; }
 else if (mode === 'heli') { const ang = C.t * .16 + 1.2; const rad = 70 + Math.sin(C.t * .21) * 14; eye.set(car.x + Math.cos(ang) * rad, 40 + Math.sin(C.t * .13) * 8, car.z + Math.sin(ang) * rad); tgt.copy(car).addScaledVector(fwd, 12); fov = 40 - smooth(C.t / 9) * 10; lag = .25; }
 else if (mode === 'top') { const mid = new T3.Vector3(lerp(0, car.x, .35), 0, lerp(0, car.z, .35)); eye.set(mid.x + 60, 420 + Math.sin(C.t * .1) * 20, mid.z + 40); tgt.copy(mid); fov = 48; lag = .6; }
 else if (mode === 'detail') { eye.copy(car).addScaledVector(fwd, -1.5).addScaledVector(right, 3.6).setY(.7); tgt.copy(car).addScaledVector(fwd, 1.4).setY(.6); fov = 42; lag = .05; }
 else if (mode === 'frontdetail') { eye.copy(car).addScaledVector(fwd, 7.5).addScaledVector(right, -2.4).setY(.75); tgt.copy(car).setY(.7); fov = 38; lag = .06; }
 else { /* wide: a trackside static at the next corner, panning and zooming as the car comes through */
 if (C.cut || C.statIdx < 0 || C.statS == null) { let best = null; Tk.corners.forEach(k => { let d = (k.s - c.s) % Tk.L; if (d < 0) d += Tk.L; if (d > 15 && d < 420 && (!best || d < best.d)) best = {k, d}; }); if (!best && Tk.corners.length) best = {k: Tk.corners[0], d: 0};
 if (best) { const k = best.k; C.statN = (C.statN || 0) + 1; const low = C.statN % 2 === 1;
 /* two trackside positions, taken in turn: a low camera on the wall inside the debris fence at the apex, and a
 platform behind the fence on the outside of the corner, above the fence line, looking down into it */
 const p = low ? Tk.pos(k.s + 6, -k.sign * (Tk.at(k.s, Tk.hw) + .7)) : Tk.pos(k.s + 14, k.sign * (Tk.at(k.s, Tk.hw) + 5.5));
 C.statS = k.s; C.stat = new T3.Vector3(p.x, low ? 1.25 : 6.4 + Math.random() * .8, p.z); C.statIdx = 1; } }
 let d = (C.statS - c.s) % Tk.L; if (d < 0) d += Tk.L; const passed = d > Tk.L / 2 ? Tk.L - d : -1;
 if (passed > 45) C.cut = true; /* the car has gone: next shot */
 /* long lens while the car is far, pulling wide as it arrives */
 eye.copy(C.stat || car); tgt.copy(car).setY(.7); const dist = eye.distanceTo(car); fov = clamp(62 - dist * .32, 16, 58); lag = .35; }
 /* smoothing: the cut is hard, the movement inside a shot is eased */
 if (C.cut) { C.eye.copy(eye); C.tgt.copy(tgt); C.fov = fov; C.cut = false; }
 else { const k = 1 - Math.exp(-dt / Math.max(.02, lag)); C.eye.lerp(eye, mode === 'onboard' ? 1 : k); C.tgt.lerp(tgt, mode === 'wide' ? k * 2.2 : k); C.fov += (fov - C.fov) * Math.min(1, dt * 2.2); }
 cam.position.copy(C.eye); if (mode === 'onboard' && C.shake) { cam.position.y += Math.sin(S.clock * 37) * .006 * C.shake; cam.position.x += Math.sin(S.clock * 29) * .004 * C.shake; }
 cam.lookAt(C.tgt); cam.fov = C.fov * (S.distK && S.distK > 1 ? 1 + (S.distK - 1) * .25 : 1); cam.updateProjectionMatrix();
 /* what the sound reads: in the sheet's points */
 S.cam = {eye: [cam.position.x / M, cam.position.y / M, cam.position.z / M], tgt: [C.tgt.x / M, C.tgt.y / M, C.tgt.z / M]};
 /* the sun follows the car so the shadow map stays sharp where it is looked at */
 S.sun.position.copy(car).addScaledVector(S.sunDir, 260); S.sun.target.position.copy(car); S.sun.target.updateMatrixWorld();
 /* floodlights: the nearest corners */
 if (S.floods.length && S.look.floods > 0) { const list = S.world.floods.map(f => ({f, d: Math.hypot(f.pos[0] - car.x, f.pos[2] - car.z)})).sort((a, b) => a.d - b.d); S.floods.forEach((sp, i) => { const f = list[i] && list[i].f; if (!f) { sp.visible = false; return; } sp.visible = true; sp.position.set(f.pos[0], f.pos[1], f.pos[2]); sp.target.position.set(f.at[0], 0, f.at[2]); sp.target.updateMatrixWorld(); }); }
};
X.render = function(S, dt){
 const T3 = X.THREE, r = S.renderer, cv = S.cv;
 /* size to the plate */
 const w = cv.clientWidth || 800, hgt = cv.clientHeight || 450, Q = S.quality, dpr = Math.min(window.devicePixelRatio || 1, Q.dpr) * (S.lowRes ? .7 : 1);
 let pw = Math.round(w * dpr), ph = Math.round(hgt * dpr); const lim = Math.sqrt(Q.pixels / Math.max(1, pw * ph)); if (lim < 1) { pw = Math.round(pw * lim); ph = Math.round(ph * lim); }
 if (S.sizeDirty || r.domElement.width !== pw || r.domElement.height !== ph) { r.setSize(pw, ph, false); S.camera.aspect = pw / Math.max(1, ph); S.sizeDirty = false; }
 X.placeCamera(S, dt || 0);
 if (X.fx) X.fx.beforeRender(S, dt || 0);
 r.render(S.scene, S.camera);
 if (X.hud) X.hud.update(S);
};
})();
