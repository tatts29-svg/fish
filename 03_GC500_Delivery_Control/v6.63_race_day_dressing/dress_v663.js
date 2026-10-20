/* v6.63 - RACE-DAY DRESSING (Andrew Fisher, 26 Sep 2026: "improve the detail everywhere - track, and buildings, and stands and
   crowds and barriers and signs"). All of it is decoration and placed by rule, like the stands: tyre walls with a Coates belt
   across the outside of the six sharpest corners, Coates and GC500 2026 banners along the catch fence, braking boards on the
   approach to those corners, COATES GC500 2026 across the start gantry, Coates billboards on the roofs nearest the track,
   rooftop plant on the buildings beside it, and the crowd along the fence at every one of those corners. The words are
   Andrew's own (the VMS message); the placement is nominal, and the scene's credit line already says the backdrop is
   decoration, not the record. Built once with the stands, into the stands' own batches - no new draw call. */
const DRESS_FONT={C:['.###.','#...#','#....','#....','#....','#...#','.###.'],O:['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
  A:['.###.','#...#','#...#','#####','#...#','#...#','#...#'],T:['#####','..#..','..#..','..#..','..#..','..#..','..#..'],E:['#####','#....','#....','####.','#....','#....','#####'],
  S:['.####','#....','#....','.###.','....#','....#','####.'],G:['.###.','#...#','#....','#.###','#...#','#...#','.###.'],'5':['#####','#....','####.','....#','....#','#...#','.###.'],
  '0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],'6':['..##.','.#...','#....','####.','#...#','#...#','.###.'],
  '1':['..#..','.##..','..#..','..#..','..#..','..#..','.###.']};
G.dressCircuit=function(S,k){
  const {dquad,person,ed,H,CL}=k,rnd=G.rng(41),M=G.M_PER_PT||6,stats={tyreStacks:0,banners:0,boards:0,billboards:0,roofPlant:0,people:0,letters:0,gantryText:false};
  const OR=[.90,.17,.02,1],WH=[.97,.97,.95,1],CH=[.075,.08,.095,1],POST=[.62,.66,.72,.95],TY=[.035,.036,.04,1],TY2=[.06,.062,.068,1],PLANT=[.50,.53,.57,1],PLANT2=[.36,.39,.43,1];
  const cross2=(a,b)=>a[0]*b[1]-a[1]*b[0],norm2=a=>{const l=Math.hypot(a[0],a[1])||1;return [a[0]/l,a[1]/l];};
  const tanAt=s=>{const p=CL.at(s),q=CL.at(s+.6);return norm2([q[0]-p[0],q[1]-p[1]]);};
  const onTrackBand=c=>G.inPoly(c,S.outer)&&!G.inPoly(c,S.inner);
  const clear=c=>!(S.heightAt&&S.heightAt(c[0],c[1])>.3)&&!(S.pitPts&&S.pitPts.some(P=>P.some(pt=>Math.hypot(pt[0]-c[0],pt[1]-c[1])<2.0)));
  /* words: a 5 x 7 dot font laid in quads, one quad per run of lit dots. f is the face's normal towards the reader (x,z). */
  const text=(c,f,str,px,col,lift)=>{const r=[f[1],-f[0]],cols=str.length*6-1,x0=-cols/2*px,y0=3.5*px;
    const P=(i,j)=>[c[0]+r[0]*(x0+i*px)+f[0]*lift,c[1]+y0-j*px,c[2]+r[1]*(x0+i*px)+f[1]*lift];
    [...str].forEach((ch,ci)=>{const g=DRESS_FONT[ch];if(!g)return;const X=ci*6;
      for(let j=0;j<7;j++){let i=0;while(i<5){if(g[j][i]!=='#'){i++;continue;}let e=i;while(e<5&&g[j][e]==='#')e++;dquad(P(X+i,j+1),P(X+e,j+1),P(X+e,j),P(X+i,j),col);stats.letters++;i=e;}}});};
  const panel=(c,f,w,h,col,lift)=>{const r=[f[1],-f[0]],L=lift||0,Q=(a,b)=>[c[0]+r[0]*a+f[0]*L,c[1]+b,c[2]+r[1]*a+f[1]*L];dquad(Q(-w/2,-h/2),Q(w/2,-h/2),Q(w/2,h/2),Q(-w/2,h/2),col);};
  const box=(c,sx,sy,sz,col,col2)=>{const [x,y,z]=c,x0=x-sx/2,x1=x+sx/2,z0=z-sz/2,z1=z+sz/2,y1=y+sy;
    dquad([x0,y,z0],[x1,y,z0],[x1,y1,z0],[x0,y1,z0],col2||col);dquad([x0,y,z1],[x1,y,z1],[x1,y1,z1],[x0,y1,z1],col2||col);
    dquad([x0,y,z0],[x0,y,z1],[x0,y1,z1],[x0,y1,z0],col);dquad([x1,y,z0],[x1,y,z1],[x1,y1,z1],[x1,y1,z0],col);dquad([x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],col);};
  /* a stack of four tyres, six-sided, each tyre its own band so the stack reads as tyres */
  const stack=(c,r)=>{const N=6;for(let b=0;b<4;b++){const y0=H+b*.034,y1=y0+.031,col=b%2?TY2:TY;
      for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2,A=[c[0]+Math.cos(a0)*r,c[1]+Math.sin(a0)*r],B=[c[0]+Math.cos(a1)*r,c[1]+Math.sin(a1)*r];
        dquad([A[0],y0,A[1]],[B[0],y0,B[1]],[B[0],y1,B[1]],[A[0],y1,A[1]],col);}}
    const top=H+4*.034;for(let i=0;i<N;i++){const a0=i/N*Math.PI*2,a1=(i+1)/N*Math.PI*2;dquad([c[0],top,c[1]],[c[0]+Math.cos(a0)*r,top,c[1]+Math.sin(a0)*r],[c[0]+Math.cos(a1)*r,top,c[1]+Math.sin(a1)*r],[c[0],top,c[1]],TY2);}
    stats.tyreStacks++;};
  /* the loops, sampled evenly with their outward normals (the side the barrier is built on) */
  const sampleLoop=(loop,sgn,step)=>{const out=[];let acc=0;
    for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<1e-6)continue;
      const t=[dx/L,dz/L],n=[-t[1]*sgn,t[0]*sgn];let u=(step-acc)%step;if(u<0)u+=step;
      for(;u<L;u+=step)out.push({p:[a[0]+dx*u/L,a[1]+dz*u/L],t:t,n:n});acc=(acc+L)%step;}
    return out;};
  const loops=[[S.outer,1,.30],[S.inner,-1,.22]].filter(l=>l[0]&&l[0].length>2);
  /* the corners: the eight sharpest, by the same peak rule the marshal posts use */
  const picks=[];for(let s=0;s<CL.L;s+=.6){const kk=Math.abs(S.kAt(s));let peak=true;for(let d=-6;d<=6;d+=.6)if(d!==0&&Math.abs(S.kAt((s+d+CL.L)%CL.L))>kk)peak=false;if(peak&&kk>.03)picks.push([s,kk]);}
  picks.sort((a,b)=>b[1]-a[1]);const cs=[];for(const [s0] of picks){if(cs.every(c=>Math.min(Math.abs(c-s0),CL.L-Math.abs(c-s0))>12))cs.push(s0);if(cs.length>=8)break;}
  const corners=cs.map(s=>{const t0=tanAt(s-1.5),t1=tanAt(s+1.5),t=tanAt(s),nL=[-t[1],t[0]];return {s:s,p:CL.at(s),t:t,sg:cross2(t0,t1)>0?-1:1};});
  /* where the barrier line is: march out from the centre line until the track band ends */
  const edge=(s,sg)=>{const p=CL.at(s),t=tanAt(s),n=[-t[1]*sg,t[0]*sg];for(let d=p[2]/2;d<p[2]/2+6;d+=.04){const c=[p[0]+n[0]*d,p[1]+n[1]*d];if(!onTrackBand(c))return {p:p,n:n,d:d,t:t};}return null;};
  /* 1. tyre walls with a Coates belt, across the outside of each corner, between the barrier line and its concrete face */
  corners.forEach(cn=>{let prev=null,run=[];
    const flush=()=>{for(let i=0;i+1<run.length;i++){const a=run[i],b=run[i+1];if(Math.hypot(a.c[0]-b.c[0],a.c[1]-b.c[1])>.2)continue;
        const fa=[a.c[0]-a.n[0]*.052,a.c[1]-a.n[1]*.052],fb=[b.c[0]-b.n[0]*.052,b.c[1]-b.n[1]*.052],col=(i>>1)%2?WH:OR;
        dquad([fa[0],H+.035,fa[1]],[fb[0],H+.035,fb[1]],[fb[0],H+.115,fb[1]],[fa[0],H+.115,fa[1]],col);}run=[];};
    for(let ds=-3.2;ds<=3.2;ds+=.03){const e=edge((cn.s+ds+CL.L)%CL.L,cn.sg);if(!e){flush();continue;}
      const c=[e.p[0]+e.n[0]*(e.d+.2),e.p[1]+e.n[1]*(e.d+.2)];
      if(prev&&Math.hypot(c[0]-prev[0],c[1]-prev[1])<.1)continue;
      if(S.heightAt&&S.heightAt(c[0],c[1])>.3){flush();prev=null;continue;}
      stack(c,.05);run.push({c:c,n:e.n});prev=c;}
    flush();});
  /* 2. banners on the catch fence, facing the track: COATES in white on orange, GC500 2026 in orange on charcoal */
  loops.forEach(([loop,sgn,hgt],li)=>{const pts=sampleLoop(loop,sgn,.1),every=li?13:8,len=1.3;let k2=0;
    for(let i=0;i<pts.length;i+=Math.round(every/.1)){const a=pts[i],b=pts[(i+Math.round(len/.1))%pts.length];if(!a||!b)continue;
      const dx=b.p[0]-a.p[0],dz=b.p[1]-a.p[1],L=Math.hypot(dx,dz);if(L<len*.85)continue;
      const t=[dx/L,dz/L],n=[-t[1]*sgn,t[0]*sgn],off=.45+.58/M*.62-.012,m=[(a.p[0]+b.p[0])/2+n[0]*off,(a.p[1]+b.p[1])/2+n[1]*off];
      if(S.heightAt&&S.heightAt(m[0],m[1])>.3)continue;if(S.distToTrack&&S.distToTrack(m[0],m[1])>CL.at(0)[2]*2.2)continue;
      const f=[-n[0],-n[1]],hb=.19,c=[m[0],H+hgt+.03+hb/2,m[1]],alt=k2++%2===1,words=alt?'GC500 2026':'COATES',cols=words.length*6-1;
      panel(c,f,L*.96,hb,alt?WH:OR,.004);panel([c[0],c[1]+hb/2-.012,c[2]],f,L*.96,.024,alt?OR:WH,.006);
      text(c,f,words,Math.min(hb*.6/7,L*.86/cols),alt?OR:WH,.009);stats.banners++;}});
  /* 3. braking boards before each corner, on the outside, facing the cars as they come: 150, 100, 50 */
  corners.forEach(cn=>{[150,100,50].forEach(dm=>{const s=(cn.s-dm/M+CL.L)%CL.L,e=edge(s,cn.sg);if(!e)return;const t=e.t,dd=Math.max(e.p[2]/2+.25,e.d-.22),c2=[e.p[0]+e.n[0]*dd,e.p[1]+e.n[1]*dd];
      if(!clear(c2))return;const f=[-t[0],-t[1]],y=H+.30;
      ed.seg([c2[0],H,c2[1]],[c2[0],y+.06,c2[1]],POST,POST,.014,.014,.5);
      panel([c2[0],y,c2[1]],f,.30,.19,CH,.012);panel([c2[0],y,c2[1]],f,.27,.16,WH,.016);text([c2[0],y,c2[1]],f,String(dm),.018,CH,.02);stats.boards++;});});
  /* 4. across the start gantry, both faces: COATES GC500 2026 in white on the black beam */
  {const s=(S.gridS+(S.tune.carS||3.4)*.9)%CL.L,p=CL.at(s),t=tanAt(s),hw=p[2]/2+.55,GY=H+2.05,c=[p[0],GY-.14,p[1]],words='COATES GC500 2026',px=Math.min(.028,2*hw*.9/(words.length*6-1));
   for(const f of [[-t[0],-t[1]],[t[0],t[1]]])text(c,f,words,px,WH,.012);stats.gantryText=true;}
  /* 5. the buildings beside the track: plant on the roofs, and a Coates billboard on the tallest few, facing the circuit */
  {const cands=[];
   for(let s=0;s<CL.L;s+=1.6){const p=CL.at(s),t=tanAt(s);
     for(const sg of [1,-1]){const n=[-t[1]*sg,t[0]*sg];
       for(let d=p[2]/2+1.6;d<p[2]/2+9;d+=.55){const x=p[0]+n[0]*d,z=p[1]+n[1]*d,h=S.heightAt?S.heightAt(x,z):0;
         if(h>.8&&h<7){
           if(stats.roofPlant<420&&rnd()<.75){const c=[x+n[0]*(.3+rnd()*.6)+(rnd()-.5)*.4,z+n[1]*(.3+rnd()*.6)+(rnd()-.5)*.4];const h2=S.heightAt(c[0],c[1]);
             if(h2>.8&&Math.abs(h2-h)<.05){const big=rnd()<.3;box([c[0],h2,c[1]],big?.34:.18+rnd()*.1,big?.16:.08+rnd()*.05,big?.22:.14+rnd()*.08,PLANT,PLANT2);stats.roofPlant++;
               if(rnd()<.18){const r=.07,y0=h2,y1=h2+.16;for(let i=0;i<8;i++){const a0=i/8*Math.PI*2,a1=(i+1)/8*Math.PI*2,cx=c[0]+.3,cz=c[1];dquad([cx+Math.cos(a0)*r,y0,cz+Math.sin(a0)*r],[cx+Math.cos(a1)*r,y0,cz+Math.sin(a1)*r],[cx+Math.cos(a1)*r,y1,cz+Math.sin(a1)*r],[cx+Math.cos(a0)*r,y1,cz+Math.sin(a0)*r],[.82,.84,.86,1]);}}}}
           cands.push({s:s,x:x,z:z,h:h,f:[-n[0],-n[1]],d:d-p[2]/2});break;}}}}
   cands.sort((a,b)=>(b.h-a.d*.12)-(a.h-b.d*.12));const chosen=[];
   for(const c of cands){if(chosen.length>=6)break;if(chosen.some(o=>Math.min(Math.abs(o.s-c.s),CL.L-Math.abs(o.s-c.s))<CL.L/9))continue;
     const bx=c.x-c.f[0]*.55,bz=c.z-c.f[1]*.55;if(!S.heightAt||S.heightAt(bx,bz)<c.h*.9)continue;chosen.push(c);
     const y0=c.h,W=2.3,Hh=.78,cy=y0+.28+Hh/2,r=[c.f[1],-c.f[0]],base=[bx,cy,bz];
     for(const a of [-.36,.36]){const px=bx+r[0]*a*W,pz=bz+r[1]*a*W;ed.seg([px,y0,pz],[px,cy,pz],POST,POST,.03,.03,.6);}
     panel(base,c.f,W,Hh,CH,0);panel([bx,cy+Hh/2-.05,bz],c.f,W,.1,OR,.004);panel([bx,cy-Hh/2+.03,bz],c.f,W,.06,OR,.004);
     text([bx,cy+.13,bz],c.f,'COATES',Math.min(.06,W*.8/35),WH,.008);text([bx,cy-.15,bz],c.f,'GC500 2026',Math.min(.04,W*.8/59),OR,.008);
     panel(base,[-c.f[0],-c.f[1]],W,Hh,[.2,.21,.23,1],.002);stats.billboards++;}}
  /* 6. the crowd along the fence at every corner, two deep, and along the grid straight */
  {const fr=G.rng(47);
   corners.forEach(cn=>{for(let ds=-5.5;ds<=5.5;ds+=.2){const e=edge((cn.s+ds+CL.L)%CL.L,cn.sg);if(!e)continue;
     for(let row=0;row<3;row++){const g=e.d+.62+row*.22+fr()*.1,c=[e.p[0]+e.n[0]*g,e.p[1]+e.n[1]*g];if(onTrackBand(c)||!clear(c)||fr()>.8)continue;person([c[0]+(fr()-.5)*.1,H,c[1]+(fr()-.5)*.1],fr,1);stats.people++;}}});
   for(let ds=-6;ds<=14;ds+=.25)for(const sg of [1,-1]){const e=edge((S.gridS+ds+CL.L)%CL.L,sg);if(!e)continue;
     for(let row=0;row<2;row++){const g=e.d+.62+row*.22+fr()*.1,c=[e.p[0]+e.n[0]*g,e.p[1]+e.n[1]*g];if(onTrackBand(c)||!clear(c)||fr()>.7)continue;person([c[0]+(fr()-.5)*.1,H,c[1]+(fr()-.5)*.1],fr,1);stats.people++;}}}
  stats.corners=corners.map(c=>+c.s.toFixed(1));S.dressStats=stats;return stats;
};
