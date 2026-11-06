#!/usr/bin/env python3
"""Author: Andrew Fisher. Reserve actual page numbering before native A4 pagination."""
from pathlib import Path
import sys,re
here=Path(__file__).resolve().parent
sys.path.insert(0,str(here.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8-sig');bom=p.read_bytes().startswith(b'\xef\xbb\xbf')
if 'numbering940' in s:raise SystemExit('Already applied')
m=re.search(r" · v9\.(37|38|39)'; /\* v8.19",s)
if not m:raise SystemExit('Expected release37–39')
s=rep(s,m.group(0)," · v9.40'; /* v8.19",'footer',p)
old=" if(!header||!hero||!foot)return [pg];\n const content="
new=""" if(!header||!hero||!foot)return [pg];
 // Author: Andrew Fisher. numbering940: reserve the visible numbering line before measuring content.
 const reserve=header.querySelector('.dp-pages899')||document.createElement('span');reserve.className='dp-pages899';reserve.textContent='Collect all sheets · Sheet 99 of 99';header.querySelector('.dp-hd-r').append(reserve);
 const content="""
s=rep(s,old,new,'reserve numbering during pagination',p)
s=rep(s,"pages.forEach((p,i)=>{const label=document.createElement('span');label.className='dp-pages899';", "pages.forEach((p,i)=>{const label=p.querySelector('.dp-pages899')||document.createElement('span');label.className='dp-pages899';",'update reserved label',p)
s=rep(s,'function dpFit(root) {',"""// Author: Andrew Fisher. Fit a location reference to its printable band, preserving the sign content.
function plFit940(pg){const ref=pg.querySelector('.pl-ref');if(!ref||!ref.clientWidth)return;const range=document.createRange();range.selectNodeContents(ref);const width=range.getBoundingClientRect().width,available=ref.clientWidth-2;if(width>available&&available>0){const size=parseFloat(getComputedStyle(ref).fontSize);ref.style.fontSize=(size*available/width)+'px';}}
function dpFit(root) {""",'location sign reference fit',p)
s=rep(s,"  if(pg.classList.contains('pl782')||pg.dataset.continuation899)continue;","  if(pg.classList.contains('pl782')){plFit940(pg);continue;}\n  if(pg.dataset.continuation899)continue;",'fit signs during native print preparation',p)
p.write_bytes((b'\xef\xbb\xbf' if bom else b'')+s.encode())
