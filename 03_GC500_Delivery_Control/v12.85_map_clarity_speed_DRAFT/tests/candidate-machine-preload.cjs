/* Author: Andrew Fisher. Serve reviewed local machine files through the existing GET-only sweep harness. */
const fs=require('fs'),path=require('path');
const client=require('../../toolchain/harness/curlfetch'), original=client.curlFetch;
const base='https://gc500-production.up.railway.app/w/Coates-GC500-2026/';
const allowed=new Set(['explorer/index.html','explorer/explorer.js','explorer/explorer-merge.js','poc3d/index.html']);
client.curlFetch=async function(url,headers,method='GET',data){
 const rel=url.startsWith(base)?url.slice(base.length).split('?')[0]:'';
 if(method==='GET'&&allowed.has(rel)){
  const file=path.join(process.env.CANDIDATE,rel);
  return {status:200,headers:{'content-type':rel.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','cache-control':'no-store'},body:fs.readFileSync(file)};
 }
 return original.call(this,url,headers,method,data);
};
