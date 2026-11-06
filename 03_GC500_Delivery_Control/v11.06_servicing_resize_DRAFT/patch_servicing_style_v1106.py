"""Author: Andrew Fisher. Bounded presentation subpatch; release wrapper owns base/version."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(text):
    if 'id="svc1106-race-style"' in text or 'function areaLabel1106(' in text:
        raise ValueError('v11.06 presentation already installed')
    if 'id="svc1104-race-style"' not in text:
        raise ValueError('v11.06 requires verified v11.04 race presentation')
    def replace(old,new,why):
        nonlocal text
        text=rep(text,old,new,why,'page')
    replace('function areaColor(index){return AREA_COLORS[index%AREA_COLORS.length];}',
      'function areaColor(index){return AREA_COLORS[index%AREA_COLORS.length];}\n'+(HERE/'areaIdentity1106_src.js').read_text().rstrip(), 'canonical existing area identity')
    replace("'+esc(a.name)+'</option>';", "'+esc(areaLabel1106(a))+'</option>';", 'area chooser identity')
    replace("label:'Area '+a.id,size:'area',key:'map-area-'+a.id", "label:areaLabel1106(a),size:'area',key:'map-area-'+a.id", 'area meter accessible identity')
    replace("node.querySelector('strong').textContent=a.name;node.classList.toggle('done',a.savedDone);", "var title=areaTitle1106(a),heading=node.querySelector('strong');if(heading.innerHTML!==title)heading.innerHTML=title;node.classList.toggle('done',a.savedDone);", 'stable canonical card headings')
    replace("node.setAttribute('aria-label',a.name+', '+a.stats.pct+'% complete. Show area on map.');", "node.setAttribute('aria-label',areaLabel1106(a)+', '+a.stats.pct+'% complete. Show area on map.');", 'canonical card accessible identity')
    replace("var used=new Set(),areaHost=q('.svc1099-areas');", "var selectedIndex=m.areas.findIndex(function(a){return a.id===I.filter;});q('.svc1099-area-chooser').style.setProperty('--area-color',selectedIndex<0?'#ff8a32':areaColor(selectedIndex));\n    var used=new Set(),areaHost=q('.svc1099-areas');", 'selected chooser colour matches existing map')
    replace("g.node.classList.toggle('done',a.savedDone);g.node.querySelector", "g.node.classList.toggle('done',a.savedDone);g.node.classList.toggle('selected',I.filter===g.area);g.node.querySelector", 'selected map region outline')
    replace("node.classList.toggle('done',a.savedDone);node.classList.toggle('compact',compact);", "node.classList.toggle('done',a.savedDone);node.classList.toggle('selected',I.filter===a.id);node.classList.toggle('compact',compact);", 'selected map label outline')
    replace('Coloured outlines: servicing locations · green glow: area complete', 'Area colours match the numbered cards · glow + tick: saved complete', 'accurate completion colour key')
    css=(HERE/'servicingRace1106_src.css').read_text()
    if '</style' in css: raise ValueError('invalid embedded style boundary')
    tail=text[text.rfind('</body>'):]
    if not tail.strip().endswith('</html>'): raise ValueError('outer document boundary missing')
    replace(tail,'<style id="svc1106-race-style">\n'+css+'\n</style>\n'+tail,'area identity and race-light refinement')
    return text

if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()),encoding='utf-8')
