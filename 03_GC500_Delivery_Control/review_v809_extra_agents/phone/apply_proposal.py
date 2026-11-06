# Author: Andrew Fisher
# Isolated proposal only. Refuses any source other than the reviewed snapshot.
from pathlib import Path
import hashlib
import argparse

parser = argparse.ArgumentParser(description='Create an isolated control-fix proposal from the reviewed source.')
parser.add_argument('source_dir', type=Path, help='Reviewed work directory')
parser.add_argument('output_dir', type=Path, help='Separate output directory; never the source directory')
args = parser.parse_args()
ROOT = args.output_dir.resolve()
SOURCE = args.source_dir.resolve() / 'car-app.js'
assert ROOT != SOURCE.parent, 'Output must be separate from source'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == '718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707'
s = SOURCE.read_text()
replacements = [
    ('grab=null;if(pointers.size!==1||!ready)return;cast(e);',
     'if(pointers.size!==1||!ready)return;grab=null;cast(e);'),
    ('function openRegister(useWords=false){closeCard();words=useWords;',
     'function openRegister(useWords=false){endTour();closeCard();words=useWords;'),
    ("$('tour-panel').querySelector('.card-body').scrollTop=0;showStudio();placeCards();}",
     "$('tour-panel').querySelector('.card-body').scrollTop=0;showStudio();placeCards();focusIn($('tour-title'));}"),
    ("tour=0;showTour();focusIn($('tour-title'));", "tour=0;showTour();"),
]
for old, new in replacements:
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)
ROOT.mkdir(parents=True, exist_ok=True)
(ROOT / 'car-app.proposed.js').write_text(s)
print('Original SHA-256:', hashlib.sha256(SOURCE.read_bytes()).hexdigest())
print('Proposal SHA-256:', hashlib.sha256(s.encode()).hexdigest())

html_source = SOURCE.with_name('index.html')
assert hashlib.sha256(html_source.read_bytes()).hexdigest() == '11dbc435a37111480dcac1f6cce55e1818de3b7968f71af39134e558acf5b4f9'
html = html_source.read_text()
for old, new in [
    ('<button id="tour">', '<button id="tour" aria-label="Guided tour" aria-pressed="false">'),
    ('<button id="inspect-toggle" aria-expanded="true">', '<button id="inspect-toggle" aria-label="Toggle selected part details" aria-controls="inspect-content" aria-expanded="true">'),
]:
    assert html.count(old) == 1, old
    html = html.replace(old, new)
(ROOT / 'index.proposed.html').write_text(html)
print('HTML original SHA-256:', hashlib.sha256(html_source.read_bytes()).hexdigest())
print('HTML proposal SHA-256:', hashlib.sha256(html.encode()).hexdigest())
