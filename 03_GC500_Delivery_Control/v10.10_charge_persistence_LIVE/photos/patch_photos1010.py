"""Author: Andrew Fisher. FWF photos by location; keep physical identities and photo documents."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep
def once(page,old,new):return rep(page,old,new,'FWF location photos','v10.10')
def apply(page):
 if 'const FwfPhotos1010 =' in page:raise ValueError('FWF photo patch already present')
 anchor='<script id="items933-script">'
 page=once(page,anchor,'<script id="fwf-photos1010-script">\n'+(HERE/'fwf_photos1010.js').read_text()+'\n</script>\n'+anchor)
 page=once(page,'function cardPhotos(a,u,model){const photos=',"function cardPhotos(a,u,model){if(FwfPhotos1010.isFwf(u.item)&&FwfPhotos1010.group(a,model))return '';const photos=")
 page=once(page,".concat(ItemPhotos965.assigned(a,model,photos)).map(p=>p.id)",".concat(ItemPhotos965.assigned(a,model,photos),FwfPhotos1010.photos(a,model,photos)).map(p=>p.id)")
 old="(quantity965?ItemPhotos965.card(a,quantity965):g.units.map(u=>rowHtml925(a,u,model)).join(''))"
 new="(FwfPhotos1010.isFwf(g.item)?FwfPhotos1010.card(a,model)+g.units.map(u=>rowHtml925(a,u,model)).join(''):"+old[1:-1]+")"
 page=once(page,old,new)
 page=once(page,"const reason=item933.quantityOnly?ItemPhotos965.guard(","const reason=item933.fwfGroup1010?FwfPhotos1010.guard(key,item933.unitId,slot,item933.expected,item933.replace):item933.quantityOnly?ItemPhotos965.guard(")
 page=once(page,"function friendly(ref,id){if(!id)return 'Location';const q=", "function friendly(ref,id){if(!id)return 'Location';const fwf=FwfPhotos1010.parse(id);if(fwf&&fwf.ref===ref)return 'FWF at '+ref;const q=")
 page=once(page,"(e.unit ? ' · asset ' + e.unit : '') + '. The shared record has confirmed it.'", "(e.unit ? ' · ' + (FwfPhotos1010.parse(e.unit)?Items933.friendly(e.key,e.unit):'asset '+e.unit) : '') + '. The shared record has confirmed it.'")
 return page
if __name__=='__main__':Path(sys.argv[2]).write_text(apply(Path(sys.argv[1]).read_text()))
