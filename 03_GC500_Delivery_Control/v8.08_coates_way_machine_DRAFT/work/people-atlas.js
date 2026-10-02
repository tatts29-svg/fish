/* THE PEOPLE'S ATLAS (v8.08). Author: Andrew Fisher. Andrew Fisher, 2 Oct 2026: "Make this all 4k crystal clear. Improve every thing
   on here. 10/10". One canvas for every person and everything the crew handle, so a person is still one draw and the whole crew
   share one material. v8.08 gives it a second 2048 x 512 band: the safety officer's hi-vis vest (lime, two silver bands round it and
   two over the shoulders, SAFETY across the back, Coates on the chest), and a second row of swatches for the new detail — the silver
   retro-reflective tape, hi-vis lime, the boot's tan stitching, the glove's orange knuckle guard, the visor's smoked edge.
   The suit, the two helmets, the sleeve, the leg and the labels are drawn as before (crew.js v5.81, car-driver.js canvases), the leg
   and sleeve now carrying the reflective hoops a Coates crew suit has, and the suit its belt and pocket seams.
   Its companion map carries roughness (green) and metalness (blue) in the same layout. */
import * as T3 from './vendor/three.module.js';
import {suitTexture, limbTexture, helmetTexture, ORANGE, FONT} from './car-driver.js';

export const ATLAS = Object.freeze({
  W: 2048, H: 2048, gutter: 6,
  suit: [0, 0, 1024, 1024], helmet: [1024, 0, 1024, 512], helmetLead: [1024, 512, 1024, 512],
  sleeve: [0, 1024, 1024, 256], leg: [0, 1280, 1024, 256], labels: [1024, 1024, 1024, 384], swatches: [1024, 1408, 1024, 128],
  vest: [0, 1536, 1024, 512], swatches2: [1024, 1536, 1024, 128], glove: [1024, 1664, 512, 384], boot: [1536, 1664, 512, 384],
});
/* the first row is crew.js's sixteen, in their order (the props use them); the second row is v8.08's */
export const SWATCH = Object.freeze({orange: 0, charcoal: 1, black: 2, glove: 3, visor: 4, steel: 5, rubber: 6, yellow: 7, white: 8, grey: 9, darkGrey: 10, alu: 11, red: 12, screen: 13, orangeDark: 14, timber: 15,
  reflect: 16, hivis: 17, tan: 18, gloveOrange: 19, smoke: 20, sole: 21, balaclava: 22, chrome: 23, hivisOrange: 24, navy: 25, gunmetal: 26, leather: 27});
const SWATCH_RGB = ['#ff6a13', '#2a2f35', '#111317', '#141518', '#0a0d11', '#8d989f', '#141517', '#f2b400', '#eceeec', '#5b646b', '#23282d', '#b8c1c6', '#b5161a', '#05080b', '#c84f10', '#8a6a44',
  '#dfe4e6', '#c8f31d', '#b58a52', '#ff6a13', '#1b2a33', '#1a1b1d', '#1d2125', '#d9dee2', '#ff7a1a', '#1d2a44', '#3a4046', '#2b2420'];
/* roughness (0–1) and metalness (0–1) of each swatch, in the same order */
const SWATCH_RM = [[.48, 0], [.9, 0], [.72, 0], [.74, 0], [.07, .25], [.34, .9], [.93, 0], [.6, 0], [.55, 0], [.7, 0], [.6, .1], [.36, .85], [.5, 0], [.12, 0], [.52, 0], [.82, 0],
  [.32, .55], [.62, 0], [.7, 0], [.55, 0], [.1, .3], [.95, 0], [.95, 0], [.18, .95], [.6, 0], [.85, 0], [.4, .7], [.6, 0]];
/* the six jobs, across the back of each suit; then the forklift's wordmark and the cage's plate */
export const LABELS = Object.freeze(['WHEELS', 'PIT TECH', 'ENGINE', 'TELEMETRY', 'CREW LEAD', 'FORKLIFT', 'Coates', 'COATES · TYRES']);
const CHARCOAL = '#2a2f35', REFLECT = '#dfe4e6', HIVIS = '#c8f31d';

function makeCanvas(w, h) { if (typeof document === 'undefined') return null; const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
/* a picture into an atlas rectangle, inset by the gutter, and its edges stretched out into the gutter so the mip chain of a
   neighbour never bleeds into it */
function blit(g, src, [x, y, w, h], gut) {
  if (!src) return; const sw = src.width, sh = src.height, iw = w - 2 * gut, ih = h - 2 * gut;
  g.drawImage(src, 0, 0, sw, sh, x + gut, y + gut, iw, ih);
  g.drawImage(src, 0, 0, sw, 1, x + gut, y, iw, gut); g.drawImage(src, 0, sh - 1, sw, 1, x + gut, y + h - gut, iw, gut);
  g.drawImage(src, 0, 0, 1, sh, x, y + gut, gut, ih); g.drawImage(src, sw - 1, 0, 1, sh, x + w - gut, y + gut, gut, ih);
}
/* text laid across a lofted body (canvas x runs up the spine, canvas y round it): the word turned a quarter */
function across(g, text, x, y, size, color, dir = 1, weight = 800, spacing = 0) { g.save(); g.translate(x, y); g.rotate(dir * Math.PI / 2); g.fillStyle = color; g.font = `${weight} ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; if (spacing && 'letterSpacing' in g) g.letterSpacing = spacing + 'px'; g.fillText(text, 0, 0); g.restore(); }
/* a band of retro-reflective tape: silver with a fine prism grain and a dark edge either side */
function tape(g, x, y, w, h, vertical = false) {
  g.fillStyle = 'rgba(0,0,0,.35)'; if (vertical) { g.fillRect(x - 2, y, w + 4, h); } else g.fillRect(x, y - 2, w, h + 4);
  g.fillStyle = REFLECT; g.fillRect(x, y, w, h);
  g.fillStyle = 'rgba(255,255,255,.55)'; if (vertical) for (let yy = y; yy < y + h; yy += 5) g.fillRect(x, yy, w, 1); else for (let xx = x; xx < x + w; xx += 5) g.fillRect(xx, y, 1, h);
  g.fillStyle = 'rgba(120,130,135,.35)'; if (vertical) for (let yy = y + 2; yy < y + h; yy += 5) g.fillRect(x, yy, w, 1); else for (let xx = x + 2; xx < x + w; xx += 5) g.fillRect(xx, y, 1, h);
}
/* the fabric's weave: a faint diagonal twill over a flat colour, so a suit reads as cloth close up */
function twill(g, x0, y0, w, h, a = .035) { g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.strokeStyle = `rgba(255,255,255,${a})`; g.lineWidth = 1; for (let k = -h; k < w; k += 4) { g.beginPath(); g.moveTo(x0 + k, y0); g.lineTo(x0 + k + h, y0 + h); g.stroke(); } g.restore(); }

/* THE VEST: canvas x up the body (waist 0 → shoulders 1024), canvas y round it — y .75H the chest (front), .25H the back, as the suit */
function vestCanvas() {
  const c = makeCanvas(1024, 512); if (!c) return null; const g = c.getContext('2d'), W = 1024, H = 512;
  g.fillStyle = HIVIS; g.fillRect(0, 0, W, H); twill(g, 0, 0, W, H, .05);
  /* the two hoops of tape round the body, waist and chest */
  for (const x of [W * .16, W * .46]) tape(g, x, 0, 46, H, true);
  /* the braces over the shoulders, front and back: down from the shoulder line to the upper hoop, either side of the zip and the spine */
  for (const yc of [H * .25, H * .75]) for (const dy of [-H * .1, H * .1]) tape(g, W * .5, yc + dy - 14, W * .5, 28);
  /* the front opening: a zip line with a dark tape */
  g.fillStyle = 'rgba(30,40,10,.55)'; g.fillRect(0, H * .75 - 3, W, 6);
  /* SAFETY across the back, between the hoops, read from behind; Coates over the heart, small */
  across(g, 'SAFETY', W * .31, H * .25, 50, '#1b2226', 1, 900, 2);
  across(g, 'Coates', W * .80, H * .75 + 46, 34, '#1b2226', 1, 900, -1);
  across(g, 'Coates', W * .32, H * .75 - 58, 30, '#1b2226', 1, 900, -1);
  /* the edge binding at the waist and the arm holes */
  g.fillStyle = 'rgba(40,50,20,.45)'; g.fillRect(0, 0, 10, H); g.fillRect(W - 12, 0, 12, H);
  return c;
}
/* THE GLOVE: a palm and the backs of the fingers — black, orange knuckle guard, grip panel; read as one swatch-like texture */
function gloveCanvas() {
  const c = makeCanvas(512, 384); if (!c) return null; const g = c.getContext('2d');
  g.fillStyle = '#16181b'; g.fillRect(0, 0, 512, 384); twill(g, 0, 0, 512, 384, .05);
  g.fillStyle = '#2a2d31'; for (let y = 20; y < 384; y += 30) g.fillRect(0, y, 512, 2);
  return c;
}
/* THE BOOT: black leather, stitching, tan welt */
function bootCanvas() {
  const c = makeCanvas(512, 384); if (!c) return null; const g = c.getContext('2d');
  g.fillStyle = '#17181a'; g.fillRect(0, 0, 512, 384);
  g.fillStyle = 'rgba(255,255,255,.04)'; for (let y = 0; y < 384; y += 3) g.fillRect(0, y, 512, 1);
  g.strokeStyle = 'rgba(181,138,82,.55)'; g.lineWidth = 2; g.setLineDash && g.setLineDash([6, 5]); for (const y of [60, 300]) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); } g.setLineDash && g.setLineDash([]);
  return c;
}

let sharedAtlas = null;
export function crewAtlas() {
  if (sharedAtlas) return sharedAtlas;
  const A = ATLAS, c = makeCanvas(A.W, A.H), m = makeCanvas(A.W / 4, A.H / 4);
  let map = null, orm = null;
  if (c) {
    const g = c.getContext('2d'), gm = m.getContext('2d');
    g.fillStyle = CHARCOAL; g.fillRect(0, 0, A.W, A.H);
    /* the suit: the driver's livery in the crew's charcoal, seams and zip drawn in; v8.08 the belt, the cloth's twill and the pocket seams */
    { const st = suitTexture(T3, {base: CHARCOAL, seams: true, chest: .5, backDir: 1, back: .6})?.image;
      if (st) { const sc = makeCanvas(1024, 1024), sg = sc.getContext('2d'); sg.drawImage(st, 0, 0);
        twill(sg, 0, 0, 1024, 1024, .03);
        /* the elastic belt round the waist (u ≈ .29 of the torso's height: the figure maps u by height, crotch 0 → neck 1), with
           the orange buckle at the front */
        sg.fillStyle = '#1b1e22'; sg.fillRect(286, 0, 36, 1024); sg.fillStyle = 'rgba(255,255,255,.08)'; sg.fillRect(286, 0, 2, 1024); sg.fillRect(320, 0, 2, 1024);
        sg.fillStyle = ORANGE; sg.fillRect(282, 1024 * .75 - 26, 44, 52); sg.fillStyle = '#c84f10'; sg.fillRect(290, 1024 * .75 - 16, 28, 32);
        blit(g, sc, A.suit, A.gutter); } }
    blit(g, helmetTexture(T3, {seam: true})?.image, A.helmet, A.gutter);
    blit(g, helmetTexture(T3, {crown: '#eceeec', word: ORANGE, seam: true})?.image, A.helmetLead, A.gutter);
    /* the sleeve (elbow → wrist along canvas x): the driver's sleeve in charcoal, its cuff band, and a reflective hoop above the cuff */
    { const sl = limbTexture(T3, 'Coates', 0, {size: 24, x: 330, cuff: [.72, .80], base: CHARCOAL})?.image;
      if (sl) { const lc = makeCanvas(1024, 256), lg = lc.getContext('2d'); lg.drawImage(sl, 0, 0); twill(lg, 0, 0, 1024, 256, .03); tape(lg, 560, 0, 34, 256, true); blit(g, lc, A.sleeve, A.gutter); } }
    /* the leg (and the upper arm): charcoal, an orange stripe down each side (canvas y 64 and 192 are the limb's two sides), the
       Coates wordmark, and — v8.08 — two reflective hoops round the shin, where a Coates suit carries them */
    { const lc = makeCanvas(1024, 256), lg = lc.getContext('2d'); lg.fillStyle = CHARCOAL; lg.fillRect(0, 0, 1024, 256); twill(lg, 0, 0, 1024, 256, .03);
      lg.fillStyle = ORANGE; for (const y of [64, 192]) lg.fillRect(0, y - 15, 1024, 30); lg.fillStyle = '#f4f5f3'; for (const y of [64, 192]) { lg.fillRect(0, y - 17, 1024, 2); lg.fillRect(0, y + 15, 1024, 2); }
      lg.fillStyle = '#f4f5f3'; lg.font = `800 22px ${FONT}`; lg.textAlign = 'center'; lg.textBaseline = 'middle'; for (const y of [64, 192]) lg.fillText('Coates', 170, y);
      for (const x of [700, 790]) tape(lg, x, 0, 30, 256, true);
      blit(g, lc, A.leg, A.gutter); }
    blit(g, vestCanvas(), A.vest, A.gutter);
    blit(g, gloveCanvas(), A.glove, A.gutter);
    blit(g, bootCanvas(), A.boot, A.gutter);
    /* the labels: white on the suit's charcoal with an orange rule (the jobs), white on orange (the wordmark), dark on steel (the plate) */
    LABELS.forEach((text, i) => {
      const [x0, y0] = A.labels, x = x0 + (i % 2) * 512, y = y0 + Math.floor(i / 2) * 96;
      const brand = text === 'Coates', plate = i === 7;
      g.fillStyle = brand ? ORANGE : plate ? '#9aa4aa' : CHARCOAL; g.fillRect(x, y, 512, 96);
      g.fillStyle = brand ? '#ffffff' : plate ? '#101417' : '#f4f5f3'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = brand ? `900 76px Arial, Helvetica, sans-serif` : `800 50px Arial, Helvetica, sans-serif`;
      if ('letterSpacing' in g) g.letterSpacing = brand ? '-2px' : '4px';
      g.fillText(text, x + 256, y + (brand ? 50 : 44));
      if (!brand && !plate) { g.fillStyle = ORANGE; g.fillRect(x + 96, y + 78, 320, 6); }
      if ('letterSpacing' in g) g.letterSpacing = '0px';
    });
    const swatchAt = i => i < 16 ? [A.swatches[0] + i * 64, A.swatches[1]] : [A.swatches2[0] + (i - 16) * 64, A.swatches2[1]];
    SWATCH_RGB.forEach((col, i) => { const [sx, sy] = swatchAt(i); g.fillStyle = col; g.fillRect(sx, sy, 64, 128); });
    /* a little weave in the charcoal swatch and a grain in the timber, so a flat face is not plastic */
    { const [sx, sy] = A.swatches; g.fillStyle = 'rgba(255,255,255,.04)'; for (let yy = 0; yy < 128; yy += 4) g.fillRect(sx + 64, sy + yy, 64, 1);
      g.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = 3; yy < 128; yy += 9) g.fillRect(sx + 15 * 64, sy + yy, 64, 2); }
    /* roughness (green) and metalness (blue), a quarter the size */
    const R = (r, mt) => `rgb(255,${Math.round(r * 255)},${Math.round(mt * 255)})`, q = ([x, y, w, h]) => [x / 4, y / 4, w / 4, h / 4];
    gm.fillStyle = R(.9, 0); gm.fillRect(0, 0, m.width, m.height);
    for (const k of ['helmet', 'helmetLead']) { gm.fillStyle = R(.22, 0); gm.fillRect(...q(A[k])); }
    gm.fillStyle = R(.8, 0); gm.fillRect(...q(A.labels));
    gm.fillStyle = R(.66, 0); gm.fillRect(...q(A.vest)); gm.fillStyle = R(.7, 0); gm.fillRect(...q(A.glove)); gm.fillStyle = R(.5, 0); gm.fillRect(...q(A.boot));
    /* the tape is smoother and a little metallic, so it catches the light as reflective tape does */
    { const [x, y] = A.vest; gm.fillStyle = R(.32, .5); for (const xx of [1024 * .16, 1024 * .46]) gm.fillRect((x + xx) / 4, y / 4, 46 / 4, 512 / 4);
      for (const yc of [512 * .25, 512 * .75]) for (const dy of [-512 * .1, 512 * .1]) gm.fillRect((x + 1024 * .5) / 4, (y + yc + dy - 14) / 4, 1024 * .5 / 4, 7);
      const [lx, ly] = A.leg; for (const xx of [700, 790]) gm.fillRect((lx + xx) / 4, ly / 4, 30 / 4, 64); const [sx2, sy2] = A.sleeve; gm.fillRect((sx2 + 560) / 4, sy2 / 4, 34 / 4, 64); }
    SWATCH_RM.forEach(([r, mt], i) => { const [sx, sy] = swatchAt(i); gm.fillStyle = R(r, mt); gm.fillRect(sx / 4, sy / 4, 16, 32); });
    map = new T3.CanvasTexture(c); map.colorSpace = T3.SRGBColorSpace; map.anisotropy = 8;
    orm = new T3.CanvasTexture(m); orm.colorSpace = T3.NoColorSpace;
  }
  const material = new T3.MeshStandardMaterial({color: map ? 0xffffff : 0x2a2f35, map, roughnessMap: orm, metalnessMap: orm, roughness: orm ? 1 : .85, metalness: orm ? 1 : 0, envMapIntensity: .85});
  material.name = 'Crew atlas';
  /* where a region's u,v (0..1, v up, as its own canvas was drawn) lands in the atlas */
  const rect = ([x, y, w, h], gut = A.gutter) => (u, v) => [(x + gut + u * (w - 2 * gut)) / A.W, 1 - (y + gut + (1 - v) * (h - 2 * gut)) / A.H];
  const swatch = name => { const i = SWATCH[name]; if (i === undefined) throw new Error('no swatch ' + name); const [sx, sy] = i < 16 ? [A.swatches[0] + i * 64, A.swatches[1]] : [A.swatches2[0] + (i - 16) * 64, A.swatches2[1]]; return [(sx + 32) / A.W, 1 - (sy + 64) / A.H]; };
  const label = i => { const [x0, y0] = A.labels; return rect([x0 + (i % 2) * 512, y0 + Math.floor(i / 2) * 96, 512, 96], 3); };
  sharedAtlas = {map, orm, material, rect, swatch, label};
  return sharedAtlas;
}
