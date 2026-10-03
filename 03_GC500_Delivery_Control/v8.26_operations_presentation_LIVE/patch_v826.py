#!/usr/bin/env python3
# Author: Andrew Fisher. Private review patch; build from the current live page.
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent
toolchain = ROOT.parent / 'toolchain'
if not toolchain.exists():
    toolchain = Path('/workspace/gc500-current-release/03_GC500_Delivery_Control/toolchain')
sys.path.insert(0, str(toolchain))
from rep import rep as shared_rep
def rep(s, old, new):
    return shared_rep(s, old, new, 'v8.26 checklist: ' + old[:60], str(ROOT))

def patch(s):
    if 'function checks826(' in s:
        raise SystemExit('v8.26 is already applied')
    if 'function printDay816(' not in s or 'function drvCheck782(' not in s:
        raise SystemExit('Wrong base: native driver and Demob sheets required')
    s = rep(s, 'function drvCheck782(iso, only, go, changed){', 'function drvCheckBefore826(iso, only, go, changed){')
    s = rep(s, 'function drvValid782(iso, pick){', 'function drvValidBefore826(iso, pick){')
    s = rep(s, 'function sheet816(iso, L){', 'function sheet816Before826(iso, L){')
    s = rep(s, 'function printDay816(iso, br, what, n){', 'function printDay816Before826(iso, br, what, n){')
    # Keep the native component; change its pre-print entry point only.
    marker = '/* -------- the run sheets: one A4 per load, in the day documents\' look */'
    src = (ROOT / 'checklist826_src.js').read_text()
    wrappers = '''
function drvCheck782(iso, only, go, changed){ return drvCheck826(iso, only, go, changed); }
function drvValid782(iso, pick){ return drvValid826(iso, pick); }
function sheet816(iso, L){ return sheet816Before826(iso,L).replace('<h2>Sign-off</h2>','<h2>Sign-off</h2>'+sheetCheck826(iso,L)); }
function printDay816(iso, br, what, n){ return demobCheck826(iso, br, what, n); }
'''
    s = rep(s, marker, src + '\n' + wrappers + '\n' + marker)
    s = rep(s, "' · drop-off, way in, times and order'", "' · manual sheet check'")
    return s

if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        raise SystemExit('Usage: patch_v826.py input.html [output.html]')
    Path(sys.argv[2] if len(sys.argv) == 3 else sys.argv[1]).write_text(patch(Path(sys.argv[1]).read_text()))
