"""Author: Andrew Fisher. Recover source evidence alongside shared records."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep


def apply(html):
    if 'function docsRecovery1016(' in html:
        raise ValueError('v10.16 source recovery already applied')
    for token in ['function sharedCache975()', '/* v10.15: source evidence is a financial-model dependency, independent of deferred rendering. */']:
        if token not in html:
            raise ValueError('v10.16 source recovery dependency missing: '+token)
    html=rep(html, 'async function docsRefresh(force){', (HERE/'recovery1016.js').read_text()+'\nasync function docsRefresh(force){', 'Failed document-registry recovery', 'v10.16')
    html=rep(html, 'if (!force && v.version === version) { syncFooter(); return; }', 'if (!force && v.version === version) { syncFooter(); if (r.ok) docsRecovery1016(); return; }', 'Recover source evidence on unchanged healthy snapshot', 'v10.16')
    html=rep(html, "if (SYNC.status !== 'live') { SYNC.status = 'live'; syncFooter(); docsRedraw(); }", "if (SYNC.status !== 'live') { SYNC.status = 'live'; syncFooter(); docsRedraw(); }\n docsRecovery1016();", 'Recover source evidence after validated record', 'v10.16')
    return rep(html, 'Promise.resolve(SYNC.backend.pull(true)).then(update).catch(update);', 'Promise.resolve(SYNC.backend.pull(true)).then(() => { docsRecovery1016(true); update(); }).catch(update);', 'Explicit Retry also rechecks failed source evidence', 'v10.16')
