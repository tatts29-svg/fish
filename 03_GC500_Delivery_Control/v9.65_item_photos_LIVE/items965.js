/* Author: Andrew Fisher. Item-group photographs are associations, never fleet identities. */
const ItemPhotos965 = (() => {
 'use strict';
 const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const token=(ref,item)=>JSON.stringify(['quantity-item965',ref,item]);
 function parse(id){try{const p=JSON.parse(id);return Array.isArray(p)&&p.length===3&&p[0]==='quantity-item965'&&p.slice(1).every(x=>typeof x==='string'&&x)?{ref:p[1],item:p[2]}:null;}catch(_){return null;}}
 function known(a,item){return a.key==='WC09'&&item==='Pee Panel'||a.product==='WFB'&&a.discipline==='Water-filled barriers'&&item==='TL2'||a.product==='Trakmat'&&a.discipline==='Ground protection'&&item==='Trakmat';}
 function catalogue(a,u){return a.product==='Trakmat'&&u.item==='Trakmat'&&u.owner==='coates'&&u.assetNo==='TRAKMAT2.4X1.1'&&!u.nativeId;}
 function group(a,item,model){
  if(!a||!known(a,item))return null;
  model=model||gcModel925(a);const matches=model.groups.filter(g=>g.item===item);
  if(matches.length!==1)return null;const g=matches[0],qty=g.quantity;
  if(!Number.isInteger(qty)||qty<=0||g.units.some(u=>u.physical&&!catalogue(a,u)))return null;
  const old=g.units.filter(u=>u.physical&&catalogue(a,u));
  if(old.length>1)return null;
  const aliases=[token(a.key,item)];old.forEach(u=>{if(u.id)aliases.push(u.id);if(u.assetNo&&model.rows.filter(r=>r.assetNo===u.assetNo).length===1)aliases.push(u.assetNo);});
  const q=a.key==='WC09'&&item==='Pee Panel'?quantitySubhire964Read(a.key,item):null;
  const own=q&&q.valid?q.row:null;
  // Supplier classification is explicit per item. A whole-reference flag is safe only for a single item group.
  const sub=!q&&model.groups.length===1&&typeof subOf==='function'?subOf(a.key):[];
  const owners=[...new Set(sub.map(s=>Units925.owner(s.co)))];
  const owner=own?own.owner:q?'unknown':owners.length===1?owners[0]:owners.length?'unknown':'coates';
  const receipt=q?toiletItem962(a,item,deliveryAsOf(a.key,todayIso()),todayIso()):null;
  const supply=typeof itemRows==='function'?itemRows(a).filter(r=>r.asked===item&&r.qty_supplied!=null):[];
  const supplied=supply.length===1&&Number.isInteger(Number(supply[0].qty_supplied))&&Number(supply[0].qty_supplied)>=0?Number(supply[0].qty_supplied):null;
  const received=receipt?receipt.arrived:supplied,installed=receipt?receipt.done:null;
  const active=!a._cancelled&&!a.relocation&&!a.rest_of&&!a._movedTo&&!a._locationMoved&&!movedAway(a.key);
  return {ref:a.key,item,id:token(a.key,item),quantity:qty,owner,company:own?own.company:Units925.company(owner),aliases:[...new Set(aliases)],received,installed,active,ownershipToken:q?quantitySubhire964Token(a.key,item):JSON.stringify(sub||null),source:own?own.source:'',reason:q&&!q.valid?q.reason:''};
 }
 function read(ref,id){const p=parse(id);if(!p||p.ref!==ref||token(p.ref,p.item)!==id)return null;return holdAssets(()=>{const a=assetOf(ref);return a?group(a,p.item):null;});}
 function signature(g){return JSON.stringify([g.id,g.quantity,g.owner,g.aliases,g.active,g.ownershipToken]);}
 function photos(g,all){const aliases=new Set(g.aliases);return all.filter(p=>aliases.has(String(p.unit||'')));}
 function assigned(a,model,all){return model.groups.flatMap(g=>{const x=group(a,g.item,model);return x?photos(x,all):[];});}
 function pending(ref){return typeof PHOTO_OUTBOX!=='undefined'?[...PHOTO_OUTBOX.values()].filter(p=>p.key===ref):[];}
 function firstFree(g,all,queued,max){const used=new Set(photos(g,all.concat(queued||[])).filter(p=>Number.isInteger(p.slot)&&p.slot>=0&&p.slot<max).map(p=>p.slot));for(let i=0;i<max;i++)if(!used.has(i))return i;return -1;}
 function guard(ref,id,slot,expected,replace){
  const g=read(ref,id);if(!g||!g.active||signature(g)!==expected)return 'This item changed. Reopen its card before adding a photo.';
  if(!Number.isInteger(slot)||slot<0||slot>=DROP_MAX)return 'That photo place is not available.';
  if(replace){if(slot!==replace.slot)return 'That photo place changed.';const ph=photos(g,dropPhotosOf(ref)).find(p=>p.id===replace.id&&String(p.unit||'')===replace.unit&&p.slot===replace.slot);return ph?'':'That photo changed. Reopen its card before replacing it.';}
  return firstFree(g,dropPhotosOf(ref),pending(ref),DROP_MAX)===slot?'':'That photo place is now in use. Choose Add photo again.';
 }
 function ownerHtml(g){const sub=g.owner!=='coates'&&g.owner!=='unknown';return '<span class="item933-owner'+(sub?' sub':'')+'">'+esc((sub?'SUB-HIRED — ':'')+g.company)+'</span>';}
 function status(g){return [g.quantity+' planned',g.received==null?'':g.received+' received',g.installed==null?'':g.installed+' installed'].filter(Boolean).join(' · ');}
 const noteKey=(ref,item)=>'item-note965/'+encodeURIComponent(ref)+'/'+encodeURIComponent(item);
 function noteToken(ref,item){return JSON.stringify((S.loads||{})[noteKey(ref,item)]||null);}
 function noteRead(ref,item){const r=(S.loads||{})[noteKey(ref,item)];return r&&r.kind==='item-note965'&&r.schema===1&&r.ref===ref&&r.item===item&&typeof r.note==='string'&&r.note.length<=1000?r:null;}
 function noteSave(ref,id,value,expected,scope){
  if(SYNC.readonly||!mayWrite('item site note'))return {ok:false,reason:'This link can view item details but cannot edit them.'};
  const who=whoAmI();if(!who)return {ok:false,reason:'Choose the name recording this change.'};
  const g=read(ref,id);if(!g||!g.active||signature(g)!==scope)return {ok:false,reason:'This item changed. Reopen its details before saving.'};
  if(noteToken(ref,g.item)!==expected)return {ok:false,reason:'This note changed on another device. Reopen its details before saving.'};
  if((S.loads||{})[noteKey(ref,g.item)]&&!noteRead(ref,g.item))return {ok:false,reason:'This item note record needs review before it can be changed.'};
  if(typeof value!=='string'||value.length>1000)return {ok:false,reason:'Keep the site note to 1,000 characters.'};
  const note=value.trim(),previous=noteRead(ref,g.item);
  if((previous?.note||'')===note)return {ok:true,kept:true,unchanged:true,reason:'No change to the item note.'};
  const key=noteKey(ref,g.item);S.loads=S.loads||{};S.loads[key]={kind:'item-note965',schema:1,ref,item:g.item,note,by:who,at:new Date().toISOString()};stampIt('loads',key,who);bump();
  const kept=bump.kept!==false;return {ok:true,kept,key,reason:kept?'Item note saved.':'Item note is on this device; check the page save warning.'};
 }
 function noteHtml(g){const r=noteRead(g.ref,g.item);return !SYNC.readonly&&g.active?'<form class="units925-form" data-item965-note data-item965-ref="'+esc(g.ref)+'" data-item965-note-key="'+esc(g.id)+'" data-item965-sig="'+esc(signature(g))+'" data-item965-expected="'+esc(noteToken(g.ref,g.item))+'"><div class="units925-fields"><label>Site note (optional)<textarea name="note" maxlength="1000" rows="3">'+esc(r?.note||'')+'</textarea></label></div><button type="submit" class="btn primary">Save item note</button><p class="units925-result" data-item965-result role="status"></p></form>':r?.note?'<dl><div><dt>Site note</dt><dd>'+esc(r.note)+'</dd></div></dl>':'';}
 function input(g,ph){return '<input type="file" accept="image/jpeg,image/png,image/webp" data-item965-add="'+esc(g.id)+'" data-item965-ref="'+esc(g.ref)+'" data-item965-sig="'+esc(signature(g))+'"'+(ph?' data-item965-replace="'+esc(ph.id)+'" data-item965-home="'+esc(String(ph.unit||''))+'" data-item965-slot="'+esc(ph.slot)+'"':'')+'>';}
 function photoHtml(g,p){const r=photoFor(p);return '<figure>'+(r.state==='ready'?'<a href="'+esc(r.url)+'" target="_blank" rel="noopener"><img src="'+esc(r.thumb||r.url)+'" alt="'+esc(g.item+' at '+g.ref)+'" loading="lazy"></a>':'<p class="units925-note">Photo unavailable · '+esc(p.id)+'</p>')+'<figcaption>'+esc(p.caption||(DROP_SLOTS[p.slot]||{}).lab||'Photo')+'</figcaption>'+(!SYNC.readonly?'<div class="item933-photo-tools">'+(g.active&&Number.isInteger(p.slot)&&p.slot>=0&&p.slot<DROP_MAX?'<label class="btn item933-add">Replace'+input(g,p)+'</label>':'')+'<button type="button" class="btn" data-item933-remove="'+esc(p.id)+'" data-item933-remove-home="'+esc(String(p.unit||''))+'" data-item933-remove-slot="'+esc(p.slot)+'" data-item933-ref="'+esc(g.ref)+'">Remove link</button></div>':'')+'</figure>';}
 function card(a,g){const pp=photos(g,dropPhotosOf(a.key)),full=firstFree(g,dropPhotosOf(a.key),pending(a.key),DROP_MAX)<0;return '<article class="units925-unit item933-card" data-item965-key="'+esc(g.id)+'"><div class="item933-head"><div><h4>'+esc(g.item)+'</h4><b class="item933-number">Quantity '+g.quantity+'</b><small>No fleet numbers</small></div>'+ownerHtml(g)+'</div><p class="units925-note">'+esc(status(g))+'</p><div class="item933-actions">'+(!SYNC.readonly&&g.active&&!full?'<label class="btn primary item933-add">Add photo'+input(g)+'</label>':'')+'<button type="button" class="btn" data-ro data-item965-view aria-expanded="false">'+(full?'Manage':'View')+' photos · '+pp.length+'</button></div><div class="item933-gallery" hidden>'+(pp.length?'<div class="units925-photos">'+pp.map(p=>photoHtml(g,p)).join('')+'</div>':'<p class="units925-note">No photos assigned.</p>')+'</div><p class="item933-status units925-note" role="status"></p><details class="units925-edit"><summary>Item details</summary><div class="units925-body"><dl><div><dt>Reference</dt><dd>'+esc(g.ref)+'</dd></div><div><dt>Owner</dt><dd>'+esc(g.company)+'</dd></div>'+(g.source?'<div><dt>Source</dt><dd>'+esc(g.source)+'</dd></div>':'')+(g.reason?'<div><dt>Ownership record</dt><dd>'+esc(g.reason)+'</dd></div>':'')+'</dl>'+noteHtml(g)+'</div></details></article>';}
 function selection(a,g,model){
  const q=group(a,g.item,model);if(q)return {item:g.item,quantity:g.quantity,html:ownerHtml(q)};
  const rows=g.units.filter(u=>u.physical),by=new Map();rows.forEach(u=>{let r=by.get(u.owner);if(!r){r={owner:u.owner,company:Units925.company(u.owner),numbers:[]};by.set(u.owner,r);}if(u.assetNo)r.numbers.push(u.assetNo);});
  return {item:g.item,quantity:g.quantity,html:[...by.values()].map(r=>ownerHtml(r)+(r.numbers.length?' · '+esc([...new Set(r.numbers)].join(', ')):'' )).join(' · ')};
 }
 function header(a,body){const selector=body.querySelector('[data-unit925-description]');if(!selector)return;const model=gcModel925(a),g=model.groups.find(r=>r.item===selector.value);if(!g)return;const x=selection(a,g,model),drawer=body.closest('#drawer'),title=drawer&&drawer.querySelector('.nm816 .nmx816'),line=drawer&&drawer.querySelector('.nm816 .kl816');if(title)title.textContent=x.item+(x.quantity==null?'':' · '+x.quantity+' planned');if(line)line.innerHTML=x.html;}
 function scope(a){const x=toiletRows962(a,deliveryAsOf(a.key,todayIso()),chargeLines(a),todayIso());return x?'<details class="units925-edit" data-toilet962-scope><summary>Location total · '+esc(x.status)+'</summary><p class="units925-note">'+esc(x.detail)+'</p></details>':'';}
 const api={token,parse,known,catalogue,group,read,signature,photos,assigned,pending,firstFree,guard,status,noteKey,noteToken,noteRead,noteSave,noteHtml,card,selection,header,scope};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof document==='undefined')return api;
 document.addEventListener('submit',e=>{const f=e.target.closest&&e.target.closest('form[data-item965-note]');if(!f)return;e.preventDefault();const result=noteSave(f.dataset.item965Ref,f.dataset.item965NoteKey,new FormData(f).get('note'),f.dataset.item965Expected,f.dataset.item965Sig),out=f.querySelector('[data-item965-result]');if(out)out.textContent=result.reason;if(result.ok){const p=parse(f.dataset.item965NoteKey);f.dataset.item965Expected=noteToken(p.ref,p.item);}});
 document.addEventListener('click',e=>{const view=e.target.closest&&e.target.closest('[data-item965-view]');if(!view)return;const card=view.closest('[data-item965-key]'),gallery=card&&card.querySelector('.item933-gallery');if(!gallery)return;gallery.hidden=!gallery.hidden;view.setAttribute('aria-expanded',String(!gallery.hidden));});
 document.addEventListener('change',async e=>{
  const input=e.target.closest&&e.target.closest('input[data-item965-add]');if(!input)return;const file=input.files&&input.files[0];if(!file)return;
  const ref=input.dataset.item965Ref,id=input.dataset.item965Add,expected=input.dataset.item965Sig;
  const tell=msg=>{const card=[...document.querySelectorAll('[data-item965-key]')].find(n=>n.dataset.item965Key===id),out=card&&card.querySelector('.item933-status');if(out)out.textContent=msg;else flash(msg);};
  if(!mayWrite('photograph'))return;const actor=whoAmI();if(!actor)return;const g=read(ref,id);if(!g)return tell('Reopen this item before adding a photo.');
  const replace=input.dataset.item965Replace?{id:input.dataset.item965Replace,unit:input.dataset.item965Home,slot:Number(input.dataset.item965Slot)}:null;
  const slot=replace?replace.slot:firstFree(g,dropPhotosOf(ref),pending(ref),DROP_MAX);if(slot<0)return tell('All photo places are filled. Choose a photo to replace.');
  const error=guard(ref,id,slot,expected,replace);if(error)return tell(error);
  try{await dropPhotoAdd(ref,slot,file,tell,replace?replace.unit:id,{unitId:id,expected,replace,actor,quantityOnly:true});}catch(_){tell('The photo could not be added. Please try again.');}finally{input.value='';}
 });
 return api;
})();
