/* v7.53 part 3 - THE CAR. The Coates #26: a purpose-built race coupe of this file's own geometry (an extruded side
 profile, a cabin, a splitter, a wing, four wheels), painted from a livery drawn on a canvas - Coates orange over
 black, the number 26 on the doors and the roof, COATES on the sills, GC500 on the bonnet. Headlights and tail
 lights are real lights at night and emissive by day; the brake lights follow the braking; the wheels turn with the
 road speed and steer with the corners. Coates plant (v6.53) rides the same rig in the same orange. */
(function(){
'use strict';
const G = window.GC3D; if (!G || !G.X) return;
const X = G.X;
const OR = 0xff6a13;
X.makeLivery = function(T){
 const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const g = c.getContext('2d');
 /* the atlas: left half = side (u 0..0.5), top-right = roof/bonnet (u .5..1, v 0..0.5), bottom-right = front/rear (u .5..1, v .5..1) */
 g.fillStyle = '#ff6a13'; g.fillRect(0, 0, 1024, 512);
 /* side: black lower band and a sweep */
 g.fillStyle = '#15181c'; g.fillRect(0, 300, 512, 212); g.beginPath(); g.moveTo(0, 300); g.lineTo(512, 240); g.lineTo(512, 300); g.closePath(); g.fill();
 g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(0, 292); g.lineTo(512, 232); g.lineTo(512, 240); g.lineTo(0, 300); g.closePath(); g.fill();
 g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#ffffff'; g.font = '800 italic 190px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; g.fillText('26', 256, 150);
 g.fillStyle = '#ff6a13'; g.font = '800 italic 78px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; g.fillText('COATES', 256, 400);
 g.fillStyle = '#9aa1a8'; g.font = '700 26px Inter,system-ui,sans-serif'; g.fillText('INDUSTRIAL SOLUTIONS · GC500 2026', 256, 470);
 /* roof and bonnet (u along the car, v across it): black centre stripe, the number reading from behind and above
 with its top towards the nose - the panel maps with canvas-right = nose and canvas-down = driver's right, so the
 digits are drawn turned a quarter clockwise */
 g.fillStyle = '#15181c'; g.fillRect(512, 60, 512, 136); g.fillStyle = '#ffffff'; g.fillRect(512, 56, 512, 4); g.fillRect(512, 196, 512, 4);
 g.save(); g.translate(720, 128); g.rotate(Math.PI / 2); g.fillStyle = '#ffffff'; g.font = '800 italic 118px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; g.fillText('26', 0, 0); g.restore();
 /* the bonnet word faces the cameras ahead of the car, so it is turned the other way */
 g.save(); g.translate(900, 128); g.rotate(-Math.PI / 2); g.fillStyle = '#ff6a13'; g.font = '800 italic 46px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; g.fillText('COATES', 0, 0); g.restore();
 /* front and rear faces (v 0..0.5, so canvas y 256..512; the faces themselves reach canvas y ~350..480) */
 g.fillStyle = '#15181c'; g.fillRect(512, 256, 512, 256); g.fillStyle = '#ff6a13'; g.fillRect(512, 396, 512, 62); g.fillStyle = '#ffffff'; g.font = '800 italic 52px "Barlow Condensed","Arial Narrow",Impact,sans-serif'; g.fillText('COATES', 768, 428);
 g.fillStyle = '#9aa1a8'; g.font = '700 22px Inter,system-ui,sans-serif'; g.fillText('GC500 · 2026', 768, 476);
 const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
};
/* the body: a coupe side profile extruded across the width, then rounded by normals; UVs pushed onto the atlas */
function bodyGeometry(T3, L, Wd, H){
 const s = new T3.Shape();
 /* a front-engined coupe: long bonnet, the cabin set back, a short high deck; x runs tail (-.5) to nose (+.5) */
 const P = [[-.5, .17], [-.5, .36], [-.47, .47], [-.40, .50], [-.30, .51], [-.24, .56], [-.12, .78], [.02, .84], [.13, .83], [.27, .62], [.33, .56], [.45, .50], [.5, .43], [.5, .30], [.5, .17], [.42, .13], [.36, .17], [.3, .13], [-.3, .13], [-.36, .17], [-.42, .13]];
 P.forEach(([x, y], i) => { if (i === 0) s.moveTo(x * L, y * H); else s.lineTo(x * L, y * H); }); s.closePath();
 const g = new T3.ExtrudeGeometry(s, {depth: Wd, bevelEnabled: true, bevelThickness: .09, bevelSize: .1, bevelSegments: 3, steps: 1});
 g.translate(0, 0, -Wd / 2); /* the shape's x is the car's length, the extrusion its width */
 /* UVs: sides use the side panel, top uses the roof panel, ends use the front/rear panel. The atlas is a canvas,
 so v = 1 is the top row of the drawing (three.js flips canvases on upload); words read left to right from
 outside the car, so u runs backwards on the faces seen from -z and from the rear. */
 const pos = g.attributes.position, nor = g.attributes.normal, uv = new Float32Array(pos.count * 2);
 const yN = y => Math.max(0, Math.min(1, (y / H - .1) / .78));
 for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), nx = nor.getX(i), ny = nor.getY(i), nz = nor.getZ(i);
 let u, v; if (Math.abs(nz) > .6) { u = (x / L + .5) * .5; if (nz < 0) u = .5 - u; v = yN(y); }
 else if (Math.abs(ny) > .6 || Math.abs(nx) < .6) { u = .5 + (x / L + .5) * .5; v = .5 + (.5 - z / Wd) * .5; }
 else { const zz = nx > 0 ? -z : z; u = .5 + (zz / Wd + .5) * .5; v = yN(y) * .5; }
 uv[i * 2] = Math.max(0, Math.min(1, u)); uv[i * 2 + 1] = Math.max(0, Math.min(1, v)); }
 g.setAttribute('uv', new T3.BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
X.buildCar = function(S, opts){
 const T3 = X.THREE, o = Object.assign({kind: 'car', rival: false}, opts || {});
 const L = 4.9, Wd = 1.96, H = 1.32; const car = new T3.Group(); car.name = o.rival ? 'rival' : 'car';
 const paint = new T3.MeshPhysicalMaterial({map: o.rival ? null : X.tex.livery, color: o.rival ? 0xf2f2ee : 0xffffff, roughness: .28, metalness: .35, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.2});
 if (o.rival) { paint.color.set(0xeef0f2); }
 const body = new T3.Mesh(bodyGeometry(T3, L, Wd, H), paint); body.castShadow = true; body.receiveShadow = false; body.name = 'body'; car.add(body);
 const dark = new T3.MeshStandardMaterial({color: 0x101216, roughness: .6, metalness: .3});
 const glass = new T3.MeshPhysicalMaterial({color: 0x0b1420, roughness: .05, metalness: .2, transmission: 0, transparent: true, opacity: .82, envMapIntensity: 1.6});
 /* glasshouse */
 const gs = new T3.Shape(); [[-.26, .58], [-.12, .8], [.02, .86], [.13, .85], [.29, .62]].forEach(([x, y], i) => i ? gs.lineTo(x * L, y * H) : gs.moveTo(x * L, y * H)); gs.closePath();
 const gg = new T3.ExtrudeGeometry(gs, {depth: Wd * .82, bevelEnabled: true, bevelThickness: .03, bevelSize: .03, bevelSegments: 2}); gg.translate(0, .005, -Wd * .41); const glassM = new T3.Mesh(gg, glass); glassM.name = 'glass'; car.add(glassM);
 /* splitter, diffuser, wing */
 const splitter = new T3.Mesh(new T3.BoxGeometry(.5, .05, Wd + .1), dark); splitter.position.set(L * .5 - .1, .16, 0); car.add(splitter);
 const wing = new T3.Mesh(new T3.BoxGeometry(.42, .04, Wd * .9), o.rival ? dark : new T3.MeshStandardMaterial({color: 0x15181c, roughness: .4})); wing.position.set(-L * .5 + .15, H * .72, 0); wing.rotation.z = .12; wing.castShadow = true; car.add(wing);
 for (let k = -1; k <= 1; k += 2) { const post = new T3.Mesh(new T3.BoxGeometry(.3, .24, .05), dark); post.position.set(-L * .5 + .22, H * .60, k * Wd * .3); car.add(post); const ep = new T3.Mesh(new T3.BoxGeometry(.44, .16, .03), dark); ep.position.set(-L * .5 + .15, H * .74, k * Wd * .45); car.add(ep); }
 /* mirrors, side skirts and the wheel arches that give the slab its haunches */
 for (let k = -1; k <= 1; k += 2) { const mr = new T3.Mesh(new T3.BoxGeometry(.16, .1, .22), o.rival ? dark : new T3.MeshStandardMaterial({color: OR, roughness: .35, metalness: .3})); mr.position.set(L * .2, H * .62, k * (Wd * .5 + .1)); car.add(mr);
 const sk = new T3.Mesh(new T3.BoxGeometry(L * .5, .08, .08), dark); sk.position.set(0, .16, k * (Wd * .5 + .02)); car.add(sk);
 [L * .29, -L * .29].forEach(ax => { const arch = new T3.Mesh(new T3.CylinderGeometry(.46, .46, .12, 16, 1, false, Math.PI / 2, Math.PI), dark); arch.rotation.x = Math.PI / 2; arch.position.set(ax, .34, k * (Wd * .5 - .02)); car.add(arch); }); }
 /* wheels */
 const tyre = new T3.MeshStandardMaterial({color: 0x0c0d0f, roughness: .95}), rim = new T3.MeshStandardMaterial({color: 0x2a2d31, roughness: .3, metalness: .85});
 const rimOr = new T3.MeshStandardMaterial({color: OR, roughness: .35, metalness: .6});
 const wheels = []; const wb = L * .58, tw = Wd * .5 - .08, r = .34;
 [[wb / 2, -tw], [wb / 2, tw], [-wb / 2, -tw], [-wb / 2, tw]].forEach(([x, z], i) => { const pivot = new T3.Group(); pivot.position.set(x, r, z); const spin = new T3.Group();
 const ty = new T3.Mesh(new T3.CylinderGeometry(r, r, .3, 20), tyre); ty.rotation.x = Math.PI / 2; ty.castShadow = true; spin.add(ty);
 const rm = new T3.Mesh(new T3.CylinderGeometry(r * .46, r * .46, .31, 12), rim); rm.rotation.x = Math.PI / 2; spin.add(rm);
 for (let sp = 0; sp < 5; sp++) { const spoke = new T3.Mesh(new T3.BoxGeometry(.06, r * 1.3, .05), o.rival ? rim : rimOr); spoke.rotation.z = sp * Math.PI * 2 / 5; spoke.position.z = .1; spin.add(spoke); }
 pivot.add(spin); car.add(pivot); wheels.push({pivot, spin, front: i < 2}); });
 /* lights */
 const headMat = new T3.MeshStandardMaterial({color: 0xffffff, emissive: 0xfff2d0, emissiveIntensity: 1.6, roughness: .2}), tailMat = new T3.MeshStandardMaterial({color: 0x550000, emissive: 0xff2a1a, emissiveIntensity: .5, roughness: .3});
 const heads = [], tails = [];
 /* the body's bevel carries the nose and tail .1 m past the profile, so the lights sit just proud of that */
 for (let k = -1; k <= 1; k += 2) { const h = new T3.Mesh(new T3.BoxGeometry(.08, .14, .5), headMat); h.position.set(L * .5 + .12, H * .36, k * Wd * .3); car.add(h); heads.push(h); }
 /* one tail light bar across the deck, and a pair of brake units at the corners */
 const bar = new T3.Mesh(new T3.BoxGeometry(.06, .07, Wd * .72), tailMat); bar.position.set(-L * .5 - .11, H * .42, 0); car.add(bar); tails.push(bar);
 for (let k = -1; k <= 1; k += 2) { const t = new T3.Mesh(new T3.BoxGeometry(.06, .16, .34), tailMat); t.position.set(-L * .5 - .11, H * .42, k * Wd * .36); car.add(t); tails.push(t); }
 const spots = []; if (!o.rival) for (let k = -1; k <= 1; k += 2) { const sp = new T3.SpotLight(0xfff1d6, 0, 90, .42, .55, 1.4); sp.position.set(L * .5, H * .42, k * Wd * .32); const tgt = new T3.Object3D(); tgt.position.set(L * .5 + 30, -.4, k * Wd * .32 + k * 2); car.add(tgt); sp.target = tgt; car.add(sp); spots.push(sp); }
 /* contact shadow: a soft dark disc under the car, on every look */
 const cs = document.createElement('canvas'); cs.width = cs.height = 128; const cg = cs.getContext('2d'); const grad = cg.createRadialGradient(64, 64, 8, 64, 64, 64); grad.addColorStop(0, 'rgba(0,0,0,.55)'); grad.addColorStop(1, 'rgba(0,0,0,0)'); cg.fillStyle = grad; cg.fillRect(0, 0, 128, 128);
 const shadow = new T3.Mesh(new T3.PlaneGeometry(L * 1.25, Wd * 1.6), new T3.MeshBasicMaterial({map: new T3.CanvasTexture(cs), transparent: true, depthWrite: false})); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .02; car.add(shadow);
 /* plant on the same rig: a forklift / boom / scissor / tractor silhouette in Coates orange, swapped in for the coupe */
 const plant = new T3.Group(); plant.visible = false; car.add(plant);
 const pm = new T3.MeshStandardMaterial({color: OR, roughness: .55, metalness: .25}), pd = dark;
 const buildPlant = kind => { while (plant.children.length) plant.remove(plant.children[0]); const add = (g, m, x, y, z) => { const mm = new T3.Mesh(g, m); mm.position.set(x, y, z); mm.castShadow = true; plant.add(mm); return mm; };
 if (kind === 'forklift') { add(new T3.BoxGeometry(2.2, 1.0, 1.4), pm, -.2, .9, 0); add(new T3.BoxGeometry(1.2, 1.4, 1.3), pd, -.4, 2.0, 0); add(new T3.BoxGeometry(.12, 2.6, 1.3), pd, 1.15, 1.6, 0); for (let k = -1; k <= 1; k += 2) add(new T3.BoxGeometry(1.1, .06, .12), pd, 1.7, .32, k * .4); }
 else if (kind === 'boom') { add(new T3.BoxGeometry(2.6, .9, 1.6), pm, 0, .8, 0); add(new T3.BoxGeometry(.9, .8, 1.2), pd, -.6, 1.6, 0); const arm = add(new T3.BoxGeometry(5.0, .32, .32), pm, 1.4, 3.0, 0); arm.rotation.z = .55; add(new T3.BoxGeometry(1.6, .9, .9), pd, 3.8, 5.0, 0); }
 else if (kind === 'scissor') { add(new T3.BoxGeometry(2.4, .7, 1.4), pm, 0, .7, 0); for (let i = 0; i < 4; i++) { const b = add(new T3.BoxGeometry(2.0, .08, .08), pd, 0, 1.2 + i * .5, .6); b.rotation.z = (i % 2 ? 1 : -1) * .5; const b2 = add(new T3.BoxGeometry(2.0, .08, .08), pd, 0, 1.2 + i * .5, -.6); b2.rotation.z = (i % 2 ? 1 : -1) * .5; } add(new T3.BoxGeometry(2.6, .1, 1.5), pm, 0, 3.3, 0); add(new T3.BoxGeometry(2.6, .9, .06), pd, 0, 3.8, .74); add(new T3.BoxGeometry(2.6, .9, .06), pd, 0, 3.8, -.74); }
 else if (kind === 'tractor') { add(new T3.BoxGeometry(2.6, 1.0, 1.3), pm, .2, 1.0, 0); add(new T3.BoxGeometry(1.1, 1.3, 1.2), pd, -.8, 2.1, 0); add(new T3.BoxGeometry(.3, .8, .3), pd, 1.3, 1.9, 0); } };
 const api = {group: car, body, wheels, heads, tails, spots, headMat, tailMat, paint, kind: 'car', plant,
 setKind(k){ api.kind = k; const isCar = !G.PLANT[k]; body.visible = isCar; glassM.visible = isCar; wing.visible = isCar; splitter.visible = isCar; plant.visible = !isCar; if (!isCar) buildPlant(k); },
 setLook(look){ heads.forEach(h => { h.material.emissiveIntensity = look.day ? .35 : 2.0; }); spots.forEach(sp => { sp.intensity = look.headlights * 900; sp.decay = 2; sp.visible = look.headlights > .3; }); tailMat.emissiveIntensity = look.day ? .5 : 1.2; },
 /* place from the drive: position, heading, roll/pitch, steer and wheel spin */
 pose(x, y, z, heading, roll, pitch, steer, wheelAngle, braking){ car.position.set(x, y, z); car.rotation.set(0, 0, 0); car.rotateY(heading); car.rotateZ(pitch); car.rotateX(roll);
 wheels.forEach(w => { w.pivot.rotation.y = w.front ? steer : 0; w.spin.rotation.z = -wheelAngle; }); tailMat.emissiveIntensity = (braking ? 3.2 : .5) * (api.lookDay ? 1 : 1.3); tailMat.emissive.set(braking ? 0xff1a08 : 0xff2a1a); }};
 return api;
};
})();
