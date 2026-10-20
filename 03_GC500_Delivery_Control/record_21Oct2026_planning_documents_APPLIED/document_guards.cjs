// Author: Andrew Fisher. Pure guards for one new, unassigned planning PDF.
'use strict';
const crypto = require('crypto');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify((function sort(v) {
  return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
})(value));
const same = (a, b) => canonical(a) === canonical(b);
const fileId = name => String(name || '').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/\.{2,}/g, '.').replace(/^\.+/, '');
function insist(ok, message) { if (!ok) throw Error(message); }
function validateSpec(spec, bytes) {
  insist(spec && spec.schema === 1 && spec.author === 'Andrew Fisher', 'Unsupported specification');
  const source = spec.source, meta = spec.metadata;
  insist(source && typeof source.path === 'string' && typeof source.name === 'string', 'Source identity required');
  insist(source.name.length > 0 && source.name.length <= 200 && source.name === source.name.trim(), 'Source name exceeds native limit or contains outer whitespace');
  insist(source.name.toLowerCase().endsWith('.pdf') && !/[\\/]/.test(source.name), 'One named PDF required');
  const id = fileId(source.name);
  insist(/^[A-Za-z0-9._-]{1,200}$/.test(id) && !['.', '..', '__proto__', 'constructor', 'prototype'].includes(id), 'Unsafe native file identity');
  insist(source.type === 'application/pdf' && /^[a-f0-9]{64}$/.test(source.sha256), 'PDF type and exact source hash required');
  insist(Number.isSafeInteger(source.bytes) && source.bytes > 0 && source.bytes <= 167772160, 'Invalid source size');
  insist(Buffer.isBuffer(bytes) && bytes.length === source.bytes && hash(bytes) === source.sha256 && bytes.subarray(0, 5).toString() === '%PDF-', 'Source bytes differ from approved PDF');
  insist(meta && same(Object.keys(meta).sort(), ['kind', 'note', 'ref', 'title']), 'Only map title, note and blank reference metadata permitted');
  insist(meta.kind === 'map' && meta.ref === '', 'Planning document must remain an unassigned map');
  for (const [key, max] of [['title', 140], ['note', 300]]) {
    insist(typeof meta[key] === 'string' && meta[key].length > 0 && meta[key].length <= max && meta[key] === meta[key].trim() && !/[\r\n\0]/.test(meta[key]), 'Invalid ' + key);
  }
  return {id, source, metadata: meta};
}
function indexMap(index) {
  insist(index && Array.isArray(index.files), 'Native file catalogue unavailable');
  const map = new Map();
  for (const file of index.files) {
    insist(file && typeof file.id === 'string' && file.id && !map.has(file.id), 'Invalid or duplicate catalogue ID');
    map.set(file.id, file);
  }
  return map;
}
function indexHash(index) {
  return hash(canonical([...indexMap(index).values()].sort((a, b) => a.id.localeCompare(b.id))));
}
function duplicates(index, spec) {
  const id = fileId(spec.source.name);
  return [...indexMap(index).values()].filter(file =>
    file.id === id || fileId(file.name || '') === id || file.name === spec.source.name || file.sha256 === spec.source.sha256
  ).map(file => ({id: file.id, name: file.name, sha256: file.sha256, bytes: file.bytes,
    reasons: [file.id === id ? 'native ID' : '', fileId(file.name || '') === id ? 'sanitized name' : '',
      file.name === spec.source.name ? 'original name' : '', file.sha256 === spec.source.sha256 ? 'source hash' : ''].filter(Boolean)}));
}
function requireNew(index, spec) {
  const found = duplicates(index, spec);
  insist(!found.length, 'Source already exists or conflicts with a native file; no upload or replacement permitted');
  return fileId(spec.source.name);
}
function verifyFile(file, spec, operator) {
  const expected = {id: fileId(spec.source.name), name: spec.source.name, kind: 'map', ref: null, branch: null,
    invoice_no: null, title: spec.metadata.title, note: spec.metadata.note, bytes: spec.source.bytes,
    sha256: spec.source.sha256, type: 'application/pdf', by: operator};
  for (const [key, value] of Object.entries(expected)) insist(same(file && file[key], value), 'Saved file metadata differs: ' + key);
  insist(typeof file.uploaded === 'string' && Number.isFinite(Date.parse(file.uploaded)), 'Native upload timestamp missing');
  insist(!file.replaced, 'Native file was replaced');
  return true;
}
function verifyIndex(before, after, saved, spec, operator) {
  const old = indexMap(before), next = indexMap(after), id = requireNew(before, spec);
  insist(next.size === old.size + 1 && next.has(id), 'Catalogue must gain exactly one file');
  for (const [key, value] of old) insist(same(value, next.get(key)), 'Existing catalogue entry changed: ' + key);
  verifyFile(next.get(id), spec, operator);
  verifyFile(saved, spec, operator);
  insist(same(next.get(id), saved), 'Response and fresh catalogue disagree');
  return true;
}
function verifyRequest(method, url, headers, body, spec, operator, host) {
  insist(method === 'POST' && url === host + '/api/files', 'Only one native file upload is permitted');
  insist(Buffer.isBuffer(body) && body.length === spec.source.bytes && hash(body) === spec.source.sha256, 'Upload body differs from approved original');
  const h = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const decode = key => { try { return decodeURIComponent(h[key] || ''); } catch (_) { throw Error('Invalid header encoding'); } };
  for (const [key, value] of Object.entries({'x-file-name': spec.source.name, 'x-file-kind': 'map',
    'x-file-title': spec.metadata.title, 'x-file-note': spec.metadata.note, 'x-gc500-who': operator}))
    insist(decode(key) === value, 'Upload metadata differs: ' + key);
  insist(h['content-type'] === 'application/pdf', 'Upload content type differs');
  for (const key of ['x-file-ref', 'x-file-branch', 'x-file-invoice']) insist(!h[key], 'Unexpected reference or financial filing header');
  return true;
}
// Match the page's native document identity encoding; never infer an identity
// by decoding the stored key, because the original key is carried in _k.
function nativeId(key) {
  const encoded = [...String(key)].map(ch => /[A-Za-z0-9_\-.:@+]/.test(ch) ? ch : '~' + ch.codePointAt(0).toString(16) + '~').join('');
  return (encoded === '.' || encoded === '..' || !encoded) ? '~' + encoded.length + '~' : encoded.slice(0, 180);
}
function isoTime(value, label) {
  insist(typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value, 'Invalid native ' + label);
  return Date.parse(value);
}
function verifyNativeDocs(before, after, options) {
  insist(before && after && options && typeof before === 'object' && typeof after === 'object'
    && !Array.isArray(before) && !Array.isArray(after), 'Native documents unavailable');
  insist(typeof options.operator === 'string' && options.operator.trim() === options.operator && options.operator,
    'Native operation author required');
  const since = isoTime(options.since, 'baseline time'), observed = isoTime(options.observedAt, 'observation time');
  insist(observed >= since, 'Native observation predates the baseline');
  const added = {photoLinks: [], stamps: [], by: []};
  for (const collection of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const old = Object.hasOwn(before, collection) ? before[collection] : {};
    const next = Object.hasOwn(after, collection) ? after[collection] : {};
    insist(old && next && typeof old === 'object' && typeof next === 'object'
      && !Array.isArray(old) && !Array.isArray(next), 'Invalid native collection');
    for (const [id, record] of Object.entries(old))
      insist(Object.hasOwn(next, id) && same(record, next[id]), 'Existing native record changed: ' + collection + '/' + id);
    for (const id of Object.keys(next).filter(key => !Object.hasOwn(old, key))) {
      insist(Object.hasOwn(added, collection), 'Unrelated native record added: ' + collection + '/' + id);
      added[collection].push(id);
    }
  }
  insist(added.stamps.length === added.photoLinks.length && added.by.length === added.photoLinks.length,
    'Concurrent photo additions need complete provenance triplets');
  const consumed = new Set(), additions = [];
  for (const key of added.photoLinks) {
    const photo = after.photoLinks[key];
    insist(photo && typeof photo === 'object' && !Array.isArray(photo) && typeof photo.id === 'string'
      && photo.id && photo._k === photo.id && nativeId(photo.id) === key, 'Concurrent photo identity differs');
    insist(typeof photo.ref === 'string' && photo.ref.trim()
      && !['removed', 'removed_by', 'removed_why'].some(field => Object.hasOwn(photo, field)),
      'Concurrent photo must be an active new association');
    const originalKey = 'photoLinks/' + photo.id, provenanceKey = nativeId(originalKey);
    insist(added.stamps.includes(provenanceKey) && added.by.includes(provenanceKey) && !consumed.has(provenanceKey),
      'Concurrent photo provenance is missing or ambiguous');
    consumed.add(provenanceKey);
    const stamp = after.stamps[provenanceKey], who = after.by[provenanceKey];
    insist(stamp && who && same(Object.keys(stamp).sort(), ['_k', 'v']) && same(Object.keys(who).sort(), ['_k', 'v'])
      && stamp._k === originalKey && who._k === originalKey, 'Concurrent photo provenance identity differs');
    insist(typeof photo.by === 'string' && photo.by === photo.by.trim() && photo.by
      && photo.by === who.v && photo.by !== options.operator, 'Concurrent photo author is not independent');
    const at = isoTime(photo.at, 'photo time'), stamped = isoTime(stamp.v, 'photo stamp');
    insist(at >= since && stamped >= at && stamped <= observed, 'Concurrent photo time is outside the observation window');
    additions.push({id: photo.id, reference: photo.ref, by: photo.by, photoAt: photo.at, stampedAt: stamp.v});
  }
  return additions;
}
function verifyNativeState(before, after, options) {
  insist(before && after && options, 'Native state unavailable');
  const oldMeta = Object.fromEntries(Object.entries(before).filter(([key]) => !['version', 'updated', 'docs'].includes(key)));
  const nextMeta = Object.fromEntries(Object.entries(after).filter(([key]) => !['version', 'updated', 'docs'].includes(key)));
  insist(same(oldMeta, nextMeta), 'Native state metadata changed');
  insist(Number.isSafeInteger(before.version) && before.version >= 0
    && Number.isSafeInteger(after.version) && after.version >= before.version,
    'Native record version moved backwards or is invalid');
  const oldTime = isoTime(before.updated, 'baseline updated time'), nextTime = isoTime(after.updated, 'updated time');
  insist(nextTime >= oldTime && nextTime <= isoTime(options.observedAt, 'observation time'),
    'Native record time moved backwards or beyond observation');
  insist(before.docs && after.docs, 'Native state documents unavailable');
  for (const collection of Object.keys(before.docs))
    insist(Object.hasOwn(after.docs, collection), 'Native collection was removed');
  for (const collection of Object.keys(after.docs).filter(key => !Object.hasOwn(before.docs, key)))
    insist(['photoLinks', 'stamps', 'by'].includes(collection) && Object.keys(after.docs[collection] || {}).length,
      'Unrelated native collection was added');
  const since = Object.hasOwn(options, 'since') ? options.since : before.updated;
  insist(isoTime(since, 'operation baseline time') <= oldTime, 'Operation baseline follows the backed-up native state');
  const additions = verifyNativeDocs(before.docs, after.docs, {...options, since});
  if (additions.length) {
    insist(after.version > before.version && additions.every(photo => Date.parse(photo.stampedAt) <= nextTime),
      'Concurrent additions lack advancing native state provenance');
  } else insist(before.version === after.version && before.updated === after.updated, 'Native metadata changed without an allowed photo addition');
  return additions;
}
module.exports = {hash, canonical, same, fileId, validateSpec, indexMap, indexHash, duplicates, requireNew, verifyFile, verifyIndex, verifyRequest,
  nativeId, verifyNativeDocs, verifyNativeState};
