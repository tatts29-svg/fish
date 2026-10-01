/* Author: Andrew Fisher.
 * v7.81 opt-in architecture preview. Existing OSM footprints and top heights stay fixed.
 * Pit buildings are the existing NOMINAL garage row, not surveyed temporary works.
 * The unsupported continuous garage wall can be omitted in the opt-in photograph study;
 * the comparison restores its exact original source. Real OSM buildings remain in place.
 */
(function () {
  'use strict';
  const G = window.GC3D;
  if (!G || G.installArchitecture781) return;
  const setBuildings = G.setBuildings;
  G.setBuildings = function (list) {
    const result = setBuildings.apply(this, arguments);
    if (G.S) {G.S.architecture781Source = list;G.S.architecture781NominalShown=true;}
    return result;
  };

  G.toggleNominalGarages781 = function (S,show) {
    if(!S||G.S!==S||!S.architecture781Source)return false;
    show=!!show;
    if((S.architecture781NominalShown!==false)===show)return show;
    const source=S.architecture781Source,oldMesh=S.bMesh,oldEdges=S.bEdges;
    const hadDetail=!!S.architecture781;
    // b.pit is explicitly added by the nominal pit-row generator. No OSM source row
    // has this flag; filtering it cannot delete an identified real building or part.
    setBuildings.call(G,show?source:source.filter(b=>!b.pit));
    S.architecture781NominalShown=show;
    S.architecture781OmittedNominal=show?0:source.filter(b=>b.pit).length;
    if(oldMesh&&oldMesh!==S.bMesh){
      S.gl.deleteBuffer(oldMesh.vb);S.gl.deleteBuffer(oldMesh.ib);S.gl.deleteVertexArray(oldMesh.vao);
    }
    if(oldEdges&&oldEdges!==S.bEdges){S.gl.deleteBuffer(oldEdges.buf);S.gl.deleteVertexArray(oldEdges.vao);}
    if(hadDetail){G.disposeArchitecture781(S);G.installArchitecture781(S);}
    S.needsRender=true;
    return show;
  };

  const VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 aColour;
layout(location=3) in float aMaterial;
uniform mat4 uVP;
out vec3 vPosition; out vec3 vNormal; out vec3 vColour;
out float vMaterial; out float vDepth;
void main(){
  vec4 p=uVP*vec4(aPosition,1.);
  gl_Position=p; vPosition=aPosition; vNormal=aNormal;
  vColour=aColour; vMaterial=aMaterial; vDepth=p.w;
}`;
  const FS = `#version 300 es
precision highp float;
in vec3 vPosition; in vec3 vNormal; in vec3 vColour;
in float vMaterial; in float vDepth;
uniform vec3 uEye; uniform vec3 uSun; uniform vec2 uFog; uniform float uDay;
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
  vec3 c=vColour*(vec3(.24,.29,.35)+vec3(.98,.82,.61)*lambert*lit)*ao;
  if(vMaterial>.5&&vMaterial<1.5){
    // Restrained glass response; this is analytic sky colour, not a scene reflection.
    vec3 r=reflect(-eye,n);
    vec3 sky=mix(vec3(.18,.23,.25),vec3(.37,.56,.68),smoothstep(-.15,.70,r.y));
    float f=.13+.56*pow(1.-max(dot(n,eye),0.),5.);
    c=mix(c,sky,f);
  }
  if(vMaterial>1.5){
    // Subtle horizontal roller-door corrugation, derivative-filtered at distance.
    float frequency=72.,w=fwidth(vPosition.y*frequency);
    float rib=sin(vPosition.y*frequency)*(.035*(1.-smoothstep(.6,1.8,w)));
    c*=1.+rib;
  }
  if(uDay<.5)c=vColour*vec3(.14,.17,.23)+vec3(.05,.025,.006)*max(n.y,0.);
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
      for (const name of ['uVP', 'uEye', 'uSun', 'uFog', 'uDay', 'uShadow', 'uLightVP', 'uShadowOn', 'uShadowTexel']) u[name] = gl.getUniformLocation(p, name);
      return {p, u};
    } catch (error) { gl.deleteProgram(p); throw error; }
    finally { for (const s of shaders) gl.deleteShader(s); }
  }

  G.disposeArchitecture781 = function (S) {
    const a = S && S.architecture781;
    if (!a) return;
    const gl = S.gl;
    if(S.detail781ShadowMeshes)S.detail781ShadowMeshes=S.detail781ShadowMeshes.filter(mesh=>mesh!==a.mesh);
    gl.deleteBuffer(a.mesh.vb); gl.deleteBuffer(a.mesh.ib); gl.deleteVertexArray(a.mesh.vao);
    gl.deleteProgram(a.program.p); S.architecture781 = null;
  };

  G.installArchitecture781 = function (S) {
    if (!S || !S.gl || !S.CL) return null;
    if (S.architecture781) return S.architecture781.stats;
    const source = S.architecture781Source || [];
    if (!source.length) return null;
    const mesh = new G.MeshBatch(S.gl, [3, 3, 3, 1], false);
    const unit = (S.pack && S.pack.mPerPt) || G.M_PER_PT || 5.93755;
    const atGrid = S.CL.at(S.gridS || 0);
    const stats = {garageModules: 0,garageDoors: 0,hospitalityBays: 0,towerParts: 0,
      roofParapets: 0,facadeFins: 0,triangles: 0,drawCalls: 1,omittedNominalGarages:S.architecture781OmittedNominal||0,
      source: 'Existing nominal pit garage and OSM building footprints; illustrative facade detail, not surveyed event works'};
    const quad = (p, col, material = 0) => {
      const a = p[0], b = p[1], c = p[2], x = [b[0]-a[0],b[1]-a[1],b[2]-a[2]], y = [c[0]-a[0],c[1]-a[1],c[2]-a[2]];
      const n = G.V.norm([x[1]*y[2]-x[2]*y[1],x[2]*y[0]-x[0]*y[2],x[0]*y[1]-x[1]*y[0]]), base = mesh.nv;
      p.forEach(v => mesh.vert(...v, ...n, ...col, material));
      mesh.tri(base,base+1,base+2);mesh.tri(base,base+2,base+3);
    };
    const solid = (a,t,n,u0,u1,d0,d1,y0,y1,col,material=0) => {
      const at=(u,d,y)=>[a[0]+t[0]*u+n[0]*d,y,a[1]+t[1]*u+n[1]*d];
      const p=[at(u0,d0,y0),at(u1,d0,y0),at(u1,d1,y0),at(u0,d1,y0),at(u0,d0,y1),at(u1,d0,y1),at(u1,d1,y1),at(u0,d1,y1)];
      // n is outward from the source footprint; all six faces are physically shaded.
      const reverse=t[0]*n[1]-t[1]*n[0]>0;
      for(const ix of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])quad((reverse?ix.slice().reverse():ix).map(i=>p[i]),col,material);
    };
    const world = b => {
      const P=b.p.map(S.toWorld);
      if(P.length>2&&Math.hypot(P[0][0]-P[P.length-1][0],P[0][1]-P[P.length-1][1])<1e-6)P.pop();
      return P;
    };
    const white=[.74,.72,.67],metal=[.19,.22,.23],glass=[.09,.15,.18],concrete=[.53,.52,.48],orange=[.86,.27,.04];

    // Low fronts replace the visual reading of the old all-glass pit row without moving it.
    for(const b of source.filter(b=>b.pit&&S.architecture781NominalShown!==false)){
      const P=world(b);if(P.length<3)continue;
      const a=P[0],q=P[1],dx=q[0]-a[0],dz=q[1]-a[1],len=Math.hypot(dx,dz);
      if(len<.2)continue;
      const t=[dx/len,dz/len],mid=[(a[0]+q[0])*.5,(a[1]+q[1])*.5],back=P[2];
      let n=[t[1],-t[0]];if((back[0]-mid[0])*n[0]+(back[1]-mid[1])*n[1]>0)n=[-n[0],-n[1]];
      // Existing garage height is preserved; the door/window arrangement is illustrative.
      const h=b.h,y0=b.y0||0,doorTop=Math.min(h*.55,3.9/unit),floorY=Math.max(doorTop+.08,h*.59),roof=h+.012;
      const bays=Math.max(1,Math.min(4,Math.round(len/(6/unit)))),bay=len/bays;
      solid(a,t,n,0,len,.012,.027,y0,h,concrete);
      for(let k=0;k<bays;k++){
        const u0=k*bay+.035,u1=(k+1)*bay-.035;
        solid(a,t,n,u0,u1,.030,.039,y0+.035,doorTop,metal,2);
        // Head box and genuine depth at each jamb stop the row reading as a flat texture.
        solid(a,t,n,u0-.015,u0+.01,.035,.074,y0,doorTop+.045,white);
        solid(a,t,n,u1-.01,u1+.015,.035,.074,y0,doorTop+.045,white);
        solid(a,t,n,u0-.02,u1+.02,.034,.085,doorTop,doorTop+.055,white);
        solid(a,t,n,u0,u1,.03,.045,floorY,h-.08,glass,1);
        solid(a,t,n,(u0+u1)*.5-.011,(u0+u1)*.5+.011,.047,.07,floorY,h-.06,white);
        stats.garageDoors++;stats.hospitalityBays++;
      }
      // Roof and halfway canopy produce real parallax/shadowing; no added upper storey.
      solid(a,t,n,-.015,len+.015,-.018,.145,floorY-.055,floorY,white);
      solid(a,t,n,-.018,len+.018,-.025,.19,roof-.055,roof,white);
      solid(a,t,n,0,len,.148,.152,floorY-.042,floorY-.019,orange);
      solid(a,t,n,-.012,.035,.025,.112,y0,roof,white);
      solid(a,t,n,len-.035,len+.012,.025,.112,y0,roof,white);
      stats.garageModules++;
    }

    // Detail nearby existing towers only. Do not fabricate an extra city around the track.
    const seen=new Set(),parts=[];
    for(const b of source){
      if(b.pit||b.h-(b.y0||0)<18/unit)continue;
      const P=world(b);if(P.length<3)continue;
      const cx=P.reduce((s,p)=>s+p[0],0)/P.length,cz=P.reduce((s,p)=>s+p[1],0)/P.length;
      const dist=Math.min(...P.map(p=>Math.hypot(p[0]-atGrid[0],p[1]-atGrid[1])));
      if(dist>360/unit)continue;
      const key=[cx.toFixed(3),cz.toFixed(3),b.h.toFixed(3),(b.y0||0).toFixed(3)].join(',');
      if(seen.has(key))continue;seen.add(key);
      if(G.area(P)<0)P.reverse();parts.push({P,b,cx,cz,dist});
    }
    parts.sort((a,b)=>a.dist-b.dist);
    for(const part of parts.slice(0,16)){
      const {P,b}=part,base=b.y0||0,top=b.h;
      const facade=(Math.sin(part.cx*.73+part.cz*.29)+1)*.5;
      const col=[.61+facade*.14,.59+facade*.13,.54+facade*.12];
      for(let i=0;i<P.length;i++){
        const a=P[i],q=P[(i+1)%P.length],dx=q[0]-a[0],dz=q[1]-a[1],len=Math.hypot(dx,dz);
        if(len<.3||len>35)continue;
        const t=[dx/len,dz/len],n=[t[1],-t[0]];
        // Shallow roof coping inside source height. Its outward overhang is < 0.25 m.
        solid(a,t,n,0,len,-.025,.04,Math.max(base,top-.35/unit),top+.006,col);
        stats.roofParapets++;
        // Vertical fins break repetitive all-glass elevations. Generic coastal treatment.
        const bays=Math.min(11,Math.max(1,Math.floor(len/(4.4/unit))));
        for(let j=0;j<=bays;j++){
          const u=j*len/bays;
          solid(a,t,n,Math.max(0,u-.015),Math.min(len,u+.015),.008,.075,base+.05,top-.04,col);
          stats.facadeFins++;
        }
      }
      stats.towerParts++;
    }
    try {
      const program=compile(S.gl);mesh.upload();stats.triangles=mesh.ni/3;
      S.architecture781={mesh,program,stats};
      if(!S.detail781ShadowMeshes)S.detail781ShadowMeshes=[];
      if(!S.detail781ShadowMeshes.includes(mesh))S.detail781ShadowMeshes.push(mesh);
      return stats;
    }catch(error){
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
    gl.uniform1f(u.uDay,S.look&&S.look.day?1:0);G.bindSunShadow(S,p,!!(S.look&&S.look.day));
    a.mesh.draw();
  };
})();
