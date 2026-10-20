/* Author: Andrew Fisher. Current About contact projection only; preserve the
 * original team, historical work, costs and every other roster consumer. */
var ABOUT_CONTACT_INPUT1089 = null;
var AboutContacts1089 = (function(){
 'use strict';
 const removed=new Set(['corey machado','ross saxelby','abraham tibble','krystal stephens']);
 const name=value=>String(value||'').trim().replace(/\s+/g,' ').toLowerCase();
 function current(people,additions){
  const kept=(Array.isArray(people)?people:[]).filter(p=>!removed.has(name(p&&p.name)));
  const supplied=Array.isArray(additions)?additions:(ABOUT_CONTACT_INPUT1089?.people||[]);
  const seen=new Set(kept.map(p=>name(p&&p.name)));
  for(const p of supplied){if(!p||!name(p.name)||seen.has(name(p.name)))continue;seen.add(name(p.name));kept.push({...p});}
  return kept;
 }
 return {current};
})();
if(typeof module==='object'&&module.exports)module.exports=AboutContacts1089;
