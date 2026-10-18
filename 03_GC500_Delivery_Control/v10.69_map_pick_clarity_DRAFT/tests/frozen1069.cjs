/* Author: Andrew Fisher. Test-only adapter using frozen API state and genuine original assets.
   Missing machine assets may be fetched by canonical GET, then checked against the verified manifest. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const net=require('../../toolchain/harness/curlfetch.js'),nativeFetch=net.curlFetch;
const cache=process.env.GC500_CACHE;if(!cache)throw Error('GC500_CACHE must name original asset cache');
const manifestBytes=fs.readFileSync(process.env.GC500_MAP_MANIFEST||'');
if(sha(manifestBytes)!=='8af790ed7a875c468feaf59db4ca5339b2d0a16c1b66762200a5f6a3c5872417')throw Error('Unverified machine manifest');
const manifest=JSON.parse(manifestBytes);if(manifest.sha256!=='8256bce609ce48d30fd319ac56bce74729cfe8a980ad051228379d09b06a15e6')throw Error('Wrong machine release');
const files=new Map(manifest.files.map(f=>[f.path,f]));
const pending=new Set();
const assets={hits:0,originalGets:0,verified:new Set(),media:new Set(),missing:new Map(),bad:new Set()};
net.curlFetch=async function(url,headers,method){
 if(method!=='GET')throw Error('Map fixture permits GET only');
 const u=new URL(url),key=crypto.createHash('sha1').update(url).digest('hex'),base=path.join(cache,key);
 const rel=u.origin==='https://gc500-production.up.railway.app'&&u.pathname.startsWith('/w/Coates-GC500-2026/')?u.pathname.slice('/w/Coates-GC500-2026/'.length):null,media=u.origin==='https://gc500-production.up.railway.app'&&/^\/m\/Coates-GC500-2026\/([a-f0-9]{64})\.(?:webp|jpg|jpeg|png)$/.exec(u.pathname),expected=(rel&&files.get(rel))||(media&&{sha256:media[1]});
 let result;const range=Object.entries(headers||{}).find(([k])=>k.toLowerCase()==='range')?.[1];const fullHeaders=Object.fromEntries(Object.entries(headers||{}).filter(([k])=>k.toLowerCase()!=='range'));
 if(fs.existsSync(base+'.json')&&fs.existsSync(base+'.body')){result={...JSON.parse(fs.readFileSync(base+'.json')),body:fs.readFileSync(base+'.body')};assets.hits++;}
 else if(expected&&process.env.GC500_MAP_ALLOW_GET==='1'){assets.originalGets++;const task=nativeFetch(url,fullHeaders,method);pending.add(task);try{result=await task;}finally{pending.delete(task);}}
 else{assets.missing.set(key,{origin:u.origin,path:u.pathname});throw Error('Uncaptured original map asset '+key);}
 if(result.status!==200){assets.bad.add(key);throw Error('Original map asset HTTP '+result.status+' '+key);}
 if(expected){if((expected.bytes!=null&&result.body.length!==expected.bytes)||sha(result.body)!==expected.sha256){assets.bad.add(key);throw Error('Original machine asset differs from verified manifest '+key);}if(rel)assets.verified.add(rel);else assets.media.add(media[1]);}
 if(range){const m=/^bytes=(\d+)-(\d+)$/.exec(range);if(!expected||!m)throw Error('Unsupported unverified Range');const from=Number(m[1]),to=Number(m[2]);if(from>to||to>=result.body.length)throw Error('Out-of-bounds Range');return {status:206,headers:{...result.headers,'content-range':`bytes ${from}-${to}/${result.body.length}`,'content-length':String(to-from+1),'accept-ranges':'bytes'},body:result.body.subarray(from,to+1)};}
 return result;
};
const common=require('../../v10.66_speed_smooth_DRAFT/tests/validation/common.cjs');
exports.open=options=>common.launch({pageFile:options.pageFile,hash:options.hash,mobile:options.mobile,init:"try{localStorage.setItem('gc500.explorer.mode','original')}catch(e){}"});
exports.evidence=async h=>{await Promise.allSettled([...pending]);const api=common.errorsOf(h);return {ok:!assets.missing.size&&!assets.bad.size&&!api.pageErrors.length&&!api.consoleErrors.length&&!api.blocked&&!api.missingFixture.length&&api.fixtureVersions.consistent&&api.fixtureVersions.state===9704,mode:'frozen API9704 + genuine original assets; manifest-checked machine bytes',machineRelease:manifest.sha256,staticHits:assets.hits,originalGets:assets.originalGets,verifiedMachineAssets:assets.verified.size,verifiedOriginalMedia:assets.media.size,missingAssets:[...assets.missing].map(([sha1,location])=>({sha1,...location})),badAssets:[...assets.bad],...api};};
