 /* Shared visual kerb joins v7.94. Author: Andrew Fisher.
    The source makes independent chord-normal quads. Reconcile only their
    adjoining selected spans; curvature-rule gaps remain gaps. Source geometry,
    physics, road width and all post-kerb paint stay immutable. */
 if(S.kerb&&S.kerbStats){
  const vertices=S.kerb.v,stride=9,quads=S.kerbStats.blocks*2,firstPaintVertex=quads*4,firstPaintIndex=quads*6;
  if(firstPaintVertex*stride>vertices.length||firstPaintIndex>S.kerb.i.length)throw new Error('Kerb source range exceeds the original mesh');
  const widthM=.85,stripeM=1.,lo=H+.008/M,hi=H+.070/M;
  stats.kerbSourceQuads=quads;stats.kerbFootprints=0;stats.kerbPaintBlocks=0;
  stats.kerbWidthM=widthM;stats.kerbHeightM=.070;stats.kerbMaxStripeM=0;
  stats.kerbSourceRule='Original selected spans only; shared visual joins within source lip endpoints; width 0.85 m; source arrays and physics unchanged';
  stats.kerbSharedJoins=0;stats.kerbRunEnds=0;stats.kerbMaxJoinShiftM=0;
  D.kerbEdges=[];
  const lerp=(a,b,t)=>a.map((v,k)=>v+(b[k]-v)*t),spans=[],byStart=new Map(),N=S.CL.p.length;
  // Match the original source ordering: selected centreline chord, apex side,
  // then opposite side. A side reversal does not exchange physical road edges.
  if(!S.kap||S.kap.length!==N)throw new Error('Kerb source curvature unavailable');
  let q=0;
  for(let i=0;i<N;i+=2){
   if(Math.abs(S.kap[i])<.010)continue;
   for(const side of [S.kap[i]>0?1:-1,S.kap[i]>0?-1:1]){
    if(q>=quads)throw new Error('Kerb source selection exceeds recorded quads');
    const points=Array.from({length:4},(_,k)=>Array.from(vertices.slice((q*4+k)*stride,(q*4+k)*stride+3)));
    const section=(outer,inner)=>{
     const dx=inner[0]-outer[0],dz=inner[2]-outer[2],length=Math.hypot(dx,dz);
     if(length<widthM/M)throw new Error('Kerb source narrower than established visual profile');
     return {outer:outer.slice(),inward:[dx/length,0,dz/length]};
    };
    const span={q,index:i,endIndex:(i+2)%N,side,points,a:section(points[1],points[0]),b:section(points[2],points[3]),prev:null,next:null};
    spans.push(span);byStart.set(i+':'+side,span);q++;
   }
  }
  if(q!==quads)throw new Error('Kerb source selection differs from recorded quads');
  for(const span of spans){
   const next=byStart.get(span.endIndex+':'+span.side);
   if(!next||next===span)continue;
   const a=span.b,b=next.a,dx=a.inward[0]+b.inward[0],dz=a.inward[2]+b.inward[2],length=Math.hypot(dx,dz);
   if(length<1e-6)throw new Error('Kerb join reverses direction');
   // Midpoint stays inside the two original lip endpoints: no extrapolated
   // miter spike and no new source span. Both neighbouring profiles use it.
   const joined={outer:lerp(a.outer,b.outer,.5),inward:[dx/length,0,dz/length]};
   stats.kerbMaxJoinShiftM=Math.max(stats.kerbMaxJoinShiftM,Math.hypot(a.outer[0]-b.outer[0],a.outer[2]-b.outer[2])*M/2);
   span.b=next.a=joined;span.next=next;next.prev=span;stats.kerbSharedJoins++;
  }
  // Source chord quads alternate winding between the two road sides. Orient
  // each visual face to its actual exterior; otherwise half the top normals
  // point below the road and side lighting changes between adjoining spans.
  const outwardFace=(points,colour,direction)=>{
   const n=cross(sub(points[1],points[0]),sub(points[2],points[0]));
   face(n[0]*direction[0]+n[1]*direction[1]+n[2]*direction[2]<0?points.slice().reverse():points,colour);
  };
  const inner=s=>[s.outer[0]+s.inward[0]*widthM/M,s.outer[1],s.outer[2]+s.inward[2]*widthM/M];
  for(const span of spans){
   const innerA=inner(span.a),innerB=inner(span.b),outerA=span.a.outer,outerB=span.b.outer,
    lengthM=Math.hypot(outerB[0]-outerA[0],outerB[2]-outerA[2])*M,
    pieces=Math.max(1,Math.ceil(lengthM/stripeM)),index=span.q*4*stride,
    startsRed=vertices[index+3]>vertices[index+4]*2;
   if(lengthM<1e-8)throw new Error('Degenerate visual kerb span');
   D.kerbEdges.push({sourceQuad:span.q,sourceIndex:span.index,side:span.side,
    previousQuad:span.prev?span.prev.q:null,nextQuad:span.next?span.next.q:null,
    sourceOuterStart:span.points[1].slice(),sourceOuterEnd:span.points[2].slice(),
    outerStart:outerA.slice(),outerEnd:outerB.slice(),innerStart:innerA.slice(),innerEnd:innerB.slice()});
   for(let j=0;j<pieces;j++){
    const u0=j/pieces,u1=(j+1)/pieces,ia=lerp(innerA,innerB,u0),ib=lerp(innerA,innerB,u1),
     oa=lerp(outerA,outerB,u0),ob=lerp(outerA,outerB,u1),
     paint=((j%2===0)===startsRed)?[.42,.030,.022,.94]:[.60,.60,.62,.94],
     section=(a,b,t,height)=>[a[0]+(b[0]-a[0])*t,height,a[2]+(b[2]-a[2])*t],
     aa=[section(ia,oa,0,lo),section(ia,oa,.18,hi),section(ia,oa,.86,hi),section(ia,oa,1,lo)],
     bb=[section(ib,ob,0,lo),section(ib,ob,.18,hi),section(ib,ob,.86,hi),section(ib,ob,1,lo)],
     inward=[ia[0]+ib[0]-oa[0]-ob[0],0,ia[2]+ib[2]-oa[2]-ob[2]];
    for(let k=0;k<3;k++)outwardFace([aa[k],bb[k],bb[k+1],aa[k+1]],paint,[0,1,0]);
    const bottom=p=>[p[0],H+.001/M,p[2]],edgePaint=paint.map((v,k)=>k<3?v*.72:v);
    outwardFace([bottom(aa[0]),bottom(bb[0]),bb[0],aa[0]],edgePaint,inward);
    outwardFace([bottom(bb[3]),bottom(aa[3]),aa[3],bb[3]],edgePaint,inward.map(v=>-v));
    // Close only genuine run ends, never a shared stripe or source-span join.
    if(j===0&&!span.prev){outwardFace([bottom(aa[0]),aa[0],aa[1],aa[2],aa[3],bottom(aa[3])],edgePaint,[oa[0]-ob[0],0,oa[2]-ob[2]]);stats.kerbRunEnds++;}
    if(j===pieces-1&&!span.next){outwardFace([bottom(bb[3]),bb[3],bb[2],bb[1],bb[0],bottom(bb[0])],edgePaint,[ob[0]-oa[0],0,ob[2]-oa[2]]);stats.kerbRunEnds++;}
    stats.kerbPaintBlocks++;
   }
   stats.kerbProfiles++;stats.kerbFootprints++;stats.kerbMaxStripeM=Math.max(stats.kerbMaxStripeM,lengthM/pieces);
  }
