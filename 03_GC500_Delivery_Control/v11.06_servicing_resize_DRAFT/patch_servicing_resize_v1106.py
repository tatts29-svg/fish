"""Author: Andrew Fisher. Bounded map-resize subpatch; release wrapper owns exact base/version."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

OLD = 'I.resize=new ResizeObserver(function(){var old=I.fit;size();if(old!==I.fit){I.x=I.width/2-(I.width/2-I.x)*(I.fit/old);I.y=I.height/2-(I.height/2-I.y)*(I.fit/old);}scheduleView();});I.resize.observe(I.view);'
MARKER = '/* Author: Andrew Fisher. Keep the viewed drawing centre across viewport changes. */'

def patch(text):
    if MARKER in text:
        raise ValueError('v11.06 map-resize correction already installed')
    if 'var SvcMap1099 =' not in text or 'id="svc1104-race-style"' not in text:
        raise ValueError('v11.06 requires the existing servicing map and verified race presentation')
    return rep(text, OLD, (HERE / 'resize1106_src.js').read_text().rstrip(), 'preserve map centre using previous viewport dimensions', 'page')

if __name__ == '__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()), encoding='utf-8')
