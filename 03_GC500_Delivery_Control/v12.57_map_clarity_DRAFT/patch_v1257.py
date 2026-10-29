"""Author: Andrew Fisher. Bounded map-clarity preview on the exact verified predecessor."""
import hashlib
import json
import re
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = '20a81f75b8d47ed1c0d32cf3d5b5e5e79fe1bb5420b2fe459f9d4bbf94c771d5'
FOOT_A = "+' · v12.54.1'; /* v8.19 release922"
FOOT_B = "+' · v12.57'; /* v8.19 release922"

def plan_config(text):
    source = re.findall(r'var PLAN1129 = (\{[^{}]+\});', text)
    if len(source) != 1:
        raise ValueError('exact drawing registration missing')
    cfg = {}
    for name in ('w', 'h', 'k', 'main', 'inset', 'insetRect'):
        pattern = (r'\[\[.*?\]\]' if name in ('main', 'inset') else r'\[[^\]]+\]' if name == 'insetRect' else r'[-+0-9.eE]+')
        match = re.search(r'\b'+name+r':\s*('+pattern+r')', source[0])
        if not match:
            raise ValueError('drawing registration field missing: '+name)
        cfg[name] = json.loads(match.group(1))
    return cfg

def replacements(text):
    source = (HERE / 'map_clarity1257.js').read_text().rstrip()
    css = (HERE / 'map_clarity1257.css').read_text().rstrip()
    questions = (HERE / 'questions1257.js').read_text().rstrip().replace('__PLAN1257__', json.dumps(plan_config(text), separators=(',', ':')))
    return [
        ("let ready=false,filter='auto',paints=0,shown=[],lastAreas=[];", "let ready=false,filter='off',paints=0,shown=[],lastAreas=[];", 'areas default off'),
        ("if(filter==='off'||(filter==='auto'&&!toiletsOn())||window.GC500FencingMap?.active||document.body.classList.contains('in3d'))return;", "if(filter==='off'||window.GC500FencingMap?.active||document.body.classList.contains('in3d'))return;", 'areas independent of toilet filter'),
        ("const one=filter&&filter!=='auto';", "const one=!!filter;", 'explicit area filter'),
        ("lastAreas=H.areas();const M=", "lastAreas=H.areas().filter(a=>Number(a.id)>=1&&Number(a.id)<=13);const M=", 'only the thirteen servicing areas'),
        ("const all=H.areas();if(id!==''&&id!=='off'&&id!=='auto'&&!all.some(a=>a.id===id&&a.polygons.length))return false;", "const all=H.areas().filter(a=>Number(a.id)>=1&&Number(a.id)<=13);if(id!==''&&id!=='off'&&!all.some(a=>a.id===id&&a.polygons.length))return false;", 'explicit servicing choices'),
        ("label.textContent='Highlight area ';", "label.textContent='Servicing areas ';", 'plain control label'),
        ("select.setAttribute('aria-label','Highlight servicing area');", "select.setAttribute('aria-label','Servicing areas');", 'accessible control label'),
        ("for(const [value,text,disabled] of [['auto','With the toilets · outlines while the Toilets & amenities filter is on',false],['','All areas · separate outlines',false],['off','Hide area highlights',false],...areas().map(a=>[a.id,(a.id==='0'?'':`Area ${a.id} · `)+a.name+(a.polygons.length?'':' · '+a.locationNote),!a.polygons.length])])", "for(const [value,text,disabled] of [['off','Off',false],['','All areas',false],...areas().filter(a=>Number(a.id)>=1&&Number(a.id)<=13).map(a=>[a.id,`Area ${a.id}`,!a.polygons.length])])", 'short servicing selector choices'),
        ("hint.textContent='The servicing areas belong to the toilets: their outlines show while the Toilets & amenities filter is on, or when one area is chosen here. Area numbers match the servicing sheets; outlines group recorded locations, not surveyed boundaries.';", "hint.textContent='Area numbers match the servicing sheets. Outlines group recorded locations, not surveyed boundaries. Choose Off, All areas or one area; equipment filters do not change this choice.';", 'inline servicing hint'),
        ("var ctl = exp.querySelector('#map1147-controls'), note = ctl && ctl.querySelector(':scope > small');", "var ctl = exp.querySelector('#map1147-controls'), note = null; /* v12.57: the servicing hint is shown with its control. */", 'remove duplicated outlines disclosure'),
        ("if(bar&&bar.parentNode===wrap.parentNode)return;if(bar)bar.remove();", "if(bar&&bar.parentNode===wrap.parentNode){win.GC500MapClarity1257?.controls();return;}if(bar)bar.remove();", 'retain overlay controls on redraw'),
        ("wrap.before(bar);if(typeof W.expSize==='function')W.expSize();", "wrap.before(bar);win.GC500MapClarity1257?.controls();if(typeof W.expSize==='function')W.expSize();", 'mount overlay choices in existing bar'),
        ("const left=ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected);", "const left=window.GC500MapClarity1257?.state.showLeft?ITEMS.filter(it=>it.places.length&&states.get(key(it))?.collected):[];", 'departure rings require explicit choice'),
        ("const boxes=marks.flatMap(m=>m.it.places.map(b=>geoRect(b)));", "const boxes=marks.flatMap(m=>m.it.places.filter(b=>!window.GC500MapClarity1257?.state.planVisible||GC500MapClarity1257.onSheet(b)).map(b=>geoRect(b)));", 'fit only visible plan locations'),
        ("  vmsIcons1211();", "  vmsIcons1211();\n"+source+"\n  mapClarityFrame1257();", 'bounded map rendering and explicit controls'),
        ('<script id="mapunits1147-script">', '<style id="map1257-style">\n'+css+'\n</style>\n<script id="mapunits1147-script">', 'map control styles'),
        ('</body>\n</html>', '<script id="questions1257-script">\n'+questions+'\n</script>\n</body>\n</html>', 'read-only recorded pin review'),
        (FOOT_A, FOOT_B, 'release footer'),
    ]

def patch(text, path='page'):
    if 'function mapClarityFrame1257()' in text:
        raise ValueError('v12.57 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA256:
        raise ValueError('v12.57 requires the exact verified live v12.54.1 predecessor')
    for before, after, label in replacements(text):
        if text.count(before) != 1:
            raise ValueError(label + ': exact anchor does not occur once')
        text = text.replace(before, rep(before, before, after, label, path), 1)
    return text

if __name__ == '__main__':
    page=Path(sys.argv[1]);page.write_text(patch(page.read_text(), str(page)))
    print('patch_v1257 applied: bounded map clarity preview')
