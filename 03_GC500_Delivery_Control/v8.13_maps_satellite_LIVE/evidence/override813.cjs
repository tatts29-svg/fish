// Author: Andrew Fisher. Exact local map assets through the read-only official harness.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),project=path.dirname(root);
const manifest=JSON.parse(fs.readFileSync(__dirname+'/assets813_build.json','utf8'));
const files=new Map();
for(const [name,meta] of Object.entries(manifest.files)){
 const bytes=fs.readFileSync(root+'/release/'+name);
 if(crypto.createHash('sha256').update(bytes).digest('hex')!==meta.sha256)throw Error('Map candidate changed: '+name);
 files.set('/w/Coates-GC500-2026/'+name,{status:200,headers:{'content-type':name.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8','cache-control':'no-store'},body:bytes});
}
const cf=require(project+'/toolchain/harness/curlfetch'),original=cf.curlFetch;
cf.curlFetch=async(u,...args)=>{
 const url=new URL(u),local=url.origin==='https://gc500-production.up.railway.app'&&files.get(url.pathname);
 return local||original(u,...args);
};
const write=fs.writeFileSync;
fs.writeFileSync=function(file,...args){
 if(typeof file==='string'&&/(?:packed|equipment)_(?:desktop|phone)\.json$/.test(file)&&process.env.GC500813_RESULT)file=process.env.GC500813_RESULT;
 return write.call(this,file,...args);
};
