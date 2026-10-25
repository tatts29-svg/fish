"""Author: Andrew Fisher. Exact unchanged-source checks for the bounded patch."""
import hashlib
import json
import os
from html.parser import HTMLParser
from pathlib import Path

class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.blocks = {'script': [], 'style': []}
        self.current = None
    def handle_starttag(self, tag, attrs):
        if tag in self.blocks:
            self.current = [tag, dict(attrs), '']
    def handle_data(self, data):
        if self.current:
            self.current[2] += data
    def handle_endtag(self, tag):
        if self.current and self.current[0] == tag:
            self.blocks[tag].append(self.current)
            self.current = None

base = Path(os.environ['BASE']).read_text()
page = Path(os.environ['PAGE']).read_text()
before, after = Blocks(), Blocks()
before.feed(base)
after.feed(page)
checks = 0
def check(name, yes):
    global checks
    assert yes, name
    checks += 1
    print('PASS', name)

check('Exact verified base', hashlib.sha256(base.encode()).hexdigest() == '8112a63d10c5b6c88206a539af5a59dc1037176e414a95f20d253b16f844e257')
scripts = before.blocks['script']
check('Only two new scripts', len(after.blocks['script']) == len(scripts) + 2)
changed = []
for i, item in enumerate(scripts):
    new = after.blocks['script'][i]
    check('Script identity preserved ' + str(i), item[:2] == new[:2])
    if item[2] != new[2]:
        changed.append(item)
check('Only main model and source forecast changed', len(changed) == 2 and any('function pl770Model()' in b[2] for b in changed) and any(b[1].get('id') == 'finance-request996-script' for b in changed))
check('Every existing style is byte-identical', before.blocks['style'] == after.blocks['style'][:-1])
check('One scoped style added', after.blocks['style'][-1][1].get('id') == 'charge-assurance1224-style')
check('New script identities', [b[1].get('id') for b in after.blocks['script'][-2:]] == ['charge-checks1224-script', 'charge-assurance1224-script'])
check('Main servicing lock percentage retained', 'var JOBS1123 = [\'pump\', \'clean\', \'refill\', \'lockup\'];' in page)
def source_data(text):
    start = text.index('const DATA = ') + len('const DATA = ')
    _, end = json.JSONDecoder().raw_decode(text[start:])
    return text[start:start + end]
check('Complete embedded source data unchanged', source_data(base) == source_data(page))
check('Release footer advanced once', page.count("+' · v12.24'; /* v8.19 release922:") == 1 and "+' · v12.23'; /* v8.19 release922:" not in page)
print('PASS', checks, 'preservation checks')
