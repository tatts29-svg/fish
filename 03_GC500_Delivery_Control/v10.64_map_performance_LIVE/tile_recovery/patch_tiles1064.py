#!/usr/bin/env python3
"""Bound every pyramid tile attempt, including body/decode stalls. Author: Andrew Fisher."""
from pathlib import Path
import argparse
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "toolchain"))
from rep import rep

OLD = r"""    if (!svg) {                                     /* pre-rendered: a small lossless WebP, decoded off the thread */
      const ac = new AbortController(); vtBusy++; vtInflight.set(q.key, ac);
      fetchVT(q, ac.signal).then(r => r === null ? null : r.status === 404 && !(PYR && PYR.packed) ? null : r.ok ? r.blob() : Promise.reject(new Error('vt ' + r.status)))
        .then(b => b ? createImageBitmap(b) : null)
        .then(bm => { if(ac.signal.aborted||vtInflight.get(q.key)!==ac){if(bm)bm.close();return;}put(bm); vtRetry.delete(q.key); perf.vtFetched = (perf.vtFetched || 0) + 1; perf.lastRender = {ms: Math.round(performance.now() - t0), count: null, zoom: camera.z, from: 'pyramid'}; })
        .catch(e => { if (e.name === 'AbortError') return; console.warn('pyramid tile', e); if (/vt (404|410)|not honoured/.test(String(e))) return dropLevelFile(q.L);
          const n = ((vtRetry.get(q.key) || {}).n || 0) + 1, wait = Math.min(30000, 1000 * Math.pow(2, n - 1)); vtRetry.set(q.key, {n, at: performance.now() + wait}); setTimeout(requestPaint, wait + 20); }).finally(() => { vtBusy--; if (vtInflight.get(q.key) === ac) vtInflight.delete(q.key); pumpVT(); });
      continue;
    }"""

NEW = r"""    if (!svg) {                                     /* pre-rendered: a small lossless WebP, decoded off the thread */
      /* Pyramid recovery v10.64. Author: Andrew Fisher. A stalled body or decoder must not keep one of the six slots. */
      const ac = new AbortController(); vtBusy++; vtInflight.set(q.key, ac);
      let finished = false, timer = 0;
      const owns = () => !finished && !ac.signal.aborted && vtInflight.get(q.key) === ac;
      const finish = () => {
        if (finished) return; finished = true; clearTimeout(timer); ac.signal.removeEventListener('abort', finish);
        if (vtInflight.get(q.key) === ac) vtInflight.delete(q.key); vtBusy--;
        /* The caller may still be pruning old requests; start replacements after that iteration completes. */
        Promise.resolve().then(pumpVT);
      };
      const fail = e => {
        if (!owns() || e.name === 'AbortError') return; console.warn('pyramid tile', e);
        if (/vt (404|410)|not honoured/.test(String(e))) return dropLevelFile(q.L);
        const n = ((vtRetry.get(q.key) || {}).n || 0) + 1, wait = Math.min(30000, 1000 * Math.pow(2, n - 1));
        vtRetry.set(q.key, {n, at: performance.now() + wait}); setTimeout(requestPaint, wait + 20);
      };
      ac.signal.addEventListener('abort', finish, {once: true});
      timer = setTimeout(() => { if (owns()) fail(new Error('vt timed out')); ac.abort(); }, 20000);
      Promise.resolve().then(() => { if (!owns()) throw new DOMException('View changed', 'AbortError'); return fetchVT(q, ac.signal); })
        .then(r => { if (!owns()) throw new DOMException('View changed', 'AbortError'); return r === null ? null : r.status === 404 && !(PYR && PYR.packed) ? null : r.ok ? r.blob() : Promise.reject(new Error('vt ' + r.status)); })
        .then(b => { if (!owns()) throw new DOMException('View changed', 'AbortError'); return b ? createImageBitmap(b) : null; })
        .then(bm => { if (!owns()) { if (bm) bm.close(); return; } put(bm); vtRetry.delete(q.key); perf.vtFetched = (perf.vtFetched || 0) + 1; perf.lastRender = {ms: Math.round(performance.now() - t0), count: null, zoom: camera.z, from: 'pyramid'}; })
        .catch(fail).finally(finish);
      continue;
    }"""


def apply(text, path="explorer.js"):
    if "Pyramid recovery v10.64" in text:
        raise SystemExit("Pyramid recovery v10.64 is already present")
    return rep(text, OLD, NEW, "bounded pyramid tile attempts", path, True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, nargs="?")
    args = parser.parse_args()
    result = apply(args.source.read_text(), str(args.source))
    if args.output:
        args.output.write_text(result)
    else:
        sys.stdout.write(result)
