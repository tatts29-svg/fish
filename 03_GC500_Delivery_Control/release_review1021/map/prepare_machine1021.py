"""Author: Andrew Fisher. Retained-machine corrections for the already derived Gate 6 layout.
Run with a private directory containing the six source files and a private output directory.
All unlisted machine files are retained by the publisher; no map tiles or other geometry are changed.
"""
from pathlib import Path
import hashlib,json,sys
HERE=Path(__file__).resolve().parent
SOURCE=next((HERE.parent.parent/name for name in ['v10.20_gate6_compound_LIVE','v10.20_gate6_compound_DRAFT'] if (HERE.parent.parent/name/'gate6_positions_1020.json').is_file()),None)
if SOURCE is None:raise FileNotFoundError('Gate 6 reviewed positions not found in LIVE or DRAFT')
POS=json.loads((SOURCE/'gate6_positions_1020.json').read_text())
BASE={
 'explorer/explorer.js':'eac70fa5b2e6d682f5e8af271f2d47f5ca286f6eb197658d32dc193a8c551cce',
 'explorer/explorer-merge.js':'1747edf7c9a1417c757ff9dceed8e017f26550608a561e6212a34d7b4922daf3',
 'explorer/index.html':'2d61f060ad3ad44696b86be829a2bc93af90502521fa02c3a641a3c507c3264f',
 'explorer/assets/plan_items.json':'63aec0b1835a82226356f31ac557d4a48791a66ccd0b76a7b4a843da5c80fa9a',
 'poc3d/units3d.json':'e7e642f8de49ddc27c4a5bb25963520b429668db7584239478ac83de3a1389b1',
 'poc3d/index.html':'c463bf4afaa37c28a2b78e83e1c7461e569dea88a2f890948060b8af7e0a35ba',
}
sha=lambda raw:hashlib.sha256(raw).hexdigest()
def prepare(source):
    out={}
    for name,digest in BASE.items():
        raw=(source/name).read_bytes()
        if sha(raw)!=digest:raise ValueError('Machine source changed: '+name)
        out[name]=raw.decode()
    def once(name,old,new):
        if out[name].count(old)!=1:raise ValueError('Expected one '+name+' anchor '+old[:80])
        out[name]=out[name].replace(old,new)
    snap=[];old=[]
    for ref,p in POS['refs'].items():
        polys=[unit['p'] for unit in p['shape']['c']]
        snap.append({'ref':ref,'pt':p['new']['pt'],'polygons':polys})
        # The old polygons are recovered by the exact shift between stored centres, not rounded display metres.
        dx=p['shape']['k'][0]-p['old']['shape_centre_pt'][0]
        dy=p['shape']['k'][1]-p['old']['shape_centre_pt'][1]
        old.append({'ref':ref,'pt':p['old']['pt'],'polygons':[[[round(x-dx,7),round(y-dy,7)] for x,y in poly] for poly in polys]})
    js='explorer/explorer.js';merge='explorer/explorer-merge.js'
    code='const GATE6_SNAPSHOT1021='+json.dumps(snap,separators=(',',':'))+';\nconst GATE6_OLD1021='+json.dumps(old,separators=(',',':'))+';\n'+(HERE/'overlay1021.js').read_text()
    once(js,'boot();\nwindow.__marksCount',code+'\nboot();\nwindow.__marksCount')
    once(js,'  drawMarks(v);','  drawGate6Revision1021(ctx,S2D,dpr);\n  drawMarks(v);')
    once(js,'    if(window.GC500FencingMap)window.GC500FencingMap.exportLayer(g,','    drawGate6Revision1021(g,EX,width/sw);\n    if(window.GC500FencingMap)window.GC500FencingMap.exportLayer(g,')
    once(js,"const pReg = getJSON('assets/register.json'), pSnap = getJSON('assets/plan_items.json', {cache: 'no-cache'});", "const pReg = getJSON('assets/register.json'), pSnap = getJSON('assets/plan_items.json?v=gate6-1021', {cache: 'no-cache'});")
    once(merge,"      ${info && info.pinned ?", "      ${(info&&info.revision1021)||GATE6_SNAPSHOT1021.some(r=>r.ref===code)?'<div class=\"xc-s\">iEDM Gate 6 layout · 14 Oct 2026 · approximate; master D001 not reissued.</div>':''}\n      ${info && info.pinned ?")
    snapname='explorer/assets/plan_items.json';s=json.loads(out[snapname]);seen=[]
    for item in s['items']:
        ref=item.get('key')
        if ref not in POS['refs']:continue
        if item['pt']!=POS['refs'][ref]['old']['pt']:raise ValueError('Unexpected snapshot position: '+ref)
        item['pt']=POS['refs'][ref]['new']['pt'];item['placedHow']='Revised Gate 6 · approximate';seen.append(ref)
    assert set(seen)==set(POS['refs']) and len(seen)==5
    s['note']=s.get('note','')+'; five Gate 6 drawing positions updated from the iEDM layout of 14 Oct 2026; approximate, master D001 not reissued. Other snapshot data unchanged.'
    out[snapname]=json.dumps(s,ensure_ascii=False,separators=(',',':'))+'\n'
    name='poc3d/units3d.json';s=json.loads(out[name]);seen=[]
    for pin in s['pins']:
        ref=pin.get('k')
        if ref in POS['refs']:pin['ll']=POS['refs'][ref]['new']['ll'];seen.append(ref)
    assert set(seen)==set(POS['refs']) and len(seen)==5
    s['source']+='; P60/P62/P63/WC49/GN06 use the revised iEDM Gate 6 layout of 14 Oct 2026 (approximate; master D001 not reissued)'
    out[name]=json.dumps(s,ensure_ascii=False,separators=(',',':'))+'\n'
    once('poc3d/index.html',"fetch('units3d.json')", "fetch('units3d.json?v="+sha(out[name].encode())[:12]+"')")
    for name in [js,merge]:
        short=Path(name).name
        once('explorer/index.html',short+'?v='+BASE[name][:12],short+'?v='+sha(out[name].encode())[:12])
    return out

if __name__=='__main__':
    source,target=map(Path,sys.argv[1:3]);files=prepare(source);evidence={'author':'Andrew Fisher','files':{}}
    for name,content in files.items():
        raw=content.encode();p=target/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(raw)
        evidence['files'][name]={'base':BASE[name],'sha256':sha(raw),'bytes':len(raw)}
    (target/'source-bound.json').write_text(json.dumps(evidence,indent=2)+'\n');print(json.dumps(evidence))
