# Author: Andrew Fisher
from pathlib import Path
import hashlib
import sys

here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1])
s = p.read_text()
if 'loadcards989-script' in s:
    raise SystemExit('Already applied')
if hashlib.sha256(p.read_bytes()).hexdigest() != '40dc8f6c66079d8910ef5eaa3dd6e98a80b778960f70659d5c2447676d1c6175':
    raise SystemExit('Wrong live base: requires exact v9.88 daily available staff release')
s = rep(s, "+ ' · v9.88'", "+ ' · v9.89 DRAFT'", 'Review version', str(p))
s = rep(s, '</head>\n<body', '<style id="loadcards989-style">' + (here / 'loadcards989.css').read_text() + '</style>\n</head>\n<body', 'Compact load style', str(p))
s = rep(s, '</body>\n</html>', '<script id="loadcards989-script">' + (here / 'loadcards989.js').read_text() + '</script>\n</body>\n</html>', 'Compact load presentation', str(p))
p.write_text(s)
