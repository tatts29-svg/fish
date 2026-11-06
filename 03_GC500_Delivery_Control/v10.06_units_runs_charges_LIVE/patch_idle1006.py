# Author: Andrew Fisher. Preserve the unit drawer through remote refresh only.
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(html):
    if 'root.Idle1006=' in html:
        raise ValueError('Idle1006 is already installed')
    if 'function generatorStanddownHtml1005' not in html:
        raise ValueError('Expected the v10.05 source')
    original = "try { render(); if (state.sel && document.querySelector('#drawer').classList.contains('on')) openAsset(state.sel, {keep: true}); if (window.GC500Refresh904) window.GC500Refresh904.drawn(); } catch (e) {}"
    html = rep(html, original, 'try { window.Idle1006.redraw(); } catch (e) {}', 'retain unit forms during shared-record redraw', 'GC500')
    html = rep(html, "if (state.sel && drawer && drawer.classList.contains('on')) openAsset(state.sel, {keep: true});", "if (state.sel && drawer && drawer.classList.contains('on')) window.Idle1006.refreshDrawer();", 'keep unit draft through reports polling', 'GC500')
    html = rep(html, "try { const dr = $('#drawer'); if (dr && dr.classList.contains('on') && state.sel && !document.body.classList.contains('dropping')) openAsset(state.sel, {keep: true}); } catch (e) {}", "try { const dr = $('#drawer'); if (dr && dr.classList.contains('on') && state.sel && !document.body.classList.contains('dropping')) window.Idle1006.refreshDrawer(); } catch (e) {}", 'keep unit draft through photo outbox refresh', 'GC500')
    html = rep(html, "const dr = $('#drawer'); if (dr && dr.classList.contains('on') && state.sel) openAsset(state.sel, {keep: true});", "const dr = $('#drawer'); if (dr && dr.classList.contains('on') && state.sel) window.Idle1006.refreshDrawer();", 'keep unit draft through photo registry refresh', 'GC500')
    return rep(html, 'function syncRedraw(){', (HERE / 'idle1006.js').read_text() + '\nfunction syncRedraw(){', 'add unit redraw state preservation before native sync callback', 'GC500')
