// Author: Andrew Fisher. Read-only actual candidate rendering with synthetic in-memory pending entries.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {open}=require('../../toolchain/harness/open_page');
const out='/workspace/private-v798-review/photo-page';fs.mkdirSync(out,{recursive:true});
const R={author:'Andrew Fisher',candidateSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),mode:'Synthetic memory-only pending entries in actual candidate drawer; no blob, IDB write, file upload or record mutation',runs:[]};
(async()=>{for(const mobile of [false,true]){const h=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:900,dpr:1,gl:false}),p=h.page;try{
await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:240000});
const target=await p.evaluate(()=>{const a=assetOf('P46'),unit=dropPhotoUnits(a)[0]||'',slot=dropPhotoSlots(a.key,unit).findIndex(x=>!x);if(slot<0)throw Error('Need an empty existing slot');return {key:a.key,unit,slot};});
for(const state of ['queued','uploaded']){
 await p.evaluate(({target,state})=>{SYNC.db.doc=()=>({set:()=>Promise.reject(Error('Review prohibits record writes')),delete:()=>Promise.reject(Error('Review prohibits record writes'))});const e={id:'synthetic-review-pending.jpg',key:target.key,unit:target.unit,slot:target.slot,queued:new Date().toISOString(),at:new Date().toISOString(),by:'Synthetic review',lastError:state==='uploaded'?'The file is uploaded and its reference is saved on this device. Waiting for the shared record to confirm it; the photograph remains queued.':'The photograph stays in this device’s queue until the file and its reference are confirmed.'};if(state==='uploaded')e.uploaded={id:'synthetic-review-only'};PHOTO_OUTBOX.set(e.id,e);openAsset(target.key);},{target,state});
 const cell=p.locator('[data-dphpending="synthetic-review-pending.jpg"]');await cell.waitFor({state:'visible'});await cell.scrollIntoViewIfNeeded();
 const metrics=await cell.evaluate(e=>{const b=e.getBoundingClientRect();return {text:e.innerText,width:b.width,height:b.height,overflow:e.scrollWidth>e.clientWidth+1,viewport:innerWidth,drawerWidth:document.querySelector('#drawer').getBoundingClientRect().width};});
 assert(!metrics.overflow,'pending cell horizontal overflow');assert(metrics.text.includes(state==='uploaded'?'Uploaded — confirming':'Queued on this device'));
 const name=(mobile?'phone':'desktop')+'-'+state;await cell.screenshot({path:path.join(out,name+'-cell.png')});await p.screenshot({path:path.join(out,name+'-drawer.png')});R.runs.push({name,metrics,errors:h.errors});
}
await p.evaluate(()=>PHOTO_OUTBOX.clear());assert(h.errors.length===0,'page error');
}finally{await h.browser.close();}}
fs.writeFileSync(process.env.OUT,JSON.stringify(R,null,2)+'\n');console.log(JSON.stringify({candidateSha256:R.candidateSha256,runs:R.runs.length,overflow:R.runs.some(x=>x.metrics.overflow)}));})().catch(e=>{R.fatal=e.stack;fs.writeFileSync(process.env.OUT,JSON.stringify(R,null,2));console.error(e.stack);process.exitCode=1;});
