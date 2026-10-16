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
     options: --spec <file> (default doors_spec.json beside this script)
              --page <file> or PAGE=<file>: the page to serve in the dry run (default: the live page, fetched now)

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
const specPath = argValue('--spec') || path.join(HERE, 'doors_spec.json');
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
  else if (o.op === 'unit_reidentify') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '')) fail(at + 'needs a number'); if (typeof o.item !== 'string' || !o.item.trim()) fail(at + 'needs an item type'); if (!['coates', 'event-portables'].includes(o.owner || 'coates')) fail(at + 'owner'); }
  else if (o.op === 'number_item') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '')) fail(at + 'needs a number'); if (typeof o.item !== 'string' || !o.item.trim()) fail(at + 'needs an item'); }
  else if (o.op === 'labour_off') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); for (const f of ['disc', 'item', 'line', 'unit']) if (typeof o[f] !== 'string' || !o[f]) fail(at + 'needs ' + f); }
  else if (o.op === 'door') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^u\d{4,12}$/.test(o.id || '')) fail(at + 'needs a unit row id'); if (!['driver', 'passenger', 'na'].includes(o.side)) fail(at + 'side'); }
  else if (o.op === 'unit_archive') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '')) fail(at + 'needs a number'); }
  else if (o.op === 'set_qty') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!(o.qty === '' || (Number.isInteger(o.qty) && o.qty >= 0))) fail(at + 'qty must be a whole number or "" for the schedule\'s own'); }
  else fail(at + 'unknown op ' + o.op);
});
const REFS = [...new Set(spec.ops.filter(o => o.ref).map(o => o.ref))], QIDS = [...new Set(spec.ops.filter(o => o.op === 'answer').map(o => o.id))];
/* the documents this operation may touch: the references' own delivery, assetNumbers and accessories documents, the
   answers documents named, and the audit documents the page keeps beside them (stamps, by, deleted, notes, spares) */
const ALLOWED_COLLS = new Set(['delivery', 'assetNumbers', 'accessories', 'answers', 'stamps', 'by', 'deleted', 'notes', 'spares', 'loads', 'qtys', 'units', 'labour', 'supplied']);
const docIdDecode = id => String(id).replace(/~2f~/g, '/').replace(/~7c~/g, '|').replace(/~20~/g, ' ').replace(/~26~/g, '&');
const allowed = (k, body, docs) => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (!ALLOWED_COLLS.has(c)) return false; const d = docIdDecode(id), parts = d.split('/');
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
        else { const ok = setLight(op.ref, op.state); if (!ok) throw new Error('setLight refused ' + op.ref); if (deliveryOf(op.ref).state !== op.state) throw new Error('light did not move'); r.result = 'set ' + op.state; }
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
          const saved = unit925Save(op.ref, {item: op.item, owner, assetNo: op.no, label: op.item, branch: '', note: op.note || '', sourceKey: ''}, '', 'null', '');
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
      } else if (op.op === 'labour_off') {
        const k = labourKey(op.ref, op.disc, op.item, op.line, op.unit);
        if (!labourTicked(op.ref, op.disc, op.item, op.line, op.unit, assetOf(op.ref))) r.result = 'already off';
        else { const ok = setLabour(op.ref, op.disc, op.item, op.line, false, op.unit); if (ok === false) throw new Error('setLabour refused ' + k); if (labourTicked(op.ref, op.disc, op.item, op.line, op.unit, assetOf(op.ref))) throw new Error(k + ' still ticked'); r.result = 'taken off'; }
      } else if (op.op === 'door') {
        const a = assetOf(op.ref), now = loading872Side(a, op.id);
        if (now === op.side) r.result = 'already ' + op.side; else { loading872Set(op.ref, op.id, op.side); if (loading872Side(assetOf(op.ref), op.id) !== op.side) throw new Error(op.ref + ' ' + op.id + ' door side not held'); r.result = 'door side ' + op.side; }
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
        if (op.op === 'light' && (((docs.delivery || {})[op.ref] || {}).state) !== op.state) problems.push(op.ref + ' light is not ' + op.state + ' ' + where);
        if (op.op === 'acc_add' && !((((docs.accessories || {})[op.ref] || {}).v) || []).some(x => String(x.asset_no || '') === op.no && x.type === op.type)) problems.push(op.ref + ' has no ' + op.type + ' ' + op.no + ' ' + where);
        if (op.op === 'acc_fix') { const v = (((docs.accessories || {})[op.ref] || {}).v) || []; if (!v.some(x => String(x.asset_no || '') === op.to && x.type === op.type) || v.some(x => String(x.asset_no || '') === op.from)) problems.push(op.ref + ' ' + op.type + ' is not ' + op.to + ' ' + where); }
        if (op.op === 'answer') { const nid = (results.find(x => x.op === 'answer' && x.id === op.id) || {}).noteId || op.id; if ((((docs.answers || {})[nid] || {}).v) !== op.text) problems.push('note ' + nid + ' is not held ' + where); }
        if (op.op === 'unit_reidentify' && !Object.values(docs.loads || {}).some(u => u && u.kind === 'unit925-record' && u.ref === op.ref && String(u.assetNo) === op.no && u.item === op.item && u.active !== false && !u.removedBy)) problems.push(op.ref + ' has no active ' + op.item + ' unit ' + op.no + ' ' + where);
        if (op.op === 'unit_archive' && Object.values(docs.loads || {}).some(u => u && u.kind === 'unit925-record' && u.ref === op.ref && String(u.assetNo) === op.no && u.active !== false && !u.removedBy)) problems.push(op.ref + ' still has an active unit record for ' + op.no + ' ' + where);
        if (op.op === 'labour_off' && (docs.labour || {})[op.ref + '/u' + op.unit.replace(/^u/, '') + '|' + op.disc + '|' + op.item + '|' + op.line]) problems.push(op.ref + ' ' + op.unit + ' ' + op.line + ' still ticked ' + where);
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
