/* Author: Andrew Fisher. Display source-rate precision without changing any charge. */
(function(root){
'use strict';
const MAX_DIGITS=8,formats=new Map();
const finite=v=>typeof v==='number'&&Number.isFinite(v);
function format(digits){
 if(!formats.has(digits))formats.set(digits,{
  money:new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:2,maximumFractionDigits:digits}),
  number:new Intl.NumberFormat('en-AU',{useGrouping:false,minimumFractionDigits:2,maximumFractionDigits:digits})
 });
 return formats.get(digits);
}
function decimal(text){
 const m=String(text).match(/^([+-]?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
 if(!m)return null;
 return {n:BigInt((m[1]==='-'?'-':'')+m[2]+(m[3]||'')),scale:(m[3]||'').length-Number(m[4]||0)};
}
function cents(parts){
 let n=parts.reduce((v,p)=>v*p.n,1n),scale=parts.reduce((v,p)=>v+p.scale,0)-2;
 if(scale<=0)return n*10n**BigInt(-scale);
 const negative=n<0n;if(negative)n=-n;
 const divisor=10n**BigInt(scale),rounded=n/divisor+(n%divisor*2n>=divisor?1n:0n);
 return negative?-rounded:rounded;
}
function rate(line){
 const l=line||{},value=l.rate;
 if(!finite(value))return {text:'Rate not recorded',digits:2,matched:false,note:''};
 const base={text:format(2).money.format(value),digits:2,matched:false,note:''};
 const rounded=Number(format(2).number.format(value))!==value;
 if(!finite(l.qty)||!finite(l.days)||!finite(l.total))return {...base,note:rounded?'rate shown rounded':''};
 const target=format(2).money.format(l.total),native=value*l.qty*l.days;
 // The source calculation stays authoritative. Never imply equality for a
 // different basis, a stale subtotal or an overflowing product.
 if(!finite(native)||[value,l.qty,l.days,l.total].some(v=>Math.abs(v)>Number.MAX_SAFE_INTEGER)||format(2).money.format(native)!==target)return {...base,note:'subtotal shown separately'};
 const factors=[decimal(l.qty),decimal(l.days)],targetCents=cents([decimal(format(2).number.format(l.total))]);
 for(let digits=2;digits<=MAX_DIGITS;digits++){
  const f=format(digits),shown=decimal(f.number.format(value));
  // Decimal arithmetic validates what a reader can actually multiply. Binary
  // floating ties (for example 1.005 × 3) must not promise a false equality.
  if(cents([shown,...factors])===targetCents)return {
   text:f.money.format(value),digits,matched:true,note:digits>2?'subtotal rounded to cents':''
  };
 }
 return {...base,note:'rate shown rounded; subtotal uses the original calculation'};
}
function formula(line){
 const l=line||{},r=rate(l);
 if(!finite(l.rate))return r.text;
 if(!finite(l.days))return 'Daily rate '+r.text+(r.note?' — '+r.note:'');
 return String(l.days)+' day'+(l.days===1?'':'s')+' × '+r.text
  +(finite(l.qty)?' × '+String(l.qty):'')+(r.note?' — '+r.note:'');
}
const api={rate,formula};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.Rate941=api;
})(typeof window!=='undefined'?window:null);
