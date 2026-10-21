"""Author: Andrew Fisher. Exact-base patch guards and unchanged asset data."""
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from patch_v1101 import patch, BASE_SHA256

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.scripts=[]
        self.current=None
    def handle_starttag(self,tag,attrs):
        if tag=='script':
            self.current=[dict(attrs).get('id',''), '']
    def handle_data(self,data):
        if self.current is not None:self.current[1]+=data
    def handle_endtag(self,tag):
        if tag=='script' and self.current is not None:
            self.scripts.append(tuple(self.current));self.current=None

base=Path(sys.argv[1]).read_text()
assert hashlib.sha256(base.encode()).hexdigest()==BASE_SHA256
candidate=patch(base)
for text in (base+' ',candidate):
    try:patch(text)
    except ValueError:pass
    else:raise AssertionError('wrong base or repeat accepted')
a,b=Scripts(),Scripts();a.feed(base);b.feed(candidate)
assert len(a.scripts)==len(b.scripts)==150
assert [x[0] for x in b.scripts]==[('vms-completion1101-script' if x[0]=='vms-arrival1098-script' else x[0]) for x in a.scripts]
changed=[i for i,(x,y) in enumerate(zip(a.scripts,b.scripts)) if x!=y]
assert changed==[4,127,128],changed
assert [x for x in re.findall(r'<style\b[^>]*>.*?</style>',base,re.S)]==re.findall(r'<style\b[^>]*>.*?</style>',candidate,re.S)
def data(text):
    start=text.index('const DATA = ')+len('const DATA = ')
    return json.JSONDecoder().raw_decode(text[start:])[0]
assert data(base)==data(candidate)
assert 'data-v1024="complete"' in candidate
assert '<scriptid=' not in candidate
assert candidate.count('id="vms-completion1101-script"')==1
print('PASS exact base, repeat refusal, 150 script tags, only three changed scripts, styles and source asset/charge data unchanged')
