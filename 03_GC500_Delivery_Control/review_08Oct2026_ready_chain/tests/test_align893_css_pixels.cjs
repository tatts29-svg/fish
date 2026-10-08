// Author: Andrew Fisher. Keep upstream alignment checks; measure the native
// marker-rounding assertion in CSS pixels instead of viewport-dependent fractions.
// PAGE/CODE/ASSETS/MEDIA/POC3D/OUT as upstream; --self-test uses no browser/network.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), vm = require('node:vm');
const upstream = path.resolve(__dirname, '../../v8.93_maps_aligned_DRAFT/tests/test_align893.cjs');

function cssMarkerMatches(css, point) {
  if (!css || !Array.isArray(point) || point.length !== 2 ||
      ![css.x, css.y, css.width, css.height, ...point].every(Number.isFinite) ||
      css.width <= 0 || css.height <= 0) return false;
  // Native place() writes X.toFixed(1), Y.toFixed(1): at most 0.05 px per axis.
  // The extra 0.001 px is numerical headroom, not a map-alignment allowance.
  return Math.abs(css.x - point[0] * css.width) <= 0.051 &&
    Math.abs(css.y - point[1] * css.height) <= 0.051;
}

function selfTest() {
  for (const width of [332, 1382, 1440, 2560]) {
    for (const point of [[0, 0], [0.90659, 0.74246], [0.50738, 0.19513], [0.89824, 0.15036], [1, 1]]) {
      const height = width * 1837 / 2600;
      const css = {width, height, x: Number((point[0] * width).toFixed(1)), y: Number((point[1] * height).toFixed(1))};
      assert.ok(cssMarkerMatches(css, point), 'Native 0.1 px rounding must pass at each width');
      assert.equal(cssMarkerMatches({...css, x: css.x + 1}, point), false, 'A 1 CSS px horizontal displacement must fail');
      assert.equal(cssMarkerMatches({...css, y: css.y - 1}, point), false, 'A 1 CSS px vertical displacement must fail');
    }
  }
  const css = {width: 332, height: 332 * 1837 / 2600, x: 0, y: 0};
  for (const field of ['width', 'height', 'x', 'y']) {
    assert.equal(cssMarkerMatches({...css, [field]: NaN}, [0, 0]), false, 'Nonfinite coordinates/extents must fail');
  }
  for (const field of ['width', 'height']) {
    assert.equal(cssMarkerMatches({...css, [field]: 0}, [0, 0]), false, 'Zero extent must fail');
  }
  assert.equal(cssMarkerMatches(css, [NaN, 0]), false);
  assert.equal(cssMarkerMatches(null, [0, 0]), false);
}

function adapt(source) {
  const once = (old, replacement) => {
    const count = source.split(old).length - 1;
    if (count !== 1) throw new Error('Alignment fixture source anchor changed (' + count + ' matches); review wrapper against upstream');
    source = source.replace(old, replacement);
  };
  once('\n(async () => {', '\n' + cssMarkerMatches.toString() + '\n(async () => {');
  once('const readMarkers = () => p.evaluate(() => { const out = {}; const RATIO = 1837 / 2600, TR =',
    'const readMarkers = () => p.evaluate(() => { const out = {}; const extent = MAPCTL.size(); const RATIO = 1837 / 2600, TR =');
  once('out[lab].push({fx, fy, how, shown:',
    'out[lab].push({fx, fy, how, css: par && par.width > 0 ? {x: fx * par.width, y: fy * par.width * RATIO, width: extent.w, height: extent.w * extent.ratio} : null, shown:');
  once('tag: isTag, read: m.how, matches_data: Math.abs(m.fx - info.pt[0]) < 1e-4 && Math.abs(m.fy - info.pt[1]) < 1e-4, drawn:',
    'tag: isTag, read: m.how, css: m.css, css_error: m.css ? [m.css.x - info.pt[0] * m.css.width, m.css.y - info.pt[1] * m.css.height] : null, matches_data: cssMarkerMatches(m.css, info.pt), drawn:');
  once('within 0.3 px of the 2600 px picture (${checkList.length} references read from the page\'s own layout)',
    'within 0.051 CSS px per axis (${checkList.length} references read from the page\'s own layout)');
  return source;
}

function run() {
  selfTest();
  const code = adapt(fs.readFileSync(upstream, 'utf8'));
  new vm.Script(code, {filename: upstream});
  if (process.argv.includes('--self-test')) {
    console.log('PASS CSS marker rounding at phone/desktop widths; 1 px displacement and invalid extents rejected; upstream anchors exact');
    return;
  }
  const child = new Module(upstream, module);
  child.filename = upstream;
  child.paths = Module._nodeModulePaths(path.dirname(upstream));
  child._compile(code, upstream);
}

module.exports = {adapt, cssMarkerMatches, selfTest};
if (require.main === module) run();
