/* Author: Andrew Fisher. Submit nearby track detail instead of the whole lap every frame. */
(function(){
'use strict';
const G=window.GC3D;if(!G||G.visibility918)return;
const names=['crowdMesh','dayTrees','dayTreeTrunks','trees'];
const CELL=8;
let prepared=0,submitted=0,total=0;
function prepare(mesh){
 if(!mesh||mesh.visibility918||mesh.dynamic||mesh.layout[0]!==3||mesh.ni<12000)return;
 const groups=new Map(),v=mesh.v,stride=mesh.stride,indices=mesh.i;
 for(let i=0;i<indices.length;i+=3){
  const a=indices[i]*stride,b=indices[i+1]*stride,c=indices[i+2]*stride;
  const x=Math.floor((v[a]+v[b]+v[c])/(3*CELL)),z=Math.floor((v[a+2]+v[b+2]+v[c+2])/(3*CELL)),key=x+','+z;
  let q=groups.get(key);if(!q){q={x,z,indices:[],minX:Infinity,maxX:-Infinity,minZ:Infinity,maxZ:-Infinity,minY:Infinity,maxY:-Infinity};groups.set(key,q);}
  for(const j of [a,b,c]){q.minX=Math.min(q.minX,v[j]);q.maxX=Math.max(q.maxX,v[j]);q.minY=Math.min(q.minY,v[j+1]);q.maxY=Math.max(q.maxY,v[j+1]);q.minZ=Math.min(q.minZ,v[j+2]);q.maxZ=Math.max(q.maxZ,v[j+2]);}
  q.indices.push(indices[i],indices[i+1],indices[i+2]);
 }
 const ordered=new Uint32Array(indices.length),cells=[];let offset=0;
 for(const q of groups.values()){ordered.set(q.indices,offset);cells.push({minX:q.minX,maxX:q.maxX,minZ:q.minZ,maxZ:q.maxZ,minY:q.minY-1,maxY:q.maxY+1,offset,count:q.indices.length});offset+=q.indices.length;}
 const gl=mesh.gl;gl.bindVertexArray(mesh.vao);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ordered,gl.STATIC_DRAW);gl.bindVertexArray(null);
 const original=mesh.draw;
 mesh.visibility918={cells,sourceCount:indices.length};prepared++;
 mesh.draw=function(){
  const S=G.S,VP=S&&S.visibilityVP918;
  total+=this.ni;
  if(!VP){submitted+=this.ni;return original.apply(this,arguments);}
  gl.bindVertexArray(this.vao);
  let begin=-1,count=0;
  const flush=()=>{if(count){gl.drawElements(gl.TRIANGLES,count,gl.UNSIGNED_INT,begin*4);submitted+=count;}begin=-1;count=0;};
  for(const q of cells){
   if(q.lastVP!==VP){
    const outside=[true,true,true,true,true,true];
    for(const x of [q.minX,q.maxX])for(const y of [q.minY,q.maxY])for(const z of [q.minZ,q.maxZ]){
     const X=VP[0]*x+VP[4]*y+VP[8]*z+VP[12],Y=VP[1]*x+VP[5]*y+VP[9]*z+VP[13],Z=VP[2]*x+VP[6]*y+VP[10]*z+VP[14],W=VP[3]*x+VP[7]*y+VP[11]*z+VP[15];
     const planes=[X+W*1.3,W*1.3-X,Y+W*1.3,W*1.3-Y,Z+W,W-Z];
     for(let k=0;k<6;k++)if(planes[k]>=0)outside[k]=false;
    }
    q.visible=!outside.some(Boolean);q.lastVP=VP;
   }
   if(q.visible){if(begin<0)begin=q.offset;count+=q.count;}else flush();
  }
  flush();
 };
}
const render=G.render;
G.render=function(){const S=G.S;if(S&&S.gl&&S.gl.isContextLost())return;if(S&&!S.lost){for(const name of names)prepare(S[name]);}return render.apply(this,arguments);};
const mount=G.mount;
G.mount=function(){
 const args=Array.from(arguments),result=mount.apply(this,args),S=G.S;
 if(S&&S.cv&&!S.recovery918){
  S.recovery918=true;
  S.cv.addEventListener('webglcontextlost',()=>{
   if(G.S!==S||!SHOW.open)return;
   S.cv.style.visibility='hidden';
   document.querySelectorAll('#showPlate svg.shcircuit,#showPlate svg.shhalo').forEach(e=>e.style.visibility='');
   show3dNote();
   clearTimeout(S.restoreTimer918);
   S.restoreTimer918=setTimeout(()=>{
    if(G.S!==S||!S.lost||!SHOW.open)return;
    const back=G.captureContextState792(S);
    G.mount.apply(G,args);G.restoreContextState792(G.S,back);show3dNote();
   },4000);
  });
  const unmount=S.unmount;
  S.unmount=function(){clearTimeout(S.restoreTimer918);return unmount.apply(this,arguments);};
 }
 return result;
};
G.visibility918=()=>({prepared,submitted,total,sourceGeometryPreserved:true});
})();
