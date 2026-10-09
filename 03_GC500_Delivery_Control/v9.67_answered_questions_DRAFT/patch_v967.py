# Author: Andrew Fisher. Current-evidence Questions projection only.
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'const Questions967=' not in s and 'questions967-script' not in s, 'v9.67 already applied'
assert " · v9.66'; /* v8.19" in s and 'const Reference966 =' in s, 'Requires v9.66 reference reconciliation'
s=rep(s,'</script>\n</body></html>\n','</script>\n<script id="questions967-script">\n'+(HERE/'questions967.js').read_text()+'\n</script>\n</body></html>\n','Questions follow current supplied evidence',str(p))
s=rep(s," · v9.66'; /* v8.19"," · v9.67'; /* v8.19",'footer',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
