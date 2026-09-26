#!/usr/bin/env python3
"""v6.53 - CHOOSE THE VEHICLE (Andrew Fisher, 26 Sep 2026: "Add option to change vehicle"; and from 25 Sep: forklift, boom,
scissor lift, tractor, each with a racing style, sliding round corners).

A Vehicle chooser beside View in the showcase: the Coates #26, or Coates plant in the orange - a forklift, a boom lift, a
scissor lift, a tractor - each built in the scene from the same primitives the car is (boxes, tubes, patched cylinders,
wheels that turn on their axles and spin up in a burnout), driven by the same simulation round the same circuit, with the
lap speed brought down to what the machine could plausibly be flogged to and the same slide through the corners. The
engine note drops for the diesel plant. The choice is kept on the device. Nothing about the record is touched: the
backdrop is decoration, and the credit line still says so.

  python3 patch_v653.py <page.html> <bundle gc3d_bundle.js> [builder.py]
"""
import os, re, sys
page, bundle = sys.argv[1], sys.argv[2]; builder = sys.argv[3] if len(sys.argv) > 3 else None

def rep(text, old, new, what, path):
    pat = '\\n'.join('[ \\t]*' + '\\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \\t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

PLANT = r"""
/* v6.53 - COATES PLANT ON THE CIRCUIT (Andrew Fisher, 26 Sep 2026). Four machines in the same part format the car uses -
   {name, material, vertices (position, normal, uv), indices, wheel?, color?} - so drawRaceCar draws them, the wheels turn
   on their axles and spin up in the burnout, and the quality steps apply. Local units are the car's: half a car length is
   one, y=0 is the road, x forward, z to the driver's right. Nothing here is a claim about a particular Coates machine:
   the shapes are the recognisable ones, in the orange, and the credit line says the backdrop is decoration. */
G.PLANT={forklift:{label:'Forklift',speed:.48,grip:.62,note:.60},boom:{label:'Boom lift',speed:.38,grip:.55,note:.55},scissor:{label:'Scissor lift',speed:.34,grip:.52,note:.55},tractor:{label:'Tractor',speed:.55,grip:.66,note:.50}};
G.plantModel=function(kind,quality){
  const cache=G._plantModels||(G._plantModels={}),level=quality==='balanced'?'balanced':'high',key=kind+':'+level;
  if(cache[key])return cache[key];
  const TAU=Math.PI*2,parts=[],segments=n=>level==='high'||n<=8?n:Math.max(8,Math.ceil(n*.5/4)*4);
  const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);},mix=(a,b,t)=>a+(b-a)*t;
  function group(name,material,opts){const p={name,material,vertices:[],indices:[]};if(opts&&opts.wheel)p.wheel=opts.wheel;if(opts&&opts.color)p.color=opts.color;parts.push(p);return p;}
  function add(p,positions,indices,uvs,expected){
    const ns=positions.map(()=>[0,0,0]),clean=[];
    for(let i=0;i<indices.length;i+=3){
      let a=indices[i],b=indices[i+1],c=indices[i+2],n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));
      if(Math.hypot(...n)<1e-13)continue;
      const center=positions[a].map((v,k)=>(v+positions[b][k]+positions[c][k])/3);
      if(expected&&dot(n,typeof expected==='function'?expected(center):expected)<0){indices[i+1]=c;indices[i+2]=b;n=n.map(x=>-x);}
      clean.push(indices[i],indices[i+1],indices[i+2]);
      for(const j of [a,b,c])for(let k=0;k<3;k++)ns[j][k]+=n[k];
    }
    const base=p.vertices.length/8;
    positions.forEach((q,i)=>{const fallback=expected?(typeof expected==='function'?expected(q):expected):[0,1,0],n=norm(Math.hypot(...ns[i])>1e-15?ns[i]:fallback);p.vertices.push(...q,...n,...(uvs&&uvs[i]||[0,0]));});
    for(const j of clean)p.indices.push(base+j);
  }
  function patch(p,fn,nu,nv,expected){nu=segments(nu);nv=segments(nv);const vs=[],uv=[],ix=[];
    for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){vs.push(fn(i/nu,j/nv));uv.push([i/nu,j/nv]);}
    for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;ix.push(a,b,b+1,a,b+1,a+1);}
    add(p,vs,ix,uv,expected);}
  function quad(p,a,b,c,d,out){add(p,[a,b,c,d],[0,1,2,0,2,3],[[0,0],[1,0],[1,1],[0,1]],out);}
  function box(p,x0,x1,y0,y1,z0,z1){
    quad(p,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);quad(p,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]);
    quad(p,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0]);quad(p,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0]);
    quad(p,[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],[-1,0,0]);quad(p,[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[1,0,0]);}
  function tube(p,a,b,r,n){n=n||10;const axis=norm(sub(b,a)),side=norm(cross(axis,Math.abs(axis[1])<.85?[0,1,0]:[1,0,0])),up=cross(axis,side);
    patch(p,(t,u)=>{const ang=u*TAU;return a.map((v,k)=>mix(v,b[k],t)+r*(side[k]*Math.cos(ang)+up[k]*Math.sin(ang)));},1,n,q=>{const v=sub(q,a),t=dot(v,axis);return v.map((w,k)=>w-axis[k]*t);});
    for(const [c,d] of [[a,-1],[b,1]]){const pts=[];for(let k=0;k<n;k++){const ang=k/n*TAU;pts.push(c.map((v,i)=>v+r*(side[i]*Math.cos(ang)+up[i]*Math.sin(ang))));}const ix=[];for(let k=1;k<n-1;k++)ix.push(0,k,k+1);add(p,pts,ix,null,axis.map(v=>v*d));}}
  function ball(p,c,r,n){patch(p,(a,b)=>{const th=a*TAU,ph=b*Math.PI;return[c[0]+r*Math.cos(th)*Math.sin(ph),c[1]+r*Math.cos(ph),c[2]+r*Math.sin(th)*Math.sin(ph)];},n||16,n?Math.ceil(n/2):8,q=>sub(q,c));}
  /* a wheel: a tyre on the z axis with a hub set into it, both turning on the axle (wheel:{x,y}); a negative x is a rear */
  function wheel(x,y,z,R,W,n){n=n||20;const tyre=group('tyre '+x.toFixed(2)+' '+z.toFixed(2),'rubber',{wheel:{x,y}}),hub=group('hub '+x.toFixed(2)+' '+z.toFixed(2),'alloy',{wheel:{x,y}});
    const zs=z<0?-1:1,z0=z-W/2*zs,z1=z+W/2*zs;
    patch(tyre,(a,b)=>{const t=a*TAU;return[x+Math.cos(t)*R,y+Math.sin(t)*R,mix(z0,z1,b)];},n,1,q=>[q[0]-x,q[1]-y,0]);
    for(const [zz,d] of [[z0,-zs],[z1,zs]]){const pts=[[x,y,zz]];for(let k=0;k<n;k++){const t=k/n*TAU;pts.push([x+Math.cos(t)*R,y+Math.sin(t)*R,zz]);}const ix=[];for(let k=1;k<=n;k++)ix.push(0,k,k%n+1);add(tyre,pts,ix,null,[0,0,d]);}
    const hz=z+W/2*zs*1.02,hr=R*.55,pts=[[x,y,hz]];for(let k=0;k<n;k++){const t=k/n*TAU;pts.push([x+Math.cos(t)*hr,y+Math.sin(t)*hr,hz]);}const ix=[];for(let k=1;k<=n;k++)ix.push(0,k,k%n+1);add(hub,pts,ix,null,[0,0,zs]);
    for(let k=0;k<5;k++){const t=k/5*TAU;tube(hub,[x,y,hz],[x+Math.cos(t)*hr*.9,y+Math.sin(t)*hr*.9,hz],R*.05,6);}}
  const ORANGE=[1,.42,.08],BLACK=[.05,.055,.06],STEEL=[.55,.58,.62],WHITE=[.95,.95,.93],YELLOW=[.95,.75,.10];
  const paint=name=>group(name,'plant'),dark=name=>group(name,'interior'),steel=name=>group(name,'steel'),white=name=>group(name,'plantWhite');
  const helmet=(x,y,z)=>{ball(white('helmet'),[x,y,z],.085,14);box(dark('visor'),x+.02,x+.09,y-.02,y+.03,z-.06,z+.06);box(paint('shoulders'),x-.12,x+.1,y-.30,y-.10,z-.16,z+.16);};
  if(kind==='forklift'){
    const body=paint('body');box(body,-.62,.30,.16,.52,-.30,.30);box(body,-.80,-.62,.14,.62,-.28,.28);box(body,-.62,-.05,.52,.68,-.28,.28);
    box(dark('floor'),-.05,.30,.52,.55,-.28,.28);box(dark('seat'),-.45,-.15,.68,.76,-.14,.14);box(dark('backrest'),-.48,-.42,.76,1.02,-.15,.15);
    box(dark('dash'),.10,.24,.55,.78,-.20,.20);tube(steel('column'),[.12,.72,0],[-.02,.86,0],.018,8);tube(dark('steering wheel'),[-.02,.86,-.001],[-.02,.86,.001],.10,14);
    const guard=steel('overhead guard');[[.28,.55],[-.62,.68]].forEach(([x,y0])=>[-.27,.27].forEach(z=>tube(guard,[x,y0,z],[x,1.18,z],.022,8)));
    box(guard,-.66,.34,1.16,1.20,-.29,.29);[-.20,-.05,.10].forEach(x=>tube(guard,[x,1.17,-.27],[x,1.17,.27],.012,6));
    const mast=steel('mast');[-.20,.20].forEach(z=>{tube(mast,[.40,.06,z],[.36,1.32,z],.032,8);});[.30,.75,1.20].forEach(y=>tube(mast,[.39-.03*y,y,-.2],[.39-.03*y,y,.2],.02,6));
    box(dark('carriage'),.42,.46,.10,.50,-.24,.24);
    const forks=steel('forks');[[.10,.16],[-.16,-.10]].forEach(([z0,z1])=>{box(forks,.46,1.12,.04,.075,z0,z1);box(forks,.44,.48,.075,.50,z0,z1);});
    box(group('stripe','plantBlack'),-.62,.30,.30,.36,-.302,.302);box(group('beacon','lampRed'),-.2,-.1,1.20,1.28,-.05,.05);
    helmet(-.30,1.0,0);
    wheel(.22,.17,.33,.17,.12);wheel(.22,.17,-.33,.17,.12);wheel(-.52,.13,.29,.13,.10);wheel(-.52,.13,-.29,.13,.10);
  }else if(kind==='boom'){
    const ch=paint('chassis');box(ch,-.72,.72,.16,.36,-.34,.34);box(paint('turret'),-.42,.28,.36,.62,-.30,.30);box(dark('counterweight'),-.64,-.42,.36,.68,-.26,.26);
    box(group('stripe','plantBlack'),-.72,.72,.20,.25,-.342,.342);
    tube(paint('boom'),[-.20,.62,0],[.82,1.16,0],.078,10);tube(steel('boom inner'),[.78,1.14,0],[1.36,1.46,0],.056,10);tube(steel('jib'),[1.34,1.45,0],[1.56,1.50,0],.04,8);
    const bk=paint('basket');box(bk,1.44,1.86,1.48,1.53,-.30,.30);box(bk,1.44,1.86,1.53,1.64,-.30,-.27);box(bk,1.44,1.86,1.53,1.64,.27,.30);box(bk,1.44,1.47,1.53,1.64,-.30,.30);box(bk,1.83,1.86,1.53,1.64,-.30,.30);
    const rail=steel('rails');[[1.46,-.28],[1.46,.28],[1.84,-.28],[1.84,.28]].forEach(([x,z])=>tube(rail,[x,1.53,z],[x,1.98,z],.016,6));
    [1.75,1.98].forEach(y=>{tube(rail,[1.46,y,-.28],[1.84,y,-.28],.014,6);tube(rail,[1.46,y,.28],[1.84,y,.28],.014,6);tube(rail,[1.46,y,-.28],[1.46,y,.28],.014,6);tube(rail,[1.84,y,-.28],[1.84,y,.28],.014,6);});
    helmet(1.66,2.05,0);box(group('beacon','lampRed'),-.62,-.54,.68,.76,-.04,.04);
    wheel(.50,.17,.37,.17,.14);wheel(.50,.17,-.37,.17,.14);wheel(-.50,.17,.37,.17,.14);wheel(-.50,.17,-.37,.17,.14);
  }else if(kind==='scissor'){
    const ch=paint('chassis');box(ch,-.62,.62,.13,.34,-.32,.32);box(dark('pothole guards'),-.55,.55,.06,.13,-.30,.30);box(group('stripe','plantBlack'),-.62,.62,.18,.23,-.322,.322);
    const arms=steel('scissor arms');for(let i=0;i<3;i++){const b=.34+i*.28,t=b+.28;[-.27,.27].forEach(z=>{tube(arms,[-.55,b,z],[.55,t,z],.022,8);tube(arms,[.55,b,z],[-.55,t,z],.022,8);});tube(arms,[-.55,b,-.27],[-.55,b,.27],.02,6);tube(arms,[.55,b,-.27],[.55,b,.27],.02,6);}
    box(steel('platform'),-.70,.70,1.18,1.24,-.32,.32);box(group('platform edge','plantBlack'),-.70,.70,1.24,1.30,-.32,.32);
    const rail=steel('rails');[[-.68,-.30],[-.68,.30],[.68,-.30],[.68,.30],[0,-.30],[0,.30]].forEach(([x,z])=>tube(rail,[x,1.30,z],[x,1.68,z],.016,6));
    [1.49,1.68].forEach(y=>{tube(rail,[-.68,y,-.30],[.68,y,-.30],.014,6);tube(rail,[-.68,y,.30],[.68,y,.30],.014,6);tube(rail,[-.68,y,-.30],[-.68,y,.30],.014,6);tube(rail,[.68,y,-.30],[.68,y,.30],.014,6);});
    helmet(.10,1.76,.05);box(group('beacon','lampRed'),-.05,.05,1.68,1.76,-.34,-.30);
    wheel(.42,.12,.31,.12,.10);wheel(.42,.12,-.31,.12,.10);wheel(-.42,.12,.31,.12,.10);wheel(-.42,.12,-.31,.12,.10);
  }else{ /* tractor */
    const hood=paint('hood');box(hood,.15,.86,.34,.68,-.24,.24);box(dark('grille'),.86,.89,.36,.66,-.22,.22);box(group('grille bars','steel'),.89,.90,.40,.62,-.20,.20);
    box(paint('cab lower'),-.35,.15,.34,.62,-.30,.30);box(group('cab glass','glass'),-.33,.13,.62,1.05,-.28,.28);
    const pil=steel('cab pillars');[[-.33,-.28],[-.33,.28],[.13,-.28],[.13,.28]].forEach(([x,z])=>tube(pil,[x,.62,z],[x,1.06,z],.02,6));box(paint('roof'),-.40,.20,1.05,1.11,-.33,.33);
    tube(steel('exhaust'),[.55,.68,.17],[.55,1.16,.17],.026,8);tube(steel('air intake'),[.40,.68,-.16],[.40,1.0,-.16],.03,8);
    [[.28,.50],[-.50,-.28]].forEach(([z0,z1])=>box(paint('mudguard'),-.64,-.06,.56,.74,z0,z1));
    box(group('stripe','plantBlack'),.15,.86,.50,.55,-.242,.242);box(group('beacon','lampRed'),-.15,-.05,1.11,1.19,-.05,.05);
    helmet(-.10,.92,0);box(dark('seat'),-.28,-.02,.62,.70,-.13,.13);tube(dark('steering wheel'),[.02,.82,-.001],[.02,.82,.001],.10,14);
    wheel(-.35,.34,.42,.34,.20,24);wheel(-.35,.34,-.42,.34,.20,24);wheel(.58,.17,.31,.17,.12);wheel(.58,.17,-.31,.17,.12);
  }
  const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let triangles=0,vertices=0;
  for(const p of parts){
    for(let i=0;i<p.vertices.length;i+=8){for(let k=0;k<8;k++)if(!Number.isFinite(p.vertices[i+k]))throw Error('Non-finite plant vertex: '+p.name);for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],p.vertices[i+k]);bounds.max[k]=Math.max(bounds.max[k],p.vertices[i+k]);}}
    triangles+=p.indices.length/3;vertices+=p.vertices.length/8;p.vertices=new Float32Array(p.vertices);p.indices=new Uint32Array(p.indices);
  }
  const model={parts,bounds,stats:{triangles,vertices,parts:parts.length,quality:level,kind:'original parametric '+kind}};
  cache[key]=model;return model;
};
/* the vehicle on the circuit: the car, or one of the plant. The parts are rebuilt on the next draw; the lap speed and the
   cornering grip are scaled to the machine, the engine note with them. */
G.setVehicle=function(kind){
  const S=G.S,k=G.PLANT[kind]?kind:'car';G.vehicle=k;if(!S)return k;
  if(S.vehicle===k)return k;S.vehicle=k;S.raceCarGeometryQuality=null;
  const T=S.tune;if(T.vmax0==null){T.vmax0=T.vmax;T.aLat0=T.aLat;}
  const V=G.PLANT[k]||{speed:1,grip:1,note:1};T.vmax=T.vmax0*V.speed;T.aLat=T.aLat0*V.grip;if(S.rebuildSpeed)S.rebuildSpeed();
  if(G.sound)G.sound.vRate=V.note;
  return k;
};
"""

BUNDLE_EDITS = [
 ('plant materials',
  "const materials={paint:[[.020,.026,.033],.26,.035,1],glass:[[.012,.035,.055],.13,.05,2],rubber:[[.018,.021,.024],.84,0,3],alloy:[[.12,.14,.16],.36,.78,4],carbon:[[.009,.012,.014],.43,.08,5],grille:[[.012,.014,.016],.62,.25,5],lampWhite:[[1,1,1],.22,0,6],lampRed:[[.8,.01,.003],.22,0,7],interior:[[.025,.028,.033],.86,0,3],decal:[[.93,.95,.96],.4,0,8]};",
  "const materials={paint:[[.020,.026,.033],.26,.035,1],glass:[[.012,.035,.055],.13,.05,2],rubber:[[.018,.021,.024],.84,0,3],alloy:[[.12,.14,.16],.36,.78,4],carbon:[[.009,.012,.014],.43,.08,5],grille:[[.012,.014,.016],.62,.25,5],lampWhite:[[1,1,1],.22,0,6],lampRed:[[.8,.01,.003],.22,0,7],interior:[[.025,.028,.033],.86,0,3],decal:[[.93,.95,.96],.4,0,8],\n  /* v6.53 - the plant's own: Coates orange, plain colour (the paint kind carries the car's livery rules, which are the car's) */\n  plant:[[1,.42,.08],.40,.10,3],plantBlack:[[.05,.055,.06],.55,.05,3],plantWhite:[[.95,.95,.93],.40,.05,3],steel:[[.50,.53,.57],.42,.55,4]};"),
 ('plant models before the quality sync',
  "G.syncRaceCarQuality=function(S){\n const level=S.quality&&S.quality.name==='balanced'?'balanced':'high';\n if(S.raceCarGeometryQuality===level&&S.raceCarParts)return;\n const model=G.raceCarModel(level),parts=model.parts.slice().sort((a,b)=>(a.material==='glass')-(b.material==='glass'));\n if(G.raceCarDecals)parts.push(...G.raceCarDecals());",
  PLANT + "G.syncRaceCarQuality=function(S){\n const level=S.quality&&S.quality.name==='balanced'?'balanced':'high',kind=S.vehicle||G.vehicle||'car',tag=level+':'+kind;\n if(S.raceCarGeometryQuality===tag&&S.raceCarParts)return;\n const model=kind==='car'?G.raceCarModel(level):G.plantModel(kind,level),parts=model.parts.slice().sort((a,b)=>(a.material==='glass')-(b.material==='glass'));\n if(kind==='car'&&G.raceCarDecals)parts.push(...G.raceCarDecals());   /* v6.53 - the plant carries no car decals */"),
 ('quality tag',
  " releaseParts(S.gl,S.raceCarParts);S.raceCarParts=uploaded;S.raceCarGeometryQuality=level;",
  " releaseParts(S.gl,S.raceCarParts);S.raceCarParts=uploaded;S.raceCarGeometryQuality=tag;"),
 ('engine note per vehicle (loops)',
  "      SND.nodes.loops.forEach((L,i)=>{set(L.src.playbackRate,(r.rpm/L.native)*(1+dop),ta,.03);set(L.g.gain,Math.sqrt(ws[i]/sw)*(.62+.38*r.thr),ta,.05);});}",
  "      SND.nodes.loops.forEach((L,i)=>{set(L.src.playbackRate,(r.rpm/L.native)*(1+dop)*(SND.vRate||1),ta,.03);set(L.g.gain,Math.sqrt(ws[i]/sw)*(.62+.38*r.thr),ta,.05);});}   /* v6.53 - the note drops for the plant */"),
 ('engine note per vehicle (designed)',
  "    SND.rate=(r.rpm/R0)*(1+dop);\n    if(SND.nodes.loops){",
  "    SND.rate=(r.rpm/R0)*(1+dop)*(SND.vRate||1);\n    if(SND.nodes.loops){"),
]

PAGE_EDITS = [
 ('vehicle chooser markup',
  """        <label class="shloop shbackl" id="showViewL" hidden>View <select id="showView" class="shbtn shsel" aria-label="Camera — which view of the circuit">""",
  """        <label class="shloop shvehl" id="showVehicleL" hidden title="What drives the circuit: the Coates #26, or Coates plant in the orange — decoration, never a record (v6.53)">Vehicle <select id="showVehicle" class="shbtn shsel" aria-label="Vehicle on the circuit"><option value="car">Coates #26</option><option value="forklift">Forklift</option><option value="boom">Boom lift</option><option value="scissor">Scissor lift</option><option value="tractor">Tractor</option></select></label>
        <label class="shloop shbackl" id="showViewL" hidden>View <select id="showView" class="shbtn shsel" aria-label="Camera — which view of the circuit">"""),
 ('vehicle pref',
  """function showViewGet(){""",
  """/* v6.53 - the vehicle on the circuit, kept on the device */
const VEHICLE_KEY = 'gc500.showvehicle';
function showVehicleGet(){ try { const v = localStorage.getItem(VEHICLE_KEY); return v && window.GC3D && GC3D.PLANT && (v === 'car' || GC3D.PLANT[v]) ? v : 'car'; } catch (e) { return 'car'; } }
function showVehicleSet(v){ try { localStorage.setItem(VEHICLE_KEY, v); } catch (e) {} if (window.GC3D && GC3D.setVehicle) GC3D.setVehicle(v); }
function showViewGet(){"""),
 ('vehicle sync',
  """  const sel = $('#showView'); if (sel && GC3D.setView) GC3D.setView(sel.value || 'hero');
}""",
  """  const sel = $('#showView'); if (sel && GC3D.setView) GC3D.setView(sel.value || 'hero');
  const vl = $('#showVehicleL'); if (vl) { vl.hidden = !on; const vs = $('#showVehicle'); if (vs) { vs.value = showVehicleGet(); if (GC3D.setVehicle) GC3D.setVehicle(vs.value); } }   /* v6.53 */
}"""),
 ('vehicle wiring',
  """  { const se = $('#showEngine'); if (se) se.onchange = () => { if (window.GC3D && GC3D.sound && GC3D.sound.setMode) GC3D.sound.setMode(se.value); }; }   /* v6.51 */""",
  """  { const se = $('#showEngine'); if (se) se.onchange = () => { if (window.GC3D && GC3D.sound && GC3D.sound.setMode) GC3D.sound.setMode(se.value); }; }   /* v6.51 */
  { const sv = $('#showVehicle'); if (sv) sv.onchange = () => showVehicleSet(sv.value); }   /* v6.53 */"""),
 ('vehicle at mount',
  """    if (GC3D.setView) GC3D.setView(showViewGet());
    showDriveApply();""",
  """    if (GC3D.setView) GC3D.setView(showViewGet());
    if (GC3D.setVehicle) GC3D.setVehicle(showVehicleGet());   /* v6.53 */
    showDriveApply();"""),
]
for path in [bundle, page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    if path != builder:
        for what, old, new in BUNDLE_EDITS: t = rep(t, old, new, what, path)
    if path != bundle:
        for what, old, new in PAGE_EDITS: t = rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
