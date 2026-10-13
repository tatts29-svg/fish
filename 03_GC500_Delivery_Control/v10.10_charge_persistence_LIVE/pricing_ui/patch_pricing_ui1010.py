# Author: Andrew Fisher.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'toolchain'))
from rep import rep

def apply(html):
    if 'id="pricing-ui1010-script"' in html:
        raise ValueError('v10.10 pricing UI already applied')
    if 'window.peePrice1010=function()' not in html or 'window.validatePeeRate1010=' not in html:
        raise ValueError('v10.10 pricing UI needs the shared pricing1010 model first')
    here=Path(__file__).resolve().parent
    html=rep(html,'\n</head>','\n<style id="pricing-ui1010-style">\n'+(here/'pricing_ui1010.css').read_text()+'\n</style>\n</head>','pricing UI styles','v10.10')
    return rep(html,'\n</body>\n</html>','\n<script id="pricing-ui1010-script">\n'+(here/'pricing_ui1010.js').read_text()+'\n</script>\n</body>\n</html>','pricing UI Save','v10.10')
