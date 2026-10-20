// Author: Andrew Fisher. Optional anisotropy capabilities never prevent the existing atlas fallback.
const fs=require('fs'),assert=require('assert/strict');
const source=fs.readFileSync(process.argv[2],'utf8'),start=source.indexOf('/* GC500 v1.7 — explicitly typeset livery,'),end=source.indexOf('/* Author: Andrew Fisher. v8.00 — surfaced race coupe.',start),G={};
assert(start>0&&end>start);Function('window',source.slice(start,end))({GC3D:G});
const result={author:'Andrew Fisher',cases:[]};
for(const [name,maximum,expected]of [['unsupported',null,0],['low cap',2,2],['bounded cap',16,4],['invalid cap',NaN,0]]){
 const calls=[],gl={TEXTURE_2D:1,R8:2,RED:3,UNSIGNED_BYTE:4,LINEAR_MIPMAP_LINEAR:5,LINEAR:6,CLAMP_TO_EDGE:7,TEXTURE_MIN_FILTER:8,TEXTURE_MAG_FILTER:9,TEXTURE_WRAP_S:10,TEXTURE_WRAP_T:11,
 createTexture:()=>({}),bindTexture:()=>{},texImage2D:(...a)=>{assert.equal(a[3],1024);assert.equal(a[4],512);assert.equal(a[8].length,524288);},generateMipmap:()=>{},texParameteri:()=>{},getExtension:()=>maximum===null?null:{MAX_TEXTURE_MAX_ANISOTROPY_EXT:12,TEXTURE_MAX_ANISOTROPY_EXT:13},getParameter:()=>maximum,texParameterf:(t,p,v)=>calls.push(v)};
 const texture=G.raceCarAtlas(gl);assert(texture);assert.equal(calls.length,expected?1:0);if(expected)assert.equal(calls[0],expected);assert.equal(G.raceCarAtlas(gl),texture);assert.equal(calls.length,expected?1:0);
 result.cases.push({name,anisotropy:expected||'unchanged trilinear fallback',pass:true});
}
result.pass=true;if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
