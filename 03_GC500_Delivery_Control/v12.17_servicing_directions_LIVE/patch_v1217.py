"""Author: Andrew Fisher. Fill blank, unpinned crew directions from the existing record during native publication."""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE = '4ab22e6bf6a9af93c255fd3732ae8ba57f047dccfb1d3be770b4b1ac7d8d0382'
OLD = '  var d=JSON.parse(JSON.stringify(data));d.contact={name:name,phone:phone};'
NEW = "  var d=SvcDirections1217.apply(data,typeof S==='object'&&S?S.locations:null);d.contact={name:name,phone:phone};"

def patch(html):
    if 'var SvcDirections1217' in html:
        raise ValueError('v12.17 already applied')
    if hashlib.sha256(html.encode()).hexdigest() != BASE:
        raise ValueError('Wrong live base; expected verified v12.16')
    html = rep(html, 'var SvcTrackerAdmin1067 = (function () {',
               (HERE / 'directions1217_src.js').read_text() + '\nvar SvcTrackerAdmin1067 = (function () {',
               'directions helper', 'page')
    html = rep(html, OLD, NEW, 'native publication fallback', 'page')
    return rep(html, "+' · v12.16'; /* v8.19 release922", "+' · v12.17'; /* v8.19 release922", 'footer', 'page')

if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(patch(p.read_text()))
    print('v12.17 servicing directions applied')
