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
module.exports = {hash, canonical, same, fileId, validateSpec, indexMap, indexHash, duplicates, requireNew, verifyFile, verifyIndex, verifyRequest};
