# Author: Andrew Fisher.
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / 'toolchain'))
from rep import rep

def apply(html):
    if 'id="persistence1010-script"' in html:
        raise SystemExit('v10.10 persistence already applied')
    if 'root.Idle1006={capture,restore,redraw,refreshDrawer};' not in html:
        raise SystemExit('v10.10 persistence needs the v10.06 refresh helpers')
    script = Path(__file__).with_name('persistence1010.js').read_text()
    return rep(html, '\n</body>\n</html>', '<script id="persistence1010-script">\n' + script + '\n</script>\n</body>\n</html>', 'preserve open details on refresh', 'v10.10')
