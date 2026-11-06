"""Author: Andrew Fisher. Guarded canonical/current collection-scope projection."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'root.DemobScope1017=api' in html:
        raise ValueError('Demob scope patch already present')
    if 'root.VmsAssignment1016=api' not in html:
        raise ValueError('Reviewed current VMS assignment projection required')
    html=rep(html,"const refs = allAssets().filter(a => !a._cancelled && !rowOff(a.key)).map(a => {", "const refs = DemobScope1017.eligible(physicalCountAssets963(allAssets()).assets,key=>rowOff(key)||movedAway(key)).map(a => {",'Canonical collection references; preserve aliases and relocation history elsewhere','v10.17')
    html=rep(html,'const ed = canEdit(), what = demobDescription988(r.a);','const ed = canEdit(), what = DemobScope1017.description(r,demobDescription988);','Collection description follows current typed unit scope','v10.17')
    return rep(html,'\n</body>\n</html>','\n<script id="demob-scope1017-script">\n'+(HERE/'demob1017.js').read_text()+'\n</script>\n</body>\n</html>','Canonical/current collection-scope runtime','v10.17')
