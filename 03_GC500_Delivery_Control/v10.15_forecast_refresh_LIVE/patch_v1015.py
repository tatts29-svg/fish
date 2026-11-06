"""Author: Andrew Fisher. Financial readers invalidate when their document evidence settles."""
from pathlib import Path
import hashlib,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE_SHA='b1bd7bc843632a5ccb99bcead3dfd47a31f2d9810ac1459b4218d1d13d91df7a'

def apply(html):
    if hashlib.sha256(html.encode()).hexdigest()!=BASE_SHA:raise ValueError('Requires exact live v10.14; repeated or changed base refused')
    changes=[
      ("if (!SYNC.backend || !SYNC.backend.files) { DOCS.state = 'none'; return; }", "if (!SYNC.backend || !SYNC.backend.files) { DOCS.state = 'none'; sharedCache975(); return; }", 'Unavailable registry invalidates dependent models'),
      (" DOCS.busy = true; DOCS.state = 'loading'; DOCS.error = null;", " DOCS.busy = true; DOCS.state = 'loading'; DOCS.error = null;\n sharedCache975(); /* v10.15: source evidence is a financial-model dependency, independent of deferred rendering. */", 'Loading registry invalidates dependent models'),
      (" finally { DOCS.busy = false; docsRedraw(); photoRedraw(); }", " finally { DOCS.busy = false; sharedCache975(); docsRedraw(); photoRedraw(); } /* v10.15: ready or failed reads cannot retain an earlier forecast. */", 'Settled registry invalidates before any deferred redraw'),
      ("+ ' · v10.14'", "+ ' · v10.15'", 'Release footer')
    ]
    for old,new,label in changes:html=rep(html,old,new,label,'v10.15')
    return html
if __name__=='__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
