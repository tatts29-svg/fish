"""Author: Andrew Fisher. Full daily portaloo runs with geographic order and adjacent verified QR."""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA = 'b899e56b8d76776ed361940a0fd2e968628edee562e274b9b33aa8e10679cdc4'
def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.00; refuses repeat application')
    previous = HERE.parent / 'v10.00_daily_portaloos_LIVE'
    for old, new, label in [('plan1000.js','plan1001.js','Current full daily geographic allocation'),('daily1000.js','daily1001.js','Consecutive days and shared stop order'),('portrait1000.js','portrait1001.js','A4 portrait stops with adjacent verified QR')]:
        before=(previous/old).read_text().strip()
        if old=='portrait1000.js': before=before.replace("author:'Andrew Fisher'","author:'the project manager'")
        text=rep(text,before,(HERE/new).read_text().strip(),label,'v10.01')
    text=rep(text,"const source=rows.filter(r=>integer(r.count)!==null&&r.count>0).slice().sort((a,b)=>(sideOrder[a.side]??2)-(sideOrder[b.side]??2)||text(a.zone).localeCompare(text(b.zone))||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.item.localeCompare(b.item));","const source=rows.filter(r=>integer(r.count)!==null&&r.count>0).slice().sort((a,b)=>(mode==='inbound'?((a.routeOrder??9999)-(b.routeOrder??9999)):0)||(sideOrder[a.side]??2)-(sideOrder[b.side]??2)||text(a.zone).localeCompare(text(b.zone))||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.item.localeCompare(b.item));",'Inbound stops preserve geographic order; demob unchanged','v10.01')
    text=rep(text,"L.stops.map(r=>'<div class=\"supplier996-stop\"><b>'+esc(S996.displayRef(r))", "L.stops.map((r,i)=>'<div class=\"supplier996-stop\"><b>'+(L.mode==='inbound'?'Stop '+(i+1)+' · ':'')+esc(S996.displayRef(r))",'Number inbound stops consistently with PDF','v10.01')
    text=rep(text,"+' × '+esc(r.item)+'</b><span>'+esc(r.location)+'</span><span>'", "+' × '+esc(r.item)+'</b><span>'+esc(r.location)+'</span>'+(L.mode==='inbound'&&r.dispatchUrl&&!r.url?'<small>'+esc(r.dispatchBasis)+'</small>':'')+'<span>'",'Show verified meet-point basis without changing location','v10.01')
    return rep(text,"+ ' · v10.00'","+ ' · v10.01'",'Release footer','v10.01')
if __name__ == '__main__':
    page=Path(sys.argv[1]);page.write_text(apply(page.read_text()))
