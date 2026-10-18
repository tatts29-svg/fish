/* Author: Andrew Fisher. Native quantity practice; every service write is blocked. */
'use strict';const fs=require('node:fs');const{open}=require('../../record_14Oct2026_purchase_order/readonly_page.cjs');
(async()=>{let h;try{
 h=await open({pageFile:process.env.PAGE,hash:'#today'});await h.page.waitForFunction(()=>SYNC.status==='live'&&photoIndex().state==='ready'&&Refresh904.report().state==='ready',null,{timeout:180000});
 const result=await h.page.evaluate(()=>{
  const clone=x=>JSON.parse(JSON.stringify(x)),original=clone(S),originalJSON=JSON.stringify(S),rates=JSON.stringify([S.rates,S.lineRates,S.accRates,ONHIRE_ROWS]),version=SYNC.backend.readVersion821();
  const funcs={save,bump,mayWrite,whoAmI,flash},checks=[],cases=[],check=(name,pass,detail)=>checks.push({name,pass:!!pass,...(pass?{}:{detail})});let saves=[],baseline;
  const actualCharges=rows=>JSON.stringify(rows.map(r=>({ref:r.ref,item:r.item,arrived:r.arrived,total:r.total,charges:r.charges.map(c=>({key:c.key,rate:c.rate,qty:c.qty,value:c.value,completedQty:c.completedQty}))})));
  const docs=()=>Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)]));
  const reset=()=>{for(const key of Object.keys(S))delete S[key];Object.assign(S,clone(original));sharedCache975();};
  const read=()=>holdAssets(()=>{const a=assetOf('WC09'),s=Supplier996.model(),money=moneySummary(),pl=pl770Model();return clone({
   lines:chargeLines(a).map(l=>({item:l.item,qty:qtyOf(l)})),items:toiletRows962(a,deliveryOf('WC09'),chargeLines(a),todayIso()),
   units:gcModel925(a).rows.filter(u=>u.physical).map(u=>({item:u.item,owner:u.owner,no:u.assetNo})),
   charges:arrivedChargeRows975(a),receipts:s.receipts.filter(r=>r.ref==='WC09').map(r=>({item:r.item,date:r.date,count:r.count})),
   remaining:s.remaining.filter(r=>r.ref==='WC09'),supplierPending:s.remaining.map(r=>({date:r.date,ref:r.ref,item:r.item,qty:r.remaining})),supplierRows:s.rows.length,finder:finderIndex().length,
   programme:programmeDays().flatMap(d=>dpLoads(d).filter(g=>g._supplier996&&!g._supplier996.actualReceipt1006).flatMap(g=>g._supplier996.stops.map(r=>({date:d.iso,ref:r.ref,item:r.item,qty:r.count??r.remaining})))),
   map:gc500MapStatus1009(['WC09']),inventory:inventory().list.filter(r=>r.refs.WC09).map(r=>({item:r.item,...r.refs.WC09})),
   today:todayWorkMetrics840().find(r=>r.id==='toilets'),financial:{money,pl,branches:branchFinancial978(pl752Rows(),money)},docs:docs()});});
  try{
   save=()=>{saves.push(docs());sharedCache975();return true;};bump=()=>{save();return true;};mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher via Codex';flash=()=>{};
   const before=read(),beforeDocs=docs();baseline=before;
   check('starting physical scope is four FWF, six Pee Panels and two blocks',JSON.stringify(before.items.rows.map(r=>[r.item,r.quantity,r.arrived,r.done]))===JSON.stringify([['FWF',4,4,4],['Pee Panel',6,6,6],['Toilet Block 6m',2,2,2]]));
   for(const target of [6,10]){
    reset();saves=[];const changed=setQty('WC09',String(target)),after=read(),item=after.items.rows.find(r=>r.item==='FWF');cases.push({target,after});
    check(target+' uses native setter once',changed===true&&saves.length===1,saves.length);
    check(target+' preserves four FWF actuals',item.quantity===target&&item.arrived===4&&item.done===4&&!item.complete,item);
    check(target+' preserves mixed item actuals',after.items.rows.filter(r=>r.item!=='FWF').every(r=>r.arrived===r.quantity&&r.done===r.quantity),after.items);
    check(target+' preserves original dated receipts',JSON.stringify(after.receipts)===JSON.stringify(before.receipts),after.receipts);
    check(target+' preserves physical identities',JSON.stringify(after.units)===JSON.stringify(before.units));
    check(target+' preserves actual labour charges',actualCharges(after.charges)===actualCharges(before.charges));
    check(target+' actual total cents unchanged',Math.round(after.financial.money.charge.total*100)===Math.round(before.financial.money.charge.total*100),[before.financial.money.charge.total,after.financial.money.charge.total]);
    check(target+' P&L and branches reconcile',Object.values(after.financial.pl.checks).every(Boolean)&&Object.values(after.financial.branches.checks).every(Boolean));
    check(target+' adds only planned demand to Today',after.today.total===before.today.total+target-4&&after.today.done===before.today.done,after.today);
    check(target+' Today percentage is completed divided by requested',Math.abs(after.today.pct-after.today.done/after.today.total*100)<1e-9);
    check(target+' marks revised location partial',!gc500IsComplete897('WC09')&&timeline841State(assetOf('WC09')).stage!==5);
    check(target+' map quantity and installed counts match each item',after.map.states[0].state==='partial'&&JSON.stringify(after.map.states[0].quantity.items.map(r=>[r.item,r.quantity,r.installed]))===JSON.stringify([['FWF',target,4],['Pee Panel',6,6],['Toilet Block 6m',2,2]]),after.map);
    check(target+' Inventory requested and current quantities agree',after.inventory.find(r=>r.item==='FWF').asked===target&&after.inventory.find(r=>r.item==='FWF').on===4);
    check(target+' Supplier has only added FWF outstanding',after.remaining.length===1&&after.remaining[0].item==='FWF'&&after.remaining[0].remaining===target-4);
    const sums=rows=>{const m={};for(const r of rows){const k=[r.date,r.ref,r.item].join('|');m[k]=(m[k]||0)+r.qty;}return Object.fromEntries(Object.entries(m).sort());};
    check(target+' every pending Build run matches Supplier day and quantity',JSON.stringify(sums(after.programme))===JSON.stringify(sums(after.supplierPending)));
    const dayCounts={};for(const r of after.programme.filter(r=>r.item==='FWF'))dayCounts[r.date]=(dayCounts[r.date]||0)+r.qty;
    check(target+' pending portable daily cap remains twenty four',Object.values(dayCounts).every(n=>n<=24),dayCounts);
    check(target+' creates no physical or supplier row',after.supplierRows===before.supplierRows&&after.finder===before.finder);
    const changedDocs=[];for(const [coll,vals]of Object.entries(after.docs))for(const id of new Set([...Object.keys(vals),...Object.keys(beforeDocs[coll]||{})]))if(JSON.stringify(vals[id])!==JSON.stringify(beforeDocs[coll]?.[id]))changedDocs.push({coll,id});
    check(target+' only quantity and its author/stamp docs change',changedDocs.every(x=>['qtys','stamps','by'].includes(x.coll)),changedDocs);
    const qdoc=after.docs.qtys[docIdOf('WC09')];check(target+' actual baseline and numeric quantity are one document',qdoc.v===target&&qdoc.scope1017.items[0].received===4&&qdoc.scope1017.items[0].installed===4);
    check(target+' no loads document is written',JSON.stringify(after.docs.loads)===JSON.stringify(beforeDocs.loads));
    for(const order of [['qtys','loads'],['loads','qtys']]){
     reset();for(const name of order){const decoded=fromDocs(name,after.docs[name]);SYNC_COLLS[name].set(decoded);sharedCache975();if(name==='qtys')check(target+' '+order.join('-')+' quantity arrival safe',toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).arrived===4);}
     check(target+' '+order.join('-')+' round trip installed safe',toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).done===4);
    }
    reset();SYNC_COLLS.qtys.set(fromDocs('qtys',after.docs.qtys));SYNC_COLLS.loads.set(fromDocs('loads',beforeDocs.loads));sharedCache975();
    check(target+' stale loads cannot erase receipt protection',toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).arrived===4);
    const reload=clone(S);reset();for(const k of Object.keys(S))delete S[k];Object.assign(S,reload);sharedCache975();
    check(target+' local JSON reload keeps actuals',toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).done===4);
    const unchanged=JSON.stringify(S);saves=[];check(target+' unchanged native edit does nothing',setQty('WC09',String(target))===false&&JSON.stringify(S)===unchanged&&saves.length===0);
    check(target+' item rename cannot reclassify protected received scope',setItemType('WC09','Accessible Toilet')===false&&JSON.stringify(S)===unchanged&&saves.length===0);
    const now=new Date(Date.now()+2000).toISOString();
    setLabour('WC09','Toilets & amenities','FWF','install',false,'0085');S.stamps['labour/WC09/u0085|Toilets & amenities|FWF|install']=now;sharedCache975();
    check(target+' native unit work untick is respected',toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).done===3);
    setLabour('WC09','Toilets & amenities','FWF','install',true,'0085');S.stamps['labour/WC09/u0085|Toilets & amenities|FWF|install']=now;sharedCache975();
    check(target+' native unit work retick restores only that unit',toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).done===4);
    setSupplied('WC09','Pee Panel',{qty_supplied:6});S.stamps['supplied/WC09/Pee Panel']=now;sharedCache975();
    check(target+' unrelated mixed-item edit cannot unlock FWF',toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).arrived===4);
    setSupplied('WC09','FWF',{qty_supplied:target});S.stamps['supplied/WC09/FWF']=now;sharedCache975();
    let x=toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso());check(target+' later explicit receipt adds arrivals but not work',x.arrived===target&&x.done===4,x);
    const receipts=Supplier996.model().receipts.filter(r=>r.ref==='WC09'&&r.item==='FWF');check(target+' later receipt retains original day and only adds remainder today',receipts.some(r=>r.date==='2026-10-08'&&r.count===4)&&receipts.some(r=>r.date===todayIso()&&r.count===target-4),receipts);
    setLabour('WC09','Toilets & amenities','FWF','install',true);S.stamps['labour/WC09|Toilets & amenities|FWF|install']=now;sharedCache975();
    x=toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso());check(target+' later explicit work completes received units',x.arrived===target&&x.done===target&&x.complete,x);
   }
   reset();let start=JSON.stringify(S);saves=[];check('decrease below confirmed actual is rejected',setQty('WC09','3')===false&&JSON.stringify(S)===start&&saves.length===0);
   for(const invalid of ['-1','0','2.5','abc']){reset();start=JSON.stringify(S);saves=[];check('invalid '+invalid+' records nothing',setQty('WC09',invalid)===false&&JSON.stringify(S)===start&&saves.length===0);}
   reset();setQty('WC09','10');check('safe decrease keeps actuals',setQty('WC09','6')===true&&toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).arrived===4);
   check('reset to original quantity preserves completed original scope',setQty('WC09','')===true&&toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso()).complete);
   reset();delete S.delivery.WC09;delete S.supplied.WC09;S.labour={};sharedCache975();setQty('WC09','6');let r=toiletItem962(assetOf('WC09'),'FWF',deliveryOf('WC09'),todayIso());check('no receipt remains no receipt after planning edit',r.arrived===0&&r.done===0,r);
   check('unreceived offsite item can still change planned description',setItemType('WC09','Accessible Toilet')===true);
   reset();setSupplied('WC09','FWF',{qty_supplied:0});sharedCache975();setQty('WC09','6');const zeroRecord=JSON.stringify(S);check('renaming cannot bypass zero receipt beneath older onsite flag',setItemType('WC09','Accessible Toilet')===false&&JSON.stringify(S)===zeroRecord);
   reset();const ga=assetOf('P33'),beforeGeneric=arrivedChargeRows975(ga),gqty=qtyOf(chargeLines(ga)[0]);setQty('P33',String(gqty+1));const gr=toiletRows962(assetOf('P33'),deliveryOf('P33'),chargeLines(assetOf('P33')),todayIso());check('non-toilet quantity edit preserves received scope',gr.rows[0].arrived===gqty&&gr.rows[0].done===gqty,gr);check('non-toilet actual charges unchanged',actualCharges(arrivedChargeRows975(assetOf('P33')))===actualCharges(beforeGeneric));
  }finally{reset();Object.assign(window,funcs);}
  check('native record restored exactly',JSON.stringify(S)===originalJSON);check('rate cards and contract rows unchanged',rates===JSON.stringify([S.rates,S.lineRates,S.accRates,ONHIRE_ROWS]));check('service version unchanged',version===SYNC.backend.readVersion821());return {author:'Andrew Fisher',checks,cases,baseline,version};
 });
 result.errors=h.errors;result.requests=h.counts;result.checks.push({name:'zero errors or operational write attempts',pass:!h.errors.length&&!h.counts.blocked});fs.writeFileSync(process.env.OUT,JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks.length,failures:result.checks.filter(c=>!c.pass),version:result.version,errors:h.errors,requests:h.counts}));if(result.checks.some(c=>!c.pass))process.exitCode=1;
 }finally{if(h)await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
