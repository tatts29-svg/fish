"""Author: Andrew Fisher. Let narrow-screen readers reach every staff wage cell."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

OLD_WRAPPER = '<div class="tblwrap"><table class="progtbl"><thead><tr><th>Person / operational role</th>'
NEW_WRAPPER = OLD_WRAPPER.replace('class="tblwrap"', 'class="tblwrap event833-table"', 1)
HEAD_ANCHOR = '</head>\n<body>'
STYLE = '''<style id="staff-table834">
/* Author: Andrew Fisher. Three-column crew table: permit a full phone swipe. */
@media (max-width:640px){
 #pane-costs .event833-table table.progtbl>thead>tr>th:first-child,
 #pane-costs .event833-table table.progtbl>tbody>tr>td:first-child{position:static}
}
</style>
'''


def apply(text):
    """Pure bounded component; release owner supplies final source/hash guard."""
    if 'id="staff-table834"' in text or 'tblwrap event833-table' in text:
        raise ValueError('The staff table correction is already applied')
    if text.count('function eventStaffingCard833() {') != 1:
        raise ValueError('The reviewed event staffing card must be present')
    # The shared matcher also consumes leading indentation. Validate its unique
    # match, then replace only the exact declared fragment to preserve every
    # surrounding byte (including embedded print documents).
    rep(text, OLD_WRAPPER, NEW_WRAPPER, 'Scope the staff table presentation', 'host')
    if text.count(OLD_WRAPPER) != 1:
        raise ValueError('The exact reviewed staff table wrapper has changed')
    text = text.replace(OLD_WRAPPER, NEW_WRAPPER, 1)
    rep(text, HEAD_ANCHOR, STYLE + HEAD_ANCHOR, 'Allow the complete staff wage column on phones', 'host')
    if text.count(HEAD_ANCHOR) != 1:
        raise ValueError('The exact reviewed page shell has changed')
    return text.replace(HEAD_ANCHOR, STYLE + HEAD_ANCHOR, 1)
