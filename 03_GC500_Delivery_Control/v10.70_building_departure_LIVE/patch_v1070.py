"""Author: Andrew Fisher. Add the settled building rule without changing times or records."""
from pathlib import Path
import sys
import json
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(text,path='<page>'):
    if 'id="departure1070-script"' in text:
        raise ValueError('v10.70 building departure rule is already present')
    if "+ ' · v10.69'" not in text:
        raise ValueError('v10.70 requires the final v10.69 page')
    for marker in ['id="flow891-script"','id="arrival943-script"','function sheet816Before826(iso, L){','function daily821Model(iso){']:
        if text.count(marker)!=1: raise ValueError('Expected one native boundary: '+marker)
    for marker in json.loads((HERE/'native_guards1070.json').read_text()):
        if text.count(marker)!=1: raise ValueError('Native building-policy source changed; review before applying')
    old=" const safety = kind === 'drivers' ? 'The driver completes a JSEA before unloading, on every load. Take 5 before every new task.' : 'Take 5 before every new task.';"
    new=old+"\n const departure1070 = window.BuildingDeparture1070 && idx.some(i=>window.BuildingDeparture1070.load(loads[i],iso)) ? window.BuildingDeparture1070.mailWords(iso,idx.map(i=>loads[i])) : '';"
    text=rep(text,old+"\n const lines = idx.map(i => dpLoadLine(loads[i]));",new+"\n const lines = idx.map(i => dpLoadLine(loads[i]));",'building rule on the bounded PDF email body',path)
    text=rep(text,"...(more > 0 ? [`and ${more} more — each on its own sheet`] : []), '', safety, '', 'Coates Industrial Solutions, GC500 2026'].join('\\n'); };","...(more > 0 ? [`and ${more} more — each on its own sheet`] : []), '', safety, ...(departure1070 ? ['', departure1070] : []), '', 'Coates Industrial Solutions, GC500 2026'].join('\\n'); };",'retain email size handling with building rule',path)
    old="\tDM816.order.forEach(z => { const rs = rows.filter(r => r.zone === z); if (!rs.length) return;"
    new="\tif (window.BuildingDeparture1070 && window.BuildingDeparture1070.inScope(iso) && rows.some(r=>window.BuildingDeparture1070.row(r))) L.splice(2,0,window.BuildingDeparture1070.missing(L.join('\\n'),false),'');\n"+old
    text=rep(text,old,new,'building rule before demob email truncation',path)
    text=rep(text,'\n</body>\n</html>','\n<script id="departure1070-script">\n'+(HERE/'departure1070_src.js').read_text()+'\n</script>\n</body>\n</html>','install building departure output adapters',path)
    return rep(text,"+ ' · v10.69'","+ ' · v10.70'",'release footer',path)

if __name__=='__main__':
    src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src
    out.write_text(patch(src.read_text(),str(src)))
    print('Patched v10.70 building departure rules:',out)
