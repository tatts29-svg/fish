"""Author: Andrew Fisher. v10.80 - VMS05 is back: 24 VMS boards.

Andrew, 20 Oct 2026: "there is a VMS05 now asset no 1211356 Rego no ER9244 pinned location 27°58'57.5"S 153°25'28.7"E".
On 19 Oct VMS05 was "removed and no longer needed" and the count went to 23 (v10.76). Now VMS05 is a Coates board,
1211356, rego ER9244, at plan position 05a ("Relocate VMS05 to Gold Coast Highway (southbound), PB3"; the pin is 34 m from
the plan's spot). No contract line names VMS05 or 1211356 yet, and the register lists contract lines only, so the board is
added to the register on Andrew's word: Coates, 1211356, "no contract line yet". The register then has 24 boards, the
recorded requirement is 24, and every VMS count (Today, Equipment, the register heading, milestones) follows. The record
(T0001's eighth board, its rego and the 05a pin) is written separately, through the page, after this is live.

    python3 patch_v1080.py page.html      (in place, on the live v10.79 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

ADD = (" if (b.key === 'VMS09') b.was1072 = 'VMS05'; });\n"
       " /* v10.80 - Andrew Fisher, 20 Oct 2026: \"there is a VMS05 now asset no 1211356 Rego no ER9244\" - a Coates board that no\n"
       "    contract line names yet, on the register on his word until the branch puts it on hire */\n"
       " if (!out.some(b => b.vms === 'VMS05' || b.asset === '1211356')) out.push({key: 'VMS05', vms: 'VMS05', name: 'VMS05', contract: '', line: '', branch: '',\n"
       "  co: 'Coates', coates: true, asset: '1211356', load: null, via: null, docket: null, what: 'VMS05 - Coates 1211356, on Andrew Fisher\\'s word 20 Oct 2026',\n"
       "  start: '2026-10-20', ended: false, noLine1080: true});\n"
       " return (vms913Boards.b = out);")

EDITS = [
 (" if (b.key === 'VMS09') b.was1072 = 'VMS05'; });\n return (vms913Boards.b = out);", ADD, 'v10.80 VMS05 on the register'),
 ("function vms913LineCount(){ return vms913Boards().reduce((n, b) => n + 1 + (b.folded || []).length, 0); }",
  "function vms913LineCount(){ return vms913Boards().reduce((n, b) => n + (b.noLine1080 ? 0 : 1) + (b.folded || []).length, 0); } /* v10.80: VMS05 has no line */",
  'v10.80 line count'),
 ("  const sub = 'line ' + b.line + (b.docket",
  "  const sub = (b.noLine1080 ? 'no contract line yet - on Andrew\\'s word, 20 Oct' : 'line ' + b.line) + (b.docket", 'v10.80 register row wording'),
 ("/* v10.76: \"Our qty needs to now be 23 vms05 was removed and no longer needed\" */return Object.assign(e,{requirement:23,confirmedOn:'19 Oct 2026'});",
  "/* v10.80: \"there is a VMS05 now\" (20 Oct; on 19 Oct it was 23, VMS05 removed) */return Object.assign(e,{requirement:24,confirmedOn:'20 Oct 2026'});",
  'v10.80 requirement 24'),
]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if 'noLine1080' in t: sys.exit('patch_v1080 refuses a repeat')
    if "+ ' · v10.79'" not in t or '"id":"WC05-FWF"' not in t: sys.exit('patch_v1080 needs the live v10.79 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.79'", "+ ' · v10.80'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1080 applied: VMS05 back on the register (Coates 1211356, no contract line yet); 24 boards; footer v10.79 -> v10.80')

if __name__ == '__main__':
    main()
