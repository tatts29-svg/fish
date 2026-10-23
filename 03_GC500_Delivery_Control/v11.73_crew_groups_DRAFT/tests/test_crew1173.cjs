/* Author: Andrew Fisher. Real card → real v5.92 server on localhost, synthetic jobs only. */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),assert=require('assert/strict'),{spawn}=require('child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),work=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-crew1173-'));
let child,browser,port,checks=0;
const check=(v,m)=>{assert(v,m);checks++;console.log('PASS '+m);},sleep=ms=>new Promise(r=>setTimeout(r,ms));
function req(method,url,body){return new Promise((resolve,reject)=>{const data=body?JSON.stringify(body):null;const r=http.request({host:'127.0.0.1',port,method,path:url,headers:{'x-gc500-token':'local-crew-editor',...(data?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}:{})}},res=>{let s='';res.on('data',v=>s+=v);res.on('end',()=>{let j;try{j=JSON.parse(s);}catch{}resolve({status:res.statusCode,j,text:s});});});r.on('error',reject);r.end(data);});}
(async()=>{try{
port=await new Promise(r=>{const s=http.createServer();s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>r(p));});});
const fd=fs.openSync(path.join(work,'server.log'),'a');
child=spawn(process.execPath,['-r',root+'/server_v5.90_servicing_tracker_DRAFT/fake_clock.js',root+'/server_v5.92_crew_groups_DRAFT/server.js'],{env:{PATH:process.env.PATH,PORT:String(port),DATA_DIR:work,EDIT_TOKEN:'local-crew-editor',VIEW_TOKEN:'local-crew-viewer',FAKE_NOW:'2026-10-24T05:00:00+10:00'},stdio:['ignore',fd,fd]});
for(let i=0;i<100;i++){try{if((await req('GET','/health')).status===200)break;}catch{}await sleep(50);}
const source=fs.readFileSync(process.env.PAGE,'utf8'),bundle=JSON.parse(source.split('\n').find(x=>x.startsWith('var SVC1067_CARD=')).slice(17,-1));
const D={...bundle.data,contact:{name:'Synthetic contact',phone:'0000000000'},crewGroups:['cleaners','pump1','pump2','pump3','water'].map((id,i)=>({id,label:'Test group '+(i+1)})),areas:[{n:1,name:'Test area',refs:['AAA','BBB'].map(ref=>({ref,title:ref,where:'Synthetic test location',lines:[{id:ref+'-FWF',kind:'fwf',type:'FWF',label:'1 × FWF',qty:1,nos:[]}]}))}]};
const html=bundle.html.replace('/*SVC1067_DATA*/null',JSON.stringify(D).replace(/<\//g,'<\\/'));
const body={load:'servicing-tracker:LOCAL',title:'Local test',run_date:D.days[0].id,expires:'2026-10-27',keys:[],contact:D.contact,html,tracker:{days:D.days.map(d=>({id:d.id,plan:d.plan})),plans:D.plans,lines:D.areas.flatMap(a=>a.refs.flatMap(r=>r.lines.map(l=>({id:l.id,ref:r.ref,kind:l.kind,qty:l.qty}))))}};
let r=await req('POST','/api/cards',body);check(r.status===200,'local tracker created');const token=r.j.token,links=r.j.tracker.links,base='http://127.0.0.1:'+port+'/d/'+token;
browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
const ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Australia/Brisbane',serviceWorkers:'block'});let externalWrites=0,dropPosts=false;const errors=[];
await ctx.route('**/*',route=>{const q=route.request(),u=new URL(q.url());if(u.hostname!=='127.0.0.1'||u.port!==String(port)){if(q.method()!=='GET')externalWrites++;return route.abort();}if(dropPosts&&q.method()==='POST')return route.abort();return route.continue();});
const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
await p.goto(base+'#r=AAA.'+links.AAA+'~clean');await p.waitForSelector('#crew1173-choice');
await p.waitForFunction(()=>!document.querySelector('#crew1173-help').parentElement.textContent.includes('Waiting for the service'));
check(await p.locator('#crew1173-choice option').count()===6,'five groups plus empty prompt');
check(await p.locator('[data-job]').count()===2,'clean QR retains clean and water jobs');
check(await p.locator('[data-job]').evaluateAll(bs=>bs.every(b=>b.disabled)),'completion blocked until explicit group');
await p.selectOption('#crew1173-choice','cleaners');await p.locator('[data-job="AAA-FWF|clean"]').click();
await p.waitForFunction(()=>document.querySelector('[data-job="AAA-FWF|clean"]').classList.contains('done'));
check((await p.locator('[data-job="AAA-FWF|clean"]').innerText()).includes('Test group 1'),'saved cleaner shown on task');
r=await req('GET','/api/ticks?token='+token);check(r.j.ticks[0].crew_group==='cleaners','cleaner persisted on server');
await p.selectOption('#crew1173-choice','water');await p.locator('[data-job="AAA-FWF|refill"]').click();await p.waitForFunction(()=>document.querySelector('[data-job="AAA-FWF|refill"]').classList.contains('done'));
r=await req('GET','/api/ticks?token='+token);check(r.j.ticks.find(t=>t.task==='refill').crew_group==='water'&&r.j.ticks.find(t=>t.task==='clean').crew_group==='cleaners','same QR preserves two distinct crews');
await p.locator('[data-save]').click();check((await p.locator('.status-ref').innerText()).includes('Test group 1')&&(await p.locator('.status-ref').innerText()).includes('Test group 5'),'saved status shows each job crew');
await p.reload();await p.waitForSelector('#crew1173-choice');check(await p.locator('#crew1173-choice').inputValue()==='','reload requires selection again');
await p.locator('[data-job="AAA-FWF|clean"]').click();await p.locator('[data-undo="AAA-FWF|clean"]').click();await p.waitForFunction(()=>!document.querySelector('[data-job="AAA-FWF|clean"]').classList.contains('done'));
check((await req('GET','/api/ticks?token='+token)).j.ticks.some(t=>!t.done&&t.undoes.length===1),'undo preserves original event');
await p.evaluate(hash=>location.hash=hash,'#r=BBB.'+links.BBB+'~pump');await p.waitForSelector('[data-job="BBB-FWF|pump"]');
check(await p.locator('#crew1173-choice').inputValue()==='','new reference clears shared-phone identity');
check(await p.locator('[data-job]').count()===1,'pump QR never offers clean or water');
await p.selectOption('#crew1173-choice','pump2');dropPosts=true;await p.locator('[data-job="BBB-FWF|pump"]').click();await p.waitForFunction(()=>svc1067.outbox().some(e=>e.crew_group==='pump2'));
check(await p.locator('[data-job="BBB-FWF|pump"]').evaluate(b=>b.classList.contains('pending')),'offline group stays pending');
await p.reload();await p.waitForSelector('#crew1173-choice');check(await p.evaluate(()=>svc1067.outbox().some(e=>e.crew_group==='pump2')),'offline reload retains selected group in queued event');
dropPosts=false;await p.evaluate(()=>window.dispatchEvent(new Event('online')));await p.waitForFunction(()=>svc1067.outbox().length===0,null,{timeout:30000});
r=await req('GET','/api/ticks?token='+token);check(r.j.ticks.find(t=>t.ref==='BBB'&&t.done).crew_group==='pump2','retry persists original group after selection cleared');
await p.reload();await p.waitForFunction(()=>document.querySelector('[data-job="BBB-FWF|pump"]').classList.contains('done'));
check((await p.locator('[data-job="BBB-FWF|pump"]').innerText()).includes('Test group 3'),'fresh phone read gets saved group');
check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'phone fits');check(!errors.length,'zero page errors');check(!externalWrites,'no writes outside localhost');
if(process.env.EVIDENCE){fs.mkdirSync(process.env.EVIDENCE,{recursive:true});await p.screenshot({path:process.env.EVIDENCE+'/crew-groups-phone.png'});}
console.log(JSON.stringify({checks,errors,externalWrites,localOnly:true}));
}finally{if(browser)await browser.close();if(child){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
