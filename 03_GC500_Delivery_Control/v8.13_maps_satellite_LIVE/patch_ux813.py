#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded Explorer selection and panel interactions; no placement changes."""
from pathlib import Path
import sys
ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep


def apply_explorer(text, path='explorer/explorer.js'):
    if 'function clearSelection813(' in text:
        raise SystemExit('v8.13 Explorer UX already applied')
    if 'function selectCode(code, place = 0, byUser = false)' not in text or 'const CATS = [' not in text:
        raise SystemExit('v8.13 Explorer UX requires the reviewed Explorer selection source')
    def once(old, new, label):
        nonlocal text
        text = rep(text, old, new, 'v8.13 ' + label, path)
    once("$('navBtn').onclick = () => document.body.classList.toggle('nav');\n$('legendBtn').onclick = () => { const L = $('legend'); if (L.classList.contains('show')) { L.classList.remove('show'); return; } L.innerHTML = legendHtml(); L.classList.add('show'); };",
         (ROOT / 'ux813_src.js').read_text().rstrip(), 'panel and legend controls')
    once('highlight = null; const rot = 0;', 'clearSelection813(); highlight = null; const rot = 0;', 'Fit clears the old pick')
    once('function setAttrib() {', 'function setAttrib() { sourceProvider813();', 'visible imagery source follows provider switches')
    once("document.querySelector('#findCard h3')", "document.querySelector('#findCard h3, #findCard > summary')", 'native Find disclosure')
    once("selected = null; stopPulse(); const L = $('findList');", "if (!id || (selected && selected.cat.id !== id)) clearSelection813(); const L = $('findList');", 'category selection visibility')
    once("L.classList.add('show'); L.onclick = e =>", "L.classList.add('show'); L.querySelectorAll('[data-code]').forEach(b => b.classList.toggle('sel', !!selected && b.dataset.code === selected.code)); L.onclick = e =>", 'retained category pick')
    once("/* byUser: a person picked it here (a list, a search result, a ring); the dashboard that embeds this page is told */", "/* byUser: a placed reference was chosen here; close phone Find, leaving its map card for explicit Open. */", 'selection contract')
    once("if (byUser) try { if (window.parent !== window && typeof window.parent.gc500ExplorerPicked === 'function') window.parent.gc500ExplorerPicked(it.code); } catch (e) {}", "if (byUser && it.places.length) pickedLocation813();", 'map-only user selection')
    once("function chooseResult(i) { const b = $('results').querySelector('[data-code]'); if (b && i === 0) { selectCode(b.dataset.code, 0, true); document.body.classList.remove('nav'); return; }", "function chooseResult(i, labelOnly = false) { const b = $('results').querySelector('[data-code]'); if (b && i === 0 && !labelOnly) { selectCode(b.dataset.code, 0, true); return; }", 'specific drawing result')
    once("const r = lastSearch[i]?.r; if (!r) return; const bb = r.slice(1)", "const r = lastSearch[i]?.r; if (!r) return; clearSelection813(); const bb = r.slice(1)", 'label clears stale reference')
    once("r[0]); document.body.classList.remove('nav'); stage.focus({preventScroll: true}); }", "r[0]); pickedLocation813(); stage.focus({preventScroll: true}); }", 'placed drawing label closes Find')
    once("$('q').value = ''; search(); stage.focus();", "$('q').value = ''; search(); panel813(false); stage.focus();", 'search Escape restores map focus')
    once("selectCode(c.dataset.code, 0, true); document.body.classList.remove('nav'); return; } const b = e.target.closest('[data-result]'); if (b) chooseResult(+b.dataset.result);", "selectCode(c.dataset.code, 0, true); return; } const b = e.target.closest('[data-result]'); if (b) chooseResult(+b.dataset.result, true);", 'result location semantics')
    once("const r = regions[+b.dataset.region]; highlight = null;", "const r = regions[+b.dataset.region]; clearSelection813(); highlight = null;", 'area clears stale reference')
    once("b.classList.add('active'); document.body.classList.remove('nav'); };", "b.classList.add('active'); pickedLocation813(); };", 'area closes Find')
    once("document.body.classList.add('nav'); $('q').focus();", "panel813(true); $('q').focus();", 'keyboard Find state')
    once("setBox(false); highlight = null; marks = []; selected = null; stopPulse();", "setBox(false); clearSelection813(); marks = [];", 'Escape clears all pick state')
    once("$('legend').classList.remove('show'); document.body.classList.remove('nav'); requestPaint();", "closeLegend813(false); panel813(false); requestPaint();", 'Escape panel state')
    once("function legendHtml() {", "function legendHtml() {\n  const close = '<button type=\"button\" class=\"jump\" data-closelegend813>Close sources</button>';\n  if (!P) return close + '<h4>Drawing legend and sources</h4><p>The drawing information is loading. Close this panel and try again when the plan is ready.</p>';", 'early sources state')
    once('return `<h4>What the satellite modes keep and lift</h4>', 'return close + `<h4>What the satellite modes keep and lift</h4>', 'reachable sources Close')
    once('Mapbox Satellite tiles, fetched for the visible view only.', "${SOURCE === 'google' ? 'Google Satellite' : 'Mapbox Satellite'} tiles, fetched for the visible view only.", 'current imagery provider')
    once('<button class="jump" onclick="document.getElementById(\'legend\').classList.remove(\'show\')">Close</button>', '<button type="button" class="jump" data-closelegend813>Close</button>', 'bottom sources Close')
    once("A person's own pick here calls window.parent.gc500ExplorerPicked(code) when the dashboard defines it.", "A person's pick stays on this map; the reference card's explicit Open action opens its dashboard record.", 'embedding contract comment')
    return text


def apply_merge(text, path='explorer/explorer-merge.js'):
    if 'G.clearPick813 =' in text:
        raise SystemExit('v8.13 Explorer merge UX already applied')
    if 'function card(code)' not in text or 'function pins3d()' not in text:
        raise SystemExit('v8.13 Explorer merge UX requires the reviewed card and pin source')
    text = rep(text, 'try { selectCode(code); } finally { noFly = false; }', 'try { selectCode(code, 0, true); } finally { noFly = false; }', 'v8.13 actual 3D pick closes Find', path)
    text = rep(text, 'G.is3d = () => in3d;', 'G.is3d = () => in3d;\n    G.clearPick813 = () => { lastCode = null; hideCard(); const a = api3d(); if (a && ready3d) a.ring(null); };', 'v8.13 shared pick clearing', path)
    text = rep(text, '>Open ${escH(code)}</button>', '>Open record ${escH(code)}</button>', 'v8.13 explicit record action', path)
    return text


def apply(text, path):
    """Release wrapper entry: source path determines the reviewed component."""
    name = Path(path).name
    if name == 'explorer.js':
        return apply_explorer(text, path)
    if name == 'explorer-merge.js':
        return apply_merge(text, path)
    raise SystemExit('v8.13 UX has no changes for ' + str(path))


if __name__ == '__main__':
    if len(sys.argv) != 4 or sys.argv[1] not in ('explorer', 'merge'):
        raise SystemExit('Usage: patch_ux813.py explorer|merge input.js output.js')
    source, destination = map(Path, sys.argv[2:])
    destination.write_text(globals()['apply_' + sys.argv[1]](source.read_text(), str(source)))
