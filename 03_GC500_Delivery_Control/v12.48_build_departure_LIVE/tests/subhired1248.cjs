/* Author: Andrew Fisher. Synthetic departure evidence; no browser or operational data. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {create} = require('../subhired1248_src.js');
let passed = 0;
function check(name, run) { run(); passed++; process.stdout.write('PASS ' + name + '\n'); }
const first = {departedAt1211: '2026-01-05T00:15:00Z', date: '2026-01-05', at: '2026-01-07T00:00:00Z', by: 'Recorded person', items: [{type: 'Example unit', n: 1}]};
const last = {departedAt1211: '2026-01-06T00:30:00Z', date: '2026-01-06', items: [{type: 'Example unit', n: 2}]};
let reading = {collected: 3, remaining: 2, complete: false, unknown: false, issues: [], label: '3 left · 2 to leave', taken1229: [{type: 'Example unit', n: 3}], items: [{type: 'Example unit', n: 2}], events: [first, last]};
let event = first, calls = [], stampOptions;
const native = {status: key => { calls.push(['status', key]); return reading; }, unit: (...args) => { calls.push(['unit', ...args]); return event; }, stamp: e => 'native stamp ' + e.date};
const api = create({departures: () => native, stamp: () => ({html: options => { stampOptions = options; return '<span class="stamp1232">native stamp</span>'; }})});

check('numbered unit delegates exact identity and item', () => {
  const model = api.unit('EXAMPLE', 'opaque-unit', 'Example unit', true);
  assert.equal(model.event, first); assert.equal(model.kind, 'left');
  assert.deepEqual(calls.at(-1), ['unit', 'EXAMPLE', 'opaque-unit', undefined, 'Example unit']);
});
check('stamp uses physical departure time, never recording time', () => {
  assert.match(api.unitHtml('EXAMPLE', 'opaque-unit', 'Example unit', true), /Left site/);
  assert.equal(stampOptions.at, first.departedAt1211); assert.notEqual(stampOptions.at, first.at);
});
check('existing stamp formatter is retained', () => assert.match(api.unitHtml('EXAMPLE', 'opaque-unit', 'Example unit', true), /class="stamp1232"/));
check('planned identity is never marked left', () => { calls = []; assert.equal(api.unit('EXAMPLE', 'planned', 'Example unit', false), null); assert.deepEqual(calls, []); });
check('missing physical identity is not guessed', () => assert.equal(api.unit('EXAMPLE', '', 'Example unit', true), null));
check('missing item is not guessed', () => assert.equal(api.unit('EXAMPLE', 'unit', '', true), null));
check('unmatched unit shows qualified reference status', () => { event = null; const m = api.unit('EXAMPLE', 'unit', 'Example unit', true); assert.equal(m.kind, 'reference'); assert.equal(m.label, 'Reference: 3 left · 2 to leave'); assert.doesNotMatch(api.html(m), /stamp1232/); });
check('record issues suppress a departed unit stamp', () => { reading.issues = ['duplicate evidence']; event = first; assert.equal(api.unit('EXAMPLE', 'unit', 'Example unit', true).kind, 'review'); reading.issues = []; });
check('no departure leaves original unit presentation alone', () => { const old = reading; reading = {...old, collected: 0}; event = null; assert.equal(api.unit('EXAMPLE', 'unit', 'Example unit', true), null); reading = old; });
check('partial quantity uses typed native counts', () => { const m = api.quantity('EXAMPLE', ' Example UNIT '); assert.equal(m.kind, 'partial'); assert.equal(m.label, '3 of 5 left · 2 to leave'); assert.equal(m.event, last); });
check('partial group has last physical departure but no full stamp', () => { const h = api.quantityHtml('EXAMPLE', 'Example unit'); assert.match(h, /Last departure · native stamp 2026-01-06/); assert.doesNotMatch(h, /stamp1232/); });
check('full quantity group uses last event for that type', () => { const old = reading; reading = {...old, items: [{type: 'Example unit', n: 0}], events: [first, last, {date: '2026-01-08', items: [{type: 'Different item', n: 1}]}]}; const m = api.quantity('EXAMPLE', 'Example unit'); assert.equal(m.kind, 'left'); assert.equal(m.event, last); assert.equal(m.label, 'Left site · 3 of 3'); reading = old; });
check('different item departures do not mark the target left', () => assert.equal(api.quantity('EXAMPLE', 'Other item'), null));
check('duplicate collected groups require review', () => { const old = reading; reading = {...old, taken1229: [...old.taken1229, ...old.taken1229]}; assert.equal(api.quantity('EXAMPLE', 'Example unit').kind, 'review'); reading = old; });
check('missing remaining quantity requires review', () => { const old = reading; reading = {...old, items: []}; assert.equal(api.quantity('EXAMPLE', 'Example unit').kind, 'review'); reading = old; });
check('fractional physical quantity requires review', () => { const old = reading; reading = {...old, items: [{type: 'Example unit', n: 1.5}]}; assert.equal(api.quantity('EXAMPLE', 'Example unit').kind, 'review'); reading = old; });
check('negative quantity requires review', () => { const old = reading; reading = {...old, items: [{type: 'Example unit', n: -1}]}; assert.equal(api.quantity('EXAMPLE', 'Example unit').kind, 'review'); reading = old; });
check('unknown remaining quantity cannot claim full departure', () => { const old = reading; reading = {...old, unknown: true, items: [{type: 'Example unit', n: 0}]}; const m = api.quantity('EXAMPLE', 'Example unit'); assert.equal(m.kind, 'reference'); assert.match(m.label, /quantity to confirm/); reading = old; });
check('quantities without source events require review', () => { const old = reading; reading = {...old, events: []}; assert.equal(api.quantity('EXAMPLE', 'Example unit').kind, 'review'); reading = old; });
check('date-only departure preserves missing-time semantics', () => { event = {date: '2026-01-06', items: first.items}; api.unitHtml('EXAMPLE', 'unit', 'Example unit', true); assert.equal(stampOptions.at, null); assert.equal(stampOptions.date, '2026-01-06'); });
check('untrusted label text is escaped', () => { const h = api.html({kind: 'reference', label: '<img onerror="bad()">'}); assert.match(h, /&lt;img/); assert.doesNotMatch(h, /<img/); });
check('unavailable native model leaves existing card intact', () => { const absent = create({departures: () => null, stamp: () => null}); assert.equal(absent.unitHtml('EXAMPLE', 'unit', 'Example unit', true), ''); assert.equal(absent.quantityHtml('EXAMPLE', 'Example unit'), ''); });
check('native read failure does not change existing card', () => { const absent = create({departures: () => ({status() { throw Error('unavailable'); }}), stamp: () => null}); assert.equal(absent.quantityHtml('EXAMPLE', 'Example unit'), ''); });
check('rendering leaves input evidence unchanged', () => { const before = JSON.stringify(reading); api.quantityHtml('EXAMPLE', 'Example unit'); assert.equal(JSON.stringify(reading), before); });
check('module exposes no write or mutation entrypoint', () => assert.deepEqual(Object.keys(api), ['unit', 'quantity', 'html', 'unitHtml', 'quantityHtml']));

if (process.env.BASE) {
  const base = fs.readFileSync(process.env.BASE, 'utf8');
  const anchors = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'subhired1248_anchors.json'), 'utf8')).replacements;
  let modified = base;
  check('both renderer anchors match exact predecessor once', () => { for (const a of anchors) { assert.equal(modified.split(a.old).length - 1, 1); modified = modified.replace(a.old, a.new); } });
  check('renderer changes reverse to exact predecessor', () => { let reversed = modified; for (const a of [...anchors].reverse()) reversed = reversed.replace(a.new, a.old); assert.equal(reversed, base); });
}
process.stdout.write(JSON.stringify({passed, failed: 0, operationalWrites: 0}) + '\n');
