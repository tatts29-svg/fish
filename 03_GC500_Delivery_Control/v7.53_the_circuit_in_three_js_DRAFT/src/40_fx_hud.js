/* v7.53 part 5 - ROAD EFFECTS AND RACE CONTROL. Speed lines that stream past the camera at pace, tyre smoke off the
 line and under heavy braking, a heat shimmer of dust behind the car; and a restrained race-control strip over the
 plate: the car, its speed and gear, the lap clock and last lap, the sector, the camera in use, the countdown to
 race day and the flag. All of it decoration - the figures in the strip are the scene's own, never the record's. */
(function(){
'use strict';
const G = window.GC3D; if (!G || !G.X) return;
const X = G.X;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
X.fx = {
 build(S){ const T3 = X.THREE;
 /* speed lines: 140 short segments in camera space, redrawn every frame */
 const n = 140, pos = new Float32Array(n * 6); const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3));
 const m = new T3.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false}); const lines = new T3.LineSegments(g, m); lines.frustumCulled = false; lines.renderOrder = 20; S.scene.add(lines);
 const seeds = []; for (let i = 0; i < n; i++) seeds.push([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random()]);
 /* smoke: sprites pooled */
 const sc = document.createElement('canvas'); sc.width = sc.height = 64; const cg = sc.getContext('2d'); const gr = cg.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(235,235,230,.85)'); gr.addColorStop(1, 'rgba(235,235,230,0)'); cg.fillStyle = gr; cg.fillRect(0, 0, 64, 64);
 const smokeMat = new T3.SpriteMaterial({map: new T3.CanvasTexture(sc), transparent: true, opacity: .55, depthWrite: false}); const puffs = []; for (let i = 0; i < 40; i++) { const sp = new T3.Sprite(smokeMat.clone()); sp.visible = false; sp.scale.set(1, 1, 1); S.scene.add(sp); puffs.push({sp, life: 0, vx: 0, vy: 0, vz: 0}); }
 S.fx = {lines, pos, seeds, puffs, next: 0, acc: 0}; },
 step(S, h){ const F = S.fx; if (!F) return; const c = S.drive.car; const T3 = X.THREE;
 /* smoke off the line and under heavy braking */
 const rate = (S.drive.burn > .05 ? 40 * S.drive.burn : 0) + (c.brake > .7 && c.v > 20 ? 14 : 0);
 F.acc += rate * h; while (F.acc >= 1) { F.acc -= 1; const p = F.puffs[F.next++ % F.puffs.length]; const side = (F.next % 2) ? 1 : -1; p.sp.position.set(c.px - c.tx * 1.6 + c.tz * side * .8, .35, c.pz - c.tz * 1.6 - c.tx * side * .8); p.life = 1; p.vx = -c.tx * 2 + (Math.random() - .5) * 1.5; p.vz = -c.tz * 2 + (Math.random() - .5) * 1.5; p.vy = 1.2 + Math.random(); p.sp.visible = true; p.sp.scale.set(.8, .8, 1); p.sp.material.opacity = .5; }
 F.puffs.forEach(p => { if (!p.sp.visible) return; p.life -= h * .7; if (p.life <= 0) { p.sp.visible = false; return; } p.sp.position.x += p.vx * h; p.sp.position.y += p.vy * h; p.sp.position.z += p.vz * h; const s = .8 + (1 - p.life) * 3.2; p.sp.scale.set(s, s, 1); p.sp.material.opacity = .5 * p.life; }); },
 beforeRender(S, dt){ const F = S.fx; if (!F) return; const c = S.drive.car, cam = S.camera, mode = S.shotName; const T3 = X.THREE;
 const spd = clamp(c.v / X.track.vmax, 0, 1), on = (mode === 'chase' || mode === 'onboard' || mode === 'detail') && spd > .45;
 F.lines.material.opacity = on ? (spd - .45) * .55 : 0; if (!on) return;
 /* the lines live in front of the camera, streaming towards it */
 const fwd = new T3.Vector3(); cam.getWorldDirection(fwd); const right = new T3.Vector3().crossVectors(fwd, new T3.Vector3(0, 1, 0)).normalize(), up = new T3.Vector3().crossVectors(right, fwd).normalize();
 const t = S.clock * (6 + spd * 14); for (let i = 0; i < F.seeds.length; i++) { const sd = F.seeds[i]; const z = ((sd[2] * 30 + t * 3.5 * (1 + sd[2])) % 30); const d = 32 - z, sx = sd[0] * (1.4 + d * .22), sy = sd[1] * (.9 + d * .16) + .2; const a = new T3.Vector3().copy(cam.position).addScaledVector(fwd, d).addScaledVector(right, sx).addScaledVector(up, sy); const b = a.clone().addScaledVector(fwd, -1.6 - spd * 3); F.pos.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6); }
 F.lines.geometry.attributes.position.needsUpdate = true; }
};
/* ---------- race control ---------- */
X.hud = {
 mount(S, plate){ if (S.hudRoot) return; const d = document.createElement('div'); d.className = 'gc3d-ui gc3dx-hud'; d.setAttribute('aria-hidden', 'true'); d.hidden = true;
 d.innerHTML = '<div class="hx-car"><b>26</b><span>COATES<small>Industrial Solutions</small></span></div>'
 + '<div class="hx-speed"><b class="hx-kmh">0</b><em>km/h</em><i class="hx-gear">N</i></div>'
 + '<div class="hx-lap"><span class="hx-l">LAP <b class="hx-lapn">–</b></span><span class="hx-t"><b class="hx-lapt">0:00.0</b><em>last <i class="hx-last">–</i></em></span><span class="hx-sec"><i></i><i></i><i></i></span></div>'
 + '<div class="hx-right"><span class="hx-flag"><i></i><b>GREEN FLAG</b></span><span class="hx-cam">CHASE</span><span class="hx-cd"></span></div>';
 plate.appendChild(d); S.hudRoot = d; S.hudEls = {kmh: d.querySelector('.hx-kmh'), gear: d.querySelector('.hx-gear'), lapn: d.querySelector('.hx-lapn'), lapt: d.querySelector('.hx-lapt'), last: d.querySelector('.hx-last'), sec: [...d.querySelectorAll('.hx-sec i')], cam: d.querySelector('.hx-cam'), cd: d.querySelector('.hx-cd'), flag: d.querySelector('.hx-flag')}; },
 show(S){ if (S.hudRoot) S.hudRoot.hidden = false; },
 unmount(S){ if (S.hudRoot) { S.hudRoot.remove(); S.hudRoot = null; } },
 update(S){ const E = S.hudEls; if (!E || !S.hudRoot) return;
 /* the strip mounts with the plate and shows once the scene is built, whichever comes first */
 if (S.hudRoot.hidden) { if (S.world && S.world.built && S.drive) S.hudRoot.hidden = false; else return; }
 const c = S.drive.car; const T = X.track;
 E.kmh.textContent = Math.round(c.v * 3.6); E.gear.textContent = c.v < .5 ? 'N' : String(S.gear || 1);
 E.lapn.textContent = S.drive.go ? String(c.lap + 1) : '–'; const fmt = t => { if (t == null) return '–'; const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
 E.lapt.textContent = fmt(S.drive.go ? c.lapT : 0); E.last.textContent = fmt(c.lastLap);
 const sec = Math.min(2, Math.floor(c.s / (T.L / 3))); E.sec.forEach((el, i) => { el.className = i < sec ? 'done' : i === sec ? 'on' : ''; });
 const names = {chase: 'FOLLOW CAM', onboard: 'ONBOARD', heli: 'HELICOPTER', top: 'OVERHEAD', wide: 'TRACKSIDE', detail: 'CAR DETAIL', frontdetail: 'FRONT', hero: 'FOLLOW CAM'}; E.cam.textContent = names[S.shotName] || String(S.shotName || '').toUpperCase();
 if (!S.drive.go) { E.flag.querySelector('b').textContent = 'LIGHTS · ' + Math.max(0, Math.ceil(G.GRID - S.clock)); E.flag.className = 'hx-flag red'; } else { E.flag.querySelector('b').textContent = 'GREEN FLAG'; E.flag.className = 'hx-flag'; }
 if (!E.cdAt || Date.now() - E.cdAt > 1000) { E.cdAt = Date.now(); try { const d = (DATA.race_days || [])[0]; if (d) { const ms = new Date(d + 'T00:00:00+10:00') - Date.now(); const days = Math.max(0, Math.floor(ms / 86400000)); E.cd.textContent = days > 0 ? days + ' DAYS TO RACE DAY · 23–25 OCT' : 'RACE WEEK · 23–25 OCT'; } } catch (e) {} } }
};
})();
