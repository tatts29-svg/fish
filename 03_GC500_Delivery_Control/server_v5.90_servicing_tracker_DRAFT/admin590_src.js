/* Author: Andrew Fisher. v5.90 incremental edit-only reads. Signing links and void history are opt-in. */
function trackAdmin(res, url) {
  const now = Date.now(), tok = url.searchParams.get('token');
  if (!tok) {
    const tokens = [...new Set(Object.keys(cards).filter(k => cards[k] && cards[k].tracker).concat(Object.keys(track.boxes)))];
    return send(res, 200, { now: new Date(now).toISOString(), service_day: serviceDay(now), trackers: tokens.map(k => {
      const c = cardOf(k), b = trackBox(k, false);
      return { token: k, load: c ? c.load : null, title: c ? c.title : null, expires: c ? c.expires : null, expired: c ? cardExpired(c) : null,
        card_withdrawn: !c, tracker: !!(c && c.tracker), seq: b ? b.seq : 0, ticks: b ? b.list.length : 0,
        active_ticks: b ? b.list.length - b.voided.size : 0, voided: b ? b.voided.size : 0, epoch: trackEpoch(k) };
    }) });
  }
  const c = cardOf(tok), box = trackBox(tok, false);
  if (!(c && c.tracker) && !box) return send(res, 404, { error: 'no servicing tracker has that token', code: 'no_tracker' });
  const since = Math.max(0, parseInt(url.searchParams.get('since') || '0', 10) || 0);
  const includeVoided = url.searchParams.get('voided') === '1';
  const page = trackReadPage(box, since, includeVoided), ticks = page.list.map(t => Object.assign(trackOut(t), box.voided.has(t.id) ? { voided: true } : {}));
  const out = { now: new Date(now).toISOString(), epoch: trackEpoch(tok), service_day: serviceDay(now), token: tok,
    load: c ? c.load : null, title: c ? c.title : null, expires: c ? c.expires : null, expired: c ? cardExpired(c) : null,
    card_withdrawn: !c, updated: c ? c.updated : null, tracker: c && c.tracker ? c.tracker : null,
    key_kept: ownProp(track.keys, tok), seq: page.seq, more: page.more,
    total_seq: box ? box.seq : 0, active_ticks: box ? box.list.length - box.voided.size : 0,
    historical_ticks: box ? box.list.length : 0, ticks };
  if (url.searchParams.get('links') === '1') out.links = c && c.tracker ? trackLinks(tok, c.tracker) : {};
  if (url.searchParams.get('voids') === '1') {
    const start = Math.max(0, parseInt(url.searchParams.get('void_since') || '0', 10) || 0);
    const all = box ? box.voids : []; let count = 0, next = Math.min(start, all.length); out.voids = [];
    while (next < all.length && out.voids.length < 100) {
      const v = all[next];
      if (out.voids.length && count + v.ids.length > 2000) break;
      out.voids.push({ vid: v.vid, ids: v.ids, at: v.at }); count += v.ids.length; next++;
    }
    out.void_seq = next; out.void_more = next < all.length;
  }
  return send(res, 200, out);
}
