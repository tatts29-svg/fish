/* Author: Andrew Fisher.
 * v7.94 photograph-informed facade depth around the complete existing circuit.
 * Source footprints, roof heights, pit garages and collision geometry stay fixed.
 * Coastal facade treatments are illustrative, not surveyed landmark reconstructions.
 * Cream slabs, separated recessed glazing and varied elevations follow the photographs
 * without changing source tower footprints or duplicating any named landmark.
 */
(function () {
  'use strict';
  const G = window.GC3D;
  if (!G || G.installArchitecture781) return;
  G.architectureRefinement794 = true;
  const setBuildings = G.setBuildings;
  G.setBuildings = function (list) {
    const result = setBuildings.apply(this, arguments);
    if (G.S) {G.S.architecture781Source = list;G.S.architecture781NominalShown=true;}
    return result;
  };
  // Retained compatibility entry: full-lap detail never removes the original garages.
  G.toggleNominalGarages781 = function () { return true; };
  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aColour;
layout(location=3) in float aMaterial;
layout(location=4) in vec2 aFacade;
uniform mat4 uVP;
out vec3 vPosition; out vec3 vNormal; out vec3 vColour;
out float vMaterial; out float vDepth;
out vec2 vFacade;
void main(){
  vec4 p=uVP*vec4(aPosition,1.);
  gl_Position=p; vPosition=aPosition; vNormal=aNormal;
  vColour=aColour; vMaterial=aMaterial; vDepth=p.w;
  vFacade=aFacade;
}`;
  const FS = `#version 300 es
precision highp float;
in vec3 vPosition; in vec3 vNormal; in vec3 vColour;
in float vMaterial; in float vDepth;
in vec2 vFacade;
uniform vec3 uEye; uniform vec3 uSun; uniform vec2 uFog; uniform float uDay; uniform float uFloorStep;
uniform highp sampler2D uShadow; uniform mat4 uLightVP;
uniform float uShadowOn; uniform vec2 uShadowTexel;
out vec4 o;
float visibility(vec3 p,vec3 n){
  if(uShadowOn<.5)return 1.;
  vec4 q=uLightVP*vec4(p,1.); vec3 c=q.xyz/q.w*.5+.5;
  if(c.x<=0.||c.x>=1.||c.y<=0.||c.y>=1.||c.z<=0.||c.z>=1.)return 1.;
  float bias=.00038+.001*(1.-max(dot(n,uSun),0.));
  float sum=0.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)
    sum+=step(c.z-bias,texture(uShadow,c.xy+vec2(x,y)*uShadowTexel).r);
  return sum/9.;
}
void main(){
  vec3 n=normalize(vNormal),eye=normalize(uEye-vPosition);
  float lambert=max(dot(n,uSun),0.),lit=visibility(vPosition,n);
  float ao=.80+.20*smoothstep(0.,.65,vPosition.y);
  bool facadeGlazing=vMaterial>2.5&&vMaterial<3.5;
  bool podiumGlazing=vMaterial>5.5;
  bool recessedGlass=facadeGlazing||podiumGlazing;
  float storey=vPosition.y/max(uFloorStep,.0001),storeyAA=max(fwidth(storey),.0001);
  float storeyDetail=1.-smoothstep(.16,.65,storeyAA);
  // Local metres follow each existing wall, so glazing never changes orientation
  // with the camera. Window-to-window variation is static and does not use the RNG.
  float pane=vFacade.x/1.45,paneAA=max(fwidth(pane),.0001);
  float paneDetail=1.-smoothstep(.18,.70,paneAA);
  float room=.5+.5*sin(floor(pane)*4.71+floor(storey)*2.39+vMaterial*19.);
  float glazingTone=mix(.88,mix(.72,1.04,room),paneDetail*storeyDetail);
  vec3 surface=recessedGlass?vec3(.046,.071,.077)*glazingTone:vColour;
  vec3 illumination=(vec3(.24,.29,.35)+vec3(.98,.82,.61)*lambert*lit)*ao;
  // Slab soffits receive indirect light only; a pale top must not make its
  // underside as bright as the sunlit front edge when shadow maps are disabled.
  illumination*=mix(.66,1.,smoothstep(-.85,-.10,n.y));
  vec3 c=surface*illumination;
  if((vMaterial>.5&&vMaterial<1.5)||recessedGlass){
    // Restrained glass response; this is analytic sky colour, not a scene reflection.
    vec3 r=reflect(-eye,n);
    vec3 sky=mix(vec3(.070,.095,.105),vec3(.22,.35,.43),smoothstep(-.15,.70,r.y));
    // Recessed residential glazing is dark at a direct angle; reflections strengthen at grazing angles.
    float f=(recessedGlass?.07:.13)+.34*pow(1.-max(dot(n,eye),0.),5.);
    c=mix(c,sky,f);
  }
  if(vMaterial>1.5&&vMaterial<2.5){
    // Subtle horizontal roller-door corrugation, derivative-filtered at distance.
    float frequency=72.,w=fwidth(vPosition.y*frequency);
    float rib=sin(vPosition.y*frequency)*(.035*(1.-smoothstep(.6,1.8,w)));
    c*=1.+rib;
  }
  vec3 nightLight=vec3(.14,.17,.23);
  if(uDay<.5)c=surface*nightLight+vec3(.05,.025,.006)*max(n.y,0.);
  if(recessedGlass){
    float paneLine=1.-smoothstep(.014-paneAA*.5,.014+paneAA*.5,abs(fract(pane+.5)-.5));
    paneLine=mix(.028,paneLine,paneDetail);
    vec3 frame=vColour*(uDay>.5?illumination:nightLight)*.57;
    c=mix(c,frame,paneLine*.82);
  }
  if(facadeGlazing){
    // Match the source facade's 3.1 m storey grid, including floors whose 3D
    // balconies were omitted by the fixed geometry budget. Never pattern rails.
    float floorPhase=vPosition.y/max(uFloorStep,.0001),bandWidth=.26/3.1;
    float pixelWidth=max(fwidth(floorPhase),.0001);
    float distanceToBand=abs(fract(floorPhase+bandWidth*.5+.5)-.5);
    float band=1.-smoothstep(bandWidth*.5-pixelWidth*.5,bandWidth*.5+pixelWidth*.5,distanceToBand);
    // Sub-pixel storeys converge to their area average instead of shimmering.
    band=mix(bandWidth,band,1.-smoothstep(.20,.70,pixelWidth));
    vec3 slab=vColour*(uDay>.5?illumination:nightLight);
    // Recesses darken immediately below the next slab and at both jambs.
    // These broad cavity cues remain when a geometry floor is budgeted out;
    // fwidth removes sub-pixel variation rather than producing distant shimmer.
    float topShade=smoothstep(.58,.92,fract(storey));
    float jambShade=1.-smoothstep(.01,.10,min(vFacade.y,1.-vFacade.y));
    float cavity=1.-.34*topShade*storeyDetail-.17*jambShade*paneDetail;
    c*=cavity;
    c=mix(c,slab,band);
  }
  float fog=smoothstep(uFog.x,uFog.y,vDepth);
  vec3 haze=uDay>.5?vec3(.60,.68,.69):vec3(.015,.023,.034);
  o=vec4(mix(c,haze,fog*.72),1.);
}`;

  function compile(gl) {
    const shaders = [], p = gl.createProgram();
    try {
      for (const [type, source] of [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, FS]]) {
        const s = gl.createShader(type); shaders.push(s);
        gl.shaderSource(s, source); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Architecture preview: ' + gl.getShaderInfoLog(s));
        gl.attachShader(p, s);
      }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Architecture preview: ' + gl.getProgramInfoLog(p));
      const u = {};
      for (const name of ['uVP', 'uEye', 'uSun', 'uFog', 'uDay', 'uFloorStep', 'uShadow', 'uLightVP', 'uShadowOn', 'uShadowTexel']) u[name] = gl.getUniformLocation(p, name);
      return {p, u};
    } catch (error) { gl.deleteProgram(p); throw error; }
    finally { for (const s of shaders) gl.deleteShader(s); }
  }

  G.disposeArchitecture781 = function (S) {
    const a = S && S.architecture781;
    if (!a) return;
    const gl = S.gl;
    if(S.detail781ShadowMeshes)S.detail781ShadowMeshes=S.detail781ShadowMeshes.filter(mesh=>mesh!==a.mesh);
    if(!S.lost){gl.deleteBuffer(a.mesh.vb); gl.deleteBuffer(a.mesh.ib); gl.deleteVertexArray(a.mesh.vao);gl.deleteProgram(a.program.p);}
    S.architecture781 = null;
  };


  // Exact point-to-segment distance over the entire closed circuit, not the grid.
  // Sector indices are equal-distance reporting bins; they are not invented event sectors.
  const circuitQuery = S => {
    if(S.facadeTrackQuery788&&S.facadeTrackQuery788.CL===S.CL)return S.facadeTrackQuery788;
    const P=S.CL.p,segments=[],N=S.CL.n||P.length;let length=0;
    for(let i=0;i<N;i++){
      const a=P[i],b=P[(i+1)%N],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);
      if(l>1e-9){segments.push({x:a[0],z:a[1],dx,dz,l,l2:l*l,s:length});length+=l;}
    }
    const nearest=(x,z)=>{
      let d2=Infinity,px=0,pz=0,along=0;
      for(const e of segments){
        const t=Math.max(0,Math.min(1,((x-e.x)*e.dx+(z-e.z)*e.dz)/e.l2)),qx=e.x+e.dx*t,qz=e.z+e.dz*t;
        const d=(x-qx)**2+(z-qz)**2;
        if(d<d2){d2=d;px=qx;pz=qz;along=e.s+t*e.l;}
      }
      const rel=((along-(S.gridS||0))%length+length)%length;
      return {d:Math.sqrt(d2),x:px,z:pz,s:along,sector:Math.min(11,Math.floor(rel/length*12))};
    };
    return S.facadeTrackQuery788={CL:S.CL,nearest,length};
  };

  G.installArchitecture781 = function (S) {
    if (!S || !S.gl || !S.CL) return null;
    if (S.architecture781) return S.architecture781.stats;
    const source=S.architecture781Source||[];if(!source.length)return null;
    const mesh=new G.MeshBatch(S.gl,[3,3,3,1,2],false),unit=(S.pack&&S.pack.mPerPt)||G.M_PER_PT||5.93755;
    const route=circuitQuery(S),nearest=route.nearest,BUDGET=150000,SECTOR_BUDGET=BUDGET/12,RADIUS_M=215;
    const stats={garageModules:0,garageDoors:0,hospitalityBays:0,towerParts:0,
      roofParapets:0,facadeFins:0,facadeElevations:0,balconySlabs:0,balconyRails:0,
      balconyPosts:0,balconyDividers:0,recessedGlazingBays:0,verticalCores:0,podiumBays:0,
      creamFacadeBays:0,thinHandrailProfiles:0,facadeDepthVariants:0,
      recessedJambs:0,slabSoffits:0,balconyReturns:0,podiumLintels:0,
      localGlazingCoordinates:true,filteredWindowMullions:true,underSlabShade:true,
      storeyRhythmM:3.1,shaderStoreyBands:true,storeyBandHeightM:.26,
      duplicateFacadesSkipped:0,hiddenFacadeSpansSkipped:0,maxBalconyDepthM:0,
      facadeProfiles:{},sourceShellsChanged:0,sourceTopHeightsChanged:0,
      sourceFootprintsUnchanged:true,sourceHeightsUnchanged:true,sourceRowsUnchanged:true,
      garagesPreserved:true,omittedNominalGarages:0,triangles:0,triangleBudget:BUDGET,drawCalls:1,
      fullCircuitSelection:true,circuitLengthM:route.length*unit,refinementDistanceM:RADIUS_M,
      eligibleTowerParts:0,eligibleFacades:0,coverageSectors:0,budgetSkips:0,
      sectors:Array.from({length:12},(_,i)=>({sector:i+1,eligibleParts:0,eligibleFacades:0,towerParts:0,facades:0,triangles:0})),
      source:'Unchanged OSM footprints and roof heights; full-circuit road-facing generic coastal facades, not surveyed building or event details'};
    let remaining=BUDGET,currentSector=null,edgeRemaining=0;
    const quad=(p,col,material=0,uv=null)=>{
      if(remaining<2||edgeRemaining<2)return false;
      const a=p[0],b=p[1],c=p[2],x=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],y=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
      const n=G.V.norm([x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]]),base=mesh.nv;
      p.forEach((v,i)=>mesh.vert(...v,...n,...col,material,...(uv?uv[i]:[0,0])));mesh.tri(base,base+1,base+2);mesh.tri(base,base+2,base+3);
      remaining-=2;edgeRemaining-=2;if(currentSector)currentSector.triangles+=2;return true;
    };
    const solid=(a,t,n,u0,u1,d0,d1,y0,y1,col,material=0)=>{
      if(remaining<12||edgeRemaining<12||u1<=u0||y1<=y0)return false;
      const at=(u,d,y)=>[a[0]+t[0]*u+n[0]*d,y,a[1]+t[1]*u+n[1]*d];
      const p=[at(u0,d0,y0),at(u1,d0,y0),at(u1,d1,y0),at(u0,d1,y0),at(u0,d0,y1),at(u1,d0,y1),at(u1,d1,y1),at(u0,d1,y1)];
      const reverse=t[0]*n[1]-t[1]*n[0]>0;
      for(const ix of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])quad((reverse?ix.slice().reverse():ix).map(i=>p[i]),col,material);
      return true;
    };
    const panel=(a,t,n,u0,u1,d,y0,y1,col,material=0)=>quad([
      [a[0]+t[0]*u0+n[0]*d,y0,a[1]+t[1]*u0+n[1]*d],
      [a[0]+t[0]*u0+n[0]*d,y1,a[1]+t[1]*u0+n[1]*d],
      [a[0]+t[0]*u1+n[0]*d,y1,a[1]+t[1]*u1+n[1]*d],
      [a[0]+t[0]*u1+n[0]*d,y0,a[1]+t[1]*u1+n[1]*d]],col,material,[[0,0],[0,0],[(u1-u0)*unit,1],[(u1-u0)*unit,1]]);
    // Back faces touch the unchanged source shell and need no extra geometry.
    // Ten slab triangles and six rail triangles leave more budget for real floors.
    const gallery=(a,t,n,u0,u1,d0,d1,y0,y1,col,rail=false,material=0)=>{
      const cost=rail?6:10;if(remaining<cost||edgeRemaining<cost||u1<=u0||y1<=y0)return false;
      const at=(u,d,y)=>[a[0]+t[0]*u+n[0]*d,y,a[1]+t[1]*u+n[1]*d];
      const p=[at(u0,d0,y0),at(u1,d0,y0),at(u1,d1,y0),at(u0,d1,y0),at(u0,d0,y1),at(u1,d0,y1),at(u1,d1,y1),at(u0,d1,y1)];
      const reverse=t[0]*n[1]-t[1]*n[0]>0;
      const faces=rail?[[1,2,6,5],[2,3,7,6],[3,0,4,7]]:[[0,3,2,1],[4,5,6,7],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
      faces.forEach((ix,i)=>quad((reverse?ix.slice().reverse():ix).map(k=>p[k]),!rail&&i===0?col.map(v=>v*.76):col,material));
      return true;
    };
    const jamb=(a,t,n,u,d0,d1,y0,y1,col,reverse)=>{
      const p=[[a[0]+t[0]*u+n[0]*d0,y0,a[1]+t[1]*u+n[1]*d0],[a[0]+t[0]*u+n[0]*d1,y0,a[1]+t[1]*u+n[1]*d1],
        [a[0]+t[0]*u+n[0]*d1,y1,a[1]+t[1]*u+n[1]*d1],[a[0]+t[0]*u+n[0]*d0,y1,a[1]+t[1]*u+n[1]*d0]];
      return quad(reverse?p.reverse():p,col);
    };
    const world=b=>{
      const P=b.p.map(S.toWorld);
      if(P.length>2&&Math.hypot(P[0][0]-P[P.length-1][0],P[0][1]-P[P.length-1][1])<1e-6)P.pop();
      return P;
    };
    const metal=[.17,.19,.20],floor=3.1/unit,seen=new Set(),wallCoverage=new Map();
    const hash=(x,z,k)=>{const q=Math.sin(x*12.9898+z*78.233+k*37.719)*43758.5453;return q-Math.floor(q);};
    const profiles=[
      {name:'cream balcony bands',stone:[.78,.74,.65],core:[.49,.47,.41],rail:[.21,.28,.29],depth:1.38,railHeight:.86,pier:.20,glass:3.0,solidRail:false},
      {name:'pale terraces',stone:[.74,.72,.66],core:[.43,.42,.38],rail:[.66,.64,.57],depth:1.18,railHeight:.42,pier:.32,glass:3.1,solidRail:true},
      {name:'recessed dark glazing',stone:[.69,.70,.66],core:[.26,.31,.31],rail:[.17,.26,.28],depth:1.30,railHeight:.90,pier:.16,glass:3.2,solidRail:false},
      {name:'white coastal wings',stone:[.82,.80,.74],core:[.55,.56,.51],rail:[.27,.33,.34],depth:1.46,railHeight:.82,pier:.38,glass:3.3,solidRail:false}
    ];
    const local=source.filter(b=>!b.pit).map((b,index)=>({b,index,P:world(b)}))
      .filter(p=>p.P.length>=3&&p.P.every(v=>v.every(Number.isFinite))&&Number.isFinite(p.b.h));
    const inside=(p,P)=>{
      let hit=false;for(let i=0,j=P.length-1;i<P.length;j=i++){
        const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])hit=!hit;
      }return hit;
    };
    // One immutable spatial lookup avoids a full city scan at every wall sample.
    const cell=16,grid=new Map();
    for(const item of local){
      const xs=item.P.map(p=>p[0]),zs=item.P.map(p=>p[1]);
      for(let x=Math.floor(Math.min(...xs)/cell);x<=Math.floor(Math.max(...xs)/cell);x++)
        for(let z=Math.floor(Math.min(...zs)/cell);z<=Math.floor(Math.max(...zs)/cell);z++){
          const key=x+','+z;if(!grid.has(key))grid.set(key,[]);grid.get(key).push(item);
        }
    }
    const bins=Array.from({length:12},()=>[]);
    for(const part of local){
      const {b,P,index}=part;if(b.h-(b.y0||0)<18/unit)continue;
      const cx=P.reduce((s,p)=>s+p[0],0)/P.length,cz=P.reduce((s,p)=>s+p[1],0)/P.length;
      let nr=nearest(cx,cz);for(const p of P){const q=nearest(...p);if(q.d<nr.d)nr=q;}
      if(nr.d*unit>RADIUS_M)continue;
      const key=P.map(p=>p.map(v=>v.toFixed(5)).join(',')).sort().join(';')+'|'+b.h+'|'+(b.y0||0);
      if(seen.has(key))continue;seen.add(key);if(G.area(P)<0)P.reverse();
      const profile=profiles[Math.floor(hash(cx,cz,19)*profiles.length)],edges=[];
      for(let i=0;i<P.length;i++){
        const a=P[i],q=P[(i+1)%P.length],dx=q[0]-a[0],dz=q[1]-a[1],len=Math.hypot(dx,dz);
        if(len<3.4/unit||len>140/unit)continue;
        const t=[dx/len,dz/len],n=[t[1],-t[0]],mx=(a[0]+q[0])*.5,mz=(a[1]+q[1])*.5,track=nearest(mx,mz);
        if(track.d*unit>RADIUS_M||((track.x-mx)*n[0]+(track.z-mz)*n[1])/Math.max(track.d,.001)<-.18)continue;
        const margin=Math.min(.24/unit,len*.07),depth=Math.min(profile.depth*(.82+.18*hash(cx,cz,110+i))/unit,len*.22);
        let wallBase=b.y0||0;
        for(const u of [margin,len*.5,len-margin]){
          const p=[a[0]+t[0]*u+n[0]*(depth+.06/unit),a[1]+t[1]*u+n[1]*(depth+.06/unit)];
          for(const other of grid.get(Math.floor(p[0]/cell)+','+Math.floor(p[1]/cell))||[]){
            if(other.b===b||other.b.h<=wallBase||(other.b.y0||0)>(b.y0||0)+.01)continue;
            if(inside(p,other.P))wallBase=Math.max(wallBase,other.b.h);
          }
        }
        if(wallBase>(b.y0||0)+.01)stats.hiddenFacadeSpansSkipped++;
        if(b.h-wallBase<floor)continue;
        const ends=[a,q].map(p=>p.map(v=>v.toFixed(5)).join(',')).sort(),wallKey=ends.join('|'),covered=wallCoverage.get(wallKey)||[];
        if(covered.some(r=>r[0]<=wallBase+.001&&r[1]>=b.h-.001)){stats.duplicateFacadesSkipped++;continue;}
        covered.push([wallBase,b.h]);wallCoverage.set(wallKey,covered);
        edges.push({a,t,n,len,i,track,margin,depth,wallBase,top:b.h});
      }
      edges.sort((a,b)=>a.track.d-b.track.d||a.i-b.i);
      if(!edges.length)continue;
      const sector=stats.sectors[nr.sector];sector.eligibleParts++;sector.eligibleFacades+=edges.length;
      stats.eligibleTowerParts++;stats.eligibleFacades+=edges.length;
      bins[nr.sector].push({P,b,cx,cz,index,profile,edges,dist:nr.d});
    }
    // Every sector receives its own budget: a dense city block cannot consume the lap.
    // The level is chosen once at installation. There are no per-frame geometry rebuilds.
    for(let sectorIndex=0;sectorIndex<12;sectorIndex++){
      const bin=bins[sectorIndex],sector=stats.sectors[sectorIndex];currentSector=sector;
      const facadeCount=sector.eligibleFacades,allowance=facadeCount?Math.floor(SECTOR_BUDGET/facadeCount/2)*2:0;
      bin.sort((a,b)=>a.dist-b.dist||a.index-b.index);
      for(const part of bin){
        let added=false;const profile=part.profile,col=profile.stone;
        for(const e of part.edges){
          edgeRemaining=Math.min(allowance,SECTOR_BUDGET-sector.triangles,remaining);
          if(edgeRemaining<40){stats.budgetSkips++;continue;}
          const {a,t,n,len,margin,depth,wallBase,top}=e,initial=mesh.i.length;
          const first=Math.ceil((wallBase+.6)/floor)*floor,ys=[];
          for(let y=first;y+1.1/unit<top-.22/unit;y+=floor)ys.push(y);
          const bays=Math.max(1,Math.min(4,Math.round((len-2*margin)/(5.5/unit)))),bay=(len-2*margin)/bays;
          const close=e.track.d*unit<85&&edgeRemaining>600,posts=close?Math.min(2,bays-1):0;
          const podiumTop=wallBase<.5/unit?Math.min(wallBase+3.4/unit,top-floor):wallBase;
          const facadeCost=4+8*bays+(podiumTop>wallBase?4:0),perFloor=20+posts*12,
            slots=Math.max(1,Math.floor((edgeRemaining-24-facadeCost)/perFloor));
          const step=Math.max(1,Math.ceil(ys.length/slots));
          // Existing elevations receive separate window bays behind pale structure.
          // The split varies with the source edge length and the deterministic facade profile.
          const back=.035/unit,glassD=.065/unit,face=.24/unit,pier=Math.min(profile.pier/unit,bay*.18);
          panel(a,t,n,margin,len-margin,back,wallBase,top,profile.stone);
          for(let j=0;j<bays;j++){
            const u0=margin+j*bay+pier,u1=margin+(j+1)*bay-pier;
            const slabColour=profile.stone.map(v=>v*(.97+.06*hash(part.cx,part.cz,170+e.i*7+j)));
            if(panel(a,t,n,u0,u1,glassD,Math.max(wallBase+.20/unit,podiumTop),top-.26/unit,slabColour,profile.glass))stats.recessedGlazingBays++;
            // The glazing remains on the unchanged wall; proud jambs and piers
            // give its recess a real side profile when the driving camera passes.
            if(jamb(a,t,n,u0,glassD,face,wallBase,top,profile.core,false))stats.recessedJambs++;
            if(jamb(a,t,n,u1,glassD,face,wallBase,top,profile.core,true))stats.recessedJambs++;
            stats.creamFacadeBays++;
          }
          for(let j=0;j<=bays;j++){
            const u=margin+j*bay;
            panel(a,t,n,Math.max(margin,u-pier),Math.min(len-margin,u+pier),face,wallBase,top,col);
          }
          if(podiumTop>wallBase){
            if(panel(a,t,n,margin,len-margin,glassD,wallBase,podiumTop,profile.core,6))stats.podiumBays++;
            if(panel(a,t,n,margin,len-margin,face+.01/unit,podiumTop-.22/unit,podiumTop,col))stats.podiumLintels++;
          }
          stats.facadeDepthVariants++;
          if(edgeRemaining>100&&len>9/unit){
            const middle=len*(profile.name==='white coastal wings'?.5:.29),w=Math.min(1.8/unit,len*.12);
            if(solid(a,t,n,middle-w*.5,middle+w*.5,.018,.25/unit,wallBase,top,profile.core))stats.verticalCores++;
          }
          for(let f=0;f<ys.length;f+=step){
            if(edgeRemaining<perFloor+12)break;const y=ys[f],railY=y+1.01/unit,front=depth-.08/unit;
            if(gallery(a,t,n,margin,len-margin,back,depth,y-.26/unit,y,col)){stats.balconySlabs++;stats.slabSoffits++;}
            if(gallery(a,t,n,margin+.025/unit,len-margin-.025/unit,face,depth-.025/unit,y+.13/unit,y+profile.railHeight/unit,profile.rail,true,profile.solidRail?0:1)){
              stats.balconyRails++;stats.balconyReturns+=2;
            }
            // A folded two-face cap reads cleanly in motion; save eight triangles per rail.
            if(panel(a,t,n,margin,len-margin,depth+.012/unit,railY-.055/unit,railY,metal)){
              const point=(u,d)=>[a[0]+t[0]*u+n[0]*d,railY,a[1]+t[1]*u+n[1]*d];
              quad([point(margin,front-.025/unit),point(len-margin,front-.025/unit),point(len-margin,depth+.012/unit),point(margin,depth+.012/unit)],metal);
              stats.balconyRails++;stats.thinHandrailProfiles++;
            }
            for(let j=1;j<=posts;j++){
              const u=margin+(len-2*margin)*j/(posts+1),w=.045/unit;
              if(solid(a,t,n,u-w,u+w,front-.02/unit,front+.04/unit,y,railY,metal))stats.balconyPosts++;
            }
          }
          if(solid(a,t,n,margin,len-margin,-.02,.22/unit,top-.28/unit,top,col))stats.roofParapets++;
          if(mesh.i.length>initial){stats.facadeElevations++;sector.facades++;added=true;stats.maxBalconyDepthM=Math.max(stats.maxBalconyDepthM,depth*unit+.012);}
        }
        if(added){stats.towerParts++;sector.towerParts++;stats.facadeProfiles[profile.name]=(stats.facadeProfiles[profile.name]||0)+1;}
      }
    }
    stats.coverageSectors=stats.sectors.filter(s=>s.facades>0).length;
    stats.eligibleSectors=stats.sectors.filter(s=>s.eligibleFacades>0).length;
    stats.fullEligibleCoverage=stats.facadeElevations===stats.eligibleFacades;
    let program=null;
    try{
      program=compile(S.gl);mesh.upload();stats.triangles=mesh.ni/3;stats.gpuBytes=mesh.v.length*4+mesh.i.length*4;
      S.architecture781={mesh,program,stats,floorStep:floor};
      if(!S.detail781ShadowMeshes)S.detail781ShadowMeshes=[];
      if(!S.detail781ShadowMeshes.includes(mesh))S.detail781ShadowMeshes.push(mesh);
      return stats;
    }catch(error){
      if(program)S.gl.deleteProgram(program.p);
      S.gl.deleteBuffer(mesh.vb);S.gl.deleteBuffer(mesh.ib);S.gl.deleteVertexArray(mesh.vao);throw error;
    }
  };
  G.drawArchitecture781 = function (S,VP,fog) {
    if(!S||!S.detail781Enabled)return;
    if(!S.architecture781)G.installArchitecture781(S);
    const a=S.architecture781;if(!a)return;
    const gl=S.gl,p=a.program,u=p.u;
    gl.disable(gl.BLEND);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.DEPTH_TEST);
    gl.useProgram(p.p);gl.uniformMatrix4fv(u.uVP,false,VP);gl.uniform2fv(u.uFog,fog);
    gl.uniform3fv(u.uEye,S.cam&&S.cam.eye||[0,2,0]);gl.uniform3fv(u.uSun,G.sunDirection);
    gl.uniform1f(u.uDay,S.look&&S.look.day?1:0);gl.uniform1f(u.uFloorStep,a.floorStep);G.bindSunShadow(S,p,!!(S.look&&S.look.day));
    a.mesh.draw();
  };
})();
