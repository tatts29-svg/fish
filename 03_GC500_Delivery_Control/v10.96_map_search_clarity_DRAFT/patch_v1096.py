"""Author: Andrew Fisher. Exact-live-base dashboard Map Explorer enhancement."""
from pathlib import Path
import hashlib
import json
import sys

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='87b47dc52dc52dc9d078e8f77f79ed3c9e835244e5855e075a075aab1b338b47'

def patch(raw):
    if hashlib.sha256(raw).hexdigest()!=BASE:
        raise ValueError('Wrong live base; rebuild from current source')
    text=raw.decode()
    if 'id="map1096-host"' in text:
        raise ValueError('Already applied')
    child=(HERE/'search1096.js').read_text()+'\n'+(HERE/'viewer1096.js').read_text()
    host=(HERE/'host1096.js').read_text().replace('__MAP1096_CSS__',json.dumps((HERE/'map1096.css').read_text())).replace('__MAP1096_JS__',json.dumps(child))
    if '</script' in host.lower():
        raise ValueError('Unsafe embedded closing script')
    # Insert only at the actual final body, preserving all original source blocks.
    at=text.rindex('</body>')
    text=text[:at]+'<script id="map1096-host">\n'+host+'\n</script>\n'+text[at:]
    text=rep(text,'function screenBurst(n, over){\n if (reduced())',
             'function screenBurst(n, over){\n if (!todayShowing()) return false; /* map1096: do not start a delayed Today burst over another tab. */\n if (reduced())',
             'Today burst visibility','page.html')
    start=text.index('<script id="ms1026-script">')
    end=text.index('</script>',start)
    burst=rep(text[start:end],'const tick = now => {\n  ctx.clearRect(0, 0, w, h); let alive = false;',
             ' const tick = now => {\n  if (!todayShowing() || reduced() || !c.isConnected) { c.remove(); return; } /* map1096: stop hidden/reduced-motion work. */\n  ctx.clearRect(0, 0, w, h); let alive = false;',
             'stop cross-tab animation','page.html')
    text=text[:start]+burst+text[end:]
    text=rep(text,"+' · v10.95'","+' · v10.96 DRAFT'",'draft footer','page.html')
    return text.encode()

if __name__=='__main__':
    path=Path(sys.argv[1]);path.write_bytes(patch(path.read_bytes()))
