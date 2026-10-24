/* Author: Andrew Fisher. Real HTTP, disposable localhost store. No live writes. */
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),assert=require('assert/strict'),crypto=require('crypto'),{spawn}=require('child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-groups-')),key='local-test-editor',server=path.join(__dirname,'server.js');
let child,port,checks=0;
const check=(label,ok)=>{assert(ok,label);checks++;console.log('PASS '+label);};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function request(method,url,body,edit=false){return new Promise((resolve,reject)=>{const data=body?JSON.stringify(body):null,r=http.request({host:'127.0.0.1',port,method,path:url,headers:{...(edit?{'x-gc500-token':key}:{}),...(data?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(data)}:{})}},s=>{let raw='';s.on('data',x=>raw+=x);s.on('end',()=>{let j;try{j=JSON.parse(raw);}catch{}resolve({status:s.statusCode,j,raw});});});r.on('error',reject);r.end(data);});}
async function stop(){if(child){const c=child;child=null;c.kill('SIGTERM');await new Promise(r=>c.once('exit',r));}}
async function start(file=server){port=await new Promise(r=>{const s=http.createServer();s.listen(0,'127.0.0.1',()=>{const n=s.address().port;s.close(()=>r(n));});});const fd=fs.openSync(path.join(dir,'server.log'),'a');child=spawn(process.execPath,['-r',path.join(__dirname,'../server_v5.90_servicing_tracker_DRAFT/fake_clock.js'),file],{env:{PATH:process.env.PATH,PORT:String(port),DATA_DIR:dir,EDIT_TOKEN:key,VIEW_TOKEN:'local-test-viewer',FAKE_NOW:'2026-10-24T10:00:00+10:00'},stdio:['ignore',fd,fd]});for(let i=0;i<100;i++){try{const r=await request('GET','/health');if(r.status===200)return r.j;}catch{}await wait(50);}throw Error('server did not start');}
(async()=>{try{
let health=await start();check('server advertises group persistence',health.build==='v5.92'&&health.crew_groups_version===1);
const body={load:'servicing-tracker:LOCAL',title:'Synthetic servicing',run_date:'2026-10-23',expires:'2026-10-26',keys:[],html:'<!doctype html><title>Local only</title><script>/* synthetic */</script>',tracker:{days:[{id:'2026-10-23',plan:'night'}],lines:[{id:'TEST-FWF',ref:'TEST',kind:'fwf',qty:1}],plans:{fwf:{night:['pump','clean','refill']}}}};
let r=await request('POST','/api/cards',body,true);check('create synthetic tracker',r.status===200);const token=r.j.token,sig=r.j.tracker.links.TEST,route='/d/'+token+'/ticks';
const tick=(group,extra={})=>Object.assign({id:crypto.randomBytes(16).toString('hex'),ref:'TEST',sig,line:'TEST-FWF',task:'pump',day:'2026-10-23',done:true,undoes:[],tapped_at:'2026-10-23T15:00:00Z'},group?{crew_group:group}:{},extra);
const post=ts=>request('POST',route,{ticks:ts});
const old=tick();r=await post([old]);check('legacy phone remains accepted',r.status===200&&!('crew_group' in r.j.saved[0]));
const groups=['cleaners','pump1','pump2','pump3','water'],events=groups.map(g=>tick(g));r=await post(events);check('all five groups saved and echoed',r.status===200&&r.j.saved.every((x,i)=>x.crew_group===groups[i]));
r=await post(events);check('retry keeps identical attribution and IDs',r.status===200&&r.j.saved.every((x,i)=>x.already&&x.crew_group===groups[i]));
r=await post([{...events[0],crew_group:'water'}]);check('same ID cannot change crew',r.status===409&&r.j.code==='id_reused');
r=await post([{...events[0],crew_group:undefined}]);check('same ID cannot erase crew',r.status===409&&r.j.code==='id_reused');
for(const invalid of ['__proto__','unknown','',{},1,'pump1<script>']){r=await post([tick(null,{crew_group:invalid})]);check('reject invalid group '+JSON.stringify(invalid),r.status===400&&r.j.code==='crew_group');}
const atomic=tick('water');r=await post([atomic,tick(null,{crew_group:'invalid'})]);check('invalid batch saves nothing',r.status===400);r=await request('GET',route);check('read contains capability and saved group fields',r.j.crew_groups_version===1&&r.j.ticks.length===6&&r.j.ticks.every((x,i)=>i===0?!('crew_group'in x):x.crew_group===groups[i-1]));
const before=JSON.stringify(r.j.ticks),epoch=r.j.epoch;
r=await request('GET','/api/ticks?token='+token,true);check('private manager route still needs edit access',r.status===401);
r=await request('GET','/api/ticks?token='+token,null,true);check('manager read agrees exactly with crew',JSON.stringify(r.j.ticks)===before);
await stop();await start();r=await request('GET',route);check('restart retains all groups and original history',JSON.stringify(r.j.ticks)===before&&r.j.epoch===epoch);
const undo=tick('water',{done:false,undoes:[events[4].id]});r=await post([undo]);check('undo saves its operator group',r.status===200&&r.j.saved[0].crew_group==='water');
r=await request('GET','/api/ticks?token='+token+'&links=1',null,true);check('signed QR unchanged',r.j.links.TEST===sig);
const history=JSON.stringify(r.j.ticks);
await stop();await start(path.join(__dirname,'../server_v5.91_export_completeness_LIVE/server.js'));r=await request('GET','/health');check('rollback starts without recovery or refusal',r.j.build==='v5.91'&&!r.j.record_recovered&&!r.j.tracker_refusing);await stop();await start();r=await request('GET',route);check('roll-forward retains attribution in stored events',JSON.stringify(r.j.ticks)===history);
const badSig=tick('water',{sig:'not-the-valid-signature'});r=await post([badSig]);check('group cannot bypass QR signature',r.status===403);
console.log(JSON.stringify({author:'Andrew Fisher',passed:checks,failed:0,local_only:true}));
}finally{await stop();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
