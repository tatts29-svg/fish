"""Author: Andrew Fisher. Show recorded door-lock progress in the main servicing indicators."""
import hashlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

BASES = {'d286f3a53f56574a016cb8505d8164b7631b70ec9cc038f9ebe8cb3591afa7e4': 'v12.22'}

def patch(text):
    assert '/* v12.23 lock percentage */' not in text, 'Already applied'
    version = BASES.get(hashlib.sha256(text.encode()).hexdigest())
    assert version, 'Wrong verified live base'
    text = rep(text, "var JOBS1123 = ['pump', 'clean', 'refill'];",
               "var JOBS1123 = ['pump', 'clean', 'refill', 'lockup']; /* v12.23 lock percentage */",
               'include existing lock counts in rings and area chips', 'page')
    text = rep(text, '<style id="svc1102-style">',
               '<style id="svc1102-style">\n/* v12.23 preserve the dark servicing face and isolate lock indicators from header branding. */\n@media screen{#pane-servicing #svc1067-host::after{background:inherit}#svc1067 .svc1123-job.lockup,#svc1067 .svc1123-chip.lockup{grid-area:auto;order:0;flex-direction:row;align-self:auto;overflow:visible}#svc1067 .svc1123-job.lockup{display:flex}#svc1067 .svc1123-chip.lockup{display:inline-flex}}\n',
               'make servicing text legible on its existing dark surface', 'page')
    return rep(text, "+' · " + version + "'; /* v8.19 release922",
               "+' · v12.23'; /* v8.19 release922", 'release footer', 'page')

if __name__ == '__main__':
    file = Path(sys.argv[1])
    file.write_text(patch(file.read_text()))
    print('v12.23 main servicing lock percentage applied')
