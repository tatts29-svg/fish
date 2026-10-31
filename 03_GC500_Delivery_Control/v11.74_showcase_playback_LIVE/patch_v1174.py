"""Author: Andrew Fisher. Advance Showcase motion while a GPU frame is pending."""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def patch(html):
    if 'ShowcaseGPU1174' in html:
        raise ValueError('v11.74 already applied')
    if hashlib.sha256(html.encode()).hexdigest() != (HERE / 'BASE_SHA256').read_text().strip():
        raise ValueError('Wrong live base for v11.74; rebuild against the current owner release')
    old = (HERE.parent / 'v11.57_showcase_smooth_LIVE' / 'smooth1157.js').read_text()
    old = old[old.index('/* Author: Andrew Fisher. One submitted GPU frame'):]
    new = (HERE / 'gpu1174_src.js').read_text()
    assert '</script' not in new
    html = rep(html, old, new, 'GPU wait only gates drawing, with active-interval quality guard', 'page')
    start = html.index('/* Author: Andrew Fisher. v11.43 - the Showcase opens quicker')
    end = html.index('</script>', start)
    old_quick = html[start:end].rstrip() + '\n'
    assert hashlib.sha256(old_quick.encode()).hexdigest() == (HERE / 'QUICK_BASE_SHA256').read_text().strip()
    html = rep(html, old_quick, (HERE / 'quick1174_src.js').read_text(), 'flat circuit escape after measured severe 3D playback stalls', 'page')
    return rep(html, "+' · v11.73'; /* v8.19 release922", "+' · v11.74'; /* v8.19 release922", 'footer', 'page')

if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text()))
    print('v11.74 Showcase playback applied')
