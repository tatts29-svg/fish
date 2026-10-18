#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact-live Explorer request, demand-load and camera lifecycle patch."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = 'ad9ab5e488d690444c59730f8ad286b2df60ab0353cd1d21dabc40e398a3b5a4'


def apply(text, path='explorer/explorer.js'):
    if 'function stopCameraMotion813(' in text:
        raise SystemExit('Explorer performance v8.13 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise SystemExit('Explorer performance v8.13 requires verified live v7.90 Explorer bytes: ' + path)
    pieces = (ROOT / 'performance813_src.js').read_text(encoding='utf-8')

    def piece(name):
        return pieces.split('/* BEGIN ' + name + ' */\n')[1].split('/* END ' + name + ' */')[0].rstrip()

    def once(old, new, reason):
        nonlocal text
        if text.count(old) != 1:
            raise SystemExit('Explorer performance v8.13 exact anchor changed: ' + reason)
        text = rep(text, old, new, reason, path)

    def block(start, end, replacement, reason):
        a = text.index(start)
        b = text.index(end, a)
        once(text[a:b].rstrip(), replacement, reason)

    block('async function ensureGoogle(', 'let gKept =', piece('google'), 'Coalesce and bound Google session attempts')
    block('function pump() {', '/* the cache keeps', piece('pump'), 'Own tile completion through decode and release cancelled slots')
    block('function evict() {', 'function cancelTiles()', piece('evict'), 'Bound failed tile and retry caches')
    block('function retrySatellite() {', '/* the picture the tiles', piece('retry'), 'Retry releases pending requests and re-arms sessions')
    once('let panTrail = [];', piece('motion') + '\nlet panTrail = [];', 'Share deliberate camera motion cancellation')
    once('function rotateTo(deg, animate = true) { cancelAnimationFrame(rotAnim);',
         'function rotateTo(deg, animate = true) { stopCameraMotion813();', 'A rotation replaces earlier motion')
    once('  stopFling();\n  if (calm())', '  stopFling(); cancelAnimationFrame(rotAnim); rotAnim = 0;\n  if (calm())', 'Zoom owns its camera anchor')
    once('function fit(asSheet = false) { highlight = null;',
         'function fit(asSheet = false) { stopCameraMotion813(); highlight = null;', 'Fit stops earlier motion')
    once('function gotoRect(rect, label) { document.querySelectorAll',
         'function gotoRect(rect, label) { stopCameraMotion813(); document.querySelectorAll', 'Reference jump stops earlier motion')
    once('if (Number.isFinite(n) && n > 0) { camera.z = clamp(n / 100,',
         'if (Number.isFinite(n) && n > 0) { stopCameraMotion813(); camera.z = clamp(n / 100,', 'Typed zoom stops earlier motion')
    once('zoom: z => { camera.z = clamp(z, MIN_Z, MAX_Z);',
         'zoom: z => { stopCameraMotion813(); camera.z = clamp(z, MIN_Z, MAX_Z);', 'Public zoom API stops earlier motion')
    once('stage.focus({preventScroll: true}); stopFling(); stopZoomAnim(); panTrail = [];',
         'stage.focus({preventScroll: true}); stopCameraMotion813(); panTrail = [];', 'A pointer gesture owns all camera axes')
    once('function moveMini(e) { const r =', 'function moveMini(e) { stopCameraMotion813(); const r =', 'Minimap stops earlier motion')
    once('g.on = true; cancelAnimationFrame(rotAnim);',
         'g.on = true; stopCameraMotion813();', 'Compass drag stops earlier motion')
    once('  else { const amount = (e.shiftKey ? 240 : 90)',
         '  else { stopCameraMotion813(); const amount = (e.shiftKey ? 240 : 90)', 'Keyboard pan stops earlier motion')
    once('function endPointer(e) { if (!pointers.has(e.pointerId)) return; const p = stagePoint(e);',
         'function endPointer(e) { if (!pointers.has(e.pointerId)) return;\n' + piece('cancel') + '\n  const p = stagePoint(e);',
         'Cancelled pointers do not commit picks or box zooms')
    block('/* after the first sharp view: Original plan', 'function maybeReady()', piece('sharp'), 'Demand-load heavy source scene and plan aerial')
    once('/* v6.97 - the 13.3 MB scene, in the worker, only when it is needed: zoom past the pyramid, the PNG export, or (on a\n   desktop) quietly once the first view is sharp.',
         '/* v8.13 - the source scene, in the worker, only when needed: zoom past the pyramid, the PNG export, or missing boot/labels.',
         'Document the preserved detail and fallback entry points')
    return text


if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        raise SystemExit('Usage: patch_performance813.py input.js [output.js]')
    source = Path(sys.argv[1])
    target = Path(sys.argv[2]) if len(sys.argv) == 3 else source
    target.write_text(apply(source.read_text(encoding='utf-8'), str(source)), encoding='utf-8')
    print('Explorer v8.13 performance/lifecycle patch applied')
