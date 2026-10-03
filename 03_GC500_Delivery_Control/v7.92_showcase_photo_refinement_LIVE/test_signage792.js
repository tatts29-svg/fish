/* Author: Andrew Fisher. Focused source-preservation and failure-path checks. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const here=__dirname,checks=[];
function check(name,run){run();checks.push(name);}
class MeshBatch{
 constructor(gl,layout){this.gl=gl;this.layout=layout;this.stride=layout.reduce((a,b)=>a+b,0);this.v=[];this.i=[];this.nv=0;this.ni=0;}
 vert(...p){this.v.push(...p);return this.nv++;}tri(...p){this.i.push(...p);}upload(){this.ni=this.i.length;}
}
function glMock(){
 const gl={MAX_TEXTURE_SIZE:1,ACTIVE_TEXTURE:2,TEXTURE_BINDING_2D:3,TEXTURE0:4,TEXTURE_2D:5,RGBA8:6,RGBA:7,UNSIGNED_BYTE:8,
  TEXTURE_MIN_FILTER:9,LINEAR_MIPMAP_LINEAR:10,TEXTURE_MAG_FILTER:11,LINEAR:12,TEXTURE_WRAP_S:13,TEXTURE_WRAP_T:14,CLAMP_TO_EDGE:15,UNPACK_FLIP_Y_WEBGL:16,UNPACK_PREMULTIPLY_ALPHA_WEBGL:17,
  active:33,binding:{original:true},params:[],deleted:[],max:4096,flip:true,premultiply:true,
  pixelStorei(p,v){if(p===16)this.flip=v;if(p===17)this.premultiply=v;},
  getParameter(p){return p===1?this.max:p===2?this.active:p===16?this.flip:p===17?this.premultiply:this.binding;},
  activeTexture(p){this.active=p;},bindTexture(_,p){this.binding=p;},createTexture(){return {newTexture:true};},
  texImage2D(...p){assert.equal(this.flip,false);assert.equal(this.premultiply,false);if(this.failUpload)throw new Error('Upload failed');this.upload=p;},
  texParameteri(...p){this.params.push(p);},generateMipmap(){this.mipmaps=true;},deleteTexture(p){this.deleted.push(p);}};
 return gl;
}
let lastCanvas;
const document={createElement(type){assert.equal(type,'canvas');const canvas={width:0,height:0},draws=[];
 const ctx={measureText(t){return {width:t.length*38,actualBoundingBoxLeft:0,actualBoundingBoxRight:t.length*38,actualBoundingBoxAscent:48,actualBoundingBoxDescent:1};},
  fillText(...q){draws.push(q);},fillRect(){},getImageData(){const data=new Uint8ClampedArray(canvas.width*canvas.height*4);for(let i=3;i<data.length;i+=8)data[i]=255;return {data};}};
 canvas.getContext=()=>ctx;lastCanvas={canvas,draws,ctx};return canvas;}};
const G={MeshBatch};vm.runInNewContext(fs.readFileSync(path.join(here,'signage792_src.js'),'utf8'),{window:{GC3D:G},document,Int32Array,Number,Math,Set,Error});
function sourceFixture(){
 const gl=glMock(),source=new MeshBatch(gl,[3,4,2]),labels=[];
 function quad(c){const first=source.nv;for(let k=0;k<4;k++)source.vert(c+k,k,7,1,.5,.2,1,0,0);source.tri(first,first+1,first+2);source.tri(first,first+2,first+3);}
 quad(0);
 for(let j=0;j<2;j++){const start=source.i.length;quad(10+j*10);quad(20+j*10);labels.push({centre:[2+j,4,6],face:j?[1,0]:[0,-1],text:j?'150':'COATES',px:.03,colour:[.9,.5,.1,1],lift:.009,indexStart:start,indexEnd:source.i.length});quad(50+j*10);}
 source.upload();return {S:{gl,standDecor:source,photoLabels792:labels},gl};
}
const first=sourceFixture(),atlas=G.makeSignAtlas792(first.gl,first.S);
check('Atlas typesets every unique original wording exactly once',()=>assert.deepEqual(lastCanvas.draws.map(q=>q[0]),['COATES','150']));
check('Atlas uses padded power-of-two texture with mipmap filtering',()=>{assert.equal(atlas.width,1024);assert.equal(Math.log2(atlas.height)%1,0);assert.equal(first.gl.mipmaps,true);assert.ok(first.gl.params.some(q=>q[1]===first.gl.TEXTURE_MIN_FILTER&&q[2]===first.gl.LINEAR_MIPMAP_LINEAR));});
check('Transparent texels preserve white RGB and differing alpha',()=>{const p=first.gl.upload.at(-1);assert.ok(p.every((v,i)=>i%4===3||v===255));assert.equal(p[3],255);assert.equal(p[7],0);});
check('Texture active unit and binding restored after successful upload',()=>{assert.equal(first.gl.active,33);assert.equal(first.gl.flip,true);assert.equal(first.gl.premultiply,true);assert.deepEqual(first.gl.binding,{original:true});});
const sourceBefore=JSON.stringify(first.S.standDecor),D={atlas,mesh:new MeshBatch(first.gl,[3,3,2,4]),stats:{}};
const result=G.addTrackLabels792(first.S,D);
check('Original decoration mesh remains byte-for-byte unchanged for fallback',()=>assert.equal(JSON.stringify(first.S.standDecor),sourceBefore));
check('Only captured lettering triangles are removed from replacement decoration',()=>{
 const source=first.S.standDecor,excluded=new Set(first.S.photoLabels792.flatMap(q=>Array.from({length:q.indexEnd-q.indexStart},(_,i)=>q.indexStart+i)));
 const want=source.i.flatMap((v,i)=>excluded.has(i)?[]:source.v.slice(v*9,v*9+9));
 const got=D.signDecor.i.flatMap(v=>D.signDecor.v.slice(v*9,v*9+9));assert.deepEqual(got,want);
 assert.equal(result.retainedDecorationTriangles,6);assert.equal(result.originalLetterTriangles,8);
});
check('Each original label uses exactly two triangles and four vertices',()=>{assert.equal(D.mesh.i.length,12);assert.equal(D.mesh.nv,8);assert.equal(result.labels,2);});
check('Label centre, original face lift and bounds are retained in both directions',()=>{
 for(let j=0;j<2;j++){const q=first.S.photoLabels792[j],v=Array.from({length:4},(_,i)=>D.mesh.v.slice((j*4+i)*12,(j*4+i)*12+3)),avg=[0,1,2].map(k=>v.reduce((a,p)=>a+p[k],0)/4),w=(q.text.length*6-1)*q.px;
  assert.ok(Math.abs(avg[0]-q.centre[0]-q.face[0]*q.lift)<1e-12);assert.equal(avg[1],q.centre[1]);assert.ok(Math.abs(avg[2]-q.centre[2]-q.face[1]*q.lift)<1e-12);
  assert.ok(Math.abs(Math.hypot(v[1][0]-v[0][0],v[1][2]-v[0][2])-w)<1e-12);assert.ok(Math.abs(v[3][1]-v[0][1]-7*q.px)<1e-12);
 }
});
check('Label RGB and top-to-bottom UV direction match source and canvas',()=>{assert.deepEqual(D.mesh.v.slice(8,11),[.9,.5,.1]);assert.ok(D.mesh.v[7]>D.mesh.v[3*12+7]);assert.deepEqual(D.mesh.v.slice(3,6),[0,0,-1]);});
check('Replacement decoration compacts unreferenced original dot vertices',()=>assert.equal(D.signDecor.nv,12));
check('Repeated installation refuses without appending vertices',()=>{const n=D.mesh.nv;assert.throws(()=>G.addTrackLabels792(first.S,D),/already installed/);assert.equal(D.mesh.nv,n);});
check('Overlapping capture ranges fail before replacement allocation',()=>{
 const f=sourceFixture();f.S.photoLabels792[1].indexStart=f.S.photoLabels792[0].indexStart;const d={atlas,mesh:new MeshBatch(f.gl,[3,3,2,4])};assert.throws(()=>G.addTrackLabels792(f.S,d),/capture is invalid/);assert.equal(d.signDecor,undefined);
});
check('Texture upload failure disposes texture and restores previous state',()=>{const gl=glMock();gl.failUpload=true;assert.throws(()=>G.makeSignAtlas792(gl,first.S),/Upload failed/);assert.equal(gl.deleted.length,1);assert.equal(gl.active,33);assert.equal(gl.flip,true);assert.equal(gl.premultiply,true);assert.deepEqual(gl.binding,{original:true});});
check('Texture limit fails before allocation',()=>{const gl=glMock();gl.max=512;let count=0;gl.createTexture=()=>{count++;};assert.throws(()=>G.makeSignAtlas792(gl,first.S),/device texture limit/);assert.equal(count,0);});
check('Patched circuit dressing preserves all original geometry and label placement',()=>{
 const source=fs.readFileSync(path.join(here,'../build/GC500_v7.88/full_lap_preview.html'),'utf8'),
  result=require('node:child_process').spawnSync('python3',['-c',
   'import sys; from pathlib import Path; sys.path.insert(0,sys.argv[1]); from patch_signage792 import apply; p=Path(sys.argv[1])/"../build/GC500_v7.88/full_lap_preview.html"; print(apply(p.read_text(),"source.html"),end="")',here],{encoding:'utf8',maxBuffer:4*1024*1024,timeout:10000});
 assert.equal(result.status,0,result.stderr);
 const run=source=>{
  const sceneG={M_PER_PT:6,rng(seed){let a=seed;return ()=>{a=(a*1664525+1013904223)>>>0;return a/4294967296;};},
   inPoly(p,loop){let yes=false;for(let i=0,j=loop.length-1;i<loop.length;j=i++){const a=loop[i],b=loop[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}};
  const start=source.indexOf('const DRESS_FONT='),end=source.indexOf('/* v6.64 - PEOPLE, NOT DOTS',start);
  vm.runInNewContext(source.slice(start,end),{G:sceneG,Math,Number});
  const gl=glMock(),mesh=new MeshBatch(gl,[3,4,2]),S={standDecor:mesh,tune:{carS:3.4},gridS:0,kAt:()=>0,heightAt:()=>0,distToTrack:()=>0},
   ring=r=>Array.from({length:32},(_,i)=>[Math.cos(i*Math.PI/16)*r,Math.sin(i*Math.PI/16)*r]),
   CL={L:62.8318530718,at(s){return [Math.cos(s/10)*10,Math.sin(s/10)*10,4];}},edges=[];
  S.CL=CL;S.outer=ring(12);S.inner=ring(8);
  const dquad=(...args)=>{const col=args.pop(),ids=args.map(q=>mesh.vert(...q,...col,0,0));mesh.tri(ids[0],ids[1],ids[2]);mesh.tri(ids[0],ids[2],ids[3]);mesh.tri(ids[0],ids[2],ids[1]);mesh.tri(ids[0],ids[3],ids[2]);};
  sceneG.dressCircuit(S,{dquad,person(){},ed:{seg(...p){edges.push(p);}},H:.05,CL});return {S,mesh,edges};
 };
 const old=run(source),next=run(result.stdout);
 assert.deepEqual(next.mesh.v,old.mesh.v);assert.deepEqual(next.mesh.i,old.mesh.i);
 assert.equal(JSON.stringify(next.edges),JSON.stringify(old.edges));assert.equal(JSON.stringify(next.S.dressStats),JSON.stringify(old.S.dressStats));
 assert.ok(next.S.photoLabels792.length>5);
 for(const q of next.S.photoLabels792){assert.ok(q.indexEnd>q.indexStart);assert.equal(q.indexStart%3,0);assert.equal(q.indexEnd%3,0);}
});
console.log(JSON.stringify({author:'Andrew Fisher',passed:checks.length,checks},null,2));
