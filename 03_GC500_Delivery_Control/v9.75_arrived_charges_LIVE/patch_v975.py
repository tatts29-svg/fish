#!/usr/bin/env python3
"""Author: Andrew Fisher. Shared arrived charges and simplified assignments."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
sys.path.insert(0,str(HERE))
from rep import rep
from apply_finance975 import apply_finance975
from stairs975 import apply_stairs975
from workers975 import apply_workers975
from sync_cache975 import apply_sync_cache975
from subhire975 import apply_subhire975

def patch(s):
 if 'arrival-charges975-script' in s: raise ValueError('v9.75 already applied')
 if "+ ' · v9.74'" not in s: raise ValueError('Requires v9.74')
 s=apply_finance975(s,lambda x,a,b:rep(x,a,b,'Shared charges',__file__))
 s=rep(s,'</body>\n</html>', '<script id="arrival-charges975-script">\n'+(HERE/'arrival_charges975.js').read_text()+'\n</script>\n</body>\n</html>','Charge helper',__file__)
 s=apply_stairs975(s)
 s=apply_workers975(s)
 s=apply_sync_cache975(s)
 s=apply_subhire975(s)
 return rep(s,"+ ' · v9.74'","+ ' · v9.75'",'Release footer',__file__)

if __name__=='__main__':
 src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src
 out.write_text(patch(src.read_text()))
