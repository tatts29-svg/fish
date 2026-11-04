"""Author: Andrew Fisher. Exact Build-map hooks for the combined v12.97 patch.

Root patch calls apply(page) once, after adding DemobShapes1297. This helper
changes only the native Build preview adapter, its three-panel composer and the
optional master-plan drawing mark. Existing lifecycle/weather/map modes stay.
"""
from pathlib import Path
import re, sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(page):
    if 'W.BuildShapes1297=Object.freeze' in page:
        raise ValueError('Build outline hooks already applied')

    def r(text, before, after, label):
        return rep(text, before, after, label, 'Build equipment layouts')

    def script(sid, transform):
        nonlocal page
        pattern = re.compile(r'(<script\b[^>]*\bid="' + re.escape(sid) + r'"[^>]*>)(.*?)(</script>)', re.S)
        hits = list(pattern.finditer(page))
        if len(hits) != 1:
            raise ValueError('Expected exactly one ' + sid)
        m = hits[0]
        page = page[:m.start(2)] + transform(m.group(2)) + page[m.end(2):]

    def build(text):
        text = (HERE / 'build_shapes1297_src.js').read_text() + '\n' + text
        text = r(text, "function loc(key){try{return W.Find1176?.locate({kind:'asset',key});}catch(_){return null;}}",
                 "function loc(key){try{return W.BuildShapes1297.prepare(key,W.Find1176?.locate({kind:'asset',key}));}catch(_){return null;}}", 'shared Build source layout')
        text = r(text, 'function valid(L){return !!L&&Number.isFinite(L.lat)&&Number.isFinite(L.lon);}',
                 "function valid(L){return !!L&&Number.isFinite(L.lat)&&Number.isFinite(L.lon)&&L.demob1297?.kind!=='unlocated';}", 'report points are not equipment')
        text = r(text, "W.Find1176?.release,'three1261'].join('|');}",
                 "W.Find1176?.release,'build-layout1297',W.BuildShapes1297.signature(L)].join('|');}", 'Build geometry cache signature')
        text = r(text, "const source=button.querySelector('.b1247-map-copy>small');if(source&&source.textContent!==(L.how||'Recorded location'))source.textContent=L.how||'Recorded location';",
                 "const source=button.querySelector('.b1247-map-copy>small'),words=[L.how||'Recorded location',L.demob1297?.qualification].filter(Boolean).join(' · ');if(source&&source.textContent!==words)source.textContent=words;", 'Build location qualification')
        return text

    def composer(text):
        text = r(text, 'async function drawing(key) {', 'async function drawing(key, L) {', 'drawing receives canonical location')
        text = r(text, "const s = M.spot(key); if (!s) return null;\n    const url = await M.draw(key + '|' + s.fx + ',' + s.fy + (s.exact ? '' : ',a'));",
                 "const id = W.BuildShapes1297?.drawingId(key,L); if (!id) return null;\n    const url = await M.draw(id,L.demob1297);", 'drawing uses current point and source layout')
        text = r(text, '    drawing(key)]);', '    drawing(key,L)]);', 'same context in all three Build maps')
        return text

    def drawing(text):
        text = r(text, 'async function draw(id) {', 'async function draw(id, marker1297) {', 'optional source layout on plan tiles')
        start = text.index(" /* the equipment's own icon on the spot in a neon ring")
        end = text.index(' /* a soft edge so the paper meets the dark card gently */', start)
        original = text[start:end]
        declaration = " const X = OUT.w / 2, Y = OUT.h / 2, R = OUT.w * 0.118, cat = CAT.get(catOf(id.slice(0, id.lastIndexOf('|')))) || CAT.get('other');\n"
        if original.count(declaration) != 1:
            raise ValueError('Expected one original plan icon declaration')
        legacy = original.replace(declaration, '')
        replacement = declaration + ''' if (marker1297) {
  // Exact sheet fractions through the same crop as the existing native plan tiles.
  W.DemobShapes1297?.paint(c,marker1297,{x:X,y:Y,width:OUT.w,height:OUT.h,
   projectSheet:(fx,fy)=>({x:(fx*lv.w-x0)*sc,y:(fy*lv.h-y0)*sc})});
 } else {
''' + legacy + ' }\n'
        return r(text, original, replacement, 'source outlines replace Build plan icon and ring')

    script('buildcards1247-script', build)
    script('threemaps1261-script', composer)
    script('demobmap1236-script', drawing)
    return page
