// THE RACE DRIVER'S WALK-OUT AND THE CREW'S LAST WORD, CHECKED IN THE REAL MACHINE (v8.09 review). Author: Andrew Fisher. Read only: the rig
// serves the folder from disk and fetches models and sounds from the live machine by GET; nothing is sent anywhere.
//
// An independent review found that Explode pressed twice while the door was opening left the driver a walker nobody moved and the crew
// frozen until Reset, and that two crew could hold each other up for good in a narrow spot. This drives the machine's own state (the
// drawing loop stopped, stepped by its fast-forward window.__cw.advance) through every way in:
//   1. Explode, then Explode again at every stage of the walk-out and the walk back (the door opening — the double press within 0.6 s —
//      crouched in the doorway, standing up, stepping out of the door's swing, walking away before and after the car starts to come
//      apart, out at the safe spot, walking back, stepping in, ducking in). Whatever the stage, the machine must come back to rest: either
//      the driver seated with his door shut and the car together, or (a press on the way back in) the driver out and the car apart — and a
//      press from there must bring it together with him back in his seat. The crew are never left held by "the car is apart".
//   2. Reset, and a change to the cockpit view, at every stage: the driver straight back in his seat, the door shut, the crew free.
//   3. Throughout, nobody is inside the door's swing while the door moves, and the driver never sits back down in a car that is apart.
//   3b. (v8.09 follow-up) the camera eases round to his door's side while he gets out and back in, the door waiting for it, and back to where
//      it was after; a drag or a view button leaves it with the person; with prefers-reduced-motion it cuts (section 5).
//   4. The last word: two crew sent through the narrow pocket between the car's nose stands from opposite ends, each rank order, both get
//      where they are going, never closer than 0.5 m, and no one is held up for more than about 9 s.
//
//   cd 03_GC500_Delivery_Control
//   CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node v8.09_coates_way_machine_DRAFT/evidence/driver_tests.js [work|base|folder] [desk|phone]
const path = require('path');
const {openMachine} = require('./machine_rig');
const wait = ms => new Promise(r => setTimeout(r, ms));
const which = process.argv[2] || 'work', device = process.argv[3] || 'desk';
const ROOT = path.isAbsolute(which) ? which : path.join(__dirname, '..', which);
let fails = 0, passes = 0;
const check = (name, ok, detail = '') => { if (ok) passes++; else fails++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

/* in the page: helpers kept on window so each scenario is one evaluate */
const HELPERS = () => {
  const cw = window.__cw;
  const H = window.__dt = {};
  H.ex = () => cw.driverExit;
  /* inside the door's swing (shut to open, its length): the same sector car-app.js keeps him out of while the door moves */
  H.inSwing = () => { const e = cw.driverExit, R = e.reach, m = cw.driverMan; if (!R || !m || !m.fig.root.visible) return false; const dx = m.pos.x - R.x, dz = m.pos.z - R.z, a = Math.atan2(-dz, dx); return Math.hypot(dx, dz) < R.len + .05 && a > -.25 && a < 1.3; };
  H.bad = [];
  /* step on, watching: the door never meets him, and he never sits down in a car that is apart */
  H.step = (sec, until = null) => { let t = 0; for (; t < sec; t += .1) { const e0 = cw.driverExit; cw.advance(.1, 1 / 30); const e = cw.driverExit;
      if (e.door > 0 && e.door < 1 && H.inSwing()) H.bad.push(`in the door's swing (${e.state}/${e.phase}, door ${e.door})`);
      if (e0.state !== 'seated' && e.state === 'seated' && e0.phase !== 'door' && cw.drive.spread > .01) H.bad.push(`seated in a car apart (spread ${cw.drive.spread.toFixed(2)})`);
      if (until && until()) return +(t + .1).toFixed(1); } return null; };
  H.press = () => document.getElementById('explode').click();
  H.rest = () => { const e = cw.driverExit; return e.state === 'seated' && e.door <= 0 && e.phase === null && cw.drive.spreadTarget <= .01 && cw.drive.spread < .002; };
  H.apart = () => { const e = cw.driverExit; return e.state === 'out' && cw.drive.spread > .99; };
  H.crewFree = () => { cw.advance(.1, 1 / 30); return !cw.crew.S.apart; };
  H.reset = () => { document.getElementById('reset').click(); cw.advance(.5, 1 / 30); H.bad = []; };
};

async function run() {
  const mob = device === 'phone', t0 = Date.now(), log = (...a) => console.log(`[${which} ${device} ${((Date.now() - t0) / 1000).toFixed(0)}s]`, ...a);
  const m = await openMachine({root: ROOT, W: mob ? 390 : 1440, H: mob ? 844 : 900, dpr: mob ? 2 : 1, mobile: mob});
  const P = m.page; P.setDefaultTimeout(600000);
  for (let i = 0; i < 400; i++) { if (await P.evaluate(() => !!(window.__cw && window.__cw.ready && document.getElementById('loading').hidden)).catch(() => false)) break; await wait(2000); }
  await P.evaluate(() => window.__cw.renderer.setAnimationLoop(null));
  await P.evaluate(HELPERS); log('ready');

  /* 0. (Codex review fixes f45961b) the first frame he is seen walking is drawn where he is: at the sill, turned the way he faces. The
     walker was shown after being placed at the sill but before his figure was posed there, so for one frame he stood where he had last
     been drawn (1.7 m off the first time; 6.1 m after a Reset from the safe spot). Fails on ba9fff7. */
  { const r = await P.evaluate(() => { const H = window.__dt, cw = window.__cw, out = [];
      const first = () => { const m = cw.driverMan; let n = 0; while (!m.fig.root.visible && n++ < 600) cw.advance(1 / 30, 1 / 30); if (!m.fig.root.visible) return null;
        const rp = m.fig.root.position, q = m.fig.root.quaternion, yaw = 2 * Math.atan2(q.y, q.w), dy = Math.atan2(Math.sin(yaw - m.yaw), Math.cos(yaw - m.yaw));
        return {phase: cw.driverExit.phase, off: +Math.hypot(rp.x - m.pos.x, rp.z - m.pos.z).toFixed(3), yawOff: +Math.abs(dy).toFixed(3), post: m.post.kind}; };
      H.reset(); H.press(); out.push(first());
      H.step(60, () => H.apart()); document.getElementById('reset').click(); cw.advance(.5, 1 / 30); H.bad = []; H.press(); out.push(first());
      H.reset(); return out; });
    const ok = x => x && x.off < .01 && x.yawOff < .01 && x.post === 'crouch';
    check('the first frame he is seen walking out is drawn at the sill, crouched, facing the right way', ok(r[0]), JSON.stringify(r[0]));
    check('…and the same after a Reset from the safe spot', ok(r[1]), JSON.stringify(r[1])); }

  /* 1. Explode again at every stage */
  const stages = [
    ['door', 'the door opening (a second press while it opens)', e => e.phase === 'door' && e.door > .4, 'rest'],
    ['crawlout', 'crouched in the doorway', e => e.phase === 'crawlout' || (e.phase === 'rise' && window.__cw.driverMan.post.k > .5), 'rest'],
    ['rise', 'standing up', e => e.phase === 'rise', 'rest'],
    ['stepout', 'stepping out of the door\'s swing', e => e.phase === 'stepout', 'rest'],
    ['walkaway', 'walking away, the car still whole', e => e.phase === 'walkaway' && !e.spreadStarted, 'rest'],
    ['walkaway+', 'walking away, the car coming apart', e => e.phase === 'walkaway' && e.spreadStarted, 'rest'],
    ['out', 'out at the safe spot, the car apart', e => e.state === 'out' && window.__cw.drive.spread > .99, 'rest'],
    ['walkback', 'walking back, the car whole again', e => e.phase === 'walkback', 'apart'],
    ['stepin', 'stepping in through the open door', e => e.phase === 'stepin', 'apart'],
    ['duck', 'ducking into his seat', e => e.phase === 'duck', 'apart'],
  ];
  for (const [id, words, reach, expect] of stages) {
    const r = await P.evaluate(([src, expect, id]) => { const H = window.__dt, cw = window.__cw, reach = eval(src); H.reset();
      H.press(); let tReach = H.step(id === 'door' ? 3 : 40, () => reach(cw.driverExit));
      /* the walk back: the car together after an Explode, out and back */
      if (tReach === null && ['walkback', 'stepin', 'duck'].includes(id)) { H.step(60, () => H.apart()); H.press(); tReach = H.step(60, () => reach(cw.driverExit)); }
      const at = {...cw.driverExit}; if (tReach === null) return {reached: false, at};
      H.press();
      const settled = H.step(120, () => expect === 'rest' ? H.rest() : H.apart());
      const after = {...cw.driverExit};
      /* from out with the car apart: one more press brings it together and him back in */
      let back = null; if (expect === 'apart' && settled !== null) { H.press(); back = H.step(120, () => H.rest()); }
      return {reached: true, at: {state: at.state, phase: at.phase, door: at.door}, settled, after: {state: after.state, phase: after.phase, door: after.door, spread: +cw.drive.spread.toFixed(3)}, back, crewFree: H.crewFree(), bad: H.bad.slice(0, 3)};
    }, [reach.toString(), expect, id]);
    if (!r.reached) { check(`Explode at "${words}": stage reached`, false, JSON.stringify(r.at)); continue; }
    const ok = r.settled !== null && (expect === 'rest' || r.back !== null) && r.crewFree && !r.bad.length;
    check(`Explode again at "${words}" → ${expect === 'rest' ? 'the driver back in his seat, door shut, car together' : 'out again and the car apart; a further press brings him back in'}`, ok,
      `pressed at ${JSON.stringify(r.at)}; ${r.settled === null ? 'never settled, ' + JSON.stringify(r.after) : 'settled in ' + r.settled + ' s'}${r.back !== null ? ', back in ' + r.back + ' s' : ''}; crew free ${r.crewFree}${r.bad.length ? '; ' + r.bad.join(' | ') : ''}`);
  }
  /* the double press itself, the reviewer's case to the letter: two presses 0.3 s apart, then a third later gets him out as normal */
  { const r = await P.evaluate(() => { const H = window.__dt, cw = window.__cw; H.reset(); H.press(); H.step(.3); H.press(); const t = H.step(3, () => H.rest()); const crew = H.crewFree();
      H.press(); const out = H.step(60, () => H.apart()); H.press(); const back = H.step(120, () => H.rest()); return {t, crew, out, back, bad: H.bad.slice(0, 3), ex: cw.driverExit}; });
    check('Explode twice within 0.6 s: seated again at once, the crew free; a third press gets him out and the car apart, a fourth brings both back', r.t !== null && r.crew && r.out !== null && r.back !== null && !r.bad.length, JSON.stringify(r)); }

  /* 2. Reset, and the cockpit view, at every stage */
  for (const how of ['Reset', 'the cockpit view']) for (const [id, words, reach] of stages) {
    const r = await P.evaluate(([src, how, id]) => { const H = window.__dt, cw = window.__cw, reach = eval(src); H.reset();
      H.press(); let t = H.step(id === 'door' ? 3 : 40, () => reach(cw.driverExit));
      if (t === null && ['walkback', 'stepin', 'duck'].includes(id)) { H.step(60, () => H.apart()); H.press(); t = H.step(60, () => reach(cw.driverExit)); }
      if (t === null) return {reached: false};
      if (how === 'Reset') document.getElementById('reset').click(); else cw.setView('cog');
      H.step(1.5); const e = {...cw.driverExit}, walker = cw.driverMan.fig.root.visible, seen = cw.cockpit.driver.visible || cw.view === 'cog';
      const ok = e.state === 'seated' && e.door <= 0 && !walker && cw.drive.spreadTarget <= .01 && H.crewFree();
      /* and back in the car view, Explode gets him out as normal */
      if (how !== 'Reset') cw.setView('car'); H.step(1); H.press(); const again = H.step(60, () => H.apart()); H.press(); const home = H.step(120, () => H.rest());
      return {reached: true, ok, e, walker, again, home, bad: H.bad.slice(0, 3)}; }, [reach.toString(), how, id]);
    if (!r.reached) { check(`${how} at "${words}": stage reached`, false); continue; }
    check(`${how} at "${words}" → seated, door shut, crew free; then Explode works again`, r.ok && r.again !== null && r.home !== null && !r.bad.length, JSON.stringify({e: r.e, walker: r.walker, again: r.again, home: r.home, bad: r.bad}));
  }

  /* 3b. v8.09 follow-up — the camera comes round to his door: getting out the door waits shut while it glides (1.2 s); then it is on his
     door's side, behind the car's rear quarter; it comes back to where it was once he can be seen whole from there; the same on the way back
     in. A drag (the orbit controls' start) or a view button leaves the camera where it is, with the person. */
  { const r = await P.evaluate(() => { const H = window.__dt, cw = window.__cw; H.reset(); cw.advance(.2, 1 / 30); const home = cw.camera.position.clone();
      H.press(); let doorShut = true, glide = 0; for (let i = 0; i < 40 && cw.driverCam.mode === 'in'; i++) { cw.advance(.05, 1 / 60); glide += .05; if (cw.driverCam.mode === 'in' && cw.driverExit.door > 0) doorShut = false; }
      const shot = cw.camera.position.clone(), hold = cw.driverCam.mode, tgt = cw.controls.target.clone();
      const backOut = H.step(60, () => cw.driverCam.mode === null); const atHome = cw.camera.position.distanceTo(home), stateWhenBack = cw.driverExit.state + '/' + cw.driverExit.phase;
      H.step(60, () => H.apart()); H.press(); const goIn = H.step(60, () => cw.driverCam.mode === 'hold'); const shot2 = cw.camera.position.clone();
      const backIn = H.step(120, () => cw.driverCam.mode === null && H.rest()); const atHome2 = cw.camera.position.distanceTo(home);
      return {glide: +glide.toFixed(2), doorShut, hold, shot: shot.toArray().map(v => +v.toFixed(2)), target: tgt.toArray().map(v => +v.toFixed(2)), backOut, stateWhenBack, atHome: +atHome.toFixed(3), goIn, shot2: shot2.toArray().map(v => +v.toFixed(2)), backIn, atHome2: +atHome2.toFixed(3), bad: H.bad.slice(0, 3)}; });
    const doorSide = p => p[2] < r.target[2] - 2 && p[0] > r.target[0] + 2;
    check('Explode: the camera eases round (1.2 s) to his door\'s side, behind the rear quarter, the door shut until it is there', r.glide >= 1.15 && r.glide <= 1.3 && r.doorShut && r.hold === 'hold' && doorSide(r.shot), JSON.stringify({glide: r.glide, doorShut: r.doorShut, hold: r.hold, shot: r.shot, target: r.target}));
    check('…and back to where it was once he can be seen whole from there', r.backOut !== null && r.atHome < .01, JSON.stringify({backOut: r.backOut, atHome: r.atHome, when: r.stateWhenBack}));
    check('on his way back in: round to his door again, and back to where it was once he is in his seat', r.goIn !== null && doorSide(r.shot2) && r.backIn !== null && r.atHome2 < .01 && !r.bad.length, JSON.stringify({goIn: r.goIn, shot2: r.shot2, backIn: r.backIn, atHome2: r.atHome2, bad: r.bad})); }
  for (const how of ['a drag (the orbit controls start)', 'a view button']) {
    const r = await P.evaluate(how => { const H = window.__dt, cw = window.__cw; H.reset(); cw.advance(.2, 1 / 30); H.press(); cw.advance(.5, 1 / 30); const mid = cw.driverCam.mode;
      if (/drag/.test(how)) cw.cameraStart(); else document.querySelector('[data-view="engine"]').click();
      const at = cw.camera.position.clone(), mode = cw.driverCam.mode; cw.advance(2, 1 / 30); const moved = cw.camera.position.distanceTo(at); const out = {mid, mode, moved: +moved.toFixed(4)}; document.querySelector('[data-view="car"]').click(); H.reset(); return out; }, how);
    check(`${how} during the glide leaves the camera with the person at once`, r.mid === 'in' && r.mode === null && r.moved < 1e-4, JSON.stringify(r));
  }

  /* 4. the last word: two crew through the narrow pocket between the nose stands, from opposite ends, each rank order */
  for (const [a, b] of [['lead', 'mechanic'], ['mechanic', 'lead'], ['engine', 'tech']]) {
    const r = await P.evaluate(([a, b]) => { const H = window.__dt, cw = window.__cw, crew = cw.crew, A = crew.men[a], B = crew.men[b]; H.reset();
      /* their own scripts held for the test, so only the walks asked for move them */
      const keep = [crew.scripts[a].step, crew.scripts[b].step]; crew.scripts[a].step = () => {}; crew.scripts[b].step = () => {};
      A.place(-2.95, 0, -Math.PI / 2); B.place(-4.8, 2.3, Math.PI); crew.S.heldMax = 0; crew.S.lastWords = 0;
      const toA = [-4.8, -2.3], toB = [-3.0, 0.05];
      crew.walk(A, toA); crew.walk(B, toB); let minD = 9, t = 0, doneA = null, doneB = null;
      for (; t < 45; t += .1) { cw.advance(.1, 1 / 30); minD = Math.min(minD, Math.hypot(A.pos.x - B.pos.x, A.pos.z - B.pos.z));
        if (doneA === null && Math.hypot(A.pos.x - toA[0], A.pos.z - toA[1]) < .15 && !A.path) doneA = +t.toFixed(1); if (doneB === null && Math.hypot(B.pos.x - toB[0], B.pos.z - toB[1]) < .15 && !B.path) doneB = +t.toFixed(1); if (doneA !== null && doneB !== null) break; }
      const out = {doneA, doneB, minD: +minD.toFixed(2), heldMax: +(crew.S.heldMax || 0).toFixed(1), lastWords: crew.S.lastWords || 0, A: [+A.pos.x.toFixed(2), +A.pos.z.toFixed(2)], B: [+B.pos.x.toFixed(2), +B.pos.z.toFixed(2)]};
      delete crew.scripts[a].step; delete crew.scripts[b].step; if (crew.scripts[a].step !== keep[0]) crew.scripts[a].step = keep[0]; if (crew.scripts[b].step !== keep[1]) crew.scripts[b].step = keep[1]; H.reset(); return out; }, [a, b]);
    check(`last word: the ${a} out of the pocket by the car's nose, the ${b} in — both arrive, never closer than 0.5 m, no hold over 9 s`, r.doneA !== null && r.doneB !== null && r.minD >= .5 && r.heldMax <= 9, JSON.stringify(r));
  }
  /* 5. prefers-reduced-motion: no glide, a cut */
  await P.emulateMedia({reducedMotion: 'reduce'}); await P.reload({waitUntil: 'domcontentloaded'});
  for (let i = 0; i < 400; i++) { if (await P.evaluate(() => !!(window.__cw && window.__cw.ready && document.getElementById('loading').hidden)).catch(() => false)) break; await wait(2000); }
  await P.evaluate(() => window.__cw.renderer.setAnimationLoop(null)); await P.evaluate(HELPERS);
  { const r = await P.evaluate(() => { const H = window.__dt, cw = window.__cw, reduced = matchMedia('(prefers-reduced-motion: reduce)').matches; cw.advance(.2, 1 / 30); const home = cw.camera.position.clone(); H.press(); cw.advance(1 / 30, 1 / 30);
      return {reduced, mode: cw.driverCam.mode, jump: +cw.camera.position.distanceTo(home).toFixed(2)}; });
    check('reduced motion: the camera cuts to his door at once (no glide)', r.reduced && r.mode === 'hold' && r.jump > 1, JSON.stringify(r)); }
  const errs = m.errors.filter(e => !/favicon/i.test(e)); check('no page errors', !errs.length, errs.slice(0, 4).join(' | '));
  await m.close();
  console.log(`\n${passes}/${passes + fails} passed · ${which} · ${device}`); process.exitCode = fails ? 1 : 0;
}
run().catch(e => { console.error(e); process.exitCode = 2; });
