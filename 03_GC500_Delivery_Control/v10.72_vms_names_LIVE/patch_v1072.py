"""Author: Andrew Fisher. v10.72 - the eight Coates VMS boards from 7 October carry their VMS numbers.

Andrew, 18 Oct 2026: "vms1 1211354 rego EX0017 · vms2 asset no 1211370 REGO ES3206 · vms3 asset no 1271129 REGO 536UOO ·
vms4 asset no 1191877 REGO EM6306 · vms6 asset no 1211359 REGO ER9247 · vms7 asset no1182999 REGO 410UFQ · vms8 asset no
1211383 REGO ER9381 · Vms9 asset no 1211404 REGO TF15JR ... These are the 8 that turned up on 7th october · 1211404 was
orginally vms5 but was taken off and added to vms9 ... THIS NEED TO BE FIXED and updated".

Their contract lines (9961265 lines 3-9) carry no VMS number, so the VMS boards register named them by asset number only.
Now each shows its VMS number (VMS01-04, VMS06-08) with the asset number beside it, and VMS09 says it was first VMS05. Only
the name changes: each board keeps its record key (its asset number), so nothing on the record moves or orphans; the board's
VMS plan position (b.vms) is untouched; no rate, line, delivery, tick or count changes. The regos are already on the record
(18 Oct). Footer v10.71 -> v10.72.

    python3 patch_v1072.py page.html      (in place, on the live v10.71 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

NAMES = """function vms913WordOf(key){"""
NAMES_NEW = """/* v10.72 - THE COATES BOARDS BY THEIR VMS NUMBER. Andrew Fisher, 18 Oct 2026: "vms1 1211354 ... vms2 asset no 1211370 ...
   vms3 asset no 1271129 ... vms4 asset no 1191877 ... vms6 asset no 1211359 ... vms7 asset no1182999 ... vms8 asset no 1211383
   ... These are the 8 that turned up on 7th october · 1211404 was orginally vms5 but was taken off and added to vms9". Only the
   name shown changes: the board's key (its asset number), its record and its VMS plan position stay as they are. */
function vms1072Names(){ return {'1211354': 'VMS01', '1211370': 'VMS02', '1271129': 'VMS03', '1191877': 'VMS04', '1211359': 'VMS06', '1182999': 'VMS07', '1211383': 'VMS08'}; }
function vms913WordOf(key){"""

BOARDS = """ return (vms913Boards.b = out);"""
BOARDS_NEW = """ /* v10.72 - Andrew's VMS numbers for the Coates boards whose contract line names none (18 Oct 2026) */
 const N1072 = vms1072Names();
 out.forEach(b => { if (!b.vms && b.asset && Object.prototype.hasOwnProperty.call(N1072, b.asset)) b.name = N1072[b.asset]; if (b.key === 'VMS09') b.was1072 = 'VMS05'; });
 return (vms913Boards.b = out);"""

SUB = """  const sub = 'line ' + b.line + (b.docket ? ' · docket ' + b.docket : '') + fold + (b.twin && b.twin.length ? ' · asset no. also on line ' + b.twin.join(', ') : '');"""
SUB_NEW = """  const sub = 'line ' + b.line + (b.docket ? ' · docket ' + b.docket : '') + fold + (b.twin && b.twin.length ? ' · asset no. also on line ' + b.twin.join(', ') : '') + (b.was1072 ? ' · first ' + b.was1072 + ', taken off and made ' + b.name + ' (18 Oct)' : ''); /* v10.72 */"""

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if 'vms1072Names' in t: sys.exit('patch_v1072 refuses a repeat')
    if "+ ' · v10.71'" not in t: sys.exit('patch_v1072 needs the live v10.71 page')
    t = rep(t, NAMES, NAMES_NEW, 'v10.72 names', path)
    t = rep(t, BOARDS, BOARDS_NEW, 'v10.72 names on the board rows', path)
    t = rep(t, SUB, SUB_NEW, 'v10.72 VMS09 was VMS05', path)
    t = rep(t, "+ ' · v10.71'", "+ ' · v10.72'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1072 applied: VMS01-04, VMS06-08 named; VMS09 first VMS05; footer v10.71 -> v10.72')

if __name__ == '__main__':
    main()
