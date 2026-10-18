/* Author: Andrew Fisher. Execute the original native driver-rule builders and the new adapters. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const page=fs.readFileSync(process.argv[2],'utf8'),source=fs.readFileSync(path.join(__dirname,'../departure1070_src.js'),'utf8');
function between(a,b){const start=page.indexOf(a),end=page.indexOf(b,start);assert.ok(start>=0&&end>start);return page.slice(start,end);}
const constants=['LOAD782','LOAD_SMS782','TIME782'].map(k=>{const m=page.match(new RegExp('^const '+k+' = .*;$','m'));assert.ok(m,k);return m[0];}).join('\n');
const builders=between('function rules782Sms(a){','/* the text itself:');
const ctx=vm.createContext({assert});
vm.runInContext(String.raw`this.window=this;
const DATA={weeks:[{sheet:'Week 4',start:'2026-09-21'}],driver_rules:{escort:'Keep escort.'}},S={};
const B={key:'BIG',discipline:'Portable buildings'},F={key:'OTHER',discipline:'Furniture'};
const UNLOAD_MIN782=30;const esc=String,SEQ782='The sequence: retain it.',ORDER782_BY='Original source',DISPATCH782='DISPATCH: keep verified location.',PARK782='PARK: keep wildlife.',STAGGER782='Stagger arrivals.';
let booked='',warnings=[];const ready782=()=>({ok:true,missing:[]}),order782=()=>({seq:true,sms:'ORDER: keep assigned order.'}),entry782=()=>({sms:'ENTRY: keep route.',words:'Way in retained.'}),park782=()=>true,inPlace782=()=>false,timeCheck782=()=>[],loadCheck782=()=>warnings,planFor782=()=>null,bookingLoadingWords801=()=>booked;
const dpItems=r=>r.events,assetOf=()=>B;
function flow891Card(){return '<section><h3>Truck flow</h3><p>Recorded load09:45, doorpassenger.</p><table><tr><td>oversized or curfew loads on the earliest run: away from Kingston by 05:00, on site before 07:00 (no travel 07:00–09:00 or 16:00–18:00)</td></tr></table></section>';}
function dpPage(){return '<h2>Safety</h2>';}function dropPage(){return '<div class="rs-foot">';}function daily821Model(){return {loads:[]};}function dayHtml816(){return '<div class="dmbody816">';}function sheet816Before826(){return '<h2>Rules</h2>';}function trucks816(){return [];}
const DM816={view:'list',branch:'all'};
${constants}
${builders}
const originalLong=rules782Long(B),originalHtml=rules782Html(B);
${source}
let checks=0;const check=(ok,m)=>{assert.ok(ok,m);checks++;},count=(s,needle)=>s.split(needle).length-1;
let long=rules782Long(B).join('\n'),html=rules782Html(B);
for(const needle of ['Kingston, be loaded and away by 05:00','on site before 07:00','07:00–09:00','16:00–18:00','leave the pick-up point before 07:00']){
 check(count(long,needle)===1,'long rule once: '+needle);check(count(html,needle)===1,'drawer rule once: '+needle);
}
check(long.includes('about 70 min to site')&&long.includes('Load in the delivery order'),'native loading assumptions retained');
check(long.includes('UNLOADED by')&&long.includes('at least 30 min'),'native unloaded-by distinction retained');
check(long.includes('Keep escort.')&&html.includes('Keep escort.'),'escort retained');
check(long.includes('ORDER: keep assigned order.')&&long.includes('Way in retained.'),'order and route retained');
check(rules782Optional(B).join(' ').includes('in the delivery order')&&!rules782Optional(B).join(' ').includes('05:00'),'optional SMS order retained without second Kingston policy');
check(rules782Long(F).join('\n')===originalLong.join('\n'),'nonbuilding native long unchanged');
check(rules782Html(F)===originalHtml,'nonbuilding native HTML unchanged');
warnings=['Building 9m: load09:45 - away from Kingston after05:00; actual doorpassenger'];
check(rules782Long(B).some(x=>x.includes(warnings[0]))&&rules782Html(B).includes(warnings[0]),'recorded conflict warning retained verbatim');
booked='LOAD: booked09:45; actual doorpassenger.';
check(rules782Long(B).includes(booked)&&rules782Html(B).includes(booked.replace(/^LOAD: /,'')),'booked loading evidence retained');
const d={iso:'2026-10-19',deliveries:[{a:B,events:[{item:'Building 9m'}]}],removals:[]},flow=flow891Card(d);
for(const needle of ['Kingston, be loaded and away by 05:00','on site before 07:00','07:00–09:00','16:00–18:00','leave the pick-up point before 07:00'])check(count(flow,needle)===1,'existing oversize flow rule once: '+needle);
check(flow.includes('Recorded load09:45, doorpassenger.')&&flow.includes('Oversized or curfew loads use the earliest run.'),'flow preserves recorded timing and earliest oversize priority');
const accessory={a:B,units:[{type:'Fridge',n:1}]};check(!BuildingDeparture1070.row(accessory),'native accessory-only demob units excluded');
check(!dayHtml816({},{iso:'2026-10-26',list:[accessory]}).includes('data-departure1070'),'accessory-only day unchanged');
check(!BuildingDeparture1070.row({a:B,units:[{type:'Building 6m',n:0}]}),'zero movement excluded');
const arrivalText='ALL TRUCKS ON SITE BEFORE 07:00 — load restriction curfew (no travel 07:00–09:00). Leave Kingston by 05:00. Traffic controllers from06:00.';
const extra=BuildingDeparture1070.missing(arrivalText,false);
check(!extra.includes('05:00')&&!extra.includes('07:00–09:00')&&!extra.includes('on site before'),'known special-arrival policies not repeated');
check(extra.includes('16:00–18:00')&&extra.includes('pick-up point before 07:00'),'special arrival receives missing afternoon and pickup policy');
this.result={checks,passed:true};`,ctx);
console.log(JSON.stringify({author:'Andrew Fisher',...ctx.result}));
