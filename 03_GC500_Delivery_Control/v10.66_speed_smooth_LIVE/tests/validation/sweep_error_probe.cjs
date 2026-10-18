/* Author: Andrew Fisher. Observe canonical sweep error stacks without changing requests or page behavior. */
'use strict';
const fs=require('fs'),path=require('path'),{chromium}=require('playwright');
const file=process.env.GC500_SWEEP_ERROR_LOG;
if(!file||path.resolve(file).startsWith(path.resolve(__dirname,'../../../..')+path.sep))throw Error('A private GC500_SWEEP_ERROR_LOG is required');
const evidence={author:'Andrew Fisher',errors:[],failedResponses:[],frames:[]};
const save=()=>fs.writeFileSync(file,JSON.stringify(evidence,null,2),{mode:0o600});
const launch=chromium.launch.bind(chromium);
chromium.launch=async options=>{
 const browser=await launch(options),newContext=browser.newContext.bind(browser);
 browser.newContext=async options=>{
  const context=await newContext(options);
  context.on('page',page=>{
   page.on('pageerror',error=>{evidence.errors.push({message:error.message,stack:error.stack,frames:page.frames().map(f=>f.url())});save();});
   page.on('response',response=>{if(response.status()>=400){evidence.failedResponses.push({status:response.status(),url:response.url(),resourceType:response.request().resourceType()});save();}});
   page.on('framenavigated',frame=>{evidence.frames.push(frame.url());});
  });
  return context;
 };
 const close=browser.close.bind(browser);browser.close=async()=>{save();return close();};
 return browser;
};
process.on('exit',save);
