#!/usr/bin/env node
/* Author: Andrew Fisher.
   28 Oct 2026: the daily pre-starts for the days ahead (every weekday 29 Oct - 13 Nov 2026) - one PDF a day for the
   Coates Installs crew and one for the Advanced Temporary Fencing crew, prefilled with the day's planned work, crew,
   equipment and hazards, for the crew to tick and sign at the pre-start (names printed, signatures left to each
   person). Adapted from record_15Oct2026_prestarts_signed/generate_prestarts.cjs. Earlier notes:
   Builds the daily pre-start records - from the GC500 page's own record, read only, and writes the manifest upload_prestarts.py
   reads. Nothing here writes to the service: the page is opened through the toolchain harness, which aborts every
   write the page tries, and the PDFs are made from the data it read.

     node generate_prestarts.cjs                              # read the live page, build every day in scope
     node generate_prestarts.cjs --page live.html             # read a local copy of the live page instead (still live data)
     node generate_prestarts.cjs --days 2026-10-06,2026-10-07 # only these days
     node generate_prestarts.cjs --crew fencing               # one crew (coates | fencing)
     node generate_prestarts.cjs --snapshot evidence/record_snapshot.json   # rebuild from a snapshot, no browser read
     node generate_prestarts.cjs --out /somewhere             # write pdfs/, manifest.json and evidence/ there

   What a record is built from (the page's own functions, v10.18):
     Coates Installs  - ps7Day/ps7Loads/ps7Disc/ps7Counts/ps7Sectors/ps7LoadsTable for the day's loads and drops,
                        crew883Day for who worked (names as the record holds them), allDockets for the fencing that
                        went in the same day, PS7 for the form (the record form GC500-PS-INS-01 v1: the first ten
                        hazards and ten rules, as the 14 and 21 Sep 2026 records show).
     Fencing          - allDockets for the signed dockets dated that day (stock transfers to a yard are not a day's
                        work and are left out), DATA.fence.columns for the quantity names, DATA.team.people for the
                        crew; where no docket is on the record for a day, the week's installation plan rows dated
                        that day (DATA.fencing.week_sheets), and the manifest entry carries "confirm".
   A day with nothing on the record for a crew is skipped and listed with its reason in evidence/build.json.
   Form content for the fencing crew (GC500-PS-ATF-01 v1) is the 14 Sep 2026 record's, word for word.
   The sign-off is Andrew Fisher, Shutdown Manager, on the date given by --signed (default 2026-10-15). */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');

const HERE = __dirname;
const TOOLCHAIN = path.join(HERE, '..', 'toolchain');
const SIGNER = 'Andrew Fisher', SIGNER_TITLE = 'Shutdown Manager';
const RECORDED_BY = 'Andrew Fisher, Events Project Manager';
const CREWS = {coates: 'Coates Installs', fencing: 'Advanced Temporary Fencing'};
const FENCE_CREW_NAME = 'Advanced Temporary Fencing';
const ADDED_FENCE_NAME_ON = {'Hayden Mcavoy': '2026-10-08'};   /* the ninth name, added to the crew by the project manager on 8 Oct 2026 */
/* the names of the assistants a record must never carry, held encoded so this code names none of them itself */
const AGENT_WORDS = new RegExp('\\b(' + Buffer.from('Y29kZXh8Y2xhdWRlfGFyZ29ufGdlbWluaXxhbnRocm9waWN8b3BlbmFpfGNoYXRncHR8Y29waWxvdA==', 'base64').toString() + ')\\b|\\bvia\\s+[A-Z]', 'i');

/* ----------------------------------------------------------------------------------------------------- arguments */
function args() {
  const a = {page: null, out: HERE, days: null, crew: null, signed: '2026-10-15', snapshot: null, form: 'v1', chromium: process.env.CHROMIUM_PATH || null};
  const v = process.argv.slice(2);
  for (let i = 0; i < v.length; i++) {
    const k = v[i], n = v[i + 1];
    if (k === '--page') a.page = n, i++;
    else if (k === '--out') a.out = path.resolve(n), i++;
    else if (k === '--days') a.days = n.split(',').map(s => s.trim()).filter(Boolean), i++;
    else if (k === '--crew') a.crew = n, i++;
    else if (k === '--signed') a.signed = n, i++;
    else if (k === '--snapshot') a.snapshot = n, i++;
    else if (k === '--form') a.form = n, i++;
    else if (k === '--help' || k === '-h') { console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^\/\*\s*/, '')); process.exit(0); }
    else throw new Error('unknown option ' + k);
  }
  if (a.crew && !CREWS[a.crew]) throw new Error('--crew wants coates or fencing');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(a.signed)) throw new Error('--signed wants YYYY-MM-DD');
  if (!['v1', 'v2'].includes(a.form)) throw new Error('--form wants v1 or v2');
  return a;
}

/* ------------------------------------------------------------------------------------------------- days in scope */
function range(from, to) { const out = []; for (let t = Date.parse(from + 'T00:00:00Z'); t <= Date.parse(to + 'T00:00:00Z'); t += 86400000) out.push(new Date(t).toISOString().slice(0, 10)); return out; }
/* 28 Oct 2026: every weekday from tomorrow to the end of demob (Fri 13 Nov 2026), both crews */
const WEEKDAYS = range('2026-10-29', '2026-11-13').filter(d => { const w = new Date(d + 'T00:00:00Z').getUTCDay(); return w !== 0 && w !== 6; });
const SCOPE = {coates: WEEKDAYS, fencing: WEEKDAYS};

/* ----------------------------------------------------------------------------------------------- read the record */
async function readRecord(a, days) {
  const {open} = require(path.join(TOOLCHAIN, 'harness', 'open_page.js'));
  const s = await open({pageFile: a.page || undefined, hash: '#prestarts', W: 1000, H: 1200});
  await s.page.waitForFunction(() => typeof ps7Page === 'function' && typeof allDockets === 'function' && typeof crew883Day === 'function' && SYNC.status === 'live', null, {timeout: 240000});
  await s.page.waitForTimeout(4000);
  const snap = await s.page.evaluate(arg => {
    const plain = x => JSON.parse(JSON.stringify(x === undefined ? null : x));
    const out = {read_at: new Date().toISOString(), today: todayIso(), days: {}, dockets: [], programme: {}, files: null};
    out.page_version = (document.body.innerText.match(/v10\.\d+/) || [null])[0];
    try { out.record_version = SYNC.version || (SYNC.db && SYNC.db.version) || null; } catch (e) { out.record_version = null; }
    out.PS7 = plain(PS7); out.css = PS7_CSS;
    out.FCOL = (FCOL || []).map(c => ({key: c.key, name: c.name_as_written, programme_type: c.programme_type, unit: c.unit}));
    out.team = plain(((DATA.team || {}).people || []).map(p => ({name: p.name, event_role: p.event_role, group: p.group, company: p.company, title: p.title})));
    try { const idx = photoIndex(); if (idx.state === 'ready' && idx.files) out.files = Object.values(idx.files).filter(f => /pre.?start/i.test(String(f.title || '') + ' ' + String(f.id || ''))).map(f => ({id: f.id, title: f.title, kind: f.kind, bytes: f.bytes, sha256: f.sha256, uploaded: f.uploaded})); } catch (e) { out.files_error = String(e && e.message); }
    for (const iso of arg.days) {
      const d = ps7Day(iso), L = d ? ps7Loads(d) : [];
      let roster = null; try { roster = StaffNames910.day(iso).roster.map(r => r.name); } catch (e) {}
      const tk = d ? ps7Ticks(d) : null;
      out.days[iso] = {
        in_programme: !!d, empty: !!(d && d.empty), words: ps7Words(iso),
        on: d ? ps7Disc(d.deliveries) : {}, off: d ? ps7Disc(d.removals) : {},
        counts: d ? ps7Counts(d) : '', sectors: d ? ps7Sectors(d) : [],
        ticks: tk ? [...tk.t] : [], ticks_basis: tk ? tk.basis : 'none',
        loads: L.map(r => plain({item: r.item || r.product || '', time: r.load_time_24h || r.time_24h || r.time || '', eta: r.site_eta_planning || r.site_eta || '', early: !!r.early, booking: !!r.booking801, refs: r.candidate_refs || r.refs || [], drop: r.drop_point || r.drop_point_state || '', carrier: r.carrier || ''})),
        loads_table: d ? ps7LoadsTable(d) : '',
        crew: plain(crew883Day(iso)), roster,
      };
    }
    out.dockets = plain(allDockets().filter(x => x.date && arg.days.includes(x.date)).map(x => ({
      id: x.id, docket_no: x.docket_no || null, date: x.date, week: x.week, crew: x.crew, location: x.location, quantities: x.quantities || {},
      components: x.components || null, signed_by: x.signed_by || null, scope: x.scope || null, origin: x.origin || null, record_type: x.record_type || null,
      programme_sheet: x.programme_sheet || null, usable: x.usable,
      service_note: x.source_review && x.source_review.service ? {note_no: x.source_review.service.note_no, date: x.source_review.service.date, location: x.source_review.service.location, crew_note: x.source_review.service.crew_note, labour_hours: x.source_review.service.labour_hours} : null,
    })));
    const push = (date, row) => { (out.programme[date] = out.programme[date] || []).push(row); };
    for (const w of ((DATA.fencing || {}).week_sheets || [])) {
      (w.programme_rows951 || []).forEach(r => { if (arg.days.includes(r.date)) push(r.date, plain({source: 'programme', sheet: w.sheet, row: r.source_row, location: r.location, description: r.description, quantities: r.quantities || {}, notes: (r.notes || []).map(n => n.text), included: r.included})); });
      const u = w.plan_update;
      if (u) (u.rows_by_day || []).forEach(day => (day.rows || []).forEach(r => { if (arg.days.includes(day.date)) push(day.date, plain({source: 'plan_update', sheet: w.sheet, title: u.title || null, revision: u.revision || null, created: u.created_display || null, id: r.id || null, location: r.location, description: r.description, quantities: r.fields || {}, note: r.note || null, flag: r.flag || null, requirements: (r.requirements || []).map(q => q.text)})); }));
    }
    return out;
  }, {days});
  snap.harness = {blocked_writes: s.counts.blocked, live_requests: s.counts.live, page_errors: s.errors};
  await s.browser.close();
  return snap;
}

/* ------------------------------------------------------------------------------------------------------ helpers */
const esc = v => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const box = on => `<i class="bx${on ? ' checked' : ''}"></i>`;
const h2 = (n, t, em) => `<h2><i>${n}</i> ${t}${em ? `<em>${em}</em>` : ''}</h2>`;
const dmy = iso => { const d = new Date(iso + 'T00:00:00Z'); return `${d.getUTCDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const words = (snap, iso) => (snap.days[iso] && snap.days[iso].words) || iso;
const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;

/* the six Coates Life Saving Rules, as the 14 Sep 2026 records carry them */
const LIFE = [
  ['Risk Assessment', 'lsr-a', 'I will not commence any work that I am unfamiliar with, that is non-routine, potentially hazardous or impacted by changing conditions without first completing the appropriate Coates risk assessment tool to identify, assess and control risks.'],
  ['High-Risk Work', 'lsr-b', 'I will not commence any High-Risk Work without a risk assessment being completed and without having signed onto the applicable Safe Work Method Statement (SWMS).'],
  ['Training and Competency', 'lsr-c', 'I will be inducted, trained, competent and hold the required certification and licenses to conduct the task.'],
  ['Fit for Work', 'lsr-d', 'When I commence work, I will be physically fit, and not impaired by fatigue, injury, distraction, drugs or alcohol. I will wear the required personal protective equipment (PPE) as identified for the task or site rules.'],
  ['Tools and Equipment', 'lsr-e', 'I will only use tools and equipment that are fit for purpose and for which I am trained, competent and authorised. I will ensure that damaged or defective equipment is tagged out and removed from service.'],
  ['Critical Risk Non-Negotiables', 'lsr-f', 'When I commence a work activity related to a Coates Top 10 Critical Risk, I will always ensure that I review and strictly adhere to the non-negotiable rules and controls for that Critical Risk to protect me, my workmates and others from serious harm.'],
];
/* the fencing crew's form, GC500-PS-ATF-01 v1, as the 14 Sep 2026 record carries it */
const FENCE_WORK = [
  ['clean', 'Temporary Fence (m) — Clean', 0], ['v_gates', 'Vehicle Gates', 0], ['traffic', 'Working around live traffic', 0], ['scrimcloth', 'Scrim and shade cloth, braced', 0],
  ['scrim', 'Temporary Fence (m) — Braced for Scrim', 1], ['ped_gates', 'Ped. Gates', 1], ['plant', 'Plant movement on and around the front', 1], ['handover', 'Hand over the line and sign the docket', 1],
  ['relocation', 'Temporary Fence (m) — Relocation', 2], ['ccb_event', 'Crowd Control Barriers (m) — Event', 2], ['spotting', 'Spotting', 2],
  ['removal', 'Temporary Fence (m) — Removal', 3], ['ccb_demarc', 'Crowd Control Barriers (m) — Demarcation', 3], ['public', 'Public and pedestrian management', 3],
];
const FENCE_ALWAYS = ['traffic', 'plant', 'spotting', 'public', 'scrimcloth', 'handover'];
const FENCE_HAZARDS = [
  ['Working next to live traffic', 'The fence line follows live roads on this circuit. Traffic control in place and signed to the plan before anyone steps off the kerb. Nobody in a running lane without a controller. Panels carried inside the closure, never across a lane.', 'SWMS temporary fencing · Traffic Management Plan'],
  ['Manual handling — panels, feet and blocks', 'Two people to a panel. Feet and blocks lifted with the legs, close to the body, never twisted. Stack at waist height where you can. A panel is a sail — do not carry one on your own in wind.', 'SWMS temporary fencing · crowd control barriers'],
  ['Wind on scrim and shade cloth', 'Scrim turns a fence into a sail. Braced as the drawing says, feet doubled where it is braced, and the line checked after wind. Do not hang cloth on an unbraced run.', 'SWMS temporary fencing · braced for scrim'],
  ['The public on the other side of it', 'The line closes behind the crew as it goes in — no gap left open at a break, no panel left standing loose. Pedestrians walk round, not through. Anything sharp or proud gets capped or turned in.', 'iEDM site rules · crowd control barriers'],
  ['Plant working the same front', 'Crane and forklift move on the same fronts as this crew. Stay out of the swing and out of the reversing lanes; catch the operator’s eye before you cross. If you cannot see them, they cannot see you.', 'SEQ-SWMS-009.01g · steps 2, 6'],
  ['Spotting — every reverse, every lift', 'A spotter on every truck reverse and every panel lift beside the public line, in sight of the driver, agreed signals before it starts. Everything stops the moment sight is lost.', 'SEQ-SWMS-009.01g · spotting'],
  ['Gates — vehicle and pedestrian', 'A gate is the one part of the line that moves, so it is the one part that fails. Hung square, latched, and never left swinging into a lane or a footpath. Who holds the key is agreed before it goes in.', 'SWMS temporary fencing · vehicle and ped gates'],
  ['Underground services and surfaces', 'Nothing is driven into the ground on this site. Feet sit on the surface; blocks take the load. Damage to a kerb, a paver or a service pit is reported the same day, not at the end of the job.', 'iEDM site rules · SEQ-RM-010d'],
];
const FENCE_RULES = [
  'iEDM site induction done — every person, before starting',
  'Site hours 07:00–17:00 Monday to Friday unless iEDM approves otherwise',
  'Report to the Coates contact and site office on arrival',
  'Traffic Management Plan in place and signed before the line goes in',
  'SWMS signed: temporary fencing and crowd control barriers',
  'Tickets held by the person doing it — WC · LF · traffic control',
  'The docket signed on site for what actually went in, that day',
  'Line closed behind you — no gap, no loose panel, gates latched',
  'Water, hat, breaks · spotter near the public · report it straight away',
  'Anything damaged — kerb, paver, service pit — reported the same day',
];
/* the record form for the install crew, GC500-PS-INS-01 v1: the first ten hazards and ten rules of the page's form,
   which the 14 and 21 Sep 2026 records carry word for word; v2 is the whole of the page's current form */
const V1_HAZARD_TITLES = ['Crane lifts — buildings and toilets', 'Forklift — unloading, loading, carrying', 'Jacking and levelling — the supervisor checks it first', 'Blocks and packers and the 20 kg limit', 'Stairs and landings', 'Spotting — every load, every reverse', 'Water barriers — moving and placing', 'Driving the track and Macintosh Park', 'Escorting a truck', 'Trucks — tray access and restraint'];

function coatesForm(PS7, form) {
  const hazards = form === 'v1' ? PS7.hazards.slice(0, 10) : PS7.hazards;
  const rules = form === 'v1' ? PS7.rules.slice(0, 10) : PS7.rules;
  if (form === 'v1') {
    const got = hazards.map(h => h[0]);
    if (JSON.stringify(got) !== JSON.stringify(V1_HAZARD_TITLES)) throw new Error('the page’s first ten hazards are not the v1 record form’s: ' + JSON.stringify(got));
    if (rules.length !== 10 || !/induction/.test(rules[0]) || !/Water, hat, breaks/.test(rules[9])) throw new Error('the page’s first ten rules are not the v1 record form’s');
  }
  return {hazards, rules, id: form === 'v1' ? 'GC500-PS-INS-01 v1' : 'GC500-PS-INS-01 v2'};
}

/* -------------------------------------------------------------------------------------------- shared page pieces */
function lifeHtml() {
  return `<div class="lsr">${LIFE.map(([n, c, w]) => `<div class="lsrow"><span class="lsrn ${c}"><span>${esc(n)}</span></span><span class="lsrt">${box(false)}${esc(w)}</span></div>`).join('')}</div>`;
}
function hazardsHtml(list) {
  return `<div class="hzs hz4">${list.map(([h, b, s]) => `<div class="hz"><label>${box(false)}<b>${esc(h)}</b></label><p>${b}</p><span>${esc(s)}</span></div>`).join('')}</div>`;
}
function rulesHtml(list, cols) {
  const q = Math.ceil(list.length / cols), rc = [];
  for (let i = 0; i < cols; i++) rc.push(list.slice(i * q, i * q + q));
  return `<div class="rules rl${cols}">${rc.map(c => '<div>' + c.map(x => `<label class="rl">${box(false)}<span>${x}</span></label>`).join('') + '</div>').join('')}</div>`;
}
function emergencyHtml(PS7) {
  return `<div class="emg"><div class="emg-000"><div class="emg-h">ALL EMERGENCIES</div><div class="emg-n">${esc(PS7.emg_primary)}</div>
 <div class="emg-s">Say: <b>${esc(PS7.venue)}</b>, nearest gate or corner, what you can see.</div>
 ${PS7.emg.map(c => `<div class="emg-r"><span>${esc(c.name)}</span><b>${esc(c.phone)}</b></div>`).join('')}
 <div class="emg-s">Nearest muster point to this front: <span class="rule"></span></div></div>
 <div class="emg-c"><div class="emg-h">COATES ON SITE</div>${PS7.coates.map(p => `<div class="emg-r"><span>${esc(p.name)} · ${esc(p.role)}</span><b>${esc(p.mobile)}</b></div>`).join('')}<div class="emg-r"><span>Coates</span><b>13 15 52</b></div></div>
 <div class="emg-c"><div class="emg-h">iEDM</div>${PS7.iedm.map(c => `<div class="emg-r"><span>${esc(c.name)} · ${esc(c.role)}</span><b>${esc(c.phone)}</b></div>`).join('')}</div></div>`;
}
/* the attendance table: names as the record holds them, ticked as attending; FIT and the signature are each
   person's own and stay blank. Blank numbered rows where the record holds a count but no names. */
function attendHtml(rows) {
  const half = Math.ceil(rows.length / 2);
  const row = (i, w) => w ? `<tr><td class="n">${i}</td><td><b>${esc(w.name)}</b>${w.role ? `<span class="rl2"> · ${esc(w.role)}</span>` : ''}</td><td class="fit">${box(false)}</td><td class="fit">${box(false)}<span>Y</span>${box(false)}<span>N</span></td><td></td></tr>`
    : `<tr><td class="n">${i}</td><td></td><td class="fit">${box(false)}</td><td class="fit">${box(false)}<span>Y</span>${box(false)}<span>N</span></td><td></td></tr>`;
  const table = (chunk, start) => `<table class="so"><colgroup><col style="width:7%"><col style="width:45%"><col style="width:13%"><col style="width:17%"><col style="width:18%"></colgroup><thead><tr><th class="n">#</th><th>NAME (PRINT)</th><th>AT</th><th>FIT · Y/N</th><th>SIGNATURE</th></tr></thead><tbody>${chunk.map((w, i) => row(start + i, w)).join('')}</tbody></table>`;
  return '<div class="sotwo">' + table(rows.slice(0, half), 1) + table(rows.slice(half), half + 1) + '</div>';
}
function signoffHtml() {
  return `<table class="so sof"><colgroup><col style="width:30%"><col style="width:30%"><col style="width:25%"><col style="width:15%"></colgroup><thead><tr><th>PRE-START RUN BY (PRINT)</th><th>SUPERVISOR SIGN-OFF (PRINT)</th><th>SIGNATURE</th><th>TIME</th></tr></thead><tbody><tr><td></td><td></td><td></td><td></td></tr></tbody></table>`;
}

/* ----------------------------------------------------------------------------------------- the fencing quantities */
function qLabel(snap, key) { const c = snap.FCOL.find(x => x.key === key); return c ? (c.programme_type || c.name || key) : key.replace(/_/g, ' '); }
function qUnit(snap, key) { const c = snap.FCOL.find(x => x.key === key); return c ? (c.unit || '') : (/(gate|block|feet)/.test(key) ? '' : 'm'); }
function qFmt(n, unit) { n = Number(n); return unit === 'm' ? n.toFixed(1) : (Number.isInteger(n) ? String(n) : n.toFixed(1)); }
function sumQuantities(dockets) {
  const q = {}; dockets.forEach(d => Object.entries(d.quantities || {}).forEach(([k, n]) => { if (Number(n) > 0) q[k] = Math.round(((q[k] || 0) + Number(n)) * 100) / 100; })); return q;
}
function sumComponents(dockets) {
  const c = {}; dockets.forEach(d => Object.entries(d.components || {}).forEach(([k, n]) => { if (Number(n) > 0) c[k] = (c[k] || 0) + Number(n); })); return c;
}
const compWords = c => Object.entries(c).map(([k, n]) => `${k.replace(/_/g, ' ')} ${n}`).join(' · ');
const qWords = (snap, q) => Object.entries(q).map(([k, n]) => `${qLabel(snap, k)}: ${qFmt(n, qUnit(snap, k))}`).join(' · ');
/* programme rows carry the quantity names already ("Temporary Fence (m) — Clean": 285) */
const pFmt = (name, n) => /\(m\)/.test(name) ? Number(n).toFixed(1) : (Number.isInteger(Number(n)) ? String(n) : Number(n).toFixed(1));
const pWords = q => Object.entries(q).filter(([, n]) => Number(n) > 0).map(([k, n]) => `${k}: ${pFmt(k, n)}`).join(' · ');

/* ------------------------------------------------------------------------------------------- Coates Installs page */
function coatesPage(snap, iso, a, form, fenceDockets) {
  const D = snap.days[iso], PS7 = snap.PS7, w = words(snap, iso), L = D.loads;
  const B = 'Portable buildings', T = 'Toilets & amenities', W = 'Water-filled barriers';
  const on = D.on || {}, off = D.off || {};
  const cols = [[], [], [], []]; PS7.work.forEach(([k, label, c]) => cols[c].push(`<label class="wk">${box(false)}${esc(label)}</label>`));
  const first = L.length ? L[0] : null, last = L.length ? L[L.length - 1] : null;
  const bits = [];
  if (D.counts) bits.push(`<li><b>Demob on the programme.</b> ${esc(D.counts)} — loaded out by forklift or crane, stairs and landings off first, services isolated and disconnected before anything moves.</li>`);
  else bits.push('<li><b>Demob on the programme.</b> No pick-ups are booked for this day — site checks, servicing, and getting the next pick-ups ready (stairs off, units emptied and locked, access clear for the truck).</li>');
  if (false) {
    const early = L.filter(x => x.early).length;
    bits.push(`<li><b>Traffic and the run in.</b> ${plural(L.length, 'load')} off Kingston, first away ${esc(first.time || '—')} and last ${esc(last.time || '—')}${first.eta ? `, due on site ${esc(first.eta)} to ${esc(last.eta)}` : ''}. ${early} of them left before the site opens, so the run in was worked around live traffic on the Gold Coast Highway and the park roads, with the escort ahead.</li>`);
  }
  bits.push('<li><b>Traffic and trucks.</b> Trucks in and out around live traffic on the Gold Coast Highway and the park roads, with an escort ahead. No twin-steer trucks.</li>');
  if (on[B] || off[B]) bits.push(`<li><b>Buildings.</b> ${off[B] || 0} out${on[B] ? ' and ' + on[B] + ' in' : ''} — stairs and landings off, power and water isolated by the electrician or plumber first, blocks and packers recovered, exclusion zone up under the hook.</li>`);
  if (on[T] || off[T]) bits.push(`<li><b>Toilets and amenities.</b> ${off[T] || 0} out${on[T] ? ' and ' + on[T] + ' in' : ''} — emptied before lifting, forklifted clear of the running lane.</li>`);
  if (on[W] || off[W]) bits.push(`<li><b>Water-filled barriers.</b> ${off[W] || 0} out${on[W] ? ' and ' + on[W] + ' in' : ''} — drained before moving, never lifted full.</li>`);
  if (off['Generators']) bits.push(`<li><b>Generators.</b> ${off['Generators']} out — isolated and cables recovered by the electrician before the lift.</li>`);
  if (off['Access & plant']) bits.push(`<li><b>Plant.</b> ${off['Access & plant']} machine${off['Access & plant'] === 1 ? '' : 's'} off hire — parked, keys in, walked round with the driver before loading.</li>`);
  if ((D.sectors || []).length) bits.push(`<li><b>Where on the circuit.</b> ${D.sectors.slice(0, 10).map(([s, n]) => `${esc(s)} (${n})`).join(', ')}${D.sectors.length > 10 ? ' and more' : ''} — off the master plan.</li>`);
  bits.push('<li><b>Spotting.</b> A spotter on every reverse and every lift near the public, in sight of the operator. Stop the moment sight is lost.</li>');
  /* who attended: the names the record holds for the day; a count with no names gives blank numbered rows */
  const crew = D.crew || {count: null, names: []};
  const roleOf = name => { const c = PS7.crew.find(p => p.name === name); if (c) return c.role; const t = snap.team.find(p => p.name === name && p.group === 'install'); return t ? t.event_role : ''; };
  const names = (crew.names || []).filter(Boolean);
  const rows = names.length ? names.map(n => ({name: n, role: roleOf(n)})) : Array.from({length: crew.count || 0}, () => null);
  const attendNote = '';
  while (rows.length < 8) rows.push(null);
  const lede = '<b>Coates install team</b> · unloading and loading, levelling, stairs, escorts — driving the track and Macintosh Park <span class="tag">FIELD OPERATIONS</span>';
  const compiled = dmy(a.signed);
  return {html: `<section class="ps ps7 fen">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">DAILY PRE-START</span><h1>Buildings &amp; toilets — installers</h1></div>
 <div class="psh-r"><b>GC500 · 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <p class="lede">${lede}</p>
 ${h2('01', 'THE DAY', 'Demob · as programmed')}
 <div class="today">
 <div><label>DATE</label><b>${esc(w)}</b></div>
 <div><label>CREW</label><b>Coates Installs</b></div>
 <div><label>CREW ON</label><b>${names.length}</b><span>${esc(names.join(', '))}</span></div>
 <div><label>PICK-UPS</label><b>${esc(D.counts || 'None booked')}</b></div>
 <div><label>PHASE</label><b>Demob</b><span>ends Fri 13 Nov 2026</span></div>
 </div>
 ${h2('02', 'THE DAY’S WORK', 'Demob · traffic · plant · spotting')}
 <ul class="story">${bits.join('')}</ul>
 ${h2('03', 'THE WORK', 'Tick what the crew is doing today')}
 <div class="work">${cols.map(c => '<div>' + c.join('') + '</div>').join('')}</div>
 ${L.length && D.loads_table ? h2('04', 'THE LOADS ON THIS DAY', 'Off the transport plan, load by load') + D.loads_table : ''}
 ${h2('05', 'COATES LIFE SAVING RULES', 'Read out at the pre-start — every one, every day')}
 ${lifeHtml()}
 ${h2('06', 'HAZARDS AND CONTROLS', 'Talk each one through, then tick')}
 ${hazardsHtml(form.hazards)}
 ${h2('07', 'SITE RULES AND PAPERWORK', 'iEDM induction · Coates HSEQ plan · the GC500 page')}
 ${rulesHtml(form.rules, 2)}
 ${h2('08', 'EMERGENCY', 'Muster points as drawn on ' + esc(PS7.evac))}
 ${emergencyHtml(PS7)}
 <div class="hold">${h2('09', 'CREW — COATES INSTALLS', 'Tick attending · declare fit · sign')}
 ${attendNote}${attendHtml(rows)}</div>
 ${signoffHtml()}
 <p class="foot">Coates Industrial Solutions · GC500 2026 · Coates Installs daily pre-start · ${esc(form.id)} · ${esc(w)}</p>
 </section>`, attendees: names, count: crew.count, title: `GC500 — Coates Installs pre-start, ${iso}`};
}

/* ------------------------------------------------------------------------------------- Advanced Temporary Fencing */
function fencingPage(snap, iso, a, dockets, programme) {
  const PS7 = snap.PS7, w = words(snap, iso);
  const signed = dockets.filter(d => d.docket_no), notes = dockets.filter(d => !d.docket_no);
  const fromDockets = dockets.length > 0;
  const q = fromDockets ? sumQuantities(dockets) : {}, comps = fromDockets ? sumComponents(dockets) : {};
  const pq = {}; if (!fromDockets) programme.forEach(r => Object.entries(r.quantities || {}).forEach(([k, n]) => { if (Number(n) > 0) pq[k] = Math.round(((pq[k] || 0) + Number(n)) * 100) / 100; }));
  const fronts = [...new Set((fromDockets ? dockets : programme).map(d => d.location).filter(Boolean))];
  /* the work ticked: the quantity columns off the day's dockets (braced for scrim also where braces went in), and
     the six that are every day's */
  const ticked = new Set(FENCE_ALWAYS);
  if (fromDockets) { Object.keys(q).forEach(k => ticked.add(k)); if (comps.brace) ticked.add('scrim'); }
  else Object.keys(pq).forEach(name => { const c = snap.FCOL.find(x => x.programme_type === name); if (c) ticked.add(c.key); });
  const cols = [[], [], [], []]; FENCE_WORK.forEach(([k, label, c]) => cols[c].push(`<label class="wk">${box(ticked.has(k))}${esc(label)}</label>`));
  /* the day's figures */
  const clean = fromDockets ? (q.clean || 0) : (pq['Temporary Fence (m) — Clean'] || 0);
  const subs = [];
  if (fromDockets) {
    const ccb = (q.ccb_event || 0) + (q.ccb_demarc || 0); if (ccb) subs.push(`${ccb.toFixed(1)} m crowd control`);
    if (q.scrim) subs.push(`${Number(q.scrim).toFixed(1)} m braced for scrim`);
    if (q.relocation) subs.push(`${Number(q.relocation).toFixed(1)} m relocated`);
    if (q.removal) subs.push(`${Number(q.removal).toFixed(1)} m removed`);
  } else {
    const ccb = (pq['Crowd Control Barriers (m) — Event'] || 0) + (pq['Crowd Control Barriers (m) — Demarcation'] || 0); if (ccb) subs.push(`${ccb.toFixed(1)} m crowd control`);
    if (pq['Temporary Fence (m) — Braced for Scrim']) subs.push(`${pq['Temporary Fence (m) — Braced for Scrim'].toFixed(1)} m braced for scrim`);
    if (pq['Temporary Fence (m) — Relocation']) subs.push(`${pq['Temporary Fence (m) — Relocation'].toFixed(1)} m relocated`);
    if (pq['Temporary Fence (m) — Removal']) subs.push(`${pq['Temporary Fence (m) — Removal'].toFixed(1)} m removed`);
  }
  const gates = fromDockets ? (q.ped_gates || 0) + (q.v_gates || 0) : (pq['Ped. Gates'] || 0) + (pq['Vehicle Gates'] || 0);
  const planName = programme.length ? [...new Set(programme.map(r => r.sheet))].join(', ') : '';
  const planRev = programme.length ? [...new Set(programme.map(r => r.revision || r.created).filter(Boolean))].map(x => /^\d{4}-\d{2}-\d{2}$/.test(x) ? dmy(x) : x).join(', ') : '';
  const planWords = planName ? `the week's installation plan (${planName}${planRev ? ', revision ' + planRev : ''})` : 'the week’s installation plan';
  /* how the day ran */
  const bits = [];
  if (fromDockets) {
    bits.push(`<li><b>The line that went in.</b> ${plural(signed.length, 'signed docket')}${notes.length ? ` and ${plural(notes.length, 'service note')}` : ''} — ${esc(qWords(snap, q) || 'components only, no metres written')}. Fronts: ${esc(fronts.join(', '))}.</li>`);
    if (Object.keys(comps).length) bits.push(`<li><b>What it took.</b> ${esc(compWords(comps))}, counted on the dockets.</li>`);
  } else {
    bits.push(`<li><b>The plan for the day.</b> ${plural(programme.length, 'task')} on ${esc(planWords)} — ${esc(pWords(pq) || 'no quantities written')}. Fronts: ${esc(fronts.join(', '))}.</li>`);
  }
  bits.push('<li><b>Working around live traffic.</b> The fence line follows live roads. Traffic control in place before anyone steps off the kerb, nobody in a running lane without a controller, every panel carried inside the closure.</li>');
  bits.push('<li><b>Plant on the same front.</b> Stay out of the swing and the reversing lanes, and catch the operator’s eye before crossing.</li>');
  bits.push('<li><b>Spotting.</b> A spotter on every truck reverse and every panel lift beside the public, in sight of the driver. Stop the moment sight is lost.</li>');
  bits.push('<li><b>Public and pedestrians.</b> Keep the line closed as it comes down — no gap left open at a break; pedestrians walk round, not through.</li>');
  /* the fencing table */
  let table;
  if (fromDockets) {
    table = `<table class="lds"><thead><tr><th>DOCKET</th><th>WHERE</th><th>QUANTITIES AS SIGNED</th><th>COMPONENTS</th><th>SIGNED BY</th></tr></thead><tbody>${dockets.map(d => `<tr><td><b>${d.docket_no ? esc(d.docket_no) : 'service note ' + esc((d.service_note || {}).note_no || '')}</b></td><td>${esc(d.location || '')}${d.docket_no ? '' : ' <i>(service note, not a hire docket)</i>'}</td><td>${esc(qWords(snap, Object.fromEntries(Object.entries(d.quantities || {}).filter(([, n]) => Number(n) > 0))) || '—')}</td><td>${esc(compWords(Object.fromEntries(Object.entries(d.components || {}).filter(([, n]) => Number(n) > 0))) || '—')}</td><td>${esc(d.signed_by || '—')}</td></tr>`).join('')}</tbody></table>`;
  } else {
    table = `<table class="lds"><thead><tr><th>WHERE</th><th>WHAT</th><th>QUANTITIES ON THE PLAN</th><th>NOTE ON THE PLAN</th></tr></thead><tbody>${programme.map(r => `<tr><td>${esc(r.location || '')}</td><td>${esc(r.description || '')}</td><td>${esc(pWords(r.quantities || {}) || '—')}</td><td>${esc([r.note, r.flag].concat(r.notes || []).filter(Boolean).join(' · ') || '')}</td></tr>`).join('')}</tbody></table>`;
  }
  /* who attended: the fencing crew as the record holds it (the ninth name from the day it was added) */
  const crew = snap.team.filter(p => p.group === 'fencing' && (!ADDED_FENCE_NAME_ON[p.name] || iso >= ADDED_FENCE_NAME_ON[p.name]));
  const rows = crew.map(p => ({name: p.name, role: p.event_role || 'Fencing crew'}));
  while (rows.length < 12) rows.push(null);
  const lede = '<b>Advanced Temporary Fencing</b> · temporary fence, crowd control barriers, gates and scrim — the line round the circuit <span class="tag">FIELD OPERATIONS</span>';
  const compiled = dmy(a.signed);
  const basisWords = fromDockets ? 'The work and the fencing are off the record for that day.' : `No signed docket dated this day was on the record when this was compiled; the fencing shown is ${planWords}, dated that day.`;
  return {html: `<section class="ps ps7 fen">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">DAILY PRE-START</span><h1>Fencing — Advanced Temporary Fencing</h1></div>
 <div class="psh-r"><b>GC500 · 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <p class="lede">${lede}</p>
 ${h2('01', 'THE DAY', 'Demob · as programmed')}
 <div class="today">
 <div><label>DATE</label><b>${esc(w)}</b></div>
 <div><label>CREW</label><b>Advanced Temporary Fencing</b></div>
 <div><label>TASKS ON THE PLAN</label><b>${programme.length}</b><span>${esc(planName || 'demob plan')}</span></div>
 <div><label>FENCE ON THE PLAN</label><b>${clean ? Number(clean).toFixed(1) + ' m' : '—'}</b><span>${esc(subs.join(' · ') || (fromDockets ? 'no metres written on the dockets' : 'no metres on the plan for the day'))}</span></div>
 <div><label>GATES</label><b>${gates}</b><span>${esc(fronts.slice(0, 3).join(', '))}${fronts.length > 3 ? ' …' : ''}</span></div>
 </div>
 ${h2('02', 'THE DAY’S WORK', 'Traffic · the line · gates · spotting · the public')}
 <ul class="story">${bits.join('')}</ul>
 ${h2('03', 'THE WORK', 'Ticked from the plan for this day — tick anything else the crew takes on')}
 <div class="work">${cols.map(c => '<div>' + c.join('') + '</div>').join('')}</div>
 ${fromDockets ? h2('04', 'THE FENCING THAT WENT IN', 'Off the signed dockets for this day') : h2('04', 'THE FENCING PROGRAMMED FOR THIS DAY', 'Off ' + esc(planWords))}
 ${table}
 ${h2('05', 'COATES LIFE SAVING RULES', 'Read out at the pre-start — every one, every day')}
 ${lifeHtml()}
 ${h2('06', 'HAZARDS AND CONTROLS', 'Talk each one through, then tick')}
 ${hazardsHtml(FENCE_HAZARDS)}
 ${h2('07', 'SITE RULES AND PAPERWORK', 'iEDM induction · the fencing SWMS · the GC500 page')}
 ${rulesHtml(FENCE_RULES, 2)}
 ${h2('08', 'EMERGENCY', 'Muster points as drawn on ' + esc(PS7.evac))}
 ${emergencyHtml(PS7)}
 <div class="hold">${h2('09', 'CREW — ADVANCED TEMPORARY FENCING', 'Tick attending · declare fit · sign')}
 ${attendHtml(rows)}</div>
 ${signoffHtml()}
 <p class="foot">Coates Industrial Solutions · GC500 2026 · Advanced Temporary Fencing daily pre-start · GC500-PS-ATF-01 v1 · ${esc(w)}</p>
 </section>`, attendees: rows.filter(Boolean).map(r => r.name), count: rows.filter(Boolean).length, title: `GC500 — Advanced Temporary Fencing pre-start, ${iso}`, basis: fromDockets ? `${signed.length} signed docket(s)${notes.length ? ` + ${notes.length} service note(s)` : ''}` : `${programme.length} installation-plan row(s) (${planName}${planRev ? ' rev ' + planRev : ''})`};
}

/* --------------------------------------------------------------------------------------------- what to build */
function plan(snap, a) {
  const records = [], skipped = [];
  const files = snap.files || [];
  const unsignedFor = (crew, iso) => files.filter(f => /unsigned/i.test(String(f.title || '') + ' ' + f.id) && String(f.id).includes(iso) && (crew === 'coates' ? /Coates/.test(f.id) : /ATF|Advanced/.test(f.id))).map(f => f.id);
  const docketsOn = iso => snap.dockets.filter(d => d.date === iso && d.crew === FENCE_CREW_NAME);
  for (const crew of Object.keys(CREWS)) {
    if (a.crew && a.crew !== crew) continue;
    for (const iso of SCOPE[crew]) {
      if (a.days && !a.days.includes(iso)) continue;
      const D = snap.days[iso];
      if (crew === 'coates') {
        const c = (D && D.crew) || {count: null, names: []};
        if (!D || !D.in_programme) { skipped.push({crew, day: iso, reason: 'outside the programme', unsigned_left: unsignedFor(crew, iso)}); continue; }
        if (!(c.count > 0) && !(c.names || []).length) {
          const what = Object.entries(D.on || {}).map(([k, n]) => `${n} ${k.toLowerCase()} on`).concat(Object.entries(D.off || {}).map(([k, n]) => `${n} ${k.toLowerCase()} off`)).join(', ');
          skipped.push({crew, day: iso, reason: `no Coates crew recorded for the day (${what ? 'the record holds ' + what + ', loads from Kingston: ' + D.loads.length : 'nothing on the record for the day'})`, unsigned_left: unsignedFor(crew, iso)});
          continue;
        }
        records.push({crew, day: iso, replaces: unsignedFor(crew, iso), confirm: null, dockets: docketsOn(iso)});
      } else {
        const all = docketsOn(iso);
        const work = all.filter(d => d.scope !== 'yard');
        const yard = all.filter(d => d.scope === 'yard');
        const prog = (snap.programme[iso] || []);
        const upd = prog.filter(r => r.source === 'plan_update'), base = prog.filter(r => r.source === 'programme' && r.included !== false);
        const rows = upd.length ? upd : base;
        if (work.length) { records.push({crew, day: iso, replaces: unsignedFor(crew, iso), confirm: null, dockets: work, programme: []}); continue; }
        if (yard.length) { skipped.push({crew, day: iso, reason: `the only docket that day is a stock transfer to the yard (${yard.map(d => d.docket_no + ' ' + (d.location || '')).join('; ')}), not an installation`, unsigned_left: unsignedFor(crew, iso)}); continue; }
        if (rows.length) { records.push({crew, day: iso, replaces: [], confirm: null, dockets: [], programme: rows}); continue; }
        skipped.push({crew, day: iso, reason: 'nothing on the record for the fencing crew that day: no docket dated that day and no installation-plan row dated that day', unsigned_left: unsignedFor(crew, iso)});
      }
    }
  }
  return {records, skipped};
}

/* ------------------------------------------------------------------------------------------------- the PDFs */
const PRINT_STYLE = '@page{size:A4 portrait;margin:7mm}\n#dayprint.ps7wrap{width:196mm;font:inherit;background:#fff}\n';
const EXTRA_CSS = `
html,body{margin:0;padding:0;background:#fff}
#dayprint .ps7{font-family:"Carlito","Calibri","Segoe UI",system-ui,sans-serif}
#dayprint .ps7 .rules.rl2{grid-template-columns:1fr 1fr;gap:0 9px}
#dayprint .ps7 .signoff{margin:2px 0 1px;border:1px solid #15181a;padding:3px 6px;font-size:7.4pt}
#dayprint .ps7 .signoff b{color:#15181a}
#dayprint .ps7 .lds td i{color:#8b9498;font-style:italic}
#dayprint .ps7 .none{margin:1px 0 2px}
#dayprint .ps7 table.sof{width:100%;margin:5px 0 3px;border-collapse:collapse}
#dayprint .ps7 table.sof th{font-size:6.6pt;text-align:left;padding:2px 4px;border:1px solid #15181a;background:#f1f3f4}
#dayprint .ps7 table.sof td{height:10mm;border:1px solid #15181a}
`;
function documentHtml(title, section, css) {
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_STYLE}${css}${EXTRA_CSS}</style></head><body><div id="dayprint" class="ps7wrap">${section}</div></body></html>`;
}
async function renderAll(a, jobs) {
  const {chromium} = require('playwright');
  const launch = {args: ['--no-sandbox', '--lang=en-AU']}; if (a.chromium) launch.executablePath = a.chromium;
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext({locale: 'en-AU', timezoneId: 'Australia/Brisbane', viewport: {width: 900, height: 1300}});
  const page = await ctx.newPage();
  for (const j of jobs) {
    await page.setContent(j.html, {waitUntil: 'load'});
    await page.evaluate(() => document.fonts && document.fonts.ready ? document.fonts.ready : null);
    /* one A4 sheet where it fits: the same measure-and-zoom as the page's own ps7Print, never below 0.8 */
    j.fit = await page.evaluate(() => {
      const sec = document.querySelector('.ps7'), ruler = document.createElement('div');
      ruler.style.cssText = 'position:absolute;left:-10000px;top:0;height:283mm;width:1px'; document.body.appendChild(ruler);
      const avail = ruler.getBoundingClientRect().height, h = sec.getBoundingClientRect().height; ruler.remove();
      let zoom = 1; if (h > avail * 0.985) { zoom = Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000); sec.style.zoom = String(zoom); }
      const fonts = [...new Set([...document.querySelectorAll('.ps7 b, .ps7 p')].slice(0, 5).map(e => getComputedStyle(e).fontFamily))];
      return {avail: Math.round(avail), height: Math.round(h), zoom, fonts};
    });
    await page.pdf({path: j.pdf, format: 'A4', printBackground: true, preferCSSPageSize: true});
  }
  await browser.close();
}

/* -------------------------------------------------------------------------------------------------------- main */
(async () => {
  const a = args();
  const outDir = a.out, pdfDir = path.join(outDir, 'pdfs'), evDir = path.join(outDir, 'evidence');
  fs.mkdirSync(pdfDir, {recursive: true}); fs.mkdirSync(evDir, {recursive: true});
  const allDays = [...new Set([...SCOPE.coates, ...SCOPE.fencing])].sort();
  let snap;
  if (a.snapshot) { snap = JSON.parse(fs.readFileSync(a.snapshot, 'utf8')); console.log('snapshot', a.snapshot, 'read at', snap.read_at); }
  else {
    console.log('reading the record' + (a.page ? ' through ' + a.page : ' from the live page') + ' (read only) ...');
    snap = await readRecord(a, allDays);
    /* the page copy is named by file name and hash only - never by its folder - so the snapshot carries nothing about the machine it was made on */
    if (a.page) snap.page_file = {name: path.basename(a.page), sha256: crypto.createHash('sha256').update(fs.readFileSync(a.page)).digest('hex'), bytes: fs.statSync(a.page).size};
    const snapPath = path.join(evDir, 'record_snapshot.json');
    fs.writeFileSync(snapPath, JSON.stringify(snap, null, 1));
    console.log('snapshot written', snapPath, '· page', snap.page_version, '· today on the page', snap.today, '· writes blocked by the harness', snap.harness.blocked_writes, '· page errors', snap.harness.page_errors.length);
  }
  if (!snap.files) throw new Error('the file list did not come back from the service; nothing can say which unsigned copies a record replaces');
  const form = coatesForm(snap.PS7, a.form);
  const {records, skipped} = plan(snap, a);
  const jobs = [], manifest = [], build = [];
  for (const r of records) {
    const made = r.crew === 'coates' ? coatesPage(snap, r.day, a, form, r.dockets) : fencingPage(snap, r.day, a, r.dockets, r.programme);
    const name = `GC500_Prestart_${r.crew === 'coates' ? 'Coates_Installs' : 'Advanced_Fencing'}_${r.day}.pdf`;
    const html = documentHtml(made.title, made.html, snap.css);
    if (AGENT_WORDS.test(html)) { const m = html.match(AGENT_WORDS); throw new Error(`${name}: the page text carries a word that must not be on a record: ${m && m[0]}`); }
    if (/undefined|\[object |NaN/.test(html)) throw new Error(`${name}: the page text has undefined/NaN in it`);
    const job = {pdf: path.join(pdfDir, name), html, name};
    jobs.push(job);
    const entry = {file: 'pdfs/' + name, title: `Pre-start · ${CREWS[r.crew]} · ${r.day}`,
      note: `Daily pre-start for ${words(snap, r.day)} — to be ticked and signed by the crew at the pre-start`, kind: 'pack', day: r.day, crew: r.crew, replaces: []};
    if (r.confirm) entry.confirm = r.confirm;
    manifest.push(entry);
    build.push({crew: r.crew, day: r.day, words: words(snap, r.day), file: entry.file, attendees: made.attendees, count: made.count, basis: r.crew === 'coates' ? `${(snap.days[r.day].counts || 'no drops dated this day')} · loads ${snap.days[r.day].loads.length} · fencing dockets that day ${r.dockets.filter(d => d.docket_no).length}` : made.basis, replaces: r.replaces, confirm: r.confirm, job});
  }
  console.log(`building ${jobs.length} records (${manifest.filter(m => m.crew === 'coates').length} Coates Installs, ${manifest.filter(m => m.crew === 'fencing').length} fencing); ${skipped.length} days skipped`);
  await renderAll(a, jobs);
  build.forEach(b => { b.fit = b.job.fit; b.bytes = fs.statSync(b.job.pdf).size; b.sha256 = crypto.createHash('sha256').update(fs.readFileSync(b.job.pdf)).digest('hex'); delete b.job; });
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.writeFileSync(path.join(evDir, 'build.json'), JSON.stringify({author: SIGNER, built: new Date().toISOString(), signed: a.signed, form: form.id, page_version: snap.page_version, record_read_at: snap.read_at, page_file: snap.page_file || null, records: build, skipped}, null, 1) + '\n');
  build.forEach(b => console.log(`  ${b.file}  ${b.words}  ${b.crew}  people ${b.attendees.length ? b.attendees.join(', ') : '(count ' + b.count + ', no names)'}  zoom ${b.fit.zoom}  replaces ${b.replaces.join(',') || '-'}${b.confirm ? '  CONFIRM' : ''}`));
  skipped.forEach(s => console.log(`  skipped ${s.crew} ${s.day}: ${s.reason}${s.unsigned_left.length ? ' · unsigned copy left on the service: ' + s.unsigned_left.join(',') : ''}`));
  console.log('manifest', path.join(outDir, 'manifest.json'), '· build record', path.join(evDir, 'build.json'));
})().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
