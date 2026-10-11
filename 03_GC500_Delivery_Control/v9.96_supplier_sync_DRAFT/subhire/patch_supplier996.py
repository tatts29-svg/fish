# Author: Andrew Fisher. Shared supplier projection; native records remain unchanged.
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def patch(html):
    if 'id="supplier996-script"' in html:
        raise RuntimeError('Supplier996 already applied')
    if 'generatorRefLabel994' not in html or 'const Subhire975=' not in html:
        raise RuntimeError('Supplier996 needs the current v9.94 or later source')
    html=rep(html,"kind==='remaining'?'Remaining deliveries - '+String(n):'Run sheet - Load '+Number(n)","kind==='remaining'?'Remaining deliveries - '+String(n):kind==='supplier-demob'?'Proposed demob run sheets':'Run sheet - Load '+Number(n)",'Demob document title','supplier996')
    html=rep(html,"kind==='remaining'?subhirePdf975(String(n),alive):epLoadPdf860(n,alive)","kind==='remaining'?subhirePdf975(String(n),alive):kind==='supplier-demob'?Supplier996.pdf('demob','',alive):epLoadPdf860(n,alive)",'Current demob document generator','supplier996')
    assets='<style id="supplier996-style">'+(HERE/'supplier996.css').read_text()+'</style>\n'
    for name in ['supplier996','supplier996_pdf','supplier996_ui','supplier996_daily']:
        assets+='<script id="'+name.replace('_','-')+'-script">\n'+(HERE/(name+'.js')).read_text()+'\n</script>\n'
    return rep(html,'</body>\n</html>',assets+'</body>\n</html>','One shared supplier model and views','supplier996')
