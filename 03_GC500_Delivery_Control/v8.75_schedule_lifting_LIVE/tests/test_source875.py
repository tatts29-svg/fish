# Author: Andrew Fisher. Independent protection against source refresh or build cleanup changing unrelated data.
import sys,json,re
from pathlib import Path

def read(path):
    text=Path(path).read_text()
    start=re.search(r'const DATA\s*=\s*',text).end()
    return json.JSONDecoder().raw_decode(text[start:])[0]

base,candidate=map(read,sys.argv[1:3])
for key in base:
    if key not in {'assets','plant_lines','unreferenced'}:
        assert base[key]==candidate[key],f'Protected source section changed: {key}'

def protected(left,right,allowed):
    assert {k:v for k,v in left.items() if k not in allowed}=={k:v for k,v in right.items() if k not in allowed}

for section in ('assets','plant_lines'):
    before=base[section] if section=='assets' else base[section]['lines']
    after=candidate[section] if section=='assets' else candidate[section]['lines']
    assert len(before)==len(after)
    for a,b in zip(before,after):
        protected(a,b,{'name','events','charge_lines'})
        assert len(a.get('events',[]))==len(b.get('events',[]))
        for e,f in zip(a.get('events',[]),b.get('events',[])):
            protected(e,f,{'quantity_display','quantity_raw','load_time','carrier','source_revision875','handling_source875','booking801'})
        assert len(a.get('charge_lines',[]))==len(b.get('charge_lines',[]))
        for e,f in zip(a.get('charge_lines',[]),b.get('charge_lines',[])):
            protected(e,f,{'quantity'})
assert len(base['unreferenced'])==len(candidate['unreferenced'])
for a,b in zip(base['unreferenced'],candidate['unreferenced']):
    protected(a,b,{'quantity_display','load_time','carrier','source_revision875'})
print('PASS all protected source sections and unrelated item/event fields remain identical')
