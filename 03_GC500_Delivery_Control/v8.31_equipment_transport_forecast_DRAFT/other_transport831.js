/* Author: Andrew Fisher. Other-equipment transport forecast adapter.
   Current quantities and prices remain live-derived. Reviewed source bindings are
   private DATA, never operational writes or supplier-cost-to-Revenue conversion. */
function otherTransportInput831(){
  const cfg=DATA.transport_forecast831||{}, assets=allAssets(), sources=ONHIRE_ROWS||[];
  const list=x=>Array.isArray(x)?x:[], str=x=>x==null?'':String(x), uniq=x=>[...new Set(x.filter(Boolean).map(String))];
  const key=r=>str(r.rental_contract)+'|'+str(r.line), valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  const buildings=[],coverageOverrides=[],invalidBindings=[],uncertainLines={}, assetByRef=new Map(assets.map(a=>[a.key,a]));
  const isBuilding=s=>/^(Building\s+(3\.6|4\.8|6|9\.6|12)m|Ticket Box\s+(4\.8|6)m)$/i.test(str(s).trim());
  const currentCard=typeof RM!=='undefined'?RM:DATA.rate_match||{};
  const cardBound=cfg.schema===1&&cfg.card&&cfg.card.eachWay===true&&cfg.card.sha256===currentCard.rate_card_sha256;
  const sourceRows=a=>{const nums=list(a.asset_numbers).map(String);return sources.filter(r=>!r.charge_line&&((r.asset_no_is_plant_number&&nums.includes(str(r.asset_no)))||(r.match&&r.match.to==='asset'&&r.match.key===a.key)));};
  const itemRowsOf=(a,item,rs)=>rs.filter(r=>str(r.register_type).toLowerCase()===str(item).toLowerCase());
  const pendingTowerPlans=assets.some(a=>a.discipline==='Lighting towers'&&!a._cancelled&&!a.rest_of&&a.series_note&&!list(a.events).length);
  assets.forEach(a=>{
    const lines=chargeLines(a).filter(l=>!(a.discipline==='Portable buildings'&&isBuilding(l.item)));
    const allNums=uniq(list(a.asset_numbers)),rs=sourceRows(a),br=branchOf(a.key)||{},co=contractOf(a.key)||{},rental=rentalOf(a.key)||{};
    const rentalRows=list(rental.lines);
    lines.forEach(l=>{
      const item=l.item, rate=cardRate(l.discipline||a.discipline,item,a.key),transport=rate&&rate.transport;
      const typed=itemRowsOf(a,item,rs), nums=lines.length===1?allNums:allNums.filter(n=>typed.some(r=>r.asset_no_is_plant_number&&str(r.asset_no)===n));
      const contracts=uniq([].concat(co.ids||[],co.id?[co.id]:[],br.contracts||[],rs.map(r=>r.rental_contract),rentalRows.map(r=>r.rental_contract)));
      const holdReasons=[],holdReasonsByLeg={}, family=a.discipline==='Portable buildings'?'Containers':a.discipline;
      const ownRows=rs.concat(rentalRows).filter(r=>!r.charge_line&&str(r.register_type).toLowerCase()===str(item).toLowerCase());
      const own=ownRows.some(r=>{const t=contractTreatment747(r);return t&&t.kind==='own_use';});
      let charge=transport&&valid(transport.charge)?transport.charge:null;
      let basis='Current '+CARD_WORD+' card · '+str(transport&&transport.line||rate&&rate.line||item)+' · per unit, each way';
      const supplement=list(cfg.rateSupplements).find(r=>r.discipline===a.discipline&&r.item===item);
      if(supplement){if(cardBound&&valid(supplement.charge)){charge=supplement.charge;basis=supplement.source;}else holdReasons.push('Reviewed transport card supplement no longer matches the current source');}
      if(valid(charge)&&!cardBound)holdReasons.push('Current transport card revision and each-way authority need review');
      let exclusion=a._cancelled?'Cancelled reference':a.rest_of?'Follow-up / rest-of delivery':a.relocation?'Internal relocation is not another external delivery and pickup':own?'Coates own use':null;
      if(a.source_row&&assetByRef.has(a.source_row))exclusion='Alias of '+a.source_row+'; source equipment counted once';
      if(l.priceable===false)holdReasons.push('Asked quantity needs confirmation');
      if(a.discipline==='Lighting towers'&&!exclusion&&(!list(a.events).length||(a._plant&&pendingTowerPlans)))holdReasons.push('Plan tower positions and delivered batch need physical-unit allocation; do not count both as additional external trips');
      if(a.discipline==='Access & plant'&&rentalRows.some(r=>/\bextension\b/i.test(str(r.what||r.description))))holdReasons.push('Current number identifies fork extensions; requested machine and accessory allocation needs confirmation');
      if(a.discipline==='Access & plant'&&!allNums.length&&rentalRows.some(r=>r.subhired_machine))holdReasons.push('Hired-in machine movement must be distinguished from other contract transport packages');
      if(/waste\s*tank/i.test(item)){charge=null;holdReasons.push('Tank dimensions and paired block/tank movement scope need confirmation; included hire does not establish transport');}
      if(a.discipline==='Furniture')holdReasons.push('Building contents travel under the applicable inclusion; a separate furniture trip is not established');
      if(family==='Containers'&&!exclusion)holdReasons.push('Container contract movement coverage needs exact register allocation; do not add another allowance');
      if(a.discipline==='Water-filled barriers')holdReasons.push('No exact numeric transport card match; a bulk load or other barrier type is not a per-unit rate');
      if(['Variable message signs','Ground protection'].includes(a.discipline))holdReasons.push('Transport is POA; unit quantities do not establish a priced customer load');
      if(/^(Pee Panel|FWF Trailer)$/i.test(item))holdReasons.push('No exact customer transport card line for this type');
      const primary=lines.length===1?rs:typed;
      buildings.push({id:a.key+'|'+item,ref:a.key,item,quantity:qtyOf(l),numbers:nums,branch:br.code||'',contracts,lineKeys:uniq(primary.map(key)),aliases:[],rate:charge,rateSource:basis,family,exclusion,holdReasons,holdReasonsByLeg});
    });
  });
  const signature=(row,expected)=>row&&expected&&Object.keys(expected).every(k=>JSON.stringify(row[k]==null?null:row[k])===JSON.stringify(expected[k]==null?null:expected[k]));
  const addHold=(bs,leg,reason)=>bs.forEach(b=>{['delivery','pickup'].filter(l=>leg==='both'||!leg||l===leg).forEach(l=>{b.holdReasonsByLeg=b.holdReasonsByLeg||{};(b.holdReasonsByLeg[l]=b.holdReasonsByLeg[l]||[]).push(reason);});});
  list(cfg.coverage).forEach(binding=>{
    const row=sources.find(r=>key(r)===binding.id&&r.charge_line), targets=[],targetKeys=[];let bound=signature(row,binding.charge)&&list(binding.sourceChecks).every(check=>signature(sources.find(r=>key(r)===check.lineKey),check.source));
    list(binding.targets).forEach((t,index)=>{
      let bs=[];
      if(t.kind==='event'){
        const a=assetByRef.get(t.ref);bs=buildings.filter(b=>b.ref===t.ref&&b.item===t.item);
        if(!bs.length){bound=false;bs=buildings.filter(b=>b.ref===t.ref);}
        const matches=assets.filter(x=>list(x.events).some(e=>list(str(e.dd).match(/\d{7,}/g)).includes(str(t.docket))));
        const event=a&&list(a.events).find(e=>e.task_id===t.taskId&&e.source_range===t.range&&list(str(e.dd).match(/\d{7,}/g)).includes(str(t.docket)));
        if(!event||matches.length!==1||matches[0].key!==t.ref||bs.length!==1||!row||str(row.delivery_number)!==str(t.docket))bound=false;
      }else if(t.kind==='contract'){
        const hire=sources.find(r=>key(r)===t.lineKey&&!r.charge_line),id='contract|'+t.lineKey;
        if(!signature(hire,t.source)){bound=false;}
        if(hire){
          let b=buildings.find(b=>b.id===id);
          if(!b){
            const currentOwners=hire.asset_no_is_plant_number?buildings.filter(b=>!b.exclusion&&b.numbers.includes(str(hire.asset_no))):[];
            if(currentOwners.length===1){b=currentOwners[0];}
            else {b={id,ref:'Contract '+str(hire.rental_contract)+' line '+str(hire.line),item:hire.description||hire.what||hire.item,quantity:hire.quantity,numbers:hire.asset_no_is_plant_number?[str(hire.asset_no)]:[],branch:hire.branch_code||'',contracts:[str(hire.rental_contract)],lineKeys:[key(hire)],aliases:[],rate:null,rateSource:'Current contract transport coverage; no additional card allowance',family:t.family||'Contract equipment',exclusion:null,holdReasons:currentOwners.length?['Contract equipment is allocated to several current references']:[],holdReasonsByLeg:{}};buildings.push(b);}
          }
          bs=[b];
        }
      }else bound=false;
      if(!bs.length)bound=false;
      bs.forEach(b=>{
        const k='transport831|'+binding.id+'|'+index+'|'+b.id;
        b.lineKeys.push(k);targetKeys.push(k);targets.push(b);
      });
    });
    if(!bound)addHold(targets,binding.leg,'Reviewed transport source or movement allocation changed; reconfirm affected coverage');
    if(bound&&binding.holdRemaining)targets.forEach(b=>{if(b.quantity>row.quantity)addHold([b],binding.leg,'Existing transport description has unresolved remaining-unit scope; only the uncovered movement is held');});
    if(row&&bound)coverageOverrides.push({id:binding.id,scope:'exact',contract:str(row.rental_contract),branch:row.branch_code||'',ref:null,candidateRefs:[],lineKeys:targetKeys,leg:binding.leg,quantity:row.quantity,quantityBasis:binding.quantityBasis,amount:contractCharge(row).amount,reason:'',basis:str(row.description||row.what||row.item)+' · '+str(binding.basis||'reviewed exact source movement')});
    else if(row)invalidBindings.push({id:binding.id,row});
  });
  // A failed binding holds its old scope above. Re-read the current source scope
  // without private overrides so an edited target or direction is never erased.
  // This is classification only; the combined model consumes each charge once.
  if(invalidBindings.length){
    const currentDemand=buildingTransportInput831().buildings.concat(buildings);
    const fresh=transportCoverage831(currentDemand,sources,uncertainLines,[]);
    invalidBindings.forEach(change=>{
      const current=fresh.find(c=>c.id===change.id);if(!current)return;
      const row=change.row, docketFields=current.leg==='pickup'?['return_number','delivery_number']:current.leg==='delivery'?['delivery_number']:['delivery_number','return_number'];
      const dockets=uniq(docketFields.flatMap(k=>list(str(row[k]).match(/\d{7,}/g))));
      const docketRefs=uniq(assets.filter(a=>!a._cancelled&&!a.rest_of&&list(a.events).some(e=>list(str(e.dd).match(/\d{7,}/g)).some(d=>dockets.includes(d)))).map(a=>a.key));
      // An exact current reference or hire line remains authoritative evidence of
      // affected scope. A unique current docket can narrow an otherwise generic
      // family fallback; conflicting explicit targets are all retained for review.
      const words=str(row.description||row.what||row.item).toUpperCase().split(/[^A-Z0-9_-]+/);
      const namedRefs=uniq(currentDemand.filter(b=>!b.exclusion&&[b.ref].concat(list(b.aliases)).some(ref=>words.includes(str(ref).toUpperCase()))).map(b=>b.ref));
      const exactCurrent=!!current.ref||list(current.lineKeys).some(k=>currentDemand.some(b=>list(b.lineKeys).includes(k)));
      if(current.scope==='other'&&!docketRefs.length)return;
      const override={id:change.id,scope:'unallocated',reason:'Reviewed transport source changed; reconcile its current movement scope as well as the prior reviewed scope'};
      if(namedRefs.length||docketRefs.length===1)override.candidateRefs=uniq((exactCurrent?list(current.candidateRefs):[]).concat(namedRefs,docketRefs.length===1?docketRefs:[]));
      coverageOverrides.push(override);
    });
  }
  list(cfg.included).forEach((entry,i)=>buildings.push({id:'included|'+i,ref:entry.family,item:entry.item,quantity:null,numbers:[],branch:'',contracts:[],lineKeys:[],aliases:[],rate:null,rateSource:entry.source,family:entry.family,included:cardBound?entry.basis:null,holdReasons:cardBound?[]:['Reviewed inclusion no longer matches current rate-card source'],holdReasonsByLeg:{}}));
  list(cfg.heldScopes).forEach((entry,i)=>buildings.push({id:'scope|'+i,ref:entry.family,item:entry.item,quantity:null,numbers:[],branch:'',contracts:[],lineKeys:[],aliases:[],rate:null,rateSource:entry.source,family:entry.family,holdReasons:[entry.reason],holdReasonsByLeg:{}}));
  return {buildings,coverageOverrides,uncertainLines};
}
