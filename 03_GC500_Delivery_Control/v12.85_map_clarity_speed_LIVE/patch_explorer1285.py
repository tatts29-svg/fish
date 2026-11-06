"""Author: Andrew Fisher. Bounded Map Explorer v12.85 source patch.

Private base/candidate bundles stay outside Git. This performs no service writes.
"""
import argparse
import hashlib
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

BASE_HASHES = {
 'explorer/explorer.js': 'e175ec073b2d30c89c075f5bfe6ab823385c8f23cd50d07fa13ef10b5e2e6b5a',
 'explorer/index.html': '91e0ae84b59235c963eeb93ff79e9263844b333565b6b7c3726a62a918fd6d20',
}
EXPLORER_REPLACEMENTS = [('/* v6.90 - GOOGLE\'S AERIAL PHOTOGRAPH (Andrew Fisher, 27 Sep 2026: "4K ultra clear ... sharp, '
  'clear"). Google\'s Map Tiles\n'
  '   API satellite (Vexcel 2026 aerial at the circuit, to zoom 21) is used through the '
  "dashboard's own Google key, the one the\n"
  "   3D proof uses; Mapbox stays as the fallback if Google's session cannot be had or stops "
  'answering. Same XYZ scheme and\n'
  "   512 px tiles, so nothing else in the chain changes. Google's logo and its imagery credit are "
  'shown whenever its tiles are. */\n'
  "let gKey = null, gSession = null, SOURCE = 'mapbox', gCopy = 'Imagery © Google', gState = "
  "'unknown';\n"
  "function tileMaxZ() { return SOURCE === 'google' ? 21 : 19; }\n"
  "/* v6.97 - Google's session is kept in this browser until a day before it expires (a session is "
  "Google's own reusable\n"
  '   token, valid about two weeks; only a fingerprint of the key is stored with it, never the '
  'key): a return visit asks\n'
  '   for the key and goes straight to tiles. A stale session is dropped and a fresh one asked for '
  'once before Mapbox. */\n'
  "const GS_KEY = 'gc500.explorer.gsession';\n"
  'const keyPrint = k => { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= '
  'k.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };\n'
  "function storedSession() { try { const s = JSON.parse(localStorage.getItem(GS_KEY) || 'null'); "
  'if (s && s.k === keyPrint(gKey) && s.session && +s.exp > Date.now() / 1000 + 86400) return '
  's.session; } catch (e) {} return null; }\n'
  'let googleJob813 = null, googleRetryAt813 = 0;\n'
  'async function ensureGoogle(fresh = false) {\n'
  '  if (gSession) return gSession;\n'
  '  if (googleJob813) return googleJob813;\n'
  "  if (!gKey) { gState = 'no'; return null; }\n"
  "  if (!fresh && (gState === 'no' || performance.now() < googleRetryAt813)) return null;\n"
  '  const kept = !fresh && storedSession();\n'
  "  if (kept) { gSession = kept; gState = 'ok'; gKept = true; useSource('google'); "
  'copyrightOnce(); return gSession; }\n'
  '  const key = gKey, ac = new AbortController(); let timer;\n'
  '  googleJob813 = (async () => {\n'
  '    try {\n'
  "      const request = fetch('https://tile.googleapis.com/v1/createSession?key=' + "
  "encodeURIComponent(key), {method: 'POST', signal: ac.signal, headers: {'Content-Type': "
  "'application/json'}, body: JSON.stringify({mapType: 'satellite', language: 'en-AU', region: "
  "'AU', scale: 'scaleFactor2x', highDpi: true})})\n"
  "        .then(async r => { if (!r.ok) throw new Error('session ' + r.status); const j = await "
  "r.json(); if (!j.session || j.tileWidth !== 512) throw new Error('session shape'); return j; "
  '});\n'
  '      const deadline = new Promise((_, reject) => { timer = setTimeout(() => { ac.abort(); '
  "reject(new Error('session timed out')); }, 20000); });\n"
  '      const j = await Promise.race([request, deadline]);\n'
  '      if (key !== gKey) return null;\n'
  "      gSession = j.session; gState = 'ok'; googleRetryAt813 = 0; gKept = false;\n"
  '      try { localStorage.setItem(GS_KEY, JSON.stringify({session: j.session, exp: j.expiry, k: '
  'keyPrint(key)})); } catch (_) {}\n'
  "      useSource('google'); copyrightOnce(); return gSession;\n"
  '    } catch (e) {\n'
  "      if (key === gKey) { gState = /session (?:40[0-4]|shape)/.test(String(e)) ? 'no' : "
  "'retry'; googleRetryAt813 = performance.now() + 15000; useSource('mapbox'); }\n"
  '      return null;\n'
  '    } finally { clearTimeout(timer); googleJob813 = null; }\n'
  '  })();\n'
  '  return googleJob813;\n'
  '}\n'
  'let gKept = false, copyrightAsked = false;\n'
  'function copyrightOnce() { if (copyrightAsked) return; copyrightAsked = true;   /* the imagery '
  'credit, after the first tiles have had the line to themselves */\n'
  '  setTimeout(() => '
  'fetch(`https://tile.googleapis.com/tile/v1/viewport?session=${gSession}&key=${encodeURIComponent(gKey)}&zoom=20&north=-27.972&south=-28.004&east=153.436&west=153.405`).then(r '
  '=> r.ok ? r.json() : null).then(v => { if (v && v.copyright) { gCopy = v.copyright; '
  'setAttrib(); } }).catch(() => {}), 1500); }\n'
  'function useSource(src) { if (src === SOURCE) return; SOURCE = src; for (const t of '
  'tiles.values()) if (t.bm) t.bm.close(); tiles.clear(); tileTries.clear(); cancelTiles(); '
  'mosaics.clear(); setAttrib(); requestPaint(); }\n',
  '/* Author: Andrew Fisher. v12.85: use the approved Mapbox background directly.\n'
  '   Its capture date is unverified. Google photorealistic 3D keeps its own unchanged\n'
  '   key/configuration path; 2D never waits for a Google session or switches imagery. */\n'
  'let gKey = null;\n'
  "const SOURCE = 'mapbox';\n"
  'function tileMaxZ() { return 19; }\n',
  'approved Mapbox 2D source without a session dependency'),
 ('  a.innerHTML = SOURCE === \'google\' ? `<img src="assets/google_logo_white.png" alt="Google" '
  'class="glogo"> ${esc(gCopy)} · Drawing © iEDM D001 rev 03 · issued 2 Oct`\n'
  '    : ',
  '  a.innerHTML = ',
  'Mapbox attribution'),
 ("    const g = source === 'google' && gSession;\n", '', 'remove obsolete 2D provider branch'),
 ('      if (g && /40[0-4]/.test(String(e))) {\n'
  '        gSession = null; tiles.delete(t.key); tileTries.delete(t.key);\n'
  '        if (gKept) { try { localStorage.removeItem(GS_KEY); } catch (_) {} gKept = false; '
  'ensureGoogle(true); return; }\n'
  "        gState = 'no'; useSource('mapbox'); return;\n"
  '      }\n',
  '',
  'retain Mapbox retry without changing background'),
 ('    const url = g ? '
  '`https://tile.googleapis.com/v1/2dtiles/${t.z}/${t.x}/${t.y}?session=${encodeURIComponent(gSession)}&key=${encodeURIComponent(gKey)}` '
  ': '
  '`https://api.mapbox.com/v4/mapbox.satellite/${t.z}/${t.x}/${t.y}@2x.jpg90?access_token=${encodeURIComponent(mapKey)}`;',
  '    const url = '
  '`https://api.mapbox.com/v4/mapbox.satellite/${t.z}/${t.x}/${t.y}@2x.jpg90?access_token=${encodeURIComponent(mapKey)}`;',
  'native high-DPI satellite tile path'),
 ("function satCanFetch() { return SOURCE === 'google' ? !!gSession : !!mapKey; }",
  'function satCanFetch() { return !!mapKey; }',
  'Mapbox readiness'),
 ("  if (!mapKey && SOURCE !== 'google') {", '  if (!mapKey) {', 'Mapbox availability guard'),
 ("  if (gKey && !gSession) { gState = 'unknown'; googleRetryAt813 = 0; ensureGoogle(true).then(() "
  '=> requestPaint()); }\n',
  '',
  'retry never switches to old imagery'),
 ('  /* Retry is explicit: release stuck slots and re-arm a failed session without discarding '
  'usable imagery. */',
  '  /* Retry releases stuck slots and refreshes failed access without discarding usable imagery. '
  '*/',
  'retry documentation'),
 ("function ensureKey() { if (mapKey || gSession) return Promise.resolve(mapKey || 'google'); if "
  '(!keyPromise) keyPromise = keyOnce().finally(() => { keyPromise = null; }); return keyPromise; '
  '}',
  'function ensureKey() { if (mapKey) return Promise.resolve(mapKey); if (!keyPromise) keyPromise '
  '= keyOnce().finally(() => { keyPromise = null; }); return keyPromise; }',
  'deduplicated Mapbox access'),
 ('    if (gKey) await ensureGoogle();                  /* Google first: Mapbox only if Google '
  "can't be had */\n",
  '',
  'start immediately from the returned Mapbox token'),
 ('    if (ready && !zAnim && !interacting && (mapKey || gSession)) prefetchView(currentView());',
  '    if (ready && !zAnim && !interacting && mapKey) prefetchView(currentView());',
  'first tiles need only Mapbox access'),
 ("    if (mapKey) return mapKey; if (gSession) { keyState = 'ok'; return 'google'; } }",
  '    if (mapKey) return mapKey; }',
  'no silent provider fallback'),
 ("  if (label) label.textContent = SOURCE === 'google' ? 'Google Satellite' : 'Mapbox Satellite';",
  "  if (label) label.textContent = 'Mapbox Satellite';",
  'source label'),
 ("${SOURCE === 'google' ? 'Google Satellite' : 'Mapbox Satellite'} tiles",
  'Mapbox Satellite tiles',
  'source legend'),
 ("(SOURCE === 'google' ? 'Google · ' + gCopy : '© Mapbox © OpenStreetMap © Maxar')",
  "'© Mapbox © OpenStreetMap © Maxar'",
  'export attribution'),
 ("   - The key, Google's session, the manifest and the labels are asked for in the page's <head>, "
  'all at once.',
  "   - The map key, manifest and labels are asked for in the page's <head>, all at once.",
  'boot documentation'),
 ('  let z = clamp(Math.ceil(want - .3), 12, tileMaxZ());',
  '  /* v12.85: at rest match the device-pixel density where native detail is available. */\n'
  '  let z = clamp(Math.ceil(want - ((interacting || zAnim) ? .3 : 1e-12)), 12, tileMaxZ());',
  'sharp native sampling at rest'),
 ('function requestCoarse(v, R, z, budget = 36) {\n'
  '  const zc = Math.max(12, z - 2); if (zc === z) return; const mx = v.w * .5, my = v.h * .5, r = '
  'satRange(R, zc, v.x - mx, v.y - my, v.x + v.w + mx, v.y + v.h + my); if (!r) return;\n'
  '  if ((r.tx1 - r.tx0 + 1) * (r.ty1 - r.ty0 + 1) > Math.min(36,budget)) return;\n'
  '  for (let ty = r.ty0; ty <= r.ty1; ty++) for (let tx = r.tx0; tx <= r.tx1; tx++) { const '
  'coarseKey1018=tileKey(zc,tx,ty);satWanted.add(coarseKey1018);const t = '
  'tiles.get(coarseKey1018); if (t) { if (t.bm) t.at = performance.now(); continue; } '
  'requestTile(zc, tx, ty, 500 + Math.hypot(tx - (r.tx0 + r.tx1) / 2, ty - (r.ty0 + r.ty1) / 2)); '
  '}\n'
  '}\n',
  'function requestCoarse(v, R, z, budget = 36) {\n'
  '  const zc = Math.max(12, z - 2); if (zc === z) return;\n'
  '  const mx = v.w * .5, my = v.h * .5, r = satRange(R, zc, v.x - mx, v.y - my, v.x + v.w + mx, '
  'v.y + v.h + my); if (!r) return;\n'
  '  if ((r.tx1 - r.tx0 + 1) * (r.ty1 - r.ty0 + 1) > Math.min(36, budget)) return;\n'
  '  /* Author: Andrew Fisher. An empty cache gets at most four coarse tiles first,\n'
  '     leaving download slots for full detail. Existing imagery/pans keep sharp priority. */\n'
  '  const first1285 = new Set();\n'
  '  if (![...tiles.values()].some(t => t.bm)) {\n'
  '    const q = satRange(R, zc, v.x, v.y, v.x + v.w, v.y + v.h), cells = [];\n'
  '    if (q) {\n'
  '      const cx = (q.tx0 + q.tx1) / 2, cy = (q.ty0 + q.ty1) / 2;\n'
  '      for (let ty = q.ty0; ty <= q.ty1; ty++) for (let tx = q.tx0; tx <= q.tx1; tx++) '
  'cells.push({tx, ty, d: Math.hypot(tx - cx, ty - cy)});\n'
  '      cells.sort((a, b) => a.d - b.d).slice(0, 4).forEach(c => first1285.add(tileKey(zc, c.tx, '
  'c.ty)));\n'
  '    }\n'
  '  }\n'
  '  for (let ty = r.ty0; ty <= r.ty1; ty++) for (let tx = r.tx0; tx <= r.tx1; tx++) {\n'
  '    const key = tileKey(zc, tx, ty); satWanted.add(key); const t = tiles.get(key);\n'
  '    if (t) { if (t.bm) t.at = performance.now(); continue; }\n'
  '    requestTile(zc, tx, ty, (first1285.has(key) ? -200 : 500) + Math.hypot(tx - (r.tx0 + r.tx1) '
  '/ 2, ty - (r.ty0 + r.ty1) / 2));\n'
  '  }\n'
  '}\n',
  'coarse coverage before full detail on an empty cache'),
 ('    for(const [tx,ty] of '
  'cells)requestTile(z,tx,ty,-100+Math.hypot(tx-(r.tx0+r.tx1)/2,ty-(r.ty0+r.ty1)/2),true); }',
  '    requestCoarse(v,R,z,TILE_CAP-cells.length);\n'
  '    for(const [tx,ty] of '
  'cells)requestTile(z,tx,ty,-100+Math.hypot(tx-(r.tx0+r.tx1)/2,ty-(r.ty0+r.ty1)/2),true); }',
  'queue first usable coverage before the initial full-detail wave')]

INDEX_REPLACEMENTS = [('<link rel="icon" href="data:,">',
  '<link rel="icon" href="data:,">\n'
  '<!-- Author: Andrew Fisher. Start the approved imagery connection while local metadata loads. '
  '-->\n'
  '<link rel="preconnect" href="https://api.mapbox.com" crossorigin>',
  'preconnect approved imagery provider'),
 ('explorer.js?v=e175ec073b2d', 'explorer.js?v=641db3a7b324', 'new renderer cache identity'),
 ('explorer-merge.js?v=7c276bb18154',
  'explorer-merge.js?v=c62854961e0d',
  'new paired 3D navigation cache identity')]

def apply_file(path, data):
    if hashlib.sha256(data).hexdigest() != BASE_HASHES[path]:
        raise ValueError(f'{path}: wrong base or patch already applied')
    text = data.decode('utf-8')
    changes = EXPLORER_REPLACEMENTS if path.endswith('/explorer.js') else INDEX_REPLACEMENTS
    for old, new, label in changes:
        text = rep(text, old, new, label, path)
    return text.encode('utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    for path in BASE_HASHES:
        candidate = Path(args.out) / path
        candidate.parent.mkdir(parents=True, exist_ok=True)
        candidate.write_bytes(apply_file(path, (Path(args.base) / path).read_bytes()))
        print(path, hashlib.sha256(candidate.read_bytes()).hexdigest())


if __name__ == '__main__':
    main()
