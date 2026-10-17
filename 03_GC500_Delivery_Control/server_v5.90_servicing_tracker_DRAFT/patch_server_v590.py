#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded server v5.90 servicing reliability patch on exact live v5.89.
Usage: python3 patch_server_v590.py BASE_SERVER OUTPUT_SERVER
"""
import hashlib, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep as checked_rep
BASE_SHA = 'cb32d00e0d4beb90870685978981b1e14541a701c7b37cb1f180d848c134019c'
base = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(base).hexdigest() != BASE_SHA:
    raise SystemExit('Expected exact live server v5.89; wrong base or repeat refused.')
s = base.decode('utf8')
def rep(old, new):
    global s
    s = checked_rep(s, old, new, 'v5.90 ' + old[:48], sys.argv[1])
rep("const BUILD = 'server v5.89", "const BUILD = 'server v5.90")
rep("build: 'v5.89'", "build: 'v5.90'")
rep('const TRACK_MAX_EVENTS = 25000;             // every tick of every tracker on this service (a whole tracker at its caps is ~11,000)', '''const TRACK_MAX_EVENTS = 25000;             // unvoided ticks per tracker; a TEST card never spends a real card's allowance
const TRACK_MAX_HISTORY = 100000;           // per tracker, including voided ticks retained for audit and idempotent retries''')
rep("postTracker: [1200, 60 * 60 * 1000],      //   POSTs to one tracker an hour, from every address together", "postReference: [60, 60 * 60 * 1000],      //   successful fresh-tick POSTs per tracker/reference; other sheets keep working")
rep('postTracker: new Map()', 'postReference: new Map()')
rep("const wait = Math.max(trackOver('postAddress', ip, first), trackOver('postTracker', token, first));", "const wait = trackOver('postAddress', ip, first);")
rep("trackHit('postAddress', ip, first);   /* the tracker's own hourly allowance is spent only by signed, fresh ticks, further down (the 18 Oct pre-deploy review: unsigned junk could use it up) */", "trackHit('postAddress', ip, first);   /* unsigned requests never spend a reference's signed allowance */")
rep("if (track.events + fresh.length + 1 > TRACK_MAX_EVENTS) return send(res, 507, { error: 'the tracker store is full — ring Andrew', code: 'full', full: true });", """if ((box ? box.list.length - box.voided.size : 0) + fresh.length + 1 > TRACK_MAX_EVENTS) return send(res, 507, { error: 'this tracker is full — ask the project manager to review its ticks', code: 'full', full: true });
    if ((box ? box.list.length : 0) + fresh.length + 1 > TRACK_MAX_HISTORY) return send(res, 507, { error: 'this tracker has reached its retained history limit — contact the project manager', code: 'history_full', full: true });""")
rep("""  if (fresh.length) {
    trackHit('postTracker', token, first);
    const err = trackAppend(fresh);""", """  if (fresh.length) {
    const refs = [...new Set(fresh.map(t => t.ref))];
    for (const ref of refs) {
      const retry = trackOver('postReference', token + ':' + ref, T);
      if (retry) {
        const i = body.ticks.findIndex(t => t.ref === ref && fresh.some(f => f.id === t.id));
        return send(res, 429, { error: 'this reference has sent too many ticks — they stay on the phone and retry later',
          code: 'slow_down', ref, index: i, id: body.ticks[i].id, retry_after: retry }, { 'Retry-After': String(retry) });
      }
    }
    const err = trackAppend(fresh);""")
rep('    fresh.forEach(ev => trackApply(ev));', "    fresh.forEach(ev => trackApply(ev));\n    for (const ref of refs) trackHit('postReference', token + ':' + ref, T);")
# Shared cursor walk starts by binary search, avoiding a full historical scan for every current poll.
rep('/* GET /d/<token>/ticks —', """function trackReadPage(box, since, includeVoided) {
  if (!box) return { list: [], seq: 0, more: false };
  let lo = 0, hi = box.list.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (box.list[mid].seq <= since) lo = mid + 1; else hi = mid; }
  const list = [];
  for (let i = lo; i < box.list.length; i++) {
    const t = box.list[i]; if (!includeVoided && box.voided.has(t.id)) continue;
    if (list.length === TRACK_READ_MAX) return { list, seq: list[list.length - 1].seq, more: true };
    list.push(t);
  }
  return { list, seq: box.seq, more: false };
}
/* GET /d/<token>/ticks —""")
rep("""  let list = box ? box.list.filter(x => x.seq > since && !box.voided.has(x.id)) : [];
  const more = list.length > TRACK_READ_MAX;
  if (more) list = list.slice(0, TRACK_READ_MAX);
  return send(res, 200, { now: new Date(now).toISOString(), epoch: trackEpoch(token), seq: more ? list[list.length - 1].seq : (box ? box.seq : 0),
    days: c.tracker.days, ticks: list.map(trackOut), service_day: serviceDay(now), updated: c.updated || null, more });""", """  const page = trackReadPage(box, since, false);
  return send(res, 200, { now: new Date(now).toISOString(), epoch: trackEpoch(token), seq: page.seq,
    days: c.tracker.days, ticks: page.list.map(trackOut), service_day: serviceDay(now), updated: c.updated || null,
    card_script_hash: cardScriptHash(c.html), more: page.more });""")
old_start = s.index('/* GET /api/ticks (edit link)')
old_end = s.index('/* POST /api/ticks/void', old_start)
rep(s[old_start:old_end], (ROOT/'admin590_src.js').read_text())
rep("""        const token = existing ? given : cardToken();   /* v5.89 — own property only */""", """        /* v5.90: a routine update must not invalidate every laminated code after a lost store. */
        if (tracker && existing && existing.tracker && !ownProp(track.keys, given) && body.rekey !== true) {
          return send(res, 409, { error: 'the tracker key is missing; restore its backup or explicitly re-key and reprint every completion sheet',
            code: 'key_lost', token: given, reprint_required: true });
        }
        const token = existing ? given : cardToken();   /* v5.89 — own property only */""")
# Do not refer a crew to contact details that were never supplied on their paperwork.
rep("        : '<p>Ring the Coates events project manager whose name is on your paperwork.</p>';", "        : '<p>Contact the Coates events project manager on site.</p>';")
rep("          + '<p>Ring the Coates events project manager whose name is on your paperwork.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });", "          + '<p>Contact the Coates events project manager on site.</p>'), { 'Content-Type': 'text/html; charset=utf-8' });")
# Worker served only for a live tracker. It controls exactly this card, never the main page or APIs.
worker = (ROOT/'tracker_sw.js').read_text()
worker_marker = "    /* v5.89 — THE SERVICING TRACKER'S TICKS"
insert = """    /* v5.90 — offline card shell only, scoped to this tracker token. */
    if ((m = p.match(/^\\/d\\/([A-Za-z0-9_-]+)\\/sw\\.js$/)) && req.method === 'GET') {
      const c = cardOf(m[1]);
      if (!c) return wrongKey(req, res, 404, { error: 'this servicing link has been withdrawn', code: 'withdrawn' });
      if (!c.tracker) return send(res, 404, { error: 'this card has no offline tracker', code: 'no_tracker' });
      if (cardExpired(c)) return send(res, 410, { error: 'this servicing tracker has finished', code: 'expired' });
      return send(res, 200, TRACK_WORKER590, { 'Content-Type': 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed': '/d/' + m[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    }
"""
rep(worker_marker, insert+worker_marker)
rep('const TRACK_MAX_BODY =', 'const TRACK_WORKER590 = '+json.dumps(worker)+';\nconst TRACK_MAX_BODY =')
rep("+ \"base-uri 'none'; frame-ancestors 'none'\";\n      return send(res, 200, c.html, {", "+ \"base-uri 'none'; frame-ancestors 'none'\" + (c.tracker ? \"; worker-src 'self'\" : '');\n      return send(res, 200, c.html, {")
# HTTP cache remains no-store. Explicit worker cache is the tested, token-scoped offline store.
Path(sys.argv[2]).write_text(s)
print(hashlib.sha256(s.encode()).hexdigest(), len(s.encode()))
