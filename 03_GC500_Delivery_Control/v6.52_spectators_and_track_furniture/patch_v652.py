#!/usr/bin/env python3
"""v6.52 - SPECTATORS, AND MORE OF A RACE TRACK (Andrew Fisher, 26 Sep 2026: "Enhance it more if we can more detail. Push your
limits. Add spectators.").

The grandstands the fencing schedule names get a crowd you can see - people, not eleven warm dots a tier: a body and a
head each, shirts in a spread of colours with a run of Coates orange, some with a flag up - twenty-eight a tier, six
tiers, and a roof over each stand on four posts with a Coates orange band along the back wall. Spectators line the
fence outside the barrier either side of every stand. Marshal posts stand at the six sharpest corners, a white hut with an
orange top and a yellow flag. A start gantry spans the track at the grid: five lamps that come on one at a time while the
car sits on the line, go out together, and show green for three seconds as it launches. And the camera flashes in the
crowd at night, which v5.40 broke by replacing the list of crowd points with a drawing batch, flash again from where the
people now stand. Everything is placed by rule from the key plan, exactly as the stands were, and the credit line still
says the backdrop is decoration.

  python3 patch_v652.py <page.html> <bundle gc3d_bundle.js>
"""
import os, re, sys
page, bundle = sys.argv[1], sys.argv[2]

def rep(text, old, new, what, path):
    # tolerant of leading indentation AND of runs of spaces inside a line: the page's copy of the bundle collapses both
    pat = '\\n'.join('[ \\t]*' + '\\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \\t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

EDITS = [
 ('batches',
  "  const mesh=S.standMesh=new G.MeshBatch(gl,[3,4,2],false),ed=S.standEdge=new G.LineBatch(gl,S.quad,2048,false),cw=S.crowd=new G.LineBatch(gl,S.quad,4096,false);",
  """  const mesh=S.standMesh=new G.MeshBatch(gl,[3,4,2],false),ed=S.standEdge=new G.LineBatch(gl,S.quad,2048,false),cw=S.crowd=new G.LineBatch(gl,S.quad,4096,false);
  /* v6.52 - the people (bodies and heads, drawn like the trackside edges so they read solid by day and lit at night), the
     stands' decoration in its own mesh so its colours are not tinted as walls, and the points the night flashes come from */
  const pp=S.people=new G.LineBatch(gl,S.quad,8192,false),dec=S.standDecor=new G.MeshBatch(gl,[3,4,2],false),crowdPts=S.crowdPts=[];
  const SHIRTS=[[.95,.95,.95,.95],[.16,.20,.26,.95],[1,.42,.08,.95],[1,.42,.08,.95],[.22,.42,.75,.95],[.85,.15,.12,.95],[.18,.55,.32,.95],[.93,.86,.30,.95],[.40,.24,.55,.95],[.62,.62,.66,.95]];
  const SKIN=[[.93,.78,.64,1],[.76,.58,.42,1],[.55,.38,.26,1],[.98,.86,.74,1]];
  const person=(p,rnd,scale)=>{const s=scale||1,shirt=SHIRTS[(rnd()*SHIRTS.length)|0],skin=SKIN[(rnd()*SKIN.length)|0],h=.26*s*(.9+rnd()*.2);
    const foot=[p[0],p[1],p[2]],neck=[p[0],p[1]+h,p[2]],head=[p[0],p[1]+h+.055*s,p[2]];
    pp.seg(foot,neck,shirt,shirt,.052*s,.046*s,.9);pp.seg(head,head,skin,skin,.048*s,.048*s,.9);
    if(rnd()<.08){const top=[p[0]+(rnd()-.5)*.06,p[1]+h+.30*s,p[2]+(rnd()-.5)*.06],F=[1,.42,.08,.95];pp.seg(neck,top,[.6,.6,.6,.9],[.6,.6,.6,.9],.012,.012,.6);pp.seg([top[0],top[1]-.05,top[2]],top,F,F,.07,.02,.8);}
    if(crowdPts.length<1500&&rnd()<.5)crowdPts.push(head);};
  const dv=(p,c)=>dec.vert(p[0],p[1],p[2],c[0],c[1],c[2],c[3],0,0);
  const dquad=(A,B,C,D,c)=>{const a=dv(A,c),b=dv(B,c),cc=dv(C,c),d=dv(D,c);dec.tri(a,b,cc);dec.tri(a,cc,d);dec.tri(a,cc,b);dec.tri(a,d,cc);};   /* both faces: seen from the track and from above */"""),
 ('the crowd on the treads',
  """      for(let k=0;k<11;k++){                                          /* the crowd: warm, small, on the tread */
        const a=(rnd()-.5)*.94,cy=y0+.07,cp=V(a,b0+(b1-b0)*(.3+rnd()*.5),cy),wm=rnd()<.22,
              c=wm?[.78,.88,1,.62]:[1,.80,.55,.68],r=.055+rnd()*.03;
        cw.seg(cp,cp,c,c,r,r,1.2);
      }""",
  """      for(let k=0;k<5;k++){                                           /* a few warm lamps along the tread, for the night glow */
        const a=(rnd()-.5)*.94,cy=y0+.07,cp=V(a,b0+(b1-b0)*(.3+rnd()*.5),cy),wm=rnd()<.22,
              c=wm?[.78,.88,1,.62]:[1,.80,.55,.68],r=.055+rnd()*.03;
        cw.seg(cp,cp,c,c,r,r,1.2);
      }
      for(let k=0;k<28;k++){                                          /* v6.52 - the crowd: a person a seat, standing on the tread */
        const a=(rnd()-.5)*.96,cp=V(a,b0+(b1-b0)*(.25+rnd()*.5),y0+.02);
        person(cp,rnd,1);
      }"""),
 ('roof, band and flags',
  """    ed.seg(V(-.5,1,HT),V(.5,1,HT),BACK,BACK,.05,.05,.7);             /* the top of the back wall */""",
  """    ed.seg(V(-.5,1,HT),V(.5,1,HT),BACK,BACK,.05,.05,.7);             /* the top of the back wall */
    /* v6.52 - a roof on four posts, a Coates orange band along the back wall, and a flag at each end */
    {const RY=HT+.95,ROOF=[.16,.18,.21,1],POST=[.55,.60,.66,.9],ORANGE=[1,.42,.08,1],WHITE=[.96,.96,.95,1];
     [[-.48,.18],[.48,.18],[-.48,1],[.48,1]].forEach(([a,b])=>ed.seg(V(a,b,b>.5?HT:yAt(b)),V(a,b,RY+(b>.5?0:-.12)),POST,POST,.045,.045,.8));
     dquad(V(-.52,.12,RY-.14),V(.52,.12,RY-.14),V(.52,1.06,RY+.02),V(-.52,1.06,RY+.02),ROOF);
     dquad(V(-.52,1.06,RY+.02),V(.52,1.06,RY+.02),V(.52,1.06,RY-.06),V(-.52,1.06,RY-.06),ROOF);
     dquad(V(-.5,1.001,HT*.62),V(.5,1.001,HT*.62),V(.5,1.001,HT*.80),V(-.5,1.001,HT*.80),ORANGE);
     dquad(V(-.5,1.001,HT*.80),V(.5,1.001,HT*.80),V(.5,1.001,HT*.86),V(-.5,1.001,HT*.86),WHITE);
     [-.5,.5].forEach(e=>{const base=V(e,1,RY),top=V(e,1,RY+.55);ed.seg(base,top,POST,POST,.02,.02,.6);pp.seg([top[0],top[1]-.16,top[2]],top,ORANGE,ORANGE,.16,.03,.9);});}"""),
 ('the fence crowd, marshals and the gantry',
  """  mesh.upload();ed.upload();cw.upload();
  return S.standStats.drawn;""",
  """  /* v6.52 - spectators along the fence either side of every stand, standing behind the outer barrier */
  {const fr=G.rng(23),O=S.outer;
   S.stands.forEach(st=>{const s0=(()=>{let best=0,bd=1e9;for(let s=0;s<CL.L;s+=.8){const p=CL.at(s),d=Math.hypot(p[0]-st.at[0],p[1]-st.at[1]);if(d<bd){bd=d;best=s;}}return best;})();
     for(let ds=-9;ds<=9;ds+=.34){const s=(s0+ds+CL.L)%CL.L,p=CL.at(s),q=CL.at(s+.6),tx=q[0]-p[0],tz=q[1]-p[1],tl=Math.hypot(tx,tz)||1,t=[tx/tl,tz/tl];
       let done=false;
       for(const sg of [1,-1]){const n=[-t[1]*sg,t[0]*sg],gapB=p[2]/2+1.35+fr()*.5,c=[p[0]+n[0]*gapB,p[1]+n[1]*gapB];
         if(G.inPoly(c,O))continue;if(S.heightAt&&S.heightAt(c[0],c[1])>.3)continue;
         if(S.pitPts&&S.pitPts.some(P=>P.some(pt=>Math.hypot(pt[0]-c[0],pt[1]-c[1])<2.2)))continue;
         if(fr()<.72)person([c[0]+(fr()-.5)*.12,H,c[1]+(fr()-.5)*.12],fr,1);done=true;break;}
       if(!done)continue;}});}
  /* v6.52 - marshal posts at the six sharpest corners: a white hut with an orange top and a yellow flag, outside the barrier */
  {const mr=G.rng(29),picks=[];const step=.6;
   for(let s=0;s<CL.L;s+=step){const k=Math.abs(S.kAt(s));let peak=true;for(let d=-6;d<=6;d+=step)if(d!==0&&Math.abs(S.kAt((s+d+CL.L)%CL.L))>k)peak=false;if(peak&&k>.03)picks.push([s,k]);}
   picks.sort((a,b)=>b[1]-a[1]);const chosen=[];for(const [s]of picks){if(chosen.every(c=>Math.min(Math.abs(c-s),CL.L-Math.abs(c-s))>12))chosen.push(s);if(chosen.length>=6)break;}
   S.marshals=[];
   chosen.forEach(s=>{const p=CL.at(s),q=CL.at(s+.6),tx=q[0]-p[0],tz=q[1]-p[1],tl=Math.hypot(tx,tz)||1,t=[tx/tl,tz/tl];
     for(const sg of [1,-1]){const n=[-t[1]*sg,t[0]*sg],gap=p[2]/2+1.6,c=[p[0]+n[0]*gap,p[1]+n[1]*gap];
       if(G.inPoly(c,S.outer))continue;if(S.heightAt&&S.heightAt(c[0],c[1])>.3)continue;
       const W=(a,b,y)=>[c[0]+t[0]*a+n[0]*b,H+y,c[1]+t[1]*a+n[1]*b],WH=[.95,.95,.93,1],OR=[1,.42,.08,1],YEL=[1,.86,.1,.95],POLE=[.7,.7,.7,.9];
       const bx=(x0,x1,z0,z1,y0,y1,col)=>{dquad(W(x0,z0,y0),W(x1,z0,y0),W(x1,z0,y1),W(x0,z0,y1),col);dquad(W(x0,z1,y0),W(x1,z1,y0),W(x1,z1,y1),W(x0,z1,y1),col);
         dquad(W(x0,z0,y0),W(x0,z1,y0),W(x0,z1,y1),W(x0,z0,y1),col);dquad(W(x1,z0,y0),W(x1,z1,y0),W(x1,z1,y1),W(x1,z0,y1),col);dquad(W(x0,z0,y1),W(x1,z0,y1),W(x1,z1,y1),W(x0,z1,y1),col);};
       bx(-.28,.28,0,.5,0,.42,WH);bx(-.3,.3,-.02,.52,.42,.5,OR);
       const pb=W(.34,.1,0),pt=W(.34,.1,1.05);ed.seg(pb,pt,POLE,POLE,.018,.018,.6);pp.seg([pt[0],pt[1]-.2,pt[2]],pt,YEL,YEL,.2,.03,.9);
       person(W(-.1,.62,0),mr,1);person(W(.12,.66,0),mr,1);
       S.marshals.push({s:s,at:c});break;}});}
  /* v6.52 - the start gantry over the grid: two posts, a beam, five lamps the scene lights from the clock */
  {const s=(S.gridS+(S.tune.carS||3.4)*.9)%CL.L,p=CL.at(s),q=CL.at(s+.6),tx=q[0]-p[0],tz=q[1]-p[1],tl=Math.hypot(tx,tz)||1,t=[tx/tl,tz/tl],n=[-t[1],t[0]],hw=p[2]/2+.55,GY=H+2.05,MET=[.62,.66,.72,.95];
   const L1=[p[0]+n[0]*hw,H,p[1]+n[1]*hw],R1=[p[0]-n[0]*hw,H,p[1]-n[1]*hw],L2=[L1[0],GY,L1[2]],R2=[R1[0],GY,R1[2]];
   ed.seg(L1,L2,MET,MET,.06,.05,.9);ed.seg(R1,R2,MET,MET,.06,.05,.9);ed.seg(L2,R2,MET,MET,.07,.07,.9);ed.seg([L2[0],GY-.22,L2[2]],[R2[0],GY-.22,R2[2]],MET,MET,.035,.035,.7);
   S.gantry={lamps:[0,1,2,3,4].map(i=>{const f=(i+1)/6;return [L2[0]+(R2[0]-L2[0])*f,GY-.11,L2[2]+(R2[2]-L2[2])*f];}),goAt:null};
   dquad([L2[0],GY-.30,L2[2]],[R2[0],GY-.30,R2[2]],[R2[0],GY+.02,R2[2]],[L2[0],GY+.02,L2[2]],[.09,.10,.12,1]);
   const band=(y0,y1,col)=>dquad([L2[0]+n[0]*.01,y0,L2[2]+n[1]*.01],[R2[0]+n[0]*.01,y0,R2[2]+n[1]*.01],[R2[0]+n[0]*.01,y1,R2[2]+n[1]*.01],[L2[0]+n[0]*.01,y1,L2[2]+n[1]*.01],col);
   band(GY+.02,GY+.10,[1,.42,.08,1]);}
  mesh.upload();ed.upload();cw.upload();pp.upload();dec.upload();
  return S.standStats.drawn;"""),
 ('draw the people and the decoration',
  """     if(S.pitEdge)S.pitEdge.draw();if(S.pitWall)S.pitWall.draw();if(S.standEdge)S.standEdge.draw();}""",
  """     if(S.pitEdge)S.pitEdge.draw();if(S.pitWall)S.pitWall.draw();if(S.standEdge)S.standEdge.draw();}
   /* v6.52 - the crowd: solid by day; at night drawn quietly, lit by the stands and not glowing like a sign */
   if(S.people&&S.people.n&&tg>0){lines(false,L.day?tg:tg*.22,true,.0006);S.people.draw();}"""),
 ('draw the stands decoration',
  """  if(S.standMesh&&S.standMesh.ni){flat(0,L.mat.walls);S.standMesh.draw();}""",
  """  if(S.standMesh&&S.standMesh.ni){flat(0,L.mat.walls);S.standMesh.draw();}
  if(S.standDecor&&S.standDecor.ni){flat(0,L.mat.kerb);S.standDecor.draw();}   /* v6.52 - roofs, bands, huts, the gantry: their own colours */"""),
 ('flashes from where the people stand + the gantry lamps',
  """  if(show('crowdFlashes')&&S.crowd&&S.crowd.length){
    const R2=fxRnd;
    for(let i=0;i<3;i++){
      if(R2()>.30)continue;
      const c2=S.crowd[(R2()*S.crowd.length)|0];""",
  """  /* v6.52 - the start gantry's lamps, from the scene's own clock: one at a time on the grid, all out at the launch,
     green for three seconds as the car goes */
  if(S.gantry){const m=S.sim||{},t=clock;if(m.go&&S.gantry.goAt==null)S.gantry.goAt=t;if(!m.go)S.gantry.goAt=null;
    const lit=m.go?(t-S.gantry.goAt<3?'g':null):(t>=.5?Math.min(5,Math.floor((t-.5)/.5)+1):0);
    S.gantry.lamps.forEach((p,i)=>{const on=lit==='g'||(lit>0&&i<lit);if(!on){co.seg(p,p,[.25,.25,.28,.6],[.25,.25,.28,.6],.055,.055,1);return;}
      const c=lit==='g'?[.25,1,.45,.95]:[1,.18,.10,.95];ad.seg(p,p,c,c,.28,.28,2);co.seg(p,p,[1,1,1,1],[1,1,1,1],.07,.07,1.4);});}
  const CP=S.crowdPts&&S.crowdPts.length?S.crowdPts:(Array.isArray(S.crowd)?S.crowd:null);   /* v6.52 - the flashes come from the people, not from a drawing batch */
  if(show('crowdFlashes')&&CP&&CP.length){
    const R2=fxRnd;
    for(let i=0;i<3;i++){
      if(R2()>.30)continue;
      const c2=CP[(R2()*CP.length)|0];"""),
]
for path in [bundle, page]:
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    for what, old, new in EDITS: t = rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
