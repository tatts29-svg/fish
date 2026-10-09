# Author: Andrew Fisher
import os,sys
sys.path.insert(0,os.path.join(os.path.dirname(__file__),'..','toolchain'))
from rep import rep as shared_rep

def rep(s,old,new):
    return shared_rep(s,old,new,"Supplier current shared records",__file__)

def apply_subhire975(s):
    if 'const Subhire975=' in s: raise RuntimeError('Subhire975 already applied')
    if 'function renderSubhired936Held()' not in s: raise RuntimeError('Wrong base')
    s=rep(s,"+companyHtml925()+(companyChoice925==='event-portables'?ep819Html():'');", "+(companyChoice925==='event-portables'?Subhire975.html():'')+companyHtml925();")
    s=rep(s,"esc925(u.identityReview||u.name||'Open unit')", "esc925(u.identityReview||(u.owner==='coates'?'Coates':'Sub-hired · '+company925(u.owner))+' · '+(u.physical?'Identified unit':'Planned identity'))")
    s=rep(s,'${P.on} recorded on site · ${P.left} still to arrive','${P.on} recorded on site · supplier balance ${P.left} (includes unallocated supply)')
    s=rep(s,"kind==='inventory'?'Inventory print':'Run sheet - Load '+Number(n)","kind==='inventory'?'Inventory print':kind==='remaining'?'Remaining deliveries - '+String(n):'Run sheet - Load '+Number(n)")
    s=rep(s,"kind==='inventory'?epInventoryPdf860(alive):epLoadPdf860(n,alive)","kind==='inventory'?epInventoryPdf860(alive):kind==='remaining'?subhirePdf975(String(n),alive):epLoadPdf860(n,alive)")
    s=rep(s,"' | Still to arrive '+model.summary.fwfSupply.left", "' | Supplier balance (includes unallocated) '+model.summary.fwfSupply.left")
    s=rep(s,"const title=pane.querySelector('[data-unit925-companies] h3'),company=all.find(c=>c.owner===companyChoice925);", "const list975=pane.querySelector('.units925-company-list');if(list975){const fold975=document.createElement('details');fold975.className='units925-edit';fold975.dataset.subhire975Units='';const summary975=document.createElement('summary');summary975.textContent='Equipment units';list975.replaceWith(fold975);fold975.append(summary975,list975);}\n const title=pane.querySelector('[data-unit925-companies] h3'),company=all.find(c=>c.owner===companyChoice925);")
    src=open(os.path.join(os.path.dirname(__file__),'subhire975.js')).read()
    return rep(s,'</body>\n</html>\n', '<script id="subhire975-script">\n'+src+'\n</script>\n</body>\n</html>\n')
