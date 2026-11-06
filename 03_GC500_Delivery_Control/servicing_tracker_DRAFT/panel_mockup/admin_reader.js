/* Author: Andrew Fisher. Bounded read-only tracker cursor consumer, shared by the panel and its tests. */
var SvcAdminReader = (function () {
'use strict';
function create(get) {
  var token = '', epoch = '', updated = '', seq = 0, held = Object.create(null);
  function clear(t) { token = t || ''; epoch = ''; updated = ''; seq = 0; held = Object.create(null); }
  async function read(t) {
    if (token !== t) clear(t);
    var cursor = seq, next = Object.assign(Object.create(null), held), ep = epoch, up = updated, resets = 0, last;
    for (var page = 0; page < 20; page++) {
      var j = await get({token: t, since: cursor});
      if (!j || !Array.isArray(j.ticks) || !Number.isSafeInteger(j.seq) || j.seq < 0 || !j.epoch) throw new Error('The tracker service returned an unreadable page.');
      if ((ep && j.epoch !== ep) || (up && j.updated !== up)) {
        if (++resets > 2) throw new Error('The tracker changed while it was being read. Retrying shortly.');
        ep = j.epoch; up = j.updated || ''; cursor = 0; next = Object.create(null); continue;
      }
      ep = j.epoch; up = j.updated || '';
      if (j.seq < cursor || (j.more && j.seq <= cursor)) throw new Error('The tracker cursor did not advance.');
      if (j.ticks.length > 2000) throw new Error('The tracker page exceeds its safe limit.');
      j.ticks.forEach(function (e) { if (e && typeof e.id === 'string') next[e.id] = e; });
      cursor = j.seq; last = j;
      if (!j.more) {
        token = t; epoch = ep; updated = up; seq = cursor; held = next;
        return {meta: last, events: Object.keys(held).map(function (id) { return held[id]; }), seq: seq};
      }
    }
    throw new Error('The tracker needs more than 20 pages. No partial progress was shown.');
  }
  return {read: read, clear: clear};
}
return {create: create};
})();
if (typeof module === 'object' && module && module.exports) module.exports = SvcAdminReader;
