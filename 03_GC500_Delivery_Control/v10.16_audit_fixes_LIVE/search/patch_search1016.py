"""Author: Andrew Fisher. Current accessory asset numbers share the existing finder."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep

def apply(html):
    if 'id="accessory-search1016-script"' in html:
        raise ValueError('Accessory search already installed')
    for token in ['const oldIndex=finderIndex;finderIndex=function(){return P.index(oldIndex.apply(this,arguments),records());};','function finderPick(i){','function mapQuantity1010(a,state){']:
        if html.count(token)!=1:
            raise ValueError('Requires current finder and quantities: '+token[:60])
    html=rep(html,'<div class="acc"><span><b>${esc(x.type)}</b>${x.qty>1?\' ×\'+x.qty:\'\'}',
                  '<div class="acc" data-accessory1016="${esc(x._accId)}"><span><b>${esc(x.type)}</b>${x.qty>1?\' ×\'+x.qty:\'\'}',
                  'Identify the active accessory row only','v10.16 search')
    return rep(html,'</body>\n</html>','<script id="accessory-search1016-script">\n'+(HERE/'search1016.js').read_text()+'\n</script>\n</body>\n</html>',
               'Install current accessory finder','v10.16 search')
