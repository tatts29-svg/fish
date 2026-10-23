"""Author: Andrew Fisher. v11.48 - the Event nights and Change deliveries pages are set aside.

Andrew, 23 Oct 2026: "can we remove event night we dont need as we have the servicing tab now"; "can we also remove change
deliveries Tab we dont need any more".

The page's own set-aside mechanism (TABS_OFF, v5.91) takes both names: they leave the tab strip and the More menu, a link
to either lands on Today and says the page has been set aside, and their panes, code and records are untouched - taking a
name out of the set puts the page back exactly as it was. The two buttons that led to Change deliveries go with it: the
Build day card's "Edit · Change deliveries" tile and the Edit pane's "Add a reference" / "Change deliveries by day" pair
(the Add page has been set aside since v7.02 and lands on Change deliveries). The servicing tracker panel and its publish
fold live on the Servicing tab (v10.84), so the trackers are unaffected. Footer v11.47 -> v11.48.

    python3 patch_v1148.py page.html      (in place, on the live v11.47 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()

EDITS = [
    ("const TABS_OFF = new Set(['variances', 'journal', 'add', 'breakdowns', 'register', 'edit', 'progress']);",
     "const TABS_OFF = new Set(['variances', 'journal', 'add', 'breakdowns', 'register', 'edit', 'progress', 'nights', 'change']); /* v11.48 - Event nights and Change deliveries set aside (Andrew, 23 Oct 2026: \"we dont need as we have the servicing tab now\"; \"we dont need any more\") */",
     'the set-aside set'),
    ("function dpEditTile(d){\n if (!d || !d.iso) return '';",
     "function dpEditTile(d){\n if (!d || !d.iso) return '';\n if (TABS_OFF.has('change')) return ''; /* v11.48 - the Change deliveries page is set aside */",
     'the Build day card tile'),
    ('<span><button class="btn ghost" id="edAdd">Add a reference</button> <button class="btn ghost" id="edChange">Change deliveries by day</button></span>',
     '<span>${TABS_OFF.has(\'change\') ? \'\' : \'<button class="btn ghost" id="edAdd">Add a reference</button> <button class="btn ghost" id="edChange">Change deliveries by day</button>\'}</span>',
     'the Edit pane buttons that led to Change deliveries'),
]


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.48 requires the live v11.47 page ' + BASE_SHA256)
    if "'nights', 'change']);" in text: raise ValueError('v11.48 already applied')
    for old, new, what in EDITS: text = rep(text, old, new, what, 'page')
    text = rep(text, "+' · v11.47'; /* v8.19 release922", "+' · v11.48'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [("'progress', 'nights', 'change']);", 1), ("if (TABS_OFF.has('change')) return '';", 1), ("${TABS_OFF.has('change') ? '' : '<button class=\"btn ghost\" id=\"edAdd\">", 1), ('id="edChange"', 1), ("+' · v11.48'; /* v8.19 release922", 1)]:
        if text.count(needle) != n: raise ValueError('v11.48 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1148 applied: Event nights and Change deliveries set aside, their entry buttons hidden; footer v11.47 -> v11.48')
