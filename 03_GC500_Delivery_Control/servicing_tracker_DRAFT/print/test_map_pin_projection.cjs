/* Author: Andrew Fisher. Regression for current GPS pins replacing old plan tags. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Execute the renderer's actual projection block with synthetic registration and data.
// No browser, network, event records or private pins are needed for this regression.
const source = fs.readFileSync(path.join(__dirname, 'render_maps.cjs'), 'utf8');
const start = source.indexOf('    const [[a, b, c], [d, e, f]] = geo.M');
const end = source.indexOf('    if (moved.length)', start);
assert.ok(start >= 0 && end > start, 'renderer projection block must remain identifiable');
const scale = 256 * 2 ** 19;
const origin = scale / 2;
const pin = (x, y) => [Math.atan(Math.sinh(Math.PI * (1 - 2 * (origin + y) / scale))) * 180 / Math.PI, x / scale * 360];
const original = (ref, x = 400, y = 400) => ({ref, x, y, hw: 3, hh: 2});
const P = {
  WEST: original('WEST'), EAST: original('EAST'),
  NORTH: original('NORTH'), SOUTH: original('SOUTH'),
  NEAR: original('NEAR'), FAR: original('FAR'), NO_PIN: original('NO_PIN')
};
const near = P.NEAR, noPin = P.NO_PIN;
const refs = [
  {ref:'WEST', pin:pin(-10, 500)}, {ref:'EAST', pin:pin(1010, 500)},
  {ref:'NORTH', pin:pin(500, -10)}, {ref:'SOUTH', pin:pin(500, 1010)},
  {ref:'NEAR', pin:pin(410, 400)}, {ref:'FAR', pin:pin(600, 650)},
  {ref:'NEW', pin:pin(700, 750)}, {ref:'NO_PIN'}
];
vm.runInNewContext(source.slice(start, end), {
  geo:{M:[[1, 0, origin], [0, 1, origin]], sheet:[1000, 1000]},
  data:{areas:[{refs}]}, P, mPerUnit:1
});
for (const ref of ['WEST', 'EAST', 'NORTH', 'SOUTH']) {
  assert.equal(P[ref], null, `${ref}: off-plan pin must clear the stale map position`);
}
assert.equal(P.NEAR, near, 'an in-plan pin within the existing 20 m tolerance retains its plan position');
assert.equal(P.NO_PIN, noPin, 'references without GPS pins retain their plan position');
for (const [ref, x, y] of [['FAR', 600, 650], ['NEW', 700, 750]]) {
  assert.ok(Math.abs(P[ref].x - x) < 1e-5 && Math.abs(P[ref].y - y) < 1e-5, `${ref}: current in-plan pin is projected accurately`);
  assert.equal(P[ref].hw, 1.2);
  assert.equal(P[ref].hh, .8);
}
console.log('Map pin projection regression passed: off-plan clearing and unchanged in-plan behavior.');
