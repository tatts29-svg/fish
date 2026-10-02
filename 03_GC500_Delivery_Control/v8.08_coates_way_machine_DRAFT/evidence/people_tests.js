// THE PEOPLE, CHECKED IN THE REAL MACHINE (v8.08). Author: Andrew Fisher. Read only: the rig serves the folder from disk and fetches
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
//      car" look); people moving or working at the far side are reported, with the time it lasted;
//   6. no page errors; the people's draws and triangles.
// Scenarios: the hall at rest (crew doing their chores, 150 s), the V8 started and running (40 s), a far-rear wheel service end to
// end (to 200 s), and Explode (the race driver's walk-out, 40 s).
//
//   cd 03_GC500_Delivery_Control
//   CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node v8.08_coates_way_machine_DRAFT/evidence/people_tests.js [work|base] [desk|phone|both] [out.json]
const path = require('path'), fs = require('fs');
const {openMachine} = require('./machine_rig');
const wait = ms => new Promise(r => setTimeout(r, ms));
const which = process.argv[2] || 'work', devices = (process.argv[3] || 'both') === 'both' ? ['desk', 'phone'] : [process.argv[3]], outFile = process.argv[4] || null;
const ROOT = path.join(__dirname, '..', which);

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
    return {tops: tops.map(t => [t.name, t.n, t.b.isEmpty() ? null : [t.b.min.toArray().map(v => +v.toFixed(2)), t.b.max.toArray().map(v => +v.toFixed(2))]]), carRoots: carRoots.map(c => c.name), studio: studio.map(c => c.name), carBox: [carBox.min.toArray(), carBox.max.toArray()]};
  });
}

/* the checks, run once per sample; they accumulate into window.__ptAcc */
async function sample(P, label) {
  return P.evaluate(label => {
    const cw = window.__cw, S = window.__ptState, crew = cw.crew, {Box3, Vec} = S;
    const A = window.__ptAcc || (window.__ptAcc = {samples: 0, people: {}, events: [], seatChecks: [], over: {}, flats: null});
    A.samples++;
    /* the boxes of the car's parts and of the hall's things (static ones once; moving ones every time) */
    const partBoxes = (roots, minSize, filter) => { const out = []; for (const r of roots) r.traverse(o => { if (!o.visible) return; let vis = true; for (let p = o; p; p = p.parent) if (p.visible === false) { vis = false; break; } if (!vis) return;
      if (!(o.isMesh || o.isInstancedMesh) || !o.geometry || (o.material && o.material.visible === false)) return; if (filter && !filter(o)) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      if (o.isInstancedMesh) { const m = new o.matrixWorld.constructor(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); const b = o.geometry.boundingBox.clone().applyMatrix4(m.premultiply(o.matrixWorld)); const sz = b.getSize(new Vec()); if (Math.max(sz.x, sz.y, sz.z) >= minSize) out.push({b, o, name: o.name + '#' + i}); m.identity(); } return; }
      const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), sz = b.getSize(new Vec()); if (Math.max(sz.x, sz.y, sz.z) >= minSize) out.push({b, o, name: o.name}); }); return out; };
    const carParts = partBoxes(S.carRoots, .03, o => !/^Driver|Helmet|Visor|HANS/.test(o.name) && !(cw.cockpit.driver && isUnder(o, cw.cockpit.driver))).map(p => ({...p, b: p.b.clone().expandByScalar(-.02)}));
    function isUnder(o, r) { for (let p = o; p; p = p.parent) if (p === r) return true; return false; }
    /* the hall: what stands on the floor, between the ankles and 2.2 m, no bigger than 8 m (walls, floor, roof and rails are not obstacles) */
    const hall = partBoxes(S.studio, .05, o => true).filter(p => { const sz = p.b.getSize(new Vec()); return p.b.max.y > .06 && p.b.min.y < 2.2 && sz.x < 8 && sz.z < 8; }).map(p => ({...p, b: p.b.clone().expandByScalar(-.02)}));
    /* the crew's own props, as obstacles to everyone but whoever is holding or sitting at them */
    const props = crew.props, propList = [['station', props.station.desk], ['forklift', props.forklift.root], ['rack', props.rack], ['load', props.forklift.load]];
    const propBoxes = []; for (const [k, o] of propList) { o.updateMatrixWorld(true); o.traverse(m => { if (m.isMesh && m.geometry && !(m.material && m.material.visible === false) && !m.isSkinnedMesh) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); propBoxes.push({b: m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld).expandByScalar(-.02), k, name: k + ': ' + m.name}); } }); }
    const carBox = cw.carBox.clone();
    /* everyone */
    const people = Object.entries(crew.men).map(([k, m]) => ({k, m, fig: m.fig}));
    const ex = cw.driverExit; if (ex && ex.state !== 'seated') { const f = crew.root.children.find(c => /race driver/.test(c.name)); if (f && f.visible) people.push({k: 'race driver (walking)', m: null, fig: {root: f, mesh: f.children.find(c => c.isSkinnedMesh), bones: null}}); }
    const v = new Vec();
    for (const p of people) {
      const mesh = p.fig.mesh || p.fig.root.children.find(c => c.isSkinnedMesh); if (!mesh || !p.fig.root.visible) continue;
      mesh.updateMatrixWorld(true); mesh.skeleton.update();
      const R = A.people[p.k] || (A.people[p.k] = {samples: 0, carBox: 0, carParts: 0, hall: 0, props: 0, feetHigh: 0, feetLow: 0, slide: 0, maxSlide: 0, minSole: 9, maxSole: -9, worst: [], post: {}});
      R.samples++; const post = p.m ? p.m.post.kind : 'stand'; R.post[post] = (R.post[post] || 0) + 1;
      const seated = post === 'sit', moving = p.m ? !!p.m.path : true, working = p.m ? (p.m.hands.some(h => h.target && h.w > .2) || post !== 'stand') : false;
      const bones = mesh.skeleton.bones, names = bones.map(b => b.name.split(', ').pop());
      const si = mesh.geometry.attributes.skinIndex, sw = mesh.geometry.attributes.skinWeight, n = mesh.geometry.attributes.position.count;
      const core = new Box3(), soles = [9, 9]; const pts = [];
      for (let i = 0; i < n; i += 5) {
        let best = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
        const bn = names[best]; mesh.getVertexPosition(i, v); v.applyMatrix4(mesh.matrixWorld);
        if (/^(fore|hand)/.test(bn)) continue;
        if (bn === 'footL') soles[0] = Math.min(soles[0], v.y); else if (bn === 'footR') soles[1] = Math.min(soles[1], v.y);
        core.expandByPoint(v); pts.push(v.clone());
      }
      const note = (what, extra) => { if (R.worst.length < 6) R.worst.push({t: +(cw.__ptClock || 0).toFixed(1), label, what, post, at: [+p.fig.root.position.x.toFixed(2), +p.fig.root.position.z.toFixed(2)], ...extra}); };
      /* 1. the car */
      if (!seated && core.intersectsBox(carBox.clone().expandByScalar(-.01)) && post === 'stand' && !working) { R.carBox++; note('body in the car box'); }
      let hitPart = null; for (const q of carParts) { if (!core.intersectsBox(q.b)) continue; for (const pt of pts) if (q.b.containsPoint(pt)) { hitPart = q.name; break; } if (hitPart) break; }
      if (hitPart) { R.carParts++; note('body inside a car part box', {part: hitPart}); }
      /* 2. the hall and the props */
      let hitHall = null; for (const q of hall) { if (!core.intersectsBox(q.b)) continue; for (const pt of pts) if (q.b.containsPoint(pt)) { hitHall = q.name; break; } if (hitHall) break; }
      if (hitHall) { R.hall++; note('body inside a hall object', {part: hitHall}); }
      let hitProp = null; for (const q of propBoxes) { if ((p.k === 'operator' && q.k === 'station') || (p.k === 'driver' && (q.k === 'forklift' || q.k === 'load')) || (p.k === 'tech' && q.k === 'rack')) continue; if (!core.intersectsBox(q.b)) continue; for (const pt of pts) if (q.b.containsPoint(pt)) { hitProp = q.name; break; } if (hitProp) break; }
      if (hitProp) { R.props++; note('body inside a prop', {part: hitProp}); }
      /* 3. the floor */
      if (!seated && p.m) { const fl = Math.min(p.m.floor(p.fig.root.position.x, p.fig.root.position.z), 0); const lo = Math.min(...soles) - fl, hi = Math.max(...soles) - fl;
        R.minSole = Math.min(R.minSole, lo); R.maxSole = Math.max(R.maxSole, lo);
        if (lo > .03 && post !== 'kneel') { R.feetHigh++; note('both feet off the floor', {sole: +lo.toFixed(3)}); }
        if (lo < -.015) { R.feetLow++; note('a sole into the floor', {sole: +lo.toFixed(3)}); } }
      /* 4. sliding */
      if (p.m) { const prev = p.m.__ptToe || []; const now = p.m.feet.map(f => ({planted: f.planted && !f.step, toe: f.toe.clone()}));
        now.forEach((f, i) => { if (f.planted && prev[i] && prev[i].planted && p.m.post.kind === 'stand') { const d = f.toe.distanceTo(prev[i].toe); R.maxSlide = Math.max(R.maxSlide, d); if (d > .005) { R.slide++; note('a planted foot slid', {mm: +(d * 1000).toFixed(1)}); } } });
        p.m.__ptToe = now; }
      /* 5. over the car, from the opening cameras: feet hidden by the car, the helmet seen over it */
      if (!seated && window.__ptCams && A.samples % 4 === 0) {
        const head = new Vec(); (p.fig.bones ? p.fig.bones.head : mesh.skeleton.bones[4]).getWorldPosition(head); head.y += .2;
        const foot = new Vec(p.fig.root.position.x, Math.max(0, Math.min(...soles)) + .03, p.fig.root.position.z);
        for (const c of window.__ptCams) {
          const hidden = q => { const dir = q.clone().sub(c.p), L = dir.length(); dir.normalize(); window.__ptRay.set(c.p, dir); window.__ptRay.far = L - .08; window.__ptRay.near = 0;
            return window.__ptRay.intersectObjects(S.carRoots, true).some(h => h.object.visible && !/^Driver|Helmet|Visor/.test(h.object.name)); };
          if (hidden(foot) && !hidden(head)) { const key = p.k + ' · ' + c.name; const o = A.over[key] || (A.over[key] = {still: 0, moving: 0, working: 0, samples: [], label}); o[moving ? 'moving' : working ? 'working' : 'still']++; if (o.samples.length < 4) o.samples.push({t: +(cw.__ptClock || 0).toFixed(1), at: [+p.fig.root.position.x.toFixed(2), +p.fig.root.position.z.toFixed(2)], post, label}); }
        }
      }
    }
    /* the seated race driver: in his seat, under the roof, gloves on the rim */
    { const d = cw.cockpit.driver; if (d && d.visible) { d.updateMatrixWorld(true); const h = d.userData.head, hc = new Vec(); const helmet = h.children.find(c => c.name === 'Helmet'); (helmet || h).getWorldPosition(hc);
      window.__ptRay.set(hc, new Vec(0, 1, 0)); window.__ptRay.near = 0; window.__ptRay.far = 2; const up = window.__ptRay.intersectObjects(S.carRoots, true).filter(x => !/^Driver|Helmet|Visor|HANS/.test(x.object.name) && x.object.visible)[0];
      const hands = d.userData.arms.map(a => a.hand.getWorldPosition(new Vec()));
      const rim = []; S.carRoots.forEach(r => r.traverse(o => { if (o.isMesh && /rim|Steering wheel/i.test(o.name) && !/Wheel rim|wheel rim/.test(o.name)) rim.push(o); }));
      let dRim = null; if (rim.length) { dRim = Math.min(...hands.map(hp => Math.min(...rim.map(o => { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); return o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).distanceToPoint(hp); })))); }
      const inside = carBox.containsPoint(hc);
      if (A.seatChecks.length < 3 || !up || up.distance < .14) A.seatChecks.push({label, helmetCentre: hc.toArray().map(x => +x.toFixed(3)), roofAbove: up ? +up.distance.toFixed(3) : null, roofPart: up ? up.object.name : null, insideCarBox: inside, handToRim: dRim === null ? null : +dRim.toFixed(3), rims: rim.length}); } }
    return A.samples;
  }, label);
}

async function run(device) {
  const mob = device === 'phone', t0 = Date.now(), log = (...a) => console.log(`[${which} ${device} ${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...a);
  const m = await openMachine({root: ROOT, W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: mob ? 2 : 1, mobile: mob});
  const P = m.page;
  for (let i = 0; i < 400; i++) { if (await P.evaluate(() => !!(window.__cw && window.__cw.renderer && document.getElementById('loading').hidden)).catch(() => false)) break; await wait(2000); }
  log('ready');
  const info = await setup(P); log('car', JSON.stringify(info.carRoots), 'hall', JSON.stringify(info.studio));
  /* the opening cameras as the page fits them on this screen: the car view's (now) and the V8 powertrain view's (its fit's end) */
  const cams = await P.evaluate(() => { const cw = window.__cw, out = []; const Vec = cw.carBox.min.constructor;
    out.push({name: 'car view', p: cw.camera.position.clone()});
    cw.setView('engine'); const tw = cw.tween; out.push({name: 'V8 powertrain view', p: tw && tw.to ? tw.to.clone() : cw.camera.position.clone()});
    cw.setView('car'); if (cw.tween && cw.tween.to) out[0].p = cw.tween.to.clone();
    return out.map(c => ({name: c.name, p: c.p.toArray()})); });
  log('cameras', JSON.stringify(cams));
  await P.addScriptTag({type: 'module', content: `import * as T from './vendor/three.module.js'; window.__ptRay = new T.Raycaster(); window.__ptRay.layers.enableAll(); window.__ptCams = ${JSON.stringify(cams)}.map(c => ({name: c.name, p: new T.Vector3(...c.p)}));`});
  for (let i = 0; i < 30 && !(await P.evaluate(() => !!window.__ptRay)); i++) await wait(500);
  const step = async (sec, label, every = .25) => { for (let s = 0; s < sec; s += every) { await P.evaluate(([dt]) => { window.__cw.advance(dt, 1 / 30); window.__cw.__ptClock = (window.__cw.__ptClock || 0) + dt; }, [every]); await sample(P, label); } };
  /* 1. the hall at rest: the crew at their chores */
  await sample(P, 'rest'); await step(150, 'rest'); log('rest done');
  /* 2. the V8 started and running */
  await P.evaluate(() => document.getElementById('start').click()); await step(40, 'V8 running'); await P.evaluate(() => document.getElementById('start').click()); await step(12, 'V8 stopping'); log('running done');
  /* 3. a wheel service on the far rear wheel, end to end */
  const svc = await P.evaluate(() => { const s = window.__cw.service.state, w = s.wheels.find(x => x.userData.side !== 'near') || s.wheels[0]; return {ok: s.choose(w.userData.id), id: w.userData.id}; });
  log('service on', JSON.stringify(svc));
  let phases = [];
  for (let k = 0; k < 800; k++) {
    const st = await P.evaluate(() => { const cw = window.__cw, s = cw.service.state; let r = null; if (!s.moving && !s.hold && !s.clearing) r = cw.service.step(); return {phase: s.phase, hold: s.hold, moving: s.moving, clearing: s.clearing, r: r && r.reason}; });
    if (!phases.length || phases[phases.length - 1] !== st.phase) phases.push(st.phase);
    await step(.5, 'far wheel service');
    if (phases.length > 3 && st.phase === 'ready' && !st.clearing) break;
  }
  log('service phases', phases.join(' → '));
  /* 4. Explode: the race driver gets out first and walks clear; then back together and back in */
  await P.evaluate(() => document.getElementById('explode').click()); await step(30, 'explode: driver out');
  const de = await P.evaluate(() => window.__cw.driverExit); log('driver exit', JSON.stringify(de));
  await P.evaluate(() => document.getElementById('explode').click()); await step(30, 'explode: driver back');
  const acc = await P.evaluate(() => { const A = window.__ptAcc; const cw = window.__cw; let draws = 0, tris = 0; cw.crew.root.traverse(o => { if ((o.isMesh || o.isSkinnedMesh) && o.visible && !(o.material && o.material.visible === false)) { draws++; tris += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3; } });
    return {...A, crewDraws: draws, crewTriangles: Math.round(tris)}; });
  acc.errors = m.errors.slice(); acc.cams = cams; acc.servicePhases = phases; acc.driverExit = de;
  await m.close(); return acc;
}

function verdict(acc) {
  const fails = [];
  for (const [k, R] of Object.entries(acc.people)) {
    if (R.carBox) fails.push(`${k}: standing or walking inside the car's box in ${R.carBox} samples`);
    if (R.carParts) fails.push(`${k}: body inside a car part's box in ${R.carParts} samples (${JSON.stringify(R.worst.filter(w => /car part/.test(w.what)).slice(0, 2))})`);
    if (R.hall) fails.push(`${k}: body inside a hall object in ${R.hall} samples (${JSON.stringify(R.worst.filter(w => /hall/.test(w.what)).slice(0, 2))})`);
    if (R.props) fails.push(`${k}: body inside a prop in ${R.props} samples (${JSON.stringify(R.worst.filter(w => /prop/.test(w.what)).slice(0, 2))})`);
    if (R.feetHigh) fails.push(`${k}: both feet off the floor in ${R.feetHigh} samples`);
    if (R.feetLow) fails.push(`${k}: a sole into the floor in ${R.feetLow} samples`);
    if (R.slide) fails.push(`${k}: a planted foot slid in ${R.slide} samples (max ${(R.maxSlide * 1000).toFixed(1)} mm)`);
  }
  for (const [k, o] of Object.entries(acc.over)) if (o.still) fails.push(`${k}: standing still with the car hiding his legs and his helmet over it, ${o.still} samples ${JSON.stringify(o.samples.slice(0, 2))}`);
  for (const s of acc.seatChecks) { if (!s.insideCarBox) fails.push('seated driver: helmet outside the car'); if (s.roofAbove !== null && s.roofAbove < .14) fails.push(`seated driver: helmet into the roof (${s.roofAbove} m to ${s.roofPart})`); if (s.handToRim !== null && s.handToRim > .04) fails.push(`seated driver: a glove ${s.handToRim} m off the rim`); }
  if (acc.errors.length) fails.push('page errors: ' + JSON.stringify(acc.errors.slice(0, 4)));
  return fails;
}

(async () => {
  const all = {};
  for (const dev of devices) {
    const acc = await run(dev); const fails = verdict(acc); all[dev] = {fails, ...acc};
    console.log(`\n==== ${which} · ${dev}: ${fails.length ? fails.length + ' FAIL' : 'PASS'} (${acc.samples} samples, crew ${acc.crewDraws} draws, ${acc.crewTriangles} triangles)`);
    for (const f of fails) console.log('  FAIL ' + f);
    for (const [k, R] of Object.entries(acc.people)) console.log(`  ${k.padEnd(22)} samples ${R.samples}  sole ${(R.minSole * 100).toFixed(1)}…${(R.maxSole * 100).toFixed(1)} cm  slide max ${(R.maxSlide * 1000).toFixed(1)} mm  posts ${JSON.stringify(R.post)}`);
    for (const [k, o] of Object.entries(acc.over)) console.log(`  over the car: ${k}: still ${o.still}, moving ${o.moving}, working ${o.working} ${JSON.stringify(o.samples.slice(0, 2))}`);
    console.log('  seated driver', JSON.stringify(acc.seatChecks.slice(0, 2)));
  }
  if (outFile) fs.writeFileSync(outFile, JSON.stringify(all, null, 1));
  process.exitCode = Object.values(all).some(r => r.fails.length) ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 2; });
