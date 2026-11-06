/**
 * Advance the rotor independently of its removable wheel assembly. Spin is
 * retained when withdrawn; the caliper stays fixed. Far-side local axes are
 * reversed so both sides turn about the same world axle.
 * @param {import('./vendor/three.module.js').Group} wheel
 * @param {number} delta The hub's own angle since the previous update, radians (v5.81: the powertrain's
 *   step for the rear pair — crank through the box and the final drive — and nothing for the fronts in their
 *   chocks; the 2.2× that used to be folded in here and divided out by the caller is gone from both).
 * @param {number} brake Normalised illustrative wheel braking, 0–1 (the app now loads the whole line and
 *   passes 0 here, so tyre, roller, prop shaft and gauge slow together).
 * @param {boolean} engaged Whether the wheel is seated.
 *
 * v5.81 — the step turns the HUB (car-gc500.js 'Wheel hub': the brake disc and, on the rear pair, the machined hub),
 * and the rotor — the rim and the tyre — turns with it only while it is on it; once attached, a wheel takes its
 * hub's motion (Andrew Fisher's workshop brief, 24 Sep 2026). A rear wheel's centre-lock nut turns with them while it is
 * done up. wheel.userData.service (WheelService below) says whether the rotor is on and the nut fastened; a wheel
 * without it is on and fastened, as every wheel was before.
 */
export function advanceWheel(wheel, delta, brake, engaged) {
  const rotor = wheel.getObjectByName('Wheel rotor');
  if (!rotor || !engaged) return;
  const d = delta * (1 - Math.max(0, Math.min(1, brake))) *
    (wheel.userData.axisSign ?? (wheel.userData.side === 'far' ? -1 : 1));
  const hub = wheel.getObjectByName('Wheel hub'), svc = wheel.userData.service, nut = wheel.getObjectByName('Wheel nut');
  if (hub) hub.rotation.z += d;
  if (!svc || svc.attached) rotor.rotation.z += d;
  if (nut && (!svc || svc.fastened)) nut.rotation.z += d;
}

export function resetWheels(wheels) {
  for (const wheel of wheels) {
    wheel.getObjectByName('Wheel rotor').rotation.z = 0;
    const hub = wheel.getObjectByName('Wheel hub'), nut = wheel.getObjectByName('Wheel nut');
    if (hub) hub.rotation.z = 0;
    if (nut) nut.rotation.z = 0;
  }
}

/* ============================================================================================================
   THE WHEEL SERVICE (v5.81). Andrew Fisher's workshop brief, 24 Sep 2026, in steps: end the run, a controlled spin-down,
   verify it has stopped, isolate the demonstration drive, the service position and support, release the fastening,
   the wheel off the hub, inspect, replace or refit, confirm the fastening, back to ready; a blocked action says why
   (wait for the wheels to stop; service mode required; refit the wheel before starting); a spinning wheel is never
   removed and the car never driven with a wheel off; the hub, brake disc and stationary caliper exposed; and a wheel,
   once attached, moves with its hub.

   One of the two rear wheels (the pair on the rollers; the fronts are chocked) goes through six phases:
     ready     — nothing is happening; the V8 may run.
     isolated  — the V8 is stopped, the drive stationary, and the drive is locked out (drive.locked): nothing starts it.
     supported — two jack stands under the sill on that side and the wheel stand beside it (the kit, pit-garage.js).
     wheelOff  — the centre-lock nut is undone (turned off its spigot) and the wheel — the rotor: the rim, the tyre,
                 their barrel and nothing else — slides 0.35 m out along its axle, then is laid on the wheel stand
                 beside the car; the hub, the brake disc and the caliper stay where they are, in view.
     inspect   — the hub, the disc and the caliper are named (car-app.js puts a callout on each).
     refit     — the wheel comes back along the same path and the nut is run on and torqued (the fastening check).
   and back to ready: the stands away, the lock off. Each step is asked for (step(), the dock's Service button, W);
   nothing moves on its own.

   THE WHEEL'S PATH, AND WHY IT IS NOT "0.35 m OUT AND 0.2 m DOWN". The brief asks for the wheel to slide 0.35 m out
   along its axle and then 0.2 m down onto a stand. The first is done as written. The second cannot be done upright:
   on the dyno the tyre's lowest point is already at floor level (a .334 m tyre on a .334 m axle), so an upright wheel
   0.2 m lower is 0.2 m into the floor, or into the rollers and the pit grating beside them. So the wheel is laid on
   its stand the way a team lays a wheel down, outer face up: its centre goes the 0.2 m down, and — because a wheel
   lying flat is 0.67 m across — it goes out a further 0.44 m first, clear of the rollers and the pit's edge, onto a
   low stand on the floor beside the car. The nut comes off first and rides on the wheel's face. Refit is the same
   path backwards.

   WITH A CREW (v5.81, crew.js — Andrew Fisher, 24 Sep 2026: the tyre mechanic waits until the scene has stopped, and
   the lead confirms the crew clear before a new dyno run). A `carrier` may be given: the people who do the work. The
   service then asks it before each thing it cannot do alone, and holds (this.hold says what for) until it is done: the
   stands come in and go out only while the pit technician is at the sill ('stands'); the nut turns only once the car is
   on its stands and the mechanic's gun is on it ('gun'); the wheel slides only with his hands on the tyre ('grip'); after
   the slide the crew carries it to their rack and the service does not touch it ('carryOff'); on the refit the crew
   brings it back to the end of its slide, exactly ('carryOn'); the nut is run on only with the gun back on it ('gunOn');
   and at Ready the drive stays locked until the crew lead has given the all-clear ('clear' — `clearing` while it waits).
   Without a carrier every step runs as described above, untouched (tests/car.test.mjs runs it that way).
   ============================================================================================================ */
const clamp01 = t => Math.max(0, Math.min(1, t)), ease = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const WHEEL_SERVICE = Object.freeze({
  release: .6, slide: 1.2, setDown: 1.2, torque: .35,   /* seconds: the nut off, the slide along the axle, laid on the stand; the torque cue */
  out: .35, drop: .2, standOut: .79,                    /* metres: along the axle, down, and out in all (the stand's centre 1.62 m off the car's centre line) */
  nutOut: .035, nutTurns: 3, nutHome: .129,             /* the nut backs 35 mm off its spigot in three turns; its seat is 129 mm outboard of the wheel centre */
  phases: ['ready', 'isolated', 'supported', 'wheelOff', 'inspect', 'refit'],
});
const OFF_TIME = WHEEL_SERVICE.release + WHEEL_SERVICE.slide + WHEEL_SERVICE.setDown;

export class WheelService {
  /** @param {object[]} wheels the body's wheel groups (car-gc500.js); those with a centre-lock nut (the rear pair) can be serviced
   *  @param {{kit?: {set(o:object):void}, onTorque?: Function}} options the stands (pit-garage.js serviceKit) and the fastening cue */
  constructor(wheels, {kit = null, onTorque = null, carrier = null} = {}) {
    this.wheels = wheels.filter(w => w.getObjectByName('Wheel nut'));
    this.kit = kit; this.onTorque = onTorque; this.carrier = carrier;
    this.phase = 'ready'; this.wheelId = null; this.motion = null; this.time = 0; this.torque = 0; this.standsIn = 0; this.torqued = false;
    this.hold = null; this.clearing = false; this.gunOn = false; this.drive = null; this.standsWaiting = false;
    for (const w of this.wheels) w.userData.service = {attached: true, fastened: true, nutSpin: 0};
  }
  /* the near rear wheel — the car view looks at the near side — unless another rear wheel is chosen */
  get defaultWheel() { return (this.wheels.find(w => w.userData.side === 'near') || this.wheels[0]).userData.id; }
  get wheel() { return this.wheels.find(w => w.userData.id === (this.wheelId || this.defaultWheel)) || null; }
  get moving() { return !!this.motion; }
  /* the wheel is not on its hub: from the moment the nut is undone until the refit has brought it home */
  get wheelIsOff() { const s = this.wheel && this.wheel.userData.service; return !!s && !s.attached; }
  serviceable(id) { return this.wheels.some(w => w.userData.id === id); }
  choose(id) { if (this.phase !== 'ready' || !this.serviceable(id)) return false; this.wheelId = id; return true; }
  /** why the V8 may not start now, or null */
  startRefusal() {
    if (this.phase === 'ready') return this.clearing ? "Wait for the crew lead's all-clear" : null;
    return this.wheelIsOff || this.phase === 'wheelOff' || this.phase === 'inspect' ? 'Refit wheel before starting' : 'Service mode — refit the wheel and press Ready before starting';
  }
  /** the action the next step() takes, for the dock's button */
  get nextLabel() { return {ready: this.clearing ? 'All-clear…' : 'Service', isolated: 'Support', supported: 'Wheel off', wheelOff: this.motion ? 'Wheel off…' : 'Inspect', inspect: 'Refit', refit: this.motion ? 'Refitting…' : 'Ready'}[this.phase]; }
  refuse(reason) { this.lastReason = reason; return {ok: false, phase: this.phase, reason}; }
  done() { this.lastReason = ''; return {ok: true, phase: this.phase, reason: ''}; }
  /** the next phase, if the machine's state allows it; otherwise the reason it does not */
  step(drive) {
    if (drive) this.drive = drive;
    if (this.motion) return this.refuse('Wait — the wheel is still moving');
    if (this.clearing) return this.refuse("Wait for the crew lead's all-clear");
    const w = this.wheel, s = w && w.userData.service;
    if (!w) return this.refuse('No wheel can be serviced here');
    switch (this.phase) {
      case 'ready':
        /* never a spinning wheel: the V8 stopped AND the drive stationary — a coasting drive is still turning the rear wheels */
        if (drive && (drive.running || !drive.stationary)) return this.refuse('Wait for the wheels to stop');
        if (!this.wheelId) this.wheelId = this.defaultWheel;
        this.phase = 'isolated'; if (drive) drive.locked = true; return this.done();
      case 'isolated': this.phase = 'supported'; return this.done();
      case 'supported':
        /* with a crew the nut waits for the mechanic's gun from this moment, so the line says so before the first update does */
        this.phase = 'wheelOff'; this.motion = 'off'; this.time = 0; this.torqued = false; if (this.carrier) this.hold = 'gun';
        s.nutSpin = w.getObjectByName('Wheel nut').rotation.z; s.fastened = false; s.attached = false; return this.done();
      case 'wheelOff': this.phase = 'inspect'; return this.done();
      case 'inspect': this.phase = 'refit'; this.motion = 'on'; this.time = OFF_TIME; this.torque = 0; if (this.carrier) this.hold = 'carryOn'; return this.done();
      /* with a crew the lock stays on until the lead's all-clear (update() takes it off then) */
      case 'refit': this.phase = 'ready'; if (this.carrier) this.clearing = true; else if (drive) drive.locked = false; return this.done();
    }
    return this.refuse('Unknown service phase');
  }
  /** a request to take a wheel off, from anywhere (the dock's Disconnect on a wheel, the pull slider, the tests) */
  wheelOff(drive, id = null) {
    if (this.phase === 'ready') return this.refuse('Service mode required');
    if (this.motion) return this.refuse('Wait — the wheel is still moving');
    if (id && this.wheel && id !== this.wheel.userData.id) return this.refuse('Only the wheel on the stands comes off in this service');
    if (this.phase === 'isolated') return this.refuse('Support the car first — stands under the sill (Service)');
    if (this.phase !== 'supported') return this.refuse(this.wheelIsOff ? 'The wheel is already off' : 'Finish this service first — Ready');
    return this.step(drive);
  }
  /* the wheel, its nut and the kit where the time on the path puts them (time 0: fastened on the hub; OFF_TIME: on the stand) */
  pose() {
    const w = this.wheel; if (!w) return;
    const S = WHEEL_SERVICE, s = w.userData.service, rotor = w.getObjectByName('Wheel rotor'), nut = w.getObjectByName('Wheel nut'), o = w.userData.side === 'near' ? 1 : -1, t = this.time;
    const r = ease(t / S.release), sl = ease((t - S.release) / S.slide), sd = (t - S.release - S.slide) / S.setDown;
    const outer = ease(sd / .55), down = ease((sd - .3) / .7), tilt = ease((sd - .15) / .85);
    const z = o * (S.out * sl + (S.standOut - S.out) * outer), y = -S.drop * down, tx = -o * Math.PI / 2 * tilt;
    rotor.position.set(0, y, z); rotor.rotation.x = tx; rotor.rotation.y = 0;            /* the spin (rotation.z) is the wheel's own and is never touched here */
    const zn = o * (S.nutHome + S.nutOut * r);
    nut.position.set(0, y - Math.sin(tx) * zn, z + Math.cos(tx) * zn); nut.rotation.x = tx; nut.rotation.y = 0;
    const buzz = this.motion === 'on' && t <= 0 ? .05 * Math.sin(this.torque * 70) * (1 - clamp01(this.torque / S.torque)) : 0;
    nut.rotation.z = s.nutSpin - o * Math.PI * 2 * S.nutTurns * r + buzz;
  }
  update(dt) {
    const w = this.wheel, c = this.carrier, want = ['supported', 'wheelOff', 'inspect', 'refit'].includes(this.phase) ? 1 : 0;
    /* with a crew the stands move only while the pit technician is at the sill putting them in or taking them out */
    const go = !c || Math.abs(want - this.standsIn) < 1e-9 || c.ready('stands', w, this);
    this.standsWaiting = !go; if (go) this.standsIn += Math.max(-dt / .8, Math.min(dt / .8, want - this.standsIn));
    if (this.kit && w) this.kit.set({in: this.standsIn, side: w.userData.side === 'near' ? 1 : -1, x: w.position.x, standOut: WHEEL_SERVICE.standOut, wheelZ: Math.abs(w.position.z), crewStand: !!c});
    if (this.clearing && c && c.ready('clear', w, this)) { this.clearing = false; if (this.drive) this.drive.locked = false; }
    if (!this.motion || !w) { this.hold = null; return; }
    const s = w.userData.service;
    if (c) { this.crewUpdate(dt, w, s, c); return; }
    if (this.motion === 'off') { this.time = Math.min(OFF_TIME, this.time + dt); this.pose(); if (this.time >= OFF_TIME) this.motion = null; return; }
    if (this.time > 0) { this.time = Math.max(0, this.time - dt); if (this.time <= WHEEL_SERVICE.release) s.attached = true; this.pose(); return; }
    /* home on the hub, the nut run on: the torque cue, then everything exactly as it was */
    this.torque += dt; this.pose();
    if (this.torque >= WHEEL_SERVICE.torque) { this.home(w); s.fastened = true; this.motion = null; this.torqued = true; if (this.onTorque) this.onTorque(w); }
  }
  /* the same steps with the crew doing the work: each one waits (this.hold) for the crew to say it may go */
  crewUpdate(dt, w, s, c) {
    const S = WHEEL_SERVICE, R = S.release, SL = R + S.slide;
    if (this.motion === 'off') {
      if (this.time < R) { if (this.time === 0 && !(this.standsIn >= 1 && c.ready('gun', w, this))) { this.hold = 'gun'; return; }
        this.hold = null; this.time = Math.min(R, this.time + dt); this.pose(); return; }
      if (this.time < SL) { if (this.time === R && !c.ready('grip', w, this)) { this.hold = 'grip'; return; }
        this.hold = null; this.time = Math.min(SL, this.time + dt); this.pose(); return; }
      /* out along its axle: from here the crew carries it to their rack, and the service does not touch it */
      this.hold = 'carryOff'; if (c.ready('carryOff', w, this)) { this.hold = null; this.time = OFF_TIME; this.motion = null; }
      return;
    }
    /* the refit: the crew brings the wheel back to the end of its slide, exactly; the service slides it on */
    if (this.time > SL) { this.hold = 'carryOn'; if (!c.ready('carryOn', w, this)) return; this.hold = null; this.time = SL; this.pose(); return; }
    if (this.time > R) { this.time = Math.max(R, this.time - dt); this.pose(); return; }
    if (!this.gunOn) { if (!c.ready('gunOn', w, this)) { this.hold = 'gunOn'; return; } this.gunOn = true; this.hold = null; }
    if (this.time > 0) { this.time = Math.max(0, this.time - dt); if (this.time <= R) s.attached = true; this.pose(); return; }
    this.torque += dt; this.pose();
    if (this.torque >= S.torque) { this.home(w); s.fastened = true; this.motion = null; this.torqued = true; this.gunOn = false; if (this.onTorque) this.onTorque(w); }
  }
  /** where the rotor sits (in its wheel's frame) at a time on the path: for the crew to take it from and hand it back to exactly */
  poseAt(t, w = this.wheel) {
    const S = WHEEL_SERVICE, o = w.userData.side === 'near' ? 1 : -1, sl = ease((t - S.release) / S.slide), sd = (t - S.release - S.slide) / S.setDown;
    const outer = ease(sd / .55), down = ease((sd - .3) / .7), tilt = ease((sd - .15) / .85);
    return {x: 0, y: -S.drop * down, z: o * (S.out * sl + (S.standOut - S.out) * outer), ax: -o * Math.PI / 2 * tilt, ay: 0};
  }
  /** the crew holds the wheel: the rotor at (x, y, z) in its wheel's frame, its axle tilted by ax (about x) then ay (about y) —
   *  the spin, rotation.z, is the wheel's own and is left alone; the nut rides on its face, backed off */
  placeWheel(w, x, y, z, ax, ay) {
    const S = WHEEL_SERVICE, rotor = w.getObjectByName('Wheel rotor'), nut = w.getObjectByName('Wheel nut'), o = w.userData.side === 'near' ? 1 : -1, zn = o * (S.nutHome + S.nutOut);
    rotor.position.set(x, y, z); rotor.rotation.x = ax; rotor.rotation.y = ay;
    nut.position.set(x + zn * Math.sin(ay), y - zn * Math.cos(ay) * Math.sin(ax), z + zn * Math.cos(ay) * Math.cos(ax)); nut.rotation.x = ax; nut.rotation.y = ay;
  }
  /* the rotor and the nut back on their seats, to the last bit: position zero, no tilt, the spin they had */
  home(w) {
    const s = w.userData.service, rotor = w.getObjectByName('Wheel rotor'), nut = w.getObjectByName('Wheel nut'), o = w.userData.side === 'near' ? 1 : -1;
    rotor.position.set(0, 0, 0); rotor.rotation.x = 0; rotor.rotation.y = 0;
    nut.position.set(0, 0, o * WHEEL_SERVICE.nutHome); nut.rotation.x = 0; nut.rotation.y = 0; nut.rotation.z = s.nutSpin;
    s.attached = true;
  }
  /** Reset: the sequence cancelled wherever it was, every serviceable wheel home and fastened, the stands away */
  reset(drive = null) {
    for (const w of this.wheels) { const s = w.userData.service; if (!s.fastened || !s.attached || this.motion) { if (s.fastened) s.nutSpin = w.getObjectByName('Wheel nut').rotation.z; this.home(w); } s.fastened = true; }
    this.phase = 'ready'; this.motion = null; this.time = 0; this.torque = 0; this.standsIn = 0; this.lastReason = ''; this.hold = null; this.clearing = false; this.gunOn = false;
    if (drive) drive.locked = false;
    if (this.kit && this.wheel) this.kit.set({in: 0, side: this.wheel.userData.side === 'near' ? 1 : -1, x: this.wheel.position.x, standOut: WHEEL_SERVICE.standOut, wheelZ: Math.abs(this.wheel.position.z)});
  }
}
