/* Author: Andrew Fisher. Optional test transport: exact cached assets only, no network fallback. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const toolchain=path.resolve(__dirname,'../../../toolchain'),cache=process.env.GC500_CACHE;
if(!cache)throw Error('GC500_CACHE must contain the previously captured original assets');
const transport=require(path.join(toolchain,'harness/curlfetch.js'));
const cached={reads:0,missing:[],networkFallback:false};
// Require this before common.cjs. That adapter then intercepts saved API/weather GETs;
// every other request must have the original canonical-cache metadata AND bytes.
transport.curlFetch=async(url,headers,method)=>{
 const key=crypto.createHash('sha1').update(url).digest('hex'),file=path.join(cache,key);
 if(method!=='GET'||!fs.existsSync(file+'.json')||!fs.existsSync(file+'.body')){
  cached.missing.push({key,method});throw Error('Uncaptured original asset '+key);
 }
 try{
  const meta=JSON.parse(fs.readFileSync(file+'.json','utf8'));
  if(meta.status!==200)throw Error('Cached asset is not a successful original response '+key);
  const body=fs.readFileSync(file+'.body');cached.reads++;return {...meta,body};
 }catch(error){cached.missing.push({key,method,reason:'invalid original cache entry'});throw error;}
};
module.exports=cached;
