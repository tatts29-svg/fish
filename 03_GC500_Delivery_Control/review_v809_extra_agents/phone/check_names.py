# Author: Andrew Fisher. Static semantics check; browser/assistive technology untested.
from pathlib import Path
import argparse
from html.parser import HTMLParser
class Buttons(HTMLParser):
    def __init__(self, text):
        super().__init__(); self.buttons = {}; self.feed(text)
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'button' and 'id' in a: self.buttons[a['id']] = a
parser = argparse.ArgumentParser()
parser.add_argument('source_dir', type=Path)
parser.add_argument('candidate_html', type=Path)
args = parser.parse_args()
base = args.source_dir
css = (base / 'car.css').read_text()
assert '.header-actions #tour span{display:none}' in css
for name, path in [('snapshot', base/'index.html'), ('proposal', args.candidate_html)]:
    buttons = Buttons(path.read_text()).buttons
    for key in ['tour', 'inspect-toggle']:
        labelled = bool(buttons[key].get('aria-label'))
        assert labelled == (name == 'proposal'), (name, key)
        print(name, key, 'meaningful explicit label:', labelled)
print('Label reproduction and proposal checks passed.')
