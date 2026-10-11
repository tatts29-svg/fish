// Author: Andrew Fisher. Actual-public proof: never substitute parent HTML or map/media files.
'use strict';
const Module=require('module'),path=require('path'),crypto=require('crypto');
const harness=path.resolve(__dirname,'../../toolchain/harness/open_page.js'),originalLoad=Module._load;
if(process.env.PUBLIC!=='1'||!/^[a-f0-9]{64}$/.test(process.env.EXPECTED_SHA||''))throw Error('Explicit public mode and exact expected page hash required');
if(process.env.MAP_CODE||process.env.MACHINE995_TEST_MEDIA)throw Error('Local map/media substitution is not permitted');
Module._load=function(request,parent,isMain){
 const value=originalLoad.apply(this,arguments);
 let resolved;try{resolved=Module._resolveFilename(request,parent);}catch(_){return value;}
 if(resolved===harness&&value&&typeof value.open==='function'&&!value.__public996){
  const nativeOpen=value.open;
  value.open=async function(options){
   const {curlFetch}=originalLoad.call(Module,path.join(path.dirname(harness),'curlfetch.js'),parent,false);
   const response=await curlFetch('https://gc500-production.up.railway.app/v/Coates-GC500-2026',{'cache-control':'no-cache'},'GET');
   if(response.status!==200||crypto.createHash('sha256').update(response.body).digest('hex')!==process.env.EXPECTED_SHA)throw Error('Actual-public page does not match reviewed candidate');
   const result=await nativeOpen({...options,pageFile:undefined});
   if(result.counts.page!==0)throw Error('Unexpected local parent substitution');
   return result;
  };
  value.__public996=true;
 }
 return value;
};
