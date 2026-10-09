# Author: Andrew Fisher
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
p = Path(sys.argv[1]); raw = p.read_bytes(); s = raw.decode('utf-8-sig')
assert 'function compactLoading968(' not in s, 'v9.68 already applied'
assert " · v9.67'; /* v8.19" in s and 'window.Questions967=Questions967;' in s and 'id="questions967-script"' in s, 'Requires v9.67 base'
s = rep(s, '</script>\n</body></html>\n', '</script>\n<style id="timeline968-style">\n' + (HERE/'timeline968.css').read_text() + '\n</style>\n<script id="timeline968-script">\n' + (HERE/'timeline968.js').read_text() + '\n</script>\n</body></html>\n', 'compact Timeline data and persistent optional detail', str(p))
s = rep(s, " · v9.67'; /* v8.19", " · v9.68'; /* v8.19", 'footer', str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'') + s.encode())
