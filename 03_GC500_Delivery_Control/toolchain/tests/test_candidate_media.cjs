// Author: Andrew Fisher. Network-free coverage for candidate media validation and curl precedence.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const vm=require('node:vm');
const {createCandidateMedia}=require('../harness/candidate_media.cjs');
const HOST='https://gc500-production.up.railway.app',PREFIX=HOST+'/m/Coates-GC500-2026/';
function fixture(t,{legacy=false}={}) {
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-media-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const media=path.join(dir,'media');fs.mkdirSync(media);
 const body=Buffer.from('fictional reviewed picture'),sha=crypto.createHash('sha256').update(body).digest('hex'),file=sha+'.webp';
 const descriptor={file,sha256:sha,bytes:body.length,type:'image/webp',scope:'view'};
 const page=path.join(dir,'candidate.html'),base=path.join(dir,'base_live.html');
 const write=(target,table)=>fs.writeFileSync(target,'<!doctype html><script>const DATA = '+JSON.stringify({media:table})+';\n</script>');
 write(page,{[sha]:descriptor});write(base,legacy?{[sha]:descriptor}:{});
 fs.writeFileSync(path.join(media,file),body);
 return {dir,media,body,sha,file,descriptor,page,base,write,resolve:()=>createCandidateMedia({pageFile:page,directories:[media]})};
}
test('serves only reviewed candidate bytes with declared MIME before network',t=>{
 const f=fixture(t),res=f.resolve()(PREFIX+f.file+'?initial=1',{},'GET');
 assert.equal(res.status,200);assert.deepEqual(res.body,f.body);assert.equal(res.headers['content-type'],'image/webp');assert.equal(res.headers['cache-control'],'no-store');
});
test('operational API, other origin, and non-GET bypass local page reads',()=>{
 const r=createCandidateMedia({pageFile:'/not-a-page',directories:['/not-a-dir']});
 for(const [url,method] of [[HOST+'/api/record','GET'],[HOST+'/api/version','GET'],['https://example.com/m/Coates-GC500-2026/'+('a'.repeat(64))+'.webp','GET'],[PREFIX+'a'.repeat(64)+'.webp','POST']])assert.equal(r(url,{},method),null);
});
test('optional resolver stays disabled without PAGE or configured roots',()=>{
 assert.equal(createCandidateMedia({})(PREFIX+'a'.repeat(64)+'.webp',{},'GET'),null);
 assert.equal(createCandidateMedia({pageFile:'/not-a-page'})(PREFIX+'a'.repeat(64)+'.webp',{},'GET'),null);
});
test('wrong length cannot fall back to a live/network copy',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.media,f.file),'short');assert.throws(()=>f.resolve()(PREFIX+f.file,{},'GET'),/byte length mismatch/);
});
test('same-size wrong content fails SHA-256 validation',t=>{
 const f=fixture(t);fs.writeFileSync(path.join(f.media,f.file),Buffer.alloc(f.body.length));assert.throws(()=>f.resolve()(PREFIX+f.file,{},'GET'),/SHA-256 mismatch/);
});
test('missing new media fails clearly',t=>{
 const f=fixture(t);fs.unlinkSync(path.join(f.media,f.file));assert.throws(()=>f.resolve()(PREFIX+f.file,{},'GET'),/Missing new candidate media/);
});
test('missing unchanged live media preserves network fallback',t=>{
 const f=fixture(t,{legacy:true});fs.unlinkSync(path.join(f.media,f.file));assert.equal(f.resolve()(PREFIX+f.file,{},'GET'),null);
});
test('absence of baseline is explicit when a described image is missing',t=>{
 const f=fixture(t);fs.unlinkSync(f.base);fs.unlinkSync(path.join(f.media,f.file));assert.throws(()=>f.resolve()(PREFIX+f.file,{},'GET'),/configure GC500_MEDIA_BASE/);
});
test('stage snapshot can identify unchanged files through first pre-patch snapshot',t=>{
 const f=fixture(t,{legacy:true});fs.renameSync(f.base,path.join(f.dir,'v884.before.html'));fs.unlinkSync(path.join(f.media,f.file));assert.equal(f.resolve()(PREFIX+f.file,{},'GET'),null);
});
test('metadata file, hash, size and MIME must match request',t=>{
 const f=fixture(t);
 for(const change of [{file:'../'+f.file},{sha256:'0'.repeat(64)},{bytes:0},{type:'text/html'}]) {
  f.write(f.page,{[f.sha]:{...f.descriptor,...change}});assert.throws(()=>f.resolve()(PREFIX+f.file,{},'GET'),/Invalid candidate media descriptor/);
 }
});
test('encoded traversal and symlinks cannot leave configured root',t=>{
 const f=fixture(t);assert.throws(()=>f.resolve()(PREFIX+'..%2f'+f.file,{},'GET'),/single hash-named file/);
 const outside=path.join(f.dir,'outside.webp');fs.writeFileSync(outside,f.body);fs.unlinkSync(path.join(f.media,f.file));fs.symlinkSync(outside,path.join(f.media,f.file));
 assert.throws(()=>f.resolve()(PREFIX+f.file,{},'GET'),/escapes its configured directory/);
});
test('unknown local filenames are not served as candidate resources',t=>{
 const f=fixture(t);assert.equal(f.resolve()(PREFIX+'b'.repeat(64)+'.webp',{},'GET'),null);
});
test('separate configured roots resolve atlas and map files without filename changes',t=>{
 const f=fixture(t),empty=path.join(f.dir,'empty');fs.mkdirSync(empty);
 const r=createCandidateMedia({pageFile:f.page,directories:[empty,f.media,f.media]});assert.deepEqual(r(PREFIX+f.file,{},'GET').body,f.body);
});
test('verified byte-range responses reject invalid offsets',t=>{
 const f=fixture(t),r=f.resolve(),response=r(PREFIX+f.file,{Range:'bytes=2-5'},'GET');assert.equal(response.status,206);assert.deepEqual(response.body,f.body.subarray(2,6));
 assert.equal(r(PREFIX+f.file,{range:'bytes=999-'},'GET').status,416);
});
test('curl harness chooses local candidate before old disk cache and never invokes curl',async t=>{
 const f=fixture(t),cache=path.join(f.dir,'cache');fs.mkdirSync(cache);
 const url=PREFIX+f.file,key=crypto.createHash('sha1').update(url).digest('hex');
 fs.writeFileSync(path.join(cache,key+'.json'),JSON.stringify({status:200,headers:{}}));fs.writeFileSync(path.join(cache,key+'.body'),'stale cached bytes');
 const env={PAGE:f.page,GC500_MEDIA_BASE:f.base,MEDIA:f.media,GC500_CACHE:cache};
 const module={exports:{}};
 const requireLocal=name=>name==='child_process'?{execFile:()=>{throw new Error('Unexpected network access');}}:
  name==='./candidate_media.cjs'?{fromEnvironment:()=>require('../harness/candidate_media.cjs').fromEnvironment(env)}:require(name);
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../harness/curlfetch.js'),'utf8'),{module,require:requireLocal,process:{env,pid:process.pid},console,setTimeout,Buffer});
 const response=await module.exports.curlFetch(url,{},'GET');assert.deepEqual(response.body,f.body);
});
