/* Author: Andrew Fisher. Photo landmarks only. Source axes are recovered master-plan
   coordinates, already in scene space; dimensions and artwork remain illustrative.
   See evidence/anchor-provenance.json. No route, operational or camera state writes. */
Object.assign(DRESS_FONT,{
 B:['####.','#...#','#...#','####.','#...#','#...#','####.'],D:['####.','#...#','#...#','#...#','#...#','#...#','####.'],
 F:['#####','#....','#....','####.','#....','#....','#....'],H:['#...#','#...#','#...#','#####','#...#','#...#','#...#'],
 K:['#...#','#..#.','#.#..','##...','#.#..','#..#.','#...#'],
 I:['#####','..#..','..#..','..#..','..#..','..#..','#####'],L:['#....','#....','#....','#....','#....','#....','#####'],
 M:['#...#','##.##','#.#.#','#.#.#','#...#','#...#','#...#'],N:['#...#','##..#','##..#','#.#.#','#..##','#..##','#...#'],
 Q:['.###.','#...#','#...#','#...#','#.#.#','#..#.','.##.#'],V:['#...#','#...#','#...#','#...#','#...#','.#.#.','..#..'],
 P:['####.','#...#','#...#','####.','#....','#....','#....'],R:['####.','#...#','#...#','####.','#.#..','#..#.','#...#'],
 U:['#...#','#...#','#...#','#...#','#...#','#...#','.###.'],W:['#...#','#...#','#...#','#.#.#','#.#.#','##.##','#...#'],
 '3':['####.','....#','....#','.###.','....#','....#','####.'],
 '-':['.....','.....','.....','#####','.....','.....','.....'],
 '/':['....#','...#.','...#.','..#..','.#...','.#...','#....'],
 '.':['.....','.....','.....','.....','.....','.##..','.##..']
});
G.photoLandmarks970=(function(){
 const M=5.937552372855356, masterSha256='8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d';
 const anchors=Object.freeze([
  Object.freeze({id:'PB1',kind:'pedestrian bridge',photo:'21074.jpg',ends:Object.freeze([Object.freeze([7.344098756876463,-50.04336362756767]),Object.freeze([7.167785698342911,-44.990664099162366])])}),
  Object.freeze({id:'PB2',kind:'pedestrian bridge',photo:'21110.jpg',ends:Object.freeze([Object.freeze([-99.57188239758975,-12.482657405409924]),Object.freeze([-95.09942560131555,-12.603699743277332])])}),
  Object.freeze({id:'OT4',kind:'advertising gantry',photo:'21134.jpg',ends:Object.freeze([Object.freeze([-91.82846876346876,27.187075563141562]),Object.freeze([-89.02085090309777,27.993348121745683])])}),
  Object.freeze({id:'PB3',kind:'pedestrian bridge',photo:'21154.jpg',ends:Object.freeze([Object.freeze([-80.02584145227696,38.8318818756393]),Object.freeze([-76.68201359088266,43.372222895700304])])}),
  Object.freeze({id:'OT5',kind:'advertising gantry',photo:'21162.jpg',ends:Object.freeze([Object.freeze([-44.640761329392504,14.363356119649367]),Object.freeze([-42.5540469383306,17.023524544744603])])})
 ]);
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
 const finite=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
 function resolve(S,anchor){
  if(typeof anchor==='string')anchor=anchors.find(a=>a.id===anchor);
  if(!anchor||!anchors.includes(anchor)||!S||!S.CL||!Array.isArray(S.CL.p)||!Array.isArray(S.CL.cum)||!S.outer||!S.inner||Math.abs((G.M_PER_PT||0)-M)>1e-10)return null;
  const A=anchor.ends[0],B=anchor.ends[1];if(!finite(A)||!finite(B))return null;
  const span=Math.hypot(B[0]-A[0],B[1]-A[1]),axis=[(B[0]-A[0])/span,(B[1]-A[1])/span],centre=[(A[0]+B[0])/2,(A[1]+B[1])/2];
  if(!(span>2&&span<8))return null;
  const pts=S.CL.p;let hit=null;
  for(let i=0;i<pts.length;i++){
   const p=pts[i],q=pts[(i+1)%pts.length],v=[q[0]-p[0],q[1]-p[1]],len=Math.hypot(...v),den=cross(axis,v);if(!len||Math.abs(den)<1e-7)continue;
   const d=[p[0]-centre[0],p[1]-centre[1]],u=cross(d,v)/den,t=cross(d,axis)/den;
   if(t<0||t>1||Math.abs(u)>6)continue;
   if(!hit||Math.abs(u)<Math.abs(hit.u))hit={u,s:S.CL.cum[i]+t*len,tangent:[v[0]/len,v[1]/len]};
  }
  if(!hit)return null;
  const point=u=>[centre[0]+axis[0]*u,centre[1]+axis[1]*u],on=p=>G.inPoly(p,S.outer)&&!G.inPoly(p,S.inner);
  if(!on(point(hit.u)))return null;
  const boundary=sg=>{for(let d=.04;d<=5;d+=.04){const u=hit.u+sg*d;if(!on(point(u)))return u;}return null;};
  const low=boundary(-1),high=boundary(1);if(low==null||high==null)return null;
  // Keep the recovered crossing axis. Extend illustrative end supports beyond the
  // schematic road/barrier band, rather than putting a source endpoint in a lane.
  const clearance=.80,lo=Math.min(-span/2,low-clearance),hi=Math.max(span/2,high+clearance),renderedSpan=hi-lo;
  if(renderedSpan>12||renderedSpan<2)return null;
  const ends=[point(lo),point(hi)],mid=point((lo+hi)/2),f=[axis[1],-axis[0]];
  if(f[0]*hit.tangent[0]+f[1]*hit.tangent[1]>0){f[0]*=-1;f[1]*=-1;}
  for(const p of ends)for(const x of [-.3,0,.3])for(const z of [-.3,0,.3])if(on([p[0]+axis[0]*x+f[0]*z,p[1]+axis[1]*x+f[1]*z]))return null;
  return {id:anchor.id,kind:anchor.kind,photo:anchor.photo,sourceWorldCentre:centre,sourceWorldEnds:anchor.ends.map(p=>p.slice()),worldCentre:mid,worldEnds:ends,axis,face:f,tangent:hit.tangent,s:hit.s,span:renderedSpan,roadBoundaryEnds:[point(low),point(high)],supportClearance:clearance,metresPerPoint:M,dimensionsIllustrative:true,officialArtwork:false};
 }
 function build(S,k,stats){
  const {dquad,ed,H,text,panel}=k;
  const batch=S.standDecor;if(!batch||!Array.isArray(S.photoLabels792))return;
  if(S._photoLandmarks970&&S._photoLandmarks970.batch===batch&&S._photoLandmarks970.end===batch.i.length){stats.photoLandmarks970=S._photoLandmarks970.report;return;}
  const report={version:970,masterSha256,placement:'Recovered master crossing axes; illustrative spans extend to schematic road clearance.',landmarks:[],skipped:[],static:true,newDrawCalls:0,newTextures:0};
  const WH=[.98,.98,.94,1],CREAM=[.98,.965,.875,1],INK=[.025,.03,.035,1],RED=[.88,.065,.13,1],ORANGE=[1,.29,.045,1],METAL=[.64,.68,.72,1],DECK=[.37,.4,.43,1];
  for(const anchor of anchors){
   const a=resolve(S,anchor);if(!a){report.skipped.push(anchor.id);continue;}
   const begin=batch.i.length,labelStart=S.photoLabels792.length;let segments=0;
   const seg=(p,q,w=.016)=>{ed.seg(p,q,METAL,METAL,w,w,.7);segments++;};
   const c=a.worldCentre,axis=a.axis,face=a.face,half=a.span/2;
   const P=(x,y,z=0)=>[c[0]+axis[0]*x+face[0]*z,H+y,c[1]+axis[1]*x+face[1]*z];
   const sign=(f,z,W,HH,yy,kind)=>{
    const r=[f[1],-f[0]],base=[c[0]+f[0]*z,H+yy,c[1]+f[1]*z];
    const q=(x,y,l=.008)=>[base[0]+r[0]*x+f[0]*l,base[1]+y,base[2]+r[1]*x+f[1]*l];
    const rect=(x,y,w,h,col,l=.008)=>panel(q(x,y,0),f,w,h,col,l);
    const words=(str,x,y,w,h,col)=>text(q(x,y,0),f,str,Math.min(w/(str.length*6-1),h/7),col,.023);
    if(anchor.id==='PB1'){
     rect(0,0,W,HH,[.025,.20,.56,1],0);rect(0,0,.014,HH*.74,WH,.009);
     words('DELIVERING',-W*.25,HH*.13,W*.40,HH*.23,WH);words('FOR QUEENSLAND',-W*.25,-HH*.17,W*.42,HH*.16,WH);
     words('Queensland',W*.25,HH*.13,W*.35,HH*.22,WH);words('Government',W*.25,-HH*.16,W*.35,HH*.20,WH);
    }else if(anchor.id==='PB2'){
     rect(0,0,W,HH,[.83,.025,.12,1],0);words('GOLDCOAST.',0,0,W*.84,HH*.50,WH);
    }else if(anchor.id==='OT4'){
     rect(0,0,W,HH,[.86,.875,.87,1],0);for(let i=1;i<12;i++)rect(-W/2+W*i/12,0,.008,HH,[.63,.66,.67,1],.004);
    }else if(kind==='pedestrian bridge'){
     rect(0,0,W,HH,CREAM,0);rect(0,0,.022,HH,METAL,.004);
     // Concentric rings from the photographed cream wrap, clipped to the panel.
     const ring=(cx,cy,R,col)=>{const n=20,th=HH*.012;for(let i=0;i<n;i++){const t=i/n*Math.PI*2,u=(i+1)/n*Math.PI*2,xy=[[cx+Math.cos(t)*R,cy+Math.sin(t)*R],[cx+Math.cos(u)*R,cy+Math.sin(u)*R],[cx+Math.cos(u)*(R-th),cy+Math.sin(u)*(R-th)],[cx+Math.cos(t)*(R-th),cy+Math.sin(t)*(R-th)]];if(xy.every(p=>Math.abs(p[0])<W/2-.018&&Math.abs(p[1])<HH/2-.008))dquad(...xy.map(p=>q(p[0],p[1],.010)),col);}};
     [[-W*.43,HH*.40],[W*.06,HH*.48],[W*.42,-HH*.46]].forEach(([x,y])=>[[.25,[.98,.72,.03,1]],[.31,[.96,.3,.49,1]],[.37,[.84,.09,.18,1]],[.43,[.18,.43,.65,1]]].forEach(([rad,col])=>ring(x,y,HH*rad,col)));
     words('boostmobile',-W*.245,HH*.31,W*.25,HH*.10,INK);
     words('GOLD COAST',-W*.245,HH*.10,W*.39,HH*.17,RED);
     words('500',-W*.245,-HH*.11,W*.22,HH*.22,RED);
     rect(-W*.245,-HH*.36,W*.36,HH*.12,RED,.013);
     words('SUPERCARS.COM',-W*.245,-HH*.36,W*.32,HH*.074,WH);
     words('THE FINALS',W*.25,HH*.20,W*.39,HH*.15,RED);
     words('STARTS HERE',W*.25,-HH*.015,W*.40,HH*.15,RED);
     words('23-25 OCT 2026',W*.25,-HH*.26,W*.40,HH*.10,INK);
    }else{
     rect(0,0,W,HH,INK,0);const end=W*.205;
     rect(-W/2+end/2,0,end,HH,ORANGE,.005);rect(W/2-end/2,0,end,HH,ORANGE,.005);
     words('boostmobile',W*.045,0,W*.49,HH*.42,WH);
     const x=-W*.24,y=0,d=HH*.18;dquad(q(x-d,y),q(x,y-d),q(x+d,y),q(x,y+d),ORANGE);
     for(const x of [-W/2+end/2,W/2-end/2]){words('WORKS ITS',x,HH*.17,end*.88,HH*.17,INK);words('ARSE OFF',x,-HH*.15,end*.88,HH*.17,INK);}
    }
   };
   if(anchor.kind==='pedestrian bridge'){
    const deck=6.4/M,hh=Math.min(5.2/M,a.span*.94/6.8),top=deck+hh,depth=2.4/M,nb=12;
    dquad(P(-half,deck,-depth/2),P(half,deck,-depth/2),P(half,deck,depth/2),P(-half,deck,depth/2),DECK);
    for(const z of [-depth/2,depth/2]){
     seg(P(-half,deck-.13,z),P(half,deck-.13,z),.025);seg(P(-half,top+.03,z),P(half,top+.03,z),.022);
     for(let i=0;i<=nb;i++){const x=-half+a.span*i/nb;seg(P(x,deck-.13,z),P(x,top+.03,z),.013);if(i<nb)seg(P(x,deck-.13,z),P(x+a.span/nb,deck,z),.014);}
    }
    for(const side of [-1,1]){
     const x=side*half;
     for(const dx of [-.22,.22])for(const z of [-depth/2,depth/2])seg(P(x+dx,0,z),P(x+dx,deck,z),.027);
     for(const z of [-depth/2,depth/2])for(let j=0;j<3;j++){const y=deck*j/3;seg(P(x-.22,y,z),P(x+.22,y+deck/3,z),.016);seg(P(x+.22,y,z),P(x-.22,y+deck/3,z),.016);}
     // White-clad stair flights lead away from the road; their footprints never enter it.
     const run=5.8/M,out=x+side*run,rail=1.1/M;
     for(const z of [-depth/2,depth/2]){dquad(P(x,deck,z),P(out,0,z),P(out,rail,z),P(x,deck+rail,z),WH);seg(P(x,deck,z),P(out,0,z),.023);}
     dquad(P(x,deck,-depth/2),P(out,0,-depth/2),P(out,0,depth/2),P(x,deck,depth/2),DECK);
     for(let i=1;i<10;i++){const u=i/10;seg(P(x+(out-x)*u,deck*(1-u),-depth/2),P(x+(out-x)*u,deck*(1-u),depth/2),.010);}
    }
    sign(face,depth/2+.015,a.span*.94,hh,deck+hh/2,'pedestrian bridge');
    sign([-face[0],-face[1]],depth/2+.015,a.span*.94,hh,deck+hh/2,'pedestrian bridge');
    a.deckHeight=H+deck;a.faceHeight=hh;a.topHeight=H+top;a.depth=depth;stats.bridges=(stats.bridges||0)+1;stats.bridgeAt=+a.s.toFixed(1);
   }else{
    const lower=6.2/M,hh=(anchor.id==='OT4'?4.2:1.9)/M,upper=lower+hh,depth=.65/M;
    for(const x of [-half,half])for(const z of [-depth/2,depth/2])seg(P(x,0,z),P(x,upper,z),.032);
    for(const z of [-depth/2,depth/2]){seg(P(-half,lower,z),P(half,lower,z),.028);seg(P(-half,upper,z),P(half,upper,z),.028);for(let i=0;i<10;i++)seg(P(-half+a.span*i/10,lower,z),P(-half+a.span*(i+1)/10,upper,z),.012);}
    sign(face,depth/2+.01,a.span,hh,lower+hh/2,'advertising gantry');sign([-face[0],-face[1]],depth/2+.01,a.span,hh,lower+hh/2,'advertising gantry');
    a.deckHeight=null;a.faceHeight=hh;a.topHeight=H+upper;a.depth=depth;stats.photoGantries970=(stats.photoGantries970||0)+1;
   }
   a.emittedQuads=(batch.i.length-begin)/6;a.emittedSegments=segments;a.labels=S.photoLabels792.slice(labelStart).map(q=>q.text);report.landmarks.push(a);
  }
  stats.photoLandmarks970=report;S._photoLandmarks970={batch,end:batch.i.length,report};
 }
 return Object.freeze({anchors,resolve,build,masterSha256});
})();
