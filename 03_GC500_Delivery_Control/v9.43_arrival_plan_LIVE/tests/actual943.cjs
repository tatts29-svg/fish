// Author: Andrew Fisher. Frozen-record GET-only native A4 regression checks.
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('assert/strict');
const TOOL=path.resolve(__dirname,'../../toolchain/harness'),hp=TOOL+'/open_page.js';
const frozen=JSON.parse(fs.readFileSync(process.env.FROZEN_STATE)),clock=JSON.parse(fs.readFileSync(process.env.FROZEN_CLOCK)).iso;
const fetcher=require(TOOL+'/curlfetch'),nativeFetch=fetcher.curlFetch;
let seedVersion=null,mode='frozen';
fetcher.curlFetch=async(url,headers,method,body)=>{
 assert.equal(method,'GET','Only GET may reach transport');const u=new URL(url);
 if(mode==='frozen'&&u.origin==='https://gc500-production.up.railway.app'&&['/api/state','/api/version'].includes(u.pathname)){
  const result=u.pathname==='/api/state'?frozen:{version:frozen.version,updated:frozen.updated,level:frozen.level||'view'};
  return {status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(result))};
 }
 if(process.env.ARRIVAL_ARTIFACT_SRC&&u.pathname.includes('Wed14Oct_arrival_plan_v3_p')){const n=u.pathname.endsWith('_p2.png')?2:1;return {status:200,headers:{'content-type':'image/png'},body:fs.readFileSync(process.env.ARRIVAL_ARTIFACT_SRC+'/sheet_p'+n+'.png')};}
 const res=await nativeFetch(url,headers,method,body);
 if(mode==='seed'&&u.origin==='https://gc500-production.up.railway.app'&&res.status===200){
  if(u.pathname==='/api/version')seedVersion=JSON.parse(res.body.toString());
  if(u.pathname==='/api/state'&&!frozen){throw Error("Unexpected mutable seed mode");throw Error("Unexpected seed mode");}
 }
 return res;
};
const initClock=`(() => { const NativeDate=Date, stamp=NativeDate.parse(${JSON.stringify(clock)}); class FixedDate extends NativeDate { constructor(...args){super(...(args.length?args:[stamp]));} static now(){return stamp;} } window.Date=FixedDate; })();`;
const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
let src=fs.readFileSync(hp,'utf8').replace(/const okPost = [^;]+;/,'const okPost = false;')
 .replace('counts.blocked++;',"counts.blocked++; (counts.denials ||= []).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname});")
 .replace('const page = await ctx.newPage();',`await ctx.addInitScript({content:${JSON.stringify(initClock)}}); const page = await ctx.newPage();`);
h._compile(src,hp);

(async()=>{const reports=[];for(const W of [1440,390]){const s=await h.exports.open({pageFile:process.env.PAGE,hash:'#day/2026-10-14',W,H:900}),p=s.page;try{
 await p.waitForFunction(()=>SYNC.status==='live'&&Object.keys(SYNC_COLLS).every(k=>SYNC.first.has(k)),null,{timeout:120000});
 await p.evaluate(()=>{window.__before943=JSON.stringify(S);bump=()=>{throw Error('Native saves denied')};window.print=()=>{};});
 await p.evaluate(()=>{state.day='2026-10-14';state.tlView='day';go('timeline');});await p.waitForSelector('.arrival943 details');
 assert.equal(await p.locator('[data-arrival943-map]').first().getAttribute('src'),null);
 assert(await p.evaluate(()=>arrival943Model().artifactCurrent));const composition=await p.evaluate(()=>{const sender=flow891Sender;flow891Sender=()=> 'Andrew Fisher';try{return {daily:daily821Model('2026-10-14').loads.every(l=>l.rows.every(r=>r.notes.join(' ').includes(ARRIVAL943_CURFEW))),text:daily861Body('2026-10-14',{name:'Test'},'[Daily run link]',{text:'Weather unchanged'}),mailFits:(()=>{const m=pdf7MailText('drivers','2026-10-14',0,null,DP_MAIL_MAX);return mailto(m.subject,m.text).length<=DP_MAIL_MAX;})()};}finally{flow891Sender=sender;}});assert(composition.daily&&composition.text.includes('07:00'));assert(composition.mailFits);
 await p.locator('.arrival943 summary').click();await p.waitForFunction(()=>{const im=document.querySelector('[data-arrival943-map]');return im&&[...document.querySelectorAll('[data-arrival943-map]')].every(im=>im.complete&&im.naturalWidth);});
 const visual=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,map:document.querySelector('[data-arrival943-map]').naturalWidth,words:arrival943Words(arrival943Model())}));assert(!visual.overflow);assert(visual.words.includes('05:00')&&visual.words.includes('1189408'));
 if(process.env.ARTIFACT_DIR){await p.locator('.arrival943').screenshot({path:process.env.ARTIFACT_DIR+'/arrival-'+W+'.png'});}
 await p.emulateMedia({media:'print'});
 for(const doc of ['drv','ins']){await p.evaluate(doc=>holdAssets(()=>{window.__result943=null;dpPrint('2026-10-14',doc,{only:0,pdf:(r,w,done)=>{window.__result943=r;window.__done943=done;document.body.classList.remove('pdf7-make');document.body.classList.add('printing-day');}});}),doc);
 await p.waitForFunction(()=>window.__result943,null,{timeout:45000});const print=await p.evaluate(()=>({native:__result943,map:document.querySelectorAll('#dayprint .arrival943-map').length,images:[...document.querySelectorAll('#dayprint .arrival943-map img')].every(im=>im.complete&&im.naturalWidth),bad:/\b(undefined|NaN)\b/.test(document.getElementById('dayprint').innerText),fit:[...document.querySelectorAll('#dayprint .dp-page')].every(pg=>pg.scrollHeight<=pg.clientHeight+1&&pg.scrollWidth<=pg.clientWidth+1)}));assert.equal(print.map,2);assert(print.images&&print.fit&&!print.bad&&!print.native.timeout&&!print.native.failed&&!print.native.over.length);reports.push({W,doc,pass:true,pages:print.native.pages});
 if(process.env.ARTIFACT_DIR&&W===1440&&doc==='drv'){await p.locator('#dayprint .arrival943-map').nth(1).screenshot({path:process.env.ARTIFACT_DIR+'/printed-map.png'});await p.pdf({path:process.env.ARTIFACT_DIR+'/driver.pdf',preferCSSPageSize:true,printBackground:true});}
 await p.evaluate(()=>{__done943();window.dispatchEvent(new Event('afterprint'));});}
 const changed=await p.evaluate(()=>{const native=loading872Side;try{loading872Side=()=> 'driver';const M=arrival943Model();return {stale:!M.artifactCurrent,warning:arrival943Words(M).includes('stale'),map:dpPage(M.d,dpLoads(M.d)[0],'drv',1,4).includes('arrival943-map')};}finally{loading872Side=native;}});assert(changed.stale&&changed.warning&&!changed.map);
 assert(await p.evaluate(()=>JSON.stringify(S)===__before943));assert.deepEqual(s.errors,[]);reports.push({W,recordUnchanged:true,staleMapWithheld:true,requests:s.counts});
 }finally{await s.browser.close();}}console.log(JSON.stringify({pass:true,reports}));})().catch(e=>{console.error(e.stack);process.exitCode=1});
