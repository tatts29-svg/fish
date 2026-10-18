/* Author: Andrew Fisher. Run the unchanged canonical sweep using only saved original replies/assets. */
'use strict';
const fs=require('fs'),path=require('path');
const [pageFile,outFile]=process.argv.slice(2);
if(!pageFile||!outFile)throw Error('Usage: node isolated_sweep.cjs PAGE.html PRIVATE.json');
if(process.env.GC500_CAPTURE!=='0')throw Error('Isolated sweeps require GC500_CAPTURE=0');
const toolchain=path.resolve(__dirname,'../../../toolchain'),cached=require('./cache_only.cjs');
const C=require('./common.cjs'),harness=require(path.join(toolchain,'harness/open_page.js'));
const nativeOpen=harness.open;let session,initialMerge,received=false;
harness.open=async options=>{
 session=await nativeOpen(options);
 try{await C.ready(session);initialMerge=await C.mergeReport(session.page);if(!initialMerge.complete)throw Error('Initial frozen-record merge incomplete');}
 catch(error){await session.browser.close();throw error;}
 return session;
};
const originalLog=console.log.bind(console);
console.log=(...args)=>{
 if(args.length===1&&typeof args[0]==='string'&&args[0].startsWith('{')){
  const result=JSON.parse(args[0]);
  if(result.tabs&&result.hashes){
   received=true;C.writePrivate(outFile,result);
   const health=C.errorsOf(session);
   const meta={author:'Andrew Fisher',evidence:'isolated frozen-record/cached-original-assets; not a live-network pass',pageSha256:C.sha(fs.readFileSync(pageFile)),mobile:!!process.env.MOB,canonicalSweepSha256:C.sha(fs.readFileSync(path.join(toolchain,'harness/sweep.js'))),initialMerge,health,cached};
   C.writePrivate(outFile.replace(/\.json$/,'.meta.json'),meta);
   C.assertClean(session);
   if(cached.missing.length)throw Error('Original static asset cache is incomplete');
   originalLog(JSON.stringify({transportPass:true,mobile:meta.mobile,panes:Object.keys(result.tabs).length,links:Object.keys(result.hashes).length,cachedAssets:cached.reads,networkFallback:false}));
   return;
  }
 }
 originalLog(...args);
};
process.on('exit',()=>{if(!received)process.exitCode=1;});
// Set PAGE only after common.cjs has rejected unrelated inherited page/media overrides.
process.env.PAGE=path.resolve(pageFile);
require(path.join(toolchain,'harness/sweep.js'));
