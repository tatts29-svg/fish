"""Author: Andrew Fisher. Isolated v11.04 servicing presentation subpatch.
The root release patch verifies the exact v11.03 base and owns its version footer.
"""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def patch(text):
    if 'id="svc1104-race-style"' in text or '/* svc1104 presentation lifecycle */' in text:
        raise ValueError('v11.04 servicing race presentation already installed')
    for marker in ('var SvcProgress1102 =', 'id="svc1099-style"', 'id="pane-servicing"', 'var SvcMap1099 ='):
        if marker not in text:
            raise ValueError('v11.04 servicing presentation requires the verified v11.03 modules: ' + marker)
    css = (HERE / 'servicingRace1104_src.css').read_text()
    script = (HERE / 'servicingRace1104_src.js').read_text()
    if '</style' in css or '</script' in script:
        raise ValueError('unexpected embedded HTML boundary')
    # The end-of-document cascade wins over older scoped map styles without
    # replacing controller modules, data, drawing bytes or any existing image.
    tail = text[text.rfind('</body>'):]
    if not tail.strip().endswith('</html>'):
        raise ValueError('outer document closing boundary missing')
    text = rep(text, tail, '<style id="svc1104-race-style">\n' + css + '\n</style>\n' + tail, 'servicing race presentation', 'page')
    start = text.index('/* Author: Andrew Fisher. v10.67 read-only servicing progress. v10.84')
    end = text.index('</script>', start)
    text = text[:end] + '\n/* svc1104 presentation lifecycle */\n' + script + '\n' + text[end:]
    return text

if __name__ == '__main__':
    p = Path(sys.argv[1]); p.write_text(patch(p.read_text()), encoding='utf-8')
