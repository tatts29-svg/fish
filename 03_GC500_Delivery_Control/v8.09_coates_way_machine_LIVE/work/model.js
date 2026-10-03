import * as T from './vendor/three.module.js';
import {PARTS} from './parts.js';
import {addMechanics} from './mechanics.js';
import {MeshoptDecoder} from './vendor/meshopt_decoder.module.js';
export {PARTS};

// v5.86 — the two big downloads travel gzipped as ….gz.bin (the machine route serves every file as it is stored, never compressed,
// and allows only its own extensions — .gz is not one) and the browser's own DecompressionStream unpacks them: the model 12.9 MB →
// 1.8 MB, the studio light 2.1 MB → 59 kB. A browser without DecompressionStream, or a packed file that does not arrive, takes the
// plain file instead. Bytes that are no longer gzip (something on the way already unpacked them) are used as they are.
async function fetchPacked(packed,plain,what){
 if(typeof DecompressionStream==='function'){try{const r=await fetch(packed);if(r.ok){const b=await r.arrayBuffer(),u=new Uint8Array(b,0,Math.min(2,b.byteLength));if(u[0]!==0x1f||u[1]!==0x8b)return b;return await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}}catch(e){console.warn(what+': packed download unavailable, fetching the plain file:',e.message);}}
 const r=await fetch(plain);if(!r.ok)throw Error(what+' failed to load');return r.arrayBuffer();
}
// v5.86 — the model's geometry is stored with EXT_meshopt_compression, losslessly (the float positions, normals and UVs exactly as
// they were; the same triangles): decoded here into one plain buffer with the vendored meshoptimizer decoder (vendor/, MIT), so
// everything below reads it as before. A file without the extension passes straight through.
async function unpackMeshopt(c){
 const j=c.json;if(!(j.extensionsUsed||[]).includes('EXT_meshopt_compression'))return c;
 if(!MeshoptDecoder.supported)throw Error('This browser cannot decode the model (no WebAssembly)');await MeshoptDecoder.ready;
 let size=0;const at=j.bufferViews.map(v=>{const o=size;size+=Math.ceil(v.byteLength/4)*4;return o;}),out=new Uint8Array(size);
 j.bufferViews.forEach((v,i)=>{const x=v.extensions?.EXT_meshopt_compression,target=out.subarray(at[i],at[i]+v.byteLength);
  if(x)MeshoptDecoder.decodeGltfBuffer(target,x.count,x.byteStride,new Uint8Array(c.buffer,c.binaryStart+(x.byteOffset||0),x.byteLength),x.mode,x.filter);
  else target.set(new Uint8Array(c.buffer,c.binaryStart+(v.byteOffset||0),v.byteLength));
  j.bufferViews[i]={buffer:0,byteOffset:at[i],byteLength:v.byteLength,...(v.target?{target:v.target}:{})};});
 return {json:j,buffer:out.buffer,binaryStart:0};
}
// Reads the uncompressed glTF subset produced by this project's asset pipeline.
// Separate components retain their pivots; primitives sharing a part become one draw object.
export function parseContainer(buffer){
 const v=new DataView(buffer);if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2)throw Error('Invalid model file');
 if(v.getUint32(8,true)!==buffer.byteLength)throw Error('Incomplete model download');
 const length=v.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,length)));
 const binaryStart=20+length+8;return {json,buffer,binaryStart};
}
function attribute(c,index){
 const a=c.json.accessors[index],view=c.json.bufferViews[a.bufferView];
 const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type],Type={5126:Float32Array,5125:Uint32Array,5123:Uint16Array}[a.componentType];
 if(!width||!Type||view.byteStride||a.sparse)throw Error('Unsupported model attribute');
 return new T.BufferAttribute(new Type(c.buffer,c.binaryStart+(view.byteOffset||0)+(a.byteOffset||0),a.count*width),width);
}
function microSurface(type){
 const size=256,data=new Uint8Array(size*size*4);let seed=719;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const lines=Array.from({length:size},()=>random());
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const r=type==='steel'?.5+.15*(lines[y]-.5)+.03*(random()-.5):.5+.18*(random()-.5);
  const k=(y*size+x)*4;data[k]=data[k+1]=data[k+2]=Math.round(r*255);data[k+3]=255;
 }
 const t=new T.DataTexture(data,size,size,T.RGBAFormat);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(type==='steel'?6:14,type==='steel'?6:14);t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export async function buildModel({buffer=null,decodeImages=true,textureSize=null}={}){
 if(!buffer)buffer=await fetchPacked('./assets/machine/coates-23.glb.gz.bin?v=meshopt-1','./assets/machine/coates-23.glb?v=meshopt-1','Machine download');
 const c=await unpackMeshopt(parseContainer(buffer)),j=c.json,textures=[];
 for(const im of j.images){
  if(!decodeImages){textures.push(null);continue;}
  const bv=j.bufferViews[im.bufferView],bytes=new Uint8Array(c.buffer,c.binaryStart+bv.byteOffset,bv.byteLength);
  const blob=new Blob([bytes],{type:im.mimeType});
  const bitmap=await createImageBitmap(blob,{premultiplyAlpha:'none',...(textureSize?{resizeWidth:textureSize,resizeHeight:textureSize,resizeQuality:'high'}:{})});
  const t=new T.Texture(bitmap);t.flipY=false;t.colorSpace=T.SRGBColorSpace;t.needsUpdate=true;textures.push(t);
 }
 const brushed=microSurface('steel'),enamel=microSurface('enamel');
 const materials=j.materials.map(m=>{
  const p=m.pbrMetallicRoughness,coat=m.extensions?.KHR_materials_clearcoat;
  if(m.extensions?.KHR_materials_unlit){const mat=new T.MeshBasicMaterial({color:0xffffff,map:textures[j.textures[p.baseColorTexture.index].source],toneMapped:false,fog:false,alphaTest:.5});mat.userData.originalArtwork=true;return mat;}
  const mat=new T.MeshPhysicalMaterial({color:new T.Color().fromArray(p.baseColorFactor),metalness:p.metallicFactor,roughness:p.roughnessFactor,clearcoat:coat?.clearcoatFactor||0,clearcoatRoughness:coat?.clearcoatRoughnessFactor||.17});
  if(p.baseColorTexture){mat.map=textures[j.textures[p.baseColorTexture.index].source];mat.metalness=0;mat.roughness=.37;mat.clearcoat=.24;}
  else if(mat.metalness>.7){mat.bumpMap=brushed;mat.bumpScale=.008;mat.roughness=Math.max(.22,mat.roughness);mat.envMapIntensity=1.2;}
  else if(mat.clearcoat>.2){mat.bumpMap=enamel;mat.bumpScale=.008;mat.roughness=.3;mat.clearcoat=.65;}
  return mat;
 });
 const meshes=j.meshes.map(m=>{
  const g=new T.BufferGeometry(),first=m.primitives[0];g.setAttribute('position',attribute(c,first.attributes.POSITION).clone());g.setAttribute('normal',attribute(c,first.attributes.NORMAL).clone());g.setAttribute('uv',attribute(c,first.attributes.TEXCOORD_0).clone());
  let length=0;for(const p of m.primitives)length+=j.accessors[p.indices].count;const indices=new Uint32Array(length);const mats=[];let at=0;
  for(const p of m.primitives){const a=attribute(c,p.indices).array;indices.set(a,at);g.addGroup(at,a.length,mats.length);mats.push(materials[p.material]);at+=a.length;}
  g.setIndex(new T.BufferAttribute(indices,1));g.scale(2.5,2.5,2.5);g.computeBoundingBox();g.computeBoundingSphere();return {geometry:g,materials:mats};
 });
 const root=new T.Group(),parts=[],pickables=[];
 function node(index,part){const n=j.nodes[index],group=new T.Group();if(n.mesh!==undefined){const spec=meshes[n.mesh],mesh=new T.Mesh(spec.geometry,spec.materials.map(m=>m.clone()));mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.part=part;mesh.userData.surface=mesh.material.map(m=>({emissive:m.emissive?.clone(),intensity:m.emissiveIntensity}));group.add(mesh);pickables.push(mesh);}for(const child of n.children||[])group.add(node(child,part));return group;}
 for(const [i,ni] of j.scenes[j.scene||0].nodes.entries()){
  const group=node(ni,i);root.add(group);const rotorChildren=group.children.filter(o=>o.isGroup);
  const localBounds=new T.Box3().setFromObject(group);const radius=localBounds.getSize(new T.Vector3()).length()/2;
  parts.push({...PARTS[i],group,rotorChildren,localBounds,radius});group.position.fromArray(PARTS[i].base);
 }
 root.updateMatrixWorld(true);
 return addMechanics({root,parts,pickables,textures,texture:textures[0],materials,stats:{parts:parts.length,objects:pickables.length,drawCalls:pickables.reduce((n,m)=>n+m.geometry.groups.length,0)}});
}

// Radiance RGBE reader for our small, original studio environment.
export function decodeHDR(buffer){
 const bytes=new Uint8Array(buffer);let offset=0;const line=()=>{const start=offset;while(offset<bytes.length&&bytes[offset]!==10)offset++;return new TextDecoder().decode(bytes.subarray(start,offset++));};
 if(!line().startsWith('#?'))throw Error('Invalid HDR');let s;do{s=line();}while(s.length);const dims=line().match(/-Y (\d+) \+X (\d+)/);if(!dims)throw Error('Unsupported HDR orientation');const h=+dims[1],w=+dims[2],out=new Float32Array(w*h*4),row=new Uint8Array(w*4);
 for(let y=0;y<h;y++){
  if(bytes[offset++]!==2||bytes[offset++]!==2)throw Error('Unsupported HDR scanline');const sw=(bytes[offset++]<<8)|bytes[offset++];if(sw!==w)throw Error('HDR width mismatch');
  for(let c=0;c<4;c++){let x=0;while(x<w){const n=bytes[offset++];if(n>128){const count=n-128,v=bytes[offset++];for(let k=0;k<count;k++)row[(x++)*4+c]=v;}else{for(let k=0;k<n;k++)row[(x++)*4+c]=bytes[offset++];}if(!n||x>w||offset>bytes.length)throw Error('Invalid HDR data');}}
  for(let x=0;x<w;x++){const r=x*4,o=(y*w+x)*4,scale=row[r+3]?2**(row[r+3]-136):0;out[o]=row[r]*scale;out[o+1]=row[r+1]*scale;out[o+2]=row[r+2]*scale;out[o+3]=1;}
 }
 const texture=new T.DataTexture(out,w,h,T.RGBAFormat,T.FloatType);texture.mapping=T.EquirectangularReflectionMapping;texture.flipY=true;texture.needsUpdate=true;return texture;
}
export async function environment(renderer){
 const hdr=decodeHDR(await fetchPacked('./assets/machine/studio.hdr.gz.bin','./assets/machine/studio.hdr','Studio lighting')),pmrem=new T.PMREMGenerator(renderer),target=pmrem.fromEquirectangular(hdr);hdr.dispose();pmrem.dispose();return target.texture;
}
