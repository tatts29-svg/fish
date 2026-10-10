# Author: Andrew Fisher
from pathlib import Path
import sys,hashlib
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
if 'past984-script' in s:raise SystemExit('Already applied')
if hashlib.sha256(p.read_bytes()).hexdigest()!='19242957feb45f8abfe098ec096461f80d3ed7b57a887fb6086c666ca201c589':raise SystemExit('Wrong live base')
s=rep(s,"+ ' · v9.83'","+ ' · v9.84'",'version',str(p))
s=rep(s,'</head>\n<body','<style id="past984-style">'+(here/'past984.css').read_text()+'</style>\n</head>\n<body','Past reference appearance',str(p))
s=rep(s,'</body>\n</html>','<script id="past984-script">'+(here/'past984.js').read_text()+'</script>\n</body>\n</html>','Past dated completion',str(p))
p.write_text(s)
