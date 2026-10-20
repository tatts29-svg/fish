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

(async()=>{const s=await h.exports.open({pageFile:process.env.PAGE,hash:'#timeline',W:1000,H:1200}),p=s.page;try{await p.waitForFunction(()=>SYNC.status==='live'&&Object.keys(SYNC_COLLS).every(k=>SYNC.first.has(k)),null,{timeout:120000});await p.evaluate(()=>{window.__before940=JSON.stringify(S);bump=()=>{throw Error('Native saves denied in print test')};window.print=()=>{};});await p.emulateMedia({media:'print'});const reports=[];
for(const [date,index]of [['2026-09-14',6],['2026-09-14',9],['2026-10-19',3],['2026-10-09',5]]){await p.evaluate(({date,index})=>holdAssets(()=>{window.__result940=null;dpPrint(date,'drv',{only:index,pdf:(r,w,done)=>{__result940=r;window.__done940=done;document.body.classList.remove('pdf7-make');document.body.classList.add('printing-day');}});}),{date,index});await p.waitForFunction(()=>__result940,null,{timeout:45000});const result=await p.evaluate(()=>{const wrap=document.getElementById('dayprint'),text=wrap.innerText;dpFit(wrap);dpFit(wrap);return {native:__result940,bad:/\b(undefined|NaN)\b/.test(text),pages:[...wrap.querySelectorAll('.dp-page')].map(e=>{const r=e.getBoundingClientRect(),f=e.querySelector('.dp-ft'),ref=e.querySelector('.pl-ref'),range=document.createRange();if(ref)range.selectNodeContents(ref);return {fits:e.scrollHeight<=e.clientHeight+1&&e.scrollWidth<=e.clientWidth+1,footer:f?f.getBoundingClientRect().bottom<=r.bottom+1:true,refFit:ref?range.getBoundingClientRect().width<=ref.clientWidth:true,numberLabels:e.querySelectorAll('.dp-pages899').length};})};});assert(!result.native.timeout&&!result.native.failed&&!result.native.over.length&&!result.bad);assert(result.pages.every(x=>x.fits&&x.footer&&x.refFit&&x.numberLabels<=1));reports.push({date,index,pages:result.pages.length,pass:true});await p.evaluate(()=>{__done940();window.dispatchEvent(new Event('afterprint'));});}
assert(await p.evaluate(()=>JSON.stringify(S)===__before940));assert.deepEqual(s.errors,[]);console.log(JSON.stringify({pass:true,reports,nativeRecordUnchanged:true,requests:s.counts}));}finally{await s.browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1});
