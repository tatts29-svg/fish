#!/usr/bin/env python3
"""Author: Andrew Fisher. Server v5.89 - the servicing tracker: the crews' ticks, in a store of their own.

Andrew, 18 Oct 2026: "I dont want it set up so you tick it and charged. Its purely just a track. Can it not have its
own seperate html that is linked to nothing else. But still links results to main." Then his build brief: "Carried by
crews" / "Just times" / "Waste tanks too" / "they can tick that refernce number as complete. One refernce number may
have other completion lines as they will have a different desription" / "There is a compmetion qr code for their
refernece. They scan. It whe all done. And click tap. This only alows them to complete the refernce qr code. Must
shows percentage complete for the area. And again for everything" / "each refernce needs to have 3 ticks Water
fillled. Pumped out Restock/Cleaned ... Waste tanks is only a pump out. Toilet blocks will only need a pump out and
clean. Sunday night will need a extra. locked and confirmed empty. No water will be needed".

What this adds to the live v5.87 (d5a0d777...), and nothing else:
  - POST /api/cards takes an optional `tracker` {days, lines, plans}: checked whole (400 if it does not check out),
    keys and targets forced empty, one live tracker per load (409 with its token), a tracker card never re-posted
    without its tracker (409). A secret of 32 random bytes is made once per tracker and kept off every listing; the
    edit link's answer carries tracker.links = {REF: sig}, sig = base64url(HMAC-SHA256(secret, token + ':' + REF))[:16].
  - GET /d/<token>/ticks (reads memory only) and POST /d/<token>/ticks (1-20 ticks, each signed for its own
    reference, task allowed for its line's kind on that day's plan, day not after today's 08:00-to-08:00 service
    day, unticks name the ticks they cancel, idempotent by id, 2 KB, rate limits, a cap per job per day).
  - tracker_ticks.jsonl: one JSON line per event, appended and flushed, never rewritten whole for a tick; an epoch
    that changes on a recovery or a void; a damaged file is set aside and salvaged, never a reason to stop.
  - GET /api/ticks and POST /api/ticks/void behind the edit link.
  - the report routes answer 404 on a tracker card; card tokens are looked up as own properties everywhere.
  - labels: /health build v5.89 (+ tracker_ticks), the start-up banner.
Nothing here reads or writes the record, a delivery state, a tick on the page, a count or a charge.

  python3 patch_server_v589.py <server v5.87 server.js> <out server.js>"""
import hashlib
import sys
from pathlib import Path

base = Path(sys.argv[1])
source = base.read_text(encoding='utf-8')
expected = 'd5a0d777da4871af1bf88804b4ef223354a29c2560213ab56f7897445b398fdc'
if hashlib.sha256(base.read_bytes()).hexdigest() != expected:
    raise SystemExit('Expected the live v5.87 server (d5a0d777...); refusing another base or a second application.')


def rep(old, new, count=1):
    global source
    actual = source.count(old)
    if actual != count:
        raise SystemExit(f'Expected {count} matches, got {actual}: {old[:100]}')
    source = source.replace(old, new)


# 0. the file's own header says where the tracker lives
rep(""" * so the server file can sit on the volume without being listed in the public machine set.
""", """ * so the server file can sit on the volume without being listed in the public machine set.
 * v5.89 — the servicing tracker's ticks live in DATA_DIR/tracker_ticks.jsonl, beside the record and never in it.
""")

# 1. labels: the banner (health is step 7)
rep("const BUILD = 'server v5.87 — PICTURES FROM A SENDER THAT CAN SEND THEM",
    "const BUILD = 'server v5.89 — THE SERVICING TRACKER (a drop card that takes ticks from the crews at /d/<token>/ticks: "
    "each reference completed only with its own signed QR, the jobs each kind has on each day, 08:00 to 08:00 service "
    "days, no names, an append-only store of its own, never the record, a delivery state or a charge; GET /api/ticks and "
    "the void behind the edit link; card tokens looked up as own properties; Andrew Fisher, 18 Oct 2026) "
    "+ v5.87 — PICTURES FROM A SENDER THAT CAN SEND THEM")

# 2. the store's file
rep("""  scoped: path.join(DATA_DIR, 'scoped_reports.json'),   /* v5.63 — replies that name ONE unit */
""", """  scoped: path.join(DATA_DIR, 'scoped_reports.json'),   /* v5.63 — replies that name ONE unit */
  ticks: path.join(DATA_DIR, 'tracker_ticks.jsonl'),     /* v5.89 — the servicing tracker's ticks, one line per event */
""")

# 3. own properties only: a card token is never an inherited name
rep("function cardToken() { return crypto.randomBytes(24).toString('base64url'); }",
    r"""/* v5.89 — A CARD TOKEN IS AN OWN PROPERTY OR IT IS NOTHING. cards['propertyIsEnumerable'] is a function, and that
   name is 20 characters of the token alphabet, so GET /d/propertyIsEnumerable answered 200 with an empty page, was
   not counted as a wrong key, and rewrote cards.json as an "open" — no token needed (the 18 Oct 2026 review).
   Every card lookup goes through here now, and so does every other store keyed by a card token. */
function ownProp(o, k) { return o != null && Object.prototype.hasOwnProperty.call(o, k); }
function cardOf(token) { return ownProp(cards, token) ? cards[token] : null; }
function cardToken() { return crypto.randomBytes(24).toString('base64url'); }""")

# 4. a tracker card says how many ticks it holds in the edit link's list (never its secret: that is not on the card)
rep("""  o.last_report = rs.length ? rs[rs.length - 1].at : null;
  return o;
}""", """  o.last_report = rs.length ? rs[rs.length - 1].at : null;
  /* v5.89 — a servicing tracker says how many ticks it holds. Its secret is not on the card at all, so it cannot
     travel with the card into this list (or into v5.87's, if the service is ever rolled back). */
  if (c.tracker) o.tracker_ticks = trackTicksOf(c.token);
  return o;
}""")

# 5. the tracker: its rules, its store, its routes' work
rep("""        .forEach(k => { if (n > KEEP_REPORTS) { n -= reports[k].length; delete reports[k]; } });
}
""", r"""        .forEach(k => { if (n > KEEP_REPORTS) { n -= reports[k].length; delete reports[k]; } });
}

// ---------------------------------------------------------------- v5.89 the servicing tracker
/* v5.89 — THE SERVICING TRACKER: THE CREWS' TICKS, IN A STORE OF THEIR OWN.
   Andrew Fisher, 18 Oct 2026: "I dont want it set up so you tick it and charged. Its purely just a track. Can it not
   have its own seperate html that is linked to nothing else. But still links results to main." And his brief the same
   day: "Carried by crews" · "Just times" · "Waste tanks too" · "There is a compmetion qr code for their refernece.
   They scan. It whe all done. And click tap. This only alows them to complete the refernce qr code. Must shows
   percentage complete for the area. And again for everything" · "each refernce needs to have 3 ticks Water fillled.
   Pumped out Restock/Cleaned ... As these could be 3 different job. Waste tanks is only a pump out. Toilet blocks will
   only need a pump out and clean. Sunday night will need a extra. locked and confirmed empty. No water will be needed".

   WHAT A TICK IS AND IS NOT. A tick is a crew's word that one job — one task on one line of one reference, for one
   service day — is done: the time their phone says they tapped it and the time it reached here. It is kept in its own
   append-only file and nowhere else. It never touches the record, a delivery, a light, a tick on the page, a count or
   a charge ("Scans and ticks never change either figure"), and nothing here reads the record. There are no names
   anywhere: "Just times". The service stores and checks; the card and the page work out the percentages.

   WHO CAN TICK WHAT. The tracker is one drop card (load 'servicing-tracker:…') made on the edit link. The first time
   it is made, this service mints a secret of 32 random bytes that never leaves it — not to a phone, not into a
   listing, not into the log. Each reference's completion QR carries that reference's signature after the #, which no
   server ever sees in a request line: base64url(HMAC-SHA256(secret, token + ':' + REF)) cut to 16 characters. A tick
   must carry the signature of its own reference, so a photograph of WC07's code ticks WC07 and nothing else. The edit
   link gets the signatures to print, when it makes the card and from /api/ticks.

   WHAT A REFERENCE ASKS FOR. The editor's own list, posted with the card: days [{id, plan}] (08:00 to 08:00 Gold
   Coast time; Thursday "is a just in case"), lines [{id, ref, kind, qty}] ("One refernce number may have other
   completion lines") and plans {kind: {plan: [tasks]}}. A tick for a task its line's kind does not have on that day's
   plan is refused (no water on Sunday; locked & confirmed empty only on Sunday; a waste tank is only pumped out), and
   so is a tick for a day after today's service day. Andrew's job rules the same day ("Corrext with 1. 2 is correct. 3
   let go with need to be cleaned regardless": a block with its own waste tank or on the sewer is cleaned only, the tank
   takes the pump-out, FWFs are still cleaned on Sunday) arrive the same way, as a kind in the list (blockclean): the
   service holds no job rule of its own, so the next one needs no new server.

   AN UNTICK NAMES WHAT IT CANCELS. done:false carries undoes: [the done:true ticks it cancels, same job, same day], so
   a late untick from a phone that was out of signal cancels only the tick it saw, never a newer tick from another
   crew. Nothing is ever deleted: an untick is a tick, and the edit link's void (a test card, a flood) is a line of its
   own that sets ticks aside.

   SAFE ON A LAMINATED SHEET. Per address and per tracker rate limits (429 and Retry-After), a cap per job per day, a
   2 KB body, one line per event appended and flushed before the answer (never the whole file per tick), an epoch that
   changes whenever the stored ticks are recovered or voided so every phone starts its reading again, and a damaged
   file set aside and salvaged — a store that is "purely just a track" never stops the delivery service starting. */
const TRACK_MAX_BODY = 2 * 1024;            // one POST of ticks: a phone's outbox goes in small bites
const TRACK_MAX_BATCH = 20;                 // ticks in one POST
const TRACK_CAP_PER_JOB = 12;               // ticks and unticks kept (not voided) for one line, one task, one day
const TRACK_MAX_EVENTS = 25000;             // every tick of every tracker on this service (a whole tracker at its caps is ~11,000)
const KEEP_TICK_SNAPSHOTS = 24;             // hourly copies of the ticks: a day (boot and made copies keep 12 each)
const TRACK_READ_MAX = 2000;                // ticks in one read; the reply's seq is where the next read starts
const TRACK_LIMITS = {                      // [how many, in how long]; past it, 429 with Retry-After
  postAddress: [60, 60 * 1000],             //   POSTs from one address a minute (crews can share one mobile address)
  postTracker: [1200, 60 * 60 * 1000],      //   POSTs to one tracker an hour, from every address together
  getAddress: [120, 60 * 1000] };           //   reads from one address a minute (phones poll every 20 s or so)
const TRACK_RATE_MAX_KEYS = 20000;
const TRACK_SIG_LEN = 16;
const TRACK_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;          // a tick id: made on the phone, 16 characters or more
const TRACK_REF_RE = /^[A-Za-z0-9?_.-]{1,16}$/;        // a reference as the editor wrote it (SPARE included)
const TRACK_LINE_RE = /^[A-Za-z0-9?_.-]{1,40}$/;       // a completion line, e.g. WC20-WASTETAN
const TRACK_WORD_RE = /^[a-z][a-z0-9_]{0,23}$/;        // a kind, a plan or a task the editor named: fwf, night, pump
const TRACK_DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
/* Andrew Fisher, 18 Oct 2026: "8am thursday to 8am friday, 8am friday to 8am saturday, 8am saturday to 8am sunday,
   8am sunday to 8am monday". A service day is the Gold Coast date eight hours ago: 07:59 on Saturday is still
   Friday's service and 08:00 is Saturday's. The clock is this service's, never the phone's. */
function serviceDay(at) { return qldDay((at == null ? Date.now() : at) - 8 * 3600 * 1000); }
function serviceDayStart(day) { return Date.parse(day + 'T08:00:00+10:00'); }
function realDay(day) { const ms = Date.parse(day + 'T00:00:00Z'); return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === day; }
function nextDay(day) { return new Date(Date.parse(day + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10); }

/* The editor's list, checked whole. Anything that does not check out is refused with the reason (400), never
   quietly dropped: a tracker that lost a line or a day here would leave a crew unable to tick it at 2 am. */
function trackerConfig(t) {
  const bad = why => ({ error: 'the tracker list did not check out: ' + why });
  const word = v => typeof v === 'string' && TRACK_WORD_RE.test(v) && !protoKey(v);
  const show = v => JSON.stringify(String(v).slice(0, 40));
  if (!plainObject(t)) return bad('tracker is {days, lines, plans}');
  if (!plainObject(t.plans)) return bad('plans is {kind: {plan: [tasks]}}');
  const kinds = Object.keys(t.plans);
  if (!kinds.length || kinds.length > 12) return bad('plans names 1 to 12 kinds');
  const plans = {};
  for (const kind of kinds) {
    if (!word(kind)) return bad('the kind ' + show(kind) + ' is not a plain lower-case word');
    const kp = t.plans[kind];
    if (!plainObject(kp) || !Object.keys(kp).length || Object.keys(kp).length > 8) return bad('plans.' + kind + ' is {plan: [tasks]} with 1 to 8 plans');
    plans[kind] = {};
    for (const name of Object.keys(kp)) {
      if (!word(name)) return bad('the plan ' + show(name) + ' of ' + kind + ' is not a plain lower-case word');
      const tasks = kp[name];
      if (!Array.isArray(tasks) || !tasks.length || tasks.length > 8 || !tasks.every(word)) return bad('plans.' + kind + '.' + name + ' lists 1 to 8 tasks, each a plain lower-case word');
      if (new Set(tasks).size !== tasks.length) return bad('plans.' + kind + '.' + name + ' lists a task twice');
      plans[kind][name] = tasks.slice();
    }
  }
  if (!Array.isArray(t.days) || !t.days.length || t.days.length > 7) return bad('days lists 1 to 7 service days');
  const days = [];
  for (const d of t.days) {
    if (!plainObject(d) || typeof d.id !== 'string' || !TRACK_DAY_RE.test(d.id) || !realDay(d.id)) return bad('a day is {id: yyyy-mm-dd, plan}');
    if (!word(d.plan)) return bad('day ' + d.id + ' needs a plan, a plain lower-case word');
    if (days.some(x => x.id === d.id)) return bad('day ' + d.id + ' is listed twice');
    days.push({ id: d.id, plan: d.plan });
  }
  days.sort((a, b) => a.id.localeCompare(b.id));
  if (!Array.isArray(t.lines) || !t.lines.length || t.lines.length > 400) return bad('lines lists 1 to 400 completion lines');
  const lines = [], seen = new Set();
  for (const l of t.lines) {
    if (!plainObject(l)) return bad('a line is {id, ref, kind, qty}');
    if (typeof l.id !== 'string' || !TRACK_LINE_RE.test(l.id) || protoKey(l.id)) return bad('the line id ' + show(l.id) + ' is not one this service takes');
    if (seen.has(l.id)) return bad('line ' + l.id + ' is listed twice');
    seen.add(l.id);
    if (typeof l.ref !== 'string' || !TRACK_REF_RE.test(l.ref) || protoKey(l.ref)) return bad('line ' + l.id + ' has no usable reference');
    if (typeof l.kind !== 'string' || !ownProp(plans, l.kind)) return bad('line ' + l.id + ' is of a kind with no plan');
    if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > 10000) return bad('line ' + l.id + ' needs a whole number of units, 1 or more');
    for (const d of days) if (!ownProp(plans[l.kind], d.plan)) return bad('the kind ' + l.kind + ' has no "' + d.plan + '" plan for ' + d.id);
    lines.push({ id: l.id, ref: l.ref, kind: l.kind, qty: l.qty });
  }
  return { tracker: { days, lines, plans } };
}

/* THE STORE: tracker_ticks.jsonl, one JSON line per event, appended and flushed before the answer, never rewritten
   whole for a tick (only once, at start, after a recovery). Four kinds of line:
     {e:'epoch', epoch, at, why}                                      a phone that sees the epoch change reads again from 0
     {e:'key', token, key, at}                                        a tracker's secret; read here and nowhere else
     {e:'tick', token, id, seq, ref, line, task, day, done, undoes, at, tapped_at}
     {e:'void', token, vid, ids, at}                                  the edit link setting ticks aside; nothing deleted
   seq is per tracker, in the order ticks arrived; it is the read cursor (?since=). */
const track = { epoch: null, header: false, bytes: 0, stuck: null, broken: null, events: 0,
  keys: Object.create(null), boxes: Object.create(null), notes: [] };
function trackReset() { track.epoch = null; track.header = false; track.events = 0; track.keys = Object.create(null); track.boxes = Object.create(null); }
function trackNewEpoch() { return crypto.randomBytes(6).toString('base64url'); }
function trackBox(token, make) {
  if (ownProp(track.boxes, token)) return track.boxes[token];
  if (!make) return null;
  return (track.boxes[token] = { seq: 0, list: [], byId: new Map(), voided: new Set(), pendingVoid: new Set(), voids: [], jobs: new Map() });
}
function trackTicksOf(token) { const b = trackBox(token, false); return b ? b.list.length : 0; }
function trackEpoch(token) { const b = trackBox(token, false); return track.epoch + '.' + (b ? b.voids.length : 0); }
function trackJob(t) { return t.line + '|' + t.task + '|' + t.day; }
function trackOut(t) { return { id: t.id, seq: t.seq, ref: t.ref, line: t.line, task: t.task, day: t.day, done: t.done, undoes: t.undoes, at: t.at, tapped_at: t.tapped_at }; }
function trackEventOk(ev) {
  if (!plainObject(ev)) return false;
  if (ev.e === 'epoch') return typeof ev.epoch === 'string' && ev.epoch.length > 0 && ev.epoch.length <= 32;
  if (typeof ev.token !== 'string' || !CARD_TOKEN_RE.test(ev.token)) return false;
  if (ev.e === 'key') return typeof ev.key === 'string' && /^[A-Za-z0-9_-]{43}$/.test(ev.key);
  if (ev.e === 'void') return typeof ev.vid === 'string' && Array.isArray(ev.ids) && ev.ids.every(i => typeof i === 'string' && TRACK_ID_RE.test(i));
  if (ev.e !== 'tick') return false;
  return typeof ev.id === 'string' && TRACK_ID_RE.test(ev.id) && Number.isInteger(ev.seq) && ev.seq > 0
    && typeof ev.ref === 'string' && TRACK_REF_RE.test(ev.ref) && typeof ev.line === 'string' && TRACK_LINE_RE.test(ev.line)
    && typeof ev.task === 'string' && TRACK_WORD_RE.test(ev.task) && typeof ev.day === 'string' && TRACK_DAY_RE.test(ev.day)
    && typeof ev.done === 'boolean' && Array.isArray(ev.undoes) && typeof ev.at === 'string'
    && (ev.tapped_at === null || typeof ev.tapped_at === 'string');
}
/* one event into memory; `fix` counts what a damaged or re-ordered file needs put right */
function trackApply(ev, fix) {
  if (ev.e === 'epoch') { track.epoch = ev.epoch; track.header = true; return; }
  if (ev.e === 'key') { track.keys[ev.token] = { key: ev.key, at: ev.at || null }; return; }
  const box = trackBox(ev.token, true);
  if (ev.e === 'void') {
    for (const id of ev.ids) {
      if (box.voided.has(id)) continue;
      const t = box.byId.get(id);
      if (!t) { box.pendingVoid.add(id); continue; }
      box.voided.add(id);
      const k = trackJob(t); box.jobs.set(k, Math.max(0, (box.jobs.get(k) || 0) - 1));
    }
    box.voids.push({ vid: ev.vid, ids: ev.ids.slice(), at: ev.at || null });
    return;
  }
  if (box.byId.has(ev.id)) { if (fix) fix.twice++; return; }                 // the same tick twice is one tick
  if (ev.seq <= box.seq) { if (fix) fix.order++; ev = Object.assign({}, ev, { seq: box.seq + 1 }); }
  box.seq = ev.seq; box.list.push(ev); box.byId.set(ev.id, ev); track.events++;
  if (box.pendingVoid.has(ev.id)) { box.pendingVoid.delete(ev.id); box.voided.add(ev.id); return; }
  const k = trackJob(ev); box.jobs.set(k, (box.jobs.get(k) || 0) + 1);
}
/* everything in memory as lines, for a snapshot or the one rewrite after a recovery */
function trackEvents(why) {
  const out = [{ e: 'epoch', epoch: track.epoch, at: new Date().toISOString(), why: why || 'snapshot' }];
  for (const token of Object.keys(track.keys)) out.push({ e: 'key', token, key: track.keys[token].key, at: track.keys[token].at });
  for (const token of Object.keys(track.boxes)) {
    const b = track.boxes[token];
    for (const t of b.list) out.push(t);
    for (const v of b.voids) out.push({ e: 'void', token, vid: v.vid, ids: v.ids, at: v.at });
  }
  return out;
}
function trackSnapshot() { return { store: 'tracker ticks', epoch: track.epoch, events: trackEvents('snapshot') }; }
/* a snapshot the moment a tracker's secret is made: losing it would make every printed completion code useless */
function trackSnapshotNow() {
  try {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-T:]/g, '');
    const f = path.join(SNAP_DIR, 'ticks-' + stamp + '-made.json'), tmp = path.join(SNAP_DIR, '.tmp-ticks-made-' + process.pid);
    fs.writeFileSync(tmp, JSON.stringify(trackSnapshot())); fs.renameSync(tmp, f);
    const all = fs.readdirSync(SNAP_DIR).filter(n => /^ticks-\d{12}-made\.json$/.test(n)).sort();
    all.slice(0, Math.max(0, all.length - KEEP_BOOT_SNAPSHOTS)).forEach(n => fs.unlinkSync(path.join(SNAP_DIR, n)));
  } catch (e) { console.error('snapshot ticks', e.message); }
}
/* a snapshot's events and the file's good lines, as one list: on a clash the file, which is newer, wins */
function trackMerge(older, newer) {
  const keys = new Map(), ticks = new Map(), voids = new Map();
  for (const ev of older.concat(newer)) {
    if (ev.e === 'key') keys.set(ev.token, ev);
    else if (ev.e === 'tick') ticks.set(ev.token + ' ' + ev.id, ev);
    else if (ev.e === 'void') voids.set(ev.token + ' ' + ev.vid, ev);
  }
  const t = [...ticks.values()].sort((a, b) => (a.token < b.token ? -1 : a.token > b.token ? 1 : a.seq - b.seq));
  return [...keys.values(), ...t, ...voids.values()];
}
function trackWriteWhole(lines) {
  const tmp = FILES.ticks + '.tmp.' + process.pid, text = lines.map(x => JSON.stringify(x) + '\n').join('');
  const fd = fs.openSync(tmp, 'w');
  try { fs.writeSync(fd, text); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(tmp, FILES.ticks);
  track.bytes = Buffer.byteLength(text); track.header = true;
}
/* THE STORE AT START. A last line cut short (a crash or a power cut mid-write) is dropped: nobody was answered for it.
   A line in the middle that will not read, ticks out of order or twice, an empty or missing file that has snapshots:
   the file is set aside under .corrupt-<time>, every good line is kept, the newest snapshot fills in what it can, the
   result is written back whole, and the epoch changes so every phone reads again — loudly, in the deploy log and on
   /health (record_recovered). With nothing to recover from it starts empty and says so. It never refuses to start:
   the record, the edit link and the drivers' cards do not stop for a track. */
function trackLoad() {
  const file = FILES.ticks;
  let raw = null, why = null;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { if (e.code !== 'ENOENT') why = 'could not be read (' + e.message + ')'; }
  const good = []; let bad = 0, torn = 0;
  if (raw) {
    const parts = raw.split('\n'), tail = parts.pop();
    if (tail !== '') torn = Buffer.byteLength(tail, 'utf8');
    for (const ln of parts) { let ev = null; try { ev = JSON.parse(ln); } catch (e) { /* counted */ } if (trackEventOk(ev)) good.push(ev); else bad++; }
  }
  if (raw && !why && !bad) {
    const fix = { twice: 0, order: 0 };
    good.forEach(ev => trackApply(ev, fix));
    if (track.epoch && !fix.twice && !fix.order) {
      track.bytes = Buffer.byteLength(raw, 'utf8') - torn;
      if (torn) {
        try { fs.truncateSync(file, track.bytes); } catch (e) { track.stuck = e; }
        track.notes.push('the last line of ' + path.basename(file) + ' was cut short (' + torn + ' bytes, a crash or a power cut mid-write) and was dropped');
      }
      return;
    }
    why = !track.epoch ? 'has no epoch line' : 'has ticks out of order (' + fix.order + ') or twice (' + fix.twice + ')';
    trackReset();
  }
  const snap = newestSnapshot('ticks', v => plainObject(v) && Array.isArray(v.events));
  if (!why) {
    if (raw === null) why = snap ? 'is missing although snapshots of it exist' : null;
    else if (!raw.length) why = snap ? 'is empty although snapshots of it exist' : null;
    else if (bad) why = bad + ' of its ' + (bad + good.length) + ' lines would not read';
  }
  if (!why) { track.epoch = trackNewEpoch(); track.header = false; track.bytes = 0; return; }   // a first run
  const fix = { twice: 0, order: 0 };
  trackMerge(snap ? snap.value.events.filter(trackEventOk) : [], good).forEach(ev => trackApply(ev, fix));
  track.epoch = trackNewEpoch();
  let setAside = null;
  if (raw) {
    setAside = file + '.corrupt-' + new Date().toISOString().replace(/[:.]/g, '-');
    try { fs.renameSync(file, setAside); } catch (e) { console.error('could not set the damaged tracker ticks aside:', e.message); setAside = null; }
  }
  try { trackWriteWhole(trackEvents('recovered at start: the file ' + why)); }
  catch (e) { track.broken = e; console.error('could not write the recovered tracker ticks back (ticks are refused until a restart):', e.message); }
  const from = [snap ? snap.name : null, good.length ? good.length + ' good lines of the file' : null].filter(Boolean).join(' + ') || 'nothing (started empty)';
  const note = { store: 'tracker ticks', file: path.basename(file), reason: why, loaded_from: from, damaged_copy: setAside ? path.basename(setAside) : null, at: new Date().toISOString() };
  STARTUP_RECOVERY.push(note);
  console.error('!!!!! GC500 TRACKER TICKS RECOVERED (' + from + '): ' + file + ' ' + why + '. Ticks after that are NOT in the tracker; '
    + 'the epoch changed so every phone reads again.' + (setAside ? ' The damaged file is kept as ' + setAside + '.' : ''));
  try { fs.appendFileSync(FILES.log, JSON.stringify(Object.assign({ what: 'STORE RECOVERED FROM SNAPSHOT' }, note)) + '\n'); } catch (e) { /* the console line is the record */ }
}
trackLoad();
/* Whole lines, one write, flushed to the disk before the answer. A write that failed is cut back off the file, so a
   half-written line can never glue itself to the next good one; until it can be cut, nothing more is written. */
function trackAppend(events) {
  if (track.broken) return track.broken;
  if (track.stuck) {
    try { fs.truncateSync(FILES.ticks, track.bytes); } catch (e) { if (e.code !== 'ENOENT') return e; }
    track.stuck = null;
  }
  let text = events.map(x => JSON.stringify(x) + '\n').join('');
  if (!track.header) text = JSON.stringify({ e: 'epoch', epoch: track.epoch, at: new Date().toISOString(), why: 'the first line of the store' }) + '\n' + text;
  let fd = null;
  try {
    fd = fs.openSync(FILES.ticks, 'a');
    fs.appendFileSync(fd, text);
    fs.fsyncSync(fd);   /* on the disk, not only in the page cache, before anyone is told "saved" (any Node version) */
  } catch (e) {
    if (fd !== null) { try { fs.closeSync(fd); } catch (e3) { /* already shut */ } fd = null; }
    try { fs.truncateSync(FILES.ticks, track.bytes); } catch (e2) { if (e2.code !== 'ENOENT') track.stuck = e2; }
    return e;
  }
  try { fs.closeSync(fd); } catch (e) { /* the line is written and flushed */ }
  track.bytes += Buffer.byteLength(text); track.header = true;
  return null;
}
/* a tracker's secret: made once, on the disk before the card that uses it is answered, snapshotted at once */
function trackMakeKey(token) {
  const ev = { e: 'key', token, key: crypto.randomBytes(32).toString('base64url'), at: new Date().toISOString() };
  const err = trackAppend([ev]);
  if (err) return err;
  trackApply(ev); trackSnapshotNow();
  return null;
}
function trackSig(token, ref) {
  if (!ownProp(track.keys, token)) return null;
  return crypto.createHmac('sha256', Buffer.from(track.keys[token].key, 'base64url')).update(token + ':' + ref, 'utf8')
    .digest('base64url').slice(0, TRACK_SIG_LEN);
}
/* {REF: sig} for every reference on the tracker: for the edit link only, to print the completion codes */
function trackLinks(token, tracker) {
  const o = {};
  for (const l of tracker.lines) if (!ownProp(o, l.ref)) { const s = trackSig(token, l.ref); if (s) o[l.ref] = s; }
  return o;
}
function trackSame(a, b) {
  if (a.ref !== b.ref || a.line !== b.line || a.task !== b.task || a.day !== b.day || a.done !== b.done) return false;
  const x = [...a.undoes].sort(), y = [...b.undoes].sort();
  return x.length === y.length && x.every((v, i) => v === y[i]);
}
/* rate limits, held in memory and bounded, like the wrong-key limiter */
const trackRates = { postAddress: new Map(), postTracker: new Map(), getAddress: new Map() };
function trackOver(kind, key, now) {
  const [limit, windowMs] = TRACK_LIMITS[kind], a = trackRates[kind].get(key);
  if (!a) return 0;
  while (a.length && now - a[0] >= windowMs) a.shift();
  if (!a.length) { trackRates[kind].delete(key); return 0; }
  return a.length >= limit ? Math.max(1, Math.ceil((a[0] + windowMs - now) / 1000)) : 0;
}
function trackHit(kind, key, now) {
  const map = trackRates[kind];
  if (!map.has(key) && map.size >= TRACK_RATE_MAX_KEYS) map.delete(map.keys().next().value);
  const a = map.get(key) || []; a.push(now); map.set(key, a);
}
setInterval(() => { const now = Date.now(); for (const kind of Object.keys(trackRates)) for (const key of [...trackRates[kind].keys()]) trackOver(kind, key, now); }, 60 * 1000).unref();
/* A tracker card is opened by every scan of every sheet all night. An open is still noted, but it is written to the
   disk and the log at most once a minute per tracker, with how many opens it stands for (the 18 Oct 2026 review: every
   open rewrote all of cards.json, and the page is in every crew's pocket). */
const trackOpens = new Map();
function trackOpened(token, c) {
  const now = Date.now(), o = trackOpens.get(token) || { last: 0, n: 0 };
  o.n += 1; trackOpens.set(token, o);
  if (now - o.last < 60 * 1000) return;
  c.opens = (c.opens || []).concat([new Date(now).toISOString()]).slice(-200);
  persistCards();
  logWrite({ at: new Date(now).toISOString(), what: 'card open', token, load: c.load, title: c.title, opens: o.n });
  o.last = now; o.n = 0;
}
/* GET /d/<token>/ticks — the tracker's ticks for any phone holding the card. Memory only: no open counted, nothing
   saved, no log line. Voided ticks are left out (the epoch told the phones to read again when they were voided). */
function trackGet(req, res, url, token, c) {
  const now = Date.now(), ip = clientIp(req), wait = trackOver('getAddress', ip, now);
  if (wait) return send(res, 429, { error: 'too many reads from this address — wait a moment', code: 'slow_down', retry_after: wait }, { 'Retry-After': String(wait) });
  trackHit('getAddress', ip, now);
  const since = Math.max(0, parseInt(url.searchParams.get('since') || '0', 10) || 0), box = trackBox(token, false);
  let list = box ? box.list.filter(x => x.seq > since && !box.voided.has(x.id)) : [];
  const more = list.length > TRACK_READ_MAX;
  if (more) list = list.slice(0, TRACK_READ_MAX);
  return send(res, 200, { now: new Date(now).toISOString(), epoch: trackEpoch(token), seq: more ? list[list.length - 1].seq : (box ? box.seq : 0),
    days: c.tracker.days, ticks: list.map(trackOut), service_day: serviceDay(now), updated: c.updated || null, more });
}
/* POST /d/<token>/ticks — {ticks: [1..20]}. Every tick is checked before any is kept, and the answer names the first
   one that fails (index, id, code); nothing of that POST is kept, so the phone drops that one and sends the rest. */
async function trackPost(req, res, token) {
  const first = Date.now(), ip = clientIp(req);
  const wait = Math.max(trackOver('postAddress', ip, first), trackOver('postTracker', token, first));
  if (wait) return send(res, 429, { error: 'too many ticks sent too fast — they stay on your phone and go again shortly', code: 'slow_down', retry_after: wait }, { 'Retry-After': String(wait) });
  trackHit('postAddress', ip, first); trackHit('postTracker', token, first);
  /* answered before reading: readBody cuts the socket when a body runs over, and then nothing can be answered */
  const declared = parseInt(req.headers['content-length'] || '0', 10);
  if (Number.isFinite(declared) && declared > TRACK_MAX_BODY) return send(res, 413, { error: 'that is more than ' + TRACK_MAX_BODY + ' bytes of ticks — send fewer at a time', code: 'too_big' });
  let body;
  try { body = JSON.parse((await readBody(req, TRACK_MAX_BODY)).toString('utf8')); } catch (e) { return send(res, 400, { error: 'that did not arrive as ticks', code: 'bad_body' }); }
  /* from here to the answer nothing waits, so no other request can slip in between the checks and the write */
  const T = Date.now(), c = cardOf(token);
  if (!c || !c.tracker) return send(res, 404, { error: 'this card takes no ticks', code: 'no_tracker' });
  if (cardExpired(c)) return send(res, 410, { error: 'this servicing tracker has finished', code: 'expired' });
  if (!plainObject(body) || !Array.isArray(body.ticks) || body.ticks.length < 1 || body.ticks.length > TRACK_MAX_BATCH) {
    return send(res, 400, { error: 'send {ticks: [1 to ' + TRACK_MAX_BATCH + ' ticks]}', code: 'bad_body' });
  }
  if (!ownProp(track.keys, token)) return send(res, 503, { error: 'this tracker has lost its key on the service — ring Andrew; the completion codes need printing again', code: 'no_key' });
  const cfg = c.tracker, box = trackBox(token, false), today = serviceDay(T), at = new Date(T).toISOString();
  const lines = new Map(cfg.lines.map(l => [l.id, l])), days = new Map(cfg.days.map(d => [d.id, d]));
  const fresh = [], saved = [], batch = new Map(), extra = new Map();
  const refuse = (status, code, i, t, error) => send(res, status, { error, code, index: i, id: t && typeof t.id === 'string' ? t.id.slice(0, 64) : null });
  for (let i = 0; i < body.ticks.length; i++) {
    const t = body.ticks[i];
    if (!plainObject(t)) return refuse(400, 'bad_tick', i, null, 'a tick is an object');
    if (typeof t.id !== 'string' || !TRACK_ID_RE.test(t.id)) return refuse(400, 'bad_id', i, t, 'a tick needs the id its phone made (16 or more letters, digits, - or _)');
    const ref = typeof t.ref === 'string' && TRACK_REF_RE.test(t.ref) ? t.ref : null;
    const want = ref ? trackSig(token, ref) : null;
    if (!want || typeof t.sig !== 'string' || !same(t.sig, want)) return refuse(403, 'bad_sig', i, t, 'this code cannot complete ' + (ref || 'that reference') + ' — scan the completion code printed for it');
    if (typeof t.line !== 'string' || typeof t.task !== 'string' || typeof t.day !== 'string') return refuse(400, 'bad_tick', i, t, 'a tick names its line, its task and its day');
    if (typeof t.done !== 'boolean') return refuse(400, 'bad_tick', i, t, 'done is true or false');
    const undoes = t.undoes == null ? [] : t.undoes;
    if (!Array.isArray(undoes) || undoes.length > TRACK_MAX_BATCH || !undoes.every(u => typeof u === 'string' && TRACK_ID_RE.test(u)) || new Set(undoes).size !== undoes.length) {
      return refuse(400, 'undoes', i, t, 'undoes is the list of tick ids this untick cancels');
    }
    const prior = batch.get(t.id) || (box && box.byId.get(t.id));
    if (prior) {   // a retry: the same tick again is acknowledged, a different tick under a used id is refused
      if (!trackSame(prior, { ref, line: t.line, task: t.task, day: t.day, done: t.done, undoes })) return refuse(409, 'id_reused', i, t, 'that tick id was already used for a different tick — this phone must make a new id');
      saved.push(Object.assign({ id: t.id, seq: prior.seq, at: prior.at, already: true }, box && box.voided.has(t.id) ? { voided: true } : {}));
      continue;
    }
    const line = lines.get(t.line), day = days.get(t.day);
    if (!line || line.ref !== ref) return refuse(400, 'line', i, t, 'that line is not one of ' + ref + "'s on this tracker");
    if (!day) return refuse(400, 'day', i, t, "that day is not one of this tracker's service days");
    if (t.day > today) return refuse(400, 'future_day', i, t, t.day + "'s service has not started — it starts at 08:00 that day");
    const tasks = ownProp(cfg.plans, line.kind) && ownProp(cfg.plans[line.kind], day.plan) ? cfg.plans[line.kind][day.plan] : [];
    if (!tasks.includes(t.task)) return refuse(400, 'task', i, t, JSON.stringify(t.task.slice(0, 24)) + ' is not a job for ' + line.id + ' on ' + t.day);
    if (t.done && undoes.length) return refuse(400, 'undoes', i, t, 'a tick cancels nothing; only an untick names what it cancels');
    if (!t.done && !undoes.length) return refuse(400, 'undoes', i, t, 'an untick names the tick it cancels');
    for (const u of undoes) {
      const x = batch.get(u) || (box && box.byId.get(u));
      if (!x || !x.done || x.ref !== ref || x.line !== t.line || x.task !== t.task || x.day !== t.day) {
        return refuse(400, 'undoes', i, t, 'an untick can only cancel a tick of the same job on the same day');
      }
    }
    const job = trackJob(t), n = (box ? box.jobs.get(job) || 0 : 0) + (extra.get(job) || 0);
    if (n >= TRACK_CAP_PER_JOB) return refuse(400, 'job_cap', i, t, 'this job has had ' + n + ' ticks on this day, the most it takes — ring Andrew');
    if (track.events + fresh.length + 1 > TRACK_MAX_EVENTS) return send(res, 507, { error: 'the tracker store is full — ring Andrew', code: 'full', full: true });
    extra.set(job, (extra.get(job) || 0) + 1);
    /* the phone's clock, kept as the phone's: never later than the time it reached here, and dropped (null) when it is
       nowhere near the day it is for — the card then shows the time it arrived */
    const tap = typeof t.tapped_at === 'string' ? Date.parse(t.tapped_at) : NaN;
    const tapped = Number.isFinite(tap) && tap >= serviceDayStart(t.day) - 6 * 3600 * 1000 && tap <= T + 10 * 60 * 1000 ? new Date(Math.min(tap, T)).toISOString() : null;
    const ev = { e: 'tick', token, id: t.id, seq: (box ? box.seq : 0) + fresh.length + 1, ref, line: t.line, task: t.task, day: t.day,
      done: t.done, undoes: undoes.slice(), at, tapped_at: tapped };
    fresh.push(ev); batch.set(t.id, ev);
    saved.push({ id: t.id, seq: ev.seq, at, already: false });
  }
  if (fresh.length) {
    const err = trackAppend(fresh);
    if (err) {   // not on the disk, so not in memory either: the retry must save, not say "already"
      logWrite({ at, what: 'tracker ticks NOT SAVED', token, n: fresh.length, error: err.message });
      return send(res, 507, { error: 'the service could not keep those ticks — they stay on your phone and go again', code: 'disk' });
    }
    fresh.forEach(ev => trackApply(ev));
    logWrite({ at, what: 'tracker ticks', token, load: c.load, n: fresh.length, unticks: fresh.filter(x => !x.done).length, refs: [...new Set(fresh.map(x => x.ref))] });
  }
  return send(res, 200, { saved, now: at, epoch: trackEpoch(token) });
}
/* GET /api/ticks (edit link) — with ?token=, that tracker whole: its list, the signatures to print, every tick
   (voided ones marked) and every void. Without, one line per tracker. */
function trackAdmin(res, url) {
  const now = Date.now(), tok = url.searchParams.get('token');
  if (!tok) {
    const tokens = [...new Set(Object.keys(cards).filter(k => cards[k] && cards[k].tracker).concat(Object.keys(track.boxes)))];
    return send(res, 200, { now: new Date(now).toISOString(), service_day: serviceDay(now), trackers: tokens.map(k => {
      const c = cardOf(k), b = trackBox(k, false);
      return { token: k, load: c ? c.load : null, title: c ? c.title : null, expires: c ? c.expires : null, expired: c ? cardExpired(c) : null,
        card_withdrawn: !c, tracker: !!(c && c.tracker), seq: b ? b.seq : 0, ticks: b ? b.list.length : 0, voided: b ? b.voided.size : 0, epoch: trackEpoch(k) };
    }) });
  }
  const c = cardOf(tok), box = trackBox(tok, false);
  if (!(c && c.tracker) && !box) return send(res, 404, { error: 'no servicing tracker has that token', code: 'no_tracker' });
  return send(res, 200, { now: new Date(now).toISOString(), epoch: trackEpoch(tok), service_day: serviceDay(now), token: tok,
    load: c ? c.load : null, title: c ? c.title : null, expires: c ? c.expires : null, expired: c ? cardExpired(c) : null,
    card_withdrawn: !c, updated: c ? c.updated : null, tracker: c && c.tracker ? c.tracker : null,
    links: c && c.tracker ? trackLinks(tok, c.tracker) : {}, key_kept: ownProp(track.keys, tok), seq: box ? box.seq : 0,
    ticks: box ? box.list.map(x => Object.assign(trackOut(x), box.voided.has(x.id) ? { voided: true } : {})) : [],
    voids: box ? box.voids.map(v => ({ vid: v.vid, ids: v.ids, at: v.at })) : [] });
}
/* POST /api/ticks/void (edit link) — {token, ids}: sets those ticks aside with a line of its own (a test card, a
   flood). Nothing is deleted; the epoch moves on, so every phone reads the tracker again without them. */
async function trackVoid(req, res) {
  let body;
  try { body = JSON.parse((await readBody(req, 64 * 1024)).toString('utf8')); } catch (e) { return send(res, 400, { error: 'send {token, ids: [tick ids]}', code: 'bad_body' }); }
  if (!plainObject(body) || typeof body.token !== 'string' || !Array.isArray(body.ids) || !body.ids.length || body.ids.length > 2000) {
    return send(res, 400, { error: 'send {token, ids: [1 to 2000 tick ids]}', code: 'bad_body' });
  }
  const box = trackBox(body.token, false);
  if (!box) return send(res, 404, { error: 'no ticks are kept under that token', code: 'no_tracker' });
  const unknown = body.ids.filter(id => typeof id !== 'string' || !box.byId.has(id));
  if (unknown.length) return send(res, 400, { error: unknown.length + ' of those are not ticks of this tracker — nothing was set aside', code: 'unknown_ids', unknown: unknown.slice(0, 20).map(x => String(x).slice(0, 64)) });
  const all = [...new Set(body.ids)], ids = all.filter(id => !box.voided.has(id)), already = all.filter(id => box.voided.has(id));
  if (!ids.length) return send(res, 200, { voided: [], already, epoch: trackEpoch(body.token) });
  const ev = { e: 'void', token: body.token, vid: crypto.randomBytes(9).toString('base64url'), ids, at: new Date().toISOString() };
  const err = trackAppend([ev]);
  if (err) {
    logWrite({ at: ev.at, what: 'tracker void NOT SAVED', token: body.token, n: ids.length, error: err.message });
    return send(res, 507, { error: 'the service could not write the void to its disk — nothing was set aside', code: 'disk' });
  }
  trackApply(ev);
  logWrite({ at: ev.at, what: 'tracker ticks voided', token: body.token, n: ids.length });
  return send(res, 200, { voided: ids, already, epoch: trackEpoch(body.token) });
}
function trackSummary() {
  const n = Object.keys(cards).filter(k => cards[k] && cards[k].tracker).length;
  return n + ' tracker' + (n === 1 ? '' : 's') + ', ' + track.events + ' tick' + (track.events === 1 ? '' : 's')
    + (track.broken ? ' · !!! TICKS REFUSED: ' + track.broken.message : '') + track.notes.map(x => ' · ' + x).join('');
}
""")

# 6. the snapshot carries the tracker's ticks too (hourly and at start; v5.87 leaves ticks-* files alone)
rep("for (const [prefix, obj, live] of [['records', state, FILES.records], ['files', files, FILES.files]]) {",
    "for (const [prefix, obj, live] of [['records', state, FILES.records], ['files', files, FILES.files], ['ticks', trackSnapshot(), FILES.ticks]]) {")

# 6b. the ticks' hourly copies keep a day, not four: a tick file is small, but a flooded one need not fill the volume
rep("all.slice(0, Math.max(0, all.length - (boot ? KEEP_BOOT_SNAPSHOTS : KEEP_SNAPSHOTS))).forEach(n => fs.unlinkSync(path.join(SNAP_DIR, n)));",
    "all.slice(0, Math.max(0, all.length - (boot ? KEEP_BOOT_SNAPSHOTS : prefix === 'ticks' ? KEEP_TICK_SNAPSHOTS : KEEP_SNAPSHOTS))).forEach(n => fs.unlinkSync(path.join(SNAP_DIR, n)));   /* v5.89 */")

# 7. /health
rep("record_recovered: STARTUP_RECOVERY.length ? STARTUP_RECOVERY : null, build: 'v5.87' });",
    "record_recovered: STARTUP_RECOVERY.length ? STARTUP_RECOVERY : null,\n"
    "      /* v5.89 — how many tracker ticks are kept, and anything said about their file at start */\n"
    "      tracker_ticks: track.events, tracker_notes: track.notes.length ? track.notes : null, build: 'v5.89' });")

# 8. a phone over a limit gets the answer as JSON on the ticks route (its card reads JSON), a page everywhere else
rep("""    const wait = tokenBlocked(req);
    if (wait) return send(res, 429, /^\\/(v|e|admin|d)\\//.test(p) ? page('Too many wrong links', '<p>Too many wrong links have been tried from this address. Wait a few minutes and open your link again.</p>')
      : { error: 'too many wrong keys from this address — wait a few minutes' }, Object.assign({ 'Retry-After': String(wait) }, /^\\/(v|e|admin|d)\\//.test(p) ? { 'Content-Type': 'text/html; charset=utf-8' } : {}));""",
    """    const wait = tokenBlocked(req);
    const htmlLink = /^\\/(v|e|admin|d)\\//.test(p) && !/^\\/d\\/[^/]+\\/+ticks\\/?$/.test(p);   /* v5.89 — the ticks route answers JSON */
    if (wait) return send(res, 429, htmlLink ? page('Too many wrong links', '<p>Too many wrong links have been tried from this address. Wait a few minutes and open your link again.</p>')
      : { error: 'too many wrong keys from this address — wait a few minutes' }, Object.assign({ 'Retry-After': String(wait) }, htmlLink ? { 'Content-Type': 'text/html; charset=utf-8' } : {}));""")

# 9. the scoped reply: own property, and a tracker card takes no reports
rep("""      const token = m[1], c = cards[token];
      if (!c || !CARD_TOKEN_RE.test(token)) return wrongKey(req, res, 404, { error: 'that link is not one of ours, or it has been withdrawn' });   /* v5.84 — counted */
      if (cardExpired(c)) return send(res, 410, { error: 'this card stopped working the day after the run — ring the number on it' });
""", """      const token = m[1], c = cardOf(token);   /* v5.89 — own property only */
      if (!c || !CARD_TOKEN_RE.test(token)) return wrongKey(req, res, 404, { error: 'that link is not one of ours, or it has been withdrawn' });   /* v5.84 — counted */
      if (cardExpired(c)) return send(res, 410, { error: 'this card stopped working the day after the run — ring the number on it' });
      /* v5.89 — a servicing tracker takes ticks, not reports: a right key, so not counted */
      if (c.tracker) return send(res, 404, { error: 'this link takes ticks, not reports', code: 'no_reports' });
""")

# 10. the legacy report: the same two changes
rep("""      const c = cards[m[1]];
      if (!c || !CARD_TOKEN_RE.test(m[1])) return wrongKey(req, res, 404, { error: 'that link is not one of ours, or it has been withdrawn' });   /* v5.84 — counted */
      if (cardExpired(c)) return send(res, 410, { error: 'this card stopped working the day after the run — ring the number on it' });
""", """      const c = cardOf(m[1]);   /* v5.89 — own property only */
      if (!c || !CARD_TOKEN_RE.test(m[1])) return wrongKey(req, res, 404, { error: 'that link is not one of ours, or it has been withdrawn' });   /* v5.84 — counted */
      if (cardExpired(c)) return send(res, 410, { error: 'this card stopped working the day after the run — ring the number on it' });
      /* v5.89 — a servicing tracker takes ticks, not reports (and not their 6 MB bodies): a right key, so not counted */
      if (c.tracker) return send(res, 404, { error: 'this link takes ticks, not reports', code: 'no_reports' });
""")

# 11. the ticks route, before the card's own page; the card's page looks its token up as an own property
rep("""    /* a driver's drop card. Its own token namespace: a view or edit token opens nothing here, and a card token
       opens nothing else. No record is read to answer it. */
    if ((m = p.match(/^\\/d\\/([A-Za-z0-9_-]+)\\/?$/))) {
      const c = cards[m[1]];
""", """    /* v5.89 — THE SERVICING TRACKER'S TICKS (the rules are with the tracker's store, above). The same card token, its own
       route: GET reads the shared ticks back from memory, POST takes a phone's ticks. An unknown token is a wrong key and
       counted, as on the report routes; a card with no tracker is a right key and is not. Each refusal carries a code
       the card acts on: 'withdrawn' (stop for good), 'no_tracker', 'expired'. */
    if ((m = p.match(/^\\/d\\/([A-Za-z0-9_-]+)\\/+ticks\\/?$/))) {
      const token = m[1], c = cardOf(token);
      if (!c || !CARD_TOKEN_RE.test(token)) return wrongKey(req, res, 404, { error: 'that link is not one of ours, or it has been withdrawn', code: 'withdrawn' });   /* counted */
      if (!c.tracker) return send(res, 404, { error: 'this card takes no ticks', code: 'no_tracker' });
      if (cardExpired(c)) return send(res, 410, { error: 'this servicing tracker has finished', code: 'expired' });
      if (req.method === 'GET') return trackGet(req, res, url, token, c);
      if (req.method === 'POST') return trackPost(req, res, token);
      return send(res, 405, { error: 'GET or POST' }, { Allow: 'GET, POST' });
    }
    /* a driver's drop card. Its own token namespace: a view or edit token opens nothing here, and a card token
       opens nothing else. No record is read to answer it. */
    if ((m = p.match(/^\\/d\\/([A-Za-z0-9_-]+)\\/?$/))) {
      const c = cardOf(m[1]);   /* v5.89 — own property only: GET /d/propertyIsEnumerable is a wrong key, not a page */
""")

# 12. a finished tracker says so in its own words; a tracker's opens are written at most once a minute
rep("""      if (cardExpired(c)) {
        return send(res, 410, page('This drop card has expired', `<p>This card was for <b>${esc(c.title || 'a load')}</b> on ${esc(c.run_date || 'its run day')}. It stopped working the day after the run.</p>${ring}`),
          { 'Content-Type': 'text/html; charset=utf-8' });
      }
      c.opens = (c.opens || []).concat([new Date().toISOString()]).slice(-200);
      persistCards();
      logWrite({ at: new Date().toISOString(), what: 'card open', token: m[1], load: c.load, title: c.title });
""", """      if (cardExpired(c)) {
        if (c.tracker) {   /* v5.89 */
          return send(res, 410, page('This servicing tracker has finished', `<p><b>${esc(c.title || 'The servicing tracker')}</b> took its last tick at the end of ${esc(c.expires || 'its last day')}. Nothing more can be ticked on it.</p>${ring}`),
            { 'Content-Type': 'text/html; charset=utf-8' });
        }
        return send(res, 410, page('This drop card has expired', `<p>This card was for <b>${esc(c.title || 'a load')}</b> on ${esc(c.run_date || 'its run day')}. It stopped working the day after the run.</p>${ring}`),
          { 'Content-Type': 'text/html; charset=utf-8' });
      }
      if (c.tracker) trackOpened(m[1], c);   /* v5.89 — at most one write a minute for a card every crew scans all night */
      else {
        c.opens = (c.opens || []).concat([new Date().toISOString()]).slice(-200);
        persistCards();
        logWrite({ at: new Date().toISOString(), what: 'card open', token: m[1], load: c.load, title: c.title });
      }
""")

# 13. the reports list: own properties only (?token=constructor answered 500)
rep("""          if (!reports[k]) continue;
          const c = cards[k] || null;
""", """          if (!ownProp(reports, k)) continue;   /* v5.89 — own property only */
          const c = cardOf(k);
""")

# 14. making a card: the tracker is checked whole before anything changes
rep("""        const token = CARD_TOKEN_RE.test(String(body.token || '')) && cards[body.token] ? String(body.token) : cardToken();
        const prev = cards[token];
""", """        /* v5.89 — THE SERVICING TRACKER. A card may carry `tracker` {days, lines, plans} (see the tracker's store). It is
           checked whole and refused with the reason when it does not check out (400), never quietly dropped: a card that
           lost its tracker this way would turn back into a driver's card and every crew phone would stop (the 18 Oct
           2026 review). A card that has a tracker is never re-posted without one (409). One live tracker per load: a
           second one posted with no token of its own gets 409 and the token of the one already live, so two editors
           pressing Make at once cannot split the crews across two trackers. */
        const given = String(body.token || ''), existing = CARD_TOKEN_RE.test(given) ? cardOf(given) : null;
        let tracker = null, keyNew = false;
        if (body.tracker != null) {
          const tc = trackerConfig(body.tracker);
          if (tc.error) return send(res, 400, { error: tc.error, code: 'bad_tracker' });
          tracker = tc.tracker;
          const after = nextDay(tracker.days[tracker.days.length - 1].id);
          if (body.expires == null || String(body.expires) < after) {
            return send(res, 400, { error: 'a servicing tracker needs expires on or after ' + after + ' — its last service runs to 08:00 that morning', code: 'bad_tracker' });
          }
          const load = String(body.load == null ? '' : body.load).slice(0, 60);
          const live = Object.keys(cards).map(k => cards[k]).find(x => x && x.tracker && x.load === load && !cardExpired(x) && !(existing && x.token === given));
          if (live) return send(res, 409, { error: 'a servicing tracker for this load is already live — post again with its token to update it', code: 'tracker_exists', token: live.token, url: '/d/' + live.token });
        } else if (existing && existing.tracker) {
          return send(res, 409, { error: 'this card is a servicing tracker — post it with its tracker, or every crew phone would stop', code: 'tracker_required', token: given });
        }
        const token = existing ? given : cardToken();   /* v5.89 — own property only */
        const prev = cardOf(token);
""")

# 15. the tracker goes on the card (keys and targets empty: it files under no reference and grants no scoped reply),
#     and its secret is on the disk before the card is
rep("""        pruneCards();
        const cerr = persistCards();
""", """        if (tracker) {
          Object.assign(cards[token], { tracker, keys: [], targets: [] });
          if (!ownProp(track.keys, token)) {
            const kerr = trackMakeKey(token);
            if (kerr) {
              if (prev) cards[token] = prev; else delete cards[token];
              logWrite({ at: new Date().toISOString(), what: 'tracker key NOT SAVED', token, error: kerr.message });
              return send(res, 507, { error: 'the service could not write the tracker to its disk — nothing was made; try again in a minute' });
            }
            keyNew = true;
          }
        }
        pruneCards();
        const cerr = persistCards();
""")

# 16. the edit link's answer carries the signatures to print, and the log says it is a tracker (never the key)
rep("""        logWrite({ at: new Date().toISOString(), what: prev ? 'card updated' : 'card made', token, load: cards[token].load, by: cards[token].by });
        return send(res, 200, { token, url: '/d/' + token, card: cardBrief(cards[token]) });
""", """        logWrite(Object.assign({ at: new Date().toISOString(), what: prev ? 'card updated' : 'card made', token, load: cards[token].load, by: cards[token].by },
          tracker ? { tracker: { lines: tracker.lines.length, days: tracker.days.length, key_new: keyNew } } : {}));
        /* v5.89 — tracker.links {REF: sig}: the completion codes to print. In this answer and /api/ticks, the edit link only. */
        return send(res, 200, Object.assign({ token, url: '/d/' + token, card: cardBrief(cards[token]) },
          tracker ? { tracker: { links: trackLinks(token, tracker), refs: new Set(tracker.lines.map(l => l.ref)).size, lines: tracker.lines.length, days: tracker.days, key_new: keyNew } } : {}));
""")

# 17. withdrawing a card: own property only (DELETE /api/cards/constructor answered 200)
rep("        if (!cards[m[1]]) return send(res, 404, { error: 'no such card' });",
    "        if (!cardOf(m[1])) return send(res, 404, { error: 'no such card' });   /* v5.89 — own property only */")

# 18. the tracker behind the edit link
rep("""      /* texting. The edit link only: a view link can read the record, and that is not the same thing as being
""", """      /* v5.89 — the servicing tracker behind the edit link: the list, the signatures to print and every tick (GET), and
         setting ticks aside (POST void). A view link sees none of it: the signatures are the crews' keys. */
      if (p === '/api/ticks' && req.method === 'GET') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link can view the record but not the servicing tracker' });
        return trackAdmin(res, url);
      }
      if (p === '/api/ticks/void' && req.method === 'POST') {
        if (lv !== 'edit') return send(res, 403, { error: 'this link cannot set tracker ticks aside' });
        return trackVoid(req, res);
      }
      /* texting. The edit link only: a view link can read the record, and that is not the same thing as being
""")

# 19. the start-up banner names the tracker
rep("""  + ' · drop cards ' + Object.keys(cards).length + ' (' + Object.values(cards).filter(c => !cardExpired(c)).length + ' live)'
""", """  + ' · drop cards ' + Object.keys(cards).length + ' (' + Object.values(cards).filter(c => !cardExpired(c)).length + ' live)'
  + ' · servicing tracker ' + trackSummary()   /* v5.89 */
""")

Path(sys.argv[2]).write_text(source, encoding='utf-8')
print('server v5.89 written: the servicing tracker (signed completion codes, its own append-only store), nothing else changed')
