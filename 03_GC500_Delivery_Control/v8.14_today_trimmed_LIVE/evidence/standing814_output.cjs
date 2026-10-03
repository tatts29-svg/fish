// Author: Andrew Fisher. Keep historical results intact and collect every opened context's errors.
const fs=require('node:fs'),path=require('node:path'),write=fs.writeFileSync;
const sourceDir=process.env.GC500814_SOURCE_DIR,result=process.env.GC500814_RESULT,reportPath=process.env.GC500814_HARNESS;
const report={author:'Andrew Fisher',opened:0,closed:0,errors:[],consoleErrors:[]};
const record=()=>write.call(fs,reportPath,JSON.stringify(report,null,2)+'\n');
fs.writeFileSync=function(file,...args){
 const resolved=typeof file==='string'?path.resolve(file):null;
 if(resolved&&resolved!==result&&(resolved.startsWith(sourceDir+path.sep)||/^one_tab_(desktop|phone)\.json$/.test(path.basename(resolved)))){
  if(!resolved.endsWith('.json'))throw Error('Refusing to overwrite historical evidence: '+resolved);
  file=result;
 }
 return write.call(this,file,...args);
};
const harness=require(path.join(process.env.GC500814_PROJECT,'toolchain/harness/open_page.js')),original=harness.open;
harness.open=async function(...args){
 const h=await original(...args);report.opened++;record();
 h.page.on('console',msg=>{if(msg.type()==='error'){report.consoleErrors.push(msg.text().slice(0,300));record();}});
 const close=h.browser.close.bind(h.browser);let closed=false;
 h.browser.close=async function(...xs){if(!closed){closed=true;report.closed++;report.errors.push(...h.errors);record();}return close(...xs);};
 return h;
};
process.on('exit',record);record();
