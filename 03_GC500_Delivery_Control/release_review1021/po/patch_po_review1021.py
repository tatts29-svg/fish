"""Author: Andrew Fisher. Keep a recorded P/O check tied to the saved values reviewed."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent.parent / 'toolchain'))
from rep import rep

BASE_SHA = '9db6edd2492e6f25d4144cc8762f8a223f1cca1a6ad01d25d9c648e17280456b'


def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact combined v10.21 source; repeat or other source refused')
    before = 'function personWords1019(s){'
    html = rep(html, before, (HERE / 'po_review1021.js').read_text().rstrip() + '\n' + before,
               'P/O review state functions', 'v10.21 review')
    html = rep(html, "const check982 = poReceiptIssue982(Object.assign({}, poOf(n) || {}, patch));",
               "patch = poReviewPatch1021(poOf(n) || {}, patch);\nconst check982 = poReceiptIssue982(Object.assign({}, poOf(n) || {}, patch));",
               'Native P/O changes invalidate reviewed state', 'v10.21 review')
    html = rep(html, "if (!o || !o.checked || !o.checked.by) return '';",
               "if (!poReviewCurrent1021(o)) return '';", 'Show only current P/O check', 'v10.21 review')
    html = rep(html, "if (!o || !o.confirmed || (o.checked && o.checked.by)) return '';",
               "if (!o || !o.confirmed || poReviewCurrent1021(o)) return '';", 'Allow recheck after changes', 'v10.21 review')
    html = rep(html, 'const no = b.dataset.poCheck1019; const who = whoAmI();',
               "const no = b.dataset.poCheck1019; if (poReviewFormChanged1021(pane, no)) { flash('Save this purchase order before marking it as checked.'); return; } const who = whoAmI();",
               'Keep unsaved P/O form until Save', 'v10.21 review')
    return html


if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(apply(target.read_text()))
