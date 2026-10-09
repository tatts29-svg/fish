#!/usr/bin/env node
// Author: Andrew Fisher
// Original GC500 shapes. Uses the supplied Creator's actual exporter, not a reimplementation.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const creatorPath = process.argv[2];
if (!creatorPath) throw new Error('Usage: node generate-assets.cjs /path/to/lottie-creator/app.js');
const source = fs.readFileSync(creatorPath, 'utf8');
function section(start, end) {
  const first = source.indexOf(start), last = source.indexOf(end, first);
  if (first < 0 || last < first) throw new Error('Creator source changed: exporter boundary missing');
  return source.slice(first, last);
}
const exportSource = section('  function lottieEasing(', '  function exportLottie()');
const colourSource = section('  function normalizeColor(', '  function selectedLayer()');
const palette = { orange: '#FF6A13', dark: '#1A1614', white: '#F3EFE9', green: '#39E07A' };
const duration = 1.2, fps = 30;
const author = 'Author: Andrew Fisher';
const round = (value, places = 2) => Number(Number(value).toFixed(places));

function shape(id, name, x, y, width, height, fill, options = {}) {
  return { id, name, type: 'rectangle', fill, x, y, width, height, scale: 100,
    rotation: 0, opacity: 100, roundness: 2, easing: 'linear', visible: true,
    locked: false, keyframes: [], ...options };
}
function frame(layer, time, values = {}) {
  return { time, x: layer.x, y: layer.y, scale: 100, rotation: layer.rotation,
    opacity: layer.opacity, easing: 'linear', ...values };
}
function settle(layers, start = 0, end = .3) {
  layers.forEach(layer => {
    layer.keyframes = [frame(layer, start, { y: layer.y + 4, opacity: 0 }),
      frame(layer, end), frame(layer, duration)];
  });
  return layers;
}
// Arrays below are painted back to front; Creator stores the front layer first.
function building() {
  return [
    shape('building-wall', 'Portable building walls', 58, 64, 78, 50, palette.white, { roundness: 3 }),
    shape('building-roof', 'Orange flat roof', 58, 38, 86, 8, palette.orange, { roundness: 2 }),
    shape('building-door', 'Entry door', 79, 72, 15, 34, palette.dark, { roundness: 1 }),
    shape('building-door-window', 'Door glass', 79, 64, 9, 9, palette.white, { roundness: 1 }),
    shape('building-window-left', 'Left window', 35, 58, 14, 15, palette.dark, { roundness: 1 }),
    shape('building-window-right', 'Right window', 55, 58, 14, 15, palette.dark, { roundness: 1 }),
    shape('building-base', 'Portable building base', 58, 90, 84, 5, palette.white, { roundness: 1 }),
    shape('building-support-left', 'Left support', 30, 95, 10, 6, palette.orange, { roundness: 1 }),
    shape('building-support-right', 'Right support', 83, 95, 10, 6, palette.orange, { roundness: 1 })
  ];
}
function segment(id, name, ax, ay, bx, by, width, fill) {
  return shape(id, name, (ax + bx) / 2, (ay + by) / 2,
    round(Math.hypot(bx - ax, by - ay), 5), width, fill,
    { rotation: round(Math.atan2(by - ay, bx - ax) * 180 / Math.PI, 5), roundness: width / 2 });
}
function completionBadge() {
  const cx = 98, cy = 94;
  const backing = shape('badge-separation', 'Badge separation', cx, cy, 40, 40,
    palette.dark, { type: 'ellipse', roundness: 0 });
  const disc = shape('badge-green', 'Acknowledged completion badge', cx, cy, 34, 34,
    palette.green, { type: 'ellipse', roundness: 0 });
  const short = segment('tick-short', 'Tick first stroke', 89, 94, 96, 101, 4.5, palette.dark);
  const long = segment('tick-long', 'Tick second stroke', 96, 101, 108, 88, 4.5, palette.dark);
  [backing, disc].forEach(layer => {
    layer.keyframes = [frame(layer, 0, { scale: 90, opacity: 0 }),
      frame(layer, .3, { scale: 90, opacity: 0 }), frame(layer, .5), frame(layer, duration)];
  });
  [short, long].forEach((layer, index) => {
    const begin = .46 + index * .12;
    layer.keyframes = [frame(layer, 0, { opacity: 0 }), frame(layer, begin, { opacity: 0 }),
      frame(layer, begin + .16), frame(layer, duration)];
  });
  return [backing, disc, short, long];
}
function camera() {
  return [
    shape('camera-top', 'Camera viewfinder', 59, 36, 34, 13, palette.orange, { roundness: 3 }),
    shape('camera-body', 'Camera body', 58, 65, 84, 54, palette.white, { roundness: 6 }),
    shape('camera-top-stripe', 'Orange camera shoulder', 58, 42, 74, 6, palette.orange, { roundness: 1 }),
    shape('camera-lens-rim', 'Lens rim', 58, 65, 35, 35, palette.dark, { type: 'ellipse', roundness: 0 }),
    shape('camera-lens', 'Lens glass', 58, 65, 23, 23, palette.white, { type: 'ellipse', roundness: 0 }),
    shape('camera-lens-core', 'Lens centre', 58, 65, 13, 13, palette.dark, { type: 'ellipse', roundness: 0 }),
    shape('camera-indicator', 'Camera indicator', 85, 52, 6, 6, palette.orange, { type: 'ellipse', roundness: 0 })
  ];
}
const selection = shape('selection-rule', 'Selected equipment underline', 58, 105, 76, 4,
  palette.orange, { roundness: 2 });
selection.keyframes = [frame(selection, 0, { scale: 86, opacity: 0 }),
  frame(selection, .15, { scale: 86, opacity: 0 }), frame(selection, .5), frame(selection, duration)];
const definitions = [
  { slug: 'equipment-selected', title: 'Equipment selected', layers: [...settle(building()), selection],
    meaning: 'Selection only. Does not mean delivered, installed or complete.' },
  { slug: 'equipment-complete', title: 'Equipment complete', layers: [...building(), ...completionBadge()],
    meaning: 'Show only after the relevant completion update is acknowledged by the service.' },
  { slug: 'photo-saved', title: 'Photo saved', layers: [...camera(), ...completionBadge()],
    meaning: 'Show only after this individual photo is acknowledged by the service; never for the local outbox.' }
];

const escapeXML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
function stillSVG(project) {
  const shapes = [...project.layers].reverse().map(layer => {
    const final = layer.keyframes.at(-1) || layer;
    const geometry = layer.type === 'ellipse'
      ? `<ellipse cx="0" cy="0" rx="${layer.width / 2}" ry="${layer.height / 2}"/>`
      : `<rect x="${-layer.width / 2}" y="${-layer.height / 2}" width="${layer.width}" height="${layer.height}" rx="${Math.min(layer.roundness, layer.width / 2, layer.height / 2)}"/>`;
    return `  <g fill="${layer.fill}" opacity="${final.opacity / 100}" transform="translate(${final.x} ${final.y}) rotate(${final.rotation}) scale(${final.scale / 100})">${geometry}</g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" role="img" aria-labelledby="title description">\n<title id="title">${escapeXML(project.name.split(' · ')[0])}</title>\n<desc id="description">${author}. Static final state for reduced motion.</desc>\n${shapes}\n</svg>\n`;
}
function saveJSON(filename, data, compact = false) {
  fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, compact ? 0 : 2) + '\n');
}
const outputs = [];
for (const definition of definitions) {
  const project = { version: 1, revision: 1, name: `GC500 ${definition.title} · ${author}`,
    author, width: 128, height: 128, fps, duration, background: palette.dark,
    selectedId: definition.layers.at(-1).id, layers: [...definition.layers].reverse() };
  const context = { state: { project }, round };
  const exported = vm.runInNewContext(colourSource + exportSource + '\nexportLottieObject();', context, { timeout: 1000 });
  const backgrounds = exported.layers.filter(layer => layer.nm === 'Canvas background');
  if (backgrounds.length !== 1 || exported.layers.at(-1) !== backgrounds[0]) {
    throw new Error('Expected exactly one final Canvas background; refusing transparency processing');
  }
  const transparent = JSON.parse(JSON.stringify(exported));
  transparent.layers = transparent.layers.filter(layer => layer.nm !== 'Canvas background');
  // This is the only difference between the raw Creator export and the deliverable export.
  saveJSON(`${definition.slug}.project.json`, project);
  saveJSON(`${definition.slug}.creator-export.json`, exported);
  saveJSON(`${definition.slug}.json`, transparent, true);
  fs.writeFileSync(path.join(__dirname, `${definition.slug}.svg`), stillSVG(project));
  outputs.push({ name: definition.slug, layers: project.layers.length, meaning: definition.meaning,
    nativeProject: `${definition.slug}.project.json`, rawCreatorExport: `${definition.slug}.creator-export.json`,
    lottie: `${definition.slug}.json`, reducedMotionStill: `${definition.slug}.svg` });
}
saveJSON('manifest.json', { author, status: 'PREVIEW ONLY', fps, duration, frames: 36,
  width: 128, height: 128, recommendedDisplayPixels: 44, loop: false, finalHoldBeginsAtSeconds: .74,
  palette, creatorSourceSHA256: crypto.createHash('sha256').update(source).digest('hex'),
  transparencyPostprocess: 'Remove exactly the final layer named Canvas background; all other export fields unchanged.',
  files: outputs });
console.log(`Wrote ${outputs.length} editable projects, original exports, transparent Lottie files and static SVGs.`);
