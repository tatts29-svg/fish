/* Author: Andrew Fisher. Validated event dates for derived charging and planning; source evidence is unchanged. */
const EventConfig1013 = (() => {
 'use strict';
 const DAY=86400000, SHORT=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], LONG=['January','February','March','April','May','June','July','August','September','October','November','December'];
 function iso(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value?value:null;}
 function read(data){
  const basis=data?.charge_basis||{},raw=basis.event_days,eventIssues=[],invoiceIssues=[],demobIssues=[];
  let days=Array.isArray(raw)?raw.slice():[];
  if(!days.length)eventIssues.push('Event charge dates are not configured');
  else if(days.some(d=>!iso(d)))eventIssues.push('Event charge dates contain an invalid calendar date');
  else {days.sort();if(days.some((d,i)=>i&&Date.parse(d+'T00:00:00Z')-Date.parse(days[i-1]+'T00:00:00Z')!==DAY))eventIssues.push('Event charge dates must be unique and consecutive');}
  if(eventIssues.length)days=[];
  const eventValid=days.length>0,eventFrom=days[0]||null,offhire=days.at(-1)||null;
  const supplied=basis.invoice_month;
  let invoiceMonth=null;
  if(supplied!=null&&String(supplied).trim()!==''){
   if(typeof supplied==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(supplied)&&iso(supplied+'-01'))invoiceMonth=supplied;
   else invoiceIssues.push('The invoice month must be a valid YYYY-MM value');
  }else if(eventValid){
   if(eventFrom.slice(0,7)===offhire.slice(0,7))invoiceMonth=eventFrom.slice(0,7);
   else invoiceIssues.push('An invoice month is required when the event spans calendar months');
  }
  if(!eventValid)invoiceIssues.push('Valid event charge dates are required before invoice allocation');
  const weeks=(Array.isArray(data?.weeks)?data.weeks:[]).filter(w=>/^demob$/i.test(String(w?.phase||'').trim()));
  let demobStart=null,demobEnd=null;
  if(!weeks.length)demobIssues.push('Demobilisation dates are not configured');
  else if(weeks.some(w=>!iso(w.start)||!iso(w.end)||w.end<w.start))demobIssues.push('Demobilisation dates contain an invalid planning window');
  else {demobStart=weeks.map(w=>w.start).sort()[0];demobEnd=weeks.map(w=>w.end).sort().at(-1);if(Date.parse(demobEnd+'T00:00:00Z')-Date.parse(demobStart+'T00:00:00Z')>366*DAY){demobStart=demobEnd=null;demobIssues.push('Demobilisation window exceeds one year and needs review');}}
  return Object.freeze({eventValid,eventFrom,offhire,eventDays:Object.freeze(days),dayCount:days.length,invoiceMonth: eventValid?invoiceMonth:null,invoiceValid:eventValid&&!!invoiceMonth&&!invoiceIssues.length,demobValid:!!demobStart,demobStart,demobEnd,eventIssues:Object.freeze(eventIssues),invoiceIssues:Object.freeze(invoiceIssues),demobIssues:Object.freeze(demobIssues)});
 }
 function signature(data){return JSON.stringify([data?.charge_basis?.event_days??null,data?.charge_basis?.invoice_month??null,(Array.isArray(data?.weeks)?data.weeks:[]).filter(w=>/^demob$/i.test(String(w?.phase||'').trim())).map(w=>[w.start,w.end]),data?.holidays??null]);}
 function makeCurrent(provider,changed=()=>{}){let key,value;return function(){const data=provider(),next=signature(data);if(next!==key){const prior=key;value=read(data);key=next;if(prior!==undefined)changed();}return value;};}
 const current=makeCurrent(()=>typeof DATA==='undefined'?{}:DATA,()=>{try{if(typeof RENDER_MEMO!=='undefined')RENDER_MEMO.clear();}catch(e){}try{if(typeof HELD_MEMO!=='undefined')HELD_MEMO.clear();}catch(e){}});
 const short=date=>iso(date)?Number(date.slice(8))+' '+SHORT[Number(date.slice(5,7))-1]:'dates to confirm';
 const range=()=>{const c=current();return !c.eventValid?'event dates to confirm':c.eventFrom.slice(0,7)===c.offhire.slice(0,7)?Number(c.eventFrom.slice(8))+'–'+short(c.offhire):short(c.eventFrom)+'–'+short(c.offhire);};
 const invoiceWords=()=>{const c=current();return c.invoiceValid?LONG[Number(c.invoiceMonth.slice(5))-1]+' invoice allocation':'invoice allocation pending';};
 const issue=()=>{const c=current();return [...c.eventIssues,...c.invoiceIssues].join('; ');};
 const previous=date=>iso(date)?new Date(Date.parse(date+'T00:00:00Z')-DAY).toISOString().slice(0,10):null;
 const days=new Proxy([], {get(_target,prop){const array=current().eventDays;const value=Reflect.get(array,prop,array);return typeof value==='function'?value.bind(array):value;},ownKeys(){return Reflect.ownKeys(current().eventDays);},getOwnPropertyDescriptor(target,prop){if(prop==='length')return Reflect.getOwnPropertyDescriptor(target,prop);const d=Reflect.getOwnPropertyDescriptor(current().eventDays,prop);return d?{...d,configurable:true}:undefined;},set(){return false;},deleteProperty(){return false;}});
 return Object.freeze({read,current,signature,makeCurrent,iso,short,range,invoiceWords,issue,previous,days});
})();
if(typeof window!=='undefined')window.EventConfig1013=EventConfig1013;
if(typeof module!=='undefined'&&module.exports)module.exports=EventConfig1013;
