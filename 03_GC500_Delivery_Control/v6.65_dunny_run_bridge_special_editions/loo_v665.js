/* v6.65 - THE DUNNY RUN (Andrew Fisher, 26 Sep 2026: "a funny one too - V8 towing a trailer with a portaloo. Make sure it's
   strapped and chained to the trailer to standard. As it goes around the corner the door comes open and you see someone
   sitting in there, and then he closes the door - on each main corner"). The same orange single-axle trailer family as the
   VMS: a deck with rails and stake pockets, the portaloo on it held down by two ratchet straps over the roof to the deck rails
   and a chain from each corner to its tie-down. The door is on the back, hinged on its right edge, with a handle and the red
   ENGAGED flag; inside, a bloke in hi-vis and a hard hat on the throne with the paper. At each of the eight sharpest corners
   the door swings out, holds, he reaches for it, and it slams shut. */
G.looModel=function(quality){
  const cache=G._looModels||(G._looModels={}),level=quality==='balanced'?'balanced':'high';if(cache[level])return cache[level];
  const K=G.plantKit(level),{group,box,rbox,tube,bar,ball,guard,wordmark,quad}=K,L=G.VMS.L,OR='plant',BK='plantBlack',WH='plantWhite';
  const fr=group('trailer frame',OR),st=group('steel','steel'),blk=group('black trim',BK);
  box(fr,-.62,.62,.30,.36,-.46,.46);
  bar(blk,[-.62,.38,-.46],[.62,.38,-.46],.03,.03);bar(blk,[-.62,.38,.46],[.62,.38,.46],.03,.03);bar(blk,[-.62,.38,-.46],[-.62,.38,.46],.03,.03);bar(blk,[.62,.38,-.46],[.62,.38,.46],.03,.03);
  for(const [x,z] of [[-.62,-.46],[-.62,.46],[.62,-.46],[.62,.46],[0,-.46],[0,.46]])tube(blk,[x,.36,z],[x,.40,z],.012,6);
  bar(fr,[.55,.30,-.36],[L-.12,.26,0],.06,.06);bar(fr,[.55,.30,.36],[L-.12,.26,0],.06,.06);bar(fr,[L-.14,.26,0],[L-.02,.25,0],.07,.06);
  box(blk,L-.06,L+.04,.22,.30,-.04,.04);ball(st,[L,.22,0],.03,8);
  tube(st,[L-.45,.18,.07],[L-.45,.48,.07],.022,8);K.wheel(L-.45,.07,.07,.07,.04,{lugs:false,rim:'plantWhite',n:14});
  for(const z of [.55,-.55])guard(fr,0,.19,z,.25,.14,.05,Math.PI-.05,.02);
  K.wheel(0,.19,.55,.19,.13,{lugs:false,rim:'plantWhite',rimR:.6});K.wheel(0,.19,-.55,.19,.13,{lugs:false,rim:'plantWhite',rimR:.6});
  const tl=group('tail lights','lampRed');box(tl,-.66,-.62,.30,.35,-.44,-.34);box(tl,-.66,-.62,.30,.35,.34,.44);
  /* the portaloo: floor, front and side walls (the back is the door), lighter inside, a domed orange roof, a vent, ribs */
  const X0=-.25,X1=.25,Z=.23,Y0=.37,Y1=1.28,T=.018,body=group('portaloo',WH),inside=group('portaloo inside',WH,{color:[.60,.64,.68]}),roof=group('portaloo roof',OR);
  box(body,X0,X1,Y0-.01,Y0+.02,-Z,Z);box(body,X1-T,X1,Y0,Y1,-Z,Z);box(body,X0,X1,Y0,Y1,-Z,-Z+T);box(body,X0,X1,Y0,Y1,Z-T,Z);
  box(inside,X1-T-.003,X1-T,Y0+.02,Y1-.02,-Z+T,Z-T);box(inside,X0+.01,X1-T,Y0+.02,Y1-.02,-Z+T,-Z+T+.003);box(inside,X0+.01,X1-T,Y0+.02,Y1-.02,Z-T-.003,Z-T);
  rbox(roof,0,Y1+.02,0,.28,.05,.26,.5,16,8);tube(group('vent',BK),[.12,Y1+.04,-.14],[.12,Y1+.16,-.14],.018,8);
  for(const x of [-.18,-.06,.06,.18]){box(body,x-.012,x+.012,Y0+.05,Y1-.05,Z,Z+.008);box(body,x-.012,x+.012,Y0+.05,Y1-.05,-Z-.008,-Z);}
  wordmark(-.20,.20,.95,1.05,Z+.009,1,[.90,.17,.02]);wordmark(-.20,.20,.95,1.05,-Z-.009,-1,[.90,.17,.02]);
  /* the throne, and the bloke on it facing the door */
  box(group('pan',WH),.08,X1-T,Y0,.56,-.10,.10);box(group('seat',BK),.06,X1-T,.56,.58,-.11,.11);
  const hv=group('bloke hi-vis','hivis'),jn=group('bloke jeans',BK,{color:[.10,.14,.24]}),sk=group('bloke skin','skin'),hat=group('bloke hard hat',WH);
  for(const z of [-.05,.05]){bar(jn,[.14,.60,z],[-.04,.60,z],.05,.05);bar(jn,[-.04,.60,z],[-.06,.39,z],.045,.045);box(group('boots',BK),-.12,-.02,.37,.41,z-.03,z+.03);}
  rbox(hv,.14,.76,0,.05,.13,.085,.45,12,8);box(group('bloke tape',WH),.088,.192,.72,.74,-.087,.087);
  ball(sk,[.13,.94,0],.045,12);ball(hat,[.13,.975,0],.05,12);box(hat,.07,.20,.962,.968,-.06,.06);
  bar(hv,[.14,.84,-.09],[.02,.72,-.10],.03,.03);quad(group('newspaper',WH,{color:[.86,.85,.80]}),[-.02,.66,-.14],[-.02,.66,.04],[-.02,.84,.04],[-.02,.84,-.14],[-1,0,0]);
  const SH={p:[.14,.84,.09]};bar(group('bloke reaching arm','hivis',{arm:SH}),[.14,.84,.09],[.01,.72,.11],.03,.03);ball(group('bloke hand','skin',{arm:SH}),[0,.715,.11],.022,8);
  /* the door, hinged on its right edge; handle and ENGAGED flag ride on it */
  const HG={p:[X0,0,Z-T]};box(group('portaloo door',OR,{door:HG}),X0-.012,X0,Y0+.02,Y1-.02,-Z+T,Z-T);
  box(group('door handle','steel',{door:HG}),X0-.03,X0-.012,.80,.86,-Z+T+.03,-Z+T+.06);box(group('engaged','lampRed',{door:HG}),X0-.02,X0-.012,1.08,1.12,-Z+T+.03,-Z+T+.10);
  /* restraint to standard: two ratchet straps over the top to the deck rails, and a chain from each corner to a tie-down */
  const strap=group('ratchet straps','hivisPanel');
  for(const x of [-.11,.11]){bar(strap,[x,.39,-.46],[x,Y1+.03,-Z-.012],.006,.045);bar(strap,[x,Y1+.075,-Z+.01],[x,Y1+.075,Z-.01],.045,.006);bar(strap,[x,Y1+.03,Z+.012],[x,.39,.46],.006,.045);box(st,x-.03,x+.03,.62,.68,Z+.012,Z+.035);}
  const ch=group('chains','steel');
  for(const [x,z] of [[X0,-Z],[X0,Z],[X1,-Z],[X1,Z]]){const a=[x,Y0+.03,z],b=[x+(x>0?.30:-.30),.38,z*1.95];for(let i=0;i<7;i++){const t=(i+.5)/7;ball(ch,[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],.014,6);}tube(ch,[b[0],.36,b[2]],[b[0],.40,b[2]],.016,6);}
  return (cache[level]=G.finishModel(K.parts,level,'original parametric portaloo trailer'));
};
/* the door and the arm: at each main corner the door swings out on a spring, holds, he reaches, and it slams shut */
G.looStep=function(S){const m=S.sim,L=S.loo||(S.loo={a:0,av:0,arm:0,ph:'shut',t0:-99,t:S.clock,done:{}});
  const dt=Math.max(0,Math.min(.1,S.clock-L.t));L.t=S.clock;if(!dt)return L;
  const cs=(S.dressStats&&S.dressStats.corners)||[],CLL=S.CL.L,pos=((m.s%CLL)+CLL)%CLL,lap=Math.floor(m.s/CLL);
  if(L.ph==='shut'&&m.go&&m.v>S.tune.vmax*.12)for(const c of cs){const dd=((pos-c+CLL*1.5)%CLL)-CLL/2,key=c+':'+lap;
    if(dd>-2.4&&dd<.4&&!L.done[key]){L.done[key]=1;L.ph='open';L.t0=S.clock;break;}}
  const u=S.clock-L.t0;
  if(L.ph==='open'&&u>1.5)L.ph='reach';if(L.ph==='reach'&&u>1.95)L.ph='close';if(L.ph==='close'&&u>2.9&&L.a<.06)L.ph='shut';
  const tgt=L.ph==='open'||L.ph==='reach'?1.85:0,K=L.ph==='close'?70:95,C=L.ph==='close'?7:9;
  L.av+=((tgt-L.a)*K-L.av*C)*dt;L.a+=L.av*dt;if(L.a<0){L.a=0;L.av=-L.av*.25;}if(L.a>2.1){L.a=2.1;L.av=0;}
  L.arm+=((L.ph==='reach'||L.ph==='close'?1:0)-L.arm)*(1-Math.exp(-dt*(L.ph==='shut'?4:10)));return L;};
G.hingeY=function(M,p,t){const c=Math.cos(t),s=Math.sin(t);return G.matMul(M,new Float32Array([c,0,s,0,0,1,0,0,-s,0,c,0,p[0]-(c*p[0]-s*p[2]),0,p[2]-(s*p[0]+c*p[2]),1]));};
G.hingeZ=function(M,p,t){const c=Math.cos(t),s=Math.sin(t);return G.matMul(M,new Float32Array([c,s,0,0,-s,c,0,0,0,0,1,0,p[0]-(c*p[0]-s*p[1]),p[1]-(s*p[0]+c*p[1]),0,1]));};
/* the shot while the door is open: behind the trailer on the open side, looking in */
G.looShot=function(S){const T=S.trailer,s=S.tune.carS,c=Math.cos(T.hd),si=Math.sin(T.hd),f=[c,si],r=[-si,c],y0=S.tune.deckH;
  return {eye:[T.ax-f[0]*2.9*s-r[0]*1.7*s,y0+1.3*s,T.az-f[1]*2.9*s-r[1]*1.7*s],tgt:[T.ax-f[0]*.25*s,y0+.78*s,T.az-f[1]*.25*s],fov:40};};
