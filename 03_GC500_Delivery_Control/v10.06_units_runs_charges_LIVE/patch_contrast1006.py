"""Author: Andrew Fisher. Readable existing fields and one accurate drawer save badge."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(html):
    if 'id="contrast1006css"' in html:
        raise ValueError('Contrast1006 is already installed')
    if 'function generatorStanddownHtml1005' not in html:
        raise ValueError('Expected the v10.05 source')
    old = """function drawerSync798Word(){
 return SYNC.status === 'live' ? (SYNC.readonly ? 'Live · view only' : 'Live')
 : SYNC.status === 'file' ? 'No service behind this copy'
 : SYNC.status === 'connecting' ? 'Connecting'
 : SYNC.status === 'unreachable' ? (SYNC.readonly ? 'Offline · view only' : 'Offline · will send')
 : 'Snapshot';
}"""
    html = rep(html, old, (HERE / 'save1006.js').read_text().strip(), 'truthful existing save badge', 'v10.06')
    html = rep(html, "tag('sync', 'This link', sync, 'what this copy of the page is doing right now — not a fact about the delivery')", "tag('sync', 'Save status', sync, 'status of recorded changes; use Save for any form still being edited')", 'label existing badge as save status', 'v10.06')
    html = rep(html, "top.appendChild(nm); dh.appendChild(top);", "if (ed) nm.insertAdjacentHTML('beforeend', '<span class=\"ptag sync save1006\" role=\"status\" aria-live=\"polite\" title=\"Status of recorded changes. Use Save for any form still being edited.\"><b>' + esc(drawerSync798Word()) + '</b></span>');\n\ttop.appendChild(nm); dh.appendChild(top);", 'retain compact native save acknowledgement in simplified drawer', 'v10.06')
    return rep(html, '\n</head>', '\n<style id="contrast1006css">\n' + (HERE / 'contrast1006.css').read_text() + '\n</style>\n</head>', 'pair existing edit-field colours', 'v10.06')
