#!/usr/bin/env python3
"""Author: Andrew Fisher. Keep photographs readable on load sheets; retain full continuation sheets."""
import argparse,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(s):
    if 'function recordCollection(f)' not in s or s.count(' · v8.98')!=1:raise ValueError('v899 requires v898')
    if 'function dpGrid899' in s:raise ValueError('v899 already applied')
    def replace(a,b):
        nonlocal s
        s=rep(s,a,b,'v899 readable running sheet photos','page.html')
    replace(' · v8.98',' · v8.99')
    fit=re.search(r'function dpFit\(root\)\{[\s\S]*?\n\}',s)
    if not fit:raise ValueError('Missing print fitter')
    replace(fit.group(),(HERE/'runsheet899.js').read_text())
    replace('<style id="loading872css">','<style id="runsheet899css">'+(HERE/'runsheet899.css').read_text()+'</style><style id="loading872css">')
    replace('const shots = [], grp782 = [];','const shots = [], grp782 = new Map();')
    replace("if (!grp782.length || !(nodes[i].classList && nodes[i].classList.contains('pl782'))) grp782.push([]); grp782[grp782.length - 1].push(sh);", "const load899=String(nodes[i].dataset.load||'');if(!grp782.has(load899))grp782.set(load899,[]);sh.sign899=nodes[i].classList.contains('pl782');grp782.get(load899).push(sh);")
    old="const G = grp782[k] || [shots[k]]; G.forEach((sh, j) => pdf7Put(D, sh, j === 0, m)); file(D, pdf7Name(kind, iso, g, li, n), 'load', G.length, 'Load ' + (li + 1) + ' · ' + refs + (G.length > 1 ? ' · ' + (G.length - 1) + ' location sign' + (G.length === 2 ? '' : 's') : ''), li);"
    new="const G = grp782.get(String(li+1));if(!G||!G.length)throw new Error('A load has no fitted sheets.');const signs899=G.filter(sh=>sh.sign899).length,sheets899=G.length-signs899;G.forEach((sh,j)=>pdf7Put(D,sh,j===0,m));file(D,pdf7Name(kind,iso,g,li,n),'load',G.length,'Load '+(li+1)+' · '+refs+(sheets899>1?' · '+sheets899+' sheets':'')+(signs899?' · '+signs899+' location sign'+(signs899===1?'':'s'):''),li);"
    replace(old,new)
    replace("if (!nodes.length) throw new Error('no page was laid out');", "if (!nodes.length) throw new Error('no page was laid out');\n  if(L.r.timeout || L.r.over?.length)throw new Error('The load sheets could not be fitted safely. '+(L.r.over||[]).join(', ')+'. Nothing has been exported.');")
    replace("over: (wrap.__over || []).slice(), pages: pages.length", "over: (wrap.__over || []).slice(), pages: wrap.querySelectorAll('.dp-page').length")
    replace("wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';", "wrap.classList.add('dpwrap'); wrap.dataset.dpReady = '';wrap.__fit899Ready=false;")
    replace("const go = () => { if (!timeline841PrintCurrent(print841,wrap)||!document.getElementById('dayPage')) return;", "const go = () => { if (!timeline841PrintCurrent(print841,wrap)||!document.getElementById('dayPage')||!dpPrintReady899(wrap)) return;")
    replace("wrap.__timeline841print=()=>timeline841Printed(iso,doc,loads,pick,o,()=>window.print(),()=>timeline841PrintCurrent(print841,wrap));", "wrap.__timeline841print=()=>{if(dpPrintReady899(wrap))return timeline841Printed(iso,doc,loads,pick,o,()=>window.print(),()=>timeline841PrintCurrent(print841,wrap));};")
    replace("const w=document.getElementById('dayprint');if(kind==='drivers'&&w&&w.__timeline841print)", "const w=document.getElementById('dayprint');if(w&&w.classList.contains('dpwrap')&&!dpPrintReady899(w))return;if(kind==='drivers'&&w&&w.__timeline841print)")
    replace(": one ? `Attached is the ${sheets} for ${date}: load ${only + 1} of ${n} (one page, PDF).`", ": one ? `Attached is the ${sheets} for ${date}: load ${only + 1} of ${n} (PDF; collect every sheet).`")
    # These existing messages describe the same print route; a load may now include a continuation.
    for old in ["one A4 page per load - for the branch", "one A4 page per load - for the team"]:
        replace(old,old.replace('one A4 page per load','A4 sheets per load'))
    for old in [line for line in s.splitlines() if 'one page each' in line and len(line)<3000]:
        replace(old,old.replace('one page each','one file per load; collect every sheet'))
    return s

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('base',type=Path);ap.add_argument('output',type=Path,nargs='?');a=ap.parse_args()
    (a.output or a.base).write_text(patch(a.base.read_text()))
    print('Readable running sheet photos and continuations prepared; no operational records changed.')
