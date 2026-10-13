"""Author: Andrew Fisher. Explicit selection Save and legible controls; retain shared truth."""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
sys.path.insert(0, str(HERE / 'numbers'))
from patch_percentage1012 import apply as percentage_patch
from patch_inventory1012 import apply as inventory_patch
BASE_SHA = 'a37381b49fec5317fb9b354b7eee2e314f3c6e15215449314e9f1a14c9303557'

def apply(html):
    if hashlib.sha256(html.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.11; refuses repeat or wrong-base application')
    html = inventory_patch(percentage_patch(html))
    html = rep(html, "flash(ref+' · '+loading872Words(side)+' saved.');", "flash(bump.kept===false?'Not saved · keep this page open.':ref+' · '+loading872Words(side)+' saved on this device.');", 'Accurate loading save notice', 'v10.12')
    handling = [line for line in html.splitlines() if line.startswith('function handling875Set(ref,method){')]
    if len(handling) != 2:
        raise ValueError('Expected the original and expanded unloading setters')
    for index, line in enumerate(handling):
        revised = line.replace("flash(ref+' · '+handling875Words(method)+' saved.');", "flash(bump.kept===false?'Not saved · keep this page open.':ref+' · '+handling875Words(method)+' saved on this device.');")
        if revised == line:
            raise ValueError('Unloading save notice changed')
        html = rep(html, line, revised, 'Accurate unloading save notice '+str(index+1), 'v10.12')
    styles = ['control_contrast1012.css', 'loading_save1012.css', 'selection_save/selection_save1012.css']
    scripts = ['loading_save1012.js', 'selection_save/selection_save1012.js']
    css = '\n'.join((HERE / name).read_text() for name in styles)
    js = '\n'.join('<script id="'+Path(name).stem.replace('_','-')+'-script">\n'+(HERE/name).read_text()+'\n</script>' for name in scripts)
    html = rep(html, '\n</head>', '\n<style id="selection-save1012-style">\n'+css+'\n</style>\n</head>', 'Readable selection controls', 'v10.12')
    html = rep(html, '\n</body>\n</html>', js+'\n</body>\n</html>', 'Explicit selection Save', 'v10.12')
    return rep(html, "+ ' · v10.11'", "+ ' · v10.12'", 'Release footer', 'v10.12')

if __name__ == '__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
