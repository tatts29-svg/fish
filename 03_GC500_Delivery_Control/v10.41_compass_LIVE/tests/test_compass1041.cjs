/* Author: Andrew Fisher. Read-only regression for the 3D compass containment.
 * Uses exact styles, compass markup and updateCompass() from two machine copies.
 * Does not load Cesium, map tiles, live records, or any external scripts.
 * Run under the shared browser lock:
 * flock /tmp/gc500-browser.lock env CHROMIUM_PATH=/usr/bin/chromium \
 *   node test_compass1041.cjs --before /tmp/machine-before --after /tmp/machine-after \
 *   --out /tmp/compass1041-regression
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
let chromium;
try { ({chromium} = require('playwright')); }
catch (_) {
  ({chromium} = require(process.env.GC500_PLAYWRIGHT ||
    '/workspace/fish/03_GC500_Delivery_Control/toolchain/node_modules/playwright'));
}
const args = process.argv.slice(2);
function option(name, fallback) {
  const at = args.indexOf(name);
  if (at < 0) return fallback;
  assert(args[at + 1] && !args[at + 1].startsWith('--'), `Missing ${name} value`);
  return path.resolve(args[at + 1]);
}
const beforeRoot = option('--before');
const afterRoot = option('--after');
const out = option('--out', '/tmp/compass1041-regression');
assert(beforeRoot && afterRoot, 'Pass --before and --after machine directories');
assert(out === '/tmp' || out.startsWith('/tmp/'), 'Evidence must be written under /tmp');
fs.mkdirSync(out, {recursive: true});
const sha = text => crypto.createHash('sha256').update(text).digest('hex');
function fixture(root) {
  const index = fs.readFileSync(path.join(root, 'poc3d/index.html'), 'utf8');
  const viewer = fs.readFileSync(path.join(root, 'poc3d/equipment_viewer1027.js'), 'utf8');
  const baseCSS = index.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  const equipmentCSS = viewer.match(/css\.textContent = `([\s\S]*?)`;/)?.[1];
  const compass = index.match(/<div class="rose3d">[^\n]*<\/div>/)?.[0];
  const update = index.match(/function updateCompass\(\) \{[\s\S]*?\n\}/)?.[0];
  assert(baseCSS && equipmentCSS && compass && update, `Missing source fixture parts in ${root}`);
  assert(!compass.includes('<script'), 'Compass fixture unexpectedly contains script');
  return {
    source: {index: sha(index), viewer: sha(viewer)}, update,
    html: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseCSS}\n${equipmentCSS}</style></head><body class="equipment1027">${compass}</body></html>`
  };
}
const before = fixture(beforeRoot), after = fixture(afterRoot);
assert.equal(after.update, before.update, 'The candidate changes compass behaviour, outside this CSS-only test');
const report = {
  author: 'Andrew Fisher', sourceBefore: before.source, sourceAfter: after.source,
  scope: 'Exact extracted compass CSS/markup/updateCompass; no WebGL or service requests',
  cases: [], requests: [], errors: [], status: 'RUNNING'
};
const widths = [1106, 1440, 390, 360];
const headings = [...new Set([
  ...Array.from({length: 24}, (_, n) => n * 15),
  ...Array.from({length: 8}, (_, n) => [22.4 + n * 45, 22.6 + n * 45]).flat()
])].sort((a, b) => a - b);
let browser;
(async () => {
  try {
    browser = await chromium.launch({headless: true,
      executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
      args: ['--no-sandbox', '--disable-dev-shm-usage']});
    const context = await browser.newContext({viewport: {width: 1106, height: 900}, reducedMotion: 'reduce'});
    await context.route('**/*', route => {
      report.requests.push(route.request().url());
      return route.abort();
    });
    const pages = [await context.newPage(), await context.newPage()];
    for (const [i, page] of pages.entries()) {
      page.on('pageerror', error => report.errors.push(String(error)));
      await page.setContent([before, after][i].html);
      await page.addScriptTag({content: `
        const POINTS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
        const viewer = {camera: {heading: 0}};
        const Cesium = {Math: {toDegrees: angle => angle}};
        const $ = id => document.getElementById(id);
        let lastCompass = NaN;
        ${before.update}
        window.testClicks = [];
        document.querySelectorAll('[data-face]').forEach(button =>
          button.addEventListener('click', () => window.testClicks.push(button.dataset.face)));
        window.testHeading = heading => { viewer.camera.heading = heading; lastCompass = NaN; updateCompass(); };
      `});
    }
    async function measure(page, width, selected, heading) {
      return page.evaluate(({width, selected, heading}) => {
        document.body.className = 'equipment1027' + (selected ? ' equipment1027-selected' : '');
        // The actual header's measured height only moves the compass vertically.
        document.documentElement.style.setProperty('--hh', width <= 900 ? '84px' : '50px');
        window.testHeading(heading);
        const rect = element => {
          const r = element.getBoundingClientRect();
          return {x:r.x, y:r.y, width:r.width, height:r.height, right:r.right, bottom:r.bottom};
        };
        const buttons = [...document.querySelectorAll('[data-face]')].map(button => {
          const r = rect(button), x = r.x + r.width / 2, y = r.y + r.height / 2;
          const hit = document.elementFromPoint(x, y);
          const range = document.createRange(); range.selectNodeContents(button.firstElementChild);
          const glyph = range.getBoundingClientRect();
          return {
            face: button.dataset.face, text: button.textContent, rect: r, x, y,
            hit: hit && (hit === button || button.contains(hit)),
            visible: getComputedStyle(button).visibility === 'visible' && getComputedStyle(button).display !== 'none',
            glyph: {x:glyph.x, y:glyph.y, right:glyph.right, bottom:glyph.bottom}
          };
        });
        return {
          viewport: innerWidth, bodyWidth: document.body.scrollWidth,
          documentWidth: document.documentElement.scrollWidth,
          overflow: Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - innerWidth,
          containment: getComputedStyle(document.querySelector('.dialwrap')).overflow,
          rose: rect(document.querySelector('.rose3d')), dial: rect(document.querySelector('.dialwrap')),
          label: rect(document.querySelector('.facing')), orbit: rect(document.querySelector('#orbitBtn')),
          labelText: document.querySelector('.facing').textContent, buttons
        };
      }, {width, selected, heading});
    }
    for (const width of widths) {
      await Promise.all(pages.map(page => page.setViewportSize({width, height: width <= 900 ? 844 : 900})));
      for (const selected of [false, true]) {
        for (const heading of headings) {
          const [old, current] = await Promise.all(pages.map(page => measure(page, width, selected, heading)));
          const name = `${width}px/${selected ? 'selected' : 'unselected'}/${heading}deg`;
          assert.equal(current.overflow, 0, `${name}: viewport overflow ${current.overflow}px`);
          assert.equal(current.containment, 'hidden', `${name}: missing local compass containment`);
          for (const item of ['rose', 'dial', 'label', 'orbit']) {
            for (const key of ['x', 'y', 'width', 'height'])
              assert(Math.abs(current[item][key] - old[item][key]) < 0.02, `${name}: ${item}.${key} moved`);
          }
          assert.equal(current.labelText, old.labelText, `${name}: facing label changed`);
          assert.deepEqual(current.buttons.map(b => b.text), ['N', 'E', 'S', 'W']);
          for (const button of current.buttons) {
            assert(button.visible && button.hit, `${name}: ${button.text} not visible/hit-testable`);
            const glyph = button.glyph, dial = current.dial;
            assert(glyph.x >= dial.x && glyph.y >= dial.y && glyph.right <= dial.right && glyph.bottom <= dial.bottom,
              `${name}: ${button.text} glyph outside compass bounds`);
          }
          // Real pointer dispatch complements hit testing at all eight octants.
          if (heading % 45 === 0) {
            await pages[1].evaluate(() => { window.testClicks = []; });
            for (const button of current.buttons) await pages[1].mouse.click(button.x, button.y);
            assert.deepEqual(await pages[1].evaluate(() => window.testClicks), ['0','90','180','270'],
              `${name}: a compass direction lost its pointer event`);
          }
          report.cases.push({width, selected, heading, oldOverflow: old.overflow,
            newOverflow: current.overflow, containment: current.containment,
            layoutUnchanged: true, cardinalButtonsHit: 4, label: current.labelText});
        }
      }
      await pages[1].evaluate(() => window.testHeading(45));
      await pages[1].screenshot({path: path.join(out, `compass-${width}px.png`)});
    }
    report.reproduced = report.cases.filter(c => c.oldOverflow > 0);
    assert(report.reproduced.length, 'The unpatched source did not reproduce the reported viewport overflow');
    assert.equal(report.requests.length, 0, 'Isolated compass regression attempted a network request');
    assert.deepEqual(report.errors, [], 'Browser errors occurred');
    report.status = 'PASS';
    console.log(`PASS ${report.cases.length} compass cases; ${report.reproduced.length} reproduce original overflow; all patched cases fit and N/E/S/W work.`);
    console.log(`Maximum original overflow: ${Math.max(...report.cases.map(c => c.oldOverflow))}px. Evidence: ${out}`);
  } catch (error) {
    report.status = 'FAIL'; report.failure = String(error.stack || error); throw error;
  } finally {
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
  }
})().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
