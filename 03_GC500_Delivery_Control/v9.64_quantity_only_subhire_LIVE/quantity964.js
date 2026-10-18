/* Author: Andrew Fisher. Quantity-only item ownership is separate from physical identities,
 * receipts, installation and money. The existing loads collection provides native sync. */
function quantitySubhire964Key(ref,item){return 'quantity-subhire964/'+encodeURIComponent(ref)+'/'+encodeURIComponent(item);}
function quantitySubhire964Token(ref,item){return JSON.stringify((S.loads||{})[quantitySubhire964Key(ref,item)]||null);}
function quantitySubhire964Read(ref,item,options){
 const o=options||{},loads=o.loads||(typeof S!=='undefined'?S.loads||{}:{}),key=quantitySubhire964Key(ref,item);
 const candidates=Object.entries(loads).filter(([k,d])=>k===key||d&&d.kind==='quantity-subhire964'&&d.ref===ref&&d.item===item);
 const fail=reason=>({valid:false,row:null,reason,ref,item,record:candidates[0]?.[1]||null});
 if(!candidates.length)return fail('');
 if(candidates.length!==1)return fail('More than one quantity ownership record exists for this item.');
 const [docKey,d]=candidates[0];
 if(!d||docKey!==key||d.kind!=='quantity-subhire964'||d.schema!==1||d.ref!==ref||d.item!==item||d.quantityOnly!==true)return fail('The quantity ownership record does not match this item.');
 if(ref!=='WC09'||item!=='Pee Panel')return fail('This item is not a reviewed quantity-only scope.');
 if(d.active===false)return fail('Quantity ownership withdrawn; the original record is retained.');
 if(d.owner!=='event-portables')return fail('The recorded supplier does not match the confirmed Event Portables scope.');
 if(!Number.isInteger(d.quantity)||d.quantity<=0||typeof d.by!=='string'||!d.by.trim()||typeof d.at!=='string'||!Number.isFinite(Date.parse(d.at)))return fail('Quantity ownership needs a valid quantity, named recorder and date.');
 const day=o.day||(typeof todayIso==='function'?todayIso():''),recordDay=typeof isoIn==='function'?isoIn(d.at):d.at.slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(recordDay)||recordDay>day)return fail('The quantity ownership record is dated after this view.');
 const a=o.asset||(typeof assetOf==='function'?assetOf(ref):null);
 if(!a||a.key!==ref||a._cancelled||a.relocation||a.rest_of||a._movedTo||a._locationMoved||(!o.asset&&typeof movedAway==='function'&&movedAway(ref)))return fail('The quantity ownership reference is no longer active here.');
 const lines=(o.lines||(typeof chargeLines==='function'?chargeLines(a):[])).filter(l=>l.item===item);
 const values=lines.map(l=>typeof qtyOf==='function'?qtyOf(l):l.quantity);
 if(!lines.length||values.some(q=>!Number.isInteger(q)||q<0)||values.reduce((n,q)=>n+q,0)!==d.quantity)return fail('The current item quantity differs from the recorded supplier quantity.');
 const units=o.units||(typeof gcModel925==='function'?gcModel925(a,{loading:false}).rows:[]);
 if(units.some(u=>u.item===item&&u.source!=='history'&&(u.physical||u.id||u.assetNo)))return fail('Individual identities now overlap this quantity-only ownership; reconcile them before counting both.');
 const progress=o.progress||(typeof toiletItem962==='function'?toiletItem962(a,item,deliveryAsOf(ref,day),day):null);
 if(!progress||progress.quantity!==d.quantity||![progress.arrived,progress.done].every(q=>Number.isInteger(q)&&q>=0&&q<=d.quantity)||progress.done>progress.arrived)return fail('The recorded item quantities need reconciliation.');
 return {valid:true,reason:'',ref,item,record:d,row:{ref,item,owner:d.owner,company:'Event Portables',quantity:d.quantity,received:progress.arrived,installed:progress.done,quantityOnly:true,by:d.by,at:d.at,source:'Confirmed by Andrew; Event Portables quote Q6845, Portable Toilets line 3.',status:progress.arrived+' of '+d.quantity+' received · '+progress.done+' installed'}};
}
function quantitySubhire964List(){
 const pairs=new Map();
 Object.entries(S.loads||{}).forEach(([key,d])=>{if(d&&d.kind==='quantity-subhire964')pairs.set(JSON.stringify([d.ref,d.item]),[d.ref,d.item]);else if(key===quantitySubhire964Key('WC09','Pee Panel'))pairs.set(JSON.stringify(['WC09','Pee Panel']),['WC09','Pee Panel']);});
 const reads=[...pairs.values()].map(([ref,item])=>quantitySubhire964Read(ref,item));
 return {rows:reads.filter(x=>x.valid).map(x=>x.row),issues:reads.filter(x=>!x.valid&&x.reason)};
}
function quantitySubhire964Set(ref,item,quantity,owner,expected){
 if(!mayWrite('quantity-only item ownership'))return {ok:false,reason:'This link cannot edit item ownership.'};
 const who=whoAmI();if(!who)return {ok:false,reason:'A named recorder is required.'};
 const key=quantitySubhire964Key(ref,item),current=quantitySubhire964Token(ref,item);
 if(typeof expected!=='string'||current!==expected)return {ok:false,reason:'This item ownership changed. Read the current record before saving.'};
 const old=(S.loads||{})[key],next={kind:'quantity-subhire964',schema:1,ref,item,owner,quantity,quantityOnly:true,by:who,at:new Date().toISOString(),source:{confirmation:'User confirmed six installed, sub-hired pee panels at WC09 on 9 Oct 2026.',quote:'Q6845',group:'Portable Toilets',line:3}};
 const check=quantitySubhire964Read(ref,item,{loads:{...(S.loads||{}),[key]:next}});
 if(!check.valid)return {ok:false,reason:check.reason};
 if(old&&old.kind===next.kind&&old.schema===1&&old.ref===ref&&old.item===item&&old.owner===owner&&old.quantity===quantity&&old.quantityOnly===true&&old.active!==false)return {ok:true,unchanged:true,key,reason:'This quantity ownership is already recorded.'};
 S.loads=S.loads||{};S.loads[key]=next;stampIt('loads',key,who);bump();
 const kept=bump.kept!==false;return {ok:true,kept,key,reason:kept?'Quantity-only item ownership recorded.':'The ownership change is still on this device; the page’s save warning shows what needs attention.'};
}
function quantitySubhire964Drawer(ref,item,receipt){
 const r=quantitySubhire964Read(ref,item),prefix=r.valid?'<b>SUB-HIRED · Event Portables</b><br>':r.reason?'<b>Quantity ownership needs review</b><br>'+esc(r.reason)+'<br>':'';
 return '<span data-quantity-subhire964="'+esc(ref)+'">'+prefix+(receipt?.arrived||0)+' received · quantity only; no fleet numbers</span>';
}
function quantitySubhire964CompanyHtml(company){
 const rows=company.quantityOnly||[],list=rows.map(r=>'<button type="button" class="units925-company-unit" data-quantity-subhire964="'+esc(r.ref)+'" data-unit925-open="'+esc(r.ref)+'" data-unit925-item="'+esc(r.item)+'"><span><b>'+esc(r.ref)+' · '+esc(r.item)+' ×'+r.quantity+'</b><small>SUB-HIRED · '+esc(r.company)+' · quantity only; no fleet numbers</small></span><span>'+esc(r.status)+' →</span></button>').join('');
 const issues=company.owner==='event-portables'?quantitySubhire964List().issues.map(r=>'<p class="units925-warning" data-quantity-subhire964-review><b>'+esc(r.ref)+' · '+esc(r.item)+'</b> — '+esc(r.reason)+'</p>').join(''):'';
 return list+issues;
}
