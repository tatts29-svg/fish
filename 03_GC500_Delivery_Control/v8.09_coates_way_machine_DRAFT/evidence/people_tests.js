// THE PEOPLE, CHECKED IN THE REAL MACHINE (v8.09). Author: Andrew Fisher. Read only: the rig serves the folder from disk and fetches
// models and sounds from the live machine by GET; nothing is sent anywhere.
//
// Andrew Fisher, 2 Oct 2026: "The guy who is the driver looks like he crawls out of vehicle. Make this all 4k crystal clear. Improve
// every thing on here. 10/10". The man he saw is the safety control officer (white helmet with the 26, SAFETY vest), who stood and
// walked on the far aisle behind the car, where the car hid him from the knees down in the car and V8 powertrain views.
//
// What is checked, in the page, with the drawing loop stopped and the machine stepped by its own fast-forward (window.__cw.advance):
//   1. clear of the car — every person's body (everything but the hands and forearms, which may touch a tyre or a valve at work) is
//      sampled from the skinned mesh as drawn and must not enter the car's box while standing or walking, and must not enter any of
//      the car's parts' boxes (shrunk 2 cm) at any time; the seated race driver is the one exception, and he must be inside it:
//      helmet under the roof (a ray up from the helmet meets the car above it, clear of the shell), his gloves on the rim;
//   2. clear of everything else — the hall's machines, stands, consoles, the desk and the forklift (each person's own seat and
//      truck excepted): no body sample inside any of their boxes (shrunk 2 cm);
//   3. on the floor — whoever is not seated has a sole within 3 cm of the floor under him, and no sole more than 1.5 cm into it;
//   4. no sliding — a planted foot's toe pivot moves under 5 mm between samples;
//   5. not over the car from the opening cameras — from the car view's and the V8 powertrain view's cameras (as the page fits them,
//      on this screen), nobody standing still has his feet hidden by the car while his helmet shows over it (the "crawling out of the
//      car" look); people moving or working at the far side are reported, with the time it lasted; a pause on the way counts as moving
//      for 1.5 s only, and the race driver out of his car is checked too (v8.09 review); and the race driver, at every sample, from the
//      camera actually in use (the camera comes round to his door while he gets out and back in — v8.09 follow-up);
//   6. no page errors; the people's draws and triangles.
// Scenarios: the hall at rest (crew doing their chores, 300 s — five simulated minutes), the V8 started and running (40 s), a far-rear wheel service end to
// end (to 200 s), and Explode (the race driver's walk-out, 40 s).
//
//   cd 03_GC500_Delivery_Control
//   CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node v8.09_coates_way_machine_DRAFT/evidence/people_tests.js [work|base] [desk|phone|both] [out.json]
const path = require('path'), fs = require('fs');
const {openMachine} = require('./machine_rig');
const wait = ms => new Promise(r => setTimeout(r, ms));
const which = process.argv[2] || 'work', devices = (process.argv[3] || 'both') === 'both' ? ['desk', 'phone'] : [process.argv[3]], outFile = process.argv[4] || null;
const ROOT = path.isAbsolute(which) ? which : path.join(__dirname, '..', which);   /* work, base, or a folder (a copy with a proposed edit) */

/* ---------------------------------------------------------------- in the page */
async function setup(P) {
  /* the drawing loop stopped (a software renderer takes seconds a frame); the page's classes found from its own objects */
  return P.evaluate(() => {
    const cw = window.__cw; cw.renderer.setAnimationLoop(null);
    const scene = cw.scene, crew = cw.crew, carBox = cw.carBox.clone(), Box3 = carBox.constructor, Vec = carBox.min.constructor;
    const driver = cw.cockpit.driver;
    let carRoot = driver; while (carRoot.parent && carRoot.parent !== scene) carRoot = carRoot.parent;
    /* the car is every top-level group whose meshes lie inside the car's box (grown 0.7 m): the body, the mechanical assemblies, the cog */
    const tops = scene.children.map(c => { const b = new Box3(); let n = 0; c.traverse(o => { if (o.isMesh && o.geometry && o.visible !== false) { n++; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); b.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } }); return {c, b, n, name: c.name || c.type}; });
    const big = carBox.clone().expandByScalar(.7), carRoots = tops.filter(t => t.c !== crew.root && t.n > 5 && !t.b.isEmpty() && big.containsBox(t.b)).map(t => t.c);
    if (!carRoots.includes(carRoot)) carRoots.push(carRoot);
    const studio = tops.filter(t => t.c !== crew.root && !carRoots.includes(t.c) && t.n > 50).map(t => t.c);
    window.__ptState = {carRoots, studio, carBox, Box3, Vec, tops: tops.map(t => [t.name, t.n])};
    const rimNames = []; for (const r of carRoots) r.traverse(o => { if (/rim/i.test(o.name) && rimNames.length < 12) rimNames.push(o.name); });
    window.__ptState.rimNames = rimNames;
    return {rimNames, tops: tops.map(t => [t.name, t.n, t.b.isEmpty() ? null : [t.b.min.toArray().map(v => +v.toFixed(2)), t.b.max.toArray().map(v => +v.toFixed(2))]]), carRoots: carRoots.map(c => c.name), studio: studio.map(c => c.name), carBox: [carBox.min.toArray(), carBox.max.toArray()]};
  });
}

/* the checks, run once per sample; they accumulate into window.__ptAcc */
async function sample(P, label) {
  return P.evaluate(label => {
    const cw = window.__cw, S = window.__ptState, crew = cw.crew, {Box3, Vec} = S, ray = window.__ptRay;
    const A = window.__ptAcc || (window.__ptAcc = {samples: 0, people: {}, seatChecks: [], seatWorst: null, over: {}});
    A.samples++;
    const isUnder = (o, r) => { for (let p = o; p; p = p.parent) if (p === r) return true; return false; };
    const shown = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
    const M4 = cw.camera.matrixWorld.constructor;
    /* SOLIDS: each mesh with its world box (for a quick reject), its inverse matrix and its own geometry box (an oriented box, so a strap
       or a door at an angle is not its whole bounding square), and the mesh itself for the last word: a point is inside a solid when
       rays from it upward and sideways both cross its surface an odd number of times */
    const solids = (roots, filter) => { const out = []; for (const r of roots) r.traverse(o => {
      if (!(o.isMesh || o.isInstancedMesh) || o.isSkinnedMesh || !o.geometry || !o.geometry.attributes.position) return; if (o.material && o.material.visible === false) return; if (!shown(o)) return; if (filter && !filter(o)) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const gb = o.geometry.boundingBox;
      if (o.isInstancedMesh) { const m = new M4(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); const w = m.clone().premultiply(o.matrixWorld); out.push({o, w, inv: w.clone().invert(), gb, wb: gb.clone().applyMatrix4(w), inst: true, name: (o.name || o.parent.name) + '#' + i}); } return; }
      out.push({o, w: o.matrixWorld, inv: o.matrixWorld.clone().invert(), gb, wb: gb.clone().applyMatrix4(o.matrixWorld), inst: false, name: o.name || o.parent && o.parent.name}); }); return out; };
    const lp = new Vec(), dirs = [new Vec(0, 1, 0), new Vec(.57735, -.57735, .57735)];
    const inside = (sol, pt, margin) => {
      if (!sol.wb.containsPoint(pt)) return false;
      lp.copy(pt).applyMatrix4(sol.inv); const sc = Math.max(1e-6, sol.w.getMaxScaleOnAxis()), m = margin / sc, g = sol.gb;
      if (lp.x < g.min.x + m || lp.x > g.max.x - m || lp.y < g.min.y + m || lp.y > g.max.y - m || lp.z < g.min.z + m || lp.z > g.max.z - m) return false;
      if (sol.inst) return true;
      const mats = [].concat(sol.o.material), sides = mats.map(x => x.side); mats.forEach(x => x.side = 2);
      let odd = true;
      for (const d of dirs) { const hits = []; ray.set(pt, d); ray.near = 0; ray.far = 50; sol.o.raycast(ray, hits); const ds = hits.map(h => h.distance).sort((a, b) => a - b).filter((x, i, a) => !i || x - a[i - 1] > 1e-4); if (ds.length % 2 === 0) { odd = false; break; } }
      mats.forEach((x, i) => x.side = sides[i]); return odd; };
    /* what each body point is tested against: the car's parts (not the seated driver), the hall (what stands on the floor below 2.2 m, no
       wall, floor or roof), and the crew's props */
    const driverG = cw.cockpit.driver;
    const carSolids = solids(S.carRoots, o => !(driverG && isUnder(o, driverG)));
    const hallSolids = solids(S.studio, o => true).filter(q => { const sz = q.wb.getSize(new Vec()); return q.wb.max.y > .06 && q.wb.min.y < 2.2 && sz.x < 8 && sz.z < 8; });
    const props = crew.props, propSolids = [];
    for (const [k, o] of [['station', props.station.desk], ['forklift', props.forklift.root], ['rack', props.rack], ['load', props.forklift.load], ['gun', props.gun]]) { o.updateMatrixWorld(true); for (const q of solids([o], o2 => !o2.name.startsWith('exhibit-'))) propSolids.push({...q, k, name: k + ': ' + q.name}); }
    const carBox = S.carBox.clone();   /* the car together, as it stood at the start (the live box grows with a wheel off or the car apart) */
    /* everyone */
    const people = Object.entries(crew.men).map(([k, m]) => ({k, m, fig: m.fig}));
    /* v8.09 review: the race driver out of his car is checked like everyone else — his own walker (window.__cw.driverMan): the floor, sliding, and
       the opening cameras, which a stand-in with no walker (m: null, always "moving") never was */
    const ex = cw.driverExit, dm = cw.driverMan; if (ex && ex.state !== 'seated' && dm && dm.fig.root.visible) people.push({k: 'race driver, walking', m: dm, fig: dm.fig, driver: true});
    const v = new Vec(), clock = +(cw.__ptClock || 0).toFixed(2);
    for (const p of people) {
      const mesh = p.fig.mesh || p.fig.root.children.find(c => c.isSkinnedMesh); if (!mesh || !shown(mesh)) continue;
      mesh.updateMatrixWorld(true); mesh.skeleton.update();
      const R = A.people[p.k] || (A.people[p.k] = {samples: 0, counts: {}, maxSlide: 0, minSole: 9, maxSole: -9, worst: {}, post: {}});
      R.samples++; const post = p.m ? p.m.post.kind : 'stand'; R.post[post] = (R.post[post] || 0) + 1;
      /* on the move: walking, turning or stepping. v8.09 review: a pause on the way (waiting for someone to pass, giving way, waiting for a
         door) counts as on the move for 1.5 s and no longer — "moving or on his way" counted every pause, however long, as moving */
      /* (on his way he is moving only while he gets somewhere — held up, his feet mark time on the spot; turning or settling his feet counts once
         the walk is done; faceYaw is kept from the start of a walk for its end) */
      const walking = p.m ? (p.m.path ? p.m.v > .05 : (p.m.faceYaw !== null || p.m.feet.some(f => !f.planted || f.step))) : true;
      const paused = !!p.m && !walking && (!!p.m.path || !!p.m.goal || !!p.m.yielding);
      if (p.m) { if (!paused) p.m.__ptPauseAt = null; else if (p.m.__ptPauseAt == null) p.m.__ptPauseAt = clock; }
      const pausedFor = paused ? clock - p.m.__ptPauseAt : 0;
      if (paused) R.longestPause = Math.max(R.longestPause || 0, +pausedFor.toFixed(2));
      const seated = post === 'sit', moving = walking || (paused && pausedFor <= 1.5);
      const at = [+p.fig.root.position.x.toFixed(2), +p.fig.root.position.z.toFixed(2)];
      const bad = (what, extra = {}) => { R.counts[what] = (R.counts[what] || 0) + 1; const w = R.worst[what] || (R.worst[what] = []); if (w.length < 3) w.push({t: clock, label, post, at, ...extra}); };
      const names = mesh.skeleton.bones.map(b => b.name.split(', ').pop());
      const si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight, n = mesh.geometry.attributes.position.count;
      const core = new Box3(), soles = [9, 9], pts = [], ptBone = [];
      for (let i = 0; i < n; i += 4) {
        let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
        const bn = names[best]; mesh.getVertexPosition(i, v); v.applyMatrix4(mesh.matrixWorld);
        if (/^(foot|toe)L/.test(bn)) soles[0] = Math.min(soles[0], v.y); else if (/^(foot|toe)R/.test(bn)) soles[1] = Math.min(soles[1], v.y);
        if (/^(fore|hand)/.test(bn)) continue;   /* hands and forearms may touch what they work on */
        core.expandByPoint(v); pts.push(v.clone()); ptBone.push(bn);
      }
      const firstInside = (list, skip) => { for (const q of list) { if (skip && skip(q)) continue; if (!core.intersectsBox(q.wb)) continue; for (let j = 0; j < pts.length; j++) if (inside(q, pts[j], .02)) return q.name + ' (his ' + ptBone[j] + ')'; } return null; };
      /* 1. the car: standing or walking, nobody's body inside the car's box; at any time, nobody's body inside any part of it */
      /* at work: reaching, kneeling, crouching or bent over something, or one of the wheel service's three while a service is under way */
      const inService = cw.service.phase !== 'ready' || cw.service.state.clearing;
      const working = p.m ? (p.m.hands.some(h => h.target && h.w > .2) || post !== 'stand' || p.m.bend > .2 || (inService && ['mechanic', 'tech', 'lead'].includes(p.k))) : false;
      if (!seated && moving && !working && core.intersectsBox(carBox.clone().expandByScalar(-.01))) bad('walking inside the car box');
      /* (the wheel off the car is in the mechanic's hands, and goes past his knees onto the hub: contact, not a clash) */
      const svcWheel = cw.service.state.wheel, carried = svcWheel && (crew.S.carry || cw.service.state.wheelIsOff) && ['mechanic', 'tech'].includes(p.k);
      const hc = firstInside(carSolids, q => carried && isUnder(q.o, svcWheel)); if (hc) bad('body inside the car', {part: hc});
      if (!seated) (A.__cores || (A.__cores = [])).push({k: p.k, core: core.clone(), at, post, pts});
      /* 2. the hall and the props (his own seat, truck, load or the rack he carries excepted) */
      const hh = firstInside(hallSolids); if (hh) bad('body inside a hall object', {part: hh});
      const hp = firstInside(propSolids, q => (p.k === 'operator' && q.k === 'station') || (p.k === 'driver' && (q.k === 'forklift' || q.k === 'load')) || (p.k === 'tech' && q.k === 'rack') || (p.k === 'mechanic' && q.k === 'gun'));
      if (hp) bad('body inside a prop', {part: hp});
      /* 3. the floor */
      if (!seated && p.m) { const fl = p.m.floor(p.fig.root.position.x, p.fig.root.position.z); const lo = Math.min(...soles) - fl;
        R.minSole = Math.min(R.minSole, lo); R.maxSole = Math.max(R.maxSole, lo);
        if (lo > .03 && post !== 'kneel') bad('both feet off the floor', {cm: +(lo * 100).toFixed(1)});
        const under = Math.min(...soles.map((sy, i) => { const f = p.m.feet[i]; return sy - Math.min(p.m.floor(f.toe.x, f.toe.z), p.m.floor(f.ankle.x, f.ankle.z)); })); if (under < -.015) bad('a sole into the floor', {cm: +(under * 100).toFixed(1)}); }
      /* 4. sliding */
      if (p.m) { const prev = p.m.__ptToe || []; const now = p.m.feet.map(f => ({planted: f.planted && !f.step, toe: f.toe.clone()}));
        now.forEach((f, i) => { if (f.planted && prev[i] && prev[i].planted && p.m.post.kind === 'stand') { const d = f.toe.distanceTo(prev[i].toe); R.maxSlide = Math.max(R.maxSlide, d); if (d > .005) bad('a planted foot slid', {mm: +(d * 1000).toFixed(1)}); } });
        p.m.__ptToe = now; }
      /* 5. over the car, from the opening cameras: his feet hidden by the car, his helmet seen over it. Follow-up: every sample, not every fourth;
         and with no far-side wheel service running, nobody of the crew may be seen so at all — walking, standing or at a chore. "Moving" and
         "at work" excuse it only while a far-side service is actually under way (the crew at the far wheel are working on the car). */
      const svcW = cw.service.state.wheel, farSvc = !!svcW && svcW.userData.side !== 'near' && (cw.service.phase !== 'ready' || !!cw.service.state.clearing);
      if (!seated && window.__ptCams) {
        const head = new Vec(); mesh.skeleton.bones[4].getWorldPosition(head); head.y += .2;
        const foot = new Vec(p.fig.root.position.x, Math.max(0, Math.min(...soles)) + .03, p.fig.root.position.z);
        const fp = [-2.62, -1.12, 2.62, 1.12], gap = Math.hypot(Math.max(fp[0] - foot.x, 0, foot.x - fp[2]), Math.max(fp[1] - foot.z, 0, foot.z - fp[3]));
        /* (beside the car is "at work" for the crew; the race driver's only work there is getting in and out, crouched in his doorway: standing
           beside his door he is checked like anyone standing still — v8.09 review) */
        const kind = p.m && !p.driver && !farSvc ? 'idle' : moving ? 'moving' : (gap < .8 && !p.driver) || working ? 'at work' : 'still';
        for (const c of window.__ptCams) {
          const hidden = q => { const dir = q.clone().sub(c.p), L = dir.length(); dir.normalize(); ray.set(c.p, dir); ray.far = L - .08; ray.near = 0;
            return ray.intersectObjects(S.carRoots, true).some(h => shown(h.object) && !(driverG && isUnder(h.object, driverG))); };
          if (hidden(foot) && !hidden(head)) { const key = p.k + ' · ' + c.name; const o = A.over[key] || (A.over[key] = {still: 0, stillApart: 0, moving: 0, 'at work': 0, idle: 0, samples: []}); o[kind === 'still' && /explode/.test(label) ? 'stillApart' : kind]++; if (o.samples.length < 4 || (['still', 'idle'].includes(kind) && o.samples.filter(x => x.kind === kind).length < 3)) o.samples.push({t: clock, at, post, label, kind, goal: p.m && p.m.goal ? p.m.goal.to.map(v => +(+v).toFixed(2)) : null}); }
        }
      }
      /* 5b. v8.09 follow-up: the race driver from the camera actually in use at this moment (it comes round to his door while he gets out and
         back in): at every sample — crouched in the doorway, standing or walking — never his feet hidden by the car (its open door
         included) with his head seen over it */
      if (p.driver && ray) { const cp = cw.camera.position.clone(), head = new Vec(); mesh.skeleton.bones[4].getWorldPosition(head); head.y += .2;
        const foot = new Vec(p.fig.root.position.x, Math.max(0, Math.min(...soles)) + .03, p.fig.root.position.z);
        const hid = q => { const dir = q.clone().sub(cp), L = dir.length(); dir.normalize(); ray.set(cp, dir); ray.far = L - .08; ray.near = 0; return ray.intersectObjects(S.carRoots, true).some(h => shown(h.object) && !(driverG && isUnder(h.object, driverG))); };
        A.inUse = (A.inUse || 0) + 1;
        if (hid(foot) && !hid(head)) bad('seen over the car from the camera in use', {cam: cp.toArray().map(v => +v.toFixed(2)), phase: cw.driverExit.phase}); }
    }
    /* people clear of one another: no point of one body within 3 cm of a point of another */
    { const cs = A.__cores || []; for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i].core, b = cs[j].core;
        let touch = false; if (a.intersectsBox(b)) { const P1 = cs[i].pts, P2 = cs[j].pts; for (let x = 0; x < P1.length && !touch; x += 3) { const p1 = P1[x]; if (!b.containsPoint(p1)) continue; for (let y = 0; y < P2.length; y += 3) if (p1.distanceToSquared(P2[y]) < .0009) { touch = true; break; } } }
        if (touch) { const key = cs[i].k + ' and ' + cs[j].k; const R = A.people[cs[i].k]; R.counts['into ' + cs[j].k] = (R.counts['into ' + cs[j].k] || 0) + 1; const w = R.worst['into ' + cs[j].k] || (R.worst['into ' + cs[j].k] = []); if (w.length < 3) w.push({t: clock, label, at: cs[i].at, other: cs[j].at}); } }
      A.__cores = []; }
    /* the seated race driver: in his seat, under the roof, gloves on the rim */
    if (driverG && shown(driverG)) { driverG.updateMatrixWorld(true); const helmet = driverG.getObjectByName('Helmet'), hc = new Vec(); helmet.getWorldPosition(hc);
      const hb = new Box3().setFromObject(helmet), top = hb.max.y;
      ray.set(new Vec(hc.x, top + 1.5, hc.z), new Vec(0, -1, 0)); ray.near = 0; ray.far = 3;
      const hits = ray.intersectObjects(S.carRoots, true).filter(x => shown(x.object) && !isUnder(x.object, driverG));
      const roof = hits.find(x => x.point.y > hc.y), roofGap = roof ? +(roof.point.y - top).toFixed(3) : null;
      const glove = []; driverG.traverse(o => { if (o.isMesh && o.name === 'Driver, glove') glove.push(new Box3().setFromObject(o)); });
      const rims = []; S.carRoots.forEach(r => r.traverse(o => { if (/^steering wheel rim/i.test(o.name) && !isUnder(o, driverG)) rims.push(o); }));
      const rimBox = rims.length ? rims.reduce((b, o) => b.union(new Box3().setFromObject(o)), new Box3()) : null;
      const dist = (a, b) => { const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x), dy = Math.max(0, a.min.y - b.max.y, b.min.y - a.max.y), dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z); return Math.hypot(dx, dy, dz); };
      const rec = {label, helmetTop: +top.toFixed(3), roofGap, roofPart: roof ? roof.object.name : null, insideCarBox: carBox.containsPoint(hc), gloveToRim: rimBox ? +Math.max(...glove.map(g => dist(g, rimBox))).toFixed(3) : null, rims: rims.map(o => o.name).slice(0, 3)};
      if (A.seatChecks.length < 2) A.seatChecks.push(rec);
      const worse = r => (r.roofGap !== null && r.roofGap < .01) || !r.insideCarBox || (r.gloveToRim !== null && r.gloveToRim > .01);
      if (worse(rec) && !A.seatWorst) A.seatWorst = rec; }
    return A.samples;
  }, label);
}

async function run(device) {
  const mob = device === 'phone', t0 = Date.now(), log = (...a) => console.log(`[${which} ${device} ${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...a);
  const m = await openMachine({root: ROOT, W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: mob ? 2 : 1, mobile: mob});
  const P = m.page;
  for (let i = 0; i < 400; i++) { if (await P.evaluate(() => !!(window.__cw && window.__cw.renderer && document.getElementById('loading').hidden)).catch(() => false)) break; await wait(2000); }
  log('ready');
  const info = await setup(P); log('car', JSON.stringify(info.carRoots), 'hall', JSON.stringify(info.studio), 'rims', JSON.stringify(info.rimNames));
  /* the opening cameras as the page fits them on this screen: the car view's (now) and the V8 powertrain view's (its fit's end) */
  const cams = await P.evaluate(() => { const cw = window.__cw, out = []; const Vec = cw.carBox.min.constructor;
    out.push({name: 'car view', p: cw.camera.position.clone()});
    cw.setView('engine'); const tw = cw.tween; out.push({name: 'V8 powertrain view', p: tw && tw.to ? tw.to.clone() : cw.camera.position.clone()});
    cw.setView('car'); if (cw.tween && cw.tween.to) out[0].p = cw.tween.to.clone();
    return out.map(c => ({name: c.name, p: c.p.toArray()})); });
  log('cameras', JSON.stringify(cams));
  await P.addScriptTag({type: 'module', content: `import * as T from './vendor/three.module.js'; window.__ptRay = new T.Raycaster(); window.__ptRay.layers.enableAll(); window.__ptRay.camera = window.__cw.camera; window.__ptCams = ${JSON.stringify(cams)}.map(c => ({name: c.name, p: new T.Vector3(...c.p)}));`});
  for (let i = 0; i < 30 && !(await P.evaluate(() => !!window.__ptRay)); i++) await wait(500);
  const step = async (sec, label, every = .25) => { for (let s = 0; s < sec; s += every) { await P.evaluate(([dt]) => { window.__cw.advance(dt, 1 / 30); window.__cw.__ptClock = (window.__cw.__ptClock || 0) + dt; }, [every]); await sample(P, label); } };
  /* 1. the hall at rest: the crew at their chores */
  await sample(P, 'rest'); await step(+(process.env.REST || 300), 'rest'); log('rest done');   /* (follow-up: five simulated minutes of the hall at rest) */
  /* 2. the V8 started and running */
  await P.evaluate(() => document.getElementById('start').click()); await step(40, 'V8 running'); await P.evaluate(() => document.getElementById('start').click()); await step(12, 'V8 stopping'); log('running done');
  /* 3. a wheel service on the far rear wheel, end to end */
  const svc = await P.evaluate(() => { const s = window.__cw.service.state, w = s.wheels.find(x => x.userData.side !== 'near') || s.wheels[0]; return {ok: s.choose(w.userData.id), id: w.userData.id}; });
  log('service on', JSON.stringify(svc));
  let phases = [];
  for (let k = 0; k < 800; k++) {
    const st = await P.evaluate(done => { const cw = window.__cw, s = cw.service.state; let r = null; if (!s.moving && !s.hold && !s.clearing && !(done && s.phase === 'ready')) r = cw.service.step(); return {phase: s.phase, hold: s.hold, moving: s.moving, clearing: s.clearing, r: r && r.reason}; }, phases.includes('refit'));
    if (!phases.length || phases[phases.length - 1] !== st.phase) phases.push(st.phase);
    if (phases.includes('refit') && st.phase === 'ready' && !st.clearing) break;
    await step(.5, 'far wheel service');
  }
  log('service phases', phases.join(' → ')); await step(20, 'after the service');
  /* 4. Explode: the race driver gets out first and walks clear; then back together and back in */
  await P.evaluate(() => document.getElementById('explode').click()); await step(30, 'explode: driver out');
  const de = await P.evaluate(() => window.__cw.driverExit); log('driver exit', JSON.stringify(de));
  await P.evaluate(() => document.getElementById('explode').click()); await step(30, 'explode: driver back');
  const acc = await P.evaluate(() => { const A = window.__ptAcc; const cw = window.__cw; let draws = 0, tris = 0; cw.crew.root.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && o.visible && !(o.material && o.material.visible === false)) { draws++; tris += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; } });
    return {...A, crewDraws: draws, crewTriangles: Math.round(tris), heldMax: +(cw.crew.S.heldMax || 0).toFixed(2), lastWords: cw.crew.S.lastWords || 0}; });
  acc.errors = m.errors.slice(); acc.cams = cams; acc.servicePhases = phases; acc.driverExit = de;
  await m.close(); return acc;
}

function verdict(acc) {
  const fails = [];
  for (const [k, R] of Object.entries(acc.people)) for (const [what, n] of Object.entries(R.counts)) fails.push(`${k}: ${what} in ${n} of ${R.samples} samples ${JSON.stringify(R.worst[what])}`);
  for (const [k, o] of Object.entries(acc.over)) if (o.still) fails.push(`${k}: standing clear of the car with it hiding his legs and his helmet over it, ${o.still} samples ${JSON.stringify(o.samples.filter(x => x.kind === 'still').slice(0, 2))}`);
  /* (follow-up: with no far-side service running, the crew are never seen over the car from either opening camera — walking or at a chore) */
  for (const [k, o] of Object.entries(acc.over)) if (o.idle) fails.push(`${k}: helmet over the car with his feet hidden by it, no far-side service running, ${o.idle} samples ${JSON.stringify(o.samples.filter(x => x.kind === 'idle').slice(0, 3))}`);
  const s = acc.seatWorst; if (s) fails.push('seated driver: ' + JSON.stringify(s));
  if (!acc.seatChecks.length) fails.push('seated driver: never seen');
  if (!acc.inUse) fails.push('race driver: never checked from the camera in use (he never got out)');
  if (acc.errors.length) fails.push('page errors: ' + JSON.stringify(acc.errors.slice(0, 4)));
  return fails;
}

(async () => {
  const all = {};
  for (const dev of devices) {
    const acc = await run(dev); const fails = verdict(acc); all[dev] = {fails, ...acc};
    console.log(`\n==== ${which} · ${dev}: ${fails.length ? fails.length + ' FAIL' : 'PASS'} (${acc.samples} samples, crew ${acc.crewDraws} draws, ${acc.crewTriangles} triangles)`);
    for (const f of fails) console.log('  FAIL ' + f);
    for (const [k, R] of Object.entries(acc.people)) console.log(`  ${k.padEnd(22)} samples ${R.samples}  sole ${(R.minSole * 100).toFixed(1)}…${(R.maxSole * 100).toFixed(1)} cm  slide max ${(R.maxSlide * 1000).toFixed(1)} mm  longest pause ${R.longestPause || 0} s  posts ${JSON.stringify(R.post)}`);
    console.log(`  crew: longest hold ${acc.heldMax} s, last words ${acc.lastWords}; the race driver checked from the camera in use in ${acc.inUse || 0} samples`);
    for (const [k, o] of Object.entries(acc.over)) console.log(`  over the car (feet hidden, helmet seen): ${k}: no far-side service ${o.idle}, standing clear ${o.still}, with the car apart ${o.stillApart}, moving ${o.moving}, at work ${o['at work']} ${JSON.stringify(o.samples.slice(0, 3))}`);
    console.log('  seated driver', JSON.stringify(acc.seatChecks.slice(0, 2)));
  }
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(all, null, 1));
  process.exitCode = Object.values(all).some(r => r.fails.length) ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 2; });
