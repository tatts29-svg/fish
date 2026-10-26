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
     · histories are never merged: sent, they stand as sent; left out, the stored one stays.
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
/* completes an incoming delivery body from the stored document; returns null when nothing was kept, else the names of
   the fields kept (list order) and how many unit entries came from the stored copy (a map copied whole counts all of
   its units). Never a value: the write log gets names and counts only. */
function keepDeliveryFields(id, body) {
  if (!own594(state.docs, 'delivery') || !plainObject(state.docs.delivery) || !own594(state.docs.delivery, id)) return null;
  const held = state.docs.delivery[id];
  if (!plainObject(held)) return null;
  const kept = []; let unitsKept = 0;
  for (const k of DELIVERY_KEEP) {
    if (!own594(held, k)) continue;
    const t = DELIVERY_UNIT_STAMP.get(k);
    if (!own594(body, k)) {
      body[k] = held[k]; kept.push(k);
      if (t && plainObject(held[k])) unitsKept += Object.keys(held[k]).length;
    } else if (t && plainObject(body[k]) && plainObject(held[k])) {
      const r = mergeUnits594(body[k], held[k], t);
      if (r.kept) { body[k] = r.map; kept.push(k); unitsKept += r.kept; }
    }
  }
  return kept.length ? { kept, unitsKept } : null;
}
