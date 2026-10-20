/* Author: Andrew Fisher. Bounded map request and camera lifecycle replacements. */

/* BEGIN google */
let googleJob813 = null, googleRetryAt813 = 0;
async function ensureGoogle(fresh = false) {
  if (gSession) return gSession;
  if (googleJob813) return googleJob813;
  if (!gKey) { gState = 'no'; return null; }
  if (!fresh && (gState === 'no' || performance.now() < googleRetryAt813)) return null;
  const kept = !fresh && storedSession();
  if (kept) { gSession = kept; gState = 'ok'; gKept = true; useSource('google'); copyrightOnce(); return gSession; }
  const key = gKey, ac = new AbortController(); let timer;
  googleJob813 = (async () => {
    try {
      const request = fetch('https://tile.googleapis.com/v1/createSession?key=' + encodeURIComponent(key), {method: 'POST', signal: ac.signal, headers: {'Content-Type': 'application/json'}, body: JSON.stringify({mapType: 'satellite', language: 'en-AU', region: 'AU', scale: 'scaleFactor2x', highDpi: true})})
        .then(async r => { if (!r.ok) throw new Error('session ' + r.status); const j = await r.json(); if (!j.session || j.tileWidth !== 512) throw new Error('session shape'); return j; });
      const deadline = new Promise((_, reject) => { timer = setTimeout(() => { ac.abort(); reject(new Error('session timed out')); }, 20000); });
      const j = await Promise.race([request, deadline]);
      if (key !== gKey) return null;
      gSession = j.session; gState = 'ok'; googleRetryAt813 = 0; gKept = false;
      try { localStorage.setItem(GS_KEY, JSON.stringify({session: j.session, exp: j.expiry, k: keyPrint(key)})); } catch (_) {}
      useSource('google'); copyrightOnce(); return gSession;
    } catch (e) {
      if (key === gKey) { gState = /session (?:40[0-4]|shape)/.test(String(e)) ? 'no' : 'retry'; googleRetryAt813 = performance.now() + 15000; useSource('mapbox'); }
      return null;
    } finally { clearTimeout(timer); googleJob813 = null; }
  })();
  return googleJob813;
}
/* END google */

/* BEGIN pump */
function pump() {
  if (!queue.size || running >= 8) return;
  const order = [...queue.values()].sort((a, b) => a.prio - b.prio);
  for (const t of order) {
    if (running >= 8) break; queue.delete(t.key); if (t.gen !== tileGen || tiles.has(t.key) || inflight.has(t.key)) continue; running++;
    const ac = new AbortController(), source = SOURCE; inflight.set(t.key, ac);
    let finished = false, timer = 0;
    const owns = () => t.gen === tileGen && source === SOURCE && inflight.get(t.key) === ac && !ac.signal.aborted;
    const finish = () => { if (finished) return; finished = true; clearTimeout(timer); if (inflight.get(t.key) === ac) inflight.delete(t.key); running--; pumpSoon(); };
    ac.signal.addEventListener('abort', finish, {once: true});
    const g = source === 'google' && gSession;
    const fail = e => {
      if (!owns() || e.name === 'AbortError') return;
      const attempts = (tileTries.get(t.key) || 0) + 1; tileTries.delete(t.key); tileTries.set(t.key, attempts);
      tiles.set(t.key, {bm: null, at: performance.now(), err: String(e), retryAt: tileRetryAt(t.key)}); satWhy = String(e); evict(); requestPaint();
      if (g && /40[0-4]/.test(String(e))) {
        gSession = null; tiles.delete(t.key); tileTries.delete(t.key);
        if (gKept) { try { localStorage.removeItem(GS_KEY); } catch (_) {} gKept = false; ensureGoogle(true); return; }
        gState = 'no'; useSource('mapbox'); return;
      }
      if (/401|403/.test(String(e))) keyProblem();
    };
    timer = setTimeout(() => { if (owns()) fail(new Error('tile timed out')); ac.abort(); }, 20000);
    const url = g ? `https://tile.googleapis.com/v1/2dtiles/${t.z}/${t.x}/${t.y}?session=${encodeURIComponent(gSession)}&key=${encodeURIComponent(gKey)}` : `https://api.mapbox.com/v4/mapbox.satellite/${t.z}/${t.x}/${t.y}@2x.jpg90?access_token=${encodeURIComponent(mapKey)}`;
    fetch(url, {signal: ac.signal, cache: tileTries.has(t.key) ? 'reload' : 'force-cache'})
      .then(r => { if (!r.ok) throw new Error('tile ' + r.status); if (!owns()) throw new DOMException('View changed', 'AbortError'); perf.tileBytes += +(r.headers.get('content-length') || 0); return r.blob(); })
      .then(b => { if (!owns()) throw new DOMException('View changed', 'AbortError'); return createImageBitmap(b); })
      .then(bm => {
        if (!owns()) { bm.close(); return; }
        const old = tiles.get(t.key); if (old && old.bm && old.bm !== bm) old.bm.close();
        tiles.set(t.key, {bm, at: performance.now()}); tileTries.delete(t.key); perf.tilesFetched++; evict(); requestPaint();
      })
      .catch(fail).finally(finish);
  }
}
/* END pump */

/* BEGIN evict */
function evict() {
  if (tiles.size > TILE_CAP) {
    const arr = [...tiles.entries()].sort((a, b) => a[1].at - b[1].at);
    for (const [k, v] of arr.slice(0, tiles.size - TILE_CAP)) { if (v.bm) v.bm.close(); tiles.delete(k); }
  }
  /* Keep recent backoff history across bitmap eviction, with a separate finite bound. */
  while (tileTries.size > TILE_CAP * 2) tileTries.delete(tileTries.keys().next().value);
}
/* END evict */

/* BEGIN retry */
function retrySatellite() {
  cancelTiles(); clearTimeout(retryTimer); retryTimer = 0;
  for (const [k, t] of tiles) if (!t.bm) tiles.delete(k); tileTries.clear(); satWhy = '';
  /* Retry is explicit: release stuck slots and re-arm a failed session without discarding usable imagery. */
  if (gKey && !gSession) { gState = 'unknown'; googleRetryAt813 = 0; ensureGoogle(true).then(() => requestPaint()); }
  if (keyState === 'none' || keyState === 'bad') { mapKey = null; keyState = 'unknown'; ensureKey().then(() => requestPaint()); }
  satState = 'retry'; setSatState(''); changeView(false);
}
/* END retry */

/* BEGIN motion */
function stopCameraMotion813() {
  stopZoomAnim(); stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;
  goalWanted.clear(); vtGoal.clear(); for (const q of vtQueue.values()) q.goal = false;
}
/* END motion */

/* BEGIN cancel */
  if (e.type === 'pointercancel') {
    for (const id of pointers.keys()) { try { if (stage.hasPointerCapture(id)) stage.releasePointerCapture(id); } catch (_) {} }
    pointers.clear(); pinch = null; gestureStart = null; panTrail = []; tapPick = null; lastTap = null; boxStart = null;
    $('sel').style.display = 'none'; if (boxMode) setBox(false); stage.classList.remove('dragging'); changeView(false); return;
  }
/* END cancel */

/* BEGIN sharp */
/* v8.13 - keep first view and ordinary zooms on the pre-rendered pyramid. The source scene is
   loaded by ensureScene only for detail beyond that pyramid, export, or a missing boot/label source.
   Original plan's aerial is requested by drawUnderlay when that mode is actually visible. */
function afterFirstSharp() { maybeReady(); }
/* END sharp */
