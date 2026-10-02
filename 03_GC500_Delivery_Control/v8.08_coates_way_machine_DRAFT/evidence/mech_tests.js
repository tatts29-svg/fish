// The Coates Way machine — tests for the mechanisms added in v8.08 (clutch, differential internals, brakes from balance bar to
// disc heat, oil galleries, timing tensioner, steering knuckles). Author: Andrew Fisher. Read only: it opens the work folder
// through machine_rig.js, which serves the files from disk and only ever GETs anything else.
//
//   cd 03_GC500_Delivery_Control
//   CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node v8.08_coates_way_machine_DRAFT/evidence/mech_tests.js
//   [SHOTS=<dir>]  also saves dpr-2 close-ups of the V8 powertrain view, exploded, into <dir>
//   [ONLY=desk|phone]
//
// What it proves, on a desktop and a phone viewport:
//   · the register's "N / N parts fitted" and its row count both equal the 310 parts there were plus the 16 added, every new
//     reference is in the register exactly once and every new part is in the scene exactly once;
//   · started, in gear and on the throttle, every new mechanism moves, and each by its own law: the clutch disc and the
//     gearbox input with the crank, the pinion with the prop shaft, the crown wheel at the pinion's 10/39, both side gears with
//     the crown wheel while straight, the tensioner's idler at belt speed against the sprockets, the oil by the pump's turn;
//   · while the V8 is being started the clutch is out: the crank turns and the gearbox input stands still;
//   · full right lock: the rack moves 0.074 to the left, the knuckles, the front pads and the front wheels turn the same 18°,
//     the left side gear runs faster than the right by the road's turning geometry, and the spiders turn on their pin;
//   · brake: the push rods go in, the lines carry pressure, every pad closes on its disc, the turning rear discs heat and
//     glow, and the brake off opens the pads again;
//   · stopped, nothing moves; no page errors and no console errors.
const path = require('path'), fs = require('fs');
const {openMachine} = require('./machine_rig');
const ROOT = path.join(__dirname, '..', 'work'), SHOTS = process.env.SHOTS || '';
const NEW = ['clutch', 'timing-tensioner', 'oil-galleries', 'diff-pinion', 'diff-crown-wheel', 'diff-spider-gears', 'diff-side-gear-left', 'diff-side-gear-right',
  'brake-master-cylinders', 'brake-lines', 'brake-pads-front-left', 'brake-pads-front-right', 'brake-pads-rear-left', 'brake-pads-rear-right', 'steering-knuckle-left', 'steering-knuckle-right'];
const BEFORE = 310;
const wait = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
function check(label, ok, detail = '') { console.log((ok ? 'PASS ' : 'FAIL ') + label + (detail ? '  — ' + detail : '')); if (!ok) failures++; }

/* runs in the page: the mechanisms' state, read off the scene's own objects */
const SAMPLE = () => {
  const sc = window.__cw.scene; let mech = null; const ids = new Map();
  sc.traverse(o => { if (!mech && o.userData && o.userData.mech) mech = o.userData.mech; if (o.userData && o.userData.partId) ids.set(o.userData.partId, (ids.get(o.userData.partId) || 0) + 1); });
  const byId = id => { let g = null; sc.traverse(o => { if (!g && o.userData && o.userData.partId === id) g = o; }); return g; };
  const wheel = id => { let g = null; sc.traverse(o => { if (!g && o.userData && o.userData.id === id) g = o; }); return g; };
  const yawOf = g => { const v = new g.position.constructor(1, 0, 0).applyQuaternion(g.quaternion); return Math.atan2(-v.z, v.x); };
  const b = mech.brakes, oilMesh = byId('oil-galleries').children.find(c => c.isInstancedMesh), m0 = oilMesh.instanceMatrix.array;
  return {
    crank: mech.crank, input: mech.input, main: mech.main, gear: mech.gear,
    clutch: {...mech.driveline.clutch}, clutchDisc: byId('clutch').children[1].rotation.x, clutchCover: byId('clutch').children[0].rotation.x,
    pinion: byId('diff-pinion').children[0].rotation.x, crown: byId('diff-crown-wheel').children[0].rotation.z,
    left: byId('diff-side-gear-left').children[0].rotation.z, right: byId('diff-side-gear-right').children[0].rotation.z,
    spider: byId('diff-spider-gears').children[0].children[0].children[0].rotation.y, split: mech.driveline.split,
    tensioner: byId('timing-tensioner').children[0].rotation.x, tensionerRatio: mech.timing.tensioner.ratio,
    oil: mech.oil.travel, oil0: [m0[12], m0[13], m0[14]],
    rack: mech.rackTravel, knuckleL: byId('steering-knuckle-left').children[0].rotation.y, knuckleR: byId('steering-knuckle-right').children[0].rotation.y,
    wheelYawL: yawOf(wheel('CAR-BODY-WHEEL-FRONT-R')), wheelYawR: yawOf(wheel('CAR-BODY-WHEEL-FRONT-L')),
    frontPadYaw: b.corners.filter(c => c.axle === 'front').map(c => c.yaw.rotation.y),
    padGaps: b.corners.map(c => b.padGap(c)), heat: b.heat, glow: b.corners.filter(c => c.glow).map(c => c.glow.visible && c.glow.parent && c.glow.parent.name === 'Wheel hub'),
    hubs: b.corners.map(c => !!c.hub), brake: b.brake, piston: b.mcPistons.map(p => p.position.x), lines: b.lineMat.emissiveIntensity,
    status: document.getElementById('start-text').textContent, count: document.getElementById('count').textContent,
    partIds: Object.fromEntries(ids)
  };
};

async function run(kind) {
  const phone = kind === 'phone';
  const m = await openMachine({root: ROOT, W: phone ? 390 : 1440, H: phone ? 844 : 900, dpr: phone ? 2 : 1, mobile: phone});
  const {page} = m; page.setDefaultTimeout(240000);
  console.log(`\n== ${kind} ==`);
  await page.waitForFunction(() => window.__cw && !document.querySelector('[data-view=engine]').disabled, null, {timeout: 400000});
  await page.evaluate(() => window.__cw.setView('engine'));
  const s0 = await page.evaluate(SAMPLE);

  /* the register and the scene agree */
  const [fitted, total] = s0.count.split(' parts')[0].split(' / ').map(Number);
  check(`${kind}: parts fitted reads N / N with the 16 new parts`, fitted === total && total === BEFORE + NEW.length, s0.count);
  const reg = await page.evaluate(async refs => {
    document.getElementById('register-open').click(); await new Promise(r => setTimeout(r, 50));
    const out = {total: document.getElementById('results-count').textContent, rows: document.getElementById('results').children.length, refs: {}};
    for (const ref of refs) { const s = document.getElementById('search'); s.value = ref; s.dispatchEvent(new Event('input')); out.refs[ref] = [...document.getElementById('results').children].filter(b => b.querySelector('code').textContent === ref).map(b => b.querySelector('b').textContent); }
    document.getElementById('register').close(); return out;
  }, ['ENG-CLUTCH', 'ENG-TIMING-TENSIONER', 'ENG-OIL-GALLERIES', 'ENG-DIFF-PINION', 'ENG-DIFF-CROWN-WHEEL', 'ENG-DIFF-SPIDER-GEARS', 'ENG-DIFF-SIDE-GEAR-L', 'ENG-DIFF-SIDE-GEAR-R', 'ENG-BRAKE-MASTER', 'ENG-BRAKE-LINES', 'ENG-BRAKE-PADS-FL', 'ENG-BRAKE-PADS-FR', 'ENG-BRAKE-PADS-RL', 'ENG-BRAKE-PADS-RR', 'ENG-STEERING-KNUCKLE-L', 'ENG-STEERING-KNUCKLE-R']);
  check(`${kind}: register lists ${total} physical components`, reg.rows === total && reg.total.startsWith(total + ' '), reg.total);
  check(`${kind}: every new reference is in the register exactly once`, Object.values(reg.refs).every(r => r.length === 1), JSON.stringify(reg.refs));
  check(`${kind}: every new part is in the scene exactly once`, NEW.every(id => s0.partIds[id] === 1), NEW.map(id => id + ':' + (s0.partIds[id] || 0)).join(' '));
  check(`${kind}: the rear discs' heat is mounted on the wheels' own hubs`, s0.hubs.every(Boolean), JSON.stringify(s0.hubs));

  /* start: the clutch is held out while the V8 catches */
  await page.evaluate(() => { const t = document.getElementById('throttle'); t.value = 70; t.dispatchEvent(new Event('input')); document.getElementById('start').click(); });
  /* one evaluate, so no rendered frame comes between the samples */
  const st = await page.evaluate(`(() => { const S = ${SAMPLE.toString()}; const out = []; for (let k = 0; k < 12; k++) { window.__cw.advance(.03, 1 / 120); const s = S(); out.push({crank: s.crank, input: s.input, engaged: s.clutch.engaged, st: s.clutch.starting}); } return out; })()`);
  const open = st.filter(x => x.st && x.engaged < .5);
  let held = false; for (let i = 1; i < st.length; i++) if (st[i].st && st[i - 1].st && st[i - 1].engaged < .05 && Math.abs(st[i].crank - st[i - 1].crank) > 1e-4 && Math.abs(st[i].input - st[i - 1].input) < 1e-9) held = true;
  check(`${kind}: starting — the clutch opens and the gearbox input stands still while the crank turns`, open.length > 0 && held, JSON.stringify(st.slice(0, 6).map(x => [x.st, +x.engaged.toFixed(2), +x.crank.toFixed(4), +x.input.toFixed(4)])));

  /* running, in gear, on the throttle */
  await page.evaluate(() => window.__cw.advance(5));
  const a = await page.evaluate(SAMPLE); await page.evaluate(() => window.__cw.advance(2.5)); const b = await page.evaluate(SAMPLE);
  const d = k => b[k] - a[k];
  check(`${kind}: running in gear`, /Stop/.test(b.status) && b.gear > 0 && b.clutch.engaged > .99, `${b.status} gear ${b.gear} clutch ${b.clutch.engaged}`);
  check(`${kind}: clutch disc and gearbox input turn with the crank`, Math.abs(d('crank')) > .5 && Math.abs(d('input') - d('crank')) < 1e-6 && Math.abs(d('clutchCover') - d('crank')) < 1e-6, `crank ${d('crank').toFixed(3)} input ${d('input').toFixed(3)}`);
  check(`${kind}: pinion turns with the main shaft`, Math.abs(d('pinion')) > .1 && Math.abs(d('pinion') - d('main')) < 1e-6, `pinion ${d('pinion').toFixed(3)} main ${d('main').toFixed(3)}`);
  check(`${kind}: crown wheel turns at 10/39 of the pinion`, Math.abs(d('crown') / d('pinion') - 10 / 39) < 1e-6, (d('crown') / d('pinion')).toFixed(5));
  check(`${kind}: straight ahead both side gears turn with the crown wheel and the spiders rest on their pin`, Math.abs(d('left') - d('crown')) < 1e-6 && Math.abs(d('right') - d('crown')) < 1e-6 && Math.abs(d('spider')) < 1e-6, `L ${d('left').toFixed(4)} R ${d('right').toFixed(4)} spider ${d('spider').toFixed(5)}`);
  check(`${kind}: tensioner idler turns at belt speed, against the sprockets`, Math.abs(d('tensioner') - d('crank') * a.tensionerRatio) < 1e-6 && a.tensionerRatio < 0, `idler ${d('tensioner').toFixed(3)} ratio ${a.tensionerRatio.toFixed(3)}`);
  check(`${kind}: oil moves by the pump's turn (half the crank) × its displacement`, Math.abs(d('oil') - Math.abs(d('crank')) * .5 * .08) < 1e-6 && Math.hypot(b.oil0[0] - a.oil0[0], b.oil0[1] - a.oil0[1], b.oil0[2] - a.oil0[2]) > 1e-4, `oil ${d('oil').toFixed(4)}`);

  /* full right lock while driving */
  await page.evaluate(() => window.__cw.setSteer(2 * Math.PI / 3)); await page.evaluate(() => window.__cw.advance(.5));
  const c = await page.evaluate(SAMPLE); await page.evaluate(() => window.__cw.advance(2.5)); const e = await page.evaluate(SAMPLE);
  const de = k => e[k] - c[k], deg = r => (r * 180 / Math.PI).toFixed(2);
  check(`${kind}: full right lock — rack slides 0.074 to the left (+z)`, Math.abs(e.rack - .074) < 1e-6, e.rack);
  check(`${kind}: knuckles, front pads and front wheels all turn −18°`, [e.knuckleL, e.knuckleR, ...e.frontPadYaw, e.wheelYawL, e.wheelYawR].every(v => Math.abs(v + 18 * Math.PI / 180) < .006), [e.knuckleL, e.knuckleR, ...e.frontPadYaw, e.wheelYawL, e.wheelYawR].map(deg).join(' '));
  const ratio = de('left') / de('right'), expect = (1 + e.split) / (1 - e.split);
  check(`${kind}: steered — left (outside) side gear faster than right by the turning geometry`, Math.abs(de('left')) > Math.abs(de('right')) && Math.abs(ratio - expect) < 1e-6 && Math.abs(de('left') + de('right') - 2 * de('crown')) < 1e-6, `L/R ${ratio.toFixed(4)} expected ${expect.toFixed(4)} split ${e.split.toFixed(4)}`);
  check(`${kind}: steered — the spider gears turn on their pin by the difference × 16/10`, Math.abs(de('spider') - (de('left') - de('crown')) * 1.6) < 1e-6 && Math.abs(de('spider')) > .01, `spider ${de('spider').toFixed(4)}`);
  await page.evaluate(() => window.__cw.setSteer(0)); await page.evaluate(() => window.__cw.advance(.3));

  /* brake against the running V8 */
  const hot0 = (await page.evaluate(SAMPLE)).heat;
  await page.evaluate(() => { const t = document.getElementById('brake'); t.value = 60; t.dispatchEvent(new Event('input')); });
  for (let k = 0; k < 6; k++) await page.evaluate(() => window.__cw.advance(.5));
  const f = await page.evaluate(SAMPLE);
  check(`${kind}: brake — push rods in and lines under pressure`, f.piston.every(x => x < -.015) && f.lines > .5, `pistons ${f.piston.map(x => x.toFixed(4))} lines ${f.lines.toFixed(2)}`);
  check(`${kind}: brake — every pad closes on its disc`, f.padGaps.every(g => g < .001), JSON.stringify(f.padGaps));
  check(`${kind}: brake — the turning rear discs heat and glow; the chocked fronts stay cold`, f.heat[2] > hot0[2] + .02 && f.heat[3] > hot0[3] + .02 && f.glow.every(Boolean) && f.heat[0] === 0 && f.heat[1] === 0, JSON.stringify(f.heat));
  await page.evaluate(() => { const t = document.getElementById('brake'); t.value = 0; t.dispatchEvent(new Event('input')); window.__cw.advance(.2); });
  const g = await page.evaluate(SAMPLE);
  check(`${kind}: brake off — the pads stand clear again`, g.padGaps.every(x => Math.abs(x - .0036) < 1e-5) && g.piston.every(x => x === 0), JSON.stringify(g.padGaps));

  if (SHOTS && !phone) await shots(page, kind);

  /* stopped: nothing moves */
  await page.evaluate(() => { if (/Stop/.test(document.getElementById('start-text').textContent)) document.getElementById('start').click(); window.__cw.advance(10); });
  const h = await page.evaluate(SAMPLE); await page.evaluate(() => window.__cw.advance(3)); const i = await page.evaluate(SAMPLE);
  const still = ['crank', 'input', 'pinion', 'crown', 'left', 'right', 'spider', 'tensioner', 'oil', 'clutchDisc'].filter(k => Math.abs(i[k] - h[k]) > 1e-9);
  check(`${kind}: stopped — every new mechanism holds still`, /Start/.test(i.status) && still.length === 0, still.join(',') || i.status);
  check(`${kind}: no page or console errors`, m.errors.length === 0, m.errors.slice(0, 5).join(' | '));
  await m.close();
}
/* close-ups in the V8 powertrain view, exploded, at dpr 2: the camera is put where the part's own Focus would put it */
async function shots(page, kind) {
  fs.mkdirSync(SHOTS, {recursive: true});
  const shot = async name => { await wait(6000); await page.screenshot({path: path.join(SHOTS, `${kind}_${name}.png`), timeout: 240000}); console.log('shot', name); };
  await shot('engine_running');
  const focus = async ref => page.evaluate(ref => { document.getElementById('register-open').click(); const s = document.getElementById('search'); s.value = ref; s.dispatchEvent(new Event('input')); const row = [...document.getElementById('results').children].find(b => b.querySelector('code').textContent === ref); row.click(); }, ref);
  for (const [ref, name] of [['ENG-DIFF-CROWN-WHEEL', 'diff'], ['ENG-CLUTCH', 'clutch'], ['ENG-STEERING-KNUCKLE-L', 'knuckle'], ['ENG-BRAKE-MASTER', 'master'], ['ENG-TIMING-TENSIONER', 'tensioner']]) { await focus(ref); await shot(name + '_fitted'); }
  await page.evaluate(() => { document.getElementById('explode').click(); window.__cw.advance(6); });
  await page.evaluate(() => window.__cw.setView('engine')); await shot('exploded');
  for (const [ref, name] of [['ENG-DIFF-SPIDER-GEARS', 'spiders'], ['ENG-CLUTCH', 'clutch'], ['ENG-BRAKE-PADS-RL', 'pads']]) { await focus(ref); await shot(name + '_exploded'); }
  await page.evaluate(() => { document.getElementById('explode').click(); window.__cw.advance(6); window.__cw.setView('engine'); });
}
(async () => {
  for (const kind of ['desk', 'phone']) if (!process.env.ONLY || process.env.ONLY === kind) await run(kind);
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED'); process.exitCode = failures ? 1 : 0;
})().catch(e => { console.error(e); process.exitCode = 1; });
