/* Author: Andrew Fisher. Synchronous scope boundaries preserve freshness and cleanup. */
'use strict';
const assert = require('node:assert/strict');
const {scoped, install, entries} = require('./financial_scopes1011');
let held = false, stale = false, state = 1, builds = 0, snapshots = 0;
const memo = new Map();
function fresh() { if (held && stale) { memo.clear(); snapshots = state; builds++; stale = false; } }
function hold(read) {
 if (held) { fresh(); return read(); }
 held = true; snapshots = state; builds++; memo.clear();
 try { return read(); } finally { held = false; memo.clear(); stale = false; }
}
function index() { fresh(); if (!held) return {value: state}; if (!memo.has('index')) memo.set('index', {value: snapshots}); return memo.get('index'); }
let checks = 0;
function eq(actual, expected) { assert.deepEqual(actual, expected); checks++; }
const inner = scoped(() => index(), hold), outer = scoped(() => [inner(), inner()], hold);
const a = outer(); eq(a[0], {value: 1}); eq(a[0] === a[1], true); eq(builds, 1); eq(held, false); eq(memo.size, 0);
state = 2; const b = outer(); eq(b[0], {value: 2}); eq(a[0] === b[0], false); eq(builds, 2); eq(memo.size, 0);
const changed = scoped(() => { const before = inner(); state = 3; stale = true; return [before, inner()]; }, hold)();
eq(changed, [{value: 2}, {value: 3}]); eq(stale, false); eq(held, false);
const receiver = {value: 4}; eq(scoped(function (n) { return this.value + n; }, hold).call(receiver, 5), 9);
const error = new Error('expected'); assert.throws(scoped(() => { inner(); throw error; }, hold), e => e === error); checks++;
eq(held, false); eq(memo.size, 0); eq(stale, false); state = 7; eq(inner(), {value: 7});
const target = Object.fromEntries(entries.map(name => [name, function (a) { return [name, this === target, a, held]; }]));
install(target, hold); for (const name of entries) eq(target[name](42), [name, true, 42, true]);
const incomplete = {...target}; delete incomplete.rh766Model; const original = incomplete.fh866Model;
assert.throws(() => install(incomplete, hold), /entry missing/); checks++; eq(incomplete.fh866Model, original);
assert.throws(() => install(target, null), /require holdAssets/); checks++;
console.log(JSON.stringify({checks, pass: true, scope: 'Nested reuse; independent freshness; save invalidation; receiver/arguments; throw cleanup; complete entry installation'}));
