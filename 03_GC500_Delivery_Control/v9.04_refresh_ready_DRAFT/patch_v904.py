#!/usr/bin/env python3
"""Author: Andrew Fisher. Prevent a stale first draw while the shared record loads."""
import os, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def patch(text, path):
    if 'const Refresh904 =' in text:
        raise SystemExit('v9.04 has already been applied')
    for marker in ('function syncFirst()', 'function syncRedraw()', 'const SYNC_COLLS ='):
        if marker not in text:
            raise SystemExit('Wrong base: ' + marker)
    if not re.search(r"\+ ' · v(?:8\.99|9\.0[0-3])'; /\* v8\.19", text):
        raise SystemExit('v9.04 requires the v8.99–v9.03 page')
    css = (HERE / 'refresh904.css').read_text()
    early = """<script>/* Author: Andrew Fisher. The data gate exists before any record is drawn. */
if (/^\\/(?:v|e)\\/[A-Za-z0-9_-]+/.test(location.pathname)) document.documentElement.setAttribute('data-refresh904', 'loading');
</script>"""
    text = rep(text, '<meta name="gc500-weather-v818" content="selected-day weather v8.18">', early + '\n<style>\n' + css + '\n</style>\n<meta name="gc500-weather-v818" content="selected-day weather v8.18">', 'early readiness gate', path)
    text = rep(text, '<main>\n  <section class="pane" id="pane-today"></section>', '''<main>
  <section id="refresh904" role="status" aria-live="polite" aria-atomic="true"><div><strong data-refresh904-heading>Loading the current shared record</strong><p data-refresh904-detail>Checking the latest deliveries, assets and progress…</p></div><button type="button" class="btn" data-refresh904-retry>Retry connection</button></section>
  <section class="pane" id="pane-today"></section>''', 'readiness panel', path)
    startup = """renderTabs();
/* A deep link uses the later inline map/progress extensions too. Start it once they all exist. */
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { route(); Refresh904.update(); }, {once: true});
else { route(); Refresh904.update(); }"""
    text = rep(text, 'renderTabs(); route();', (HERE / 'refresh904_src.js').read_text() + '\n' + startup, 'readiness controller before initial route', path)
    text = rep(text, 'drawerSync798Refresh(); /* v7.98 — text only; keep the open fields and focus */', 'drawerSync798Refresh(); /* v7.98 — text only; keep the open fields and focus */\n if (window.GC500Refresh904) window.GC500Refresh904.update();', 'readiness after sync status', path)
    text = rep(text, "names.forEach(name => { SYNC.first.add(name); delete SYNC.pending[name]; });\n if (changed) { persist(); syncRedraw(); }\n if (!SYNC.readonly) syncSend();", "names.forEach(name => { SYNC.first.add(name); delete SYNC.pending[name]; });\n if (changed) { persist(); syncRedraw(); }\n if (!SYNC.readonly) syncSend();\n if (window.GC500Refresh904) window.GC500Refresh904.update();", 'readiness for unchanged first snapshot', path)
    old = "try { render(); if (state.sel && document.querySelector('#drawer').classList.contains('on')) openAsset(state.sel, {keep: true}); } catch (e) {}"
    new = "try { render(); if (state.sel && document.querySelector('#drawer').classList.contains('on')) openAsset(state.sel, {keep: true}); if (window.GC500Refresh904) window.GC500Refresh904.drawn(); } catch (e) {}"
    text = rep(text, old, new, 'reveal only after current render', path)
    text = re.sub(r"\+ ' · v(?:8\.99|9\.0[0-3])'; /\* v8\.19", "+ ' · v9.04'; /* v8.19", text, count=1)
    return text

if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('Usage: patch_v904.py candidate.html')
    path = Path(sys.argv[1])
    path.write_text(patch(path.read_text(), str(path)))
