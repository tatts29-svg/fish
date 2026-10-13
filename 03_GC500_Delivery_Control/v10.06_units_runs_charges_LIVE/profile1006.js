/* Author: Andrew Fisher. One searchable physical record; date and branch context beside existing charges. */
(function(root){'use strict';
 const normal=value=>String(value??'').trim().replace(/\s+/g,'').toUpperCase();
 const unique=values=>[...new Set(values.filter(Boolean))];
 function current(rows,confirmed){
  const seen=new Set(),allowed=confirmed&&new Set(confirmed.map(normal));
  return (rows||[]).filter(u=>{const number=normal(u.assetNo);if(!u.physical||u.source==='history'||u.active===false||!number||allowed&&!allowed.has(number))return false;const key=JSON.stringify([u.owner,number]);if(seen.has(key))return false;seen.add(key);return true;});
 }
 function index(base,records){
  const byRef=new Map(records.map(r=>[r.asset.key,r])),out=[];
  for(const entry of base){const record=byRef.get(entry.key);if(!record){out.push(entry);continue;}
   if(entry.kind==='unit')continue;
   if(entry.kind!=='asset'){out.push(entry);continue;}
   const a=record.asset,nums=unique(record.units.map(u=>u.assetNo)),links=entry.links||[];
   out.push({...entry,nums,hay:[a.key,entry.name,entry.type,a.product,...(a.locations||[]),a.discipline,...links.map(l=>l.label),...links.map(l=>l.sheet),...record.units.flatMap(u=>[u.assetNo,u.label,u.item,u.owner])].filter(Boolean).join(' ').toLowerCase()});
  }
  for(const {asset:a,units} of records)for(const u of units)out.push({kind:'unit',key:a.key,label:u.item||u.label||'Asset',no:u.assetNo,unitId1006:u.id,item1006:u.item,owner1006:u.owner,hay:[a.key,u.item,u.label,u.assetNo,u.owner,a.name].filter(Boolean).join(' ').toLowerCase()});
  return out;
 }
 function exact(matches,query){const n=normal(query),units=matches.filter(r=>r.unitId1006&&normal(r.no)===n);if(!units.length)return matches;const refs=new Set(units.map(r=>r.key));return units.concat(matches.filter(r=>!units.includes(r)&&!(r.kind==='asset'&&refs.has(r.key))));}
 function periods(row,eventFrom){
  const start=row.actualIsConfirmed?row.deliveredDate:row.plannedDate,known=n=>Number.isFinite(n),previous=v=>new Date(Date.parse(v+'T00:00:00Z')-86400000).toISOString().slice(0,10);
  return [{key:'standdown',name:'Standdown',start:row.standdownDays>0?start:null,end:row.standdownDays>0?previous(eventFrom):null,days:row.standdownDays,rate:row.standdownRate,qty:row.qty,total:row.standdownCharge},
   {key:'race',name:'Race hire',start:row.eventDays>0&&start?(start>eventFrom?start:eventFrom):null,end:row.eventDays>0?row.offhire:null,days:row.eventDays,rate:row.dailyRate,qty:row.qty,total:row.raceCharge}].map(r=>({...r,confirmed:!!row.actualIsConfirmed,included:row.actualIsConfirmed&&known(r.total)}));
 }
 function exit(rows,demob){const dates=unique((rows||[]).map(r=>r.offhire));return {offhire:dates.length===1?dates[0]:null,pickup:demob?.iso&&['confirmed','plan','contract'].includes(demob.src)?{date:demob.iso,label:demob.src==='contract'?'Contract demob':demob.src==='plan'?'Scheduled pickup':'Pickup date'}:null};}
 const api={normal,current,index,exact,periods,exit};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.AssetProfile1006=api;
})(typeof window!=='undefined'?window:null);

if(typeof window!=='undefined'){
(function(){'use strict';
 const P=AssetProfile1006,uniq=values=>[...new Set(values.filter(Boolean))],day=value=>{const n=Date.parse(value||'');return Number.isFinite(n)?new Date(n+36000000).toISOString().slice(0,10):null;},date=value=>value?fmtDate(value):'Not recorded';
 function records(){return heldMemo('profile1006-identities',()=>{
  const generators=generatorModel1004().rows;
  return lighting894MapList().filter(a=>!a._cancelled&&!a._movedTo&&!movedAway(a.key)).map(a=>{
   const model=gcModel925(a,{loading:false}),confirmed=a.discipline==='Generators'?uniq(generators.filter(r=>r.ref===a.key).flatMap(r=>r.assetNumbers||[]).concat(model.rows.filter(u=>u.metadata?.active!==false&&u.metadata?.by&&u.metadata?.at&&u.source!=='history').map(u=>u.assetNo))):null;
   return {asset:a,units:P.current(model.rows,confirmed)};
  });
 });}
 const oldIndex=finderIndex;finderIndex=function(){return P.index(oldIndex.apply(this,arguments),records());};
 const oldMatches=finderMatches;finderMatches=function(query){return P.exact(oldMatches.apply(this,arguments),query);};
 const oldRow=finderRow;finderRow=function(it,i){
  if(!it.unitId1006)return oldRow.apply(this,arguments);
  const on=i===FINDER.at,a=assetOf(it.key),owner=Units925.company(it.owner1006),destination=a&&destinationOf(a);
  return '<div class="fi unit'+(on?' on':'')+'" role="option" id="fi-'+i+'" aria-selected="'+on+'" data-fi="'+i+'">'+refPlate(it.key,15)+'<span class="fim"><b>'+esc(it.no)+' · '+esc(it.label)+'</b><span>'+esc(owner)+'</span><span class="fiw">'+esc(destination?.text||a?.name||it.key)+'</span></span><span class="fik">Open record</span></div>';
 };
 const oldPick=finderPick;finderPick=function(i){
  const it=FINDER.list?.[i];if(!it||!['asset','unit'].includes(it.kind))return oldPick.apply(this,arguments);
  const a=assetOf(it.key);if(!a)return oldPick.apply(this,arguments);
  finderClose();if(searchTimer){clearTimeout(searchTimer);searchTimer=null;}state.q='';const q=document.getElementById('q');if(q){q.value='';q.blur();}const clear=document.getElementById('qx');if(clear)clear.hidden=true;document.body.classList.remove('search-open');state.unit=null;
  openAsset(it.key);
  if(it.item1006){const selector=document.querySelector('#drawer [data-unit925-description]');if(selector&&[...selector.options].some(o=>o.value===it.item1006)){selector.value=it.item1006;selector.dispatchEvent(new Event('change',{bubbles:true}));}}
  if(it.unitId1006){const target=[...document.querySelectorAll('#drawer [data-unit925-id]')].find(el=>el.dataset.unit925Id===it.unitId1006);if(target){target.classList.add('profile1006-selected');target.setAttribute('tabindex','-1');target.querySelector(':scope > details')?.setAttribute('open','');target.scrollIntoView({block:'start'});target.focus({preventScroll:true});}}
 };
 function itemContracts(a,item){return ItemIdentity979.select(a.key,item,ONHIRE_ROWS,gcModel925(a,{loading:false}).rows);}
 function facts(a,item,arrived){
  const contracts=itemContracts(a,item),generators=a.discipline==='Generators'?generatorModel1004().rows.filter(r=>r.ref===a.key&&r.item===item):[],branch=branchOf(a.key)?.code,ids=new Set(contracts.map(r=>String(r.rental_contract)+':'+String(r.line)));
  const direct=uniq((typeof allCosts==='function'?allCosts():[]).filter(c=>c.ref===a.key&&c.usable).map(c=>costBranchOf(c)?.code).concat((typeof Source949!=='undefined'?Source949.model():[]).filter(r=>ids.has(String(r.contract)+':'+String(r.line))).map(r=>r.costBranch)));
  const out=[['Scope',item+' × '+arrived+' · '+a.key],['Revenue branch',branch?branchWords(branch):'Not recorded']];
  if(direct.length)out.push(['Direct cost branch',direct.map(branchWords).join(' · ')]);
  if(generators.length){
   const dates=uniq(generators.filter(r=>r.actualIsConfirmed).map(r=>r.deliveredDate));out.push(['Arrived',dates.length?dates.map(date).join(' · '):'Date not recorded']);
   const starts=uniq(generators.filter(r=>r.actualIsConfirmed).map(r=>r.deliveredDate));out.push(['Charging starts',starts.length?starts.map(date).join(' · '):'Date not recorded']);out.push(['Off hire',uniq(generators.map(r=>r.offhire)).map(date).join(' · ')]);
  }else{
   const supplier=window.Supplier996?.model(),receipts=(supplier?.receipts||[]).filter(r=>r.ref===a.key&&r.item===item),d=deliveryOf(a.key),delivered=contracts.filter(r=>r.delivered===true||String(r.status_as_written).toLowerCase()==='delivered'),rentalDates=uniq(delivered.map(r=>r.start_date));
   const observed=uniq((d.history||[]).filter(h=>h.state==='on site').map(h=>day(h.at)).concat(d.recorded&&d.state==='on site'?day(d.set_at):null));
   if(receipts.length)out.push(['Arrived',receipts.map(r=>date(r.date)+' × '+r.count).join(' · ')]);
   else if(rentalDates.length)out.push(['Arrived',rentalDates.map(date).join(' · ')]);
   else if(observed.length&&chargeLines(a).length===1)out.push(['Arrival recorded',observed.map(date).join(' · ')]);
   else out.push(['Arrived',arrived>0?'On site · date not linked':'Not recorded']);
   const charges=contracts.map(contractCharge),starts=uniq(charges.map(r=>r.from)),ends=uniq(charges.map(r=>r.to));
   if(starts.length)out.push(['Charging starts',starts.map(date).join(' · ')]);if(ends.length)out.push(['Hire ends',ends.map(date).join(' · ')]);
  }
  return {out,generators,contracts};
 }
 function factsHtml(data){return '<dl class="profile1006-facts">'+data.map(([label,value])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>').join('')+'</dl>';}
 const previous=arrivedChargesHtml975;
 arrivedChargesHtml975=function(a){
  const html=previous.apply(this,arguments);if(!html)return html;
  const template=document.createElement('template');template.innerHTML=html;
  const panel=template.content.querySelector('[data-charges952]');if(!panel)return html;
  const rows=arrivedChargeRows975(a),details=[...panel.querySelectorAll(':scope > details')];
  details.forEach((detail,i)=>{const row=rows[i];if(!row)return;const data=facts(a,row.item,row.arrived),summary=detail.querySelector(':scope > summary');if(!summary)return;
   const box=document.createElement('div');box.className='profile1006-context';box.innerHTML=factsHtml(data.out);summary.after(box);detail.dataset.profile1006Item=row.item;
   // Quantities and amounts in this table always cover this item at the reference, never the selected fleet number alone.
   const table=detail.querySelector('table');if(table){table.setAttribute('aria-label',a.key+' '+row.item+' charges for '+row.arrived+' arrived units');if(row.arrived>1){const caption=document.createElement('caption');caption.textContent='All '+row.arrived+' '+row.item+' at '+a.key+' · rates per stated unit';table.prepend(caption);}}
   if(!data.generators.length)return;
   const body=table?.querySelector('tbody');if(!body)return;
   const hire=[...body.querySelectorAll('tr[data-item979]')].filter(tr=>tr.firstElementChild?.textContent.trim().startsWith('Hire'));
   if(!hire.length)return;
   const mark=hire[0],fragment=document.createDocumentFragment();
   for(const generator of data.generators.filter(g=>g.actualIsConfirmed))for(const period of P.periods(generator,GeneratorFinance1004.eventFrom)){
    const tr=document.createElement('tr');tr.dataset.profile1006Period=period.key;const checked=period.included?' checked':'',moneyOr=v=>Number.isFinite(v)?money(v):'Rate / allocation pending';
    const duration=period.days==null?'Days not recorded':period.days+' day'+(period.days===1?'':'s'),range=period.start?fmtDay(period.start).dm+'–'+fmtDay(period.end).dm:'Not applicable';
    tr.innerHTML='<td><input type="checkbox" disabled'+checked+' aria-label="'+esc(period.name+' charge '+(period.included?'included':'not confirmed'))+'">'+esc(period.name)+'<small>'+esc(range+' · '+duration)+'</small></td><td>'+esc(Number.isFinite(period.rate)?chargeRateDisplay977(period.rate)+' / day':'Rate to confirm')+'</td><td>'+esc(period.qty==null?'To confirm':String(period.qty))+'</td><td>'+esc(moneyOr(period.total))+'</td>';fragment.append(tr);
   }
   if(fragment.childNodes.length){mark.before(fragment);hire.forEach(tr=>tr.remove());}
  });
  return template.innerHTML;
 };
 function drawerDates(a){
  if(!a||a.discipline!=='Generators'||a._cancelled)return;
  const tile=document.querySelector('#drawer .sum816 .dt816.out'),value=P.exit(generatorModel1004().rows.filter(r=>r.ref===a.key),demobOf816(a.key));if(!tile||!value.offhire)return;
  tile.dataset.profile1006Offhire=value.offhire;tile.innerHTML='<p class="ctk">Off hire</p><b>'+esc(dayWords816(value.offhire))+'</b><span>Charging ends · last race day</span>'+(value.pickup?'<span data-profile1006-pickup="'+esc(value.pickup.date)+'">'+esc(value.pickup.label)+' · '+esc(fmtDay(value.pickup.date).dm)+'</span>':'');
 }
 const priorDraw=openAssetDraw;openAssetDraw=function(a){const result=priorDraw.apply(this,arguments);drawerDates(a);return result;};
 P.records=records;P.facts=facts;P.drawerDates=drawerDates;
})();
}
