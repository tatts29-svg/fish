  /* 7. v6.65 - the overhead bridge on the main straight (Andrew Fisher, 26 Sep 2026, describing the event's overhead
     structures: a steel truss across the track that doubles as a pedestrian crossing, its face wrapped in high-visibility
     orange bordered in sharp black, with bold white capitals). Drawn in that style with Coates words - COATES GC500 2026 -
     not the event sponsor's. Two stair towers stand behind the barriers either side; a few spectators on the walkway. */
  {let best=null,run=null;for(let s=0;s<CL.L;s+=.5){const straight=Math.abs(S.kAt(s))<.014;
     if(straight){if(!run)run={a:s,b:s};run.b=s;}else if(run){if(!best||run.b-run.a>best.b-best.a)best=run;run=null;}}
   if(run&&(!best||run.b-run.a>best.b-best.a))best=run;
   const gs=S.gridS,far=s=>Math.min(Math.abs(s-gs),CL.L-Math.abs(s-gs))>9;
   /* several places along the straight, and the towers stepped back until the ground is clear of buildings */
   const cands=best?[.38,.5,.62,.78,.26,.88].map(k=>best.a+(best.b-best.a)*k).filter(far):[];let done=false;
   cands.forEach(s=>{if(done)return;const eL=edge(s,1),eR=edge(s,-1);if(!eL||!eR)return;const t=eL.t,p=eL.p,f=[t[0],t[1]],nL=eL.n;
     const off=e=>{for(const x of [.95,1.4,1.9,2.5]){const d=e.d+x,q=[p[0]+e.n[0]*d,p[1]+e.n[1]*d];if(clear(q)&&clear([q[0]+f[0]*.3,q[1]+f[1]*.3])&&clear([q[0]-f[0]*.3,q[1]-f[1]*.3]))return d;}return null;};
     const dl=off(eL),dr=off(eR);if(dl==null||dr==null)return;done=true;
     const A=[p[0]+nL[0]*dl,p[1]+nL[1]*dl],Bp=[p[0]-nL[0]*dr,p[1]-nL[1]*dr];
     const y0=H+1.15,y1=H+1.85,DK=[.42,.44,.47,1],STL=[.55,.58,.62,.95],BLK=[.02,.02,.025,1],ORB=[.95,.30,.02,1];
     const P=(q,y,off)=>[q[0]+f[0]*off,y,q[1]+f[1]*off];
     /* the walkway deck and the truss: top and bottom chords on both faces, verticals and diagonals */
     dquad(P(A,y0,-.28),P(Bp,y0,-.28),P(Bp,y0,.28),P(A,y0,.28),DK);
     const span=Math.hypot(A[0]-Bp[0],A[1]-Bp[1]),nb=Math.max(4,Math.round(span/.5));
     for(const off of [-.28,.28]){ed.seg(P(A,y0,off),P(Bp,y0,off),STL,STL,.03,.03,.8);ed.seg(P(A,y1+.06,off),P(Bp,y1+.06,off),STL,STL,.03,.03,.8);
       for(let i=0;i<=nb;i++){const q=[A[0]+(Bp[0]-A[0])*i/nb,A[1]+(Bp[1]-A[1])*i/nb],q2=[A[0]+(Bp[0]-A[0])*(i+1)/nb,A[1]+(Bp[1]-A[1])*(i+1)/nb];
         ed.seg(P(q,y0,off),P(q,y1+.06,off),STL,STL,.018,.018,.6);if(i<nb)ed.seg(P(q,y0,off),P(q2,y1+.06,off),STL,STL,.014,.014,.5);}}
     for(let i=0;i<=nb;i+=2){const q=[A[0]+(Bp[0]-A[0])*i/nb,A[1]+(Bp[1]-A[1])*i/nb];ed.seg(P(q,y1+.06,-.28),P(q,y1+.06,.28),STL,STL,.016,.016,.5);}
     /* the wrap on both faces: black border, orange field, white capitals */
     const mid=[(A[0]+Bp[0])/2,(A[1]+Bp[1])/2],W=span*.94,Hh=y1-y0,words='COATES  GC500 2026',cols=words.length*6-1;
     for(const sg of [-1,1]){const fc=[f[0]*sg,f[1]*sg],c=[mid[0],(y0+y1)/2,mid[1]],cc=[c[0]+f[0]*sg*.30,c[1],c[2]+f[1]*sg*.30];
       panel(cc,fc,W,Hh,BLK,0);panel(cc,fc,W-.10,Hh-.10,ORB,.004);text(cc,fc,words,Math.min(Hh*.55/7,(W-.3)/cols),WH,.009);}
     /* stair towers behind the barriers: a scaffold frame and two flights each */
     for(const Q of [A,Bp]){const r=[-f[1],f[0]];
       for(const [a,b] of [[-.3,-.3],[-.3,.3],[.3,-.3],[.3,.3]]){const q=[Q[0]+f[0]*a+r[0]*b,Q[1]+f[1]*a+r[1]*b];ed.seg([q[0],H,q[1]],[q[0],y0+.5,q[1]],STL,STL,.022,.022,.6);}
       dquad(P(Q,H,-.30),P(Q,y0*.5+H*.5,.30),[Q[0]+f[0]*.30+r[0]*.18,y0*.5+H*.5,Q[1]+f[1]*.30+r[1]*.18],[Q[0]-f[0]*.30+r[0]*.18,H,Q[1]-f[1]*.30+r[1]*.18],DK);
       dquad([Q[0]+f[0]*.30-r[0]*.18,y0*.5+H*.5,Q[1]+f[1]*.30-r[1]*.18],[Q[0]-f[0]*.30-r[0]*.18,y0,Q[1]-f[1]*.30-r[1]*.18],P(Q,y0,-.30),P(Q,y0*.5+H*.5,.30),DK);}
     /* people crossing */
     const pr=G.rng(53);for(let i=0;i<9;i++){const u=.08+pr()*.84,q=[A[0]+(Bp[0]-A[0])*u,A[1]+(Bp[1]-A[1])*u];person([q[0]+f[0]*(pr()-.5)*.35,y0+.01,q[1]+f[1]*(pr()-.5)*.35],pr,1,true);}
     stats.bridges=(stats.bridges||0)+1;stats.bridgeAt=+s.toFixed(1);});}
