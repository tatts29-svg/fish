#!/usr/bin/env python3
"""Author: Andrew Fisher. Timeline packing and per-load V8s traffic control service."""
import argparse,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(s):
    for need in ['function dpGrid899(', 'function flow891Card(', 'function timeline841Actions(', 'function ldId(']:
        if need not in s:raise ValueError('Missing current base feature: '+need)
    if 'function traffic903Plan(' in s:raise ValueError('v903 already applied')
    def replace(a,b):
        nonlocal s
        s=rep(s,a,b,'v903 Timeline and traffic control','page.html')
    footer=re.search(r"\+ ' · v(?:8\.99|9\.00|9\.01|9\.02)'; /\* v8\.19",s)
    if not footer:raise ValueError('Expected current release footer')
    replace(footer.group(),"+ ' · v9.03'; /* v8.19")
    legacy=" if (!/^\\d{4}-\\d{2}-\\d{2}#\\d{1,4}$/.test(id)) bad.push('load ' + id + ' is not a load id (a day and a number)');"
    validator=r""" const traffic903 = /^traffic903\/(\d{4}-\d{2}-\d{2})\/(.+)$/.exec(id);
 if (traffic903) {
  const fields903 = ['kind','day','loadId','status','by','at'];
  let key903 = '';try {key903=traffic903Key(r.day,r.loadId);}catch(e){}
  if(r.kind!=='traffic903'||r.day!==traffic903[1]||!traffic903Valid(r.day,r.loadId,r.status)||key903!==id||typeof r.by!=='string'||!r.by.trim()||typeof r.at!=='string'||!iso(r.at)||Object.keys(r).some(k=>!fields903.includes(k)))bad.push('load '+id+' is not a valid Traffic control service');
  text(r.loadId,'load '+id+' identity');text(r.by,'load '+id+' by');return;
 }
"""
    replace(legacy,validator+legacy)
    # Other head/body endings live inside printable HTML strings; bind the actual document edges.
    edge=s.index('</head>')
    s=s[:edge]+'<style id="timeline903-style">'+(HERE/'timeline903.css').read_text()+'</style>\n'+s[edge:]
    head,tag,tail=s.rpartition('</body>')
    if not tag or '<script' in tail:raise ValueError('Missing final document body')
    s=head+'<script id="traffic903-script">\n'+(HERE/'traffic903.js').read_text()+'\n</script>\n'+tag+tail
    return s

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('base',type=Path);ap.add_argument('output',type=Path,nargs='?');a=ap.parse_args()
    (a.output or a.base).write_text(patch(a.base.read_text()))
    print('v9.03 prepared. No operational records changed.')
