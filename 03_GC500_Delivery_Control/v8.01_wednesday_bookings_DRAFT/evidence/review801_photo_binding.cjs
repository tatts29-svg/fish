// Author: Andrew Fisher. Bind the final integrated page to independently tested real-storage production code.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),finalPath=process.env.PAGE||path.join(root,'build/GC500_v8.01/GC500_Delivery_Control_hosted.html');
const final=fs.readFileSync(finalPath,'utf8'),reviewed=fs.readFileSync('/workspace/private-v798-review/reviewed_798_9a52ec22.html','utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert(process.env.CANDIDATE_SHA256,'CANDIDATE_SHA256 required');
assert.strictEqual(sha(final),process.env.CANDIDATE_SHA256);
assert.strictEqual(sha(reviewed),'9a52ec22c794a514d44936ef84335b62a6876c2664fa54f211a35f1315666d95');
function take(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);}
// Restore only the earlier toolbar measurement ordering: this proves that native test candidate769 and
// reviewed9a differ in dpZoomFit alone, not any of the photo/save/sync code executed by the native suite.
const base=fs.readFileSync(path.join(root,'build/GC500_v7.98/base_live.html'),'utf8');
const begin='function dpZoomFit(){',end='/* v7.82 - a short check';
const early=take(base,begin,end).replace(begin,begin+"\n const bar = document.getElementById('dpbar');\n if (bar && document.body.classList.contains('dpbar-on')) document.body.style.setProperty('--dpbar-height798', Math.ceil(bar.getBoundingClientRect().height) + 'px');");
const nativeCandidate=reviewed.replace(take(reviewed,begin,end),early);
const nativeExpected='76939c32635b8628b05b577233f827f41c1a60a52fe65270304711abdc6b725e';assert.strictEqual(sha(nativeCandidate),nativeExpected);
const moduleSource=fs.readFileSync(path.join(root,'v7.97_photo_outbox_durability_DRAFT/photo797_src.js'),'utf8');
const chunks=moduleSource.split(/\/\* PHOTO797: \w+ \*\/\n/).slice(1);
const scopes=[['stampIt','function stampIt(field, key, who){','/* who last set a stamped field'],['persist','let PERSISTED_JSON = null;','/* Let go of the damaged copy'],['save','function save775Inner(){','/* A deletion is a record too.'],['bump','function bump(){','/* ------------------------------------------------------------------ tabs'],['photo links','function photoLinksOf(key){','/* the old whole-list writers'],['photo slots','function dropPhotoSlots(key, unit, opts){','/* the groups a reference'],['document serialization','function docIdOf(key){','function fromDocs(name, docs){'],['sync stage/send/ack','function syncPush(){','function syncWaiting(){'],['outbox read','async function photoOutboxAll(){','/* the entry waiting to go']];
const checks=scopes.map(([name,a,b])=>{const before=take(nativeCandidate,a,b),after=take(final,a,b);assert.strictEqual(after,before,name);return{name,sha256:sha(after),identical:true};});
chunks.forEach((chunk,i)=>{assert(final.includes(chunk.trim())&&nativeCandidate.includes(chunk.trim()),'photo source chunk '+i);checks.push({name:'photo797 production chunk '+i,sha256:sha(chunk.trim()),identical:true});});
const native=JSON.parse(fs.readFileSync(path.join(root,'v7.97_photo_outbox_durability_DRAFT/evidence/final798_real_storage.json')));
assert(native.passed&&native.candidateSha256===nativeExpected&&native.photoSourceSha256===sha(moduleSource));
const result={author:'Andrew Fisher',finalCandidateSha256:sha(final),testedNativeCandidateSha256:nativeExpected,reviewed798Sha256:sha(reviewed),nativeBrowser:native.browserVersion,nativeChecks:native.checks.length,nativePassed:native.passed,allPhotoAndPersistenceSourcesIdentical:true,checks,scope:'Real Chromium IndexedDB/localStorage/Blob/SHA/Web Locks were exercised with synthetic blobs and mock transports on769.9a changes only toolbar fitting; final801 retains all tested production photo and persistence code byte-for-byte. This is an explicit source binding, not a claim of another native-browser run on801.',liveWrites:0};
fs.writeFileSync(path.join(__dirname,'review801_photo_binding.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({finalCandidateSha256:result.finalCandidateSha256,sourceChecks:checks.length,nativeChecks:result.nativeChecks,identical:true}));
