// Author: Andrew Fisher. Shared navigation sweep with explicit read-only map fixtures.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const tool=path.resolve(__dirname,'../../toolchain/harness');
const fetcher=require(tool+'/curlfetch'),original=fetcher.curlFetch;
let fixtures=0;
fetcher.curlFetch=async(url,headers,method,body)=>{
 const u=new URL(url);
 if(method==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession'){
  fixtures++;return {status:200,headers:{'content-type':'application/json'},body:Buffer.from(JSON.stringify({session:'local-readonly-fixture',expiry:String(Math.floor(Date.now()/1000)+600),tileWidth:256,tileHeight:256,imageFormat:'png'}))};
 }
 assert.equal(method,'GET','No remote write is allowed');
 if(u.origin==='https://tile.googleapis.com'&&u.pathname.startsWith('/v1/2dtiles/'))return {status:200,headers:{'content-type':'image/png'},body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPt8AAAAASUVORK5CYII=','base64')};
 return original(url,headers,method,body);
};
const originalLog=console.log;
console.log=value=>{
 const r=JSON.parse(value);
 assert.equal(r.allErrors.length,0,'Page errors');assert.equal(r.cons.length,0,'Console errors');
 const destinations={};
 for(const [key,x] of Object.entries(r.tabs)){
  assert(!x.goerr&&x.errors.length===0&&x.console.length===0,key+' errors');
  // Retired public routes intentionally resolve to their visible replacement.
  assert(x.shown||x.hash==='#today',key+' did not show a pane or resolve to Today');
  destinations[key]=x.hash;
 }
 assert.equal(Object.keys(r.hashes).length,7);
 for(const [key,x] of Object.entries(r.hashes))assert(x.pane&&x.errors.length===0,key+' deep link');
 assert.equal(r.back.pane,'pane-plant');
 const hash=crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
 assert.equal(hash,process.env.EXPECTED_SHA);
 const out={author:'Andrew Fisher',sha256:hash,mobile:!!process.env.MOB,pass:true,routes:Object.keys(r.tabs).length,deepLinks:7,back:r.back,destinations,errors:0,consoleErrors:0,mapSessionFixtures:fixtures,scope:'Read-only local candidate; Google map-session/2D tile fixtures; does not certify map imagery.'};
 fs.writeFileSync(process.env.OUT,JSON.stringify(out,null,2)+'\n');originalLog(JSON.stringify(out));
};
require(tool+'/sweep.js');
