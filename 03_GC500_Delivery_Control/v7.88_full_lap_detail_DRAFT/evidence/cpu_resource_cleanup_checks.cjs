/* Author: Andrew Fisher. CPU shader/buffer failure cleanup; no GPU or service calls. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');
const dir=path.resolve(__dirname,'..')+'/';
const old=path.resolve(__dirname,'..','..','v7.85_showcase_track_detail_LIVE')+'/';
const sky=fs.readFileSync(dir+'sky788_src.js','utf8'),oldSky=fs.readFileSync(old+'sky781_src.js','utf8');
for(const name of ['VS','FS'])assert.strictEqual(sky.match(new RegExp('const '+name+'=`([\\s\\S]*?)`;'))[1],oldSky.match(new RegExp('const '+name+'=`([\\s\\S]*?)`;'))[1]);
const results=[];
function context(fail=''){
 const made=new Map(),deleted=new Set();let seq=0,shaderCount=0;
 const create=(type)=>{const q={type,id:++seq};made.set(q.id,q);return q;};
 const destroy=q=>{if(!q)return;assert(!deleted.has(q.id),'double deletion '+q.type);deleted.add(q.id)};
 const gl={VERTEX_SHADER:'vs',FRAGMENT_SHADER:'fs',COMPILE_STATUS:'compile',LINK_STATUS:'link',
 createProgram(){return fail==='program-allocation'?null:create('program')},deleteProgram:destroy,
 createShader(type){shaderCount++;return fail==='shader-allocation'&&shaderCount===2?null:Object.assign(create('shader'),{stage:type})},deleteShader:destroy,
 createVertexArray(){return fail==='vao-allocation'?null:create('vao')},deleteVertexArray:destroy,
 createBuffer(){return create('buffer')},deleteBuffer:destroy,
 shaderSource(){},compileShader(){},attachShader(){},linkProgram(){},
 getShaderParameter(shader){return !(fail==='fragment-compile'&&shader.stage==='fs')},getShaderInfoLog(){return 'forced compile failure'},
 getProgramParameter(){return fail!=='program-link'},getProgramInfoLog(){return 'forced link failure'},getUniformLocation(){return {}},
 disable(){},enable(){},depthMask(){},useProgram(){},bindVertexArray(){},uniform3fv(){},uniform2f(){},drawArrays(){}};
 const V={norm:v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)},sub:(a,b)=>a.map((x,i)=>x-b[i]),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]};
 const G={V,camUp:()=>[0,1,0]},S={gl,look:{day:true},detail781Enabled:true};
 return {G,S,gl,made,deleted,remaining:()=>[...made.keys()].filter(id=>!deleted.has(id)),run:src=>vm.runInNewContext(src,{window:{GC3D:G}})};
}
for(const fail of ['program-allocation','shader-allocation','fragment-compile','program-link','vao-allocation','']){
 const c=context(fail);c.run(sky);let error=null;
 try{c.G.drawSky781(c.S,{eye:[0,1,0],tgt:[0,1,1]},Math.PI/3,1.7,0,0)}catch(e){error=e.message}
 if(fail){assert(error,'expected forced failure');assert(!c.S.sky781);}
 else{assert(!error);assert(c.S.sky781);c.G.disposeSky781(c.S);assert(!c.S.sky781);}
 assert.strictEqual(c.remaining().length,0);
 results.push({scope:'sky',case:fail||'normal-dispose',created:c.made.size,deleted:c.deleted.size,liveResources:0});
}
{
 const c=context();c.G.area=P=>P.reduce((s,p,i)=>s+p[0]*P[(i+1)%P.length][1]-P[(i+1)%P.length][0]*p[1],0)/2;c.G.setBuildings=()=>{};
 c.G.MeshBatch=class{constructor(gl){this.v={length:0};this.i={length:0};this.nv=0;this.vb=gl.createBuffer();this.ib=gl.createBuffer();this.vao=gl.createVertexArray()}
 vert(...args){this.v.length+=args.length;return this.nv++}tri(){this.i.length+=3}upload(){throw Error('forced upload failure')}get ni(){return this.i.length}};
 Object.assign(c.S,{CL:{p:[[0,0],[20,0],[20,20],[0,20]],n:4},gridS:0,toWorld:p=>p.slice(),architecture781Source:[{h:8,y0:0,p:[[22,4],[24,4],[24,6],[22,6]]}],pack:{mPerPt:6}});
 c.G.S=c.S;c.run(fs.readFileSync(dir+'architecture788_src.js','utf8'));
 assert.throws(()=>c.G.installArchitecture781(c.S),/forced upload failure/);assert(!c.S.architecture781);assert.strictEqual(c.remaining().length,0);
 results.push({scope:'architecture',case:'upload-failure-after-link',created:c.made.size,deleted:c.deleted.size,liveResources:0});
}
const result={author:'Andrew Fisher',scope:'CPU resource failure injection; no GPU or service calls',passed:results.length,total:results.length,pixelShaderSourcesUnchanged:true,checks:results};
fs.writeFileSync(path.join(__dirname,'cpu_resource_cleanup_checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
