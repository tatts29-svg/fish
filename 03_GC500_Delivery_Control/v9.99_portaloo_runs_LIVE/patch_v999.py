"""Author: Andrew Fisher. Fill same-day portaloo delivery runs to 24 across locations."""
import hashlib
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA = 'a72ab6662a237194c09d8dd9671856fa97409ac97a53cf8b94c97f6063df5d0c'
def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v9.98; refuses repeat application')
    text = rep(text,
        "l.type==='portable'&&l.side===row.side&&(mode!=='demob'||l.outDate===(row.outDate||''))&&l.units<24",
        "l.type==='portable'&&(mode==='inbound'||l.side===row.side)&&(mode!=='inbound'||l.deliveryDate999===(row.date||''))&&(mode!=='demob'||l.outDate===(row.outDate||''))&&l.units<24",
        'Fill compatible inbound runs across island boundaries', 'v9.99')
    text = rep(text,
        "side:row.side||'unknown',outDate:row.outDate||'',units:0,panels:0,stops:[],proposed:true",
        "side:row.side||'unknown',...(mode==='inbound'?{deliveryDate999:row.date||''}:{}),outDate:row.outDate||'',units:0,panels:0,stops:[],proposed:true",
        'Keep each recorded delivery date separate', 'v9.99')
    text = rep(text,
        "load.stops.push(stop);load.units+=amount;if(type==='panel')load.panels+=amount;left-=amount;offset+=amount;",
        "load.stops.push(stop);if(mode==='inbound'&&load.side!==(row.side||'unknown'))load.side='mixed';load.units+=amount;if(type==='panel')load.panels+=amount;left-=amount;offset+=amount;",
        'Mixed-area inbound runs retain their actual stop locations', 'v9.99')
    return rep(text, "+ ' · v9.98'", "+ ' · v9.99'", 'Release footer', 'v9.99')
if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
