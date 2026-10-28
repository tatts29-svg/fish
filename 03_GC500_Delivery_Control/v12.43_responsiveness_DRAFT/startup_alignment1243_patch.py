"""Author: Andrew Fisher. Do not scan Costs before its pane is displayed.

The alignment report is a view decoration. Native Costs rendering replaces its
children on every opening and its existing child-list observer then rebuilds the
report. Keep explicit scans and the drawer's own per-reference resolution eager.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


COSTS_OLD = "const pane = D.getElementById('pane-costs'); if (!pane || pane.querySelector('#align1055')) return;"
COSTS_NEW = "const pane = D.getElementById('pane-costs'); if (!pane || !pane.classList.contains('on') || pane.querySelector('#align1055')) return; /* startupAlignment1243: build the decoration with its displayed Costs pane. */"
RUN_OLD = "(pc1066 && !pc1066.querySelector('#align1055'))"
RUN_NEW = "(pc1066 && pc1066.classList.contains('on') && !pc1066.querySelector('#align1055'))"


def patch(text, path):
    """Apply only to the reviewed native alignment observer implementation."""
    if 'startupAlignment1243:' in text:
        raise ValueError('v12.43 startup alignment guard is already applied')
    if 'id="performance1241-script"' not in text:
        raise ValueError('v12.43 startup alignment guard requires the performance release')
    for old, new, label in (
        (COSTS_OLD, COSTS_NEW, 'defer the hidden Costs alignment decoration'),
        (RUN_OLD, RUN_NEW, 'avoid a hidden Costs-only alignment hold'),
    ):
        matches = text.count(old)
        if matches != 1:
            raise ValueError(label + ': expected one exact source match, got ' + str(matches))
        start = text.index(old)
        text = text[:start] + rep(old, old, new, label, path) + text[start + len(old):]
    return text
