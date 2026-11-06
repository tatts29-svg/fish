"""Author: Andrew Fisher. Preserve shared reference links and drawer history."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'root.Routes1016=' in html:
        raise ValueError('v10.16 route safeguards already applied')
    for token in ['root.Flows1013=','root.Persistence1010=','function routeReject810(','const Refresh904 = window.GC500Refresh904 =']:
        if token not in html:
            raise ValueError('v10.16 route dependency missing: '+token)
    return rep(html,'\n</body>\n</html>','\n<script id="routes1016-script">\n'+(HERE/'flows1016.js').read_text()+'\n</script>\n</body>\n</html>','Shared reference route and drawer history safeguards','v10.16')
