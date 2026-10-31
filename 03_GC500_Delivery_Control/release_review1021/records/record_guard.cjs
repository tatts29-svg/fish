/* Author: Andrew Fisher. Exact native-document scope and durable private evidence for the four P/O checks. */
'use strict';
const fs = require('fs'), path = require('path');
const NUMBERS = Object.freeze(['4647508', '4647509', '4647515', '4647517']);
const ALLOWED = new Set(NUMBERS.flatMap(n => ['purchaseOrders/' + n, 'stamps/po~2f~' + n, 'by/po~2f~' + n]));
const canon = x => JSON.stringify((function sort(v) {
  return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
})(x));
const same = (a, b) => canon(a) === canon(b);
const get = (docs, key) => { const [c,id] = key.split('/'); return (docs[c] || {})[id]; };
function changed(before, after) {
  const keys = new Set();
  for (const docs of [before,after]) for (const [c, entries] of Object.entries(docs)) for (const id of Object.keys(entries)) keys.add(c + '/' + id);
  return [...keys].filter(k => !same(get(before,k),get(after,k))).sort();
}
function makePlan(before, after, spec) {
  const keys = changed(before,after), unexpected = keys.filter(k => !ALLOWED.has(k));
  if (unexpected.length) throw Error('Native setter changed documents outside the four P/O checks: ' + unexpected.join(', '));
  for (const no of NUMBERS) {
    const was = before.purchaseOrders[no], now = after.purchaseOrders[no];
    if (!was || !now || now.number !== no) throw Error('Existing P/O required: ' + no);
    const permitted = new Set(['checked','updated_at','updated_by']);
    const fields = new Set([...Object.keys(was),...Object.keys(now)]);
    if ([...fields].some(k => !permitted.has(k) && !same(was[k],now[k]))) throw Error('A P/O business value changed: ' + no);
    if (!now.checked || now.checked.by !== spec.checkedBy || now.checked.at !== spec.at || typeof now.checked.basis !== 'string' || !now.checked.basis) throw Error('The final page must add the reviewed-value basis: ' + no);
    if (now.updated_by !== spec.actor || !Number.isFinite(Date.parse(now.updated_at))) throw Error('Native author/time missing: ' + no);
    const stamp = get(after,'stamps/po~2f~' + no), by = get(after,'by/po~2f~' + no);
    if (!stamp || !Number.isFinite(Date.parse(stamp.v)) || !by || by.v !== spec.actor) throw Error('Native audit documents missing: ' + no);
  }
  return keys.map(key => {
    const body = get(after,key);
    if (!body || typeof body !== 'object') throw Error('Deletion or empty body refused: ' + key);
    return {key,body};
  });
}
function verify(before, after, plan, requireAll) {
  const wanted = new Map(plan.map(p => [p.key,p.body]));
  const otherDocsChanged = changed(before,after).filter(k => !wanted.has(k));
  const plannedNotApplied = plan.filter(p => !same(get(after,p.key),p.body)).map(p => p.key);
  const plannedUnexpected = plan.filter(p => !same(get(after,p.key),p.body) && !same(get(after,p.key),get(before,p.key))).map(p => p.key);
  return {ok: !otherDocsChanged.length && !plannedUnexpected.length && (!requireAll || !plannedNotApplied.length), otherDocsChanged, plannedNotApplied, plannedUnexpected};
}
function durableJson(file, value, redact = s => s) {
  const tmp = file + '.pending';
  const fd = fs.openSync(tmp, 'w', 0o600);
  try { fs.writeFileSync(fd, redact(JSON.stringify(value,null,2)) + '\n'); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
  fs.renameSync(tmp,file);
  const dir = fs.openSync(path.dirname(file),'r');
  try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
}
function requestKey(url, method, host) {
  const u = new URL(url), m = u.origin === host && u.pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/);
  if (method !== 'PUT' || !m || u.search) throw Error('Only planned native PUTs are allowed');
  const key = decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]);
  if (!ALLOWED.has(key)) throw Error('Document outside the four P/O checks: ' + key);
  return key;
}
function checkAck(status, body, previousVersion) {
  let ack; try { ack = JSON.parse(body); } catch (_) { throw Error('Acknowledgement is not JSON'); }
  if (status !== 200 || !Number.isSafeInteger(ack.version) || ack.version <= previousVersion) throw Error('Invalid native acknowledgement (HTTP ' + status + ')');
  return ack.version;
}
module.exports = {NUMBERS,ALLOWED,canon,same,get,changed,makePlan,verify,durableJson,requestKey,checkAck};
