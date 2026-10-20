// Author: Andrew Fisher. Legacy map links may canonicalise; other route mismatches must still fail.
const test = require('node:test');
const assert = require('node:assert/strict');
const {deepLinkHashMatches} = require('../harness/release_sweep.cjs');

test('the legacy 3D map link accepts its established explorer destination', () => {
  assert.equal(deepLinkHashMatches('#sheet/__satellite3d', '#sheet/__satellite3d'), true);
  assert.equal(deepLinkHashMatches('#sheet/__satellite3d', '#sheet/__explorer'), true);
  for (const wrong of ['#map', '#today', '#plant', '#sheet/other']) {
    assert.equal(deepLinkHashMatches('#sheet/__satellite3d', wrong), false);
  }
});

test('other deep links still require the exact requested route', () => {
  for (const route of ['#today', '#plant', '#timeline', '#day/2026-09-28', '#change/2026-09-28', '#print/drivers/2026-09-28']) {
    assert.equal(deepLinkHashMatches(route, route), true);
    assert.equal(deepLinkHashMatches(route, '#sheet/__explorer'), false);
  }
  assert.equal(deepLinkHashMatches('#day/2026-09-28', '#day/2026-09-29'), false);
});
