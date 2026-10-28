"""Author: Andrew Fisher. Remove redundant arrival-time layout measurements.

The native pane is display:none while inactive, and its arrival class is removed
on departure. Activating it starts the existing CSS animation without measuring
the old contents that render() is about to replace. No animation rule changes.

Costs owns a scroll restoration only on refresh. During a tab arrival the native
navigation owns scroll memory, so Costs must not measure that half-changed page.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


ARRIVAL_OLD = "if (on && changed) { void p.offsetWidth; p.classList.add('arrive'); }"
ARRIVAL_NEW = "if (on && changed) p.classList.add('arrive'); /* navigation1243: inactive panes already end the previous CSS animation. */"

COSTS_OLD = """const generation=++costsScroll1065,main=document.querySelector('main'),y=main?.scrollTop||0;
  const tab=state.tab,hash=location.hash,pane=document.getElementById('pane-costs'),arrival=!!GO_CHANGED,intent=window.Persistence1010?.intent;
  const result=native.apply(this,arguments);tidy();const after=main?.scrollTop;"""
COSTS_NEW = """const generation=++costsScroll1065,arrival=!!GO_CHANGED,main=document.querySelector('main'),y=arrival?0:(main?.scrollTop||0);
  const tab=state.tab,hash=location.hash,pane=document.getElementById('pane-costs'),intent=window.Persistence1010?.intent;
  const result=native.apply(this,arguments);tidy();const after=arrival?null:main?.scrollTop; /* navigation1243: tab arrivals use native scroll memory. */"""


def patch(text, path):
    """Patch an already source-bound v12.43 input, refusing missing/duplicate targets."""
    if 'navigation1243:' in text:
        raise ValueError('v12.43 navigation repairs are already applied')
    if 'id="performance1241-script"' not in text:
        raise ValueError('v12.43 navigation repairs require the performance release')
    for old, new, label in (
        (ARRIVAL_OLD, ARRIVAL_NEW, 'retain pane arrival animation without measuring stale contents'),
        (COSTS_OLD, COSTS_NEW, 'skip Costs refresh measurements during native tab navigation'),
    ):
        matches = text.count(old)
        if matches != 1:
            raise ValueError(label + ': expected one exact source match, got ' + str(matches))
        start = text.index(old)
        text = text[:start] + rep(old, old, new, label, path) + text[start + len(old):]
    return text
