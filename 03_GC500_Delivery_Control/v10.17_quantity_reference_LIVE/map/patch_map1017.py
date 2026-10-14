"""Author: Andrew Fisher. Narrow Concert drawing-coordinate correction; no record writes."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep
def apply_map1017(s):
    if 'function generatorSheetPoint1017(' in s:raise ValueError('Map parent correction already applied')
    if 'function generatorMaster1004(' not in s or 'function descriptionQuantity1012(' not in s:raise ValueError('Expected current generator and quantity source')
    def once(old,new,label):
        nonlocal s
        s=rep(s,old,new,label,'map1017')
    once('function generatorMaster1004(){',(HERE/'concert_projection1017.js').read_text()+'\nfunction generatorMaster1004(){','Exact published drawing inverse')
    once('const p=generatorPlace1004(),pt=ptOf782({key:\'\'},{lat:p.lat,lon:p.lon});','const p=generatorPlace1004(),pt=generatorSheetPoint1017({lat:p.lat,lon:p.lon});','Concert authorised pin projection')
    once("return v?ptOf782({key:''},{lat:v.lat,lon:v.lon}):m.pt;","return v?(generatorSheetPoint1017({lat:v.lat,lon:v.lon})||m.pt):m.pt;",'Later Concert pin uses same drawing projection')
    once('const MapIdentity996 = (() => {',(HERE/'request_plan1017.js').read_text()+'\nconst MapIdentity996 = (() => {','Shared supplier delivery portions for source-only map requests')
    once('  for (const request of supplier.requests) {',"  let deliveryPlan1017=null;try{deliveryPlan1017=typeof supplier.model==='function'?supplier.model():null;}catch(_){}\n  for (const request of supplier.requests) {",'Read the existing supplier plan once')
    once('requestDate:request.date, quantity:request.quantity, item:request.item, _supplier996MapRequest:true});','requestDate:request.date, quantity:request.quantity, item:request.item, _supplier996MapRequest:true,...mapRequestPlan1017(request,deliveryPlan1017)});','Retain current dated delivery portions without changing the original request')
    return s
apply=apply_map1017
if __name__=='__main__':
    Path(sys.argv[2]).write_text(apply_map1017(Path(sys.argv[1]).read_text()))
