  /* 6. v6.64 - spectator terraces: three raised rows of people behind the fence at every one of those corners and down both
     sides of the grid straight, high enough that the crowd is seen over the concrete from the track (on the ground behind a
     1.8 m wall they were hidden). Plank decks, dark risers and back wall, an orange rail along the front. */
  {const fr=G.rng(47),DECK=[.40,.42,.45,1],RISE=[.24,.26,.29,1],RAIL=[.90,.17,.02,1],ROWS=3,yRow=k=>H+.14+k*.09;
   const terrace=(sList,sg)=>{let prev=null;
     for(const s of sList){const e=edge(s,sg);if(!e){prev=null;continue;}
       const g0=e.d+.74,pts=[];let ok=true;
       for(let k=0;k<=ROWS;k++){const g=g0+k*.22,c=[e.p[0]+e.n[0]*g,e.p[1]+e.n[1]*g];if(onTrackBand(c)||!clear(c)){ok=false;break;}pts.push(c);}
       if(!ok){prev=null;continue;}
       if(prev&&Math.hypot(prev[0][0]-pts[0][0],prev[0][1]-pts[0][1])<.8){
         for(let k=0;k<ROWS;k++){const y=yRow(k),yb=k?yRow(k-1):H,a0=prev[k],a1=prev[k+1],b0=pts[k],b1=pts[k+1];
           dquad([a0[0],y,a0[1]],[b0[0],y,b0[1]],[b1[0],y,b1[1]],[a1[0],y,a1[1]],DECK);
           dquad([a0[0],yb,a0[1]],[b0[0],yb,b0[1]],[b0[0],y,b0[1]],[a0[0],y,a0[1]],RISE);
           for(let q=0;q<2;q++)if(fr()<.88){const uu=.1+fr()*.8,w=.25+fr()*.5,c=[a0[0]+(b0[0]-a0[0])*uu+(a1[0]-a0[0])*w,a0[1]+(b0[1]-a0[1])*uu+(a1[1]-a0[1])*w];person([c[0],y,c[1]],fr,1);stats.people++;}}
         const a=prev[ROWS],b=pts[ROWS],yt=yRow(ROWS-1)+.14;dquad([a[0],H,a[1]],[b[0],H,b[1]],[b[0],yt,b[1]],[a[0],yt,a[1]],RISE);
         const f0=prev[0],f1=pts[0],yr=yRow(0)+.16;ed.seg([f0[0],yr,f0[1]],[f1[0],yr,f1[1]],RAIL,RAIL,.012,.012,.6);
         stats.terraceBays=(stats.terraceBays||0)+1;}
       prev=pts;}};
   corners.forEach(cn=>{const L2=[];for(let ds=-5.5;ds<=5.5;ds+=.3)L2.push((cn.s+ds+CL.L)%CL.L);terrace(L2,cn.sg);});
   for(const sg of [1,-1]){const L2=[];for(let ds=-6;ds<=14;ds+=.3)L2.push((S.gridS+ds+CL.L)%CL.L);terrace(L2,sg);}}
