#!/usr/bin/env python3
"""Author: Andrew Fisher. Transport uses current reviewed physical identity."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
sys.path.insert(0,str(HERE))
from rep import rep
from apply_transport_identity977 import apply_transport_identity977
from other_transport_sources977 import apply_other_transport_sources977
from transport_item977 import apply_transport_item977
def patch(s):
 if 'transport-identity977-script' in s: raise ValueError('Already applied v9.77')
 if "+ ' · v9.76'" not in s: raise ValueError('Requires v9.76')
 s=apply_other_transport_sources977(s)
 s=apply_transport_identity977(s,lambda x,a,b:rep(x,a,b,'Physical transport identity',__file__))
 s=rep(s,'</body>\n</html>\n','<script id="transport-identity977-script">\n'+(HERE/'transport_identity977.js').read_text()+'\n</script>\n</body>\n</html>\n','Transport identity',__file__)
 s=apply_transport_item977(s)
 return rep(s,"+ ' · v9.76'","+ ' · v9.77'",'Release footer',__file__)
if __name__=='__main__':
 src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src
 out.write_text(patch(src.read_text()))
