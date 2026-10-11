# Author: Andrew Fisher
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def patch(html):
    if 'flow994-script' in html:
        raise ValueError('Flow v9.94 already applied')
    changes = [
        (
            'function renderSubhired932(){ return holdAssets(renderSubhired936Held); }',
            'function renderSubhired932(){ window.Flow994?.captureSubhired(); const result=holdAssets(renderSubhired936Held); window.Flow994?.restoreSubhired(); return result; }',
            'Retain company disclosure state through native redraws',
        ),
        (
            "groups.map(date=>'<details class=\"units925-edit\" open><summary>'+esc(epDay819(date))",
            "groups.map(date=>'<details class=\"units925-edit\" data-subhire975-day=\"'+esc(date)+'\" open><summary>'+esc(epDay819(date))",
            'Stable supplier delivery-day disclosure identity',
        ),
        (
            "+'<details class=\"units925-edit\"><summary>Original supplier plan · history</summary>'+ep819Html()",
            "+'<details class=\"units925-edit\" data-subhire975-history><summary>Original supplier plan · history</summary>'+ep819Html()",
            'Stable supplier history disclosure identity',
        ),
        (
            'return `<div class="card" id="docAddCard"${state.docAdd815 ? \'\' : \' hidden\'}><h4 style="margin:0 0 6px;font-size:14px">Add a document from this device</h4>\n <div class="docadd">',
            'return `<div class="card" id="docAddCard"${state.docAdd815 ? \'\' : \' hidden\'}><div class="flow994-dochead"><h4 style="margin:0;font-size:14px">Add a document from this device</h4><button type="button" class="btn sm" id="docAddClose994">Close</button></div>\n <div class="docadd">',
            'Explicit close beside the document upload form',
        ),
        (
            'id="docAdd815" aria-expanded="\' + !!state.docAdd815 + \'">+ Add</button>\'',
            'id="docAdd815" aria-expanded="\' + !!state.docAdd815 + \'" aria-controls="docAddCard">\' + (state.docAdd815 ? \'Close add document\' : \'+ Add\') + \'</button>\'',
            'Document add toggle describes its current action',
        ),
        (
            'state.docAdd815 = card.hidden; card.hidden = !state.docAdd815; add.setAttribute(\'aria-expanded\', String(!!state.docAdd815));',
            'state.docAdd815 = card.hidden; card.hidden = !state.docAdd815; add.setAttribute(\'aria-expanded\', String(!!state.docAdd815)); add.textContent = state.docAdd815 ? \'Close add document\' : \'+ Add\';',
            'Update document toggle label without recreating selected files',
        ),
        (
            "  const f = $('#docFile'); if (f) { try { f.focus({preventScroll: true}); } catch (e) {} }\n };\n const up = $('#docUpload');",
            "  const f = $('#docFile'); if (f) { try { f.focus({preventScroll: true}); } catch (e) {} }\n };\n const closeAdd994 = $('#docAddClose994'); if (closeAdd994 && add && card) closeAdd994.onclick = () => { if (!card.hidden) add.click(); add.focus({preventScroll:true}); };\n const up = $('#docUpload');",
            'Document Close uses the retained native toggle',
        ),
        (
            'return `<tr data-cwred="${i}"><td><b>${r.what}</b>${gaps.length ?',
            'return `<tr data-cwred="${i}"><td>${r.go ? `<button type="button" class="flow994-cwopen" data-cwred-open="${i}">${r.what}<span aria-hidden="true"> →</span></button>` : `<b>${r.what}</b>`}${gaps.length ?',
            'Native keyboard-accessible Coates Way source action',
        ),
        (
            " pane.querySelectorAll('[data-cwred]').forEach(tr => { const r = reds[Number(tr.dataset.cwred)];\n if (r && r.go) { tr.style.cursor = 'pointer'; tr.onclick = r.go; } });",
            " pane.querySelectorAll('[data-cwred-open]').forEach(button => { const r = reds[Number(button.dataset.cwredOpen)];\n if (r && r.go) button.onclick = r.go; });",
            'Preserve the original red-status action on its button',
        ),
    ]
    for old, new, label in changes:
        html = rep(html, old, new, label, 'flow994')
    html = rep(html, '</head>\n<body', '<style id="flow994-style">' +
               (HERE / 'flow994.css').read_text() + '</style>\n</head>\n<body',
               'Flow correction styles', 'flow994')
    return rep(html, '</body>\n</html>', '<script id="flow994-script">' +
               (HERE / 'flow994.js').read_text() + '</script>\n</body>\n</html>',
               'Section return and disclosure state', 'flow994')
