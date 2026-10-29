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
     add_ref     - 25 Oct 2026: a new reference through the page's own addReference (the Add form), as EQ0001-EQ0005 were
                   added: trade, name, item type, its number, the contract line as its note, the branch. The reference must
                   not exist before the run; the documents it writes are its own added, notes and branch documents.
     depart      - 26 Oct 2026: equipment that has left site, through the page's own Record departure form
                   (DemobCollection996.open), as a person ticking the units that left, typing the actual date and time in
                   AEST and pressing "Confirm selected items left site". The form's own submit builds the request,
                   DemobCollection996.validate checks it and setLight(ref, 'in transit', request) saves it: units left
                   behind keep the reference on site; the last units turn its light to in transit. Andrew, 26 Oct 2026:
                   "1283681 generatpr and 5 water barriers picked up left at 7:40AM".
     emptied     - 26 Oct 2026: the Emptied (pumped out) tick on a toilet or waste tank, through the page's own setEmptied816,
                   as a person ticking it in the reference's drawer. The page's emptied gate keeps a toilet's departure form
                   shut until it is ticked; it is only ever ticked here on Andrew's word that the units were pumped out.
     unit_ready  - 26 Oct 2026 (v12.42, built as v12.38): a unit's own Ready tick on the Demob tab, through the page's own Singles1238.setUnitReady,
                   as a person pressing Ready on that unit's card; units named owner|asset number. Only on Andrew's word.
     vms_arrival - 27 Oct 2026: a VMS board's arrival day on the VMS plan corrected through the plan's own writer (VMS1024.write,
                   checked by VMSArrival1098.prepare), as a person correcting it would: the entry on the wrong day (was) is
                   withdrawn ("not confirmed" on that day, the page's own correction, as VMS21's 21 Oct entry was), the board goes
                   on site and in place on the day it came (day), and a board that was complete is ticked complete again (a
                   withdrawal takes the complete tick off, as the page does). The entry on the wrong day stays in the history.
                   The reason (why) goes in the board's notes only with notes_ok, Andrew's own words allowing it: that box is
                   the plan's "Notes · special instructions" ("anything the crew placing it must know") and the VMS board sheet
                   prints it under NOTES · SPECIAL INSTRUCTIONS. Without notes_ok the plan's notes are left as they are, and the
                   reason stays in the run's report (and, here, in each new reference's light history). Andrew, 27 Oct 2026:
                   "22 oct" (VMS22, VMS24: Premiair docket 26143911).
     add_ref, 27 Oct 2026: a sub-hired VMS board's reference carries no number (its fleet number goes on its unit), and
                   may carry its in and out days (from, to: the Add form's own fields).

     node left_site.cjs                    DRY RUN (default): the page is opened read-only through the harness, every
                                           write it tries is ABORTED, and the script prints what --apply would send.
     node left_site.cjs --apply            needs GC500_EDIT_TOKEN and GC500_EXPECTED_PAGE_SHA in the environment.
     options: --spec <file> (default left_site_spec.json beside this script)
              --page <file> or PAGE=<file>: the page to serve in the dry run (default: the live page, fetched now)
              --check-spec: check the spec and stop - no page, no service (27 Oct 2026)
              GC500_PRIVATE_DIR=<dir>: where the whole-record backup goes (default beside this script; keep it private)
     spec.expect (27 Oct 2026, optional): {"chargeDelta": 0, "costDelta": 0} - after the stage, what is charged to the V8s and
              the known costs must move by exactly these, to the cent, and no branch total may move; otherwise nothing is
              sent, in the dry run as in --apply.

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
const specPath = argValue('--spec') || path.join(HERE, 'left_site_spec.json');
const token = process.env.GC500_EDIT_TOKEN || '', expectedSha = process.env.GC500_EXPECTED_PAGE_SHA || '';
const redact = s => token ? String(s).split(token).join('[key]') : String(s);
const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
const same = (a, b) => canon(a) === canon(b);
const sha256 = b => crypto.createHash('sha256').update(b).digest('hex');
const utc = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const log = (...a) => console.log(...a.map(redact));
const fail = m => { throw new Error(redact(m)); };

// ---------------------------------------------------------------------------------------------- the spec
const REFRE = /^[A-Z][A-Z0-9]{0,7}(-[A-Z0-9]{1,4})?$/, NORE = /^\d{4,12}$/;
const TYPES = ['Air conditioner', 'Fridge', 'Zip boiler', 'Sink with tap', 'Microwave', 'Hydration station', 'Urn', 'Whiteboard', 'Folding table', 'Swivel chair', 'Stackable chair', 'Chair', 'Desk', 'Heater', 'Water cooler', 'Other'];
/* 27 Oct 2026: one rule for the free text a run leaves on the record (a note, a reason): it names the person, never a system */
const SYS = /\b(codex|claude|gpt|model|agent)\b/i;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const realDay = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d + 'T00:00:00Z')) && new Date(d + 'T00:00:00Z').toISOString().slice(0, 10) === d;
const aestDay = t => new Date(Date.parse(t) + 36e6).toISOString().slice(0, 10); /* the day in AEST (Brisbane, UTC+10, no daylight saving) */
/* a name the page would read as a quantity (descriptionQuantity1012 reads "qty 2", "VMS x 2", "2 x VMS") */
const QTYNAME = /\b(qty|quantity)\b|[x×]\s*\d+\s*$|^\s*\d+\s*[x×]/i;
const TEXT200 = s => typeof s === 'string' && !!s.trim() && s.length <= 200 && !SYS.test(s);
/* 27 Oct 2026: Andrew's words, quoted with the day he said them (Andrew, 27 Oct 2026: "yes") */
const NOTES_OK = /^Andrew, \d{1,2} [A-Z][a-z]{2} 20\d\d\b[^"]*: ".*\S.*"$/;
/* the spec's own checks, before any page opens; `now` only so a test can fix today */
function validateSpec(spec, now = Date.now()) {
const today = aestDay(new Date(now).toISOString());
if (!spec || typeof spec !== 'object') fail('the spec is not an object');
if (typeof spec.by !== 'string' || !spec.by.trim()) fail('spec.by must be a name');
if (/\bvia\b/i.test(spec.by)) fail('spec.by must be the person, with no agent suffix');
if (!Array.isArray(spec.ops) || !spec.ops.length) fail('spec.ops must be a list');
spec.ops.forEach((o, i) => {
  const at = 'ops[' + i + '] ';
  if (o.op === 'number_on' || o.op === 'number_off') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!NORE.test(o.no || '')) fail(at + 'needs a 4-12 digit number'); }
  else if (o.op === 'light') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!['on site', 'not on site', 'in transit', 'collected'].includes(o.state)) fail(at + 'needs a light state');
    /* 27 Oct 2026: a back-dated light is an arrival: on site, an exact UTC time that has passed, and why, in words the record keeps */
    if (o.at != null) { if (o.state !== 'on site') fail(at + 'only an on-site light is dated back (at)'); if (typeof o.at !== 'string' || !ISO_UTC.test(o.at) || !Number.isFinite(Date.parse(o.at))) fail(at + 'at must be a UTC time, e.g. 2026-10-21T14:00:00.000Z'); if (Date.parse(o.at) > now) fail(at + 'at is in the future'); if (!TEXT200(o.why)) fail(at + 'a dated light needs why, under 200 characters, naming no system'); } }
  else if (o.op === 'light_redate') { /* 29 Oct 2026: a reference already on site gets its true arrival time (EQ0006 laser plane, on hire 16 Oct, entered 25 Oct) */
    if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (typeof o.at !== 'string' || !ISO_UTC.test(o.at) || !Number.isFinite(Date.parse(o.at))) fail(at + 'at must be a UTC time'); if (Date.parse(o.at) > now) fail(at + 'at is in the future'); if (!TEXT200(o.why)) fail(at + 'needs why, under 200 characters, naming no system'); }
  else if (o.op === 'acc_add') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!TYPES.includes(o.type)) fail(at + 'type must be one the picker has'); if (!NORE.test(o.no || '')) fail(at + 'needs a number'); if (o.qty != null && !(Number.isInteger(o.qty) && o.qty >= 1)) fail(at + 'qty'); }
  else if (o.op === 'acc_fix') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!TYPES.includes(o.type)) fail(at + 'type'); if (!/^\d{4,12}$/.test(o.from || '') || !NORE.test(o.to || '')) fail(at + 'from/to numbers'); }
  else if (o.op === 'po') { /* 29 Oct 2026: a purchase order on the page's own setPo, as the Purchase orders card would save it */
    if (!/^\d{4,12}$/.test(o.number || '')) fail(at + 'needs a 4-12 digit purchase order number');
    for (const f of ['supplier_name', 'what', 'period', 'branch', 'stream']) if (typeof o[f] !== 'string' || !o[f].trim() || o[f].length > 120) fail(at + 'needs ' + f + ' under 120 characters');
    if (!/^[A-Z]{4}$/.test(o.branch)) fail(at + 'branch code is four capitals');
    /* 29 Oct 2026: revenue_branch may be null, as the fencing orders hold it - the page derives a fencing or toilets order's revenue branch itself */
    if (!(o.revenue_branch === null || /^[A-Z]{4}$/.test(o.revenue_branch))) fail(at + 'revenue_branch is four capitals or null');
    if (o.amount != null && !(typeof o.amount === 'number' && Number.isFinite(o.amount) && o.amount >= 0)) fail(at + 'amount is a number or null');
    if (o.note != null && (typeof o.note !== 'string' || o.note.length > 200 || SYS.test(o.note))) fail(at + 'note under 200 characters, naming no system');
    if (typeof o.confirmed !== 'boolean') fail(at + 'confirmed must be true or false'); if (SYS.test(o.what)) fail(at + 'what names a system');
    /* 29 Oct 2026: the receipt ID (the card's "receipt ID no." box, held as invoice_no) and the receipting state, as the Finance card's select holds it */
    if (o.invoice_no != null && !/^[0-9A-Za-z-]{1,20}$/.test(o.invoice_no)) fail(at + 'invoice_no (receipt ID) is 1-20 letters, digits or dashes');
    if (o.receipted != null && !['full', 'part', 'none'].includes(o.receipted)) fail(at + 'receipted is full, part or none'); }
  else if (o.op === 'answer') { if (typeof o.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{1,80}$/i.test(o.id)) fail(at + 'needs a question id'); if (typeof o.text !== 'string' || !o.text.trim() || o.text.length > 600) fail(at + 'needs text under 600 characters'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.text)) fail(at + 'text names a system'); }
  else if (o.op === 'unit_reidentify') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^[0-9A-Z]{3,12}$/.test(o.no || '')) fail(at + 'needs a number'); if (typeof o.item !== 'string' || !o.item.trim()) fail(at + 'needs an item type'); if (!['coates', 'event-portables', 'prem-air-hire'].includes(o.owner || 'coates')) fail(at + 'owner');
    /* 27 Oct 2026: the label is what the Demob cards read; a Premiair VMS board's label is its register name (VMSnn), which places it on the VMS plan */
    if (o.label != null && !(typeof o.label === 'string' && /^[A-Za-z0-9][A-Za-z0-9 -]{0,23}$/.test(o.label))) fail(at + 'label: letters, digits, spaces and dashes, up to 24');
    if ((o.owner || 'coates') === 'prem-air-hire' && o.item === 'VMS' && !/^VMS\d{2}$/.test(o.label || '')) fail(at + 'a Premiair VMS board is labelled by its register name (VMSnn, e.g. VMS21)');
    if (o.note != null && (typeof o.note !== 'string' || o.note.length > 200 || SYS.test(o.note))) fail(at + 'note under 200 characters, naming no system'); }
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
  else if (o.op === 'vms_board') { if (!/^(\d{7}|VMS\d{2})$/.test(o.key || '')) /* 28 Oct 2026: a Coates board is keyed by its asset number */ fail(at + 'needs a VMS board key'); if (!/^[0-9A-Z]{3,12}$/.test(o.fleet || '')) fail(at + 'needs a fleet/asset number'); if (!/^[A-Z0-9]{2,8}$/.test(o.rego || '')) fail(at + 'needs a rego'); if (!REFRE.test(o.on || '')) fail(at + 'needs the delivery it is on'); }
  else if (o.op === 'note_append') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (typeof o.text !== 'string' || !o.text.trim() || o.text.length > 600) fail(at + 'needs text under 600 characters'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.text)) fail(at + 'text names a system'); }
  else if (o.op === 'spare_use') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^SP-[a-z0-9]{6,20}$/.test(o.id || '')) fail(at + 'needs a spare id'); if (!NORE.test(o.no || '')) fail(at + 'needs the spare\'s number'); }
  else if (o.op === 'steps_off') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); }
  else if (o.op === 'vms_inplace' || o.op === 'vms_complete') { if (!/^\d{2}[a-z]?$/.test(o.pos || '')) fail(at + 'needs a VMS plan position'); if (!/^VMS\d{2}$/.test(o.board || '')) fail(at + 'needs the board name (VMSnn) that position carries'); }
  else if (o.op === 'vms_plan') { if (!/^\d{2}[a-z]?$/.test(o.pos || '')) fail(at + 'needs a VMS plan position'); if (!(o.lat <= -27 && o.lat >= -29 && o.lon >= 153 && o.lon <= 154)) fail(at + 'not a Gold Coast position'); if (typeof o.how !== 'string' || !o.how.trim() || o.how.length > 200) fail(at + 'needs how it was arrived at'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.how)) fail(at + 'text names a system'); }
  else if (o.op === 'sub_move') { if (!REFRE.test(o.from || '') || !REFRE.test(o.to || '') || o.from === o.to) fail(at + 'needs two references'); if (!/^[A-Za-z0-9-]{1,12}$/.test(o.no || '')) fail(at + 'needs the unit number'); if (typeof o.co !== 'string' || !o.co.trim()) fail(at + 'needs the sub-hire company'); }
  else if (o.op === 'place') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!(o.lat <= -27 && o.lat >= -29 && o.lon >= 153 && o.lon <= 154)) fail(at + 'not a Gold Coast position'); if (typeof o.how !== 'string' || !o.how.trim() || o.how.length > 200) fail(at + 'needs how it was arrived at'); if (/\b(codex|claude|gpt|model|agent)\b/i.test(o.how + ' ' + (o.source || ''))) fail(at + 'text names a system'); }
  else if (o.op === 'fire_ext') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!(Number.isInteger(o.qty) && o.qty >= 1 && o.qty <= 99)) fail(at + 'needs a fire extinguisher count 1-99'); }
  else if (o.op === 'item_type') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (typeof o.item !== 'string' || !o.item.trim() || o.item.length > 80) fail(at + 'needs the item type'); }
  else if (o.op === 'add_ref') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!['Access & plant', 'Other', 'Generators', 'Variable message signs'].includes(o.disc)) fail(at + 'trade must be Access & plant, Other, Generators or Variable message signs'); if (o.disc === 'Variable message signs' && o.type !== 'VMS') fail(at + 'a VMS board reference has the item type VMS'); if ((o.sheet != null || o.callout != null) && !(/^[A-Z0-9-]{4,20}$/.test(o.sheet || '') && /^[0-9A-Z]{1,6}$/.test(o.callout || ''))) fail(at + 'sheet and callout'); for (const f of ['name', 'type']) if (typeof o[f] !== 'string' || !o[f].trim() || o[f].length > 80) fail(at + 'needs ' + f); if (QTYNAME.test(o.name)) fail(at + 'the name reads as a quantity on the page (qty, x 2, 2 x)'); if (!(o.no === '' && (o.disc === 'Variable message signs' || o.no_none === true)) && !NORE.test(o.no || '')) fail(at + 'needs a number (blank only for a sub-hired VMS board; its fleet number goes on its unit)'); if (typeof o.note !== 'string' || !o.note.trim() || o.note.length > 200 || SYS.test(o.note)) fail(at + 'needs a note under 200 characters naming no system'); if (!['MEAD', 'KINP', 'NVAC', 'STPS'].includes(o.branch)) fail(at + 'branch');
    /* 27 Oct 2026: the Add form's in and out days, as the form checks them, and no in day after today */
    if (o.from != null && !realDay(o.from)) fail(at + 'from must be a real day, e.g. 2026-10-22'); if (o.to != null && !realDay(o.to)) fail(at + 'to must be a real day'); if (o.from != null && o.from > today) fail(at + 'from is after today (AEST)'); if (o.from != null && o.to != null && o.to < o.from) fail(at + 'to is before from'); }
  else if (o.op === 'date_back') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); for (const f of ['done_at', 'supplied_at', 'install_at']) if (o[f] != null && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/.test(o[f])) fail(at + f + ' must be an ISO time'); for (const f of ['item', 'disc']) if (typeof o[f] !== 'string' || !o[f]) fail(at + 'needs ' + f); if (typeof o.why !== 'string' || !o.why.trim() || o.why.length > 300 || /\b(codex|claude|gpt|model|agent)\b/i.test(o.why)) fail(at + 'needs why, naming no system'); }
  else if (o.op === 'hire_start') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^\d{4}-\d{2}-\d{2}$/.test(o.iso || '')) fail(at + 'needs a day, YYYY-MM-DD'); } /* 27 Oct 2026: a reference's hire start through the page's own setHireStart */
  else if (o.op === 'branch') { if (!REFRE.test(o.ref || '') && o.ref !== 'GN?') fail(at + 'needs a reference'); if (!['KINP', 'NVAC', 'STPS', 'MEAD'].includes(o.code)) fail(at + 'code must be KINP, NVAC, STPS or MEAD'); } /* 27 Oct 2026: a reference's branch through the page's own setBranch */
  else if (o.op === 'set_qty') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!(o.qty === '' || (Number.isInteger(o.qty) && o.qty >= 0))) fail(at + 'qty must be a whole number or "" for the schedule\'s own'); }
  else if (o.op === 'depart') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+10:00$/.test(o.at || '') || !Number.isFinite(Date.parse(o.at))) fail(at + 'needs the actual departure time in AEST, e.g. 2026-10-26T07:40:00+10:00'); if (Date.parse(o.at) > Date.now()) fail(at + 'departure time is in the future');
    if (!Array.isArray(o.nos) || !o.nos.every(n => /^[0-9A-Z]{3,16}$/.test(n)) /* 28 Oct 2026: water barriers carry the product code ARMORZONMASHTL2 */ || new Set(o.nos).size !== o.nos.length) fail(at + 'needs the asset numbers that left (a list, each once)');
    if (o.unnumbered != null && !(Array.isArray(o.unnumbered) && o.unnumbered.every(u => u && typeof u.type === 'string' && u.type.trim() && Number.isInteger(u.n) && u.n > 0))) fail(at + 'unnumbered must be a list of {type, n}');
    if (!o.nos.length && !(o.unnumbered || []).length) fail(at + 'needs at least one unit that left'); if (o.complete != null && typeof o.complete !== 'boolean') fail(at + 'complete must be true or false'); if (o.readback != null && o.readback !== 'history') fail(at + 'readback can only be history'); }
  else if (o.op === 'emptied') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (o.on !== true) fail(at + 'emptied only ticks on (on: true), on Andrew\'s word that the units were pumped out'); }
  else if (o.op === 'unit_ready') { if (!REFRE.test(o.ref || '')) fail(at + 'needs a reference'); if (!Array.isArray(o.units) || !o.units.length || o.units.some(u => !/^[a-z-]+\|[0-9A-Za-z]{2,12}$/.test(u))) fail(at + 'needs the units, each owner|asset number'); }
  else if (o.op === 'vms_arrival') { if (!/^\d{2}[a-z]?$/.test(o.pos || '')) fail(at + 'needs a VMS plan position'); if (!/^VMS\d{2}$/.test(o.board || '')) fail(at + 'needs the board name (VMSnn) that position carries');
    if (!realDay(o.was) || !realDay(o.day)) fail(at + 'needs the arrival day on the plan now (was) and the day it came (day), each a real day'); if (!(o.day > o.was)) fail(at + 'the day it came must be after the day recorded (only a later arrival is corrected this way)'); if (o.day > today) fail(at + 'the day it came is after today (AEST)');
    if (!TEXT200(o.why)) fail(at + 'needs why, under 200 characters, naming no system');
    /* the reason prints on the VMS board sheet as a special instruction for the crew, so it goes in the plan's notes only on
       Andrew's own words allowing it, quoted with the day he said them */
    if (o.notes_ok != null && !(TEXT200(o.notes_ok) && NOTES_OK.test(o.notes_ok))) fail(at + 'notes_ok must be Andrew\'s own words allowing the reason to print as a special instruction, quoted with the day: Andrew, 27 Oct 2026: "..." (under 200 characters, naming no system)'); }
  else fail(at + 'unknown op ' + o.op);
});
/* 27 Oct 2026: one day everywhere. An added reference is in from the AEST day its light is dated; a VMS board whose plan
   arrival is corrected arrives that same day on the reference its unit is on; a reference is added once, a position corrected once */
const adds = spec.ops.filter(o => o.op === 'add_ref');
adds.forEach((o, i) => { if (adds.findIndex(x => x.ref === o.ref) !== i) fail(o.ref + ' is added twice'); });
adds.filter(o => o.from).forEach(o => { const l = spec.ops.find(x => x.op === 'light' && x.ref === o.ref && x.at); if (l && aestDay(l.at) !== o.from) fail(o.ref + ': from ' + o.from + ' is not the AEST day of its arrival ' + l.at + ' (' + aestDay(l.at) + ')'); });
const arrivals = spec.ops.filter(o => o.op === 'vms_arrival');
arrivals.forEach((o, i) => { if (arrivals.findIndex(x => x.pos === o.pos) !== i) fail('VMS plan position ' + o.pos + ' is corrected twice');
  const u = spec.ops.find(x => x.op === 'unit_reidentify' && x.label === o.board), ad = u && adds.find(x => x.ref === u.ref);
  if (ad && ad.from !== o.day) fail(o.board + ': the VMS plan arrival ' + o.day + ' is not ' + ad.ref + '\'s in day ' + ad.from); });
if (spec.expect != null) { const e = spec.expect; if (!e || typeof e !== 'object' || Array.isArray(e) || !Number.isFinite(e.chargeDelta) || !Number.isFinite(e.costDelta) || Object.keys(e).some(k => !['chargeDelta', 'costDelta'].includes(k))) fail('spec.expect must be {"chargeDelta": dollars, "costDelta": dollars}'); }
return true;
}
/* the references a spec names (a sub_move names two, from and to); an add_ref's from and to are its in and out days, not references */
function refsOf(spec) { return [...new Set(spec.ops.flatMap(o => o.op === 'add_ref' ? [o.ref] : [o.ref, o.from, o.to]).filter(Boolean))]; }
if (require.main !== module) { module.exports = {validateSpec, refsOf, SYS, aestDay, realDay}; return; } /* required by a test: the spec's checks only - no page, no service */
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
validateSpec(spec);
const VKEYS = [...new Set(spec.ops.filter(o => o.op === 'vms_rego' || o.op === 'vms_fleet' || o.op === 'vms_board').map(o => o.key))];
const REFS = refsOf(spec), QIDS = [...new Set(spec.ops.filter(o => o.op === 'answer').map(o => o.id))];
/* the documents this operation may touch: the references' own delivery, assetNumbers and accessories documents, the
   answers documents named, and the audit documents the page keeps beside them (stamps, by, deleted, notes, spares) */
const PO_NOS = [...new Set(spec.ops.filter(o => o.op === 'po').map(o => o.number))]; /* purchase orders the spec names */
const ALLOWED_COLLS = new Set(['purchaseOrders', 'delivery', 'assetNumbers', 'accessories', 'answers', 'stamps', 'by', 'deleted', 'notes', 'spares', 'loads', 'qtys', 'units', 'labour', 'supplied', 'vmsboard', 'places', 'items', 'added', 'branch', 'hireStart']);
const NEW_REFS = new Set(spec.ops.filter(o => o.op === 'add_ref').map(o => o.ref)); /* references this run creates: absent before, present after */
const PROBE_REFS = [...new Set([...NEW_REFS, ...spec.ops.filter(o => o.op === 'date_back' || o.op === 'light_redate').map(o => o.ref)])]; /* read back on Today after the stage */
const VPOS = new Set(spec.ops.filter(o => o.op === 'vms_plan' || o.op === 'vms_inplace' || o.op === 'vms_complete' || o.op === 'vms_arrival').map(o => o.pos)); /* VMS plan positions (vms1024/<pos> on loads) the spec names */
/* 27 Oct 2026, read only: the VMS plan boards the spec touches (a Premiair board's unit label, a corrected arrival), and the days to read them on */
const VBOARDS = [...new Set(spec.ops.filter(o => (o.op === 'unit_reidentify' && o.item === 'VMS' && /^VMS\d{2}$/.test(o.label || '')) || o.op === 'vms_arrival').map(o => o.label || o.board))];
const VDAYS = [...new Set(spec.ops.flatMap(o => o.op === 'vms_arrival' ? [o.was, o.day] : o.op === 'add_ref' && o.from ? [o.from] : []))].sort();
const SPARE_IDS = new Set(spec.ops.filter(o => o.op === 'spare_use').map(o => o.id)); /* a spare is named by its own id; only the ones the spec names */
const docIdDecode = id => String(id).replace(/~3f~/g, '?').replace(/~2f~/g, '/').replace(/~7c~/g, '|').replace(/~20~/g, ' ').replace(/~26~/g, '&');
const allowed = (k, body, docs) => { const c = k.slice(0, k.indexOf('/')), id = k.slice(k.indexOf('/') + 1); if (!ALLOWED_COLLS.has(c)) return false; const d = docIdDecode(id), parts = d.split('/');
  if (c === 'vmsboard') return VKEYS.includes(d);
  if (c === 'purchaseOrders') return PO_NOS.includes(d);
  if ((c === 'stamps' || c === 'by') && d.startsWith('po/')) return PO_NOS.includes(d.slice(3));
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
if (args.includes('--check-spec')) { log(`spec ${path.basename(specPath)}: ${spec.ops.length} op(s) pass the checks - references ${REFS.join(', ') || 'none'}${VPOS.size ? ' · VMS plan positions ' + [...VPOS].join(', ') : ''}${spec.ops.some(o => o.op === 'vms_arrival') ? ' · the correction reason ' + spec.ops.filter(o => o.op === 'vms_arrival').map(o => (o.notes_ok ? 'in' : 'kept out of') + ' VMS plan ' + o.pos + '\'s notes').join(', ') + ' (they print on the board sheet as special instructions)' : ''}${spec.expect ? ' · expect ' + JSON.stringify(spec.expect) : ''}. No page opened, nothing read or sent.`); process.exit(0); }

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
  const missing = ['addReference', 'setDone', 'setLight', 'numberPutOn', 'numberTakeOff', 'numberOwners', 'assetNumbersOf', 'assetOf', 'deliveryOf', 'openAsset', 'setQAnswer', 'qAnswer', 'isRef', 'whoAmI', 'mayWrite', 'capability', 'toDocs', 'fromDocs', 'syncStage', 'syncSend', 'syncWaiting', 'persist', 'save', 'unit925Save', 'gcModel925', 'setQty'].filter(f => typeof window[f] !== 'function');
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
/* 27 Oct 2026, read only: each VMS plan position carrying the named boards - its stand-alone card on the Demob tab (key from the
   plan's own label, 'VMS 21' -> VMS21#vms:21) and its arrival on the plan, today and on each day named */
function pageVmsBoards(q) {
  const out = {}, V = window.VMS1024, A = window.VMSArrival1098, SG = window.Singles1238; if (!V || typeof V.boards !== 'function') return {error: 'no VMS plan on this page'};
  for (const name of q.boards) for (const b of V.boards().filter(x => (x.board || x.default_board) === name)) {
    const key = V.label(b).replace(/\*$/, '').replace(/\s+/g, ''), uid = 'vms:' + b.pos, o = {card: key + '#' + uid};
    try { const c = SG && typeof SG.cardOf === 'function' ? SG.cardOf(key, uid) : undefined; o.demobCard = c === undefined ? 'no Demob cards on this page' : c ? {owner: c.owner, no: c.no, label: c.label, st: c.st && c.st.s} : null; } catch (e) { o.demobCard = 'not read: ' + String(e).slice(0, 80); }
    try { const r = V.rec(b.pos), ev = d => { const e = A && A.evidence(r, d); return e ? (e.on ? 'on site from ' + e.effectiveDate : e.state + ' (' + e.effectiveDate + ')') + (e.installed ? ', in place' : '') + ' · ' + e.by : 'no arrival'; };
      const s = A && A.status(name); o.plan = Object.assign({today: ev(todayIso())}, ...q.days.map(d => ({[d]: ev(d)})), {complete: !!(s && s.done), entries: ((r && r.events1098) || []).length, notes: String((r && r.notes) || ''), sheetPrints: typeof V.notes === 'function' ? String(V.notes(b) || '') : 'not read'}); } /* sheetPrints: what the board sheet prints under NOTES · SPECIAL INSTRUCTIONS */ catch (e) { o.plan = 'not read: ' + String(e).slice(0, 80); }
    out[name + ' @ ' + b.pos] = o;
  }
  return JSON.parse(JSON.stringify(out));
}
/* 27 Oct 2026, read only: what the page makes of each new reference - its units, charge span, last arrival, departure reading,
   its unit cards on the Demob tab and any Questions entry that names it */
function pageNewRefProbe(refs) {
  let QL = null; const ql = () => QL || (QL = typeof questionsList === 'function' ? questionsList() : []);
  return JSON.parse(JSON.stringify(refs.filter(k => assetOf(k)).map(k => { const a = assetOf(k), o = {key: k}; let us = [];
    try { us = gcUnits925(a, {loading: false}); o.units = us.map(u => [u.owner, u.assetNo, u.label, u.item, u.source, u.registration || '-'].join('/')); } catch (e) { o.units = 'not read: ' + String(e).slice(0, 80); }
    try { const s = chargeSpanOf(a); o.span = s ? {days: s.days, from: s.from, to: s.to, why: s.why} : null; } catch (e) { o.span = 'not read: ' + String(e).slice(0, 80); }
    try { o.lastOnSite = lastOnSite816(k); } catch (e) { o.lastOnSite = 'not read: ' + String(e).slice(0, 80); }
    try { const d = DemobCollection996.read(k); o.departure = d ? {arrival: d.arrival && d.arrival.at, remaining: d.remaining, unknown: d.unknown, issues: d.issues} : null; } catch (e) { o.departure = 'not read: ' + String(e).slice(0, 80); }
    try { const SG = window.Singles1238; if (SG && typeof SG.cardOf === 'function') o.cards = us.map(u => { const uid = (String(u.owner || 'unknown') + '|' + String(u.assetNo || u.nativeId || u.id || '')).replace(/[^\w:.|-]+/g, '_').slice(0, 120), c = SG.cardOf(k, uid);
      return c ? {uid, owner: c.owner, no: c.no, label: c.label, cat: c.cat, vms: c.vms ? c.vms.label + ' at ' + c.vms.at : null, st: c.st && c.st.s} : {uid, card: null}; }); } catch (e) { o.cards = 'not read: ' + String(e).slice(0, 80); }
    try { const re = new RegExp('\\b' + k.replace(/[-]/g, '\\-') + '\\b'); o.questions = ql().filter(x => re.test(JSON.stringify(x))).map(x => x.id + ' [' + x.st + '] ' + String(x.q || '').slice(0, 100)); } catch (e) { o.questions = 'not read: ' + String(e).slice(0, 80); }
    return o; })));
}
function holdSender() {
  if (typeof syncSend !== 'function') throw new Error('syncSend missing');
  if (!window.__heldSend) { window.__heldSend = syncSend; syncSend = function () { clearTimeout(SYNC.timer); SYNC.timer = null; syncStage(); }; }
  return true;
}
function releaseSender() { if (!window.__heldSend) throw new Error('sender was not held'); syncSend = window.__heldSend; delete window.__heldSend; syncSend(); return true; }
function alignStartupQueue({serverDocs, skip, allow}) {
  const canon = x => JSON.stringify((function sort(v) { return Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; })(x));
  if (!window.__heldSend || Object.keys(SYNC.inflight || {}).length) throw new Error('the sender is not held, or a write is already in flight');
  syncStage();
  const restored = [], differing = [], dropped = [], kept = [];
  for (const [name, q] of Object.entries(SYNC.queue || {})) {
    if (!Object.keys(q).length) continue;
    const original = serverDocs[name] || {};
    /* 27 Oct 2026: a delete the page queues on load for a document already deleted on the page (tombstone on the service,
       named in skip) is not part of this run; it is taken out of this page's queue, never sent from here */
    /* a delete named in the spec's allowRemove (Andrew's word) stays queued and goes with this run */
    let keptHere = false;
    for (const [id, body] of Object.entries(q)) {
      if (body === null && allow.includes(name + '/' + id)) { kept.push(name + '/' + id); keptHere = true; continue; }
      if (body === null && skip.includes(name + '/' + id)) { delete q[id]; dropped.push(name + '/' + id); continue; }
      if (body === null || canon(body) !== canon(original[id])) differing.push(name + '/' + id); }
    if (differing.length || keptHere || !Object.keys(q).length) continue;
    if (canon(toDocs(name)) !== canon(original)) { differing.push(name + ' (collection differs in value)'); continue; }
    SYNC_COLLS[name].set(fromDocs(name, JSON.parse(JSON.stringify(original)))); restored.push(name);
  }
  if (differing.length) throw new Error('startup queue holds real changes, not no-ops: ' + differing.join(', '));
  if (restored.length) { if (!persist() || SYNC.unkept) throw new Error('could not persist the realigned record'); syncStage(); }
  const left = Object.entries(SYNC.queue || {}).filter(([n, q]) => Object.keys(q).some(id => !kept.includes(n + '/' + id))).map(([n]) => n);
  if (left.length) throw new Error('queue still holds: ' + left.join(', '));
  return {restored, dropped, kept};
}
function applyOps(spec) {
  const dry = !!spec.dry; /* a read-only run: the harness aborts every write, so the page is told it may edit */
  /* 26 Oct 2026 19:00: the page's poll re-reads the link's level every few seconds and, on the view link the dry run uses, sets it
     back to view; if the record moved meanwhile, the store's copy then folds over what the stage did. The dry run pins edit for
     its own page only (the --apply run is on the edit link and needs nothing pinned). */
  if (dry) { capability = () => 'edit'; mayWrite = () => true; try { Object.defineProperty(SYNC, 'readonly', {configurable: true, get: () => false, set: () => {}}); Object.defineProperty(SYNC, 'level', {configurable: true, get: () => 'edit', set: () => {}}); } catch (e) { SYNC.readonly = false; SYNC.level = 'edit'; } }
  S.operator = spec.by;
  const who = whoAmI(); if (who !== spec.by) throw new Error('whoAmI() did not return ' + spec.by);
  if (!mayWrite('an asset number')) throw new Error('mayWrite() is false - this is not an edit link');
  const $ = sel => document.querySelector(sel), out = [];
  const accOf = (ref, no, type) => (assetOf(ref).accessories || []).find(y => String(y.asset_no || '') === String(no) && (!type || y.type === type));
  for (const op of spec.ops) {
    const r = Object.assign({}, op); delete r.text;
    try {
      if (op.op === 'add_ref') {
        if (isRef(op.ref)) throw new Error(op.ref + ' already exists - not added again');
        const k = addReference({key: op.ref, disc: op.disc, name: op.name, type: op.type, no: op.no, note: op.note, branch: op.branch, sheet: op.sheet || null, callout: op.callout || null, from: op.from || null, to: op.to || null});
        if (op.sheet && !((assetOf(op.ref).drawing_links || []).some(x => x.sheet === op.sheet && x.label === op.callout))) throw new Error(op.ref + ' is not at callout ' + op.callout + ' on ' + op.sheet + ' after the add');
        if (k !== op.ref || !isRef(op.ref)) throw new Error('addReference refused ' + op.ref);
        /* 27 Oct 2026: a sub-hired VMS board's reference carries no number (its fleet number is on its unit) */
        const nums = assetNumbersOf(assetOf(op.ref)); if (op.no ? !nums.includes(op.no) : nums.length) throw new Error(op.ref + (op.no ? ' does not carry ' + op.no : ' carries ' + nums.join(', ') + ' (expected no number)') + ' after the add');
        const ad = (S.added || []).filter(x => x && x.key === op.ref).pop();
        if (!ad || JSON.stringify(ad.item_types) !== JSON.stringify([op.type]) || (ad.first_date || null) !== (op.from || null) || (ad.last_date || null) !== (op.to || null)) throw new Error(op.ref + ' is not added as ' + op.type + ' in ' + (op.from || '-') + ' out ' + (op.to || '-') + ' (added: ' + JSON.stringify(ad ? {item_types: ad.item_types, first_date: ad.first_date, last_date: ad.last_date} : null) + ')');
        r.result = 'added ' + op.ref + ' (' + op.disc + ', ' + op.name + ', ' + (op.no || 'no number') + (op.from ? ', in ' + op.from : '') + (op.to ? ', out ' + op.to : '') + ', branch ' + op.branch + ')';
        out.push(r); continue;
      }
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
      } else if (op.op === 'light_redate') {
        const d = deliveryOf(op.ref); if (d.state !== 'on site') throw new Error(op.ref + ' is not on site - nothing to re-date');
        const dd = S.delivery[op.ref], hs = (dd.history || []).filter(h => h && h.state === 'on site'), h = hs[hs.length - 1];
        if (!h) throw new Error(op.ref + ' has no on-site history entry to date'); if (!(Date.parse(op.at) < Date.parse(dd.set_at))) throw new Error(op.ref + ' arrival ' + op.at + ' is not earlier than its recorded ' + dd.set_at);
        if ((dd.history || []).some(x => x && x.state !== 'on site' && Date.parse(x.at) > Date.parse(op.at))) throw new Error(op.ref + ' light moved after ' + op.at + ' - review its history first');
        const was = dd.set_at; dd.set_at = op.at; h.at = op.at; h.note = (h.note ? h.note + ' ' : '') + op.why + ' (entered ' + was + ')'; r.result = 'on site dated ' + op.at + ' (was ' + was + ')';
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
          /* 27 Oct 2026: a Premiair VMS board is named by its register name, and the register must give that board this very fleet number */
          if (owner === 'prem-air-hire' && op.item === 'VMS') {
            if (typeof vms913Boards !== 'function' || typeof vms913Of !== 'function') throw new Error('the VMS register is not on this page');
            const b = vms913Boards().find(x => x.key === op.label); if (!b) throw new Error('no VMS board ' + op.label + ' on the register - not identified');
            const fl = String(vms913Of(b).fleet || '').toUpperCase(); if (fl !== op.no) throw new Error('the register has ' + op.label + ' as fleet ' + (fl || 'none') + ', not ' + op.no + ' - not identified');
          }
          have.forEach(x => { if (!x.id || x.kind !== 'unit925-record') return; const k = UnitIdentity1006.remove(op.ref, x.id, UnitIdentity1006.token(x)); if (!k || !k.ok) throw new Error(op.ref + ' take off ' + op.no + ' refused: ' + (k && k.reason)); });
          const saved = unit925Save(op.ref, {item: op.item, owner, assetNo: op.no, label: op.label || op.item, branch: '', note: op.note || '', sourceKey: ''}, '', 'null', '');
          const now = rows().find(x => String(x.assetNo) === op.no && x.item === op.item && x.owner === owner);
          if (!now) throw new Error(op.no + ' is not on ' + op.ref + ' as ' + op.item + ' after the save (' + JSON.stringify(saved).slice(0, 120) + ')');
          if (op.item === 'VMS' && !now.physical) throw new Error(op.no + ' on ' + op.ref + ' is not a physical VMS unit after the save (' + (now.identityReview || 'no reason given') + ') - its Demob card would be a placeholder');
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
      } else if (op.op === 'hire_start') {
        if (((S.hireStart || {})[op.ref]) === op.iso) r.result = 'hire start already ' + op.iso;
        else { if (setHireStart(op.ref, op.iso) === false) throw new Error('setHireStart refused ' + op.ref); if (((S.hireStart || {})[op.ref]) !== op.iso) throw new Error(op.ref + ' hire start did not take'); r.result = 'hire start ' + op.iso; }
      } else if (op.op === 'branch') {
        if (setBranch([op.ref], op.code, true) === false) throw new Error('setBranch refused ' + op.ref); if (((S.branch || {})[op.ref]) !== op.code) throw new Error(op.ref + ' branch did not take'); r.result = 'branch ' + op.code;
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
      } else if (op.op === 'date_back') {
        /* 25 Oct 2026: a reference re-added for one deleted in error carries the deleted one's own dates on our record - its
           complete tick, its receipt and its install tick - as the light's own `at` does for the arrival */
        const dd = S.delivery[op.ref]; if (!dd || !dd.done) throw new Error(op.ref + ' is not complete');
        if (op.done_at) { dd.done_at = op.done_at; const h = (dd.done_history || []).slice(-1)[0]; if (!h || !h.done) throw new Error('no complete entry to date'); h.at = op.done_at; h.note = op.why; }
        S.stamps = S.stamps || {};
        if (op.supplied_at) { const k = 'supplied/' + op.ref + '/' + op.item; if (!S.stamps[k]) throw new Error('no receipt stamp ' + k); S.stamps[k] = op.supplied_at; }
        if (op.install_at) { const k = 'labour/' + op.ref + '|' + op.disc + '|' + op.item + '|install'; if (!S.stamps[k]) throw new Error('no install stamp ' + k); S.stamps[k] = op.install_at; }
        /* the quantity scope (Scope1017) keeps the receipt day it first saw: its next capture carries the stored receiptAt
           over the receipt stamp, so the stored one takes the same date; the set_qty that follows re-captures through the page */
        if (op.supplied_at) { const sk = 'quantityScope1017/' + op.ref, sc = (S.loads || {})[sk], it = sc && Array.isArray(sc.items) ? sc.items.find(x => x.item === op.item) : null;
          if (!it) throw new Error('no quantity scope for ' + op.ref + ' ' + op.item);
          it.receiptAt = op.supplied_at; (it.receipts || []).forEach(x => { x.at = op.supplied_at; }); }
        r.result = 'dated: complete ' + (op.done_at || '-') + ', receipt ' + (op.supplied_at || '-') + ', install ' + (op.install_at || '-');
      } else if (op.op === 'set_qty') {
        const cur = ((S.qtys || {})[op.ref]);
        const ok = setQty(op.ref, op.qty === '' ? '' : String(op.qty)); if (ok === false) throw new Error('setQty refused ' + op.ref);
        r.result = 'quantity ' + JSON.stringify(cur && cur.v !== undefined ? cur.v : cur) + ' -> ' + (op.qty === '' ? "the schedule's own" : op.qty);
      } else if (op.op === 'po') {
        /* 29 Oct 2026: the purchase order through the page's own setPo (the Purchase orders card's save): number, supplier, what, period, branches, amount, note, confirmed */
        if (typeof setPo !== 'function' || typeof poOf !== 'function') throw new Error('setPo is not on this page');
        const was = poOf(op.number); const patch = {supplier_name: op.supplier_name, stream: op.stream, what: op.what, period: op.period, branch: op.branch, revenue_branch: op.revenue_branch, confirmed: op.confirmed};
        if (op.amount !== undefined) patch.amount = op.amount; if (op.note !== undefined) patch.note = op.note;
        if (op.invoice_no !== undefined) patch.invoice_no = op.invoice_no; if (op.receipted !== undefined) patch.receipted = op.receipted; /* 29 Oct 2026: the receipt ID and receipting state, as the card and the Finance card save them */
        const same = was && Object.keys(patch).every(k => JSON.stringify(was[k] ?? null) === JSON.stringify(patch[k] ?? null));
        if (same) r.result = 'already recorded';
        else { const ok = setPo(op.number, patch); if (ok === false) throw new Error('setPo refused ' + op.number); const now = poOf(op.number); if (!now) throw new Error('purchase order ' + op.number + ' not held');
          for (const k of Object.keys(patch)) if (JSON.stringify(now[k] ?? null) !== JSON.stringify(patch[k] ?? null)) throw new Error('purchase order ' + op.number + ' field ' + k + ' not held');
          r.result = (was ? 'updated ' : 'recorded ') + op.number + ' ' + op.what; }
      } else if (op.op === 'answer') {
        /* the note lives under the question's note id (its words less the figures), so it survives the counts changing */
        if (!applyOps.QL) applyOps.QL = typeof questionsList === 'function' ? questionsList() : []; /* computed once: it is a heavy read */
        const q = applyOps.QL.find(x => x.id === op.id); const nid = q ? (q.noteId || q.id) : op.id; r.noteId = nid;
        if (qAnswer(nid) === op.text) r.result = 'already noted';
        else { const kept = setQAnswer(nid, op.text); if (kept === false) throw new Error('setQAnswer refused ' + nid); if (qAnswer(nid) !== op.text) throw new Error('note not held'); r.result = 'noted under ' + nid; }
      } else if (op.op === 'depart') {
        /* 26 Oct 2026: the page's own Record departure form, filled and confirmed as a person would: tick the units that
           left, type the actual date and time (AEST), press Confirm. The form's submit validates and saves through setLight */
        if (typeof DemobCollection996 !== 'object' || typeof DemobCollection996.open !== 'function') throw new Error('the Record departure form is not on this page');
        const before = DemobCollection996.read(op.ref); if (!before) throw new Error(op.ref + ' is not in the demob plan');
        const gone = before.events.flatMap(c => c.items.flatMap(i => i.numbers || []));
        if (before.events.some(c => c.departedAt1211 === op.at && op.nos.every(no => c.items.some(i => (i.numbers || []).includes(no))))) r.result = 'already recorded as left site ' + op.at;
        else {
          const again = op.nos.filter(no => gone.includes(no)); if (again.length) throw new Error(again.join(', ') + ' already has a departure recorded on ' + op.ref + ' - not recorded twice');
          if (!DemobCollection996.open(op.ref)) throw new Error('the Record departure form did not open for ' + op.ref);
          const box = document.getElementById('collection996'); if (!box) throw new Error('no Record departure form on the page');
          const labels = [...box.querySelectorAll('label.collection1211-unit')];
          for (const no of op.nos) { const lab = labels.find(l => l.textContent.trim().split(' · ')[0] === no); if (!lab) { box.remove(); throw new Error(no + ' is not offered on ' + op.ref + '\'s departure form (offered: ' + (labels.map(l => l.textContent.trim()).join('; ') || 'none') + ')'); } lab.querySelector('input[type=checkbox]').checked = true; }
          for (const u of op.unnumbered || []) { const f = [...box.querySelectorAll('fieldset')].find(x => x.dataset.collection996Type === u.type), inp = f && f.querySelector('[name=unidentified]'); if (!inp) { box.remove(); throw new Error(op.ref + ' has no unnumbered ' + u.type + ' on its departure form'); } inp.value = String(u.n); }
          box.querySelector('[name=collection-date]').value = op.at.slice(0, 10);
          box.querySelector('[name=collection-time]').value = op.at.slice(11, 19);
          box.querySelector('button[type=submit]').click();
          if (document.getElementById('collection996')) { const said = ((box.querySelector('[data-collection996-result]') || {}).textContent || '').trim(); box.remove(); throw new Error('the form did not save ' + op.ref + ': ' + (said || 'no message (a field failed the form\'s own check)')); }
          const after = DemobCollection996.read(op.ref);
          /* readback 'history': an added reference whose quantity the page counts from its complete tick (which the departure
             takes off) no longer shows the event in the departure reading; the entry is read from the delivery history instead,
             exactly as the service check below reads it. Only when the spec asks for it. */
          const ev = op.readback === 'history' ? (() => { const h = (deliveryOf(op.ref).history || []).filter(x => x && x.collection996 && x.collection996.kind === 'collection' && !before.events.some(b => b.id === x.collection996.id)).slice(-1)[0]; return h ? Object.assign({}, h.collection996, {by: h.by}) : null; })() : after.events.find(c => !before.events.some(b => b.id === c.id));
          if (!ev || ev.departedAt1211 !== op.at || ev.by !== who) throw new Error(op.ref + ' has no new departure at ' + op.at + ' recorded by ' + who);
          const nums = ev.items.flatMap(i => i.numbers || []), count = ev.items.reduce((n, i) => n + i.n, 0), want = op.nos.length + (op.unnumbered || []).reduce((n, u) => n + u.n, 0);
          if (op.nos.some(no => !nums.includes(no)) || nums.length !== op.nos.length || count !== want) throw new Error(op.ref + ' departure holds ' + count + ' (' + nums.join(', ') + '), not the ' + want + ' asked');
          if (op.complete === true && op.readback !== 'history' && !after.complete) throw new Error(op.ref + ' still has ' + after.remaining.filter(u => u.n > 0).map(u => u.n + ' x ' + u.type).join(', ') + ' to leave - expected it to leave in full');
          if (op.complete === true && op.readback === 'history' && ev.complete !== true) throw new Error(op.ref + ' departure is not recorded as the whole reference');
          if (op.complete === false && after.complete) throw new Error(op.ref + ' left in full - expected units to stay');
          r.result = 'left site ' + op.at + ', recorded by ' + ev.by + ': ' + ev.items.map(i => i.n + ' x ' + i.type + (i.numbers.length ? ' ' + i.numbers.join(', ') : '')).join(', ') + (op.readback === 'history' ? ' - read from the history; light ' + deliveryOf(op.ref).state + '; departure reading: ' + (after.issues.join('; ') || (after.complete ? 'left in full' : 'not complete')) : after.complete ? ' - ' + op.ref + ' has left in full, light ' + deliveryOf(op.ref).state : ' - still to leave: ' + after.remaining.filter(u => u.n > 0).map(u => u.n + ' x ' + u.type).join(', '));
        }
      } else if (op.op === 'emptied') {
        /* 26 Oct 2026: the Emptied (pumped out) tick through the page's own setEmptied816, as a person ticking it in the
           reference's drawer; the page's emptied gate then lets its departure form open. Only on Andrew's word. */
        if (typeof setEmptied816 !== 'function' || typeof emptiedOf816 !== 'function') throw new Error('the Emptied tick is not on this page');
        if (!needsEmpty816(op.ref)) throw new Error(op.ref + ' is not a toilet or a waste tank');
        const was = emptiedOf816(op.ref);
        if (was.on) r.result = 'already emptied, by ' + was.by + ' at ' + was.at;
        else { if (setEmptied816(op.ref, true) !== true) throw new Error('setEmptied816 refused ' + op.ref); const now = emptiedOf816(op.ref); if (!now.on || now.by !== who) throw new Error(op.ref + ' is not emptied by ' + who + ' after the tick'); r.result = 'emptied (pumped out), recorded by ' + now.by + ' at ' + now.at; }
      } else if (op.op === 'unit_ready') {
        /* v12.42 (built as v12.38): a unit's own Ready tick through the page's own Singles1238.setUnitReady, as a person pressing Ready on that unit's
           card on the Demob tab. Only on Andrew's word. Every unit named must be on site on that reference. */
        const SG = window.Singles1238; if (!SG || typeof SG.setUnitReady !== 'function') throw new Error('the per-unit Ready tick is not on this page (v12.42 Demob cards)');
        const cards = op.units.map(u => SG.cardOf(op.ref, u));
        cards.forEach((c, i) => { if (!c) throw new Error(op.ref + ' has no unit ' + op.units[i]); if (c.st.s === 'gone') throw new Error(op.ref + ' ' + op.units[i] + ' has left'); });
        const todo = op.units.filter((u, i) => cards[i].st.s !== 'ready');
        if (todo.length && SG.setUnitReady(op.ref, todo, true) !== true) throw new Error('setUnitReady refused ' + op.ref);
        const after = op.units.map(u => SG.cardOf(op.ref, u));
        if (after.some(c => !c || c.st.s !== 'ready')) throw new Error(op.ref + ' units are not all Ready after the tick');
        r.result = todo.length + ' unit(s) ticked Ready by ' + who + (op.units.length - todo.length ? '; ' + (op.units.length - todo.length) + ' already ready' : '') + ': ' + op.units.join(', ');
      } else if (op.op === 'vms_arrival') {
        /* 27 Oct 2026: a board's arrival day on the VMS plan corrected through the plan's own writer, VMS1024.write (whose
           VMSArrival1098.prepare checks every arrival: a real day not after today, recorded now, in this person's name), as a
           person correcting it would. 1. the entry on the wrong day is withdrawn: "not confirmed" on that day, out of place
           (the page's own correction, as VMS21's 21 Oct entry was); a withdrawal takes the complete tick off, as the page
           does. 2. on site and in place on the day it came. 3. the reason in the board's notes only with notes_ok (Andrew's
           words): the plan's Notes box is its "Notes · special instructions", printed on the VMS board sheet for the crew;
           without notes_ok the notes are left as they are, and the stage says what the sheet prints now and what it would
           print with his OK. 4. a board that was complete is ticked complete again. Every earlier entry stays in the history. */
        if (typeof VMS1024 !== 'object' || typeof VMS1024.write !== 'function' || typeof VMSArrival1098 !== 'object' || typeof VMSArrival1098.evidence !== 'function' || typeof VMSArrival1098.setComplete !== 'function') throw new Error('the VMS plan is not on this page');
        const bd = VMS1024.board(op.pos); if (!bd) throw new Error('no VMS plan position ' + op.pos);
        if ((bd.board || bd.default_board) !== op.board) throw new Error('position ' + op.pos + ' carries ' + (bd.board || bd.default_board) + ', not ' + op.board);
        if (bd.canonicalIdentityConflict1103) throw new Error(op.board + ' has an identity conflict - not written');
        const ev = d => VMSArrival1098.evidence(VMS1024.rec(op.pos), d) || {}, w0 = ev(op.was), d0 = ev(op.day);
        const notesNow = () => String(VMS1024.notes(VMS1024.board(op.pos)) || '').trim();
        const putNotes = () => { /* what the board sheet prints under NOTES · SPECIAL INSTRUCTIONS: before, after, and with Andrew's OK */
          const n0 = notesNow(), n1 = n0.includes(op.why) ? n0 : (n0 ? n0 + ' ' : '') + op.why;
          if (op.notes_ok && n1 !== n0 && !VMS1024.write(op.pos, {notes: n1}, 'the board’s notes')) throw new Error('VMS1024.write refused the notes on ' + op.pos);
          const n2 = notesNow(); if (n2 !== (op.notes_ok ? n1 : n0)) throw new Error('VMS plan ' + op.pos + ' notes read ' + JSON.stringify(n2) + ', not ' + JSON.stringify(op.notes_ok ? n1 : n0));
          r.sheetNotes = {before: n0, after: n2, withOk: n1};
          return op.notes_ok ? '; the reason put in its notes (' + op.notes_ok + '): its board sheet prints under NOTES · SPECIAL INSTRUCTIONS ' + JSON.stringify(n2)
            : '; the reason kept out of its notes (no notes_ok): its board sheet prints under NOTES · SPECIAL INSTRUCTIONS ' + (n2 ? JSON.stringify(n2) : 'nothing') + ', as before; with Andrew\'s OK (notes_ok) it would print ' + JSON.stringify(n1); };
        if (w0.on === false && w0.state === 'not confirmed' && d0.on === true && d0.effectiveDate === op.day) r.result = 'already on site from ' + op.day + ' (the ' + op.was + ' entry withdrawn)' + putNotes();
        else {
          if (!(w0.on === true && w0.effectiveDate === op.was)) throw new Error('VMS plan ' + op.pos + ' is not on site from ' + op.was + ' (reads ' + JSON.stringify(w0) + ') - nothing to correct');
          if (d0.effectiveDate !== op.was) throw new Error('VMS plan ' + op.pos + ' already has an entry after ' + op.was + ' (' + JSON.stringify(d0) + ') - read its history first');
          const wasDone = !!(VMSArrival1098.status(op.board) || {}).done; r.wasDone = wasDone;
          if (!VMS1024.write(op.pos, {arrival1098: {state: 'not confirmed', effective_date: op.was, recorded_at: new Date().toISOString(), by: who}, inPlace: false}, 'the board arrival day')) throw new Error('VMS1024.write refused withdrawing the ' + op.was + ' entry on ' + op.pos);
          if (!VMS1024.write(op.pos, {arrival1098: {state: 'on site', effective_date: op.day, recorded_at: new Date().toISOString(), by: who}, inPlace: true}, 'the board arrival day')) throw new Error('VMS1024.write refused the arrival on ' + op.day + ' for ' + op.pos);
          const said = putNotes();
          if (wasDone && !(VMSArrival1098.status(op.board) || {}).done && !VMSArrival1098.setComplete(op.pos, true)) throw new Error('setComplete refused ' + op.pos + ' after the correction');
          const w1 = ev(op.was), d1 = ev(op.day), t1 = ev(todayIso()), done1 = !!(VMSArrival1098.status(op.board) || {}).done;
          if (w1.on !== false || !(d1.on === true && d1.installed === true && d1.effectiveDate === op.day) || !(t1.on === true && t1.effectiveDate === op.day) || done1 !== wasDone)
            throw new Error(op.board + ' does not read the ' + op.was + ' entry withdrawn and on site from ' + op.day + ' (' + JSON.stringify({was: w1, day: d1, today: t1, complete: done1}) + ')');
          r.result = 'VMS plan ' + op.pos + ' (' + op.board + '): the ' + op.was + ' entry withdrawn, on site and in place from ' + op.day + (wasDone ? ', complete ticked again' : '') + ', by ' + who + said;
        }
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
    log(`left_site ${applying ? 'APPLY' : 'DRY RUN'} - ${spec.ops.length} op(s) on ${REFS.join(', ')}${QIDS.length ? ' and notes on ' + QIDS.join(', ') : ''} - by ${spec.by}`);
    const before = await publicState();
    log(`before: record version ${before.version} updated ${before.updated}`);
    if (applying) { const dir = process.env.GC500_PRIVATE_DIR || HERE; fs.mkdirSync(dir, {recursive: true}); const bk = path.join(dir, 'backup_state_' + started + '.json'); fs.writeFileSync(bk, JSON.stringify(before, null, 1) + '\n', {mode: 0o600}); log('backup of the whole record before: ' + bk); }
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
    /* 27 Oct 2026: a document deleted on the page stays on the service with a tombstone in "deleted", and the page stops listing
       it (Kyle Gover's 27 and 28 Oct labour lines, deleted 15:52-15:53). That is not somebody editing: such a document is left
       out of both comparisons, and nothing is sent for it. */
    const hidden = new Set();
    for (const c of Object.keys(before.docs)) if (c !== 'deleted') for (const id of Object.keys(before.docs[c] || {})) if (before.docs[c][id] != null && (pageDocsBefore[c] || {})[id] == null && (before.docs.deleted || {})[id] != null) hidden.add(c + '/' + id);
    if (hidden.size) log('deleted on the page already (tombstone on the service, not listed by the page), left as they are: ' + [...hidden].join(', '));
    const drift = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsBefore)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsBefore[c] || {})])) if (!hidden.has(c + '/' + id) && !same((before.docs[c] || {})[id] ?? null, (pageDocsBefore[c] || {})[id] ?? null)) drift.push(c + '/' + id);
    if (drift.length) fail('the page record differs from the before snapshot (' + drift.length + '): ' + drift.slice(0, 8).join(', ') + ' - somebody is editing; try again');
    log('page record matches the before snapshot, document for document');
    for (const k of NEW_REFS) if (pageBefore.refs[k]) fail(k + ' already exists on the page - nothing applied');
    for (const k of REFS) { if (NEW_REFS.has(k)) { log(`  page before: ${k} not on the page yet (this run adds it)`); continue; } if (!pageBefore.refs[k]) fail(k + ' is not an asset on the page'); log(`  page before: ${k} numbers ${JSON.stringify(pageBefore.refs[k].numbers)} · light ${pageBefore.refs[k].light}, complete ${pageBefore.refs[k].done} · accessories ${JSON.stringify(pageBefore.refs[k].accessories)}`); }

    if (applying) {
      if (!controls.level || controls.level !== 'edit' || controls.readonly) fail('the service did not grant edit on this link (level ' + controls.level + ')');
      const allowGone = [...hidden].filter(k => (spec.allowRemove || []).includes(k));
      const aligned = await page.evaluate(alignStartupQueue, {serverDocs: before.docs, skip: [...hidden].filter(k => !allowGone.includes(k)), allow: allowGone});
      if (aligned.dropped.length) log('startup queue: left out of this run, not sent from here (deleted on the page already): ' + aligned.dropped.join(', '));
      if (aligned.kept.length) log('startup queue: the page\'s own delete kept and sent with this run (named in the spec: ' + (spec.allowRemoveWhy || '') + '): ' + aligned.kept.join(', '));
      log(`startup queue clear${aligned.restored.length ? ' (key order realigned for ' + aligned.restored.join(', ') + ')' : ''}`);
      if (!same((await publicState()).docs, before.docs)) fail('the record changed while the page was loading - try again');
    } else {
      if (pageBefore.waiting) log(`note: the page had ${pageBefore.waiting} document(s) waiting at startup (serialisation no-ops in a read-only run): ${Object.keys(pageBefore.queue).join(', ')}`);
    }

    /* 27 Oct 2026: moneySummary's charge and cost are objects (their totals are charge.total and cost.known); rounding the objects
       gave NaN, logged as null, so only the branch totals were really compared before */
    const money = () => page.evaluate(() => { try { const m = moneySummary(), c = x => Math.round(x * 100) / 100; const b = {}; try { pl752Rows().forEach(x => b[x.code] = Math.round(x.total * 100) / 100); } catch (e) {}
      let vms = null; try { vms = typeof VmsInstallation1228 === 'object' && VmsInstallation1228 ? VmsInstallation1228.model().rows.map(r => r.ref + ' ' + (r.charge ? r.charge.value : null)) : null; } catch (e) { vms = ['not read: ' + String(e).slice(0, 80)]; }
      return {charge: c(m.charge.total), labour: c(m.charge.labour), labour_ticks: m.charge.labour_ticks, card_hire: c(m.charge.card_hire), cost: c(m.cost.known), difference: c(m.difference), branches: b, vmsStandalone: vms}; } catch (e) { return {error: String(e).slice(0, 120)}; } });
    const moneyBefore = await money(); log('P&L before the stage: ' + JSON.stringify(moneyBefore));
    let vmsBefore = null; if (VBOARDS.length) { try { vmsBefore = await page.evaluate(pageVmsBoards, {boards: VBOARDS, days: VDAYS}); log('VMS plan boards before the stage: ' + JSON.stringify(vmsBefore)); } catch (e) { log('VMS plan boards before the stage: not read (' + e.message + ')'); } }
    try { const eq0 = await page.evaluate(() => { const s = todayWorkSummary848(todayIso()); const out = {}; for (const id in s.byId) { const a = s.byId[id]; if (id !== 'fencing') out[id] = a.done + '/' + a.total + ' ' + (a.pct == null ? '?' : Math.round(a.pct * 100) / 100) + '%'; } return out; });
      log('Today groups before the stage: ' + JSON.stringify(eq0)); } catch (e) { log('Today groups before the stage: not read (' + e.message + ')'); }
    const blockedBefore = harness ? harness.counts.blocked : counts.blocked;
    const results = await page.evaluate(applyOps, {ops: spec.ops, by: spec.by, dry: !applying}).catch(e => fail('stage: ' + e.message));
    results.forEach(r => { if (r.noteId) NOTE_IDS.add(r.noteId); });
    results.forEach(r => log(`stage: ${r.op} ${r.ref || r.id || (r.pos ? 'VMS plan ' + r.pos : '')} ${r.no || (r.from ? r.from + '->' + r.to : '') || r.state || r.type || ''} - ${r.result}`));
    /* 21 Oct: the derived Today figure the ops are meant to move, read from the page's own summary after the stage */
    try { const eq = await page.evaluate(() => { try { if (typeof bump === 'function') bump(); } catch (e) {} const s = todayWorkSummary848(todayIso()); const out = {}; for (const id in s.byId) { const a = s.byId[id]; if (id !== 'fencing') out[id] = a.done + '/' + a.total + ' ' + (a.pct == null ? '?' : Math.round(a.pct * 100) / 100) + '%'; } return out; });
      log('Today groups after the stage: ' + JSON.stringify(eq)); } catch (e) { log('Today groups after the stage: not read (' + e.message + ')'); }
    try { const rows = await page.evaluate(refs => { const out = []; for (const area of todayWorkMetrics840(todayIso())) for (const r of (area.rows || [])) if (refs.includes(r.key)) out.push(area.id + ': ' + JSON.stringify({key: r.key, quantity: r.quantity, done: r.done, complete: r.complete, status: r.status, detail: r.detail})); return out; }, PROBE_REFS);
      if (rows.length) log('Today rows for the new references: ' + rows.join(' | ')); } catch (e) { log('Today rows: not read (' + e.message + ')'); }
    try { const sc = await page.evaluate(refs => refs.filter(k => assetOf(k)).map(k => { const a = assetOf(k), r = Scope1017.record(a); return k + ': ' + (r ? 'stored at ' + r.at + ' ' + r.items.map(i => i.item + ' ' + i.received + '/' + i.installed + ' of ' + i.quantity + ' (suppliedAt ' + i.suppliedAt + ', onAt ' + i.onAt + ', doneAt ' + i.doneAt + ')').join(', ') + ' -> reads ' + r.items.map(i => { const x = Scope1017.read(a, i.item, deliveryOf(k), todayIso()); return x ? x.status : 'null'; }).join(', ') : 'no scope'); }), [...new Set([...PROBE_REFS, 'EQ0006'])]);
      log('quantity scopes: ' + sc.join(' | ')); } catch (e) { log('quantity scopes: not read (' + e.message + ')'); }
    try { const tp = await page.evaluate(refs => refs.filter(k => assetOf(k)).map(k => { const a = assetOf(k), day = window.PROGRESS_TO1163 || todayIso(), lines = chargeLines(a) || []; /* the progress views' own cut-off */
        const dA = deliveryAsOf(k, day), dO = deliveryOf(k);
        const f = (d) => { const x = toiletItem962(a, (lines[0] || {}).item, d, day, 0); return x ? x.status : 'null'; };
        return k + ' as at ' + day + ': lines ' + JSON.stringify(lines.map(l => [l.item, l.quantity, l.discipline])) + ' · asOf delivery ' + JSON.stringify({state: dA.state, done: dA.done, set_at: dA.set_at, done_at: dA.done_at, recorded: dA.recorded}) + ' -> ' + f(dA) + ' · live delivery -> ' + f(dO); }), PROBE_REFS);
      log('Today path probe: ' + tp.join(' | ')); } catch (e) { log('Today path probe: not read (' + e.message + ')'); }
    const moneyAfter = await money(); log('P&L after the stage: ' + JSON.stringify(moneyAfter));
    try { const ln = await page.evaluate(refs => refs.map(k => { const r = rentalOf(k); return k + ': ' + (r ? r.lines.map(x => x.rental_contract + '/' + x.line + ' ' + x.description + ' ' + (x.asset_no || '')).join('; ') : 'no contract line'); }), [...NEW_REFS]); if (ln.length) log('contract lines joined to the new references: ' + ln.join(' | ')); } catch (e) { log('contract lines: not read (' + e.message + ')'); }
    try { const g = await page.evaluate(refs => refs.map(k => { const a = assetOf(k); let issues = []; try { issues = (inventory().quantityIssues1012 || []).filter(x => x.ref === k).map(x => x.item); } catch (e) { issues = ['not read: ' + String(e).slice(0, 60)]; } let owners = []; try { owners = (assetNumbersOf(a) || []).map(n => n + ' on ' + (numberOwners(n, '') || []).map(o => o.key + ' (' + o.how + ')').join(', ')); } catch (e) { owners = ['not read: ' + String(e).slice(0, 60)]; } return k + ': group ' + EquipmentGroups1103.group(a) + ', quantity issues ' + JSON.stringify(issues) + ', drawing ' + JSON.stringify(a.drawing_links || []) + ', numbers ' + JSON.stringify(owners); }), [...NEW_REFS]); if (g.length) log('new references on the page: ' + g.join(' | ')); } catch (e) { log('new references: not read (' + e.message + ')'); }
    /* 27 Oct 2026, read only: what the page makes of each new reference, and the VMS plan boards before and after */
    let probeNew = null, vmsAfter = null;
    if (NEW_REFS.size) { try { probeNew = await page.evaluate(pageNewRefProbe, [...NEW_REFS]); probeNew.forEach(p => log('probe ' + p.key + ': ' + JSON.stringify(p))); } catch (e) { log('probe: not read (' + e.message + ')'); } }
    if (VBOARDS.length) { try { vmsAfter = await page.evaluate(pageVmsBoards, {boards: VBOARDS, days: VDAYS}); log('VMS plan boards after the stage: ' + JSON.stringify(vmsAfter)); } catch (e) { log('VMS plan boards after the stage: not read (' + e.message + ')'); } }
    /* 27 Oct 2026: the P&L gate. With spec.expect, what is charged to the V8s and the known costs move by exactly what the spec
       says, to the cent, and no branch total moves; otherwise nothing is sent (dry run or apply) */
    if (spec.expect) { const dl = (a, b) => Math.round((a - b) * 100) / 100, bad = [], bb = moneyBefore.branches || {}, ba = moneyAfter.branches || {};
      if (moneyBefore.error || moneyAfter.error) bad.push('the P&L was not read (' + (moneyBefore.error || moneyAfter.error) + ')');
      else {
        if (!Number.isFinite(moneyBefore.charge) || !Number.isFinite(moneyAfter.charge) || dl(moneyAfter.charge, moneyBefore.charge) !== spec.expect.chargeDelta) bad.push('charged to the V8s ' + moneyBefore.charge + ' -> ' + moneyAfter.charge + ' (moved ' + dl(moneyAfter.charge, moneyBefore.charge) + ', expected ' + spec.expect.chargeDelta + ')');
        if (!Number.isFinite(moneyBefore.cost) || !Number.isFinite(moneyAfter.cost) || dl(moneyAfter.cost, moneyBefore.cost) !== spec.expect.costDelta) bad.push('known costs ' + moneyBefore.cost + ' -> ' + moneyAfter.cost + ' (moved ' + dl(moneyAfter.cost, moneyBefore.cost) + ', expected ' + spec.expect.costDelta + ')');
        if (!Object.keys(bb).length) bad.push('no branch totals read');
        for (const code of new Set([...Object.keys(bb), ...Object.keys(ba)])) if (bb[code] !== ba[code]) bad.push('branch ' + code + ' ' + bb[code] + ' -> ' + ba[code]);
      }
      if (bad.length) fail('P&L gate: ' + bad.join('; ') + ' - nothing sent');
      log('P&L gate passed: charged to the V8s moved ' + dl(moneyAfter.charge, moneyBefore.charge) + ', known costs moved ' + dl(moneyAfter.cost, moneyBefore.cost) + ', every branch total unchanged (' + Object.keys(bb).length + ' branches)'); }
    const pageAfter = await page.evaluate(pageSnapshot, {refs: REFS, qids: QIDS});
    const pageDocsAfter = await page.evaluate(pageDocs);
    const changed = [];
    for (const c of new Set([...Object.keys(before.docs), ...Object.keys(pageDocsAfter)])) for (const id of new Set([...Object.keys(before.docs[c] || {}), ...Object.keys(pageDocsAfter[c] || {})])) if (!hidden.has(c + '/' + id) && !same((before.docs[c] || {})[id] ?? null, (pageDocsAfter[c] || {})[id] ?? null)) changed.push(c + '/' + id);
    const outside = changed.filter(k => !allowed(k, pageDocsAfter[k.slice(0, k.indexOf('/'))][k.slice(k.indexOf('/') + 1)], pageDocsAfter));
    for (const k of hidden) if ((spec.allowRemove || []).includes(k)) { expected.set(k, 'null'); log('plan removes ' + k + ' (deleted on the page already; named in the spec: ' + (spec.allowRemoveWhy || '') + ')'); }
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
        if (op.op === 'light' && op.at) { const hs = ((((docs.delivery || {})[op.ref] || {}).history) || []).filter(h => h && h.state === op.state), h = hs[hs.length - 1]; if (!h || h.at !== op.at || (op.why && h.note !== op.why)) problems.push(op.ref + ' light history entry is not dated ' + op.at + (op.why ? ' with its reason' : '') + ' ' + where); } /* 27 Oct 2026 */
        if (op.op === 'light_redate') { const dd = (docs.delivery || {})[op.ref] || {}; const hs = (dd.history || []).filter(h => h && h.state === 'on site'), h = hs[hs.length - 1]; if (dd.state !== 'on site' || dd.set_at !== op.at || !h || h.at !== op.at || !String(h.note || '').includes(op.why)) problems.push(op.ref + ' arrival is not dated ' + op.at + ' with its reason ' + where); }
        if (op.op === 'acc_add' && !((((docs.accessories || {})[op.ref] || {}).v) || []).some(x => String(x.asset_no || '') === op.no && x.type === op.type)) problems.push(op.ref + ' has no ' + op.type + ' ' + op.no + ' ' + where);
        if (op.op === 'acc_fix') { const v = (((docs.accessories || {})[op.ref] || {}).v) || []; if (!v.some(x => String(x.asset_no || '') === op.to && x.type === op.type) || v.some(x => String(x.asset_no || '') === op.from)) problems.push(op.ref + ' ' + op.type + ' is not ' + op.to + ' ' + where); }
        if (op.op === 'po') { const o = (docs.purchaseOrders || {})[op.number]; if (!o) problems.push('purchase order ' + op.number + ' is not held ' + where); else for (const k of ['supplier_name', 'stream', 'what', 'period', 'branch', 'revenue_branch', 'confirmed'].concat(['amount', 'note', 'invoice_no', 'receipted'].filter(f => op[f] !== undefined))) if (JSON.stringify(o[k] ?? null) !== JSON.stringify(op[k] ?? null)) problems.push('purchase order ' + op.number + ' ' + k + ' differs ' + where); }
        if (op.op === 'answer') { const nid = (results.find(x => x.op === 'answer' && x.id === op.id) || {}).noteId || op.id; if ((((docs.answers || {})[nid] || {}).v) !== op.text) problems.push('note ' + nid + ' is not held ' + where); }
        if (op.op === 'unit_reidentify' && !Object.values(docs.loads || {}).some(u => u && u.kind === 'unit925-record' && u.ref === op.ref && String(u.assetNo) === op.no && u.item === op.item && u.active !== false && !u.removedBy && (u.owner || 'coates') === (op.owner || 'coates') && (op.label == null || u.label === op.label))) problems.push(op.ref + ' has no active ' + op.item + ' unit ' + op.no + ' (owner ' + (op.owner || 'coates') + (op.label != null ? ', label ' + op.label : '') + ') ' + where);
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
        if (op.op === 'vms_arrival') { /* 27 Oct 2026: the withdrawal and the arrival in this person's name, the earlier entry kept, the reason in the notes only with notes_ok, complete again if it was */
          const L = (docs.loads || {})['vms1024~2f~' + op.pos] || {}, evs = Array.isArray(L.events1098) ? L.events1098 : [], wasDone = ((results.find(x => x.op === 'vms_arrival' && x.pos === op.pos)) || {}).wasDone, ce = (Array.isArray(L.completionEvents1101) ? L.completionEvents1101 : []).slice(-1)[0] || L.completion1101;
          if (!evs.some(e => e && e.state === 'not confirmed' && e.effective_date === op.was && e.by === spec.by && e.inPlace === false)) problems.push('VMS plan ' + op.pos + ' has no withdrawal of the ' + op.was + ' entry by ' + spec.by + ' ' + where);
          if (!evs.some(e => e && e.state === 'on site' && e.effective_date === op.day && e.by === spec.by && e.inPlace === true) || !(L.arrival1098 && L.arrival1098.state === 'on site' && L.arrival1098.effective_date === op.day) || L.inPlace !== true) problems.push('VMS plan ' + op.pos + ' is not on site and in place from ' + op.day + ' by ' + spec.by + ' ' + where);
          if (!evs.some(e => e && e.state === 'on site' && e.effective_date === op.was)) problems.push('VMS plan ' + op.pos + ' lost its ' + op.was + ' entry from the history ' + where);
          /* the notes print on the board sheet as special instructions: the reason there only with notes_ok, otherwise the notes untouched */
          if (op.notes_ok) { if (!String(L.notes || '').includes(op.why)) problems.push('VMS plan ' + op.pos + ' notes do not hold the reason ' + where); }
          else if (!same(L.notes ?? null, ((((before.docs || {}).loads || {})['vms1024~2f~' + op.pos]) || {}).notes ?? null)) problems.push('VMS plan ' + op.pos + ' notes changed without notes_ok (they print on the board sheet as special instructions) ' + where);
          if (wasDone === true && !(ce && ce.done === true)) problems.push(op.board + ' is not complete again ' + where); }
        if (op.op === 'hire_start') { const h = (docs.hireStart || {})[op.ref]; if (!h || (h.v !== undefined ? h.v : h) !== op.iso) problems.push(op.ref + ' hire start is not ' + op.iso + ' ' + where); }
        if (op.op === 'branch') { const b = (docs.branch || {})[op.ref] || (docs.branch || {})[String(op.ref).replace(/\?/g, '~3f~')]; if (!b || (b.v !== undefined ? b.v : b) !== op.code) problems.push(op.ref + ' branch is not ' + op.code + ' ' + where); }
        if (op.op === 'note_append' && !String(((docs.delivery || {})[op.ref] || {}).note || '').includes(op.text)) problems.push(op.ref + ' note lacks the added text ' + where);
        if (op.op === 'spare_use' && (docs.spares || {})[op.id]) problems.push(op.no + ' still in spares ' + where);
        if (op.op === 'sub_move') { const has = r => (((docs.units || {})[r] || {}).units || []).some(u => String(u.asset_no || '') === op.no); if (has(op.from) || !has(op.to)) problems.push(op.no + ' is not moved from ' + op.from + ' to ' + op.to + ' ' + where); }
        if (op.op === 'place') { const D = (docs.places || {})[op.ref] || {}, P = D.v || D; /* a value-kind collection: the document holds {v} */ if (P.lat !== op.lat || P.lon !== op.lon) problems.push(op.ref + ' is not placed at ' + op.lat + ', ' + op.lon + ' ' + where); }
        if (op.op === 'add_ref') { const ad = (docs.added || {})[op.ref], nt = (docs.notes || {})[op.ref], br = (docs.branch || {})[op.ref];
          if (!ad || ad.discipline !== op.disc || ad.name !== op.name || (op.no && !(ad.asset_numbers || []).includes(op.no))) problems.push(op.ref + ' is not added as ' + op.name + ' ' + (op.no || '(no number)') + ' ' + where);
          /* 27 Oct 2026: its item type, its number or none, its in and out days */
          if (ad && (JSON.stringify(ad.item_types) !== JSON.stringify([op.type]) || (op.no ? !(ad.asset_numbers || []).includes(op.no) : (ad.asset_numbers || []).length !== 0) || (ad.first_date ?? null) !== (op.from ?? null) || (ad.last_date ?? null) !== (op.to ?? null))) problems.push(op.ref + ' is not added as ' + op.type + ', ' + (op.no || 'no number') + ', in ' + (op.from || '-') + ', out ' + (op.to || '-') + ' ' + where);
          if (((nt && typeof nt === 'object') ? nt.v : nt) !== op.note) problems.push(op.ref + ' note is not the contract line ' + where);
          if (((br && typeof br === 'object') ? br.v : br) !== op.branch) problems.push(op.ref + ' branch is not ' + op.branch + ' ' + where); }
        if (op.op === 'date_back') { const enc = x => x.replace(/\//g, '~2f~').replace(/\|/g, '~7c~').replace(/ /g, '~20~').replace(/&/g, '~26~'); const sv = k => { const v = (docs.stamps || {})[enc(k)]; return v && typeof v === 'object' ? v.v : v; };
          if (op.done_at && (((docs.delivery || {})[op.ref] || {}).done_at) !== op.done_at) problems.push(op.ref + ' complete is not dated ' + op.done_at + ' ' + where);
          if (op.supplied_at && sv('supplied/' + op.ref + '/' + op.item) !== op.supplied_at) problems.push(op.ref + ' receipt is not dated ' + op.supplied_at + ' ' + where);
          if (op.install_at && sv('labour/' + op.ref + '|' + op.disc + '|' + op.item + '|install') !== op.install_at) problems.push(op.ref + ' install is not dated ' + op.install_at + ' ' + where); }
        if (op.op === 'set_qty' && op.qty !== '' && op === spec.ops.filter(o => o.op === 'set_qty' && o.ref === op.ref).slice(-1)[0] && ((((docs.qtys || {})[op.ref] || {}).v)) !== op.qty) problems.push(op.ref + ' quantity is not ' + op.qty + ' ' + where); /* only the last quantity set on a reference must hold */
        if (op.op === 'unit_ready') { const um = (((docs.delivery || {})[op.ref] || {}).ready1238_units) || {}, miss = op.units.filter(u => !(um[u] && um[u].on === true && um[u].by === spec.by)); if (miss.length) problems.push(op.ref + ' units not Ready by ' + spec.by + ' on the record: ' + miss.join(', ') + ' ' + where); }
        if (op.op === 'emptied') { const dd = (docs.delivery || {})[op.ref] || {}, had = /^already emptied/.test(((results.find(x => x.op === 'emptied' && x.ref === op.ref)) || {}).result || ''); if (dd.emptied !== true || !dd.emptied_at || (!had && dd.emptied_by !== spec.by)) problems.push(op.ref + ' is not emptied (pumped out) by ' + spec.by + ' ' + where); }
        if (op.op === 'depart') { const dd = (docs.delivery || {})[op.ref] || {}, hits = (dd.history || []).filter(h => h && h.collection996 && h.collection996.kind === 'collection' && h.collection996.departedAt1211 === op.at && h.collection996.date === op.at.slice(0, 10) && h.by === spec.by && op.nos.every(no => (h.collection996.items || []).some(i => (i.numbers || []).map(String).includes(no))));
          if (hits.length !== 1) problems.push(op.ref + ' has ' + hits.length + ' departure entries at ' + op.at + ' for ' + op.nos.join(', ') + ', not 1 ' + where);
          if (op.complete === true && (dd.state !== 'in transit' || !(hits[0] && hits[0].collection996.complete === true))) problems.push(op.ref + ' has not left in full (light ' + dd.state + ') ' + where);
          if (op.complete === false && dd.state !== 'on site') problems.push(op.ref + ' light is ' + dd.state + ', not on site ' + where); }
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
      money: {before: moneyBefore, after: moneyAfter}, probe: {newRefs: probeNew, vmsBoards: {before: vmsBefore, after: vmsAfter}}, stage: results, writes: [...expected.keys()].map(k => ({key: k, status: acks.get(k) ?? null})), refused, mapSessionsBlocked: counts.mapSessions,
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
