"""Author: Andrew Fisher. Phone Map explorer viewport and existing full-screen controls."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='84e993ca45b433746045313ae1921f93ef466bda240d33cbf3d541e4c819006d'
def patch(html):
    if 'MapViewport1196' in html:raise ValueError('v11.96 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=BASE:raise ValueError('Wrong live base; rebuild and retest against current release')
    html=rep(html,"function expTools(){\n return '';\n}","""function expTools(){
 return '<button type="button" class="btn map1196-tools" data-map1196-tools data-ro aria-expanded="false" aria-controls="map1147-controls">Map tools</button><button type="button" class="btn expfullbtn" id="expFull" data-ro aria-pressed="false" aria-controls="expwrap">Full screen</button>';
}""",'restore explorer controls','page')
    html=rep(html,'const height = Math.max(expLandscape834() ? 0 : 200, Math.floor(available));','const height = Math.max(w.closest(\'.expfull\') || expLandscape834() ? 0 : 200, Math.floor(available));','full-screen fit','page')
    html=rep(html,'\n</body>\n</html>','\n<style id="map-viewport1196">\n'+(HERE/'map1196_src.css').read_text()+'\n</style>\n<script>\n'+(HERE/'map1196_src.js').read_text()+'\n</script>\n</body>\n</html>','phone map viewport','page')
    return rep(html,"+' · v11.95'; /* v8.19 release922","+' · v11.96'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.96 phone Map viewport applied')
