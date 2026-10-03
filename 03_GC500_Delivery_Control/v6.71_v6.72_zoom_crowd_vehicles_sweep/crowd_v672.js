/* v6.72 - SPECTATORS WITH SHAPE (Andrew, 26 Sep 2026: "detail of the crowd needs improving"). The v6.64 figure was five
   boxes - a block of trousers, a block of shirt, a cube for a head - and up close it read as toy bricks. Each spectator is
   now built to human proportions in metres and scaled to the scene: two legs (long pants or shorts with bare shins) on
   shoes, a torso that widens from the waist to the shoulders, a neck, a head, hair in one of four colours (or a cap with a
   brim, or a bucket hat), sunglasses on some, a team band across some shirts, arms at the sides with sleeves and bare
   forearms - or up in the air, one of them holding a phone to film the cars - and one in fourteen is a child. The same
   cheering bounce as before (the flat shader's mode 12 lifts each vertex by the amount in its uv). On the Balanced detail
   level (phones) the small parts - shoes, glasses, bands, the split sleeves - are left off, so a phone draws about what it
   drew before; on High and Ultra every figure has them. */
G.meshPerson=function(S,mesh,foot,rnd,s,shirt,skin){
  s=s||1;const C=S._clCoarse||(S._clCoarse=(()=>{const a=[];for(let q=0;q<S.CL.L;q+=1)a.push(S.CL.at(q));return a;})());
  let bd=1e9,bi=0;for(let i=0;i<C.length;i++){const d=(C[i][0]-foot[0])*(C[i][0]-foot[0])+(C[i][1]-foot[2])*(C[i][1]-foot[2]);if(d<bd){bd=d;bi=i;}}
  let fx=C[bi][0]-foot[0],fz=C[bi][1]-foot[2];const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;const rx=fz,rz=-fx;
  const hq=!(S.quality&&S.quality.name==='balanced');
  const ph=rnd()*6.283,cheer=rnd();let h=(.95+rnd()*.12)*s;if(rnd()<.07)h*=.64;
  const M=.1657*h,J=cheer<.45?.011*s:0,UP=J+.02*s;
  const PANTS=[[.10,.11,.14,1],[.20,.24,.34,1],[.32,.27,.20,1],[.06,.06,.07,1],[.42,.40,.36,1]][(rnd()*5)|0];
  const shorts=rnd()<.42,SHOE=rnd()<.5?[.90,.90,.88,1]:[.07,.07,.08,1];
  const HAIR=[[.07,.05,.04,1],[.24,.15,.08,1],[.56,.41,.22,1],[.70,.68,.64,1]][(rnd()*4)|0];
  const hr=rnd(),CAP=hr<.30?(rnd()<.55?[.90,.17,.02,1]:(rnd()<.5?[.95,.95,.94,1]:[.06,.06,.07,1])):null,BUCKET=!CAP&&hr<.40?(rnd()<.5?[.86,.80,.62,1]:[.90,.17,.02,1]):null,bald=!CAP&&!BUCKET&&rnd()<.06;
  const band=hq&&rnd()<.30?(shirt[0]>.8&&shirt[2]<.2?[.05,.05,.06,1]:[.90,.17,.02,1]):null;
  /* a tapered box: (w0 x d0) at y0 rising to (w1 x d1) at y1, all in metres, dx across and df towards the track */
  const tb=(dx,df,w0,d0,w1,d1,y0,y1,col,a0,a1)=>{const n=mesh.nv,ox=foot[0]+(rx*dx+fx*df)*M,oz=foot[2]+(rz*dx+fz*df)*M;
    for(const [yy,W,D,amp,lift] of [[y0,w0/2,d0/2,a0,.88],[y1,w1/2,d1/2,a1,1.06]])for(const [a,b] of [[-W,-D],[W,-D],[W,D],[-W,D]]){const k=(b>0?1:.70)*lift;
      mesh.vert(ox+(rx*a+fx*b)*M,foot[1]+yy*M,oz+(rz*a+fz*b)*M,Math.min(1,col[0]*k),Math.min(1,col[1]*k),Math.min(1,col[2]*k),col[3],ph,amp);}
    for(const [a,b,c,d2] of [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7]]){mesh.tri(n+a,n+b,n+c);mesh.tri(n+a,n+c,n+d2);}};
  const B=(dx,df,w,d,y0,y1,col,a0,a1)=>tb(dx,df,w,d,w,d,y0,y1,col,a0,a1);
  /* feet and legs */
  const y0=hq?.07:0;
  if(hq){B(-.09,.05,.12,.27,0,.075,SHOE,0,0);B(.09,.05,.12,.27,0,.075,SHOE,0,0);}
  for(const sd of [-1,1]){if(shorts){tb(.09*sd,0,.11,.13,.12,.14,y0,.53,skin,0,J*.6);tb(.09*sd,0,.15,.17,.16,.18,.53,.92,PANTS,J*.6,J);}
    else tb(.09*sd,0,.12,.14,.16,.18,y0,.92,PANTS,0,J);}
  /* torso, waist to shoulders, and the band across the chest */
  tb(0,0,.33,.20,.44,.24,.88,1.47,shirt,J,J);
  if(band)B(0,0,.43,.245,1.27,1.34,band,J,J);
  /* neck, head, and what is on it */
  if(hq)B(0,0,.10,.10,1.45,1.53,skin,J,J);tb(0,.012,.17,.20,.18,.21,1.51,1.75,skin,J,J);
  if(CAP){B(0,0,.20,.23,1.69,1.80,CAP,J,J);B(0,.15,.19,.10,1.69,1.71,CAP,J,J);}
  else if(BUCKET)tb(0,0,.30,.32,.21,.23,1.66,1.81,BUCKET,J,J);
  else if(!bald)B(0,-.018,.19,.225,1.63,1.785,HAIR,J,J);
  if(hq&&rnd()<.35)B(0,.118,.16,.014,1.615,1.66,[.03,.03,.035,1],J,J);
  /* arms: down at the sides (a sleeve and a bare forearm), or up - one of the raised hands holding a phone to film the cars */
  const armDown=sd=>{if(hq){B(.265*sd,0,.11,.12,1.20,1.45,shirt,J,J);B(.27*sd,0,.085,.09,.84,1.21,skin,J,J);}else B(.265*sd,0,.10,.11,.86,1.45,shirt,J,J);};
  const armUp=(sd,phone)=>{if(hq)B(.265*sd,0,.11,.12,1.32,1.54,shirt,J,J);B(.27*sd,0,.085,.09,hq?1.53:1.32,2.03,skin,J,UP);
    if(phone)B(.27*sd,.03,.08,.03,1.99,2.13,[.05,.05,.06,1],UP,UP);};
  if(cheer<.30){armUp(-1,false);armUp(1,false);}
  else if(cheer<.50){armUp(1,hq&&rnd()<.4);armDown(-1);}
  else{armDown(-1);armDown(1);}
  mesh.people=(mesh.people||0)+1;
};
