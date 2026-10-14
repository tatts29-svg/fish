"""Author: Andrew Fisher. Apply pure native quantity-scope decode, fold and merge support."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'root.ScopeSync1017=api' in html:
        raise ValueError('Quantity scope sync patch already applied')
    if 'root.Scope1017=api' not in html:
        raise ValueError('Apply quantity projection scope patch first')
    html=rep(html,' if (JSON.stringify(next) === JSON.stringify(c.get())) return false;',
             " if (JSON.stringify(next) === JSON.stringify(c.get()) && (name !== 'qtys' || ScopeSync1017.same(next,S))) return false;",'Invalidate when receipt metadata changes at same numeric quantity','v10.17 quantity sync')
    html=rep(html,' const theirs = {}; names.forEach(name => { theirs[name] = fromDocs(name, SYNC.pending[name]); });',
             ' const theirs = {}; names.forEach(name => { theirs[name] = fromDocs(name, SYNC.pending[name]); });\n ScopeSync1017.attach(theirs);','Keep remote receipt metadata in remote merge input','v10.17 quantity sync')
    return rep(html,'\n</body>\n</html>','\n<script id="quantity-scope-sync1017-script">\n'+(HERE/'scope_sync1017.js').read_text()+'\n</script>\n</body>\n</html>','Quantity metadata transport runtime','v10.17 quantity sync')
