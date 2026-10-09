# Author: Andrew Fisher
import os,sys
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','toolchain'))
from rep import rep as shared_rep

def rep(s,old,new):
    return shared_rep(s,old,new,"Supplier current shared records",__file__)

def apply_subhire975(s):
    if 'const Subhire975=' in s: raise RuntimeError('Subhire975 already applied')
    if 'function renderSubhired936Held()' not in s: raise RuntimeError('Wrong base')
    s=rep(s,"+(companyChoice925==='event-portables'?ep819Html():'');", "+(companyChoice925==='event-portables'?Subhire975.html():'');")
    s=rep(s,"esc925(u.identityReview||u.name||'Open unit')", "esc925(u.identityReview||(u.owner==='coates'?'Coates':'Sub-hired · '+company925(u.owner))+' · '+(u.physical?'Identified unit':'Planned identity'))")
    s=rep(s,'${P.on} recorded on site · ${P.left} still to arrive','${P.on} recorded on site · supplier balance ${P.left} (includes unallocated supply)')
    src=open(os.path.join(os.path.dirname(__file__),'subhire975.js')).read()
    return rep(s,'</body>\n</html>\n', '<script id="subhire975-script">\n'+src+'\n</script>\n</body>\n</html>\n')
