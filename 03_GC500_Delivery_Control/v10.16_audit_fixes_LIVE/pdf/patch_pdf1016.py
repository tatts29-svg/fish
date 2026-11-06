"""Author: Andrew Fisher. Keep supplier daily PDF rows readable with dated continuation pages."""
from pathlib import Path
import hashlib,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    start=html.index('S1000.pdf=async function(kind,day,alive=()=>true){')
    end=html.index('\n};\n})();',start)+3
    old=html[start:end]
    if hashlib.sha256(old.encode()).hexdigest()!='84bb60e05fa9c3afe969934a0b9c38622bbeafb7f4adb305dc8e75e24ab4de54':
        raise ValueError('Supplier daily PDF source changed; review before applying v10.16')
    return rep(html,old,(HERE/'supplier_pdf1016.js').read_text().rstrip(),'Readable daily supplier continuation pages','v10.16')
