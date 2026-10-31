"""Author: Andrew Fisher. Extend the existing spot share with a measured area and sourced contents."""
import hashlib,re,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
def patch(html):
    if hashlib.sha256(html.encode()).hexdigest()!= (HERE/'BASE_SHA256').read_text().strip():
        raise ValueError('v12.06 requires the reviewed exact live base; rebase and retest on a changed live page')
    match=re.search(r'<script id="spot1117-script">([\s\S]*?)</script>',html)
    if not match or hashlib.sha256(match[1].encode()).hexdigest()!=(HERE/'SPOT_SHA256').read_text().strip():
        raise ValueError('existing spot source changed')
    code=match[1]
    code=rep(code,"  function words(){\n", "  function words(){\n   if(window.GC500Area1206)return window.GC500Area1206.words();\n",'area words','spot')
    code=rep(code,"  function picture(){\n", "  function picture(){\n   if(window.GC500Area1206)return window.GC500Area1206.picture(window.GC500Area1206.snapshot(S.pin));\n",'area picture','spot')
    code=rep(code,"  async function share(){\n", "  async function share(){\n   if(window.GC500Area1206)return window.GC500Area1206.share();\n",'area sharing','spot')
    code=rep(code,"   c.hidden = false;\n", "   c.hidden = false;\n   if(window.GC500Area1206)window.GC500Area1206.update(p,c);\n",'area card','spot')
    code=rep(code,'Copied: the coordinates, the nearest references and a Maps link.','Copied: the 50 m area, full item list, recorded doors and a Maps link.','copy feedback','spot')
    code=rep(code,"  function clear(){ S.pin = null; place(); renderCard(); }", "  function clear(){ S.pin = null; if(window.GC500Area1206)window.GC500Area1206.update(null); place(); renderCard(); }",'clear area','spot')
    code=rep(code,"  window.GC500Spot1117 = Object.freeze",(HERE/'area1206_frame.js').read_text()+"\n  window.GC500Area1206=areaFrame1206();\n  window.GC500Spot1117 = Object.freeze",'area implementation','spot')
    parent=(HERE/'area1206_parent.js').read_text().replace('__CORE1206__',(HERE/'area1206_core.js').read_text())
    html=rep(html,match[0],'<script id="area1206-script">\n'+parent+'\n</script>\n<script id="spot1117-script">'+code+'</script>','area module and bounded spot extension','page')
    footer=re.search(r"\+' · v(\d+\.\d+)'; /\* v8.19 release922",html)
    if not footer:raise ValueError('release footer missing')
    return rep(html,footer[0],"+' · v12.06'; /* v8.19 release922",'release footer','page')
if __name__=='__main__':
    file=Path(sys.argv[1]);file.write_text(patch(file.read_text()));print('v12.06 map area sharing applied')
