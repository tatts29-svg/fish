/* v6.66 - THE ROLLS GO TOO (Andrew Fisher, 26 Sep 2026: "with the toilet one, can we see toilet rolls coming out when the door's
   open"). Each time the door swings open, three rolls tumble out of the doorway one after another, carried along at the
   trailer's speed, drop to the road, bounce, and roll to a stop behind it - each one unreeling a streamer of paper along
   the path it took. They are real bodies: gravity, a soft bounce, rolling friction, a spin that matches the ground, a
   tumble while they are in the air. Gone after seven seconds. */
G.looRollParts=function(gl){if(G._rollParts&&G._rollParts.gl===gl)return G._rollParts.parts;
  const K=G.plantKit('balanced'),g=K.group('toilet roll','plantWhite',{color:[.96,.96,.94]}),c=K.group('roll core','plantWhite',{color:[.55,.42,.28]});
  K.tube(g,[0,0,-.05],[0,0,.05],.05,14,false);K.disc(g,[0,0,.05],.018,.05,1,14);K.disc(g,[0,0,-.05],.018,.05,-1,14);K.tube(c,[0,0,-.05],[0,0,.05],.018,10,false);
  const parts=G.finishModel(K.parts,'balanced','toilet roll').parts.map(q=>{const b=new G.MeshBatch(gl,[3,3,2],false);b.v=q.vertices;b.i=q.indices;b.nv=q.vertices.length/8;b.upload();b.v=[];b.i=[];return {name:q.name,material:q.material,color:q.color,batch:b};});
  G._rollParts={gl:gl,parts:parts};return parts;};
G.looRolls=function(S,gl,drawPart,TM){const L=S.loo;if(!L){S.rolls=[];return;}
  const T=S.tune,s=T.carS,H=T.deckH,m=S.sim,now=S.clock,rr=.05*s;
  if(S.rollT!=null&&now<S.rollT-.001){S.rolls=[];S.rollT=now;return;}   /* the scene's clock went back (a replay, a new slide): start clean */
  const dt=Math.max(0,Math.min(.05,now-(S.rollT==null?now:S.rollT)));S.rollT=now;
  /* out of the doorway while it is open: three, a quarter of a second apart */
  const R=S.rolls||(S.rolls=[]);
  if(L.ph==='open'||L.ph==='reach'){if(L.spawnFor!==L.t0){L.spawnFor=L.t0;L.spawnN=0;}const u=now-L.t0;
    while(L.spawnN<3&&u>.15+L.spawnN*.25&&R.length<9){const k=L.spawnN++,lp=[-.30,.60+k*.07,(k-1)*.07],lv=[-1.7-k*.35,1.2+.35*k,(k-1)*.55];
      const X=q=>[TM[0]*q[0]+TM[4]*q[1]+TM[8]*q[2],TM[1]*q[0]+TM[5]*q[1]+TM[9]*q[2],TM[2]*q[0]+TM[6]*q[1]+TM[10]*q[2]],P0=X(lp),V0=X(lv),f=S.pose.fwd;
      const P=[P0[0]+TM[12],P0[1]+TM[13],P0[2]+TM[14]],V=[V0[0]+f[0]*m.v*.9,V0[1],V0[2]+f[2]*m.v*.9];
      R.push({p:P,v:V,spin:0,tum:0,tv:7+k*3,yaw:Math.atan2(V[2],V[0]),born:now,trail:[P.slice()],tt:now});}}
  for(const r of R){if(dt>0){r.v[1]-=T.grav*dt;for(let k=0;k<3;k++)r.p[k]+=r.v[k]*dt;
      if(r.p[1]<H+rr){r.p[1]=H+rr;if(r.v[1]<0)r.v[1]=-r.v[1]*.32;const fr=Math.exp(-dt*3.2);r.v[0]*=fr;r.v[2]*=fr;r.ground=true;}else r.ground=false;
      const hs=Math.hypot(r.v[0],r.v[2]);if(hs>.02)r.yaw=Math.atan2(r.v[2],r.v[0]);r.spin+=hs/rr*dt;r.tum=r.ground?r.tum*Math.exp(-dt*9):r.tum+r.tv*dt;
      if(now-r.tt>.035){r.tt=now;r.trail.push([r.p[0],Math.max(H+.004,r.p[1]-rr*.9),r.p[2]]);if(r.trail.length>44)r.trail.shift();}}}
  S.rolls=R.filter(r=>now-r.born<7);if(!S.rolls.length)return;
  const parts=G.looRollParts(gl),mm=G.matMul;
  for(const r of S.rolls){const cy=Math.cos(r.yaw),sy=Math.sin(r.yaw),ct=Math.cos(r.tum),st=Math.sin(r.tum),cz=Math.cos(-r.spin),sz=Math.sin(-r.spin);
    const M=mm(mm(mm(new Float32Array([s,0,0,0,0,s,0,0,0,0,s,0,r.p[0],r.p[1],r.p[2],1]),new Float32Array([cy,0,sy,0,0,1,0,0,-sy,0,cy,0,0,0,0,1])),
      new Float32Array([1,0,0,0,0,ct,st,0,0,-st,ct,0,0,0,0,1])),new Float32Array([cz,sz,0,0,-sz,cz,0,0,0,0,1,0,0,0,0,1]));
    for(const part of parts)drawPart(part,M,()=>0,new Map());}
  /* the paper: a ribbon down each roll's path, from where it left the door to where it is now */
  const B=S.paperBatch||(S.paperBatch=new G.MeshBatch(gl,[3,3,2],true));B.clear();B.i.length=0;const w=.042*s;
  for(const r of S.rolls){const pts=r.trail.concat([[r.p[0],r.p[1]-rr*.9,r.p[2]]]);
    for(let i=0;i+1<pts.length;i++){const a=pts[i],b=pts[i+1],dx=b[0]-a[0],dz=b[2]-a[2],l=Math.hypot(dx,dz);if(l<1e-4)continue;const nx=-dz/l*w,nz=dx/l*w,n0=B.nv;
      B.vert(a[0]+nx,a[1],a[2]+nz,0,1,0,0,0);B.vert(a[0]-nx,a[1],a[2]-nz,0,1,0,1,0);B.vert(b[0]-nx,b[1],b[2]-nz,0,1,0,1,1);B.vert(b[0]+nx,b[1],b[2]+nz,0,1,0,0,1);B.tri(n0,n0+1,n0+2);B.tri(n0,n0+2,n0+3);}}
  if(B.nv){B.upload();drawPart({name:'toilet paper',material:'plantWhite',color:[.97,.97,.95],batch:B},new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),()=>0,new Map());}
};
