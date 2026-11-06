/* v5.94 — A DELIVERY WRITE KEEPS THE FIELDS ITS SENDER HAS NEVER HEARD OF. Author: Andrew Fisher, 27 Oct 2026.
   At 03:59:55 AEST on 27 Oct 2026 an edit-link page opened before page v12.31 woke in a phone tab, read the record and,
   3 s later, wrote 68 delivery documents back whole without ready1231*, ready1238* and pickup1238*. Every page version
   rebuilds each delivery document from the fields IT knows when it opens and writes back each one that differs, and a
   document is stored whole, the last writer winning, so the Ready ticks and bookings were gone until put back by hand.

   Now a write to collection "delivery" that lands on a stored document is guarded before it is stored:
     · each field named in DELIVERY_KEEP that the stored document holds and the incoming one leaves out altogether (not
       an own property of the body) is copied across from the stored document, value for value. A field that IS sent,
       with any value and null included, is the sender's word and stands: null clears.
     · when both copies carry ready1238_units, or both carry pickup1238_units, as plain objects, the two maps are merged
       unit by unit by the page's own rule (mergeUnits594, below). No unit on either side is dropped.
     · when both copies carry ready1238_history, or both carry pickup1238_history, as lists, each stored line the
       incoming list has not got is added by the page's own rule (mergeHistory594, below), so a unit tick or booking the
       merge keeps never loses its history line. Every other history stands as sent, or stays as stored when left out.
     · when a field is added that the body did not carry, the body's _k is moved back to the end, where every page puts
       it (toDocs: Object.assign({}, r, {_k: k})). The stored text then reads back through the page's fromDocs and
       toDocs unchanged, so a current page does not take the completed document for a change of its own and send its
       older copy back up over another phone's work (the review of 27 Oct).
   Every other field is stored exactly as sent. Current writers delete eta, note, the date and out-date groups and the
   dated-complete trio on purpose, so this is a named list and never "keep whatever is missing": those clears still clear.
   Why each field is on the list: each was added to the page after its first release, so a tab opened before that
   release does not know it, and no writer in the current page (v12.42.1) ever deletes it. A Not ready, an un-tick, an
   emptied:false, a stage-0 timeline proof, a cleared load side, a cleared handling method and a cleared booking are all
   new dated entries, never a deletion. README.md beside this build gives the release and the evidence for each one.
   One stored document is read and the body is completed in the same synchronous step that stores it (setDoc), so no
   other write can land in between, and the write is versioned, logged and saved once, like any other. */
const DELIVERY_KEEP = Object.freeze([
  'ready1231', 'ready1231_at', 'ready1231_by', 'ready1231_why', 'ready1231_history',   /* v12.31, live 26 Oct 10:29 */
  'ready1238_units', 'ready1238_history', 'pickup1238_units', 'pickup1238_history',    /* v12.38 code, live in v12.42, 26 Oct 20:19 */
  'emptied', 'emptied_at', 'emptied_by', 'emptied_history',                            /* v8.16, 3 Oct */
  'timeline841',                                                                       /* v8.41, 4 Oct */
  'loading872',                                                                        /* v8.72, 7 Oct */
  'handling875',                                                                       /* v8.75, 7 Oct; methods widened in v8.81 */
]);
/* the stamp each unit entry is judged by: a Ready tick by when it was ticked (at); a booking by when it was set (set),
   because a booking's own "at" is the booked pick-up time, not when it was written */
const DELIVERY_UNIT_STAMP = new Map([['ready1238_units', 'at'], ['pickup1238_units', 'set']]);
const J594 = v => JSON.stringify(v === undefined ? null : v);
const own594 = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
/* a key is set as an own data property, so a unit id such as "__proto__" stays a unit and never reaches a prototype */
const put594 = (o, k, v) => Object.defineProperty(o, k, { value: v, enumerable: true, writable: true, configurable: true });
/* The page's own merge, word for word from the live page v12.42.1 (mergeRecords; Singles1238's umap and keepUnits apply
   the same rule as each document arrives):
     const um1238 = (x, y, t) => { const o = Object.assign({}, x && typeof x === 'object' ? x : {}); Object.keys(y && typeof y === 'object' ? y : {}).forEach(u => { const p = o[u], q = y[u]; if (!q || typeof q !== 'object') return; const s1 = String(q[t] || ''), s0 = p ? String(p[t] || '') : ''; if (!p || s1 > s0 || (s1 === s0 && J(q) < J(p))) o[u] = q; }); return o; };
   with J = v => JSON.stringify(v === undefined ? null : v). Here x is the incoming map and y the stored one: the later
   stamp wins, an empty stamp loses to any stamp, and on the same stamp the smaller JSON text wins (Not ready over
   Ready, a cleared booking over a booking), so the answer is the same whichever copy is named first. One addition: a
   stored unit whose entry is not an object (the page never writes one) is kept when the incoming map has no entry for
   that unit, so no unit present on either side is ever dropped. Returns the merged map and how many stored entries
   it kept; with none kept the incoming map is left exactly as it was sent. */
function mergeUnits594(sent, held, t) {
  const o = {}; let kept = 0;
  Object.keys(sent).forEach(u => put594(o, u, sent[u]));
  Object.keys(held).forEach(u => {
    const q = held[u], has = own594(o, u), p = has ? o[u] : undefined;
    if (!q || typeof q !== 'object') { if (!has) { put594(o, u, q); kept++; } return; }
    const s1 = String(q[t] || ''), s0 = p ? String(p[t] || '') : '';
    if (!p || s1 > s0 || (s1 === s0 && J594(q) < J594(p))) { put594(o, u, q); kept++; }
  });
  return { map: o, kept };
}
/* the key each history line is known by, word for word from Singles1238's keepUnits in the live page v12.42.1 (hr, hp) */
const DELIVERY_HISTORY_KEY = new Map([
  ['ready1238_history', h => (h.unit || '') + '|' + h.ready + '|' + h.at],
  ['pickup1238_history', h => (h.unit || '') + '|' + (h.pickup || '') + '|' + h.at],
]);
/* a history line the join can read without throwing: a plain object whose unit, word and stamp are not objects */
const line594 = h => plainObject(h) && ['unit', 'ready', 'pickup', 'at'].every(f => h[f] === null || typeof h[f] !== 'object');
/* The page's own history join, word for word from Singles1238's keepUnits in the live page v12.42.1:
     const hj = (x, y, k) => { const a = Array.isArray(x) ? x : [], seen = new Set(a.map(k)), add = (Array.isArray(y) ? y : []).filter(h => h && !seen.has(k(h))); return add.length ? a.concat(add).sort((p, q) => String(p.at || '').localeCompare(String(q.at || '')) || k(p).localeCompare(k(q))).slice(-400) : null; };
   Here x is the incoming list and y the stored one: each stored line the incoming list has not got (the same unit, word
   and stamp) is added, and only then is the whole list put in the page's one order (stamp, then key) and cut to the
   newest 400, as setUnitReady and setBooking cut it. A list with nothing to add is left exactly as sent. So that the
   server never throws on a list the page never writes, an incoming list holding any line line594 cannot read is left
   exactly as sent, and only stored lines line594 can read are added. Returns the joined list, or null when the list
   would be stored as sent. */
function mergeHistory594(sent, held, k) {
  if (!sent.every(line594)) return null;
  const seen = new Set(sent.map(k)), add = held.filter(h => line594(h) && !seen.has(k(h)));
  if (!add.length) return null;
  const list = sent.concat(add).sort((p, q) => String(p.at || '').localeCompare(String(q.at || '')) || k(p).localeCompare(k(q))).slice(-400);
  return J594(list) === J594(sent) ? null : list;
}
/* completes an incoming delivery body from the stored document; returns null when nothing was kept, else the names of
   the fields kept (list order) and how many unit entries came from the stored copy (a map copied whole counts all of
   its units). Never a value: the write log gets names and counts only. */
function keepDeliveryFields(id, body) {
  if (!own594(state.docs, 'delivery') || !plainObject(state.docs.delivery) || !own594(state.docs.delivery, id)) return null;
  const held = state.docs.delivery[id];
  if (!plainObject(held)) return null;
  const kept = []; let unitsKept = 0, added = false;
  for (const k of DELIVERY_KEEP) {
    if (!own594(held, k)) continue;
    const t = DELIVERY_UNIT_STAMP.get(k), hk = DELIVERY_HISTORY_KEY.get(k);
    if (!own594(body, k)) {
      body[k] = held[k]; kept.push(k); added = true;
      if (t && plainObject(held[k])) unitsKept += Object.keys(held[k]).length;
    } else if (t && plainObject(body[k]) && plainObject(held[k])) {
      const r = mergeUnits594(body[k], held[k], t);
      if (r.kept) { body[k] = r.map; kept.push(k); unitsKept += r.kept; }
    } else if (hk && Array.isArray(body[k]) && Array.isArray(held[k])) {
      const list = mergeHistory594(body[k], held[k], hk);
      if (list) { body[k] = list; kept.push(k); }
    }
  }
  /* a field added above lands after the body's _k; the page writes _k last, so it goes back to the end (a field merged
     in place keeps its place, and with nothing added the body keeps the order it was sent in) */
  if (added && own594(body, '_k')) { const key = body._k; delete body._k; put594(body, '_k', key); }
  return kept.length ? { kept, unitsKept } : null;
}
