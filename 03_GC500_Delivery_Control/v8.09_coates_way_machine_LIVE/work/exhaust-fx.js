/* v5.84 — FIRE AND HEAT (Andrew Fisher, 26 Sep 2026: "revisit and improve everything in the machine … up the ante … push
   your limits"). Two things a V8 on a dyno does that this one did not:

   - FLAMES OUT OF THE SIDE EXITS. Lift off the throttle from high revs and the pipes bark: a short burst of fire from each
     exhaust mouth, three or four pops that shrink, the same moment the v8-overrun clip plays. Hold it on the limiter and it
     crackles with small flickers. Each flame is three additive sprites along the pipe's axis — a white-hot core, an orange
     body and a fading tail — parented to the exhaust assembly, so it goes wherever the exhaust goes when the powertrain is
     pulled apart. Nothing is drawn when there is no flame (the sprites are hidden, not faded to nothing).
   - HEADERS THAT HEAT UP. The four-into-one headers and side pipes take on a dull red, then orange glow as they are worked:
     heat builds with revs × throttle over several seconds and bleeds away over twenty, the way steel does. Their own
     material copy (the chrome everything else shares is left alone), so only the pipes glow.

   An illustration, like the rest of the rig: the flame is not a combustion model and the glow is not a thermal one. */
function flameTexture(T) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(.18, 'rgba(255,230,150,.95)'); g.addColorStop(.42, 'rgba(255,140,40,.65)');
  g.addColorStop(.72, 'rgba(230,60,10,.22)'); g.addColorStop(1, 'rgba(120,20,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
export function buildExhaustFX(T, engine, {light = true} = {}) {
  const tex = flameTexture(T), flames = [], pipes = [];
  const mk = (color, opacity) => new T.SpriteMaterial({map: tex, color, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false, fog: false});
  for (const id of ['exhaust-near', 'exhaust-far']) {
    const part = (engine.removable || []).find(p => p.id === id); if (!part) continue;
    const side = id === 'exhaust-near' ? 1 : -1, g = part.group;
    /* the exhaust mouth and the pipe's last run, from car-powertrain.js: the side pipe ends at (1.027, .26, ±.868) */
    const mouth = new T.Vector3(1.032, .26, side * .87), dir = new T.Vector3(.30, .02, side * .085).normalize();
    const root = new T.Group(); root.name = 'Exhaust flame ' + (side > 0 ? 'right' : 'left'); root.position.copy(mouth); g.add(root);
    const core = new T.Sprite(mk(0xfff4d8, 1)), body = new T.Sprite(mk(0xff8a2a, .9)), tail = new T.Sprite(mk(0xff4a12, .55));
    for (const s of [core, body, tail]) { s.visible = false; s.renderOrder = 10; root.add(s); }
    flames.push({root, core, body, tail, dir, side, level: 0, seed: Math.random() * 100});
    /* the pipes' own material, so only they glow */
    g.traverse(o => { if (o.isMesh && /headers and side exhaust/i.test(o.name)) { o.material = o.material.clone(); o.material.emissive = new T.Color(0x000000); pipes.push(o.material); } });
  }
  let glow = null;
  if (light && flames.length) { glow = new T.PointLight(0xff7a2a, 0, 2.6, 2); glow.name = 'Exhaust flame light'; flames[0].root.parent.parent.add(glow); glow.position.set(1.05, .28, 0); }
  const pops = []; let heat = 0, limiterAt = 0, prevThrottle = 0, t = 0;
  const api = {
    /* a burst from both pipes: n pops, the first the biggest */
    pop(strength = 1, n = 4) { for (let i = 0; i < n; i++) pops.push({at: t + i * (.07 + Math.random() * .09), size: strength * (1 - i * .18) * (.8 + Math.random() * .4), dur: .09 + Math.random() * .08}); },
    get heat() { return heat; },
    get flaming() { return flames.some(f => f.level > .02); },
    update(dt, {rpm = 0, throttle = 0, running = false, visible = true} = {}) {
      t += dt; const norm = Math.max(0, Math.min(1, (rpm - 800) / 6700));
      /* heat: builds with load, bleeds away slowly; nothing when stopped but the cooling */
      const target = running ? Math.pow(norm, 1.4) * (.35 + .65 * throttle) : 0;
      heat += (target - heat) * (1 - Math.exp(-dt * (target > heat ? .35 : .06)));
      const glowK = Math.max(0, heat - .18) / .82;
      for (const m of pipes) { m.emissive.setRGB(1, .16 + .20 * glowK, .02).multiplyScalar(Math.pow(glowK, 1.8) * .75); }   /* dull red, to orange when worked hard — never white */
      /* lifts from high revs pop on their own; the limiter crackles */
      if (running && prevThrottle - throttle > .25 && rpm > 3200) api.pop(Math.min(1.2, .5 + norm), 3 + Math.round(norm * 2));
      if (running && throttle > .95 && rpm > 7150 && t > limiterAt) { limiterAt = t + .22 + Math.random() * .3; api.pop(.35 + Math.random() * .25, 1); }
      prevThrottle = throttle;
      let level = 0; for (let i = pops.length - 1; i >= 0; i--) { const p = pops[i], u = (t - p.at) / p.dur; if (u > 1) { pops.splice(i, 1); continue; } if (u >= 0) level = Math.max(level, p.size * Math.sin(Math.PI * Math.min(1, u * 1.3))); }
      for (const f of flames) {
        const flick = .75 + .25 * Math.sin(t * 61 + f.seed) * Math.sin(t * 37 + f.seed * 2), L = visible ? level * flick : 0; f.level = L;
        const on = L > .02; f.core.visible = f.body.visible = f.tail.visible = on; if (!on) continue;
        const len = .14 + L * .62;
        f.core.position.copy(f.dir).multiplyScalar(len * .15); f.core.scale.setScalar(.08 + L * .13);
        f.body.position.copy(f.dir).multiplyScalar(len * .45); f.body.scale.set(.16 + L * .30, .13 + L * .22, 1);
        f.tail.position.copy(f.dir).multiplyScalar(len * .85); f.tail.scale.set(.18 + L * .40, .15 + L * .28, 1);
        f.body.material.opacity = Math.min(1, .5 + L * .6); f.tail.material.opacity = Math.min(.8, .25 + L * .5);
      }
      if (glow) glow.intensity = visible ? level * 6 + Math.pow(glowK, 2) * .6 : 0;
    }
  };
  return api;
}
