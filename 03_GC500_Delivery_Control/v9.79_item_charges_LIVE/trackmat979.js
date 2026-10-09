/* Author: Andrew Fisher. Existing single-load customer charge; no new rate or Revenue. */
function trackmatDeliveryCoverage979(buildings,sources,assets){
 const eq=(r,e)=>r&&Object.keys(e).every(k=>r[k]===e[k]);
 const hires=(sources||[]).filter(r=>r.rental_contract==='9973079'&&!r.charge_line);
 const charges=(sources||[]).filter(r=>r.rental_contract==='9973079'&&r.line===2);
 const hire=hires[0],charge=charges[0];
 if(hires.length!==1||charges.length!==1||!eq(hire,{line:1,branch_code:'STPS',description:'Trakmat - 2.4M x 1.1M - TM4496',quantity:20,asset_no:'TRAKMAT2.4X1.1',asset_no_is_plant_number:false,delivery_number:'26072892',start_date:'2026-09-15',register_type:'Trakmat'})||!hire.match||!eq(hire.match,{to:'unreferenced row',task_id:'T0025',via:'date and kind'}))return null;
 if(!eq(charge,{charge_line:true,kind:'transport',branch_code:'STPS',description:'Delivery for HA Line Item(s) 1,2 15 Sep 2026',quantity:1,price:103.3,status_as_written:'Applied',delivery_number:'26072892'})||charge.return_number||charge.package_name||charge.hold_billing)return null;
 const aa=(assets||[]).filter(a=>a.key==='T0025');if(aa.length!==1)return null;
 const a=aa[0];if(a._cancelled||a._movedTo||a._locationMoved||a.relocation||a.rest_of||a.discipline!=='Ground protection'||!Array.isArray(a.asset_numbers)||a.asset_numbers.join('|')!=='TRAKMAT2.4X1.1')return null;
 const events=(a.events||[]).filter(e=>e.task_id==='T0025'&&e.date==='2026-09-15'&&e.item==='Trakmat'&&e.quantity_raw===20);if(events.length!==1)return null;
 const bs=(buildings||[]).filter(b=>b.ref==='T0025');if(bs.length!==1)return null;
 const b=bs[0],poa='Transport is POA; unit quantities do not establish a priced customer load';
 if(b.exclusion||b.included||b.item!=='Trakmat'||b.quantity!==20||b.branch!=='STPS'||!Array.isArray(b.contracts)||!b.contracts.includes('9973079')||b.rate!=null||!Array.isArray(b.holdReasons)||b.holdReasons.some(r=>r!==poa))return null;
 if((b.holdReasonsByLeg&&b.holdReasonsByLeg.delivery||[]).length)return null;
 const lineKey='reviewed979|9973079|2|T0025';
 b.lineKeys=[...new Set((b.lineKeys||[]).concat(lineKey))];
 b.holdReasons=b.holdReasons.filter(r=>r!==poa);
 b.holdReasonsByLeg=Object.assign({},b.holdReasonsByLeg,{pickup:[...new Set((b.holdReasonsByLeg&&b.holdReasonsByLeg.pickup||[]).concat(poa))]});
 return {id:'9973079|2',scope:'exact',contract:'9973079',branch:'STPS',ref:'T0025',candidateRefs:[],holdRefs:[],lineKeys:[lineKey],leg:'delivery',quantity:20,quantityBasis:'units',amount:103.3,reason:'',basis:'Contract 9973079 line 2 · existing $103.30 delivery load covers line 1, 20 Trakmats; line 2 in its HA list is the transport line itself'};
}
