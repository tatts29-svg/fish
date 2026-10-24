"""Author: Andrew Fisher. Give desktop Map a usable, adjustable viewport."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='2261fdc8c1043bad0ed582fac9240366ef112e1275e4962ced62068089c2de51'
def patch(html):
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:
        raise ValueError('v12.03 requires exact live v12.00; rebase/retest if live has changed')
    old="const height = Math.max(w.closest('.expfull') || expLandscape834() ? 0 : 200, Math.floor(available));"
    new="const height = window.MapViewport1203 ? MapViewport1203.height(available, vh, !!w.closest('.expfull'), expLandscape834()) : Math.max(w.closest('.expfull') || expLandscape834() ? 0 : 200, Math.floor(available));"
    html=rep(html,old,new,'adjustable map height','page')
    html=rep(html,'</script>\n</body>\n</html>','</script>\n<style id="map1203-style">\n'+(HERE/'map1203_src.css').read_text()+'\n</style>\n<script id="map1203-script">\n'+(HERE/'map1203_src.js').read_text()+'\n</script>\n</body>\n</html>','map viewport controls','page')
    return rep(html,"+' · v12.00'; /* v8.19 release922","+' · v12.03'; /* v8.19 release922",'release footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v12.03 map viewport applied')
