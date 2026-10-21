/* Author: Andrew Fisher. Read-only physical VMS board projection for Equipment and inventory. */
(function(root){
'use strict';
const list=x=>Array.isArray(x)?x:[], text=x=>String(x==null?'':x), clean=x=>text(x).trim();
const esc=x=>text(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const dayValid=d=>/^\d{4}-\d{2}-\d{2}$/.test(text(d))&&Number.isFinite(Date.parse(d+'T00:00:00Z'))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
const today=()=>typeof todayIso==='function'?todayIso():new Date().toISOString().slice(0,10);
const asDay=d=>dayValid(d)?d:today();
function validEvents(record,day){
 return list(record?.events1098||(record?.arrival1098?[{...record.arrival1098,inPlace:record.inPlace}]:[])).map((e,i)=>({...e,_index:i}))
  .filter(e=>dayValid(e.effective_date)&&e.effective_date<=day&&Number.isFinite(Date.parse(e.recorded_at))&&e.by&&[null,'on site','off site','not confirmed'].includes(e.state))
  .sort((a,b)=>a.effective_date.localeCompare(b.effective_date)||a.recorded_at.localeCompare(b.recorded_at)||(a.sequence1101||0)-(b.sequence1101||0)||a._index-b._index);
}
/* A correction cancels an earlier claimed receipt. A later real collection does not create another order. */
function received(status,day){
 if(status.on)return true;
 const events=validEvents(status.record,day);
 let value=!!status.received;
 for(const e of events){if(e.state==='on site')value=true;else if(e.state==='not confirmed')value=false;}
 if(status.evidence?.state==='not confirmed')return false;
 return value;
}
function project(input,day){
 day=asDay(day);input=input||{};
 const statuses=new Map(list(input.statuses?.boards||input.statuses).map(s=>[text(s.key),s]));
 const identities=input.identities||{},seen=new Set(),boards=[];
 for(const source of list(input.boards)){
  const key=clean(source.key);if(!key||seen.has(key))continue;seen.add(key);
  const status=statuses.get(key)||{},id=identities[key]||{},positions=list(input.positions).filter(p=>text(p.board||p.default_board)===key).map(p=>({...p}));
  const on=!!status.on,done=on&&!!status.done,installed=on&&!!status.installed;
  const evidence=status.evidence||null,recorded=!!(evidence&&evidence.state!==null||status.recorded||on);
  const board={vmsBoard1103:true,key,name:clean(source.name)||key,contract:clean(source.contract),line:source.line??null,
   co:clean(id.co??source.co),fleet:clean(id.fleet??source.asset),rego:clean(id.rego),positions,
   delivery:status.delivery||null,due:status.due||null,phase:status.phase||null,on,installed,done,
   evidence,completion:status.completion||null,recorded,c:on?'green':evidence?.state==='not confirmed'?'none':evidence?.state==='off site'||status.state==='not on site'?'red':status.state==='in transit'?'amber':'none',
   received:received(status,day),asOf:day};
  board.remaining=board.received?0:1;
  board.status=done?'Complete':installed?'Installed · completion not recorded':on?'On site · installation not recorded':board.received?'Off site · received previously':'Still to come';
  boards.push(board);
 }
 boards.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true})||a.key.localeCompare(b.key));
 return {day,boards,total:boards.length,on:boards.filter(b=>b.on).length,received:boards.filter(b=>b.received).length,
  installed:boards.filter(b=>b.installed).length,done:boards.filter(b=>b.done).length,remaining:boards.filter(b=>b.remaining).length,left:boards.filter(b=>!b.done).length};
}
function model(day){
 day=asDay(day);const boards=typeof vms913Boards==='function'?vms913Boards():[],native=root.VMSArrival1098?.count(day)||{boards:[]};
 const statuses={...native,boards:list(native.boards).map(s=>({...s}))},groups=new Map();
 for(const s of statuses.boards)if(s.delivery)groups.set(s.delivery,(groups.get(s.delivery)||[]).concat(s));
 for(const [key,rows]of groups){
  const a=typeof assetOf==='function'?assetOf(key):null,d=typeof deliveryAsOf==='function'?deliveryAsOf(key,day):{};
  const receivedCount=a&&typeof CurrentStock996!=='undefined'?CurrentStock996.received(a,'VMS',day,rows.filter(s=>s.beforeNativeOn).length):0;
  rows.forEach(s=>{s.recorded=!!d.recorded;s.state=d.state;/* Only a whole confirmed load proves each linked board was received. */s.received=receivedCount>=rows.length;});
 }
 const identities={};boards.forEach(b=>{identities[b.key]=typeof vms913Of==='function'?vms913Of(b):{};});
 const positions=list(root.VMS1024?.boards()).map(p=>{const pin=root.VMS1024.position(p)||{};return {pos:p.pos,board:p.board||p.default_board,title:root.VmsLocationWords1103?.title(p,pin)??p.title??'',originalTitle:p.title||'',phase:p.phase||'',session:!!p.session,lat:pin.lat,lon:pin.lon,how:pin.how||''};});
 return project({boards,statuses,identities,positions},day);
}
function filterBoards(boards,filter){
 const f=filter||{},q=clean(f.q).toLocaleLowerCase(),light=f.light||'';
 return list(boards).filter(b=>{
  if(q&&![b.key,b.name,b.co,b.fleet,b.rego,b.delivery,...b.positions.map(p=>p.title)].join(' ').toLocaleLowerCase().includes(q))return false;
  return !light?true:light==='done'?b.done:light==='none'?b.c==='none':['red','amber','green'].includes(light)?b.recorded&&b.c===light:false;
 });
}
function filteredBoards(day,filter){return filterBoards(model(day).boards,filter);}
function lightBar(day,filter){
 const f=filter||{},boards=filteredBoards(day,{q:f.q}),scope=boards.length+' physical VMS boards'+(clean(f.q)?' matching search':''),selected=f.light||'';
 const btn=(value,cls,label,n,title)=>'<button type="button" data-lf="'+value+'" aria-pressed="'+(selected===value)+'" title="'+esc(title+' · '+scope)+'">'+(cls==='tick'?'<span class="tick sm" aria-hidden="true">✓</span>':cls?'<span class="tl '+cls+'" aria-hidden="true"><i></i></span>':'')+esc(label)+' <b>'+n+'</b></button>';
 return '<div class="lightbar" data-vms-lights1103 role="group" aria-label="'+esc('Filter '+scope)+'"><span class="lead">Show</span>'+
  btn('','','All boards',boards.length,'Each physical board counted once')+
  btn('red','red','Not on site',boards.filter(b=>b.c==='red').length,'Explicit off-site or not-on-site record')+
  btn('amber','amber','In transit',boards.filter(b=>b.c==='amber').length,'Recorded in transit')+
  btn('green','green','On site',boards.filter(b=>b.on).length,'Recorded arrival')+
  btn('none','none','Arrival unconfirmed',boards.filter(b=>b.c==='none').length,'No confirmed arrival; includes an earlier arrival corrected to not confirmed')+
  btn('done','tick','Complete',boards.filter(b=>b.done).length,'Saved completion')+
  '<span class="lfscope">'+boards.filter(b=>b.installed).length+' installed · of '+esc(scope)+'</span></div>';
}
function inventoryProjection(I,m){
 m=m||model(I?.td);if(!I||!Array.isArray(I.list)||!m.boards.length)return I;
 const old=I.list.find(r=>r.item==='VMS');if(!old)return I;
 const row={...old,vmsBoards1103:m.boards,sourceRefs1103:old.sourceRefs1103||old.refs||{},refs:{},asked:m.total,on:m.on,
  received1017:m.received,remaining1017:m.remaining,installed1098:m.installed,complete1103:m.done,coates:0,sub:{},nonum:0};
 for(const b of m.boards){
  const coates=b.on&&b.co==='Coates'&&!!b.fleet?1:0,sub=b.on&&!!b.co&&b.co!=='Coates'?1:0,nonum=b.on&&!coates&&!sub?1:0;
  row.refs[b.key]={vmsBoard1103:true,key:b.key,board1103:b,asked:1,on:+b.on,onsite:+b.on,coates,sub,cos:sub?{[b.co]:1}:{},nonum,received1017:+b.received,remaining1017:b.remaining};
  row.coates+=coates;row.nonum+=nonum;if(sub)row.sub[b.co]=(row.sub[b.co]||0)+1;
 }
 const result={...I,list:I.list.map(r=>r===old?row:r),cos:{}};
 for(const r of result.list){for(const [co,n]of Object.entries(r.sub||{}))(result.cos[co]||(result.cos[co]={at:0,spare:0})).at+=n;for(const[co,n]of Object.entries(r.spareSub||{}))(result.cos[co]||(result.cos[co]={at:0,spare:0})).spare+=n;}
 return result;
}
function financialRows(rows){return list(rows).map(r=>r.sourceRefs1103?{...r,refs:r.sourceRefs1103}:r);}
function action(b,label,pos){return '<button type="button" class="btn sm" data-vms-open1103="'+esc(b.key)+'"'+(pos?' data-vms-pos1103="'+esc(pos)+'"':'')+'>'+esc(label||b.name)+'</button>';}
function pinUrl(p){return Number.isFinite(p?.lat)&&Number.isFinite(p?.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(p.lat+','+p.lon):'';}
function positionsHtml(b,print){
 if(!b.positions.length)return '<span class="w">No plan position recorded</span>';
 return b.positions.map(p=>{const url=pinUrl(p),name='VMS '+text(p.pos).toUpperCase();return '<span class="vms-position1103">'+(print?'<b>'+esc(name)+'</b>':action(b,name,p.pos))+(p.title?' · '+esc(p.title):'')+(url?' <a class="btn sm" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Directions</a>':'')+'</span>';}).join('<br>');
}
function identityText(b){return [b.co,b.fleet?'Asset '+b.fleet:'Asset number not recorded',b.rego?'Rego '+b.rego:''].filter(Boolean).join(' · ');}
function boardLine(b,print){return '<li data-vms-inventory1103="'+esc(b.key)+'"><strong>'+(print?esc(b.name):action(b))+'</strong> · '+esc(b.status)+'<br>'+esc(identityText(b))+'<br>'+positionsHtml(b,print)+'</li>';}
function drillHtml(I,D){
 const row=I?.list?.find(r=>r.type===D?.t);if(!row?.vmsBoards1103)return null;
 const select={total:b=>b.on,on:b=>b.on,asked:()=>true,coates:b=>b.on&&b.co==='Coates'&&!!b.fleet,sub:b=>b.on&&!!b.co&&b.co!=='Coates',nonum:b=>b.on&&(!b.co||b.co==='Coates'&&!b.fleet),togo:b=>!!b.remaining,spare:()=>false};
 if(!has(select,D.col))return null;
 /* Spare records remain distinct native stock; they never acquire invented board identities. */
 const boards=row.vmsBoards1103.filter(select[D.col]),spares=['spare','total'].includes(D.col)?list(I.spares).filter(s=>s.type===row.type):[],n=boards.length+spares.length;
 const labels={total:'On site including spares',on:'On site',asked:'Ordered',coates:'Coates',sub:'Sub-hired',nonum:'Without asset number',togo:'Still to come',spare:'Spare stock'};
 const spareHtml=spares.map(s=>'<li class="invspr" data-vms-spare1103><span><b>Spare</b> · '+esc(s.co)+(s.no?' · '+esc(s.no):' · asset number not recorded')+(s.note?' · '+esc(s.note):'')+'</span></li>').join('');
 return '<div class="notice info invdrill" id="invDrill" data-vms-drill1103="'+esc(D.col)+'"><div class="invdrillh"><b>VMS · '+esc(labels[D.col]||D.col)+': '+n+' board'+(n===1?'':'s')+'</b><button type="button" class="chnumx" data-invdrill-x aria-label="Close the list">×</button></div>'+(n?'<ul class="invdrl">'+boards.map(b=>boardLine(b,false)).join('')+spareHtml+'</ul>':'<p>None in this selection.</p>')+'</div>';
}
function remainingHtml(row){if(!row?.vmsBoards1103)return null;return '<span class="inv87refs">'+row.vmsBoards1103.filter(b=>b.remaining).map(b=>action(b)).join(' ')+'</span>';}
function outstanding(I,disc){
 return list(I?.list).filter(r=>r.vmsBoards1103&&(!disc||disc==='*'||r.disc===disc)).flatMap(r=>r.vmsBoards1103.filter(b=>b.remaining).map(b=>({vmsBoard1103:true,key:b.key,board1103:b,due:b.due,items:['1 × VMS'],short:false,unknown:false,a:{key:b.key,name:b.name,vmsBoard1103:true}})));
}
function outstandingHtml(e,print){
 if(!e?.vmsBoard1103)return null;if(!print)return boardLine(e.board1103,false);
 const b=e.board1103,urls=[...new Set(b.positions.map(pinUrl).filter(Boolean))],url=urls.length===1?urls[0]:'',q=url&&typeof qrSvg==='function'?qrSvg(url,3):'';
 const names=b.positions.map(p=>'VMS '+text(p.pos).toUpperCase()+(p.title?' · '+p.title:''));
 return '<div class="card ln87p" data-vms-inventory1103="'+esc(b.key)+'"><div class="c1"><span class="ref">'+esc(b.name)+'</span><span class="due">'+esc(b.due||'No date yet')+'</span><div class="nm">'+esc(identityText(b))+'</div></div><div class="c2"><span class="lb">Still to come</span><div class="it">1 × VMS</div><div class="tgs"><span class="st gy">'+esc(b.status)+'</span></div></div><div class="c3"><div class="lw"><span class="lb">Plan position</span><div class="lo">'+esc(names.join(' · ')||'No position recorded')+'</div>'+(url?'<a href="'+esc(url)+'">Directions</a>':'')+'</div></div><div class="qr">'+(q?q+'<span>Scan to navigate</span>':'<div class="nq">'+(urls.length>1?'Multiple plan positions · use the VMS plan':'No navigation QR available')+'</div>')+'</div></div>';
}
function pdfHtml(I,disc){
 const rows=list(I?.list).filter(r=>r.vmsBoards1103&&(!disc||disc==='*'||r.disc===disc));if(!rows.length)return '';
 return rows.map(r=>{const pages=[];for(let i=0;i<r.vmsBoards1103.length;i+=8)pages.push('<section class="pg por" data-vms-pdf1103><h2>VMS board register'+(i?' · continued':'')+'</h2><p>Author: Andrew Fisher · '+esc(I.td||'')+'</p><p>'+r.on+' on site · '+r.received1017+' received · '+r.complete1103+' complete / '+r.asked+' ordered · '+r.remaining1017+' still to come</p><ul>'+r.vmsBoards1103.slice(i,i+8).map(b=>boardLine(b,true)).join('')+'</ul></section>');return pages.join('');}).join('');
}
function equipmentHtml(day,filter,options){
 const boards=has(options,'boards')?list(options.boards):filteredBoards(day,filter);
 const progress=root.EquipmentProgress1103?root.EquipmentProgress1103.html(root.EquipmentProgress1103.model('VMS boards',[],{day:asDay(day),filtered:!!(filter?.q||filter?.light),boards})):'';
 return '<div class="card" data-vms-equipment-list1103><h3>VMS boards <span class="chip ref">'+boards.length+' physical board'+(boards.length===1?'':'s')+'</span></h3>'+progress+'<div class="tblwrap"><table><thead><tr><th>Board</th><th>Arrival / completion</th><th>Asset / supplier</th><th>Plan positions</th></tr></thead><tbody>'+boards.map(b=>'<tr data-vms-equipment1103="'+esc(b.key)+'"><td>'+action(b)+'</td><td><span class="chip '+(b.done?'ok':b.on?'ref':'cand')+'">'+esc(b.status)+'</span></td><td>'+esc(identityText(b))+'</td><td>'+positionsHtml(b,false)+'</td></tr>').join('')+'</tbody></table></div>'+(!boards.length?'<p>No boards match this selection.</p>':'')+'</div>';
}
function rowsOf(m){return m.boards.map(b=>({vmsBoard1103:true,board1103:b,key:b.key,name:b.name,label:b.name,quantity:1,knownQuantity:1,complete:b.done,recordedComplete:b.done,done:+b.done,left:b.done?0:1,remaining:b.done?0:1,onSite:+b.on,status:b.status,detail:identityText(b),levelled:false,steps:false,conflict:false,issues:[]}));}
function todayRows(day){return rowsOf(model(day));}
function plan(day,m){
 m=m||model(day);day=m.day;const due=m.boards.filter(b=>dayValid(b.due)&&b.due<=day),early=m.boards.filter(b=>b.on&&dayValid(b.due)&&b.due>day),late=due.filter(b=>!b.on),undated=m.boards.filter(b=>!dayValid(b.due));
 return {status:undated.length?'unknown':late.length?'behind':'on-plan',provisional:!!undated.length,
  label:undated.length?'Some board arrival dates are unconfirmed':late.length?late.length+' due board'+(late.length===1?' is':'s are')+' not on site':'Due boards are on site',
  planned:due.length,actual:due.filter(b=>b.on).length,delta:-late.length,actualLabel:'Due boards on site',unit:'boards',behind:late.length,early:early.length,
  overdueRefs:late.map(b=>b.key),earlyRefs:early.map(b=>b.key),undatedRefs:undated.map(b=>b.key),unrecordedRefs:due.filter(b=>!b.recorded).map(b=>b.key),rentalOnlyRefs:[],
  basis:'Each physical VMS board is counted once. Due dates follow its linked delivery or register start date; arrival and completion replay from native records to the selected day. A plan position does not prove arrival.',
  issues:undated.length?[undated.length+' physical board arrival date(s) are unconfirmed.']:[]};
}
function typeProjection(item,day){
 const m=model(day),rows=rowsOf(m),pct=m.total?Math.floor(m.done/m.total*10000)/100:null;
 return {...item,vmsBoard1103:true,total:m.total,knownTotal:m.total,done:m.done,onSite:m.on,onSiteLabel:'On site',installed1098:m.installed,left:m.left,keys:rows.map(r=>r.key),rows,
  quantityKnown:true,unitKnown:true,pct,pctKind:'confirmed',pctLabel:'Confirmed complete',reviewQuantity:0,reviewRefs:[],unquantifiedRefs:[],plan:plan(day,m),issues:[],
  basis:'Physical VMS register boards are counted once across all plan positions. Receipt, installation and saved completion remain separate; complete follows the native board or its existing linked delivery. No new delivery association is inferred.',scopeNote:item?.scopeNote||''};
}
function todayRowHtml(row,mode){
 if(!row?.vmsBoard1103)return null;const b=row.board1103,n=mode==='done'?row.done:mode==='left'?row.remaining:row.quantity;
 return '<article class="tw840-detail-row" data-vms-today1103="'+esc(b.key)+'"><div>'+action(b)+'<p>'+esc(b.status)+'</p><p>'+esc(identityText(b))+'</p>'+positionsHtml(b,false)+'</div><strong>'+n+' board'+(n===1?'':'s')+'</strong></article>';
}
function open(key,pos){
 const b=model().boards.find(b=>b.key===key);if(!b||!root.document)return false;
 const dialog=root.document.getElementById('gc500-work-dialog840');if(dialog?.open)dialog.close();
 const p=b.positions.find(p=>p.pos===pos)||b.positions[0];
 if(p&&root.VMS1024){if(typeof go==='function')go('vms');root.VMS1024.filter='all';root.VMS1024.render();const card=[...root.document.querySelectorAll('#pane-vms .v1024-card[data-pos]')].find(e=>e.dataset.pos===text(p.pos));if(card){card.scrollIntoView({block:'center',behavior:'auto'});card.setAttribute('tabindex','-1');card.focus({preventScroll:true});}return true;}
 if(typeof state!=='undefined'){state.plantGroup='VMS boards';state.light=null;state.q='';}
 if(typeof go==='function')go('plant');if(typeof vms913Mount==='function')vms913Mount();
 const row=[...root.document.querySelectorAll('[data-vms913-row]')].find(e=>e.dataset.vms913Row===key);if(row){const fold=row.closest('details');if(fold)fold.open=true;row.scrollIntoView({block:'center',behavior:'auto'});return true;}return false;
}
const bound=new WeakSet();
function bind(host){if(!host?.addEventListener||bound.has(host))return;bound.add(host);host.addEventListener('click',e=>{const b=e.target.closest?.('[data-vms-open1103]');if(!b||!host.contains(b)||e.defaultPrevented||b.closest('#gc500-work-dialog840'))return;e.preventDefault();open(b.dataset.vmsOpen1103,b.dataset.vmsPos1103);});}
const api={project,model,received,filterBoards,filteredBoards,lightBar,inventoryProjection,financialRows,drillHtml,remainingHtml,outstanding,outstandingHtml,pdfHtml,equipmentHtml,todayRows,todayRowHtml,plan,typeProjection,open,bind};
root.VmsEquipment1103=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
