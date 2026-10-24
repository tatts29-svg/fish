/* Author: Andrew Fisher. One FWF photo area per location; original unit associations stay intact. */
const FwfPhotos1010 = (() => {
 'use strict';
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const isFwf=item=>String(item||'').trim().toUpperCase()==='FWF';
 const token=ref=>JSON.stringify(['location-item1010',ref,'FWF']);
 function parse(id){try{const p=JSON.parse(id);return Array.isArray(p)&&p.length===3&&p[0]==='location-item1010'&&typeof p[1]==='string'&&p[1]&&p[2]==='FWF'&&token(p[1])===id?{ref:p[1],item:'FWF'}:null;}catch(_){return null;}}
 function group(a,model){
  if(!a)return null;model=model||gcModel925(a);const groups=model.groups.filter(g=>isFwf(g.item));if(groups.length!==1)return null;
  const g=groups[0],rows=model.rows.filter(u=>isFwf(u.item));
  return {ref:a.key,id:token(a.key),item:'FWF',quantity:typeof g.quantity==='number'&&Number.isFinite(g.quantity)&&g.quantity>=0?g.quantity:null,
   rows,model,active:!a._cancelled&&!a.relocation&&!a.rest_of&&!a._movedTo&&!a._locationMoved&&!movedAway(a.key)};
 }
 function read(ref,id){const p=parse(id);if(!p||p.ref!==ref)return null;return holdAssets(()=>group(assetOf(ref)));}
 function signature(g){return JSON.stringify([g.id,g.quantity,g.active,g.rows.map(u=>[u.id,u.assetNo,u.owner,u.item,u.source]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))]);}
 function photos(a,model,all){
  const g=group(a,model);if(!g)return [];const found=new Map();
  const add=pp=>pp.forEach(p=>{if(p&&p.id)found.set(String(p.id),p);});
  add(all.filter(p=>String(p.unit||'')===g.id));
  g.rows.forEach(u=>add(Units925.photos(u,model.rows,all)));
  return [...found.values()];
 }
 const pending=ref=>typeof PHOTO_OUTBOX!=='undefined'?[...PHOTO_OUTBOX.values()].filter(p=>p.key===ref):[];
 function firstFree(g,all,queued,max){
  // The shared group has its own slots. Old per-unit photos remain additional, unchanged records.
  const used=new Set(all.concat(queued||[]).filter(p=>String(p.unit||'')===g.id&&Number.isInteger(p.slot)&&p.slot>=0&&p.slot<max).map(p=>p.slot));
  for(let i=0;i<max;i++)if(!used.has(i))return i;return -1;
 }
 function guard(ref,id,slot,expected,replace){
  const g=read(ref,id);if(!g||!g.active||signature(g)!==expected)return 'The FWF details changed. Reopen the location before adding a photo.';
  if(!Number.isInteger(slot)||slot<0||slot>=DROP_MAX)return 'That photo place is not available.';
  const all=dropPhotosOf(ref);
  if(replace){
   if(slot!==replace.slot)return 'That photo place changed.';
   const a=assetOf(ref),ph=photos(a,g.model,all).find(p=>String(p.id)===String(replace.id)&&String(p.unit||'')===replace.unit&&p.slot===replace.slot);
   return ph?'':'That photo changed. Reopen the location photos.';
  }
  return firstFree(g,all,pending(ref),DROP_MAX)===slot?'':'That photo place is now in use. Choose Add photo again.';
 }
 function input(g,ph){return '<input type="file" accept="image/jpeg,image/png,image/webp" data-fwf1010-add="'+esc(g.id)+'" data-fwf1010-ref="'+esc(g.ref)+'" data-fwf1010-sig="'+esc(signature(g))+'"'+(ph?' data-fwf1010-replace="'+esc(ph.id)+'" data-fwf1010-home="'+esc(String(ph.unit||''))+'" data-fwf1010-slot="'+esc(ph.slot)+'"':'')+'>';}
 function photoHtml(g,ph){
  const r=photoFor(ph),caption=ph.caption||(DROP_SLOTS[ph.slot]||{}).lab||'Photo';
  return '<figure data-fwf1010-photo="'+esc(ph.id)+'">'+(r.state==='ready'?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener"><img src="'+esc(r.thumb||r.url)+'" alt="'+esc('FWF at '+g.ref)+'" loading="lazy"></a>':'<p class="units925-note">Photo unavailable · '+esc(ph.id)+'</p>')+
   '<figcaption>'+esc(caption)+(String(ph.unit||'')!==g.id?'<small>'+esc(Items933.friendly(g.ref,String(ph.unit||'')))+'</small>':'')+'</figcaption>'+
   (!SYNC.readonly?'<div class="item933-photo-tools">'+(g.active&&Number.isInteger(ph.slot)&&ph.slot>=0&&ph.slot<DROP_MAX?'<label class="btn item933-add">Replace'+input(g,ph)+'</label>':'')+
    '<button type="button" class="btn" data-item933-remove="'+esc(ph.id)+'" data-item933-remove-home="'+esc(String(ph.unit||''))+'" data-item933-remove-slot="'+esc(ph.slot)+'" data-item933-ref="'+esc(g.ref)+'">Remove link</button></div>':'')+'</figure>';
 }
 function card(a,model){
  const g=group(a,model);if(!g)return '';const all=dropPhotosOf(a.key),pp=photos(a,model,all),queued=pending(a.key).filter(p=>String(p.unit||'')===g.id),full=firstFree(g,all,queued,DROP_MAX)<0;
  const title=(g.quantity==null?'FWF · Qty to confirm':g.quantity+' × FWF')+' · '+g.ref;
  return '<article class="units925-unit item933-card fwf1010-card" data-fwf1010-ref="'+esc(g.ref)+'"><div class="item933-head"><h4>'+esc(title)+' photos</h4></div>'+
   (!SYNC.readonly&&g.active&&!full?'<label class="btn primary item933-add">Add photo'+input(g)+'</label>':'')+
   '<details class="units925-edit fwf1010-gallery"><summary>View photos · '+pp.length+'</summary>'+(pp.length?'<div class="units925-photos">'+pp.map(ph=>photoHtml(g,ph)).join('')+'</div>':'<p class="units925-note">No FWF photos yet.</p>')+'</details>'+
   (queued.length?'<p class="units925-note">'+queued.length+' photo'+(queued.length===1?'':'s')+' waiting for shared confirmation.</p>':'')+
   '<p class="item933-status units925-note" role="status"></p></article>';
 }
 const api={isFwf,token,parse,group,read,signature,photos,firstFree,guard,card};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof document==='undefined')return api;
 document.addEventListener('change',async e=>{
  const field=e.target.closest&&e.target.closest('input[data-fwf1010-add]');if(!field)return;
  const file=field.files&&field.files[0];if(!file)return;const ref=field.dataset.fwf1010Ref,id=field.dataset.fwf1010Add,expected=field.dataset.fwf1010Sig;
  const tell=message=>{const card=[...document.querySelectorAll('[data-fwf1010-ref]')].find(n=>n.tagName==='ARTICLE'&&n.dataset.fwf1010Ref===ref),out=card&&card.querySelector('.item933-status');if(out)out.textContent=message;else flash(message);};
  if(!mayWrite('photograph'))return;const actor=whoAmI();if(!actor)return;const g=read(ref,id);if(!g)return tell('Reopen this location before adding a photo.');
  const replace=field.dataset.fwf1010Replace?{id:field.dataset.fwf1010Replace,unit:field.dataset.fwf1010Home,slot:Number(field.dataset.fwf1010Slot)}:null;
  const slot=replace?replace.slot:firstFree(g,dropPhotosOf(ref),pending(ref),DROP_MAX);if(slot<0)return tell('Open View photos and choose a photo to replace.');
  const reason=guard(ref,id,slot,expected,replace);if(reason)return tell(reason);
  try{await dropPhotoAdd(ref,slot,file,tell,replace?replace.unit:id,{unitId:id,expected,replace,actor,fwfGroup1010:true});}
  catch(_){tell('The photo could not be added. Please try again.');}finally{field.value='';}
 });
 return api;
})();
