/** THE V8, AS A CROSS-PLANE V8.
 *
 * Andrew Fisher, 22 Sep 2026: it has to sound like a real V8.
 *
 * What was here fired ONE evenly spaced pulse train — a 24-harmonic periodic wave at rpm/60*4 through a
 * lowpass. The firing RATE was right; the firing PATTERN was not, and the pattern is the whole thing.
 *
 * Eight evenly spaced firings down one pipe is a FLAT-PLANE V8 — the thing in a Ferrari that screams. A
 * Supercars Gen3 car has a CROSS-PLANE crank, and the point of one is that the firings are even at the crank
 * but lopsided down each of the two exhausts:
 *
 *     bank A   0°   180°   450°   630°
 *     bank B   90°  270°   360°   540°
 *     gaps     90°, 180° and 270°
 *
 * That grouping IS the burble. The finding is Andrew Fisher's own, from build_v8_clips.py in his
 * GC500_3D_Scene v0.9 package, and it is the same fault and the same fix as the GC500 showcase, where the
 * same wrong engine drew his verdict that the car sounded like a fly.
 *
 * MEASURED, NOT ASSERTED. The proof is a with-and-without: render the same graph twice, changing only the
 * excitation, and read the energy below the firing rate. An even train puts that energy on the EVEN steps of
 * the half-order ladder; two banks put it on the ODD steps, which a single even train cannot reach. That
 * comparison is what `bankLadder()` at the bottom of this file computes, and it is what tests/audio.test.mjs
 * asserts — not a threshold somebody picked.
 *
 * ARCHITECTURE, per Andrew's brief: the excitation is one 720° cycle in an AudioBuffer, looped by an
 * AudioBufferSourceNode whose playbackRate follows the crank — so it revs continuously instead of crossfading
 * between fixed-rpm recordings, and costs nothing to download. The pipe resonance sits in filters AFTER the
 * loop, where it belongs: an exhaust's resonance is set by its length, not by engine speed, so it must not
 * pitch-shift with the revs. Load and overrun crossfade on GainNodes, and a BiquadFilter follows the camera,
 * muffling the top end as the viewer pulls back from the block.
 *
 * Coates Industrial Solutions · The Coates Way — Author: Andrew Fisher
 */

/* one full four-stroke cycle is 720 crank degrees; a V8 fires eight times in it, four down each bank */
export const BANK_A = [0, 180, 450, 630];
export const BANK_B = [90, 270, 360, 540];
const REF_RPM = 1200;                  /* the rpm the cycle buffer is drawn at; playbackRate scales from here */
export const IDLE_RPM = 850;           /* the slowest the loop is ever played: a V8's idle, not a chug */
const BANK_B_DELAY_MS = 1.1;           /* bank B is further down its pipe — Andrew's figure */
const BANK_B_LEVEL = 0.86;             /* and a little quieter */
const BANK_B_DULL = 0.72;              /* and a little duller */
/* A PUFF MUST BE SHORTER THAN THE CLOSEST GAP. At the reference speed a 90 degree gap is 12.5 ms; puffs of
   14 ms overlapped their neighbours and smeared the very pattern they exist to carry — the control train
   measured MORE odd energy than even, which a perfectly even train cannot do and which is how the smear
   showed itself. Seven milliseconds leaves the gaps clean. The crack is broadband either way; the pipe
   resonance that turns it into a note lives in the filters after the loop. */
const PUFF_S = 0.007;

/** One 720° cycle of excitation, with every firing assigned to a bank and the two banks given different
 *  pipes. The puffs WRAP past the end of the buffer into the start, so the loop joins itself exactly and
 *  there is no click at the seam. */
export function cycleBuffer(ctx, sampleRate = ctx ? ctx.sampleRate : 44100) {
  const cycleSeconds = 120 / REF_RPM;                    /* 720° = two revolutions */
  const n = Math.round(cycleSeconds * sampleRate);
  const data = new Float32Array(n);
  let seed = 20260922;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };

  /* one puff: a sharp broadband crack that decays fast. Short on purpose — it is the EXCITATION, not the
     note. Anything longer starts carrying pitch of its own, and then it shifts when the revs do. */
  const puff = (atDeg, level, dull, delayMs) => {
    const start = Math.round(((atDeg / 720) * cycleSeconds + delayMs / 1000) * sampleRate);
    const len = Math.round(sampleRate * PUFF_S);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const env = Math.exp(-t * 7.5) * (1 - Math.exp(-t * 90));   /* fast attack, exponential tail */
      lp += (rnd() - lp) * dull;                                   /* a one-pole roll-off gives each bank its own colour */
      const body = Math.sin(2 * Math.PI * 96 * (i / sampleRate)) * 0.55;   /* the low thump under the crack */
      data[(start + i) % n] += (lp * 0.8 + body) * env * level;
    }
  };

  BANK_A.forEach(d => puff(d, 1.0, 0.55, 0));
  BANK_B.forEach(d => puff(d, BANK_B_LEVEL, 0.55 * BANK_B_DULL, BANK_B_DELAY_MS));

  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
  if (peak > 0) for (let i = 0; i < n; i++) data[i] /= peak;

  if (!ctx) return data;
  const buf = ctx.createBuffer(1, n, sampleRate);
  buf.getChannelData(0).set(data);
  return buf;
}

/** The same cycle with all eight firings even and down one pipe — a flat-plane train. Built only so the
 *  cross-plane claim can be measured against it rather than asserted. */
export function flatCycleBuffer(sampleRate = 44100) {
  const cycleSeconds = 120 / REF_RPM, n = Math.round(cycleSeconds * sampleRate);
  const data = new Float32Array(n);
  let seed = 20260922;
  const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2147483648 - 1; };
  for (let k = 0; k < 8; k++) {
    const start = Math.round(((k * 90 / 720) * cycleSeconds) * sampleRate);
    const len = Math.round(sampleRate * PUFF_S);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len, env = Math.exp(-t * 7.5) * (1 - Math.exp(-t * 90));
      lp += (rnd() - lp) * 0.55;
      const body = Math.sin(2 * Math.PI * 96 * (i / sampleRate)) * 0.55;
      data[(start + i) % n] += (lp * 0.8 + body) * env;
    }
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
  if (peak > 0) for (let i = 0; i < n; i++) data[i] /= peak;
  return data;
}

/** Energy on each half-order step below the firing rate, as a share of the firing rate's own line.
 *  A single even train can only reach the EVEN steps. Two banks reach the ODD ones — that is the burble,
 *  and this is the number that shows it. */
export function bankLadder(samples, sampleRate = 44100) {
  const n = samples.length;
  const at = (k) => {                       /* one Goertzel bin at k cycles across the buffer */
    const w = 2 * Math.PI * k / n, cw = Math.cos(w), coeff = 2 * cw;
    let s0 = 0, s1 = 0, s2 = 0;
    for (let i = 0; i < n; i++) { s0 = samples[i] + coeff * s1 - s2; s2 = s1; s1 = s0; }
    return Math.sqrt(s1 * s1 + s2 * s2 - coeff * s1 * s2) / n;
  };
  const firing = at(8);                     /* eight firings per cycle = the firing rate */
  const steps = {};
  let odd = 0, even = 0;
  for (let k = 1; k <= 7; k++) {
    const v = firing > 0 ? at(k) / firing : 0;
    steps[k + '/8'] = +v.toFixed(3);
    if (k % 2) odd += v; else even += v;
  }
  return {steps, odd: +odd.toFixed(3), even: +even.toFixed(3), total: +(odd + even).toFixed(3)};
}

/** The same chain, offline, so a test can read where the energy lands instead of anybody asserting it.
 *  RBJ biquads, run in series over one looped cycle at a given rpm and throttle. */
export function pipeChain(samples, sampleRate, {rpm = 1500, throttle = 0.5} = {}) {
  const load = Math.min(1, Math.max(0, throttle)), norm = Math.min(1, Math.max(0, (rpm - 800) / 6400));
  const stages = [
    ['peaking', 72, 1.2, 7 - norm * 2.5], ['lowshelf', 160, 0.7, 5], ['peaking', 118, 1.5, 9], ['peaking', 355, 1.1, 3 + load * 6],
    ['peaking', 760, 1.4, load * (4 + norm * 4)], ['lowpass', 520 + load * 2600 + norm * 900, 0.8, 0],
  ];
  /* resample the reference cycle to the requested rpm: rate = rpm / REF_RPM, as playbackRate does */
  const rate = Math.max(IDLE_RPM / REF_RPM, rpm / REF_RPM), n = Math.round(samples.length / rate);
  let x = new Float32Array(n * 4);
  for (let i = 0; i < x.length; i++) { const p = (i * rate) % samples.length, k = Math.floor(p), f = p - k; x[i] = samples[k] * (1 - f) + samples[(k + 1) % samples.length] * f; }
  for (const [type, f0, Q, g] of stages) {
    const A = Math.pow(10, g / 40), w0 = 2 * Math.PI * f0 / sampleRate, cw = Math.cos(w0), sw = Math.sin(w0), alpha = sw / (2 * Q);
    let b0, b1, b2, a0, a1, a2;
    if (type === 'peaking') { b0 = 1 + alpha * A; b1 = -2 * cw; b2 = 1 - alpha * A; a0 = 1 + alpha / A; a1 = -2 * cw; a2 = 1 - alpha / A; }
    else if (type === 'lowshelf') { const s = 2 * Math.sqrt(A) * alpha; b0 = A * ((A + 1) - (A - 1) * cw + s); b1 = 2 * A * ((A - 1) - (A + 1) * cw); b2 = A * ((A + 1) - (A - 1) * cw - s); a0 = (A + 1) + (A - 1) * cw + s; a1 = -2 * ((A - 1) + (A + 1) * cw); a2 = (A + 1) + (A - 1) * cw - s; }
    else { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = (1 - cw) / 2; a0 = 1 + alpha; a1 = -2 * cw; a2 = 1 - alpha; }
    const y = new Float32Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) { const v = (b0 / a0) * x[i] + (b1 / a0) * x1 + (b2 / a0) * x2 - (a1 / a0) * y1 - (a2 / a0) * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v; }
    x = y;
  }
  return x.subarray(x.length - n * 2);   /* the last two cycles, once the filters have settled */
}

/** Energy shares by band, from a plain DFT of the settled signal. */
export function bandShares(samples, sampleRate, bands = [[20, 150], [150, 400], [400, 1200], [1200, 6000]]) {
  const n = samples.length, spectrum = new Float64Array(Math.floor(n / 2));
  for (let k = 1; k < spectrum.length; k++) { let re = 0, im = 0; const w = 2 * Math.PI * k / n; for (let i = 0; i < n; i++) { re += samples[i] * Math.cos(w * i); im -= samples[i] * Math.sin(w * i); } spectrum[k] = re * re + im * im; }
  let total = 0; for (let k = 1; k < spectrum.length; k++) total += spectrum[k];
  const out = {};
  for (const [lo, hi] of bands) { let e = 0; for (let k = 1; k < spectrum.length; k++) { const f = k * sampleRate / n; if (f >= lo && f < hi) e += spectrum[k]; } out[lo + '-' + hi] = +(e / total).toFixed(3); }
  return out;
}

/** THE SAMPLE BANK. Andrew Fisher approved a 34-clip ElevenLabs sound pack (SOUND_PROMPTS.md; flow
 *  "Coates Way V8 — sound effects", 23 Sep 2026). Each clip lives at ./assets/audio/<id>.mp3 and is fetched
 *  only after the viewer presses Sound on, so a page view never downloads a byte of audio it will not play and
 *  never touches ElevenLabs. A clip that is missing or fails to decode is simply absent: the loops fall back to
 *  the synthesised V8 above and a one-shot that is not there plays nothing. The three V8 loops replace the
 *  synthesis when all three have loaded; they are pitched to the crank within ±25 % and crossfaded equal-power
 *  at 1,400 and 4,000 rpm, which is the plan in Andrew's original audio brief. */
export const CLIP_IDS = ['v8-idle','v8-cruise','v8-roar','v8-start','v8-stop','v8-blip','v8-overrun','machine-start','machine-run','machine-stop','clutch-engage','clutch-release','dog-engage','part-separate','part-reconnect','layers-separate','layers-reassemble','cog-deploy','cog-retract','panels-off','panels-on','chain-run','belt-run','belt-run-fast','butterflies-open','butterflies-close','starter-pinion','fans-run','dyno-rollers','workshop-tone','ui-select','ui-confirm','ui-denied','tour-step'];
const LOOP_RPM = {'v8-idle': 850, 'v8-cruise': 2500, 'v8-roar': 6500};
export class SampleBank {
  constructor(ctx, {air, master, base = './assets/audio/'} = {}) {
    this.ctx = ctx; this.air = air; this.master = master; this.base = base;
    this.buffers = new Map(); this.loops = new Map(); this.loading = new Map(); this.missing = new Set();
  }
  async load(id) {
    if (this.buffers.has(id)) return this.buffers.get(id);
    if (this.missing.has(id)) return null;
    if (this.loading.has(id)) return this.loading.get(id);
    const p = (async () => {
      try {
        const r = await fetch(this.base + id + '.mp3', {cache: 'force-cache'});
        if (!r.ok) throw Error(r.status);
        const buf = await this.ctx.decodeAudioData(await r.arrayBuffer());
        this.buffers.set(id, buf); return buf;
      } catch (e) { this.missing.add(id); return null; }
      finally { this.loading.delete(id); }
    })();
    this.loading.set(id, p); return p;
  }
  /** Warm the loops and the one-shots the viewer is most likely to hear first. */
  async warm(ids = CLIP_IDS) { await Promise.all(ids.map(id => this.load(id))); return CLIP_IDS.filter(id => this.buffers.has(id)); }
  has(id) { return this.buffers.has(id); }
  /** A looping clip on its own gain, created silent the first time it is asked for. */
  loop(id, {toAir = true} = {}) {
    if (this.loops.has(id)) return this.loops.get(id);
    const buf = this.buffers.get(id); if (!buf) return null;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const gain = this.ctx.createGain(); gain.gain.value = 0;
    src.connect(gain); gain.connect(toAir && this.air ? this.air : this.master); src.start();
    const entry = {src, gain}; this.loops.set(id, entry); return entry;
  }
  setLoop(id, level, rate = 1, {toAir = true, tc = 0.08} = {}) {
    const l = this.loop(id, {toAir}); if (!l) return false;
    const t = this.ctx.currentTime;
    l.gain.gain.setTargetAtTime(Math.max(0, level), t, tc);
    l.src.playbackRate.setTargetAtTime(Math.max(0.5, Math.min(2, rate)), t, 0.05);
    return true;
  }
  /** Play once; returns false when the clip is not in the bank so a caller can do something else. */
  oneShot(id, level = 1, {toAir = true, rate = 1} = {}) {
    const buf = this.buffers.get(id); if (!buf) { this.load(id); return false; }
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate;
    const gain = this.ctx.createGain(); gain.gain.value = level;
    src.connect(gain); gain.connect(toAir && this.air ? this.air : this.master); src.start();
    src.onended = () => { try { src.disconnect(); gain.disconnect(); } catch (e) {} };
    return true;
  }
  /** Equal-power crossfade weights for the three V8 loops at a given rpm. */
  static v8Mix(rpm) {
    const x = Math.max(0, Math.min(1, (rpm - 1400) / 800)), y = Math.max(0, Math.min(1, (rpm - 4000) / 1200));
    const idle = Math.cos(x * Math.PI / 2), mid = Math.sin(x * Math.PI / 2) * Math.cos(y * Math.PI / 2), roar = Math.sin(y * Math.PI / 2);
    return {'v8-idle': idle, 'v8-cruise': mid, 'v8-roar': roar};
  }
  hasV8Loops() { return ['v8-idle', 'v8-cruise', 'v8-roar'].every(id => this.buffers.has(id)); }
  /** Drive every loop from the app's state. rpm is the sound's rev counter (0 when stopped). */
  update({rpm = 0, throttle = 0, running = false, view = 'car', wheelSpeed = 0, machineRunning = false, enabled = true} = {}) {
    const on = enabled;
    if (this.hasV8Loops()) {
      const mix = SampleBank.v8Mix(rpm), load = 0.55 + 0.45 * Math.min(1, Math.max(0, throttle));
      for (const id of ['v8-idle', 'v8-cruise', 'v8-roar']) {
        /* v6.92 — the driver hears his own V8: in the seat the loops play a little under the hall's level, through the firewall */
        const level = on && running ? mix[id] * load * (view === 'cockpit' || view === 'cog' ? 0.85 : 1) : 0;
        this.setLoop(id, level, rpm > 0 ? rpm / LOOP_RPM[id] : 1);
      }
    }
    const inCab = view === 'cockpit' || view === 'cog', engineOn = on && running, norm = Math.min(1, Math.max(0, (rpm - 800) / 6400)), cab = inCab ? 0.5 : 1;
    /* v5.79 — the chain drive is off the engine (the cog is the steering wheel); its loop stays in the pack unplayed */
    this.setLoop('chain-run', 0, 1);
    this.setLoop('belt-run', engineOn ? Math.cos(norm * Math.PI / 2) * 0.10 * cab : 0, 0.85 + norm * 0.5);
    this.setLoop('belt-run-fast', engineOn ? Math.sin(norm * Math.PI / 2) * 0.12 * cab : 0, 0.9 + norm * 0.3);
    this.setLoop('fans-run', engineOn ? (0.06 + norm * 0.06) * cab : 0, 0.9 + norm * 0.4);
    this.setLoop('dyno-rollers', on && wheelSpeed > 0.02 ? Math.min(0.22, wheelSpeed * 0.9) * cab : 0, 0.8 + Math.min(1, wheelSpeed) * 0.6);
    /* the column's assist unit under the dash (the machine's own motor and box): a hum under the V8 in the seat, no longer instead of it */
    this.setLoop('machine-run', on && inCab && machineRunning ? 0.14 : 0, 1, {toAir: false});
    this.setLoop('workshop-tone', on ? 0.05 : 0, 1, {toAir: false, tc: 0.5});
  }
  stopAll() { for (const l of this.loops.values()) { try { l.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.03); } catch (e) {} } }
}

export class V8Audio {
  constructor() { this.context = null; this.enabled = false; this.distance = 6; }

  async toggle() {
    if (!this.context) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) throw Error('Audio not available');
      const c = this.context = new C();

      this.master = c.createGain(); this.master.gain.value = 0;
      this.master.connect(c.destination);

      /* THE CAMERA'S OWN FILTER, from Andrew's brief: pull back from the block and the top end goes with the
         distance, exactly as it does walking away from a running car in a workshop. */
      this.air = c.createBiquadFilter();
      this.air.type = 'lowpass'; this.air.frequency.value = 3200; this.air.Q.value = 0.6;
      /* v6.92 — the duck: everything that comes through the air (the V8, its loops, the hall's clips) passes this gain, which the radio
         pulls down about 10 dB while Coates FM plays. The cockpit's clicks and the radio itself go straight to the master. */
      this.duck = c.createGain(); this.duck.gain.value = 1;
      this.air.connect(this.duck); this.duck.connect(this.master);
      this.foley = new Foley(c, this.master);

      /* THE PIPE — fixed resonances AFTER the loop, so they do not pitch-shift with the revs.
         Andrew Fisher, 22 Sep 2026: a deep, roaring, beautiful-sounding V8. Deep is the bottom two octaves:
         a long collector rings low, so a peak at 72 Hz and a shelf under 160 Hz carry the weight, and the
         firing fundamental at idle (57 Hz for a V8 at 850 rpm) sits right on them. Roar is the rasp above
         the note that opens with the throttle: a 760 Hz peak whose gain follows load, under a lowpass that
         opens with it. The numbers are checked in tests/audio.test.mjs by running the cycle through this
         same chain offline and reading where the energy lands. */
      const biquad = (type, frequency, Q, gain = 0) => { const f = c.createBiquadFilter(); f.type = type; f.frequency.value = frequency; f.Q.value = Q; f.gain.value = gain; return f; };
      this.deep = biquad('peaking', 72, 1.2, 7);
      this.shelf = biquad('lowshelf', 160, 0.7, 5);
      this.pipe = biquad('peaking', 118, 1.5, 9);
      this.body = biquad('peaking', 355, 1.1, 5);
      this.rasp = biquad('peaking', 760, 1.4, 0);
      this.top = biquad('lowpass', 900, 0.8);
      this.deep.connect(this.shelf); this.shelf.connect(this.pipe); this.pipe.connect(this.body); this.body.connect(this.rasp); this.rasp.connect(this.top); this.top.connect(this.air);

      /* the engine itself: one cycle, looped, its rate following the crank */
      this.engineGain = c.createGain(); this.engineGain.gain.value = 1;
      this.engineGain.connect(this.deep);
      this.cycle = c.createBufferSource();
      this.cycle.buffer = cycleBuffer(c);
      this.cycle.loop = true;
      this.cycle.connect(this.engineGain);
      this.cycle.start();

      /* induction: broadband, rising with throttle, so an open throttle has air in it and not just pulses */
      const size = c.sampleRate * 2, noise = c.createBuffer(1, size, c.sampleRate), d = noise.getChannelData(0);
      let seed = 313;
      for (let i = 0; i < size; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; d[i] = seed / 2147483648 - 1; }
      this.noise = c.createBufferSource(); this.noise.buffer = noise; this.noise.loop = true;
      this.intake = c.createBiquadFilter();
      this.intake.type = 'bandpass'; this.intake.frequency.value = 620; this.intake.Q.value = 0.7;
      this.intakeGain = c.createGain(); this.intakeGain.gain.value = 0;
      this.noise.connect(this.intake); this.intake.connect(this.intakeGain);
      this.intakeGain.connect(this.air);
      this.noise.start();
    }
    await this.context.resume();
    this.enabled = !this.enabled;
    if (this.enabled && !this.bank) {
      this.bank = new SampleBank(this.context, {air: this.air, master: this.master});
      this.bank.warm().then(loaded => { this.bankLoaded = loaded; });
    }
    /* the radio follows the sound: off with it, and back on with it if the channel is still open */
    if (!this.enabled) this.stopRadio(true); else if (this.radioWanted) { this.fx('radio-on'); this.startRadio(); }
    return this.enabled;
  }
  /** v6.92 — a synthesised mechanical sound from the cockpit (Foley below). Silent when sound is off; never throws. */
  fx(id, level = 1) { if (!this.enabled || !this.foley) return false; try { return this.foley.play(id, level); } catch (e) { return false; } }
  /** v6.92 — the cockpit's running systems, once a frame: the fuel pump's hum while it runs, the radiator fans' whirr. */
  ambient(state) { if (!this.foley) return; try { this.foley.ambient(this.enabled ? state : {}); } catch (e) {} }
  /** v6.92 — COATES FM. RADIO on: a click and a burst of static, then assets/audio/coates-fm.mp3 through a radio's band (250 Hz to
   *  5 kHz, a little saturation) with everything through the air ducked about 10 dB under it; RADIO again, or the end of the track,
   *  and it clicks off and the V8 comes back up. The file is fetched only once sound is on (the bank loads it on the first RADIO); if it
   *  is not there the radio is static, briefly, and nothing fails. onEnd is called when the track plays out. */
  setRadio(on, {onEnd = null, volume = null} = {}) {
    this.radioWanted = !!on; if (onEnd) this.radioOnEnd = onEnd; if (volume !== null) this.radioVolume = volume;
    if (!this.enabled || !this.context) return false;
    if (on) { this.fx('radio-on'); this.startRadio(); } else { this.fx('radio-off'); this.stopRadio(); }
    return true;
  }
  setRadioVolume(v) { this.radioVolume = Math.max(0, Math.min(1, v)); if (this.radioOut && this.context) this.radioOut.gain.setTargetAtTime(1.6 * this.radioVolume, this.context.currentTime, 0.04); }
  async startRadio() {
    const c = this.context; if (!c || !this.bank) return;
    const token = this.radioToken = (this.radioToken || 0) + 1;
    const buf = await this.bank.load('coates-fm');
    if (token !== this.radioToken || !this.radioWanted || !this.enabled) return;
    if (!buf) { this.radioMissing = true; this.fx('static'); return; }
    this.stopRadio(true);
    const src = c.createBufferSource(); src.buffer = buf;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 250; hp.Q.value = 0.7;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5000; lp.Q.value = 0.7;
    const sat = c.createWaveShaper(); sat.curve = Foley.saturation(1.8); sat.oversample = '2x';
    const out = c.createGain(); out.gain.value = 0; out.gain.setTargetAtTime(1.6 * (this.radioVolume ?? 0.7), c.currentTime + 0.12, 0.05);
    src.connect(hp); hp.connect(lp); lp.connect(sat); sat.connect(out); out.connect(this.master);
    src.onended = () => { if (this.radioSrc !== src) return; this.radioSrc = null; this.duck.gain.setTargetAtTime(1, c.currentTime, 0.25); if (this.radioWanted) { this.radioWanted = false; this.fx('radio-off'); if (this.radioOnEnd) this.radioOnEnd(); } };
    src.start(c.currentTime + 0.12); this.radioSrc = src; this.radioOut = out; this.radioPlaying = true;
    this.duck.gain.setTargetAtTime(0.316, c.currentTime, 0.12);   /* −10 dB */
  }
  stopRadio(silent = false) {
    this.radioToken = (this.radioToken || 0) + 1; this.radioPlaying = false;
    const c = this.context; if (!c) return;
    if (this.radioSrc) { const src = this.radioSrc, out = this.radioOut; this.radioSrc = null; try { out.gain.setTargetAtTime(0, c.currentTime, silent ? 0.01 : 0.03); src.stop(c.currentTime + 0.15); } catch (e) {} }
    if (this.duck) this.duck.gain.setTargetAtTime(1, c.currentTime, 0.2);
  }
  /** One of the approved clips, once. Silent when sound is off or the clip is not in the bank. */
  play(id, level = 1, opts) { if (!this.enabled || !this.bank) return false; return this.bank.oneShot(id, level, opts); }
  /** The app's state for the sample loops, once per frame after update(). */
  drive(state) { if (!this.bank) return; this.bank.update({...state, enabled: this.enabled && !state.hidden}); }

  /** How far the listener is from the block, in metres. The camera sets this; the filter follows it. */
  setDistance(m) { this.distance = Math.max(0.4, Number(m) || 6); }

  update(rpm, throttle, hidden = false) {
    if (!this.context) return;
    const c = this.context, t = c.currentTime;
    const on = this.enabled && !hidden && rpm > 1;
    const revs = Math.max(0, rpm);

    /* playbackRate IS the rev counter: the cycle was drawn at REF_RPM, so this is simply how much faster the
       crank is turning than the drawing. One buffer, every engine speed, no crossfade seams. */
    const rate = Math.max(IDLE_RPM / REF_RPM, revs / REF_RPM);   /* it never chugs below a real idle */
    this.cycle.playbackRate.setTargetAtTime(rate, t, 0.05);

    const load = Math.min(1, Math.max(0, throttle));
    const norm = Math.min(1, Math.max(0, (revs - 800) / 6400));   /* idle to redline */

    /* the recorded V8 replaces the synthesis when all three loops have loaded; until then, or without them, the synthesis carries the note */
    const sampled = !!(this.bank && this.bank.hasV8Loops());
    this.master.gain.setTargetAtTime(this.enabled && !hidden ? (on ? 0.095 + load * 0.065 : 0.06) : 0, t, 0.06);
    this.engineGain.gain.setTargetAtTime(sampled ? 0 : (on ? 0.72 + load * 0.28 : 0), t, 0.08);

    /* a closed throttle at revs is the overrun: quieter, duller, and the induction drops away */
    this.top.frequency.setTargetAtTime(520 + load * 2600 + norm * 900, t, 0.1);
    this.body.gain.setTargetAtTime(3 + load * 6, t, 0.12);
    this.rasp.gain.setTargetAtTime(load * (4 + norm * 4), t, 0.12);   /* the roar opens with the throttle */
    this.deep.gain.setTargetAtTime(7 - norm * 2.5, t, 0.15);          /* and the bottom eases as it climbs */
    this.intakeGain.gain.setTargetAtTime(on ? load * (0.05 + norm * 0.14) : 0, t, 0.12);
    this.intake.frequency.setTargetAtTime(430 + norm * 900, t, 0.1);

    /* and the room: the further the camera, the less top end survives the air between */
    const d = this.distance;
    this.air.frequency.setTargetAtTime(Math.max(700, 9000 / Math.max(1, d * 0.55)), t, 0.2);
  }

  quiet() { if (this.context) this.master.gain.setTargetAtTime(0, this.context.currentTime, 0.03); }
  /** the pack's clip ids plus the synthesised ones, for a harness */
  static get fxIds() { return Object.keys(FOLEY); }
  dispose() { this.quiet(); this.context?.close(); this.context = null; }
}

/** v6.92 — THE COCKPIT'S CLICKS AND CLANGS. Andrew Fisher, 27 Sep 2026: "more clicks and clangs operating systems inside the cockpit that
 *  work". Every one is synthesised here with Web Audio at the moment it is needed — nothing is downloaded, nothing is paid for — from
 *  four kinds of sound a real cockpit makes:
 *    a CLICK: a burst of noise a few milliseconds long through a band-pass (the switch's contact, a button's dome, a detent);
 *    a THUNK: a sine that drops in pitch and dies in tens of milliseconds (a body behind the click: a lever hitting its stop);
 *    a RING: a handful of inharmonic sines, each dying at its own rate (metal struck: a clang, a toggle's spring);
 *    a HUM or a WHINE: an oscillator through a filter under an envelope (the fuel pump, the fans, the static of a radio).
 *  A RELAY is two clicks 8 to 15 ms apart (the armature, then its bounce). Everything plays into the master, so Sound off silences it
 *  and the page's master level sets it. */
const FOLEY = {
  'toggle-on': (k, t, v) => { k.click(t, 0.9 * v, 3400, 0.004, 1.6); k.thunk(t + 0.002, 0.5 * v, 210, 120, 0.03); k.ring(t, 0.10 * v, [[2130, 1, 0.03], [3390, 0.7, 0.022], [5170, 0.5, 0.015]]); },
  'toggle-off': (k, t, v) => { k.click(t, 0.8 * v, 3000, 0.004, 1.6); k.thunk(t + 0.002, 0.45 * v, 190, 110, 0.03); k.ring(t, 0.08 * v, [[1980, 1, 0.03], [3310, 0.7, 0.02]]); },
  'guard-open': (k, t, v) => { k.swish(t, 0.35 * v, 900, 3200, 0.07); k.click(t + 0.075, 0.55 * v, 2600, 0.004, 1.2); k.thunk(t + 0.076, 0.25 * v, 320, 200, 0.02); },
  'guard-close': (k, t, v) => { k.swish(t, 0.3 * v, 2800, 900, 0.06); k.click(t + 0.06, 0.7 * v, 2200, 0.005, 1.2); k.thunk(t + 0.061, 0.4 * v, 260, 150, 0.025); },
  'button': (k, t, v) => { k.click(t, 0.75 * v, 5200, 0.0025, 2.2); k.thunk(t, 0.18 * v, 700, 500, 0.01); k.click(t + 0.075, 0.35 * v, 6600, 0.002, 2.2); },
  'rotary': (k, t, v) => { k.click(t, 0.18 * v, 5200, 0.0015, 3); k.click(t + 0.018, 0.55 * v, 6100, 0.002, 3); k.thunk(t + 0.018, 0.1 * v, 900, 700, 0.008); },
  'key': (k, t, v) => { for (let i = 0; i < 3; i++) k.click(t + i * 0.045, 0.4 * v, 4800 + i * 300, 0.002, 3); k.thunk(t + 0.14, 0.4 * v, 240, 160, 0.03); },
  'relay': (k, t, v) => { k.click(t, 0.8 * v, 2500, 0.0018, 1.4); k.thunk(t, 0.25 * v, 720, 520, 0.008); k.click(t + 0.011, 0.5 * v, 3100, 0.0015, 1.4); },
  'clang': (k, t, v) => { k.click(t, 0.7 * v, 1800, 0.006, 0.8); k.ring(t, 0.9 * v, [[418, 1, 0.34], [1043, 0.62, 0.22], [1757, 0.46, 0.15], [2687, 0.3, 0.1], [3811, 0.2, 0.07], [5230, 0.12, 0.05]]); },
  'dog': (k, t, v) => { k.thunk(t, 0.9 * v, 95, 55, 0.08); k.click(t, 0.5 * v, 1200, 0.006, 1); k.ring(t + 0.004, 0.25 * v, [[640, 1, 0.08], [1490, 0.5, 0.05]]); },
  'lever': (k, t, v) => { k.thunk(t, 0.6 * v, 170, 95, 0.05); k.click(t, 0.5 * v, 1500, 0.004, 1.2); k.ring(t, 0.12 * v, [[980, 1, 0.06], [2210, 0.5, 0.04]]); },
  'paddle': (k, t, v) => { k.click(t, 0.85 * v, 2900, 0.003, 1.6); k.ring(t, 0.12 * v, [[2440, 1, 0.025], [4100, 0.6, 0.018]]); k.click(t + 0.09, 0.3 * v, 3500, 0.002, 2); },
  'solenoid': (k, t, v) => { k.click(t, 0.8 * v, 1800, 0.004, 1); k.thunk(t, 1.0 * v, 78, 48, 0.07); k.noise(t, 0.35 * v, 420, 1, 0.035); },
  'fuel-prime': (k, t, v) => { k.whine(t, 0.28 * v, 140, 215, 1.5, 'sawtooth', 900, 1.4); k.whine(t, 0.08 * v, 280, 430, 1.5, 'sine', 2400, 2); },
  'selftest': (k, t, v) => { k.beep(t, 0.22 * v, 1800, 0.06, 'sine'); k.beep(t + 0.1, 0.22 * v, 2400, 0.08, 'sine'); },
  'fan-spool': (k, t, v) => { FOLEY.relay(k, t, v); k.swish(t + 0.02, 0.4 * v, 240, 1100, 1.2, 1.2); },
  'fan-stop': (k, t, v) => { FOLEY.relay(k, t, v); k.swish(t + 0.02, 0.3 * v, 1000, 200, 0.9, 1.2); },
  'lamp': (k, t, v) => { FOLEY.relay(k, t, v); k.beep(t + 0.02, 0.05 * v, 3300, 0.03, 'sine'); },
  'pit-on': (k, t, v) => { k.beep(t, 0.3 * v, 1600, 0.08, 'square'); k.beep(t + 0.14, 0.3 * v, 1600, 0.08, 'square'); },
  'pit-off': (k, t, v) => { k.beep(t, 0.3 * v, 1100, 0.12, 'square'); },
  'radio-on': (k, t, v) => { FOLEY.relay(k, t, v); k.noise(t + 0.02, 0.35 * v, 2100, 0.7, 0.28); k.beep(t + 0.3, 0.06 * v, 1250, 0.05, 'sine'); },
  'radio-off': (k, t, v) => { k.click(t, 0.7 * v, 2600, 0.003, 1.4); k.noise(t + 0.004, 0.3 * v, 1900, 0.8, 0.07); },
  'static': (k, t, v) => { k.noise(t, 0.3 * v, 1800, 0.5, 1.2); k.noise(t, 0.12 * v, 4200, 1.5, 0.9); },
  'ratchet': (k, t, v) => { for (let i = 0; i < 7; i++) k.click(t + i * 0.024, (0.4 + i * 0.05) * v, 3000 + i * 180, 0.002, 2.4); k.thunk(t + 0.18, 0.5 * v, 150, 90, 0.05); },
  'hb-release': (k, t, v) => { k.click(t, 0.6 * v, 4200, 0.003, 2); k.thunk(t + 0.1, 0.7 * v, 120, 70, 0.07); k.ring(t + 0.1, 0.15 * v, [[880, 1, 0.08], [1990, 0.5, 0.05]]); },
  'arm': (k, t, v) => { FOLEY.relay(k, t, v); k.beep(t + 0.05, 0.18 * v, 950, 0.1, 'square'); k.beep(t + 0.2, 0.18 * v, 950, 0.1, 'square'); },
  'disarm': (k, t, v) => { FOLEY.relay(k, t, v); k.beep(t + 0.05, 0.16 * v, 700, 0.14, 'square'); },
};
export const FOLEY_IDS = Object.keys(FOLEY);
export class Foley {
  constructor(ctx, out) {
    this.ctx = ctx; this.out = ctx.createGain(); this.out.gain.value = 1.1; this.out.connect(out);
    const n = ctx.sampleRate, b = ctx.createBuffer(1, n, n), d = b.getChannelData(0); let seed = 26;
    for (let i = 0; i < n; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; d[i] = seed / 2147483648 - 1; }
    this.noiseBuf = b; this.loops = {};
  }
  static saturation(k = 2) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } return c; }
  play(id, level = 1) { const f = FOLEY[id]; if (!f) return false; f(this, this.ctx.currentTime + 0.005, level); return true; }
  env(t, peak, attack, decay, hold = 0) { const g = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + attack); if (hold) g.gain.setValueAtTime(peak, t + attack + hold); g.gain.setTargetAtTime(0, t + attack + hold, decay / 3); g.connect(this.out); return g; }
  src(t, dur) { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); s.onended = () => { try { s.disconnect(); } catch (e) {} }; return s; }
  /* a click: a few milliseconds of band-passed noise */
  click(t, v, f, dur = 0.003, q = 1.5) { const s = this.src(t, dur * 4), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; s.connect(bp); bp.connect(this.env(t, v, 0.0004, dur)); }
  /* noise with a body: a longer burst through a band-pass */
  noise(t, v, f, q, dur) { const s = this.src(t, dur * 1.5), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; s.connect(bp); bp.connect(this.env(t, v, 0.003, dur)); }
  /* a swish: band-passed noise whose band sweeps (a cover flipping, a fan spooling) */
  swish(t, v, f0, f1, dur, q = 1.5) { const s = this.src(t, dur * 1.3), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(f0, t); bp.frequency.exponentialRampToValueAtTime(f1, t + dur); s.connect(bp); bp.connect(this.env(t, v, dur * 0.3, dur * 0.6, dur * 0.2)); }
  /* a thunk: a sine falling in pitch, gone in tens of milliseconds */
  thunk(t, v, f0, f1, dur) { const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); o.connect(this.env(t, v, 0.001, dur)); o.start(t); o.stop(t + dur * 2 + 0.02); o.onended = () => { try { o.disconnect(); } catch (e) {} }; }
  /* a ring: inharmonic partials [frequency, amplitude, decay seconds], each dying at its own rate — metal struck */
  ring(t, v, partials) { for (const [f, a, d] of partials) { const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(this.env(t, v * a / partials.length * 2, 0.0008, d)); o.start(t); o.stop(t + d * 2.5 + 0.02); o.onended = () => { try { o.disconnect(); } catch (e) {} }; } }
  beep(t, v, f, dur, type = 'sine') { const o = this.ctx.createOscillator(); o.type = type; o.frequency.value = f; const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000; o.connect(lp); lp.connect(this.env(t, v, 0.004, 0.02, dur)); o.start(t); o.stop(t + dur + 0.1); o.onended = () => { try { o.disconnect(); lp.disconnect(); } catch (e) {} }; }
  /* a whine: an oscillator gliding up under a band-pass (the fuel pump priming) */
  whine(t, v, f0, f1, dur, type, bpF, q) { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.4); const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = bpF; bp.Q.value = q; o.connect(bp); bp.connect(this.env(t, v, 0.06, 0.12, dur - 0.15)); o.start(t); o.stop(t + dur + 0.4); o.onended = () => { try { o.disconnect(); bp.disconnect(); } catch (e) {} }; }
  /* the running systems: a loop each, created the first time it is wanted and faded to its level every frame */
  loop(id, make) { if (!this.loops[id]) { const g = this.ctx.createGain(); g.gain.value = 0; g.connect(this.out); make(g); this.loops[id] = g; } return this.loops[id]; }
  ambient({fuelHum = false, fan = false} = {}) {
    const t = this.ctx.currentTime;
    if (fuelHum || this.loops.fuel) this.loop('fuel', g => { const o = this.ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 212; const o2 = this.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 5.3; const lfo = this.ctx.createGain(); lfo.gain.value = 3; o2.connect(lfo); lfo.connect(o.frequency); const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 850; bp.Q.value = 2.2; o.connect(bp); bp.connect(g); o.start(); o2.start(); }).gain.setTargetAtTime(fuelHum ? 0.035 : 0, t, 0.15);
    if (fan || this.loops.fan) this.loop('fan', g => { const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true; const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 0.9; const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; s.connect(bp); bp.connect(lp); lp.connect(g); s.start(); }).gain.setTargetAtTime(fan ? 0.07 : 0, t, fan ? 0.5 : 0.35);
  }
}
