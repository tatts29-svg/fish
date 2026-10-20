// Author: Andrew Fisher. Exercise the runner's actual synchronous projection inside the native asset hold.
'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), G = require('./document_guards.cjs');
const source = fs.readFileSync(require.resolve('./record_document.cjs'), 'utf8');
const marker = 'const displayed = await page.evaluate(';
const start = source.indexOf(marker), end = source.indexOf(', expectedId);', start);
assert(start >= 0 && end > start, 'Exact projection source must exist');
const callback = source.slice(start + marker.length, end);
const fixture = {id: 'synthetic.pdf', kind: 'map', ref: null, title: 'Synthetic plan',
  note: 'Planning only.', category: 'Maps and drawings', availability: 'ready'};
let held = false, holds = 0, collections = 0, maps = 0, entries = [fixture];
const project = new Function('holdAssets', 'docCollection', 'mapChoices', 'return (' + callback + ');')(
  fn => { assert.equal(held, false); held = true; holds++; try { return fn(); } finally { held = false; } },
  () => { assert(held, 'Collection classification must use the held asset list'); collections++; return {items: entries}; },
  ref => { assert(held, 'Map choices must use the same held asset list'); assert.equal(ref, ''); maps++; return [{id: fixture.id, kind: 'file'}]; }
);
const checks = [];
const before = JSON.stringify(fixture);
assert.deepEqual(project(fixture.id), {...fixture, mapChoices: 1});
checks.push('Exact normal document projection retained');
assert.equal(holds, 1); assert.equal(collections, 1); assert.equal(maps, 1); assert.equal(held, false);
checks.push('Both reads share one synchronous asset hold');
assert.equal(JSON.stringify(fixture), before);
checks.push('Projection does not alter native-style input');
entries = [];
assert.throws(() => project(fixture.id), /exactly once/); assert.equal(held, false);
checks.push('Missing document still fails and releases hold');
entries = [fixture, fixture];
assert.throws(() => project(fixture.id), /exactly once/); assert.equal(held, false);
checks.push('Duplicate document still fails and releases hold');
console.log(JSON.stringify({author: 'Andrew Fisher', pass: true, checks,
  runnerSha256: G.hash(source), networkCalls: 0, serverWrites: 0}, null, 2));
