/* Author: Andrew Fisher. Weather stability, native request lifecycle and truthful bounds. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../weather1299_src');
function rig(){
 const deferred=[],callbacks=[];let now=1000,day='2026-11-05',active=true,requests=0,paints=0;
 const api=W.create({active:()=>active,now:()=>now,day:()=>day,loaders:()=>[0,1].map(()=>done=>{requests++;callbacks.push(done);}),paint:()=>paints++,defer:fn=>deferred.push(fn)});
 return {api,deferred,callbacks,setNow:v=>now=v,setDay:v=>day=v,setActive:v=>active=v,flush:()=>{while(deferred.length)deferred.shift()();},get requests(){return requests;},get paints(){return paints;}};
}
test('unchanged observations and forecast rows retain their card identity key',()=>{
 const r=rig(),a={},b={},old={kind:'wind',hi:29,lo:19,source:{date:'2026-11-03',gust_kph:37,partial:false}};
 r.api.remember(a,old);assert.equal(r.api.changed(a,JSON.parse(JSON.stringify(old))),false);assert.equal(r.api.changed(a,old),false);
 assert.equal(r.api.changed(b,old),true);assert.equal(r.api.changed(a,{...old,hi:30}),true);assert.equal(r.api.changed(a,{...old,hi:30}),false);
 assert.equal(r.api.changed(a,{...old,source:{...old.source,partial:true}}),true);
});
test('direct active Demob entry requests both native sources once and coalesces responses',()=>{
 const r=rig();assert.equal(r.api.request(),true);assert.equal(r.requests,2);r.callbacks.forEach(f=>f());assert.equal(r.paints,0,'Do not repaint inside a synchronous native mount');
 r.flush();assert.equal(r.paints,1);assert.equal(r.api.request(),false);assert.equal(r.requests,2);
});
test('repeated ticks are cheap; normal refresh, Brisbane date rollover and clock correction can refresh',()=>{
 const r=rig();r.api.request();for(let i=1;i<20;i++){r.setNow(1000+i*1000);assert.equal(r.api.request(),false);}assert.equal(r.requests,2);
 r.setNow(601000);assert.equal(r.api.request(),true);assert.equal(r.requests,4);
 r.setDay('2026-11-06');assert.equal(r.api.request(),true);assert.equal(r.requests,6);
 r.setNow(0);assert.equal(r.api.request(),true);assert.equal(r.requests,8);
});
test('inactive tabs neither fetch nor repaint when late responses arrive',()=>{
 const r=rig();r.setActive(false);assert.equal(r.api.request(),false);assert.equal(r.requests,0);
 r.setActive(true);r.api.request();r.setActive(false);r.callbacks.forEach(f=>f());r.flush();assert.equal(r.paints,0);
 r.setActive(true);assert.equal(r.api.request(),false);r.setNow(601001);assert.equal(r.api.request(),true);
});
test('native loader failures do not suppress the other source or cause a request loop',()=>{
 let calls=0,paint=0;const defer=[];
 const api=W.create({active:()=>true,now:()=>0,day:()=> '2026-11-05',loaders:()=>[()=>{calls++;throw Error('offline');},done=>{calls++;done();}],paint:()=>paint++,defer:f=>defer.push(f)});
 assert.equal(api.request(),true);assert.equal(calls,2);assert.equal(api.request(),false);assert.equal(defer.length,1);defer.shift()();assert.equal(paint,1);
});
test('single published bounds are labelled without inventing the missing temperature',()=>{
 assert.equal(W.boundLabel({hi:null,lo:19}),'min');assert.equal(W.boundLabel({hi:28,lo:null}),'max');
 assert.equal(W.boundLabel({hi:28,lo:19}),'');assert.equal(W.boundLabel({hi:null,lo:null}),'');assert.equal(W.boundLabel({hi:null,lo:0}),'min');
});
