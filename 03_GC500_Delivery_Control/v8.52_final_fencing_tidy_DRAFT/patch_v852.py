#!/usr/bin/env python3
"""Author: Andrew Fisher. Move existing CCB explanation into existing count notes."""
from pathlib import Path
import hashlib,sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
BASE='1c2a663221e3f9d9f0e375905037a427c3b7a2ccb11de3e1077928342aaa92bc'
def build(raw):
    if hashlib.sha256(raw).hexdigest()!=BASE:raise ValueError('Changed base or repeated patch')
    s=raw.decode('utf-8')
    s=rep(s,'${fenceCcbOverview847()}${renderFenceComponents849(todayIso(), "fencing")}','${renderFenceComponents849(todayIso(), "fencing")}', 'Remove exposed classification note','v8.52')
    old="Component feet / blocks are separate from the charged fence-block work column.</p>')"
    new="Component feet / blocks are separate from the charged fence-block work column.</p>' + (scope === 'fencing' ? fenceCcbOverview847() : ''))"
    s=rep(s,old,new,'Keep classification inside Count notes','v8.52')
    s=rep(s,'<meta name="gc500-release" content="v8.51">','<meta name="gc500-release" content="v8.52">','Release metadata','v8.52')
    s=rep(s,"+ ' · v8.51'; /* v8.19 - the footer names the release once */","+ ' · v8.52'; /* v8.19 - the footer names the release once */",'Release footer','v8.52')
    return s.encode('utf-8')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_bytes(build(p.read_bytes()))
