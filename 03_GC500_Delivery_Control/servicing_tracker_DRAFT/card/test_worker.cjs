/* Author: Andrew Fisher. Offline worker scope/cache contract; Node VM only, no network. */
'use strict';
const vm=require('node:vm'), fs=require('node:fs'), assert=require('node:assert/strict');
const handlers={},entries=new Map(),base='https://local.invalid/d/fake000000000000000001';
let network=()=>new Response('<!doctype html><title>Local fixture</title>',{headers:{'content-type':'text/html'}}),passes=0;
const cache={put:async(k,v)=>entries.set(k,v.clone()),match:async k=>entries.get(k)?.clone(),delete:async k=>entries.delete(k)};
const context={URL,Response,self:{location:new URL(base+'/sw.js'),addEventListener:(k,f)=>handlers[k]=f,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>cache},fetch:async req=>network(req)};
vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('./tracker_sw.js'),'utf8'),context);
const check=(name,good)=>{assert.ok(good,name);passes++;console.log('PASS '+name);};
function nav(url=base,method='GET',mode='navigate'){let response=null;handlers.fetch({request:{url,method,mode},respondWith:p=>{response=p;}});return response;}
(async()=>{
 let ack;const work=[];handlers.message({data:{type:'CACHE_CARD'},source:{url:base+'#r=WC01.fake'},ports:[{postMessage:x=>{ack=x;}}],waitUntil:p=>work.push(p)});await Promise.all(work);check('cache acknowledgement follows exact card fetch',ack.ready===true&&entries.has(base));
 network=()=>{throw Error('offline');};check('fresh offline navigation returns cached HTML',await (await nav()).text()==='<!doctype html><title>Local fixture</title>');
 check('trailing-slash scan shares exact cached card',await(await nav(base+'/')).text()==='<!doctype html><title>Local fixture</title>');
 check('tick API is never intercepted',nav(base+'/ticks?since=0')===null);
 check('main page is never intercepted',nav('https://local.invalid/v/Coates-GC500-2026')===null);
 check('other token sharing scope prefix is never intercepted',nav(base+'Other')===null);
 check('POST is never intercepted',nav(base,'POST')===null);
 check('cross-origin page is never intercepted',nav('https://else.invalid/d/fake000000000000000001')===null);
 network=()=>new Response('withdrawn',{status:404,headers:{'content-type':'text/html'}});check('withdrawn navigation is returned rather than stale HTML',(await nav()).status===404);check('withdrawn card is evicted from cache',!entries.has(base));
 network=()=>{throw Error('offline');};let failed=false;try{await nav();}catch(_){failed=true;}check('no cached prior visit cannot fabricate an offline page',failed);
 network=()=>new Response('<title>New online card</title>',{headers:{'content-type':'text/html'}});
 const originalPut=cache.put;cache.put=async()=>{throw Error('QuotaExceededError');};
 check('cache quota failure preserves successful online response',await(await nav()).text()==='<title>New online card</title>');
 let quotaAck;const quotaWork=[];handlers.message({data:{type:'CACHE_CARD'},source:{url:base},ports:[{postMessage:x=>{quotaAck=x;}}],waitUntil:p=>quotaWork.push(p)});await Promise.all(quotaWork);
 check('cache quota failure never claims offline readiness',quotaAck.ready===false);cache.put=originalPut;
 context.caches.open=async()=>{throw Error('storage denied');};
 check('denied cache access preserves successful online response',await(await nav()).text()==='<title>New online card</title>');
 console.log(`${passes} passed, 0 failed`);
})().catch(e=>{console.error(e);process.exitCode=1;});
