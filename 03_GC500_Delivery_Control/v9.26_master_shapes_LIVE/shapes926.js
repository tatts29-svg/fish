/* Author: Andrew Fisher. Current physical units beside sourced master-plan shapes.
   Drawing evidence is not transport dimensions, inventory or a loading-side default. */
(function () {
 'use strict';
 const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const choices = ['', 'driver', 'passenger', 'na'];
 const words = side => ({driver:'Door to driver side',passenger:'Door to passenger side',na:'Door side not applicable'})[side] || 'Door side to confirm';
 function kind(item) {
  const t=String(item||'').toLowerCase();
  if (/waste|sewage|sewer/.test(t)&&/tank/.test(t)) return 'waste_tank';
  if (/distribution|lifeguard/.test(t)) return 'distribution_board';
  if (/water.*barrier|waterfilled/.test(t)) return 'water_barrier';
  if (/pee.*panel|urinal/.test(t)) return 'pee_panel';
  if (/disabled|accessible/.test(t)&&/toilet|wc/.test(t)) return 'accessible_toilet';
  if (/toilet.*block|pan.*block|ablution/.test(t)) return 'toilet_block';
  if (/fwf.*trailer|toilet.*trailer/.test(t)) return 'fwf_trailer';
  if (/fwf|toilet|portaloo/.test(t)) return 'toilet';
  if (/light.*tower|lighting|metro.*led/.test(t)) return 'light_tower';
  if (/vms|message.*sign/.test(t)) return 'vms_board';
  if (/generator|kva/.test(t)) return 'generator';
  if (/forklift/.test(t)) return 'forklift';
  if (/trakmat|track.*mat/.test(t)) return 'trakmat';
  if (/container|\bcont\b/.test(t)) return 'container';
  if (/building|ticket.*box|office|lunch.*room/.test(t)) return 'building';
  return 'equipment';
 }
 function evidence(ref, unit, api) {
  const sh=api.shape(ref), k=kind(unit.item||unit.label), all=sh ? sh.components : [];
  const indices=all.map((c,i)=>({c,i})).filter(x=>x.c.kind===k);
  const traced=indices.filter(x=>x.c.source==='master'&&!x.c.drawn_as);
  const candidates=traced.length?traced:indices;
  // A ref tag cannot bind a numbered asset to one of several identical outlines.
  const exact=candidates.length===1&&candidates[0].c.source==='master'&&!candidates[0].c.drawn_as;
  const selected=exact?candidates:candidates.slice(0,1);
  const components=selected.map(x=>x.i), c=selected[0]&&selected[0].c;
  return {kind:k,components,exact,ambiguous:traced.length>1||!!(c&&c.drawn_as),
   door:exact?'master':'none', source:c?c.source:'No footprint source',
   note:exact?'Master-plan outline':c&&c.kind==='waste_tank'?'Waste tank · under toilet block':
    c&&c.standard?(c.confirm?'Indicative footprint · size to confirm':'Catalogue footprint · position to confirm'):
    c?'Reference shape · unit position to confirm':'Shape and size to confirm'};
 }
 function nativeEnv() {
  return {asset:ref=>assetOf(ref), units:a=>typeof gcUnits925==='function'?gcUnits925(a):[],
   rows:a=>loading872Rows(a),side:(a,id)=>loading872Side(a,id),set:(ref,id,side)=>loading872Set(ref,id,side),
   kept:()=>bump.kept!==false,can:()=>capability()==='edit'&&!SYNC.readonly,
   shapes:typeof MasterShapes926!=='undefined'?MasterShapes926:null};
 }
 function unitModel(a,env) {
  if (!a) return [];
  const seen=new Set(), rows=env.rows(a)||[];
  const physical=(env.units(a)||[]).filter(u=>u&&u.physical===true&&typeof u.id==='string'&&u.id&&!seen.has(u.id)&&seen.add(u.id));
  return physical.map(u=>{
   // Only the adapter's exact native loading row is editable. No index or item-row guessing.
   const uniqueLoading=u.loadingId&&physical.filter(p=>p.loadingId===u.loadingId).length===1;
   const row=kind(u.item||u.label)!=='waste_tank'&&uniqueLoading&&u.assetNo&&rows.find(r=>r.id===u.loadingId&&r.no&&String(r.no)===String(u.assetNo));
   const drawing=evidence(a.key,u,env.shapes);
   if(drawing.exact&&physical.filter(p=>kind(p.item||p.label)===drawing.kind).length>1){drawing.exact=false;drawing.ambiguous=true;drawing.door='none';drawing.note='Reference shape · unit position to confirm';}
   return Object.assign({},u,{ref:a.key,loadingId:row?row.id:null,side:row?env.side(a,row.id):'',evidence:drawing});
  });
 }
 function saveDoor(ref,id,value,expectedSide,env) {
  env=env||nativeEnv();
  if (!choices.includes(value)) return {accepted:false,kept:false,reason:'Choose a loading side from the list.'};
  const a=env.asset(ref),u=a&&unitModel(a,env).find(x=>x.id===id);
  if (!a||a._cancelled||!u||!u.loadingId) return {accepted:false,kept:false,reason:'This unit changed. Reopen the load before choosing its loading side.'};
  if (!env.can()) return {accepted:false,kept:false,reason:'Open the edit page to change the loading side.'};
  if (u.side!==expectedSide) return {accepted:false,kept:false,reason:'The loading side changed. Reopen the load to see the latest choice.'};
  if (u.side===value) {const kept=env.kept();return {accepted:true,kept,unchanged:true,reason:kept?'':'The loading side is not saved yet. Check the unsaved notice and keep this page open.'};}
  let accepted=false;
  try { accepted=env.set(ref,u.loadingId,value)===true; } catch (_) {}
  const kept=accepted&&env.kept();
  return {accepted,kept,reason:kept?'':'The loading side is not saved yet. Check the unsaved notice and keep this page open.'};
 }
 function unknownSvg(k) {
  return '<svg class="shape926-unknown" viewBox="0 0 90 70" role="img" aria-label="'+esc(k.replace(/_/g,' '))+' · shape and size to confirm"><rect x="15" y="15" width="60" height="40" rx="5" fill="#203b45" stroke="#a5bdc4" stroke-dasharray="4 4"/><text x="45" y="42" text-anchor="middle" fill="#fff" font-size="22">?</text></svg>';
 }
 function diagram(ref,u,api) {
  const e=u.evidence;
  return e.components.length?api.svg(ref,{components:e.components,door:e.door,minPx:0,sizePx:100})||unknownSvg(e.kind):unknownSvg(e.kind);
 }
 function unitHtml(u,env) {
  const select=u.loadingId?'<label>Truck loading<select data-shape926-door data-shape926-ref="'+esc(u.ref)+'" data-shape926-id="'+esc(u.id)+'" data-shape926-previous="'+esc(u.side)+'" aria-label="Truck loading for '+esc(u.ref+' '+(u.assetNo||u.label||u.item))+'"'+(env.can()?'':' disabled')+'>'+choices.map(v=>'<option value="'+v+'"'+(v===u.side?' selected':'')+'>'+words(v)+'</option>').join('')+'</select></label>':'';
  return '<article class="shape926-unit" data-shape926-unit="'+esc(u.id)+'"><div class="shape926-drawing">'+diagram(u.ref,u,env.shapes)+'</div><div class="shape926-unit-info"><strong>'+esc(u.item||u.label||u.evidence.kind.replace(/_/g,' '))+'</strong><span>'+esc(u.assetNo?'Asset '+u.assetNo:u.label||'Number not recorded')+'</span><small>'+esc(u.evidence.note)+'</small>'+select+'<span class="shape926-feedback" data-shape926-feedback role="status"></span></div></article>';
 }
 function assetsFor(model,load) {
  // Keep booked/split-load assets from the native load, not the whole reference allocation.
  const day=programmeDays().find(d=>d.iso===model.day);
  if(!day)return [];
  const g=dpLoads(day).find(g=>ldId(day,g)===load.id);
  return g?[...new Map(g.rows.map(r=>[r.a.key,r.a])).values()]:[];
 }
 function panel(el,model,selected) {
  if(!el||!model)return;
  let box=el.querySelector('.shapes926');
  if(!box){box=document.createElement('section');box.className='shapes926';box.setAttribute('aria-label','Selected load shapes and loading side');el.appendChild(box);}
  const load=model.loads.find(l=>l.id===selected),env=nativeEnv();
  if(!load||!env.shapes){box.hidden=true;box.__shape926Selection=null;return;}
  box.hidden=false;
  const editable=env.can();
  if(box.__shape926Selection===load.id&&box.__shape926Can===editable)return;
  box.__shape926Selection=load.id;box.__shape926Can=editable;
  const assets=assetsFor(model,load),models=assets.map(a=>({a,units:unitModel(a,env)}));
  const signature=JSON.stringify([load.id,env.can(),models.map(x=>[x.a.key,x.units.map(u=>[u.id,u.item,u.label,u.assetNo,u.loadingId,u.side])])]);
  box.hidden=false;
  if(box.__shape926Signature===signature)return;
  box.__shape926Signature=signature;
  box.innerHTML='<div class="shape926-heading"><b>Shapes &amp; loading side</b><span>Reference layout · red marks are master doors. Choose the truck side separately.</span></div>'+models.map(({a,units})=>{const content='<div class="shape926-units">'+(units.length?units.map(u=>unitHtml(u,env)).join(''):'<p>Physical unit details to confirm.</p>')+'</div>';return '<div class="shape926-reference"><h4>'+esc(a.key)+'</h4>'+(units.length>4?'<details class="shape926-many"><summary>'+units.length+' units · shapes and loading sides</summary>'+content+'</details>':content)+'</div>';}).join('');
 }
 function overlayModels(model,selected,env) {
  const seen=new Set(),records=[],api=env.shapes;
  const ordered=model.loads.slice().sort((a,b)=>(b.id===selected?1:0)-(a.id===selected?1:0));
  for(const load of ordered)for(const ref of load.refs){
   if(!ref.point||ref.source!=='Master-plan unit position')continue;
   const sh=api.shape(ref.key);if(!sh||!sh.placed)continue;
   const asset=env.asset(ref.key),hasTank=asset&&(env.units(asset)||[]).some(u=>u.physical&&kind(u.item||u.label)==='waste_tank');
   const cs=sh.components.map((c,i)=>({c,i})).filter(({c})=>(c.source==='master'||(hasTank&&c.kind==='waste_tank'))&&!c.drawn_as);
   const indices=cs.filter(({c})=>{const key=c.kind+JSON.stringify(c.poly);if(seen.has(key))return false;seen.add(key);return true;}).map(x=>x.i);
   if(indices.length)records.push({ref,load,indices});
  }
  return records;
 }
 function overlay(view,map,model,selected) {
  let layer=view.querySelector('.shape926-overlay');
  if(!layer){layer=document.createElement('div');layer.className='shape926-overlay';layer.setAttribute('aria-hidden','true');view.insertBefore(layer,view.querySelector('.drops911-leaders'));}
  const env=nativeEnv(),api=env.shapes;if(!api){layer.replaceChildren();return;}
  const parts=[];
  if(view.__shape926Model!==model||view.__shape926Selected!==selected){view.__shape926Records=overlayModels(model,selected,env);view.__shape926Model=model;view.__shape926Selected=selected;}
  for(const {ref,load,indices} of view.__shape926Records){
   const o={components:indices,context:true,door:'master',minPx:0,selected:load.id===selected,project:p=>{const q=map.project(p);return q?[q.x,q.y]:[NaN,NaN];}};
   const L=api.layout(ref.key,o);if(!L||!Number.isFinite(L.width)||!Number.isFinite(L.height))continue;
   const at=map.project(L.at);if(!at)continue;
   const left=at.x-L.anchor[0],top=at.y-L.anchor[1];
   if(left+L.width<0||top+L.height<0||left>view.clientWidth||top>view.clientHeight)continue;
   parts.push('<div data-shape926-map-ref="'+esc(ref.key)+'" style="left:'+left+'px;top:'+top+'px">'+api.svg(ref.key,o)+'</div>');
  }
  const html=parts.join('');if(layer.__shape926Html!==html){layer.innerHTML=html;layer.__shape926Html=html;}
 }
 const api=Object.freeze({version:'v9.26',kind,evidence,unitModel,saveDoor,panel,overlay,overlayModels,choices:choices.slice(),words});
 if(typeof window!=='undefined')window.Shapes926=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(typeof document!=='undefined')document.addEventListener('change',event=>{
  const field=event.target.closest('[data-shape926-door]');if(!field)return;
  const ref=field.dataset.shape926Ref,id=field.dataset.shape926Id,result=saveDoor(ref,id,field.value,field.dataset.shape926Previous);
  const current=[...document.querySelectorAll('[data-shape926-door]')].find(e=>e.dataset.shape926Ref===ref&&e.dataset.shape926Id===id)||field;
  const row=current.closest('.shape926-unit'),feedback=row&&row.querySelector('[data-shape926-feedback]');
  if(result.accepted)current.dataset.shape926Previous=current.value;
  else current.value=current.dataset.shape926Previous;
  if(feedback){feedback.textContent=result.kept?'Loading side saved.':result.reason;feedback.classList.toggle('pending',!result.kept);}
  if(!result.kept&&typeof flash==='function')flash(result.reason);
 });
})();
