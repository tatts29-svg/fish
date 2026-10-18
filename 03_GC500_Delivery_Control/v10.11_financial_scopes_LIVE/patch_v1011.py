"""Author: Andrew Fisher. Bounded standalone financial reads; no pricing changes."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

BASE_SHA = '6bc40d8d46b1ca5f936731f17c9d75738c0436c9d1a928e37c94c391a08d0258'

def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.10; refuses repeat or wrong-base application')
    source = (HERE / 'financial_scopes1011.js').read_text()
    html = rep(html, '\n</body>\n</html>', '<script id="financial-scopes1011-script">\n' + source + '\n</script>\n</body>\n</html>', 'Financial calculation scope', 'v10.11')
    return rep(html, "+ ' · v10.10'", "+ ' · v10.11'", 'Release footer', 'v10.11')

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
