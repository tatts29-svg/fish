/* Author: Andrew Fisher. Current 24-tab standard sweep through strict GET-only preview. */
'use strict';const fs=require('fs'),path=require('path'),crypto=require('crypto');
const shared=path.resolve(__dirname,'../../toolchain/harness/sweep.js'),sharedOpen=require.resolve('../../toolchain/harness/open_page'),{open}=require('../../release_review1021/readonly1021.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={author:'Andrew Fisher',entry:'toolchain/harness/sweep.js',entrySha256:sha(fs.readFileSync(shared)),pageSha256:process.env.PAGE?sha(fs.readFileSync(process.env.PAGE)):null,mobile:!!process.env.MOB};
const output=process.env.OUT;if(!output)throw Error('Private OUT required');fs.mkdirSync(path.dirname(output),{recursive:true});const log=console.log;
const write=()=>fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log=function(value){try{report.sweep=JSON.parse(value);write();}catch(_){log(value);}};
require.cache[sharedOpen]={id:sharedOpen,filename:sharedOpen,loaded:true,exports:{open:async options=>{
 const h=await open(options);await h.page.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:180000});
 const initial=await h.page.evaluate(()=>({version:SYNC.backend.readVersion821(),native:JSON.stringify(S)})),close=h.browser.close.bind(h.browser);
 h.browser.close=async()=>{
  const final=await h.page.evaluate(()=>({version:SYNC.backend.readVersion821(),native:JSON.stringify(S)}));report.nativeVersion=initial.version;report.nativeUnchanged=initial.version===final.version&&initial.native===final.native;report.requests={...h.counts};report.inputsUnchanged=!process.env.PAGE||sha(fs.readFileSync(process.env.PAGE))===report.pageSha256;
  const cons=report.sweep?.cons||[];report.expectedReadOnlyMapConsole=cons.filter(s=>s.includes(' @ https://tile.googleapis.com/v1/createSession?'));report.unexpectedConsole=cons.filter(s=>!report.expectedReadOnlyMapConsole.includes(s));
  report.success=!!report.sweep&&Object.keys(report.sweep.tabs).length===24&&Object.keys(report.sweep.hashes).length===7&&!report.sweep.allErrors.length&&!Object.values(report.sweep.tabs).some(r=>r.goerr)&&!report.unexpectedConsole.length&&!h.counts.blocked&&report.nativeUnchanged&&report.inputsUnchanged;
  if(!report.success)process.exitCode=1;write();log(JSON.stringify({sharedSweep:report.mobile?'phone':'desktop',tabs:Object.keys(report.sweep?.tabs||{}).length,links:Object.keys(report.sweep?.hashes||{}).length,applicationErrors:report.sweep?.allErrors.length,unexpectedConsole:report.unexpectedConsole.length,success:report.success}));return close();
 };return h;
}}};require(shared);
