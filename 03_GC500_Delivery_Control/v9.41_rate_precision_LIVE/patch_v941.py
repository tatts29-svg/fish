#!/usr/bin/env python3
"""Author: Andrew Fisher. Accurate displayed daily-rate formulas; source money unchanged."""
from pathlib import Path
import argparse,re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('page',type=Path)
parser.add_argument('--preview-base-937',action='store_true',help='Private focused proof only; final release requires v9.40.')
args=parser.parse_args();p=args.page;raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'id="rate941-script"' not in s and 'Rate941.formula(l)' not in s,'v9.41 already applied'
expected='9.37' if args.preview_base_937 else '9.40'
assert " · v"+expected+"'; /* v8.19" in s,'Expected the declared prior release footer'
assert '/* drawer935 null-safe VMS source */' in s,'Expected the restored native equipment drawer'
old="""+ (l.days != null && l.per === 'day' ? '<br><span class="w" style="font-size:11.5px;color:var(--mute)">' + esc(String(l.days)) + ' day' + (l.days === 1 ? '' : 's')
 + ' × ' + esc(money(l.rate)) + (l.qty != null ? ' × ' + esc(String(l.qty)) : '')"""
new="""+ (l.days != null && l.per === 'day' ? '<br><span class="w rate941-formula" style="font-size:11.5px;color:var(--mute)">' + esc(Rate941.formula(l))"""
s=rep(s,old,new,'displayed daily-rate formula',str(p))
js=(HERE/'rate941.js').read_text()
# Load before the native page's initial render; do not wait until the final script.
anchor='const MONEY_FMT = new Intl.NumberFormat('
assert s.count(anchor)==1,'Native money formatter changed'
s=rep(s,anchor,js+'\n'+anchor,'source-rate display helper',str(p))
# An explicit marker keeps reapplication and source checks deterministic.
s=rep(s,'<meta name="viewport" content="width=device-width, initial-scale=1">','<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta id="rate941-script" name="gc500-rate-display" content="9.41">','rate display release marker',str(p))
s=rep(s," · v"+expected+"'; /* v8.19"," · v9.41'; /* v8.19",'release footer',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf')else b'')+s.encode())
print('v9.41 displayed daily-rate precision applied'+(' (private v9.37 preview)'if args.preview_base_937 else''))
