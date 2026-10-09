#!/usr/bin/env python3
"""Author: Andrew Fisher. Isolated review proposal, not a live release.

Apply to a private e540cbc Documents source or built HTML. Restores public
search, category keyboard focus and fresh collection reads inside holdAssets.
The implementation owner retains the moving release.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep

p = sys.argv[1]
t = Path(p).read_text()
if 'function restoreTileFocus815(' in t:
    sys.exit('Documents review correction already applied')
if 'function paintDocs815_held(){' not in t:
    sys.exit('Requires the e540cbc held Documents repaint')

t = rep(t, '<input id="docQ815" type="search"',
        '<input id="docQ815" data-ro type="search"', 'read-only search permission', p)
t = rep(t, 'function docsTitle815(){', '''function activeTileFocus815(){
 const a = document.activeElement, tile = a && a.closest && a.closest('#docTiles815 [data-tile815]');
 return tile ? tile.dataset.tile815 : null;
}
function restoreTileFocus815(key){
 if (!key) return;
 const tile = document.querySelector('#docTiles815 [data-tile815="' + CSS.escape(key) + '"]');
 if (tile) { try { tile.focus({preventScroll: true}); } catch (e) {} }
}
function docsTitle815(){''', 'category focus helpers', p)
t = rep(t, " const ae = document.activeElement, hadQ = ae && ae.id === 'docQ815', caret = hadQ ? [ae.selectionStart, ae.selectionEnd] : null;",
        " const focusedTile815 = activeTileFocus815();\n const ae = document.activeElement, hadQ = ae && ae.id === 'docQ815', caret = hadQ ? [ae.selectionStart, ae.selectionEnd] : null;",
        'capture category before full redraw', p)
t = rep(t, ' wireDocs815(pane, all);\n if (hadQ)',
        ' wireDocs815(pane, all);\n restoreTileFocus815(focusedTile815);\n if (hadQ)',
        'restore category after full redraw', p)
t = rep(t, 'function paintDocs815_held(){\n const COLL = coll815(),',
        'function paintDocs815_held(){\n const focusedTile815 = activeTileFocus815();\n const COLL = docCollection(),',
        'read fresh collection within existing hold', p)
t = rep(t, " wireDocs815($('#pane-docs'), all, true);\n}",
        " wireDocs815($('#pane-docs'), all, true);\n restoreTileFocus815(focusedTile815);\n}",
        'restore category after partial redraw', p)
# The cached collection is no longer used; do not retain misleading invalidation code.
t = rep(t, ' coll815.last = {files: DOCS.files, n: Object.keys(DOCS.files || {}).length, at: DOCS.at, state: DOCS.state, COLL};\n',
        '', 'remove obsolete cache seed', p)
t = rep(t, '''/* the collection the last full drawing built. A record change, a refresh of the file list or a change of tab draws the
 whole tab again (renderDocs815), so a card press or a keystroke in between can use it as it is */
function coll815(){ const L = coll815.last; return L && L.files === DOCS.files && L.n === Object.keys(DOCS.files || {}).length && L.at === DOCS.at && L.state === DOCS.state ? L.COLL : docCollection(); }
''', '''/* Read the current collection inside holdAssets. Remote records may change while a focused search defers
 the full redraw; the next partial repaint must still classify files using those current records. */
''', 'remove stale collection cache', p)
Path(p).write_text(t)
print('Applied isolated Documents review proposal; not published.')
