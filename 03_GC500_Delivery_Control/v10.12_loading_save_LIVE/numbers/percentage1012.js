/* Author: Andrew Fisher. Raw progress decisions, separately rounded display. */
(function(root){
 'use strict';
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 const below100=100-Number.EPSILON*100;
 function ratio(done,total){
  if(!finite(done)||!finite(total)||done<0||total<=0)return null;
  const value=done/total*100;
  if(!finite(value))return null;
  return done<total?Math.min(below100,value):value;
 }
 function mean(values){
  if(!Array.isArray(values)||!values.length||values.some(n=>!finite(n)))return null;
  const value=values.reduce((sum,n)=>sum+n,0)/values.length;
  return values.some(n=>n<100)?Math.min(below100,value):value;
 }
 function display(value,lower){
  if(!finite(value))return null;
  const rounded=lower?Math.floor((value+1e-9)*100)/100:Math.round(value*100)/100;
  // A rounded numeral is never evidence that the last unit or metre is done.
  return value>=0&&value<100?Math.min(99.99,rounded):rounded;
 }
 function text(value,lower){
  const n=display(value,lower);
  return n==null?'—':n.toLocaleString('en-AU',{maximumFractionDigits:2});
 }
 function complete(done,total){return finite(done)&&finite(total)&&total>0&&done>=total;}
 const api=Object.freeze({ratio,mean,display,text,complete});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.ProgressPercent1012=api;
})(typeof window!=='undefined'?window:null);
