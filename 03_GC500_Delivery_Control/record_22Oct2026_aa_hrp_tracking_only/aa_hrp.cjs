#!/usr/bin/env node
/* Author: Andrew Fisher. Record, on the shared record, what the branch's delivery dockets and the latest Baseplan
   export settle (Andrew, 15 Oct 2026: "fix anything that is relevant to truth ... we have all the data we need"),
   through the page's own controls so every derived figure stays consistent:
     number_on   - an asset number goes on by the drawer's rule (numberPutOn after the drawer's clash check)
     number_off  - an asset number comes off by the drawer's rule (numberTakeOff: a tombstone, so an older copy
                   cannot put it back)
     light       - the delivery light (setLight)
     acc_add     - an accessory with its number through the drawer's Attach form, as a person pressing Add
     acc_fix     - an accessory's number corrected through the drawer's Edit button and Save
     answer      - a Questions note (setQAnswer), the page's own note field

     node dockets_fill.cjs                 DRY RUN (default): the page is opened read-only through the harness, every
                                           write it tries is ABORTED, and the script prints what --apply would send.
     node dockets_fill.cjs --apply         needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.
     options: --spec <file> (default p06_spec.json beside this script)
              --page <file> or PAGE=<file>: the page to serve in the dry run (default: the live page, fetched now)

   v10.x VMS (18 Oct 2026): vms_rego - a VMS board's rego through the register's own writer vms913Save(key, ..., {rego:true}),
   exactly as an editor typing the rego into the VMS boards form and pressing Save. Andrew, 18 Oct: "Please add rego. For all
   of these ... THIS NEED TO BE FIXED and updated".
   Spec: {"by": "Andrew Fisher", "ops": [{"op": "number_on", "ref": "WC07", "no": "1002538"}, ...]}.

   --apply, in order: before snapshot of GET /api/state (view token; kept beside this script as the backup) -> the
   public page's sha256 must equal GC500_EXPECTED_PAGE_SHA -> Chromium opens /e/<key>#plant with the page's sender
   held back and a write gate that aborts every non-GET not on the plan -> wait for SYNC.status === 'live' -> the
   startup queue must be empty or serialisation-only no-ops -> every op staged in the page, in order; one failure
   and nothing is sent -> the queued writes must all be documents about the references and questions in the spec,
   none removed -> release the sender, allow exactly those PUTs once each -> wait until the queue and inflight are
   empty (90 s) -> GET /api/state again -> verify every op on the service and that every other document is
   unchanged -> report_<UTC>.json. The key is never printed, logged or stored; it is redacted from every string. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os'), {spawn} = require('child_process');

const HERE = __dirname, TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const HOST = 'https://gc500-production.up.railway.app', VIEW_TOKEN = 'Coates-GC500-2026';
const args = process.argv.slice(2);
const argValue = flag => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : null; };
const applying = args.includes('--apply');
const specPath = argValue('--spec') || path.join(HERE, 'aa_hrp_spec.json');
const token = process.env.GC500_EDIT_TOKEN || '', expectedSha = process.env.GC500_EXPECTED_PAGE_SHA || '';
const redact = s => token ? String(s).split(token).join('[key]') : String(s);
const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
const same = (a, b) => canon(a) === canon(b);
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const utc = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const log = (...a) => console.log(...a.map(redact));
const fail = m => { throw new Error(redact(m)); };

// ---------------------------------------------------------------------------------------------- the spec
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
if (!Array.isArray(spec.ops) || !spec.ops.length) fail('spec.ops must be a list');
const REFRE = /^[A-Z][A-Z0-9]{0,7}(-[A-Z0-9]{1,4})?$/, NORE = /^\d{4,12}$/;
const TYPES = ['Air conditioner', 'Fridge', 'Zip boiler', 'Sink with tap', 'Microwave', 'Hydration station', 'Urn', 'Whiteboard', 'Folding table', 'Swivel chair', 'Stackable chair', 'Chair', 'Desk', 'Heater', 'Water cooler', 'Other'];
spec.ops.forEach((o, i) => {
  const at = 'ops[' + i + '] ';
  if (o.op === 'number_on' || o.op === 'number_off') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '')) fail(at + 'needs a 4-12 digit number'); }
  else if (o.op === 'light') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!['on site', 'not on site', 'in transit', 'collected'].includes(o.state)) fail(at + 'needs a light state'); }
  else if (o.op === 'acc_add') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!TYPES.includes(o.type)) fail(at + 'type must be one the picker has'); if (!NORE.test(o.no || '')) fail(at + 'needs a number'); if (o.qty != null && !(Number.isInteger(o.qty) && o.qty >= 1)) fail(at + 'qty'); }
  else if (o.op === 'acc_fix') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!TYPES.includes(o.type)) fail(at + 'type'); if (!/^\d{4,12}$/.test(o.from || '') || !NORE.test(o.to || '')) fail(at + 'from/to numbers'); }
  else if (o.op === 'answer') { if (typeof o.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,80}$/i.test(o.id)) fail(at + 'needs a question id'); if (typeof o.text !== 'string' || !o.text.trim() || o.text.length > 600) fail(at + 'needs text under 600 characters'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.text)) fail(at + 'text names a system'); }
  else if (o.op === 'unit_reidentify') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^[0-9A-Z]{3,12}$/.test(o.no || '')) fail(at + 'needs a number'); if (typeof o.item !== 'string' || !o.item.trim()) fail(at + 'needs an item type'); if (!['coates', 'event-portables', 'prem-air-hire'].includes(o.owner || 'coates')) fail(at + 'owner'); }
  else if (o.op === 'number_item') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '')) fail(at + 'needs a number'); if (typeof o.item !== 'string' || !o.item.trim()) fail(at + 'needs an item'); }
  else if (o.op === 'complete') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); }
  else if (o.op === 'note_replace') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); for (const f of ['old', 'new']) if (typeof o[f] !== 'string' || !o[f].trim() || o[f].length > 600) fail(at + 'needs ' + f + ' text under 600 characters'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.new)) fail(at + 'text names a system'); }
  else if (o.op === 'unit_archive_wrong') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '') || !NORE.test(o.keep || '') || o.no === o.keep) fail(at + 'needs the wrong number and the number that stays'); }
  else if (o.op === 'scope_refresh') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); }
  else if (o.op === 'complete_again') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); }
  else if ((o.op === 'labour_on' || o.op === 'labour_off') && !o.unit) { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); for (const f of ['disc', 'item', 'line']) if (typeof o[f] !== 'string' || !o[f]) fail(at + 'needs ' + f); }
  else if (o.op === 'labour_on' || o.op === 'labour_off') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); for (const f of ['disc', 'item', 'line', 'unit']) if (typeof o[f] !== 'string' || !o[f]) fail(at + 'needs ' + f); }
  else if (o.op === 'door') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^u\d{4,12}$/.test(o.id || '')) fail(at + 'needs a unit row id'); if (!['driver', 'passenger', 'na'].includes(o.side)) fail(at + 'side'); }
  else if (o.op === 'unit_archive') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '')) fail(at + 'needs a number'); }
  else if (o.op === 'supplied') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (typeof o.item !== 'string' || !o.item) fail(at + 'needs an item'); if (!(Number.isInteger(o.qty) && o.qty >= 0)) fail(at + 'needs a whole number'); }
  else if (o.op === 'vms_fleet') { if (!/^(\d{7}|VMS\d{2})$/.test(o.key || '')) fail(at + 'needs a VMS board key'); if (!/^[0-9A-Z]{3,12}$/.test(o.fleet || '')) fail(at + 'needs a fleet/asset number'); }
  else if (o.op === 'vms_rego') { if (!/^(\d{7}|VMS\d{2})$/.test(o.key || '')) fail(at + 'needs a VMS board key'); if (!/^[A-Z0-9]{2,8}$/.test(o.rego || '')) fail(at + 'needs a rego'); }
  else if (o.op === 'vms_board') { if (!/^VMS\d{2}$/.test(o.key || '')) fail(at + 'needs a VMS board key'); if (!/^[0-9A-Z]{3,12}$/.test(o.fleet || '')) fail(at + 'needs a fleet/asset number'); if (!/^[A-Z0-9]{2,8}$/.test(o.rego || '')) fail(at + 'needs a rego'); if (!REFRE.test(o.on || '')) fail(at + 'needs the delivery it is on'); }
  else if (o.op === 'note_append') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (typeof o.text !== 'string' || !o.text.trim() || o.text.length > 600) fail(at + 'needs text under 600 characters'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.text)) fail(at + 'text names a system'); }
  else if (o.op === 'spare_use') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^SP-[a-z0-9]{6,20}$/.test(o.id || '')) fail(at + 'needs a spare id'); if (!NORE.test(o.no || '')) fail(at + 'needs the spare\'s number'); }
  else if (o.op === 'steps_off') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); }
  else if (o.op === 'vms_inplace' || o.op === 'vms_complete') { if (!/^\d{2}[a-z]?$/.test(o.pos || '')) fail(at + 'needs a VMS plan position'); if (!/^VMS\d{2}$/.test(o.board || '')) fail(at + 'needs the board name (VMSnn) that position carries'); }
  else if (o.op === 'vms_plan') { if (!/^\d{2}[a-z]?$/.test(o.pos || '')) fail(at + 'needs a VMS plan position'); if (!(o.lat <= -27 && o.lat >= -29 && o.lon >= 153 && o.lon <= 154)) fail(at + 'not a Gold Coast position'); if (typeof o.how !== 'string' || !o.how.trim() || o.how.length > 200) fail(at + 'needs how it was arrived at'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.how)) fail(at + 'text names a system'); }
  else if (o.op === 'sub_move') { if (!REFRE.test(o.from || '') || !REFRE.test(o.to || '') || o.from === o.to) fail(at + 'needs two references'); if (!/^[A-Za-z0-9-]{1,12}$/.test(o.no || '')) fail(at + 'needs the unit number'); if (typeof o.co !== 'string' || !o.co.trim()) fail(at + 'needs the sub-hire company'); }
  else if (o.op === 'place') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!(o.lat <= -27 && o.lat >= -29 && o.lon >= 153 && o.lon <= 154)) fail(at + 'not a Gold Coast position'); if (typeof o.how !== 'string' || !o.how.trim() || o.how.length > 200) fail(at + 'needs how it was arrived at'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.how + ' ' + (o.source || ''))) fail(at + 'text names a system'); }
  else if (o.op === 'fire_ext') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!(Number.isInteger(o.qty) && o.qty >= 1 && o.qty <= 99)) fail(at + 'needs a fire extinguisher count 1-99'); }
  else if (o.op === 'item_type') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (typeof o.item !== 'string' || !o.item.trim() || o.item.length > 80) fail(at + 'needs the item type'); }
  else if (o.op === 'set_qty') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!(o.qty === '' || (Number.isInteger(o.qty) && o.qty >= 0))) fail(at + 'qty must be a whole number or "" for the schedule\'s own'); }
  else fail(at + 'unknown op ' + o.op);
});
const VKEYS = [...new Set(spec.ops.filter(o => o.op === 'vms_rego' || o.op === 'vms_fleet' || o.op === 'vms_board').map(o => o.key))];
const REFS = [...new Set(spec.ops.flatMap(o => [o.ref, o.from, o.to]).filter(Boolean))], QIDS = [...new Set(spec.ops.filter(o => o.op === 'answer').map(o => o.id))];
/* the documents this operation may touch: the references' own delivery, assetNumbers and accessories documents, the
   answers documents named, and the audit documents the page keeps beside them (stamps, by, deleted, notes, spares) */
const ALLOWED_COLLS = new Set(['delivery', 'assetNumbers', 'accessories', 'answers', 'stamps', 'by', 'deleted', 'notes', 'spares', 'loads', 'qtys', 'units', 'labour', 'supplied', 'vmsboard', 'places', 'items']);
const VPOS = new Set(spec.ops.filter(o => o.op === 'vms_plan' || o.op === 'vms_inplace' || o.op === 'vms_complete').map(o => o.pos)); /* VMS plan positions (vms1024/<pos> on loads) the spec names */
const SPARE_IDS = new Set(spec.ops.filter(o => o.op === 'spare_use').map(o => o.id)); /* a spare is named by its own id; only the ones the spec names */
const docIdDecode = id => String(id).replace(/~2f~/g, '/').replace(/~7c~/g, '|').replace(/~20~/g, ' ').replace(/~26~/g, '&');
const allowed = (k, body, docs) => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (!ALLOWED_COLLS.has(c)) return false; const d = docIdDecode(id), parts = d.split('/');
  if (c === 'vmsboard') return VKEYS.includes(d);
  if (c === 'spares' || (c === 'stamps' || c === 'by') && d.startsWith('spares/')) return SPARE_IDS.has(d.replace(/^spares\//, ''));
  if ((c === 'stamps' || c === 'by') && d.startsWith('vmsboard/')) return VKEYS.includes(d.slice('vmsboard/'.length));
  if (c === 'loads' && d.startsWith('vms1024/')) return VPOS.has(d.slice('vms1024/'.length)) && (!body || body.kind === 'vms1024');
  if ((c === 'stamps' || c === 'by') && d.startsWith('loads/vms1024/')) return VPOS.has(d.slice('loads/vms1024/'.length));
  if (c === 'loads') return d.startsWith('unit925/') && !!body && REFS.includes(body.ref); /* a unit record is named by its uuid; its body names the reference */
  if ((c === 'stamps' || c === 'by') && d.startsWith('loads/unit925/')) { const u = ((docs || {}).loads || {})['unit925~2f~' + d.slice('loads/unit925/'.length)]; return !!u && REFS.includes(u.ref); } /* its audit stamps likewise */
  if (c === 'answers' || (c === 'stamps' || c === 'by') && d.startsWith('answers/')) { const nid = d.replace(/^answers\//, ''); return QIDS.includes(nid) || NOTE_IDS.has(nid); }
  if (c === 'labour' || (c === 'stamps' || c === 'by') && d.startsWith('labour/')) { const lk = d.replace(/^labour\//, ''); return REFS.includes(lk.split(/[\/|]/)[0]); } /* a labour tick is named ref|disc|item|line or ref/unit|...; its ref leads */
  return parts.some(p => REFS.includes(p) || QIDS.includes(p)); };
const NOTE_IDS = new Set();

// ---------------------------------------------------------------------------------------------- curl with headers on stdin
let seq = 0;
const quote = v => '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + '"';
function curlGet(url, headers) {
  const tmp = path.join(os.tmpdir(), 'gc500-df-' + process.pid + '-' + (++seq)), hf = tmp + '.h', bf = tmp + '.b';
  const cfg = ['url = ' + quote(url), 'silent', 'show-error', 'compressed', 'max-time = 180', 'dump-header = ' + quote(hf), 'output = ' + quote(bf)];
  for (const [k, v] of Object.entries(headers || {})) cfg.push('header = ' + quote(k + ': ' + v));
  return new Promise((resolve, reject) => {
    const c = spawn('curl', ['--config', '-'], {stdio: ['pipe', 'ignore', 'pipe']}); let err = '';
    c.stderr.on('data', d => err += d); c.on('error', reject);
    c.on('close', code => {
      try {
        if (code) return reject(new Error(redact(err) || 'curl failed'));
        const blocks = fs.readFileSync(hf, 'utf8').split(/\r?\n\r?\n/).filter(x => /^HTTP\//.test(x));
        const status = Number((blocks.at(-1) || 'HTTP/1.1 0').split(/\r?\n/)[0].split(' ')[1]);
        resolve({status, body: fs.readFileSync(bf)});
      } catch (e) { reject(e); } finally { fs.rmSync(hf, {force: true}); fs.rmSync(bf, {force: true}); }
    });
    c.stdin.end(cfg.join('\n') + '\n');
  });
}
async function publicState() {
  const r = await curlGet(HOST + '/api/state', {'x-gc500-token': VIEW_TOKEN, 'cache-control': 'no-cache'});
  if (r.status !== 200) fail('GET /api/state answered ' + r.status);
  const s = JSON.parse(r.body); if (!s || typeof s.version !== 'number' || !s.docs || typeof s.docs !== 'object') fail('/api/state is not a record');
  return s;
}
function playwright() { try { return require(path.join(TOOLCHAIN, 'node_modules', 'playwright')); } catch (_) { return require('playwright'); } }

// ---------------------------------------------------------------------------------------------- functions run INSIDE the page
function pageReady() { return typeof SYNC === 'object' && SYNC.status === 'live' && SYNC.first && SYNC.first.size === Object.keys(SYNC_COLLS).length; }
function pageHasControls() {
  const missing = ['setLight', 'numberPutOn', 'numberTakeOff', 'numberOwners', 'assetNumbersOf', 'assetOf', 'deliveryOf', 'openAsset', 'setQAnswer', 'qAnswer', 'isRef', 'whoAmI', 'mayWrite', 'capability', 'toDocs', 'fromDocs', 'syncStage', 'syncSend', 'syncWaiting', 'persist', 'save', 'unit925Save', 'gcModel925', 'setQty'].filter(f => typeof window[f] !== 'function');
  return {missing, hasS: typeof S === 'object' && !!S, hasColls: typeof SYNC_COLLS === 'object', level: SYNC.level, readonly: SYNC.readonly, status: SYNC.status};
}
function pageDocs() { return JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k => [k, toDocs(k)])))); }
function pageSnapshot(spec) {
  const refs = {};
  spec.refs.forEach(k => { const a = assetOf(k), d = deliveryOf(k); refs[k] = a ? {name: a.name, item_types: a.item_types, numbers: assetNumbersOf(a), light: d.state || null, done: !!d.done, accessories: (a.accessories || []).map(x => x.type + ':' + (x.asset_no || '-'))} : null; });
  const answers = {}; spec.qids.forEach(id => answers[id] = qAnswer(id));
  return JSON.parse(JSON.stringify({operator: S.operator || null, refs, answers,
    queue: Object.fromEntries(Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length)),
    inflight: Object.keys(SYNC.inflight || {}), waiting: syncWaiting(), status: SYNC.status, level: SYNC.level, readonly: SYNC.readonly}));
}
function holdSender() {
  if (typeof syncSend !== 'function') throw new Error('syncSend missing');
  if (!window.__heldSend) { window.__heldSend = syncSend; syncSend = function () { clearTimeout(SYNC.timer); SYNC.timer = null; syncStage(); }; }
  return true;
}
function releaseSender() { if (!window.__heldSend) throw new Error('sender was not held'); syncSend = window.__heldSend; delete window.__heldSend; syncSend(); return true; }
function alignStartupQueue(serverDocs) {
  const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
  if (!window.__heldSend || Object.keys(SYNC.inflight || {}).length) throw new Error('the sender is not held, or a write is already in flight');
  syncStage();
  const restored = [], differing = [];
  for (const [name, q] of Object.entries(SYNC.queue || {})) {
    if (!Object.keys(q).length) continue;
    const original = serverDocs[name] || {};
    for (const [id, body] of Object.entries(q)) if (body === null || canon(body) !== canon(original[id])) differing.push(name + '/' + id);
    if (differing.length) continue;
    if (canon(toDocs(name)) !== canon(original)) { differing.push(name + ' (collection differs in value)'); continue; }
    SYNC_COLLS[name].set(fromDocs(name, JSON.parse(JSON.stringify(original)))); restored.push(name);
  }
  if (differing.length) throw new Error('startup queue holds real changes, not no-ops: ' + differing.join(', '));
  if (restored.length) { if (!persist() || SYNC.unkept) throw new Error('could not persist the realigned record'); syncStage(); }
  const left = Object.entries(SYNC.queue || {}).filter(([, q]) => Object.keys(q).length).map(([n]) => n);
  if (left.length) throw new Error('queue still holds: ' + left.join(', '));
  return {restored};
}
function applyOps(spec) {
  const dry = !!spec.dry; /* a read-only run: the harness aborts every write, so the page is told it may edit */
  if (dry) { capability = () => 'edit'; mayWrite = () => true; SYNC.readonly = false; SYNC.level = 'edit'; }
  S.operator = spec.by;
  const who = whoAmI(); if (who !== spec.by) throw new Error('whoAmI() did not return ' + spec.by);
  if (!mayWrite('an asset number')) throw new Error('mayWrite() is false - this is not an edit link');
  const $ = sel => document.querySelector(sel), out = [];
  const accOf = (ref, no, type) => (assetOf(ref).accessories || []).find(y => String(y.asset_no || '') === String(no) && (!type || y.type === type));
  for (const op of spec.ops) {
    const r = Object.assign({}, op); delete r.text;
    try {
      if (op.ref && !isRef(op.ref)) throw new Error(op.ref + ' is not a reference on the page');
      if (op.op === 'number_on') {
        const a = assetOf(op.ref); if (!a) throw new Error(op.ref + ' has no asset');
        if (assetNumbersOf(a).includes(op.no)) r.result = 'already on';
        else { const own = numberOwners(op.no, op.ref); if (own.length) throw new Error(op.no + ' is on ' + own.map(o => o.key + ' (' + o.how + ')').join(', ') + ' - not added'); numberPutOn(op.ref, op.no, who); bump(); r.result = 'put on'; }
      } else if (op.op === 'number_off') {
        const a = assetOf(op.ref); if (!a) throw new Error(op.ref + ' has no asset');
        if (!assetNumbersOf(a).includes(op.no)) r.result = 'not on it';
        else { numberTakeOff(op.ref, op.no, who); bump(); if (assetNumbersOf(assetOf(op.ref)).includes(op.no)) throw new Error(op.no + ' still shows on ' + op.ref); r.result = 'taken off'; }
      } else if (op.op === 'light') {
        const d = deliveryOf(op.ref);
        if (d.state === op.state) r.result = 'already ' + op.state;
        else { const ok = setLight(op.ref, op.state); if (!ok) throw new Error('setLight refused ' + op.ref); if (deliveryOf(op.ref).state !== op.state) throw new Error('light did not move'); r.result = 'set ' + op.state;
          if (op.at) { const dd = S.delivery[op.ref], h = dd.history && dd.history[dd.history.length - 1]; if (!h || h.state !== op.state) throw new Error('no history entry to date'); dd.set_at = op.at; h.at = op.at; if (op.why) h.note = op.why; r.result += ' at ' + op.at; } }
      } else if (op.op === 'acc_add') {
        if (accOf(op.ref, op.no)) { r.result = 'already on'; }
        else {
          openAsset(op.ref);
          const sel = $('#drawer #accType'), qty = $('#drawer #accQty'), no = $('#drawer #accNo'), desc = $('#drawer #accDesc'), add = $('#drawer #accAdd');
          if (!sel || !qty || !no || !add) throw new Error('the drawer form is not there');
          sel.value = op.type; if (sel.value !== op.type) throw new Error('the picker has no ' + op.type);
          qty.value = String(op.qty || 1); no.value = op.no; if (desc) desc.value = op.desc || '';
          add.click();
          const x = accOf(op.ref, op.no, op.type); if (!x) throw new Error('the row is not on ' + op.ref + ' after Add');
          r.result = 'added ' + op.type + ' ' + op.no + (x.qty > 1 ? ' x' + x.qty : '');
        }
      } else if (op.op === 'acc_fix') {
        const x = accOf(op.ref, op.from, op.type);
        if (!x) { if (accOf(op.ref, op.to, op.type)) r.result = 'already ' + op.to; else throw new Error('no ' + op.type + ' ' + op.from + ' on ' + op.ref); }
        else {
          openAsset(op.ref);
          const btn = document.querySelector('#drawer [data-accedit="' + CSS.escape(x._accId) + '"]'); if (!btn) throw new Error('that row has no Edit button');
          btn.click();
          const no = $('#drawer #accNo'), add = $('#drawer #accAdd'); if (!no || !add || !/Save/.test(add.textContent)) throw new Error('the drawer is not in edit mode');
          no.value = op.to; add.click();
          if (!accOf(op.ref, op.to, op.type) || accOf(op.ref, op.from, op.type)) throw new Error('the number did not change');
          r.result = 'changed ' + op.from + ' -> ' + op.to;
        }
      } else if (op.op === 'unit_reidentify') {
        const owner = op.owner || 'coates';
        const rows = () => gcModel925(assetOf(op.ref), {loading: false}).rows.filter(x => x.source !== 'history' && x.active !== false);
        const have = rows().filter(x => String(x.assetNo) === op.no);
        if (have.some(x => x.physical && x.item === op.item && x.owner === owner)) { r.result = 'already identified as ' + op.item; }
        else {
          if (typeof UnitIdentity1006 !== 'object') throw new Error('UnitIdentity1006 missing');
          have.forEach(x => { if (!x.id || x.kind !== 'unit925-record') return; const k = UnitIdentity1006.remove(op.ref, x.id, UnitIdentity1006.token(x)); if (!k || !k.ok) throw new Error(op.ref + ' take off ' + op.no + ' refused: ' + (k && k.reason)); });
          const saved = unit925Save(op.ref, {item: op.item, owner, assetNo: op.no, label: op.label || op.item, branch: '', note: op.note || '', sourceKey: ''}, '', 'null', '');
          const now = rows().find(x => String(x.assetNo) === op.no && x.item === op.item && x.owner === owner);
          if (!now) throw new Error(op.no + ' is not on ' + op.ref + ' as ' + op.item + ' after the save (' + JSON.stringify(saved).slice(0, 120) + ')');
          r.result = 'identified as ' + op.item + (now.physical ? '' : ' (not yet physical: ' + (now.identityReview || '') + ')');
        }
      } else if (op.op === 'unit_archive') {
        /* the delivered contract line joined to the reference now carries this number as the unit; the hand-made unit record for the same number is set aside (archived, who and when), as the drawer's take-off does */
        const rows = () => gcModel925(assetOf(op.ref), {loading: false}).rows.filter(x => x.source !== 'history' && x.active !== false);
        const units = rows().filter(x => String(x.assetNo) === op.no && x.kind === 'unit925-record' && x.id);
        if (!units.length) r.result = 'no unit record to set aside';
        else {
          const keep = rows().some(x => String(x.assetNo) === op.no && x.kind !== 'unit925-record'); if (!keep) throw new Error(op.ref + ' would be left with no row for ' + op.no + ' - not set aside');
          units.forEach(x => { const k = UnitIdentity1006.remove(op.ref, x.id, UnitIdentity1006.token(x)); if (!k || !k.ok) throw new Error(op.ref + ' set aside ' + op.no + ' refused: ' + (k && k.reason)); });
          const left = rows().filter(x => String(x.assetNo) === op.no); if (!left.length || left.some(x => x.kind === 'unit925-record')) throw new Error('rows after: ' + JSON.stringify(left).slice(0, 200));
          r.result = 'unit record set aside; ' + left.length + ' row left (' + left.map(x => x.item + (x.physical ? '' : ' not physical: ' + x.identityReview)).join(', ') + ')';
        }
      } else if (op.op === 'number_item') {
        const ok = setNumberItem(op.ref, op.no, op.item); if (ok === false) throw new Error('setNumberItem refused ' + op.ref + ' ' + op.no);
        const cur = typeof numberItemOf === 'function' ? numberItemOf(assetOf(op.ref), op.no) : null; r.result = 'counts as ' + (cur || op.item);
      } else if (op.op === 'fire_ext') { /* 20 Oct: fire extinguishers attached through the page's own fire914Save */
        if (fire914Qty(op.ref) >= op.qty) r.result = 'already ' + fire914Qty(op.ref);
        else { const ok = fire914Save(op.ref, op.qty); if (ok === false) throw new Error('fire914Save refused ' + op.ref); if (fire914Qty(op.ref) !== op.qty) throw new Error(op.ref + ' fire extinguishers did not take'); r.result = 'fire extinguishers ' + op.qty; }
      } else if (op.op === 'item_type') { /* v20 Oct: the reference's item type through the page's own setItemType */
        const ok = setItemType(op.ref, op.item); if (ok === false) throw new Error('setItemType refused ' + op.ref + ' ' + op.item + ' (or it already reads that)');
        r.result = 'item type ' + ((S.items || {})[op.ref] || op.item);
      } else if (op.op === 'complete') {
        if (deliveryOf(op.ref).done) r.result = 'already complete';
        else { if (deliveryOf(op.ref).state !== 'on site') throw new Error(op.ref + ' is not on site'); const ok = setDone(op.ref, true); if (ok === false) throw new Error('setDone refused ' + op.ref); if (!deliveryOf(op.ref).done) throw new Error(op.ref + ' did not complete'); r.result = 'complete'; }
      } else if (op.op === 'note_replace') {
        /* one sentence of the delivery note corrected in place; the rest of the note kept word for word */
        const cur = String(deliveryOf(op.ref).note || '');
        if (!cur.includes(op.old)) { if (cur.includes(op.new)) r.result = 'note already corrected'; else throw new Error(op.ref + ' note does not hold the text to correct'); }
        else { const ok = setDeliveryNote(op.ref, cur.replace(op.old, op.new)); if (ok === false) throw new Error('setDeliveryNote refused ' + op.ref); const now = String(deliveryOf(op.ref).note || ''); if (now.includes(op.old) || !now.includes(op.new)) throw new Error(op.ref + ' note did not take'); r.result = 'note corrected'; }
      } else if (op.op === 'unit_archive_wrong') {
        /* a unit record typed with the wrong number for a board the reference already carries under its right number: set
           aside (archived, who and when, photos and history kept), as the drawer's take-off does */
        const rows = () => gcModel925(assetOf(op.ref), {loading: false}).rows.filter(x => x.source !== 'history' && x.active !== false);
        const wrong = rows().filter(x => String(x.assetNo) === op.no && x.kind === 'unit925-record' && x.id);
        if (!rows().some(x => String(x.assetNo) === op.keep)) throw new Error(op.ref + ' carries no ' + op.keep + ' - not set aside');
        if (!wrong.length) r.result = 'no unit record for ' + op.no;
        else {
          wrong.forEach(x => { const k = UnitIdentity1006.remove(op.ref, x.id, UnitIdentity1006.token(x)); if (!k || !k.ok) throw new Error(op.ref + ' set aside ' + op.no + ' refused: ' + (k && k.reason)); });
          if (rows().some(x => String(x.assetNo) === op.no)) throw new Error(op.no + ' still on ' + op.ref);
          r.result = op.no + ' set aside; ' + op.keep + ' stays';
        }
      } else if (op.op === 'scope_refresh') {
        /* the page keeps a received/installed baseline from the last quantity edit (Scope1017); a receipt recorded after the
           last complete tick falls back to that baseline. Editing the quantity is the page's own way to take a new baseline:
           one above the schedule's, then back to the schedule's own - the quantity ends as it began */
        const a = assetOf(op.ref), sched = a && a._qtyOnTheSchedule; if (!Number.isInteger(sched)) throw new Error(op.ref + ' has no schedule quantity');
        if ((S.qtys || {})[op.ref] != null) throw new Error(op.ref + ' carries a typed quantity - not refreshed');
        const before = typeof Scope1017 === 'object' && Scope1017.record ? JSON.stringify(Scope1017.record(a)) : null;
        if (setQty(op.ref, String(sched + 1)) === false) throw new Error('setQty refused ' + op.ref + ' ' + (sched + 1));
        if (setQty(op.ref, '') === false) throw new Error('setQty refused ' + op.ref + ' back to the schedule');
        if ((S.qtys || {})[op.ref] != null) throw new Error(op.ref + ' quantity did not go back to the schedule');
        const now = Scope1017.record(a); if (!now || JSON.stringify(now) === before) throw new Error(op.ref + ' baseline did not refresh');
        r.result = 'baseline refreshed: ' + now.items.map(i => i.item + ' ' + i.received + ' received / ' + i.installed + ' installed').join(', ');
      } else if (op.op === 'complete_again') {
        /* Complete pressed again on a reference already complete: the page then counts every unit received so far as installed
           (Scope1017: a newer complete tick installs what has arrived) */
        const d0 = deliveryOf(op.ref); if (d0.state !== 'on site') throw new Error(op.ref + ' is not on site'); if (!d0.done) throw new Error(op.ref + ' is not complete yet - use complete');
        const was = d0.done_at; const ok = setDone(op.ref, true); if (ok === false) throw new Error('setDone refused ' + op.ref);
        const d1 = deliveryOf(op.ref); if (!d1.done || d1.done_at === was) throw new Error(op.ref + ' complete did not take again');
        r.result = 'complete again (was ' + was + ')';
      } else if (op.op === 'labour_on') {
        const k = labourKey(op.ref, op.disc, op.item, op.line, op.unit);
        if (labourTicked(op.ref, op.disc, op.item, op.line, op.unit, assetOf(op.ref))) r.result = 'already on';
        else { const ok = setLabour(op.ref, op.disc, op.item, op.line, true, op.unit); if (ok === false) throw new Error('setLabour refused ' + k); if (!labourTicked(op.ref, op.disc, op.item, op.line, op.unit, assetOf(op.ref))) throw new Error(k + ' did not tick'); r.result = 'ticked'; }
      } else if (op.op === 'labour_off') {
        const k = labourKey(op.ref, op.disc, op.item, op.line, op.unit);
        if (!labourTicked(op.ref, op.disc, op.item, op.line, op.unit, assetOf(op.ref))) r.result = 'already off';
        else { const ok = setLabour(op.ref, op.disc, op.item, op.line, false, op.unit); if (ok === false) throw new Error('setLabour refused ' + k); if (labourTicked(op.ref, op.disc, op.item, op.line, op.unit, assetOf(op.ref))) throw new Error(k + ' still ticked'); r.result = 'taken off'; }
      } else if (op.op === 'door') {
        const a = assetOf(op.ref), now = loading872Side(a, op.id);
        if (now === op.side) r.result = 'already ' + op.side; else { loading872Set(op.ref, op.id, op.side); if (loading872Side(assetOf(op.ref), op.id) !== op.side) throw new Error(op.ref + ' ' + op.id + ' door side not held'); r.result = 'door side ' + op.side; }
      } else if (op.op === 'supplied') {
        const ok = setSupplied(op.ref, op.item, {supplied: op.item, qty_supplied: op.qty}); if (ok === false) throw new Error('setSupplied refused ' + op.ref);
        const it = (((S.supplied || {})[op.ref] || {}).items || []).find(x => x.asked === op.item); if (!it || it.qty_supplied !== op.qty) throw new Error(op.ref + ' supplied did not take');
        r.result = op.item + ' supplied ' + op.qty;
      } else if (op.op === 'vms_fleet') {
        if (!vms913Boards().some(b => b.key === op.key)) throw new Error('no VMS board ' + op.key);
        const ok = vms913Save(op.key, null, op.fleet, null, null, {fleet: true}, true);
        if (!ok) throw new Error('vms913Save refused ' + op.key + ': ' + ((typeof vms913St === 'function' && vms913St().said) || ''));
        const r3 = (S.vmsboard || {})[op.key], shown = vms913Of(vms913Boards().find(b => b.key === op.key)).fleet;
        /* a number equal to the contract line's is not stored over it: the record's own field clears and the contract's shows */
        if (shown !== op.fleet || (r3 && r3.fleet != null && r3.fleet !== op.fleet)) throw new Error(op.key + ' fleet did not take (shows ' + shown + ')');
        Object.assign(r, {result: 'fleet saved', doc: JSON.parse(JSON.stringify(r3))});
      } else if (op.op === 'vms_rego') {
        if (typeof vms913Save !== 'function' || typeof vms913Boards !== 'function') throw new Error('the VMS register is not on this page');
        if (!vms913Boards().some(b => b.key === op.key)) throw new Error('no VMS board ' + op.key + ' on the register');
        const ok = vms913Save(op.key, null, null, op.rego, null, {rego: true}, true);
        if (!ok) throw new Error('vms913Save refused ' + op.key + ': ' + ((typeof vms913St === 'function' && vms913St().said) || ''));
        const rr = r, r2 = (S.vmsboard || {})[op.key]; if (!r2 || r2.rego !== op.rego) throw new Error(op.key + ' rego did not take');
        Object.assign(rr, {key: op.key, rego: op.rego, result: 'rego saved', doc: JSON.parse(JSON.stringify(r2))});
      } else if (op.op === 'vms_board') {
        /* one save of the register form: fleet, rego and the delivery the board is on; the company stays as the contract names it */
        if (!vms913Boards().some(b => b.key === op.key)) throw new Error('no VMS board ' + op.key + ' on the register');
        const ok = vms913Save(op.key, null, op.fleet, op.rego, op.on, {fleet: true, rego: true, on: true}, true);
        if (!ok) throw new Error('vms913Save refused ' + op.key + ': ' + ((typeof vms913St === 'function' && vms913St().said) || ''));
        const r4 = (S.vmsboard || {})[op.key], shownFleet = vms913Of(vms913Boards().find(b => b.key === op.key)).fleet; /* a fleet equal to the board's own number is not stored - the page shows it from the board */
        if (!r4 || !(r4.fleet === op.fleet || (r4.fleet == null && shownFleet === op.fleet)) || r4.rego !== op.rego || r4.on !== op.on) throw new Error(op.key + ' did not take: ' + JSON.stringify(r4));
        Object.assign(r, {result: 'board saved', doc: JSON.parse(JSON.stringify(r4))});
      } else if (op.op === 'note_append') {
        const cur = String(deliveryOf(op.ref).note || '');
        if (cur.includes(op.text)) r.result = 'note already says it';
        else { const ok = setDeliveryNote(op.ref, (cur ? cur + ' ' : '') + op.text); if (ok === false) throw new Error('setDeliveryNote refused ' + op.ref); if (!String(deliveryOf(op.ref).note || '').endsWith(op.text)) throw new Error(op.ref + ' note did not take'); r.result = 'note added to'; }
      } else if (op.op === 'spare_use') {
        const s = (S.spares || {})[op.id]; if (!s) throw new Error('spare ' + op.id + ' is not in spares');
        if (String(s.no || '') !== op.no) throw new Error('spare ' + op.id + ' is ' + s.no + ', not ' + op.no);
        if (spareUse(op.id, op.ref) !== true) throw new Error('spareUse refused ' + op.no + ' onto ' + op.ref);
        if ((S.spares || {})[op.id]) throw new Error(op.no + ' is still in spares');
        if (!subOf(op.ref).some(x => String(x.no) === op.no)) throw new Error(op.ref + ' does not carry ' + op.no + ' after spareUse');
        r.result = op.no + ' (' + s.co + ') out of spares and onto ' + op.ref;
      } else if (op.op === 'steps_off') {
        /* 22 Oct 2026: the drawer's own Steps tick taken off (setSteps(ref, false)): the building has no steps, so the record must not say steps were installed */
        const d0 = deliveryOf(op.ref);
        if (!d0.steps) r.result = 'steps already off';
        else { const ok = setSteps(op.ref, false); if (ok === false) throw new Error('setSteps refused ' + op.ref); if (deliveryOf(op.ref).steps) throw new Error(op.ref + ' still carries steps'); r.result = 'steps off'; }
      } else if (op.op === 'vms_inplace' || op.op === 'vms_complete') {
        /* 22 Oct 2026: the VMS register's own in-place tick and complete tick (the arrival record the Today count reads), exactly as an
           editor ticking the board's card on the VMS plan: VMS1024.write(pos, {inPlace:true}) -> VMSArrival1098.prepare writes the
           arrival (on site, today) and its event; VMSArrival1098.setComplete(pos, true) writes the completion event */
        if (typeof VMS1024 !== 'object' || typeof VMS1024.write !== 'function' || typeof VMSArrival1098 !== 'object') throw new Error('the VMS plan is not on this page');
        const bd = VMS1024.board(op.pos); if (!bd) throw new Error('no VMS plan position ' + op.pos);
        if ((bd.board || bd.default_board) !== op.board) throw new Error('position ' + op.pos + ' carries ' + (bd.board || bd.default_board) + ', not ' + op.board);
        if (bd.canonicalIdentityConflict1103) throw new Error(op.board + ' has an identity conflict - not written');
        const st0 = VMSArrival1098.status(op.board) || {};
        if (op.op === 'vms_inplace') {
          if (st0.on && st0.evidence && st0.evidence.inPlace) r.result = 'already on site and in place';
          else { if (!VMS1024.write(op.pos, {inPlace: true}, 'the in-place tick')) throw new Error('VMS1024.write refused the in-place tick for ' + op.pos);
            const st1 = VMSArrival1098.status(op.board) || {}; if (!st1.on || !(st1.evidence && st1.evidence.inPlace && st1.evidence.state === 'on site')) throw new Error(op.board + ' did not come on site');
            r.result = 'on site and in place (' + (st1.evidence && st1.evidence.effectiveDate) + ')'; }
        } else {
          if (st0.done) r.result = 'already complete';
          else { if (!VMSArrival1098.setComplete(op.pos, true)) throw new Error('setComplete refused ' + op.pos);
            const st1 = VMSArrival1098.status(op.board) || {}; if (!st1.done) throw new Error(op.board + ' did not complete'); r.result = 'complete'; }
        }
      } else if (op.op === 'vms_plan') {
        if (typeof VMS1024 !== 'object' || typeof VMS1024.setPosition !== 'function') throw new Error('the VMS plan is not on this page');
        if (!VMS1024.setPosition(op.pos, op.lat, op.lon, op.how)) throw new Error('setPosition refused ' + op.pos);
        const R = VMS1024.rec(op.pos) || {}; if (R.lat !== op.lat || R.lon !== op.lon) throw new Error(op.pos + ' did not take the position');
        r.result = 'VMS plan ' + op.pos + ' pinned at ' + op.lat + ', ' + op.lon;
      } else if (op.op === 'sub_move') {
        /* a sub-hire unit from one reference to another: the drawer's own take-off on the first, the put-on on the second */
        if (op.from && !isRef(op.from)) throw new Error(op.from + ' is not a reference on the page');
        if (op.to && !isRef(op.to)) throw new Error(op.to + ' is not a reference on the page');
        const u = unitsOf(op.from).find(x => String(x.asset_no || '') === op.no); if (!u) throw new Error(op.no + ' is not on ' + op.from);
        if (!/^Sub-hire:/i.test(String(u.label || ''))) throw new Error(op.no + ' on ' + op.from + ' is not a sub-hire unit (' + u.label + ')');
        if (!unitRemove(op.from, {asset_no: op.no})) throw new Error('unitRemove refused ' + op.no + ' on ' + op.from);
        if (!invPutOn(op.to, op.co, op.no, who)) throw new Error('invPutOn refused ' + op.no + ' onto ' + op.to);
        if (unitsOf(op.from).some(x => String(x.asset_no || '') === op.no)) throw new Error(op.no + ' still on ' + op.from);
        if (!subOf(op.to).some(x => String(x.no) === op.no)) throw new Error(op.to + ' does not carry ' + op.no);
        r.result = op.no + ' (' + op.co + ') moved from ' + op.from + ' to ' + op.to;
      } else if (op.op === 'place') {
        const P = placeHere(op.ref, op.lat, op.lon, {how: op.how, source: op.source || null, note: op.note || null});
        if (!P || P.lat !== op.lat || P.lon !== op.lon) throw new Error('placeHere refused ' + op.ref);
        r.result = op.ref + ' placed at ' + op.lat + ', ' + op.lon + (P.outside ? ' (' + P.outside + (P.away_m != null ? ', ' + P.away_m + ' m from the drawings' : '') + ')' : '');
      } else if (op.op === 'set_qty') {
        const cur = ((S.qtys || {})[op.ref]);
        const ok = setQty(op.ref, op.qty === '' ? '' : String(op.qty)); if (ok === false) throw new Error('setQty refused ' + op.ref);
        r.result = 'quantity ' + JSON.stringify(cur && cur.v !== undefined ? cur.v : cur) + ' -> ' + (op.qty === '' ? "the schedule's own" : op.qty);
      } else if (op.op === 'answer') {
        /* the note lives under the question's note id (its words less the figures), so it survives the counts changing */
        if (!applyOps.QL) applyOps.QL = typeof questionsList === 'function' ? questionsList() : []; /* computed once: it is a heavy read */
        const q = applyOps.QL.find(x => x.id === op.id); const nid = q ? (q.noteId || q.id) : op.id; r.noteId = nid;
        if (qAnswer(nid) === op.text) r.result = 'already noted';
        else { const kept = setQAnswer(nid, op.text); if (kept === false) throw new Error('setQAnswer refused ' + nid); if (qAnswer(nid) !== op.text) throw new Error('note not held'); r.result = 'noted under ' + nid; }
      } else throw new Error('unknown op ' + op.op);
    } catch (e) { r.result = 'ERROR: ' + e.message; r.error = true; }
    out.push(r);
  }
  const bad = out.filter(r => r.error);
  if (bad.length) throw new Error(bad.length + ' op(s) failed - nothing sent: ' + bad.map(r => r.op + ' ' + (r.ref || r.id) + ' ' + (r.no || r.to || '') + ': ' + r.result).join(' | '));
  if (typeof save === 'function') save();
  if (dry) { SYNC.readonly = false; SYNC.level = 'edit'; syncSend(); } /* the dry run sends NOW, inside the poll window, so the aborted PUT is seen */
  return out;
}

// ---------------------------------------------------------------------------------------------- the run
(async () => {
  let browser = null, tempPage = null; const started = utc(); let exitCode = 0;
  try {
    log(`dockets_fill ${applying ? 'APPLY' : 'DRY RUN'} - ${spec.ops.length} op(s) on ${REFS.join(', ')}${QIDS.length ? ' and notes on ' + QIDS.join(', ') : ''} - by ${spec.by}`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    if (applying) { const bk = path.join(HERE, 'backup_state_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1) + '\n', {mode: 0o600}); log('backup of the whole record before: ' + bk); }
    for (const k of REFS) { const bd = (before.docs.delivery || {})[k] || null, bn = (before.docs.assetNumbers || {})[k] || null; log(`  ${k}: delivery ${JSON.stringify(bd && {state: bd.state, done: bd.done ?? null})} · assetNumbers ${JSON.stringify(bn && bn.v)} · accessories ${JSON.stringify((((before.docs.accessories || {})[k] || {}).v || []).map(x => x.type + ':' + (x.asset_no || '-')))}`); }
    for (const id of QIDS) log(`  note ${id}: ${JSON.stringify(((before.docs.answers || {})[id] || {}).v ?? null)}`);

    let page, harness = null;
    const counts = {blocked: 0, mapSessions: 0}, refused = [], sent = new Set(), acks = new Map(); let writesAllowed = false, expected = new Map(), fatal = null, injected = false;
    const stop = m => { writesAllowed = false; if (!fatal) fatal = new Error(redact(m)); };

    if (applying) {
      if (!token) fail('GC500_EDIT_TOKEN is not set - nothing applied');
      if (!/^[a-f0-9]{64}$/.test(expectedSha)) fail('GC500_EXPECTED_PAGE_SHA must be the 64-hex sha256 of the public page the operator reviewed');
      const live = await curlGet(HOST + '/v/' + VIEW_TOKEN, {'cache-control': 'no-cache'});
      if (live.status !== 200) fail('public page answered ' + live.status);
      const got = sha256(live.body);
      if (got !== expectedSha) fail('the public page is ' + got + ', not the reviewed ' + expectedSha + ' - nothing applied');
      log(`public page sha256 ${got} matches (${live.body.length} bytes)`);
      const {chromium} = playwright();
      const launch = {args: ['--no-sandbox', '--lang=en-AU']}; if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
      browser = await chromium.launch(launch);
      const ctx = await browser.newContext({viewport: {width: 1280, height: 900}, locale: 'en-AU', timezoneId: 'Australia/Brisbane'});
      page = await ctx.newPage();
      page.on('pageerror', e => stop('page error: ' + e.message));
      await ctx.route('**/*', async route => {
        const req = route.request(), url = req.url(), method = req.method();
        if (url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
        let u; try { u = new URL(url); } catch (_) { return route.abort(); }
        if (method === 'GET') {
          if (u.origin === HOST && u.pathname === '/api/state' && !injected) { injected = true; try { await page.evaluate(holdSender); } catch (e) { stop('could not hold the page sender: ' + e.message); return route.abort(); } }
          return route.continue();
        }
        if (method === 'POST' && u.origin === 'https://tile.googleapis.com' && u.pathname === '/v1/createSession') { counts.mapSessions++; return route.abort(); }
        const m = u.origin === HOST && u.pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/);
        if (!m || (method !== 'PUT' && method !== 'DELETE')) { counts.blocked++; refused.push({method, path: u.pathname}); stop('unexpected write ' + method + ' ' + u.pathname); return route.abort(); }
        const key = decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]);
        if (method === 'DELETE' && expected.get(key) !== 'null') { counts.blocked++; refused.push({method, key}); stop('removal outside the plan: ' + key); return route.abort(); }
        let body = null; try { body = method === 'DELETE' ? null : JSON.parse(req.postData() || 'null'); } catch (_) { body = undefined; }
        if (!writesAllowed || !expected.has(key) || canon(body) !== expected.get(key)) { counts.blocked++; refused.push({method, key}); stop('write outside the plan: ' + key); return route.abort(); }
        if (sent.has(key)) { counts.blocked++; refused.push({method, key, retry: true}); stop('automatic retry refused: ' + key); return route.abort(); }
        sent.add(key); return route.continue();
      });
      page.on('response', r => { const q = r.request(); if (q.method() !== 'PUT' && q.method() !== 'DELETE') return; const m = new URL(r.url()).pathname.match(/^\/api\/doc\/([^/]+)\/([^/]+)$/); if (m) acks.set(decodeURIComponent(m[1]) + '/' + decodeURIComponent(m[2]), r.status()); });
      await page.goto(HOST + '/e/' + token + '#plant', {waitUntil: 'load', timeout: 180000});
    } else {
      let pageFile = argValue('--page') || process.env.PAGE || null;
      if (!pageFile) {
        pageFile = tempPage = path.join(os.tmpdir(), 'gc500-live-page-' + process.pid + '.html');
        const live = await curlGet(HOST + '/v/' + VIEW_TOKEN, {'cache-control': 'no-cache'});
        if (live.status !== 200) fail('public page answered ' + live.status);
        fs.writeFileSync(pageFile, live.body); log(`dry run page: the live page fetched now (${live.body.length} bytes, sha256 ${sha256(live.body)})`);
      } else log(`dry run page: ${pageFile} (${fs.statSync(pageFile).size} bytes, sha256 ${sha256(fs.readFileSync(pageFile))})`);
      const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
      harness = await open({pageFile, hash: '#plant'}); browser = harness.browser; page = harness.page;
    }

    await page.waitForFunction(pageReady, null, {timeout: 180000});
    if (fatal) throw fatal;
    const controls = await page.evaluate(pageHasControls);
    if (controls.missing.length || !controls.hasS || !controls.hasColls) fail('page controls missing: ' + controls.missing.join(', '));
    log(`page live: level ${controls.level}, readonly ${controls.readonly}`);
    const pageBefore = await page.evaluate(pageSnapshot, {refs: REFS, qids: QIDS});
    const pageDocsBefore = await page.evaluate(pageDocs);
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    for (const k of REFS) { if (!pageBefore.refs[k]) fail(k + ' is not an asset on the page'); log(`  page before: ${k} numbers ${JSON.stringify(pageBefore.refs[k].numbers)} · light ${pageBefore.refs[k].light}, complete ${pageBefore.refs[k].done} · accessories ${JSON.stringify(pageBefore.refs[k].accessories)}`); }

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const aligned = await page.evaluate(alignStartupQueue, before.docs);
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {ops: spec.ops, by: spec.by, dry: !applying}).catch(e => fail('stage: ' + e.message));
    results.forEach(r => { if (r.noteId) NOTE_IDS.add(r.noteId); });
    results.forEach(r => log(`stage: ${r.op} ${r.ref || r.id} ${r.no || (r.from ? r.from + '->' + r.to : '') || r.state || r.type || ''} - ${r.result}`));
    /* 21 Oct: the derived Today figure the ops are meant to move, read from the page's own summary after the stage */
    try { const eq = await page.evaluate(() => { const s = todayWorkSummary848(todayIso()); const out = {}; for (const id in s.byId) { const a = s.byId[id]; if (id !== 'fencing') out[id] = a.done + '/' + a.total + ' ' + (a.pct == null ? '?' : Math.round(a.pct * 100) / 100) + '%'; } return out; });
      log('Today groups after the stage: ' + JSON.stringify(eq)); } catch (e) { log('Today groups after the stage: not read (' + e.message + ')'); }
    const pageAfter = await page.evaluate(pageSnapshot, {refs: REFS, qids: QIDS});
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k, pageDocsAfter[k.slice(0, k.indexOf('/'))][k.slice(k.indexOf('/') + 1)], pageDocsAfter));
    log(`documents changed on the page: ${changed.length} (${changed.join(', ')})`);
    if (outside.length) fail('the stage changed documents outside the plan: ' + outside.join(', ') + ' - nothing sent');
    for (const k of changed) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1);
      if (pageDocsAfter[c][id] == null) { if ((spec.allowRemove || []).includes(k)) { expected.set(k, 'null'); log('plan removes ' + k + ' (named in the spec: ' + (spec.allowRemoveWhy || '') + ')'); continue; } if (c === 'assetNumbers' && REFS.includes(id) && spec.ops.some(o => o.op === 'number_off' && o.ref === id)) { expected.set(k, 'null'); log('plan removes ' + k + ' (its last typed number came off, as the drawer does)'); continue; } fail('plan would REMOVE ' + k + ' - refused'); }
      expected.set(k, canon(pageDocsAfter[c][id])); }
    const checkDocs = (docs, where) => { const problems = []; const numsOf = k => (((docs.assetNumbers || {})[k] || {}).v) || []; const dead = k => (docs.deleted || {})[k] != null && (docs.deleted || {})[k] !== undefined;
      for (const op of spec.ops) {
        if (op.op === 'number_on' && !numsOf(op.ref).includes(op.no) && !(pageBefore.refs[op.ref].numbers.includes(op.no))) problems.push(op.ref + ' does not carry ' + op.no + ' ' + where);
        if (op.op === 'number_off' && numsOf(op.ref).includes(op.no)) problems.push(op.ref + ' still carries ' + op.no + ' ' + where);
        if (op.op === 'light' && op.at && (((docs.delivery || {})[op.ref] || {}).set_at) !== op.at) problems.push(op.ref + ' light not dated ' + op.at + ' ' + where);
        if (op.op === 'light' && (((docs.delivery || {})[op.ref] || {}).state) !== op.state) problems.push(op.ref + ' light is not ' + op.state + ' ' + where);
        if (op.op === 'acc_add' && !((((docs.accessories || {})[op.ref] || {}).v) || []).some(x => String(x.asset_no || '') === op.no && x.type === op.type)) problems.push(op.ref + ' has no ' + op.type + ' ' + op.no + ' ' + where);
        if (op.op === 'acc_fix') { const v = (((docs.accessories || {})[op.ref] || {}).v) || []; if (!v.some(x => String(x.asset_no || '') === op.to && x.type === op.type) || v.some(x => String(x.asset_no || '') === op.from)) problems.push(op.ref + ' ' + op.type + ' is not ' + op.to + ' ' + where); }
        if (op.op === 'answer') { const nid = (results.find(x => x.op === 'answer' && x.id === op.id) || {}).noteId || op.id; if ((((docs.answers || {})[nid] || {}).v) !== op.text) problems.push('note ' + nid + ' is not held ' + where); }
        if (op.op === 'unit_reidentify' && !Object.values(docs.loads || {}).some(u => u && u.kind === 'unit925-record' && u.ref === op.ref && String(u.assetNo) === op.no && u.item === op.item && u.active !== false && !u.removedBy)) problems.push(op.ref + ' has no active ' + op.item + ' unit ' + op.no + ' ' + where);
        if (op.op === 'unit_archive' && Object.values(docs.loads || {}).some(u => u && u.kind === 'unit925-record' && u.ref === op.ref && String(u.assetNo) === op.no && u.active !== false && !u.removedBy)) problems.push(op.ref + ' still has an active unit record for ' + op.no + ' ' + where);
        if (op.op === 'labour_off' && (docs.labour || {})[((op.unit ? op.ref + '/u' + op.unit.replace(/^u/, '') : op.ref) + '|' + op.disc + '|' + op.item + '|' + op.line).replace(/\//g, '~2f~').replace(/\|/g, '~7c~').replace(/ /g, '~20~').replace(/&/g, '~26~')]) problems.push(op.ref + ' ' + op.unit + ' ' + op.line + ' still ticked ' + where);
        if (op.op === 'note_replace') { const n = String(((docs.delivery || {})[op.ref] || {}).note || ''); if (n.includes(op.old) || !n.includes(op.new)) problems.push(op.ref + ' note not corrected ' + where); }
        if (op.op === 'unit_archive_wrong' && Object.values(docs.loads || {}).some(u => u && u.kind === 'unit925-record' && u.ref === op.ref && String(u.assetNo) === op.no && u.active !== false && !u.removedBy)) problems.push(op.ref + ' still has an active unit record for ' + op.no + ' ' + where);
        if (op.op === 'scope_refresh' && ((docs.qtys || {})[op.ref] || {}).v != null) problems.push(op.ref + ' carries a typed quantity ' + where);
        if (op.op === 'complete_again' && (((docs.delivery || {})[op.ref] || {}).done) !== true) problems.push(op.ref + ' not complete ' + where);
        if (op.op === 'complete' && (((docs.delivery || {})[op.ref] || {}).done) !== true) problems.push(op.ref + ' not complete ' + where);
        if (op.op === 'labour_on' && (((docs.labour || {})[((op.unit ? op.ref + '/u' + op.unit.replace(/^u/, '') : op.ref) + '|' + op.disc + '|' + op.item + '|' + op.line).replace(/\//g, '~2f~').replace(/\|/g, '~7c~').replace(/ /g, '~20~').replace(/&/g, '~26~')] || {}).v) !== true) problems.push(op.ref + ' ' + op.unit + ' ' + op.line + ' not ticked ' + where);
        if (op.op === 'fire_ext') { const raw = (docs.accessories || {})[op.ref]; const list = Array.isArray(raw) ? raw : (raw && (raw.v || raw.rows || raw.items)) || []; const q = (Array.isArray(list) ? list : []).filter(x => x && x.type === 'Fire extinguisher').reduce((n, x) => n + (Number(x.qty) > 0 ? Number(x.qty) : 0), 0); if (q < op.qty) problems.push(op.ref + ' has ' + q + ' fire extinguisher(s), not ' + op.qty + ' ' + where); }
        if (op.op === 'item_type') { const iv = ((docs.items || {})[op.ref]); if (!iv || (typeof iv === 'object' ? iv.v : iv) !== op.item) problems.push(op.ref + ' item type is not ' + op.item + ' ' + where); }
        if (op.op === 'supplied' && !((((docs.supplied || {})[op.ref] || {}).items) || []).some(x => x.asked === op.item && x.qty_supplied === op.qty)) problems.push(op.ref + ' supplied is not ' + op.qty + ' ' + where);
        if (op.op === 'vms_fleet' && ![op.fleet, null, undefined].includes((((docs.vmsboard || {})[op.key]) || {}).fleet)) problems.push(op.key + ' fleet is not ' + op.fleet + ' ' + where);
        if (op.op === 'vms_rego' && ((((docs.vmsboard || {})[op.key]) || {}).rego) !== op.rego) problems.push(op.key + ' rego is not ' + op.rego + ' ' + where);
        if (op.op === 'steps_off' && (((docs.delivery || {})[op.ref] || {}).steps) !== false) problems.push(op.ref + ' still carries steps ' + where);
        if (op.op === 'vms_inplace') { const L = (docs.loads || {})['vms1024~2f~' + op.pos] || {}; const ev = (L.events1098 || []).slice(-1)[0] || L.arrival1098; if (!(L.inPlace === true && ev && ev.state === 'on site')) problems.push(op.board + ' is not on site and in place ' + where); }
        if (op.op === 'vms_complete') { const L = (docs.loads || {})['vms1024~2f~' + op.pos] || {}; const ce = (L.completionEvents1101 || []).slice(-1)[0] || L.completion1101; if (!(ce && ce.done === true)) problems.push(op.board + ' is not complete ' + where); }
        if (op.op === 'vms_plan') { const L = (docs.loads || {})['vms1024~2f~' + op.pos] || {}; if (L.lat !== op.lat || L.lon !== op.lon) problems.push('VMS plan ' + op.pos + ' is not at ' + op.lat + ', ' + op.lon + ' ' + where); }
        if (op.op === 'vms_board') { const vb = (((docs.vmsboard || {})[op.key]) || {}); if (![op.fleet, null, undefined].includes(vb.fleet) || vb.rego !== op.rego || vb.on !== op.on) problems.push(op.key + ' is not ' + op.fleet + '/' + op.rego + ' on ' + op.on + ' ' + where); }
        if (op.op === 'note_append' && !String(((docs.delivery || {})[op.ref] || {}).note || '').includes(op.text)) problems.push(op.ref + ' note lacks the added text ' + where);
        if (op.op === 'spare_use' && (docs.spares || {})[op.id]) problems.push(op.no + ' still in spares ' + where);
        if (op.op === 'sub_move') { const has = r => (((docs.units || {})[r] || {}).units || []).some(u => String(u.asset_no || '') === op.no); if (has(op.from) || !has(op.to)) problems.push(op.no + ' is not moved from ' + op.from + ' to ' + op.to + ' ' + where); }
        if (op.op === 'place') { const D = (docs.places || {})[op.ref] || {}, P = D.v || D; /* a value-kind collection: the document holds {v} */ if (P.lat !== op.lat || P.lon !== op.lon) problems.push(op.ref + ' is not placed at ' + op.lat + ', ' + op.lon + ' ' + where); }
        if (op.op === 'set_qty' && op.qty !== '' && ((((docs.qtys || {})[op.ref] || {}).v)) !== op.qty) problems.push(op.ref + ' quantity is not ' + op.qty + ' ' + where);
      } return problems; };
    const stageProblems = checkDocs(pageDocsAfter, 'after the stage'); if (stageProblems.length) fail(stageProblems.join(' | '));
    for (const k of REFS) log(`  page after: ${k} numbers ${JSON.stringify(pageAfter.refs[k].numbers)} · light ${pageAfter.refs[k].light}, complete ${pageAfter.refs[k].done} · accessories ${JSON.stringify(pageAfter.refs[k].accessories)}`);
    const queued = Object.entries(pageAfter.queue).flatMap(([c, q]) => Object.keys(q).map(id => c + '/' + id));
    const unexpectedQueue = queued.filter(k => !expected.has(k) || !same(pageAfter.queue[k.slice(0, k.indexOf('/'))][k.slice(k.indexOf('/') + 1)], JSON.parse(expected.get(k))));
    if (applying && unexpectedQueue.length) fail('the page queued writes outside the plan: ' + unexpectedQueue.join(', ') + ' - nothing sent');

    if (!applying) {
      await new Promise(r => setTimeout(r, 1500));
      const blockedAfter = harness.counts.blocked, blockedMap = harness.counts.blockedMapSessions || 0;
      log(`writes the page tried: ${blockedAfter - blockedBefore} new aborted non-GET request(s) after the stage (aborted total ${blockedAfter}${blockedMap ? ', map sessions ' + blockedMap : ''}); page errors: ${harness.errors.length}`);
      log(`plan --apply would send (${expected.size}): ${[...expected.keys()].join(', ')}`);
      if (blockedAfter <= blockedBefore) fail('the page did not attempt a write after the stage - the dry run cannot confirm the write path');
      if (harness.errors.length) fail('page errors: ' + harness.errors.join(' | '));
      log('DRY RUN PASSED - nothing reached the service');
      return;
    }

    // ---------------------------------------------------------------------------------------- APPLY: release exactly the planned writes
    if (!same((await publicState()).docs, before.docs)) fail('the record changed before release - nothing sent');
    if (fatal) throw fatal;
    writesAllowed = true;
    await page.evaluate(releaseSender);
    const deadline = Date.now() + 90000;
    for (;;) {
      if (fatal) throw fatal;
      const st = await page.evaluate(() => ({status: SYNC.status, unkept: !!SYNC.unkept, waiting: syncWaiting(), queueEmpty: Object.keys(SYNC.queue || {}).every(k => !Object.keys(SYNC.queue[k]).length), inflight: Object.keys(SYNC.inflight || {}).length}));
      if (st.unkept || ['offline', 'unreachable', 'error', 'stopped', 'paused', 'revoked'].includes(st.status)) fail('sync is ' + st.status + (st.unkept ? ' (unkept)' : '') + ' - inspect the service before any retry');
      if (st.queueEmpty && !st.inflight && st.waiting === 0 && [...expected.keys()].every(k => acks.get(k) === 200 || (expected.get(k) === 'null' && acks.get(k) === 204))) break;
      if (Date.now() > deadline) fail('the writes did not settle in 90 s (acknowledged: ' + [...acks.entries()].map(([k, s]) => k + '=' + s).join(', ') + ') - no automatic retry');
      await new Promise(r => setTimeout(r, 200));
    }
    writesAllowed = false;
    log(`acknowledged: ${[...acks.entries()].map(([k, s]) => k + ' ' + s).join(', ')}`);

    const after = await publicState();
    const pick = docs => Object.fromEntries([...expected.keys()].map(k => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); return [k, (docs[c] || {})[id] === undefined ? null : docs[c][id]]; }));
    const verify = {ok: true, problems: [], otherDocsChanged: [], serialisationDiffers: []};
    verify.problems.push(...checkDocs(after.docs, 'on the service'));
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(after.docs)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(after.docs[c] || {})])) {
      const k = c + '/' + id; if (expected.has(k)) continue;
      const was = (before.docs[c] || {})[id], now = (after.docs[c] || {})[id];
      if (!same(was ?? null, now ?? null)) verify.otherDocsChanged.push(k);
      else if (JSON.stringify(was) !== JSON.stringify(now)) verify.serialisationDiffers.push(k);
    }
    if (verify.otherDocsChanged.length) verify.problems.push('other documents changed: ' + verify.otherDocsChanged.join(', '));
    for (const k of expected.keys()) { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); const v = (after.docs[c] || {})[id]; if (canon(v === undefined ? null : v) !== expected.get(k)) verify.problems.push(k + ' on the service is not what the page sent'); }
    verify.ok = !verify.problems.length;
    const report = {author: 'Andrew Fisher', started, finished: new Date().toISOString(), mode: 'apply', spec, pageSha256: expectedSha,
      version: {before: before.version, after: after.version}, updated: {before: before.updated, after: after.updated},
      stage: results, writes: [...expected.keys()].map(k => ({key: k, status: acks.get(k) ?? null})), refused, mapSessionsBlocked: counts.mapSessions,
      docs: {before: pick(before.docs), after: pick(after.docs)}, verification: verify};
    const out = path.join(HERE, 'report_' + started + '.json');
    fs.writeFileSync(out, redact(JSON.stringify(report, null, 1)) + '\n', {mode: 0o600});
    log(`record version ${before.version} -> ${after.version}; other documents unchanged in value: ${!verify.otherDocsChanged.length}${verify.serialisationDiffers.length ? ' (key order only differs for ' + verify.serialisationDiffers.length + ': ' + verify.serialisationDiffers.slice(0, 5).join(', ') + ')' : ''}`);
    log(verify.ok ? `VERIFIED - every op holds on the service (${expected.size} documents written)` : 'VERIFICATION PROBLEMS: ' + verify.problems.join(' | '));
    log('report: ' + out);
    if (!verify.ok) exitCode = 1;
  } catch (e) {
    console.error('STOP: ' + redact(e && e.message || e)); if (process.env.GC500_DEBUG) console.error(redact(e && e.stack || '')); exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (tempPage) fs.rmSync(tempPage, {force: true});
    process.exit(exitCode);
  }
})();
