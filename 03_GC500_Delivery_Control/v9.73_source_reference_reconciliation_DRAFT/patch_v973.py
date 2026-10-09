# Author: Andrew Fisher. Apply verified original-source links to existing projections.
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

p = Path(sys.argv[1])
raw = p.read_bytes()
s = raw.decode('utf-8-sig')
assert 'source-reference973-script' not in s, 'v9.73 already applied'
assert " · v9.71'; /* v8.19" in s, 'Requires live v9.71'
assert 'const Reference966 =' in s and 'const Questions967=' in s, 'Requires shared reference and Questions projections'
def change(old, new, why):
    global s
    s = rep(s, old, new, why, str(p))

change(' const readsAsEquipment = !!text && hasDim && inDesc;\n return {', ' const readsAsEquipment = !!text && hasDim && inDesc;\n const destination973 = {', 'Prepare the existing written destination for reviewed source evidence')
change(' moved: moved,\n };\n}\n/* Kept for every renderer', " moved: moved,\n };\n return typeof window!=='undefined'&&window.Reference973?window.Reference973.destination(a,destination973):destination973;\n}\n/* Kept for every renderer", 'All written destinations share the exact original-source match')
for name, prefix, result in [
    ('dest782', ' if (!a) return null;\n', 'null'),
    ('noDrop782', ' if (!a || a.key === REPORT_REF782) return false;\n', 'false'),
    ('aerialPointFor', '', 'null'),
    ('text747WayIn', '', "''"),
]:
    old = 'function ' + name + '(a){\n' + prefix
    change(old, old + " if(typeof window!=='undefined'&&window.Reference973&&window.Reference973.suppressNavigation(a))return " + result + ';\n', 'Keep known off-map destinations out of the pit-lane and legend-point navigation: ' + name)
change('function text747Where(a){\n', "function text747Where(a){\n const place973=typeof window!=='undefined'&&window.Reference973?window.Reference973.sourcePlace(a):null;if(place973)return ['Destination: '+place973.label+'.'];\n", 'Driver text names the supplied off-map destination without guessed GPS')
change('  return {id,key:id,ref:a?.key||id,recordRef:', '  const resolved973={id,key:id,ref:a?.key||id,recordRef:', 'Prepare the shared source-row relationship')
change("sourceRow:row};\n }\n function rows(ctx){", "sourceRow:row};\n  return typeof window!=='undefined'&&window.Reference973?window.Reference973.projectRow(row,resolved973,c):resolved973;\n }\n function rows(ctx){", 'Apply supported associations inside the shared reference resolver')
change("<td data-label=\"Destination\">'+esc(r.location||r.required)+'</td>", "<td data-label=\"Destination\">'+(typeof referenceLocation973Html==='function'?referenceLocation973Html(r):esc(r.location||r.required))+'</td>", 'Linked schedule rows expose their actual supplied source')
change("<td data-label=\"Destination / link\">'+esc(r.location||r.required)+'</td>", "<td data-label=\"Destination / link\">'+(typeof referenceLocation973Html==='function'?referenceLocation973Html(r):esc(r.location||r.required))+'</td>", 'Additional scheduled work exposes source evidence')
s = rep(s, 'return Ownership944.model({ref:a.key,rows,groups});', "const result973=Ownership944.model({ref:a.key,rows,groups});return typeof window!=='undefined'&&window.Identities973?window.Identities973.project(a,result973,window.Identities973.context(a)):result973;", 'Keep the source-only P36 allocation in history behind current site-photo evidence', str(p))
source = '\n'.join((HERE / name).read_text() for name in ('documents973.js', 'references973.js', 'identities973.js', 'questions973.js'))
s = rep(s, '</script>\n</body>\n</html>\n', '</script>\n<script id="source-reference973-script">\n' + source + '\n</script>\n</body>\n</html>\n', 'Link verified supplied original evidence across current references and Questions', str(p))
s = rep(s, " · v9.71'; /* v8.19", " · v9.73'; /* v8.19", 'footer', str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'') + s.encode())
