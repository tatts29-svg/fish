// Author: Andrew Fisher. Bounded real-browser failure -> network restored -> Retry probe.
const fs=require('fs'),crypto=require('crypto');const {open}=require(require('path').join(process.env.GC500_TOOLCHAIN||require('path').resolve(__dirname,'../../toolchain'),'harness/open_page.js'));
if(!process.env.PAGE||!process.env.OUT)throw Error('Set PAGE and a private OUT directory');
const R=process.env.OUT,FILE=process.env.PAGE;fs.mkdirSync(R,{recursive:true});let s,checks=[];
const check=(name,pass,evidence)=>{checks.push({name,pass:!!pass,evidence});console.log((pass?'PASS ':'FAIL ')+name)};
async function state(p){return p.locator('#pane-today .bhero').evaluate(f=>{let v=f.querySelector('video');return{label:f.querySelector('.bplay').innerText,paused:v.paused,time:v.currentTime,network:v.networkState,error:v.error&&v.error.code,source:v.currentSrc,status:f.querySelector('.bload').innerText}})}
async function board(p){await p.evaluate(()=>{localStorage.setItem('gc500.band','shown');renderToday()});await p.locator('#pane-today .bhero').scrollIntoViewIfNeeded();await p.waitForTimeout(250)}
async function button(p){await p.locator('#pane-today .bhero .bplay').click()}
async function playing(p){try{await p.waitForFunction(()=>{const v=document.querySelector('#pane-today .bhero video');return v&&!v.paused&&v.currentTime>.4},null,{timeout:12000});return true}catch{return false}}
(async()=>{try{
 s=await open({pageFile:FILE,W:1440,H:1000});const p=s.page;await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});await p.evaluate(()=>go('today'));
 const glob='**/m/Coates-GC500-2026/*';let block='unavailable',requests=0,held=[];
 await p.route(glob,async r=>{if(!/\.(webm|mp4)(\?|$)/.test(r.request().url()))return r.fallback();requests++;if(block==='unavailable')return r.fulfill({status:404,body:''});if(block==='stall'){held.push(r);return;}return r.fallback()});
 await board(p);await button(p);await p.waitForFunction(()=>document.querySelector('#pane-today .bhero .bplay span')?.textContent==='Retry clip',null,{timeout:23000});const unavailable=await state(p);check('Unavailable sources reach still and Retry',unavailable.paused&&unavailable.label==='Retry clip',unavailable);
 block='healthy';const before=requests;await button(p);const recovered=await playing(p);check('Restored network Retry starts real media',recovered,{beforeRequests:before,afterRequests:requests,state:await state(p)});if(!recovered)return;
 await button(p);block='stall';await board(p);await button(p);await p.waitForFunction(()=>document.querySelector('#pane-today .bhero .bplay span')?.textContent==='Retry clip',null,{timeout:23000});check('Stalled response reaches bounded Retry',(await state(p)).paused,await state(p));
 block='healthy';let pending=held;held=[];for(const route of pending){try{await route.abort()}catch{}}const beforeStall=requests;await button(p);check('Timed-out request can retry real media',await playing(p),{beforeRequests:beforeStall,afterRequests:requests,state:await state(p)});
 check('No page errors',s.errors.length===0,s.errors);check('No outgoing record writes',s.counts.blocked===0,s.counts);
 }catch(e){checks.push({name:'Execution',pass:false,error:e.message});console.error(e.message)}finally{if(s)await s.browser.close();const report={author:'Andrew Fisher',candidate:crypto.createHash('sha256').update(fs.readFileSync(FILE)).digest('hex'),passed:checks.filter(x=>x.pass).length,total:checks.length,checks};fs.writeFileSync(process.env.REPORT||R+'/retry-recovery-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.passed!==report.total)process.exitCode=1;}})();
