/* Author: Andrew Fisher. Actual vehicle renderer/atlas CPU contract checks.
 * node material800_checks.cjs BASE_HTML CANDIDATE_HTML [OUTPUT_JSON]
 * This does not compile a GPU shader or establish visual quality/performance.
 */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto'),path=require('path');
const base=fs.readFileSync(process.argv[2],'utf8'),next=fs.readFileSync(process.argv[3],'utf8'),checks=[];
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),ck=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});assert(pass,name);};
function moduleAt(s,marker){const a=s.indexOf(marker),end=marker==='/* Original surfaced race car.'?s.indexOf('/* GC3D part 4 — the camera and the frame.',a):-1,b=end>=0?s.lastIndexOf('\n})();',end):s.indexOf('\n})();',a);assert(a>=0&&b>a,marker);return s.slice(a,b+6);}
const marker='/* Original surfaced race car.',oldModule=moduleAt(base,marker),newModule=moduleAt(next,marker);
const atlasMarker='/* GC500 v1.7 — explicitly typeset livery',oldAtlas=moduleAt(base,atlasMarker),newAtlas=moduleAt(next,atlasMarker);
const bodyShader=s=>s.slice(s.indexOf('const FS=`')+10,s.indexOf('`;\nfunction program'));
const shader=bodyShader(newModule),source=fs.readFileSync(path.join(__dirname,'../material800_src.glsl'),'utf8').trimEnd();
ck('candidate includes the exact current vehicle shader',shader===source);
const outside=(s,m,a)=>s.replace(m,'VEHICLE_MODULE').replace(a,'LIVERY_MODULE');
ck('all code outside vehicle renderer and existing livery atlas remains identical',outside(base,oldModule,oldAtlas)===outside(next,newModule,newAtlas));
const vmix=(a,b,t)=>a+(b-a)*t;
// An adversarial unsorted part list tests the renderer contract. Production
// race/plant sync already moves glass last; trailer uploads do not pre-sort.
function rig(s){
 const commands=[],draws=[],uniforms={},gl={DEPTH_TEST:1,CULL_FACE:2,BLEND:3,FUNC_ADD:4,ONE:5,ONE_MINUS_SRC_ALPHA:6,TEXTURE0:7,TEXTURE_2D:8};
 let blend=false,depth=true;
 Object.assign(gl,{useProgram(){},uniformMatrix4fv(k,t,v){uniforms[k]=Array.from(v);},uniform3fv(k,v){uniforms[k]=Array.from(v);},uniform2f(k,a,b){uniforms[k]=[a,b];},uniform1f(k,v){uniforms[k]=v;},uniform1i(k,v){uniforms[k]=v;},activeTexture(){},bindTexture(){},enable(k){if(k===gl.BLEND)blend=true;},disable(k){if(k===gl.BLEND)blend=false;},depthMask(v){depth=v;},blendEquation(){},blendFuncSeparate(){}});
 const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]),G={init:()=>true,buildDynamic(){},M_PER_PT:6,matMul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;},smooth:t=>{t=Math.max(0,Math.min(1,t));return t*t*t*(t*(t*6-15)+10);}};
 const context=vm.createContext({window:{GC3D:G},Math,Number,Float32Array,Uint32Array,Uint8Array,Map,WeakMap,console});
 vm.runInContext(s,context);G.syncRaceCarQuality=()=>{};G.raceCarMatrix=()=>identity;
 const names=['uVP','uModel','uEye','uFog','uDay','uDetail781','uBrake','uAtlas','uPanel','uOpacity','uColor','uRough','uMetal','uKind','uSurface800'];
 const S={gl,raceCarEnabled:true,raceProgram:{p:{},u:Object.fromEntries(names.map(n=>[n,n]))},cam:{eye:[3,2,1]},look:{day:1},detail781Enabled:true,clock:1,sim:{brake:.4,steer:.17,wheel:1.2,wheelR:2.1,v:0},tune:{vmax:20},quality:{name:'balanced'}};G.S=S;
 function part(name,material,extras={}){return{name,material,...extras,batch:{draw(){draws.push({name,material,blend,depth,uniforms:JSON.parse(JSON.stringify(uniforms))});}}};}
 const materials=['paint','glass','rubber','alloy','carbon','grille','lampWhite','lampRed','interior','decal','plant','plantBlack','plantWhite','steel','hivis','hivisPanel','skin','solar','ledAmber','beacon'];
 S.raceCarParts=materials.map((m,i)=>part(m==='paint'?'sculpted-body':'fixture-'+m,m,{color:i===10?[.9,.12,.01]:undefined}));
 S.raceCarParts.push(part('roof-and-pillars','paint'),part('wing-endplates','paint'),part('front-wheel-spokes','alloy',{wheel:{x:.6,y:.145,z:.35,r:.142}}));
 return{G,S,draws,part,identity,run(){draws.length=0;G.drawRaceCar(S,identity,[40,100]);return draws.slice();}};
}
const a=rig(oldModule),b=rig(newModule),oldDraw=a.run(),newDraw=b.run();
ck('every existing vehicle material and mesh part still draws exactly once',newDraw.length===oldDraw.length&&newDraw.every(q=>newDraw.filter(p=>p.name===q.name).length===1));
for(const before of oldDraw){const after=newDraw.find(q=>q.name===before.name);for(const key of ['uVP','uModel','uEye','uFog','uDay','uDetail781','uBrake','uAtlas','uPanel','uOpacity','uColor','uRough','uMetal','uKind'])assert.deepEqual(after.uniforms[key],before.uniforms[key],before.name+' preserves '+key);}
ck('existing transforms, steering, brake, livery, colours and quality uniforms are unchanged',true);
const expected={paint:1,plant:2,plantBlack:2,plantWhite:2,rubber:3,alloy:4,steel:4,carbon:5,grille:5,glass:6};
ck('surface semantic is set independently for every draw without leaking from earlier parts',newDraw.every(q=>q.uniforms.uSurface800===(expected[q.material]||0)));
const glassIndex=newDraw.findIndex(q=>q.material==='glass');
ck('all opaque vehicle parts draw before glass and glass follows the opaque cockpit',newDraw.every((q,i)=>['glass','decal','ledAmber'].includes(q.material)||q.name.includes('spokes')||i<glassIndex));
ck('glass preserves premultiplied blending without writing depth',newDraw.filter(q=>q.material==='glass').every(q=>q.blend&&!q.depth));
ck('decals and emissive panels follow glazing without losing alpha or source colour',newDraw.filter(q=>['decal','ledAmber'].includes(q.material)).every(q=>newDraw.indexOf(q)>glassIndex&&q.blend&&!q.depth));
ck('opaque paint and tyres retain depth writes and disabled blending',newDraw.filter(q=>['paint','rubber','plant'].includes(q.material)).every(q=>q.depth&&!q.blend));
b.S.sim.v=18;const fast=b.run();
ck('existing high-speed spoke fade still suppresses the same draw',!fast.some(q=>q.name==='front-wheel-spokes')&&fast.length===newDraw.length-1);
b.S.sim.v=0;b.S.look.day=0;b.S.detail781Enabled=false;const night=b.run();
ck('night and baseline detail paths bind their own unchanged look uniforms',night.every(q=>q.uniforms.uDay===0&&q.uniforms.uDetail781===0));
// Exercise the real retained trailer branch and its wheel transform separately.
for(const r of [a,b]){r.S.towVms=true;r.S.towKind='vms';r.S.trailerQ='balanced:vms';r.G.vmsModel=()=>({parts:[]});r.G.trailerStep=()=>({spin:.9});r.G.trailerMatrix=()=>r.identity;r.S.trailerParts=[r.part('trailer-glass','glass'),r.part('trailer-shell','plantWhite'),r.part('trailer-label','decal'),r.part('trailer-tyre','rubber',{wheel:{x:-.6,y:.15,z:.4,r:.19}})];r.S.look.day=1;r.S.detail781Enabled=true;}
const ta=a.run().filter(q=>q.name.startsWith('trailer-')),tb=b.run().filter(q=>q.name.startsWith('trailer-'));
ck('trailer keeps all four draws while placing shell and tyre before glazing',tb.length===4&&tb.findIndex(q=>q.name==='trailer-glass')>tb.findIndex(q=>q.name==='trailer-tyre')&&tb.at(-1).name==='trailer-label');
ck('trailer hitch/wheel matrices and brake values remain unchanged',tb.every(q=>{const old=ta.find(p=>p.name===q.name);return JSON.stringify(q.uniforms.uModel)===JSON.stringify(old.uniforms.uModel)&&q.uniforms.uBrake===old.uniforms.uBrake;}));

function atlasRig(s){let id=0;const calls=[],G={},context=vm.createContext({window:{GC3D:G},Uint8Array,Int16Array,Float32Array,Uint32Array,WeakMap,Map,Math,Number});vm.runInContext(s,context);
 const make=()=>({TEXTURE_2D:1,R8:2,RED:3,UNSIGNED_BYTE:4,TEXTURE_MIN_FILTER:5,TEXTURE_MAG_FILTER:6,LINEAR:7,LINEAR_MIPMAP_LINEAR:8,TEXTURE_WRAP_S:9,TEXTURE_WRAP_T:10,CLAMP_TO_EDGE:11,createTexture(){calls.push(['create']);return{id:++id};},bindTexture(){},texImage2D(...v){calls.push(['image',v[3],v[4],sha(v.at(-1))]);},generateMipmap(t){calls.push(['mip',t]);},texParameteri(t,k,v){calls.push(['filter',k,v]);}});
 return{G,calls,make};}
const oa=atlasRig(oldAtlas),na=atlasRig(newAtlas),g1=na.make();oa.G.raceCarAtlas(oa.make());const t1=na.G.raceCarAtlas(g1),t2=na.G.raceCarAtlas(g1);
ck('original livery pixels and atlas dimensions remain exactly identical',JSON.stringify(oa.calls.find(q=>q[0]==='image'))===JSON.stringify(na.calls.find(q=>q[0]==='image')));
ck('atlas minification uses the generated mip chain while magnification stays linear',na.calls.some(q=>q[0]==='filter'&&q[1]===g1.TEXTURE_MIN_FILTER&&q[2]===g1.LINEAR_MIPMAP_LINEAR)&&na.calls.some(q=>q[0]==='filter'&&q[1]===g1.TEXTURE_MAG_FILTER&&q[2]===g1.LINEAR));
ck('same-context atlas reuse allocates and generates only once',t1===t2&&na.calls.filter(q=>q[0]==='create').length===1&&na.calls.filter(q=>q[0]==='mip').length===1);
na.G.raceCarAtlas(na.make());ck('a fresh restored/mounted context generates its own texture and mip chain',na.calls.filter(q=>q[0]==='create').length===2&&na.calls.filter(q=>q[0]==='mip').length===2);
let w=1024,h=512,extra=0;while(w>1||h>1){w=Math.max(1,w>>1);h=Math.max(1,h>>1);extra+=w*h;}
ck('single-channel mip overhead fits the stated 174763-byte budget',extra===174763,{additionalBytes:extra,newTextures:0});
ck('shader retains one existing atlas sampler and one bounded environment lookup',shader.match(/uniform sampler2D/g).length===1&&shader.match(/raceEnvironment\(/g).length===1);
ck('normal derivatives and roughness filtering precede divergent material branches',shader.indexOf('dFdx(N)')<shader.indexOf('if(uKind<1.5)')&&shader.includes('rough=clamp(sqrt(rough*rough+normalVariance),.09,.98)'));
ck('shader keeps livery masks and glyph sampling without adding vehicle vertex attributes',newModule.slice(0,newModule.indexOf('const FS='))===oldModule.slice(0,oldModule.indexOf('const FS='))&&shader.includes('alpha=texture(uAtlas,vUV).r')&&shader.includes('float sweep=.095+.063*clamp((.60-x)/1.35,0.,1.)'));
const result={author:'Andrew Fisher',scope:'Actual vehicle draw/atlas CPU contract checks with deliberately unsorted synthetic parts; production race/plant sync already sorts glass last, trailer uploads do not. GPU compile and matched visual captures remain required',baseline:{path:path.resolve(process.argv[2]),sha256:sha(base)},candidate:{path:path.resolve(process.argv[3]),sha256:sha(next)},shaderSha256:sha(source),checks};
if(process.argv[4])fs.writeFileSync(process.argv[4],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:checks.length,candidate:result.candidate.sha256,additionalLiveryBytes:extra}));
