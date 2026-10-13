"""Author: Andrew Fisher. Distinct verified map completion, preserving all native records."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '1cdd454f842bf2467fbb928179f2570a6d16f8f88d7dfa49674b3d34fcac0910'

def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.08; refuses repeat or wrong-base application')
    js = (HERE / 'map_status1009.js').read_text()
    end = text.rfind('</body>')
    if end < 120:
        raise ValueError('Page closing body unavailable')
    tail = text[end-120:]
    replacement = tail[:120] + '<script id="map-status1009-script">\n' + js + '\n</script>\n' + tail[120:]
    text = rep(text, tail, replacement, 'Read-only authoritative map status', 'v10.09')
    return rep(text, "+ ' · v10.08'", "+ ' · v10.09'", 'Release footer', 'v10.09')

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
