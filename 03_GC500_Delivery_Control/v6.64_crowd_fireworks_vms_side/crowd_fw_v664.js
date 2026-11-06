/* v6.64 - PEOPLE, NOT DOTS (Andrew Fisher, 26 Sep 2026: "I want crowd as in people. In the scenes, spectators"). Every
   spectator is a small solid figure now - legs, a shirt, a head, a Coates cap on some, arms up on the ones who are cheering -
   turned to face the circuit and shaded front to back so it reads as a body from the track. The cheering ones bounce and pump
   their fists: the flat shader's mode 12 lifts each vertex by the amount it carries in its uv, on its own phase, from the
   scene clock (still under reduced motion). Eight corners per figure, three to five boxes: small enough for a phone. */
G.meshPerson=function(S,mesh,foot,rnd,s,shirt,skin){
  s=s||1;const C=S._clCoarse||(S._clCoarse=(()=>{const a=[];for(let q=0;q<S.CL.L;q+=1)a.push(S.CL.at(q));return a;})());
  let bd=1e9,bi=0;for(let i=0;i<C.length;i++){const d=(C[i][0]-foot[0])*(C[i][0]-foot[0])+(C[i][1]-foot[2])*(C[i][1]-foot[2]);if(d<bd){bd=d;bi=i;}}
  let fx=C[bi][0]-foot[0],fz=C[bi][1]-foot[2];const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;const rx=fz,rz=-fx;
  const ph=rnd()*6.283,cheer=rnd(),jump=cheer<.45?.011*s:0,h=(.95+rnd()*.12)*s;
  const PANTS=[[.10,.11,.14,1],[.20,.24,.34,1],[.32,.27,.20,1],[.06,.06,.07,1]][(rnd()*4)|0];
  const CAP=rnd()<.35?[.90,.17,.02,1]:(rnd()<.35?[.95,.95,.94,1]:null);
  const box=(dx,w,d,y0,y1,col,a0,a1)=>{const n=mesh.nv,W=w/2,D=d/2,ox=foot[0]+rx*dx,oz=foot[2]+rz*dx;
    for(const [yy,amp,lift] of [[y0,a0,.88],[y1,a1,1.06]])for(const [a,b] of [[-W,-D],[W,-D],[W,D],[-W,D]]){const k=(b>0?1:.70)*lift;
      mesh.vert(ox+rx*a+fx*b,foot[1]+yy,oz+rz*a+fz*b,Math.min(1,col[0]*k),Math.min(1,col[1]*k),Math.min(1,col[2]*k),col[3],ph,amp);}
    for(const [a,b,c,d2] of [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]]){mesh.tri(n+a,n+b,n+c);mesh.tri(n+a,n+c,n+d2);}};
  box(0,.052*s,.032*s,0,.13*h,PANTS,0,jump);
  box(0,.072*s,.040*s,.13*h,.237*h,shirt,jump,jump);
  box(0,.036*s,.036*s,.242*h,.283*h,skin,jump,jump);
  if(CAP)box(0,.041*s,.044*s,.276*h,.293*h,CAP,jump,jump);
  if(cheer<.30){box(-.047*s,.018*s,.018*s,.20*h,.33*h,shirt,jump,jump+.02*s);box(.047*s,.018*s,.018*s,.20*h,.33*h,shirt,jump,jump+.02*s);}
  else if(cheer<.50){box(.047*s,.018*s,.018*s,.20*h,.33*h,shirt,jump,jump+.02*s);box(-.044*s,.016*s,.018*s,.13*h,.235*h,skin,jump,jump);}
  else{box(-.044*s,.016*s,.018*s,.13*h,.235*h,skin,jump,jump);box(.044*s,.016*s,.018*s,.13*h,.235*h,skin,jump,jump);}
  mesh.people=(mesh.people||0)+1;
};
/* v6.64 - FIREWORKS AT NIGHT, AND THEY SPELL IT OUT (Andrew Fisher, 26 Sep 2026: "fireworks, and when they splatter in the view
   it spells Coates GC500 2026 - highlight that scene when it happens, camera moves to view it by far"). After dark, every fifty
   seconds of the scene's clock: five shells climb from behind the circuit, burst, and their stars fly out and settle into the
   words COATES GC500 2026 in the sky - about 660 m across, above the towers - hold and glitter, then droop and fade, with
   loose peony bursts round them. While they burst the camera cuts out to a far shot that frames the words over the skyline,
   drifts across them, and cuts back to the race. Not under reduced motion; not by day. */
G.FW={first:10,every:50,text:'COATES GC500 2026',sp:1.1,alt:60};
G.fireworksPlan=function(S){
  if(S.fwPlan)return S.fwPlan;const CL=S.CL,H=S.tune.deckH;let cx=0,cz=0,n=0;for(let s=0;s<CL.L;s+=2){const p=CL.at(s);cx+=p[0];cz+=p[1];n++;}cx/=n;cz/=n;
  const g=CL.at(S.gridS);let fx=g[0]-cx,fz=g[1]-cz;const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;
  const F=[cx,H+G.FW.alt,cz],r=[fz,-fx],sp=G.FW.sp,str=G.FW.text,cols=str.length*6-1,dots=[];
  [...str].forEach((ch,ci)=>{const gl=DRESS_FONT[ch];if(!gl)return;for(let j=0;j<7;j++)for(let i=0;i<5;i++)if(gl[j][i]==='#'){const a=(-cols/2+ci*6+i+.5)*sp,b=(3-j)*sp;dots.push({p:[F[0]+r[0]*a,F[1]+b,F[2]+r[1]*a],a:a});}});
  const shells=[-.4,-.2,0,.2,.4].map(k=>{const a=k*cols*sp;return {a:a,burst:[F[0]+r[0]*a,F[1]+(k*k*4),F[2]+r[1]*a],launch:[F[0]+r[0]*a*1.05-fx*6,H,F[2]+r[1]*a*1.05-fz*6]};});
  dots.forEach(d=>{let best=0,bd=1e9;shells.forEach((s2,i)=>{const dd=Math.abs(d.a-s2.a);if(dd<bd){bd=dd;best=i;}});d.shell=best;});
  return (S.fwPlan={F:F,f:[fx,fz],r:r,W:cols*sp,Ht:7*sp,dots:dots,shells:shells});
};
G.fireworksNow=function(){const S=G.S;if(S)S.fwNext=S.clock;};
/* drawn into a batch of their own: the sky behind them is empty canvas, and a spark added onto nothing has to carry its own
   opacity or it is lost - the scene's additive lines write none */
G.fireworksFrame=function(S){
  const B=S.fwLines||(S.fwLines=new G.LineBatch(S.gl,S.quad,4096,true));B.clear();G.fireworksDraw(S,B,B);B.upload();
};
G.fireworksDraw=function(S,ad,co){
  const L=S.look||{},t=S.clock;
  if(L.day||S.reducedMotion||!S.CL){S.fw=null;return;}
  if(S.fwNext==null||t<(S.fwSeen||0)-1)S.fwNext=t+G.FW.first;S.fwSeen=t;
  if(!S.fw&&t>=S.fwNext){S.fw={t0:t,u:0};S.fwNext=t+G.FW.every;S.fwCount=(S.fwCount||0)+1;}
  if(!S.fw)return;
  const P=G.fireworksPlan(S),u=t-S.fw.t0,sp=G.FW.sp,rise=1.5;
  S.fw.u=u;S.fw.cam=u>.25&&u<8.4;if(u>9.4){S.fw=null;return;}
  const K=(c,a)=>[c[0]*a,c[1]*a,c[2]*a,a],OR=[1,.45,.08],GOLD=[1,.78,.35],WHITE=[1,.95,.85];
  if(u<rise+.05)P.shells.forEach(s2=>{const at=q=>{const k=Math.max(0,Math.min(1,q/rise)),e=1-(1-k)*(1-k);return [0,1,2].map(i=>s2.launch[i]+(s2.burst[i]-s2.launch[i])*e);};
    const a=at(u),b=at(u-.25);ad.seg(b,a,K(GOLD,0),K(GOLD,1),.05,.30,1.5);co.seg(a,a,K(WHITE,1),K(WHITE,1),.20,.20,1.6);});
  if(u<rise)return;
  const v=u-rise,fly=.95,hold=3.6,fall=2.4,fade=v<fly+hold?1:Math.max(0,1-(v-fly-hold)/fall);
  if(v<.4)P.shells.forEach(s2=>{const f=1-v/.4;ad.seg(s2.burst,s2.burst,K(WHITE,f),K(WHITE,f),1+4*f,1+4*f,4);});
  if(fade>0)P.dots.forEach((d,i)=>{const b=P.shells[d.shell].burst,k=Math.min(1,v/fly),e=1-Math.pow(1-k,3),q=[0,1,2].map(j=>b[j]+(d.p[j]-b[j])*e);
    if(v>fly+hold){const w=v-fly-hold;q[1]-=1.6*w*w;}
    const tw=.72+.28*Math.sin(t*23+i*1.7),a=fade*tw;
    ad.seg(q,q,K(OR,a*1.5),K(OR,a*1.5),sp*.78,sp*.78,3.2);co.seg(q,q,K([1,.92,.75],fade),K([1,.92,.75],fade),sp*.24,sp*.24,1.6);
    if(k<1){const k0=Math.max(0,Math.min(1,(v-.1)/fly)),e0=1-Math.pow(1-k0,3);ad.seg([0,1,2].map(j=>b[j]+(d.p[j]-b[j])*e0),q,K(GOLD,0),K(GOLD,a),sp*.08,sp*.3,1);}
    else if(v<fly+hold&&(i*7+Math.floor(t*6))%11===0)ad.seg(q,[q[0],q[1]-sp*.7,q[2]],K(GOLD,a),K(GOLD,0),sp*.08,sp*.02,1);});
  [[.5,-.62,1.5],[.9,.56,1.4],[1.5,-.22,-1.5],[2.2,.30,1.7],[2.9,-.48,-1.3],[3.5,.64,-1.1]].forEach(([at,ax,ay],bi)=>{const w=v-at;if(w<0||w>2.2)return;
    const c=[P.F[0]+P.r[0]*ax*P.W,P.F[1]+ay*P.Ht,P.F[2]+P.r[1]*ax*P.W],col=[OR,WHITE,GOLD][bi%3],a=Math.max(0,1-w/2.2),R=sp*8*(1-Math.exp(-w*2.6)),sag=.9*w*w;
    for(let q=0;q<44;q++){const th=q*2.39996,y=1-2*(q+.5)/44,rr=Math.sqrt(1-y*y),dx=rr*Math.cos(th),dz=rr*Math.sin(th);
      ad.seg([c[0]+dx*R*.8,c[1]+y*R*.8-sag,c[2]+dz*R*.8],[c[0]+dx*R,c[1]+y*R-sag,c[2]+dz*R],K(col,0),K(col,a),sp*.08,sp*.22,1.2);}});
};
G.fireworksShot=function(S){const P=G.fireworksPlan(S),cv=S.cv,asp=Math.max(.3,((cv&&cv.clientWidth)||16)/((cv&&cv.clientHeight)||9)),vf=38*Math.PI/180,
  hf=2*Math.atan(Math.tan(vf/2)*asp),D=Math.max(P.W/.84/(2*Math.tan(hf/2)),P.Ht/.30/(2*Math.tan(vf/2))),u=(S.fw&&S.fw.u)||0,drift=(u-4.2)*P.W*.010;
  const eye=[P.F[0]+P.f[0]*D+P.r[0]*drift,Math.max(S.tune.deckH+22,P.F[1]-D*.34),P.F[2]+P.f[1]*D+P.r[1]*drift];
  return {eye:eye,tgt:[P.F[0],P.F[1]-P.Ht*1.5,P.F[2]],fov:38};};   /* the words in the top of the frame, the towers under them */
