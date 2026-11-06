/* Author: Andrew Fisher. Optional final on-site day for current team contacts only.
 * Source team, earlier attendance, labour rows, rates and allocations remain intact.
 * Cancelling a programmed shift remains an explicit native running-sheet action. */
(function(root){
'use strict';
const key=value=>String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('en-AU');
function validDate(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const n=Date.parse(value+'T00:00:00Z');return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===value;
}
function current(people,records,asOf){
 const source=Array.isArray(people)?people:[];
 if(!validDate(asOf))return source.slice();
 const ends=new Map();
 for(const row of Array.isArray(records)?records:[]){
  if(row?.kind!=='person'||!key(row.person))continue;
  const name=key(row.person),values=ends.get(name)||new Set();
  // An ambiguous duplicate never silently removes a current contact.
  values.add(validDate(row.last_day)?row.last_day:null);ends.set(name,values);
 }
 return source.filter(person=>{
  const values=ends.get(key(person?.name));if(!values||values.size!==1)return true;
  const end=[...values][0];return !end||asOf<=end;
 });
}
const api=Object.freeze({validDate,current});
if(typeof module==='object'&&module.exports)module.exports=api;
root.OnsiteAvailability1299=api;
})(typeof window==='object'?window:globalThis);
