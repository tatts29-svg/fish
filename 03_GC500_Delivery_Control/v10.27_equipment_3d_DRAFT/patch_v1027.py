"""Author: Andrew Fisher. Read-only 3D equipment adapter on live v10.25."""
from pathlib import Path
import hashlib, sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1]); raw = p.read_bytes(); s = raw.decode()
if 'window.GC500Equipment1027 = ' in s:
    raise SystemExit('v10.27 already applied')
if hashlib.sha256(raw).hexdigest() != '66878d12b8f4a98c177b3bf07f30efcce501da46f56b3244b92da94e458b320f':
    raise SystemExit('Live base changed: review and rebase v10.27')
s = rep(s, "+ ' · v10.25'; /* v8.19", "+ ' · v10.27'; /* v8.19", 'version', p)
s = rep(s, 'function fingerprintUnit(u){returnJSON.stringify(', 'function fingerprintUnit(u){return JSON.stringify(', 'verified equipment identity serialisation', p)
s = rep(s, '</script>\n</body>\n</html>', '</script>\n<script id="equipment1027-adapter">\n' + (Path(__file__).parent / 'adapter1027.js').read_text() + '\n</script>\n</body>\n</html>', 'equipment adapter', p)
p.write_text(s)
