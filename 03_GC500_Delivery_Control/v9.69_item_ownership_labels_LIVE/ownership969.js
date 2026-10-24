/* Author: Andrew Fisher. Item ownership labels read existing identities and quantity records only. */
const ItemOwnership969 = (() => {
 'use strict';
 const clean=v=>String(v==null?'':v).trim();
 const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function project(a,rows,quantities,scope){
  if(!a||a._cancelled||a.relocation||a.rest_of||a._movedTo||a._locationMoved)return {active:false,rows:[]};
  scope=scope||{};const types=scope.items?new Set(scope.items):null,numbers=scope.numbers?new Set(scope.numbers.map(String)):null,seen=new Set(),out=[];
  for(const u of rows||[]){
   if(!u||!u.physical||!u.id||u.ref!==a.key||types&&!types.has(u.item)||numbers&&!numbers.has(String(u.assetNo)))continue;
   const id=clean(u.id);if(seen.has(id))continue;seen.add(id);
   const owner=clean(u.owner)||'unknown',number=clean(u.assetNo),label=clean(u.label);
   out.push({item:clean(u.item)||'Equipment',owner,number,label:label&&label!==number&&label!==u.item&&!/^sub[- ]?hire\s*:/i.test(label)?label:'',registration:clean(u.registration),quantity:1,quantityOnly:false});
  }
  for(const q of quantities||[]){
   if(!q||q.ref!==a.key||!q.quantityOnly||!Number.isInteger(q.quantity)||q.quantity<=0||types&&!types.has(q.item)||out.some(u=>u.item===q.item))continue;
   const matches=(quantities||[]).filter(x=>x&&x.ref===q.ref&&x.item===q.item);if(matches.length!==1)continue;
   const count=scope.quantity&&Object.prototype.hasOwnProperty.call(scope.quantity,q.item)?scope.quantity[q.item]:q.quantity;
   if(!Number.isInteger(count)||count<=0||count>q.quantity)continue;
   out.push({item:q.item,owner:clean(q.owner)||'unknown',number:'',label:'',registration:'',quantity:count,quantityOnly:true});
  }
  const groups=[];
  for(const u of out){let g=groups.find(g=>g.item===u.item&&g.owner===u.owner&&g.quantityOnly===u.quantityOnly);if(!g){g={item:u.item,owner:u.owner,quantityOnly:u.quantityOnly,quantity:0,units:[]};groups.push(g);}g.quantity+=u.quantity;g.units.push(u);}
  return {active:groups.some(g=>g.owner!=='unknown'&&(g.quantityOnly||g.owner!=='coates'))||out.some(u=>/^VMS\d+$/i.test(u.label)),rows:groups};
 }
 function read(a){
  if(!a||typeof gcModel925!=='function'||movedAway(a.key))return {active:false,rows:[]};
  const full=assetOf(a.key)||a,booked=Array.isArray(a._bookingNumbers801),split=booked&&(a._bookingSource801?.loads||[]).length>1;
  const scope=booked?{items:a.item_types||[],numbers:split?a._bookingNumbers801:null,quantity:Object.fromEntries(chargeLines(a).map(l=>[l.item,qtyOf(l)]))}:{};
  return heldMemo('ownership969/'+a.key+'/'+JSON.stringify(scope),()=>{
   const model=gcModel925(full,{loading:false}),quantity=heldMemo('ownership969/quantities',()=>quantitySubhire964List().rows).slice();let rows=model.rows;
   if(typeof ItemPhotos965!=='undefined')for(const g of model.groups||[]){
    if(!['WFB','Trakmat'].includes(full.product))continue;
    const q=ItemPhotos965.group(full,g.item,model);if(!q||!q.active||q.owner==='unknown')continue;
    quantity.push({ref:q.ref,item:q.item,owner:q.owner,quantity:q.quantity,quantityOnly:true});
    rows=rows.filter(u=>!ItemPhotos965.catalogue(full,u));
   }
   return project(full,rows,quantity,scope);
  });
 }
 function company(owner){return typeof Units925!=='undefined'?Units925.company(owner):owner;}
 function identity(u){const number=u.number?(u.label?u.label+' · ':'')+'asset '+u.number:u.label||'No fleet number';return number+(u.registration?' · rego '+u.registration:'');}
 function words(g){const owner=(g.owner!=='coates'&&g.owner!=='unknown'?'SUB-HIRED · ':'')+company(g.owner);return owner+' · '+g.item+' · '+(g.quantityOnly?'quantity '+g.quantity+' (no fleet numbers)':g.units.map(identity).join(', '));}
 function text(a){const m=read(a);return m.active?m.rows.map(words).join(' | '):'';}
 function html(a){const m=read(a);return m.active?'<span data-ownership969="'+esc(a.key)+'" style="display:block;max-width:100%;white-space:normal;overflow-wrap:anywhere">'+m.rows.map(g=>'<span class="suppliernos744" style="display:block;max-width:100%;white-space:normal;overflow-wrap:anywhere"><small>'+esc((g.owner!=='coates'&&g.owner!=='unknown'?'SUB-HIRED · ':'')+company(g.owner)+' · '+g.item)+'</small> <b>'+esc(g.quantityOnly?'Quantity '+g.quantity+' · no fleet numbers':g.units.map(identity).join(', '))+'</b></span>').join('')+'</span>':'';}
 const api={project,read,identity,words,text,html};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 return api;
})();
