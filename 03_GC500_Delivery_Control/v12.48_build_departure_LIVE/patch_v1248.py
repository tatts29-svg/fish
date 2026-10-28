"""Author: Andrew Fisher. Build cards read existing departure status without record changes."""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '1437f56498007f24a7e54acfd23542c2ab2daa0e3fd9aca64941c45753bd47ff'
BASE_VERSION = '12.47'
SOURCE_SHA256 = '3f9d4907b4b8902eec04118924a4e046ee34100446c9ed27fdae477de59abd47'
CSS_SHA256 = '7dc610f38f094f23ab4b1ade123024d04238956158c81b08095570b7cbcfa606'
MODULE_SHA256 = {'map1248_src.js': '7389324ee345c3d72239949e96f4efe3c36c0a7a50d25d8f99d7057b513bfccc', 'map1248_replacements.json': '31cba29d3dc2c5deb61f85ad48bdd0ff8b5128539d35fcdfacbe29b642066478', 'subhired1248_src.js': 'c3727d3287c1fdd3045d911f0a2040bfc11cd0fef3cc27985f317601651e4970', 'subhired1248.css': '8a543c4922faf587e1951c9f30280f474c669e1bc2a18b840a08d87dc5eec604', 'subhired1248_anchors.json': '97b335da1718ea1433d0a47a5f0db0cec79ec69d83da4707922fff01ef8f837e'}
OLD_FOOTER = "+' · v12.47';"
NEW_FOOTER = "+' · v12.48';"
CLOSING = '\n</body>\n</html>\n'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def source(name, expected):
    raw = (ROOT / name).read_bytes()
    if digest(raw) != expected:
        raise ValueError('v12.48 tested source changed: ' + name)
    return raw.decode('utf-8')


def module_replacements():
    sources = {name: source(name, sha) for name, sha in MODULE_SHA256.items()}
    result = []
    for descriptor in ('map1248_replacements.json', 'subhired1248_anchors.json'):
        data = json.loads(sources[descriptor])
        for row in data['replacements']:
            result.append((row['old'], row['new'], row['name']))
    addition = ('<script id="mapdisplay1248-script">\n' + sources['map1248_src.js'] + '\n</script>\n'
                '<style id="subhired1248-style">\n' + sources['subhired1248.css'] + '\n</style>\n'
                '<script id="subhired1248-script">\n' + sources['subhired1248_src.js'] + '\n</script>\n')
    result.append((CLOSING, addition + CLOSING, 'map and supplier departure modules'))
    return result


def replacements():
    js = source('build_departure1248.js', SOURCE_SHA256)
    css = source('build_departure1248.css', CSS_SHA256)
    light = "function timeline841Lights(v){const labels="
    gone = "function timeline841Lights(v){if(v.departed1248)return '<span class=\"tl841-gantry\" data-tl841-stage=\"5\" data-build1248-departed role=\"img\" aria-label=\"'+esc(v.label+'. '+v.why)+'\"><span class=\"tl841-unit reached\">'+timeline841Lamp(true,4,true)+'<small>Finished</small></span></span>';const labels="
    changes = [
        ('function timeline841State(a){', js + '\nfunction timeline841State(a){', 'bounded Build departure module'),
        ('const statuses = g.rows.map(row => timeline841State(row.a));', 'const statuses = g.rows.map(row => BuildDeparture1248.state(row.a, timeline841State(row.a)));', 'Build reference status'),
        ("    '<span class=\"ld-w\"><span class=\"tl846-description\">' + esc(ldWhat(row))", "    BuildDeparture1248.stamp(asset, status) + '<span class=\"ld-w\"><span class=\"tl846-description\">' + esc(ldWhat(row))", 'native departure stamp'),
        (light, gone, 'departure outcome without inferred setup stages'),
        ('const refs = (grp.rows || []).map(r => r && r.a && r.a.key).filter(Boolean);', 'const refs = BuildDeparture1248.activeRows(grp.rows).map(r => r && r.a && r.a.key).filter(Boolean);\n  if (!refs.length) return \x27\x27;', 'booking text for remaining active references only'),
        ('const M = model(iso), L = lines(forLoad(byDay(), iso, refs, grp.carrier, pairer(iso)));', 'const M = model(iso), L = lines(BuildDeparture1248.bookingEntries(forLoad(byDay(), iso, refs, grp.carrier, pairer(iso)), refs));', 'do not reassign ambiguous historical bookings'),
        (CLOSING, '<style id="builddeparture1248-style">\n' + css + '\n</style>' + CLOSING, 'existing dark-card departure stamp contrast'),
        (OLD_FOOTER, NEW_FOOTER, 'release footer'),
    ]
    return changes + module_replacements()


def exact(text, old, new, what, path):
    if text.count(old) != 1:
        raise ValueError(what + ': source anchor must occur once')
    changed = rep(old, old, new, what, path)
    if changed != new:
        raise ValueError(what + ': bounded replacement changed its boundary')
    return text.replace(old, new, 1)


def reverse(text):
    for old, new, what in reversed(replacements()):
        text = exact(text, new, old, 'reverse ' + what, 'page')
    if digest(text.encode('utf-8')) != BASE_SHA256:
        raise ValueError('v12.48 reversal did not recover the exact live predecessor')
    return text


def patch(text, path='page', expected_base_sha=None, expected_base_version=None):
    expected = expected_base_sha or os.environ.get('GC500_V1248_BASE_SHA256', '')
    version = expected_base_version or os.environ.get('GC500_V1248_BASE_VERSION', '')
    if 'var BuildDeparture1248 =' in text or 'id="builddeparture1248-style"' in text:
        raise ValueError('v12.48 already applied')
    if expected != BASE_SHA256 or digest(text.encode('utf-8')) != expected:
        raise ValueError('v12.48 requires the explicit exact reviewed v12.47 base SHA-256')
    if version != BASE_VERSION or text.count(OLD_FOOTER) != 1 or NEW_FOOTER in text:
        raise ValueError('v12.48 requires the explicit predecessor version and footer 12.47')
    if not text.endswith(CLOSING):
        raise ValueError('v12.48 final document boundary changed')
    changed = text
    for old, new, what in replacements():
        changed = exact(changed, old, new, what, path)
    original_styles = re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
    retained_styles = [x for x in re.findall(r'<style\b[^>]*>[\s\S]*?</style>', changed) if not any('id="'+name+'"' in x for name in ('builddeparture1248-style','subhired1248-style'))]
    if retained_styles != original_styles or reverse(changed) != text:
        raise ValueError('v12.48 changed content outside its bounded display changes')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    original = page.read_bytes()
    changed = patch(original.decode('utf-8'), str(page))
    page.write_bytes(changed.encode('utf-8'))
    print('patch_v1248 applied; exact reversal and original styles preserved')
