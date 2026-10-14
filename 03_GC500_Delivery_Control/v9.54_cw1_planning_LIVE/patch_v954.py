"""Author: Andrew Fisher. Strict v9.53 to v9.54 CW1 source-only patch."""
import json
import sys
from pathlib import Path

BASE=Path(__file__).resolve().parent
sys.path.insert(0,str(BASE.parent/'toolchain'))
from rep import rep
from cw1_954 import apply_cw1

def apply_html(text,path='<candidate>',base_version='9.53',advance_footer=True):
    if 'function cw1Plan954(' in text: raise ValueError('v9.54 already applied')
    before_footer=f" · v{base_version}'; /* v8.19"
    if before_footer not in text or 'function fencingNotes951(' not in text or 'function charges952Html' not in text:
        raise ValueError('Expected reviewed preceding release with fencing951 and customer labour952')
    marker='const DATA = '
    if text.count(marker)!=1:raise ValueError('Expected one DATA declaration')
    start=text.index(marker)+len(marker);data,_=json.JSONDecoder().raw_decode(text[start:])
    before=data['fencing'];after=apply_cw1(before)
    old='"fencing":'+json.dumps(before,ensure_ascii=False,separators=(',',':'))
    new='"fencing":'+json.dumps(after,ensure_ascii=False,separators=(',',':'))
    text=rep(text,old,new,'CW1 reviewed planning source only',path)
    anchor='function cw2Plan803(u){'
    text=rep(text,anchor,(BASE/'cw1_954.js').read_text()+'\n'+anchor,'native CW1 planning evidence renderer',path)
    text=rep(text,"function planUpdateCard(u){ return u && u.code === 'C2'", "function planUpdateCard(u){ if(u && u.code === 'C1' && u.revision === '2026-10-09') return cw1Plan954(u); return u && u.code === 'C2'",'CW1 current-source card',path)
    text=rep(text,'Removal and V gates are inside the card’s metre.', 'Removal and V gates are inside the card’s metre. ${esc(cw1ForecastText954())}', 'forecast visibly qualifies provisional CW1 allowances',path)
    text=rep(text," if (F.behind && F.behind.length) gap(`Fencing behind the programme:"," if (DATA.fencing.source_review954) gap('CW1 fencing: prior task allowances awaiting review', cw1ForecastText954(), 'Andrew — confirm the current scope with John Brett / Advanced');\n if (F.behind && F.behind.length) gap(`Fencing behind the programme:", 'forecast gap preserves unresolved CW1 scope',path)
    text=rep(text,'Existing installation-plan figures keep precedence on their covered dates; signed dockets and site completion remain unchanged.', 'Existing installation-plan figures keep precedence on their covered dates; signed dockets and site completion remain unchanged. CW1 now applies the reviewed 9 October PDF and supplied email; its current task card distinguishes supported updates from prior allowances awaiting review.', 'source-history fold identifies newer CW1 precedence',path)
    if advance_footer:
        text=rep(text,before_footer," · v9.54'; /* v8.19",'v9.54 release footer',path)
    if 'const DATA = {' not in text:raise ValueError('Literal DATA required by publication guard')
    return text

if __name__=='__main__':
    if len(sys.argv)!=2:raise SystemExit('Usage: patch_v954.py candidate.html (requires v9.53)')
    p=Path(sys.argv[1]);raw=p.read_bytes();text=raw.decode('utf-8-sig')
    p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+apply_html(text,str(p)).encode())
