"""Author: Andrew Fisher. One shared record for identities, receipts, charges and staff."""
import hashlib
import importlib.util
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE_SHA='65bba5cb7477816d587cb72025ff256f2eb8c2dbc65eb4087dccc5ad49f4622a'

def apply(text):
    if hashlib.sha256(text.encode()).hexdigest()!=BASE_SHA:
        raise ValueError('Requires exact live v10.05; refuses repeat or wrong-base application')
    for name in ['identity','idle','runs','charges','transport','roster']:
        path=HERE/('patch_'+name+'1006.py')
        spec=importlib.util.spec_from_file_location('v1006_'+name,path)
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        text=module.apply(text)
    return rep(text,"+ ' · v10.05'","+ ' · v10.06'",'Release footer','v10.06')

if __name__=='__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
