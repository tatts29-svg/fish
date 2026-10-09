#!/usr/bin/env python3
"""Author: Andrew Fisher. Source-anchored Showcase photo landmarks only."""
from pathlib import Path
import hashlib, sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep as strict_rep
def rep(s,a,b): return strict_rep(s,a,b,'v9.70 photo landmark replacement',__file__)
BASE_SHA='a271015a9cf6d099b1665d3bcef71bb6fe5b2671d7081739c91b0f04d52205b5'
def patch(s):
    if 'G.photoLandmarks970=' in s: raise ValueError('v9.70 already applied')
    if hashlib.sha256(s.encode()).hexdigest()!=BASE_SHA: raise ValueError('Requires exact live v9.69')
    start=s.index(' /* 7. v6.65 - the overhead bridge on the main straight')
    end=s.index(' stats.corners=corners.map',start)
    s=rep(s,s[start:end],' /* 7. v9.70 - source-anchored photographic bridge and advertising span. */\n G.photoLandmarks970.build(S,{dquad,ed,H,text,panel},stats);\n ')
    s=rep(s,'const g=DRESS_FONT[ch];if(!g)return;','const g=DRESS_FONT[ch]||DRESS_FONT[ch.toUpperCase()];if(!g)return;')
    s=rep(s,'G.dressCircuit=function(S,k){',Path(__file__).with_name('landmarks970.js').read_text()+'\nG.dressCircuit=function(S,k){')
    s=rep(s,"+ ' · v9.69'","+ ' · v9.70'")
    return s
if __name__=='__main__':
    src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src;out.write_text(patch(src.read_text()))
