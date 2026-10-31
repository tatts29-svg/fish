#!/usr/bin/env python3
"""Author: Andrew Fisher. Optional render boundaries; original emitters stay default."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def apply(text, path='Showcase HTML'):
    if 'G.buildTrackDetail=function(S,boundary794)' in text:
        raise SystemExit('v7.94 render corridor hooks already applied')
    if 'G.photoRefinement792=' not in text:
        raise SystemExit('v7.94 render corridor requires v7.92')
    pairs = [
      ('G.buildTrackDetail=function(S){', 'G.buildTrackDetail=function(S,boundary794){'),
      (' const gl=S.gl,M=G.M_PER_PT,H=S.tune.deckH;\n const concrete=new G.MeshBatch(gl,[3,4,2],false),posts=new G.MeshBatch(gl,[3,4,2],false),\n wire=new G.MeshBatch(gl,[3,4,2],false),scuffs=new G.MeshBatch(gl,[3,4,2],false);',
       ' const gl=S.gl,M=G.M_PER_PT,H=S.tune.deckH;\n const factory794=boundary794&&boundary794.meshFactory||(()=>new G.MeshBatch(gl,[3,4,2],false)),front794=boundary794?boundary794.frontOffset:.45;\n const concrete=factory794(),posts=factory794(),wire=factory794(),scuffs=factory794();'),
      ('a=[p[0]+na[0]*.45,p[1]+na[2]*.45],b=[q[0]+nb[0]*.45,q[1]+nb[2]*.45],',
       'a=[p[0]+na[0]*front794,p[1]+na[2]*front794],b=[q[0]+nb[0]*front794,q[1]+nb[2]*front794],'),
      (' run(S.outer,1,.30,0);run(S.inner,-1,.22,1);',
       ' run(boundary794?boundary794.outer:S.outer,1,.30,0);run(boundary794?boundary794.inner:S.inner,-1,.22,1);'),
      (' const M=G.M_PER_PT||6,H=S.tune.deckH,runs=[];\n for(const [name,loop,sg,height]of [[\'outer\',S.outer,1,.30],[\'inner\',S.inner,-1,.22]]){',
       ' const M=G.M_PER_PT||6,H=S.tune.deckH,runs=[],corridor794=S.corridor794&&S.corridor794.installing?S.corridor794:null,front794=corridor794?0:.45;\n for(const [name,loop,sg,height]of [[\'outer\',corridor794?corridor794.outer:S.outer,1,.30],[\'inner\',corridor794?corridor794.inner:S.inner,-1,.22]]){'),
      ('a=[P[k][0]+na[0]*.45,H,P[k][1]+na[2]*.45],\n    b=[P[j][0]+nb[0]*.45,H,P[j][1]+nb[2]*.45],',
       'a=[P[k][0]+na[0]*front794,H,P[k][1]+na[2]*front794],\n    b=[P[j][0]+nb[0]*front794,H,P[j][1]+nb[2]*front794],'),
      (' S.photoLabels792=[]; /* preserve the source text calls for the optional typeset layer */',
       ' S.photoLabels792=[];S.bannerRanges794=[]; /* preserve original emission and tag fence-banner ownership only */'),
      (' panel(c,f,L*.96,hb,alt?WH:OR,.004);panel([c[0],c[1]+hb/2-.012,c[2]],f,L*.96,.024,alt?OR:WH,.006);\n text(c,f,words,Math.min(hb*.6/7,L*.86/cols),alt?OR:WH,.009);stats.banners++;}});',
       ' const bannerStart794=S.standDecor.nv,labelStart794=S.photoLabels792.length;\n panel(c,f,L*.96,hb,alt?WH:OR,.004);panel([c[0],c[1]+hb/2-.012,c[2]],f,L*.96,.024,alt?OR:WH,.006);\n text(c,f,words,Math.min(hb*.6/7,L*.86/cols),alt?OR:WH,.009);\n S.bannerRanges794.push({vertexStart:bannerStart794,vertexEnd:S.standDecor.nv,labelStart:labelStart794,labelEnd:S.photoLabels792.length,loop:li,centre:m.slice(),tangent:t.slice(),outward:n.slice()});stats.banners++;}});'),
    ]
    for i,(old,new) in enumerate(pairs):
        text=rep(text,old,new,'Render corridor hook '+str(i+1),path)
    return text

if __name__ == '__main__':
    p=Path(sys.argv[1]);p.write_text(apply(p.read_text(),str(p)))
