"""Author: Andrew Fisher. v13.07 dashboard tab responsiveness.
Build from the exact v13.06 page; preserve all operational/financial data and the machine manifest.
"""
import hashlib, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
from patch_build1307 import patch as build
from patch_deferred1307 import apply as deferred
from patch_phone_tabs1307 import apply as captions

def patch(text,path):
    if 'demobDecorationsActive1307' in text:
        raise SystemExit('v13.07 is already applied')
    expected='1017be1594f6c9660838d6440dfb125c9399de99519fae3866a7af8fdd2caa52'
    if hashlib.sha256(text.encode()).hexdigest()!=expected:
        raise SystemExit('v13.07 requires the verified exact live v13.06 base; rebase before applying')
    text=build(text,path)
    text=deferred(text,path)
    text=captions(text,path)
    return rep(text,"+' · v13.06'; /* v8.19 release922","+' · v13.07'; /* v8.19 release922",'v13.07 footer',path)

if __name__=='__main__':
    page=Path(sys.argv[1])
    page.write_text(patch(page.read_text(),str(page)))
    print('v13.07 tab responsiveness applied')

