/* Author: Andrew Fisher. Source-row customer forecasts; no operational or supplier-cost writes. */
(function(root){
'use strict';
const norm=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]/g,''),cents=v=>Math.round((v+Number.EPSILON)*100)/100;
const source={file:'Rate Card 2026 (1).xlsx',sheet:'Street Rate Card 2026',cells:'D34:E34,J34',sha256:'60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6',hire:90.06732000000001,install:36.435,demob:36.435,transport:{sheet:'Transport ',cell:'M23',eachWay:47.5}};
function contractMatches(row,request,ref){
 if(row.charge_line||norm(row.register_type)!=='fwf')return false;
 const match=row.match||{};
 if([match.key,match.task_id,row.supplierRequest996].includes(ref)||[match.key,match.task_id,row.supplierRequest996].includes(request.id))return true;
 // A named team FWF line may be linked before the operational reference exists.
 // Numbered Coates fleet or another WC location never supplies generic coverage.
 if(row.asset_no_is_plant_number||/\bWC\s*\d+\b/i.test(row.description||''))return false;
 const words=norm(row.description||row.what||'');
 return request.aliases.some(a=>words===a||words===a+'fwf'||words===a+'fwftoilet'||words===a+'toiletportablefreshwaterflush');
}
function project(inputs,contracts,readCharge,card){
 const rows=[],issues=[];
 const claims=new Map();
 for(const input of inputs){const key=input.resolution.state==='active'&&input.resolution.key;if(key){if(!claims.has(key))claims.set(key,new Set());claims.get(key).add(input.request.id);}}
 for(const input of inputs){
  const {request,resolution}=input;
  if(!['missing','active'].includes(resolution.state)){issues.push({request:request.id,state:resolution.state});continue;}
  // A merged native reference has one quantity. Without a source-row split,
  // neither request may claim that entire quantity a second time.
  if(resolution.key&&claims.get(resolution.key)?.size>1){issues.push({request:request.id,state:'shared native reference needs quantity allocation',ref:resolution.key});continue;}
  const quantity=input.quantity;
  if(!Number.isInteger(quantity)||quantity<0){issues.push({request:request.id,state:'quantity needs review'});continue;}
  const ref=resolution.key||request.id,covered=(contracts||[]).filter(r=>contractMatches(r,request,ref));
  const priced=covered.filter(r=>typeof readCharge(r)?.amount==='number'),coveredQuantity=covered.reduce((n,r)=>n+(Number.isInteger(r.quantity)&&r.quantity>0?r.quantity:0),0);
  // An exact contract line supersedes the estimate. An unpriced or incomplete
  // contract is a visible allocation gap, never a second assumed hire charge.
  const held=covered.length>0&&(priced.length!==covered.length||coveredQuantity<quantity);
  const rate=card?.hire_rate,valid=Number.isFinite(rate)&&rate>=0;
  rows.push({id:'hire996|'+request.id,sourceRequest:request.id,ref,name:request.name,item:request.item,quantity,branch:input.branch||null,branchBasis:input.branchBasis||'',state:held?'contract coverage needs review':covered.length?'covered':!valid?'card rate needs review':'forecast',rate:valid?rate:null,amount:covered.length||!valid?0:cents(quantity*rate),coverage:covered.map(r=>String(r.rental_contract)+'|'+r.line),supplierCostAdditional:0,ledger:'1010',source:request.source,rateSource:source,sourceOnly:resolution.state==='missing'});
 }
 return {rows,issues,amount:cents(rows.reduce((n,r)=>n+r.amount,0)),supplierCostAdditional:0};
}
const api={source,contractMatches,project};root.FinanceRequest996=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined')return;
function inputs(){
 return Supplier996.requests.map(request=>{
  let resolution=Supplier996.resolveRequest(request);const a=resolution.asset;
  const line=a&&chargeLines(a).find(l=>norm(l.item)==='fwf');
  if(a){const physical=gcModel925(a,{loading:false}).rows.filter(u=>u.physical&&norm(u.item)==='fwf');if(physical.some(u=>u.owner&&u.owner!=='unknown'&&u.owner!=='event-portables'))resolution={...resolution,state:'supplier ownership changed'};}
  const b=branchOf(a?a.key:request.id);
  return {request,resolution,quantity:a?(line?qtyOf(line):null):request.quantity,branch:b?.code||pl760ToiletBranch(),branchBasis:b?.basis||(b?.code?'Current native reference branch':'Toilet contract allocation; provisional source-row forecast')};
 });
}
function model(){return heldMemo('financeRequest996',()=>project(inputs(),ONHIRE_ROWS,contractCharge,cardRate('Toilets & amenities','FWF')));}
function assets(){
 const native=allAssets(),extra=[];
 for(const input of inputs())if(input.resolution.state==='missing'){
  const a=Supplier996.requestAsset(input.request.id);
  if(a)extra.push({...a,priceable:true,charge_lines:[{item:'FWF',discipline:'Toilets & amenities',quantity:input.quantity,quantity_state:'Schedule (7) Event Week row '+input.request.row,priceable:true}],_financialForecast996:true});
 }
 return native.concat(extra);
}
function contractRows(ref){const request=Supplier996.requests.find(r=>r.id===ref);return request?ONHIRE_ROWS.filter(r=>contractMatches(r,request,ref)):[];}
const nativeBranch=branchOf;
branchOf=function(key){const out=nativeBranch.apply(this,arguments);if(out?.code||!Supplier996.requests.some(r=>r.id===key))return out;const codes=[...new Set(contractRows(key).map(r=>r.branch_code).filter(Boolean))];return {code:codes.length===1?codes[0]:pl760ToiletBranch(),where:codes.length===1?'matched source contract':'source forecast',basis:codes.length===1?'Exact source request matched to the customer contract':'Same branch as the existing customer toilet contract; provisional source-row forecast'};};
Object.assign(api,{model,assets,contractRows});
// Keep the provenance available beside the forecast, folded by default.
const nativeCard=cj764Card;
cj764Card=function(){
 const html=nativeCard.apply(this,arguments),m=model();if(!m.rows.length&&!m.issues.length)return html;
 const row=r=>'<tr><td>'+esc(r.name)+'<br><small>'+esc(r.ref)+'</small></td><td>'+esc(r.branch||'Allocation pending')+'</td><td class="num">'+esc(String(r.quantity))+'</td><td class="num">'+esc(r.state==='covered'?'Contract':r.state==='forecast'?money(r.amount):'Review')+'</td></tr>';
 return html+'<details class="units925-edit" data-finance-request996><summary>Source-row hire forecast · '+m.rows.length+' requests</summary><div class="tblwrap"><table class="pl-tbl"><thead><tr><th>Location</th><th>Branch</th><th class="num">FWF</th><th class="num">Hire forecast</th></tr></thead><tbody>'+m.rows.map(row).join('')+'</tbody></table></div><p>Schedule (7), Event Week rows 49–50. Street Rate Card 2026 D34: Hire Rate 2026, once per item. Install and demob use the existing labour forecast; delivery and pickup use the existing transport forecast. Branch follows the matching reference or toilet contract allocation. No additional supplier cost.</p>'+m.issues.map(r=>'<p>'+esc(r.request+' · '+r.state)+'</p>').join('')+'</details>';
};
})(typeof window==='undefined'?globalThis:window);
