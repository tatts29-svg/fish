"""Author: Andrew Fisher. Apply authoritative VMS moves to current physical projections."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'root.VmsAssignment1016=' in html:
        raise ValueError('VMS assignment patch already present')
    html=rep(html,'function gcModel925(a,options){return model925(a,nativeEnv925(options));}', 'function gcModel925(a,options){const result=model925(a,nativeEnv925(options));return window.VmsAssignment1016?VmsAssignment1016.model(a,result):result;}','Current VMS identity projection across lexical and exported consumers','v10.16')
    return rep(html,'\n</body>\n</html>','\n<script id="vms-assignment1016-script">\n'+(HERE/'vms1016.js').read_text()+'\n</script>\n</body>\n</html>','Reviewed VMS movement projection','v10.16')
