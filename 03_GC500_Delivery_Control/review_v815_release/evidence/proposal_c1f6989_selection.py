#!/usr/bin/env python3
"""Author: Andrew Fisher. Isolated Documents selection correction; not published.

Apply only to a private c1f6989 docs815_src.js or exact built page.
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep

p = sys.argv[1]
t = Path(p).read_text()
if 'function clearDocSelection815(' in t:
    sys.exit('Selection correction already applied')
if 'function activeTileFocus815(' not in t:
    sys.exit('Requires the corrected c1f6989 Documents source')

t = rep(t, ' const focusedTile815 = activeTileFocus815();\n const ae = document.activeElement,',
        ' const focusedDoc815 = docFocusBefore815();\n const focusedTile815 = activeTileFocus815();\n const ae = document.activeElement,',
        'capture document focus before full redraw', p)
t = rep(t, ' selRow815();\n}', ' selRow815(focusedDoc815);\n}', 'restore document selection after full redraw', p)
t = rep(t, '''function selRow815(){
 const id = state.docSel815; if (!id) return;
 state.docSel815 = null;
 const row = [...document.querySelectorAll('#pane-docs #docBody815 [data-doc815]')].find(e => e.dataset.doc815 === id);
 if (!row) return;
 row.setAttribute('aria-current', 'true'); row.tabIndex = -1;
 setTimeout(() => { if (!document.contains(row) || state.tab !== 'docs') return; row.scrollIntoView({block: 'center', behavior: 'auto'}); try { row.focus({preventScroll: true}); } catch (e) {} }, 0);
}''', '''function clearDocSelection815(){
 state.docSel815 = null; state.docCurrent815 = null; selRow815.pending = null;
}
/* The selected identity survives redraws. A focus request lasts only until it succeeds or the person
   moves to another control; it resolves the current row instead of keeping a detached DOM node. */
function docFocusBefore815(){
 const a = document.activeElement, p = selRow815.pending;
 if (p && a !== p.from && a !== p.pane) selRow815.pending = null;
 return {row: a && a.dataset && a.dataset.doc815, pending: selRow815.pending};
}
function selRow815(before){
 const request = state.docSel815;
 if (request) {
  state.docSel815 = null; state.docCurrent815 = request;
  selRow815.pending = {id: request, from: document.activeElement, pane: $('#pane-docs'), scroll: true};
 } else if (before && before.pending && selRow815.pending === before.pending) {
  selRow815.pending.from = document.activeElement; /* a preserved search control may itself have been rebuilt */
 }
 const id = state.docCurrent815; if (!id) return;
 const rowOf = () => [...document.querySelectorAll('#pane-docs #docBody815 [data-doc815]')].find(e => e.dataset.doc815 === id);
 const row = rowOf();
 if (row) { row.setAttribute('aria-current', 'true'); row.tabIndex = -1; }
 if (!request && before && before.row === id) selRow815.pending = {id, from: document.activeElement, pane: null, scroll: false};
 const intent = selRow815.pending;
 if (!row || !intent || intent.id !== id) return;
 setTimeout(() => {
  if (selRow815.pending !== intent || state.docCurrent815 !== id || state.tab !== 'docs') return;
  const a = document.activeElement;
  if (a !== intent.from && a !== intent.pane) { selRow815.pending = null; return; }
  const current = rowOf(); if (!current || !document.contains(current)) return;
  if (intent.scroll) current.scrollIntoView({block: 'center', behavior: 'auto'});
  try { current.focus({preventScroll: true}); } catch (e) {}
  if (document.activeElement === current) selRow815.pending = null;
 }, 0);
}''', 'preserve selection with guarded one-shot focus', p)
t = rep(t, 'function paintDocs815_held(){\n const focusedTile815',
        'function paintDocs815_held(){\n const focusedDoc815 = docFocusBefore815();\n const focusedTile815',
        'capture document focus before partial redraw', p)
t = rep(t, ' restoreTileFocus815(focusedTile815);\n}',
        ' restoreTileFocus815(focusedTile815);\n selRow815(focusedDoc815);\n}',
        'restore document selection after partial redraw', p)
t = rep(t, 'function pickTile815(k){\n const was',
        'function pickTile815(k){\n clearDocSelection815();\n const was', 'category changes clear selected document', p)
t = rep(t, 'function showRef815(ref){\n state.docQ815',
        'function showRef815(ref){\n clearDocSelection815();\n state.docQ815', 'photo reference changes clear selection', p)
t = rep(t, "b.onclick = () => { state.docQ815 = ''; const q = $('#docQ815');",
        "b.onclick = () => { clearDocSelection815(); state.docQ815 = ''; const q = $('#docQ815');",
        'clear-search control clears selection', p)
t = rep(t, 'q.oninput = () => { state.docQ815 = q.value;',
        'q.oninput = () => { clearDocSelection815(); state.docQ815 = q.value;',
        'typed query clears selection', p)
t = rep(t, "if (k && by[k] && by[k].length) { state.docTile815 = k;",
        "if (k && by[k] && by[k].length) { clearDocSelection815(); state.docTile815 = k;",
        'deep-linked category clears selection', p)
Path(p).write_text(t)
print('Applied isolated selection proposal; not published.')
