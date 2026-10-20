/* Author: Andrew Fisher. Area photographs: explicit context, one file, preserved native evidence. */
'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const area = require('./area_photos1090.js');

const unit = (ref, id, assetNo, extra = {}) => ({
  ref, id, assetNo, owner: 'example-owner', item: 'Example equipment',
  physical: true, active: true, source: 'identified', ...extra
});
const target = (u, extra = {}) => ({
  ref: u.ref, unitId: u.id, signature: area.signature(u),
  label: `${u.ref} · ${u.assetNo}`, ...extra
});
const referenceTarget = (ref, items, extra = {}) => ({
  scope: 'reference', ref, items: [...new Set(items.map(s => s.trim()).filter(Boolean))].sort(),
  signature: area.referenceSignature(ref, items),
  label: `${ref} · Reference context`, ...extra
});
const first = unit('EXAMPLE-A', 'example-unit-one', 'EXAMPLE-001');
const second = unit('EXAMPLE-A', 'example-unit-two', 'EXAMPLE-002');
const other = unit('EXAMPLE-B', 'example-unit-three', 'EXAMPLE-003');
const meta = {label: 'Example work area', by: 'Example recorder', at: '2026-10-20T01:00:00.000Z'};
const photo = (extra = {}) => ({
  id: 'example-service-photo-id',
  name: 'example-photo.jpg',
  ref: first.ref,
  slot: 0,
  caption: 'Original caption',
  by: 'Original recorder',
  at: '2026-10-19T01:00:00.000Z',
  ...extra
});
const linked = (extra = {}) => area.mergeTargets(
  photo(extra), [target(first), target(second), target(other)], meta
);
const freeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

test('legacy photographs retain their fields and acquire no inferred targets', () => {
  const p = photo({unit: first.id, custom: {kept: true}});
  assert.deepEqual(area.normalize(p), p);
  assert.deepEqual(area.targets(p), []);
  assert.deepEqual(area.linkedRefs(p), [first.ref]);
  assert.equal(area.isArea(p), false);
});

test('normalization and subsequent edits do not mutate the original record', () => {
  const p = freeze(linked({custom: {history: ['keep']}}));
  const before = JSON.stringify(p);
  const changed = area.removeTarget(p, first.ref, first.id);
  changed.custom.history.push('new local edit');
  changed.area1090.targets[0].label = 'Changed locally';
  assert.equal(JSON.stringify(p), before);
});

test('unsupported area metadata is retained without interpreting a future schema', () => {
  const p = photo({area1090: {version: 2, targets: [target(other)], future: true}});
  assert.deepEqual(area.normalize(p), p);
  assert.deepEqual(area.targets(p), []);
  assert.deepEqual(area.linkedRefs(p), [first.ref]);
});

test('target normalization omits incomplete records and deduplicates exact identities', () => {
  const p = photo({area1090: {version: 1, targets: [
    null, {}, {ref: first.ref, unitId: first.id},
    target(first), target(first, {label: 'Latest explicit label'}), target(other)
  ]}});
  assert.equal(area.targets(p).length, 2);
  assert.equal(area.targets(p)[0].label, 'Latest explicit label');
  assert.equal(area.hasTarget(p, first.ref, first.id), true);
  assert.equal(area.hasTarget(p, first.ref, 'not-selected'), false);
});

test('empty or malformed target lists never imply every item at the location', () => {
  for (const targets of [undefined, [], {}, null, 'all']) {
    const p = photo({area1090: {version: 1, targets}});
    assert.deepEqual(area.targets(p), []);
    assert.equal(area.forUnit(p, first, [first, second]), false);
  }
});

test('labels are bounded while recorder and timestamp provenance survive', () => {
  const p = area.mergeTargets(photo(), [target(first)], {...meta, label: `  ${'x'.repeat(150)}  `});
  assert.equal(p.area1090.label.length, 120);
  assert.equal(p.area1090.by, meta.by);
  assert.equal(p.area1090.at, meta.at);
  assert.equal(p.by, 'Original recorder');
  assert.equal(p.at, '2026-10-19T01:00:00.000Z');
});

test('adding memberships preserves the service identity and original photo home', () => {
  const p = photo({unit: first.id, capturedAt: '2026-10-18T03:00:00.000Z'});
  const result = area.mergeTargets(p, [target(second), target(other)], meta);
  for (const name of ['id', 'name', 'ref', 'unit', 'slot', 'caption', 'capturedAt', 'by', 'at']) {
    assert.equal(result[name], p[name], name);
  }
});

test('a second selection adds memberships without losing earlier selected items', () => {
  const initial = area.mergeTargets(photo(), [target(first)], meta);
  const result = area.mergeTargets(initial, [target(other)], {by: 'Later recorder'});
  assert.deepEqual(area.targets(result).map(t => t.unitId), [first.id, other.id]);
  assert.equal(result.area1090.label, meta.label);
  assert.equal(result.area1090.by, 'Later recorder');
  assert.equal(initial.area1090.by, meta.by);
});

test('reselecting an existing target keeps one membership', () => {
  const result = area.mergeTargets(linked(), [target(second)], meta);
  assert.equal(area.targets(result).length, 3);
  assert.equal(area.targets(result).filter(t => t.unitId === second.id).length, 1);
});

test('one file can project to selected references without being copied or rehomed', () => {
  const original = linked({unit: first.id});
  const view = area.projectForRef(original, other.ref);
  assert.equal(view.id, original.id);
  assert.equal(view.ref, original.ref);
  assert.equal(view.unit, '');
  assert.equal(original.unit, first.id);
  assert.equal(area.projectForRef(original, first.ref).unit, first.id);
  assert.equal(view.slot, original.slot);
  assert.equal(view._areaOwner1090, first.ref);
  assert.equal(view._areaViewRef1090, other.ref);
  assert.equal(area.projectForRef(original, 'EXAMPLE-UNSELECTED'), null);
});

test('linked references include the original home once and each selected reference once', () => {
  assert.deepEqual(area.linkedRefs(linked()), [first.ref, other.ref]);
});

test('reference projection retains the owner after the native reader strips ref', () => {
  const projected = area.projectForRef(linked(), other.ref);
  delete projected.ref;
  assert.deepEqual(area.linkedRefs(projected), [first.ref, other.ref]);
  assert.equal(area.projectForRef(projected, first.ref)._areaOwner1090, first.ref);
});

test('context matches only the explicitly selected stable identity and signature', () => {
  const p = linked();
  assert.equal(area.forUnit(p, first, [first, second, other]), true);
  assert.equal(area.forUnit(p, unit(first.ref, 'new-unit', first.assetNo), []), false);
  assert.equal(area.forUnit(p, {...first, item: 'Replacement equipment'}, []), false);
  assert.equal(area.forUnit(p, {...first, ref: other.ref}, []), false);
  assert.equal(area.forUnit(p, {...first, owner: 'different-owner'}, []), false);
});

test('matching item descriptions or fleet numbers do not select another asset', () => {
  const p = area.mergeTargets(photo(), [target(first)], meta);
  assert.equal(area.forUnit(p, second, [first, second]), false);
  assert.equal(area.forUnit(p, {...second, assetNo: first.assetNo}, [first, second]), false);
});

test('a nonphysical identity cannot receive current unit context', () => {
  assert.equal(area.forUnit(linked(), {...first, physical: false}, []), false);
  assert.equal(area.forUnit(linked(), null, []), false);
});

test('historical or inactive identities do not receive current item context', () => {
  assert.equal(area.forUnit(linked(), {...first, source: 'history'}), false);
  assert.equal(area.forUnit(linked(), {...first, active: false}), false);
});

test('area context alone is not individual photographic evidence', () => {
  const p = linked();
  assert.equal(area.isIndividualEvidence(p, first.ref), false);
  assert.equal(area.primaryMatches(p, first, [first, second]), false);
  assert.equal(area.forUnit(p, first, [first, second]), true);
});

test('sharing an existing individual photo preserves its original individual evidence', () => {
  const p = linked({unit: first.id});
  assert.equal(area.isIndividualEvidence(p, first.ref), true);
  assert.equal(area.primaryMatches(p, first, [first, second, other]), true);
  assert.equal(area.primaryMatches(p, second, [first, second, other]), false);
  assert.equal(area.isIndividualEvidence(p, other.ref), false);
});

test('detaching the primary item preserves the file and explicit area context', () => {
  const p = linked({unit: first.id});
  p.area1090.primaryDetached = true;
  assert.equal(area.primaryMatches(p, first, [first]), false);
  assert.equal(area.forUnit(p, first, [first]), true);
  assert.equal(p.id, 'example-service-photo-id');
  assert.equal(p.unit, first.id);
});

test('legacy bare-number evidence is accepted only when the number is unambiguous', () => {
  const p = linked({unit: first.assetNo});
  assert.equal(area.primaryMatches(p, first, [first, second]), true);
  assert.equal(area.primaryMatches(p, first, [first, {...second, assetNo: first.assetNo}]), false);
});

test('removing one area target preserves all other links and the original home', () => {
  const p = linked({unit: first.id});
  const result = area.removeTarget(p, second.ref, second.id);
  assert.equal(area.hasTarget(result, second.ref, second.id), false);
  assert.equal(area.hasTarget(result, first.ref, first.id), true);
  assert.equal(area.hasTarget(result, other.ref, other.id), true);
  assert.equal(result.removed, undefined);
  assert.equal(result.ref, p.ref);
  assert.equal(result.unit, p.unit);
  assert.equal(area.targets(p).length, 3);
});

test('removing the final area target leaves the original photograph available', () => {
  const p = area.mergeTargets(photo(), [target(other)], meta);
  const result = area.removeTarget(p, other.ref, other.id);
  assert.deepEqual(area.targets(result), []);
  assert.deepEqual(area.linkedRefs(result), [first.ref]);
  assert.equal(result.removed, undefined);
  assert.equal(result.id, p.id);
});

test('removing a nonexistent target is harmless and never deletes a photo', () => {
  const p = linked();
  assert.deepEqual(area.removeTarget(p, 'EXAMPLE-MISSING', 'missing'), p);
});

test('merging context does not resurrect an existing global removal', () => {
  const removed = photo({removed: '2026-10-20T02:00:00.000Z', removed_by: 'Example recorder'});
  const result = area.mergeTargets(removed, [target(other)], meta);
  assert.equal(result.removed, removed.removed);
  assert.equal(result.removed_by, removed.removed_by);
  assert.deepEqual(area.counts([result]), {photos: 0, targets: 0, references: 0});
});

test('validation accepts only explicit current selections, including an area-only photo', () => {
  const available = [target(first, {active: true}), target(other, {active: true})];
  assert.deepEqual(area.validateTargets(available, []), {ok: true, errors: []});
  assert.deepEqual(area.validateTargets(available, [target(first), target(other)]), {ok: true, errors: []});
});

test('validation rejects stale, unavailable, inactive and duplicate selections', () => {
  const available = [target(first, {active: true}), target(other, {active: false})];
  for (const selected of [
    [target(second)],
    [target({...first, item: 'Changed item'})],
    [target(other)],
    [target(first), target(first)]
  ]) {
    const result = area.validateTargets(available, selected);
    assert.equal(result.ok, false);
    assert.ok(result.errors.length > 0);
  }
});

test('same unit identifier on a different reference cannot bypass validation', () => {
  const available = [target(first, {active: true})];
  assert.equal(area.validateTargets(available, [target({...first, ref: other.ref})]).ok, false);
});

test('counts deduplicate a photo shown at several references and exclude tombstones', () => {
  const p = linked();
  const another = area.mergeTargets(photo({id: 'example-second-photo'}), [target(first)], meta);
  const result = area.counts([
    p, area.projectForRef(p, other.ref), another,
    photo({id: 'example-removed-photo', removed: '2026-10-20T02:00:00.000Z'}), null
  ]);
  assert.deepEqual(result, {photos: 2, targets: 4, references: 2});
});

test('an area label stays visibly contextual without altering a legacy caption', () => {
  assert.equal(area.caption(linked()), 'Area context · Example work area');
  assert.equal(area.caption(photo()), 'Original caption');
  assert.equal(area.caption(area.mergeTargets(photo(), [], {label: ''})), 'Area context');
});

// The production page has older readers that append legacy photographs after its
// core unit matcher. Exercise the final adapter boundary with such a reader:
// context must stay separate even when an earlier fallback returns every photo.
function withLegacyReaders() {
  const document = {
    addEventListener() {},
    createElement() { return {}; },
    head: {appendChild() {}}
  };
  const host = {
    document,
    S: {photoLinks: {}},
    SYNC: {readonly: true},
    capability() { return 'view'; },
    esc(s) { return String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'); },
    legacyPhotos: [],
    photoLinksOf() { return []; },
    dropPhotosOf() { return host.legacyPhotos; },
    photoLinkPut(p) { return p; },
    photoLinkRemove() {},
    dropPhotoRemove() {},
    photoPutBack() {},
    filedPhotoUse() {},
    async dropPhotoAdd() {},
    dropPhotoSlots() { return []; },
    dropPhotoSays() { return ''; },
    dropPhotoCaption() { return ''; },
    photoRef815(p) { return p.ref; },
    meta815() { return ''; },
    hay815() { return ''; },
    Items933: {cardPhotos() { return ''; }},
    Units925: {photos(u, rows, photos) { return photos; }}
  };
  host.window = host;
  vm.runInNewContext(fs.readFileSync(require.resolve('./area_photos1090.js'), 'utf8'), host, {
    filename: 'area_photos1090.js'
  });
  return host;
}

test('a legacy fallback cannot turn area context at another reference into individual evidence', () => {
  const host = withLegacyReaders();
  const p = linked({unit: '1234567'});
  assert.equal(host.Units925.photos(other, [other], [p]).length, 0);
});

test('a legacy fallback cannot restore an explicitly detached primary item link', () => {
  const host = withLegacyReaders();
  const p = linked({unit: first.id});
  p.area1090.primaryDetached = true;
  assert.equal(host.Units925.photos(first, [first], [p]).length, 0);
});

test('the final evidence adapter preserves legacy photographs and retained primary evidence', () => {
  const host = withLegacyReaders();
  const legacy = photo({unit: '1234567'});
  const primary = linked({unit: first.id});
  const got = host.Units925.photos(first, [first], [legacy, primary]);
  assert.deepEqual(Array.from(got, p => p.id), [legacy.id, primary.id]);
});

test('Documents keeps one primary reference while related references are searchable and individually linked', () => {
  const host = withLegacyReaders();
  const p = linked({unit: first.id});
  host.S.photoLinks[p.id] = p;
  const document = {id: p.id, ref: first.ref};
  assert.equal(host.photoRef815(document), first.ref);
  const markup = host.meta815(document);
  assert.ok(markup.includes(`data-open815="${first.ref}"`));
  assert.ok(markup.includes(`data-open815="${other.ref}"`));
  assert.ok(markup.includes('Area context'));
  assert.ok(host.hay815(document).includes(other.ref.toLowerCase()));
  assert.equal(Object.keys(host.S.photoLinks).length, 1);
});

test('an authoritative unlink masks an old legacy copy at the removed reference', () => {
  const host = withLegacyReaders();
  const p = linked();
  host.legacyPhotos = [p];
  host.S.photoLinks[p.id] = area.removeTarget(p, other.ref, other.id);
  assert.equal(host.dropPhotosOf(other.ref).length, 0);
  assert.equal(host.dropPhotosOf(first.ref).length, 1);
});

test('an authoritative global tombstone masks all old legacy reference copies', () => {
  const host = withLegacyReaders();
  const p = linked();
  host.legacyPhotos = [p];
  host.S.photoLinks[p.id] = {...p, removed: '2026-10-20T03:00:00.000Z'};
  assert.equal(host.dropPhotosOf(first.ref).length, 0);
  assert.equal(host.dropPhotosOf(other.ref).length, 0);
});

test('reference signatures use stable unique descriptions rather than incidental item ordering', () => {
  const signature = area.referenceSignature('EXAMPLE-QUANTITY-A', [
    ' Example shelter ', 'Example lighting', 'Example shelter'
  ]);
  assert.equal(signature, JSON.stringify([
    'reference', 'EXAMPLE-QUANTITY-A', ['Example lighting', 'Example shelter']
  ]));
  assert.equal(signature, area.referenceSignature('EXAMPLE-QUANTITY-A', [
    'Example lighting', 'Example shelter'
  ]));
  assert.notEqual(signature, area.referenceSignature('EXAMPLE-QUANTITY-B', [
    'Example lighting', 'Example shelter'
  ]));
});

test('one photograph can link two quantity-only references without manufacturing unit identities', () => {
  const refs = [
    referenceTarget('EXAMPLE-QUANTITY-A', ['Example shelter']),
    referenceTarget('EXAMPLE-QUANTITY-B', ['Example lighting'])
  ];
  const p = area.mergeTargets(photo(), refs, meta);
  assert.deepEqual(area.targets(p), refs);
  assert.ok(area.targets(p).every(t => t.scope === 'reference' && !Object.hasOwn(t, 'unitId')));
  assert.deepEqual(area.linkedRefs(p), [first.ref, refs[0].ref, refs[1].ref]);
  for (const ref of refs) {
    assert.equal(area.projectForRef(p, ref.ref).id, p.id);
    assert.equal(area.isIndividualEvidence(p, ref.ref), false);
  }
  assert.deepEqual(area.counts([p, area.projectForRef(p, refs[0].ref)]), {
    photos: 1, targets: 2, references: 3
  });
});

test('reference and unit memberships coexist at the same reference and deduplicate independently', () => {
  const ref = referenceTarget(first.ref, [first.item]);
  const p = area.mergeTargets(photo(), [ref, target(first), target(other)], meta);
  const again = area.mergeTargets(p, [ref, target(first)], meta);
  assert.equal(area.targets(again).length, 3);
  assert.equal(area.targets(again).filter(t => t.scope === 'reference').length, 1);
  assert.equal(area.targets(again).filter(t => t.unitId === first.id).length, 1);
  assert.equal(area.hasTarget(again, first.ref), true);
  assert.equal(area.hasTarget(again, first.ref, first.id), true);
  assert.equal(area.hasTarget(again, first.ref, second.id), false);
  assert.equal(area.forUnit(again, first), true);
  assert.equal(area.forUnit(again, second), false);
  assert.deepEqual(area.linkedRefs(again), [first.ref, other.ref]);
});

test('reference links survive a JSON persistence round trip without mutating the original photograph', () => {
  const original = freeze(area.mergeTargets(
    photo({unit: first.id, custom: {history: ['keep']}}),
    [referenceTarget('EXAMPLE-QUANTITY-A', ['Example shelter']), target(other)], meta
  ));
  const before = JSON.stringify(original);
  const restored = area.normalize(JSON.parse(before));
  assert.deepEqual(restored, original);
  restored.area1090.targets[0].label = 'Local edit';
  restored.custom.history.push('Local edit');
  assert.equal(JSON.stringify(original), before);
  assert.equal(original.unit, first.id);
  assert.equal(original.ref, first.ref);
  assert.equal(original.id, 'example-service-photo-id');
});

test('unlinking a reference membership leaves its selected unit and other references intact', () => {
  const ref = referenceTarget(first.ref, [first.item]);
  const elsewhere = referenceTarget('EXAMPLE-QUANTITY-B', ['Example lighting']);
  const original = area.mergeTargets(photo(), [ref, target(first), elsewhere], meta);
  for (const missingUnit of [undefined, null]) {
    const result = area.removeTarget(original, first.ref, missingUnit);
    assert.deepEqual(area.targets(result), [target(first), elsewhere]);
    assert.equal(area.forUnit(result, first), true);
    assert.equal(result.removed, undefined);
  }
  assert.equal(area.targets(original).length, 3);
});

test('unlinking a unit membership keeps an explicit reference membership without enrolling the unit', () => {
  const ref = referenceTarget(first.ref, [first.item]);
  const original = area.mergeTargets(photo(), [ref, target(first)], meta);
  const result = area.removeTarget(original, first.ref, first.id);
  assert.deepEqual(area.targets(result), [ref]);
  assert.equal(area.forUnit(result, first), false);
  assert.equal(area.projectForRef(result, first.ref).id, original.id);
});

test('reference validation rejects a changed description set, missing reference and inactive reference', () => {
  const ref = referenceTarget('EXAMPLE-QUANTITY-A', ['Example shelter']);
  assert.equal(area.validateTargets([ref], [ref]).ok, true);
  assert.equal(area.validateTargets([
    referenceTarget(ref.ref, ['Replacement equipment'])
  ], [ref]).ok, false);
  assert.equal(area.validateTargets([], [ref]).ok, false);
  assert.equal(area.validateTargets([{...ref, active: false}], [ref]).ok, false);
  assert.equal(area.validateTargets([ref], [ref, ref]).ok, false);
});

test('reference context never auto-enrols a newly identified or replacement unit', () => {
  const ref = referenceTarget('EXAMPLE-QUANTITY-A', ['Example shelter']);
  const p = area.mergeTargets(photo(), [ref], meta);
  const newUnit = unit(ref.ref, 'example-new-identity', 'EXAMPLE-NEW', {item: 'Example shelter'});
  assert.equal(area.forUnit(p, newUnit), false);
  assert.equal(area.forUnit(p, {...newUnit, id: 'example-replacement-identity'}), false);
  assert.equal(area.primaryMatches(p, newUnit, [newUnit]), false);
  assert.equal(area.isIndividualEvidence(p, ref.ref), false);
  assert.deepEqual(area.targets(p), [ref]);
});

test('reference normalization requires explicit scope and signature and keeps no unit identity', () => {
  const valid = referenceTarget('EXAMPLE-QUANTITY-A', ['Example shelter']);
  const p = photo({area1090: {version: 1, targets: [
    {ref: valid.ref, signature: valid.signature},
    {scope: 'reference', ref: valid.ref},
    {scope: 'reference', ref: '', signature: valid.signature},
    {...valid, unitId: 'must-not-become-an-item-link'}
  ]}});
  assert.deepEqual(area.targets(p), [valid]);
});

test('the selector includes quantity-only references alongside explicit units and excludes inactive locations', () => {
  const host = withLegacyReaders();
  const refs = [
    {key: 'EXAMPLE-QUANTITY-A', item: 'Example shelter'},
    {key: 'EXAMPLE-QUANTITY-B', item: 'Example lighting'},
    {key: first.ref, item: first.item},
    {key: 'EXAMPLE-CANCELLED', _cancelled: true},
    {key: 'EXAMPLE-MOVED', _movedTo: 'EXAMPLE-DESTINATION'}
  ];
  Object.assign(host, {
    holdAssets(fn) { return fn(); },
    heldMemo(key, fn) { return fn(); },
    allAssets() { return refs; },
    movedAway() { return false; },
    chargeLines(a) { return a.item ? [{item: a.item}] : []; },
    gcModel925(a) { return {rows: a.key === first.ref ? [first] : []}; }
  });
  host.Items933.friendlyRow = u => u.assetNo;
  const options = host.AreaPhotos1090.options();
  assert.deepEqual(Array.from(options.filter(t => t.scope === 'reference'), t => t.ref), [
    'EXAMPLE-QUANTITY-A', 'EXAMPLE-QUANTITY-B', first.ref
  ]);
  assert.deepEqual(Array.from(options.filter(t => t.scope !== 'reference'), t => t.unitId), [first.id]);
  assert.equal(options.length, 4);
});
