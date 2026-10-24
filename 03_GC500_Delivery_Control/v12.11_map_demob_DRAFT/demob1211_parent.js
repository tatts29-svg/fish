/* Author: Andrew Fisher. Read-only pickup selections from the native remaining-unit model. */
(function(W){
 'use strict';
 const norm=s=>String(s??'').toLowerCase().replace(/\s+/g,' ').trim();
 const company=o=>W.Units925?.company?.(o)||({'coates':'Coates','event-portables':'Event Portables','unknown':'Owner to confirm'}[o]||o||'Owner to confirm');
 const fwf=u=>/^fwf(?:\b|$)/i.test(String(u.item||''));
 function reference(key){
  const x=W.DemobCollection996.snapshot(key);if(!x)return null;
  const hold=[...x.reading.issues];
  if(!x.reading.arrival||x.record.state!=='on site')hold.push('On-site arrival/current availability must be confirmed before pickup.');
  if(x.r.empty&&!x.r.emptied)hold.push('Pump-out not confirmed — do not collect until recorded as emptied.');
  if(x.reading.unknown)hold.push('Some quantities are not established; only the known quantities below can be selected.');
  const items=x.reading.remaining.filter(u=>u.n>0).map(u=>{
   const ids=x.pools[norm(u.type)]||[],units=ids.map(id=>x.identities[id]).filter(Boolean).map(v=>({...v,company:company(v.owner)}));
   return {type:u.type,n:u.n,units,unidentified:Math.max(0,u.n-units.length)};
  });
  const loading=W.MapArea1206.metadata(key).loading;
  return {key,name:String(x.r.a?.name||x.r.a?.location||key),items,hold,loading,token:JSON.stringify([x.token,hold,loading]),complete:x.reading.complete};
 }
 function coatesFWF(){
  const out=[];
  for(const a of allAssets()){
   if(a._cancelled||rowOff(a.key)||movedAway(a.key))continue;
   const candidates=gcUnits925(a,{loading:false}).filter(u=>u.physical&&u.owner==='coates'&&fwf(u));if(!candidates.length)continue;
   const x=W.DemobCollection996.snapshot(a.key),used=new Set(x?.reading.events.flatMap(c=>c.items.flatMap(u=>u.unitIds||[]))||[]);
   const units=candidates.filter(u=>!used.has(u.id));
   if(units.length&&!x?.reading.complete)out.push({key:a.key,units:units.map(u=>({id:u.id,number:u.assetNo||'',item:u.item,owner:u.owner})),name:a.name||a.location||a.key});
  }
  return out;
 }
 function validate(selections){
  if(!Array.isArray(selections)||!selections.length)throw new Error('Select at least one item for pickup.');
  const result=[],seen=new Set();
  for(const s of selections){
   if(seen.has(s.key))throw new Error('A reference was selected twice.');seen.add(s.key);
   const r=reference(s.key);if(!r||r.token!==s.token)throw new Error('The site record changed. Reopen Demob and review the selection.');
   const items=[],types=new Set();
   for(const pick of s.items||[]){
    const type=norm(pick.type),item=r.items.find(u=>norm(u.type)===type);if(!item||types.has(type))throw new Error('The selected item no longer matches this reference.');types.add(type);
    const ids=pick.ids||[],unidentified=Number(pick.unidentified||0),units=ids.map(id=>item.units.find(u=>u.id===id));
    if(new Set(ids).size!==ids.length||units.some(u=>!u)||!Number.isInteger(unidentified)||unidentified<0||unidentified>item.unidentified||ids.length+unidentified>item.n)throw new Error('Check the selected quantities and asset numbers.');
    if(ids.length+unidentified)items.push({type:item.type,n:ids.length+unidentified,units,unidentified});
   }
   if(items.length)result.push({...r,items});
  }
  if(!result.length)throw new Error('Select at least one item for pickup.');return result;
 }
 function mount(){
  const form=document.querySelector('#f1176find form');if(!form||document.getElementById('coatesfwf1211'))return;
  const b=document.createElement('button');b.type='button';b.id='coatesfwf1211';b.className='btn';b.textContent='Coates FWF';b.title='Show recorded Coates FWF locations and asset numbers';
  b.onclick=()=>{const q=document.getElementById('f1176q');if(q){q.value='Coates FWF';q.dispatchEvent(new Event('input',{bubbles:true}));}};form.after(b);
 }
 W.MapDemob1211=Object.freeze({version:'v12.11',reference:key=>holdAssets(()=>reference(key)),coatesFWF:()=>holdAssets(coatesFWF),validate:rows=>holdAssets(()=>validate(rows)),company,mount});
 const old=W.renderMap;if(typeof old==='function')W.renderMap=function(){const r=old.apply(this,arguments);mount();setTimeout(mount,120);setTimeout(mount,900);return r;};
 mount();setTimeout(mount,1200);
})(window);
