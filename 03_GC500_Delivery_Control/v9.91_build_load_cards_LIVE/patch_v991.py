# Author: Andrew Fisher
from pathlib import Path
import hashlib
import sys

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1])
s = p.read_text()
if 'loadcards991-script' in s:
    raise SystemExit('Already applied')
if hashlib.sha256(p.read_bytes()).hexdigest() != '4773efd9433b7bf50b824f1c4f3966bfa4e009b99bbd2231ffa0a2c1f35612bf':
    raise SystemExit('Wrong live base: requires exact v9.89 outline icon release')
s = rep(s, "+ ' · v9.89'", "+ ' · v9.91'", 'Review version', str(p))
s = rep(s, '</head>\n<body', '<style id="loadcards991-style">' + (here / 'loadcards991.css').read_text() + '</style>\n</head>\n<body', 'Compact load style', str(p))
s = rep(s, '</body>\n</html>', '<script id="loadcards991-script">' + (here / 'loadcards991.js').read_text() + '</script>\n</body>\n</html>', 'Compact load presentation', str(p))
p.write_text(s)
