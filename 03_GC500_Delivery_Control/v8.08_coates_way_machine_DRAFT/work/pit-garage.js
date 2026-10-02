/* THE COATES PIT GARAGE. Andrew Fisher, 23 Sep 2026: the car in a fully equipped 3D pit garage, Coates
   style, with real wow factor.

   A double pit garage at night, open along its front to the pit lane, with the #26 in the near bay and the
   crew's gear where a crew would put it: the engineers' desk and wall screen across the back, tool chests,
   hose reels, the pit board and the wheel guns along the working wall, slicks racked two high behind the second
   bay, and — because this is Coates — a Coates lighting tower and a Coates generator standing in the far corner
   doing the job they do on every site. Coates orange on black, brushed steel, polished floor, LED panels on the
   trusses, the orange bay line and a painted 26 on the floor, the pit wall and its gantry beyond the door.

   Everything is drawn here from primitives — no downloaded models, no outside textures. Every sign is drawn
   into a canvas from the words the page already owns: COATES, INDUSTRIAL SOLUTIONS, GC500 2026, SURFERS
   PARADISE, PIT 26, and the wording of the Coates Way. No lap time, speed or position is invented anywhere; the
   pit board shows the car's number and its name, nothing more.

   Cheap on purpose: the fixed geometry is merged by material into a handful of meshes, the slicks and the
   truss lattice are instanced, and the whole garage adds about twenty draw calls to the frame. The car keeps
   its contact shadow; the garage takes it and casts none. The polished floor's reflection is the same
   Reflector as before, now the size of the bay, and still switched off on the Laptop rung by car-app.js. */
import * as T from './vendor/three.module.js';
import {Reflector} from './vendor/addons/objects/Reflector.js';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';
import {buildMachinery,craneRunY} from './pit-machinery.js';
import {print, currentPrintScale, MOBILE} from './fx-quality.js';

export const COATES_ORANGE = '#FF6A13';
/* THE HALL. Andrew Fisher, 23 Sep 2026: a huge Coates garage, with no wall in the way when
   looking at the car. So the pit garage is a workshop hall: 36 m long, 28 m wide, 9 m to the roof — the car in the
   middle on the dyno, and at the camera's full zoom-out (16 m) still no wall in the way. The car sits with its
   nose at x = -2.5 and its tail at +2.5, tyres on y = 0, centred on z = 0; the roller door is in the front wall
   (x = front), open to the pit lane. */
/* v6.92 — BIGGER, AND SHUT. Andrew Fisher, 27 Sep 2026: "Pit needs to be bigger. More detail. More mechanical things operating. Almost like
   its 360 view everywhere so you can't look outside the pit." The hall is half as big again — 54 m long, 42 m wide, 12 m to the roof — the
   roller door is down, the pit lane and the grandstand are gone, and the camera cannot leave the four walls (car-app.js confineCamera).
   The car, the dyno cell, the crew's aisles and the forklift's bays are exactly where they were; the walls moved out round them and the
   floor between is full of machines at work (pit-machinery.js). */
export const GARAGE = Object.freeze({
  front: -27, back: 27,          /* the front wall (the roller door, shut) and the back wall, along x */
  near: 21, far: -21,            /* the side walls along z: the working wall is far (-z), the transporter is near (+z) */
  height: 12.0, lintel: 6.5,     /* roof, and the underside of the roller-door beam */
  doorNear: 5.5, doorFar: -5.5,  /* the roller door, along z */
  bayNear: 3.4, bayFar: -3.4,    /* the painted outline of the dyno cell round the #26 */
  bayFront: -6.2, bayBack: 5.2,
  pitWall: -39,                  /* v6.92: nothing is built out there any more; kept for anything that still reads it */
});
/* THE DYNO. The rear wheels (axle x = 1.222, radius .334, at z = ±.83 — car-gc500.js CAR_AXLES) sit in the cradle
   between two rollers each side; the geometry below puts the roller axes where a .334 tyre touches both. */
/* v5.81 — the wheel mechanic's gun stands in the second holster of the gun stand at the head of the cell (its socket up, its
   grip toward the cell); crew.js takes it from here and puts it back */
export const GUN_STAND = Object.freeze({x: GARAGE.bayFront - 1.2 + .14, y: .78, z: GARAGE.bayFar - .6});
export const DYNO = Object.freeze({axleX: 1.222, tyreR: .334, wheelZ: .83, rollerR: .22, rollerDX: .30, rollerLen: .56, axisY: -.132, pit: {x0: .35, x1: 2.1, z0: -1.4, z1: 1.4, depth: .5}});

/* ---------------------------------------------------------------- helpers */
/* v8.08 — every canvas here is a PRINT (fx-quality.js): drawn at the size given on load, as before, and drawn again at 1.5× or 2× the
   pixels on the Balanced, High and Ultra rungs when the page is idle, so the signs stay crisp in a 4K frame. The drawing works in the
   size given (w × h); the canvas under it may be bigger. `maxScale` 1 keeps a pattern or a soft gradient at its own size. */
function textCanvas(w, h, draw, {maxScale = 2} = {}) {
  return print(w, h, draw, {mode: 'logical', maxScale}).texture;
}
/* one line of type, centred, in Arial — the page's own face — on a flat colour */
function sign(text, {w = 1024, h = 256, bg = '#0d1216', fg = COATES_ORANGE, weight = 800, size = null, letter = 0.04, sub = null, subFg = '#c9d1d6'} = {}) {
  return textCanvas(w, h, (g, W, H) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const px = size || Math.floor(H * (sub ? .46 : .62));
    g.font = `${weight} ${px}px Arial, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.letterSpacing = `${Math.round(px * letter)}px`;
    g.fillStyle = fg; g.fillText(text, W / 2, sub ? H * .40 : H / 2);
    if (sub) { g.font = `600 ${Math.floor(px * .42)}px Arial, Helvetica, sans-serif`; g.letterSpacing = `${Math.round(px * .12)}px`; g.fillStyle = subFg; g.fillText(sub, W / 2, H * .76); }
  });
}
/* the wall screen: the Coates Way's own words in the shape of a timing wall, and not one figure */
function wallScreen() {
  return textCanvas(1536, 864, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#0b1014'); grad.addColorStop(1, '#131b21');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    g.fillStyle = COATES_ORANGE; g.fillRect(0, 0, W, 14);
    g.textBaseline = 'middle'; g.textAlign = 'left';
    g.font = '800 64px Arial, Helvetica, sans-serif'; g.letterSpacing = '4px'; g.fillStyle = '#f4f6f7'; g.fillText('COATES 26', 60, 92);
    g.font = '600 40px Arial, Helvetica, sans-serif'; g.letterSpacing = '6px'; g.fillStyle = '#9fb0ba'; g.textAlign = 'right'; g.fillText('GC500 · 2026 · SURFERS PARADISE', W - 60, 92);
    g.fillStyle = '#1f2a31'; g.fillRect(60, 140, W - 120, 3);
    const rows = [['BEST SERVICE & VALUE', 'the centre'], ['PEOPLE', 'pillar'], ['OPERATIONS', 'pillar'], ['ASSETS', 'pillar'], ['FINANCIALS', 'pillar'],
                  ['BALANCED SCORECARD · OPERATING CADENCE', 'the third ring'], ['DISCIPLINED EXECUTION', 'the fourth ring']];
    rows.forEach((r, i) => {
      const y = 200 + i * 86;
      g.fillStyle = i % 2 ? '#0f161b' : '#121a20'; g.fillRect(60, y - 34, W - 120, 72);
      g.fillStyle = i === 0 ? COATES_ORANGE : '#3a4750'; g.fillRect(60, y - 34, 10, 72);
      g.textAlign = 'left'; g.fillStyle = '#eef1f3'; g.font = '700 42px Arial, Helvetica, sans-serif'; g.letterSpacing = '2px'; g.fillText(r[0], 96, y + 2);
      g.textAlign = 'right'; g.fillStyle = '#8b9aa3'; g.font = '600 30px Arial, Helvetica, sans-serif'; g.letterSpacing = '3px'; g.fillText(r[1].toUpperCase(), W - 96, y + 2);
    });
    g.textAlign = 'left'; g.fillStyle = '#6f7f89'; g.font = '600 28px Arial, Helvetica, sans-serif'; g.letterSpacing = '4px'; g.fillText('THE COATES WAY · V8 CONNECTED · EVERY PART CONNECTED', 60, H - 44);
  });
}
/* the number painted on the floor, and the bay outline's own word */
function floorNumber() {
  return textCanvas(1024, 1024, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    g.font = 'italic 900 720px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,255,255,.88)'; g.fillText('26', W / 2, H / 2 + 20);
  });
}
function hatch() {
  return textCanvas(512, 128, (g, W, H) => {
    g.clearRect(0, 0, W, H); g.fillStyle = 'rgba(240,240,236,.9)';
    for (let x = -H; x < W + H; x += 64) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 24, H); g.lineTo(x + 24 + H, 0); g.lineTo(x + H, 0); g.closePath(); g.fill(); }
  });
}

/* SURFACES, drawn once. Andrew Fisher, 23 Sep 2026: the pit garage looked poor and needed improving,
   and so did the car — the live page on a phone or an ordinary laptop runs the Laptop rung,
   which has no floor reflection and no ambient-occlusion pass, and a flat-coloured floor lit by warm lamps came
   out as a slab of brown with nothing on it. These maps give every rung something to render: grain and a
   roughness map on the epoxy so its reflection breaks up like a real floor, a shaded map on the walls so they
   darken into the floor and the ceiling instead of reading as one flat colour, and the gradients the fake
   contact shadows and the light beams are drawn with. Nothing here is a downloaded picture. */
function noiseInto(g, W, H, seed, amount) {
  W = g.canvas.width; H = g.canvas.height;   /* v8.08: the canvas's own pixels — a print may be drawn bigger than its logical size */
  const img = g.getImageData(0, 0, W, H), d = img.data; let s = seed >>> 0;
  for (let i = 0; i < d.length; i += 4) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; const n = (s / 4294967296 - .5) * amount; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(img, 0, 0);
}
/* the epoxy: a near-black floor with the faint mottle of a trowelled coat and the seams of the slabs under it */
function floorMap() {
  const t = textCanvas(1024, 1024, (g, W, H) => {
    g.fillStyle = '#0d1114'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { const x = (i * 7919) % W, y = (i * 104729) % H, r = 40 + (i * 31) % 160; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, i % 3 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,0,.05)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    noiseInto(g, W, H, 4242, 9);
    g.strokeStyle = 'rgba(0,0,0,.42)'; g.lineWidth = 3; for (const v of [0, 512]) { g.beginPath(); g.moveTo(v, 0); g.lineTo(v, H); g.stroke(); g.beginPath(); g.moveTo(0, v); g.lineTo(W, v); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2; for (const v of [3, 515]) { g.beginPath(); g.moveTo(v, 0); g.lineTo(v, H); g.stroke(); g.beginPath(); g.moveTo(0, v); g.lineTo(W, v); g.stroke(); }
  });
  t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
function floorRoughness() {
  const t = textCanvas(512, 512, (g, W, H) => {
    g.fillStyle = 'rgb(84,84,84)'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { const x = (i * 6151) % W, y = (i * 12289) % H, r = 20 + (i * 17) % 90; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,.10)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
    noiseInto(g, W, H, 9001, 26);
    g.fillStyle = 'rgb(150,150,150)'; for (const v of [0, 256]) { g.fillRect(v - 1, 0, 3, H); g.fillRect(0, v - 1, W, 3); }
  });
  t.colorSpace = T.NoColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}
/* the walls: the panel colour, shaded down into the skirting and up into the ceiling, with the grain of paint */
function wallMap() {
  const t = textCanvas(256, 1024, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#14191d'); grad.addColorStop(.18, '#1c2328'); grad.addColorStop(.62, '#1f272c'); grad.addColorStop(.93, '#161b1f'); grad.addColorStop(1, '#0e1215');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    noiseInto(g, W, H, 777, 7);
  });
  t.wrapS = T.RepeatWrapping; return t;
}
/* alpha ramps for the drawn shadows: a straight fade and a soft disc (the green channel is what alphaMap reads) */
function ramp() {
  const t = textCanvas(4, 256, (g, W, H) => { const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#000'); grad.addColorStop(1, '#fff'); g.fillStyle = grad; g.fillRect(0, 0, W, H); }, {maxScale: 1});
  t.colorSpace = T.NoColorSpace; return t;   /* v8.08: mipmapped like everything else (a ramp seen edge-on no longer shimmers) */
}
function disc() {
  const t = textCanvas(256, 256, (g, W, H) => { const rg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); rg.addColorStop(0, '#fff'); rg.addColorStop(.45, '#b4b4b4'); rg.addColorStop(1, '#000'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }, {maxScale: 1});
  t.colorSpace = T.NoColorSpace; return t;
}
/* v8.08 — THE FLOOR'S WEAR, once across the whole hall (it does not repeat, unlike the slab texture): red is the grime that dulls the
   epoxy's reflections (read as the ambient occlusion), green is the clear coat's roughness (polished where nobody walks, satin down
   the aisles and the forklift's lane, scuffed where the car's tyres came in from the door and where it stands on the rollers). Drawn
   in the hall's own metres: x along the hall from the door, z across it from the working wall. */
function floorWear(G, D) {
  const L = G.back - G.front, Wd = G.near - G.far, W = 1024, H = Math.round(1024 * Wd / L);
  return textCanvas(W, H, (g) => {
    const X = x => (x - G.front) / L * W, Z = z => (z - G.far) / Wd * H, M = m => m / L * W;
    /* polished: ao 1 (255), clear-coat roughness .20 of the material's .5 → .10 */
    g.fillStyle = 'rgb(255,51,0)'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'source-over';
    const band = (z0, z1, rgb, a) => { g.fillStyle = `rgba(${rgb},${a})`; g.fillRect(0, Z(z0), W, Z(z1) - Z(z0)); };
    /* grime and wear along the walls (where the benches, racks and machines stand and the mop never quite reaches) */
    for (const [z, dir] of [[G.far, 1], [G.near, -1]]) { const gr = g.createLinearGradient(0, Z(z), 0, Z(z + dir * 3.2)); gr.addColorStop(0, 'rgba(178,120,0,.85)'); gr.addColorStop(1, 'rgba(178,120,0,0)'); g.fillStyle = gr; g.fillRect(0, Math.min(Z(z), Z(z + dir * 3.2)), W, Math.abs(Z(z + dir * 3.2) - Z(z))); }
    for (const [x, dir] of [[G.front, 1], [G.back, -1]]) { const gr = g.createLinearGradient(X(x), 0, X(x + dir * 3.2), 0); gr.addColorStop(0, 'rgba(178,120,0,.85)'); gr.addColorStop(1, 'rgba(178,120,0,0)'); g.fillStyle = gr; g.fillRect(Math.min(X(x), X(x + dir * 3.2)), 0, Math.abs(X(x + dir * 3.2) - X(x)), H); }
    /* the walkways along the yellow lines and the forklift's lane: satin, slightly dull */
    band(-8.4, -6.6, '232,92,0', .55); band(6.6, 8.4, '232,92,0', .55); band(-9.4, -7.8, '214,110,0', .6);
    /* the car's way in: two tyre tracks from the roller door to the cell, dark and rough with rubber */
    g.lineCap = 'round';
    for (const z of [-D.wheelZ, D.wheelZ]) for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(120,150,0,${.20 - k * .05})`; g.lineWidth = M(.20 + k * .10); g.beginPath(); g.moveTo(X(G.front + .5), Z(z + (k - 1) * .03)); g.bezierCurveTo(X(-16), Z(z * 1.04), X(-9), Z(z * .98), X(G.bayFront), Z(z)); g.stroke(); }
    /* the cell: rubber dust round the rollers, scuffs where the crew work round the car, the hatch line worn */
    for (const z of [-D.wheelZ, D.wheelZ]) { const rg = g.createRadialGradient(X(D.axleX), Z(z), 0, X(D.axleX), Z(z), M(1.1)); rg.addColorStop(0, 'rgba(110,160,0,.75)'); rg.addColorStop(1, 'rgba(110,160,0,0)'); g.fillStyle = rg; g.fillRect(X(D.axleX) - M(1.1), Z(z) - M(1.1), M(2.2), M(2.2)); }
    { const rg = g.createRadialGradient(X(-.3), Z(0), M(1.6), X(-.3), Z(0), M(4.2)); rg.addColorStop(0, 'rgba(225,85,0,.0)'); rg.addColorStop(.5, 'rgba(225,85,0,.35)'); rg.addColorStop(1, 'rgba(225,85,0,0)'); g.fillStyle = rg; g.fillRect(X(-.3) - M(4.2), Z(0) - M(4.2), M(8.4), M(8.4)); }
    /* scattered scuffs and heel marks: small, many, soft */
    let seed = 2610; const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 420; i++) { const x = G.front + 1 + rnd() * (L - 2), z = G.far + 1 + rnd() * (Wd - 2), r = M(.15 + rnd() * .6), dark = rnd() < .35;
      const rg = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r); rg.addColorStop(0, dark ? 'rgba(170,130,0,.35)' : 'rgba(240,95,0,.35)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(X(x) - r, Z(z) - r, 2 * r, 2 * r); }
  }, {maxScale: 1});
}
/* a lamp's beam, drawn as a soft trapezoid on black for additive blending: bright and narrow at the lamp,
   wide and gone before the floor — no hard silhouette from any angle, unlike a cone */
function beamMap() {
  return textCanvas(256, 512, (g, W, H) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(255,225,190,.95)'); v.addColorStop(.35, 'rgba(255,225,190,.45)'); v.addColorStop(.85, 'rgba(255,225,190,0)');
    g.fillStyle = v; g.beginPath(); g.moveTo(W * .42, 0); g.lineTo(W * .58, 0); g.lineTo(W * .98, H); g.lineTo(W * .02, H); g.closePath(); g.fill();
    const h = g.createLinearGradient(0, 0, W, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(.3, 'rgba(0,0,0,0)'); h.addColorStop(.7, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
    g.fillStyle = h; g.fillRect(0, 0, W, H);
  }, {maxScale: 1});
}

/* THE TWO DOCUMENTS ANDREW SENT ON 23 SEP 2026, to go into the garage — redrawn here from
   their own words at a resolution every word can be read from across the bay or with a nose against it. The
   words are Coates's, verbatim; the layout and colours follow the sheets; nothing is added to them. */
export const LIFE_SAVING_RULES = Object.freeze([
  ['Risk Assessment', '#c4512e', 'I will not commence any work that I am unfamiliar with, that is non-routine, potentially hazardous or impacted by changing conditions without first completing the appropriate Coates risk assessment tool to identify, assess and control risks.'],
  ['High-Risk Work', '#86864a', 'I will not commence any High-Risk Work without a risk assessment being completed and without having signed onto the applicable Safe Work Method Statement (SWMS).'],
  ['Training and Competency', '#4f565c', 'I will be inducted, trained, competent and hold the required certification and licenses to conduct the task.'],
  ['Fit for Work', '#f26f21', 'When I commence work, I will be physically fit, and not impaired by fatigue, injury, distraction, drugs or alcohol. I will wear the required personal protective equipment (PPE) as identified for the task or site rules.'],
  ['Tools and Equipment', '#4f7a3b', 'I will only use tools and equipment that are fit for purpose and for which I am trained, competent and authorised. I will ensure that damaged or defective equipment is tagged out and removed from service.'],
  ['Critical Risk Non-Negotiables', '#1f3f7a', 'When I commence a work activity related to a Coates Top 10 Critical Risk, I will always ensure that I review and strictly adhere to the non-negotiable rules and controls for that Critical Risk to protect me, my workmates and others from serious harm.'],
]);
export const LIFE_SAVING_RULES_FOOT = 'Failure to adhere to these Life Saving Rules will have serious consequences.';
export const COATES_VALUES = Object.freeze([
  ['Care Deeply', '#5b7d3a', 'We care deeply about the safety and wellbeing of our people, customers and communities.'],
  ['One Team', '#8b7d4a', 'We work as one collaborative, passionate and inclusive team to deliver customer solutions.'],
  ['Be our Best', '#1e3f78', 'We strive for high performance through accountability, learning and determination to be better.'],
  ['Customer focused', '#d3552b', 'We are focused on helping our customers succeed by achieving their goals and deliver above expectations.'],
  ['Competitive Spirit', '#f26f21', 'We set ambitious goals and together pursue every opportunity to innovate and support customer needs.'],
]);
function wrap(g, text, x, y, maxW, lineH, align = 'left') {
  const words = text.split(' '); let line = '', yy = y; g.textAlign = align;
  for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lineH; } else line = t; }
  if (line) g.fillText(line, x, yy); return yy + lineH;
}
function lifeSavingRules() {
  return textCanvas(1536, 2048, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = COATES_ORANGE; g.fillRect(0, 0, W, 300);
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = '#ffffff'; g.font = '900 150px Arial, Helvetica, sans-serif'; g.letterSpacing = '-4px'; g.fillText('Coates', 96, 190);
    g.font = '700 46px Arial, Helvetica, sans-serif'; g.letterSpacing = '0px'; g.fillText('Equipped for anything', 100, 258);
    g.fillStyle = COATES_ORANGE; g.font = '400 128px Arial, Helvetica, sans-serif'; g.letterSpacing = '-3px'; g.fillText('Life Saving Rules', 96, 470);
    const top = 540, rowH = 210, gap = 12, labelW = 470, x0 = 96, x1 = W - 96;
    LIFE_SAVING_RULES.forEach(([name, colour, text], i) => {
      const y = top + i * (rowH + gap);
      g.fillStyle = colour; g.fillRect(x0, y, labelW, rowH);
      g.fillStyle = '#eeeeec'; g.fillRect(x0 + labelW + gap, y, x1 - x0 - labelW - gap, rowH);
      g.fillStyle = '#ffffff'; g.font = '700 40px Arial, Helvetica, sans-serif'; g.textBaseline = 'middle';
      const parts = name.length > 16 ? name.split(' and ').length > 1 ? name.split(' and ').map((p, k) => k ? 'and ' + p : p) : name.split(' ') : [name];
      const lines = name === 'Critical Risk Non-Negotiables' ? ['Critical Risk', 'Non-Negotiables'] : name === 'Training and Competency' ? ['Training and', 'Competency'] : name === 'Tools and Equipment' ? ['Tools and', 'Equipment'] : [name];
      lines.forEach((l, k) => { g.textAlign = 'left'; g.fillText(l, x0 + 36, y + rowH / 2 + (k - (lines.length - 1) / 2) * 48); });
      g.beginPath(); g.arc(x0 + labelW - 70, y + rowH / 2, 44, 0, Math.PI * 2); g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.stroke();
      g.fillStyle = '#2b3136'; g.font = '400 33px Arial, Helvetica, sans-serif'; g.textBaseline = 'alphabetic';
      const lh = 42, n = Math.ceil(g.measureText(text).width / (x1 - x0 - labelW - gap - 60)) + 1;
      wrap(g, text, x0 + labelW + gap + 30, y + rowH / 2 - (n - 1) * lh / 2 + 12, x1 - x0 - labelW - gap - 60, lh);
    });
    g.fillStyle = '#5a6067'; g.font = '400 44px Arial, Helvetica, sans-serif'; g.textAlign = 'left';
    g.fillText(LIFE_SAVING_RULES_FOOT, 96, H - 80);
  });
}
/* words round the wheel the way the sheet sets them: upright to the eye everywhere — on the top half the glyph
   tops point outward and the word runs clockwise; on the bottom half the tops point inward and it runs the
   other way — so nothing reads upside down or mirrored */
function arcText(g, text, cx, cy, r, centreAngle, top = true) {
  const widths = [...text].map(ch => g.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0) / r;
  let a = top ? centreAngle - total / 2 : centreAngle + total / 2;
  [...text].forEach((ch, i) => {
    const half = widths[i] / r / 2; a += top ? half : -half;
    g.save(); g.translate(cx + r * Math.cos(a), cy + r * Math.sin(a)); g.rotate(top ? a + Math.PI / 2 : a - Math.PI / 2); g.fillText(ch, 0, 0); g.restore();
    a += top ? half : -half;
  });
}
function valuesWheel() {
  return textCanvas(1536, 1536, (g, W, H) => {
    const cx = W / 2, cy = H / 2 + 20, R = 640;
    /* the four quadrants of the sheet, then the wheel over them */
    const quads = [['#5b7d3a', 0, 0], ['#8b7d4a', 1, 0], ['#d3552b', 0, 1], ['#1e3f78', 1, 1]];
    quads.forEach(([c, qx, qy]) => { g.fillStyle = c; g.fillRect(qx * W / 2, qy * H / 2, W / 2, H / 2); });
    const arcs = [[COATES_VALUES[0], -Math.PI * .98, -Math.PI * .52], [COATES_VALUES[1], -Math.PI * .48, -Math.PI * .02], [COATES_VALUES[2], Math.PI * .02, Math.PI * .48], [COATES_VALUES[3], Math.PI * .52, Math.PI * .98]];
    arcs.forEach(([[name, colour], a0, a1]) => { g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath(); g.fillStyle = colour; g.fill(); g.strokeStyle = '#ffffff22'; g.lineWidth = 6; g.stroke(); });
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.strokeStyle = '#ffffff30'; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#ffffff'; g.font = '700 74px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    arcText(g, 'Care Deeply', cx, cy, 505, -Math.PI * .74, true);
    arcText(g, 'One Team', cx, cy, 505, -Math.PI * .25, true);
    arcText(g, 'Be our Best', cx, cy, 505, Math.PI * .27, false);
    arcText(g, 'Customer focused', cx, cy, 505, Math.PI * .76, false);
    /* the centre: Competitive Spirit and its statement */
    g.beginPath(); g.arc(cx, cy, 300, 0, Math.PI * 2); g.fillStyle = COATES_VALUES[4][1]; g.fill(); g.strokeStyle = '#ffffff40'; g.lineWidth = 8; g.stroke();
    g.fillStyle = '#ffffff'; g.font = '700 66px Arial, Helvetica, sans-serif'; g.fillText('Competitive', cx, cy - 150); g.fillText('Spirit', cx, cy - 84);
    g.beginPath(); g.arc(cx, cy + 10, 62, 0, Math.PI * 2); g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#ffffff'; g.fillRect(cx - 42, cy + 10, 26, 40); g.fillRect(cx - 13, cy - 12, 26, 62); g.fillRect(cx + 16, cy + 18, 26, 32);
    g.font = '400 31px Arial, Helvetica, sans-serif'; wrap(g, COATES_VALUES[4][2], cx, cy + 108, 480, 38, 'center');
    /* the four statements, in the corners where the sheet puts them */
    g.font = '400 34px Arial, Helvetica, sans-serif'; g.fillStyle = '#ffffff';
    wrap(g, COATES_VALUES[0][2], W * .25, 92, 560, 42, 'center');
    wrap(g, COATES_VALUES[1][2], W * .75, 92, 560, 42, 'center');
    wrap(g, COATES_VALUES[3][2], W * .25, H - 150, 560, 42, 'center');
    wrap(g, COATES_VALUES[2][2], W * .75, H - 150, 560, 42, 'center');
    /* the four marks: a heart in a hand, a target, a star, a magnifier — drawn simply, not copied */
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.fillStyle = 'transparent';
    /* the marks sit between the centre and the words, each in its own ring, none over a letter */
    const at = a => [cx + 385 * Math.cos(a), cy + 385 * Math.sin(a)];
    const [hx, hy] = at(-Math.PI * .74), [tx0, ty0] = at(-Math.PI * .25), [sx, sy] = at(Math.PI * .27), [mx, my] = at(Math.PI * .76);
    g.lineWidth = 5; for (const [x, y] of [[hx, hy], [tx0, ty0], [sx, sy], [mx, my]]) { g.beginPath(); g.arc(x, y, 64, 0, Math.PI * 2); g.stroke(); }
    g.beginPath(); g.moveTo(hx, hy + 30); g.bezierCurveTo(hx - 48, hy - 16, hx - 8, hy - 50, hx, hy - 14); g.bezierCurveTo(hx + 8, hy - 50, hx + 48, hy - 16, hx, hy + 30); g.stroke();
    g.beginPath(); g.arc(tx0, ty0, 18, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(tx0, ty0, 40, .3, 2.6); g.stroke(); g.beginPath(); g.arc(tx0, ty0, 40, 3.4, 5.8); g.stroke();
    g.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? 17 : 40, a = -Math.PI / 2 + k * Math.PI / 5; g[k ? 'lineTo' : 'moveTo'](sx + rr * Math.cos(a), sy + rr * Math.sin(a)); } g.closePath(); g.stroke();
    g.beginPath(); g.arc(mx - 6, my - 6, 26, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.moveTo(mx + 12, my + 12); g.lineTo(mx + 36, my + 36); g.stroke();
  });
}

/* WHAT EACH THING IN THE GARAGE STANDS FOR. Andrew Fisher, 23 Sep 2026: everything has meaning and is related to
   something — that is the Coates Way. Every exhibit below is something a crew actually has in a workshop, and
   each is tied to a line of Coates's own wording — a value with its statement, a Life Saving Rule, a plate of the
   cog, or one of the six disciplines the delivery page already carries. Pick one in the garage and this is
   what the page says. No figures, no claims about the job. */
export const EXHIBITS = Object.freeze([
  {id: 'dyno', name: 'The chassis dyno', what: 'The #26 sits with its rear wheels in the rollers of a chassis dynamometer, strapped down, chocked, the exhausts on extraction. The rollers, the fan and the screen run off the machine\'s own inspection drive — its real speed, not an invented figure.', word: 'Performance-led Results', link: 'Measure what matters and act when performance is off track — why, who owns it, what fixes it. A dyno is where a number is measured, not guessed.'},
  {id: 'straps', name: 'The tie-downs', what: 'Four ratchet straps from the car to the floor anchors. A car on rollers is never run unstrapped.', word: 'Critical Risk Non-Negotiables', link: 'Life Saving Rule: when I commence a work activity related to a Coates Top 10 Critical Risk, I will always ensure that I review and strictly adhere to the non-negotiable rules and controls for that Critical Risk to protect me, my workmates and others from serious harm.'},
  {id: 'fan', name: 'The cooling fan', what: 'The big axial fan on the nose. On the rollers a car makes no wind of its own; the fan is what keeps the V8 in its temperature.', word: 'Fit for Work', link: 'Life Saving Rule: when I commence work, I will be physically fit, and not impaired by fatigue, injury, distraction, drugs or alcohol. I will wear the required personal protective equipment (PPE) as identified for the task or site rules.'},
  {id: 'extraction', name: 'Exhaust extraction', what: 'Two hoses from the side exhausts up to the extraction rail in the roof. The fumes leave the building, not the people.', word: 'Safety First', link: 'Every job, every load, every person is safe. Stop tasks when something is not right.'},
  {id: 'console', name: 'The dyno console', what: 'The screen beside the rollers: the inspection drive\'s speed, live, and the trace of the last half minute. Nothing on it is a figure the machine did not make.', word: 'Balanced Scorecard · Operating Cadence', link: 'The third ring of the cog: measure the rhythm and keep it honest. Cadence, on the delivery page: meetings on schedule and structured, actions tracked and closed out.'},
  {id: 'stack', name: 'The run light', what: 'The stack light on the console: green while the V8 runs, amber while it winds down, red while a connection is open.', word: 'Open to Feedback', link: 'Ask what we could do better. Listen, acknowledge and act, even when it is uncomfortable. A light that tells the truth is feedback nobody has to ask for.'},
  {id: 'crane', name: 'The overhead crane', what: 'The gantry crane on its runway the length of the hall — the bridge, the trolley, the hoist and the hook — with a spare V8 in its cradle on the lifting beam. Andrew Fisher asked for a huge engine hoist crane; this is it.', word: 'Assets', link: 'The second ring of the cog: People, Operations, Assets, Financials. None of them turns without the others.'},
  {id: 'transporter', name: 'The transporter', what: 'The Coates race transporter parked along the near wall — the #26 came in on it and goes out on it.', word: 'Ease of Doing Business', link: 'Make it easy to do business with Coates and with each other: one truck, one team, one plan.'},
  {id: 'mezzanine', name: 'The engineers\' office', what: 'The glass office on the mezzanine over the back of the hall, where the plan is run and the calls are made.', word: 'Cadence', link: 'Meetings on schedule and structured, actions tracked and closed out. The office is where the rhythm is kept.'},
  {id: 'workbench', name: 'The workbench and tool wall', what: 'Six metres of bench under the pegboard, every tool on its shadow. What is missing is seen at a glance.', word: 'Training and Competency', link: 'Life Saving Rule: I will be inducted, trained, competent and hold the required certification and licenses to conduct the task.'},
  {id: 'rules', name: 'Life Saving Rules', what: 'Coates\'s six Life Saving Rules, as issued, on the wall by the door where every shift signs on.', word: 'Care Deeply', link: 'We care deeply about the safety and wellbeing of our people, customers and communities. The first discipline on the delivery page is Safety First: stop tasks when something is not right.'},
  {id: 'values', name: 'The five Coates values', what: 'Care Deeply, One Team, Customer focused, Be our Best, with Competitive Spirit at the centre — the wheel as Coates draws it, on the back wall of the hall.', word: 'Competitive Spirit', link: 'We set ambitious goals and together pursue every opportunity to innovate and support customer needs.'},
  {id: 'screen', name: 'The engineers\' wall', what: 'The wall screen every pit runs on. Here it carries the rings of the cog in the shape of a timing wall, and not one invented figure.', word: 'Balanced Scorecard · Operating Cadence', link: 'The third ring of the cog: measure the rhythm and keep it honest. Cadence, on the delivery page: meetings on schedule and structured, actions tracked and closed out.'},
  {id: 'desk', name: 'The engineers\' desk', what: 'Three screens and the plan. Where the numbers are read and the calls are made.', word: 'Performance-led Results', link: 'Measure what matters and act when performance is off track — why, who owns it, what fixes it.'},
  {id: 'chests', name: 'Tool chests', what: 'Every tool in its drawer, fit for purpose, tagged out when it is not.', word: 'Tools and Equipment', link: 'Life Saving Rule: I will only use tools and equipment that are fit for purpose and for which I am trained, competent and authorised. I will ensure that damaged or defective equipment is tagged out and removed from service.'},
  {id: 'reels', name: 'Air hose reels', what: 'Air to the guns and the jacks, reeled off the wall so nothing lies across the floor.', word: 'Reduce Friction', link: 'Make it easy to do business with Coates and with each other. Flag workarounds, do not normalise them.'},
  {id: 'guns', name: 'Wheel guns', what: 'Two guns on their stand at the head of the cell, hoses coiled. A stop is seconds.', word: 'Pace', link: 'Resolve issues within hours. Quotes out same day — speed wins in hire.'},
  {id: 'board', name: 'The pit board', what: 'The board the crew holds out to the driver: the car\'s number and its name. Nothing on it is invented.', word: 'Open to Feedback', link: 'Ask what we could do better. Listen, acknowledge and act, even when it is uncomfortable. The board is how the pit talks to the car.'},
  {id: 'extinguishers', name: 'Fire extinguishers', what: 'At the door, at the dyno and at the bench, on brackets, in reach.', word: 'Safety First', link: 'Every job, every load, every person is safe. Stop tasks when something is not right.'},
  {id: 'slicks', name: 'Slicks on the racks', what: 'Thirty-six tyres racked three high along the near wall, the right equipment ready in the right place.', word: 'Assets', link: 'The second ring of the cog: People, Operations, Assets, Financials. None of them turns without the others.'},
  {id: 'cabinet', name: 'The timing and data cabinet', what: 'The rack the screens run off. Standardised, documented, followed.', word: 'Resilient Processes', link: 'Standardised, documented, followed. When a process does not work we fix it — we do not work around it.'},
  {id: 'tower', name: 'Coates lighting tower', what: 'The lighting tower Coates hires out — the same kind that stands on this job\'s Gens & Light Towers drawing — parked in the corner, lit.', word: 'Customer Solutions', link: 'The right combination of equipment, expertise and specialist services, delivered safely and efficiently. Equipped for anything.'},
  {id: 'generator', name: 'Coates generator', what: 'A Coates set, orange, the kind on every event site. Here it is the power behind the hall.', word: 'Operational Excellence', link: 'Every stage of the hire cycle executed to a standard every customer can expect.'},
  {id: 'banners', name: 'The banners', what: 'COATES · ONE TEAM, GC500 · 2026 · SURFERS PARADISE, #26 · FISHER and EVERY PART CONNECTED, hanging from the roof steel.', word: 'One Team', link: 'We work as one collaborative, passionate and inclusive team to deliver customer solutions.'},
  {id: 'beam', name: 'PIT 26', what: 'The bay\'s number over the roller door, and the company\'s name beside it. The car is the Coates #26, Fisher.', word: 'Be our Best', link: 'We strive for high performance through accountability, learning and determination to be better.'},
  {id: 'hatch', name: 'The exclusion line', what: 'Hatched across the door line: nobody stands on it while the car is moving.', word: 'Risk Assessment', link: 'Life Saving Rule: I will not commence any work that I am unfamiliar with, that is non-routine, potentially hazardous or impacted by changing conditions without first completing the appropriate Coates risk assessment tool to identify, assess and control risks.'},
  {id: 'floor26', name: 'The painted 26', what: 'The cell is ours; the number is the car\'s. Painted at the head of the cell where the crew stand.', word: 'Customer focused', link: 'We are focused on helping our customers succeed by achieving their goals and deliver above expectations.'},
]);

/* the canvases the dyno cell draws on: the roller's knurl, the console screen, the stack light, the haze, the pegboard */
/* v6.92 — the roller door's face: ribbed slats, a hazard-striped bottom rail, PIT 26 stencilled across it */
function rollerDoor() {
  return textCanvas(1024, 1024, (g, W, H) => {
    g.fillStyle = '#5d676e'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 26) { g.fillStyle = '#6f7a81'; g.fillRect(0, y, W, 13); g.fillStyle = '#3e464c'; g.fillRect(0, y + 22, W, 4); }
    g.save(); g.beginPath(); g.rect(0, H - 70, W, 70); g.clip(); for (let x = -80; x < W + 80; x += 60) { g.fillStyle = '#f2b400'; g.beginPath(); g.moveTo(x, H); g.lineTo(x + 30, H); g.lineTo(x + 100, H - 70); g.lineTo(x + 70, H - 70); g.closePath(); g.fill(); } g.restore();
    g.fillStyle = '#101417'; g.fillRect(0, H - 74, W, 6);
    g.font = '900 210px Arial, Helvetica, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,106,19,.92)'; g.fillText('PIT 26', W / 2, H * .46);
    g.font = '800 64px Arial, Helvetica, sans-serif'; g.fillStyle = 'rgba(243,244,242,.85)'; g.fillText('COATES · GC500 2026', W / 2, H * .64);
  });
}
function rollerStripe() {
  const t = textCanvas(64, 64, (g, W, H) => { g.fillStyle = '#7d868c'; g.fillRect(0, 0, W, H); g.fillStyle = '#4a5257'; for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 3); g.fillStyle = '#9aa3a8'; for (let y = 4; y < H; y += 8) g.fillRect(0, y, W, 1); }, {maxScale: 1});
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 24); return t;
}
function hazeSprite() {
  const t = textCanvas(64, 64, (g, W, H) => { const rg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); rg.addColorStop(0, 'rgba(255,255,255,.55)'); rg.addColorStop(.5, 'rgba(255,255,255,.12)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); }, {maxScale: 1});
  return t;   /* v8.08: mipmapped */
}
function pegboard() {
  return textCanvas(2048, 1024, (g, W, H) => {
    g.fillStyle = '#2a3238'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1b2227'; for (let y = 24; y < H; y += 48) for (let x = 24; x < W; x += 48) { g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill(); }
    /* the shadows the tools hang on: spanners, sockets, hammers, drivers — drawn as their outlines, each in its place */
    g.fillStyle = '#0f1518';
    const span = (x, y, L, ang) => { g.save(); g.translate(x, y); g.rotate(ang); g.fillRect(-12, -L / 2, 24, L); g.beginPath(); g.arc(0, -L / 2, 30, 0, Math.PI * 2); g.arc(0, L / 2, 26, 0, Math.PI * 2); g.fill(); g.restore(); };
    for (let i = 0; i < 12; i++) span(120 + i * 84, 300, 260 + (i % 3) * 40, 0);
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(1240 + i * 120, 240, 40 + (i % 2) * 12, 0, Math.PI * 2); g.fill(); }
    for (let i = 0; i < 8; i++) { g.fillRect(1180 + i * 100, 420, 30, 300); g.fillRect(1150 + i * 100, 400, 90, 60); }
    for (let i = 0; i < 10; i++) { g.fillRect(140 + i * 170, 620, 22, 300); g.beginPath(); g.arc(151 + i * 170, 610, 34, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = COATES_ORANGE; g.fillRect(0, 0, W, 60); g.fillStyle = '#ffffff'; g.font = '800 40px Arial, Helvetica, sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.letterSpacing = '6px';
    g.fillText('COATES · TOOL WALL · EVERY TOOL ON ITS SHADOW · TAG OUT WHAT IS NOT FIT FOR PURPOSE', 40, 30);
  });
}
/* the console: the inspection drive\'s speed, live, and its trace — drawn again by tick() a few times a second */
function drawConsole(g, W, H, st) {
  const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#0a0e12'); grad.addColorStop(1, '#141b21');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = COATES_ORANGE; g.fillRect(0, 0, W, 10);
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#f4f6f7'; g.font = '800 40px Arial, Helvetica, sans-serif'; g.letterSpacing = '4px';
  g.fillText('COATES · DYNO CELL', 36, 58);
  g.textAlign = 'right'; g.fillStyle = '#9fb0ba'; g.font = '600 26px Arial, Helvetica, sans-serif'; g.fillText('INSPECTION DRIVE · #26', W - 36, 58);
  g.fillStyle = '#1f2a31'; g.fillRect(36, 92, W - 72, 3);
  /* the number: the drive\'s own rpm, the same figure the page\'s telemetry shows */
  g.textAlign = 'left'; g.fillStyle = st.running ? COATES_ORANGE : '#6f7f89'; g.font = '800 132px Arial, Helvetica, sans-serif'; g.letterSpacing = '-4px';
  g.fillText(String(Math.round(st.rpm || 0)), 36, 190);
  g.fillStyle = '#9fb0ba'; g.font = '600 28px Arial, Helvetica, sans-serif'; g.letterSpacing = '3px';
  g.fillText('RPM · INSPECTION SPEED', 36, 268);
  g.textAlign = 'right'; g.fillStyle = st.running ? '#8aca40' : st.winding ? '#edb440' : '#879099'; g.font = '800 34px Arial, Helvetica, sans-serif';
  g.fillText(st.running ? 'V8 RUNNING' : st.winding ? 'WINDING DOWN' : st.status || 'READY', W - 36, 168);
  g.fillStyle = '#9fb0ba'; g.font = '600 24px Arial, Helvetica, sans-serif'; g.fillText('ROLLERS ' + (st.rollers ? 'TURNING' : 'STOPPED') + ' · FAN ' + (st.running ? 'ON' : 'OFF'), W - 36, 214);
  /* the trace: the last half minute of the drive\'s speed, newest on the right */
  const x0 = 36, y0 = 300, w = W - 72, h = H - 340, hist = st.history || [];
  g.fillStyle = '#0c1115'; g.fillRect(x0, y0, w, h); g.strokeStyle = '#1f2a31'; g.lineWidth = 2;
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x0, y0 + h * i / 4); g.lineTo(x0 + w, y0 + h * i / 4); g.stroke(); }
  const max = Math.max(50, ...hist);
  g.strokeStyle = COATES_ORANGE; g.lineWidth = 5; g.beginPath();
  hist.forEach((v, i) => { const x = x0 + w * i / Math.max(1, hist.length - 1), y = y0 + h - h * v / max; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
  g.stroke();
  g.fillStyle = '#6f7f89'; g.font = '600 22px Arial, Helvetica, sans-serif'; g.textAlign = 'left'; g.letterSpacing = '2px'; g.fillText('LAST 30 s · THE MACHINE\'S OWN READING · NO POWER OR TORQUE FIGURE IS SHOWN BECAUSE NONE IS MEASURED', x0, H - 22);
}
function drawStack(g, W, H, st) {
  g.fillStyle = '#111417'; g.fillRect(0, 0, W, H);
  const lamps = [['#ff2a2a', st.open], ['#ffb020', st.winding && !st.open], ['#57e05a', st.running && !st.open]];
  lamps.forEach(([c, on], i) => { g.fillStyle = on ? c : '#2a2f33'; g.fillRect(0, i * H / 3 + 4, W, H / 3 - 8); if (on) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, i * H / 3 + 10, W, 6); } });
}

/* a bucket of geometry per material, merged into one mesh at the end.
   v6.99 — AND PER UNIT. Until now everything of one material, from one end of the hall to the other, was one mesh: the transporter, the
   mezzanine, the dyno fan and the console were the same object as the walls, so nothing could be taken out of the way without taking out
   the walls with it, and no mesh was ever outside the view to be skipped. unit(name) names what the next pieces belong to; the merge is
   per unit and material, and each mesh carries userData.unit. The clear view (view-fx.js) hides a unit that stands between the camera and
   the car; units named in FIXED (the building's shell, the floor, what the car stands on) are never hidden. */
export const FIXED_UNITS = new Set(['shell', 'floor', 'dyno', 'anchors', 'car fittings', 'service kit', 'dyno rollers', 'roller door', 'fans', 'beacons', 'reels', 'wall board']);
class Batch {
  constructor(unit = 'shell') { this.buckets = new Map(); this.u = unit; }
  unit(name) { this.u = name; return this; }
  push(mat, g) {
    if (!this.buckets.has(this.u)) this.buckets.set(this.u, new Map());
    const b = this.buckets.get(this.u); if (!b.has(mat)) b.set(mat, []); b.get(mat).push(g); return this;
  }
  add(mat, geo, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
    const m = new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new T.Vector3(sx, sy, sz));
    return this.push(mat, geo.clone().applyMatrix4(m));
  }
  build(root, {receive = true, names = 'garage', renderOrder = 0} = {}) {
    for (const [unit, byMat] of this.buckets) for (const [mat, geos] of byMat) {
      const merged = mergeGeometries(geos, false); if (!merged) continue;
      geos.forEach(g => g.dispose());
      const mesh = new T.Mesh(merged, mat); mesh.receiveShadow = receive; mesh.castShadow = false; mesh.name = names === 'garage' ? `garage · ${unit}` : names; mesh.matrixAutoUpdate = false; mesh.renderOrder = renderOrder;
      mesh.userData.unit = unit; root.add(mesh);
    }
  }
}
/* the unit an object belongs to, for the clear view */
const tag = (o, unit) => { o.userData.unit = unit; return o; };
/* an invisible box the pointer can hit, carrying the exhibit it stands for; the visible geometry is merged */
function exhibitBox(root, id, w, h, d, x, y, z) {
  const e = EXHIBITS.find(x => x.id === id); if (!e) throw new Error('no exhibit ' + id);
  const m = new T.Mesh(new T.BoxGeometry(w, h, d), new T.MeshBasicMaterial({visible: false}));
  m.position.set(x, y, z); m.userData.exhibit = e; m.name = 'exhibit-' + id; root.add(m); (root.userData.exhibits = root.userData.exhibits || []).push(m); return m;
}
const box = (w, h, d) => new T.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 18, open = false) => new T.CylinderGeometry(rt, rb, h, seg, 1, open);
const plane = (w, h) => new T.PlaneGeometry(w, h);

/* ---------------------------------------------------------------- the hall */
/* a thin box laid between two points — a strap, a chain, a cable, a hose run */
function between(B, mat, a, b, w, d) {
  const ax = a[0], ay = a[1], az = a[2], bx = b[0], by = b[1], bz = b[2];
  const dx = bx - ax, dy = by - ay, dz = bz - az, L = Math.hypot(dx, dy, dz);
  const g = new T.BoxGeometry(w, L, d);
  const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(dx, dy, dz).normalize());
  const m = new T.Matrix4().compose(new T.Vector3((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2), q, new T.Vector3(1, 1, 1));
  B.push(mat, g.applyMatrix4(m));
}
export function buildPitGarage({reflectorSize = [18, 9], reflectorTexture = [1024, 512]} = {}) {
  const G = GARAGE, D = DYNO, root = new T.Group(); root.name = 'pit-garage';
  const lights = [];
  const M = {
    concrete: new T.MeshStandardMaterial({color: 0x1b2024, roughness: .42, metalness: .12}),
    asphalt: new T.MeshStandardMaterial({color: 0x15181b, roughness: .92, metalness: 0}),
    wall: new T.MeshStandardMaterial({color: 0xffffff, map: wallMap(), roughness: .74, metalness: .08}),
    wallDark: new T.MeshStandardMaterial({color: 0x11171b, roughness: .82, metalness: .06}),
    ceiling: new T.MeshStandardMaterial({color: 0x0e1316, roughness: .9, metalness: .05}),
    orange: new T.MeshStandardMaterial({color: COATES_ORANGE, roughness: .38, metalness: .18}),
    orangeGlow: new T.MeshBasicMaterial({color: 0xff7a2a}),
    black: new T.MeshStandardMaterial({color: 0x101417, roughness: .45, metalness: .3}),
    steel: new T.MeshStandardMaterial({color: 0x8d989f, roughness: .34, metalness: .9}),
    alu: new T.MeshStandardMaterial({color: 0xb8c1c6, roughness: .42, metalness: .85}),
    rubber: new T.MeshStandardMaterial({color: 0x111316, roughness: .9, metalness: 0}),
    red: new T.MeshStandardMaterial({color: 0xb5161a, roughness: .4, metalness: .25}),
    white: new T.MeshStandardMaterial({color: 0xe9ebe9, roughness: .5, metalness: .05}),
    yellow: new T.MeshStandardMaterial({color: 0xf2b400, roughness: .5, metalness: .1}),
    ledPanel: new T.MeshBasicMaterial({color: 0xe6e2d6}),
    ledCool: new T.MeshBasicMaterial({color: 0xcfe3ff}),
    screenGlass: new T.MeshStandardMaterial({color: 0x0a0d10, roughness: .2, metalness: .6}),
    glass: new T.MeshPhysicalMaterial({color: 0x9fc4d6, metalness: 0, roughness: .08, transparent: true, opacity: .28, side: T.DoubleSide, depthWrite: false}),
    mesh: new T.MeshStandardMaterial({color: 0x232a2f, roughness: .85, metalness: .2, transparent: true, opacity: .55, side: T.DoubleSide, depthWrite: false}),
    grate: new T.MeshStandardMaterial({color: 0x3a4248, roughness: .7, metalness: .6}),
    line: new T.MeshBasicMaterial({color: 0xeeeeea}),
    lineY: new T.MeshBasicMaterial({color: 0xf2b400}),
    roller: new T.MeshStandardMaterial({color: 0xffffff, map: rollerStripe(), roughness: .45, metalness: .85}),
    hose: new T.MeshStandardMaterial({color: 0x1a1d20, roughness: .95, metalness: .05}),
  };
  const B = new Batch();
  const floorW = G.back - G.front, floorD = G.near - G.far;

  /* ---- the floor: asphalt outside, the epoxy across the whole hall, the dyno cell marked on it */
  const ground = new T.Mesh(plane(floorW + .6, floorD + .6), M.asphalt);   /* v6.92: under the walls' full thickness */ ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.03, 0); ground.receiveShadow = true; root.add(ground);
  const reflector = new Reflector(plane(reflectorSize[0], reflectorSize[1]), {clipBias: .003, textureWidth: reflectorTexture[0], textureHeight: reflectorTexture[1], color: 0x23282c});
  reflector.rotation.x = -Math.PI / 2; reflector.position.set(0, -.009, 0); reflector.visible = false; root.add(reflector); root.userData.reflector = reflector;
  const floorTex = floorMap(), floorRough = floorRoughness(); floorTex.repeat.set(floorW / 2.4, floorD / 2.4); floorRough.repeat.set(floorW / 2.4, floorD / 2.4);
  /* v8.08 — the epoxy's sheen now varies across the hall (floorWear): mirror-polished in the open, satin down the walkways, dull and
     rubbery where the car came in and where it stands. One map, two channels, its own UVs (once across the floor, not tiled). */
  const wear = floorWear(G, D); wear.colorSpace = T.NoColorSpace;
  const epoxy = new T.Mesh(plane(floorW, floorD), new T.MeshPhysicalMaterial({color: 0xffffff, map: floorTex, roughnessMap: floorRough, roughness: 1, metalness: .04, clearcoat: 1, clearcoatRoughness: .5, clearcoatRoughnessMap: wear, aoMap: wear, aoMapIntensity: .85, transparent: true, opacity: 1, depthWrite: false, envMapIntensity: 1.0}));
  epoxy.material.userData.solid = {opacity: 1, envMapIntensity: 1.0}; epoxy.material.userData.overReflector = {opacity: .80, envMapIntensity: .35};
  M.wall.emissive = new T.Color(0x1b2226); M.ceiling.emissive = new T.Color(0x0c1114); M.wallDark.emissive = new T.Color(0x0d1216);   /* v6.92: the hall is bigger than its lamps' reach */
  M.asphalt.envMapIntensity = .15; M.wall.envMapIntensity = .45; M.wallDark.envMapIntensity = .4; M.ceiling.envMapIntensity = .3; M.concrete.envMapIntensity = .3;
  epoxy.rotation.x = -Math.PI / 2; epoxy.position.set(0, -.004, 0); epoxy.receiveShadow = true; epoxy.name = 'epoxy'; root.add(epoxy); root.userData.epoxy = epoxy;
  /* the dyno cell: an orange line round it, yellow hatching at its head and foot, the 26 painted at its head, walkways along the hall */
  const lineY = .001;
  B.unit('floor');
  B.add(M.orangeGlow, box(G.bayBack - G.bayFront, .004, .06), (G.bayFront + G.bayBack) / 2, lineY, G.bayFar).add(M.orangeGlow, box(G.bayBack - G.bayFront, .004, .06), (G.bayFront + G.bayBack) / 2, lineY, G.bayNear);
  B.add(M.orangeGlow, box(.06, .004, G.bayNear - G.bayFar), G.bayFront, lineY, 0).add(M.orangeGlow, box(.06, .004, G.bayNear - G.bayFar), G.bayBack, lineY, 0);
  const num = new T.Mesh(plane(2.2, 2.2), new T.MeshBasicMaterial({map: floorNumber(), transparent: true, opacity: .5, depthWrite: false}));
  num.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); num.position.set(G.bayFront + 1.5, .002, 0); root.add(num);
  const cellSign = new T.Mesh(plane(3.4, .6), new T.MeshBasicMaterial({map: sign('DYNO CELL · #26', {w: 1536, h: 270, bg: '#0d1216', fg: '#f2b400', size: 150, letter: .08}), transparent: false}));
  cellSign.rotation.set(-Math.PI / 2, 0, -Math.PI / 2); cellSign.position.set(G.bayBack - .6, .0025, 0); root.add(cellSign);
  for (const z of [-7.5, 7.5]) B.add(M.lineY, box(floorW - 4, .004, .12), 0, lineY, z);
  const hz = new T.Mesh(plane(.8, G.doorNear - G.doorFar), new T.MeshBasicMaterial({map: hatch(), transparent: true, opacity: .75, depthWrite: false}));
  hz.material.map.repeat.set(1, 12); hz.material.map.wrapS = hz.material.map.wrapT = T.RepeatWrapping;
  hz.rotation.set(-Math.PI / 2, 0, 0); hz.position.set(G.front + .5, .002, 0); root.add(hz);

  /* ---- drawn shadows: a fade up each wall and out across the floor, discs under everything that stands */
  const shadeUp = new T.MeshBasicMaterial({color: 0x000000, transparent: true, alphaMap: ramp(), depthWrite: false, opacity: .62, fog: false});
  const shadeDisc = new T.MeshBasicMaterial({color: 0x000000, transparent: true, alphaMap: disc(), depthWrite: false, opacity: .55, fog: false});
  const S = new Batch('floor');
  const skirtH = .9, skirtW = 1.2;
  S.add(shadeUp, plane(floorW, skirtH), 0, skirtH / 2, G.far + .001);
  S.add(shadeUp, plane(floorW, skirtW), 0, .0012, G.far + skirtW / 2, -Math.PI / 2, 0, Math.PI);
  S.add(shadeUp, plane(floorW, skirtH), 0, skirtH / 2, G.near - .001, 0, Math.PI, 0);
  S.add(shadeUp, plane(floorW, skirtW), 0, .0012, G.near - skirtW / 2, -Math.PI / 2, 0, 0);
  S.add(shadeUp, plane(floorD, skirtH), G.back - .001, skirtH / 2, 0, 0, -Math.PI / 2, 0);
  S.add(shadeUp, plane(floorD, skirtW), G.back - skirtW / 2, .0012, 0, -Math.PI / 2, 0, Math.PI / 2);
  S.add(shadeUp, plane(floorW, 1.6), 0, G.height - .8, G.far + .001, 0, 0, Math.PI);
  S.add(shadeUp, plane(floorD, 1.6), G.back - .001, G.height - .8, 0, 0, -Math.PI / 2, Math.PI);
  const blob = (x, z, w, d) => S.add(shadeDisc, plane(w, d), x, .0010, z, -Math.PI / 2, 0, 0);
  blob(0, 0, 7.0, 3.4);                                  /* the car */
  blob(-5.9, 0, 2.4, 2.2);                               /* the fan */
  blob(0, -3.8, 1.6, 1.4);                               /* the console */

  /* ---- walls, columns, roof steel, the roller door */
  const wallT = .3;
  /* v6.92: every wall goes 0.4 m below the floor, so a ray grazing the floor at the far end of the hall meets the wall and never slips
     through the slot between the floor's surface and the wall's foot (the 360 check found two such pixels) */
  const sink = .4, WH = G.height + sink, wy = (G.height - sink) / 2;
  B.unit('shell');
  B.add(M.wall, box(floorW + 2 * wallT, WH, wallT), 0, wy, G.far - wallT / 2);                       /* far (working) wall */
  B.add(M.wall, box(floorW + 2 * wallT, WH, wallT), 0, wy, G.near + wallT / 2);                      /* near wall */
  B.add(M.wall, box(wallT, WH, floorD + 2 * wallT), G.back + wallT / 2, wy, 0);          /* back wall */
  for (const [z0, z1] of [[G.far - wallT, G.doorFar], [G.doorNear, G.near + wallT]]) B.add(M.wall, box(wallT, WH, z1 - z0), G.front - wallT / 2, wy, (z0 + z1) / 2);   /* the front wall either side of the door */
  B.add(M.wall, box(wallT, sink + .05, G.doorNear - G.doorFar), G.front - wallT / 2, -sink / 2, 0);   /* and under the door */
  B.add(M.wall, box(wallT, G.height - G.lintel, G.doorNear - G.doorFar), G.front - wallT / 2, (G.height + G.lintel) / 2, 0);   /* over the door */
  B.add(M.ceiling, box(floorW + 2 * wallT, .3, floorD + 2 * wallT), 0, G.height + .15, 0);
  /* the orange band and the steel rail along the working wall, the LED skirting at the floor */
  B.add(M.orange, box(floorW - .6, .34, .02), 0, 1.25, G.far + .01).add(M.steel, box(floorW - .6, .04, .06), 0, 1.45, G.far + .04);
  B.add(M.orange, box(.02, .34, floorD - .6), G.back - .01, 1.25, 0);
  for (const z of [G.far + .03, G.near - .03]) B.add(M.orangeGlow, box(floorW - .6, .025, .025), 0, .06, z);
  B.add(M.orangeGlow, box(.025, .025, floorD - .6), G.back - .03, .06, 0);
  /* portal frame: columns every 6 m on both long walls, roof beams across, purlins along, a ridge line */
  const colXs = []; for (let x = G.front + 3; x < G.back; x += 6) colXs.push(x);
  for (const x of colXs) for (const z of [G.far + .35, G.near - .35]) B.add(M.steel, box(.4, G.height, .4), x, G.height / 2, z);
  for (const x of colXs) B.add(M.steel, box(.32, .7, floorD), x, G.height - .5, 0);
  for (let z = G.far + 2; z < G.near; z += 4) B.add(M.alu, box(floorW, .14, .14), 0, G.height - .12, z);
  B.add(M.orange, box(floorW, .12, .12), 0, G.height - .95, 0);
  /* the roof lattice: diagonal braces between the beams, instanced */
  const bars = [];
  for (const x of colXs) for (let z = G.far + 1; z < G.near - 1; z += 2) { bars.push([x + .3, G.height - .5, z, Math.PI / 4, 0, 0]); bars.push([x - .3, G.height - .5, z + 1, -Math.PI / 4, 0, 0]); }
  const lattice = new T.InstancedMesh(cyl(.02, .02, 1.4, 6), M.alu, bars.length);
  { const m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1);
    bars.forEach((b, i) => { m.compose(new T.Vector3(b[0], b[1], b[2]), q.setFromEuler(new T.Euler(b[3], b[4], b[5])), sc); lattice.setMatrixAt(i, m); }); }
  lattice.name = 'truss-lattice'; tag(lattice, 'shell'); root.add(lattice);
  /* high-bay lights: a grid of round LED fittings under the roof, three of them real lights over the cell */
  for (let x = G.front + 4.5; x < G.back; x += 6) for (let z = G.far + 3.5; z < G.near; z += 7) {
    B.add(M.black, cyl(.5, .42, .28, 18), x, G.height - 1.2, z).add(M.ledPanel, cyl(.38, .38, .02, 18), x, G.height - 1.35, z);
  }
  for (const [x, z] of [[-3.5, 0], [2.5, 0], [-.5, -4]]) { const l = new T.PointLight(0xffe7c8, 16, 16, 1.5); l.position.set(x, 7.4, z); root.add(l); lights.push(l); }   /* v6.92: the cell's lamps stay 7.4 m up, over the car, as they were */
  for (const [x, z] of [[-15, 7], [15, -7]]) { const l = new T.PointLight(0xdfeeff, 16, 38, 1.3); l.position.set(x, G.height - 2.2, z); root.add(l); lights.push(l); }
  /* v8.08 — THE LIGHT RIG OVER THE CELL. A studio frame of four LED battens hung over the car (5.6 m up, outside its roof line, so no
     camera the hall allows looks at the car through one), their diffusers brighter than white: the garage is captured once into the
     environment the paint, the chrome and the glass reflect (car-app.js), and these are the long clean highlight lines down the
     #26's flanks and across its roof that a showroom shot has. The fittings in the roof are brighter than white for the same reason.
     And a cool rim light from behind the car, high on the far side, that draws the roof line and the wing against the dark hall
     (not on a phone: one light fewer for every pixel there). */
  M.ledPanel.color.multiplyScalar(2.2);
  { const strip = new T.MeshBasicMaterial({color: new T.Color(0xf6f2ea).multiplyScalar(3.2)}), ry = 5.6, half = 3.7, zs = 2.45;
    const battens = [[0, -zs, 2 * half, 0], [0, zs, 2 * half, 0], [-half - .35, 0, 2 * zs + .3, Math.PI / 2], [half + .35, 0, 2 * zs + .3, Math.PI / 2]];
    battens.forEach(([x, z, len, rot], i) => {
      B.unit('light rig ' + i).add(M.black, box(len, .09, .18), x, ry + .05, z, 0, rot, 0).add(strip, box(len - .12, .025, .13), x, ry - .005, z, 0, rot, 0);
      B.unit('shell');   /* the hangers are a centimetre thick and never in the way */
      for (const f of [-.42, .42]) { const hx = x + (rot ? 0 : f * len), hz = z + (rot ? f * len : 0); between(B, M.steel, [hx, ry + .1, hz], [hx, G.height - .55, hz], .012, .012); }
    });
    B.unit('shell'); }
  if (!MOBILE) { const rim = new T.SpotLight(0xdce8ff, 38, 15, Math.PI * .16, .75, 1.5); rim.position.set(4.6, 6.2, -5.0); rim.target.position.set(-.4, .9, .2); rim.name = 'rim light'; root.add(rim, rim.target); lights.push(rim); }
  /* the roller door: the beam, the drum, the number on the beam, the company\'s name beside it */
  B.add(M.black, box(.5, G.height - G.lintel + .1, G.doorNear - G.doorFar + 1.2), G.front - .2, (G.height + G.lintel) / 2 - .05, 0);
  B.add(M.orange, box(.52, .1, G.doorNear - G.doorFar + 1.2), G.front - .2, G.lintel + .05, 0);
  for (const z of [G.doorFar - .3, G.doorNear + .3]) B.add(M.black, box(.5, G.lintel, .6), G.front - .2, G.lintel / 2, z);
  B.add(M.steel, cyl(.3, .3, G.doorNear - G.doorFar - .4, 24), G.front + .5, G.lintel + .4, 0, Math.PI / 2, 0, 0);
  /* v6.92 — the roller door is down: ribbed steel slats from the floor to the beam, the bottom rail in hazard stripes, PIT 26 stencilled
     across it, in its guides, its motor and hand chain beside the drum. It closes the opening edge to edge, so nothing outside shows. */
  { const door = new T.Mesh(box(.1, G.lintel + .1, G.doorNear - G.doorFar + .1), new T.MeshStandardMaterial({color: 0xffffff, map: rollerDoor(), roughness: .5, metalness: .55}));
    door.position.set(G.front + .06, (G.lintel + .1) / 2 - .02, 0); door.name = 'roller door, shut'; door.receiveShadow = true; tag(door, 'roller door'); root.add(door);
    for (const z of [G.doorFar - .12, G.doorNear + .12]) B.add(M.steel, box(.22, G.lintel, .14), G.front + .12, G.lintel / 2, z);
    B.add(M.black, box(.5, .5, .6), G.front + .45, G.lintel + .4, G.doorNear + .1).add(M.steel, box(.02, 3.0, .02), G.front + .72, G.lintel - 1.1, G.doorNear + .25).add(M.steel, box(.02, 3.0, .02), G.front + .72, G.lintel - 1.1, G.doorNear + .31); }
  const beamSign = new T.Mesh(plane(3.6, .7), new T.MeshBasicMaterial({map: sign('PIT 26', {w: 1024, h: 196, bg: '#0d1216', size: 150})}));
  beamSign.position.set(G.front - .46, (G.height + G.lintel) / 2, -2.4); beamSign.rotation.y = -Math.PI / 2; root.add(beamSign);
  const beamSign2 = new T.Mesh(plane(4.6, .7), new T.MeshBasicMaterial({map: sign('COATES · INDUSTRIAL SOLUTIONS', {w: 1536, h: 240, bg: '#0d1216', fg: '#f3f4f2', size: 120, letter: .08})}));
  beamSign2.position.set(G.front - .46, (G.height + G.lintel) / 2, 2.6); beamSign2.rotation.y = -Math.PI / 2; root.add(beamSign2);
  /* the wordmark, eight metres of it, high on the back wall, lit */
  root.userData.ready = new Promise(resolve => new T.TextureLoader().load('./assets/coates-logo.png', tex => {
    tex.colorSpace = T.SRGBColorSpace;
    const mark = new T.Mesh(plane(8, 2.4), new T.MeshBasicMaterial({map: tex, transparent: true, color: COATES_ORANGE, depthWrite: false}));
    mark.position.set(G.back - .06, 6.6, 3); mark.rotation.y = -Math.PI / 2; root.add(mark);
    const mark2 = new T.Mesh(plane(5.2, 1.56), new T.MeshBasicMaterial({map: tex, transparent: true, color: COATES_ORANGE, depthWrite: false}));
    mark2.position.set(-6, 5.6, G.far + .06); root.add(mark2);
    const glow = new T.PointLight(0xff8a3c, 6, 9, 1.6); glow.position.set(G.back - 1.6, 6.6, 3); root.add(glow); lights.push(glow);
    resolve(true);
  }, undefined, () => resolve(false)));
  const wordSign = new T.Mesh(plane(7.2, .6), new T.MeshBasicMaterial({map: sign('PERFORMANCE CENTRE · SURFERS PARADISE · GC500 2026', {w: 2048, h: 180, bg: '#0d1216', fg: '#f3f4f2', size: 96, letter: .1})}));
  wordSign.position.set(G.back - .06, 5.05, 3); wordSign.rotation.y = -Math.PI / 2; root.add(wordSign);
  /* wall ribs read as the lined panel of Andrew\'s guide */
  for (let x = G.front + .6; x < G.back; x += 1.2) B.add(M.wallDark, box(.08, G.height - .8, .05), x, G.height / 2 + .3, G.far + .03);
  for (let z = G.far + .6; z < G.near; z += 1.2) B.add(M.wallDark, box(.05, G.height - .8, .08), G.back - .03, G.height / 2 + .3, z);

  /* ---- THE OVERHEAD CRANE. Andrew Fisher, 23 Sep 2026: a huge engine hoist crane. A gantry crane
     on runway beams the length of the hall: the bridge across it, the trolley and hoist, cables to the hook block,
     chains to a lifting beam, and a spare V8 in its cradle hanging from it. */
  const runY = craneRunY(G);
  for (const z of [G.far + .95, G.near - .95]) { B.add(M.orange, box(floorW - 1, .5, .32), 0, runY, z); B.add(M.steel, box(floorW - 1, .06, .12), 0, runY + .28, z); }
  /* v6.92 — the bridge, the end trucks, the trolley, the ropes, the hook block and the spare V8 are built in pit-machinery.js, and travel */

  /* ---- THE MEZZANINE OFFICE over the back of the hall: steel deck, glass office, railing, a stair */
  const mzX0 = G.back - 7, mzY = 4.6, mz = G.far + 14;   /* v6.92: mz keeps it in the far corner of the bigger hall */
  B.unit('mezzanine');
  B.add(M.steel, box(7, .3, 12), mzX0 + 3.5, mzY, -8 + mz).add(M.orange, box(7, .12, .12), mzX0 + 3.5, mzY + .15, -2.06 + mz);
  for (const x of [mzX0 + .4, mzX0 + 3.5, G.back - .4]) for (const z of [-13.6 + mz, -8 + mz, -2.4 + mz]) B.add(M.steel, box(.3, mzY, .3), x, mzY / 2, z);
  for (let x = mzX0 + .3; x <= G.back - .3; x += 1.4) B.add(M.steel, box(.05, 1.1, .05), x, mzY + .7, -2.1 + mz);
  B.add(M.steel, box(7, .05, .05), mzX0 + 3.5, mzY + 1.25, -2.1 + mz).add(M.steel, box(7, .05, .05), mzX0 + 3.5, mzY + .75, -2.1 + mz);
  B.add(M.black, box(6.2, .15, 7), mzX0 + 3.7, mzY + 3.0, -9.5 + mz);   /* the office roof */
  for (const [w, h, d, x, y, z] of [[6.2, .1, .1, mzX0 + 3.7, mzY + 1.55, -6 + mz], [6.2, .1, .1, mzX0 + 3.7, mzY + 1.55, -13 + mz], [.1, .1, 7, mzX0 + .6, mzY + 1.55, -9.5 + mz]]) B.add(M.black, box(w, h, d), x, y, z);
  const office = new T.Mesh(box(6.2, 2.8, 7), M.glass); office.position.set(mzX0 + 3.7, mzY + 1.55, -9.5 + mz); office.name = 'office-glass'; tag(office, 'mezzanine'); root.add(office);
  const officeSign = new T.Mesh(plane(3.6, .5), new T.MeshBasicMaterial({map: sign('COATES · ENGINEERING', {w: 1536, h: 240, bg: '#0d1216', fg: COATES_ORANGE, size: 120, letter: .08})}));
  officeSign.position.set(mzX0 + .58, mzY + 2.5, -9.5 + mz); officeSign.rotation.y = -Math.PI / 2; officeSign.name = 'office sign'; tag(officeSign, 'mezzanine'); root.add(officeSign);
  B.add(M.ledCool, box(5.8, .04, .12), mzX0 + 3.7, mzY + 2.85, -9.5 + mz);
  { const l = new T.PointLight(0xdfeeff, 5, 9, 1.6); l.position.set(mzX0 + 3.7, mzY + 2.4, -9.5 + mz); root.add(l); lights.push(l); }
  for (let i = 0; i < 3; i++) B.add(M.black, box(.9, .05, .9), mzX0 + 3.7, mzY + .9, -12.5 + i * 3 + mz).add(M.screenGlass, box(.5, .3, .04), mzX0 + 3.7 + .3, mzY + 1.2, -12.5 + i * 3 + mz).add(M.steel, box(.06, .9, .06), mzX0 + 3.7, mzY + .45, -12.5 + i * 3 + mz);
  /* the stair, from the floor at z = 0 up to the deck */
  for (let i = 0; i < 12; i++) B.add(M.steel, box(1.1, .06, .34), mzX0 + 3.7, .38 * (i + 1), 2.2 - i * .34 + mz).add(M.black, box(1.1, .36, .05), mzX0 + 3.7, .38 * i + .19, 2.37 - i * .34 + mz);
  B.add(M.orange, box(.05, .05, 4.6), mzX0 + 3.15, 2.9, .4 + mz, -.85, 0, 0).add(M.orange, box(.05, .05, 4.6), mzX0 + 4.25, 2.9, .4 + mz, -.85, 0, 0);

  /* ---- THE TRANSPORTER along the near wall: the Coates race transporter, the #26\'s own truck */
  const tX = 4, tZ = G.near - 2.6;
  B.unit('transporter');
  B.add(M.orange, box(13.6, 2.2, 2.55), tX, 2.3, tZ).add(M.black, box(13.6, 1.5, 2.56), tX, 4.15, tZ).add(M.black, box(13.6, .5, 2.4), tX, 1.0, tZ).add(M.steel, box(13.8, .08, 2.6), tX, 4.94, tZ);
  for (const dx of [3.2, 4.6, 6.0]) for (const dz of [-1.05, 1.05]) B.add(M.rubber, cyl(.5, .5, .32, 18), tX + dx, .5, tZ + dz, Math.PI / 2, 0, 0).add(M.alu, cyl(.28, .28, .34, 14), tX + dx, .5, tZ + dz, Math.PI / 2, 0, 0);
  B.add(M.black, box(2.6, 3.4, 2.5), tX - 8.2, 2.0, tZ).add(M.screenGlass, box(.1, 1.0, 2.2), tX - 9.52, 2.6, tZ).add(M.orange, box(2.4, .6, 2.52), tX - 8.2, 1.0, tZ).add(M.steel, box(2.8, .1, .5), tX - 8.2, .45, tZ);
  for (const dx of [-8.9, -6.6]) for (const dz of [-1.05, 1.05]) B.add(M.rubber, cyl(.5, .5, .32, 18), tX + dx, .5, tZ + dz, Math.PI / 2, 0, 0).add(M.alu, cyl(.28, .28, .34, 14), tX + dx, .5, tZ + dz, Math.PI / 2, 0, 0);
  const truckSign = new T.Mesh(plane(6.4, 1.2), new T.MeshBasicMaterial({map: sign('Coates', {w: 1536, h: 288, bg: COATES_ORANGE, fg: '#ffffff', weight: 900, size: 230, letter: -.02})}));
  truckSign.position.set(tX + 1.5, 2.45, tZ - 1.285); truckSign.rotation.y = Math.PI; truckSign.name = 'transporter sign'; tag(truckSign, 'transporter'); root.add(truckSign);
  const truckSign2 = new T.Mesh(plane(9, .6), new T.MeshBasicMaterial({map: sign('#26 · FISHER · GC500 2026 · SURFERS PARADISE · EVERY PART CONNECTED', {w: 2048, h: 140, bg: '#101417', fg: '#f3f4f2', size: 84, letter: .06})}));
  truckSign2.position.set(tX + 1, 3.9, tZ - 1.29); truckSign2.rotation.y = Math.PI; truckSign2.name = 'transporter sign'; tag(truckSign2, 'transporter'); root.add(truckSign2);
  blob(tX, tZ, 15, 3.4); blob(tX - 8.2, tZ, 3.2, 3.2);

  /* ---- hanging banners from the roof steel: the words the page already owns */
  const banner = (text, sub, x, z, w = 1.4) => {
    B.unit('banner ' + text);
    const t = sign(text, {w: 512, h: 1024, bg: '#0f1418', fg: COATES_ORANGE, size: 118, letter: .06, sub});
    const mat = new T.MeshStandardMaterial({map: t, roughness: .8, metalness: 0});
    for (const side of [-1, 1]) { const m = new T.Mesh(plane(w, 2.8), mat); m.position.set(x + side * .004, G.height - 2.6, z); m.rotation.y = side * Math.PI / 2; m.name = 'banner ' + text; tag(m, 'banner ' + text); root.add(m); }
    B.add(M.alu, cyl(.015, .015, w + .1, 8), x, G.height - 1.15, z, Math.PI / 2, 0, 0);
    for (const dz of [-w / 2 + .1, w / 2 - .1]) between(B, M.steel, [x, G.height - 1.15, z + dz], [x, G.height - 1.0, z + dz], .01, .01);
  };
  banner('COATES', 'ONE TEAM', -9, -5.5); banner('GC500', '2026 · SURFERS PARADISE', -9, 5.5); banner('#26', 'FISHER', 9, -6.5, 1.2); banner('EVERY', 'PART CONNECTED', 9, 6.5, 1.6);

  /* ---- the working wall (far side): the engineers\' desk and wall screen, the workbench and tool wall, chests, reels, board, guns, extinguishers */
  const deskZ = G.far + .8, deskX0 = -5, deskX1 = -1.4;
  B.unit('desk');
  B.add(M.black, box(deskX1 - deskX0, .05, .8), (deskX0 + deskX1) / 2, .9, deskZ).add(M.orange, box(deskX1 - deskX0, .03, .8), (deskX0 + deskX1) / 2, .865, deskZ);
  for (const x of [deskX0 + .1, (deskX0 + deskX1) / 2, deskX1 - .1]) B.add(M.steel, box(.04, .87, .7), x, .435, deskZ);
  const screenTex = sign('COATES 26', {w: 1024, h: 576, bg: '#0b1014', fg: '#f3f4f2', size: 120, sub: 'V8 CONNECTED · 279 PARTS'});
  for (const x of [deskX0 + .6, (deskX0 + deskX1) / 2, deskX1 - .6]) {
    B.add(M.black, box(.66, .40, .04), x, 1.25, deskZ - .1).add(M.steel, cyl(.03, .05, .12, 10), x, .98, deskZ - .1).add(M.black, box(.22, .02, .18), x, .925, deskZ - .1);
    const sm = new T.Mesh(plane(.62, .36), new T.MeshBasicMaterial({map: screenTex})); sm.position.set(x, 1.25, deskZ - .075); sm.name = 'desk screen'; tag(sm, 'desk'); root.add(sm);
  }
  B.unit('wall screen').add(M.black, box(3.8, 2.15, .08), -3.2, 3.1, G.far + .1);
  const ws = new T.Mesh(plane(3.6, 2.02), new T.MeshBasicMaterial({map: wallScreen()})); ws.position.set(-3.2, 3.1, G.far + .15); ws.name = 'wall screen'; tag(ws, 'wall screen'); root.add(ws);
  B.unit('cabinet').add(M.black, box(.62, 1.9, .6), -.4, .95, G.far + .55).add(M.orange, box(.5, 1.6, .02), -.4, .95, G.far + .86).add(M.steel, box(.58, .02, .55), -.4, 1.91, G.far + .55);
  for (let i = 0; i < 9; i++) B.add(M.orangeGlow, box(.05, .02, .01), -.58, .35 + i * .16, G.far + .87);
  /* the workbench and the tool wall */
  const wbX = 6.5;
  B.unit('workbench');
  B.add(M.orange, box(6, .08, .9), wbX, .92, G.far + .55).add(M.black, box(6, .5, .85), wbX, .6, G.far + .55);
  for (const dx of [-2.9, -1, 1, 2.9]) B.add(M.steel, box(.08, .9, .08), wbX + dx, .45, G.far + .95).add(M.steel, box(.08, .9, .08), wbX + dx, .45, G.far + .15);
  const peg = new T.Mesh(plane(6, 3), new T.MeshStandardMaterial({map: pegboard(), roughness: .85, metalness: .05})); peg.position.set(wbX, 2.6, G.far + .06); peg.name = 'tool-wall'; tag(peg, 'workbench'); root.add(peg);
  B.add(M.red, box(.5, .4, .3), wbX - 2, 1.12, G.far + .5).add(M.black, box(.4, .06, .4), wbX + 1.2, 1.0, G.far + .5).add(M.steel, cyl(.12, .12, .3, 12), wbX + 2.2, 1.11, G.far + .5);
  /* a floor engine hoist beside the bench, orange, its arm up */
  B.unit('engine hoist');
  B.add(M.orange, box(.12, 1.7, .12), wbX + 3.6, .85, G.far + 1.1).add(M.orange, box(1.6, .1, .1), wbX + 4.3, 1.75, G.far + 1.1, 0, 0, -.25).add(M.black, box(1.4, .08, .6), wbX + 4.1, .08, G.far + 1.1).add(M.steel, cyl(.05, .05, 1.2, 8), wbX + 3.85, 1.0, G.far + 1.1, 0, 0, .4);
  /* tool chests, hose reels, the pit board, extinguishers, the wheel guns */
  const chest = (x) => {
    B.unit('tool chest ' + x);
    B.add(M.black, box(.6, 1.05, 1.0), x, .58, G.far + .6);
    for (let i = 0; i < 6; i++) B.add(M.orange, box(.02, .13, .9), x - .31, .16 + i * .16, G.far + .6).add(M.steel, box(.01, .02, .42), x - .325, .19 + i * .16, G.far + .6);
    B.add(M.steel, box(.64, .03, 1.04), x, 1.12, G.far + .6);
    for (const dz of [-.38, .38]) for (const dx of [-.22, .22]) B.add(M.rubber, cyl(.055, .055, .04, 10), x + dx, .055, G.far + .6 + dz, Math.PI / 2, 0, 0);
    blob(x, G.far + .6, 1.3, 1.6);
  };
  chest(1.2); chest(2.2); chest(3.2); chest(11.5);
  const reel = (x) => { B.unit('reels').add(M.steel, box(.12, .5, .08), x, 1.9, G.far + .06); };   /* v6.92: the drums pay out and wind in (pit-machinery.js) */
  reel(-7.5); reel(4.3); reel(12.8);
  const boardTex = sign('26', {w: 512, h: 768, bg: '#0d1216', fg: COATES_ORANGE, size: 330, sub: 'FISHER'});
  const board = new T.Mesh(plane(.7, 1.05), new T.MeshStandardMaterial({map: boardTex, roughness: .7})); board.position.set(-10.5, .58, G.far + .2); board.rotation.x = -.16; board.name = 'pit board'; tag(board, 'pit board'); root.add(board);
  B.unit('pit board').add(M.alu, cyl(.018, .018, 1.8, 8), -10.5, .9, G.far + .13, .16, 0, 0);
  for (const x of [G.front + 1.2, -6.4, 9.6]) B.unit('extinguisher ' + x).add(M.red, cyl(.08, .08, .55, 14), x, .8, G.far + .14).add(M.black, cyl(.03, .03, .1, 8), x, 1.12, G.far + .14).add(M.steel, box(.2, .04, .12), x, .55, G.far + .08);
  B.unit('gun stand').add(M.steel, box(.5, .04, .3), G.bayFront - 1.2, .62, G.bayFar - .6).add(M.steel, box(.04, .6, .04), G.bayFront - 1.2, .31, G.bayFar - .6).add(M.black, box(.45, .04, .3), G.bayFront - 1.2, .02, G.bayFar - .6);
  /* v5.81: one gun in its holster; the other is the wheel mechanic's (crew.js builds it and stands it in the second holster, GUN_STAND) */
  B.add(M.orange, cyl(.05, .05, .28, 12), G.bayFront - 1.2 - .14, .78, G.bayFar - .6).add(M.black, box(.06, .14, .06), G.bayFront - 1.2 - .14, .66, G.bayFar - .48).add(M.steel, cyl(.02, .02, .12, 8), G.bayFront - 1.2 - .14, .95, G.bayFar - .6);
  B.add(M.black, cyl(.05, .05, .12, 12, true), G.bayFront - 1.2 + .14, .66, G.bayFar - .6);
  B.add(M.orange, new T.TorusGeometry(.16, .022, 8, 24), G.bayFront - 1.2, .05, G.bayFar - .9, Math.PI / 2, 0, 0);

  /* ---- slick racks along the near wall by the door, three high, and the Coates tower and generator in the far corner */
  const rackZ = G.near - .9;
  B.unit('slick racks');
  const tyre = new T.InstancedMesh(new T.TorusGeometry(.245, .10, 10, 24), M.rubber, 36), rim = new T.InstancedMesh(cyl(.17, .17, .22, 16), M.alu, 36);
  { const m = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(1, 1, 1); let i = 0;
    for (const x0 of [-15, -12.6, -10.2]) { for (const y of [.02, .95, 1.88]) B.add(M.steel, box(2.0, .04, .9), x0 + 1, y, rackZ); for (const dx of [0, 2.0]) B.add(M.steel, box(.04, 2.6, .04), x0 + dx, 1.3, rackZ - .42).add(M.steel, box(.04, 2.6, .04), x0 + dx, 1.3, rackZ + .42);
      for (const y of [.38, 1.31, 2.24]) for (const dx of [.25, .75, 1.25, 1.75]) { m.compose(new T.Vector3(x0 + dx, y, rackZ), q.setFromEuler(new T.Euler(0, 0, Math.PI / 2)), sc); tyre.setMatrixAt(i, m); rim.setMatrixAt(i, m); i++; } } }
  tyre.name = 'slicks'; rim.name = 'slick-rims'; tag(tyre, 'slick racks'); tag(rim, 'slick racks'); root.add(tyre, rim);
  const tx = G.back - 2.2, tz = G.near - 2.6;   /* v6.92: in the near back corner, facing the hall (the mezzanine has the far one) */
  B.unit('lighting tower');
  B.add(M.orange, box(1.3, .7, .9), tx, .62, tz).add(M.black, box(1.32, .05, .92), tx, .28, tz).add(M.steel, box(1.5, .06, .1), tx, .24, tz);
  for (const dx of [-.55, .55]) B.add(M.rubber, cyl(.19, .19, .16, 14), tx + dx, .19, tz - .55, Math.PI / 2, 0, 0);
  B.add(M.orange, cyl(.07, .07, 4.0, 10), tx + .35, 2.9, tz + .25).add(M.steel, cyl(.045, .045, 3.6, 10), tx + .35, 5.5, tz + .25);
  B.add(M.black, box(.9, .06, .06), tx + .35, 7.2, tz + .25);
  for (const dx of [-.33, -.11, .11, .33]) B.add(M.black, box(.16, .22, .10), tx + .35 + dx, 7.05, tz + .25).add(M.ledPanel, box(.13, .18, .012), tx + .35 + dx, 7.05, tz + .19);
  { const l = new T.PointLight(0xfff0d0, 6, 9, 1.8); l.position.set(tx + .35, 6.6, tz - .4); root.add(l); lights.push(l); }
  const towerSign = new T.Mesh(plane(1.0, .34), new T.MeshBasicMaterial({map: sign('Coates', {w: 768, h: 260, bg: COATES_ORANGE, fg: '#ffffff', weight: 900, size: 190, letter: -.02})}));
  towerSign.position.set(tx, .64, tz - .451); towerSign.rotation.y = Math.PI; towerSign.name = 'lighting tower sign'; tag(towerSign, 'lighting tower'); root.add(towerSign);
  const gx = G.back - 5, gz = G.near - 2.4;
  B.unit('generator');
  B.add(M.orange, box(1.9, 1.15, 1.0), gx, .7, gz).add(M.black, box(1.92, .12, 1.02), gx, .18, gz).add(M.black, box(1.7, .04, .8), gx, 1.29, gz);
  for (let i = 0; i < 7; i++) B.add(M.black, box(.02, .06, .9), gx - .96, .45 + i * .1, gz);
  const genSign = new T.Mesh(plane(1.2, .40), new T.MeshBasicMaterial({map: sign('Coates', {w: 768, h: 260, bg: COATES_ORANGE, fg: '#ffffff', weight: 900, size: 190, letter: -.02})}));
  genSign.position.set(gx - .3, .82, gz - .501); genSign.rotation.y = Math.PI; genSign.name = 'generator sign'; tag(genSign, 'generator'); root.add(genSign);
  blob(tx, tz, 2.4, 1.8); blob(gx, gz, 3.0, 1.9);

  /* ---- outside: nothing. v6.92 — the pit wall, its gantry and the grandstand went with the open door: the door is shut */

  /* ---- the two Coates sheets, sharp: the Life Saving Rules by the door where the shift signs on, the values wheel on the back wall by the office, each lit */
  const rules = new T.Mesh(plane(1.8, 2.4), new T.MeshStandardMaterial({map: lifeSavingRules(), roughness: .85, metalness: 0, envMapIntensity: .35}));
  rules.position.set(G.front + 2.4, 2.4, G.far + .07); rules.name = 'life-saving-rules'; root.add(rules);
  B.unit('shell').add(M.black, box(1.9, 2.5, .04), G.front + 2.4, 2.4, G.far + .04).add(M.steel, box(.6, .03, .22), G.front + 2.4, 1.15, G.far + .12);
  { const l = new T.SpotLight(0xfff2e0, 9, 7, Math.PI * .2, .6, 1.5); l.position.set(G.front + 2.4, 5.6, G.far + 2.2); l.target.position.set(G.front + 2.4, 2.3, G.far); root.add(l, l.target); lights.push(l); }
  const wheel = new T.Mesh(plane(3.2, 3.2), new T.MeshStandardMaterial({map: valuesWheel(), roughness: .85, metalness: 0, envMapIntensity: .35}));
  wheel.position.set(G.back - .07, 2.9, 9); wheel.rotation.y = -Math.PI / 2; wheel.name = 'coates-values'; root.add(wheel);
  B.add(M.black, box(.04, 3.3, 3.3), G.back - .04, 2.9, 9);
  { const l = new T.SpotLight(0xfff2e0, 10, 8, Math.PI * .2, .6, 1.5); l.position.set(G.back - 2.4, 6.6, 9); l.target.position.set(G.back, 2.9, 9); root.add(l, l.target); lights.push(l); }

  /* ---- THE DYNO. Andrew Fisher, 23 Sep 2026: on a dyno test. */
  const pit = D.pit;
  B.unit('dyno');
  B.add(M.black, box(pit.x1 - pit.x0, .04, pit.z1 - pit.z0), (pit.x0 + pit.x1) / 2, -pit.depth, (pit.z0 + pit.z1) / 2);
  for (const [w, d, x, z] of [[.06, pit.z1 - pit.z0, pit.x0, 0], [.06, pit.z1 - pit.z0, pit.x1, 0], [pit.x1 - pit.x0, .06, (pit.x0 + pit.x1) / 2, pit.z0], [pit.x1 - pit.x0, .06, (pit.x0 + pit.x1) / 2, pit.z1]]) B.add(M.yellow, box(w, .012, d), x, -.002, z);
  for (const [w, d, x, z] of [[.06, pit.z1 - pit.z0, pit.x0, 0], [.06, pit.z1 - pit.z0, pit.x1, 0], [pit.x1 - pit.x0, .06, (pit.x0 + pit.x1) / 2, pit.z0], [pit.x1 - pit.x0, .06, (pit.x0 + pit.x1) / 2, pit.z1]]) B.add(M.steel, box(w, pit.depth, d), x, -pit.depth / 2, z);
  /* the grating round the rollers, the housings, the bearing blocks; the rollers themselves are instanced and turn */
  for (const z of [-D.wheelZ, D.wheelZ]) {
    const zi = z - Math.sign(z) * D.rollerLen / 2 - .04, zo = z + Math.sign(z) * D.rollerLen / 2 + .04;
    for (const dx of [-D.rollerDX, D.rollerDX]) { B.add(M.steel, box(.16, .3, .16), D.axleX + dx, D.axisY, zi); B.add(M.steel, box(.16, .3, .16), D.axleX + dx, D.axisY, zo); }
    B.add(M.black, box(.9, .04, .12), D.axleX, D.axisY - .2, zi).add(M.black, box(.9, .04, .12), D.axleX, D.axisY - .2, zo);
  }
  const grate = new Batch('floor');
  grate.add(M.grate, plane(pit.x1 - pit.x0 - .1, .55), (pit.x0 + pit.x1) / 2, -.03, 0, -Math.PI / 2, 0, 0);
  for (const z of [pit.z0 + .18, pit.z1 - .18]) grate.add(M.grate, plane(pit.x1 - pit.x0 - .1, .28), (pit.x0 + pit.x1) / 2, -.03, z, -Math.PI / 2, 0, 0);
  grate.build(root, {receive: true, names: 'dyno-grating'});
  const rollers = new T.InstancedMesh(cyl(D.rollerR, D.rollerR, D.rollerLen, 28), M.roller, 4);
  { const m = new T.Matrix4(), q = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0)), sc = new T.Vector3(1, 1, 1); let i = 0;
    for (const z of [-D.wheelZ, D.wheelZ]) for (const dx of [-D.rollerDX, D.rollerDX]) { m.compose(new T.Vector3(D.axleX + dx, D.axisY, z), q, sc); rollers.setMatrixAt(i++, m); } }
  rollers.name = 'dyno-rollers'; rollers.castShadow = false; tag(rollers, 'dyno rollers'); root.add(rollers);
  /* wheel chocks at the front wheels, tie-downs from the rear of the car to the floor anchors */
  /* wheel chocks, tie-downs and the hose funnels hold the CAR: they go with it when the cog view takes the car
     away (root.userData.fittings), so nothing is strapped to thin air */
  const F = new Batch('car fittings');
  for (const z of [-D.wheelZ, D.wheelZ]) for (const dx of [-.43, .43]) { F.add(M.rubber, box(.14, .11, .28), -1.337 + dx, .055, z, 0, 0, dx < 0 ? -.35 : .35); F.add(M.orange, box(.06, .02, .28), -1.337 + dx * 1.12, .12, z, 0, 0, dx < 0 ? -.35 : .35); }
  B.unit('anchors');
  for (const z of [-1, 1]) { B.add(M.steel, box(.3, .04, .3), 3.6, .02, z * 1.5).add(M.steel, new T.TorusGeometry(.06, .015, 8, 16), 3.6, .07, z * 1.5, Math.PI / 2, 0, 0); between(F, M.orange, [2.35, .38, z * .55], [3.6, .07, z * 1.5], .05, .012); between(F, M.black, [2.9, .25, z * 1.0], [3.05, .18, z * 1.13], .1, .06); }
  for (const z of [-1, 1]) { B.add(M.steel, box(.3, .04, .3), -4.1, .02, z * 1.5); between(F, M.orange, [-2.45, .36, z * .5], [-4.1, .07, z * 1.5], .05, .012); }
  /* the cooling fan on the nose: shroud, guard rings, hub and the blades that turn */
  const fx = -5.9, fy = .95;
  B.unit('dyno fan');
  B.add(M.orange, cyl(.95, .95, .55, 40, true), fx, fy, 0, 0, 0, Math.PI / 2).add(M.black, new T.TorusGeometry(.95, .04, 8, 40), fx - .28, fy, 0, 0, Math.PI / 2, 0).add(M.black, new T.TorusGeometry(.95, .04, 8, 40), fx + .28, fy, 0, 0, Math.PI / 2, 0);
  for (const r of [.3, .55, .8]) B.add(M.black, new T.TorusGeometry(r, .012, 6, 36), fx + .3, fy, 0, 0, Math.PI / 2, 0);
  for (let i = 0; i < 6; i++) B.add(M.black, box(.012, 1.9, .02), fx + .3, fy, 0, i * Math.PI / 6, 0, 0);
  B.add(M.black, box(.9, .1, 1.3), fx, .05, 0).add(M.steel, box(.08, .9, .08), fx, .5, -.55).add(M.steel, box(.08, .9, .08), fx, .5, .55).add(M.black, cyl(.18, .18, .2, 14), fx - .1, fy, 0, 0, 0, Math.PI / 2);
  for (const dz of [-.6, .6]) for (const dx of [-.35, .35]) B.add(M.rubber, cyl(.08, .08, .06, 10), fx + dx, .08, dz, Math.PI / 2, 0, 0);
  const fanSign = new T.Mesh(plane(.9, .24), new T.MeshBasicMaterial({map: sign('Coates', {w: 768, h: 260, bg: COATES_ORANGE, fg: '#ffffff', weight: 900, size: 190, letter: -.02})}));
  fanSign.position.set(fx, fy + .98, 0); fanSign.rotation.y = -Math.PI / 2; fanSign.name = 'dyno fan sign'; tag(fanSign, 'dyno fan'); root.add(fanSign);
  const fan = new T.Group(); fan.position.set(fx + .05, fy, 0); fan.name = 'dyno-fan'; tag(fan, 'dyno fan');
  { const blades = []; for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; const g = new T.BoxGeometry(.05, .8, .24).applyMatrix4(new T.Matrix4().makeRotationY(.6)).applyMatrix4(new T.Matrix4().makeTranslation(0, .48, 0)).applyMatrix4(new T.Matrix4().makeRotationX(a)); blades.push(g); }
    const bl = new T.Mesh(mergeGeometries(blades, false), M.alu); bl.name = 'fan-blades'; fan.add(bl); root.add(fan); }
  /* exhaust extraction: the rail in the roof, two hoses down to the side exhausts, funnels on their ends */
  B.unit('extraction rails').add(M.black, box(.5, .5, 10), 3.4, G.height - 1.9, 0).add(M.black, box(.4, .4, 10), -3.4, G.height - 1.9, 0);
  /* v5.81 — one hose (and its funnel) a side, so the wheel service can take the one on its side away: the funnel meets the
     side pipe just ahead of the rear wheel, and a crew unhooks it before a wheel comes off (serviceKit.set below) */
  const hose = new T.Group(); hose.name = 'extraction-hoses'; const hoseBySide = {};
  for (const z of [-1, 1]) {
    const c = new T.CatmullRomCurve3([new T.Vector3(1.05, .40, z * 1.3), new T.Vector3(1.4, .55, z * 1.9), new T.Vector3(2.2, 1.6, z * 2.5), new T.Vector3(3.0, 4.0, z * 2.2), new T.Vector3(3.4, G.height - 2.2, z * 1.4)]);
    const funnel = cyl(.08, .12, .2, 14).applyMatrix4(new T.Matrix4().compose(new T.Vector3(1.05, .40, z * 1.2), new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0)), new T.Vector3(1, 1, 1)));
    const m = new T.Mesh(mergeGeometries([new T.TubeGeometry(c, 48, .075, 10, false), funnel.index ? funnel.toNonIndexed() : funnel].map(g => g.index ? g.toNonIndexed() : g), false), M.hose);
    m.name = z > 0 ? 'extraction hose, near' : 'extraction hose, far'; m.castShadow = false; hose.add(m); hoseBySide[z] = m;
  }
  const fittings = new T.Group(); fittings.name = 'car-fittings'; tag(fittings, 'car fittings'); F.build(fittings, {receive: false, names: 'car-fittings'}); /* v5.85 — the extraction hoses are not hung: they met the pipes at the front of the rear tyres and read as hoses on the tyres */ root.add(fittings); root.userData.fittings = fittings;
  /* ---- THE WHEEL SERVICE KIT (v5.81). Andrew Fisher's workshop brief, 24 Sep 2026: the service position and support. Two jack
     stands that slide in under the sill on the side being serviced — a splayed orange frame, a steel column and a saddle
     whose top meets the side skirt's underside (measured by raycast off the original body: .146 m at x −.45, .151 at
     x .25, flat between z .84 and .86) — and the low wheel stand the wheel is laid on, outer face up, beside the pit's
     edge. Hidden until the service asks for them; car-motion.js WheelService moves them through set(). ---- */
  { const kit = new T.Group(); kit.name = 'wheel-service-kit'; kit.visible = false; tag(kit, 'service kit'); root.add(kit);
    const stand = (name, top) => { const g = new T.Group(); g.name = name; kit.add(g);
      const legs = [], col = [];
      for (let k = 0; k < 3; k++) { const a = k * Math.PI * 2 / 3 + Math.PI / 6, foot = new T.Vector3(Math.cos(a) * .13, 0, Math.sin(a) * .13), head = new T.Vector3(Math.cos(a) * .035, top - .07, Math.sin(a) * .035), d = head.clone().sub(foot), L = d.length();
        const leg = new T.BoxGeometry(.022, L, .022).applyMatrix4(new T.Matrix4().compose(foot.clone().addScaledVector(d, .5), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()), new T.Vector3(1, 1, 1))); legs.push(leg);
        legs.push(new T.BoxGeometry(.05, .008, .05).translate(foot.x, .004, foot.z)); }
      legs.push(new T.CylinderGeometry(.042, .042, .03, 20).translate(0, top - .075, 0));
      col.push(new T.CylinderGeometry(.018, .018, .10, 16).translate(0, top - .06, 0), new T.BoxGeometry(.012, .08, .03).translate(.022, top - .07, 0));
      /* the saddle: a cradle 100 mm along the sill, its lips either side of it */
      col.push(new T.BoxGeometry(.10, .012, .05).translate(0, top - .006, 0), new T.BoxGeometry(.10, .02, .008).translate(0, top - .002, .025), new T.BoxGeometry(.10, .02, .008).translate(0, top - .002, -.025));
      const frame = new T.Mesh(mergeGeometries(legs, false), M.orange); frame.name = 'Jack stand frame'; frame.castShadow = true; frame.receiveShadow = true; g.add(frame);
      const column = new T.Mesh(mergeGeometries(col, false), M.steel); column.name = 'Jack stand column and saddle'; column.castShadow = true; g.add(column);
      return g; };
    const front = stand('Jack stand, front', .146), rear = stand('Jack stand, rear', .151);
    /* the wheel stand: a low steel frame and cross, 24 mm high, a rubber strip on each bar where the tyre's wall lies */
    const ws = new T.Group(); ws.name = 'Wheel stand'; kit.add(ws);
    { const parts = []; for (const [w, d, x, z] of [[.46, .03, 0, .215], [.46, .03, 0, -.215], [.03, .46, .215, 0], [.03, .46, -.215, 0], [.46, .03, 0, 0], [.03, .46, 0, 0]]) parts.push(new T.BoxGeometry(w, .016, d).translate(x, .008, z));
      for (const [x, z] of [[.2, .2], [-.2, .2], [.2, -.2], [-.2, -.2]]) parts.push(new T.CylinderGeometry(.018, .018, .008, 12).translate(x, .02, z));
      const m = new T.Mesh(mergeGeometries(parts, false), M.steel); m.name = 'Wheel stand frame'; m.castShadow = true; m.receiveShadow = true; ws.add(m); }
    root.userData.serviceKit = {group: kit, front, rear, wheelStand: ws,
      /* in 0..1: how far the kit has come in (0 away, 1 in place); side ±1 the car's side (+z near); x the wheel's axle; the wheel stand at the wheel's offset + standOut */
      /* crewStand (v5.81): the crew carry the wheel to their own rack (crew.js), so the low stand stays away */
      set({in: k = 0, side = 1, x = D.axleX, standOut = .79, wheelZ = D.wheelZ, crewStand = false} = {}) {
        kit.visible = k > .001; ws.visible = !crewStand; const out = 1 - k;
        /* the extraction on the service side is unhooked while the stands are in, and hooked back when they go */
        hoseBySide[1].visible = !(side > 0 && k > .5); hoseBySide[-1].visible = !(side < 0 && k > .5);
        front.position.set(-.45, 0, side * (.85 + out * .65)); rear.position.set(.25, 0, side * (.85 + out * .65));
        ws.position.set(x, 0, side * (wheelZ + standOut + out * .5)); } }; }
  /* the console beside the rollers: a cabinet, a stand, the screen, the stack light */
  const cx = 0, cz = -3.7;
  B.unit('console');
  B.add(M.black, box(1.1, .9, .6), cx, .45, cz).add(M.orange, box(1.1, .04, .6), cx, .92, cz).add(M.steel, box(.08, 1.2, .08), cx, 1.5, cz).add(M.black, box(1.9, 1.1, .06), cx, 2.05, cz - .02);
  const consoleCanvas = document.createElement('canvas'); consoleCanvas.width = 1024; consoleCanvas.height = 576;
  const consoleTex = new T.CanvasTexture(consoleCanvas); consoleTex.colorSpace = T.SRGBColorSpace;
  const consoleScreen = new T.Mesh(plane(1.8, 1.0), new T.MeshBasicMaterial({map: consoleTex})); consoleScreen.position.set(cx, 2.05, cz + .02); consoleScreen.name = 'dyno-console'; tag(consoleScreen, 'console'); root.add(consoleScreen);
  const stackCanvas = document.createElement('canvas'); stackCanvas.width = 32; stackCanvas.height = 96;
  const stackTex = new T.CanvasTexture(stackCanvas); stackTex.colorSpace = T.SRGBColorSpace;
  B.add(M.steel, cyl(.03, .03, .5, 8), cx + 1.05, 2.85, cz).add(M.black, cyl(.06, .06, .06, 10), cx + 1.05, 2.6, cz);
  const stack = new T.Mesh(cyl(.06, .06, .5, 12), new T.MeshBasicMaterial({map: stackTex})); stack.position.set(cx + 1.05, 2.85, cz); stack.name = 'stack-light'; tag(stack, 'console'); root.add(stack);
  /* the haze off the exhausts while the V8 runs: a few dozen sprites, one draw, drifting up and gone */
  const N = 48, hp = new Float32Array(N * 3), life = new Float32Array(N);
  for (let i = 0; i < N; i++) { life[i] = Math.random(); hp[i * 3] = 1.2; hp[i * 3 + 1] = .4; hp[i * 3 + 2] = (i % 2 ? 1 : -1) * 1.3; }
  const hazeGeo = new T.BufferGeometry(); hazeGeo.setAttribute('position', new T.BufferAttribute(hp, 3));
  const haze = new T.Points(hazeGeo, new T.PointsMaterial({map: hazeSprite(), size: .55, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, color: 0xd8c8b8, sizeAttenuation: true}));
  haze.name = 'exhaust-haze'; haze.frustumCulled = false; haze.renderOrder = 5; root.add(haze);

  /* ---- v6.92 — THE HALL AT WORK: the crane, the lift, the compressor, the washer, the drill, the tyre machines, the carousel, the fans, the
     beacons, the reels and the board (pit-machinery.js), ticked with the dyno below */
  const MX = buildMachinery({G, M, sign, blob}); root.add(MX.group); root.userData.machinery = MX;

  /* ---- what the pointer can pick: one box per exhibit, over the thing it stands for, clear of the car and the cog */
  exhibitBox(root, 'dyno', 1.7, .44, 2.9, D.axleX, -pit.depth / 2 - .04, 0);
  exhibitBox(root, 'straps', .5, .3, .5, 3.6, .12, -1.5); exhibitBox(root, 'straps', .5, .3, .5, 3.6, .12, 1.5); exhibitBox(root, 'straps', .5, .3, .5, -4.1, .12, -1.5); exhibitBox(root, 'straps', .5, .3, .5, -4.1, .12, 1.5);
  exhibitBox(root, 'fan', 1.2, 2.2, 2.2, fx, 1.05, 0);
  
  exhibitBox(root, 'console', 2.0, 2.7, .8, cx, 1.4, cz);
  exhibitBox(root, 'stack', .3, .7, .3, cx + 1.05, 2.85, cz);
  /* v6.92 — the crane's two pick boxes ride it: one round the hook block and its load, one along the bridge */
  { const a = exhibitBox(root, 'crane', 3.4, 4.6, 3.2, 0, 0, 0), b = exhibitBox(root, 'crane', 1.2, 1.4, floorD - 2.6, 0, 0, 0); MX.crane.hook.add(a); a.position.set(0, -1.0, 0); MX.crane.bridge.add(b); b.position.set(0, runY + .95, 0); }
  exhibitBox(root, 'transporter', 14, 5, 3, tX, 2.6, tZ); exhibitBox(root, 'transporter', 2.8, 3.6, 2.8, tX - 8.2, 2, tZ);
  exhibitBox(root, 'mezzanine', 6.4, 3.2, 7.2, mzX0 + 3.7, mzY + 1.6, -9.5 + mz);
  exhibitBox(root, 'workbench', 6.2, 3.2, 1.2, wbX, 1.6, G.far + .55);
  exhibitBox(root, 'rules', 1.9, 2.5, .14, G.front + 2.4, 2.4, G.far + .08);
  exhibitBox(root, 'values', .16, 3.3, 3.3, G.back - .08, 2.9, 9);
  exhibitBox(root, 'screen', 3.9, 2.2, .3, -3.2, 3.1, G.far + .15);
  exhibitBox(root, 'desk', deskX1 - deskX0 + .2, 1.5, 1.0, (deskX0 + deskX1) / 2, .75, deskZ);
  exhibitBox(root, 'chests', 2.8, 1.2, 1.1, 2.2, .6, G.far + .6); exhibitBox(root, 'chests', .8, 1.2, 1.1, 11.5, .6, G.far + .6);
  for (const x of [-7.5, 4.3, 12.8]) exhibitBox(root, 'reels', .8, .8, .4, x, 1.9, G.far + .2);
  exhibitBox(root, 'guns', .7, 1.1, .6, G.bayFront - 1.2, .55, G.bayFar - .65);
  exhibitBox(root, 'board', .8, 1.15, .3, -10.5, .6, G.far + .2);
  for (const x of [G.front + 1.2, -6.4, 9.6]) exhibitBox(root, 'extinguishers', .3, .8, .3, x, .8, G.far + .14);
  exhibitBox(root, 'slicks', 7.2, 2.7, 1.0, -11.6, 1.3, rackZ);
  exhibitBox(root, 'cabinet', .7, 1.95, .7, -.4, .97, G.far + .55);
  exhibitBox(root, 'tower', 1.5, 7.4, 1.1, tx, 3.7, tz);
  exhibitBox(root, 'generator', 2.0, 1.4, 1.1, gx, .7, gz);
  for (const [x, z] of [[-9, -5.5], [-9, 5.5], [9, -6.5], [9, 6.5]]) exhibitBox(root, 'banners', .2, 2.9, 1.6, x, G.height - 2.6, z);
  exhibitBox(root, 'beam', .6, G.height - G.lintel, G.doorNear - G.doorFar, G.front - .2, (G.height + G.lintel) / 2, 0);
  exhibitBox(root, 'hatch', .9, .05, G.doorNear - G.doorFar, G.front + .5, .02, 0);
  exhibitBox(root, 'floor26', 2.3, .05, 2.3, G.bayFront + 1.5, .02, 0);

  /* ---- light you can see: soft beams under the cell\'s three lamps, the LED glow along the skirting */
  const beam = new T.MeshBasicMaterial({map: beamMap(), transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false});
  /* v6.99 — the shafts stop at 2 m, above the car's roof (1.34 m). They went down to 0.2 m, so the planes over the cell stood through the
     middle of the car: faint, but a sheet of light across the body from most angles. Each lamp's shaft is its own unit for the clear view. */
  const shaftTop = G.height - 1.4, shaftBottom = 2.0, shaftH = shaftTop - shaftBottom, shaftW = 3.2;
  const BM = new Batch();
  for (const [x, z] of [[-3.5, 0], [2.5, 0]]) { BM.unit('light shaft ' + x); for (const ry of [0, Math.PI / 2, Math.PI / 4, -Math.PI / 4]) BM.add(beam, plane(shaftW, shaftH), x, shaftBottom + shaftH / 2, z, 0, ry, 0); }
  BM.build(root, {receive: false, names: 'light-beam', renderOrder: 4});
  const glow = new T.MeshBasicMaterial({color: 0xff6a13, transparent: true, alphaMap: ramp(), opacity: .14, blending: T.AdditiveBlending, depthWrite: false, fog: false});
  const GL = new Batch('floor');
  GL.add(glow, plane(floorW - .6, 1.0), 0, .0014, G.far + .5, -Math.PI / 2, 0, Math.PI);
  GL.add(glow, plane(floorW - .6, 1.0), 0, .0014, G.near - .5, -Math.PI / 2, 0, 0);
  GL.add(glow, plane(floorD - .6, 1.0), G.back - .5, .0014, 0, -Math.PI / 2, 0, Math.PI / 2);
  GL.build(root, {receive: false, names: 'led-glow', renderOrder: 3});
  /* the cell\'s own glow under the car while the V8 runs — an orange ring on the floor that comes up with the drive */
  const ring = new T.Mesh(new T.RingGeometry(2.6, 3.9, 48), new T.MeshBasicMaterial({color: 0xff6a13, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, fog: false}));
  ring.rotation.x = -Math.PI / 2; ring.position.set(0, .0016, 0); ring.scale.set(1.35, 1, 1); ring.renderOrder = 3; ring.name = 'run-ring'; root.add(ring);
  B.unit('desk').add(M.black, cyl(.15, .15, .05, 16), deskX0 + .4, .92, deskZ + .2).add(M.orange, new T.SphereGeometry(.14, 20, 14, 0, Math.PI * 2, 0, Math.PI * .62), deskX0 + .4, .95, deskZ + .2);

  S.build(root, {receive: false, names: 'drawn-shadow', renderOrder: 2});
  B.build(root);
  root.userData.lights = lights;

  /* ---- THE DYNO RUNS OFF THE MACHINE. car-app.js calls tick(dt, state) every frame with the drive\'s own numbers —
     running, winding down, a connection open, the wheel\'s angular speed, the inspection rpm. The rollers turn at the
     tyre\'s surface speed, the fan spins up and down, the haze lifts off the exhausts, the ring comes up, the console
     redraws a few times a second and the stack light says which state the drive is in. Nothing here is a figure the
     machine did not make. */
  const st = {rollerAngle: 0, fanOmega: 0, ringOpacity: 0, consoleAt: 0, history: [], lastRunning: null, lastOpen: null, lastWinding: null};
  const rm = new T.Matrix4(), rq = new T.Quaternion(), rs = new T.Vector3(1, 1, 1), rp = new T.Vector3(), rq0 = new T.Quaternion().setFromEuler(new T.Euler(Math.PI / 2, 0, 0)), rqa = new T.Quaternion(), rz = new T.Vector3(0, 0, 1);
  root.userData.tick = (dt, d) => {
    d = d || {};
    MX.tick(dt, d);
    const running = !!d.running, winding = !!d.winding, open = !!d.open;
    /* rollers: the tyre\'s surface speed over the roller\'s radius */
    const wheelOmega = d.wheelOmega || 0;
    if (wheelOmega) { st.rollerAngle += wheelOmega * (D.tyreR / D.rollerR) * dt; let i = 0;
      for (const z of [-D.wheelZ, D.wheelZ]) for (const dx of [-D.rollerDX, D.rollerDX]) { rq.copy(rq0).premultiply(rqa.setFromAxisAngle(rz, st.rollerAngle)); rm.compose(rp.set(D.axleX + dx, D.axisY, z), rq, rs); rollers.setMatrixAt(i++, rm); }
      rollers.instanceMatrix.needsUpdate = true; }
    /* the fan spins up while the V8 runs and coasts down when it stops */
    const target = running ? 14 : 0; st.fanOmega += (target - st.fanOmega) * Math.min(1, dt * (running ? 1.2 : .5));
    if (st.fanOmega > .01) fan.rotation.x += st.fanOmega * dt;
    /* the ring on the floor and the haze off the exhausts */
    const ringTarget = running ? .16 : 0; st.ringOpacity += (ringTarget - st.ringOpacity) * Math.min(1, dt * 2); ring.material.opacity = st.ringOpacity;
    const hazeOn = running || st.fanOmega > 2;
    haze.material.opacity += (((running ? .5 : 0)) - haze.material.opacity) * Math.min(1, dt * 1.5);
    if (hazeOn || haze.material.opacity > .01) { const a = haze.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) { life[i] += dt * (.35 + (i % 5) * .05); if (life[i] > 1) life[i] -= 1; const t = life[i], side = i % 2 ? 1 : -1;
        a[i * 3] = 1.0 + t * 2.2 + Math.sin(t * 9 + i) * .08; a[i * 3 + 1] = .42 + t * t * 2.8; a[i * 3 + 2] = side * (1.28 + t * .9) + Math.cos(t * 7 + i) * .1; }
      haze.geometry.attributes.position.needsUpdate = true; }
    /* the console and the stack light */
    /* v6.99 — the screen is redrawn (and its 1024 x 576 picture sent to the graphics card again) only when what it shows has changed and it
       is in the camera's view (d.frustum); before, it was redrawn six times a second whatever it showed and wherever the camera looked */
    st.consoleAt += dt;
    if (st.consoleAt > .16) { st.consoleAt = 0; st.history.push(d.rpm || 0); if (st.history.length > 180) st.history.shift();
      const flat = st.history.every(v => v === 0), key = [running, winding, open, d.status, Math.abs(wheelOmega) > 1e-4, Math.round(d.rpm || 0), flat].join('|');
      if (key !== st.consoleKey || !flat) st.consoleDirty = true; st.consoleKey = key; }
    if ((st.consoleDirty || consoleCanvas.width !== Math.round(1024 * Math.min(1.5, currentPrintScale()))) && (!d.frustum || d.frustum.intersectsObject(consoleScreen))) { st.consoleDirty = false;
      /* v8.08 — on the higher rungs the screen is drawn at up to 1.5× (1536 × 864): the same drawing, scaled, so DYNO CELL stays crisp in 4K */
      const k = Math.min(1.5, currentPrintScale()), cw = Math.round(1024 * k), ch = Math.round(576 * k);
      if (consoleCanvas.width !== cw) { consoleCanvas.width = cw; consoleCanvas.height = ch; consoleTex.dispose(); }
      const cg = consoleCanvas.getContext('2d'); cg.setTransform(cw / 1024, 0, 0, ch / 576, 0, 0);
      drawConsole(cg, 1024, 576, {running, winding, open, rpm: d.rpm || 0, rollers: Math.abs(wheelOmega) > 1e-4, status: d.status, history: st.history}); cg.setTransform(1, 0, 0, 1, 0, 0); consoleTex.needsUpdate = true; }
    if (running !== st.lastRunning || open !== st.lastOpen || winding !== st.lastWinding) { st.lastRunning = running; st.lastOpen = open; st.lastWinding = winding;
      drawStack(stackCanvas.getContext('2d'), stackCanvas.width, stackCanvas.height, {running, winding, open}); stackTex.needsUpdate = true; }
  };
  root.userData.dyno = st;   /* the state, readable by the harness */
  st.consoleAt = 1;          /* the first tick draws the screen at once */
  root.userData.tick(0, {running: false, rpm: 0, status: 'READY'});
  /* v6.99 — THE BUILDING DOES NOT MOVE, SO ITS MATRICES ARE WORKED OUT ONCE. Every object's matrix used to be recomposed every frame (twice:
     car-app.js forced a whole-scene update, then the renderer did its own). Only the dyno fan, the service kit and the machinery move. */
  root.updateMatrixWorld(true);
  { const moving = new Set(); for (const o of [fan, root.userData.serviceKit.group, MX.group]) o.traverse(x => moving.add(x));
    root.traverse(o => { if (!moving.has(o)) o.matrixAutoUpdate = false; }); }
  return root;
}
