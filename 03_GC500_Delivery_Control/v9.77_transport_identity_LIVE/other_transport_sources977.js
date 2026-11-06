/* Author: Andrew Fisher. Existing-source identity only; no new rate, charge or record. */
function transportMachineKnown977(a,rentalRows,sourceRows){
 if(!a||a.key!=='T0085'||a._cancelled||a._movedTo||a._locationMoved||a.relocation||!Array.isArray(a.asset_numbers)||a.asset_numbers.map(String).join('|')!=='1272166')return false;
 const rows=[].concat(rentalRows||[],sourceRows||[]);
 const machine=rows.filter(r=>!r.charge_line&&r.rental_contract==='9987005'&&r.line===1&&r.asset_no==='1272166'&&r.asset_no_is_plant_number&&r.family==='forklift'&&r.quantity===1&&r.delivery_number==='26116726'&&r.description==='Supply Forklift 5.0t Diesel');
 const extension=rows.some(r=>!r.charge_line&&r.rental_contract==='9987005'&&r.line===2&&r.asset_no==='1262224'&&r.family==='forklift accessory'&&r.description==='Supply Telehandler Fork Extension 1800mm');
 return machine.length>0&&extension;
}
function transportContainerKnown977(a,rows){
 if(!a||a.key!=='T0258'||a._cancelled||a._movedTo||a._locationMoved||a.relocation||!Array.isArray(a.asset_numbers)||a.asset_numbers.map(String).join('|')!=='1134386')return false;
 const candidates=(rows||[]).filter(r=>!r.charge_line&&r.rental_contract==='9974042'&&r.line===1&&r.description==='Container 3.0M x 2.4M'&&r.quantity===1&&r.delivery_number==='26112749'&&r.match&&r.match.to==='unreferenced row'&&r.match.task_id==='T0258'&&r.match.via==='delivery docket');
 if(!candidates.length)return false;
 return (a.events||[]).some(e=>e.task_id==='T0258'&&String(e.dd||'').includes('26112749'));
}
function transportContainerOwners977(hire,buildings){
 if(!hire||hire.rental_contract!=='9974042'||hire.line!==1||hire.description!=='Container 3.0M x 2.4M'||hire.quantity!==1||hire.delivery_number!=='26112749'||!hire.match||hire.match.task_id!=='T0258'||hire.match.to!=='unreferenced row'||hire.match.via!=='delivery docket')return null;
 const a=typeof allAssets==='function'?allAssets().find(a=>a.key==='T0258'):null;if(!transportContainerKnown977(a,[hire]))return null;
 const owners=(buildings||[]).filter(b=>b.ref==='T0258'&&!b.exclusion&&b.quantity===1&&Array.isArray(b.numbers)&&b.numbers.map(String).join('|')==='1134386'&&Array.isArray(b.contracts)&&b.contracts.includes('9974042'));
 return owners.length===1?owners:null;
}
