#!/usr/bin/env python3
"""Author: Andrew Fisher. Add typed quantities to the shared map-status projection."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep
def apply(page):
 if 'function mapQuantity1010(' in page:raise ValueError('Quantity patch already present')
 page=rep(page,'window.gc500MapStatus1009 = function (keys) {',(HERE/'parent_quantity1010.js').read_text()+'\nwindow.gc500MapStatus1009 = function (keys) {','Map typed quantity model','v10.10')
 old='try { return mapStatus1009Classify(a, deliveryOf(a.key), timeline841State(a), done.has(a.key)); }'
 new='try { const status=mapStatus1009Classify(a, deliveryOf(a.key), timeline841State(a), done.has(a.key));return Object.assign(status,{quantity:mapQuantity1010(a,status.state)}); }'
 return rep(page,old,new,'Shared map quantity projection','v10.10')
if __name__=='__main__':Path(sys.argv[2]).write_text(apply(Path(sys.argv[1]).read_text()))
