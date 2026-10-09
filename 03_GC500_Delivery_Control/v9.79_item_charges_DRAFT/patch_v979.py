#!/usr/bin/env python3
"""Author: Andrew Fisher. Per-product existing hire and included work."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
from workers979 import apply_workers979
from trackmat979 import apply_trackmat979
from apply_pee_hire979 import apply_pee_hire979
from onsite_complete979 import apply_onsite_complete979
def patch(s):
 if 'item-charges979-script' in s:raise ValueError('Already applied v9.79')
 if "+ ' · v9.78'" not in s:raise ValueError('Requires v9.78')
 s=apply_workers979(s)
 s=apply_trackmat979(s)
 s=apply_pee_hire979(s)
 s=rep(s,"<tbody>'+r.charges.map(c=>","<tbody>'+itemChargesHtml979(a,r.item)+r.charges.map(c=>",'Item hire and included work',__file__)
 s=rep(s,'</body>\n</html>\n','<script id="item-charges979-script">'+(HERE/'item_identity979.js').read_text()+'\n'+(HERE/'item_charges979.js').read_text()+'</script>\n</body>\n</html>\n','Item projection',__file__)
 s=apply_onsite_complete979(s)
 return rep(s,"+ ' · v9.78'","+ ' · v9.79'",'Release footer',__file__)
if __name__=='__main__':
 src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src;out.write_text(patch(src.read_text()))
