/* Author: Andrew Fisher. Read-only candidate routing for the two reviewed machine replacements. */
'use strict';
if(process.env.CANDIDATE_MACHINE){
 const fs=require('fs'), path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
 const root=path.resolve(process.env.CANDIDATE_MACHINE);
 const evidence=JSON.parse(fs.readFileSync(path.join(root,'source-bound.json'),'utf8'));
 const files={};
 for(const name of ['explorer/explorer.js','explorer/index.html']){
  const body=fs.readFileSync(path.join(root,name)), row=evidence.files[name];
  assert(row && row.sha256===crypto.createHash('sha256').update(body).digest('hex') && row.bytes===body.length,'Candidate changed: '+name);
  files[name]={body,sha:row.sha256};
 }
 const transport=require('../../toolchain/harness/curlfetch'),original=transport.curlFetch;
 transport.curlFetch=(url,headers,method,body)=>{
  const u=new URL(url),prefix='/w/Coates-GC500-2026/';
  if(method==='GET'&&u.origin==='https://gc500-production.up.railway.app'&&u.pathname.startsWith(prefix)){
   const name=u.pathname.slice(prefix.length),f=files[name];
   if(f){
    if(name.endsWith('.js'))assert.equal(u.searchParams.get('v'),f.sha.slice(0,12),'Candidate script pin');
    return Promise.resolve({status:200,headers:{'content-type':name.endsWith('.js')?'text/javascript':'text/html','cache-control':'no-store'},body:f.body});
   }
  }
  return original(url,headers,method,body);
 };
}
