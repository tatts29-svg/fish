#!/usr/bin/env python3
"""Author: Andrew Fisher. Bounded 3D recovery, camera motion and frame readiness."""
from pathlib import Path
import hashlib
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep
POC_SHA = '0a060bed5acfdd970cc04c209b2163cba3199728575c84ac8196a10014b861f7'


def apply_poc(text, path='poc3d/index.html'):
    if hashlib.sha256(text.encode()).hexdigest() != POC_SHA:
        raise SystemExit('3D v8.13 requires the exact reviewed live 3D page: ' + path)

    def once(old, new, why):
        nonlocal text
        text = rep(text, old, new, why, path)

    once('<div id="loadText">Asking the service for the Google key…</div></div>',
         '<div id="loadText">Starting the 3D map…</div><button id="retry3d813" type="button" hidden>Retry 3D</button></div>', 'manual 3D recovery control')
    once('street:    {lon: 153.42500, lat: -27.98880, height: 45, heading: 35, pitch: -18},',
         'street:    {lon: 153.42500, lat: -27.98880, height: SITE_H + 45, heading: 35, pitch: -18},', 'street height relative to measured local ground')
    once('ground:    {lon: 153.42480, lat: -27.98890, height: 12, heading: 60, pitch: -6}};',
         'ground:    {lon: 153.42480, lat: -27.98890, height: SITE_H + 12, heading: 60, pitch: -6}};', 'ground height relative to measured local ground')
    once('async function key() {', (ROOT / 'satellite3d813_src.js').read_text().rstrip() + '\nasync function key() {', '3D recovery and camera helpers')
    start = text.index('async function key() {')
    end = text.index('\n/* Auto:', start)
    once(text[start:end], '''async function key() {
  const m = /^\\/w\\/([A-Za-z0-9_-]{16,128})\\//.exec(location.pathname);
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20000);
  try {
    const r = await fetch('/api/map-key' + (m ? '?t=' + encodeURIComponent(m[1]) : ''), {cache: 'no-store', signal: controller.signal});
    if (!r.ok) throw new Error('Map access unavailable');
    const j = await r.json();
    if (!(j && j.google && /^AIza/.test(j.google.key))) throw new Error('Map access unavailable');
    return j.google.key;
  } finally { clearTimeout(timer); }
}''', 'bounded map access request')
    once('const v = VIEWS[name]; if (!v) return; stopOrbit();', 'const v = VIEWS[name]; if (!v) return; stopMotion813();', 'preset cancels prior camera motion')
    once('setStatus(`<b>${name}</b> · camera ${v.height} m above the ground`, 2500);',
         'setStatus(`<b>${name}</b> · camera about ${Math.round(v.height - SITE_H)} m above local ground`, 2500);', 'accurate camera height label')
    once('stopOrbit(); stopFace(); const cam = viewer.camera, target = lookTarget(); if (!target) return;',
         'stopMotion813(); const cam = viewer.camera, target = lookTarget(); if (!target) return;', 'compass cancels active camera flight')
    once('stopOrbit(); const target = lookTarget(); if (!target) return; const cam = viewer.camera;',
         'stopMotion813(); const target = lookTarget(); if (!target) return; const cam = viewer.camera;', 'orbit cancels active camera flight')
    once("stopOrbit(); if (EMBED3D) { if (!visible(p))", "stopMotion813(); if (EMBED3D) { if (!visible(p))", 'search cancels prior camera motion')
    once('const DDC = {base: new Cesium.DistanceDisplayCondition', "const DDC = typeof Cesium === 'undefined' ? null : {base: new Cesium.DistanceDisplayCondition", 'library failure reaches recovery UI')
    once("const k = await key(); $('loadText').textContent = 'Starting the 3D scene…';", """if (!window.Cesium) { bootProblem813('library'); return; }
    window.__bootError = null;
    bootTimer813 = setTimeout(() => { if (!window.__ready) bootProblem813('slow'); }, 30000);
    bootPhase813 = 'access';
    const k = await key(); $('loadText').textContent = 'Starting the 3D scene…';
    bootPhase813 = 'graphics';""", 'distinguish startup failure stages')
    once('requestRenderMode: true, maximumRenderTimeChange: Infinity, msaaSamples: 1,',
         'showRenderLoopErrors: false, requestRenderMode: true, maximumRenderTimeChange: Infinity, msaaSamples: 1,',
         'single reachable recovery UI instead of a second blocking error overlay')
    once('const sc = viewer.scene;\n    sc.globe.show = false;', """const sc = viewer.scene;
    viewer.canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); graphicsLost813 = true; bootProblem813('context'); });
    sc.renderError.addEventListener(() => bootProblem813(graphicsLost813 ? 'context' : 'render'));
    bootPhase813 = 'imagery';
    sc.globe.show = false;""", 'manual graphics-loss recovery')
    once('sc.primitives.add(tileset); applyQuality();',
         "if (terminalProblem813) { tileset.destroy(); bootProblem813(terminalProblem813); return; }\n    sc.primitives.add(tileset); applyQuality();", 'late imagery cannot restart failed graphics')
    once("$('loader').classList.add('done'); fly('overhead', 0); window.__ready = true;", """clearTimeout(bootTimer813); window.__bootError = null; $('retry3d813').hidden = true;
    $('loader').classList.add('done'); fly('overhead', 0); window.__ready = true;
    try { if (EMBED3D && window.parent.gc500Explorer3DReady813) window.parent.gc500Explorer3DReady813(window); } catch (e) {}""", 'successful and late startup publishes readiness')
    once("() => { stopOrbit(); stopFace(); }, {passive: true}", "() => { stopMotion813(); }, {passive: true}", 'direct input takes camera control')
    once("} catch (e) { console.error(e); $('loadText').textContent = String(e.message || e); window.__bootError = String(e); }", "} catch (e) { bootProblem813(terminalProblem813 || (graphicsLost813 ? 'context' : bootPhase813)); }", 'safe contextual startup failure')
    once('window.GC500_3D = {fly, faceTo, startOrbit, stopOrbit,', 'window.GC500_3D = {fly, faceTo, startOrbit, stopOrbit, stopMotion813,', 'parent can stop all camera motion')
    once('return {ready: !!viewer, quality, perf, loaded:', 'return {ready: window.__ready === true && !window.__bootError, quality, perf, loaded:', 'readiness means completed startup')
    return text


def apply_merge(text, path='explorer-merge.js'):
    if 'gc500Explorer3DReady813' in text:
        raise SystemExit('3D v8.13 merge already applied')
    for marker in ['function ensureFrame()', 'function pins3d()', 'function exit3d()']:
        if text.count(marker) != 1:
            raise SystemExit('3D v8.13 merge requires original frame components')
    def once(old, new, why):
        nonlocal text
        text = rep(text, old, new, why, path)
    once('  /* ---------------- the 3D mode */', '''  /* ---------------- the 3D mode */
  let wait3dTimer813 = 0, load3dEpoch813 = 0;
  window.gc500Explorer3DFailed813 = source => {
    if (!frame || source !== frame.contentWindow) return false;
    clearTimeout(wait3dTimer813); load3dEpoch813++; ready3d = false;
    return true;
  };
  window.gc500Explorer3DReady813 = source => {
    if (!frame || source !== frame.contentWindow || !source.__ready || source.__bootError || !source.GC500_3D) return false;
    clearTimeout(wait3dTimer813); load3dEpoch813++; ready3d = true;
    source.GC500_3D.setPins(pins3d());
    if (in3d) sync3d(true); else if (source.GC500_3D.stopMotion813) source.GC500_3D.stopMotion813();
    return true;
  };''', 'one readiness owner per 3D frame load')
    once('const a = api3d(); if (!a || !ready3d) return;',
         'const a = api3d(); if (!a || !ready3d || !a.state || !a.state.ready) return;', 'failed graphics cannot receive camera and pin synchronisation')
    old = '''    frame.addEventListener('load', () => {
      const t0 = Date.now();
      (function wait() {
        let ok = false; try { ok = !!frame.contentWindow.__ready && !!frame.contentWindow.GC500_3D; } catch (e) {}
        if (ok) { ready3d = true; frame.contentWindow.GC500_3D.setPins(pins3d()); sync3d(true); return; }
        if (Date.now() - t0 < 90000) setTimeout(wait, 150);
      })();
    });'''
    new = '''    frame.addEventListener('load', () => {
      clearTimeout(wait3dTimer813); ready3d = false;
      const epoch = ++load3dEpoch813, t0 = Date.now();
      (function wait() {
        if (epoch !== load3dEpoch813) return;
        let source = null; try { source = frame.contentWindow; } catch (e) {}
        if (source && source.__ready && window.gc500Explorer3DReady813(source)) return;
        if (source && source.__bootError) return;
        if (Date.now() - t0 < 90000) wait3dTimer813 = setTimeout(wait, 150);
      })();
    });'''
    once(old, new, 'retry reload cannot retain stale readiness polls')
    once('try { const a = api3d(); if (a) a.stopOrbit(); } catch (e) {}',
         'try { const a = api3d(); if (a) { if (a.stopMotion813) a.stopMotion813(); else a.stopOrbit(); } } catch (e) {}', 'leaving 3D stops active camera motion')
    return text


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4) or sys.argv[1] not in ('poc', 'merge'):
        raise SystemExit('Usage: patch_satellite3d813.py poc|merge input [output]')
    source = Path(sys.argv[2]); target = Path(sys.argv[3]) if len(sys.argv) == 4 else source
    target.write_text((apply_poc if sys.argv[1] == 'poc' else apply_merge)(source.read_text(), str(source)))
    print('v8.13 bounded 3D camera and recovery patch applied')
