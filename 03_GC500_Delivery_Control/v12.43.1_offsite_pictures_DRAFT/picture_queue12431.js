/* Author: Andrew Fisher. Keep three draws; queued work belongs to the currently visible cards. */
function pump() {
 PicCache12431.pruneQueue();
 while (pbusy < 3 && PQ.length) {
  const id = PQ.pop(); if (!PicCache12431.wanted(id)) continue;
  if (PIC.has(id)) { show(id); continue; } if (FLY.has(id)) continue;
  pbusy++; FLY.add(id);
  drawPic(id).then(u => {
   if (u) { PicCache12431.put(id, u); if (PicCache12431.wanted(id)) show(id); }
   else { PFAIL.set(id, Date.now()); if (PicCache12431.wanted(id)) failed(id); }
  }).catch(() => { PFAIL.set(id, Date.now()); if (PicCache12431.wanted(id)) failed(id); })
   .then(() => { FLY.delete(id); pbusy--; PicCache12431.sweep(); pump(); });
 }
}
function want(id) {
 if (!PicCache12431.wanted(id)) return;
 if (PIC.has(id)) { show(id); return; } if (FLY.has(id)) return;
 if (PFAIL.has(id) && Date.now() - PFAIL.get(id) < 60000) { failed(id); return; }
 if (PQ.indexOf(id) < 0) PQ.push(id); pump();
}
function scroller() { const pane = D.getElementById('pane-demob'); let sc = pane && pane.parentElement; while (sc && sc !== D.body) { const cs = getComputedStyle(sc); if (/(auto|scroll)/.test(cs.overflowY)) return sc; sc = sc.parentElement; } return null; }
function arm() { PicCache12431.arm(scroller()); }
