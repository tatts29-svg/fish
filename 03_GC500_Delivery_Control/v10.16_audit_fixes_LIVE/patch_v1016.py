"""Author: Andrew Fisher. Apply verified audit fixes to the exact current live source."""
from pathlib import Path
import hashlib, importlib.util, sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE_SHA='bc7885b1bed08bafd75353ec3666ca9a4c52a59d17ad3bb0eb5896f011586f67'
PARTS=('flows','vms','search','quantities','pdf','presentation','recovery','waiver','branch')
def apply(html):
    if hashlib.sha256(html.encode()).hexdigest()!=BASE_SHA:
        raise ValueError('Requires exact live v10.15; changed or repeated base refused')
    for part in PARTS:
        path=HERE/part/('patch_'+part+'1016.py')
        spec=importlib.util.spec_from_file_location('audit1016_'+part,path)
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        html=module.apply(html)
    return rep(html,"+ ' · v10.15'","+ ' · v10.16'",'Audited release footer','v10.16')
if __name__=='__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
