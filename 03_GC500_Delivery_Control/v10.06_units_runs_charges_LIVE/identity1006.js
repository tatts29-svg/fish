/* Author: Andrew Fisher. One number per reference; removal keeps the identity and photo history. */
const feedback1006=new Map();
function feedbackText1006(ref){
 const f=feedback1006.get(ref);if(!f)return '';
 if(f.kept===false)return 'Not saved yet · keep this page open.';
 const id=typeof docIdOf==='function'?docIdOf(f.key):f.key,body=S.loads&&S.loads[f.key],current=body&&JSON.stringify(Object.assign({},body,{_k:f.key}));
 const shared=SYNC.on&&SYNC.last&&SYNC.last.loads&&SYNC.last.loads[id]===current&&!(SYNC.inflight&&SYNC.inflight['loads/'+id])&&!(SYNC.queue&&SYNC.queue.loads&&Object.hasOwn(SYNC.queue.loads,id))&&(typeof syncWaiting!=='function'||syncWaiting()===0);
 return shared?'SAVED · shared record updated':SYNC.on?'Saved on this device · syncing…':'Saved on this device';
}
function feedbackDraw1006(){
 if(typeof document==='undefined')return;
 document.querySelectorAll('[data-units925]').forEach(panel=>{const msg=panel.querySelector('.units925-save-status'),f=feedback1006.get(panel.dataset.units925);if(!msg||!f)return;const text=feedbackText1006(panel.dataset.units925),forms=[...panel.querySelectorAll('[data-unit925-form]')],form=forms.find(el=>el.dataset.doc===f.key&&el.closest('details')?.open)||forms.find(el=>el.dataset.new1006==='true'&&el.closest('details')?.open),result=form&&form.querySelector('[data-unit925-result]');msg.textContent=result?'':text;if(result){result.textContent=text;result.dataset.feedback1006='true';}msg.dataset.saved1006=f.kept===false?'failed':text.startsWith('SAVED')?'shared':'local';});
}
function clearAddedForm1006(ref){if(typeof document==='undefined')return;document.querySelectorAll('[data-unit925-form][data-new1006="true"]').forEach(f=>{if(f.dataset.ref===ref){f.elements.assetNo.value='';f.elements.label.value='';}});}
function fleet1006(value){return trim(value).replace(/\s+/g,'').toUpperCase();}
function duplicate1006(no,rows,skip){
 const number=fleet1006(no);if(!number)return null;
 return (rows||[]).find(r=>r.source!=='history'&&r.active!==false&&fleet1006(r.assetNo)===number&&!(skip&&((skip.docKey&&r.docKey===skip.docKey)||(skip.sourceKey&&r.sourceKey===skip.sourceKey))));
}
function elsewhere1006(ref,no,owner){
 if(!fleet1006(no)||typeof allAssets!=='function')return null;
 for(const a of allAssets()){
  if(a.key===ref||a._cancelled||movedAway(a.key))continue;
  const u=gcModel925(a,{loading:false}).rows.find(r=>r.source!=='history'&&r.active!==false&&r.owner===owner&&fleet1006(r.assetNo)===fleet1006(no));
  if(u)return {ref:a.key,unit:u};
 }
 return null;
}
function defaultOwner1006(a,item){
 const whole=typeof subhireCo==='function'&&subhireCo(a.key);if(whole)return owner925(whole);
 const qs=typeof quantitySubhire964List==='function'?quantitySubhire964List().rows||[]:[];
 const owners=[...new Set(qs.filter(r=>r.ref===a.key&&r.item===item).map(r=>owner925(r.owner)).concat(gcModel925(a,{loading:false}).rows.filter(r=>r.source!=='history'&&r.active!==false&&r.item===item&&r.owner!=='coates'&&r.owner!=='unknown').map(r=>r.owner)))];
 if(owners.length===1)return owners[0];
 if(typeof epLine909==='function'&&epLine909(a,item))return 'event-portables';
 return 'coates';
}
function tidyIdentity1006(a,body){
 const inside=body.querySelector('[data-f816="contents"]'),units=inside&&inside.querySelector('#unitsFold');
 if(units){units.querySelectorAll('.loading872').forEach(el=>units.before(el));units.remove();}
 const panel=body.querySelector('[data-units925]');
 if(panel){const title=panel.querySelector('.units925-title h3');if(title)title.textContent='Assets at this location';}
 feedbackDraw1006();
}
function rowToken1006(u){return JSON.stringify([u.id,u.assetNo,u.owner,u.item,u.sourceKey||'',u.sourceToken||'',u.metadata||null]);}
function mutable1006(u){return !!u&&u.source!=='restraint'&&!/^vms:/.test(u.nativeId||'');}
function remove1006(ref,id,expected){
 if(!mayWrite('unit number'))return {ok:false,reason:'This link cannot edit numbers.'};
 const who=whoAmI();if(!who)return {ok:false,reason:'Choose the name recording this change.'};
 const a=assetOf(ref),u=a&&gcModel925(a,{loading:false}).rows.find(r=>r.id===id&&r.source!=='history');
 if(!mutable1006(u)||rowToken1006(u)!==expected)return {ok:false,reason:'This item changed. Reopen it before removing the number.'};
 const prior=u.metadata||{},uuid=prior.uuid||crypto.randomUUID(),key=prior.docKey||prefix+uuid;
 const next=Object.assign({},prior,{kind,uuid,ref,owner:u.owner,assetNo:u.assetNo,item:u.item,label:u.label,branch:u.branch||'',nativeId:u.nativeId||'',transportId:u.id,sourceKey:u.sourceKey||'',sourceSnapshot:u.sourceToken||'',suppressNative1006:u.source==='native',active:false,removedBy:who,removedAt:new Date().toISOString(),by:who,at:new Date().toISOString()});delete next.docKey;
 S.loads=S.loads||{};S.loads[key]=next;stampIt('loads',key,who);
 // Existing native removal keys stop an older phone or source extract bringing the number back.
 if(u.source==='native'){
  const matches=x=>u.assetNo?fleet1006(x.asset_no)===fleet1006(u.assetNo):trim(x.label)===trim(u.raw&&u.raw.label);
  if(typeof unitsLocal==='function'&&unitsLocal(ref).some(matches)){unitsSet(ref,unitsLocal(ref).filter(x=>!matches(x)));stampIt('units',ref,who);}
  if(u.raw&&typeof unitTombId==='function')tomb(unitTombId(ref,u.raw),who);
  if(u.assetNo&&typeof assetNumbersOf==='function'&&assetNumbersOf(a).some(n=>fleet1006(n)===fleet1006(u.assetNo)))numberTakeOff(ref,u.assetNo,who);
 }
 feedback1006.set(ref,{key,kept:true});bump();feedback1006.get(ref).kept=bump.kept!==false;feedbackDraw1006();return {ok:true,key,kept:bump.kept!==false,reason:bump.kept===false?'Not saved yet · keep this page open.':'Number removed. Photos and history kept.'};
}
function restore1006(ref,key,expected){
 if(!mayWrite('unit number'))return {ok:false,reason:'This link cannot edit numbers.'};
 const who=whoAmI();if(!who)return {ok:false,reason:'Choose the name recording this change.'};
 const d=S.loads&&S.loads[key],a=assetOf(ref);
 if(!a||a._cancelled||movedAway(ref)||!d||d.kind!==kind||d.ref!==ref||d.active!==false||token925(d)!==expected)return {ok:false,reason:'This item changed. Reopen its history before restoring.'};
 const clash=duplicate1006(d.assetNo,gcModel925(a,{loading:false}).rows);
 if(clash)return {ok:false,reason:d.assetNo+' is already recorded at '+ref+'. Open that item instead.'};
 const other=elsewhere1006(ref,d.assetNo,d.owner);if(other)return {ok:false,reason:d.assetNo+' is already recorded at '+other.ref+'. Move the existing item first.'};
 const next=Object.assign({},d,{sourceKey:'',sourceSnapshot:'',suppressNative1006:false,active:true,restoredBy:who,restoredAt:new Date().toISOString(),by:who,at:new Date().toISOString()});
 S.loads[key]=next;stampIt('loads',key,who);feedback1006.set(ref,{key,kept:true});bump();feedback1006.get(ref).kept=bump.kept!==false;feedbackDraw1006();return {ok:true,key,kept:bump.kept!==false,reason:bump.kept===false?'Not saved yet · keep this page open.':'Number restored.'};
}
function actions1006(a,u){
 if(SYNC.readonly||!mutable1006(u))return '';
 if(u.source==='history')return u.metadata&&u.metadata.active===false?'<button type="button" class="btn" data-identity1006-restore="'+esc925(u.metadata.docKey)+'" data-ref="'+esc925(a.key)+'" data-expected="'+esc925(token925(Object.fromEntries(Object.entries(u.metadata).filter(([k])=>k!=='docKey'))))+'">Restore number</button>':'';
 return '<button type="button" class="btn" data-identity1006-remove="'+esc925(u.id)+'" data-ref="'+esc925(a.key)+'" data-expected="'+esc925(rowToken1006(u))+'">Remove number</button>';
}
function form925(a,u){
 const existing=u&&u.metadata,source=u&&u.source==='native'?u:null,item=u?u.item:selected.get(a.key)||chargeLines(a)[0]?.item||'',owner=u?u.owner:defaultOwner1006(a,item);
 const companies=[...new Set(['coates','event-portables','prem-air-hire',owner].concat(subCompanies().map(owner925)))].filter(c=>!Ownership944.unspecified(c));
 return '<form class="units925-form" data-unit925-form data-ref="'+esc925(a.key)+'" data-new1006="'+(!u)+'" data-doc="'+esc925(existing&&existing.docKey||'')+'" data-expected="'+esc925(token925(existing?Object.fromEntries(Object.entries(existing).filter(([k])=>k!=='docKey')):null))+'" data-source="'+esc925(source&&source.sourceKey||'')+'" data-source-token="'+esc925(source?source.sourceToken:'')+'"><div class="units925-fields"><label>Description<select name="item">'+descriptionItems925(chargeLines(a).map(l=>l.item),u).map(i=>'<option'+(item===i?' selected':'')+'>'+esc925(i)+'</option>').join('')+'</select></label><label>Owning company<select name="owner">'+companies.map(c=>'<option value="'+esc925(c)+'"'+(owner===c?' selected':'')+'>'+esc925(company925(c))+'</option>').join('')+'</select></label><label>Asset / fleet number<input name="assetNo" value="'+esc925(u&&u.assetNo||'')+'" maxlength="24" autocomplete="off"></label></div><button type="submit" class="btn primary">'+(u?'Save changes':'Save number')+'</button><p class="units925-result" data-unit925-result role="status"></p><details class="units925-edit"><summary>More details</summary><div class="units925-fields"><label>Name on site<input name="label" value="'+esc925(u&&u.label||'')+'" maxlength="120"></label><label>Costing branch<input name="branch" value="'+esc925(u&&u.branch||'')+'" maxlength="16"></label><label>Note<input name="note" value="'+esc925(u&&u.note||'')+'" maxlength="300"></label></div></details></form>';
}
function installIdentity1006(){
 const beforeFooter=syncFooter;syncFooter=function(){const result=beforeFooter.apply(this,arguments);feedbackDraw1006();return result;};
 document.addEventListener('input',e=>{const f=e.target.closest&&e.target.closest('[data-unit925-form]');if(!f)return;feedback1006.delete(f.dataset.ref);const panel=f.closest('[data-units925]');panel?.querySelectorAll('.units925-save-status,[data-feedback1006]').forEach(el=>{el.textContent='';});});
 const beforeSub=subhire744Check;subhire744Check=function(ref,co,no){const a=assetOf(ref),clash=a&&duplicate1006(no,gcModel925(a,{loading:false}).rows),other=elsewhere1006(ref,no,owner925(co));return clash?{err:trim(no)+' is already recorded at '+ref+'. Open that item instead.'}:other?{err:trim(no)+' is already recorded at '+other.ref+'. Move the existing item first.'}:beforeSub.apply(this,arguments);};
 const beforeUnit=unitAdd;unitAdd=function(ref,value){const a=assetOf(ref),rows=a&&gcModel925(a,{loading:false}).rows||[],clash=duplicate1006(value.asset_no,rows),match=/^sub[- ]?hire\s*:\s*(.+?)(?:\s*·\s*unit\s+\d+)?$/i.exec(trim(value.label)),owner=owner925(match?match[1]:'Coates');if(clash){if(clash.source!=='native'||owner!==clash.owner){flash(trim(value.asset_no)+' is already recorded at '+ref+'. Edit that item instead.');return false;}value={...value,asset_no:clash.assetNo};}const other=elsewhere1006(ref,value.asset_no,owner);if(other){flash(trim(value.asset_no)+' is already recorded at '+other.ref+'. Move the existing item first.');return false;}return beforeUnit.call(this,ref,value);};
 const beforeNumber=numberPutOn;numberPutOn=function(ref,no,who){const a=assetOf(ref),clash=a&&duplicate1006(no,gcModel925(a,{loading:false}).rows);if(clash){flash(trim(no)+' is already recorded at '+ref+'. Open that item instead.');return false;}return beforeNumber.apply(this,arguments);};
 document.addEventListener('change',e=>{const f=e.target.closest&&e.target.closest('[data-unit925-form]');if(!f||f.dataset.new1006!=='true')return;if(e.target.name==='owner')f.dataset.ownerChosen1006='true';if(e.target.name==='item'&&!f.dataset.ownerChosen1006){const a=assetOf(f.dataset.ref),owner=defaultOwner1006(a,e.target.value);f.elements.owner.value=owner;}});
 document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-identity1006-remove],[data-identity1006-restore]');if(!b)return;e.preventDefault();if(!mayWrite('unit number'))return;const ref=b.dataset.ref,restore=b.hasAttribute('data-identity1006-restore');if(!restore&&!window.confirm('Remove this number? Photos and work history stay saved. The received quantity stays unchanged.'))return;const r=restore?restore1006(ref,b.dataset.identity1006Restore,b.dataset.expected):remove1006(ref,b.dataset.identity1006Remove,b.dataset.expected);flash(r.reason);if(r.ok&&assetOf(ref))openAsset(ref);});
}
