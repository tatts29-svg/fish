"""Author: Andrew Fisher. Shared charge treatments and cent-exact assurance."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from fix_scope1224 import apply as fix_scope
from fix_source1224 import apply as fix_source
from fix_superseded1224 import apply as fix_superseded
from fix_bulk1224 import apply as fix_bulk
from fix_generator_identity1224 import apply as fix_generator_identity

# Exact verified v12.23; this patch must never land on another publisher's page.
BASE = '8112a63d10c5b6c88206a539af5a59dc1037176e414a95f20d253b16f844e257'

def apply(text):
    if 'id="charge-assurance1224-script"' in text:
        raise SystemExit('v12.24 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE:
        raise SystemExit('v12.24 requires the exact verified v12.23 base')
    text = fix_scope(text)
    text = fix_superseded(text)
    text = fix_source(text)
    text = fix_bulk(text)
    text = fix_generator_identity(text)
    text = rep(text,
        'const diff = {now: M.difference0 != null ? r2(M.difference0) : r2(revNow - costNow), job: r2(revJob - costJob - n(W.job))};',
        'const diff = {now: Number.isFinite(M.difference) ? r2(M.difference) : r2(revNow - costNow), job: r2(revJob - costJob - n(W.job))};',
        'Retain cents in the shared difference model', str(HERE), True)
    text = rep(text, "+' · v12.23'; /* v8.19 release922:", "+' · v12.24'; /* v8.19 release922:", 'Release footer', str(HERE), True)
    blocks = '<style id="charge-assurance1224-style">\n' + (HERE / 'charge_assurance1224_src.css').read_text() + '\n</style>\n'
    for name, ident in [('charge_checks1224_src.js', 'charge-checks1224-script'), ('charge_assurance1224_src.js', 'charge-assurance1224-script')]:
        blocks += '<script id="' + ident + '">\n' + (HERE / name).read_text() + '\n</script>\n'
    return rep(text, '})(window);\n</script>\n</body>\n</html>', '})(window);\n</script>\n' + blocks + '</body>\n</html>', 'Charge assurance', str(HERE), True)

if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text()))
